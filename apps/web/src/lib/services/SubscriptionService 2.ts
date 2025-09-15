import { stripe, STRIPE_CONFIG, getPriceIdToTierMapping, isStripeConfigured } from '@/lib/stripe/server'
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()

export class SubscriptionService {
  /**
   * Create a new subscription with trial period
   */
  static async createSubscription(
    userId: string, 
    priceId: string, 
    email: string
  ) {
    if (!isStripeConfigured() || !stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.')
    }

    try {
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: email,
          metadata: {
            userId: userId,
          },
        })
        
        stripeCustomerId = customer.id

        // Update user with Stripe customer ID
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId },
        })
      }

      // Create subscription with 14-day trial
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        trial_period_days: 14,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      })

      // Get tier and billing cycle from price ID
      const priceMapping = getPriceIdToTierMapping()
      const tierInfo = priceMapping[priceId]

      if (!tierInfo) {
        throw new Error('Invalid price ID')
      }

      // Create subscription record in database
      const dbSubscription = await prisma.subscription.create({
        data: {
          userId: userId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          status: 'TRIALING',
          tier: tierInfo.tier as any,
          billingCycle: tierInfo.billingCycle as any,
          trialEndsAt: subscription.trial_end ? new Date((subscription as any).trial_end * 1000) : null,
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
      })

      // Update user subscription tier
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionTier: tierInfo.tier as any },
      })

      return {
        subscription,
        dbSubscription,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent
          ? (subscription.latest_invoice as any).payment_intent?.client_secret
          : null,
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw error
    }
  }

  /**
   * Cancel subscription at period end
   */
  static async cancelSubscription(userId: string) {
    try {
      const userSubscription = await prisma.subscription.findFirst({
        where: { 
          userId: userId,
          status: { in: ['ACTIVE', 'TRIALING'] },
        },
      })

      if (!userSubscription) {
        throw new Error('No active subscription found')
      }

      // Cancel at period end in Stripe
      const subscription = await stripe.subscriptions.update(
        userSubscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        }
      )

      // Update database
      await prisma.subscription.update({
        where: { id: userSubscription.id },
        data: {
          cancelAtPeriodEnd: true,
        },
      })

      return subscription
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  static async reactivateSubscription(userId: string) {
    try {
      const userSubscription = await prisma.subscription.findFirst({
        where: { 
          userId: userId,
          cancelAtPeriodEnd: true,
          status: { in: ['ACTIVE', 'TRIALING'] },
        },
      })

      if (!userSubscription) {
        throw new Error('No subscription to reactivate')
      }

      // Remove cancel at period end in Stripe
      const subscription = await stripe.subscriptions.update(
        userSubscription.stripeSubscriptionId,
        {
          cancel_at_period_end: false,
        }
      )

      // Update database
      await prisma.subscription.update({
        where: { id: userSubscription.id },
        data: {
          cancelAtPeriodEnd: false,
        },
      })

      return subscription
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      throw error
    }
  }

  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: string) {
    try {
      return await prisma.subscription.findFirst({
        where: { 
          userId: userId,
          status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      console.error('Error getting user subscription:', error)
      throw error
    }
  }

  /**
   * Upgrade/downgrade subscription
   */
  static async updateSubscription(userId: string, newPriceId: string) {
    try {
      const userSubscription = await prisma.subscription.findFirst({
        where: { 
          userId: userId,
          status: { in: ['ACTIVE', 'TRIALING'] },
        },
      })

      if (!userSubscription) {
        throw new Error('No active subscription found')
      }

      // Get current subscription from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(
        userSubscription.stripeSubscriptionId,
        { expand: ['items.data'] }
      )

      // Update subscription in Stripe with prorated billing
      const updatedSubscription = await stripe.subscriptions.update(
        userSubscription.stripeSubscriptionId,
        {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price: newPriceId,
          }],
          proration_behavior: 'create_prorations',
        }
      )

      // Get new tier and billing cycle
      const priceMapping = getPriceIdToTierMapping()
      const tierInfo = priceMapping[newPriceId]

      if (!tierInfo) {
        throw new Error('Invalid price ID')
      }

      // Update database record
      const updatedDbSubscription = await prisma.subscription.update({
        where: { id: userSubscription.id },
        data: {
          stripePriceId: newPriceId,
          tier: tierInfo.tier as any,
          billingCycle: tierInfo.billingCycle as any,
          currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
        },
      })

      // Update user subscription tier
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionTier: tierInfo.tier as any },
      })

      return {
        subscription: updatedSubscription,
        dbSubscription: updatedDbSubscription,
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
      throw error
    }
  }
}