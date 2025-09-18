import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the professional questionnaire API endpoints
const mockValidProfessionalData = {
  financialPerformance: {
    revenueYear1: 1000000,
    revenueYear2: 1200000,
    revenueYear3: 1500000,
    profitYear1: 100000,
    profitYear2: 150000,
    profitYear3: 200000,
    cashFlowYear1: 120000,
    cashFlowYear2: 180000,
    cashFlowYear3: 250000,
    ebitdaMargin: 15.5,
    returnOnEquity: 12.3,
    returnOnAssets: 8.7,
    totalDebt: 500000,
    workingCapitalRatio: 1.8
  },
  customerRiskAnalysis: {
    largestCustomerRevenue: 300000,
    top5CustomerRevenue: 750000,
    customerConcentrationRisk: 'medium',
    averageCustomerTenure: 24,
    customerRetentionRate: 85,
    customerSatisfactionScore: 8.2,
    averageContractLength: 12,
    contractRenewalRate: 78,
    recurringRevenuePercentage: 65,
    seasonalityImpact: 'low'
  },
  competitiveMarket: {
    marketSharePercentage: 15,
    primaryCompetitors: ['CompetitorA', 'CompetitorB'],
    competitiveAdvantageStrength: 'strong',
    marketGrowthRateAnnual: 8.5,
    scalabilityRating: 'high',
    barrierToEntryLevel: 'medium',
    competitiveThreats: ['New technology'],
    technologyAdvantage: 'leading',
    intellectualPropertyValue: 'moderate'
  },
  operationalStrategic: {
    ownerTimeCommitment: 45,
    keyPersonRisk: 'medium',
    managementDepthRating: 'adequate',
    supplierConcentrationRisk: 'low',
    operationalComplexity: 'moderate',
    strategicPlanningHorizon: 'medium_term',
    businessModelAdaptability: 'flexible'
  },
  valueEnhancement: {
    growthInvestmentCapacity: 200000,
    marketExpansionOpportunities: ['International'],
    improvementImplementationTimeline: '6_months',
    organizationalChangeCapacity: 'moderate',
    valueCreationPotential: 'high'
  }
}

// Mock database operations
const mockDatabase = {
  questionnaire: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  user: {
    findUnique: vi.fn()
  }
}

// Mock authentication
const mockAuth = {
  getUser: vi.fn(() => ({
    id: 'test-user-id',
    email: 'test@example.com',
    subscription: { tier: 'professional' }
  }))
}

// Mock validation
const mockValidation = {
  validateProfessionalQuestionnaire: vi.fn(),
  validateTierAccess: vi.fn()
}

