/**
 * SOC 2 Compliance Tests
 * Story 11.5: Testing compliance features for enterprise security
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DataClassification,
  AccessLevel,
  hasDataAccess,
  FIELD_CLASSIFICATIONS,
  applyRetentionPolicies,
  monitorSecurityEvent,
  generateComplianceReport,
  validateCompliance,
  RETENTION_POLICIES,
  SECURITY_MONITORS,
} from '../soc2-compliance';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    businessEvaluation: {
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    auditLogEntry: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('SOC 2 Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.ENTERPRISE_ENCRYPTION_KEY = 'test-key-32-characters-long-minimum';
    process.env.ENTERPRISE_ENCRYPTION_SALT = 'test-salt-16-chars';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data Classification', () => {
    it('should classify fields correctly', () => {
      expect(FIELD_CLASSIFICATIONS.businessName).toBe(DataClassification.PUBLIC);
      expect(FIELD_CLASSIFICATIONS.annualRevenue).toBe(DataClassification.CONFIDENTIAL);
      expect(FIELD_CLASSIFICATIONS.ipPortfolioValue).toBe(DataClassification.RESTRICTED);
      expect(FIELD_CLASSIFICATIONS.exitStrategyPreferences).toBe(DataClassification.RESTRICTED);
    });

    it('should have all strategic fields classified as RESTRICTED', () => {
      const restrictedFields = [
        'ipPortfolioValue',
        'partnershipAgreementsValue',
        'customerDatabaseValue',
        'exitStrategyPreferences',
        'acquisitionScenario',
        'strategicOptions',
      ];

      restrictedFields.forEach(field => {
        expect(FIELD_CLASSIFICATIONS[field]).toBe(DataClassification.RESTRICTED);
      });
    });
  });

  describe('Access Control', () => {
    it('should grant Enterprise users access to all classifications', () => {
      const policy = {
        userId: 'user-123',
        userTier: 'ENTERPRISE',
        classification: DataClassification.RESTRICTED,
        accessLevel: AccessLevel.READ,
      };

      expect(hasDataAccess(policy)).toBe(true);
    });

    it('should restrict Professional users from RESTRICTED data', () => {
      const policy = {
        userId: 'user-456',
        userTier: 'PROFESSIONAL',
        classification: DataClassification.RESTRICTED,
        accessLevel: AccessLevel.READ,
      };

      expect(hasDataAccess(policy)).toBe(false);
    });

    it('should allow Professional users to access CONFIDENTIAL data', () => {
      const policy = {
        userId: 'user-456',
        userTier: 'PROFESSIONAL',
        classification: DataClassification.CONFIDENTIAL,
        accessLevel: AccessLevel.READ,
      };

      expect(hasDataAccess(policy)).toBe(true);
    });

    it('should restrict Basic users to PUBLIC and INTERNAL data only', () => {
      const basicUser = 'user-789';

      // Should have access to PUBLIC
      expect(hasDataAccess({
        userId: basicUser,
        userTier: 'BASIC',
        classification: DataClassification.PUBLIC,
        accessLevel: AccessLevel.READ,
      })).toBe(true);

      // Should have access to INTERNAL
      expect(hasDataAccess({
        userId: basicUser,
        userTier: 'BASIC',
        classification: DataClassification.INTERNAL,
        accessLevel: AccessLevel.READ,
      })).toBe(true);

      // Should NOT have access to CONFIDENTIAL
      expect(hasDataAccess({
        userId: basicUser,
        userTier: 'BASIC',
        classification: DataClassification.CONFIDENTIAL,
        accessLevel: AccessLevel.READ,
      })).toBe(false);

      // Should NOT have access to RESTRICTED
      expect(hasDataAccess({
        userId: basicUser,
        userTier: 'BASIC',
        classification: DataClassification.RESTRICTED,
        accessLevel: AccessLevel.READ,
      })).toBe(false);
    });
  });

  describe('Retention Policies', () => {
    it('should have proper retention periods defined', () => {
      const evaluationPolicy = RETENTION_POLICIES.find(p => p.dataType === 'business_evaluations');
      expect(evaluationPolicy).toBeDefined();
      expect(evaluationPolicy?.retentionDays).toBe(2555); // 7 years
      expect(evaluationPolicy?.deleteAfterDays).toBe(3650); // 10 years

      const auditPolicy = RETENTION_POLICIES.find(p => p.dataType === 'audit_logs');
      expect(auditPolicy).toBeDefined();
      expect(auditPolicy?.retentionDays).toBe(2555); // 7 years
    });

    it('should apply retention policies correctly', async () => {
      const mockUpdateMany = vi.mocked(prisma.businessEvaluation.updateMany);
      const mockDeleteMany = vi.mocked(prisma.businessEvaluation.deleteMany);

      mockUpdateMany.mockResolvedValue({ count: 5 });
      mockDeleteMany.mockResolvedValue({ count: 2 });

      await applyRetentionPolicies();

      // Should archive old evaluations
      expect(mockUpdateMany).toHaveBeenCalled();
      const updateCall = mockUpdateMany.mock.calls[0];
      expect(updateCall[0].where.archived).toBe(false);
      expect(updateCall[0].data.archived).toBe(true);

      // Should delete very old evaluations
      expect(mockDeleteMany).toHaveBeenCalled();
    });

    it('should skip retention for data under legal hold', async () => {
      const policyWithHold = {
        ...RETENTION_POLICIES[0],
        legalHold: true,
      };

      // Mock the policies to include legal hold
      const originalPolicies = [...RETENTION_POLICIES];
      RETENTION_POLICIES[0] = policyWithHold;

      await applyRetentionPolicies();

      // Should not apply retention for legal hold data
      expect(prisma.businessEvaluation.deleteMany).not.toHaveBeenCalled();

      // Restore original policies
      RETENTION_POLICIES.splice(0, RETENTION_POLICIES.length, ...originalPolicies);
    });
  });

  describe('Security Monitoring', () => {
    it('should have appropriate security monitors configured', () => {
      const loginMonitor = SECURITY_MONITORS.find(m => m.eventType === 'failed_login');
      expect(loginMonitor).toBeDefined();
      expect(loginMonitor?.threshold).toBe(5);
      expect(loginMonitor?.action).toBe('block');

      const exportMonitor = SECURITY_MONITORS.find(m => m.eventType === 'data_export');
      expect(exportMonitor).toBeDefined();
      expect(exportMonitor?.threshold).toBe(10);
      expect(exportMonitor?.action).toBe('alert');
    });

    it('should monitor security events and take action when threshold exceeded', async () => {
      const mockCount = vi.mocked(prisma.auditLogEntry.count);
      const mockCreate = vi.mocked(prisma.auditLogEntry.create);

      // Simulate 5 failed login attempts (threshold)
      mockCount.mockResolvedValue(5);

      await monitorSecurityEvent('failed_login', 'user-123');

      // Should create a blocking audit log entry
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'user_blocked',
          userId: 'user-123',
        }),
      });
    });

    it('should not take action when below threshold', async () => {
      const mockCount = vi.mocked(prisma.auditLogEntry.count);
      const mockCreate = vi.mocked(prisma.auditLogEntry.create);

      // Simulate 2 failed attempts (below threshold of 5)
      mockCount.mockResolvedValue(2);

      await monitorSecurityEvent('failed_login', 'user-123');

      // Should not create any blocking entry
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate SOC 2 compliance report with metrics', async () => {
      const mockCount = vi.mocked(prisma.auditLogEntry.count);

      mockCount
        .mockResolvedValueOnce(1000) // total access
        .mockResolvedValueOnce(5)    // unauthorized attempts
        .mockResolvedValueOnce(0);   // encryption failures

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const report = await generateComplianceReport('SOC2_TYPE_II', startDate, endDate);

      expect(report.reportType).toBe('SOC2_TYPE_II');
      expect(report.metrics.totalAccess).toBe(1000);
      expect(report.metrics.unauthorizedAttempts).toBe(5);
      expect(report.metrics.encryptionFailures).toBe(0);
      expect(report.metrics.auditCompleteness).toBe(100);
      expect(report.findings).toHaveLength(0); // No findings for low unauthorized attempts
    });

    it('should identify compliance findings when thresholds exceeded', async () => {
      const mockCount = vi.mocked(prisma.auditLogEntry.count);

      mockCount
        .mockResolvedValueOnce(1000) // total access
        .mockResolvedValueOnce(15)   // unauthorized attempts (high)
        .mockResolvedValueOnce(2);   // encryption failures (critical)

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const report = await generateComplianceReport('SOC2_TYPE_II', startDate, endDate);

      expect(report.findings).toHaveLength(2);

      const accessFinding = report.findings.find(f => f.category === 'Access Control');
      expect(accessFinding).toBeDefined();
      expect(accessFinding?.severity).toBe('high');

      const encryptionFinding = report.findings.find(f => f.category === 'Encryption');
      expect(encryptionFinding).toBeDefined();
      expect(encryptionFinding?.severity).toBe('critical');
    });
  });

  describe('Compliance Validation', () => {
    it('should validate compliance when all requirements met', async () => {
      const mockCount = vi.mocked(prisma.auditLogEntry.count);
      const mockEvalCount = vi.mocked(prisma.businessEvaluation.count);

      mockCount.mockResolvedValue(100); // Recent audit logs exist
      mockEvalCount.mockResolvedValue(0); // No old evaluations

      const result = await validateCompliance();

      expect(result.compliant).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect encryption configuration issues', async () => {
      delete process.env.ENTERPRISE_ENCRYPTION_KEY;

      const mockCount = vi.mocked(prisma.auditLogEntry.count);
      mockCount.mockResolvedValue(100);

      const result = await validateCompliance();

      expect(result.compliant).toBe(false);
      expect(result.issues).toContain('Encryption key not properly configured');
    });

    it('should detect missing audit logs', async () => {
      const mockCount = vi.mocked(prisma.auditLogEntry.count);
      const mockEvalCount = vi.mocked(prisma.businessEvaluation.count);

      mockCount.mockResolvedValue(0); // No recent audit logs
      mockEvalCount.mockResolvedValue(0);

      const result = await validateCompliance();

      expect(result.compliant).toBe(false);
      expect(result.issues).toContain('No audit logs in the last 24 hours');
    });

    it('should detect retention policy violations', async () => {
      const mockCount = vi.mocked(prisma.auditLogEntry.count);
      const mockEvalCount = vi.mocked(prisma.businessEvaluation.count);

      mockCount.mockResolvedValue(100); // Recent audit logs exist
      mockEvalCount.mockResolvedValue(5); // Old evaluations exist

      const result = await validateCompliance();

      expect(result.compliant).toBe(false);
      expect(result.issues).toContain('5 evaluations exceed retention policy');
    });
  });
});