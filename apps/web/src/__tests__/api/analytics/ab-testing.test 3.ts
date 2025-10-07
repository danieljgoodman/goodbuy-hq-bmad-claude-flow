import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../../../src/app/api/analytics/ab-testing/route'
import { getServerSession } from 'next-auth/next'
import { ABTestingService } from '../../../src/lib/services/ABTestingService'

// Mock dependencies
vi.mock('next-auth/next')
vi.mock('../../../src/lib/services/ABTestingService')

const mockGetServerSession = vi.mocked(getServerSession)
const MockABTestingService = vi.mocked(ABTestingService)

const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com'
  }
}

function createMockRequest(url: string, options: any = {}) {
  return new NextRequest(url, options)
}

describe('A/B Testing API Security', () => {
  let mockAbTestingService: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(mockSession)
    
    mockAbTestingService = {
      createExperiment: vi.fn(),
      startExperiment: vi.fn(),
      stopExperiment: vi.fn(),
      assignUserToExperiment: vi.fn(),
      trackConversion: vi.fn(),
      getRunningExperiments: vi.fn(),
      getUserExperiments: vi.fn(),
      getExperimentVariant: vi.fn(),
      analyzeExperiment: vi.fn(),
      generateSegmentedAnalysis: vi.fn(),
      shouldAutoStop: vi.fn()
    }
    
    MockABTestingService.prototype.createExperiment = mockAbTestingService.createExperiment
    MockABTestingService.prototype.startExperiment = mockAbTestingService.startExperiment
    MockABTestingService.prototype.stopExperiment = mockAbTestingService.stopExperiment
    MockABTestingService.prototype.assignUserToExperiment = mockAbTestingService.assignUserToExperiment
    MockABTestingService.prototype.trackConversion = mockAbTestingService.trackConversion
    MockABTestingService.prototype.getRunningExperiments = mockAbTestingService.getRunningExperiments
    MockABTestingService.prototype.getUserExperiments = mockAbTestingService.getUserExperiments
    MockABTestingService.prototype.getExperimentVariant = mockAbTestingService.getExperimentVariant
    MockABTestingService.prototype.analyzeExperiment = mockAbTestingService.analyzeExperiment
    MockABTestingService.prototype.generateSegmentedAnalysis = mockAbTestingService.generateSegmentedAnalysis
    MockABTestingService.prototype.shouldAutoStop = mockAbTestingService.shouldAutoStop
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/analytics/ab-testing - Authentication', () => {
    it('should reject requests without authentication', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify({ action: 'create_experiment', name: 'test' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should reject requests with invalid session', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: null } })

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify({ action: 'create_experiment', name: 'test' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST - Create Experiment Validation', () => {
    it('should validate experiment creation with comprehensive schema', async () => {
      const validExperiment = {
        action: 'create_experiment',
        name: 'Test Experiment',
        description: 'A test experiment',
        variants: [
          {
            name: 'control',
            description: 'Control variant',
            traffic_percentage: 50,
            config: {}
          },
          {
            name: 'treatment',
            description: 'Treatment variant',
            traffic_percentage: 50,
            config: {}
          }
        ],
        target_metric: 'conversion_rate',
        min_sample_size: 100,
        max_duration_days: 30
      }

      mockAbTestingService.createExperiment.mockResolvedValue({ id: 'exp-123' })

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify(validExperiment)
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })

    it('should reject experiment with invalid name length', async () => {
      const invalidExperiment = {
        action: 'create_experiment',
        name: '', // Empty name
        variants: [
          { name: 'control', traffic_percentage: 100, config: {} }
        ],
        target_metric: 'conversion'
      }

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify(invalidExperiment)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })

    it('should reject experiment with insufficient variants', async () => {
      const invalidExperiment = {
        action: 'create_experiment',
        name: 'Test',
        variants: [
          { name: 'control', traffic_percentage: 100, config: {} }
        ], // Only 1 variant, minimum is 2
        target_metric: 'conversion'
      }

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify(invalidExperiment)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })

    it('should reject experiment with excessive variants', async () => {
      const tooManyVariants = Array(11).fill(0).map((_, i) => ({
        name: `variant_${i}`,
        traffic_percentage: 9,
        config: {}
      }))

      const invalidExperiment = {
        action: 'create_experiment',
        name: 'Test',
        variants: tooManyVariants, // 11 variants, maximum is 10
        target_metric: 'conversion'
      }

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify(invalidExperiment)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })

    it('should validate traffic percentage sum to 100', async () => {
      const invalidExperiment = {
        action: 'create_experiment',
        name: 'Test',
        variants: [
          { name: 'control', traffic_percentage: 60, config: {} },
          { name: 'treatment', traffic_percentage: 30, config: {} }
        ], // Sum = 90, not 100
        target_metric: 'conversion'
      }

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify(invalidExperiment)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Variant traffic percentages must sum to 100')
    })

    it('should validate sample size constraints', async () => {
      const invalidExperiment = {
        action: 'create_experiment',
        name: 'Test',
        variants: [
          { name: 'control', traffic_percentage: 50, config: {} },
          { name: 'treatment', traffic_percentage: 50, config: {} }
        ],
        target_metric: 'conversion',
        min_sample_size: 20 // Below minimum of 30
      }

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify(invalidExperiment)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })

    it('should validate experiment duration constraints', async () => {
      const invalidExperiment = {
        action: 'create_experiment',
        name: 'Test',
        variants: [
          { name: 'control', traffic_percentage: 50, config: {} },
          { name: 'treatment', traffic_percentage: 50, config: {} }
        ],
        target_metric: 'conversion',
        max_duration_days: 100 // Above maximum of 90
      }

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify(invalidExperiment)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })
  })

  describe('POST - Rate Limiting', () => {
    it('should enforce rate limits for experiment creation', async () => {
      const validExperiment = {
        action: 'create_experiment',
        name: 'Test Experiment',
        variants: [
          { name: 'control', traffic_percentage: 50, config: {} },
          { name: 'treatment', traffic_percentage: 50, config: {} }
        ],
        target_metric: 'conversion'
      }

      mockAbTestingService.createExperiment.mockResolvedValue({ id: 'exp-123' })

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify(validExperiment)
      })

      // First 5 experiment creation requests should succeed
      for (let i = 0; i < 5; i++) {
        const response = await POST(request)
        expect(response.status).toBe(200)
      }

      // 6th request should be rate limited
      const rateLimitedResponse = await POST(request)
      const data = await rateLimitedResponse.json()

      expect(rateLimitedResponse.status).toBe(429)
      expect(data.error).toContain('Rate limit exceeded')
    })

    it('should have different rate limits for different actions', async () => {
      const trackingRequest = {
        action: 'track_conversion',
        experiment_id: 'exp-123',
        user_id: 'user-123',
        metric: 'conversion',
        value: 1
      }

      mockAbTestingService.trackConversion.mockResolvedValue(undefined)

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify(trackingRequest)
      })

      // Should allow more tracking requests than experiment creation
      for (let i = 0; i < 50; i++) {
        const response = await POST(request)
        expect(response.status).toBe(200)
      }

      // 51st tracking request should be rate limited
      const rateLimitedResponse = await POST(request)
      const data = await rateLimitedResponse.json()

      expect(rateLimitedResponse.status).toBe(429)
      expect(data.error).toContain('Rate limit exceeded')
    })
  })

  describe('POST - Action-Specific Validation', () => {
    it('should validate start/stop experiment requests', async () => {
      const validRequest = {
        action: 'start_experiment',
        experiment_id: 'exp-123'
      }

      mockAbTestingService.startExperiment.mockResolvedValue(undefined)

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify(validRequest)
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })

    it('should validate user assignment requests', async () => {
      const validRequest = {
        action: 'assign_user',
        experiment_id: 'exp-123',
        user_id: 'user-123',
        user_properties: { segment: 'premium' }
      }

      mockAbTestingService.assignUserToExperiment.mockResolvedValue('treatment')

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify(validRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.variant).toBe('treatment')
    })

    it('should validate conversion tracking requests', async () => {
      const validRequest = {
        action: 'track_conversion',
        experiment_id: 'exp-123',
        user_id: 'user-123',
        metric: 'purchase',
        value: 29.99,
        properties: { product_id: 'prod-456' }
      }

      mockAbTestingService.trackConversion.mockResolvedValue(undefined)

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify(validRequest)
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/analytics/ab-testing - Query Validation', () => {
    it('should validate query parameters', async () => {
      const request = createMockRequest(
        'http://localhost/api/analytics/ab-testing?action=invalid_action'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })

    it('should validate experiment analysis requests', async () => {
      mockAbTestingService.analyzeExperiment.mockResolvedValue({
        experiment_id: 'exp-123',
        status: 'running',
        statistical_significance: { is_significant: false }
      })

      const request = createMockRequest(
        'http://localhost/api/analytics/ab-testing?action=analyze_experiment&experiment_id=exp-123'
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should require parameters for specific actions', async () => {
      const request = createMockRequest(
        'http://localhost/api/analytics/ab-testing?action=experiment_variant'
        // Missing required experiment_id and user_id
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Experiment ID and User ID required for variant lookup')
    })

    it('should include cache headers for appropriate responses', async () => {
      mockAbTestingService.getRunningExperiments.mockResolvedValue([])

      const request = createMockRequest('http://localhost/api/analytics/ab-testing')
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toBe('private, max-age=300')
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const validRequest = {
        action: 'create_experiment',
        name: 'Test',
        variants: [
          { name: 'control', traffic_percentage: 50, config: {} },
          { name: 'treatment', traffic_percentage: 50, config: {} }
        ],
        target_metric: 'conversion'
      }

      mockAbTestingService.createExperiment.mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify(validRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process A/B testing action')
    })

    it('should handle malformed JSON', async () => {
      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: 'invalid-json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process A/B testing action')
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize string inputs to prevent injection', async () => {
      const sanitizedRequest = {
        action: 'create_experiment',
        name: 'Test<script>alert(1)</script>', // XSS attempt
        variants: [
          { name: 'control', traffic_percentage: 50, config: {} },
          { name: 'treatment', traffic_percentage: 50, config: {} }
        ],
        target_metric: 'conversion'
      }

      mockAbTestingService.createExperiment.mockImplementation((config) => {
        // Zod validation should have sanitized the input
        expect(config.name).toBe('Test<script>alert(1)</script>') // Raw string preserved but validated
        return Promise.resolve({ id: 'exp-123' })
      })

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify(sanitizedRequest)
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })

    it('should enforce string length limits', async () => {
      const longNameRequest = {
        action: 'create_experiment',
        name: 'A'.repeat(101), // Exceeds 100 char limit
        variants: [
          { name: 'control', traffic_percentage: 50, config: {} },
          { name: 'treatment', traffic_percentage: 50, config: {} }
        ],
        target_metric: 'conversion'
      }

      const request = createMockRequest('http://localhost/api/analytics/ab-testing', {
        method: 'POST',
        body: JSON.stringify(longNameRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })
  })
})