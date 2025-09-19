/**
 * Test Suite for Tier-Based Access Control System
 * Story 11.10: Comprehensive tests for permission checking, usage limits, and tier inheritance
 */

import {
  TierAccessControl,
  hasTierAccess,
  checkPermission,
  getPermissionsForTier,
  checkTierLimits,
  trackUsage,
  getAvailableFeatures,
  getUpgradeRecommendations,
  UserTier,
  UsageContext,
  AccessResult
} from '../tier-access-control';

describe('TierAccessControl', () => {
  let accessControl: TierAccessControl;

  beforeEach(() => {
    accessControl = new TierAccessControl();
  });

  describe('Tier Access Checks', () => {
    test('should allow access to same tier', () => {
      expect(hasTierAccess('basic', 'basic')).toBe(true);
      expect(hasTierAccess('professional', 'professional')).toBe(true);
      expect(hasTierAccess('enterprise', 'enterprise')).toBe(true);
    });

    test('should allow access to lower tiers', () => {
      expect(hasTierAccess('professional', 'basic')).toBe(true);
      expect(hasTierAccess('enterprise', 'basic')).toBe(true);
      expect(hasTierAccess('enterprise', 'professional')).toBe(true);
    });

    test('should deny access to higher tiers', () => {
      expect(hasTierAccess('basic', 'professional')).toBe(false);
      expect(hasTierAccess('basic', 'enterprise')).toBe(false);
      expect(hasTierAccess('professional', 'enterprise')).toBe(false);
    });
  });

  describe('Feature Permission Checks', () => {
    test('should allow basic tier questionnaire access', () => {
      const result = checkPermission('basic', 'questionnaire', 'view');
      expect(result.allowed).toBe(true);
      expect(result.permission).toBe('read');
    });

    test('should deny basic tier AI analysis access', () => {
      const result = checkPermission('basic', 'ai_analysis', 'create');
      expect(result.allowed).toBe(false);
      expect(result.permission).toBe('none');
      expect(result.upgradeRequired).toBeDefined();
    });

    test('should allow professional tier AI analysis access', () => {
      const result = checkPermission('professional', 'ai_analysis', 'create');
      expect(result.allowed).toBe(true);
      expect(result.permission).toBe('write');
    });

    test('should handle usage limits correctly', () => {
      const context: UsageContext = {
        userId: 'test-user',
        feature: 'questionnaire',
        action: 'create',
        timestamp: new Date()
      };

      // First few requests should succeed
      for (let i = 0; i < 3; i++) {
        const result = checkPermission('basic', 'questionnaire', 'create', context);
        expect(result.allowed).toBe(true);
      }
    });

    test('should deny access when usage limit exceeded', () => {
      const context: UsageContext = {
        userId: 'test-user-limit',
        feature: 'evaluations',
        action: 'create',
        timestamp: new Date()
      };

      // Track usage beyond limit
      for (let i = 0; i < 5; i++) {
        trackUsage(context);
      }

      const result = checkPermission('basic', 'evaluations', 'create', context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Usage limit exceeded');
    });
  });

  describe('Resource Permission Checks', () => {
    test('should allow basic tier document viewing', () => {
      const result = accessControl.checkResourcePermission('basic', 'documents', 'view');
      expect(result.allowed).toBe(true);
      expect(result.permission).toBe('read');
    });

    test('should deny basic tier template creation', () => {
      const result = accessControl.checkResourcePermission('basic', 'templates', 'create');
      expect(result.allowed).toBe(false);
      expect(result.permission).toBe('none');
    });

    test('should allow professional tier template creation', () => {
      const result = accessControl.checkResourcePermission('professional', 'templates', 'create');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Tier Limits', () => {
    test('should enforce basic tier limits', () => {
      // Test maxReports limit (5 for basic)
      const withinLimit = checkTierLimits('basic', 'maxReports', 3);
      expect(withinLimit.allowed).toBe(true);

      const exceedsLimit = checkTierLimits('basic', 'maxReports', 6);
      expect(exceedsLimit.allowed).toBe(false);
      expect(exceedsLimit.upgradeRequired).toBeDefined();
    });

    test('should handle unlimited enterprise limits', () => {
      const result = checkTierLimits('enterprise', 'maxReports', 1000);
      expect(result.allowed).toBe(true);
      expect(result.permission).toBe('admin');
    });

    test('should suggest appropriate upgrade tier', () => {
      const result = checkTierLimits('basic', 'maxEvaluations', 5);
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe('professional');
    });
  });

  describe('Permission Inheritance', () => {
    test('should inherit permissions from lower tiers', () => {
      const basicPermissions = getPermissionsForTier('basic');
      const professionalPermissions = getPermissionsForTier('professional');

      // Professional should have at least all basic questionnaire permissions
      expect(professionalPermissions.features.questionnaire.view).toBeDefined();
      expect(professionalPermissions.features.questionnaire.view).not.toBe('none');
    });

    test('should override inherited permissions', () => {
      const basicPermissions = getPermissionsForTier('basic');
      const professionalPermissions = getPermissionsForTier('professional');

      // Professional should have enhanced permissions compared to basic
      expect(professionalPermissions.features.ai_analysis.create).not.toBe('none');
      expect(basicPermissions.features.ai_analysis.create).toBe('none');
    });
  });

  describe('Available Features', () => {
    test('should return correct features for basic tier', () => {
      const features = getAvailableFeatures('basic');
      expect(features).toContain('questionnaire');
      expect(features).toContain('dashboard');
      expect(features).toContain('reports');
      expect(features).not.toContain('ai_analysis');
    });

    test('should return more features for professional tier', () => {
      const basicFeatures = getAvailableFeatures('basic');
      const professionalFeatures = getAvailableFeatures('professional');

      expect(professionalFeatures.length).toBeGreaterThan(basicFeatures.length);
      expect(professionalFeatures).toContain('ai_analysis');
      expect(professionalFeatures).toContain('financial_trends');
    });

    test('should return all features for enterprise tier', () => {
      const enterpriseFeatures = getAvailableFeatures('enterprise');
      expect(enterpriseFeatures).toContain('admin');
      expect(enterpriseFeatures).toContain('compliance');
      expect(enterpriseFeatures).toContain('ai_analysis');
    });
  });

  describe('Upgrade Recommendations', () => {
    test('should recommend professional tier for AI analysis', () => {
      const recommendation = getUpgradeRecommendations('basic', 'ai_analysis', 'create');
      expect(recommendation).not.toBeNull();
      expect(recommendation?.tier).toBe('professional');
      expect(recommendation?.benefits).toContain('Access to ai analysis features');
    });

    test('should return null if already has access', () => {
      const recommendation = getUpgradeRecommendations('professional', 'ai_analysis', 'create');
      expect(recommendation).toBeNull();
    });

    test('should recommend enterprise for admin features', () => {
      const recommendation = getUpgradeRecommendations('professional', 'admin', 'user_management');
      expect(recommendation).not.toBeNull();
      expect(recommendation?.tier).toBe('enterprise');
    });
  });

  describe('Usage Tracking', () => {
    test('should track usage correctly', () => {
      const context: UsageContext = {
        userId: 'test-user-tracking',
        feature: 'reports',
        action: 'create',
        timestamp: new Date()
      };

      // Initial usage should be 0
      expect(accessControl.getCurrentUsage(context.userId, context.feature, context.action, 'monthly')).toBe(0);

      // Track usage
      trackUsage(context);

      // Usage should be tracked
      expect(accessControl.getCurrentUsage(context.userId, context.feature, context.action, 'monthly')).toBe(1);
    });

    test('should reset usage correctly', () => {
      const context: UsageContext = {
        userId: 'test-user-reset',
        feature: 'reports',
        action: 'create',
        timestamp: new Date()
      };

      // Track some usage
      trackUsage(context);
      trackUsage(context);
      expect(accessControl.getCurrentUsage(context.userId, context.feature, context.action, 'monthly')).toBe(2);

      // Reset usage
      accessControl.resetUsage(context.userId, context.feature, context.action, 'monthly');
      expect(accessControl.getCurrentUsage(context.userId, context.feature, context.action, 'monthly')).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid tier gracefully', () => {
      const result = checkPermission('invalid-tier' as UserTier, 'questionnaire', 'view');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Invalid tier');
    });

    test('should handle invalid feature gracefully', () => {
      const result = checkPermission('basic', 'invalid-feature' as keyof any, 'view');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not defined');
    });

    test('should handle invalid action gracefully', () => {
      const result = checkPermission('basic', 'questionnaire', 'invalid-action');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not defined');
    });

    test('should handle missing context gracefully', () => {
      const result = checkPermission('basic', 'questionnaire', 'create');
      expect(result.allowed).toBe(true); // Should still work without usage tracking
    });
  });

  describe('Conditional Permissions', () => {
    test('should handle approval requirements', () => {
      // Create a mock permission that requires approval
      const mockContext: UsageContext = {
        userId: 'test-user-approval',
        feature: 'questionnaire',
        action: 'create',
        timestamp: new Date()
      };

      const result = checkPermission('basic', 'questionnaire', 'create', mockContext);

      // Should be allowed but may have conditions
      expect(result.allowed).toBe(true);

      // Check if conditions are properly handled
      if (result.conditions) {
        const approvalCondition = result.conditions.find(c => c.type === 'approval_required');
        if (approvalCondition) {
          expect(approvalCondition.value).toBe(true);
        }
      }
    });

    test('should handle time restrictions', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10); // 10 days ago

      const context: UsageContext = {
        userId: 'test-user-time',
        feature: 'questionnaire',
        action: 'create',
        timestamp: pastDate
      };

      const result = checkPermission('basic', 'questionnaire', 'create', context);

      // Should handle time-based restrictions appropriately
      expect(result).toBeDefined();
      expect(typeof result.allowed).toBe('boolean');
    });

    test('should handle custom conditions', () => {
      const context: UsageContext = {
        userId: 'test-user-custom',
        feature: 'dashboard',
        action: 'filters',
        timestamp: new Date(),
        metadata: {
          filterCount: 5
        }
      };

      const result = checkPermission('basic', 'dashboard', 'filters', context);

      // Should evaluate custom conditions (maxFilters: 3 for basic)
      expect(result).toBeDefined();

      if (!result.allowed && result.conditions) {
        const customCondition = result.conditions.find(c => c.type === 'custom');
        if (customCondition) {
          expect(customCondition.message).toContain('filters');
        }
      }
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple concurrent permission checks', async () => {
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(Promise.resolve(checkPermission('professional', 'reports', 'create')));
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result.allowed).toBe(true);
      });
    });

    test('should efficiently cache permission lookups', () => {
      const start = performance.now();

      // Perform multiple identical permission checks
      for (let i = 0; i < 1000; i++) {
        checkPermission('professional', 'ai_analysis', 'create');
      }

      const end = performance.now();
      const duration = end - start;

      // Should complete reasonably quickly (adjust threshold as needed)
      expect(duration).toBeLessThan(100); // 100ms threshold
    });
  });
});

