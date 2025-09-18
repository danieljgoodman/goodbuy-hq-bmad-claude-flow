/**
 * Alert configuration and notification system for tier operations
 * Story 11.2: Subscription-Based Routing Middleware
 *
 * Features:
 * - Real-time alert triggers
 * - Multiple notification channels
 * - Alert severity levels
 * - Rate limiting and deduplication
 * - Alert escalation
 */

import { SubscriptionTier } from '@/types/subscription'
import { tierLogger, TierLogLevel } from '@/lib/logging/tier-logger'
import { tierMetrics } from '@/lib/monitoring/tier-metrics'

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Alert categories
 */
export enum AlertCategory {
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  ACCESS = 'access',
  BUSINESS = 'business',
  SYSTEM = 'system',
  TIER = 'tier'
}

/**
 * Alert notification channels
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  CONSOLE = 'console',
  LOG = 'log'
}

/**
 * Alert condition interface
 */
export interface AlertCondition {
  id: string
  name: string
  description: string
  category: AlertCategory
  severity: AlertSeverity
  enabled: boolean
  threshold: number
  timeWindow: number // ms
  checkInterval: number // ms
  channels: NotificationChannel[]
  escalationAfter?: number // ms
  maxOccurrences?: number // per time window
  condition: (metrics: any) => boolean
  metadata?: Record<string, any>
}

/**
 * Alert instance
 */
export interface Alert {
  id: string
  conditionId: string
  name: string
  description: string
  category: AlertCategory
  severity: AlertSeverity
  timestamp: Date
  value: number
  threshold: number
  metadata?: Record<string, any>
  resolved?: boolean
  resolvedAt?: Date
  acknowledgments: {
    userId: string
    timestamp: Date
    note?: string
  }[]
}

/**
 * Alert notification payload
 */
export interface AlertNotification {
  alert: Alert
  channel: NotificationChannel
  recipient?: string
  templateId?: string
  customMessage?: string
}

/**
 * Alert configuration
 */
interface AlertConfig {
  enabled: boolean
  checkInterval: number
  maxActiveAlerts: number
  retentionPeriod: number
  enableDeduplication: boolean
  deduplicationWindow: number
  enableEscalation: boolean
  defaultChannels: NotificationChannel[]
  rateLimitWindow: number
  rateLimitMax: number
}

/**
 * Default alert configuration
 */
const DEFAULT_ALERT_CONFIG: AlertConfig = {
  enabled: true,
  checkInterval: 30000, // 30 seconds
  maxActiveAlerts: 1000,
  retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
  enableDeduplication: true,
  deduplicationWindow: 300000, // 5 minutes
  enableEscalation: true,
  defaultChannels: [NotificationChannel.LOG],
  rateLimitWindow: 60000, // 1 minute
  rateLimitMax: 10
}

/**
 * Pre-defined alert conditions for tier operations
 */
