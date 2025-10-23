import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/clerk'
import { SuccessTrackingService } from '@/lib/services/SuccessTrackingService'

export async function GET(request: NextRequest) {
  try {
    const user = await getServerAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'user') {
      // Get current user's success metrics
      const metrics = await SuccessTrackingService.calculateUserSuccessMetrics(user.userId)
      
      return NextResponse.json({
        success: true,
        data: {
          metrics
        }
      })
    }

    if (type === 'journey') {
      // Get current user's success journey
      const journey = await SuccessTrackingService.getUserSuccessJourney(user.userId)
      
      return NextResponse.json({
        success: true,
        data: {
          journey
        }
      })
    }

    if (type === 'testimonial-candidates') {
      // TODO: Add admin role check
      const candidates = await SuccessTrackingService.identifyTestimonialCandidates()
      
      return NextResponse.json({
        success: true,
        data: {
          candidates
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid type parameter. Use: user, journey, or testimonial-candidates' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching success tracking metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch success metrics' },
      { status: 500 }
    )
  }
}