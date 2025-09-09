import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { CustomerSuccessService } from '@/lib/services/CustomerSuccessService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'success-metrics') {
      const metrics = await CustomerSuccessService.getSuccessMetrics(session.user.id)
      
      return NextResponse.json({
        success: true,
        data: {
          metrics
        }
      })
    }

    if (type === 'churn-risk') {
      const churnRisk = await CustomerSuccessService.detectChurnRisk(session.user.id)
      
      return NextResponse.json({
        success: true,
        data: {
          churnRisk
        }
      })
    }

    if (type === 'scheduled-events') {
      const events = await CustomerSuccessService.getScheduledEvents(session.user.id)
      
      return NextResponse.json({
        success: true,
        data: {
          events
        }
      })
    }

    if (type === 'schedule-touchpoints') {
      const touchpoints = await CustomerSuccessService.scheduleSuccessTouchpoints(session.user.id)
      
      return NextResponse.json({
        success: true,
        data: {
          touchpoints
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid type parameter. Use: success-metrics, churn-risk, scheduled-events, or schedule-touchpoints' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching customer success metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer success metrics' },
      { status: 500 }
    )
  }
}