export const TIER_ALERT_CONDITIONS: AlertCondition[] = [
  {
    id: 'high_execution_time',
    name: 'High Middleware Execution Time',
    description: 'Middleware execution time consistently above threshold',
    category: AlertCategory.PERFORMANCE,
    severity: AlertSeverity.WARNING,
    enabled: true,
    threshold: 100, // ms
    timeWindow: 300000, // 5 minutes
    checkInterval: 30000, // 30 seconds
    channels: [NotificationChannel.LOG, NotificationChannel.CONSOLE],
    maxOccurrences: 5,
    condition: (metrics) => {
      const recent = tierMetrics.getMetrics(undefined, new Date(Date.now() - 300000))
      const perfMetrics = recent.filter(m => m.category === 'performance')
      const highExecTimes = perfMetrics.filter(m => m.value > 100)
      return highExecTimes.length >= 5
    }
  },
  {
    id: 'low_cache_hit_rate',
    name: 'Low Cache Hit Rate',
    description: 'Cache hit rate below optimal threshold',
    category: AlertCategory.PERFORMANCE,
    severity: AlertSeverity.WARNING,
    enabled: true,
    threshold: 0.7, // 70%
    timeWindow: 600000, // 10 minutes
    checkInterval: 60000, // 1 minute
    channels: [NotificationChannel.LOG],
    condition: (metrics) => {
      const aggregated = tierMetrics.getAggregatedMetrics()
      return aggregated ? aggregated.performance.cacheHitRate < 0.7 : false
    }
  },
  {
    id: 'high_error_rate',
    name: 'High Error Rate',
    description: 'Error rate above acceptable threshold',
    category: AlertCategory.SYSTEM,
    severity: AlertSeverity.ERROR,
    enabled: true,
    threshold: 0.05, // 5%
    timeWindow: 300000, // 5 minutes
    checkInterval: 30000, // 30 seconds
    channels: [NotificationChannel.LOG, NotificationChannel.CONSOLE],
    escalationAfter: 900000, // 15 minutes
    condition: (metrics) => {
      const aggregated = tierMetrics.getAggregatedMetrics()
      return aggregated ? aggregated.performance.errorRate > 0.05 : false
    }
  },
  {
    id: 'security_threats',
    name: 'Security Threats Detected',
    description: 'Multiple security threats detected',
    category: AlertCategory.SECURITY,
    severity: AlertSeverity.CRITICAL,
    enabled: true,
    threshold: 5,
    timeWindow: 300000, // 5 minutes
    checkInterval: 60000, // 1 minute
    channels: [NotificationChannel.LOG, NotificationChannel.CONSOLE],
    escalationAfter: 300000, // 5 minutes
    condition: (metrics) => {
      const recent = tierMetrics.getMetrics(undefined, new Date(Date.now() - 300000))
      const securityMetrics = recent.filter(m => m.category === 'security')
      return securityMetrics.length >= 5
    }
  },
  {
    id: 'high_access_denial_rate',
    name: 'High Access Denial Rate',
    description: 'Too many access denials - possible configuration issue',
    category: AlertCategory.ACCESS,
    severity: AlertSeverity.WARNING,
    enabled: true,
    threshold: 0.3, // 30%
    timeWindow: 600000, // 10 minutes
    checkInterval: 60000, // 1 minute
    channels: [NotificationChannel.LOG],
    condition: (metrics) => {
      const aggregated = tierMetrics.getAggregatedMetrics()
      if (!aggregated) return false

      const totalRequests = aggregated.access.allowedRequests + aggregated.access.deniedRequests
      const denialRate = totalRequests > 0 ? aggregated.access.deniedRequests / totalRequests : 0
      return denialRate > 0.3
    }
  },
  {
    id: 'tier_service_down',
    name: 'Tier Detection Service Down',
    description: 'Tier detection service is not responding',
    category: AlertCategory.SYSTEM,
    severity: AlertSeverity.CRITICAL,
    enabled: true,
    threshold: 0.8, // 80% fallback rate
    timeWindow: 300000, // 5 minutes
    checkInterval: 30000, // 30 seconds
    channels: [NotificationChannel.LOG, NotificationChannel.CONSOLE],
    escalationAfter: 600000, // 10 minutes
    condition: (metrics) => {
      const recent = tierMetrics.getMetrics(undefined, new Date(Date.now() - 300000))
      const tierMetrics_filtered = recent.filter(m => m.tags?.tier_source === 'fallback')
      const totalTierDetections = recent.filter(m => m.category === 'tier_detection').length

      if (totalTierDetections === 0) return false

      const fallbackRate = tierMetrics_filtered.length / totalTierDetections
      return fallbackRate > 0.8
    }
  },
  {
    id: 'revenue_impact',
    name: 'Potential Revenue Impact',
    description: 'High number of professional/enterprise access denials',
    category: AlertCategory.BUSINESS,
    severity: AlertSeverity.WARNING,
    enabled: true,
    threshold: 10,
    timeWindow: 3600000, // 1 hour
    checkInterval: 300000, // 5 minutes
    channels: [NotificationChannel.LOG],
    condition: (metrics) => {
      const recent = tierMetrics.getMetrics(undefined, new Date(Date.now() - 3600000))
      const deniedProfessional = recent.filter(m =>
        m.category === 'access' &&
        m.tags?.allowed === 'false' &&
        ['PROFESSIONAL', 'ENTERPRISE'].includes(m.tags?.tier || '')
      )
      return deniedProfessional.length >= 10
    }
  }
]

