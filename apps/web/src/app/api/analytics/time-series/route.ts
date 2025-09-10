import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { VisualizationService } from '@/lib/services/VisualizationService'
import { z } from 'zod'

const prisma = new PrismaClient()

const TimeSeriesQuerySchema = z.object({
  metrics: z.string().transform(str => str.split(',').filter(Boolean)).pipe(z.array(z.string().min(1).max(50)).min(1).max(20)),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  aggregation: z.enum(['hour', 'day', 'week', 'month']).optional()
})

const AnalyticsEventSchema = z.object({
  metric: z.string().min(1).max(100),
  value: z.number().finite(),
  category: z.enum(['valuation', 'health_score', 'performance', 'improvement']),
  metadata: z.record(z.any()).optional()
})

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const metrics = searchParams.get('metrics')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const aggregation = searchParams.get('aggregation')

    // Input validation
    const validationResult = TimeSeriesQuerySchema.safeParse({
      metrics,
      startDate,
      endDate,
      aggregation
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const userId = session.user.id
    const validatedData = validationResult.data

    if (metrics.length === 0) {
      return NextResponse.json(
        { error: 'At least one metric is required' },
        { status: 400 }
      )
    }

    // Enforce reasonable time range limits
    const now = new Date()
    const maxHistoryDays = 365 * 2 // 2 years max
    const defaultDays = 90
    
    const startDate = validatedData.startDate 
      ? new Date(validatedData.startDate)
      : new Date(now.getTime() - defaultDays * 24 * 60 * 60 * 1000)
    
    const endDate = validatedData.endDate 
      ? new Date(validatedData.endDate)
      : now

    // Validate time range
    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    const daysDifference = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDifference > maxHistoryDays) {
      return NextResponse.json(
        { error: `Time range cannot exceed ${maxHistoryDays} days` },
        { status: 400 }
      )
    }

    const timeRange = { start: startDate, end: endDate }

    const visualizationService = new VisualizationService(prisma)
    const timeSeriesData = await visualizationService.generateTimeSeriesData({
      userId,
      metrics: validatedData.metrics,
      timeRange,
      aggregation: validatedData.aggregation
    })

    return NextResponse.json({
      data: timeSeriesData,
      metadata: {
        metrics: validatedData.metrics,
        timeRange,
        aggregation: validatedData.aggregation || 'day',
        dataPoints: Object.values(timeSeriesData).reduce((total, metricData) => total + metricData.length, 0)
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300', // 5 minutes cache
      }
    })

  } catch (error) {
    console.error('Error fetching time series data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time series data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Input validation
    const validationResult = AnalyticsEventSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const userId = session.user.id
    const { metric, value, category, metadata } = validationResult.data

    const visualizationService = new VisualizationService(prisma)
    await visualizationService.recordAnalyticsEvent(
      userId,
      metric,
      value,
      category,
      metadata || {}
    )

    return NextResponse.json({ 
      success: true,
      message: 'Analytics event recorded successfully'
    })

  } catch (error) {
    console.error('Error recording analytics event:', error)
    return NextResponse.json(
      { error: 'Failed to record analytics event' },
      { status: 500 }
    )
  }
}