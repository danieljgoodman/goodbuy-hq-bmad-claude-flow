/**
 * SOC 2 Compliance Features
 * Story 11.5: Enterprise tier security and compliance
 * Implements data classification, access controls, retention policies, and monitoring
 */

import { prisma } from '@/lib/prisma';
import { type AuditAction } from '../audit/enterprise-audit-log';

// Define User type locally (previously from Supabase)
interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

// Data classification levels for SOC 2 compliance
export enum DataClassification {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED = 'RESTRICTED', // Highest level - Enterprise strategic data
}

// Access control levels
export enum AccessLevel {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  ADMIN = 'ADMIN',
}

// Field classification mapping
export const FIELD_CLASSIFICATIONS: Record<string, DataClassification> = {
  // Public fields
  businessName: DataClassification.PUBLIC,
  industry: DataClassification.PUBLIC,
  businessStage: DataClassification.PUBLIC,

  // Internal fields
  employeeCount: DataClassification.INTERNAL,
  yearsInOperation: DataClassification.INTERNAL,

  // Confidential fields
  annualRevenue: DataClassification.CONFIDENTIAL,
  netIncome: DataClassification.CONFIDENTIAL,
  totalAssets: DataClassification.CONFIDENTIAL,

  // Restricted fields (Enterprise strategic data)
  ipPortfolioValue: DataClassification.RESTRICTED,
  partnershipAgreementsValue: DataClassification.RESTRICTED,
  customerDatabaseValue: DataClassification.RESTRICTED,
  exitStrategyPreferences: DataClassification.RESTRICTED,
  acquisitionScenario: DataClassification.RESTRICTED,
  strategicOptions: DataClassification.RESTRICTED,
};

/**
 * Data access control policy
 */
export interface AccessPolicy {
  userId: string;
  userTier: string;
  classification: DataClassification;
  accessLevel: AccessLevel;
  resourceId?: string;
  resourceType?: string;
}

/**
 * Check if user has access to specific data classification
 */
export function hasDataAccess(
  policy: AccessPolicy
): boolean {
  const { userTier, classification, accessLevel } = policy;

  // Enterprise users have full access to all classifications
  if (userTier === 'ENTERPRISE') {
    return true;
  }

  // Professional users can access up to CONFIDENTIAL
  if (userTier === 'PROFESSIONAL') {
    return classification !== DataClassification.RESTRICTED;
  }

  // Basic users can only access PUBLIC and INTERNAL
  if (userTier === 'BASIC' || userTier === 'FREEMIUM') {
    return [DataClassification.PUBLIC, DataClassification.INTERNAL].includes(classification);
  }

  return false;
}

/**
 * Data retention policy configuration
 */
export interface RetentionPolicy {
  dataType: string;
  retentionDays: number;
  archiveAfterDays?: number;
  deleteAfterDays: number;
  legalHold?: boolean;
}

// Default retention policies
export const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    dataType: 'business_evaluations',
    retentionDays: 2555, // 7 years for financial records
    archiveAfterDays: 1095, // Archive after 3 years
    deleteAfterDays: 3650, // Delete after 10 years
  },
  {
    dataType: 'audit_logs',
    retentionDays: 2555, // 7 years for audit trails
    deleteAfterDays: 2555, // Never archive, delete after retention
  },
  {
    dataType: 'user_sessions',
    retentionDays: 90,
    deleteAfterDays: 90,
  },
  {
    dataType: 'temporary_calculations',
    retentionDays: 7,
    deleteAfterDays: 7,
  },
];

/**
 * Apply data retention policies
 */
export async function applyRetentionPolicies(): Promise<void> {
  for (const policy of RETENTION_POLICIES) {
    if (policy.legalHold) {
      continue; // Skip if under legal hold
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.deleteAfterDays);

    try {
      // Handle each data type
      switch (policy.dataType) {
        case 'business_evaluations':
          // Archive old evaluations if needed
          if (policy.archiveAfterDays) {
            const archiveDate = new Date();
            archiveDate.setDate(archiveDate.getDate() - policy.archiveAfterDays);

            await prisma.businessEvaluation.updateMany({
              where: {
                createdAt: { lt: archiveDate },
                archived: false,
              },
              data: {
                archived: true,
                archivedAt: new Date(),
              },
            });
          }

          // Delete very old evaluations
          await prisma.businessEvaluation.deleteMany({
            where: {
              createdAt: { lt: cutoffDate },
            },
          });
          break;

        case 'audit_logs':
          await prisma.auditLogEntry.deleteMany({
            where: {
              timestamp: { lt: cutoffDate },
            },
          });
          break;

        // Add more cases as needed
      }
    } catch (error) {
      console.error(`Failed to apply retention policy for ${policy.dataType}:`, error);
    }
  }
}

