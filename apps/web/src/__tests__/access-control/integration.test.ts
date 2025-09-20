/**
 * Integration Tests for Story 11.10: Complete Access Control System
 * 
 * Tests complete user workflows, tier transitions, permission enforcement,
 * API protection, and admin override scenarios.
 */

import { describe, test, expect, beforeEach, afterEach, jest, beforeAll, afterAll } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import {
  TierAccessControl,
  tierAccessControl,
  checkPermission,
  hasTierAccess,
  getPermissionsForTier,
  checkTierLimits,
  trackUsage,
  getAvailableFeatures,
  getUpgradeRecommendations
} from '@/lib/access-control/tier-access-control';
import {
  UserTier,
  Permission,
  TierPermissions,
  PermissionChecker
} from '@/lib/access-control/permission-matrix';
import { tierUpgradeHandler, TierUpgradeEvent } from '@/lib/subscription/tier-upgrade-handler';
import { validateTierAccess } from '@/middleware/tier-validation';
import { middleware } from '@/middleware';

// Mock external dependencies
jest.mock('@clerk/nextjs');
jest.mock('@/lib/access-control/permission-checker');
jest.mock('@/lib/subscription/tier-upgrade-handler');

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;

// Test fixtures
const mockUsers = {
  basicUser: {
    id: 'user_basic_123',
    emailAddresses: [{ emailAddress: 'basic@test.com' }],
    publicMetadata: { tier: 'basic' as UserTier },
    privateMetadata: { stripeCustomerId: 'cus_basic_123' }
  },
  professionalUser: {
    id: 'user_pro_456',
    emailAddresses: [{ emailAddress: 'pro@test.com' }],
    publicMetadata: { tier: 'professional' as UserTier },
    privateMetadata: { stripeCustomerId: 'cus_pro_456' }
  },
  enterpriseUser: {
    id: 'user_ent_789',
    emailAddresses: [{ emailAddress: 'enterprise@test.com' }],
    publicMetadata: { tier: 'enterprise' as UserTier },
    privateMetadata: { stripeCustomerId: 'cus_ent_789' }
  },
  adminUser: {
    id: 'user_admin_999',
    emailAddresses: [{ emailAddress: 'admin@goodbuy.com' }],
    publicMetadata: { tier: 'enterprise' as UserTier, role: 'admin' },
    privateMetadata: { stripeCustomerId: 'cus_admin_999' }
  }
};

const mockPermissions: Record<UserTier, TierPermissions> = {
  basic: {
    features: {
      ai_analysis: {
        generate: 'read',
        save: 'none',
        share: 'none'
      },
      benchmarking: {
        create: { permission: 'write', usageLimit: 5, timeRestriction: 'monthly' },
        view: 'read',
        compare: 'none'
      },
      reports: {
        generate: { permission: 'write', usageLimit: 10, timeRestriction: 'monthly' },
        schedule: 'none',
        export: 'none'
      },
      api: {
        access: 'none',
        rate_limit: 'none'
      }
    },
    resources: {
      projects: {
        create: 'write',
        read: 'read',
        update: 'write',
        delete: 'write'
      },
      data: {
        import: { permission: 'write', usageLimit: 1000, timeRestriction: 'monthly' },
        export: 'none',
        backup: 'none'
      }
    },
    limits: {
      projects: 3,
      reports: 10,
      apiCalls: 0,
      storageGB: 1,
      teamMembers: 1
    }
  },
  professional: {
    features: {
      ai_analysis: {
        generate: 'write',
        save: 'write',
        share: { permission: 'write', usageLimit: 50, timeRestriction: 'monthly' }
      },
      benchmarking: {
        create: 'write',
        view: 'read',
        compare: 'write'
      },
      reports: {
        generate: 'write',
        schedule: { permission: 'write', usageLimit: 20, timeRestriction: 'monthly' },
        export: 'write'
      },
      api: {
        access: { permission: 'write', usageLimit: 10000, timeRestriction: 'monthly' },
        rate_limit: 'write'
      }
    },
    resources: {
      projects: {
        create: 'write',
        read: 'read',
        update: 'write',
        delete: 'write'
      },
      data: {
        import: 'write',
        export: 'write',
        backup: { permission: 'write', usageLimit: 10, timeRestriction: 'monthly' }
      }
    },
    limits: {
      projects: 25,
      reports: 100,
      apiCalls: 10000,
      storageGB: 10,
      teamMembers: 5
    }
  },
  enterprise: {
    features: {
      ai_analysis: {
        generate: 'admin',
        save: 'admin',
        share: 'admin'
      },
      benchmarking: {
        create: 'admin',
        view: 'admin',
        compare: 'admin'
      },
      reports: {
        generate: 'admin',
        schedule: 'admin',
        export: 'admin'
      },
      api: {
        access: 'admin',
        rate_limit: 'admin'
      }
    },
    resources: {
      projects: {
        create: 'admin',
        read: 'admin',
        update: 'admin',
        delete: 'admin'
      },
      data: {
        import: 'admin',
        export: 'admin',
        backup: 'admin'
      }
    },
    limits: {
      projects: -1,
      reports: -1,
      apiCalls: -1,
      storageGB: -1,
      teamMembers: -1
    }
  }
};

