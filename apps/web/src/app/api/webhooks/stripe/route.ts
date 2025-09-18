/**
 * Stripe Webhook Endpoint with Secure Validation
 * Story 11.2: Subscription-Based Routing Middleware
 */

import { handleStripeWebhook } from '@/lib/stripe/webhooks'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

/**
 * Stripe webhook handler with secure signature validation
 * This endpoint handles real-time subscription updates from Stripe
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Get raw body for signature verification
    const body = await request.text()

    if (!body) {
      console.error('Webhook: Empty request body')
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      )
    }

    // Get Stripe signature from headers
    const headersList = headers()
    const stripeSignature = headersList.get('stripe-signature')

    if (!stripeSignature) {
      console.error('Webhook: Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Validate environment variables
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Webhook: STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Webhook: STRIPE_SECRET_KEY not configured')
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      )
    }

    // Log webhook attempt for monitoring
    console.log(`Webhook received: ${body.length} bytes, signature present`)

    // Process webhook with secure validation
    const result = await handleStripeWebhook(body, stripeSignature)

    const totalExecutionTime = Date.now() - startTime

    // Log result for monitoring
    console.log(`Webhook processed in ${totalExecutionTime}ms:`, {
      success: result.success,
      message: result.message,
      userId: result.userId,
      tier: result.tier,
      handlerTime: result.executionTime
    })

    // Return success response
    return NextResponse.json({
      received: true,
      success: result.success,
      message: result.message,
      executionTime: totalExecutionTime,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const totalExecutionTime = Date.now() - startTime

    console.error('Webhook processing error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      executionTime: totalExecutionTime
    })

    // Distinguish between different error types for proper HTTP status codes
    let statusCode = 400 // Default bad request

    if (error instanceof Error) {
      if (error.message.includes('signature')) {
        statusCode = 401 // Unauthorized for signature issues
      } else if (error.message.includes('webhook secret')) {
        statusCode = 500 // Internal server error for configuration issues
      } else if (error.message.includes('No signatures found')) {
        statusCode = 400 // Bad request for malformed signature
      }
    }

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime: totalExecutionTime,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }
}

/**
 * Health check endpoint for webhook monitoring
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: 'stripe-webhooks',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY
  })
}

/**
 * Reject other HTTP methods
 */
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}