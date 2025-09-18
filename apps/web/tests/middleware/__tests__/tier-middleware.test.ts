/**
 * Integration tests for tier validation middleware
 * Tests middleware integration, request processing, and response handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
  TierValidationMiddleware,
  TierValidationOptions,
  TierValidationResult
} from '@/middleware/tier-validation'
import { PremiumAccessCheck } from '@/lib/services/PremiumAccessService'

// Mock external dependencies
vi.mock('@/lib/services/PremiumAccessService', () => ({
  PremiumAccessService: {
    checkPremiumAccess: vi.fn()
  }
}))

vi.mock('@/lib/auth', () => ({
  getServerAuth: vi.fn()
}))

describe('TierValidationMiddleware', () => {
  let mockRequest: NextRequest
  let mockPremiumAccess: any
  let mockGetServerAuth: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock request
    mockRequest = {
      method: 'GET',
      url: 'https://example.com/api/test',
      headers: new Map([
        ['authorization', 'Bearer test-token'],
        ['x-user-email', 'test@example.com']
      ]),
      json: vi.fn(),
      clone: vi.fn(() => mockRequest)
    } as any

    // Setup mock dependencies
    const { PremiumAccessService } = require('@/lib/services/PremiumAccessService')
    mockPremiumAccess = PremiumAccessService.checkPremiumAccess

    const { getServerAuth } = require('@/lib/auth')
    mockGetServerAuth = getServerAuth
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('validateTier', () => {
    it('should return no access for unauthenticated users', async () => {
      // No user ID in request
      mockRequest.json = vi.fn().mockResolvedValue({})
      mockRequest.url = 'https://example.com/api/test'

      const result = await TierValidationMiddleware.validateTier(mockRequest)

      expect(result).toMatchObject({
        hasAccess: false,
        userTier: 'NONE',
        userId: '',
        user: null,
        accessCheck: {
          hasAccess: false,
          reason: 'User not authenticated'
        }
      })
    })

    it('should extract user ID from POST request body', async () => {
      const testUserId = 'user_123'
      mockRequest.method = 'POST'
      mockRequest.json = vi.fn().mockResolvedValue({ userId: testUserId })

      mockGetServerAuth.mockResolvedValue({
        id: testUserId,
        subscriptionTier: 'PROFESSIONAL'
      })

      mockPremiumAccess.mockResolvedValue({
        hasAccess: true,
        subscriptionStatus: 'active'
      })

      const result = await TierValidationMiddleware.validateTier(mockRequest, {
        requiredTier: 'PREMIUM'
      })

      expect(result).toMatchObject({
        hasAccess: true,
        userTier: 'PROFESSIONAL',
        userId: testUserId
      })
      expect(mockPremiumAccess).toHaveBeenCalledWith(testUserId, 'analytics', 'PREMIUM')
    })

    it('should extract user ID from query parameters', async () => {
      const testUserId = 'user_456'
      mockRequest.url = `https://example.com/api/test?userId=${testUserId}`

      mockGetServerAuth.mockResolvedValue({
        id: testUserId,
        subscriptionTier: 'ENTERPRISE'
      })

      mockPremiumAccess.mockResolvedValue({
        hasAccess: true,
        subscriptionStatus: 'active'
      })

      const result = await TierValidationMiddleware.validateTier(mockRequest)

      expect(result.userId).toBe(testUserId)
    })

    it('should validate premium access with custom options', async () => {
      const testUserId = 'user_789'
      mockRequest.json = vi.fn().mockResolvedValue({ userId: testUserId })

      mockGetServerAuth.mockResolvedValue({
        id: testUserId,
        subscriptionTier: 'PROFESSIONAL'
      })

      mockPremiumAccess.mockResolvedValue({
        hasAccess: true,
        subscriptionStatus: 'active'
      })

      const options: TierValidationOptions = {
        requiredTier: 'ENTERPRISE',
        featureType: 'benchmarks',
        fallbackToBasic: false
      }

      await TierValidationMiddleware.validateTier(mockRequest, options)

      expect(mockPremiumAccess).toHaveBeenCalledWith(testUserId, 'benchmarks', 'ENTERPRISE')
    })

    it('should handle premium access denial', async () => {
      const testUserId = 'user_no_access'
      mockRequest.json = vi.fn().mockResolvedValue({ userId: testUserId })

      mockGetServerAuth.mockResolvedValue({
        id: testUserId,
        subscriptionTier: 'FREE'
      })

      mockPremiumAccess.mockResolvedValue({
        hasAccess: false,
        reason: 'Subscription required',
        upgradeRequired: true,
        subscriptionStatus: 'none'
      })

      const result = await TierValidationMiddleware.validateTier(mockRequest, {
        fallbackToBasic: false
      })

      expect(result).toMatchObject({
        hasAccess: false,
        userTier: 'FREE',
        accessCheck: {
          hasAccess: false,
          reason: 'Subscription required',
          upgradeRequired: true
        }
      })
    })

    it('should fallback to basic access when enabled', async () => {
      const testUserId = 'user_fallback'
      mockRequest.json = vi.fn().mockResolvedValue({ userId: testUserId })

      mockGetServerAuth.mockResolvedValue({
        id: testUserId,
        subscriptionTier: 'FREE'
      })

      mockPremiumAccess.mockResolvedValue({
        hasAccess: false,
        reason: 'Subscription required'
      })

      const result = await TierValidationMiddleware.validateTier(mockRequest, {
        fallbackToBasic: true
      })

      expect(result.hasAccess).toBe(true)
    })

    it('should handle user not found scenario', async () => {
      const testUserId = 'user_not_found'
      mockRequest.json = vi.fn().mockResolvedValue({ userId: testUserId })

      mockGetServerAuth.mockResolvedValue(null)

      const result = await TierValidationMiddleware.validateTier(mockRequest)

      expect(result).toMatchObject({
        hasAccess: false,
        userTier: 'NONE',
        userId: testUserId,
        user: null,
        accessCheck: {
          hasAccess: false,
          reason: 'User not found'
        }
      })
    })

    it('should handle validation errors gracefully', async () => {
      const testUserId = 'user_error'
      mockRequest.json = vi.fn().mockResolvedValue({ userId: testUserId })

      mockGetServerAuth.mockRejectedValue(new Error('Database error'))

      const result = await TierValidationMiddleware.validateTier(mockRequest, {
        fallbackToBasic: true
      })

      expect(result).toMatchObject({
        hasAccess: true, // fallbackToBasic is true
        userTier: 'FREE',
        userId: '',
        user: null,
        accessCheck: {
          hasAccess: false,
          reason: 'Validation error'
        }
      })
    })

    it('should handle malformed request body', async () => {
      mockRequest.method = 'POST'
      mockRequest.json = vi.fn().mockRejectedValue(new Error('Invalid JSON'))

      const result = await TierValidationMiddleware.validateTier(mockRequest)

      expect(result).toMatchObject({
        hasAccess: false,
        userTier: 'NONE',
        userId: ''
      })
    })
  })

  describe('createMiddleware', () => {
    it('should create middleware function that validates and calls handler', async () => {
      const testUserId = 'user_middleware'
      const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }))

      mockRequest.json = vi.fn().mockResolvedValue({ userId: testUserId })
      mockGetServerAuth.mockResolvedValue({
        id: testUserId,
        subscriptionTier: 'PROFESSIONAL'
      })
      mockPremiumAccess.mockResolvedValue({
        hasAccess: true,
        subscriptionStatus: 'active'
      })

      const middleware = TierValidationMiddleware.createMiddleware({
        requiredTier: 'PREMIUM',
        featureType: 'analytics'
      })

      const response = await middleware(mockRequest, mockHandler)

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, expect.objectContaining({
        hasAccess: true,
        userTier: 'PROFESSIONAL',
        userId: testUserId
      }))
      expect(response).toBeDefined()
    })

    it('should return access denied response when access is denied', async () => {
      const testUserId = 'user_denied'
      const mockHandler = vi.fn()

      mockRequest.json = vi.fn().mockResolvedValue({ userId: testUserId })
      mockGetServerAuth.mockResolvedValue({
        id: testUserId,
        subscriptionTier: 'FREE'
      })
      mockPremiumAccess.mockResolvedValue({
        hasAccess: false,
        reason: 'Subscription required',
        upgradeRequired: true
      })

      const middleware = TierValidationMiddleware.createMiddleware({
        requiredTier: 'PREMIUM',
        fallbackToBasic: false,
        customErrorMessage: 'Premium subscription required'
      })

      const response = await middleware(mockRequest, mockHandler)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(403)

      const responseBody = await response.json()
      expect(responseBody).toMatchObject({
        error: 'Premium subscription required',
        accessRequired: true,
        reason: 'Subscription required',
        upgradeRequired: true
      })
    })

    it('should call handler even when access denied if fallbackToBasic is true', async () => {
      const testUserId = 'user_fallback_middleware'
      const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }))

      mockRequest.json = vi.fn().mockResolvedValue({ userId: testUserId })
      mockGetServerAuth.mockResolvedValue({
        id: testUserId,
        subscriptionTier: 'FREE'
      })
      mockPremiumAccess.mockResolvedValue({
        hasAccess: false,
        reason: 'Subscription required'
      })

      const middleware = TierValidationMiddleware.createMiddleware({
        requiredTier: 'PREMIUM',
        fallbackToBasic: true
      })

      const response = await middleware(mockRequest, mockHandler)

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, expect.objectContaining({
        hasAccess: true, // fallbackToBasic makes this true
        userTier: 'FREE'
      }))
    })
  })

  describe('createAccessDeniedResponse', () => {
    it('should create standardized access denied response', () => {
      const accessCheck: PremiumAccessCheck = {
        hasAccess: false,
        reason: 'Subscription required',
        subscriptionStatus: 'none',
        upgradeRequired: true,
        trialInfo: {
          isOnTrial: false
        }
      }

      const response = TierValidationMiddleware.createAccessDeniedResponse(
        accessCheck,
        'Custom error message'
      )

      expect(response.status).toBe(403)
    })

    it('should use default message when custom message not provided', () => {
      const accessCheck: PremiumAccessCheck = {
        hasAccess: false,
        reason: 'Subscription required'
      }

      const response = TierValidationMiddleware.createAccessDeniedResponse(accessCheck)

      expect(response.status).toBe(403)
    })
  })

  describe('filterDataByTier', () => {
    const mockEvaluationData = {
      valuations: {
        revenue_multiple: { value: 1000000 },
        asset_based: { value: 800000 },
        dcf_analysis: { value: 1200000 },
        market_comparison: { value: 1100000 }
      },
      opportunities: [
        { type: 'pricing', impact: 'high' },
        { type: 'cost_reduction', impact: 'medium' },
        { type: 'automation', impact: 'high' },
        { type: 'market_expansion', impact: 'low' },
        { type: 'digital_transformation', impact: 'medium' }
      ],
      insights: {
        market_analysis: { score: 85 },
        competitive_positioning: { score: 78 },
        growth_projections: { trend: 'positive' },
        financial_health: { rating: 'good' }
      }
    }

    it('should limit evaluation data for FREE tier users', () => {
      const filtered = TierValidationMiddleware.filterDataByTier(
        mockEvaluationData,
        'FREE',
        'evaluation'
      )

      // Should only have basic valuation methods
      expect(Object.keys(filtered.valuations)).toEqual(['revenue_multiple', 'asset_based'])

      // Should limit opportunities to top 3
      expect(filtered.opportunities).toHaveLength(3)

      // Should remove premium insights
      expect(filtered.insights.market_analysis).toBeNull()
      expect(filtered.insights.competitive_positioning).toBeNull()
      expect(filtered.insights.growth_projections).toBeNull()
      expect(filtered.insights.financial_health).toBeDefined() // Should keep basic insights
    })

    it('should not filter data for PREMIUM tier users', () => {
      const filtered = TierValidationMiddleware.filterDataByTier(
        mockEvaluationData,
        'PREMIUM',
        'evaluation'
      )

      expect(filtered).toEqual(mockEvaluationData)
    })

    it('should not filter data for ENTERPRISE tier users', () => {
      const filtered = TierValidationMiddleware.filterDataByTier(
        mockEvaluationData,
        'ENTERPRISE',
        'evaluation'
      )

      expect(filtered).toEqual(mockEvaluationData)
    })

    it('should filter report data for basic users', () => {
      const mockReportData = {
        sections: Array.from({ length: 10 }, (_, i) => ({ id: i, title: `Section ${i}` })),
        charts: Array.from({ length: 8 }, (_, i) => ({ id: i, type: `Chart ${i}` }))
      }

      const filtered = TierValidationMiddleware.filterDataByTier(
        mockReportData,
        'FREE',
        'report'
      )

      expect(filtered.sections).toHaveLength(5)
      expect(filtered.charts).toHaveLength(3)
    })

    it('should filter analytics data for basic users', () => {
      const mockAnalyticsData = {
        trends: Array.from({ length: 90 }, (_, i) => ({ day: i, value: Math.random() })),
        benchmarks: { industry: 'tech', metrics: ['revenue', 'growth'] },
        predictions: { nextQuarter: 'growth', confidence: 0.85 }
      }

      const filtered = TierValidationMiddleware.filterDataByTier(
        mockAnalyticsData,
        'FREE',
        'analytics'
      )

      expect(filtered.trends).toHaveLength(30) // Last 30 days only
      expect(filtered.benchmarks).toBeNull()
      expect(filtered.predictions).toBeNull()
    })

    it('should handle non-object data gracefully', () => {
      const testCases = [null, undefined, 'string', 123, [], true]

      for (const testData of testCases) {
        const filtered = TierValidationMiddleware.filterDataByTier(
          testData,
          'FREE',
          'evaluation'
        )
        expect(filtered).toBe(testData)
      }
    })

    it('should default to basic tier limits for unknown tiers', () => {
      const filtered = TierValidationMiddleware.filterDataByTier(
        mockEvaluationData,
        'UNKNOWN_TIER',
        'evaluation'
      )

      // Should apply basic tier limits
      expect(Object.keys(filtered.valuations)).toEqual(['revenue_multiple', 'asset_based'])
      expect(filtered.opportunities).toHaveLength(3)
    })
  })

  describe('checkFeatureAccess', () => {
    it('should check feature access with correct tier mappings', async () => {
      const testUserId = 'user_feature_test'

      // Test each feature with its required tier
      const featureTests = [
        { feature: 'ai_guides', expectedTier: 'PREMIUM' },
        { feature: 'progress_tracking', expectedTier: 'PREMIUM' },
        { feature: 'pdf_reports', expectedTier: 'PREMIUM' },
        { feature: 'analytics', expectedTier: 'PREMIUM' },
        { feature: 'benchmarks', expectedTier: 'ENTERPRISE' },
        { feature: 'priority_support', expectedTier: 'PREMIUM' }
      ]

      for (const { feature, expectedTier } of featureTests) {
        mockPremiumAccess.mockResolvedValue({
          hasAccess: true,
          subscriptionStatus: 'active'
        })

        await TierValidationMiddleware.checkFeatureAccess(
          testUserId,
          feature as any
        )

        expect(mockPremiumAccess).toHaveBeenCalledWith(
          testUserId,
          feature,
          expectedTier
        )
      }
    })
  })

  describe('createTierAwareResponse', () => {
    const mockTierInfo: TierValidationResult = {
      hasAccess: true,
      userTier: 'PROFESSIONAL',
      userId: 'user_123',
      user: { id: 'user_123' },
      accessCheck: { hasAccess: true }
    }

    it('should create response with filtered data and tier info', () => {
      const testData = { value: 100, features: ['test'] }

      const response = TierValidationMiddleware.createTierAwareResponse(
        testData,
        mockTierInfo
      )

      expect(response.status).toBe(200)
    })

    it('should include upgrade information when requested and needed', () => {
      const limitedTierInfo: TierValidationResult = {
        hasAccess: false,
        userTier: 'FREE',
        userId: 'user_123',
        user: { id: 'user_123' },
        accessCheck: {
          hasAccess: false,
          upgradeRequired: true,
          reason: 'Subscription required'
        }
      }

      const response = TierValidationMiddleware.createTierAwareResponse(
        { test: 'data' },
        limitedTierInfo,
        { includeUpgradeInfo: true }
      )

      expect(response.status).toBe(200)
    })

    it('should filter data according to user tier', () => {
      const basicTierInfo: TierValidationResult = {
        hasAccess: true,
        userTier: 'FREE',
        userId: 'user_123',
        user: { id: 'user_123' },
        accessCheck: { hasAccess: true }
      }

      const evaluationData = {
        valuations: {
          revenue_multiple: 100,
          dcf_analysis: 200
        }
      }

      const response = TierValidationMiddleware.createTierAwareResponse(
        evaluationData,
        basicTierInfo
      )

      expect(response.status).toBe(200)
    })
  })

  describe('Performance and stress testing', () => {
    it('should handle multiple concurrent validation requests', async () => {
      const concurrentRequests = 50
      const userIds = Array.from({ length: concurrentRequests }, (_, i) => `user_${i}`)

      mockGetServerAuth.mockImplementation((email: string) =>
        Promise.resolve({
          id: email.replace('@example.com', ''),
          subscriptionTier: 'PROFESSIONAL'
        })
      )

      mockPremiumAccess.mockResolvedValue({
        hasAccess: true,
        subscriptionStatus: 'active'
      })

      const requests = userIds.map(userId => {
        const request = {
          ...mockRequest,
          json: vi.fn().mockResolvedValue({ userId }),
          headers: new Map([['x-user-email', `${userId}@example.com`]])
        }
        return TierValidationMiddleware.validateTier(request as any)
      })

      const startTime = performance.now()
      const results = await Promise.all(requests)
      const endTime = performance.now()

      expect(results).toHaveLength(concurrentRequests)
      expect(results.every(r => r.hasAccess)).toBe(true)

      // Should complete all validations in reasonable time
      const totalTime = endTime - startTime
      expect(totalTime).toBeLessThan(1000) // 1 second for 50 requests
    })

    it('should maintain performance under error conditions', async () => {
      const errorRequests = 20

      mockGetServerAuth.mockRejectedValue(new Error('Database timeout'))

      const requests = Array.from({ length: errorRequests }, () =>
        TierValidationMiddleware.validateTier(mockRequest, { fallbackToBasic: true })
      )

      const startTime = performance.now()
      const results = await Promise.all(requests)
      const endTime = performance.now()

      expect(results).toHaveLength(errorRequests)
      expect(results.every(r => r.hasAccess)).toBe(true) // fallbackToBasic

      // Should handle errors quickly
      const totalTime = endTime - startTime
      expect(totalTime).toBeLessThan(500) // 500ms for 20 error cases
    })
  })
})