import {
  SecurityAlert,
  SecurityEventType,
  SecuritySeverity,
  AlertConfig,
  AlertChannel
} from '@/types/security';
import { createAuditLog } from '@/lib/audit/enterprise-audit-log';

interface EmailConfig {
  to: string[];
  cc?: string[];
  bcc?: string[];
  template?: string;
}

interface SlackConfig {
  webhookUrl: string;
  channel: string;
  username?: string;
  iconEmoji?: string;
}

interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  retries?: number;
  timeout?: number;
}

interface SMSConfig {
  provider: 'twilio' | 'aws-sns';
  numbers: string[];
  message?: string;
}

interface PagerDutyConfig {
  integrationKey: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  source?: string;
}

export class SecurityAlertManager {
  private static instance: SecurityAlertManager;
  private alerts: Map<string, SecurityAlert> = new Map();
  private alertConfigs: Map<string, AlertConfig> = new Map();
  private throttleCache: Map<string, { count: number; resetTime: Date }> = new Map();
  private aggregationCache: Map<string, SecurityAlert[]> = new Map();

  private constructor() {
    this.initializeDefaultConfigs();
    this.startBackgroundTasks();
  }

  public static getInstance(): SecurityAlertManager {
    if (!SecurityAlertManager.instance) {
      SecurityAlertManager.instance = new SecurityAlertManager();
    }
    return SecurityAlertManager.instance;
  }

  /**
   * Send security alert through configured channels
   */
  public async sendAlert(alertData: Omit<SecurityAlert, 'id'>): Promise<SecurityAlert> {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      ...alertData
    };

    this.alerts.set(alert.id, alert);

    // Find matching alert configurations
    const matchingConfigs = Array.from(this.alertConfigs.values())
      .filter(config => this.matchesAlertConfig(alert, config));

    // Process each matching configuration
    for (const config of matchingConfigs) {
      await this.processAlertConfig(alert, config);
    }

    // Log alert creation
    await createAuditLog({
      userId: 'system',
      action: 'SECURITY_ALERT_CREATED',
      entityType: 'SECURITY_ALERT',
      entityId: alert.id,
      metadata: {
        type: alert.type,
        severity: alert.severity,
        title: alert.title
      }
    });

