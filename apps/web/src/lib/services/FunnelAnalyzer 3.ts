import { prisma } from '@/lib/prisma'
import { FunnelAnalysis, FunnelStep } from '@/types'

interface FunnelDefinition {
  name: string
  steps: {
    name: string
    event_type: string
    event_name: string
    conditions?: Record<string, any>
  }[]
}

export class FunnelAnalyzer {
  private funnels: Map<string, FunnelDefinition> = new Map()

  constructor() {
    this.initializeDefaultFunnels()
  }

  private initializeDefaultFunnels() {
    // Registration funnel
    this.funnels.set('registration', {
      name: 'User Registration',
      steps: [
        {
          name: 'Landing Page Visit',
          event_type: 'navigation',
          event_name: 'page_view',
          conditions: { path: '/' }
        },
        {
          name: 'Sign Up Click',
          event_type: 'interaction',
          event_name: 'click',
          conditions: { element: 'signup_button' }
        },
        {
          name: 'Registration Form',
          event_type: 'navigation',
          event_name: 'page_view',
          conditions: { path: '/sign-up' }
        },
        {
          name: 'Form Submission',
          event_type: 'interaction',
          event_name: 'form_submit',
          conditions: { form_name: 'registration' }
        },
        {
          name: 'Registration Complete',
          event_type: 'conversion',
          event_name: 'user_registered'
        }
      ]
    })

    // Business evaluation funnel
    this.funnels.set('evaluation', {
      name: 'Business Evaluation',
      steps: [
        {
          name: 'Dashboard Visit',
          event_type: 'navigation',
          event_name: 'page_view',
          conditions: { path: '/dashboard' }
        },
        {
          name: 'Start Evaluation',
          event_type: 'interaction',
          event_name: 'click',
          conditions: { element: 'start_evaluation' }
        },
        {
          name: 'Data Input',
          event_type: 'feature_usage',
          event_name: 'evaluation_data_input'
        },
        {
          name: 'Submit for Analysis',
          event_type: 'interaction',
          event_name: 'form_submit',
          conditions: { form_name: 'business_evaluation' }
        },
        {
          name: 'View Results',
          event_type: 'navigation',
          event_name: 'page_view',
          conditions: { path: '/evaluation/results' }
        }
      ]
    })

    // Subscription conversion funnel
    this.funnels.set('subscription', {
      name: 'Subscription Conversion',
      steps: [
        {
          name: 'Pricing Page Visit',
          event_type: 'navigation',
          event_name: 'page_view',
          conditions: { path: '/pricing' }
        },
        {
          name: 'Plan Selection',
          event_type: 'interaction',
          event_name: 'click',
          conditions: { element: 'select_plan' }
        },
        {
          name: 'Checkout Start',
          event_type: 'navigation',
          event_name: 'page_view',
          conditions: { path: '/checkout' }
        },
        {
          name: 'Payment Submit',
          event_type: 'interaction',
          event_name: 'form_submit',
          conditions: { form_name: 'payment' }
        },
        {
          name: 'Subscription Success',
          event_type: 'conversion',
          event_name: 'subscription_created'
        }
      ]
    })
  }

  async analyzeFunnel(
    funnelName: string,
    startDate: Date,
    endDate: Date,
    segmentBy?: string
  ): Promise<FunnelAnalysis> {
    const funnel = this.funnels.get(funnelName)
    if (!funnel) {
      throw new Error(`Funnel ${funnelName} not found`)
    }

    const steps: FunnelStep[] = []
    let previousStepUsers: string[] = []
    let totalUsers = 0

    for (let i = 0; i < funnel.steps.length; i++) {
      const step = funnel.steps[i]
      
      // Build where clause for this step
      const whereClause: any = {
        eventType: step.event_type,
        eventName: step.event_name,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }

      // Add conditions if specified
      if (step.conditions) {
        for (const [key, value] of Object.entries(step.conditions)) {
          if (key === 'path') {
            whereClause.properties = {
              path: { equals: value }
            }
          } else {
            whereClause.properties = {
              ...whereClause.properties,
              [key]: { equals: value }
            }
          }
        }
      }

      // For steps after the first, filter by users who completed previous steps
      if (i > 0 && previousStepUsers.length > 0) {
        whereClause.userId = {
          in: previousStepUsers
        }
      }

      // Get unique users who completed this step
      const stepUsers = await prisma.userEvent.findMany({
        where: whereClause,
        select: { userId: true },
        distinct: ['userId']
      })

      const stepUserIds = stepUsers
        .map(event => event.userId)
        .filter((id): id is string => id !== null)

      const stepUserCount = stepUserIds.length

      if (i === 0) {
        totalUsers = stepUserCount
      }

      const conversionRate = previousStepUsers.length > 0 
        ? (stepUserCount / previousStepUsers.length) * 100
        : 100

      const dropOff = previousStepUsers.length > 0 
        ? previousStepUsers.length - stepUserCount
        : 0

      steps.push({
        name: step.name,
        users: stepUserCount,
        conversion_rate: conversionRate,
        drop_off: dropOff
      })

      previousStepUsers = stepUserIds
    }

    const overallConversionRate = totalUsers > 0 
      ? (steps[steps.length - 1]?.users || 0) / totalUsers * 100
      : 0

    return {
      funnel_name: funnel.name,
      steps,
      overall_conversion_rate: overallConversionRate,
      total_users: totalUsers
    }
  }

