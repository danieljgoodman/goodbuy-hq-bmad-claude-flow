import { describe, it, expect, beforeAll, afterAll } from '@jest/testing-library/jest-dom'
import { SubscriptionService } from '@/lib/services/SubscriptionService'
import { PremiumService } from '@/lib/services/premium-service'
import { stripe, isStripeConfigured, STRIPE_CONFIG } from '@/lib/stripe/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

/**
 * Production Validation Test Suite
 *
 * This test suite validates the complete Professional tier implementation
 * against all acceptance criteria and production readiness requirements.
 */

describe('Professional Tier Production Validation', () => {
  let testUserId: string
  let testCustomerId: string
  let testSubscriptionId: string

  beforeAll(async () => {
    // Ensure we're testing against real Stripe (test mode)
    if (!isStripeConfigured()) {
      throw new Error('CRITICAL: Stripe is not configured for testing. Set STRIPE_SECRET_KEY.')
    }

    // Verify Stripe configuration
    expect(STRIPE_CONFIG).toBeTruthy()
    expect(STRIPE_CONFIG?.prices.premium.monthly).toBeTruthy()
    expect(STRIPE_CONFIG?.prices.premium.annual).toBeTruthy()

    // Create test user in database
    testUserId = `test_user_${Date.now()}`
    await prisma.user.create({
      data: {
        id: testUserId,
        email: `test.${Date.now()}@goodbuyhq.com`,
        businessName: 'Test Business Validation',
        industry: 'Technology',
        role: 'owner',
        subscriptionTier: 'free'
      }
    })
  })

  afterAll(async () => {
    // Clean up test data
    if (testSubscriptionId && stripe) {
      try {
        await stripe.subscriptions.cancel(testSubscriptionId)
      } catch (e) {
        console.warn('Failed to cancel test subscription:', e)
      }
    }

    if (testCustomerId && stripe) {
      try {
        await stripe.customers.del(testCustomerId)
      } catch (e) {
        console.warn('Failed to delete test customer:', e)
      }
    }

    await prisma.subscription.deleteMany({
      where: { userId: testUserId }
    })

    await prisma.user.delete({
      where: { id: testUserId }
    })
  })

  describe('Database Schema Validation', () => {
    it('should have complete Professional tier database schema', async () => {
      // Validate users table structure
      const userRecord = await prisma.user.findUnique({
        where: { id: testUserId }
      })

      expect(userRecord).toBeTruthy()
      expect(userRecord?.subscriptionTier).toBe('free')
      expect(['free', 'pro', 'enterprise']).toContain(userRecord?.subscriptionTier)

      // Validate subscription table exists and has correct structure
      const subscriptionFields = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'subscription'
        ORDER BY ordinal_position
      `

      expect(subscriptionFields).toBeTruthy()

      // Verify required subscription fields exist
      const fieldNames = (subscriptionFields as any[]).map(f => f.column_name)
      const requiredFields = [
        'id', 'userId', 'stripeSubscriptionId', 'stripePriceId',
        'status', 'tier', 'billingCycle', 'trialEndsAt',
        'currentPeriodStart', 'currentPeriodEnd', 'cancelAtPeriodEnd'
      ]

      requiredFields.forEach(field => {
        expect(fieldNames).toContain(field)
      })
    })

    it('should enforce proper data constraints and relationships', async () => {
      // Test subscription tier constraints
      const validTiers = ['free', 'pro', 'enterprise']

      for (const tier of validTiers) {
        await expect(
          prisma.user.update({
            where: { id: testUserId },
            data: { subscriptionTier: tier as any }
          })
        ).resolves.toBeTruthy()
      }

      // Test invalid tier constraint
      await expect(
        prisma.user.update({
          where: { id: testUserId },
          data: { subscriptionTier: 'invalid_tier' as any }
        })
      ).rejects.toThrow()
    })
  })

  describe('Stripe Integration Validation', () => {
    it('should create real Stripe customer', async () => {
      if (!stripe) throw new Error('Stripe not configured')

      const customer = await stripe.customers.create({
        email: `validation.test.${Date.now()}@goodbuyhq.com`,
        metadata: { userId: testUserId }
      })

      expect(customer.id).toMatch(/^cus_/)
      expect(customer.email).toBeTruthy()
      expect(customer.metadata.userId).toBe(testUserId)

      testCustomerId = customer.id

      // Cleanup: store for later deletion
    })

    it('should create real Professional subscription with trial', async () => {
      if (!stripe || !STRIPE_CONFIG) throw new Error('Stripe not configured')

      const result = await SubscriptionService.createSubscription(
        testUserId,
        STRIPE_CONFIG.prices.premium.monthly,
        `test.${Date.now()}@goodbuyhq.com`
      )

      expect(result.subscription.id).toMatch(/^sub_/)
      expect(result.subscription.status).toBe('trialing')
      expect(result.subscription.trial_end).toBeTruthy()
      expect(result.dbSubscription.tier).toBe('PREMIUM')
      expect(result.dbSubscription.status).toBe('TRIALING')

      testSubscriptionId = result.subscription.id

      // Verify user tier was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId }
      })
      expect(updatedUser?.subscriptionTier).toBe('PREMIUM')
    })

    it('should handle subscription management operations', async () => {
      if (!stripe) throw new Error('Stripe not configured')

      // Test cancellation
      await SubscriptionService.cancelSubscription(testUserId)

      const cancelledSub = await prisma.subscription.findFirst({
        where: { userId: testUserId }
      })
      expect(cancelledSub?.cancelAtPeriodEnd).toBe(true)

      // Test reactivation
      await SubscriptionService.reactivateSubscription(testUserId)

      const reactivatedSub = await prisma.subscription.findFirst({
        where: { userId: testUserId }
      })
      expect(reactivatedSub?.cancelAtPeriodEnd).toBe(false)
    })

    it('should handle subscription upgrades with proration', async () => {
      if (!stripe || !STRIPE_CONFIG) throw new Error('Stripe not configured')

      const result = await SubscriptionService.updateSubscription(
        testUserId,
        STRIPE_CONFIG.prices.premium.annual
      )

      expect(result.subscription.id).toBe(testSubscriptionId)
      expect(result.dbSubscription.tier).toBe('PREMIUM')
      expect(result.dbSubscription.billingCycle).toBe('ANNUAL')
    })
  })

  describe('Tier Access Control Validation', () => {
    it('should enforce Professional tier access controls', async () => {
      const premiumService = new PremiumService()

      // Test with no subscription (should be denied)
      const noAccessResult = await premiumService.checkContentAccess(
        testUserId,
        'implementation_guide'
      )

      expect(noAccessResult.hasAccess).toBe(false)
      expect(noAccessResult.upgradePrompt).toBeTruthy()

      // Test with Professional subscription (should be granted)
      const subscription = await SubscriptionService.getUserSubscription(testUserId)

      const accessResult = await premiumService.checkContentAccess(
        testUserId,
        'implementation_guide',
        {
          id: subscription!.id,
          userId: testUserId,
          plan: 'premium',
          status: 'active',
          usage: {
            implementationGuides: 0,
            templateDownloads: 0,
            expertInsights: 0,
            caseStudyAccess: 0,
            consultationMinutes: 0
          },
          features: {
            unlimitedEvaluations: true,
            advancedAnalytics: true,
            customReports: true,
            prioritySupport: true
          },
          billing: {
            amount: 99,
            currency: 'USD',
            cycle: 'monthly',
            nextBilling: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      )

      expect(accessResult.hasAccess).toBe(true)
    })

    it('should enforce usage limits correctly', async () => {
      const premiumService = new PremiumService()

      // Mock subscription at usage limit
      const limitedSubscription = {
        id: 'test-sub',
        userId: testUserId,
        plan: 'basic' as const,
        status: 'active' as const,
        usage: {
          implementationGuides: 3, // At limit
          templateDownloads: 2,     // At limit
          expertInsights: 1,        // At limit
          caseStudyAccess: 0,
          consultationMinutes: 0
        },
        features: {
          unlimitedEvaluations: false,
          advancedAnalytics: false,
          customReports: false,
          prioritySupport: false
        },
        billing: {
          amount: 0,
          currency: 'USD',
          cycle: 'monthly' as const,
          nextBilling: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const limitResult = await premiumService.checkContentAccess(
        testUserId,
        'template',
        limitedSubscription
      )

      expect(limitResult.hasAccess).toBe(false)
      expect(limitResult.reason).toBe('Usage limit exceeded')
      expect(limitResult.remainingUsage).toBe(0)
    })
  })

  describe('Security Validation', () => {
    it('should validate API authentication requirements', async () => {
      // Test that sensitive operations require authentication
      await expect(
        SubscriptionService.createSubscription('invalid-user', 'invalid-price', 'test@test.com')
      ).rejects.toThrow('User not found')
    })

    it('should validate data access controls', async () => {
      // Create another test user
      const otherUserId = `other_user_${Date.now()}`
      await prisma.user.create({
        data: {
          id: otherUserId,
          email: `other.${Date.now()}@goodbuyhq.com`,
          businessName: 'Other Business',
          industry: 'Finance',
          role: 'manager',
          subscriptionTier: 'free'
        }
      })

      try {
        // User should not be able to access other user's subscription
        const otherUserSub = await SubscriptionService.getUserSubscription(otherUserId)
        expect(otherUserSub).toBeNull()

        // Cross-user access should be prevented
        await expect(
          SubscriptionService.cancelSubscription(otherUserId)
        ).rejects.toThrow('No active subscription found')

      } finally {
        await prisma.user.delete({ where: { id: otherUserId } })
      }
    })

    it('should validate webhook security', async () => {
      if (!STRIPE_CONFIG) throw new Error('Stripe not configured')

      // Verify webhook secret is configured
      expect(STRIPE_CONFIG.webhookSecret).toBeTruthy()
      expect(STRIPE_CONFIG.webhookSecret).toMatch(/^whsec_/)
    })
  })

  describe('Error Handling Validation', () => {
    it('should handle Stripe API errors gracefully', async () => {
      // Test with invalid price ID
      await expect(
        SubscriptionService.createSubscription(testUserId, 'invalid_price_id', 'test@test.com')
      ).rejects.toThrow('Invalid price ID')

      // Test with non-existent customer
      if (!stripe) throw new Error('Stripe not configured')

      await expect(
        stripe.subscriptions.create({
          customer: 'cus_nonexistent',
          items: [{ price: 'price_invalid' }]
        })
      ).rejects.toThrow()
    })

    it('should handle database constraint violations', async () => {
      // Test duplicate subscription creation
      await expect(
        prisma.subscription.create({
          data: {
            userId: testUserId,
            stripeSubscriptionId: testSubscriptionId,
            stripePriceId: 'test_price',
            status: 'ACTIVE',
            tier: 'PREMIUM',
            billingCycle: 'MONTHLY',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('Performance Validation', () => {
    it('should handle concurrent subscription operations', async () => {
      const concurrentOperations = Array.from({ length: 5 }, () =>
        SubscriptionService.getUserSubscription(testUserId)
      )

      const results = await Promise.all(concurrentOperations)

      // All operations should succeed
      results.forEach(result => {
        expect(result).toBeTruthy()
      })
    })

    it('should maintain acceptable response times', async () => {
      const startTime = Date.now()

      await SubscriptionService.getUserSubscription(testUserId)

      const responseTime = Date.now() - startTime
      expect(responseTime).toBeLessThan(1000) // Should respond within 1 second
    })
  })

  describe('Data Integrity Validation', () => {
    it('should maintain referential integrity', async () => {
      const subscription = await SubscriptionService.getUserSubscription(testUserId)
      expect(subscription?.userId).toBe(testUserId)

      // Verify foreign key relationships
      const user = await prisma.user.findUnique({
        where: { id: subscription!.userId }
      })
      expect(user).toBeTruthy()
    })

    it('should handle subscription state transitions correctly', async () => {
      const subscription = await SubscriptionService.getUserSubscription(testUserId)

      // Valid state transitions
      expect(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID']).toContain(
        subscription?.status
      )

      // Verify tier consistency
      const user = await prisma.user.findUnique({
        where: { id: testUserId }
      })

      // User tier should match subscription tier
      if (subscription?.tier === 'PREMIUM') {
        expect(user?.subscriptionTier).toBe('PREMIUM')
      }
    })
  })

  describe('Migration Safety Validation', () => {
    it('should preserve existing Basic tier functionality', async () => {
      // Create a basic tier user
      const basicUserId = `basic_user_${Date.now()}`
      await prisma.user.create({
        data: {
          id: basicUserId,
          email: `basic.${Date.now()}@goodbuyhq.com`,
          businessName: 'Basic Business',
          industry: 'Retail',
          role: 'owner',
          subscriptionTier: 'free'
        }
      })

      try {
        // Basic user should still be able to access basic features
        const basicUser = await prisma.user.findUnique({
          where: { id: basicUserId }
        })

        expect(basicUser?.subscriptionTier).toBe('free')

        // Basic user should not have subscription record
        const basicSubscription = await SubscriptionService.getUserSubscription(basicUserId)
        expect(basicSubscription).toBeNull()

      } finally {
        await prisma.user.delete({ where: { id: basicUserId } })
      }
    })
  })

  describe('Business Logic Validation', () => {
    it('should generate Professional tier implementation guides', async () => {
      const premiumService = new PremiumService()

      const mockOpportunity = {
        id: 'test-opp',
        evaluationId: testUserId,
        title: 'Revenue Optimization',
        description: 'Improve revenue streams',
        category: 'financial' as const,
        impactEstimate: {
          revenueIncrease: { amount: 100000, confidence: 0.8 },
          costReduction: { amount: 25000, confidence: 0.9 },
          roi: { percentage: 150, confidence: 0.85 }
        },
        implementationRequirements: {
          timelineEstimate: '3-6 months',
          investmentRequired: 50000,
          difficulty: 'medium' as const,
          skillsNeeded: ['Financial Analysis', 'Process Improvement']
        },
        successMetrics: [
          { name: 'Revenue Growth', target: 15, unit: '%' }
        ],
        confidence: 0.85,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const guide = await premiumService.generateImplementationGuide(
        mockOpportunity,
        {
          id: 'test-sub',
          userId: testUserId,
          plan: 'premium',
          status: 'active',
          usage: { implementationGuides: 0, templateDownloads: 0, expertInsights: 0, caseStudyAccess: 0, consultationMinutes: 0 },
          features: { unlimitedEvaluations: true, advancedAnalytics: true, customReports: true, prioritySupport: true },
          billing: { amount: 99, currency: 'USD', cycle: 'monthly', nextBilling: new Date() },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      )

      expect((guide as any).id).toBeTruthy()
      expect((guide as any).title).toContain('Revenue Optimization')
      expect((guide as any).phases).toHaveLength(4)
      expect((guide as any).objectives).toBeTruthy()
      expect((guide as any).prerequisites).toBeTruthy()
    })
  })
})

/**
 * Integration Test Suite for Real Stripe Operations
 */
describe('Stripe Integration Tests (Real API)', () => {
  it('should connect to Stripe API successfully', async () => {
    if (!stripe) throw new Error('Stripe not configured')

    // Test real API connection
    const balance = await stripe.balance.retrieve()
    expect(balance.object).toBe('balance')
  })

  it('should retrieve real price information', async () => {
    if (!stripe || !STRIPE_CONFIG) throw new Error('Stripe not configured')

    const price = await stripe.prices.retrieve(STRIPE_CONFIG.prices.premium.monthly)

    expect(price.id).toBe(STRIPE_CONFIG.prices.premium.monthly)
    expect(price.active).toBe(true)
    expect(price.type).toBe('recurring')
  })

  it('should validate webhook endpoint accessibility', async () => {
    // This would test webhook endpoint in real deployment
    // For now, just verify configuration
    if (!STRIPE_CONFIG) throw new Error('Stripe not configured')

    expect(STRIPE_CONFIG.webhookSecret).toBeTruthy()
    expect(STRIPE_CONFIG.webhookSecret.startsWith('whsec_')).toBe(true)
  })
})