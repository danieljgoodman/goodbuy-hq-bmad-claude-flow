import { stripe, STRIPE_CONFIG } from './server'
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

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
  
  // Find user by customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: subscription.customer as string },
  })

  if (!user) {
    console.error('User not found for subscription:', subscription.id)
    return
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

  // Update user subscription tier
  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionTier: tier },
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id)

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (!dbSubscription) {
    console.error('Subscription not found in database:', subscription.id)
    return
  }

  const priceId = subscription.items.data[0]?.price?.id
  if (!priceId) {
    console.error('No price ID found in subscription')
    return
  }

  const { tier, billingCycle } = getPriceInfo(priceId)

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

  // Update user subscription tier
  await prisma.user.update({
    where: { id: dbSubscription.userId },
    data: { subscriptionTier: tier },
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id)

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (!dbSubscription) {
    console.error('Subscription not found in database:', subscription.id)
    return
  }

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
      cancelledAt: new Date(),
    },
  })

  // Update user back to free tier
  await prisma.user.update({
    where: { id: dbSubscription.userId },
    data: { subscriptionTier: 'FREE' },
  })
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

function getPriceInfo(priceId: string): { tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE', billingCycle: 'MONTHLY' | 'ANNUAL' } {
  // This should match your Stripe price IDs
  // You'll need to configure these based on your actual Stripe setup
  const priceMap: Record<string, { tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE', billingCycle: 'MONTHLY' | 'ANNUAL' }> = {
    [process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '']: { tier: 'PREMIUM', billingCycle: 'MONTHLY' },
    [process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID || '']: { tier: 'PREMIUM', billingCycle: 'ANNUAL' },
    [process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '']: { tier: 'ENTERPRISE', billingCycle: 'MONTHLY' },
    [process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || '']: { tier: 'ENTERPRISE', billingCycle: 'ANNUAL' },
  }

  return priceMap[priceId] || { tier: 'FREE', billingCycle: 'MONTHLY' }
}