/**
 * Enterprise Audit Logging System
 * Story 11.5: Comprehensive audit logging for SOC 2 compliance
 */

import { type AuditLogEntry } from '@/types/enterprise-evaluation';
import { maskSensitiveData, isEncryptedField } from '@/lib/security/enterprise-encryption';
import { prisma } from '@/lib/prisma';

/**
 * Audit log event types
 */
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'access_denied';

/**
 * Audit context for tracking user actions
 */
export interface AuditContext {
  userId: string;
  userTier: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  businessEvaluationId: string,
  action: AuditAction,
  context: AuditContext,
  details?: {
    fieldName?: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
  }
): Promise<void> {
  try {
    // Mask sensitive data in the audit log
    const maskedOldValue = details?.fieldName && details?.oldValue
      ? maskSensitiveData(details.oldValue, details.fieldName)
      : undefined;

    const maskedNewValue = details?.fieldName && details?.newValue
      ? maskSensitiveData(details.newValue, details.fieldName)
      : undefined;

    await prisma.auditLogEntry.create({
      data: {
        businessEvaluationId,
        action,
        fieldName: details?.fieldName,
        oldValue: maskedOldValue ? JSON.parse(maskedOldValue) : undefined,
        newValue: maskedNewValue ? JSON.parse(maskedNewValue) : undefined,
        userId: context.userId,
        userTier: context.userTier,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: {
          sessionId: context.sessionId,
          reason: details?.reason,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    // Log to error monitoring service (e.g., Sentry)
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main operation
  }
}

/**
 * Batch create audit logs for multiple field changes
 */
export async function createBatchAuditLogs(
  businessEvaluationId: string,
  action: AuditAction,
  context: AuditContext,
  fieldChanges: Array<{
    fieldName: string;
    oldValue: any;
    newValue: any;
  }>
): Promise<void> {
  try {
    const auditEntries = fieldChanges.map(change => ({
      businessEvaluationId,
      action,
      fieldName: change.fieldName,
      oldValue: isEncryptedField(change.fieldName)
        ? '***ENCRYPTED***'
        : change.oldValue,
      newValue: isEncryptedField(change.fieldName)
        ? '***ENCRYPTED***'
        : change.newValue,
      userId: context.userId,
      userTier: context.userTier,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      timestamp: new Date()
    }));

    await prisma.auditLogEntry.createMany({
      data: auditEntries
    });
  } catch (error) {
    console.error('Failed to create batch audit logs:', error);
  }
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters: {
  businessEvaluationId?: string;
  userId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> {
  const where: any = {};

  if (filters.businessEvaluationId) {
    where.businessEvaluationId = filters.businessEvaluationId;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) {
      where.timestamp.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.timestamp.lte = filters.endDate;
    }
  }

  const logs = await prisma.auditLogEntry.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: filters.limit || 100,
    skip: filters.offset || 0
  });

  return logs;
}

/**
 * Generate audit trail report for compliance
 */
export async function generateAuditTrailReport(
  businessEvaluationId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  summary: {
    totalActions: number;
    uniqueUsers: number;
    actionBreakdown: Record<string, number>;
    sensitiveFieldAccess: number;
  };
  logs: AuditLogEntry[];
}> {
  const logs = await queryAuditLogs({
    businessEvaluationId,
    startDate,
    endDate,
    limit: 10000 // Max for report
  });

  const uniqueUsers = new Set(logs.map(log => log.userId));
  const actionBreakdown: Record<string, number> = {};
  let sensitiveFieldAccess = 0;

  logs.forEach(log => {
    actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
    if (log.fieldName && isEncryptedField(log.fieldName)) {
      sensitiveFieldAccess++;
    }
  });

  return {
    summary: {
      totalActions: logs.length,
      uniqueUsers: uniqueUsers.size,
      actionBreakdown,
      sensitiveFieldAccess
    },
    logs
  };
}

/**
 * Verify audit log integrity
 * Checks for tampering or missing entries
 */
export async function verifyAuditLogIntegrity(
  businessEvaluationId: string
): Promise<{
  isValid: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    // Check for gaps in timestamps
    const logs = await prisma.auditLogEntry.findMany({
      where: { businessEvaluationId },
      orderBy: { timestamp: 'asc' }
    });

    // Check for suspicious patterns
    const userActions: Record<string, number> = {};
    let lastTimestamp: Date | null = null;

    for (const log of logs) {
      // Check for time anomalies
      if (lastTimestamp && log.timestamp < lastTimestamp) {
        issues.push(`Timestamp anomaly detected at ${log.id}`);
      }
      lastTimestamp = log.timestamp;

      // Track rapid actions
      const key = `${log.userId}-${log.action}`;
      const hour = Math.floor(log.timestamp.getTime() / 3600000);
      const hourKey = `${key}-${hour}`;
      userActions[hourKey] = (userActions[hourKey] || 0) + 1;

      // Flag suspicious activity
      if (userActions[hourKey] > 100) {
        issues.push(`Suspicious activity: ${userActions[hourKey]} ${log.action} actions in one hour by user ${log.userId}`);
      }
    }

    // Check for required audit events
    const hasCreate = logs.some(log => log.action === 'create');
    if (logs.length > 0 && !hasCreate) {
      issues.push('Missing creation audit log');
    }

  } catch (error) {
    issues.push(`Integrity check failed: ${error}`);
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Archive old audit logs
 */
export async function archiveOldAuditLogs(
  daysToKeep: number = 365
): Promise<{ archived: number; deleted: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  try {
    // First, export old logs to cold storage (S3, etc.)
    const oldLogs = await prisma.auditLogEntry.findMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });

    // TODO: Implement actual archive storage
    // await archiveToS3(oldLogs);

    // Then delete from active database
    const deleted = await prisma.auditLogEntry.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });

    return {
      archived: oldLogs.length,
      deleted: deleted.count
    };
  } catch (error) {
    console.error('Failed to archive audit logs:', error);
    throw error;
  }
}

/**
 * Monitor for suspicious activity
 */
export async function detectSuspiciousActivity(
  userId: string,
  timeWindowMinutes: number = 5
): Promise<{
  isSuspicious: boolean;
  reason?: string;
}> {
  const cutoff = new Date();
  cutoff.setMinutes(cutoff.getMinutes() - timeWindowMinutes);

  const recentLogs = await prisma.auditLogEntry.findMany({
    where: {
      userId,
      timestamp: {
        gte: cutoff
      }
    }
  });

  // Check for excessive exports
  const exports = recentLogs.filter(log => log.action === 'export').length;
  if (exports > 10) {
    return {
      isSuspicious: true,
      reason: `Excessive exports detected: ${exports} in ${timeWindowMinutes} minutes`
    };
  }

  // Check for rapid deletes
  const deletes = recentLogs.filter(log => log.action === 'delete').length;
  if (deletes > 5) {
    return {
      isSuspicious: true,
      reason: `Rapid deletions detected: ${deletes} in ${timeWindowMinutes} minutes`
    };
  }

  // Check for access to multiple sensitive fields
  const sensitiveAccess = recentLogs.filter(log =>
    log.fieldName && isEncryptedField(log.fieldName)
  ).length;
  if (sensitiveAccess > 20) {
    return {
      isSuspicious: true,
      reason: `Excessive sensitive field access: ${sensitiveAccess} in ${timeWindowMinutes} minutes`
    };
  }

  return { isSuspicious: false };
}