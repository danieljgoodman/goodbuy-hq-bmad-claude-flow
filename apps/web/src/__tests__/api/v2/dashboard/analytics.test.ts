import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/v2/dashboard/analytics/route'

// Mock the Supabase client
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve({
                    data: mockEvaluations,
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      }))
    }))
  }))
}))

const mockEvaluations = [
  {
    id: '1',
    user_id: 'user123',
    created_at: '2024-01-01T00:00:00Z',
    status: 'completed',
    health_score: 85,
    business_data: {
      annual_revenue: 1000000,
      net_income: 100000
    },
    valuations: {
      weighted: { value: 5000000 }
    }
  },
  {
    id: '2',
    user_id: 'user123',
    created_at: '2024-02-01T00:00:00Z',
    status: 'completed',
    health_score: 90,
    business_data: {
      annual_revenue: 1200000,
      net_income: 120000
    },
    valuations: {
      weighted: { value: 6000000 }
    }
  }
]

describe('/api/v2/dashboard/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return analytics data successfully', async () => {
    const url = new URL('http://localhost:3000/api/v2/dashboard/analytics?userId=user123')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('evaluations')
    expect(data).toHaveProperty('analytics')
    expect(data).toHaveProperty('count')
    expect(data.evaluations).toHaveLength(2)
  })

  it('should return 400 when userId is missing', async () => {
    const url = new URL('http://localhost:3000/api/v2/dashboard/analytics')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('User ID is required')
  })

  it('should handle filters correctly', async () => {
    const filters = {
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      },
      evaluationTypes: ['completed'],
      businessCategories: []
    }

    const url = new URL('http://localhost:3000/api/v2/dashboard/analytics')
    url.searchParams.set('userId', 'user123')
    url.searchParams.set('filters', JSON.stringify(filters))
    
    const request = new NextRequest(url)
    const response = await GET(request)

    expect(response.status).toBe(200)
  })

  it('should return 400 for invalid filters format', async () => {
    const url = new URL('http://localhost:3000/api/v2/dashboard/analytics')
    url.searchParams.set('userId', 'user123')
    url.searchParams.set('filters', 'invalid-json')
    
    const request = new NextRequest(url)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid filters format')
  })

  it('should calculate analytics correctly', async () => {
    const url = new URL('http://localhost:3000/api/v2/dashboard/analytics?userId=user123')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(data.analytics).toHaveProperty('averageHealthScore')
    expect(data.analytics).toHaveProperty('averageValuation')
    expect(data.analytics).toHaveProperty('totalRevenue')
    expect(data.analytics).toHaveProperty('completionRate')
    expect(data.analytics).toHaveProperty('trends')
    expect(data.analytics).toHaveProperty('statusBreakdown')

    // Verify calculated values
    expect(data.analytics.averageHealthScore).toBe(87.5) // (85 + 90) / 2
    expect(data.analytics.averageValuation).toBe(5500000) // (5000000 + 6000000) / 2
    expect(data.analytics.totalRevenue).toBe(2200000) // 1000000 + 1200000
    expect(data.analytics.completionRate).toBe(100) // 2 completed / 2 total * 100
  })
})