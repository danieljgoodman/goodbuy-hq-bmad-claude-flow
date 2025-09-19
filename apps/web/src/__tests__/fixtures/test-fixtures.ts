/**
 * Test Fixtures and Utilities for Story 11.10 Access Control Testing
 * 
 * Provides consistent test data, mocks, and utilities for all access control tests.
 */

import { UserTier, TierPermissions, Permission } from '@/lib/access-control/permission-matrix';
import { SubscriptionTier } from '@/types/subscription';
import { TierUpgradeEvent } from '@/lib/subscription/tier-upgrade-handler';

// User Test Fixtures
export const testUsers = {
  basic: {
    id: 'user_basic_test_001',
    email: 'basic.user@test.com',
    emailAddresses: [{ emailAddress: 'basic.user@test.com' }],
    publicMetadata: { 
      tier: 'basic' as UserTier,
      role: 'user',
      createdAt: '2024-01-01T00:00:00Z'
    },
    privateMetadata: { 
      stripeCustomerId: 'cus_basic_test_001',
      subscriptionId: 'sub_basic_test_001'
    }
  },
  professional: {
    id: 'user_pro_test_002',
    email: 'pro.user@test.com',
    emailAddresses: [{ emailAddress: 'pro.user@test.com' }],
    publicMetadata: { 
      tier: 'professional' as UserTier,
      role: 'user',
      createdAt: '2024-01-15T00:00:00Z'
    },
    privateMetadata: { 
      stripeCustomerId: 'cus_pro_test_002',
      subscriptionId: 'sub_pro_test_002'
    }
  },
  enterprise: {
    id: 'user_ent_test_003',
    email: 'enterprise.user@test.com',
    emailAddresses: [{ emailAddress: 'enterprise.user@test.com' }],
    publicMetadata: { 
      tier: 'enterprise' as UserTier,
      role: 'user',
      createdAt: '2024-02-01T00:00:00Z'
    },
    privateMetadata: { 
      stripeCustomerId: 'cus_ent_test_003',
      subscriptionId: 'sub_ent_test_003'
    }
  },
  admin: {
    id: 'user_admin_test_999',
    email: 'admin@goodbuy.com',
    emailAddresses: [{ emailAddress: 'admin@goodbuy.com' }],
    publicMetadata: { 
      tier: 'enterprise' as UserTier,
      role: 'admin',
      createdAt: '2023-12-01T00:00:00Z'
    },
    privateMetadata: { 
      stripeCustomerId: 'cus_admin_test_999',
      subscriptionId: 'sub_admin_test_999',
      adminPermissions: ['user_management', 'tier_override', 'system_access']
    }
  },
  suspended: {
    id: 'user_suspended_test_666',
    email: 'suspended@test.com',
    emailAddresses: [{ emailAddress: 'suspended@test.com' }],
    publicMetadata: { 
      tier: 'basic' as UserTier,
      role: 'user',
      status: 'suspended',
      createdAt: '2024-01-10T00:00:00Z'
    },
    privateMetadata: { 
      stripeCustomerId: 'cus_suspended_test_666',
      suspendedAt: '2024-03-01T00:00:00Z',
      suspensionReason: 'policy_violation'
    }
  }
};

