import { SubscriptionService } from '@/lib/services/SubscriptionService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateSubscriptionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  newPriceId: z.string().min(1, 'New price ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, newPriceId } = updateSubscriptionSchema.parse(body)

    const result = await SubscriptionService.updateSubscription(userId, newPriceId)

    return NextResponse.json({
      success: true,
      subscriptionId: result.subscription.id,
      newTier: result.dbSubscription.tier,
      newBillingCycle: result.dbSubscription.billingCycle,
      currentPeriodStart: result.subscription.current_period_start,
      currentPeriodEnd: result.subscription.current_period_end,
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to update subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}