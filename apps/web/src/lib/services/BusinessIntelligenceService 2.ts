import { prisma } from '@/lib/prisma'
import { BusinessIntelligenceMetric, BusinessIntelligenceSummary } from '@/types'
import { FeatureUsageTracker } from './FeatureUsageTracker'
import { FunnelAnalyzer } from './FunnelAnalyzer'

interface RevenueMetrics {
  mrr: number
  arr: number
  churn_rate: number
  ltv: number
  cac: number
  payback_period: number
}

interface UserGrowthMetrics {
  new_users: number
  total_users: number
  growth_rate: number
  activation_rate: number
  retention_rate: number
}

interface ProductMetrics {
  feature_adoption: Record<string, number>
  user_engagement: number
  session_duration: number
  bounce_rate: number
  conversion_rate: number
}

interface OperationalMetrics {
  support_tickets: number
  avg_resolution_time: number
  customer_satisfaction: number
  platform_uptime: number
  api_performance: number
}

export class BusinessIntelligenceService {
  private featureTracker: FeatureUsageTracker
  private funnelAnalyzer: FunnelAnalyzer

  constructor() {
    this.featureTracker = new FeatureUsageTracker()
    this.funnelAnalyzer = new FunnelAnalyzer()
  }

  async generateDashboardSummary(): Promise<BusinessIntelligenceSummary> {
    const endDate = new Date()
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days

    const [revenue, userGrowth, product, operational] = await Promise.all([
      this.calculateRevenueMetrics(startDate, endDate),
      this.calculateUserGrowthMetrics(startDate, endDate),
      this.calculateProductMetrics(startDate, endDate),
      this.calculateOperationalMetrics(startDate, endDate)
    ])

    const overallScore = this.calculateOverallScore(revenue, userGrowth, product, operational)

    return {
      period: { start: startDate, end: endDate },
      overall_score: overallScore,
      revenue: {
        mrr: revenue.mrr,
        growth_rate: this.calculateGrowthRate(revenue.mrr, await this.getPreviousMRR(startDate)),
        churn_rate: revenue.churn_rate,
        ltv_cac_ratio: revenue.ltv / revenue.cac
      },
      users: {
        total_active: userGrowth.total_users,
        new_users: userGrowth.new_users,
        growth_rate: userGrowth.growth_rate,
        retention_rate: userGrowth.retention_rate
      },
      product: {
        feature_adoption_rate: Object.values(product.feature_adoption).reduce((a, b) => a + b, 0) / Object.keys(product.feature_adoption).length,
        engagement_score: product.user_engagement,
        conversion_rate: product.conversion_rate
      },
      operational: {
        uptime_percentage: operational.platform_uptime,
        support_satisfaction: operational.customer_satisfaction,
        avg_resolution_time: operational.avg_resolution_time
      }
    }
  }

