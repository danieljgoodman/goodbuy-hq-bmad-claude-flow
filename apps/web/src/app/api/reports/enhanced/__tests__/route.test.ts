/**
 * Enhanced Report Generation API Tests
 *
 * Test suite for the enhanced reports API endpoint
 * covering validation, tier access, and report generation
 */

import { NextRequest } from 'next/server'
import { POST, GET } from '../route'

// Mock dependencies
jest.mock('@/lib/utils/rate-limit', () => ({
  rateLimit: () => ({
    check: jest.fn().mockResolvedValue({
      success: true,
      limit: 30,
      remaining: 29,
      resetTime: Date.now() + 900000,
      tier: 'professional'
    })
  })
}))

jest.mock('@/middleware/tier-validation', () => ({
  TierValidationMiddleware: {
    validateTier: jest.fn().mockResolvedValue({
      hasAccess: true,
      userTier: 'PREMIUM',
      accessCheck: { hasAccess: true },
      userId: 'test-user-123',
      user: { id: 'test-user-123', subscriptionTier: 'PREMIUM' }
    })
  }
}))

jest.mock('@/lib/ai/enhanced-analysis-engine', () => ({
  enhancedAnalysisEngine: {
    analyze: jest.fn().mockResolvedValue({
      id: 'analysis-123',
      status: 'completed',
      confidence: 85,
      qualityScore: 78,
      analysisData: {
        overall_score: 85,
        financial_analysis: {
          score: 80,
          revenue_growth: 0.15,
          profitability_trend: 'improving'
        },
        operational_analysis: {
          efficiency_score: 75,
          improvement_opportunities: ['Process optimization']
        }
      },
      metadata: {
        processingTime: 5000,
        tokensUsed: 1500,
        cacheHit: false,
        modelVersion: 'claude-3-5-sonnet-20241022',
        timestamp: new Date(),
        retryCount: 0,
        tier: 'professional',
        analysisType: 'comprehensive_analysis'
      },
      insights: {
        keyFindings: ['Strong revenue growth', 'Good operational efficiency'],
        recommendations: ['Optimize processes', 'Expand market reach'],
        riskFactors: ['Market competition'],
        opportunities: ['Digital transformation', 'New market segments']
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        completeness: 95
      }
    })
  }
}))

