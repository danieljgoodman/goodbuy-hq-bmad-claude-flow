import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SuccessTrackingService } from '@/lib/services/SuccessTrackingService'
import { TestimonialService } from '@/lib/services/TestimonialService'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin role check
    // if (!session.user.isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    // Find users eligible for testimonial requests
    const candidates = await SuccessTrackingService.identifyTestimonialCandidates()

    const requestsSent = []

    // Send testimonial requests to top candidates (limit to prevent spam)
    for (const candidate of candidates.slice(0, 10)) {
      try {
        const request = await TestimonialService.sendTestimonialRequest(
          candidate.userId,
          {
            beforeValuation: candidate.currentValuation / (1 + candidate.improvementPercentage / 100),
            afterValuation: candidate.currentValuation,
            improvementPercentage: candidate.improvementPercentage,
            timeFrame: candidate.timeFrame
          },
          'significant_improvement'
        )
        
        requestsSent.push({
          userId: candidate.userId,
          requestId: request.id,
          improvementPercentage: candidate.improvementPercentage
        })
      } catch (error) {
        console.error(`Failed to send testimonial request to user ${candidate.userId}:`, error)
        // Continue with other candidates
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        requestsSent: requestsSent.length,
        candidatesIdentified: candidates.length,
        requests: requestsSent
      }
    })
  } catch (error) {
    console.error('Error sending batch testimonial requests:', error)
    return NextResponse.json(
      { error: 'Failed to send testimonial requests' },
      { status: 500 }
    )
  }
}