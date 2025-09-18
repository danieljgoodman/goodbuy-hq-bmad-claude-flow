import { stripe, STRIPE_CONFIG } from './server'
import { PrismaClient } from '@prisma/client'
import { UserTierService } from '@/lib/services/user-tier-service'
import { ClerkTierIntegration } from '@/lib/auth/clerk-tier-integration'
import type { SubscriptionTier, SubscriptionStatus } from '@/types/subscription'
import Stripe from 'stripe'
import { clerkClient } from '@clerk/nextjs/server'

const prisma = new PrismaClient()

export async function handleStripeWebhook(
  body: string | Buffer,
  signature: string
) {
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    throw new Error('Invalid webhook signature')
  }

  console.log(`Processing Stripe webhook: ${event.type}`)

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return { received: true }
  } catch (error) {
    console.error('Error processing webhook:', error)
    throw error
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id)

  try {
    // Find user by customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: subscription.customer as string },
    })

    if (!user) {
      console.error('User not found for subscription:', subscription.id)
      return
    }

    // Update Clerk user metadata with subscription info
    if (user.clerkId) {
      await clerkClient.users.updateUserMetadata(user.clerkId, {
        publicMetadata: {
          subscriptionTier: getPriceInfo(subscription.items.data[0]?.price?.id || '').tier,
          subscriptionStatus: subscription.status,
          stripeCustomerId: subscription.customer as string,
        },
      })
    }

    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    })

    if (existingSubscription) {
      console.log('Subscription already exists in database')
      return
    }

    // Get price info to determine tier
    const priceId = subscription.items.data[0]?.price?.id
    if (!priceId) {
      console.error('No price ID found in subscription')
      return
    }

    const { tier, billingCycle } = getPriceInfo(priceId)
    const mappedTier = mapToInternalTier(tier)

    // Use UserTierService for comprehensive tier management
    await UserTierService.updateUserTier(user.id, {
      tier: mappedTier,
      status: mapToInternalStatus(subscription.status),
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false
    })

    // Also maintain the existing database structure for backward compatibility
    await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        status: mapSubscriptionStatus(subscription.status),
        tier,
        billingCycle,
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      },
    })

    console.log(`Successfully created subscription for user ${user.id} with tier ${mappedTier}`)

  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error)
    throw error // Re-throw to be handled by main webhook handler
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id)

  try {
    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true }
    })

    if (!dbSubscription) {
      console.error('Subscription not found in database:', subscription.id)
      return
    }

    // Update Clerk user metadata with updated subscription info
    if (dbSubscription.user.clerkId) {
      const priceId = subscription.items.data[0]?.price?.id || ''
      const { tier } = getPriceInfo(priceId)

      await clerkClient.users.updateUserMetadata(dbSubscription.user.clerkId, {
        publicMetadata: {
          subscriptionTier: tier,
          subscriptionStatus: subscription.status,
          stripeCustomerId: subscription.customer as string,
        },
      })
    }

    const priceId = subscription.items.data[0]?.price?.id
    if (!priceId) {
      console.error('No price ID found in subscription')
      return
    }

    const { tier, billingCycle } = getPriceInfo(priceId)
    const mappedTier = mapToInternalTier(tier)

    // Use UserTierService for comprehensive updates
    await UserTierService.updateUserTier(dbSubscription.userId, {
      tier: mappedTier,
      status: mapToInternalStatus(subscription.status),
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false
    })

    // Update existing subscription record
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        stripePriceId: priceId,
        status: mapSubscriptionStatus(subscription.status),
        tier,
        billingCycle,
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        cancelledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      },
    })

    console.log(`Successfully updated subscription for user ${dbSubscription.userId} to tier ${mappedTier}`)

  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error)
    throw error
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id)

  try {
    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true }
    })

    if (!dbSubscription) {
      console.error('Subscription not found in database:', subscription.id)
      return
    }

    // Update Clerk user metadata - downgrade to free tier
    if (dbSubscription.user.clerkId) {
      await clerkClient.users.updateUserMetadata(dbSubscription.user.clerkId, {
        publicMetadata: {
          subscriptionTier: 'free',
          subscriptionStatus: 'canceled',
          stripeCustomerId: subscription.customer as string,
        },
      })
    }

    // Use UserTierService to downgrade to BASIC tier
    await UserTierService.updateUserTier(dbSubscription.userId, {
      tier: 'BASIC',
      status: 'CANCELED',
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: '',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: true
    })

    // Update existing subscription record
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELED',
        cancelledAt: new Date(),
      },
    })

    console.log(`Successfully canceled subscription for user ${dbSubscription.userId}`)

  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error)
    throw error
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded for invoice:', invoice.id)

  if (!invoice.subscription) {
    console.log('Invoice not associated with subscription')
    return
  }

  // Update subscription status to active if it was incomplete
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: invoice.subscription as string },
    data: { status: 'ACTIVE' },
  })

  // Record successful payment
  if (invoice.payment_intent) {
    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: invoice.payment_intent as string },
      data: {
        status: 'SUCCEEDED',
        receiptUrl: invoice.hosted_invoice_url,
      },
    })
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed for invoice:', invoice.id)

  if (!invoice.subscription) {
    console.log('Invoice not associated with subscription')
    return
  }

  // Update subscription status to past due
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: invoice.subscription as string },
    data: { status: 'PAST_DUE' },
  })

  // Record failed payment
  if (invoice.payment_intent) {
    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: invoice.payment_intent as string },
      data: { status: 'FAILED' },
    })
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  console.log('Trial will end for subscription:', subscription.id)
  
  // This is where you could send notification emails
  // For now, just log it
  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { user: true },
  })

  if (dbSubscription) {
    console.log(`Trial ending soon for user: ${dbSubscription.user.email}`)
    // TODO: Send email notification
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id)

  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: {
      status: 'SUCCEEDED',
      receiptUrl: paymentIntent.receipt_email ? `Receipt sent to ${paymentIntent.receipt_email}` : null,
    },
  })
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id)

  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: 'FAILED' },
  })
}

