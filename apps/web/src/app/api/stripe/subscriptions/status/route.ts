import { SubscriptionService } from '@/lib/services/SubscriptionService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const getStatusSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const subscription = await SubscriptionService.getUserSubscription(userId)

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null,
      })
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        tier: subscription.tier,
        billingCycle: subscription.billingCycle,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelledAt: subscription.cancelledAt,
      },
    })
  } catch (error) {
    console.error('Error getting subscription status:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get subscription status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}