/**
 * Alert manager class
 */
class TierAlertManager {
  private config: AlertConfig
  private conditions: Map<string, AlertCondition> = new Map()
  private activeAlerts: Map<string, Alert> = new Map()
  private notificationHistory: Map<string, Date[]> = new Map()
  private checkTimer?: NodeJS.Timeout

  constructor(config?: Partial<AlertConfig>) {
    this.config = { ...DEFAULT_ALERT_CONFIG, ...config }

    // Load default conditions
    TIER_ALERT_CONDITIONS.forEach(condition => {
      this.conditions.set(condition.id, condition)
    })

    if (this.config.enabled) {
      this.startChecking()
    }
  }

  /**
   * Add or update an alert condition
   */
  addCondition(condition: AlertCondition): void {
    this.conditions.set(condition.id, condition)
    tierLogger.logDebug(`Alert condition added: ${condition.name}`, { conditionId: condition.id })
  }

  /**
   * Remove an alert condition
   */
  removeCondition(conditionId: string): void {
    this.conditions.delete(conditionId)
    tierLogger.logDebug(`Alert condition removed: ${conditionId}`)
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved)
  }

  /**
   * Get alerts by category
   */
  getAlertsByCategory(category: AlertCategory): Alert[] {
    return this.getActiveAlerts().filter(alert => alert.category === category)
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return this.getActiveAlerts().filter(alert => alert.severity === severity)
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, userId: string, note?: string): void {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.acknowledgments.push({
        userId,
        timestamp: new Date(),
        note
      })

      tierLogger.logDebug(`Alert acknowledged: ${alert.name}`, {
        alertId,
        userId,
        note
      })
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, userId?: string): void {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = new Date()

      tierLogger.logDebug(`Alert resolved: ${alert.name}`, {
        alertId,
        userId,
        duration: Date.now() - alert.timestamp.getTime()
      })
    }
  }

  /**
   * Start checking alert conditions
   */
  private startChecking(): void {
    this.checkTimer = setInterval(() => {
      this.checkConditions().catch(error => {
        tierLogger.logError('Error checking alert conditions', error)
      })
    }, this.config.checkInterval)

    tierLogger.logDebug('Alert checking started', { interval: this.config.checkInterval })
  }

  /**
   * Check all alert conditions
   */
  private async checkConditions(): Promise<void> {
    const metrics = {
      tierMetrics: tierMetrics,
      aggregated: tierMetrics.getAggregatedMetrics(),
      recent: tierMetrics.getMetrics(undefined, new Date(Date.now() - 300000))
    }

    for (const [conditionId, condition] of this.conditions) {
      if (!condition.enabled) continue

      try {
        await this.checkCondition(condition, metrics)
      } catch (error) {
        tierLogger.logError(`Error checking condition ${conditionId}`, error, {
          conditionId,
          conditionName: condition.name
        })
      }
    }
  }

  /**
   * Check a single alert condition
   */
  private async checkCondition(condition: AlertCondition, metrics: any): Promise<void> {
    const triggered = condition.condition(metrics)

    if (triggered) {
      await this.handleTriggeredCondition(condition, metrics)
    } else {
      // Check if there's an active alert for this condition that should be resolved
      const existingAlert = Array.from(this.activeAlerts.values())
        .find(alert => alert.conditionId === condition.id && !alert.resolved)

      if (existingAlert) {
        this.resolveAlert(existingAlert.id, 'system')
      }
    }
  }

  /**
   * Handle a triggered alert condition
   */
  private async handleTriggeredCondition(condition: AlertCondition, metrics: any): Promise<void> {
    // Check for existing active alert
    const existingAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.conditionId === condition.id && !alert.resolved)

    if (existingAlert && this.config.enableDeduplication) {
      const timeSinceAlert = Date.now() - existingAlert.timestamp.getTime()
      if (timeSinceAlert < this.config.deduplicationWindow) {
        return // Skip duplicate alert
      }
    }

    // Rate limiting
    if (this.isRateLimited(condition.id)) {
      return
    }

    // Create new alert
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conditionId: condition.id,
      name: condition.name,
      description: condition.description,
      category: condition.category,
      severity: condition.severity,
      timestamp: new Date(),
      value: this.extractMetricValue(condition, metrics),
      threshold: condition.threshold,
      metadata: {
        ...condition.metadata,
        checkInterval: condition.checkInterval,
        timeWindow: condition.timeWindow
      },
      acknowledgments: []
    }

    this.activeAlerts.set(alert.id, alert)

    // Send notifications
    await this.sendNotifications(alert, condition.channels)

    // Log the alert
    tierLogger.logSecurityEvent(`Alert triggered: ${alert.name}`, {
      route: 'alert-system',
      threat: condition.category,
      action: 'alert_triggered',
      riskLevel: this.mapSeverityToRiskLevel(alert.severity)
    })

    // Update rate limiting
    this.updateRateLimit(condition.id)

    // Schedule escalation if configured
    if (condition.escalationAfter && this.config.enableEscalation) {
      setTimeout(() => {
        this.handleEscalation(alert, condition).catch(console.error)
      }, condition.escalationAfter)
    }
  }

  /**
   * Extract metric value from context
   */
  private extractMetricValue(condition: AlertCondition, metrics: any): number {
    try {
      // This is a simplified extraction - in practice, you'd want more sophisticated metric extraction
      if (condition.category === AlertCategory.PERFORMANCE && metrics.aggregated) {
        switch (condition.id) {
          case 'high_execution_time':
            return metrics.aggregated.performance.averageExecutionTime
          case 'low_cache_hit_rate':
            return metrics.aggregated.performance.cacheHitRate
          case 'high_error_rate':
            return metrics.aggregated.performance.errorRate
          default:
            return 0
        }
      }
      return condition.threshold + 1 // Indicate threshold exceeded
    } catch {
      return 0
    }
  }

  /**
   * Check if condition is rate limited
   */
  private isRateLimited(conditionId: string): boolean {
    const history = this.notificationHistory.get(conditionId) || []
    const cutoff = Date.now() - this.config.rateLimitWindow
    const recentNotifications = history.filter(timestamp => timestamp.getTime() > cutoff)

    return recentNotifications.length >= this.config.rateLimitMax
  }

  /**
   * Update rate limiting history
   */
  private updateRateLimit(conditionId: string): void {
    const history = this.notificationHistory.get(conditionId) || []
    history.push(new Date())

    // Keep only recent notifications
    const cutoff = Date.now() - this.config.rateLimitWindow
    const filteredHistory = history.filter(timestamp => timestamp.getTime() > cutoff)

    this.notificationHistory.set(conditionId, filteredHistory)
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: Alert, channels: NotificationChannel[]): Promise<void> {
    const notifications = channels.map(channel => ({
      alert,
      channel,
      templateId: `tier_alert_${alert.severity}`
    }))

    await Promise.allSettled(notifications.map(notification => this.sendNotification(notification)))
  }

  /**
   * Send a single notification
   */
  private async sendNotification(notification: AlertNotification): Promise<void> {
    const { alert, channel } = notification

    switch (channel) {
      case NotificationChannel.LOG:
        tierLogger.logger.log(
          this.mapSeverityToLogLevel(alert.severity),
          `🚨 ALERT: ${alert.name}`,
          {
            alertId: alert.id,
            category: alert.category,
            severity: alert.severity,
            description: alert.description,
            value: alert.value,
            threshold: alert.threshold,
            metadata: alert.metadata
          }
        )
        break

      case NotificationChannel.CONSOLE:
        const severityIcon = this.getSeverityIcon(alert.severity)
        console.warn(`${severityIcon} ALERT: ${alert.name}`)
        console.warn(`Category: ${alert.category} | Severity: ${alert.severity}`)
        console.warn(`Description: ${alert.description}`)
        console.warn(`Value: ${alert.value} | Threshold: ${alert.threshold}`)
        if (alert.metadata) {
          console.warn('Metadata:', alert.metadata)
        }
        break

      case NotificationChannel.EMAIL:
        await this.sendEmailNotification(notification)
        break

      case NotificationChannel.SLACK:
        await this.sendSlackNotification(notification)
        break

      case NotificationChannel.WEBHOOK:
        await this.sendWebhookNotification(notification)
        break
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: AlertNotification): Promise<void> {
    // Implementation would depend on your email service
    // Example: SendGrid, AWS SES, etc.
    console.log('📧 Email notification would be sent:', notification.alert.name)
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(notification: AlertNotification): Promise<void> {
    // Implementation would depend on your Slack integration
    console.log('💬 Slack notification would be sent:', notification.alert.name)
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(notification: AlertNotification): Promise<void> {
    // Implementation would send HTTP POST to configured webhooks
    console.log('🪝 Webhook notification would be sent:', notification.alert.name)
  }

  /**
   * Handle alert escalation
   */
  private async handleEscalation(alert: Alert, condition: AlertCondition): Promise<void> {
    if (alert.resolved || alert.acknowledgments.length > 0) {
      return // Alert already resolved or acknowledged
    }

    // Create escalated alert
    const escalatedAlert: Alert = {
      ...alert,
      id: `escalated_${alert.id}`,
      name: `ESCALATED: ${alert.name}`,
      severity: this.escalateSeverity(alert.severity),
      timestamp: new Date(),
      metadata: {
        ...alert.metadata,
        originalAlertId: alert.id,
        escalated: true
      }
    }

    this.activeAlerts.set(escalatedAlert.id, escalatedAlert)

    // Send escalated notifications (could use different channels)
    await this.sendNotifications(escalatedAlert, [NotificationChannel.CONSOLE, NotificationChannel.LOG])

    tierLogger.logSecurityEvent(`Alert escalated: ${escalatedAlert.name}`, {
      route: 'alert-system',
      threat: 'unresolved_alert',
      action: 'escalation',
      riskLevel: 'critical'
    })
  }

  /**
   * Map alert severity to log level
   */
  private mapSeverityToLogLevel(severity: AlertSeverity): TierLogLevel {
    switch (severity) {
      case AlertSeverity.INFO:
        return TierLogLevel.INFO
      case AlertSeverity.WARNING:
        return TierLogLevel.WARN
      case AlertSeverity.ERROR:
        return TierLogLevel.ERROR
      case AlertSeverity.CRITICAL:
        return TierLogLevel.ERROR
      default:
        return TierLogLevel.INFO
    }
  }

  /**
   * Map severity to risk level
   */
  private mapSeverityToRiskLevel(severity: AlertSeverity): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case AlertSeverity.INFO:
        return 'low'
      case AlertSeverity.WARNING:
        return 'medium'
      case AlertSeverity.ERROR:
        return 'high'
      case AlertSeverity.CRITICAL:
        return 'critical'
      default:
        return 'low'
    }
  }

  /**
   * Get severity icon for console output
   */
  private getSeverityIcon(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO:
        return 'ℹ️'
      case AlertSeverity.WARNING:
        return '⚠️'
      case AlertSeverity.ERROR:
        return '❌'
      case AlertSeverity.CRITICAL:
        return '🔥'
      default:
        return '🚨'
    }
  }

  /**
   * Escalate severity level
   */
  private escalateSeverity(severity: AlertSeverity): AlertSeverity {
    switch (severity) {
      case AlertSeverity.INFO:
        return AlertSeverity.WARNING
      case AlertSeverity.WARNING:
        return AlertSeverity.ERROR
      case AlertSeverity.ERROR:
        return AlertSeverity.CRITICAL
      case AlertSeverity.CRITICAL:
        return AlertSeverity.CRITICAL
      default:
        return AlertSeverity.CRITICAL
    }
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(): {
    total: number
    bySeverity: Record<AlertSeverity, number>
    byCategory: Record<AlertCategory, number>
    resolved: number
    acknowledged: number
  } {
    const alerts = Array.from(this.activeAlerts.values())

    const stats = {
      total: alerts.length,
      bySeverity: {} as Record<AlertSeverity, number>,
      byCategory: {} as Record<AlertCategory, number>,
      resolved: alerts.filter(a => a.resolved).length,
      acknowledged: alerts.filter(a => a.acknowledgments.length > 0).length
    }

    // Initialize counters
    Object.values(AlertSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0
    })
    Object.values(AlertCategory).forEach(category => {
      stats.byCategory[category] = 0
    })

    // Count alerts
    alerts.forEach(alert => {
      stats.bySeverity[alert.severity]++
      stats.byCategory[alert.category]++
    })

    return stats
  }

  /**
   * Cleanup old alerts and stop timers
   */
  destroy(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
    }

    // Clean up old alerts
    const cutoff = Date.now() - this.config.retentionPeriod
    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.timestamp.getTime() < cutoff) {
        this.activeAlerts.delete(alertId)
      }
    }

    tierLogger.logDebug('Alert manager destroyed')
  }
}

