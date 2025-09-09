import { TrialService } from '@/lib/services/TrialService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const cancelTrialSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = cancelTrialSchema.parse(body)

    await TrialService.cancelTrial(userId)

    return NextResponse.json({
      success: true,
      message: 'Trial cancelled successfully',
    })
  } catch (error) {
    console.error('Error cancelling trial:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to cancel trial',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}