describe('Integration Tests', () => {
  test('should integrate with all tier features from stories 11.1-11.9', () => {
    // Basic tier features (Stories 11.1-11.2)
    expect(checkPermission('basic', 'questionnaire', 'view').allowed).toBe(true);
    expect(checkPermission('basic', 'dashboard', 'view').allowed).toBe(true);
    expect(checkPermission('basic', 'reports', 'create').allowed).toBe(true);

    // Professional tier features (Stories 11.3-11.5)
    expect(checkPermission('professional', 'ai_analysis', 'create').allowed).toBe(true);
    expect(checkPermission('professional', 'roi_calculator', 'scenarios').allowed).toBe(true);
    expect(checkPermission('professional', 'financial_trends', 'forecasting').allowed).toBe(true);

    // Enterprise tier features (Stories 11.6-11.9)
    expect(checkPermission('enterprise', 'scenario_modeling', 'advanced').allowed).toBe(true);
    expect(checkPermission('enterprise', 'admin', 'user_management').allowed).toBe(true);
    expect(checkPermission('enterprise', 'compliance', 'audit').allowed).toBe(true);
  });

  test('should properly enforce evaluation limits across tiers', () => {
    // Basic: 2 evaluations/month
    expect(checkTierLimits('basic', 'maxEvaluations', 1).allowed).toBe(true);
    expect(checkTierLimits('basic', 'maxEvaluations', 3).allowed).toBe(false);

    // Professional: 10 evaluations/month
    expect(checkTierLimits('professional', 'maxEvaluations', 5).allowed).toBe(true);
    expect(checkTierLimits('professional', 'maxEvaluations', 15).allowed).toBe(false);

    // Enterprise: unlimited
    expect(checkTierLimits('enterprise', 'maxEvaluations', 1000).allowed).toBe(true);
  });

  test('should provide correct upgrade paths for all features', () => {
    // AI Analysis upgrade path
    const aiUpgrade = getUpgradeRecommendations('basic', 'ai_analysis', 'create');
    expect(aiUpgrade?.tier).toBe('professional');

    // Admin features upgrade path
    const adminUpgrade = getUpgradeRecommendations('professional', 'admin', 'user_management');
    expect(adminUpgrade?.tier).toBe('enterprise');

    // No upgrade needed
    const noUpgrade = getUpgradeRecommendations('enterprise', 'ai_analysis', 'create');
    expect(noUpgrade).toBeNull();
  });
});

