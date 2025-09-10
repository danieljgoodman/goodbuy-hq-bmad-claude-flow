import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PlatformMonitoringService } from '@/lib/services/PlatformMonitoringService'
import { z } from 'zod'

const PlatformPerformanceQuerySchema = z.object({
  action: z.enum(['summary', 'trends', 'alerts', 'collect']).optional(),
  metric_type: z.enum(['system_resource', 'database_performance', 'api_performance', 'user_experience']).optional(),
  hours: z.coerce.number().min(1).max(168).default(24) // Max 7 days
})

const PlatformActionSchema = z.object({
  action: z.enum(['resolve_alert']),
  alert_id: z.string().min(1).max(100)
})

const platformMonitoring = new PlatformMonitoringService()

// Rate limiting for platform operations
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

function checkRateLimit(userId: string, action: string): boolean {
  const now = Date.now()
  const windowMs = 300000 // 5 minutes
  const maxRequests = action === 'collect' ? 3 : 50 // Strictly limit metric collection triggers

  const userLimit = rateLimitMap.get(`${userId}_${action}`) || { count: 0, lastReset: now }
  
  if (now - userLimit.lastReset > windowMs) {
    userLimit.count = 0
    userLimit.lastReset = now
  }
  
  if (userLimit.count >= maxRequests) {
    return false
  }
  
  userLimit.count++
  rateLimitMap.set(`${userId}_${action}`, userLimit)
  return true
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    
    // Input validation
    const validationResult = PlatformPerformanceQuerySchema.safeParse({
      action: searchParams.get('action'),
      metric_type: searchParams.get('metric_type'),
      hours: searchParams.get('hours')
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { action, metric_type, hours } = validationResult.data

    // Rate limiting check
    if (!checkRateLimit(userId, action || 'default')) {
      return NextResponse.json(
        { error: `Rate limit exceeded for ${action || 'platform performance'} requests` },
        { status: 429 }
      )
    }

    switch (action) {
      case 'summary':
        const summary = await platformMonitoring.getPerformanceSummary()
        return NextResponse.json({ summary }, {
          headers: {
            'Cache-Control': 'private, max-age=300', // 5 minutes cache
          }
        })

      case 'trends':
        if (!metric_type) {
          return NextResponse.json(
            { error: 'Metric type required for trends analysis' },
            { status: 400 }
          )
        }
        const trends = await platformMonitoring.getMetricsTrend(metric_type, hours)
        return NextResponse.json({ trends })

      case 'alerts':
        const alerts = await platformMonitoring.getActiveAlerts()
        return NextResponse.json({ alerts })

      case 'collect':
        // Trigger manual collection with strict rate limiting
        await Promise.all([
          platformMonitoring.collectSystemMetrics(),
          platformMonitoring.collectDatabaseMetrics(),
          platformMonitoring.collectAPIMetrics(),
          platformMonitoring.collectUserExperienceMetrics()
        ])
        return NextResponse.json({ success: true, message: 'Metrics collection triggered' })

      default:
        const defaultSummary = await platformMonitoring.getPerformanceSummary()
        return NextResponse.json({ summary: defaultSummary }, {
          headers: {
            'Cache-Control': 'private, max-age=300', // 5 minutes cache
          }
        })
    }

  } catch (error) {
    console.error('Failed to fetch platform performance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform performance data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    
    // Input validation
    const validationResult = PlatformActionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { action, alert_id } = validationResult.data

    // Rate limiting
    if (!checkRateLimit(userId, action)) {
      return NextResponse.json(
        { error: `Rate limit exceeded for ${action} action` },
        { status: 429 }
      )
    }

    switch (action) {
      case 'resolve_alert':
        await platformMonitoring.resolveAlert(alert_id)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Failed to process platform performance action:', error)
    return NextResponse.json(
      { error: 'Failed to process platform performance action' },
      { status: 500 }
    )
  }
}