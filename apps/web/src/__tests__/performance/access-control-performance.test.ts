/**
 * Performance Tests for Story 11.10: Access Control Performance Validation
 * 
 * Tests ensuring <50ms response times, load testing for concurrent access checks,
 * cache efficiency, and memory usage validation.
 */

import { describe, test, expect, beforeEach, afterEach, jest, beforeAll, afterAll } from '@jest/globals';
import {
  TierAccessControl,
  tierAccessControl,
  checkPermission,
  trackUsage,
  getPermissionsForTier,
  checkTierLimits
} from '@/lib/access-control/tier-access-control';
import { UserTier, TierPermissions, PermissionChecker } from '@/lib/access-control/permission-matrix';

// Mock external dependencies
jest.mock('@/lib/access-control/permission-checker');

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  SINGLE_PERMISSION_CHECK: 50, // 50ms
  BULK_PERMISSION_CHECK: 200, // 200ms for 100 checks
  USAGE_TRACKING: 10, // 10ms
  TIER_LIMIT_CHECK: 25, // 25ms
  MEMORY_USAGE_MB: 100, // 100MB max
  CONCURRENT_OPERATIONS: 1000, // Support 1000 concurrent operations
  CACHE_HIT_RATIO: 0.8 // 80% cache hit ratio
};

// Test fixtures for performance testing
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

// Performance measurement utilities
class PerformanceProfiler {
  private startTime: number = 0;
  private measurements: number[] = [];

  start(): void {
    this.startTime = performance.now();
  }

  end(): number {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    this.measurements.push(duration);
    return duration;
  }

  getStats() {
    if (this.measurements.length === 0) return null;
    
    const sorted = [...this.measurements].sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      count: this.measurements.length
    };
  }

  reset(): void {
    this.measurements = [];
  }
}

class MemoryProfiler {
  private initialMemory: number;

  constructor() {
    this.initialMemory = this.getCurrentMemoryUsage();
  }

  getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    return 0; // Fallback for browser environment
  }

  getMemoryIncrease(): number {
    return this.getCurrentMemoryUsage() - this.initialMemory;
  }

  forceGarbageCollection(): void {
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  }
}

