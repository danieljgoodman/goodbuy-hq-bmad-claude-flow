import { stripe } from '@/lib/stripe/server'
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()

export class PaymentService {
  /**
   * Create payment intent for subscription
   */
  static async createPaymentIntent(
    userId: string, 
    amount: number, // in cents
    currency: string = 'usd'
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: user.stripeCustomerId || undefined,
        metadata: {
          userId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })

      // Record payment in database
      const payment = await prisma.payment.create({
        data: {
          userId,
          stripePaymentIntentId: paymentIntent.id,
          amount,
          currency,
          status: 'PENDING',
        },
      })

      return {
        paymentIntent,
        payment,
        clientSecret: paymentIntent.client_secret,
      }
    } catch (error) {
      console.error('Error creating payment intent:', error)
      throw error
    }
  }

  /**
   * Get user's payment history
   */
  static async getUserPaymentHistory(userId: string, limit: number = 10) {
    try {
      return await prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
    } catch (error) {
      console.error('Error getting payment history:', error)
      throw error
    }
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(
    paymentIntentId: string,
    status: 'SUCCEEDED' | 'FAILED' | 'REFUNDED',
    receiptUrl?: string
  ) {
    try {
      return await prisma.payment.updateMany({
        where: { stripePaymentIntentId: paymentIntentId },
        data: {
          status,
          ...(receiptUrl && { receiptUrl }),
        },
      })
    } catch (error) {
      console.error('Error updating payment status:', error)
      throw error
    }
  }

  /**
   * Get Stripe customer portal session
   */
  static async createCustomerPortalSession(userId: string, returnUrl: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user?.stripeCustomerId) {
        throw new Error('No Stripe customer found')
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      })

      return session
    } catch (error) {
      console.error('Error creating customer portal session:', error)
      throw error
    }
  }

  /**
   * Get invoices for user
   */
  static async getUserInvoices(userId: string, limit: number = 10) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user?.stripeCustomerId) {
        return []
      }

      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit,
      })

      return invoices.data
    } catch (error) {
      console.error('Error getting user invoices:', error)
      throw error
    }
  }

  /**
   * Get upcoming invoice for subscription changes
   */
  static async getUpcomingInvoice(subscriptionId: string, newPriceId?: string) {
    try {
      const params: any = {
        subscription: subscriptionId,
      }

      if (newPriceId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['items.data']
        })
        
        params.subscription_items = [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }]
      }

      const upcomingInvoice = await stripe.invoices.upcoming(params)
      
      return upcomingInvoice
    } catch (error) {
      console.error('Error getting upcoming invoice:', error)
      throw error
    }
  }
}