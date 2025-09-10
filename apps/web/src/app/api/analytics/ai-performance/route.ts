import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AIMonitoringService } from '@/lib/services/AIMonitoringService'
import { z } from 'zod'

const AIPerformanceMetricSchema = z.object({
  model_name: z.string().min(1).max(100),
  version: z.string().min(1).max(20).default('1.0'),
  accuracy: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  response_time: z.number().min(0).max(300000).optional(), // Max 5 minutes
  user_satisfaction: z.number().min(0).max(10).optional(),
  user_demographics: z.object({
    industry: z.string().max(50).optional(),
    business_size: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
    user_role: z.string().max(50).optional(),
    experience_level: z.enum(['beginner', 'intermediate', 'advanced']).optional()
  }).optional(),
  context: z.record(z.any()).default({})
})

const AIPerformanceQuerySchema = z.object({
  model_name: z.string().max(100).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  action: z.enum(['summary', 'trends', 'bias', 'recommendations', 'alerts']).optional()
})

const aiMonitoring = new AIMonitoringService()

// Rate limiting for AI metrics
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 30 // Max 30 metrics per minute per user

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
        { error: 'Rate limit exceeded. Maximum 30 AI metrics per minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Input validation
    const validationResult = AIPerformanceMetricSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { 
      model_name, 
      version,
      accuracy, 
      confidence, 
      response_time, 
      user_satisfaction,
      user_demographics,
      context
    } = validationResult.data

    // At least one metric must be provided
    if (accuracy === undefined && confidence === undefined && response_time === undefined && user_satisfaction === undefined) {
      return NextResponse.json(
        { error: 'At least one performance metric (accuracy, confidence, response_time, or user_satisfaction) must be provided' },
        { status: 400 }
      )
    }

    await aiMonitoring.trackModelPerformance(model_name, {
      accuracy,
      confidence,
      responseTime: response_time,
      userId,
      context: {
        ...context,
        user_demographics,
        version
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Failed to track AI performance:', error)
    return NextResponse.json(
      { error: 'Failed to track AI performance' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Input validation
    const validationResult = AIPerformanceQuerySchema.safeParse({
      model_name: searchParams.get('model_name'),
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
      action: searchParams.get('action')
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { model_name, start_date, end_date, action } = validationResult.data

    // Default date range to last 7 days if not specified
    const start = start_date ? new Date(start_date) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const end = end_date ? new Date(end_date) : new Date()

    // Validate date range - max 90 days
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff > 90) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 90 days' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'summary':
        const summary = await aiMonitoring.getPerformanceSummary(start, end)
        return NextResponse.json({ summary }, {
          headers: {
            'Cache-Control': 'private, max-age=300', // 5 minutes cache
          }
        })

      case 'trends':
        if (!model_name) {
          return NextResponse.json(
            { error: 'Model name required for trends analysis' },
            { status: 400 }
          )
        }
        const trends = await aiMonitoring.getPerformanceTrends({ start, end })
        return NextResponse.json({ trends })

      case 'bias':
        if (!model_name) {
          return NextResponse.json(
            { error: 'Model name required for bias analysis' },
            { status: 400 }
          )
        }
        const biasAnalysis = await aiMonitoring.getBiasAnalysis(model_name, start, end)
        return NextResponse.json({ bias_analysis: biasAnalysis })

      case 'recommendations':
        const recommendations = await aiMonitoring.getRecommendations()
        return NextResponse.json({ recommendations })

      case 'alerts':
        const alerts = await aiMonitoring.getActiveAlerts()
        return NextResponse.json({ alerts })

      default:
        const allSummary = await aiMonitoring.getPerformanceSummary(start, end)
        return NextResponse.json({ summary: allSummary }, {
          headers: {
            'Cache-Control': 'private, max-age=300', // 5 minutes cache
          }
        })
    }

  } catch (error) {
    console.error('Failed to fetch AI performance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI performance data' },
      { status: 500 }
    )
  }
}