function mapSubscriptionStatus(stripeStatus: string): 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' {
  const statusMap: Record<string, 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED'> = {
    'trialing': 'TRIALING',
    'active': 'ACTIVE',
    'past_due': 'PAST_DUE',
    'canceled': 'CANCELED',
    'unpaid': 'UNPAID',
    'incomplete': 'INCOMPLETE',
    'incomplete_expired': 'INCOMPLETE_EXPIRED',
  }

  return statusMap[stripeStatus] || 'INCOMPLETE'
}

function getPriceInfo(priceId: string): { tier: 'free' | 'premium' | 'enterprise', billingCycle: 'MONTHLY' | 'ANNUAL' } {
  // This should match your Stripe price IDs
  // You'll need to configure these based on your actual Stripe setup
  const priceMap: Record<string, { tier: 'free' | 'premium' | 'enterprise', billingCycle: 'MONTHLY' | 'ANNUAL' }> = {
    [process.env.STRIPE_PROFESSIONAL_PRICE_ID || '']: { tier: 'premium', billingCycle: 'MONTHLY' },
    [process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || '']: { tier: 'premium', billingCycle: 'MONTHLY' },
    [process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID || '']: { tier: 'premium', billingCycle: 'ANNUAL' },
    [process.env.STRIPE_ENTERPRISE_PRICE_ID || '']: { tier: 'enterprise', billingCycle: 'MONTHLY' },
    [process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '']: { tier: 'enterprise', billingCycle: 'MONTHLY' },
    [process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || '']: { tier: 'enterprise', billingCycle: 'ANNUAL' },
  }

  return priceMap[priceId] || { tier: 'free', billingCycle: 'MONTHLY' }
}

/**
 * Map database tier to internal types
 */
function mapToInternalTier(tier: string): SubscriptionTier {
  const tierMap: Record<string, SubscriptionTier> = {
    'free': 'BASIC',
    'premium': 'PROFESSIONAL',
    'enterprise': 'ENTERPRISE'
  }
  return tierMap[tier] || 'BASIC'
}

/**
 * Map Stripe status to internal types
 */
function mapToInternalStatus(stripeStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    'trialing': 'TRIALING',
    'active': 'ACTIVE',
    'past_due': 'PAST_DUE',
    'canceled': 'CANCELED',
    'unpaid': 'UNPAID',
    'incomplete': 'INCOMPLETE',
    'incomplete_expired': 'INCOMPLETE_EXPIRED'
  }
  return statusMap[stripeStatus] || 'ACTIVE'
}