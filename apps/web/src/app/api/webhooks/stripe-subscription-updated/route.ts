import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { clerkClient } from '@clerk/nextjs/server';
import { processTierUpgradeFromWebhook } from '@/lib/subscription/tier-upgrade-handler';
import { SubscriptionTier } from '@/types/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Processing Stripe webhook event:', event.type);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  try {
    // Get customer information
    const customer = await stripe.customers.retrieve(subscription.customer as string);

    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted');
      return;
    }

    const customerEmail = (customer as Stripe.Customer).email;
    if (!customerEmail) {
      console.error('Customer email not found');
      return;
    }

    // Find user by email in Clerk
    const users = await clerkClient.users.getUserList({
      emailAddress: [customerEmail]
    });

    if (users.length === 0) {
      console.error('User not found in Clerk for email:', customerEmail);
      return;
    }

    const user = users[0];
    const userId = user.id;

    // Get current tier from user metadata
    const currentTier = (user.publicMetadata?.subscriptionTier as SubscriptionTier) || 'free';

    // Determine new tier from subscription
    const newTier = getTierFromSubscription(subscription);

    console.log(`Subscription updated for user ${userId}: ${currentTier} -> ${newTier}`);

    // Update user metadata in Clerk
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        subscriptionTier: newTier,
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        lastUpdated: new Date().toISOString()
      }
    });

    // Process tier upgrade/downgrade
    if (currentTier !== newTier) {
      await processTierUpgradeFromWebhook(
        userId,
        currentTier,
        newTier,
        event.id
      );

      // Send confirmation email
      await sendSubscriptionConfirmationEmail(
        customerEmail,
        user.firstName || 'User',
        currentTier,
        newTier,
        subscription
      );

      // Log audit event
      await logAuditEvent({
        userId,
        action: 'subscription_updated',
        details: {
          oldTier: currentTier,
          newTier,
          subscriptionId: subscription.id,
          stripeEventId: event.id
        }
      });
    }

  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string);

    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted');
      return;
    }

    const customerEmail = (customer as Stripe.Customer).email;
    if (!customerEmail) {
      console.error('Customer email not found');
      return;
    }

    const users = await clerkClient.users.getUserList({
      emailAddress: [customerEmail]
    });

    if (users.length === 0) {
      console.error('User not found in Clerk for email:', customerEmail);
      return;
    }

    const user = users[0];
    const userId = user.id;
    const currentTier = (user.publicMetadata?.subscriptionTier as SubscriptionTier) || 'free';

    console.log(`Subscription cancelled for user ${userId}: ${currentTier} -> free`);

    // Update user metadata to free tier
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        subscriptionTier: 'free',
        subscriptionStatus: 'cancelled',
        cancelledAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    });

    // Process downgrade to free tier
    if (currentTier !== 'free') {
      await processTierUpgradeFromWebhook(
        userId,
        currentTier,
        'free',
        event.id
      );

      // Send cancellation email
      await sendSubscriptionCancellationEmail(
        customerEmail,
        user.firstName || 'User',
        currentTier
      );
    }

  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  try {
    if (!invoice.subscription) return;

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const customer = await stripe.customers.retrieve(subscription.customer as string);

    if (!customer || customer.deleted) return;

    const customerEmail = (customer as Stripe.Customer).email;
    if (!customerEmail) return;

    const users = await clerkClient.users.getUserList({
      emailAddress: [customerEmail]
    });

    if (users.length === 0) return;

    const user = users[0];

    // Send payment success notification
    await sendPaymentSuccessEmail(
      customerEmail,
      user.firstName || 'User',
      invoice.amount_paid / 100,
      invoice.currency.toUpperCase()
    );

    // Log successful payment
    await logAuditEvent({
      userId: user.id,
      action: 'payment_succeeded',
      details: {
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        invoiceId: invoice.id,
        subscriptionId: subscription.id
      }
    });

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  try {
    if (!invoice.subscription) return;

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const customer = await stripe.customers.retrieve(subscription.customer as string);

    if (!customer || customer.deleted) return;

    const customerEmail = (customer as Stripe.Customer).email;
    if (!customerEmail) return;

    const users = await clerkClient.users.getUserList({
      emailAddress: [customerEmail]
    });

    if (users.length === 0) return;

    const user = users[0];

    // Send payment failure notification
    await sendPaymentFailureEmail(
      customerEmail,
      user.firstName || 'User',
      invoice.amount_due / 100,
      invoice.currency.toUpperCase()
    );

    // Log failed payment
    await logAuditEvent({
      userId: user.id,
      action: 'payment_failed',
      details: {
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        invoiceId: invoice.id,
        subscriptionId: subscription.id,
        attemptCount: invoice.attempt_count
      }
    });

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

function getTierFromSubscription(subscription: Stripe.Subscription): SubscriptionTier {
  const priceId = subscription.items.data[0]?.price.id;

  // Map Stripe price IDs to tiers
  const priceToTierMap: Record<string, SubscriptionTier> = {
    [process.env.STRIPE_PROFESSIONAL_PRICE_ID!]: 'professional',
    [process.env.STRIPE_ENTERPRISE_PRICE_ID!]: 'enterprise',
  };

  return priceToTierMap[priceId] || 'free';
}

async function sendSubscriptionConfirmationEmail(
  email: string,
  name: string,
  oldTier: SubscriptionTier,
  newTier: SubscriptionTier,
  subscription: Stripe.Subscription
) {
  try {
    const isUpgrade = getTierLevel(newTier) > getTierLevel(oldTier);
    const subject = isUpgrade ? 'Welcome to your upgraded plan!' : 'Subscription updated';

    // You can integrate with your email service here (SendGrid, AWS SES, etc.)
    console.log(`Sending ${isUpgrade ? 'upgrade' : 'update'} confirmation email to ${email}`);

    // Example with a simple fetch to your email API
    await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject,
        template: 'subscription-confirmation',
        data: {
          name,
          oldTier,
          newTier,
          isUpgrade,
          subscriptionId: subscription.id,
          nextBillingDate: new Date(subscription.current_period_end * 1000).toLocaleDateString()
        }
      })
    });

  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

