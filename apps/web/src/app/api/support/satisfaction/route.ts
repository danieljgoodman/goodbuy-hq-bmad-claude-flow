import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SupportService } from '@/lib/services/SupportService'

const satisfactionSchema = z.object({
  ticketId: z.string(),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ticketId, rating, feedback } = satisfactionSchema.parse(body)

    const result = await SupportService.submitSatisfactionRating(
      session.user.id,
      ticketId,
      rating,
      feedback
    )

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Error submitting satisfaction rating:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to submit satisfaction rating' },
      { status: 500 }
    )
  }
}