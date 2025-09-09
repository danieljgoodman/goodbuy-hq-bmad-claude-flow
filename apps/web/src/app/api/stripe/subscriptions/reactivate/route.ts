import { SubscriptionService } from '@/lib/services/SubscriptionService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const reactivateSubscriptionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = reactivateSubscriptionSchema.parse(body)

    const result = await SubscriptionService.reactivateSubscription(userId)

    return NextResponse.json({
      success: true,
      subscriptionId: result.id,
      cancelAtPeriodEnd: result.cancel_at_period_end,
      currentPeriodEnd: result.current_period_end,
    })
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to reactivate subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}