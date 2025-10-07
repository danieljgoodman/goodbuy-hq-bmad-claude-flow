import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../../../src/app/api/analytics/events/route'
import { getServerSession } from 'next-auth/next'
import { prisma } from '../../../src/lib/prisma'

// Mock dependencies
vi.mock('next-auth/next')
vi.mock('../../../src/lib/prisma', () => ({
  prisma: {
    userEvent: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn()
    }
  }
}))

const mockGetServerSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

// Mock session data
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com'
  }
}

// Helper to create mock requests
function createMockRequest(url: string, options: any = {}) {
  return new NextRequest(url, options)
}

describe('Analytics Events API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(mockSession)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/analytics/events', () => {
    describe('Authentication', () => {
      it('should reject requests without authentication', async () => {
        mockGetServerSession.mockResolvedValue(null)

        const request = createMockRequest('http://localhost/api/analytics/events', {
          method: 'POST',
          body: JSON.stringify({ events: [] })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
      })

      it('should reject requests with invalid session', async () => {
        mockGetServerSession.mockResolvedValue({ user: { id: null } })

        const request = createMockRequest('http://localhost/api/analytics/events', {
          method: 'POST',
          body: JSON.stringify({ events: [] })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
      })
    })

    describe('Input Validation', () => {
      it('should reject empty events array', async () => {
        const request = createMockRequest('http://localhost/api/analytics/events', {
          method: 'POST',
          body: JSON.stringify({ events: [] })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid request data')
        expect(data.details).toBeDefined()
      })

      it('should reject events array exceeding batch limit', async () => {
        const events = Array(51).fill({
          sessionId: 'test-session',
          event_type: 'test',
          event_name: 'test_event',
          timestamp: new Date().toISOString()
        })

        const request = createMockRequest('http://localhost/api/analytics/events', {
          method: 'POST',
          body: JSON.stringify({ events })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid request data')
      })

      it('should reject events with invalid structure', async () => {
        const events = [{
          // Missing required fields
          event_type: 'test'
        }]

        const request = createMockRequest('http://localhost/api/analytics/events', {
          method: 'POST',
          body: JSON.stringify({ events })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid request data')
      })

      it('should reject events with invalid URLs', async () => {
        const events = [{
          sessionId: 'test-session',
          event_type: 'test',
          event_name: 'test_event',
          page_url: 'not-a-valid-url',
          timestamp: new Date().toISOString()
        }]

        const request = createMockRequest('http://localhost/api/analytics/events', {
          method: 'POST',
          body: JSON.stringify({ events })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid request data')
      })

      it('should accept valid event structure', async () => {
        const events = [{
          sessionId: 'test-session-123',
          event_type: 'interaction',
          event_name: 'button_click',
          properties: { button_id: 'submit-btn' },
          page_url: 'https://example.com/page',
          timestamp: new Date().toISOString()
        }]

        mockPrisma.userEvent.createMany.mockResolvedValue({ count: 1 })

        const request = createMockRequest('http://localhost/api/analytics/events', {
          method: 'POST',
          body: JSON.stringify({ events })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.processed).toBe(1)
      })
    })

    describe('Rate Limiting', () => {
      it('should enforce rate limits per user', async () => {
        const events = [{
          sessionId: 'test-session',
          event_type: 'test',
          event_name: 'test_event',
          timestamp: new Date().toISOString()
        }]

        const request = createMockRequest('http://localhost/api/analytics/events', {
          method: 'POST',
          body: JSON.stringify({ events })
        })

        mockPrisma.userEvent.createMany.mockResolvedValue({ count: 1 })

        // First 100 requests should succeed
        for (let i = 0; i < 100; i++) {
          const response = await POST(request)
          expect(response.status).toBe(200)
        }

        // 101st request should be rate limited
        const rateLimitedResponse = await POST(request)
        const data = await rateLimitedResponse.json()

        expect(rateLimitedResponse.status).toBe(429)
        expect(data.error).toContain('Rate limit exceeded')
      })
    })

    describe('Data Sanitization', () => {
      it('should anonymize IP addresses for privacy', async () => {
        const events = [{
          sessionId: 'test-session',
          event_type: 'test',
          event_name: 'test_event',
          timestamp: new Date().toISOString()
        }]

        mockPrisma.userEvent.createMany.mockImplementation((args) => {
          const createdEvents = args.data as any[]
          expect(createdEvents[0].ipAddress).toBe('anonymized')
          return Promise.resolve({ count: 1 })
        })

        const request = createMockRequest('http://localhost/api/analytics/events', {
          method: 'POST',
          headers: { 'x-forwarded-for': '192.168.1.1' },
          body: JSON.stringify({ events })
        })

        await POST(request)
        expect(mockPrisma.userEvent.createMany).toHaveBeenCalled()
      })

      it('should truncate long user agent strings', async () => {
        const longUserAgent = 'A'.repeat(600) // Exceeds 500 char limit
        const events = [{
          sessionId: 'test-session',
          event_type: 'test',
          event_name: 'test_event',
          user_agent: longUserAgent,
          timestamp: new Date().toISOString()
        }]

        mockPrisma.userEvent.createMany.mockImplementation((args) => {
          const createdEvents = args.data as any[]
          expect(createdEvents[0].userAgent.length).toBeLessThanOrEqual(500)
          return Promise.resolve({ count: 1 })
        })

        const request = createMockRequest('http://localhost/api/analytics/events', {
          method: 'POST',
          body: JSON.stringify({ events })
        })

        await POST(request)
      })
    })
  })

  describe('GET /api/analytics/events', () => {
    describe('Authentication', () => {
      it('should reject requests without authentication', async () => {
        mockGetServerSession.mockResolvedValue(null)

        const request = createMockRequest('http://localhost/api/analytics/events')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
      })
    })

    describe('Input Validation', () => {
      it('should validate query parameters', async () => {
        const request = createMockRequest('http://localhost/api/analytics/events?limit=invalid')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid request data')
      })

      it('should enforce maximum limit', async () => {
        const request = createMockRequest('http://localhost/api/analytics/events?limit=2000')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid request data')
      })

      it('should validate datetime formats', async () => {
        const request = createMockRequest('http://localhost/api/analytics/events?start_date=invalid-date')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid request data')
      })
    })

    describe('Data Access Control', () => {
      it('should only return events for authenticated user', async () => {
        const mockEvents = [
          { id: '1', eventType: 'test', userId: 'test-user-id' }
        ]

        mockPrisma.userEvent.findMany.mockResolvedValue(mockEvents)

        const request = createMockRequest('http://localhost/api/analytics/events')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(mockPrisma.userEvent.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              userId: 'test-user-id'
            })
          })
        )
      })

      it('should include cache headers', async () => {
        mockPrisma.userEvent.findMany.mockResolvedValue([])

        const request = createMockRequest('http://localhost/api/analytics/events')
        const response = await GET(request)

        expect(response.headers.get('Cache-Control')).toBe('private, max-age=300')
      })
    })

    describe('Query Functionality', () => {
      it('should filter by date range', async () => {
        const startDate = '2024-01-01T00:00:00.000Z'
        const endDate = '2024-01-31T23:59:59.999Z'
        
        mockPrisma.userEvent.findMany.mockResolvedValue([])

        const request = createMockRequest(
          `http://localhost/api/analytics/events?start_date=${startDate}&end_date=${endDate}`
        )
        
        await GET(request)

        expect(mockPrisma.userEvent.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              timestamp: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            })
          })
        )
      })

      it('should filter by event type', async () => {
        mockPrisma.userEvent.findMany.mockResolvedValue([])

        const request = createMockRequest('http://localhost/api/analytics/events?event_type=interaction')
        await GET(request)

        expect(mockPrisma.userEvent.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              eventType: 'interaction'
            })
          })
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const events = [{
        sessionId: 'test-session',
        event_type: 'test',
        event_name: 'test_event',
        timestamp: new Date().toISOString()
      }]

      mockPrisma.userEvent.createMany.mockRejectedValue(new Error('Database error'))

      const request = createMockRequest('http://localhost/api/analytics/events', {
        method: 'POST',
        body: JSON.stringify({ events })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to store events')
    })

    it('should handle malformed JSON', async () => {
      const request = createMockRequest('http://localhost/api/analytics/events', {
        method: 'POST',
        body: 'invalid-json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to store events')
    })
  })
})