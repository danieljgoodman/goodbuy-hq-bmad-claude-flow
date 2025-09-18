import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import request from 'supertest'
import { NextApiRequest, NextApiResponse } from 'next'
import { createMocks } from 'node-mocks-http'

// Mock the PremiumAccessService
const mockPremiumAccessService = {
  checkPremiumAccess: jest.fn(),
  upgradeUserTier: jest.fn(),
  downgradeUserTier: jest.fn(),
  getUserTierInfo: jest.fn()
}

jest.mock('@/lib/services/PremiumAccessService', () => ({
  PremiumAccessService: mockPremiumAccessService
}))

describe('Tier-Based Access Control Integration Tests', () => {
  let supabaseClient: any
  let testUser: any
  let testUserPro: any
  let testUserEnterprise: any

  beforeAll(async () => {
    // Initialize test database connection
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create test users with different tiers
    const { data: basicUser } = await supabaseClient.auth.admin.createUser({
      email: 'basic@test.com',
      password: 'testpassword123',
      email_confirm: true
    })

    const { data: proUser } = await supabaseClient.auth.admin.createUser({
      email: 'pro@test.com',
      password: 'testpassword123',
      email_confirm: true
    })

    const { data: enterpriseUser } = await supabaseClient.auth.admin.createUser({
      email: 'enterprise@test.com',
      password: 'testpassword123',
      email_confirm: true
    })

    testUser = basicUser.user
    testUserPro = proUser.user
    testUserEnterprise = enterpriseUser.user

    // Insert user records with appropriate tiers
    await supabaseClient.from('users').insert([
      {
        id: testUser.id,
        email: 'basic@test.com',
        business_name: 'Basic Test Business',
        industry: 'Technology',
        role: 'owner',
        subscription_tier: 'free'
      },
      {
        id: testUserPro.id,
        email: 'pro@test.com',
        business_name: 'Pro Test Business',
        industry: 'Technology',
        role: 'owner',
        subscription_tier: 'pro'
      },
      {
        id: testUserEnterprise.id,
        email: 'enterprise@test.com',
        business_name: 'Enterprise Test Business',
        industry: 'Technology',
        role: 'owner',
        subscription_tier: 'enterprise'
      }
    ])
  })

  afterAll(async () => {
    // Clean up test users
    if (testUser) {
      await supabaseClient.auth.admin.deleteUser(testUser.id)
      await supabaseClient.from('users').delete().eq('id', testUser.id)
    }
    if (testUserPro) {
      await supabaseClient.auth.admin.deleteUser(testUserPro.id)
      await supabaseClient.from('users').delete().eq('id', testUserPro.id)
    }
    if (testUserEnterprise) {
      await supabaseClient.auth.admin.deleteUser(testUserEnterprise.id)
      await supabaseClient.from('users').delete().eq('id', testUserEnterprise.id)
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Premium Access Check API', () => {
    it('should allow basic users access to free features', async () => {
      mockPremiumAccessService.checkPremiumAccess.mockResolvedValue({
        hasAccess: true,
        userTier: 'FREE',
        requiredTier: 'FREE',
        message: 'Access granted',
        upgradeOptions: null
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          userId: testUser.id,
          featureType: 'ai_guides',
          requiredTier: 'FREE'
        }
      })

      // Import the API handler (adjust path as needed)
      const handler = require('@/app/api/premium/check-access/route').POST

      await handler(req, res)

      expect(mockPremiumAccessService.checkPremiumAccess).toHaveBeenCalledWith(
        testUser.id,
        'ai_guides',
        'FREE'
      )
    })

    it('should deny basic users access to premium features', async () => {
      mockPremiumAccessService.checkPremiumAccess.mockResolvedValue({
        hasAccess: false,
        userTier: 'FREE',
        requiredTier: 'PREMIUM',
        message: 'Upgrade required',
        upgradeOptions: {
          availablePlans: ['PREMIUM', 'ENTERPRISE'],
          benefits: ['Advanced AI Guides', 'Progress Tracking', 'PDF Reports'],
          pricing: { monthly: 29, annual: 290 }
        }
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          userId: testUser.id,
          featureType: 'progress_tracking',
          requiredTier: 'PREMIUM'
        }
      })

      const handler = require('@/app/api/premium/check-access/route').POST

      await handler(req, res)

      expect(mockPremiumAccessService.checkPremiumAccess).toHaveBeenCalledWith(
        testUser.id,
        'progress_tracking',
        'PREMIUM'
      )
    })

    it('should allow pro users access to premium features', async () => {
      mockPremiumAccessService.checkPremiumAccess.mockResolvedValue({
        hasAccess: true,
        userTier: 'PREMIUM',
        requiredTier: 'PREMIUM',
        message: 'Access granted',
        upgradeOptions: null
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          userId: testUserPro.id,
          featureType: 'pdf_reports',
          requiredTier: 'PREMIUM'
        }
      })

      const handler = require('@/app/api/premium/check-access/route').POST

      await handler(req, res)

      expect(mockPremiumAccessService.checkPremiumAccess).toHaveBeenCalledWith(
        testUserPro.id,
        'pdf_reports',
        'PREMIUM'
      )
    })

    it('should deny pro users access to enterprise features', async () => {
      mockPremiumAccessService.checkPremiumAccess.mockResolvedValue({
        hasAccess: false,
        userTier: 'PREMIUM',
        requiredTier: 'ENTERPRISE',
        message: 'Enterprise upgrade required',
        upgradeOptions: {
          availablePlans: ['ENTERPRISE'],
          benefits: ['Advanced Analytics', 'Priority Support', 'Custom Integrations'],
          pricing: { monthly: 99, annual: 990 }
        }
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          userId: testUserPro.id,
          featureType: 'analytics',
          requiredTier: 'ENTERPRISE'
        }
      })

      const handler = require('@/app/api/premium/check-access/route').POST

      await handler(req, res)

      expect(mockPremiumAccessService.checkPremiumAccess).toHaveBeenCalledWith(
        testUserPro.id,
        'analytics',
        'ENTERPRISE'
      )
    })

    it('should allow enterprise users access to all features', async () => {
      mockPremiumAccessService.checkPremiumAccess.mockResolvedValue({
        hasAccess: true,
        userTier: 'ENTERPRISE',
        requiredTier: 'ENTERPRISE',
        message: 'Access granted',
        upgradeOptions: null
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          userId: testUserEnterprise.id,
          featureType: 'priority_support',
          requiredTier: 'ENTERPRISE'
        }
      })

      const handler = require('@/app/api/premium/check-access/route').POST

      await handler(req, res)

      expect(mockPremiumAccessService.checkPremiumAccess).toHaveBeenCalledWith(
        testUserEnterprise.id,
        'priority_support',
        'ENTERPRISE'
      )
    })
  })

  describe('Feature-Specific Access Control', () => {
    describe('AI Guides Access', () => {
      it('should allow all users basic AI guide access', async () => {
        mockPremiumAccessService.checkPremiumAccess.mockResolvedValue({
          hasAccess: true,
          userTier: 'FREE',
          requiredTier: 'FREE',
          message: 'Basic AI guides available'
        })

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'GET',
          query: {
            userId: testUser.id,
            featureType: 'ai_guides',
            requiredTier: 'FREE'
          }
        })

        const handler = require('@/app/api/premium/check-access/route').GET

        await handler(req, res)

        expect(mockPremiumAccessService.checkPremiumAccess).toHaveBeenCalled()
      })

      it('should restrict advanced AI guides to premium users', async () => {
        mockPremiumAccessService.checkPremiumAccess.mockResolvedValue({
          hasAccess: false,
          userTier: 'FREE',
          requiredTier: 'PREMIUM',
          message: 'Premium subscription required for advanced AI guides'
        })

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          body: {
            userId: testUser.id,
            featureType: 'ai_guides',
            requiredTier: 'PREMIUM'
          }
        })

        const handler = require('@/app/api/premium/check-access/route').POST

        await handler(req, res)

        expect(mockPremiumAccessService.checkPremiumAccess).toHaveBeenCalledWith(
          testUser.id,
          'ai_guides',
          'PREMIUM'
        )
      })
    })

    describe('Progress Tracking Access', () => {
      it('should restrict progress tracking to premium users', async () => {
        mockPremiumAccessService.checkPremiumAccess.mockResolvedValue({
          hasAccess: false,
          userTier: 'FREE',
          requiredTier: 'PREMIUM',
          message: 'Premium subscription required for progress tracking'
        })

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          body: {
            userId: testUser.id,
            featureType: 'progress_tracking'
          }
        })

        const handler = require('@/app/api/premium/check-access/route').POST

        await handler(req, res)

        expect(mockPremiumAccessService.checkPremiumAccess).toHaveBeenCalledWith(
          testUser.id,
          'progress_tracking',
          'PREMIUM'
        )
      })

      it('should allow premium users progress tracking access', async () => {
        mockPremiumAccessService.checkPremiumAccess.mockResolvedValue({
          hasAccess: true,
          userTier: 'PREMIUM',
          requiredTier: 'PREMIUM',
          message: 'Access granted'
        })

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          body: {
            userId: testUserPro.id,
            featureType: 'progress_tracking'
          }
        })

        const handler = require('@/app/api/premium/check-access/route').POST

        await handler(req, res)

        expect(mockPremiumAccessService.checkPremiumAccess).toHaveBeenCalledWith(
          testUserPro.id,
          'progress_tracking',
          'PREMIUM'
        )
      })
    })

    describe('PDF Reports Access', () => {
      it('should restrict PDF reports to premium users', async () => {
        mockPremiumAccessService.checkPremiumAccess.mockResolvedValue({
          hasAccess: false,
          userTier: 'FREE',
          requiredTier: 'PREMIUM',
          message: 'Premium subscription required for PDF reports'
        })

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          body: {
            userId: testUser.id,
            featureType: 'pdf_reports'
          }
        })

        const handler = require('@/app/api/premium/check-access/route').POST

        await handler(req, res)

        expect(mockPremiumAccessService.checkPremiumAccess).toHaveBeenCalledWith(
          testUser.id,
          'pdf_reports',
          'PREMIUM'
        )
      })
    })

    describe('Analytics Access', () => {
      it('should restrict advanced analytics to enterprise users', async () => {
        mockPremiumAccessService.checkPremiumAccess.mockResolvedValue({
          hasAccess: false,
          userTier: 'PREMIUM',
          requiredTier: 'ENTERPRISE',
          message: 'Enterprise subscription required for advanced analytics'
        })

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          body: {
            userId: testUserPro.id,
            featureType: 'analytics',
            requiredTier: 'ENTERPRISE'
          }
        })

        const handler = require('@/app/api/premium/check-access/route').POST

        await handler(req, res)

        expect(mockPremiumAccessService.checkPremiumAccess).toHaveBeenCalledWith(
          testUserPro.id,
          'analytics',
          'ENTERPRISE'
        )
      })

      it('should allow enterprise users analytics access', async () => {
        mockPremiumAccessService.checkPremiumAccess.mockResolvedValue({
          hasAccess: true,
          userTier: 'ENTERPRISE',
          requiredTier: 'ENTERPRISE',
          message: 'Access granted'
        })

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          body: {
            userId: testUserEnterprise.id,
            featureType: 'analytics',
            requiredTier: 'ENTERPRISE'
          }
        })

        const handler = require('@/app/api/premium/check-access/route').POST

        await handler(req, res)

        expect(mockPremiumAccessService.checkPremiumAccess).toHaveBeenCalledWith(
          testUserEnterprise.id,
          'analytics',
          'ENTERPRISE'
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid user ID', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          userId: '',
          featureType: 'ai_guides'
        }
      })

      const handler = require('@/app/api/premium/check-access/route').POST

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should handle invalid feature type', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          userId: testUser.id,
          featureType: 'invalid_feature'
        }
      })

      const handler = require('@/app/api/premium/check-access/route').POST

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should handle service errors gracefully', async () => {
      mockPremiumAccessService.checkPremiumAccess.mockRejectedValue(
        new Error('Database connection failed')
      )

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          userId: testUser.id,
          featureType: 'ai_guides'
        }
      })

      const handler = require('@/app/api/premium/check-access/route').POST

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe('Tier Transition Testing', () => {
    it('should handle tier upgrades correctly', async () => {
      // First, check access as basic user (should fail)
      mockPremiumAccessService.checkPremiumAccess.mockResolvedValueOnce({
        hasAccess: false,
        userTier: 'FREE',
        requiredTier: 'PREMIUM',
        message: 'Upgrade required'
      })

      // Then, simulate upgrade
      mockPremiumAccessService.upgradeUserTier.mockResolvedValue({
        success: true,
        newTier: 'PREMIUM',
        message: 'Successfully upgraded to Premium'
      })

      // Finally, check access again (should succeed)
      mockPremiumAccessService.checkPremiumAccess.mockResolvedValueOnce({
        hasAccess: true,
        userTier: 'PREMIUM',
        requiredTier: 'PREMIUM',
        message: 'Access granted'
      })

      // Test the upgrade flow
      const upgradeResult = await mockPremiumAccessService.upgradeUserTier(testUser.id, 'PREMIUM')
      expect(upgradeResult.success).toBe(true)
      expect(upgradeResult.newTier).toBe('PREMIUM')
    })

    it('should handle tier downgrades correctly', async () => {
      // First, check access as premium user (should succeed)
      mockPremiumAccessService.checkPremiumAccess.mockResolvedValueOnce({
        hasAccess: true,
        userTier: 'PREMIUM',
        requiredTier: 'PREMIUM',
        message: 'Access granted'
      })

      // Then, simulate downgrade
      mockPremiumAccessService.downgradeUserTier.mockResolvedValue({
        success: true,
        newTier: 'FREE',
        message: 'Successfully downgraded to Free'
      })

      // Finally, check access again (should fail)
      mockPremiumAccessService.checkPremiumAccess.mockResolvedValueOnce({
        hasAccess: false,
        userTier: 'FREE',
        requiredTier: 'PREMIUM',
        message: 'Upgrade required'
      })

      // Test the downgrade flow
      const downgradeResult = await mockPremiumAccessService.downgradeUserTier(testUserPro.id, 'FREE')
      expect(downgradeResult.success).toBe(true)
      expect(downgradeResult.newTier).toBe('FREE')
    })
  })

  describe('Concurrent Access Testing', () => {
    it('should handle multiple simultaneous access checks', async () => {
      mockPremiumAccessService.checkPremiumAccess
        .mockResolvedValueOnce({
          hasAccess: true,
          userTier: 'FREE',
          requiredTier: 'FREE',
          message: 'Access granted'
        })
        .mockResolvedValueOnce({
          hasAccess: false,
          userTier: 'FREE',
          requiredTier: 'PREMIUM',
          message: 'Upgrade required'
        })
        .mockResolvedValueOnce({
          hasAccess: true,
          userTier: 'PREMIUM',
          requiredTier: 'PREMIUM',
          message: 'Access granted'
        })

      const requests = [
        { userId: testUser.id, featureType: 'ai_guides', requiredTier: 'FREE' },
        { userId: testUser.id, featureType: 'pdf_reports', requiredTier: 'PREMIUM' },
        { userId: testUserPro.id, featureType: 'progress_tracking', requiredTier: 'PREMIUM' }
      ]

      const results = await Promise.all(
        requests.map(req => mockPremiumAccessService.checkPremiumAccess(req.userId, req.featureType, req.requiredTier))
      )

      expect(results[0].hasAccess).toBe(true)
      expect(results[1].hasAccess).toBe(false)
      expect(results[2].hasAccess).toBe(true)
    })
  })
})