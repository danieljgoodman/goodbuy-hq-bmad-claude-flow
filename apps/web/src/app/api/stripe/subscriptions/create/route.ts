import { SubscriptionService } from '@/lib/services/SubscriptionService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSubscriptionSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  email: z.string().email('Valid email is required'),
  userId: z.string().min(1, 'User ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createSubscriptionSchema.parse(body)

    const result = await SubscriptionService.createSubscription(
      validatedData.userId,
      validatedData.priceId,
      validatedData.email
    )

    return NextResponse.json({
      subscriptionId: result.subscription.id,
      clientSecret: result.clientSecret,
      trialEnd: result.subscription.trial_end,
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to create subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}