/**
 * Security monitoring configuration
 */
export interface SecurityMonitor {
  eventType: string;
  threshold: number;
  timeWindowMinutes: number;
  action: 'alert' | 'block' | 'log';
}

// Security monitoring rules
export const SECURITY_MONITORS: SecurityMonitor[] = [
  {
    eventType: 'failed_login',
    threshold: 5,
    timeWindowMinutes: 10,
    action: 'block',
  },
  {
    eventType: 'data_export',
    threshold: 10,
    timeWindowMinutes: 60,
    action: 'alert',
  },
  {
    eventType: 'unauthorized_access',
    threshold: 3,
    timeWindowMinutes: 5,
    action: 'block',
  },
  {
    eventType: 'encryption_failure',
    threshold: 1,
    timeWindowMinutes: 1,
    action: 'alert',
  },
];

/**
 * Monitor security events
 */
export async function monitorSecurityEvent(
  eventType: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<void> {
  const monitor = SECURITY_MONITORS.find(m => m.eventType === eventType);

  if (!monitor) {
    return; // No monitoring configured for this event
  }

  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - monitor.timeWindowMinutes);

  // Count recent events
  const recentEvents = await prisma.auditLogEntry.count({
    where: {
      userId,
      action: eventType as AuditAction,
      timestamp: { gte: windowStart },
    },
  });

  if (recentEvents >= monitor.threshold) {
    await handleSecurityAction(monitor.action, userId, eventType, metadata);
  }
}

/**
 * Handle security actions
 */
async function handleSecurityAction(
  action: 'alert' | 'block' | 'log',
  userId: string,
  eventType: string,
  metadata?: Record<string, any>
): Promise<void> {
  switch (action) {
    case 'alert':
      // Send security alert
      await sendSecurityAlert({
        userId,
        eventType,
        severity: 'high',
        metadata,
      });
      break;

    case 'block':
      // Block user temporarily
      await blockUser(userId, eventType);
      break;

    case 'log':
      // Log security event
      console.warn('Security event detected:', {
        userId,
        eventType,
        metadata,
      });
      break;
  }
}

/**
 * Send security alert
 */
async function sendSecurityAlert(alert: {
  userId: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}): Promise<void> {
  // In production, this would integrate with monitoring systems
  console.error('SECURITY ALERT:', alert);

  // Log to audit trail
  await prisma.auditLogEntry.create({
    data: {
      businessEvaluationId: 'system',
      action: 'security_alert' as AuditAction,
      userId: alert.userId,
      userTier: 'SYSTEM',
      timestamp: new Date(),
      metadata: alert.metadata,
    },
  });
}

/**
 * Block user temporarily
 */
async function blockUser(userId: string, reason: string): Promise<void> {
  // In production, this would update user status in auth system
  console.error('USER BLOCKED:', { userId, reason });

  // Log blocking action
  await prisma.auditLogEntry.create({
    data: {
      businessEvaluationId: 'system',
      action: 'user_blocked' as AuditAction,
      userId,
      userTier: 'SYSTEM',
      timestamp: new Date(),
      metadata: { reason },
    },
  });
}

/**
 * Compliance reporting data structure
 */
export interface ComplianceReport {
  reportId: string;
  reportType: 'SOC2_TYPE_I' | 'SOC2_TYPE_II' | 'AUDIT_TRAIL' | 'ACCESS_REVIEW';
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalAccess: number;
    unauthorizedAttempts: number;
    encryptionFailures: number;
    dataBreaches: number;
    auditCompleteness: number; // percentage
    retentionCompliance: number; // percentage
  };
  findings: ComplianceFinding[];
}