// Permission Test Fixtures
export const testPermissions: Record<UserTier, TierPermissions> = {
  basic: {
    features: {
      ai_analysis: {
        generate: 'read',
        save: 'none',
        share: 'none',
        export: 'none'
      },
      benchmarking: {
        create: { 
          permission: 'write', 
          usageLimit: 5, 
          timeRestriction: 'monthly' 
        },
        view: 'read',
        compare: 'none',
        export: 'none'
      },
      reports: {
        generate: { 
          permission: 'write', 
          usageLimit: 10, 
          timeRestriction: 'monthly' 
        },
        schedule: 'none',
        export: 'none',
        share: 'none'
      },
      api: {
        access: 'none',
        rate_limit: 'none',
        webhook: 'none'
      },
      collaboration: {
        invite: 'none',
        share: 'none',
        comment: 'read'
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
        import: { 
          permission: 'write', 
          usageLimit: 1000, 
          timeRestriction: 'monthly' 
        },
        export: 'none',
        backup: 'none'
      },
      integrations: {
        connect: 'none',
        configure: 'none',
        manage: 'none'
      }
    },
    limits: {
      projects: 3,
      reports: 10,
      apiCalls: 0,
      storageGB: 1,
      teamMembers: 1,
      dataRetentionDays: 30,
      concurrentSessions: 1
    }
  },
  professional: {
    features: {
      ai_analysis: {
        generate: 'write',
        save: 'write',
        share: { 
          permission: 'write', 
          usageLimit: 50, 
          timeRestriction: 'monthly' 
        },
        export: 'write'
      },
      benchmarking: {
        create: 'write',
        view: 'read',
        compare: 'write',
        export: 'write'
      },
      reports: {
        generate: 'write',
        schedule: { 
          permission: 'write', 
          usageLimit: 20, 
          timeRestriction: 'monthly' 
        },
        export: 'write',
        share: 'write'
      },
      api: {
        access: { 
          permission: 'write', 
          usageLimit: 10000, 
          timeRestriction: 'monthly' 
        },
        rate_limit: 'write',
        webhook: 'write'
      },
      collaboration: {
        invite: { 
          permission: 'write', 
          usageLimit: 10, 
          timeRestriction: 'monthly' 
        },
        share: 'write',
        comment: 'write'
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
        backup: { 
          permission: 'write', 
          usageLimit: 10, 
          timeRestriction: 'monthly' 
        }
      },
      integrations: {
        connect: 'write',
        configure: 'write',
        manage: 'write'
      }
    },
    limits: {
      projects: 25,
      reports: 100,
      apiCalls: 10000,
      storageGB: 10,
      teamMembers: 5,
      dataRetentionDays: 365,
      concurrentSessions: 3
    }
  },
  enterprise: {
    features: {
      ai_analysis: {
        generate: 'admin',
        save: 'admin',
        share: 'admin',
        export: 'admin'
      },
      benchmarking: {
        create: 'admin',
        view: 'admin',
        compare: 'admin',
        export: 'admin'
      },
      reports: {
        generate: 'admin',
        schedule: 'admin',
        export: 'admin',
        share: 'admin'
      },
      api: {
        access: 'admin',
        rate_limit: 'admin',
        webhook: 'admin'
      },
      collaboration: {
        invite: 'admin',
        share: 'admin',
        comment: 'admin'
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
      },
      integrations: {
        connect: 'admin',
        configure: 'admin',
        manage: 'admin'
      }
    },
    limits: {
      projects: -1,
      reports: -1,
      apiCalls: -1,
      storageGB: -1,
      teamMembers: -1,
      dataRetentionDays: -1,
      concurrentSessions: -1
    }
  }
};

// Security Test Payloads
export const securityTestPayloads = {
  sqlInjection: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "'; DELETE FROM projects WHERE user_id = '1'; --",
    "' UNION SELECT * FROM admin_users --",
    "'; UPDATE users SET tier = 'enterprise' WHERE id = '1'; --",
    "1; INSERT INTO admin_users (username, password) VALUES ('hacker', 'password'); --",
    "' OR 1=1; SELECT * FROM sensitive_data; --"
  ],
  xssPayloads: [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "javascript:alert('XSS')",
    "<svg onload=alert('XSS')>",
    "<iframe src='javascript:alert(\"XSS\")'></iframe>",
    "<div onmouseover='alert(\"XSS\")'></div>",
    "';alert(String.fromCharCode(88,83,83))//"
  ],
  pathTraversal: [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\config\\sam",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "....//....//....//etc/passwd",
    "..%252f..%252f..%252fetc%252fpasswd",
    "..%c0%af..%c0%af..%c0%afetc%c0%afpasswd"
  ],
  tierBypassAttempts: [
    { tier: 'enterprise', token: 'fake_admin_token', method: 'header_injection' },
    { tier: 'professional', userId: '../../../admin', method: 'path_traversal' },
    { tier: 'basic', metadata: { tier: 'enterprise' }, method: 'metadata_manipulation' },
    { tier: 'enterprise', bypass: true, method: 'parameter_injection' },
    { tier: 'admin', elevation: 'system', method: 'privilege_escalation' }
  ]
};

