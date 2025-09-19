/**
 * Stripe Webhook Handler for Subscription Updates
 * Story 11.10: Real-time subscription synchronization with Clerk
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { ClerkTierIntegration } from '@/lib/auth/clerk-tier-integration'
import type {
  SubscriptionTier,
  SubscriptionStatus
} from '@/types/subscription'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

/**
 * Webhook event handler for subscription updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const sig = headersList.get('stripe-signature')

    if (!sig) {
      console.error('Missing Stripe signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`Received Stripe webhook: ${event.type}`)

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event)
        break

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event)
        break

      case 'customer.created':
        await handleCustomerCreated(event)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle subscription created/updated events
 */
async function handleSubscriptionChange(event: Stripe.Event) {
  try {
    const subscription = event.data.object as Stripe.Subscription

    // Get customer information
    const customer = await stripe.customers.retrieve(subscription.customer as string)

    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted:', subscription.customer)
      return
    }

    // Extract user ID from customer metadata
    const userId = (customer as Stripe.Customer).metadata?.clerkUserId

    if (!userId) {
      console.error('No Clerk user ID found in customer metadata:', customer.id)
      return
    }

    // Map Stripe subscription to our tier system
    const tierMapping = await mapStripePriceToTier(subscription.items.data[0]?.price?.id)
    const subscriptionStatus = mapStripeStatusToOur(subscription.status)

    const webhookData = {
      type: event.type as 'subscription.created' | 'subscription.updated',
      userId,
      stripeCustomerId: customer.id,
      subscriptionId: subscription.id,
      tier: tierMapping.tier,
      status: subscriptionStatus,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      metadata: {
        stripePriceId: subscription.items.data[0]?.price?.id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        ...subscription.metadata
      }
    }

    await ClerkTierIntegration.handleWebhookUpdate(webhookData)

    console.log(`Successfully processed ${event.type} for user ${userId}`)
  } catch (error) {
    console.error('Error handling subscription change:', error)
    throw error
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(event: Stripe.Event) {
  try {
    const subscription = event.data.object as Stripe.Subscription

    const customer = await stripe.customers.retrieve(subscription.customer as string)

    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted:', subscription.customer)
      return
    }

    const userId = (customer as Stripe.Customer).metadata?.clerkUserId

    if (!userId) {
      console.error('No Clerk user ID found in customer metadata:', customer.id)
      return
    }

    const webhookData = {
      type: 'subscription.deleted' as const,
      userId,
      stripeCustomerId: customer.id,
      subscriptionId: subscription.id,
      tier: 'BASIC' as SubscriptionTier, // Downgrade to basic
      status: 'CANCELED' as SubscriptionStatus,
      metadata: {
        canceledAt: new Date().toISOString(),
        ...subscription.metadata
      }
    }

    await ClerkTierIntegration.handleWebhookUpdate(webhookData)

    // Handle tier downgrade edge case
    await ClerkTierIntegration.handleAuthEdgeCase('subscription_cancelled', userId)

    console.log(`Successfully processed subscription cancellation for user ${userId}`)
  } catch (error) {
    console.error('Error handling subscription cancellation:', error)
    throw error
  }
}

/**
 * Handle trial will end notification
 */
