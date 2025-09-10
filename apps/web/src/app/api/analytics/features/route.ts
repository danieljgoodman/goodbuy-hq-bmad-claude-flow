import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FeatureUsageTracker } from '@/lib/services/FeatureUsageTracker'

const featureTracker = new FeatureUsageTracker()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const feature = searchParams.get('feature')
    const action = searchParams.get('action')

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    switch (action) {
      case 'usage':
        const usage = await featureTracker.getFeatureUsage(start, end, feature || undefined)
        return NextResponse.json({ usage })

      case 'adoption_trends':
        if (!feature) {
          return NextResponse.json(
            { error: 'Feature parameter required for adoption trends' },
            { status: 400 }
          )
        }
        const trends = await featureTracker.getFeatureAdoptionTrends(feature, start, end)
        return NextResponse.json({ trends })

      case 'stickiness':
        if (!feature) {
          return NextResponse.json(
            { error: 'Feature parameter required for stickiness analysis' },
            { status: 400 }
          )
        }
        const stickiness = await featureTracker.getFeatureStickiness(feature, start, end)
        return NextResponse.json({ stickiness })

      case 'correlations':
        if (!feature) {
          return NextResponse.json(
            { error: 'Feature parameter required for correlation analysis' },
            { status: 400 }
          )
        }
        const correlations = await featureTracker.getFeatureCorrelations(feature, start, end)
        return NextResponse.json({ correlations })

      case 'definitions':
        const features = featureTracker.getAllFeatures()
        const definitions = Array.from(features.entries()).map(([key, def]) => ({
          key,
          ...def
        }))
        return NextResponse.json({ features: definitions })

      default:
        const allUsage = await featureTracker.getFeatureUsage(start, end)
        return NextResponse.json({ usage: allUsage })
    }

  } catch (error) {
    console.error('Failed to fetch feature analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feature analytics' },
      { status: 500 }
    )
  }
}