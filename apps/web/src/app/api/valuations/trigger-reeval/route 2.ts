import { RevaluationService } from '@/lib/services/RevaluationService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const triggerRevalSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  originalEvaluationId: z.string().min(1, 'Original evaluation ID is required'),
  reason: z.string().min(1, 'Reason is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, originalEvaluationId, reason } = triggerRevalSchema.parse(body)

    const revaluationResult = await RevaluationService.triggerManualRevaluation(
      userId,
      originalEvaluationId,
      reason
    )

    return NextResponse.json({
      success: true,
      revaluation: revaluationResult
    })
  } catch (error) {
    console.error('Error triggering revaluation:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to trigger revaluation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}