async function handleTrialWillEnd(event: Stripe.Event) {
  try {
    const subscription = event.data.object as Stripe.Subscription

    const customer = await stripe.customers.retrieve(subscription.customer as string)

    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted:', subscription.customer)
      return
    }

    const userId = (customer as Stripe.Customer).metadata?.clerkUserId

    if (!userId) {
      console.error('No Clerk user ID found in customer metadata:', customer.id)
      return
    }

    // Send trial ending notification (implement as needed)
    await sendTrialEndingNotification(userId, subscription)

    console.log(`Trial ending notification sent for user ${userId}`)
  } catch (error) {
    console.error('Error handling trial will end:', error)
    throw error
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(event: Stripe.Event) {
  try {
    const invoice = event.data.object as Stripe.Invoice

    if (!invoice.subscription) {
      return // Not a subscription invoice
    }

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    const customer = await stripe.customers.retrieve(subscription.customer as string)

    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted:', subscription.customer)
      return
    }

    const userId = (customer as Stripe.Customer).metadata?.clerkUserId

    if (!userId) {
      console.error('No Clerk user ID found in customer metadata:', customer.id)
      return
    }

    // Update subscription status to active if it was past due
    if (subscription.status === 'past_due') {
      const tierMapping = await mapStripePriceToTier(subscription.items.data[0]?.price?.id)

      const webhookData = {
        type: 'subscription.updated' as const,
        userId,
        stripeCustomerId: customer.id,
        subscriptionId: subscription.id,
        tier: tierMapping.tier,
        status: 'ACTIVE' as SubscriptionStatus,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        metadata: {
          paymentSucceeded: true,
          invoiceId: invoice.id,
          ...subscription.metadata
        }
      }

      await ClerkTierIntegration.handleWebhookUpdate(webhookData)
    }

    console.log(`Payment succeeded for user ${userId}`)
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
    throw error
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(event: Stripe.Event) {
  try {
    const invoice = event.data.object as Stripe.Invoice

    if (!invoice.subscription) {
      return // Not a subscription invoice
    }

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    const customer = await stripe.customers.retrieve(subscription.customer as string)

    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted:', subscription.customer)
      return
    }

    const userId = (customer as Stripe.Customer).metadata?.clerkUserId

    if (!userId) {
      console.error('No Clerk user ID found in customer metadata:', customer.id)
      return
    }

    // Update subscription status to past due
    const tierMapping = await mapStripePriceToTier(subscription.items.data[0]?.price?.id)

    const webhookData = {
      type: 'subscription.updated' as const,
      userId,
      stripeCustomerId: customer.id,
      subscriptionId: subscription.id,
      tier: tierMapping.tier,
      status: 'PAST_DUE' as SubscriptionStatus,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      metadata: {
        paymentFailed: true,
        invoiceId: invoice.id,
        attemptCount: invoice.attempt_count,
        ...subscription.metadata
      }
    }

    await ClerkTierIntegration.handleWebhookUpdate(webhookData)

    // Send payment failed notification (implement as needed)
    await sendPaymentFailedNotification(userId, invoice)

    console.log(`Payment failed for user ${userId}`)
  } catch (error) {
    console.error('Error handling payment failed:', error)
    throw error
  }
}

/**
 * Handle customer creation
 */
async function handleCustomerCreated(event: Stripe.Event) {
  try {
    const customer = event.data.object as Stripe.Customer

    const userId = customer.metadata?.clerkUserId

    if (!userId) {
      console.log('Customer created without Clerk user ID:', customer.id)
      return
    }

    // Initialize basic tier for new customer
    const webhookData = {
      type: 'subscription.created' as const,
      userId,
      stripeCustomerId: customer.id,
      subscriptionId: 'pending', // Will be updated when subscription is created
      tier: 'BASIC' as SubscriptionTier,
      status: 'ACTIVE' as SubscriptionStatus,
      metadata: {
        customerCreated: true,
        ...customer.metadata
      }
    }

    await ClerkTierIntegration.handleWebhookUpdate(webhookData)

    console.log(`Customer created and synced for user ${userId}`)
  } catch (error) {
    console.error('Error handling customer created:', error)
    throw error
  }
}

/**
 * Map Stripe price ID to our tier system
 */
async function mapStripePriceToTier(priceId?: string): Promise<{
  tier: SubscriptionTier
  features: string[]
}> {
  // This mapping should be configured based on your Stripe price IDs
  const priceToTierMap: Record<string, { tier: SubscriptionTier; features: string[] }> = {
    // Professional tier price IDs
    [process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional']: {
      tier: 'PROFESSIONAL',
      features: [
        'professional_evaluation', 'ai_guides', 'progress_tracking',
        'pdf_reports', 'advanced_analytics', 'export_data'
      ]
    },
    // Enterprise tier price IDs
    [process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise']: {
      tier: 'ENTERPRISE',
      features: [
        'enterprise_evaluation', 'benchmarks', 'multi_user',
        'api_access', 'custom_branding', 'dedicated_support'
      ]
    }
  }

  return priceToTierMap[priceId || ''] || {
    tier: 'BASIC',
    features: ['basic_evaluation', 'basic_reports', 'basic_analytics']
  }
}

/**
 * Map Stripe subscription status to our status system
 */
function mapStripeStatusToOur(stripeStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    'active': 'ACTIVE',
    'canceled': 'CANCELED',
    'past_due': 'PAST_DUE',
    'trialing': 'TRIALING',
    'incomplete': 'INCOMPLETE',
    'incomplete_expired': 'INCOMPLETE_EXPIRED',
    'unpaid': 'UNPAID'
  }

  return statusMap[stripeStatus] || 'ACTIVE'
}

/**
 * Send trial ending notification
 */
async function sendTrialEndingNotification(
  userId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  try {
    // Implement your notification system here
    // This could be email, in-app notification, etc.
    console.log(`Sending trial ending notification to user ${userId}`)

    // Example: Send email notification
    // await emailService.sendTrialEndingEmail(userId, subscription.trial_end)

    // Example: Create in-app notification
    // await notificationService.createNotification({
    //   userId,
    //   type: 'trial_ending',
    //   message: 'Your trial is ending soon. Upgrade to continue using all features.',
    //   actionUrl: '/pricing'
    // })
  } catch (error) {
    console.error('Error sending trial ending notification:', error)
  }
}

/**
 * Send payment failed notification
 */
async function sendPaymentFailedNotification(
  userId: string,
  invoice: Stripe.Invoice
): Promise<void> {
  try {
    // Implement your notification system here
    console.log(`Sending payment failed notification to user ${userId}`)

    // Example: Send email notification
    // await emailService.sendPaymentFailedEmail(userId, invoice)

    // Example: Create in-app notification
    // await notificationService.createNotification({
    //   userId,
    //   type: 'payment_failed',
    //   message: 'Your payment failed. Please update your payment method.',
    //   actionUrl: '/account/billing'
    // })
  } catch (error) {
    console.error('Error sending payment failed notification:', error)
  }
}