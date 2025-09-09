import { PrismaClient } from '@prisma/client'
import { SubscriptionService } from './SubscriptionService'
import { TrialService } from './TrialService'

const prisma = new PrismaClient()

export interface PremiumAccessCheck {
  hasAccess: boolean
  reason?: string
  subscriptionStatus?: string
  trialInfo?: {
    isOnTrial: boolean
    daysRemaining: number
    trialEndsAt: string | null
  }
  upgradeRequired?: {
    currentTier: string
    requiredTier: string
    benefits: string[]
    ctaText: string
  }
}

export class PremiumAccessService {
  /**
   * Check if user has premium access to a feature
   */
  static async checkPremiumAccess(
    userId: string,
    featureType: 'ai_guides' | 'progress_tracking' | 'pdf_reports' | 'analytics' | 'benchmarks' | 'priority_support',
    requiredTier: 'PREMIUM' | 'ENTERPRISE' = 'PREMIUM'
  ): Promise<PremiumAccessCheck> {
    try {
      // Get user info first to check for admin privileges
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, subscriptionTier: true }
      })

      // Admin bypass - grant full access to admin users
      if (user?.email === 'admin@goodbuyhq.com' || user?.email?.includes('admin')) {
        console.log(`👑 Admin access granted to ${user.email} for ${featureType}`)
        return {
          hasAccess: true,
          subscriptionStatus: 'ACTIVE',
          reason: 'Admin access override'
        }
      }

      // Development bypass - allow all access in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`🧪 Development mode: Allowing access to ${featureType} for user ${userId}`)
        return {
          hasAccess: true,
          subscriptionStatus: 'ACTIVE',
          reason: 'Development mode access'
        }
      }

      if (!user) {
        return {
          hasAccess: false,
          reason: 'User not found',
        }
      }

      // Check current subscription status
      const subscription = await SubscriptionService.getUserSubscription(userId)
      const trialInfo = await TrialService.getTrialInfo(userId)

      // If user has active subscription or trial at required level
      if (user.subscriptionTier === requiredTier || user.subscriptionTier === 'ENTERPRISE') {
        if (subscription && ['ACTIVE', 'TRIALING'].includes(subscription.status)) {
          return {
            hasAccess: true,
            subscriptionStatus: subscription.status,
            trialInfo: {
              isOnTrial: !!trialInfo.isOnTrial,
              daysRemaining: trialInfo.daysRemaining,
              trialEndsAt: trialInfo.trialEndsAt?.toISOString() || null,
            },
          }
        }
      }

      // If subscription is past due, still allow access for grace period
      if (subscription?.status === 'PAST_DUE') {
        const gracePeriodDays = 7
        const currentPeriodEnd = new Date(subscription.currentPeriodEnd)
        const gracePeriodEnd = new Date(currentPeriodEnd)
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays)

        if (new Date() <= gracePeriodEnd) {
          return {
            hasAccess: true,
            subscriptionStatus: 'PAST_DUE',
            reason: 'Grace period access',
          }
        }
      }

      // User doesn't have access - provide upgrade information
      const upgradeInfo = this.getUpgradeInfo(user.subscriptionTier, requiredTier, featureType)

      return {
        hasAccess: false,
        reason: 'Subscription required',
        subscriptionStatus: subscription?.status || 'NONE',
        upgradeRequired: upgradeInfo,
        trialInfo: {
          isOnTrial: !!trialInfo.isOnTrial,
          daysRemaining: trialInfo.daysRemaining,
          trialEndsAt: trialInfo.trialEndsAt?.toISOString() || null,
        },
      }
    } catch (error) {
      console.error('Error checking premium access:', error)
      return {
        hasAccess: false,
        reason: 'Error checking access',
      }
    }
  }

  /**
   * Check if user can access AI-powered features
   */
  static async checkAIFeatureAccess(userId: string): Promise<PremiumAccessCheck> {
    return this.checkPremiumAccess(userId, 'ai_guides', 'PREMIUM')
  }

  /**
   * Check if user can access progress tracking
   */
  static async checkProgressTrackingAccess(userId: string): Promise<PremiumAccessCheck> {
    return this.checkPremiumAccess(userId, 'progress_tracking', 'PREMIUM')
  }

  /**
   * Check if user can access PDF reports
   */
  static async checkPDFReportAccess(userId: string): Promise<PremiumAccessCheck> {
    return this.checkPremiumAccess(userId, 'pdf_reports', 'PREMIUM')
  }

  /**
   * Check if user can access advanced analytics
   */
  static async checkAdvancedAnalyticsAccess(userId: string): Promise<PremiumAccessCheck> {
    return this.checkPremiumAccess(userId, 'analytics', 'PREMIUM')
  }

  /**
   * Check if user can access benchmarking
   */
  static async checkBenchmarkingAccess(userId: string): Promise<PremiumAccessCheck> {
    return this.checkPremiumAccess(userId, 'benchmarks', 'ENTERPRISE')
  }

  /**
   * Check if user has priority support access
   */
  static async checkPrioritySupportAccess(userId: string): Promise<PremiumAccessCheck> {
    return this.checkPremiumAccess(userId, 'priority_support', 'PREMIUM')
  }

  /**
   * Get all premium features and their access status for a user
   */
  static async getUserPremiumStatus(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          subscriptionTier: true,
          email: true,
          businessName: true,
        },
      })

      if (!user) {
        throw new Error('User not found')
      }

      const subscription = await SubscriptionService.getUserSubscription(userId)
      const trialInfo = await TrialService.getTrialInfo(userId)

      const featureAccess = {
        aiGuides: await this.checkAIFeatureAccess(userId),
        progressTracking: await this.checkProgressTrackingAccess(userId),
        pdfReports: await this.checkPDFReportAccess(userId),
        analytics: await this.checkAdvancedAnalyticsAccess(userId),
        benchmarks: await this.checkBenchmarkingAccess(userId),
        prioritySupport: await this.checkPrioritySupportAccess(userId),
      }

      return {
        user: {
          email: user.email,
          businessName: user.businessName,
          currentTier: user.subscriptionTier,
        },
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          tier: subscription.tier,
          billingCycle: subscription.billingCycle,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          trialEndsAt: subscription.trialEndsAt,
        } : null,
        trial: trialInfo,
        features: featureAccess,
      }
    } catch (error) {
      console.error('Error getting user premium status:', error)
      throw error
    }
  }

  /**
   * Update user's subscription tier based on Stripe subscription
   */
  static async updateUserTierFromSubscription(userId: string) {
    try {
      const subscription = await SubscriptionService.getUserSubscription(userId)
      
      if (subscription && ['ACTIVE', 'TRIALING'].includes(subscription.status)) {
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionTier: subscription.tier },
        })
      } else {
        // No active subscription, revert to free
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionTier: 'FREE' },
        })
      }
    } catch (error) {
      console.error('Error updating user tier from subscription:', error)
      throw error
    }
  }

  /**
   * Get usage statistics for premium features
   */
  static async getPremiumUsageStats(userId: string) {
    try {
      // This would track actual usage of premium features
      // For now, return placeholder data
      return {
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usage: {
          aiGuidesGenerated: 5,
          pdfReportsDownloaded: 3,
          advancedAnalyticsViewed: 12,
          benchmarkComparisons: 2,
          prioritySupportTickets: 1,
        },
        limits: {
          aiGuidesGenerated: 50,
          pdfReportsDownloaded: 20,
          advancedAnalyticsViewed: 100,
          benchmarkComparisons: 10,
          prioritySupportTickets: 5,
        },
      }
    } catch (error) {
      console.error('Error getting premium usage stats:', error)
      throw error
    }
  }

  private static getUpgradeInfo(currentTier: string, requiredTier: string, featureType: string) {
    const featureBenefits = {
      ai_guides: [
        'AI-powered implementation guides',
        'Step-by-step instructions with templates',
        'Industry-specific recommendations',
        'Progress tracking and milestones',
      ],
      progress_tracking: [
        'Track implementation progress',
        'Before/after value calculations',
        'ROI analysis and reporting',
        'Timeline visualization',
      ],
      pdf_reports: [
        'Professional PDF reports',
        'Executive summary generation',
        'High-quality charts and graphs',
        'Customizable report sections',
      ],
      analytics: [
        'Advanced trend analysis',
        'Predictive modeling',
        'Performance benchmarking',
        'Custom analytics dashboards',
      ],
      benchmarks: [
        'Industry benchmark comparisons',
        'Competitive positioning analysis',
        'Market trend integration',
        'Peer performance insights',
      ],
      priority_support: [
        'Faster response times',
        'Dedicated support queue',
        'Expert consultation access',
        'Implementation guidance',
      ],
    }

    const ctaTexts = {
      FREE: 'Start Free Trial',
      PREMIUM: requiredTier === 'ENTERPRISE' ? 'Upgrade to Enterprise' : 'Upgrade to Premium',
      ENTERPRISE: 'Contact Sales',
    }

    return {
      currentTier,
      requiredTier,
      benefits: featureBenefits[featureType as keyof typeof featureBenefits] || [],
      ctaText: ctaTexts[currentTier as keyof typeof ctaTexts] || 'Upgrade Plan',
    }
  }
}