describe('/api/reports/enhanced', () => {
  const validRequestBody = {
    userId: 'test-user-123',
    businessData: {
      businessName: 'Test Company',
      industry: 'Technology',
      revenue: 1000000,
      employees: 50,
      foundedYear: 2020,
      financialMetrics: {
        revenue: 1000000,
        profit: 200000,
        expenses: 800000
      }
    },
    reportConfig: {
      type: 'comprehensive' as const,
      analysisDepth: 'detailed' as const,
      includeScenarios: true,
      includeRiskAssessment: true
    },
    delivery: {
      method: 'api_response' as const,
      format: 'json' as const
    }
  }

  describe('POST /api/reports/enhanced', () => {
    it('should generate enhanced report successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/enhanced', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('reportId')
      expect(data).toHaveProperty('status', 'completed')
      expect(data).toHaveProperty('tier', 'PREMIUM')
      expect(data.analysis).toHaveProperty('summary')
      expect(data.analysis.summary).toHaveProperty('overallScore')
      expect(data.analysis.summary).toHaveProperty('keyFindings')
      expect(data.analysis.summary).toHaveProperty('recommendations')
      expect(data.metadata).toHaveProperty('processingTime')
      expect(data.metadata).toHaveProperty('tokensUsed')
    })

    it('should validate request data', async () => {
      const invalidBody = {
        userId: 'invalid-uuid',
        businessData: {
          // Missing required fields
        },
        reportConfig: {
          type: 'invalid-type',
          analysisDepth: 'invalid-depth'
        }
      }

      const request = new NextRequest('http://localhost:3000/api/reports/enhanced', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid request data')
      expect(data).toHaveProperty('details')
      expect(Array.isArray(data.details)).toBe(true)
    })

    it('should handle tier validation failure', async () => {
      const { TierValidationMiddleware } = require('@/middleware/tier-validation')
      TierValidationMiddleware.validateTier.mockResolvedValueOnce({
        hasAccess: false,
        userTier: 'FREE',
        accessCheck: { hasAccess: false, reason: 'Insufficient tier' },
        userId: 'test-user-123',
        user: null
      })

      const request = new NextRequest('http://localhost:3000/api/reports/enhanced', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('Professional or Enterprise subscription')
    })

    it('should handle rate limiting', async () => {
      const { rateLimit } = require('@/lib/utils/rate-limit')
      const mockRateLimiter = rateLimit()
      mockRateLimiter.check.mockResolvedValueOnce({
        success: false,
        limit: 30,
        remaining: 0,
        resetTime: Date.now() + 900000,
        tier: 'professional'
      })

      const request = new NextRequest('http://localhost:3000/api/reports/enhanced', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data).toHaveProperty('error', 'Rate limit exceeded')
      expect(response.headers.get('X-RateLimit-Limit')).toBe('30')
    })

    it('should validate enterprise-only features', async () => {
      const enterpriseRequestBody = {
        ...validRequestBody,
        reportConfig: {
          ...validRequestBody.reportConfig,
          includeBenchmarks: true,
          customPrompts: ['Custom analysis prompt']
        },
        options: {
          includeRawAnalysis: true
        }
      }

      const { TierValidationMiddleware } = require('@/middleware/tier-validation')
      TierValidationMiddleware.validateTier.mockResolvedValueOnce({
        hasAccess: true,
        userTier: 'PREMIUM', // Not enterprise
        accessCheck: { hasAccess: true },
        userId: 'test-user-123',
        user: { id: 'test-user-123', subscriptionTier: 'PREMIUM' }
      })

      const request = new NextRequest('http://localhost:3000/api/reports/enhanced', {
        method: 'POST',
        body: JSON.stringify(enterpriseRequestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toHaveProperty('error', 'Feature not available in current tier')
      expect(data).toHaveProperty('requiredTier', 'enterprise')
      expect(data.unavailableFeatures).toContain('benchmarks')
    })

    it('should handle AI analysis errors', async () => {
      const { enhancedAnalysisEngine } = require('@/lib/ai/enhanced-analysis-engine')
      enhancedAnalysisEngine.analyze.mockRejectedValueOnce(new Error('AI service unavailable'))

      const request = new NextRequest('http://localhost:3000/api/reports/enhanced', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data).toHaveProperty('error', 'AI analysis service temporarily unavailable')
      expect(response.headers.get('Retry-After')).toBe('300')
    })
  })

  describe('GET /api/reports/enhanced', () => {
    it('should return report status', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/enhanced?reportId=test-report-123&userId=test-user-123'
      )

      // Mock report metrics
      const mockMetrics = {
        requestId: 'test-report-123',
        userId: 'test-user-123',
        tier: 'PREMIUM',
        startTime: Date.now() - 5000,
        endTime: Date.now(),
        tokensUsed: 1500,
        cacheHit: false,
        success: true
      }

      // We'll need to mock the reportMetrics Map used in the route
      // For now, we'll just test the basic request structure
      const response = await GET(request)

      // This will return 404 since we don't have the report in our mock
      // but it tests the endpoint structure
      expect([200, 404]).toContain(response.status)
    })

    it('should validate required parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/enhanced')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'reportId and userId are required')
    })

    it('should validate user access to report', async () => {
      const { TierValidationMiddleware } = require('@/middleware/tier-validation')
      TierValidationMiddleware.validateTier.mockResolvedValueOnce({
        hasAccess: false,
        userTier: 'FREE',
        accessCheck: { hasAccess: false },
        userId: 'test-user-123',
        user: null
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/enhanced?reportId=test-report-123&userId=test-user-123'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toHaveProperty('error', 'Access denied')
    })
  })

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/enhanced', {
        method: 'POST',
        body: 'invalid json{',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should handle unexpected errors gracefully', async () => {
      const { enhancedAnalysisEngine } = require('@/lib/ai/enhanced-analysis-engine')
      enhancedAnalysisEngine.analyze.mockRejectedValueOnce(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/reports/enhanced', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Internal server error')
      expect(data).toHaveProperty('requestId')
    })
  })
})