    return alert;
  }

  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    await createAuditLog({
      userId: acknowledgedBy,
      action: 'SECURITY_ALERT_ACKNOWLEDGED',
      entityType: 'SECURITY_ALERT',
      entityId: alertId,
      metadata: { alertType: alert.type }
    });
  }

  /**
   * Resolve an alert
   */
  public async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.resolved = true;
    alert.resolvedBy = resolvedBy;
    alert.resolvedAt = new Date();

    await createAuditLog({
      userId: resolvedBy,
      action: 'SECURITY_ALERT_RESOLVED',
      entityType: 'SECURITY_ALERT',
      entityId: alertId,
      metadata: { alertType: alert.type }
    });
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): SecurityAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => {
        // Sort by severity first, then by timestamp
        const severityOrder = {
          [SecuritySeverity.CRITICAL]: 4,
          [SecuritySeverity.HIGH]: 3,
          [SecuritySeverity.MEDIUM]: 2,
          [SecuritySeverity.LOW]: 1
        };

        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;

        return b.timestamp.getTime() - a.timestamp.getTime();
      });
  }

  /**
   * Get recent alerts
   */
  public getRecentAlerts(limit: number = 50): SecurityAlert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Create or update alert configuration
   */
  public createAlertConfig(config: AlertConfig): void {
    this.alertConfigs.set(config.id, config);
  }

  /**
   * Get alert configuration
   */
  public getAlertConfig(id: string): AlertConfig | undefined {
    return this.alertConfigs.get(id);
  }

  /**
   * List all alert configurations
   */
  public listAlertConfigs(): AlertConfig[] {
    return Array.from(this.alertConfigs.values());
  }

  /**
   * Delete alert configuration
   */
  public deleteAlertConfig(id: string): boolean {
    return this.alertConfigs.delete(id);
  }

  private async processAlertConfig(alert: SecurityAlert, config: AlertConfig): Promise<void> {
    if (!config.enabled) return;

    // Check throttling
    if (config.throttle.enabled && this.isThrottled(config, alert)) {
      return;
    }

    // Handle aggregation
    if (config.aggregation.enabled) {
      this.aggregateAlert(config, alert);
      return;
    }

    // Send through all enabled channels
    const sendPromises = config.channels
      .filter(channel => channel.enabled)
      .map(channel => this.sendThroughChannel(alert, channel));

    await Promise.allSettled(sendPromises);

    // Update throttle cache
    if (config.throttle.enabled) {
      this.updateThrottleCache(config, alert);
    }
  }

  private async sendThroughChannel(alert: SecurityAlert, channel: AlertChannel): Promise<void> {
    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailAlert(alert, channel.config as EmailConfig);
          break;
        case 'slack':
          await this.sendSlackAlert(alert, channel.config as SlackConfig);
          break;
        case 'webhook':
          await this.sendWebhookAlert(alert, channel.config as WebhookConfig);
          break;
        case 'sms':
          await this.sendSMSAlert(alert, channel.config as SMSConfig);
          break;
        case 'pagerduty':
          await this.sendPagerDutyAlert(alert, channel.config as PagerDutyConfig);
          break;
        default:
          console.warn(`Unknown alert channel type: ${channel.type}`);
      }
    } catch (error) {
      console.error(`Failed to send alert through ${channel.type}:`, error);

      // Log the failure
      await createAuditLog({
        userId: 'system',
        action: 'ALERT_DELIVERY_FAILED',
        entityType: 'SECURITY_ALERT',
        entityId: alert.id,
        metadata: {
          channelType: channel.type,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  private async sendEmailAlert(alert: SecurityAlert, config: EmailConfig): Promise<void> {
    // TODO: Implement email sending logic
    // This would typically use a service like SendGrid, AWS SES, or similar

    const emailData = {
      to: config.to,
      cc: config.cc,
      bcc: config.bcc,
      subject: `[SECURITY ALERT] ${alert.title}`,
      html: this.generateEmailHTML(alert),
      text: this.generateEmailText(alert)
    };

    console.log('Sending email alert:', emailData);

    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendSlackAlert(alert: SecurityAlert, config: SlackConfig): Promise<void> {
    const payload = {
      channel: config.channel,
      username: config.username || 'Security Alert Bot',
      icon_emoji: config.iconEmoji || ':warning:',
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        title: alert.title,
        text: alert.message,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Event Type',
            value: alert.type,
            short: true
          },
          {
            title: 'Timestamp',
            value: alert.timestamp.toISOString(),
            short: false
          }
        ],
        footer: 'Security Monitoring System',
        ts: Math.floor(alert.timestamp.getTime() / 1000)
      }]
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  private async sendWebhookAlert(alert: SecurityAlert, config: WebhookConfig): Promise<void> {
    const payload = {
      alert,
      timestamp: new Date().toISOString(),
      source: 'security-monitoring'
    };

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'SecurityAlertManager/1.0',
      ...config.headers
    };

    const maxRetries = config.retries || 3;
    const timeout = config.timeout || 5000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(config.url, {
          method: config.method,
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return; // Success
        }

        if (attempt === maxRetries) {
          throw new Error(`Webhook failed after ${maxRetries} attempts: ${response.status} ${response.statusText}`);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  private async sendSMSAlert(alert: SecurityAlert, config: SMSConfig): Promise<void> {
    // TODO: Implement SMS sending logic based on provider
    const message = config.message || `Security Alert: ${alert.title} - Severity: ${alert.severity}`;

    console.log(`Sending SMS alert to ${config.numbers.length} numbers:`, message);

    // Simulate sending SMS
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendPagerDutyAlert(alert: SecurityAlert, config: PagerDutyConfig): Promise<void> {
    const payload = {
      routing_key: config.integrationKey,
      event_action: 'trigger',
      payload: {
        summary: alert.title,
        source: config.source || 'security-monitoring',
        severity: config.severity || this.mapSeverityToPagerDuty(alert.severity),
        timestamp: alert.timestamp.toISOString(),
        custom_details: {
          event_type: alert.type,
          message: alert.message,
          metadata: alert.metadata
        }
      }
    };

    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`PagerDuty alert failed: ${response.status} ${response.statusText}`);
    }
  }

  private matchesAlertConfig(alert: SecurityAlert, config: AlertConfig): boolean {
    // Check if event type matches
    if (config.eventTypes.length > 0 && !config.eventTypes.includes(alert.type)) {
      return false;
    }

    // Check if severity meets threshold
    const severityLevels = {
      [SecuritySeverity.LOW]: 1,
      [SecuritySeverity.MEDIUM]: 2,
      [SecuritySeverity.HIGH]: 3,
      [SecuritySeverity.CRITICAL]: 4
    };

    return severityLevels[alert.severity] >= severityLevels[config.severityThreshold];
  }

  private isThrottled(config: AlertConfig, alert: SecurityAlert): boolean {
    const key = `${config.id}_${alert.type}`;
    const cached = this.throttleCache.get(key);

    if (!cached) return false;

    if (new Date() > cached.resetTime) {
      this.throttleCache.delete(key);
      return false;
    }

    return cached.count >= config.throttle.maxAlerts;
  }

  private updateThrottleCache(config: AlertConfig, alert: SecurityAlert): void {
    const key = `${config.id}_${alert.type}`;
    const cached = this.throttleCache.get(key);
    const resetTime = new Date(Date.now() + config.throttle.timeWindow * 60 * 1000);

    if (!cached || new Date() > cached.resetTime) {
      this.throttleCache.set(key, { count: 1, resetTime });
    } else {
      cached.count++;
    }
  }

  private aggregateAlert(config: AlertConfig, alert: SecurityAlert): void {
    const key = `${config.id}_${alert.type}`;
    const cached = this.aggregationCache.get(key) || [];

    cached.push(alert);
    this.aggregationCache.set(key, cached);

    // Set timer to send aggregated alert
    setTimeout(() => {
      this.sendAggregatedAlert(config, key);
    }, config.aggregation.timeWindow * 60 * 1000);
  }

  private async sendAggregatedAlert(config: AlertConfig, key: string): Promise<void> {
    const alerts = this.aggregationCache.get(key);
    if (!alerts || alerts.length === 0) return;

    // Create aggregated alert
    const aggregatedAlert: SecurityAlert = {
      id: this.generateAlertId(),
      eventId: 'aggregated',
      type: alerts[0].type,
      severity: this.getHighestSeverity(alerts),
      title: `${alerts.length} ${alerts[0].type} events`,
      message: `Aggregated ${alerts.length} security events of type ${alerts[0].type}`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      metadata: {
        aggregated: true,
        eventCount: alerts.length,
        events: alerts.map(a => a.id)
      }
    };

    // Send through all channels
    const sendPromises = config.channels
      .filter(channel => channel.enabled)
      .map(channel => this.sendThroughChannel(aggregatedAlert, channel));

    await Promise.allSettled(sendPromises);

    // Clear cache
    this.aggregationCache.delete(key);
  }

  private getHighestSeverity(alerts: SecurityAlert[]): SecuritySeverity {
    const severityLevels = {
      [SecuritySeverity.LOW]: 1,
      [SecuritySeverity.MEDIUM]: 2,
      [SecuritySeverity.HIGH]: 3,
      [SecuritySeverity.CRITICAL]: 4
    };

    let highest = SecuritySeverity.LOW;
    let highestLevel = 0;

    for (const alert of alerts) {
      const level = severityLevels[alert.severity];
      if (level > highestLevel) {
        highest = alert.severity;
        highestLevel = level;
      }
    }

    return highest;
  }

  private getSeverityColor(severity: SecuritySeverity): string {
    switch (severity) {
      case SecuritySeverity.CRITICAL: return 'danger';
      case SecuritySeverity.HIGH: return 'warning';
      case SecuritySeverity.MEDIUM: return 'good';
      case SecuritySeverity.LOW: return '#36a64f';
      default: return '#cccccc';
    }
  }

  private mapSeverityToPagerDuty(severity: SecuritySeverity): string {
    switch (severity) {
      case SecuritySeverity.CRITICAL: return 'critical';
      case SecuritySeverity.HIGH: return 'error';
      case SecuritySeverity.MEDIUM: return 'warning';
      case SecuritySeverity.LOW: return 'info';
      default: return 'info';
    }
  }

  private generateEmailHTML(alert: SecurityAlert): string {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .alert-header { background-color: ${this.getSeverityBackgroundColor(alert.severity)}; color: white; padding: 15px; border-radius: 5px; }
            .alert-content { padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 10px; }
            .severity-${alert.severity} { border-left: 5px solid ${this.getSeverityBorderColor(alert.severity)}; }
            .metadata { background-color: #f5f5f5; padding: 10px; border-radius: 3px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="alert-header">
            <h2>🚨 Security Alert</h2>
          </div>
          <div class="alert-content severity-${alert.severity}">
            <h3>${alert.title}</h3>
            <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
            <p><strong>Event Type:</strong> ${alert.type}</p>
            <p><strong>Timestamp:</strong> ${alert.timestamp.toLocaleString()}</p>
            <p><strong>Message:</strong> ${alert.message}</p>

            ${Object.keys(alert.metadata).length > 0 ? `
              <div class="metadata">
                <h4>Additional Details:</h4>
                <pre>${JSON.stringify(alert.metadata, null, 2)}</pre>
              </div>
            ` : ''}
          </div>
        </body>
      </html>
    `;
  }

  private generateEmailText(alert: SecurityAlert): string {
    return `
Security Alert: ${alert.title}

Severity: ${alert.severity.toUpperCase()}
Event Type: ${alert.type}
Timestamp: ${alert.timestamp.toLocaleString()}

Message: ${alert.message}

${Object.keys(alert.metadata).length > 0 ? `
Additional Details:
${JSON.stringify(alert.metadata, null, 2)}
` : ''}

This is an automated security alert from the monitoring system.
    `.trim();
  }

  private getSeverityBackgroundColor(severity: SecuritySeverity): string {
    switch (severity) {
      case SecuritySeverity.CRITICAL: return '#dc3545';
      case SecuritySeverity.HIGH: return '#fd7e14';
      case SecuritySeverity.MEDIUM: return '#ffc107';
      case SecuritySeverity.LOW: return '#28a745';
      default: return '#6c757d';
    }
  }

  private getSeverityBorderColor(severity: SecuritySeverity): string {
    return this.getSeverityBackgroundColor(severity);
  }

  private initializeDefaultConfigs(): void {
    // Critical alerts configuration
    this.createAlertConfig({
      id: 'critical_alerts',
      name: 'Critical Security Alerts',
      eventTypes: [
        SecurityEventType.TIER_BYPASS_ATTEMPT,
        SecurityEventType.PRIVILEGE_ESCALATION,
        SecurityEventType.DATA_EXFILTRATION,
        SecurityEventType.SESSION_HIJACKING
      ],
      severityThreshold: SecuritySeverity.CRITICAL,
      channels: [
        {
          type: 'email',
          enabled: true,
          config: {
            to: ['security@company.com', 'admin@company.com']
          }
        },
        {
          type: 'slack',
          enabled: false, // Disabled by default - requires configuration
          config: {
            webhookUrl: '',
            channel: '#security-alerts'
          }
        }
      ],
      enabled: true,
      throttle: {
        enabled: false,
        maxAlerts: 0,
        timeWindow: 0
      },
      aggregation: {
        enabled: false,
        groupBy: [],
        timeWindow: 0
      }
    });

    // High severity alerts configuration
    this.createAlertConfig({
      id: 'high_severity_alerts',
      name: 'High Severity Security Alerts',
      eventTypes: Object.values(SecurityEventType),
      severityThreshold: SecuritySeverity.HIGH,
      channels: [
        {
          type: 'email',
          enabled: true,
          config: {
            to: ['security@company.com']
          }
        }
      ],
      enabled: true,
      throttle: {
        enabled: true,
        maxAlerts: 5,
        timeWindow: 60 // 1 hour
      },
      aggregation: {
        enabled: true,
        groupBy: ['type'],
        timeWindow: 15 // 15 minutes
      }
    });
  }

  private startBackgroundTasks(): void {
    // Clean up old alerts every 24 hours
    setInterval(() => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      for (const [id, alert] of this.alerts.entries()) {
        if (alert.timestamp < thirtyDaysAgo && alert.resolved) {
          this.alerts.delete(id);
        }
      }
    }, 24 * 60 * 60 * 1000);

    // Clean up throttle cache every hour
    setInterval(() => {
      const now = new Date();
      for (const [key, cached] of this.throttleCache.entries()) {
        if (now > cached.resetTime) {
          this.throttleCache.delete(key);
        }
      }
    }, 60 * 60 * 1000);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}