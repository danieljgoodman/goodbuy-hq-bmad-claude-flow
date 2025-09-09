import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class TrialService {
  /**
   * Check if user is in trial period
   */
  static async isUserOnTrial(userId: string): Promise<boolean> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'TRIALING',
          trialEndsAt: {
            gt: new Date(),
          },
        },
      })

      return !!subscription
    } catch (error) {
      console.error('Error checking trial status:', error)
      return false
    }
  }

  /**
   * Get trial information for user
   */
  static async getTrialInfo(userId: string) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['TRIALING', 'ACTIVE'] },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!subscription) {
        return {
          isOnTrial: false,
          hasEverHadTrial: false,
          trialEndsAt: null,
          daysRemaining: 0,
        }
      }

      const now = new Date()
      const trialEndsAt = subscription.trialEndsAt
      const isOnTrial = subscription.status === 'TRIALING' && trialEndsAt && trialEndsAt > now
      const daysRemaining = trialEndsAt 
        ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        isOnTrial,
        hasEverHadTrial: true,
        trialEndsAt,
        daysRemaining: Math.max(0, daysRemaining),
        subscriptionId: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
      }
    } catch (error) {
      console.error('Error getting trial info:', error)
      throw error
    }
  }

  /**
   * Check if user has ever used a trial
   */
  static async hasUserEverHadTrial(userId: string): Promise<boolean> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          trialEndsAt: { not: null },
        },
      })

      return !!subscription
    } catch (error) {
      console.error('Error checking trial history:', error)
      return false
    }
  }

  /**
   * Get users whose trials are expiring soon (for notifications)
   */
  static async getUsersWithExpiringTrials(daysBeforeExpiry: number = 3) {
    try {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry)

      const subscriptions = await prisma.subscription.findMany({
        where: {
          status: 'TRIALING',
          trialEndsAt: {
            lte: expiryDate,
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      })

      return subscriptions.map(sub => ({
        userId: sub.userId,
        email: sub.user.email,
        businessName: sub.user.businessName,
        trialEndsAt: sub.trialEndsAt,
        daysRemaining: sub.trialEndsAt 
          ? Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 0,
      }))
    } catch (error) {
      console.error('Error getting expiring trials:', error)
      throw error
    }
  }

  /**
   * Extend trial period (admin function)
   */
  static async extendTrial(userId: string, additionalDays: number) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'TRIALING',
        },
      })

      if (!subscription || !subscription.trialEndsAt) {
        throw new Error('No active trial found for user')
      }

      const newTrialEndDate = new Date(subscription.trialEndsAt)
      newTrialEndDate.setDate(newTrialEndDate.getDate() + additionalDays)

      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: { trialEndsAt: newTrialEndDate },
      })

      return updatedSubscription
    } catch (error) {
      console.error('Error extending trial:', error)
      throw error
    }
  }

  /**
   * Cancel trial and revert to free tier
   */
  static async cancelTrial(userId: string) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'TRIALING',
        },
      })

      if (!subscription) {
        throw new Error('No active trial found for user')
      }

      // Update subscription status to canceled
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELED',
          cancelledAt: new Date(),
        },
      })

      // Revert user to free tier
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionTier: 'FREE' },
      })

      return true
    } catch (error) {
      console.error('Error canceling trial:', error)
      throw error
    }
  }

  /**
   * Get trial conversion statistics (for admin dashboard)
   */
  static async getTrialConversionStats() {
    try {
      // Total trials started
      const totalTrials = await prisma.subscription.count({
        where: {
          trialEndsAt: { not: null },
        },
      })

      // Trials that converted to paid
      const convertedTrials = await prisma.subscription.count({
        where: {
          trialEndsAt: { not: null },
          status: 'ACTIVE',
        },
      })

      // Trials that expired without converting
      const expiredTrials = await prisma.subscription.count({
        where: {
          trialEndsAt: { lt: new Date() },
          status: 'CANCELED',
        },
      })

      // Active trials
      const activeTrials = await prisma.subscription.count({
        where: {
          status: 'TRIALING',
          trialEndsAt: { gt: new Date() },
        },
      })

      const conversionRate = totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0

      return {
        totalTrials,
        convertedTrials,
        expiredTrials,
        activeTrials,
        conversionRate: Math.round(conversionRate * 100) / 100,
      }
    } catch (error) {
      console.error('Error getting trial conversion stats:', error)
      throw error
    }
  }
}