/**
 * Global alert manager instance
 */
export const tierAlerts = new TierAlertManager()

/**
 * Utility functions for alerts
 */
export const AlertUtils = {
  /**
   * Create custom alert condition
   */
  createCustomCondition(
    id: string,
    name: string,
    description: string,
    category: AlertCategory,
    severity: AlertSeverity,
    threshold: number,
    conditionFn: (metrics: any) => boolean,
    options?: Partial<AlertCondition>
  ): AlertCondition {
    return {
      id,
      name,
      description,
      category,
      severity,
      enabled: true,
      threshold,
      timeWindow: 300000, // 5 minutes
      checkInterval: 60000, // 1 minute
      channels: [NotificationChannel.LOG],
      condition: conditionFn,
      ...options
    }
  },

  /**
   * Get alerts summary for dashboard
   */
  getAlertsSummary() {
    const stats = tierAlerts.getAlertStatistics()
    const activeAlerts = tierAlerts.getActiveAlerts()
    const criticalAlerts = tierAlerts.getAlertsBySeverity(AlertSeverity.CRITICAL)

    return {
      totalActive: stats.total - stats.resolved,
      critical: stats.bySeverity[AlertSeverity.CRITICAL],
      warnings: stats.bySeverity[AlertSeverity.WARNING],
      errors: stats.bySeverity[AlertSeverity.ERROR],
      acknowledged: stats.acknowledged,
      recentAlerts: activeAlerts
        .filter(a => !a.resolved)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5),
      criticalAlerts: criticalAlerts.filter(a => !a.resolved),
      categories: stats.byCategory
    }
  },

  /**
   * Format alert for display
   */
  formatAlertForDisplay(alert: Alert) {
    return {
      id: alert.id,
      name: alert.name,
      severity: alert.severity,
      category: alert.category,
      timestamp: alert.timestamp.toISOString(),
      age: Date.now() - alert.timestamp.getTime(),
      acknowledged: alert.acknowledgments.length > 0,
      resolved: alert.resolved || false,
      description: alert.description,
      value: alert.value,
      threshold: alert.threshold,
      severityIcon: tierAlerts.getSeverityIcon ? '🚨' : '⚠️'
    }
  }
}

export default TierAlertManager