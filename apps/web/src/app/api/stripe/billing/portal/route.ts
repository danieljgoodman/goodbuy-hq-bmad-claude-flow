import { PaymentService } from '@/lib/services/PaymentService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createPortalSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  returnUrl: z.string().url('Valid return URL is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, returnUrl } = createPortalSchema.parse(body)

    const session = await PaymentService.createCustomerPortalSession(userId, returnUrl)

    return NextResponse.json({
      url: session.url,
    })
  } catch (error) {
    console.error('Error creating customer portal session:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to create customer portal session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}