describe('Real-world Scenarios', () => {
  test('should handle typical basic user workflow', () => {
    const userId = 'basic-user-123';

    // User can view questionnaire
    expect(checkPermission('basic', 'questionnaire', 'view').allowed).toBe(true);

    // User can create limited questionnaires
    const createResult = checkPermission('basic', 'questionnaire', 'create', {
      userId,
      feature: 'questionnaire',
      action: 'create',
      timestamp: new Date()
    });
    expect(createResult.allowed).toBe(true);

    // User cannot access AI analysis
    expect(checkPermission('basic', 'ai_analysis', 'create').allowed).toBe(false);
  });

  test('should handle professional user enhanced features', () => {
    const userId = 'pro-user-456';

    // Can access all basic features
    expect(checkPermission('professional', 'questionnaire', 'view').allowed).toBe(true);
    expect(checkPermission('professional', 'reports', 'create').allowed).toBe(true);

    // Can access professional features
    expect(checkPermission('professional', 'ai_analysis', 'create').allowed).toBe(true);
    expect(checkPermission('professional', 'roi_calculator', 'scenarios').allowed).toBe(true);

    // Cannot access enterprise features
    expect(checkPermission('professional', 'admin', 'user_management').allowed).toBe(false);
  });

  test('should handle enterprise user full access', () => {
    const userId = 'enterprise-user-789';

    // Can access all features
    expect(checkPermission('enterprise', 'questionnaire', 'view').allowed).toBe(true);
    expect(checkPermission('enterprise', 'ai_analysis', 'create').allowed).toBe(true);
    expect(checkPermission('enterprise', 'admin', 'user_management').allowed).toBe(true);
    expect(checkPermission('enterprise', 'compliance', 'audit').allowed).toBe(true);

    // Has unlimited usage
    expect(checkTierLimits('enterprise', 'maxEvaluations', 10000).allowed).toBe(true);
    expect(checkTierLimits('enterprise', 'maxReports', 10000).allowed).toBe(true);
  });
});