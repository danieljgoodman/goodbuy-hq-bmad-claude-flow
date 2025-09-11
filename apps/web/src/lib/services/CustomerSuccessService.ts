import { PrismaClient } from '@prisma/client'
import { PremiumAccessService } from './PremiumAccessService'
import { NotificationService } from './NotificationService'
import { EmailService } from './EmailService'

const prisma = new PrismaClient()

export interface CustomerSuccessEvent {
  id: string
  userId: string
  eventType: 'onboarding_start' | 'milestone_check' | 'usage_alert' | 'success_story' | 'churn_risk'
  title: string
  description: string
  scheduledAt: Date
  completedAt?: Date
  outcome?: 'completed' | 'rescheduled' | 'skipped' | 'no_response'
  notes?: string
  followUpRequired: boolean
  priority: 'low' | 'medium' | 'high'
  automatedAction?: string
}

export interface OnboardingProgress {
  userId: string
  startedAt: Date
  completedAt?: Date
  currentStep: number
  totalSteps: number
  stepsCompleted: string[]
  stepsRemaining: string[]
  completionPercentage: number
  lastActivity: Date
}

export interface SuccessMetrics {
  userId: string
  subscriptionStartDate: Date
  daysSinceSubscription: number
  featureAdoptionRate: number
  engagementScore: number // 1-10
  healthScore: number // 1-100
  churnRisk: 'low' | 'medium' | 'high'
  lastLoginDate: Date
  totalEvaluations: number
  premiumFeaturesUsed: string[]
  supportTicketCount: number
  satisfactionScore?: number
}

export class CustomerSuccessService {
  /**
   * Initialize customer success journey for new premium user
   */
  static async initializePremiumOnboarding(userId: string): Promise<OnboardingProgress> {
    try {
      // Check if user is premium
      const accessCheck = await PremiumAccessService.checkAIFeatureAccess(userId)
      if (!accessCheck.hasAccess) {
        throw new Error('Customer success onboarding only available for premium users')
      }

      const onboardingSteps = [
        'welcome_premium',
        'profile_completion',
        'first_evaluation',
        'advanced_analytics_tour',
        'report_generation',
        'benchmarking_setup',
        'notification_preferences',
        'success_milestone'
      ]

      const progress: OnboardingProgress = {
        userId,
        startedAt: new Date(),
        currentStep: 1,
        totalSteps: onboardingSteps.length,
        stepsCompleted: [],
        stepsRemaining: onboardingSteps,
        completionPercentage: 0,
        lastActivity: new Date()
      }

      // Schedule initial onboarding events
      await this.scheduleOnboardingEvents(userId)

      // Send welcome notification
      await NotificationService.createNotification(userId, {
        type: 'milestone',
        title: '🎉 Welcome to Premium!',
        message: 'Your premium journey begins now. Let\'s get you set up for success with our advanced features.',
        actionUrl: '/onboarding-premium',
        actionLabel: 'Start Premium Tour',
        priority: 'high'
      })

      // Send welcome email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      })

      if (user?.email) {
        await EmailService.sendWelcomeEmail(user.email, 'there')
      }

      return progress
    } catch (error) {
      console.error('Error initializing premium onboarding:', error)
      throw error
    }
  }

  /**
   * Get onboarding progress for user
   */
  static async getOnboardingProgress(userId: string): Promise<OnboardingProgress | null> {
    try {
      // Mock onboarding progress - in production would query database
      return {
        userId,
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
        currentStep: 6,
        totalSteps: 8,
        stepsCompleted: [
          'welcome_premium',
          'profile_completion',
          'first_evaluation',
          'advanced_analytics_tour',
          'report_generation'
        ],
        stepsRemaining: [
          'benchmarking_setup',
          'notification_preferences',
          'success_milestone'
        ],
        completionPercentage: 62.5,
        lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      }
    } catch (error) {
      console.error('Error getting onboarding progress:', error)
      throw error
    }
  }

  /**
   * Update onboarding step completion
   */
  static async completeOnboardingStep(
    userId: string,
    stepName: string
  ): Promise<{ success: boolean; progress: OnboardingProgress }> {
    try {
      const progress = await this.getOnboardingProgress(userId)
      if (!progress) {
        throw new Error('Onboarding not found for user')
      }

      if (!progress.stepsCompleted.includes(stepName)) {
        progress.stepsCompleted.push(stepName)
        progress.stepsRemaining = progress.stepsRemaining.filter(s => s !== stepName)
        progress.completionPercentage = (progress.stepsCompleted.length / progress.totalSteps) * 100
        progress.currentStep = Math.min(progress.stepsCompleted.length + 1, progress.totalSteps)
        progress.lastActivity = new Date()

        // Check if onboarding is complete
        if (progress.completionPercentage === 100) {
          progress.completedAt = new Date()
          await this.celebrateOnboardingCompletion(userId)
        }

        // In production, would save to database
        console.log(`Onboarding step '${stepName}' completed for user ${userId}`)
      }

      return { success: true, progress }
    } catch (error) {
      console.error('Error completing onboarding step:', error)
      throw error
    }
  }

