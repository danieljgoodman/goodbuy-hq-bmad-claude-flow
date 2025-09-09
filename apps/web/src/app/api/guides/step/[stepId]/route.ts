import { GuideService } from '@/lib/services/GuideService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

interface RouteParams {
  params: {
    stepId: string
  }
}

const updateStepSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  completed: z.boolean()
})

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { userId, completed } = updateStepSchema.parse(body)

    const step = await GuideService.updateStepCompletion(params.stepId, userId, completed)

    return NextResponse.json({
      success: true,
      step
    })
  } catch (error) {
    console.error('Error updating step completion:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to update step completion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}