  private async calculateRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetrics> {
    // Get subscription data
    const subscriptions = await prisma.userSubscription.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: true
      }
    })

    const activeSubscriptions = await prisma.userSubscription.count({
      where: {
        status: 'active',
        created_at: { lte: endDate }
      }
    })

    const totalRevenue = subscriptions.reduce((sum, sub) => {
      const plan = sub.plan_type
      const price = plan === 'professional' ? 99 : plan === 'enterprise' ? 299 : 0
      return sum + price
    }, 0)

    const mrr = totalRevenue
    const arr = mrr * 12

    // Calculate churn rate
    const startOfMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    const subsAtStartOfMonth = await prisma.userSubscription.count({
      where: {
        status: 'active',
        created_at: { lt: startOfMonth }
      }
    })

    const canceledThisMonth = await prisma.userSubscription.count({
      where: {
        status: 'canceled',
        updated_at: {
          gte: startOfMonth,
          lte: endDate
        }
      }
    })

    const churnRate = subsAtStartOfMonth > 0 ? (canceledThisMonth / subsAtStartOfMonth) * 100 : 0

    // Calculate LTV and CAC (simplified)
    const averageRevenue = totalRevenue / (subscriptions.length || 1)
    const averageLifespan = churnRate > 0 ? 1 / (churnRate / 100) : 24 // months
    const ltv = averageRevenue * averageLifespan

    // CAC calculation (marketing spend / new customers)
    const marketingSpend = 5000 // Mock value
    const newCustomers = subscriptions.length
    const cac = newCustomers > 0 ? marketingSpend / newCustomers : 0

    const paybackPeriod = cac > 0 ? cac / averageRevenue : 0

    return {
      mrr,
      arr,
      churn_rate: churnRate,
      ltv,
      cac,
      payback_period: paybackPeriod
    }
  }

  private async calculateUserGrowthMetrics(startDate: Date, endDate: Date): Promise<UserGrowthMetrics> {
    const newUsers = await prisma.user.count({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const totalUsers = await prisma.user.count({
      where: {
        created_at: { lte: endDate }
      }
    })

    const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()))
    const previousNewUsers = await prisma.user.count({
      where: {
        created_at: {
          gte: previousPeriodStart,
          lt: startDate
        }
      }
    })

    const growthRate = previousNewUsers > 0 ? ((newUsers - previousNewUsers) / previousNewUsers) * 100 : 0

    // Calculate activation rate (users who completed onboarding)
    const activatedUsers = await prisma.userEvent.count({
      where: {
        event_type: 'conversion',
        event_name: 'onboarding_completed',
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      distinct: ['userId']
    })

    const activationRate = newUsers > 0 ? (activatedUsers / newUsers) * 100 : 0

    // Calculate retention rate (users active in last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const activeUsers = await prisma.userEvent.count({
      where: {
        timestamp: { gte: weekAgo },
        userId: { not: null }
      },
      distinct: ['userId']
    })

    const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0

    return {
      new_users: newUsers,
      total_users: totalUsers,
      growth_rate: growthRate,
      activation_rate: activationRate,
      retention_rate: retentionRate
    }
  }

  private async calculateProductMetrics(startDate: Date, endDate: Date): Promise<ProductMetrics> {
    // Get feature adoption rates
    const featureUsage = await this.featureTracker.getFeatureUsage(startDate, endDate)
    const featureAdoption: Record<string, number> = {}
    
    featureUsage.forEach(usage => {
      featureAdoption[usage.feature] = usage.adoption_rate
    })

    // Calculate user engagement (sessions per user)
    const totalSessions = await prisma.userEvent.count({
      where: {
        event_type: 'session',
        event_name: 'session_start',
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const uniqueUsers = await prisma.userEvent.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      distinct: ['userId']
    })

    const userEngagement = uniqueUsers > 0 ? totalSessions / uniqueUsers : 0

    // Calculate average session duration
    const sessionEvents = await prisma.userEvent.findMany({
      where: {
        event_type: 'session',
        event_name: 'session_end',
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      select: { properties: true }
    })

    const totalDuration = sessionEvents.reduce((sum, event) => {
      const duration = (event.properties as any)?.duration || 0
      return sum + duration
    }, 0)

    const sessionDuration = sessionEvents.length > 0 ? totalDuration / sessionEvents.length : 0

    // Calculate bounce rate (single page sessions)
    const singlePageSessions = await prisma.userEvent.count({
      where: {
        event_type: 'session',
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        properties: {
          path: '/',
          contains: 'page_count'
        }
      }
    })

    const bounceRate = totalSessions > 0 ? (singlePageSessions / totalSessions) * 100 : 0

    // Calculate conversion rate
    const conversions = await prisma.userEvent.count({
      where: {
        event_type: 'conversion',
        event_name: 'subscription_created',
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const conversionRate = uniqueUsers > 0 ? (conversions / uniqueUsers) * 100 : 0

    return {
      feature_adoption: featureAdoption,
      user_engagement: userEngagement,
      session_duration: sessionDuration,
      bounce_rate: bounceRate,
      conversion_rate: conversionRate
    }
  }

  private async calculateOperationalMetrics(startDate: Date, endDate: Date): Promise<OperationalMetrics> {
    // Support tickets (mock data - would integrate with support system)
    const supportTickets = Math.floor(Math.random() * 50) + 10
    const avgResolutionTime = Math.floor(Math.random() * 24) + 4 // hours
    const customerSatisfaction = Math.random() * 2 + 3 // 3-5 stars

    // Platform uptime from performance alerts
    const totalMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60)
    const downtimeAlerts = await prisma.performanceAlert.count({
      where: {
        severity: 'critical',
        created_at: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const estimatedDowntime = downtimeAlerts * 15 // 15 minutes per critical alert
    const uptime = Math.max(0, ((totalMinutes - estimatedDowntime) / totalMinutes) * 100)

    // API performance from platform metrics
    const apiMetrics = await prisma.platformMetric.findMany({
      where: {
        type: 'api_performance',
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const avgApiPerformance = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, metric) => {
          const responseTime = (metric.value as any)?.average_response_time || 0
          return sum + (1000 / Math.max(responseTime, 100)) // Performance score
        }, 0) / apiMetrics.length
      : 50

    return {
      support_tickets: supportTickets,
      avg_resolution_time: avgResolutionTime,
      customer_satisfaction: customerSatisfaction,
      platform_uptime: uptime,
      api_performance: avgApiPerformance
    }
  }

  private calculateOverallScore(
    revenue: RevenueMetrics,
    userGrowth: UserGrowthMetrics,
    product: ProductMetrics,
    operational: OperationalMetrics
  ): number {
    // Weighted scoring system
    const revenueScore = Math.min(100, (revenue.mrr / 10000) * 100) * 0.3
    const growthScore = Math.min(100, Math.max(0, userGrowth.growth_rate + 50)) * 0.25
    const engagementScore = Math.min(100, product.user_engagement * 20) * 0.2
    const operationalScore = operational.platform_uptime * 0.25

    return Math.round(revenueScore + growthScore + engagementScore + operationalScore)
  }

  private calculateGrowthRate(current: number, previous: number): number {
    return previous > 0 ? ((current - previous) / previous) * 100 : 0
  }

  private async getPreviousMRR(currentStartDate: Date): Promise<number> {
    const previousStart = new Date(currentStartDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    const previousEnd = new Date(currentStartDate.getTime() - 1)

    const subscriptions = await prisma.userSubscription.findMany({
      where: {
        created_at: {
          gte: previousStart,
          lte: previousEnd
        }
      }
    })

    return subscriptions.reduce((sum, sub) => {
      const plan = sub.plan_type
      const price = plan === 'professional' ? 99 : plan === 'enterprise' ? 299 : 0
      return sum + price
    }, 0)
  }

  async generateRevenueReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    total_revenue: number
    mrr: number
    arr: number
    churn_rate: number
    ltv_cac_ratio: number
    revenue_by_plan: Record<string, number>
    revenue_trend: Array<{ date: Date; amount: number }>
  }> {
    const subscriptions = await prisma.userSubscription.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const revenueByPlan = subscriptions.reduce((acc, sub) => {
      const plan = sub.plan_type
      const price = plan === 'professional' ? 99 : plan === 'enterprise' ? 299 : 0
      acc[plan] = (acc[plan] || 0) + price
      return acc
    }, {} as Record<string, number>)

    const totalRevenue = Object.values(revenueByPlan).reduce((sum, amount) => sum + amount, 0)
    const metrics = await this.calculateRevenueMetrics(startDate, endDate)

    // Generate daily revenue trend
    const revenueTrend = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      const dayStart = new Date(current)
      const dayEnd = new Date(current)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const daySubscriptions = await prisma.userSubscription.count({
        where: {
          created_at: {
            gte: dayStart,
            lt: dayEnd
          }
        }
      })

      revenueTrend.push({
        date: new Date(dayStart),
        amount: daySubscriptions * 99 // Simplified calculation
      })

      current.setDate(current.getDate() + 1)
    }

    return {
      total_revenue: totalRevenue,
      mrr: metrics.mrr,
      arr: metrics.arr,
      churn_rate: metrics.churn_rate,
      ltv_cac_ratio: metrics.ltv / metrics.cac,
      revenue_by_plan: revenueByPlan,
      revenue_trend: revenueTrend
    }
  }

  async generateUserAnalysisReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    user_segments: Array<{
      segment: string
      count: number
      revenue: number
      engagement: number
    }>
    cohort_analysis: Array<{
      cohort: string
      retention_rates: Record<string, number>
    }>
    user_journey: Array<{
      step: string
      users: number
      conversion_rate: number
    }>
  }> {
    // User segmentation
    const userSegments = [
      {
        segment: 'Free Users',
        count: await prisma.user.count({
          where: {
            subscription: null,
            created_at: { gte: startDate, lte: endDate }
          }
        }),
        revenue: 0,
        engagement: 2.5
      },
      {
        segment: 'Professional Users',
        count: await prisma.userSubscription.count({
          where: {
            plan_type: 'professional',
            created_at: { gte: startDate, lte: endDate }
          }
        }),
        revenue: 99,
        engagement: 4.2
      },
      {
        segment: 'Enterprise Users',
        count: await prisma.userSubscription.count({
          where: {
            plan_type: 'enterprise',
            created_at: { gte: startDate, lte: endDate }
          }
        }),
        revenue: 299,
        engagement: 5.8
      }
    ]

    // Cohort analysis
    const cohortAnalysis = await this.funnelAnalyzer.getCohortAnalysis(startDate, endDate)
    const formattedCohorts = cohortAnalysis.map(cohort => ({
      cohort: cohort.cohort_date.toISOString().split('T')[0],
      retention_rates: cohort.retention_rates
    }))

    // User journey funnel
    const registrationFunnel = await this.funnelAnalyzer.analyzeFunnel('registration', startDate, endDate)
    const userJourney = registrationFunnel.steps.map(step => ({
      step: step.name,
      users: step.users,
      conversion_rate: step.conversion_rate
    }))

    return {
      user_segments: userSegments,
      cohort_analysis: formattedCohorts,
      user_journey: userJourney
    }
  }

  async storeBusinessMetric(
    type: string,
    value: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await prisma.businessIntelligenceMetric.create({
      data: {
        type,
        value,
        metadata: metadata || {},
        timestamp: new Date()
      }
    })
  }

  async getBusinessMetricsTrend(
    type: string,
    days: number = 30
  ): Promise<Array<{ date: Date; value: number }>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const metrics = await prisma.businessIntelligenceMetric.findMany({
      where: {
        type,
        timestamp: { gte: startDate }
      },
      orderBy: { timestamp: 'asc' }
    })

    return metrics.map(metric => ({
      date: metric.timestamp,
      value: metric.value
    }))
  }
}