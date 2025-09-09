import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { FeedbackService } from '@/lib/services/FeedbackService'

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
    const period = searchParams.get('period') as 'week' | 'month' | 'quarter' | 'year' || 'month'

    const analytics = await FeedbackService.getFeedbackAnalytics(period)

    return NextResponse.json({
      success: true,
      data: {
        analytics
      }
    })
  } catch (error) {
    console.error('Error fetching feedback analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback analytics' },
      { status: 500 }
    )
  }
}