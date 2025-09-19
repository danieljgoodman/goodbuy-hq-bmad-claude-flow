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

    const { tier, returnUrl } = await req.json();

    if (!tier || !['professional', 'enterprise'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier specified' },
        { status: 400 }
      );
    }

    // Get price ID based on tier
    const priceId = tier === 'professional'
      ? process.env.STRIPE_PROFESSIONAL_PRICE_ID!
      : process.env.STRIPE_ENTERPRISE_PRICE_ID!;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price configuration not found' },
        { status: 500 }
      );
    }

    // Get user email from Clerk
    const { clerkClient } = await import('@clerk/nextjs/server');
    const user = await clerkClient.users.getUser(userId);

    if (!user.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    const userEmail = user.emailAddresses[0].emailAddress;

    // Check if customer already exists
    let customerId: string;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: userEmail,
        name: user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || 'User',
        metadata: {
          clerkUserId: userId
        }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      subscription_data: {
        metadata: {
          clerkUserId: userId,
          tier: tier
        },
        trial_period_days: process.env.NODE_ENV === 'production' ? undefined : 7, // 7-day trial in dev
      },
      metadata: {
        clerkUserId: userId,
        tier: tier
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: {
        enabled: true
      },
      automatic_tax: {
        enabled: true
      },
      customer_update: {
        name: 'auto',
        address: 'auto'
      }
    });

    // Log the checkout attempt
    console.log(`Checkout session created for user ${userId}, tier: ${tier}, session: ${session.id}`);

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Error creating checkout session:', error);

    // Return different error messages based on error type
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Payment service error: ${error.message}` },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Handle subscription status checks
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from Clerk to check current subscription
    const { clerkClient } = await import('@clerk/nextjs/server');
    const user = await clerkClient.users.getUser(userId);

    const currentTier = (user.publicMetadata?.subscriptionTier as SubscriptionTier) || 'free';
    const subscriptionStatus = user.publicMetadata?.subscriptionStatus as string;
    const stripeCustomerId = user.publicMetadata?.stripeCustomerId as string;

    let subscriptionDetails = null;

    // If user has a Stripe customer ID, fetch subscription details
    if (stripeCustomerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: 'active',
          limit: 1
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          subscriptionDetails = {
            id: subscription.id,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
          };
        }
      } catch (error) {
        console.error('Error fetching subscription details:', error);
      }
    }

    return NextResponse.json({
      tier: currentTier,
      status: subscriptionStatus,
      subscription: subscriptionDetails,
      userId
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}