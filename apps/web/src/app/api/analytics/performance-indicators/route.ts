import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/clerk'
import { PrismaClient } from '@prisma/client'
import { VisualizationService } from '@/lib/services/VisualizationService'
import { z } from 'zod'

const prisma = new PrismaClient()

const PerformanceIndicatorsSchema = z.object({
  metrics: z.string().transform(str => str.split(',').filter(Boolean)).pipe(z.array(z.string().min(1).max(50)).min(1).max(10))
})

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const user = await getServerAuth()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const metrics = searchParams.get('metrics')

    // Input validation
    const validationResult = PerformanceIndicatorsSchema.safeParse({ metrics })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const userId = user.userId

    // Default metrics if none specified
    const metricsToQuery = metrics.length > 0 ? metrics : [
      'valuation',
      'health_score',
      'revenue',
      'growth_rate',
      'efficiency_score',
      'customer_satisfaction'
    ]

    const visualizationService = new VisualizationService(prisma)
    const indicators = await visualizationService.getPerformanceIndicators(userId, metricsToQuery)

    return NextResponse.json({
      indicators,
      metadata: {
        userId,
        metricsRequested: metricsToQuery,
        totalIndicators: indicators.length,
        statusBreakdown: {
          good: indicators.filter(i => i.status === 'good').length,
          warning: indicators.filter(i => i.status === 'warning').length,
          critical: indicators.filter(i => i.status === 'critical').length
        }
      }
    })

  } catch (error) {
    console.error('Error fetching performance indicators:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance indicators' },
      { status: 500 }
    )
  }
}