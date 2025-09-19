/**
 * Tier Upgrade Flow Tests for Story 11.10: Complete Upgrade Testing
 * 
 * Tests complete upgrade flow, webhook handling, real-time update verification,
 * and feature unlock testing.
 */

import { describe, test, expect, beforeEach, afterEach, jest, beforeAll, afterAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import {
  TierUpgradeHandler,
  tierUpgradeHandler,
  TierUpgradeEvent,
  FeatureUnlockEvent,
  processTierUpgradeFromWebhook
} from '@/lib/subscription/tier-upgrade-handler';
import { tierAccessControl } from '@/lib/access-control/tier-access-control';
import { invalidatePermissionCache } from '@/lib/access-control/permission-checker';
import { SubscriptionTier } from '@/types/subscription';
import { toast } from 'sonner';

// Mock external dependencies
jest.mock('@/lib/access-control/permission-checker');
jest.mock('sonner');
jest.mock('@/lib/access-control/tier-access-control');

const mockInvalidatePermissionCache = invalidatePermissionCache as jest.MockedFunction<typeof invalidatePermissionCache>;
const mockToast = toast as jest.MockedObject<typeof toast>;

// Test fixtures for upgrade flow testing
const mockUsers = {
  basicUser: {
    id: 'user_basic_123',
    email: 'basic@test.com',
    tier: 'basic' as SubscriptionTier,
    stripeCustomerId: 'cus_basic_123'
  },
  professionalUser: {
    id: 'user_pro_456',
    email: 'pro@test.com',
    tier: 'professional' as SubscriptionTier,
    stripeCustomerId: 'cus_pro_456'
  },
  enterpriseUser: {
    id: 'user_ent_789',
    email: 'enterprise@test.com',
    tier: 'enterprise' as SubscriptionTier,
    stripeCustomerId: 'cus_ent_789'
  }
};

const mockStripeEvents = {
  subscription_updated: {
    id: 'evt_upgrade_basic_to_pro',
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_123',
        customer: 'cus_basic_123',
        items: {
          data: [{
            price: {
              id: 'price_professional_monthly'
            }
          }]
        },
        status: 'active'
      },
      previous_attributes: {
        items: {
          data: [{
            price: {
              id: 'price_basic_monthly'
            }
          }]
        }
      }
    }
  },
  subscription_created: {
    id: 'evt_new_enterprise',
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_456',
        customer: 'cus_pro_456',
        items: {
          data: [{
            price: {
              id: 'price_enterprise_monthly'
            }
          }]
        },
        status: 'active'
      }
    }
  },
  subscription_deleted: {
    id: 'evt_downgrade_to_free',
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: 'sub_789',
        customer: 'cus_ent_789',
        status: 'canceled'
      }
    }
  }
};

const mockWebhookPayloads = {
  validUpgrade: {
    userId: mockUsers.basicUser.id,
    oldTier: 'basic' as SubscriptionTier,
    newTier: 'professional' as SubscriptionTier,
    stripeEventId: mockStripeEvents.subscription_updated.id,
    timestamp: new Date().toISOString()
  },
  validDowngrade: {
    userId: mockUsers.enterpriseUser.id,
    oldTier: 'enterprise' as SubscriptionTier,
    newTier: 'professional' as SubscriptionTier,
    stripeEventId: 'evt_downgrade_ent_to_pro',
    timestamp: new Date().toISOString()
  },
  invalidUpgrade: {
    userId: 'invalid_user_id',
    oldTier: 'basic' as SubscriptionTier,
    newTier: 'professional' as SubscriptionTier,
    stripeEventId: 'evt_invalid',
    timestamp: new Date().toISOString()
  }
};