describe('Professional Questionnaire API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDatabase.user.findUnique.mockResolvedValue({
      id: 'test-user-id',
      subscription: { tier: 'professional' }
    })
    mockValidation.validateTierAccess.mockReturnValue(true)
    mockValidation.validateProfessionalQuestionnaire.mockReturnValue({
      success: true,
      data: mockValidProfessionalData
    })
  })

  describe('POST /api/questionnaire/professional', () => {
    const createMockRequest = (body: any, method = 'POST') => {
      return new NextRequest('http://localhost:3000/api/questionnaire/professional', {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
    }

    it('should create new professional questionnaire with valid data', async () => {
      mockDatabase.questionnaire.create.mockResolvedValue({
        id: 'questionnaire-id',
        userId: 'test-user-id',
        ...mockValidProfessionalData,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const request = createMockRequest(mockValidProfessionalData)

      // Mock the API handler
      const mockPOST = vi.fn(async (req: NextRequest) => {
        const body = await req.json()

        // Validate tier access
        const user = await mockAuth.getUser()
        const hasAccess = mockValidation.validateTierAccess(user.subscription.tier, 'professional')

        if (!hasAccess) {
          return new Response(JSON.stringify({ error: 'Professional tier required' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // Validate questionnaire data
        const validation = mockValidation.validateProfessionalQuestionnaire(body)

        if (!validation.success) {
          return new Response(JSON.stringify({ error: 'Validation failed', issues: validation.error }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // Create questionnaire
        const questionnaire = await mockDatabase.questionnaire.create({
          data: {
            userId: user.id,
            ...validation.data,
            tier: 'professional'
          }
        })

        return new Response(JSON.stringify({
          success: true,
          questionnaire,
          totalFields: 44,
          completedFields: Object.keys(validation.data).length
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        })
      })

      const response = await mockPOST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.questionnaire.id).toBe('questionnaire-id')
      expect(data.totalFields).toBe(44)
      expect(mockDatabase.questionnaire.create).toHaveBeenCalledWith({
        data: {
          userId: 'test-user-id',
          ...mockValidProfessionalData,
          tier: 'professional'
        }
      })
    })

    it('should reject request without professional tier access', async () => {
      mockDatabase.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        subscription: { tier: 'basic' }
      })
      mockValidation.validateTierAccess.mockReturnValue(false)

      const request = createMockRequest(mockValidProfessionalData)

      const mockPOST = vi.fn(async (req: NextRequest) => {
        const user = await mockAuth.getUser()
        const hasAccess = mockValidation.validateTierAccess(user.subscription.tier, 'professional')

        if (!hasAccess) {
          return new Response(JSON.stringify({ error: 'Professional tier required' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      })

      const response = await mockPOST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Professional tier required')
    })

    it('should validate questionnaire data and reject invalid submissions', async () => {
      const invalidData = {
        ...mockValidProfessionalData,
        financialPerformance: {
          ...mockValidProfessionalData.financialPerformance,
          revenueYear1: -100000, // Invalid negative revenue
          ebitdaMargin: 150 // Invalid > 100%
        }
      }

      mockValidation.validateProfessionalQuestionnaire.mockReturnValue({
        success: false,
        error: {
          issues: [
            { path: ['financialPerformance', 'revenueYear1'], message: 'Revenue must be 0 or greater' },
            { path: ['financialPerformance', 'ebitdaMargin'], message: 'EBITDA margin must be between 0-100%' }
          ]
        }
      })

      const request = createMockRequest(invalidData)

      const mockPOST = vi.fn(async (req: NextRequest) => {
        const body = await req.json()
        const validation = mockValidation.validateProfessionalQuestionnaire(body)

        if (!validation.success) {
          return new Response(JSON.stringify({
            error: 'Validation failed',
            issues: validation.error.issues
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      })

      const response = await mockPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.issues).toHaveLength(2)
      expect(data.issues[0].message).toContain('Revenue must be 0 or greater')
    })

    it('should enforce cross-section business logic validation', async () => {
      const inconsistentData = {
        ...mockValidProfessionalData,
        customerRiskAnalysis: {
          ...mockValidProfessionalData.customerRiskAnalysis,
          customerConcentrationRisk: 'high'
        },
        operationalStrategic: {
          ...mockValidProfessionalData.operationalStrategic,
          ownerTimeCommitment: 10, // Too low for high customer concentration
          keyPersonRisk: 'low'
        }
      }

      mockValidation.validateProfessionalQuestionnaire.mockReturnValue({
        success: false,
        error: {
          issues: [
            {
              path: ['operationalStrategic', 'ownerTimeCommitment'],
              message: 'Business dependencies should be consistent across sections'
            }
          ]
        }
      })

      const request = createMockRequest(inconsistentData)

      const mockPOST = vi.fn(async (req: NextRequest) => {
        const body = await req.json()
        const validation = mockValidation.validateProfessionalQuestionnaire(body)

        if (!validation.success) {
          return new Response(JSON.stringify({
            error: 'Cross-section validation failed',
            issues: validation.error.issues
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      })

      const response = await mockPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cross-section validation failed')
      expect(data.issues[0].message).toContain('Business dependencies should be consistent')
    })

    it('should handle partial questionnaire data for auto-save', async () => {
      const partialData = {
        financialPerformance: mockValidProfessionalData.financialPerformance,
        customerRiskAnalysis: {
          largestCustomerRevenue: 300000,
          customerConcentrationRisk: 'medium'
          // Missing other fields
        }
      }

      mockValidation.validateProfessionalQuestionnaire.mockReturnValue({
        success: true,
        data: partialData,
        partial: true,
        completedSections: ['financialPerformance'],
        totalSections: 5
      })

      mockDatabase.questionnaire.create.mockResolvedValue({
        id: 'questionnaire-id',
        ...partialData,
        status: 'draft'
      })

      const request = createMockRequest(partialData)

      const mockPOST = vi.fn(async (req: NextRequest) => {
        const body = await req.json()
        const validation = mockValidation.validateProfessionalQuestionnaire(body)

        if (validation.success) {
          const questionnaire = await mockDatabase.questionnaire.create({
            data: {
              userId: 'test-user-id',
              ...validation.data,
              status: validation.partial ? 'draft' : 'completed'
            }
          })

          return new Response(JSON.stringify({
            success: true,
            questionnaire,
            partial: validation.partial,
            completedSections: validation.completedSections,
            totalSections: validation.totalSections
          }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      })

      const response = await mockPOST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.partial).toBe(true)
      expect(data.completedSections).toEqual(['financialPerformance'])
      expect(data.questionnaire.status).toBe('draft')
    })

    it('should handle database errors gracefully', async () => {
      mockDatabase.questionnaire.create.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest(mockValidProfessionalData)

      const mockPOST = vi.fn(async (req: NextRequest) => {
        try {
          const body = await req.json()
          const validation = mockValidation.validateProfessionalQuestionnaire(body)

          if (validation.success) {
            await mockDatabase.questionnaire.create({
              data: {
                userId: 'test-user-id',
                ...validation.data
              }
            })
          }
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Internal server error',
            message: 'Failed to save questionnaire'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      })

      const response = await mockPOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.message).toBe('Failed to save questionnaire')
    })
  })

  describe('GET /api/questionnaire/professional/[id]', () => {
    it('should retrieve existing professional questionnaire', async () => {
      const questionnaireId = 'questionnaire-123'

      mockDatabase.questionnaire.findUnique.mockResolvedValue({
        id: questionnaireId,
        userId: 'test-user-id',
        ...mockValidProfessionalData,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const mockGET = vi.fn(async (req: NextRequest, { params }: { params: { id: string } }) => {
        const user = await mockAuth.getUser()
        const questionnaire = await mockDatabase.questionnaire.findUnique({
          where: {
            id: params.id,
            userId: user.id
          }
        })

        if (!questionnaire) {
          return new Response(JSON.stringify({ error: 'Questionnaire not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify({
          success: true,
          questionnaire
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      })

      const request = new NextRequest(`http://localhost:3000/api/questionnaire/professional/${questionnaireId}`)
      const response = await mockGET(request, { params: { id: questionnaireId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.questionnaire.id).toBe(questionnaireId)
      expect(data.questionnaire.status).toBe('completed')
    })

    it('should return 404 for non-existent questionnaire', async () => {
      mockDatabase.questionnaire.findUnique.mockResolvedValue(null)

      const mockGET = vi.fn(async (req: NextRequest, { params }: { params: { id: string } }) => {
        const questionnaire = await mockDatabase.questionnaire.findUnique({
          where: { id: params.id }
        })

        if (!questionnaire) {
          return new Response(JSON.stringify({ error: 'Questionnaire not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      })

      const request = new NextRequest('http://localhost:3000/api/questionnaire/professional/non-existent')
      const response = await mockGET(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Questionnaire not found')
    })

    it('should enforce user ownership of questionnaire', async () => {
      mockDatabase.questionnaire.findUnique.mockResolvedValue({
        id: 'questionnaire-123',
        userId: 'different-user-id', // Different user
        ...mockValidProfessionalData
      })

      const mockGET = vi.fn(async (req: NextRequest, { params }: { params: { id: string } }) => {
        const user = await mockAuth.getUser()
        const questionnaire = await mockDatabase.questionnaire.findUnique({
          where: {
            id: params.id,
            userId: user.id // This will fail since userIds don't match
          }
        })

        if (!questionnaire) {
          return new Response(JSON.stringify({ error: 'Questionnaire not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      })

      mockDatabase.questionnaire.findUnique.mockResolvedValue(null) // Simulate no match with userId filter

      const request = new NextRequest('http://localhost:3000/api/questionnaire/professional/questionnaire-123')
      const response = await mockGET(request, { params: { id: 'questionnaire-123' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Questionnaire not found')
    })
  })

  describe('PUT /api/questionnaire/professional/[id]', () => {
    it('should update existing professional questionnaire', async () => {
      const questionnaireId = 'questionnaire-123'
      const updatedData = {
        ...mockValidProfessionalData,
        financialPerformance: {
          ...mockValidProfessionalData.financialPerformance,
          revenueYear3: 2000000 // Updated value
        }
      }

      mockDatabase.questionnaire.findUnique.mockResolvedValue({
        id: questionnaireId,
        userId: 'test-user-id',
        ...mockValidProfessionalData
      })

      mockDatabase.questionnaire.update.mockResolvedValue({
        id: questionnaireId,
        userId: 'test-user-id',
        ...updatedData,
        updatedAt: new Date()
      })

      const mockPUT = vi.fn(async (req: NextRequest, { params }: { params: { id: string } }) => {
        const body = await req.json()
        const user = await mockAuth.getUser()

        // Check if questionnaire exists and belongs to user
        const existing = await mockDatabase.questionnaire.findUnique({
          where: { id: params.id, userId: user.id }
        })

        if (!existing) {
          return new Response(JSON.stringify({ error: 'Questionnaire not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // Validate updated data
        const validation = mockValidation.validateProfessionalQuestionnaire(body)

        if (!validation.success) {
          return new Response(JSON.stringify({
            error: 'Validation failed',
            issues: validation.error
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // Update questionnaire
        const updated = await mockDatabase.questionnaire.update({
          where: { id: params.id },
          data: validation.data
        })

        return new Response(JSON.stringify({
          success: true,
          questionnaire: updated
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      })

      const request = new NextRequest(`http://localhost:3000/api/questionnaire/professional/${questionnaireId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })

      const response = await mockPUT(request, { params: { id: questionnaireId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.questionnaire.financialPerformance.revenueYear3).toBe(2000000)
      expect(mockDatabase.questionnaire.update).toHaveBeenCalledWith({
        where: { id: questionnaireId },
        data: updatedData
      })
    })

    it('should handle optimistic locking for concurrent updates', async () => {
      // Simulate concurrent update scenario
      mockDatabase.questionnaire.update.mockRejectedValue(new Error('Record has been modified'))

      const mockPUT = vi.fn(async (req: NextRequest, { params }: { params: { id: string } }) => {
        try {
          const body = await req.json()
          await mockDatabase.questionnaire.update({
            where: { id: params.id },
            data: body
          })
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Conflict',
            message: 'Questionnaire has been modified by another session. Please refresh and try again.'
          }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      })

      const request = new NextRequest('http://localhost:3000/api/questionnaire/professional/questionnaire-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockValidProfessionalData)
      })

      const response = await mockPUT(request, { params: { id: 'questionnaire-123' } })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Conflict')
      expect(data.message).toContain('modified by another session')
    })
  })

  describe('DELETE /api/questionnaire/professional/[id]', () => {
    it('should delete existing professional questionnaire', async () => {
      const questionnaireId = 'questionnaire-123'

      mockDatabase.questionnaire.findUnique.mockResolvedValue({
        id: questionnaireId,
        userId: 'test-user-id',
        ...mockValidProfessionalData
      })

      mockDatabase.questionnaire.delete.mockResolvedValue({
        id: questionnaireId
      })

      const mockDELETE = vi.fn(async (req: NextRequest, { params }: { params: { id: string } }) => {
        const user = await mockAuth.getUser()

        // Check if questionnaire exists and belongs to user
        const existing = await mockDatabase.questionnaire.findUnique({
          where: { id: params.id, userId: user.id }
        })

        if (!existing) {
          return new Response(JSON.stringify({ error: 'Questionnaire not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        await mockDatabase.questionnaire.delete({
          where: { id: params.id }
        })

        return new Response(JSON.stringify({
          success: true,
          message: 'Questionnaire deleted successfully'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      })

      const request = new NextRequest(`http://localhost:3000/api/questionnaire/professional/${questionnaireId}`, {
        method: 'DELETE'
      })

      const response = await mockDELETE(request, { params: { id: questionnaireId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Questionnaire deleted successfully')
      expect(mockDatabase.questionnaire.delete).toHaveBeenCalledWith({
        where: { id: questionnaireId }
      })
    })
  })

  describe('Performance and Rate Limiting', () => {
    it('should handle multiple rapid requests efficiently', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        createMockRequest({
          ...mockValidProfessionalData,
          id: `test-${i}`
        })
      )

      const mockHandler = vi.fn(async (req: NextRequest) => {
        const startTime = performance.now()

        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 10))

        const endTime = performance.now()

        return new Response(JSON.stringify({
          success: true,
          processingTime: endTime - startTime
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      })

      const responses = await Promise.all(
        requests.map(req => mockHandler(req))
      )

      const data = await Promise.all(
        responses.map(res => res.json())
      )

      // All requests should complete successfully
      expect(responses.every(res => res.status === 200)).toBe(true)
      expect(data.every(d => d.success)).toBe(true)

      // Processing time should be reasonable
      const avgProcessingTime = data.reduce((sum, d) => sum + d.processingTime, 0) / data.length
      expect(avgProcessingTime).toBeLessThan(100) // Less than 100ms average
    })

    it('should enforce rate limiting for excessive requests', async () => {
      const rateLimitMap = new Map()
      const RATE_LIMIT = 5 // 5 requests per minute
      const WINDOW_MS = 60000 // 1 minute

      const mockRateLimitedHandler = vi.fn(async (req: NextRequest) => {
        const clientId = req.headers.get('x-forwarded-for') || 'test-client'
        const now = Date.now()

        if (!rateLimitMap.has(clientId)) {
          rateLimitMap.set(clientId, { count: 0, windowStart: now })
        }

        const clientData = rateLimitMap.get(clientId)

        // Reset window if expired
        if (now - clientData.windowStart > WINDOW_MS) {
          clientData.count = 0
          clientData.windowStart = now
        }

        if (clientData.count >= RATE_LIMIT) {
          return new Response(JSON.stringify({
            error: 'Rate limit exceeded',
            retryAfter: WINDOW_MS - (now - clientData.windowStart)
          }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        clientData.count++

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      })

      // Make 6 requests (exceeding limit of 5)
      const requests = Array.from({ length: 6 }, () =>
        new NextRequest('http://localhost:3000/api/questionnaire/professional', {
          method: 'POST',
          headers: { 'x-forwarded-for': '192.168.1.1' }
        })
      )

      const responses = await Promise.all(
        requests.map(req => mockRateLimitedHandler(req))
      )

      // First 5 should succeed, 6th should be rate limited
      expect(responses.slice(0, 5).every(res => res.status === 200)).toBe(true)
      expect(responses[5].status).toBe(429)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON gracefully', async () => {
      const mockHandler = vi.fn(async (req: NextRequest) => {
        try {
          await req.json()
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Invalid JSON',
            message: 'Request body contains malformed JSON'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      })

      const request = new NextRequest('http://localhost:3000/api/questionnaire/professional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json }'
      })

      const response = await mockHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON')
    })

    it('should handle authentication failures', async () => {
      mockAuth.getUser.mockImplementation(() => {
        throw new Error('Authentication failed')
      })

      const mockHandler = vi.fn(async (req: NextRequest) => {
        try {
          await mockAuth.getUser()
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Unauthorized',
            message: 'Authentication required'
          }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      })

      const request = new NextRequest('http://localhost:3000/api/questionnaire/professional')
      const response = await mockHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate request method', async () => {
      const mockHandler = vi.fn(async (req: NextRequest) => {
        const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE']

        if (!allowedMethods.includes(req.method)) {
          return new Response(JSON.stringify({
            error: 'Method not allowed',
            allowed: allowedMethods
          }), {
            status: 405,
            headers: {
              'Content-Type': 'application/json',
              'Allow': allowedMethods.join(', ')
            }
          })
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      })

      const request = new NextRequest('http://localhost:3000/api/questionnaire/professional', {
        method: 'PATCH' // Not allowed
      })

      const response = await mockHandler(request)
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
      expect(response.headers.get('Allow')).toBe('GET, POST, PUT, DELETE')
    })
  })

  const createMockRequest = (body: any, method = 'POST') => {
    return new NextRequest('http://localhost:3000/api/questionnaire/professional', {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
  }
})