  async getAbandonmentAnalysis(
    funnelName: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    step_name: string
    abandonment_rate: number
    common_exit_pages: string[]
    time_to_abandonment: number
  }[]> {
    const funnel = this.funnels.get(funnelName)
    if (!funnel) {
      throw new Error(`Funnel ${funnelName} not found`)
    }

    const abandonmentAnalysis = []

    for (let i = 0; i < funnel.steps.length - 1; i++) {
      const currentStep = funnel.steps[i]
      const nextStep = funnel.steps[i + 1]

      // Get users who completed current step
      const currentStepUsers = await this.getUsersForStep(currentStep, startDate, endDate)
      
      // Get users who completed next step
      const nextStepUsers = await this.getUsersForStep(nextStep, startDate, endDate)
      
      // Find users who abandoned between these steps
      const abandonedUsers = currentStepUsers.filter(userId => 
        !nextStepUsers.includes(userId)
      )

      const abandonmentRate = currentStepUsers.length > 0 
        ? (abandonedUsers.length / currentStepUsers.length) * 100
        : 0

      // Get common exit pages for abandoned users
      const exitPages = await prisma.userEvent.findMany({
        where: {
          userId: { in: abandonedUsers },
          eventType: 'navigation',
          eventName: 'page_view',
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          properties: true,
          userId: true,
          timestamp: true
        },
        orderBy: { timestamp: 'desc' }
      })

      // Group by last page visited
      const exitPageCounts = new Map<string, number>()
      const userLastPages = new Map<string, string>()

      for (const event of exitPages) {
        const userId = event.userId
        if (userId && !userLastPages.has(userId)) {
          const path = (event.properties as any)?.path || 'unknown'
          userLastPages.set(userId, path)
          exitPageCounts.set(path, (exitPageCounts.get(path) || 0) + 1)
        }
      }

      const commonExitPages = Array.from(exitPageCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([page]) => page)

      // Calculate average time to abandonment
      // This is a simplified calculation - in practice you'd want more sophisticated timing analysis
      const avgTimeToAbandonment = 300 // 5 minutes default

      abandonmentAnalysis.push({
        step_name: currentStep.name,
        abandonment_rate: abandonmentRate,
        common_exit_pages: commonExitPages,
        time_to_abandonment: avgTimeToAbandonment
      })
    }

    return abandonmentAnalysis
  }

  private async getUsersForStep(
    step: FunnelDefinition['steps'][0],
    startDate: Date,
    endDate: Date
  ): Promise<string[]> {
    const whereClause: any = {
      eventType: step.event_type,
      eventName: step.event_name,
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    }

    if (step.conditions) {
      for (const [key, value] of Object.entries(step.conditions)) {
        if (key === 'path') {
          whereClause.properties = {
            path: { equals: value }
          }
        } else {
          whereClause.properties = {
            ...whereClause.properties,
            [key]: { equals: value }
          }
        }
      }
    }

    const users = await prisma.userEvent.findMany({
      where: whereClause,
      select: { userId: true },
      distinct: ['userId']
    })

    return users
      .map(event => event.userId)
      .filter((id): id is string => id !== null)
  }

  async getCohortAnalysis(
    startDate: Date,
    endDate: Date,
    cohortBy: 'registration' | 'subscription' = 'registration'
  ): Promise<{
    cohort_date: Date
    cohort_size: number
    retention_rates: Record<string, number>
  }[]> {
    // This is a simplified cohort analysis
    // In practice, you'd want more sophisticated cohort tracking
    
    const cohorts = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      const cohortStart = new Date(current)
      const cohortEnd = new Date(current)
      cohortEnd.setMonth(cohortEnd.getMonth() + 1)
      
      // Get users who joined this cohort
      const cohortUsers = await prisma.userEvent.findMany({
        where: {
          eventType: 'conversion',
          eventName: cohortBy === 'registration' ? 'user_registered' : 'subscription_created',
          timestamp: {
            gte: cohortStart,
            lt: cohortEnd
          }
        },
        select: { userId: true },
        distinct: ['userId']
      })

      const cohortSize = cohortUsers.length
      const retentionRates: Record<string, number> = {}

      if (cohortSize > 0) {
        const cohortUserIds = cohortUsers
          .map(event => event.userId)
          .filter((id): id is string => id !== null)

        // Calculate retention for different periods
        for (let period = 1; period <= 12; period++) {
          const periodStart = new Date(cohortEnd)
          periodStart.setMonth(periodStart.getMonth() + period - 1)
          const periodEnd = new Date(periodStart)
          periodEnd.setMonth(periodEnd.getMonth() + 1)

          // Count active users in this period
          const activeUsersResult = await prisma.userEvent.findMany({
            where: {
              userId: { in: cohortUserIds },
              timestamp: {
                gte: periodStart,
                lt: periodEnd
              }
            },
            select: { userId: true },
            distinct: ['userId']
          })
          const activeUsers = activeUsersResult.length

          retentionRates[`month_${period}`] = (activeUsers / cohortSize) * 100
        }
      }

      cohorts.push({
        cohort_date: cohortStart,
        cohort_size: cohortSize,
        retention_rates: retentionRates
      })

      current.setMonth(current.getMonth() + 1)
    }

    return cohorts
  }

  addCustomFunnel(name: string, definition: FunnelDefinition): void {
    this.funnels.set(name, definition)
  }

  getFunnelDefinition(name: string): FunnelDefinition | undefined {
    return this.funnels.get(name)
  }

  getAllFunnelNames(): string[] {
    return Array.from(this.funnels.keys())
  }
}