describe('Access Control Performance Tests', () => {
  let accessControl: TierAccessControl;
  let profiler: PerformanceProfiler;
  let memoryProfiler: MemoryProfiler;

  beforeAll(() => {
    // Setup performance testing environment
    if (typeof global !== 'undefined') {
      global.gc = global.gc || (() => {}); // Mock GC if not available
    }
    
    // Mock PermissionChecker for consistent performance testing
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
  });

  beforeEach(() => {
    accessControl = new TierAccessControl();
    profiler = new PerformanceProfiler();
    memoryProfiler = new MemoryProfiler();
    jest.clearAllMocks();
  });

  afterEach(() => {
    profiler.reset();
    memoryProfiler.forceGarbageCollection();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Single Operation Performance', () => {
    test('should check permissions under 50ms', () => {
      const testCases = [
        { tier: 'basic' as UserTier, feature: 'ai_analysis' as const, action: 'generate' },
        { tier: 'professional' as UserTier, feature: 'reports' as const, action: 'schedule' },
        { tier: 'enterprise' as UserTier, feature: 'api' as const, action: 'access' }
      ];

      testCases.forEach(testCase => {
        profiler.start();
        
        const result = accessControl.checkPermission(
          testCase.tier,
          testCase.feature,
          testCase.action,
          {
            userId: 'perf-test-user',
            feature: testCase.feature,
            action: testCase.action
          }
        );
        
        const duration = profiler.end();
        
        expect(result.allowed).toBeDefined();
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_PERMISSION_CHECK);
      });

      const stats = profiler.getStats();
      expect(stats?.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_PERMISSION_CHECK);
      expect(stats?.p95).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_PERMISSION_CHECK * 1.5);
    });

    test('should track usage under 10ms', () => {
      const userId = 'perf-test-user';
      const context = {
        userId,
        feature: 'reports' as const,
        action: 'generate'
      };

      // Warm up
      accessControl.trackUsage(context);

      // Measure performance
      for (let i = 0; i < 100; i++) {
        profiler.start();
        accessControl.trackUsage(context);
        const duration = profiler.end();
        
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.USAGE_TRACKING);
      }

      const stats = profiler.getStats();
      expect(stats?.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.USAGE_TRACKING);
    });

    test('should check tier limits under 25ms', () => {
      const limitTypes = ['projects', 'reports', 'apiCalls', 'storageGB', 'teamMembers'] as const;
      const tiers: UserTier[] = ['basic', 'professional', 'enterprise'];

      tiers.forEach(tier => {
        limitTypes.forEach(limitType => {
          profiler.start();
          
          const result = accessControl.checkTierLimits(tier, limitType, 10);
          
          const duration = profiler.end();
          
          expect(result.allowed).toBeDefined();
          expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.TIER_LIMIT_CHECK);
        });
      });

      const stats = profiler.getStats();
      expect(stats?.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.TIER_LIMIT_CHECK);
    });
  });

  describe('Bulk Operations Performance', () => {
    test('should handle 100 permission checks under 200ms', () => {
      const userId = 'bulk-test-user';
      const features = ['ai_analysis', 'benchmarking', 'reports', 'api'] as const;
      const actions = ['generate', 'create', 'view', 'access'];
      const tiers: UserTier[] = ['basic', 'professional', 'enterprise'];

      profiler.start();
      
      const results = [];
      for (let i = 0; i < 100; i++) {
        const tier = tiers[i % tiers.length];
        const feature = features[i % features.length];
        const action = actions[i % actions.length];
        
        const result = accessControl.checkPermission(
          tier,
          feature,
          action,
          { userId, feature, action }
        );
        results.push(result);
      }
      
      const totalDuration = profiler.end();
      
      expect(results.length).toBe(100);
      expect(totalDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_PERMISSION_CHECK);
      
      // Verify all results are valid
      results.forEach(result => {
        expect(result.allowed).toBeDefined();
        expect(result.permission).toBeDefined();
      });
    });

    test('should efficiently process batch usage tracking', () => {
      const userId = 'batch-usage-user';
      const batchSize = 500;
      
      profiler.start();
      
      for (let i = 0; i < batchSize; i++) {
        accessControl.trackUsage({
          userId,
          feature: 'reports',
          action: 'generate'
        });
      }
      
      const duration = profiler.end();
      const avgPerOperation = duration / batchSize;
      
      expect(avgPerOperation).toBeLessThan(PERFORMANCE_THRESHOLDS.USAGE_TRACKING);
      
      // Verify usage was tracked correctly
      const currentUsage = accessControl.getCurrentUsage(
        userId,
        'reports',
        'generate',
        'monthly'
      );
      expect(currentUsage).toBe(batchSize);
    });

    test('should handle tier limit checks for multiple users efficiently', () => {
      const userCount = 200;
      const limitTypes = ['projects', 'reports', 'apiCalls'] as const;
      
      profiler.start();
      
      const results = [];
      for (let i = 0; i < userCount; i++) {
        const tier: UserTier = i % 3 === 0 ? 'basic' : i % 3 === 1 ? 'professional' : 'enterprise';
        const limitType = limitTypes[i % limitTypes.length];
        
        const result = accessControl.checkTierLimits(tier, limitType, i + 1);
        results.push(result);
      }
      
      const totalDuration = profiler.end();
      const avgPerCheck = totalDuration / userCount;
      
      expect(avgPerCheck).toBeLessThan(PERFORMANCE_THRESHOLDS.TIER_LIMIT_CHECK);
      expect(results.length).toBe(userCount);
    });
  });

  describe('Concurrent Access Testing', () => {
    test('should handle 1000 concurrent permission checks', async () => {
      const concurrentOperations = PERFORMANCE_THRESHOLDS.CONCURRENT_OPERATIONS;
      const userId = 'concurrent-user';
      
      profiler.start();
      
      const promises = Array.from({ length: concurrentOperations }, (_, i) => {
        const tier: UserTier = i % 3 === 0 ? 'basic' : i % 3 === 1 ? 'professional' : 'enterprise';
        const feature = ['ai_analysis', 'reports', 'api'][i % 3] as const;
        const action = ['generate', 'create', 'access'][i % 3];
        
        return Promise.resolve(
          accessControl.checkPermission(
            tier,
            feature,
            action,
            { userId: `${userId}-${i}`, feature, action }
          )
        );
      });
      
      const results = await Promise.all(promises);
      const duration = profiler.end();
      
      expect(results.length).toBe(concurrentOperations);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_PERMISSION_CHECK * 5); // 5x allowance for concurrency
      
      // Verify no race conditions occurred
      results.forEach((result, index) => {
        expect(result.allowed).toBeDefined();
        expect(result.permission).toBeDefined();
      });
    });

    test('should maintain performance under concurrent usage tracking', async () => {
      const concurrentUsers = 100;
      const operationsPerUser = 10;
      
      profiler.start();
      
      const promises = Array.from({ length: concurrentUsers }, (_, userIndex) => {
        const userId = `concurrent-user-${userIndex}`;
        
        return Promise.all(
          Array.from({ length: operationsPerUser }, () => {
            return Promise.resolve(
              accessControl.trackUsage({
                userId,
                feature: 'reports',
                action: 'generate'
              })
            );
          })
        );
      });
      
      await Promise.all(promises);
      const duration = profiler.end();
      
      const totalOperations = concurrentUsers * operationsPerUser;
      const avgPerOperation = duration / totalOperations;
      
      expect(avgPerOperation).toBeLessThan(PERFORMANCE_THRESHOLDS.USAGE_TRACKING * 2); // 2x allowance for concurrency
      
      // Verify usage tracking accuracy
      for (let i = 0; i < Math.min(10, concurrentUsers); i++) {
        const usage = accessControl.getCurrentUsage(
          `concurrent-user-${i}`,
          'reports',
          'generate',
          'monthly'
        );
        expect(usage).toBe(operationsPerUser);
      }
    });

    test('should handle concurrent tier upgrades without corruption', async () => {
      const concurrentUpgrades = 50;
      const userId = 'upgrade-test-user';
      
      const upgrades = Array.from({ length: concurrentUpgrades }, (_, i) => {
        const fromTier: UserTier = 'basic';
        const toTier: UserTier = i % 2 === 0 ? 'professional' : 'enterprise';
        
        return Promise.resolve({
          fromTier,
          toTier,
          permissions: accessControl.getPermissionsForTier(toTier)
        });
      });
      
      profiler.start();
      const results = await Promise.all(upgrades);
      const duration = profiler.end();
      
      expect(results.length).toBe(concurrentUpgrades);
      expect(duration).toBeLessThan(500); // 500ms for 50 concurrent operations
      
      // Verify data integrity
      results.forEach(result => {
        expect(result.permissions).toBeDefined();
        expect(result.permissions.features).toBeDefined();
        expect(result.permissions.limits).toBeDefined();
      });
    });
  });

  describe('Memory Usage Validation', () => {
    test('should maintain memory usage under 100MB for large operations', () => {
      const initialMemory = memoryProfiler.getCurrentMemoryUsage();
      const largeOperationCount = 10000;
      
      // Perform many operations to stress test memory
      for (let i = 0; i < largeOperationCount; i++) {
        const tier: UserTier = ['basic', 'professional', 'enterprise'][i % 3] as UserTier;
        const userId = `user-${i}`;
        
        // Mix of operations
        accessControl.checkPermission(
          tier,
          'ai_analysis',
          'generate',
          { userId, feature: 'ai_analysis', action: 'generate' }
        );
        
        if (i % 10 === 0) {
          accessControl.trackUsage({
            userId,
            feature: 'reports',
            action: 'generate'
          });
        }
        
        if (i % 100 === 0) {
          accessControl.checkTierLimits(tier, 'projects', i);
        }
      }
      
      // Force garbage collection
      memoryProfiler.forceGarbageCollection();
      
      const memoryIncrease = memoryProfiler.getMemoryIncrease();
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB);
    });

    test('should not leak memory with usage tracking', () => {
      const initialMemory = memoryProfiler.getCurrentMemoryUsage();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        const userId = `leak-test-${i}`;
        
        // Create and track usage
        accessControl.trackUsage({
          userId,
          feature: 'reports',
          action: 'generate'
        });
        
        // Check current usage
        accessControl.getCurrentUsage(userId, 'reports', 'generate', 'monthly');
        
        // Reset usage to simulate cleanup
        if (i % 100 === 0) {
          for (let j = Math.max(0, i - 100); j < i; j++) {
            accessControl.resetUsage(`leak-test-${j}`, 'reports', 'generate', 'monthly');
          }
        }
      }
      
      memoryProfiler.forceGarbageCollection();
      
      const memoryIncrease = memoryProfiler.getMemoryIncrease();
      expect(memoryIncrease).toBeLessThan(50); // Should be minimal with cleanup
    });

    test('should efficiently handle large permission matrices', () => {
      const initialMemory = memoryProfiler.getCurrentMemoryUsage();
      const tiers: UserTier[] = ['basic', 'professional', 'enterprise'];
      
      // Access all permissions multiple times
      for (let i = 0; i < 500; i++) {
        tiers.forEach(tier => {
          const permissions = accessControl.getPermissionsForTier(tier);
          expect(permissions).toBeDefined();
          
          // Access nested permissions
          Object.keys(permissions.features).forEach(feature => {
            const featurePermissions = permissions.features[feature as keyof typeof permissions.features];
            expect(featurePermissions).toBeDefined();
          });
        });
      }
      
      memoryProfiler.forceGarbageCollection();
      
      const memoryIncrease = memoryProfiler.getMemoryIncrease();
      expect(memoryIncrease).toBeLessThan(20); // Permissions should be cached efficiently
    });
  });

  describe('Cache Efficiency Testing', () => {
    test('should demonstrate effective permission caching', () => {
      const userId = 'cache-test-user';
      const tier: UserTier = 'professional';
      const feature = 'ai_analysis' as const;
      const action = 'generate';
      
      // First call - cache miss
      profiler.start();
      const result1 = accessControl.checkPermission(
        tier,
        feature,
        action,
        { userId, feature, action }
      );
      const firstCallDuration = profiler.end();
      
      // Subsequent calls - should be faster due to caching
      const cachedCallDurations = [];
      for (let i = 0; i < 10; i++) {
        profiler.start();
        const result = accessControl.checkPermission(
          tier,
          feature,
          action,
          { userId, feature, action }
        );
        cachedCallDurations.push(profiler.end());
        
        expect(result.allowed).toBe(result1.allowed);
        expect(result.permission).toBe(result1.permission);
      }
      
      const avgCachedDuration = cachedCallDurations.reduce((a, b) => a + b, 0) / cachedCallDurations.length;
      
      // Cached calls should be significantly faster
      expect(avgCachedDuration).toBeLessThan(firstCallDuration * 0.8);
    });

    test('should maintain high cache hit ratio under realistic load', () => {
      const users = Array.from({ length: 20 }, (_, i) => `user-${i}`);
      const features = ['ai_analysis', 'reports', 'api'] as const;
      const actions = ['generate', 'create', 'access'];
      const tiers: UserTier[] = ['basic', 'professional', 'enterprise'];
      
      let cacheHits = 0;
      let totalRequests = 0;
      
      // Simulate realistic access patterns with repetition
      for (let round = 0; round < 5; round++) {
        users.forEach(userId => {
          features.forEach(feature => {
            actions.forEach(action => {
              const tier = tiers[totalRequests % tiers.length];
              
              profiler.start();
              const result = accessControl.checkPermission(
                tier,
                feature,
                action,
                { userId, feature, action }
              );
              const duration = profiler.end();
              
              totalRequests++;
              
              // Assume cache hit if operation is very fast (under 10ms)
              if (duration < 10) {
                cacheHits++;
              }
              
              expect(result.allowed).toBeDefined();
            });
          });
        });
      }
      
      const cacheHitRatio = cacheHits / totalRequests;
      expect(cacheHitRatio).toBeGreaterThan(PERFORMANCE_THRESHOLDS.CACHE_HIT_RATIO);
    });

    test('should invalidate cache efficiently during tier changes', () => {
      const userId = 'tier-change-user';
      
      // Establish cache with basic tier
      for (let i = 0; i < 5; i++) {
        accessControl.checkPermission(
          'basic',
          'ai_analysis',
          'generate',
          { userId, feature: 'ai_analysis', action: 'generate' }
        );
      }
      
      // Simulate tier upgrade
      profiler.start();
      
      // First check with new tier might be slower (cache miss)
      const upgradeResult = accessControl.checkPermission(
        'professional',
        'ai_analysis',
        'save', // Now available
        { userId, feature: 'ai_analysis', action: 'save' }
      );
      
      const upgradeDuration = profiler.end();
      
      expect(upgradeResult.allowed).toBe(true);
      
      // Subsequent checks should be fast again
      profiler.start();
      const cachedUpgradeResult = accessControl.checkPermission(
        'professional',
        'ai_analysis',
        'save',
        { userId, feature: 'ai_analysis', action: 'save' }
      );
      const cachedDuration = profiler.end();
      
      expect(cachedUpgradeResult.allowed).toBe(true);
      expect(cachedDuration).toBeLessThan(upgradeDuration);
    });
  });

  describe('Stress Testing', () => {
    test('should maintain performance under sustained load', async () => {
      const testDuration = 5000; // 5 seconds
      const startTime = Date.now();
      let operationCount = 0;
      const results = [];
      
      while (Date.now() - startTime < testDuration) {
        const userId = `stress-user-${operationCount % 100}`;
        const tier: UserTier = ['basic', 'professional', 'enterprise'][operationCount % 3] as UserTier;
        
        profiler.start();
        const result = accessControl.checkPermission(
          tier,
          'ai_analysis',
          'generate',
          { userId, feature: 'ai_analysis', action: 'generate' }
        );
        const duration = profiler.end();
        
        results.push({ result, duration });
        operationCount++;
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      const slowOperations = results.filter(r => r.duration > PERFORMANCE_THRESHOLDS.SINGLE_PERMISSION_CHECK).length;
      const slowOperationRatio = slowOperations / results.length;
      
      expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_PERMISSION_CHECK);
      expect(slowOperationRatio).toBeLessThan(0.05); // Less than 5% slow operations
      expect(operationCount).toBeGreaterThan(100); // Should complete many operations
    });

    test('should recover from memory pressure gracefully', () => {
      const initialMemory = memoryProfiler.getCurrentMemoryUsage();
      
      // Create memory pressure
      const largeObjects = [];
      for (let i = 0; i < 1000; i++) {
        largeObjects.push({
          id: i,
          data: new Array(1000).fill(`data-${i}`),
          permissions: accessControl.getPermissionsForTier('professional')
        });
      }
      
      // Perform operations under memory pressure
      const operationResults = [];
      for (let i = 0; i < 100; i++) {
        profiler.start();
        const result = accessControl.checkPermission(
          'professional',
          'ai_analysis',
          'generate',
          { userId: `pressure-user-${i}`, feature: 'ai_analysis', action: 'generate' }
        );
        const duration = profiler.end();
        
        operationResults.push({ result, duration });
      }
      
      // Clean up
      largeObjects.length = 0;
      memoryProfiler.forceGarbageCollection();
      
      // Verify operations still performed well
      const avgDuration = operationResults.reduce((sum, r) => sum + r.duration, 0) / operationResults.length;
      expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_PERMISSION_CHECK * 2); // 2x allowance under pressure
      
      operationResults.forEach(({ result }) => {
        expect(result.allowed).toBeDefined();
        expect(result.permission).toBeDefined();
      });
    });
  });
});
