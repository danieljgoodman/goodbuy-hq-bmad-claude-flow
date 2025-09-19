import {
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
  SecurityPattern,
  SecurityMetrics,
  GeoAnomalyPattern,
  RateLimitViolation,
  TierBypassAttempt,
  ThreatIntelligence,
  SecurityIncident,
  IncidentImpact,
  IncidentResponse
} from '@/types/security';
import { createAuditLog } from '@/lib/audit/enterprise-audit-log';
import { SecurityAlertManager } from './alerts';

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private events: Map<string, SecurityEvent> = new Map();
  private patterns: Map<string, SecurityPattern> = new Map();
  private rateLimitViolations: Map<string, RateLimitViolation> = new Map();
  private geoPatterns: Map<string, GeoAnomalyPattern> = new Map();
  private threatIntel: Map<string, ThreatIntelligence> = new Map();
  private alertManager: SecurityAlertManager;
  private blockedIPs: Set<string> = new Set();
  private suspendedUsers: Set<string> = new Set();

  private constructor() {
    this.alertManager = SecurityAlertManager.getInstance();
    this.initializeDefaultPatterns();
    this.startBackgroundTasks();
  }

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Record a security event and trigger pattern analysis
   */
  public async recordEvent(eventData: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<SecurityEvent> {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      resolved: false,
      ...eventData
    };

    this.events.set(event.id, event);

    // Log to audit system
    await createAuditLog({
      userId: event.userId || 'system',
      action: 'SECURITY_EVENT',
      entityType: 'SECURITY',
      entityId: event.id,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      metadata: {
        eventType: event.type,
        severity: event.severity,
        details: event.details
      }
    });

    // Analyze patterns
    await this.analyzePatterns(event);

    // Update metrics
    this.updateMetrics();

    return event;
  }

  /**
   * Detect rate limit violations
   */
  public async detectRateLimitViolation(
    identifier: string,
    endpoint: string,
    currentRate: number,
    allowedRate: number,
    windowSize: number,
    userId?: string,
    ipAddress?: string
  ): Promise<void> {
    const key = `${identifier}_${endpoint}`;
    const existing = this.rateLimitViolations.get(key);

    if (existing) {
      existing.violationCount++;
      existing.lastViolation = new Date();
      existing.currentRate = currentRate;
    } else {
      this.rateLimitViolations.set(key, {
        userId,
        ipAddress: ipAddress || 'unknown',
        endpoint,
        currentRate,
        allowedRate,
        windowSize,
        violationCount: 1,
        firstViolation: new Date(),
        lastViolation: new Date()
      });
    }

    // Record security event
    await this.recordEvent({
      type: SecurityEventType.RATE_LIMIT_VIOLATION,
      severity: currentRate > allowedRate * 2 ? SecuritySeverity.HIGH : SecuritySeverity.MEDIUM,
      userId,
      ipAddress: ipAddress || 'unknown',
      details: {
        endpoint,
        currentRate,
        allowedRate,
        windowSize,
        violationCount: existing ? existing.violationCount : 1
      }
    });
  }

  /**
   * Detect tier bypass attempts
   */
  public async detectTierBypassAttempt(
    userId: string,
    currentTier: string,
    attemptedTier: string,
    feature: string,
    method: TierBypassAttempt['method'],
    ipAddress: string,
    userAgent?: string
  ): Promise<void> {
    const attempt: TierBypassAttempt = {
      userId,
      currentTier,
      attemptedTier,
      feature,
      method,
      timestamp: new Date(),
      blocked: true
    };

    // Record security event
    await this.recordEvent({
      type: SecurityEventType.TIER_BYPASS_ATTEMPT,
      severity: SecuritySeverity.HIGH,
      userId,
      ipAddress,
      userAgent,
      details: attempt
    });

    // Escalate if multiple attempts
    const recentAttempts = Array.from(this.events.values())
      .filter(e =>
        e.type === SecurityEventType.TIER_BYPASS_ATTEMPT &&
        e.userId === userId &&
        e.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
      ).length;

    if (recentAttempts >= 3) {
      await this.escalateIncident(userId, 'Multiple tier bypass attempts detected');
    }
  }

  /**
   * Detect geographic anomalies
   */
  public async detectGeographicAnomaly(
    userId: string,
    currentLocation: { country: string; region: string; city: string; latitude?: number; longitude?: number },
    ipAddress: string,
    userAgent?: string
  ): Promise<void> {
    const pattern = this.geoPatterns.get(userId);

    if (!pattern) {
      // First time seeing this user, create pattern
      this.geoPatterns.set(userId, {
        userId,
        usualLocations: [{
          country: currentLocation.country,
          region: currentLocation.region,
          city: currentLocation.city,
          confidence: 1.0
        }],
        lastKnownLocation: {
          country: currentLocation.country,
          region: currentLocation.region,
          city: currentLocation.city,
          timestamp: new Date()
        },
        travelTimeThreshold: 4 // 4 hours minimum travel time
      });
      return;
    }

    // Check if location is unusual
    const isUsualLocation = pattern.usualLocations.some(loc =>
      loc.country === currentLocation.country &&
      loc.region === currentLocation.region
    );

    if (!isUsualLocation) {
      // Calculate travel time from last known location
      const timeDiff = (new Date().getTime() - pattern.lastKnownLocation.timestamp.getTime()) / (1000 * 60 * 60);
      const distance = this.calculateDistance(
        pattern.lastKnownLocation.latitude || 0,
        pattern.lastKnownLocation.longitude || 0,
        currentLocation.latitude || 0,
        currentLocation.longitude || 0
      );

      // Assume minimum 500 km/h travel speed (commercial flight)
      const minimumTravelTime = distance / 500;

      if (timeDiff < minimumTravelTime && timeDiff < pattern.travelTimeThreshold) {
        await this.recordEvent({
          type: SecurityEventType.GEOGRAPHIC_ANOMALY,
          severity: SecuritySeverity.MEDIUM,
          userId,
          ipAddress,
          userAgent,
          geolocation: currentLocation,
          details: {
            lastKnownLocation: pattern.lastKnownLocation,
            currentLocation,
            timeDifference: timeDiff,
            minimumTravelTime,
            distance
          }
        });
      }
    }

    // Update pattern
    pattern.lastKnownLocation = {
      country: currentLocation.country,
      region: currentLocation.region,
      city: currentLocation.city,
      timestamp: new Date()
    };
  }

  /**
   * Detect unusual access patterns
   */
  public async detectUnusualAccessPattern(
    userId: string,
    ipAddress: string,
    userAgent: string,
    accessedFeatures: string[]
  ): Promise<void> {
    const recentEvents = Array.from(this.events.values())
      .filter(e =>
        e.userId === userId &&
        e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      );

    // Check for rapid successive logins from different IPs
    const loginIPs = recentEvents
      .filter(e => e.type === SecurityEventType.SUSPICIOUS_LOGIN)
      .map(e => e.ipAddress);

    const uniqueIPs = new Set(loginIPs);
    if (uniqueIPs.size > 5) { // More than 5 different IPs in 24 hours
      await this.recordEvent({
        type: SecurityEventType.UNUSUAL_ACCESS_PATTERN,
        severity: SecuritySeverity.HIGH,
        userId,
        ipAddress,
        userAgent,
        details: {
          pattern: 'multiple_ip_access',
          uniqueIPs: Array.from(uniqueIPs),
          timeWindow: '24h',
          accessedFeatures
        }
      });
    }

    // Check for unusual time patterns (access outside normal hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) { // Between 10 PM and 6 AM
      const nightAccess = recentEvents.filter(e => {
        const eventHour = e.timestamp.getHours();
        return eventHour < 6 || eventHour > 22;
      }).length;

      if (nightAccess > 3) {
        await this.recordEvent({
          type: SecurityEventType.UNUSUAL_ACCESS_PATTERN,
          severity: SecuritySeverity.MEDIUM,
          userId,
          ipAddress,
          userAgent,
          details: {
            pattern: 'unusual_time_access',
            nightAccessCount: nightAccess,
            currentHour: hour,
            accessedFeatures
          }
        });
      }
    }
  }

  /**
   * Block IP address
   */
  public blockIP(ipAddress: string, reason: string): void {
    this.blockedIPs.add(ipAddress);
    this.updateThreatIntel(ipAddress, 'high', [reason]);
  }

  /**
   * Suspend user
   */
  public async suspendUser(userId: string, reason: string): Promise<void> {
    this.suspendedUsers.add(userId);

    await createAuditLog({
      userId: 'system',
      action: 'USER_SUSPENDED',
      entityType: 'USER',
      entityId: userId,
      metadata: { reason }
    });
  }

  /**
   * Check if IP is blocked
   */
  public isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  /**
   * Check if user is suspended
   */
  public isUserSuspended(userId: string): boolean {
    return this.suspendedUsers.has(userId);
  }

  /**
   * Get security metrics
   */
  public getMetrics(): SecurityMetrics {
    const events = Array.from(this.events.values());
    const last24h = events.filter(e => e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000));

    const eventsByType: Record<SecurityEventType, number> = {} as any;
    const eventsBySeverity: Record<SecuritySeverity, number> = {} as any;

    Object.values(SecurityEventType).forEach(type => {
      eventsByType[type] = events.filter(e => e.type === type).length;
    });

    Object.values(SecuritySeverity).forEach(severity => {
      eventsBySeverity[severity] = events.filter(e => e.severity === severity).length;
    });

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      activeThreats: last24h.filter(e => !e.resolved).length,
      blockedIPs: this.blockedIPs.size,
      suspendedUsers: this.suspendedUsers.size,
      lastUpdated: new Date(),
      trends: {
        hourly: this.generateHourlyTrends(),
        daily: this.generateDailyTrends(),
        weekly: this.generateWeeklyTrends()
      }
    };
  }

  /**
   * Get recent events
   */
  public getRecentEvents(limit: number = 50): SecurityEvent[] {
    return Array.from(this.events.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Resolve security event
   */
  public async resolveEvent(eventId: string, resolvedBy: string): Promise<void> {
    const event = this.events.get(eventId);
    if (event) {
      event.resolved = true;
      event.resolvedAt = new Date();
      event.resolvedBy = resolvedBy;

      await createAuditLog({
        userId: resolvedBy,
        action: 'SECURITY_EVENT_RESOLVED',
        entityType: 'SECURITY',
        entityId: eventId,
        metadata: { eventType: event.type }
      });
    }
  }

  private async analyzePatterns(event: SecurityEvent): Promise<void> {
    for (const pattern of this.patterns.values()) {
      if (pattern.enabled && this.matchesPattern(event, pattern)) {
        await this.triggerPattern(pattern, event);
      }
    }
  }

  private matchesPattern(event: SecurityEvent, pattern: SecurityPattern): boolean {
    if (pattern.type !== event.type) return false;

    return pattern.conditions.every(condition => {
      const value = this.getEventFieldValue(event, condition.field);
      return this.evaluateCondition(value, condition.operator, condition.value);
    });
  }

  private async triggerPattern(pattern: SecurityPattern, event: SecurityEvent): Promise<void> {
    // Check if threshold is met within time window
    const windowStart = new Date(Date.now() - pattern.timeWindow * 60 * 1000);
    const matchingEvents = Array.from(this.events.values())
      .filter(e =>
        e.type === pattern.type &&
        e.timestamp > windowStart &&
        this.matchesPattern(e, pattern)
      );

    if (matchingEvents.length >= pattern.threshold) {
      // Execute actions
      for (const action of pattern.actions) {
        await this.executeAction(action, event, matchingEvents);
      }
    }
  }

  private async executeAction(action: any, event: SecurityEvent, relatedEvents: SecurityEvent[]): Promise<void> {
    switch (action.type) {
      case 'alert':
        await this.alertManager.sendAlert({
          eventId: event.id,
          type: event.type,
          severity: event.severity,
          title: `Security Alert: ${event.type}`,
          message: action.config.message || `${relatedEvents.length} ${event.type} events detected`,
          timestamp: new Date(),
          acknowledged: false,
          resolved: false,
          metadata: { relatedEvents: relatedEvents.map(e => e.id) }
        });
        break;

      case 'block_ip':
        if (event.ipAddress) {
          this.blockIP(event.ipAddress, `Pattern triggered: ${action.config.reason}`);
        }
        break;

      case 'suspend_user':
        if (event.userId) {
          await this.suspendUser(event.userId, `Pattern triggered: ${action.config.reason}`);
        }
        break;

      case 'webhook':
        // TODO: Implement webhook calls
        break;
    }
  }

  private async escalateIncident(userId: string, reason: string): Promise<void> {
    const relatedEvents = Array.from(this.events.values())
      .filter(e => e.userId === userId && !e.resolved);

    const incident: SecurityIncident = {
      id: this.generateIncidentId(),
      title: `Security Incident: ${reason}`,
      description: `Automated escalation for user ${userId}`,
      severity: SecuritySeverity.HIGH,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
      events: relatedEvents,
      alerts: [],
      timeline: [{
        id: this.generateTimelineId(),
        timestamp: new Date(),
        actor: 'system',
        action: 'incident_created',
        details: reason
      }],
      impact: {
        usersAffected: 1,
        servicesAffected: [],
        dataCompromised: false,
        businessImpact: 'medium'
      },
      response: {
        containmentActions: [],
        mitigationActions: [],
        recoveryActions: [],
        preventionActions: []
      }
    };

    // Auto-suspend user for high-severity incidents
    await this.suspendUser(userId, reason);
  }

  private initializeDefaultPatterns(): void {
    // Rate limit violation pattern
    this.patterns.set('rate_limit_pattern', {
      id: 'rate_limit_pattern',
      name: 'Rate Limit Violations',
      type: SecurityEventType.RATE_LIMIT_VIOLATION,
      conditions: [],
      threshold: 5,
      timeWindow: 5, // 5 minutes
      severity: SecuritySeverity.MEDIUM,
      enabled: true,
      actions: [
        { type: 'alert', config: { message: 'Multiple rate limit violations detected' } },
        { type: 'block_ip', config: { reason: 'Excessive rate limit violations' } }
      ]
    });

    // Tier bypass pattern
    this.patterns.set('tier_bypass_pattern', {
      id: 'tier_bypass_pattern',
      name: 'Tier Bypass Attempts',
      type: SecurityEventType.TIER_BYPASS_ATTEMPT,
      conditions: [],
      threshold: 3,
      timeWindow: 60, // 1 hour
      severity: SecuritySeverity.HIGH,
      enabled: true,
      actions: [
        { type: 'alert', config: { message: 'Multiple tier bypass attempts detected' } },
        { type: 'suspend_user', config: { reason: 'Multiple tier bypass attempts' } }
      ]
    });

    // Brute force pattern
    this.patterns.set('brute_force_pattern', {
      id: 'brute_force_pattern',
      name: 'Brute Force Attacks',
      type: SecurityEventType.REPEATED_FAILED_ACCESS,
      conditions: [],
      threshold: 10,
      timeWindow: 15, // 15 minutes
      severity: SecuritySeverity.HIGH,
      enabled: true,
      actions: [
        { type: 'alert', config: { message: 'Potential brute force attack detected' } },
        { type: 'block_ip', config: { reason: 'Brute force attack' } }
      ]
    });
  }

  private startBackgroundTasks(): void {
    // Clean up old events every hour
    setInterval(() => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      for (const [id, event] of this.events.entries()) {
        if (event.timestamp < oneWeekAgo && event.resolved) {
          this.events.delete(id);
        }
      }
    }, 60 * 60 * 1000);

    // Update threat intelligence every 6 hours
    setInterval(() => {
      this.updateThreatIntelligence();
    }, 6 * 60 * 60 * 1000);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private updateThreatIntel(ipAddress: string, threatLevel: ThreatIntelligence['threatLevel'], sources: string[]): void {
    this.threatIntel.set(ipAddress, {
      ipAddress,
      threatLevel,
      sources,
      lastSeen: new Date(),
      notes: sources.join('; '),
      blocked: this.blockedIPs.has(ipAddress)
    });
  }

  private async updateThreatIntelligence(): Promise<void> {
    // TODO: Integrate with external threat intelligence feeds
    // For now, this is a placeholder
  }

  private updateMetrics(): void {
    // Metrics are calculated on-demand in getMetrics()
  }

  private generateHourlyTrends(): any[] {
    // TODO: Implement hourly trend calculation
    return [];
  }

  private generateDailyTrends(): any[] {
    // TODO: Implement daily trend calculation
    return [];
  }

  private generateWeeklyTrends(): any[] {
    // TODO: Implement weekly trend calculation
    return [];
  }

  private getEventFieldValue(event: SecurityEvent, field: string): any {
    const parts = field.split('.');
    let value: any = event;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  }

  private evaluateCondition(value: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals': return value === expected;
      case 'contains': return String(value).includes(String(expected));
      case 'greater_than': return Number(value) > Number(expected);
      case 'less_than': return Number(value) < Number(expected);
      case 'in': return Array.isArray(expected) && expected.includes(value);
      case 'not_in': return Array.isArray(expected) && !expected.includes(value);
      default: return false;
    }
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateIncidentId(): string {
    return `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTimelineId(): string {
    return `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();