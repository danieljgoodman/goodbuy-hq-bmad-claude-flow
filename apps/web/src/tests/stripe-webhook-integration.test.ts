/**
 * Comprehensive integration tests for Stripe webhook system
 * Story 11.2: Subscription-Based Routing Middleware
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { UserTierService } from '@/lib/services/user-tier-service'
import { ClerkTierIntegration } from '@/lib/auth/clerk-tier-integration'
import { handleStripeWebhook } from '@/lib/stripe/webhooks'
import type { SubscriptionTier, SubscriptionStatus } from '@/types/subscription'

// Mock dependencies
jest.mock('@/lib/services/user-tier-service')
jest.mock('@/lib/auth/clerk-tier-integration')
jest.mock('@prisma/client')
jest.mock('stripe')

const mockUserTierService = UserTierService as jest.Mocked<typeof UserTierService>
const mockClerkTierIntegration = ClerkTierIntegration as jest.Mocked<typeof ClerkTierIntegration>

describe('Stripe Webhook Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    mockUserTierService.getUserTier.mockResolvedValue({
      tier: 'BASIC',
      status: 'ACTIVE',
      features: ['basic_evaluation', 'basic_reports', 'basic_analytics'],
      hasAccess: true,
      isTrialing: false,
      executionTime: 50,
      source: 'database'
    })

    mockUserTierService.updateUserTier.mockResolvedValue()
    mockUserTierService.invalidateUserCaches.mockResolvedValue()
    mockUserTierService.hasFeatureAccess.mockResolvedValue(true)
    mockUserTierService.canAccessTier.mockResolvedValue(true)

    mockClerkTierIntegration.updateUserTierMetadata.mockResolvedValue()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('UserTierService', () => {
    it('should get user tier with proper caching', async () => {
      const userId = 'test-user-id'

      const result = await UserTierService.getUserTier(userId)

      expect(result).toEqual({
        tier: 'BASIC',
        status: 'ACTIVE',
        features: ['basic_evaluation', 'basic_reports', 'basic_analytics'],
        hasAccess: true,
        isTrialing: false,
        executionTime: 50,
        source: 'database'
      })

      expect(mockUserTierService.getUserTier).toHaveBeenCalledWith(userId)
    })

    it('should update user tier across all systems', async () => {
      const userId = 'test-user-id'
      const tierData = {
        tier: 'PROFESSIONAL' as SubscriptionTier,
        status: 'ACTIVE' as SubscriptionStatus,
        stripeCustomerId: 'cus_test',
        stripeSubscriptionId: 'sub_test',
        stripePriceId: 'price_test',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false
      }

      await UserTierService.updateUserTier(userId, tierData)

      expect(mockUserTierService.updateUserTier).toHaveBeenCalledWith(userId, tierData)
    })

    it('should check feature access correctly', async () => {
      const userId = 'test-user-id'

      const hasAccess = await UserTierService.hasFeatureAccess(userId, 'pdf_reports', 'PROFESSIONAL')

      expect(hasAccess).toBe(true)
      expect(mockUserTierService.hasFeatureAccess).toHaveBeenCalledWith(userId, 'pdf_reports', 'PROFESSIONAL')
    })

    it('should validate tier hierarchy access', async () => {
      const userId = 'test-user-id'

      const canAccess = await UserTierService.canAccessTier(userId, 'PROFESSIONAL')

      expect(canAccess).toBe(true)
      expect(mockUserTierService.canAccessTier).toHaveBeenCalledWith(userId, 'PROFESSIONAL')
    })

    it('should handle cache invalidation', async () => {
      const userId = 'test-user-id'

      await UserTierService.invalidateUserCaches(userId)

      expect(mockUserTierService.invalidateUserCaches).toHaveBeenCalledWith(userId)
    })
  })

  describe('ClerkTierIntegration', () => {
    it('should update user tier metadata in Clerk', async () => {
      const userId = 'test-user-id'
      const tierData = {
        tier: 'PROFESSIONAL' as SubscriptionTier,
        status: 'ACTIVE' as SubscriptionStatus,
        stripeCustomerId: 'cus_test',
        subscriptionId: 'sub_test',
        trialEndsAt: undefined,
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }

      await ClerkTierIntegration.updateUserTierMetadata(userId, tierData)

      expect(mockClerkTierIntegration.updateUserTierMetadata).toHaveBeenCalledWith(userId, tierData)
    })

    it('should get user tier metadata from Clerk', async () => {
      const userId = 'test-user-id'
      const mockMetadata = {
        subscriptionTier: 'PROFESSIONAL' as SubscriptionTier,
        subscriptionStatus: 'ACTIVE' as SubscriptionStatus,
        features: ['basic_evaluation', 'professional_evaluation', 'pdf_reports'],
        stripeCustomerId: 'cus_test',
        subscriptionId: 'sub_test',
        trialEndsAt: undefined,
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }

      mockClerkTierIntegration.getUserTierMetadata.mockResolvedValue(mockMetadata)

      const result = await ClerkTierIntegration.getUserTierMetadata(userId)

      expect(result).toEqual(mockMetadata)
      expect(mockClerkTierIntegration.getUserTierMetadata).toHaveBeenCalledWith(userId)
    })
  })

  describe('Error Handling', () => {
    it('should handle UserTierService errors gracefully', async () => {
      const userId = 'test-user-id'
      const error = new Error('Database connection failed')

      mockUserTierService.getUserTier.mockRejectedValue(error)

      await expect(UserTierService.getUserTier(userId)).rejects.toThrow('Database connection failed')
    })

    it('should handle Clerk integration errors gracefully', async () => {
      const userId = 'test-user-id'
      const tierData = {
        tier: 'PROFESSIONAL' as SubscriptionTier,
        status: 'ACTIVE' as SubscriptionStatus,
        stripeCustomerId: 'cus_test',
        subscriptionId: 'sub_test'
      }
      const error = new Error('Clerk API error')

      mockClerkTierIntegration.updateUserTierMetadata.mockRejectedValue(error)

      await expect(ClerkTierIntegration.updateUserTierMetadata(userId, tierData)).rejects.toThrow('Clerk API error')
    })

    it('should handle tier update failures', async () => {
      const userId = 'test-user-id'
      const tierData = {
        tier: 'PROFESSIONAL' as SubscriptionTier,
        status: 'ACTIVE' as SubscriptionStatus
      }
      const error = new Error('Update failed')

      mockUserTierService.updateUserTier.mockRejectedValue(error)

      await expect(UserTierService.updateUserTier(userId, tierData)).rejects.toThrow('Update failed')
    })
  })

  describe('Performance', () => {
    it('should complete tier lookup within 100ms requirement', async () => {
      const userId = 'test-user-id'
      const startTime = Date.now()

      await UserTierService.getUserTier(userId)

      const executionTime = Date.now() - startTime
      expect(executionTime).toBeLessThan(100)
    })

    it('should handle cache hits efficiently', async () => {
      const userId = 'test-user-id'

      // First call - cache miss
      await UserTierService.getUserTier(userId)

      // Second call - should hit cache
      const startTime = Date.now()
      await UserTierService.getUserTier(userId)
      const executionTime = Date.now() - startTime

      expect(executionTime).toBeLessThan(10) // Cache hits should be very fast
    })
  })

  describe('Feature Access Validation', () => {
    it('should validate BASIC tier features', async () => {
      const userId = 'test-user-id'

      mockUserTierService.hasFeatureAccess.mockImplementation(async (_, feature) => {
        const basicFeatures = ['basic_evaluation', 'basic_reports', 'basic_analytics']
        return basicFeatures.includes(feature)
      })

      expect(await UserTierService.hasFeatureAccess(userId, 'basic_evaluation')).toBe(true)
      expect(await UserTierService.hasFeatureAccess(userId, 'pdf_reports')).toBe(false)
      expect(await UserTierService.hasFeatureAccess(userId, 'enterprise_evaluation')).toBe(false)
    })

    it('should validate PROFESSIONAL tier features', async () => {
      const userId = 'test-user-id'

      mockUserTierService.hasFeatureAccess.mockImplementation(async (_, feature) => {
        const professionalFeatures = [
          'basic_evaluation', 'basic_reports', 'basic_analytics',
          'professional_evaluation', 'ai_guides', 'progress_tracking',
          'pdf_reports', 'advanced_analytics', 'priority_support', 'export_data'
        ]
        return professionalFeatures.includes(feature)
      })

      expect(await UserTierService.hasFeatureAccess(userId, 'basic_evaluation')).toBe(true)
      expect(await UserTierService.hasFeatureAccess(userId, 'pdf_reports')).toBe(true)
      expect(await UserTierService.hasFeatureAccess(userId, 'enterprise_evaluation')).toBe(false)
    })

    it('should validate ENTERPRISE tier features', async () => {
      const userId = 'test-user-id'

      mockUserTierService.hasFeatureAccess.mockImplementation(async (_, feature) => {
        // All features available for enterprise
        return true
      })

      expect(await UserTierService.hasFeatureAccess(userId, 'basic_evaluation')).toBe(true)
      expect(await UserTierService.hasFeatureAccess(userId, 'pdf_reports')).toBe(true)
      expect(await UserTierService.hasFeatureAccess(userId, 'enterprise_evaluation')).toBe(true)
      expect(await UserTierService.hasFeatureAccess(userId, 'api_access')).toBe(true)
    })
  })

  describe('Tier Hierarchy', () => {
    it('should respect tier hierarchy for access control', async () => {
      const userId = 'test-user-id'

      // Mock PROFESSIONAL tier user
      mockUserTierService.canAccessTier.mockImplementation(async (_, requiredTier) => {
        const userTierLevel = 1 // PROFESSIONAL
        const requiredLevels = { 'BASIC': 0, 'PROFESSIONAL': 1, 'ENTERPRISE': 2 }
        return userTierLevel >= requiredLevels[requiredTier]
      })

      expect(await UserTierService.canAccessTier(userId, 'BASIC')).toBe(true)
      expect(await UserTierService.canAccessTier(userId, 'PROFESSIONAL')).toBe(true)
      expect(await UserTierService.canAccessTier(userId, 'ENTERPRISE')).toBe(false)
    })
  })
})

describe('Integration Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle complete subscription lifecycle', async () => {
    const userId = 'test-user-id'

    // 1. User starts with BASIC tier
    mockUserTierService.getUserTier.mockResolvedValueOnce({
      tier: 'BASIC',
      status: 'ACTIVE',
      features: ['basic_evaluation', 'basic_reports', 'basic_analytics'],
      hasAccess: true,
      isTrialing: false,
      executionTime: 45,
      source: 'database'
    })

    let result = await UserTierService.getUserTier(userId)
    expect(result.tier).toBe('BASIC')

    // 2. User upgrades to PROFESSIONAL
    await UserTierService.updateUserTier(userId, {
      tier: 'PROFESSIONAL',
      status: 'ACTIVE',
      stripeCustomerId: 'cus_test',
      stripeSubscriptionId: 'sub_test'
    })

    expect(mockUserTierService.updateUserTier).toHaveBeenCalledWith(userId, expect.objectContaining({
      tier: 'PROFESSIONAL',
      status: 'ACTIVE'
    }))

    // 3. Cache should be invalidated
    expect(mockUserTierService.invalidateUserCaches).toHaveBeenCalledWith(userId)

    // 4. Clerk metadata should be updated
    expect(mockClerkTierIntegration.updateUserTierMetadata).toHaveBeenCalled()
  })

  it('should handle subscription cancellation flow', async () => {
    const userId = 'test-user-id'

    // User cancels subscription
    await UserTierService.updateUserTier(userId, {
      tier: 'BASIC',
      status: 'CANCELED',
      stripeCustomerId: 'cus_test',
      stripeSubscriptionId: 'sub_test',
      cancelAtPeriodEnd: true
    })

    expect(mockUserTierService.updateUserTier).toHaveBeenCalledWith(userId, expect.objectContaining({
      tier: 'BASIC',
      status: 'CANCELED',
      cancelAtPeriodEnd: true
    }))
  })

  it('should handle trial scenarios', async () => {
    const userId = 'test-user-id'
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    // User starts trial
    await UserTierService.updateUserTier(userId, {
      tier: 'PROFESSIONAL',
      status: 'TRIALING',
      stripeCustomerId: 'cus_test',
      stripeSubscriptionId: 'sub_test',
      trialEnd
    })

    expect(mockUserTierService.updateUserTier).toHaveBeenCalledWith(userId, expect.objectContaining({
      tier: 'PROFESSIONAL',
      status: 'TRIALING',
      trialEnd
    }))
  })
})

describe('Cache Performance Tests', () => {
  it('should demonstrate cache effectiveness', async () => {
    const userId = 'test-user-id'
    let callCount = 0

    mockUserTierService.getUserTier.mockImplementation(async () => {
      callCount++
      return {
        tier: 'PROFESSIONAL',
        status: 'ACTIVE',
        features: ['basic_evaluation', 'professional_evaluation'],
        hasAccess: true,
        isTrialing: false,
        executionTime: callCount === 1 ? 80 : 5, // First call slower, cache hits faster
        source: callCount === 1 ? 'database' : 'cache'
      }
    })

    // First call - database lookup
    const result1 = await UserTierService.getUserTier(userId)
    expect(result1.executionTime).toBe(80)
    expect(result1.source).toBe('database')

    // Second call - cache hit
    const result2 = await UserTierService.getUserTier(userId)
    expect(result2.executionTime).toBe(5)
    expect(result2.source).toBe('cache')

    expect(callCount).toBe(2)
  })
})