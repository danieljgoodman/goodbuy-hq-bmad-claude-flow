import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { FeedbackService } from '@/lib/services/FeedbackService'

const npsSchema = z.object({
  score: z.number().min(0).max(10),
  comment: z.string().optional(),
  surveyType: z.enum(['onboarding', 'milestone', 'periodic', 'exit']).default('periodic')
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { score, comment, surveyType } = npsSchema.parse(body)

    const response = await FeedbackService.submitNPSScore(
      session.user.id,
      score,
      comment,
      surveyType
    )

    return NextResponse.json({
      success: true,
      data: {
        response
      }
    })
  } catch (error: any) {
    console.error('Error submitting NPS score:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to submit NPS score' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10

    const history = await FeedbackService.getUserFeedbackHistory(session.user.id, limit)

    return NextResponse.json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Error fetching NPS history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback history' },
      { status: 500 }
    )
  }
}