async function sendSubscriptionCancellationEmail(
  email: string,
  name: string,
  tier: SubscriptionTier
) {
  try {
    console.log(`Sending cancellation email to ${email}`);

    await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'Subscription cancelled - We\'ll miss you!',
        template: 'subscription-cancellation',
        data: {
          name,
          tier,
          supportEmail: 'support@goodbuy.com'
        }
      })
    });

  } catch (error) {
    console.error('Error sending cancellation email:', error);
  }
}

async function sendPaymentSuccessEmail(
  email: string,
  name: string,
  amount: number,
  currency: string
) {
  try {
    console.log(`Sending payment success email to ${email}`);

    await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'Payment confirmed - Thank you!',
        template: 'payment-success',
        data: {
          name,
          amount,
          currency,
          date: new Date().toLocaleDateString()
        }
      })
    });

  } catch (error) {
    console.error('Error sending payment success email:', error);
  }
}

async function sendPaymentFailureEmail(
  email: string,
  name: string,
  amount: number,
  currency: string
) {
  try {
    console.log(`Sending payment failure email to ${email}`);

    await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'Payment failed - Please update your payment method',
        template: 'payment-failure',
        data: {
          name,
          amount,
          currency,
          updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`
        }
      })
    });

  } catch (error) {
    console.error('Error sending payment failure email:', error);
  }
}

async function logAuditEvent(event: {
  userId: string;
  action: string;
  details: Record<string, any>;
}) {
  try {
    await fetch('/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
        source: 'stripe-webhook'
      })
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

function getTierLevel(tier: SubscriptionTier): number {
  const levels = { free: 0, professional: 1, enterprise: 2 };
  return levels[tier] || 0;
}