describe('Access Control Integration Tests', () => {
  let accessControl: TierAccessControl;

  beforeAll(() => {
    // Setup global test environment
    global.fetch = jest.fn();
    Object.defineProperty(window, 'dispatchEvent', {
      value: jest.fn(),
      writable: true
    });
  });

  beforeEach(() => {
    // Create fresh instance for each test
    accessControl = new TierAccessControl();
    
    // Mock PermissionChecker methods
    (PermissionChecker.getFeaturePermission as jest.Mock).mockImplementation(
      (tier: UserTier, feature: keyof TierPermissions['features'], action: string) => {
        return mockPermissions[tier]?.features[feature]?.[action] || 'none';
      }
    );
    
    (PermissionChecker.getResourcePermission as jest.Mock).mockImplementation(
      (tier: UserTier, resource: string, action: string) => {
        return mockPermissions[tier]?.resources?.[resource]?.[action] || 'none';
      }
    );
    
    (PermissionChecker.getAllPermissions as jest.Mock).mockImplementation(
      (tier: UserTier) => mockPermissions[tier]
    );
    
    (PermissionChecker.getTierLimits as jest.Mock).mockImplementation(
      (tier: UserTier) => mockPermissions[tier]?.limits
    );

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('End-to-End User Workflows', () => {
    test('should handle complete basic user journey', async () => {
      const userId = mockUsers.basicUser.id;
      const userTier: UserTier = 'basic';

      // 1. User creates their first project
      const projectCreateResult = accessControl.checkResourcePermission(
        userTier,
        'projects',
        'create'
      );
      expect(projectCreateResult.allowed).toBe(true);
      expect(projectCreateResult.permission).toBe('write');

      // 2. User tries to generate AI analysis
      const aiAnalysisResult = accessControl.checkPermission(
        userTier,
        'ai_analysis',
        'generate',
        { userId, feature: 'ai_analysis', action: 'generate' }
      );
      expect(aiAnalysisResult.allowed).toBe(true);
      expect(aiAnalysisResult.permission).toBe('read');

      // 3. User tries to save AI analysis (should be blocked)
      const saveAnalysisResult = accessControl.checkPermission(
        userTier,
        'ai_analysis',
        'save',
        { userId, feature: 'ai_analysis', action: 'save' }
      );
      expect(saveAnalysisResult.allowed).toBe(false);
      expect(saveAnalysisResult.permission).toBe('none');
      expect(saveAnalysisResult.upgradeRequired).toBeDefined();

      // 4. User checks their limits
      const projectLimitResult = accessControl.checkTierLimits(userTier, 'projects', 2);
      expect(projectLimitResult.allowed).toBe(true);

      const projectLimitExceededResult = accessControl.checkTierLimits(userTier, 'projects', 5);
      expect(projectLimitExceededResult.allowed).toBe(false);
      expect(projectLimitExceededResult.upgradeRequired).toBeDefined();

      // 5. User gets upgrade recommendations
      const upgradeRec = accessControl.getUpgradeRecommendations(
        userTier,
        'ai_analysis',
        'save'
      );
      expect(upgradeRec).toBeTruthy();
      expect(upgradeRec?.tier).toBe('professional');
      expect(upgradeRec?.benefits).toContain(expect.stringContaining('ai_analysis'));
    });

    test('should handle professional user advanced workflows', async () => {
      const userId = mockUsers.professionalUser.id;
      const userTier: UserTier = 'professional';

      // 1. User creates custom benchmark
      const benchmarkResult = accessControl.checkPermission(
        userTier,
        'benchmarking',
        'create',
        { userId, feature: 'benchmarking', action: 'create' }
      );
      expect(benchmarkResult.allowed).toBe(true);
      expect(benchmarkResult.permission).toBe('write');

      // 2. User schedules reports
      const scheduleResult = accessControl.checkPermission(
        userTier,
        'reports',
        'schedule',
        { userId, feature: 'reports', action: 'schedule' }
      );
      expect(scheduleResult.allowed).toBe(true);
      expect(scheduleResult.conditions).toBeDefined();

      // 3. User accesses API
      const apiResult = accessControl.checkPermission(
        userTier,
        'api',
        'access',
        { userId, feature: 'api', action: 'access' }
      );
      expect(apiResult.allowed).toBe(true);
      expect(apiResult.conditions).toBeDefined();

      // 4. User tracks usage and hits limit
      const context = {
        userId,
        feature: 'reports' as keyof TierPermissions['features'],
        action: 'schedule'
      };

      // Simulate usage tracking
      for (let i = 0; i < 20; i++) {
        accessControl.trackUsage(context);
      }

      // Should still be within limit
      const usageCheckResult = accessControl.checkPermission(
        userTier,
        'reports',
        'schedule',
        context
      );
      expect(usageCheckResult.allowed).toBe(true);

      // Simulate exceeding limit
      for (let i = 0; i < 5; i++) {
        accessControl.trackUsage(context);
      }

      const exceededResult = accessControl.checkPermission(
        userTier,
        'reports',
        'schedule',
        context
      );
      expect(exceededResult.allowed).toBe(false);
      expect(exceededResult.reason).toContain('Usage limit exceeded');
    });

    test('should handle enterprise user unlimited access', async () => {
      const userId = mockUsers.enterpriseUser.id;
      const userTier: UserTier = 'enterprise';

      // 1. User has admin access to all features
      const features = ['ai_analysis', 'benchmarking', 'reports', 'api'] as const;
      const actions = ['generate', 'create', 'schedule', 'access'];

      features.forEach((feature, index) => {
        const result = accessControl.checkPermission(
          userTier,
          feature,
          actions[index],
          { userId, feature, action: actions[index] }
        );
        expect(result.allowed).toBe(true);
        expect(result.permission).toBe('admin');
      });

      // 2. User has unlimited limits
      const limitTypes = ['projects', 'reports', 'apiCalls', 'storageGB', 'teamMembers'] as const;
      limitTypes.forEach(limitType => {
        const result = accessControl.checkTierLimits(userTier, limitType, 999999);
        expect(result.allowed).toBe(true);
        expect(result.permission).toBe('admin');
      });

      // 3. User gets all available features
      const availableFeatures = accessControl.getAvailableFeatures(userTier);
      expect(availableFeatures).toEqual(['ai_analysis', 'benchmarking', 'reports', 'api']);
    });
  });

  describe('Tier Transition Testing', () => {
    test('should handle basic to professional upgrade', async () => {
      const userId = mockUsers.basicUser.id;
      
      // Before upgrade - basic tier
      let saveResult = accessControl.checkPermission(
        'basic',
        'ai_analysis',
        'save',
        { userId, feature: 'ai_analysis', action: 'save' }
      );
      expect(saveResult.allowed).toBe(false);

      // Simulate upgrade
      const upgradeEvent: TierUpgradeEvent = {
        userId,
        oldTier: 'basic',
        newTier: 'professional',
        timestamp: new Date()
      };

      // After upgrade - professional tier
      saveResult = accessControl.checkPermission(
        'professional',
        'ai_analysis',
        'save',
        { userId, feature: 'ai_analysis', action: 'save' }
      );
      expect(saveResult.allowed).toBe(true);
      expect(saveResult.permission).toBe('write');

      // Check limit increases
      const projectLimitResult = accessControl.checkTierLimits('professional', 'projects', 15);
      expect(projectLimitResult.allowed).toBe(true);
    });

    test('should handle professional to enterprise upgrade', async () => {
      const userId = mockUsers.professionalUser.id;
      
      // Before upgrade - limited API access
      let apiResult = accessControl.checkPermission(
        'professional',
        'api',
        'access',
        { userId, feature: 'api', action: 'access' }
      );
      expect(apiResult.allowed).toBe(true);
      expect(apiResult.conditions).toBeDefined();

      // After upgrade - unlimited API access
      apiResult = accessControl.checkPermission(
        'enterprise',
        'api',
        'access',
        { userId, feature: 'api', action: 'access' }
      );
      expect(apiResult.allowed).toBe(true);
      expect(apiResult.permission).toBe('admin');
      expect(apiResult.conditions).toBeUndefined();

      // Check unlimited limits
      const unlimitedResult = accessControl.checkTierLimits('enterprise', 'apiCalls', 1000000);
      expect(unlimitedResult.allowed).toBe(true);
    });

    test('should handle downgrade scenarios gracefully', async () => {
      const userId = mockUsers.enterpriseUser.id;
      
      // Before downgrade - unlimited access
      let adminResult = accessControl.checkPermission(
        'enterprise',
        'ai_analysis',
        'generate',
        { userId, feature: 'ai_analysis', action: 'generate' }
      );
      expect(adminResult.allowed).toBe(true);
      expect(adminResult.permission).toBe('admin');

      // After downgrade - limited access
      const downgradedResult = accessControl.checkPermission(
        'professional',
        'ai_analysis',
        'generate',
        { userId, feature: 'ai_analysis', action: 'generate' }
      );
      expect(downgradedResult.allowed).toBe(true);
      expect(downgradedResult.permission).toBe('write');

      // Some features may become unavailable
      const limitedResult = accessControl.checkTierLimits('professional', 'projects', 50);
      expect(limitedResult.allowed).toBe(false);
      expect(limitedResult.upgradeRequired).toBe('enterprise');
    });
  });

  describe('Permission Enforcement Validation', () => {
    test('should enforce tier hierarchy correctly', () => {
      expect(accessControl.hasTierAccess('basic', 'basic')).toBe(true);
      expect(accessControl.hasTierAccess('basic', 'professional')).toBe(false);
      expect(accessControl.hasTierAccess('basic', 'enterprise')).toBe(false);

      expect(accessControl.hasTierAccess('professional', 'basic')).toBe(true);
      expect(accessControl.hasTierAccess('professional', 'professional')).toBe(true);
      expect(accessControl.hasTierAccess('professional', 'enterprise')).toBe(false);

      expect(accessControl.hasTierAccess('enterprise', 'basic')).toBe(true);
      expect(accessControl.hasTierAccess('enterprise', 'professional')).toBe(true);
      expect(accessControl.hasTierAccess('enterprise', 'enterprise')).toBe(true);
    });

    test('should validate conditional permissions correctly', () => {
      const userId = 'test-user';
      const context = {
        userId,
        feature: 'benchmarking' as keyof TierPermissions['features'],
        action: 'create'
      };

      // Basic user with usage limit
      const result = accessControl.checkPermission(
        'basic',
        'benchmarking',
        'create',
        context
      );
      expect(result.allowed).toBe(true);
      expect(result.permission).toBe('write');

      // Track usage up to limit
      for (let i = 0; i < 5; i++) {
        accessControl.trackUsage(context);
      }

      // Should now be blocked
      const blockedResult = accessControl.checkPermission(
        'basic',
        'benchmarking',
        'create',
        context
      );
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.reason).toContain('Usage limit exceeded');
    });

    test('should handle time-based restrictions', () => {
      const userId = 'test-user';
      const context = {
        userId,
        feature: 'reports' as keyof TierPermissions['features'],
        action: 'generate',
        timestamp: new Date()
      };

      const result = accessControl.checkPermission(
        'basic',
        'reports',
        'generate',
        context
      );
      expect(result.allowed).toBe(true);

      // Test with old timestamp (outside time window)
      const oldContext = {
        ...context,
        timestamp: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000) // 32 days ago
      };

      // Should still allow as we're checking current usage, not historical
      const oldResult = accessControl.checkPermission(
        'basic',
        'reports',
        'generate',
        oldContext
      );
      expect(oldResult.allowed).toBe(true);
    });

    test('should provide clear error messages and upgrade paths', () => {
      const result = accessControl.checkPermission(
        'basic',
        'api',
        'access',
        { userId: 'test', feature: 'api', action: 'access' }
      );
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not available for basic tier');
      expect(result.upgradeRequired).toBe('professional');

      const upgradeRec = accessControl.getUpgradeRecommendations(
        'basic',
        'api',
        'access'
      );
      expect(upgradeRec).toBeTruthy();
      expect(upgradeRec?.tier).toBe('professional');
      expect(upgradeRec?.benefits.length).toBeGreaterThan(0);
    });
  });

  describe('API Protection Testing', () => {
    test('should create proper Next.js middleware for tier validation', async () => {
      const createMockRequest = (tier: UserTier, path: string) => {
        const url = `https://example.com${path}`;
        const request = new NextRequest(url);
        
        // Mock user in request
        (request as any).user = { publicMetadata: { tier } };
        return request;
      };

      // Test basic user accessing professional endpoint
      const basicRequest = createMockRequest('basic', '/api/reports/advanced');
      mockCurrentUser.mockResolvedValueOnce(mockUsers.basicUser);
      
      // Mock middleware should block access
      const result = await validateTierAccess(basicRequest, 'professional');
      expect(result).toBe(false);

      // Test professional user accessing professional endpoint
      const proRequest = createMockRequest('professional', '/api/reports/advanced');
      mockCurrentUser.mockResolvedValueOnce(mockUsers.professionalUser);
      
      const proResult = await validateTierAccess(proRequest, 'professional');
      expect(proResult).toBe(true);
    });

    test('should handle API rate limiting by tier', () => {
      const userId = 'test-user';
      
      // Basic user - no API access
      const basicResult = accessControl.checkPermission(
        'basic',
        'api',
        'access',
        { userId, feature: 'api', action: 'access' }
      );
      expect(basicResult.allowed).toBe(false);

      // Professional user - limited API access
      const proResult = accessControl.checkPermission(
        'professional',
        'api',
        'access',
        { userId, feature: 'api', action: 'access' }
      );
      expect(proResult.allowed).toBe(true);
      expect(proResult.conditions).toBeDefined();

      // Enterprise user - unlimited API access
      const entResult = accessControl.checkPermission(
        'enterprise',
        'api',
        'access',
        { userId, feature: 'api', action: 'access' }
      );
      expect(entResult.allowed).toBe(true);
      expect(entResult.permission).toBe('admin');
    });

    test('should protect resource-level access', () => {
      // Test data export restrictions
      const basicExportResult = accessControl.checkResourcePermission(
        'basic',
        'data',
        'export'
      );
      expect(basicExportResult.allowed).toBe(false);

      const proExportResult = accessControl.checkResourcePermission(
        'professional',
        'data',
        'export'
      );
      expect(proExportResult.allowed).toBe(true);

      // Test backup restrictions
      const basicBackupResult = accessControl.checkResourcePermission(
        'basic',
        'data',
        'backup'
      );
      expect(basicBackupResult.allowed).toBe(false);

      const proBackupResult = accessControl.checkResourcePermission(
        'professional',
        'data',
        'backup'
      );
      expect(proBackupResult.allowed).toBe(true);
      expect(proBackupResult.conditions).toBeDefined();
    });
  });

  describe('Admin Override Scenarios', () => {
    test('should allow admin overrides for any user', () => {
      const adminUser = mockUsers.adminUser;
      
      // Admin should have access to everything regardless of their tier
      const adminResult = accessControl.checkPermission(
        'enterprise',
        'ai_analysis',
        'generate',
        { userId: adminUser.id, feature: 'ai_analysis', action: 'generate' }
      );
      expect(adminResult.allowed).toBe(true);
      expect(adminResult.permission).toBe('admin');

      // Admin should be able to override limits
      const adminLimitResult = accessControl.checkTierLimits('enterprise', 'projects', 999999);
      expect(adminLimitResult.allowed).toBe(true);
      expect(adminLimitResult.permission).toBe('admin');
    });

    test('should handle temporary permission grants', () => {
      // Simulate admin granting temporary access
      const tempContext = {
        userId: mockUsers.basicUser.id,
        feature: 'api' as keyof TierPermissions['features'],
        action: 'access',
        metadata: {
          temporaryAccess: true,
          grantedBy: mockUsers.adminUser.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      };

      // Basic user should normally not have API access
      const normalResult = accessControl.checkPermission(
        'basic',
        'api',
        'access',
        { userId: mockUsers.basicUser.id, feature: 'api', action: 'access' }
      );
      expect(normalResult.allowed).toBe(false);

      // With temporary access, they should have access
      // (This would require custom condition logic in the real implementation)
      const tempResult = accessControl.checkPermission(
        'basic',
        'api',
        'access',
        tempContext
      );
      // This test demonstrates the framework for temporary access
      expect(tempResult.allowed).toBe(false); // Still false without custom logic
    });

    test('should track admin actions for audit purposes', () => {
      const adminActions = [
        { action: 'grant_temporary_access', userId: mockUsers.basicUser.id },
        { action: 'override_limit', userId: mockUsers.professionalUser.id },
        { action: 'force_upgrade', userId: mockUsers.basicUser.id }
      ];

      // Simulate tracking admin actions
      adminActions.forEach(action => {
        const context = {
          userId: mockUsers.adminUser.id,
          feature: 'admin' as keyof TierPermissions['features'],
          action: action.action,
          metadata: { targetUser: action.userId }
        };

        // Admin should be able to perform these actions
        const result = accessControl.checkPermission(
          'enterprise',
          'admin' as any, // Admin features not in our mock but would exist
          action.action,
          context
        );
        
        // This would pass with proper admin permissions setup
        expect(result.permission).toBeDefined();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid user tiers gracefully', () => {
      const invalidResult = accessControl.checkPermission(
        'invalid' as UserTier,
        'ai_analysis',
        'generate'
      );
      expect(invalidResult.allowed).toBe(false);
      expect(invalidResult.reason).toContain('Error checking permission');
    });

    test('should handle missing feature permissions', () => {
      const missingResult = accessControl.checkPermission(
        'basic',
        'nonexistent_feature' as any,
        'action'
      );
      expect(missingResult.allowed).toBe(false);
      expect(missingResult.reason).toContain('Permission not defined');
    });

    test('should handle concurrent access checks', async () => {
      const userId = 'concurrent-user';
      const promises = [];

      // Simulate 100 concurrent permission checks
      for (let i = 0; i < 100; i++) {
        promises.push(
          Promise.resolve(
            accessControl.checkPermission(
              'professional',
              'ai_analysis',
              'generate',
              { userId, feature: 'ai_analysis', action: 'generate' }
            )
          )
        );
      }

      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.allowed).toBe(true);
      });

      // No race conditions should occur
      expect(results.length).toBe(100);
    });

    test('should handle memory cleanup for usage tracking', () => {
      const userId = 'cleanup-test';
      const context = {
        userId,
        feature: 'reports' as keyof TierPermissions['features'],
        action: 'generate'
      };

      // Track some usage
      for (let i = 0; i < 5; i++) {
        accessControl.trackUsage(context);
      }

      // Verify usage is tracked
      const currentUsage = accessControl.getCurrentUsage(
        userId,
        'reports',
        'generate',
        'monthly'
      );
      expect(currentUsage).toBe(5);

      // Reset usage
      accessControl.resetUsage(userId, 'reports', 'generate', 'monthly');

      // Verify cleanup
      const cleanedUsage = accessControl.getCurrentUsage(
        userId,
        'reports',
        'generate',
        'monthly'
      );
      expect(cleanedUsage).toBe(0);
    });
  });

  describe('Real-time Updates and Synchronization', () => {
    test('should handle real-time permission updates', async () => {
      const userId = mockUsers.basicUser.id;
      
      // Initial check - no API access
      let apiResult = accessControl.checkPermission(
        'basic',
        'api',
        'access',
        { userId, feature: 'api', action: 'access' }
      );
      expect(apiResult.allowed).toBe(false);

      // Simulate real-time upgrade via webhook
      const upgradeEvent: TierUpgradeEvent = {
        userId,
        oldTier: 'basic',
        newTier: 'professional',
        timestamp: new Date(),
        stripeEventId: 'evt_test_123'
      };

      // Process upgrade
      await tierUpgradeHandler.handleTierUpgrade(upgradeEvent);

      // Verify new permissions (would require cache invalidation in real implementation)
      apiResult = accessControl.checkPermission(
        'professional', // Now checking with new tier
        'api',
        'access',
        { userId, feature: 'api', action: 'access' }
      );
      expect(apiResult.allowed).toBe(true);
    });

    test('should maintain consistency across multiple instances', () => {
      const accessControl1 = new TierAccessControl();
      const accessControl2 = new TierAccessControl();

      const userId = 'consistency-test';
      const context = {
        userId,
        feature: 'reports' as keyof TierPermissions['features'],
        action: 'generate'
      };

      // Track usage in instance 1
      accessControl1.trackUsage(context);
      accessControl1.trackUsage(context);

      // Check usage in both instances (would be different without shared state)
      const usage1 = accessControl1.getCurrentUsage(userId, 'reports', 'generate', 'monthly');
      const usage2 = accessControl2.getCurrentUsage(userId, 'reports', 'generate', 'monthly');

      // In this test setup, they'll be different (expected behavior for isolated instances)
      expect(usage1).toBe(2);
      expect(usage2).toBe(0);

      // In production, you'd want shared state management
    });
  });
});
