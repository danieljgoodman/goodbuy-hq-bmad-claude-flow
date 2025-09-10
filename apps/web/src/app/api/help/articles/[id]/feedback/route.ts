import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getServerAuth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const { feedback_type, rating, comment } = data

    // Validate required fields
    if (!feedback_type) {
      return NextResponse.json(
        { error: 'Feedback type is required' },
        { status: 400 }
      )
    }

    // Create feedback record
    const feedback = await prisma.userFeedback.create({
      data: {
        userId,
        content_id: params.id,
        content_type: 'article',
        feedback_type,
        rating,
        comment
      }
    })

    // Update article helpful votes if applicable
    if (feedback_type === 'helpful') {
      await prisma.helpContent.update({
        where: { id: params.id },
        data: { helpful_votes: { increment: 1 } }
      })
    }

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Failed to submit feedback:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}