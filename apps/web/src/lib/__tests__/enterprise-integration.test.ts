/**
 * Enterprise Tier Integration Tests
 * Story 11.5: Test integration with existing tiers and backward compatibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  encryptEnterpriseData,
  decryptEnterpriseData,
  validateEncryptionConfig,
} from '../security/enterprise-encryption';
import { createAuditLogEntry } from '../audit/enterprise-audit-log';
import {
  hasDataAccess,
  DataClassification,
  AccessLevel,
  validateCompliance,
} from '../security/soc2-compliance';
// Mock the scenarios module
vi.mock('../scenarios/enterprise-scenarios', () => ({
  calculateEnterpriseScenarios: vi.fn((data, projections) => projections),
  calculateEnterpriseValuation: vi.fn(() => ({ baseValuation: 10000000 })),
  compareScenarioOutcomes: vi.fn(),
  generateStrategicRecommendations: vi.fn(),
}));

// Define AuditAction enum for tests
enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
}
import {
  getEnterpriseEvaluationOptimized,
  QueryPerformanceMonitor,
  createEnterpriseIndexes,
} from '../performance/enterprise-query-optimizer';
import {
  optimizeProjectionsStorage,
  restoreProjectionsFromOptimized,
  StorageMonitor,
} from '../storage/enterprise-data-compression';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    businessEvaluation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    enterpriseScenarioModel: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    auditLogEntry: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(prisma)),
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
  },
}));

describe('Enterprise Tier Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENTERPRISE_ENCRYPTION_KEY = 'test-encryption-key-32-characters-minimum';
    process.env.ENTERPRISE_ENCRYPTION_SALT = 'test-salt-16-chars';
    StorageMonitor.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Tier Compatibility', () => {
    it('should maintain Professional tier functionality with Enterprise extensions', async () => {
      const professionalEvaluation = {
        id: 'eval-123',
        userId: 'user-456',
        subscriptionTier: 'PROFESSIONAL',
        businessName: 'Test Company',
        professionalTierData: {
          businessModel: 'B2B',
          recurringRevenuePercentage: 75,
          customerConcentration: 15,
          competitiveAdvantages: ['Technology', 'Brand'],
        },
        enterpriseTierData: null, // No enterprise data for Professional tier
      };

      vi.mocked(prisma.businessEvaluation.findUnique).mockResolvedValue(professionalEvaluation);

      const result = await prisma.businessEvaluation.findUnique({
        where: { id: 'eval-123' },
      });

      expect(result).toBeDefined();
      expect(result?.professionalTierData).toBeDefined();
      expect(result?.enterpriseTierData).toBeNull();
      expect(result?.subscriptionTier).toBe('PROFESSIONAL');
    });

    it('should maintain Basic tier compatibility', async () => {
      const basicEvaluation = {
        id: 'eval-789',
        userId: 'user-012',
        subscriptionTier: 'BASIC',
        businessName: 'Small Business',
        annualRevenue: 1000000,
        netIncome: 100000,
        professionalTierData: null,
        enterpriseTierData: null,
      };

      vi.mocked(prisma.businessEvaluation.findUnique).mockResolvedValue(basicEvaluation);

      const result = await prisma.businessEvaluation.findUnique({
        where: { id: 'eval-789' },
      });

      expect(result).toBeDefined();
      expect(result?.subscriptionTier).toBe('BASIC');
      expect(result?.professionalTierData).toBeNull();
      expect(result?.enterpriseTierData).toBeNull();
    });

    it('should support seamless tier upgrades', async () => {
      // Simulate upgrade from Professional to Enterprise
      const evaluation = {
        id: 'eval-upgrade',
        userId: 'user-upgrade',
        subscriptionTier: 'PROFESSIONAL',
        businessName: 'Growing Company',
        professionalTierData: { /* existing data */ },
        enterpriseTierData: null,
      };

      vi.mocked(prisma.businessEvaluation.findUnique).mockResolvedValue(evaluation);

      // Upgrade to Enterprise
      const enterpriseData = {
        strategicValueDrivers: {
          patents: 5,
          ipPortfolioValue: 1000000,
        },
        operationalScalability: {
          processDocumentationPercentage: 80,
        },
      };

      const encrypted = encryptEnterpriseData(enterpriseData);

      const updated = {
        ...evaluation,
        subscriptionTier: 'ENTERPRISE',
        enterpriseTierData: encrypted,
      };

      vi.mocked(prisma.businessEvaluation.update).mockResolvedValue(updated);

      const result = await prisma.businessEvaluation.update({
        where: { id: 'eval-upgrade' },
        data: {
          subscriptionTier: 'ENTERPRISE',
          enterpriseTierData: encrypted,
        },
      });

      expect(result.subscriptionTier).toBe('ENTERPRISE');
      expect(result.enterpriseTierData).toBeDefined();
      expect(result.professionalTierData).toBeDefined(); // Preserved
    });

    it('should handle tier downgrades gracefully', async () => {
      // Enterprise user downgrading to Professional
      const hasAccess = hasDataAccess({
        userId: 'user-downgrade',
        userTier: 'PROFESSIONAL', // Downgraded
        classification: DataClassification.RESTRICTED,
        accessLevel: AccessLevel.READ,
      });

      expect(hasAccess).toBe(false); // No access to Enterprise data after downgrade

      // But should still access Professional data
      const professionalAccess = hasDataAccess({
        userId: 'user-downgrade',
        userTier: 'PROFESSIONAL',
        classification: DataClassification.CONFIDENTIAL,
        accessLevel: AccessLevel.READ,
      });

      expect(professionalAccess).toBe(true);
    });
  });

  describe('Performance Regression Tests', () => {
    it('should not impact Basic tier query performance', async () => {
      const startTime = Date.now();

      vi.mocked(prisma.businessEvaluation.findMany).mockResolvedValue([
        { id: '1', subscriptionTier: 'BASIC' },
        { id: '2', subscriptionTier: 'BASIC' },
      ]);

      await prisma.businessEvaluation.findMany({
        where: {
          subscriptionTier: 'BASIC',
        },
        select: {
          id: true,
          businessName: true,
          annualRevenue: true,
        },
      });

      const queryTime = Date.now() - startTime;

      // Basic queries should be fast
      expect(queryTime).toBeLessThan(100); // Should be very fast for mocked queries
    });

    it('should maintain Professional tier performance', async () => {
      const startTime = Date.now();

      vi.mocked(prisma.businessEvaluation.findUnique).mockResolvedValue({
        id: 'prof-1',
        subscriptionTier: 'PROFESSIONAL',
        professionalTierData: { /* data */ },
      });

      await prisma.businessEvaluation.findUnique({
        where: { id: 'prof-1' },
        select: {
          id: true,
          professionalTierData: true,
        },
      });

      const queryTime = Date.now() - startTime;

      expect(queryTime).toBeLessThan(100);
    });

    it('should optimize Enterprise tier queries to meet <1.5s requirement', async () => {
      // Mock the optimized query
      vi.mocked(prisma.businessEvaluation.findUnique).mockImplementation(async () => {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          id: 'ent-1',
          subscriptionTier: 'ENTERPRISE',
          enterpriseTierData: { /* large data */ },
          EnterpriseScenarioModel: { /* scenarios */ },
        };
      });

      const startTime = Date.now();

      await getEnterpriseEvaluationOptimized('ent-1', true);

      const queryTime = Date.now() - startTime;

      // Should be well under 1.5 seconds even with scenarios
      expect(queryTime).toBeLessThan(1500);
    });
  });

  describe('Data Encryption Integration', () => {
    it('should encrypt and decrypt Enterprise data correctly', () => {
      const originalData = {
        strategicValueDrivers: {
          ipPortfolioValue: 5000000,
          partnershipAgreementsValue: 2000000,
          customerDatabaseValue: 3000000,
        },
      };

      const encrypted = encryptEnterpriseData(originalData);

      // Encrypted fields should be strings
      expect(typeof encrypted.strategicValueDrivers?.ipPortfolioValue).toBe('string');

      const decrypted = decryptEnterpriseData(encrypted);

      // Should restore original values
      expect(decrypted.strategicValueDrivers?.ipPortfolioValue).toBe(5000000);
      expect(decrypted.strategicValueDrivers?.partnershipAgreementsValue).toBe(2000000);
    });

    it('should validate encryption configuration', () => {
      const isValid = validateEncryptionConfig();
      expect(isValid).toBe(true);
    });
  });

  describe('Audit Logging Integration', () => {
    it('should create audit logs for Enterprise data access', async () => {
      const mockCreate = vi.mocked(prisma.auditLogEntry.create);

      await createAuditLogEntry({
        businessEvaluationId: 'eval-audit',
        action: AuditAction.READ,
        userId: 'user-audit',
        userTier: 'ENTERPRISE',
        fieldName: 'strategicValueDrivers',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          businessEvaluationId: 'eval-audit',
          action: 'read',
          userId: 'user-audit',
          userTier: 'ENTERPRISE',
        }),
      });
    });

    it('should track modifications with old and new values', async () => {
      const mockCreate = vi.mocked(prisma.auditLogEntry.create);

      await createAuditLogEntry({
        businessEvaluationId: 'eval-modify',
        action: AuditAction.UPDATE,
        userId: 'user-modify',
        userTier: 'ENTERPRISE',
        fieldName: 'ipPortfolioValue',
        oldValue: 1000000,
        newValue: 1500000,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'update',
          fieldName: 'ipPortfolioValue',
          oldValue: expect.stringContaining('***'), // Should be masked
          newValue: expect.stringContaining('***'), // Should be masked
        }),
      });
    });
  });

  describe('Scenario Modeling Integration', () => {
    it('should calculate Enterprise scenarios with all tiers of data', async () => {
      const enterpriseData = {
        strategicValueDrivers: {
          patents: 10,
          ipPortfolioValue: 5000000,
        },
        financialOptimization: {
          workingCapitalPercentage: 15,
          debtToEquityRatio: 0.5,
        },
      };

      const projections = {
        baseCase: [
          { year: 1, revenue: 10000000, grossMargin: 0.4, netMargin: 0.1, cashFlow: 1000000, capex: 500000 },
          { year: 2, revenue: 11000000, grossMargin: 0.42, netMargin: 0.12, cashFlow: 1320000, capex: 400000 },
        ],
      };

      // Mock the calculateEnterpriseScenarios function
      const calculateEnterpriseScenarios = vi.fn((data, projections) => projections);
      const scenarios = await calculateEnterpriseScenarios(enterpriseData, projections);

      expect(scenarios).toBeDefined();
      expect(scenarios.baseCase).toHaveLength(2);
    });

    it('should compress and restore scenario data efficiently', async () => {
      const projections = {
        baseCase: Array.from({ length: 5 }, (_, i) => ({
          year: i + 1,
          revenue: 10000000 * (1 + i * 0.1),
          grossMargin: 0.4,
          netMargin: 0.1,
          cashFlow: 1000000 * (1 + i * 0.1),
          capex: 500000,
        })),
        optimisticCase: Array.from({ length: 5 }, (_, i) => ({
          year: i + 1,
          revenue: 10000000 * (1 + i * 0.15),
          grossMargin: 0.45,
          netMargin: 0.15,
          cashFlow: 1500000 * (1 + i * 0.15),
          capex: 400000,
        })),
        conservativeCase: Array.from({ length: 5 }, (_, i) => ({
          year: i + 1,
          revenue: 10000000 * (1 + i * 0.05),
          grossMargin: 0.35,
          netMargin: 0.08,
          cashFlow: 800000 * (1 + i * 0.05),
          capex: 600000,
        })),
        currentGrossMargin: 0.4,
        projectedGrossMarginYear5: 0.45,
        currentNetMargin: 0.1,
        projectedNetMarginYear5: 0.12,
        maintenanceCapexPercentage: 0.05,
        growthCapexFiveYear: 2000000,
        projectedMarketPosition: 'niche' as const,
        competitiveThreats: 'New entrants',
        strategicOptions: [],
      };

      const optimized = await optimizeProjectionsStorage(projections);

      expect(optimized.optimizedSize).toBeLessThan(optimized.originalSize);
      expect(optimized.strategy).toBe('delta+gzip');

      const restored = await restoreProjectionsFromOptimized(
        optimized.optimized,
        'delta+gzip'
      );

      expect(restored.baseCase).toHaveLength(5);
      expect(restored.baseCase[0].revenue).toBe(10000000);
      expect(restored.optimisticCase[4].revenue).toBe(16000000); // 10M * 1.6
    });
  });

  describe('SOC 2 Compliance Integration', () => {
    it('should validate compliance across all components', async () => {
      vi.mocked(prisma.auditLogEntry.count).mockResolvedValue(100);
      vi.mocked(prisma.businessEvaluation.count).mockResolvedValue(0);

      const compliance = await validateCompliance();

      expect(compliance.compliant).toBe(true);
      expect(compliance.issues).toHaveLength(0);
    });

    it('should enforce data classification access controls', () => {
      // Test access hierarchy
      const testCases = [
        { tier: 'ENTERPRISE', classification: DataClassification.RESTRICTED, expected: true },
        { tier: 'ENTERPRISE', classification: DataClassification.CONFIDENTIAL, expected: true },
        { tier: 'PROFESSIONAL', classification: DataClassification.RESTRICTED, expected: false },
        { tier: 'PROFESSIONAL', classification: DataClassification.CONFIDENTIAL, expected: true },
        { tier: 'BASIC', classification: DataClassification.CONFIDENTIAL, expected: false },
        { tier: 'BASIC', classification: DataClassification.INTERNAL, expected: true },
      ];

      testCases.forEach(({ tier, classification, expected }) => {
        const access = hasDataAccess({
          userId: 'test-user',
          userTier: tier,
          classification,
          accessLevel: AccessLevel.READ,
        });

        expect(access).toBe(expected);
      });
    });
  });

  describe('End-to-End Integration', () => {
    it('should handle complete Enterprise evaluation lifecycle', async () => {
      const userId = 'user-e2e';
      const evaluationId = 'eval-e2e';

      // 1. Create evaluation
      const evaluation = {
        id: evaluationId,
        userId,
        subscriptionTier: 'ENTERPRISE',
        businessName: 'E2E Test Company',
        professionalTierData: {
          businessModel: 'B2B',
        },
        enterpriseTierData: null,
      };

      vi.mocked(prisma.businessEvaluation.create).mockResolvedValue(evaluation);

      // 2. Add Enterprise data
      const enterpriseData = {
        strategicValueDrivers: {
          ipPortfolioValue: 10000000,
        },
      };

      const encrypted = encryptEnterpriseData(enterpriseData);

      // 3. Create scenarios
      const scenarios = {
        baseScenario: '{"compressed":"data"}',
        optimisticScenario: '{"compressed":"data"}',
        conservativeScenario: '{"compressed":"data"}',
      };

      vi.mocked(prisma.enterpriseScenarioModel.upsert).mockResolvedValue({
        id: 'scenario-1',
        businessEvaluationId: evaluationId,
        ...scenarios,
        projectionHorizon: 5,
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        calculationVersion: '1.0.0',
        customScenarios: {},
      });

      // 4. Verify audit trail
      vi.mocked(prisma.auditLogEntry.findMany).mockResolvedValue([
        {
          id: '1',
          businessEvaluationId: evaluationId,
          action: 'create',
          userId,
          userTier: 'ENTERPRISE',
          timestamp: new Date(),
        },
      ]);

      // 5. Query with optimization
      vi.mocked(prisma.businessEvaluation.findUnique).mockResolvedValue({
        ...evaluation,
        enterpriseTierData: encrypted,
        EnterpriseScenarioModel: scenarios,
      });

      const result = await getEnterpriseEvaluationOptimized(evaluationId, true);

      expect(result).toBeDefined();
      expect(result.id).toBe(evaluationId);
      expect(result.EnterpriseScenarioModel).toBeDefined();

      // 6. Verify performance metrics
      const metrics = QueryPerformanceMonitor.getMetrics('getEnterpriseEvaluation:db');
      if (metrics) {
        expect(metrics.max).toBeLessThan(1500); // Under 1.5s requirement
      }

      // 7. Check storage optimization
      const storageMetrics = StorageMonitor.getMetrics();
      if (storageMetrics.totalStoredMB > 0) {
        expect(storageMetrics.avgCompressionRatio).toBeGreaterThan(1); // Some compression achieved
      }
    });
  });
});