/**
 * Access Audit Logger
 * Story 11.10: Comprehensive audit logging for access control system
 */

import { createAuditLog, AuditContext, AuditAction } from './enterprise-audit-log';
import { UserTier } from '@/lib/access-control/permission-matrix';
import { UserSubscriptionDetails } from '@/lib/subscription/user-subscription';

export interface AccessAttemptEntry {
  id?: string;
  userId: string;
  feature: string;
  action: string;
  resource?: string;
  requestedTier: UserTier;
  userTier: UserTier;
  status: 'allowed' | 'denied' | 'rate_limited' | 'error';
  reason?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  endpoint?: string;
  method?: string;
  responseTime?: number;
  rateLimited?: boolean;
  additionalContext?: Record<string, any>;
}

export interface SecurityAlert {
  id: string;
  userId: string;
  alertType: 'suspicious_activity' | 'rate_limit_exceeded' | 'tier_bypass_attempt' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  context: Record<string, any>;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface AccessPattern {
  userId: string;
  feature: string;
  timeWindow: string; // e.g., "5m", "1h", "1d"
  attemptCount: number;
  deniedCount: number;
  allowedCount: number;
  lastAttempt: Date;
  suspiciousActivity: boolean;
  patterns: {
    rapidFireAttempts: boolean;
    tierEscalationAttempts: boolean;
    multipleFeatureAccess: boolean;
    timeAnomalies: boolean;
  };
}

/**
 * Comprehensive Access Audit Logger
 */
export class AccessAuditLogger {
  private static instance: AccessAuditLogger;
  private recentAttempts: Map<string, AccessAttemptEntry[]> = new Map();
  private securityAlerts: SecurityAlert[] = [];
  private readonly MAX_RECENT_ATTEMPTS = 100;
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanupOldEntries(), this.CLEANUP_INTERVAL);
  }

  public static getInstance(): AccessAuditLogger {
    if (!AccessAuditLogger.instance) {
      AccessAuditLogger.instance = new AccessAuditLogger();
    }
    return AccessAuditLogger.instance;
  }

  /**
   * Log an access attempt with comprehensive context
   */
  async logAccessAttempt(entry: AccessAttemptEntry): Promise<void> {
    try {
      // Add to recent attempts for pattern analysis
      this.addToRecentAttempts(entry);

      // Create audit log entry using existing enterprise system
      const auditContext: AuditContext = {
        userId: entry.userId,
        userTier: entry.userTier,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        sessionId: entry.sessionId
      };

      const auditAction: AuditAction = entry.status === 'allowed' ? 'read' : 'access_denied';

      await createAuditLog(
        `access-${entry.feature}-${Date.now()}`,
        auditAction,
        auditContext,
        {
          fieldName: `${entry.feature}.${entry.action}`,
          oldValue: JSON.stringify({
            requestedTier: entry.requestedTier,
            endpoint: entry.endpoint,
            method: entry.method
          }),
          newValue: JSON.stringify({
            status: entry.status,
            userTier: entry.userTier,
            responseTime: entry.responseTime
          }),
          reason: entry.reason || `Access ${entry.status} for ${entry.feature}.${entry.action}`
        }
      );

      // Analyze for suspicious patterns
      await this.analyzeAccessPattern(entry);

      // Trigger alerts if necessary
      if (entry.status === 'denied' || entry.rateLimited) {
        await this.checkForSecurityAlerts(entry);
      }

    } catch (error) {
      console.error('Failed to log access attempt:', error);
      // Fail silently to not disrupt user experience
    }
  }

  /**
   * Log successful authentication and permission grant
   */
  async logSuccessfulAccess(
    userId: string,
    feature: string,
    action: string,
    subscription: UserSubscriptionDetails,
    context?: Partial<AccessAttemptEntry>
  ): Promise<void> {
    const entry: AccessAttemptEntry = {
      userId,
      feature,
      action,
      requestedTier: subscription.tier,
      userTier: subscription.tier,
      status: 'allowed',
      timestamp: new Date(),
      ...context
    };

    await this.logAccessAttempt(entry);
  }

  /**
   * Log denied access with detailed reason
   */
  async logDeniedAccess(
    userId: string,
    feature: string,
    action: string,
    userTier: UserTier,
    requiredTier: UserTier,
    reason: string,
    context?: Partial<AccessAttemptEntry>
  ): Promise<void> {
    const entry: AccessAttemptEntry = {
      userId,
      feature,
      action,
      requestedTier: requiredTier,
      userTier,
      status: 'denied',
      reason,
      timestamp: new Date(),
      ...context
    };

    await this.logAccessAttempt(entry);
  }

  /**
   * Log rate limiting event
   */
  async logRateLimitExceeded(
    userId: string,
    feature: string,
    action: string,
    userTier: UserTier,
    context?: Partial<AccessAttemptEntry>
  ): Promise<void> {
    const entry: AccessAttemptEntry = {
      userId,
      feature,
      action,
      requestedTier: userTier,
      userTier,
      status: 'rate_limited',
      reason: 'Rate limit exceeded',
      rateLimited: true,
      timestamp: new Date(),
      ...context
    };

    await this.logAccessAttempt(entry);
  }

  /**
   * Analyze access patterns for suspicious activity
   */
  private async analyzeAccessPattern(entry: AccessAttemptEntry): Promise<void> {
    const userKey = entry.userId;
    const userAttempts = this.recentAttempts.get(userKey) || [];

    // Analyze different time windows
    const patterns = {
      last5Minutes: this.analyzeTimeWindow(userAttempts, 5 * 60 * 1000),
      last1Hour: this.analyzeTimeWindow(userAttempts, 60 * 60 * 1000),
      last24Hours: this.analyzeTimeWindow(userAttempts, 24 * 60 * 60 * 1000)
    };

    // Check for rapid fire attempts (5+ denied attempts in 5 minutes)
    if (patterns.last5Minutes.deniedCount >= 5) {
      await this.createSecurityAlert({
        userId: entry.userId,
        alertType: 'suspicious_activity',
        severity: 'medium',
        description: `Rapid fire access attempts detected: ${patterns.last5Minutes.deniedCount} denied attempts in 5 minutes`,
        context: {
          timeWindow: '5m',
          deniedCount: patterns.last5Minutes.deniedCount,
          feature: entry.feature,
          action: entry.action
        }
      });
    }

    // Check for tier bypass attempts
    const tierBypassAttempts = userAttempts.filter(attempt =>
      attempt.status === 'denied' &&
      attempt.reason?.includes('tier') &&
      Date.now() - attempt.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    if (tierBypassAttempts.length >= 3) {
      await this.createSecurityAlert({
        userId: entry.userId,
        alertType: 'tier_bypass_attempt',
        severity: 'high',
        description: `Multiple tier bypass attempts detected: ${tierBypassAttempts.length} attempts in last hour`,
        context: {
          attempts: tierBypassAttempts.length,
          features: [...new Set(tierBypassAttempts.map(a => a.feature))],
          userTier: entry.userTier
        }
      });
    }

    // Check for privilege escalation patterns
    if (this.detectPrivilegeEscalationPattern(userAttempts)) {
      await this.createSecurityAlert({
        userId: entry.userId,
        alertType: 'privilege_escalation',
        severity: 'critical',
        description: 'Potential privilege escalation attack pattern detected',
        context: {
          pattern: 'systematic_tier_probing',
          attempts: userAttempts.length
        }
      });
    }
  }

  /**
   * Analyze access attempts within a time window
   */
  private analyzeTimeWindow(attempts: AccessAttemptEntry[], windowMs: number): {
    totalCount: number;
    deniedCount: number;
    allowedCount: number;
    rateLimitedCount: number;
    features: Set<string>;
  } {
    const cutoff = Date.now() - windowMs;
    const windowAttempts = attempts.filter(attempt => attempt.timestamp.getTime() > cutoff);

    return {
      totalCount: windowAttempts.length,
      deniedCount: windowAttempts.filter(a => a.status === 'denied').length,
      allowedCount: windowAttempts.filter(a => a.status === 'allowed').length,
      rateLimitedCount: windowAttempts.filter(a => a.status === 'rate_limited').length,
      features: new Set(windowAttempts.map(a => a.feature))
    };
  }

  /**
   * Detect privilege escalation patterns
   */
  private detectPrivilegeEscalationPattern(attempts: AccessAttemptEntry[]): boolean {
    // Look for systematic probing of different features with increasing tier requirements
    const recentDenied = attempts
      .filter(a => a.status === 'denied' && Date.now() - a.timestamp.getTime() < 30 * 60 * 1000)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (recentDenied.length < 5) return false;

    // Check if attempts are targeting different features in a systematic way
    const uniqueFeatures = new Set(recentDenied.map(a => a.feature));
    const featureCount = uniqueFeatures.size;

    // Suspicious if attempting many different features in short time
    return featureCount >= 4 && recentDenied.length >= 8;
  }

  /**
   * Check for conditions that warrant security alerts
   */
  private async checkForSecurityAlerts(entry: AccessAttemptEntry): Promise<void> {
    // Check for excessive rate limiting
    const userAttempts = this.recentAttempts.get(entry.userId) || [];
    const rateLimitedCount = userAttempts.filter(a =>
      a.rateLimited &&
      Date.now() - a.timestamp.getTime() < 15 * 60 * 1000
    ).length;

    if (rateLimitedCount >= 3) {
      await this.createSecurityAlert({
        userId: entry.userId,
        alertType: 'rate_limit_exceeded',
        severity: 'medium',
        description: `User exceeded rate limits ${rateLimitedCount} times in 15 minutes`,
        context: {
          count: rateLimitedCount,
          feature: entry.feature,
          timeWindow: '15m'
        }
      });
    }
  }

  /**
   * Create a security alert
   */
  private async createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const securityAlert: SecurityAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alert
    };

    this.securityAlerts.push(securityAlert);

    // Log the security alert
    console.warn('Security Alert:', securityAlert);

    // In production, you might want to:
    // - Send to monitoring system (e.g., Sentry, DataDog)
    // - Trigger email/Slack notifications
    // - Store in database for dashboard display
    // - Integrate with SIEM systems
  }

  /**
   * Add attempt to recent attempts cache
   */
  private addToRecentAttempts(entry: AccessAttemptEntry): void {
    const userKey = entry.userId;
    const userAttempts = this.recentAttempts.get(userKey) || [];

    userAttempts.push(entry);

    // Keep only recent attempts
    if (userAttempts.length > this.MAX_RECENT_ATTEMPTS) {
      userAttempts.shift();
    }

    this.recentAttempts.set(userKey, userAttempts);
  }

  /**
   * Clean up old entries from memory
   */
  private cleanupOldEntries(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

    for (const [userId, attempts] of this.recentAttempts.entries()) {
      const recentAttempts = attempts.filter(attempt =>
        attempt.timestamp.getTime() > cutoff
      );

      if (recentAttempts.length === 0) {
        this.recentAttempts.delete(userId);
      } else {
        this.recentAttempts.set(userId, recentAttempts);
      }
    }

    // Clean up old security alerts (keep for 7 days)
    const alertCutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.securityAlerts = this.securityAlerts.filter(alert =>
      alert.timestamp.getTime() > alertCutoff
    );
  }

  /**
   * Get access statistics for a user
   */
  public getUserAccessStats(userId: string, timeWindowMs: number = 24 * 60 * 60 * 1000): {
    totalAttempts: number;
    allowedAttempts: number;
    deniedAttempts: number;
    rateLimitedAttempts: number;
    featuresAccessed: string[];
    lastActivity: Date | null;
  } {
    const userAttempts = this.recentAttempts.get(userId) || [];
    const cutoff = Date.now() - timeWindowMs;
    const recentAttempts = userAttempts.filter(attempt =>
      attempt.timestamp.getTime() > cutoff
    );

    return {
      totalAttempts: recentAttempts.length,
      allowedAttempts: recentAttempts.filter(a => a.status === 'allowed').length,
      deniedAttempts: recentAttempts.filter(a => a.status === 'denied').length,
      rateLimitedAttempts: recentAttempts.filter(a => a.status === 'rate_limited').length,
      featuresAccessed: [...new Set(recentAttempts.map(a => a.feature))],
      lastActivity: recentAttempts.length > 0 ?
        new Date(Math.max(...recentAttempts.map(a => a.timestamp.getTime()))) : null
    };
  }

  /**
   * Get active security alerts
   */
  public getActiveSecurityAlerts(): SecurityAlert[] {
    return this.securityAlerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve a security alert
   */
  public resolveSecurityAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.securityAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get system-wide access statistics
   */
  public getSystemAccessStats(timeWindowMs: number = 24 * 60 * 60 * 1000): {
    totalUsers: number;
    totalAttempts: number;
    successRate: number;
    topFeatures: { feature: string; attempts: number }[];
    alertCount: number;
  } {
    const cutoff = Date.now() - timeWindowMs;
    let totalAttempts = 0;
    let allowedAttempts = 0;
    const featureCounts: Record<string, number> = {};
    const activeUsers = new Set<string>();

    for (const [userId, attempts] of this.recentAttempts.entries()) {
      const recentAttempts = attempts.filter(attempt =>
        attempt.timestamp.getTime() > cutoff
      );

      if (recentAttempts.length > 0) {
        activeUsers.add(userId);
        totalAttempts += recentAttempts.length;
        allowedAttempts += recentAttempts.filter(a => a.status === 'allowed').length;

        recentAttempts.forEach(attempt => {
          featureCounts[attempt.feature] = (featureCounts[attempt.feature] || 0) + 1;
        });
      }
    }

    const topFeatures = Object.entries(featureCounts)
      .map(([feature, attempts]) => ({ feature, attempts }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 10);

    return {
      totalUsers: activeUsers.size,
      totalAttempts,
      successRate: totalAttempts > 0 ? (allowedAttempts / totalAttempts) * 100 : 0,
      topFeatures,
      alertCount: this.getActiveSecurityAlerts().length
    };
  }
}

// Export singleton instance
export const accessAuditLogger = AccessAuditLogger.getInstance();

// Convenience functions
export async function logAccessAttempt(entry: AccessAttemptEntry): Promise<void> {
  return accessAuditLogger.logAccessAttempt(entry);
}

export async function logSuccessfulAccess(
  userId: string,
  feature: string,
  action: string,
  subscription: UserSubscriptionDetails,
  context?: Partial<AccessAttemptEntry>
): Promise<void> {
  return accessAuditLogger.logSuccessfulAccess(userId, feature, action, subscription, context);
}

export async function logDeniedAccess(
  userId: string,
  feature: string,
  action: string,
  userTier: UserTier,
  requiredTier: UserTier,
  reason: string,
  context?: Partial<AccessAttemptEntry>
): Promise<void> {
  return accessAuditLogger.logDeniedAccess(userId, feature, action, userTier, requiredTier, reason, context);
}

export async function logRateLimitExceeded(
  userId: string,
  feature: string,
  action: string,
  userTier: UserTier,
  context?: Partial<AccessAttemptEntry>
): Promise<void> {
  return accessAuditLogger.logRateLimitExceeded(userId, feature, action, userTier, context);
}

export default accessAuditLogger;