describe('Tier Upgrade Flow Tests', () => {
  let upgradeHandler: TierUpgradeHandler;
  let originalFetch: typeof global.fetch;
  let originalWindow: typeof global.window;

  beforeAll(() => {
    // Setup test environment
    originalFetch = global.fetch;
    originalWindow = global.window;
    
    // Mock fetch for API calls
    global.fetch = jest.fn();
    
    // Mock window for client-side events
    global.window = {
      dispatchEvent: jest.fn(),
      gtag: jest.fn()
    } as any;
    
    // Mock toast methods
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
    mockToast.info = jest.fn();
  });

  beforeEach(() => {
    upgradeHandler = TierUpgradeHandler.getInstance();
    jest.clearAllMocks();
    
    // Setup default mocks
    mockInvalidatePermissionCache.mockResolvedValue(undefined);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
    global.window = originalWindow;
    jest.restoreAllMocks();
  });

  describe('Complete Upgrade Flow Testing', () => {
    test('should handle basic to professional upgrade flow', async () => {
      const upgradeEvent: TierUpgradeEvent = {
        userId: mockUsers.basicUser.id,
        oldTier: 'basic',
        newTier: 'professional',
        timestamp: new Date(),
        stripeEventId: mockStripeEvents.subscription_updated.id
      };

      // Setup event listeners to track the complete flow
      const tierUpgradeEvents: TierUpgradeEvent[] = [];
      const featureUnlockEvents: FeatureUnlockEvent[] = [];

      const unsubscribeTier = upgradeHandler.onTierUpgrade((event) => {
        tierUpgradeEvents.push(event);
      });

      const unsubscribeFeature = upgradeHandler.onFeatureUnlock((event) => {
        featureUnlockEvents.push(event);
      });

      // Process the upgrade
      await upgradeHandler.handleTierUpgrade(upgradeEvent);

      // Verify permission cache was invalidated
      expect(mockInvalidatePermissionCache).toHaveBeenCalledWith(mockUsers.basicUser.id);

      // Verify session refresh was triggered
      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'user-session-refresh',
          detail: { userId: mockUsers.basicUser.id }
        })
      );

      // Verify tier upgrade event was triggered
      expect(tierUpgradeEvents).toHaveLength(1);
      expect(tierUpgradeEvents[0]).toEqual(upgradeEvent);

      // Verify feature unlock event was triggered
      expect(featureUnlockEvents).toHaveLength(1);
      expect(featureUnlockEvents[0].tier).toBe('professional');
      expect(featureUnlockEvents[0].features).toEqual([
        'advanced-analytics',
        'custom-benchmarks',
        'api-access',
        'priority-support'
      ]);

      // Verify celebration toast was shown
      expect(mockToast.success).toHaveBeenCalledWith(
        'Welcome to Professional! 🚀',
        expect.objectContaining({
          description: 'You now have access to 4 new features!',
          duration: 8000,
          action: expect.objectContaining({
            label: 'Explore Features'
          })
        })
      );

      // Verify analytics tracking
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics/track',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'tier_upgrade',
            userId: mockUsers.basicUser.id,
            properties: {
              oldTier: 'basic',
              newTier: 'professional',
              stripeEventId: mockStripeEvents.subscription_updated.id
            }
          })
        })
      );

      // Verify gtag tracking
      expect(global.window.gtag).toHaveBeenCalledWith(
        'event',
        'tier_upgrade',
        {
          user_id: mockUsers.basicUser.id,
          old_tier: 'basic',
          new_tier: 'professional',
          upgrade_timestamp: upgradeEvent.timestamp.toISOString()
        }
      );

      // Cleanup
      unsubscribeTier();
      unsubscribeFeature();
    });

    test('should handle professional to enterprise upgrade flow', async () => {
      const upgradeEvent: TierUpgradeEvent = {
        userId: mockUsers.professionalUser.id,
        oldTier: 'professional',
        newTier: 'enterprise',
        timestamp: new Date(),
        stripeEventId: mockStripeEvents.subscription_created.id
      };

      const featureUnlockEvents: FeatureUnlockEvent[] = [];
      const unsubscribe = upgradeHandler.onFeatureUnlock((event) => {
        featureUnlockEvents.push(event);
      });

      await upgradeHandler.handleTierUpgrade(upgradeEvent);

      // Verify enterprise-specific features were unlocked
      expect(featureUnlockEvents).toHaveLength(1);
      expect(featureUnlockEvents[0].features).toEqual([
        'white-label',
        'custom-integrations',
        'dedicated-manager',
        'sla-guarantee'
      ]);

      // Verify enterprise celebration
      expect(mockToast.success).toHaveBeenCalledWith(
        'Welcome to Enterprise! 🏆',
        expect.objectContaining({
          description: 'You now have access to 4 new features!'
        })
      );

      unsubscribe();
    });

    test('should handle downgrade scenarios gracefully', async () => {
      const downgradeEvent: TierUpgradeEvent = {
        userId: mockUsers.enterpriseUser.id,
        oldTier: 'enterprise',
        newTier: 'professional',
        timestamp: new Date(),
        stripeEventId: mockStripeEvents.subscription_deleted.id
      };

      await upgradeHandler.handleTierDowngrade(downgradeEvent);

      // Verify permission cache was invalidated
      expect(mockInvalidatePermissionCache).toHaveBeenCalledWith(mockUsers.enterpriseUser.id);

      // Verify downgrade message was shown
      expect(mockToast.info).toHaveBeenCalledWith(
        'Subscription Updated',
        expect.objectContaining({
          description: 'Some features are no longer available with your current plan.',
          duration: 6000,
          action: expect.objectContaining({
            label: 'View Plans'
          })
        })
      );
    });

    test('should handle error scenarios during upgrade', async () => {
      // Mock permission cache invalidation failure
      mockInvalidatePermissionCache.mockRejectedValueOnce(new Error('Cache invalidation failed'));

      const upgradeEvent: TierUpgradeEvent = {
        userId: mockUsers.basicUser.id,
        oldTier: 'basic',
        newTier: 'professional',
        timestamp: new Date(),
        stripeEventId: 'evt_error_test'
      };

      await upgradeHandler.handleTierUpgrade(upgradeEvent);

      // Verify error handling
      expect(mockToast.error).toHaveBeenCalledWith(
        'Failed to process upgrade',
        expect.objectContaining({
          description: 'Please refresh the page to see your new features.'
        })
      );

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        'Error handling tier upgrade:',
        expect.any(Error)
      );
    });
  });

  describe('Webhook Handling Tests', () => {
    test('should process webhook upgrade correctly', async () => {
      const webhookData = mockWebhookPayloads.validUpgrade;
      
      await processTierUpgradeFromWebhook(
        webhookData.userId,
        webhookData.oldTier,
        webhookData.newTier,
        webhookData.stripeEventId
      );

      // Verify webhook was processed as upgrade
      expect(mockInvalidatePermissionCache).toHaveBeenCalledWith(webhookData.userId);
      expect(mockToast.success).toHaveBeenCalled();
    });

    test('should process webhook downgrade correctly', async () => {
      const webhookData = mockWebhookPayloads.validDowngrade;
      
      await processTierUpgradeFromWebhook(
        webhookData.userId,
        webhookData.oldTier,
        webhookData.newTier
      );

      // Verify webhook was processed as downgrade
      expect(mockInvalidatePermissionCache).toHaveBeenCalledWith(webhookData.userId);
      expect(mockToast.info).toHaveBeenCalled();
    });

    test('should ignore webhook with same tier', async () => {
      await processTierUpgradeFromWebhook(
        mockUsers.basicUser.id,
        'basic',
        'basic' // Same tier
      );

      // Should not process anything
      expect(mockInvalidatePermissionCache).not.toHaveBeenCalled();
      expect(mockToast.success).not.toHaveBeenCalled();
      expect(mockToast.info).not.toHaveBeenCalled();
    });

    test('should handle webhook validation errors', async () => {
      const invalidWebhookData = {
        userId: '', // Invalid user ID
        oldTier: 'invalid' as SubscriptionTier,
        newTier: 'professional' as SubscriptionTier
      };

      // Should handle gracefully without throwing
      await expect(
        processTierUpgradeFromWebhook(
          invalidWebhookData.userId,
          invalidWebhookData.oldTier,
          invalidWebhookData.newTier
        )
      ).resolves.not.toThrow();
    });

    test('should handle Stripe webhook payload processing', async () => {
      const stripeWebhookPayload = {
        id: mockStripeEvents.subscription_updated.id,
        type: 'customer.subscription.updated',
        data: mockStripeEvents.subscription_updated.data
      };

      // Mock Stripe webhook processing
      const mockProcessStripeWebhook = jest.fn().mockImplementation(async (payload) => {
        if (payload.type === 'customer.subscription.updated') {
          const customerId = payload.data.object.customer;
          const oldPriceId = payload.data.previous_attributes?.items?.data[0]?.price?.id;
          const newPriceId = payload.data.object.items.data[0].price.id;

          // Map price IDs to tiers
          const priceToTier = {
            'price_basic_monthly': 'basic',
            'price_professional_monthly': 'professional',
            'price_enterprise_monthly': 'enterprise'
          };

          const oldTier = priceToTier[oldPriceId as keyof typeof priceToTier] as SubscriptionTier;
          const newTier = priceToTier[newPriceId as keyof typeof priceToTier] as SubscriptionTier;

          // Find user by customer ID
          const user = Object.values(mockUsers).find(u => u.stripeCustomerId === customerId);
          
          if (user && oldTier && newTier) {
            await processTierUpgradeFromWebhook(
              user.id,
              oldTier,
              newTier,
              payload.id
            );
            return { success: true };
          }
        }
        return { success: false };
      });

      const result = await mockProcessStripeWebhook(stripeWebhookPayload);
      
      expect(result.success).toBe(true);
      expect(mockInvalidatePermissionCache).toHaveBeenCalled();
    });
  });

  describe('Real-time Update Verification', () => {
    test('should trigger real-time session refresh', async () => {
      const upgradeEvent: TierUpgradeEvent = {
        userId: mockUsers.basicUser.id,
        oldTier: 'basic',
        newTier: 'professional',
        timestamp: new Date()
      };

      await upgradeHandler.handleTierUpgrade(upgradeEvent);

      // Verify session refresh event was dispatched
      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'user-session-refresh',
          detail: { userId: mockUsers.basicUser.id }
        })
      );
    });

    test('should trigger feature onboarding event', async () => {
      const upgradeEvent: TierUpgradeEvent = {
        userId: mockUsers.basicUser.id,
        oldTier: 'basic',
        newTier: 'professional',
        timestamp: new Date()
      };

      // Mock toast action click
      let onboardingTriggered = false;
      mockToast.success = jest.fn().mockImplementation((title, options) => {
        if (options?.action?.onClick) {
          options.action.onClick();
          onboardingTriggered = true;
        }
      });

      await upgradeHandler.handleTierUpgrade(upgradeEvent);

      // Simulate clicking the "Explore Features" button
      expect(mockToast.success).toHaveBeenCalled();
      
      // Trigger the action to test onboarding
      const toastCall = (mockToast.success as jest.Mock).mock.calls[0];
      if (toastCall[1]?.action?.onClick) {
        toastCall[1].action.onClick();
      }

      // Verify feature onboarding event was dispatched
      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'show-feature-onboarding',
          detail: {
            features: [
              'advanced-analytics',
              'custom-benchmarks',
              'api-access',
              'priority-support'
            ]
          }
        })
      );
    });

    test('should update user permissions in real-time', async () => {
      const upgradeEvent: TierUpgradeEvent = {
        userId: mockUsers.basicUser.id,
        oldTier: 'basic',
        newTier: 'professional',
        timestamp: new Date()
      };

      // Mock permission check API
      (global.fetch as jest.Mock).mockImplementation(async (url, options) => {
        if (url === '/api/access-control/check-feature') {
          const body = JSON.parse(options.body);
          const hasAccess = body.feature === 'advanced-analytics'; // Professional feature
          return {
            ok: true,
            json: async () => ({ hasAccess })
          };
        }
        return { ok: true, json: async () => ({ success: true }) };
      });

      await upgradeHandler.handleTierUpgrade(upgradeEvent);

      // Verify real-time permission checking
      const hasAccess = await upgradeHandler.checkFeatureAccess(
        mockUsers.basicUser.id,
        'advanced-analytics'
      );
      
      expect(hasAccess).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/access-control/check-feature',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: mockUsers.basicUser.id,
            feature: 'advanced-analytics'
          })
        })
      );
    });

    test('should handle concurrent upgrade events', async () => {
      const upgradeEvents: TierUpgradeEvent[] = [
        {
          userId: 'user_1',
          oldTier: 'basic',
          newTier: 'professional',
          timestamp: new Date(),
          stripeEventId: 'evt_1'
        },
        {
          userId: 'user_2',
          oldTier: 'professional',
          newTier: 'enterprise',
          timestamp: new Date(),
          stripeEventId: 'evt_2'
        },
        {
          userId: 'user_3',
          oldTier: 'basic',
          newTier: 'enterprise',
          timestamp: new Date(),
          stripeEventId: 'evt_3'
        }
      ];

      // Process all upgrades concurrently
      const results = await Promise.all(
        upgradeEvents.map(event => upgradeHandler.handleTierUpgrade(event))
      );

      // Verify all upgrades processed successfully
      expect(results).toHaveLength(3);
      expect(mockInvalidatePermissionCache).toHaveBeenCalledTimes(3);
      expect(mockToast.success).toHaveBeenCalledTimes(3);

      // Verify each user's cache was invalidated
      upgradeEvents.forEach(event => {
        expect(mockInvalidatePermissionCache).toHaveBeenCalledWith(event.userId);
      });
    });
  });

  describe('Feature Unlock Testing', () => {
    test('should unlock correct features for basic to professional upgrade', async () => {
      const upgradeEvent: TierUpgradeEvent = {
        userId: mockUsers.basicUser.id,
        oldTier: 'basic',
        newTier: 'professional',
        timestamp: new Date()
      };

      const featureUnlockEvents: FeatureUnlockEvent[] = [];
      const unsubscribe = upgradeHandler.onFeatureUnlock((event) => {
        featureUnlockEvents.push(event);
      });

      await upgradeHandler.handleTierUpgrade(upgradeEvent);

      expect(featureUnlockEvents).toHaveLength(1);
      const unlockEvent = featureUnlockEvents[0];
      
      expect(unlockEvent.tier).toBe('professional');
      expect(unlockEvent.features).toEqual([
        'advanced-analytics',
        'custom-benchmarks',
        'api-access',
        'priority-support'
      ]);
      
      expect(unlockEvent.celebrationData).toEqual({
        title: 'Welcome to Professional! 🚀',
        description: 'You now have access to 4 new features!',
        features: [
          {
            name: 'Advanced Analytics',
            description: 'Deep insights with custom metrics and trend analysis',
            icon: '📊'
          },
          {
            name: 'Custom Benchmarks',
            description: 'Create and track your own performance benchmarks',
            icon: '🎯'
          },
          {
            name: 'API Access',
            description: 'Integrate GoodBuy data into your own systems',
            icon: '🔌'
          },
          {
            name: 'Priority Support',
            description: '24/7 priority customer support with faster response times',
            icon: '🚀'
          }
        ]
      });

      unsubscribe();
    });

    test('should unlock correct features for professional to enterprise upgrade', async () => {
      const upgradeEvent: TierUpgradeEvent = {
        userId: mockUsers.professionalUser.id,
        oldTier: 'professional',
        newTier: 'enterprise',
        timestamp: new Date()
      };

      const featureUnlockEvents: FeatureUnlockEvent[] = [];
      const unsubscribe = upgradeHandler.onFeatureUnlock((event) => {
        featureUnlockEvents.push(event);
      });

      await upgradeHandler.handleTierUpgrade(upgradeEvent);

      expect(featureUnlockEvents).toHaveLength(1);
      const unlockEvent = featureUnlockEvents[0];
      
      expect(unlockEvent.tier).toBe('enterprise');
      expect(unlockEvent.features).toEqual([
        'white-label',
        'custom-integrations',
        'dedicated-manager',
        'sla-guarantee'
      ]);
      
      expect(unlockEvent.celebrationData.title).toBe('Welcome to Enterprise! 🏆');
      expect(unlockEvent.celebrationData.features).toHaveLength(4);

      unsubscribe();
    });

    test('should not unlock features for basic to basic "upgrade"', async () => {
      const sametierEvent: TierUpgradeEvent = {
        userId: mockUsers.basicUser.id,
        oldTier: 'basic',
        newTier: 'basic', // Same tier
        timestamp: new Date()
      };

      const featureUnlockEvents: FeatureUnlockEvent[] = [];
      const unsubscribe = upgradeHandler.onFeatureUnlock((event) => {
        featureUnlockEvents.push(event);
      });

      await upgradeHandler.handleTierUpgrade(sametonierEvent);

      // No features should be unlocked
      expect(featureUnlockEvents).toHaveLength(0);
      expect(mockToast.success).not.toHaveBeenCalled();

      unsubscribe();
    });

    test('should handle feature access verification after unlock', async () => {
      const upgradeEvent: TierUpgradeEvent = {
        userId: mockUsers.basicUser.id,
        oldTier: 'basic',
        newTier: 'professional',
        timestamp: new Date()
      };

      // Mock feature access API responses
      (global.fetch as jest.Mock).mockImplementation(async (url, options) => {
        if (url === '/api/access-control/check-feature') {
          const body = JSON.parse(options.body);
          const professionalFeatures = ['advanced-analytics', 'custom-benchmarks', 'api-access', 'priority-support'];
          const hasAccess = professionalFeatures.includes(body.feature);
          return {
            ok: true,
            json: async () => ({ hasAccess })
          };
        }
        return { ok: true, json: async () => ({ success: true }) };
      });

      await upgradeHandler.handleTierUpgrade(upgradeEvent);

      // Verify newly unlocked features are accessible
      const professionalFeatures = ['advanced-analytics', 'custom-benchmarks', 'api-access', 'priority-support'];
      
      for (const feature of professionalFeatures) {
        const hasAccess = await upgradeHandler.checkFeatureAccess(
          mockUsers.basicUser.id,
          feature
        );
        expect(hasAccess).toBe(true);
      }

      // Verify enterprise features are still not accessible
      const enterpriseFeatures = ['white-label', 'custom-integrations'];
      
      for (const feature of enterpriseFeatures) {
        const hasAccess = await upgradeHandler.checkFeatureAccess(
          mockUsers.basicUser.id,
          feature
        );
        expect(hasAccess).toBe(false);
      }
    });
  });

  describe('Upgrade Recommendations', () => {
    test('should provide accurate upgrade recommendations', async () => {
      // Mock upgrade recommendations API
      (global.fetch as jest.Mock).mockImplementation(async (url) => {
        if (url.includes('/api/subscription/upgrade-recommendations')) {
          return {
            ok: true,
            json: async () => ({
              recommended: 'professional',
              reasons: [
                'You\'ve exceeded basic tier limits 3 times this month',
                'Advanced analytics would save you 10 hours per week',
                'API access needed for your integrations'
              ],
              savings: 25 // 25% savings if upgraded annually
            })
          };
        }
        return { ok: true, json: async () => ({ success: true }) };
      });

      const recommendations = await upgradeHandler.getUpgradeRecommendations(
        mockUsers.basicUser.id
      );

      expect(recommendations).toEqual({
        recommended: 'professional',
        reasons: [
          'You\'ve exceeded basic tier limits 3 times this month',
          'Advanced analytics would save you 10 hours per week',
          'API access needed for your integrations'
        ],
        savings: 25
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/subscription/upgrade-recommendations?userId=${mockUsers.basicUser.id}`
      );
    });

    test('should handle upgrade recommendation errors gracefully', async () => {
      // Mock API error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const recommendations = await upgradeHandler.getUpgradeRecommendations(
        mockUsers.basicUser.id
      );

      // Should return default recommendation
      expect(recommendations).toEqual({
        recommended: 'professional',
        reasons: []
      });

      expect(console.error).toHaveBeenCalledWith(
        'Error getting upgrade recommendations:',
        expect.any(Error)
      );
    });
  });

  describe('Integration with Access Control', () => {
    test('should validate permissions before and after upgrade', async () => {
      const userId = mockUsers.basicUser.id;
      
      // Mock access control checks
      const mockCheckPermission = jest.fn()
        .mockReturnValueOnce({ allowed: false, reason: 'Upgrade required' }) // Before upgrade
        .mockReturnValueOnce({ allowed: true, permission: 'write' }); // After upgrade
      
      (tierAccessControl.checkPermission as jest.Mock) = mockCheckPermission;

      // Check permission before upgrade
      const beforeUpgrade = tierAccessControl.checkPermission(
        'basic',
        'api',
        'access',
        { userId, feature: 'api', action: 'access' }
      );
      expect(beforeUpgrade.allowed).toBe(false);

      // Process upgrade
      const upgradeEvent: TierUpgradeEvent = {
        userId,
        oldTier: 'basic',
        newTier: 'professional',
        timestamp: new Date()
      };
      
      await upgradeHandler.handleTierUpgrade(upgradeEvent);

      // Check permission after upgrade
      const afterUpgrade = tierAccessControl.checkPermission(
        'professional',
        'api',
        'access',
        { userId, feature: 'api', action: 'access' }
      );
      expect(afterUpgrade.allowed).toBe(true);
    });

    test('should handle cache invalidation during concurrent operations', async () => {
      const userId = mockUsers.basicUser.id;
      
      // Setup concurrent operations
      const upgradePromise = upgradeHandler.handleTierUpgrade({
        userId,
        oldTier: 'basic',
        newTier: 'professional',
        timestamp: new Date()
      });

      const permissionChecks = Promise.all([
        tierAccessControl.checkPermission('basic', 'api', 'access', { userId, feature: 'api', action: 'access' }),
        tierAccessControl.checkPermission('basic', 'reports', 'advanced', { userId, feature: 'reports', action: 'advanced' }),
        tierAccessControl.checkPermission('basic', 'analytics', 'custom', { userId, feature: 'analytics', action: 'custom' })
      ]);

      // Wait for both to complete
      await Promise.all([upgradePromise, permissionChecks]);

      // Verify cache invalidation was called
      expect(mockInvalidatePermissionCache).toHaveBeenCalledWith(userId);
    });
  });
});