// Stripe Webhook Test Fixtures
export const stripeWebhookFixtures = {
  subscriptionUpdated: {
    id: 'evt_test_upgrade_001',
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_test_001',
        customer: 'cus_basic_test_001',
        items: {
          data: [{
            price: {
              id: 'price_professional_monthly',
              nickname: 'Professional Plan'
            }
          }]
        },
        status: 'active'
      },
      previous_attributes: {
        items: {
          data: [{
            price: {
              id: 'price_basic_monthly',
              nickname: 'Basic Plan'
            }
          }]
        }
      }
    }
  },
  subscriptionCreated: {
    id: 'evt_test_new_002',
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_test_002',
        customer: 'cus_pro_test_002',
        items: {
          data: [{
            price: {
              id: 'price_enterprise_monthly',
              nickname: 'Enterprise Plan'
            }
          }]
        },
        status: 'active'
      }
    }
  },
  subscriptionDeleted: {
    id: 'evt_test_cancel_003',
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: 'sub_test_003',
        customer: 'cus_ent_test_003',
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000)
      }
    }
  },
  paymentFailed: {
    id: 'evt_test_payment_fail_004',
    type: 'invoice.payment_failed',
    data: {
      object: {
        id: 'in_test_004',
        customer: 'cus_pro_test_002',
        subscription: 'sub_test_002',
        amount_due: 2900,
        attempt_count: 2
      }
    }
  }
};

// Upgrade Event Test Fixtures
export const upgradeEventFixtures: Record<string, TierUpgradeEvent> = {
  basicToPro: {
    userId: testUsers.basic.id,
    oldTier: 'basic',
    newTier: 'professional',
    timestamp: new Date('2024-03-15T10:00:00Z'),
    stripeEventId: stripeWebhookFixtures.subscriptionUpdated.id
  },
  proToEnterprise: {
    userId: testUsers.professional.id,
    oldTier: 'professional',
    newTier: 'enterprise',
    timestamp: new Date('2024-03-16T11:00:00Z'),
    stripeEventId: stripeWebhookFixtures.subscriptionCreated.id
  },
  enterpriseToPro: {
    userId: testUsers.enterprise.id,
    oldTier: 'enterprise',
    newTier: 'professional',
    timestamp: new Date('2024-03-17T12:00:00Z'),
    stripeEventId: 'evt_test_downgrade_001'
  },
  proToBasic: {
    userId: testUsers.professional.id,
    oldTier: 'professional',
    newTier: 'basic',
    timestamp: new Date('2024-03-18T13:00:00Z'),
    stripeEventId: stripeWebhookFixtures.subscriptionDeleted.id
  }
};

// Performance Test Configuration
export const performanceThresholds = {
  singlePermissionCheck: 50, // 50ms
  bulkPermissionCheck: 200, // 200ms for 100 checks
  usageTracking: 10, // 10ms
  tierLimitCheck: 25, // 25ms
  memoryUsageMB: 100, // 100MB max
  concurrentOperations: 1000, // Support 1000 concurrent ops
  cacheHitRatio: 0.8, // 80% cache hit ratio
  apiResponseTime: 500, // 500ms for API calls
  databaseQueryTime: 100 // 100ms for DB queries
};

// Test Utilities
export class TestUtils {
  /**
   * Generate test user with specific tier
   */
  static generateTestUser(tier: UserTier, overrides: Partial<typeof testUsers.basic> = {}) {
    const baseUser = testUsers[tier] || testUsers.basic;
    const timestamp = new Date().toISOString();
    
    return {
      ...baseUser,
      id: `user_${tier}_test_${Date.now()}`,
      email: `test.${tier}.${Date.now()}@example.com`,
      publicMetadata: {
        ...baseUser.publicMetadata,
        createdAt: timestamp
      },
      privateMetadata: {
        ...baseUser.privateMetadata,
        stripeCustomerId: `cus_${tier}_test_${Date.now()}`,
        subscriptionId: `sub_${tier}_test_${Date.now()}`
      },
      ...overrides
    };
  }

