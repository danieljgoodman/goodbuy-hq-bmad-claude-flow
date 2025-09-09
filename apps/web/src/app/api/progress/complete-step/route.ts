import { ProgressService } from '@/lib/services/ProgressService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const completeStepSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  stepId: z.string().min(1, 'Step ID is required'),
  guideId: z.string().min(1, 'Guide ID is required'),
  improvementCategory: z.string().min(1, 'Improvement category is required'),
  notes: z.string().optional(),
  timeInvested: z.number().min(0, 'Time invested must be non-negative'),
  moneyInvested: z.number().min(0, 'Money invested must be non-negative'),
  evidence: z.array(z.object({
    type: z.enum(['photo', 'document', 'url', 'text']),
    content: z.string(),
    description: z.string().optional(),
    uploadedAt: z.string().transform(str => new Date(str))
  }))
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = completeStepSchema.parse(body)

    const progressEntry = await ProgressService.completeStep(validatedData)

    return NextResponse.json({
      success: true,
      progressEntry
    })
  } catch (error) {
    console.error('Error completing step:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to complete step',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}