import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { SubscriptionTier } from '@/types/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify the session belongs to the current user
    if (session.metadata?.clerkUserId !== userId) {
      return NextResponse.json(
        { error: 'Session does not belong to current user' },
        { status: 403 }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const subscription = session.subscription as Stripe.Subscription;
    const customer = session.customer as Stripe.Customer;

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      );
    }

    // Get the tier from subscription metadata or price ID
    const tier = getTierFromSubscription(subscription);

    // Update user metadata in Clerk
    const { clerkClient } = await import('@clerk/nextjs/server');
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        subscriptionTier: tier,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        lastUpdated: new Date().toISOString()
      }
    });

    // Get feature list for the tier
    const features = getFeaturesForTier(tier);

    // Prepare response data
    const subscriptionDetails = {
      tier,
      sessionId,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency || 'usd',
      nextBillingDate: new Date(subscription.current_period_end * 1000),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      features,
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status
    };

    // Log successful subscription
    console.log(`Subscription verified for user ${userId}: ${tier} plan`);

    // Track conversion for analytics
    await trackSubscriptionSuccess(userId, tier, session);

    return NextResponse.json(subscriptionDetails);

  } catch (error) {
    console.error('Error verifying subscription:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Payment service error: ${error.message}` },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to verify subscription' },
      { status: 500 }
    );
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

function getFeaturesForTier(tier: SubscriptionTier): string[] {
  const tierFeatures: Record<SubscriptionTier, string[]> = {
    free: [
      'Basic Analytics',
      'Standard Reports',
      'Community Support'
    ],
    professional: [
      'Advanced Analytics',
      'Custom Benchmarks',
      'API Access',
      'Priority Support',
      'Export Capabilities',
      'Custom Dashboards'
    ],
    enterprise: [
      'Advanced Analytics',
      'Custom Benchmarks',
      'API Access',
      'Priority Support',
      'Export Capabilities',
      'Custom Dashboards',
      'White Label Solution',
      'Custom Integrations',
      'Dedicated Account Manager',
      'SLA Guarantee',
      'Advanced Security',
      'Custom Training'
    ]
  };

  return tierFeatures[tier] || [];
}

async function trackSubscriptionSuccess(
  userId: string,
  tier: SubscriptionTier,
  session: Stripe.Checkout.Session
) {
  try {
    // Track with internal analytics
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'subscription_success',
        userId,
        properties: {
          tier,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency,
          sessionId: session.id,
          subscriptionId: (session.subscription as Stripe.Subscription)?.id,
          timestamp: new Date().toISOString()
        }
      })
    });

    // Log audit event
    await fetch('/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        action: 'subscription_verified',
        details: {
          tier,
          sessionId: session.id,
          amount: session.amount_total ? session.amount_total / 100 : 0
        },
        timestamp: new Date().toISOString(),
        source: 'stripe-verification'
      })
    });

    console.log(`Subscription success tracked for user ${userId}`);

  } catch (error) {
    console.error('Error tracking subscription success:', error);
    // Don't throw - tracking failure shouldn't affect the main flow
  }
}