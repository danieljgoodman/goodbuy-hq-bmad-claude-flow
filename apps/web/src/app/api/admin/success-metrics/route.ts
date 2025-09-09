import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SuccessTrackingService } from '@/lib/services/SuccessTrackingService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin role check
    // if (!session.user.isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'

    const metrics = await SuccessTrackingService.getPlatformSuccessMetrics()

    // Mock user segments data - in production would calculate from actual data
    const segments = [
      {
        segment: 'Small Business (1-10 employees)',
        count: 245,
        averageImprovement: 22.5,
        conversionRate: 15.2,
        churnRate: 12.8
      },
      {
        segment: 'Medium Business (11-50 employees)',
        count: 189,
        averageImprovement: 28.7,
        conversionRate: 24.1,
        churnRate: 8.3
      },
      {
        segment: 'Large Business (50+ employees)',
        count: 78,
        averageImprovement: 35.2,
        conversionRate: 41.6,
        churnRate: 5.1
      },
      {
        segment: 'Startups (<2 years)',
        count: 156,
        averageImprovement: 31.8,
        conversionRate: 19.7,
        churnRate: 18.2
      },
      {
        segment: 'Established (>5 years)',
        count: 312,
        averageImprovement: 24.3,
        conversionRate: 28.4,
        churnRate: 7.9
      }
    ]

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        segments,
        timeframe
      }
    })
  } catch (error) {
    console.error('Error fetching admin success metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch success metrics' },
      { status: 500 }
    )
  }
}