export interface ComplianceFinding {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  remediation?: string;
  status: 'open' | 'remediated' | 'accepted';
}

/**
 * Generate SOC 2 compliance report
 */
export async function generateComplianceReport(
  reportType: ComplianceReport['reportType'],
  startDate: Date,
  endDate: Date
): Promise<ComplianceReport> {
  // Gather compliance metrics
  const totalAccess = await prisma.auditLogEntry.count({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const unauthorizedAttempts = await prisma.auditLogEntry.count({
    where: {
      action: 'unauthorized_access' as AuditAction,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const encryptionFailures = await prisma.auditLogEntry.count({
    where: {
      action: 'encryption_failure' as AuditAction,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Check for any data breaches
  const dataBreaches = 0; // Would come from incident management system

  // Calculate audit completeness
  const auditCompleteness = totalAccess > 0 ? 100 : 0; // Simplified - all actions are audited

  // Calculate retention compliance
  const retentionCompliance = 100; // Simplified - assuming all policies are met

  // Identify findings
  const findings: ComplianceFinding[] = [];

  if (unauthorizedAttempts > 10) {
    findings.push({
      severity: 'high',
      category: 'Access Control',
      description: `${unauthorizedAttempts} unauthorized access attempts detected`,
      remediation: 'Review access control policies and user permissions',
      status: 'open',
    });
  }

  if (encryptionFailures > 0) {
    findings.push({
      severity: 'critical',
      category: 'Encryption',
      description: `${encryptionFailures} encryption failures detected`,
      remediation: 'Investigate encryption service and key management',
      status: 'open',
    });
  }

  return {
    reportId: `SOC2-${Date.now()}`,
    reportType,
    generatedAt: new Date(),
    period: {
      start: startDate,
      end: endDate,
    },
    metrics: {
      totalAccess,
      unauthorizedAttempts,
      encryptionFailures,
      dataBreaches,
      auditCompleteness,
      retentionCompliance,
    },
    findings,
  };
}

/**
 * Validate SOC 2 compliance status
 */
export async function validateCompliance(): Promise<{
  compliant: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  // Check encryption configuration
  const encryptionKey = process.env.ENTERPRISE_ENCRYPTION_KEY;
  const encryptionSalt = process.env.ENTERPRISE_ENCRYPTION_SALT;

  if (!encryptionKey || encryptionKey.length < 32) {
    issues.push('Encryption key not properly configured');
  }

  if (!encryptionSalt || encryptionSalt.length < 16) {
    issues.push('Encryption salt not properly configured');
  }

  // Check audit logging
  const recentAudits = await prisma.auditLogEntry.count({
    where: {
      timestamp: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
  });

  if (recentAudits === 0) {
    issues.push('No audit logs in the last 24 hours');
  }

  // Check retention policies
  const oldEvaluations = await prisma.businessEvaluation.count({
    where: {
      createdAt: {
        lt: new Date(Date.now() - 3650 * 24 * 60 * 60 * 1000), // Older than 10 years
      },
    },
  });

  if (oldEvaluations > 0) {
    issues.push(`${oldEvaluations} evaluations exceed retention policy`);
  }

  return {
    compliant: issues.length === 0,
    issues,
  };
}

/**
 * Initialize SOC 2 compliance monitoring
 */
export async function initializeComplianceMonitoring(): Promise<void> {
  // Schedule retention policy enforcement
  setInterval(async () => {
    try {
      await applyRetentionPolicies();
    } catch (error) {
      console.error('Failed to apply retention policies:', error);
    }
  }, 24 * 60 * 60 * 1000); // Daily

  // Schedule compliance validation
  setInterval(async () => {
    try {
      const { compliant, issues } = await validateCompliance();
      if (!compliant) {
        console.warn('SOC 2 compliance issues detected:', issues);
        await sendSecurityAlert({
          userId: 'system',
          eventType: 'compliance_validation',
          severity: 'high',
          metadata: { issues },
        });
      }
    } catch (error) {
      console.error('Failed to validate compliance:', error);
    }
  }, 60 * 60 * 1000); // Hourly

  console.log('SOC 2 compliance monitoring initialized');
}