  /**
   * Schedule customer success touchpoints
   */
  static async scheduleSuccessTouchpoints(userId: string): Promise<CustomerSuccessEvent[]> {
    try {
      const now = new Date()
      const events: CustomerSuccessEvent[] = []

      // 30-day milestone check
      events.push({
        id: `cs_30day_${userId}`,
        userId,
        eventType: 'milestone_check',
        title: '30-Day Success Check-in',
        description: 'Review progress and ensure you\'re getting maximum value from premium features',
        scheduledAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30),
        followUpRequired: true,
        priority: 'medium'
      })

      // 60-day milestone check
      events.push({
        id: `cs_60day_${userId}`,
        userId,
        eventType: 'milestone_check',
        title: '60-Day Growth Assessment',
        description: 'Analyze your business improvements and plan next steps',
        scheduledAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 60),
        followUpRequired: true,
        priority: 'medium'
      })

      // 90-day success story
      events.push({
        id: `cs_90day_${userId}`,
        userId,
        eventType: 'success_story',
        title: '90-Day Success Review',
        description: 'Celebrate achievements and identify opportunities for continued growth',
        scheduledAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 90),
        followUpRequired: false,
        priority: 'low'
      })

      return events
    } catch (error) {
      console.error('Error scheduling success touchpoints:', error)
      throw error
    }
  }

  /**
   * Get customer success metrics
   */
  static async getSuccessMetrics(userId: string): Promise<SuccessMetrics> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          evaluations: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      const subscriptionStartDate = user.premiumSubscriptionDate || user.createdAt
      const daysSinceSubscription = Math.floor(
        (Date.now() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Mock metrics calculation - in production would analyze actual usage
      const metrics: SuccessMetrics = {
        userId,
        subscriptionStartDate,
        daysSinceSubscription,
        featureAdoptionRate: 0.78, // 78% of premium features used
        engagementScore: 8.2,
        healthScore: 85,
        churnRisk: 'low',
        lastLoginDate: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        totalEvaluations: user.evaluations.length,
        premiumFeaturesUsed: [
          'advanced_analytics',
          'professional_reports',
          'benchmarking',
          'ai_insights'
        ],
        supportTicketCount: 2,
        satisfactionScore: 4.6
      }

      return metrics
    } catch (error) {
      console.error('Error getting success metrics:', error)
      throw error
    }
  }

  /**
   * Detect and handle churn risk
   */
  static async detectChurnRisk(userId: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high'
    factors: string[]
    recommendations: string[]
    actionRequired: boolean
  }> {
    try {
      const metrics = await this.getSuccessMetrics(userId)
      const onboardingProgress = await this.getOnboardingProgress(userId)

      const riskFactors = []
      let riskLevel: 'low' | 'medium' | 'high' = 'low'

      // Check various risk indicators
      const daysSinceLogin = Math.floor(
        (Date.now() - metrics.lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceLogin > 7) {
        riskFactors.push('No login activity for over 7 days')
        riskLevel = 'medium'
      }

      if (daysSinceLogin > 14) {
        riskFactors.push('Extended absence - no activity for over 2 weeks')
        riskLevel = 'high'
      }

      if (metrics.featureAdoptionRate < 0.3) {
        riskFactors.push('Low feature adoption rate')
        riskLevel = riskLevel === 'high' ? 'high' : 'medium'
      }

      if (metrics.totalEvaluations < 2 && metrics.daysSinceSubscription > 14) {
        riskFactors.push('Limited platform usage - few evaluations completed')
        riskLevel = 'medium'
      }

      if (metrics.supportTicketCount > 3 && metrics.satisfactionScore && metrics.satisfactionScore < 3) {
        riskFactors.push('High support volume with low satisfaction')
        riskLevel = 'high'
      }

      if (onboardingProgress && onboardingProgress.completionPercentage < 50 && metrics.daysSinceSubscription > 7) {
        riskFactors.push('Incomplete onboarding after signup')
        riskLevel = riskLevel === 'high' ? 'high' : 'medium'
      }

      // Generate recommendations
      const recommendations = this.generateRetentionRecommendations(riskFactors, metrics)

      // Trigger proactive outreach for medium/high risk
      if (riskLevel !== 'low') {
        await this.scheduleRetentionOutreach(userId, riskLevel, riskFactors)
      }

      return {
        riskLevel,
        factors: riskFactors,
        recommendations,
        actionRequired: riskLevel !== 'low'
      }
    } catch (error) {
      console.error('Error detecting churn risk:', error)
      throw error
    }
  }

  /**
   * Get scheduled customer success events
   */
  static async getScheduledEvents(userId: string): Promise<CustomerSuccessEvent[]> {
    try {
      // Mock scheduled events - in production would query database
      return [
        {
          id: 'cs_weekly_check',
          userId,
          eventType: 'milestone_check',
          title: 'Weekly Progress Review',
          description: 'Check in on your business improvement progress',
          scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
          followUpRequired: false,
          priority: 'low'
        },
        {
          id: 'cs_feature_demo',
          userId,
          eventType: 'usage_alert',
          title: 'Advanced Features Demo',
          description: 'Personalized walkthrough of underutilized premium features',
          scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
          followUpRequired: true,
          priority: 'medium'
        }
      ]
    } catch (error) {
      console.error('Error getting scheduled events:', error)
      throw error
    }
  }

  /**
   * Private helper methods
   */

  private static async scheduleOnboardingEvents(userId: string): Promise<void> {
    const events = [
      { delay: 0, type: 'welcome' },
      { delay: 1, type: 'first_evaluation_reminder' },
      { delay: 3, type: 'feature_tour_reminder' },
      { delay: 7, type: 'progress_check' }
    ]

    for (const event of events) {
      setTimeout(async () => {
        // In production, would use proper job scheduling
        await this.sendOnboardingReminder(userId, event.type)
      }, event.delay * 24 * 60 * 60 * 1000) // Convert days to milliseconds
    }
  }

  private static async sendOnboardingReminder(userId: string, type: string): Promise<void> {
    const messages = {
      welcome: {
        title: 'Welcome to Premium! 🚀',
        message: 'Ready to unlock advanced business insights? Let\'s start with your first evaluation.',
        actionUrl: '/onboarding'
      },
      first_evaluation_reminder: {
        title: 'Complete Your First Evaluation',
        message: 'Get your baseline business health score to start tracking improvements.',
        actionUrl: '/onboarding'
      },
      feature_tour_reminder: {
        title: 'Discover Premium Features',
        message: 'Explore advanced analytics, reports, and benchmarking tools.',
        actionUrl: '/analytics'
      },
      progress_check: {
        title: 'How\'s Your Premium Experience?',
        message: 'We\'d love to help you get the most value from your subscription.',
        actionUrl: '/support'
      }
    }

    const messageConfig = messages[type as keyof typeof messages]
    if (messageConfig) {
      await NotificationService.createNotification(userId, {
        type: 'reminder',
        title: messageConfig.title,
        message: messageConfig.message,
        actionUrl: messageConfig.actionUrl,
        actionLabel: 'Take Action',
        priority: 'medium'
      })
    }
  }

  private static async celebrateOnboardingCompletion(userId: string): Promise<void> {
    await NotificationService.createNotification(userId, {
      type: 'milestone',
      title: '🎉 Onboarding Complete!',
      message: 'Congratulations! You\'ve completed premium onboarding. You\'re ready to maximize your business potential.',
      actionUrl: '/dashboard',
      actionLabel: 'View Dashboard',
      priority: 'medium'
    })
  }

  private static generateRetentionRecommendations(riskFactors: string[], metrics: SuccessMetrics): string[] {
    const recommendations = []

    if (riskFactors.some(f => f.includes('login'))) {
      recommendations.push('Send re-engagement email with recent insights')
      recommendations.push('Offer personalized demo or training session')
    }

    if (riskFactors.some(f => f.includes('feature adoption'))) {
      recommendations.push('Provide guided tour of underutilized features')
      recommendations.push('Share success stories from similar businesses')
    }

    if (riskFactors.some(f => f.includes('evaluations'))) {
      recommendations.push('Offer evaluation completion assistance')
      recommendations.push('Highlight benefits of regular evaluations')
    }

    if (riskFactors.some(f => f.includes('support'))) {
      recommendations.push('Schedule proactive customer success call')
      recommendations.push('Assign dedicated customer success manager')
    }

    if (riskFactors.some(f => f.includes('onboarding'))) {
      recommendations.push('Resume personalized onboarding journey')
      recommendations.push('Offer one-on-one onboarding session')
    }

    return recommendations.length > 0 ? recommendations : [
      'Continue monitoring engagement metrics',
      'Maintain regular check-in schedule'
    ]
  }

  private static async scheduleRetentionOutreach(
    userId: string,
    riskLevel: 'medium' | 'high',
    riskFactors: string[]
  ): Promise<void> {
    const priority = riskLevel === 'high' ? 'urgent' : 'high'
    const title = riskLevel === 'high' ? 
      'Urgent: Customer Success Intervention Needed' : 
      'Proactive Customer Success Outreach'

    const message = `Customer showing ${riskLevel} churn risk. Factors: ${riskFactors.slice(0, 2).join(', ')}`

    await NotificationService.createNotification(userId, {
      type: 'system',
      title,
      message,
      actionUrl: '/support',
      actionLabel: 'Get Support',
      priority
    })
  }
}