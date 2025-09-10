import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { BusinessIntelligenceService } from '@/lib/services/BusinessIntelligenceService'
import { z } from 'zod'

const BusinessIntelligenceQuerySchema = z.object({
  action: z.enum(['dashboard', 'revenue_report', 'user_analysis', 'metric_trends']).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  metric_type: z.enum(['revenue', 'users', 'subscriptions', 'churn', 'conversion']).optional(),
  days: z.coerce.number().min(1).max(365).default(30)
})

const BusinessMetricSchema = z.object({
  type: z.enum(['revenue', 'subscription', 'user_conversion', 'churn', 'feature_usage', 'payment']),
  value: z.number(),
  metadata: z.record(z.any()).optional()
})

const biService = new BusinessIntelligenceService()

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Input validation
    const validationResult = BusinessIntelligenceQuerySchema.safeParse({
      action: searchParams.get('action'),
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
      metric_type: searchParams.get('metric_type'),
      days: searchParams.get('days')
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { action, start_date, end_date, metric_type, days } = validationResult.data

    // Default date range to last 30 days if not specified
    const start = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = end_date ? new Date(end_date) : new Date()

    // Validate date range - max 365 days for BI queries
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff > 365) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 365 days' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'dashboard':
        const dashboard = await biService.generateDashboardSummary()
        return NextResponse.json({ dashboard }, {
          headers: {
            'Cache-Control': 'private, max-age=600', // 10 minutes cache for dashboard
          }
        })

      case 'revenue_report':
        const revenueReport = await biService.generateRevenueReport(start, end)
        return NextResponse.json({ revenue_report: revenueReport }, {
          headers: {
            'Cache-Control': 'private, max-age=300', // 5 minutes cache
          }
        })

      case 'user_analysis':
        const userAnalysis = await biService.generateUserAnalysisReport(start, end)
        return NextResponse.json({ user_analysis: userAnalysis }, {
          headers: {
            'Cache-Control': 'private, max-age=300', // 5 minutes cache
          }
        })

      case 'metric_trends':
        if (!metric_type) {
          return NextResponse.json(
            { error: 'Metric type required for trends analysis' },
            { status: 400 }
          )
        }
        const trends = await biService.getBusinessMetricsTrend(metric_type, days)
        return NextResponse.json({ trends }, {
          headers: {
            'Cache-Control': 'private, max-age=300', // 5 minutes cache
          }
        })

      default:
        const summary = await biService.generateDashboardSummary()
        return NextResponse.json({ summary }, {
          headers: {
            'Cache-Control': 'private, max-age=600', // 10 minutes cache
          }
        })
    }

  } catch (error) {
    console.error('Failed to fetch business intelligence data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business intelligence data' },
      { status: 500 }
    )
  }
}

// Rate limiting for business metrics
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const windowMs = 300000 // 5 minutes
  const maxRequests = 20 // Max 20 business metrics per 5 minutes per user

  const userLimit = rateLimitMap.get(userId) || { count: 0, lastReset: now }
  
  if (now - userLimit.lastReset > windowMs) {
    userLimit.count = 0
    userLimit.lastReset = now
  }
  
  if (userLimit.count >= maxRequests) {
    return false
  }
  
  userLimit.count++
  rateLimitMap.set(userId, userLimit)
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 20 business metrics per 5 minutes.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Input validation
    const validationResult = BusinessMetricSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { type, value, metadata } = validationResult.data

    // Validate value ranges based on metric type
    if (type === 'revenue' && (value < 0 || value > 1000000)) {
      return NextResponse.json(
        { error: 'Revenue value must be between 0 and 1,000,000' },
        { status: 400 }
      )
    }

    await biService.storeBusinessMetric(type, value, metadata)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Failed to store business metric:', error)
    return NextResponse.json(
      { error: 'Failed to store business metric' },
      { status: 500 }
    )
  }
}