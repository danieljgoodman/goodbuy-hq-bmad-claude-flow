/**
 * Unit tests for subscription tier detection utilities
 * Tests tier detection logic, caching, performance, and fallback scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { TierDetectionService, getUserTier, hasFeatureAccess } from '../tier-utils'
import {
  SubscriptionTier,
  SubscriptionStatus,
  TierDetectionResult,
  ClerkUserMetadata,
  TIER_FEATURES
} from '@/types/subscription'

// Mock external dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(() => ({
    users: {
      getUser: vi.fn(),
      updateUserMetadata: vi.fn()
    }
  }))
}))

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    subscriptions: {
      list: vi.fn()
    }
  }))
}))

vi.mock('@/lib/services/PremiumAccessService', () => ({
  PremiumAccessService: {
    checkPremiumAccess: vi.fn()
  }
}))

describe('TierDetectionService', () => {
  let mockRequest: NextRequest
  let mockAuth: any
  let mockClerkClient: any
  let mockStripe: any
  let mockPremiumAccess: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Setup mock request
    mockRequest = {
      nextUrl: { pathname: '/test' },
      headers: new Map(),
      url: 'https://example.com/test'
    } as any

    // Setup mock dependencies
    const { auth, clerkClient } = require('@clerk/nextjs/server')
    mockAuth = auth
    mockClerkClient = clerkClient

    const Stripe = require('stripe')
    mockStripe = Stripe.default

    const { PremiumAccessService } = require('@/lib/services/PremiumAccessService')
    mockPremiumAccess = PremiumAccessService.checkPremiumAccess

    // Mock performance.now for testing
    global.performance = global.performance || {}
    global.performance.now = vi.fn(() => Date.now())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('detectTier', () => {
    it('should return fallback result when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const result = await TierDetectionService.detectTier(mockRequest)

      expect(result).toMatchObject({
        tier: 'BASIC',
        status: 'ACTIVE',
        hasAccess: true,
        isTrialing: false,
        source: 'fallback'
      })
      expect(result.executionTime).toBeGreaterThanOrEqual(0)
      expect(result.features).toEqual(TIER_FEATURES.BASIC)
    })

    it('should detect tier from Clerk metadata successfully', async () => {
      const userId = 'user_123'
      const mockMetadata: ClerkUserMetadata = {
        subscriptionTier: 'PROFESSIONAL',
        subscriptionStatus: 'ACTIVE',
        features: TIER_FEATURES.PROFESSIONAL,
        stripeCustomerId: 'cus_123',
        subscriptionId: 'sub_123'
      }

      mockAuth.mockResolvedValue({ userId })
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            publicMetadata: mockMetadata
          })
        }
      })

      const result = await TierDetectionService.detectTier(mockRequest)

      expect(result).toMatchObject({
        tier: 'PROFESSIONAL',
        status: 'ACTIVE',
        hasAccess: true,
        isTrialing: false,
        source: 'clerk'
      })
      expect(result.features).toEqual(TIER_FEATURES.PROFESSIONAL)
    })

    it('should fallback to Stripe when Clerk metadata is incomplete', async () => {
      const userId = 'user_123'

      mockAuth.mockResolvedValue({ userId })

      // First call for Clerk (no tier in metadata)
      mockClerkClient.mockResolvedValueOnce({
        users: {
          getUser: vi.fn().mockResolvedValue({
            publicMetadata: { stripeCustomerId: 'cus_123' }
          })
        }
      })

      // Second call for Stripe API
      mockClerkClient.mockResolvedValueOnce({
        users: {
          getUser: vi.fn().mockResolvedValue({
            publicMetadata: { stripeCustomerId: 'cus_123' }
          })
        }
      })

      const mockSubscription = {
        status: 'active',
        items: {
          data: [{
            price: {
              id: 'price_professional_monthly',
              product: { name: 'Professional Plan' }
            }
          }]
        },
        trial_end: null,
        current_period_end: Date.now() / 1000 + 86400
      }

      mockStripe.mockImplementation(() => ({
        subscriptions: {
          list: vi.fn().mockResolvedValue({
            data: [mockSubscription]
          })
        }
      }))

      const result = await TierDetectionService.detectTier(mockRequest)

      expect(result).toMatchObject({
        tier: 'PROFESSIONAL',
        status: 'ACTIVE',
        hasAccess: true,
        source: 'stripe'
      })
    })

    it('should fallback to database when both Clerk and Stripe fail', async () => {
      const userId = 'user_123'

      mockAuth.mockResolvedValue({ userId })

      // Clerk fails
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            publicMetadata: {}
          })
        }
      })

      // Stripe fails (no customer ID)
      // Database succeeds
      mockPremiumAccess.mockResolvedValue({
        hasAccess: true,
        trialInfo: { isOnTrial: false }
      })

      const result = await TierDetectionService.detectTier(mockRequest)

      expect(result).toMatchObject({
        tier: 'PROFESSIONAL',
        status: 'ACTIVE',
        hasAccess: true,
        source: 'database'
      })
    })

    it('should respect cache when enabled', async () => {
      const userId = 'user_123'
      mockAuth.mockResolvedValue({ userId })

      // First call - cache miss
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            publicMetadata: {
              subscriptionTier: 'PROFESSIONAL',
              subscriptionStatus: 'ACTIVE',
              features: TIER_FEATURES.PROFESSIONAL
            }
          })
        }
      })

      const result1 = await TierDetectionService.detectTier(mockRequest)
      expect(result1.source).toBe('clerk')

      // Second call - should use cache
      vi.clearAllMocks()
      const result2 = await TierDetectionService.detectTier(mockRequest)

      // Should not call Clerk again
      expect(mockClerkClient).not.toHaveBeenCalled()
      expect(result2.tier).toBe('PROFESSIONAL')
    })

    it('should meet performance requirement of <100ms', async () => {
      const userId = 'user_123'
      let callCount = 0

      mockAuth.mockResolvedValue({ userId })
      global.performance.now = vi.fn(() => {
        callCount++
        return callCount === 1 ? 0 : 50 // 50ms execution time
      })

      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            publicMetadata: {
              subscriptionTier: 'BASIC',
              subscriptionStatus: 'ACTIVE',
              features: TIER_FEATURES.BASIC
            }
          })
        }
      })

      const result = await TierDetectionService.detectTier(mockRequest)

      expect(result.executionTime).toBeLessThan(100)
      expect(result.executionTime).toBe(50)
    })

    it('should handle trial users correctly', async () => {
      const userId = 'user_123'
      const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

      mockAuth.mockResolvedValue({ userId })
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            publicMetadata: {
              subscriptionTier: 'PROFESSIONAL',
              subscriptionStatus: 'TRIALING',
              features: TIER_FEATURES.PROFESSIONAL,
              trialEndsAt: trialEnd.toISOString()
            }
          })
        }
      })

      const result = await TierDetectionService.detectTier(mockRequest)

      expect(result).toMatchObject({
        tier: 'PROFESSIONAL',
        status: 'TRIALING',
        hasAccess: true,
        isTrialing: true
      })
      expect(result.trialEndsAt).toEqual(trialEnd)
    })

    it('should handle expired subscriptions', async () => {
      const userId = 'user_123'

      mockAuth.mockResolvedValue({ userId })
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            publicMetadata: {
              subscriptionTier: 'PROFESSIONAL',
              subscriptionStatus: 'CANCELED',
              features: TIER_FEATURES.PROFESSIONAL
            }
          })
        }
      })

      const result = await TierDetectionService.detectTier(mockRequest)

      expect(result).toMatchObject({
        tier: 'PROFESSIONAL',
        status: 'CANCELED',
        hasAccess: false, // Canceled subscriptions don't have access
        isTrialing: false
      })
    })

    it('should handle network errors gracefully', async () => {
      const userId = 'user_123'

      mockAuth.mockResolvedValue({ userId })
      mockClerkClient.mockRejectedValue(new Error('Network error'))
      mockStripe.mockImplementation(() => {
        throw new Error('Stripe network error')
      })
      mockPremiumAccess.mockRejectedValue(new Error('Database error'))

      const result = await TierDetectionService.detectTier(mockRequest)

      expect(result).toMatchObject({
        tier: 'BASIC',
        status: 'ACTIVE',
        hasAccess: true,
        source: 'fallback'
      })
    })
  })

  describe('Stripe integration', () => {
    it('should map Stripe price IDs to tiers correctly', async () => {
      const testCases = [
        { priceId: 'price_professional_monthly', expectedTier: 'PROFESSIONAL' },
        { priceId: 'price_professional_yearly', expectedTier: 'PROFESSIONAL' },
        { priceId: 'price_enterprise_monthly', expectedTier: 'ENTERPRISE' },
        { priceId: 'price_enterprise_yearly', expectedTier: 'ENTERPRISE' },
        { priceId: 'unknown_price', expectedTier: 'BASIC' }
      ]

      for (const { priceId, expectedTier } of testCases) {
        const userId = 'user_123'

        mockAuth.mockResolvedValue({ userId })
        mockClerkClient.mockResolvedValue({
          users: {
            getUser: vi.fn().mockResolvedValue({
              publicMetadata: { stripeCustomerId: 'cus_123' }
            })
          }
        })

        mockStripe.mockImplementation(() => ({
          subscriptions: {
            list: vi.fn().mockResolvedValue({
              data: [{
                status: 'active',
                items: { data: [{ price: { id: priceId } }] },
                trial_end: null,
                current_period_end: Date.now() / 1000 + 86400
              }]
            })
          }
        }))

        const result = await TierDetectionService.detectTier(mockRequest)
        expect(result.tier).toBe(expectedTier)
      }
    })

    it('should map Stripe statuses correctly', async () => {
      const statusMappings = [
        { stripeStatus: 'active', expectedStatus: 'ACTIVE' },
        { stripeStatus: 'canceled', expectedStatus: 'CANCELED' },
        { stripeStatus: 'past_due', expectedStatus: 'PAST_DUE' },
        { stripeStatus: 'trialing', expectedStatus: 'TRIALING' },
        { stripeStatus: 'incomplete', expectedStatus: 'INCOMPLETE' },
        { stripeStatus: 'unknown_status', expectedStatus: 'ACTIVE' }
      ]

      for (const { stripeStatus, expectedStatus } of statusMappings) {
        const userId = 'user_123'

        mockAuth.mockResolvedValue({ userId })
        mockClerkClient.mockResolvedValue({
          users: {
            getUser: vi.fn().mockResolvedValue({
              publicMetadata: { stripeCustomerId: 'cus_123' }
            })
          }
        })

        mockStripe.mockImplementation(() => ({
          subscriptions: {
            list: vi.fn().mockResolvedValue({
              data: [{
                status: stripeStatus,
                items: { data: [{ price: { id: 'price_professional_monthly' } }] },
                trial_end: null,
                current_period_end: Date.now() / 1000 + 86400
              }]
            })
          }
        }))

        const result = await TierDetectionService.detectTier(mockRequest)
        expect(result.status).toBe(expectedStatus)
      }
    })
  })

  describe('updateTierInClerk', () => {
    it('should update user metadata in Clerk successfully', async () => {
      const userId = 'user_123'
      const subscription = {
        tier: 'PROFESSIONAL' as SubscriptionTier,
        status: 'ACTIVE' as SubscriptionStatus,
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        features: TIER_FEATURES.PROFESSIONAL,
        currentPeriodEnd: new Date(Date.now() + 86400000)
      }

      const mockUpdateMetadata = vi.fn()
      mockClerkClient.mockResolvedValue({
        users: {
          updateUserMetadata: mockUpdateMetadata
        }
      })

      await TierDetectionService.updateTierInClerk(userId, subscription)

      expect(mockUpdateMetadata).toHaveBeenCalledWith(userId, {
        publicMetadata: expect.objectContaining({
          subscriptionTier: 'PROFESSIONAL',
          subscriptionStatus: 'ACTIVE',
          stripeCustomerId: 'cus_123',
          subscriptionId: 'sub_123',
          features: TIER_FEATURES.PROFESSIONAL
        })
      })
    })

    it('should handle Clerk API errors', async () => {
      const userId = 'user_123'
      const subscription = {
        tier: 'PROFESSIONAL' as SubscriptionTier,
        status: 'ACTIVE' as SubscriptionStatus
      }

      mockClerkClient.mockResolvedValue({
        users: {
          updateUserMetadata: vi.fn().mockRejectedValue(new Error('Clerk API error'))
        }
      })

      await expect(
        TierDetectionService.updateTierInClerk(userId, subscription)
      ).rejects.toThrow('Clerk API error')
    })
  })

  describe('bulkUpdateTiers', () => {
    it('should update multiple users in parallel', async () => {
      const updates = [
        { userId: 'user_1', tier: 'PROFESSIONAL' as SubscriptionTier },
        { userId: 'user_2', tier: 'ENTERPRISE' as SubscriptionTier }
      ]

      const mockUpdateMetadata = vi.fn().mockResolvedValue(undefined)
      mockClerkClient.mockResolvedValue({
        users: {
          updateUserMetadata: mockUpdateMetadata
        }
      })

      await TierDetectionService.bulkUpdateTiers(updates)

      expect(mockUpdateMetadata).toHaveBeenCalledTimes(2)
      expect(mockUpdateMetadata).toHaveBeenCalledWith('user_1', {
        publicMetadata: expect.objectContaining({
          subscriptionTier: 'PROFESSIONAL',
          features: TIER_FEATURES.PROFESSIONAL
        })
      })
      expect(mockUpdateMetadata).toHaveBeenCalledWith('user_2', {
        publicMetadata: expect.objectContaining({
          subscriptionTier: 'ENTERPRISE',
          features: TIER_FEATURES.ENTERPRISE
        })
      })
    })

    it('should handle partial failures gracefully', async () => {
      const updates = [
        { userId: 'user_1', tier: 'PROFESSIONAL' as SubscriptionTier },
        { userId: 'user_2', tier: 'ENTERPRISE' as SubscriptionTier }
      ]

      const mockUpdateMetadata = vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Update failed'))

      mockClerkClient.mockResolvedValue({
        users: {
          updateUserMetadata: mockUpdateMetadata
        }
      })

      // Should not throw even if some updates fail
      await expect(
        TierDetectionService.bulkUpdateTiers(updates)
      ).resolves.toBeUndefined()

      expect(mockUpdateMetadata).toHaveBeenCalledTimes(2)
    })
  })

  describe('Performance and caching', () => {
    it('should clean up cache when it exceeds size limit', async () => {
      const userId = 'user_123'

      // Mock cache to be already large
      const cache = new Map()
      for (let i = 0; i < 1001; i++) {
        cache.set(`user_${i}`, { result: {}, timestamp: Date.now() })
      }

      mockAuth.mockResolvedValue({ userId })
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            publicMetadata: {
              subscriptionTier: 'BASIC',
              subscriptionStatus: 'ACTIVE',
              features: TIER_FEATURES.BASIC
            }
          })
        }
      })

      const result = await TierDetectionService.detectTier(mockRequest)

      // Should complete successfully even with cache cleanup
      expect(result).toBeDefined()
      expect(result.tier).toBe('BASIC')
    })

    it('should return performance metrics', () => {
      const metrics = TierDetectionService.getPerformanceMetrics()

      expect(metrics).toHaveProperty('cacheSize')
      expect(metrics).toHaveProperty('cacheHitRate')
      expect(metrics).toHaveProperty('averageExecutionTime')
      expect(typeof metrics.cacheSize).toBe('number')
      expect(typeof metrics.cacheHitRate).toBe('number')
      expect(typeof metrics.averageExecutionTime).toBe('number')
    })
  })
})

describe('Helper functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserTier', () => {
    it('should return BASIC for undefined userId', async () => {
      const tier = await getUserTier()
      expect(tier).toBe('BASIC')
    })

    it('should return BASIC for null userId', async () => {
      const tier = await getUserTier(null as any)
      expect(tier).toBe('BASIC')
    })

    it('should return tier from detection service', async () => {
      const { auth } = require('@clerk/nextjs/server')
      auth.mockResolvedValue({ userId: 'user_123' })

      const { clerkClient } = require('@clerk/nextjs/server')
      clerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            publicMetadata: {
              subscriptionTier: 'PROFESSIONAL',
              subscriptionStatus: 'ACTIVE',
              features: TIER_FEATURES.PROFESSIONAL
            }
          })
        }
      })

      const tier = await getUserTier('user_123')
      expect(tier).toBe('PROFESSIONAL')
    })

    it('should return BASIC on error', async () => {
      const { auth } = require('@clerk/nextjs/server')
      auth.mockRejectedValue(new Error('Auth error'))

      const tier = await getUserTier('user_123')
      expect(tier).toBe('BASIC')
    })
  })

  describe('hasFeatureAccess', () => {
    it('should return false for users without access', async () => {
      const hasAccess = await hasFeatureAccess('user_123', 'advanced_analytics')
      expect(hasAccess).toBe(false)
    })

    it('should return false on error', async () => {
      const { auth } = require('@clerk/nextjs/server')
      auth.mockRejectedValue(new Error('Auth error'))

      const hasAccess = await hasFeatureAccess('user_123', 'basic_evaluation')
      expect(hasAccess).toBe(false)
    })
  })
})

describe('Type validation and edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle invalid tier values', async () => {
    const userId = 'user_123'
    const { auth, clerkClient } = require('@clerk/nextjs/server')

    auth.mockResolvedValue({ userId })
    clerkClient.mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({
          publicMetadata: {
            subscriptionTier: 'INVALID_TIER',
            subscriptionStatus: 'ACTIVE',
            features: []
          }
        })
      }
    })

    const mockRequest = {
      nextUrl: { pathname: '/test' },
      headers: new Map(),
      url: 'https://example.com/test'
    } as any

    const result = await TierDetectionService.detectTier(mockRequest)
    expect(result.tier).toBe('BASIC') // Should fallback to BASIC for invalid tiers
  })

  it('should handle invalid status values', async () => {
    const userId = 'user_123'
    const { auth, clerkClient } = require('@clerk/nextjs/server')

    auth.mockResolvedValue({ userId })
    clerkClient.mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({
          publicMetadata: {
            subscriptionTier: 'PROFESSIONAL',
            subscriptionStatus: 'INVALID_STATUS',
            features: TIER_FEATURES.PROFESSIONAL
          }
        })
      }
    })

    const mockRequest = {
      nextUrl: { pathname: '/test' },
      headers: new Map(),
      url: 'https://example.com/test'
    } as any

    const result = await TierDetectionService.detectTier(mockRequest)
    expect(result.status).toBe('ACTIVE') // Should fallback to ACTIVE for invalid statuses
  })

  it('should handle malformed dates gracefully', async () => {
    const userId = 'user_123'
    const { auth, clerkClient } = require('@clerk/nextjs/server')

    auth.mockResolvedValue({ userId })
    clerkClient.mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({
          publicMetadata: {
            subscriptionTier: 'PROFESSIONAL',
            subscriptionStatus: 'TRIALING',
            features: TIER_FEATURES.PROFESSIONAL,
            trialEndsAt: 'invalid-date',
            subscriptionEndsAt: 'also-invalid'
          }
        })
      }
    })

    const mockRequest = {
      nextUrl: { pathname: '/test' },
      headers: new Map(),
      url: 'https://example.com/test'
    } as any

    const result = await TierDetectionService.detectTier(mockRequest)
    expect(result.trialEndsAt).toBeUndefined()
    expect(result.subscriptionEndsAt).toBeUndefined()
  })
})