  /**
   * Generate random usage context for testing
   */
  static generateUsageContext(userId: string, feature: string, action: string) {
    return {
      userId,
      feature: feature as keyof TierPermissions['features'],
      action,
      timestamp: new Date(),
      metadata: {
        sessionId: `session_${Date.now()}`,
        userAgent: 'Mozilla/5.0 (Test Browser)',
        ipAddress: '127.0.0.1',
        requestId: `req_${Date.now()}`
      }
    };
  }

  /**
   * Generate malicious request for security testing
   */
  static generateMaliciousRequest(payload: string, type: 'sql' | 'xss' | 'path' = 'sql') {
    const baseRequest = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Malicious Bot/1.0'
      }
    };

    switch (type) {
      case 'sql':
        return {
          ...baseRequest,
          body: JSON.stringify({
            userId: payload,
            query: payload,
            filter: payload
          })
        };
      case 'xss':
        return {
          ...baseRequest,
          body: JSON.stringify({
            comment: payload,
            description: payload,
            name: payload
          })
        };
      case 'path':
        return {
          ...baseRequest,
          body: JSON.stringify({
            filePath: payload,
            exportPath: payload,
            configPath: payload
          })
        };
      default:
        return baseRequest;
    }
  }

  /**
   * Create mock Stripe webhook event
   */
  static createMockStripeWebhook(eventType: string, customerId: string, data: any = {}) {
    return {
      id: `evt_test_${Date.now()}`,
      type: eventType,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `obj_${Date.now()}`,
          customer: customerId,
          ...data
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: `req_${Date.now()}`,
        idempotency_key: null
      }
    };
  }

  /**
   * Simulate concurrent operations for testing
   */
  static async simulateConcurrentOperations<T>(
    operation: () => Promise<T>,
    count: number = 100
  ): Promise<T[]> {
    const promises = Array.from({ length: count }, () => operation());
    return Promise.all(promises);
  }

  /**
   * Measure operation performance
   */
  static async measurePerformance<T>(
    operation: () => Promise<T> | T,
    iterations: number = 1
  ): Promise<{ result: T; avgTime: number; minTime: number; maxTime: number }> {
    const times: number[] = [];
    let result: T;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      result = await operation();
      const end = performance.now();
      times.push(end - start);
    }

    return {
      result: result!,
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times)
    };
  }

  /**
   * Generate load test scenario
   */
  static generateLoadTestScenario(userCount: number, operationsPerUser: number) {
    const scenarios = [];
    
    for (let userId = 0; userId < userCount; userId++) {
      const user = this.generateTestUser(
        ['basic', 'professional', 'enterprise'][userId % 3] as UserTier
      );
      
      for (let opId = 0; opId < operationsPerUser; opId++) {
        scenarios.push({
          userId: user.id,
          tier: user.publicMetadata.tier,
          operation: {
            feature: ['ai_analysis', 'reports', 'api'][opId % 3],
            action: ['generate', 'create', 'access'][opId % 3]
          },
          timestamp: new Date(Date.now() + (userId * operationsPerUser + opId) * 100)
        });
      }
    }
    
    return scenarios;
  }

  /**
   * Validate test results against thresholds
   */
  static validatePerformance(
    measurements: { avgTime: number; maxTime: number },
    threshold: number,
    operation: string
  ): { passed: boolean; message: string } {
    const passed = measurements.avgTime < threshold && measurements.maxTime < threshold * 2;
    
    return {
      passed,
      message: passed 
        ? `${operation} performance passed: avg ${measurements.avgTime.toFixed(2)}ms, max ${measurements.maxTime.toFixed(2)}ms`
        : `${operation} performance failed: avg ${measurements.avgTime.toFixed(2)}ms (threshold: ${threshold}ms), max ${measurements.maxTime.toFixed(2)}ms`
    };
  }

  /**
   * Clean up test data and reset state
   */
  static async cleanup() {
    // Reset any global state
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
    
    // Clear any test caches
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  }
}

// Export all fixtures as default for easy importing
export default {
  users: testUsers,
  permissions: testPermissions,
  security: securityTestPayloads,
  stripe: stripeWebhookFixtures,
  upgrades: upgradeEventFixtures,
  performance: performanceThresholds,
  utils: TestUtils
};
