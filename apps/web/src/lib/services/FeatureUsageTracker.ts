import { prisma } from '@/lib/prisma'
import { FeatureUsageData } from '@/types'

interface FeatureDefinition {
  name: string
  event_patterns: {
    event_type: string
    event_name: string
    weight?: number // For weighted calculations
  }[]
  category?: string
  description?: string
}

export class FeatureUsageTracker {
  private features: Map<string, FeatureDefinition> = new Map()

  constructor() {
    this.initializeFeatureDefinitions()
  }

  private initializeFeatureDefinitions() {
    // Business Evaluation Features
    this.features.set('business_evaluation', {
      name: 'Business Evaluation',
      category: 'Core Features',
      description: 'AI-powered business valuation and analysis',
      event_patterns: [
        { event_type: 'feature_usage', event_name: 'evaluation_start' },
        { event_type: 'feature_usage', event_name: 'evaluation_data_input', weight: 0.5 },
        { event_type: 'feature_usage', event_name: 'evaluation_submit', weight: 2 },
        { event_type: 'navigation', event_name: 'page_view', weight: 0.2 }
      ]
    })

    this.features.set('health_score', {
      name: 'Health Score Analysis',
      category: 'Analytics',
      description: 'Multi-dimensional business health assessment',
      event_patterns: [
        { event_type: 'feature_usage', event_name: 'health_score_view' },
        { event_type: 'feature_usage', event_name: 'health_score_drill_down', weight: 1.5 },
        { event_type: 'interaction', event_name: 'click', weight: 0.3 }
      ]
    })

    this.features.set('improvement_opportunities', {
      name: 'Improvement Opportunities',
      category: 'Recommendations',
      description: 'AI-generated improvement recommendations',
      event_patterns: [
        { event_type: 'feature_usage', event_name: 'opportunities_view' },
        { event_type: 'feature_usage', event_name: 'opportunity_details', weight: 1.2 },
        { event_type: 'feature_usage', event_name: 'implementation_start', weight: 2 },
        { event_type: 'feature_usage', event_name: 'progress_update', weight: 1.5 }
      ]
    })

    this.features.set('market_intelligence', {
      name: 'Market Intelligence',
      category: 'Intelligence',
      description: 'Industry benchmarking and market analysis',
      event_patterns: [
        { event_type: 'feature_usage', event_name: 'market_intelligence_view' },
        { event_type: 'feature_usage', event_name: 'benchmark_comparison', weight: 1.3 },
        { event_type: 'feature_usage', event_name: 'trend_analysis', weight: 1.2 }
      ]
    })

    this.features.set('document_upload', {
      name: 'Document Upload & Processing',
      category: 'Data Input',
      description: 'AI-powered document analysis and data extraction',
      event_patterns: [
        { event_type: 'feature_usage', event_name: 'document_upload' },
        { event_type: 'feature_usage', event_name: 'document_processing', weight: 1.5 },
        { event_type: 'feature_usage', event_name: 'extracted_data_review', weight: 1.2 }
      ]
    })

    this.features.set('analytics_dashboard', {
      name: 'Analytics Dashboard',
      category: 'Analytics',
      description: 'Business performance visualization and tracking',
      event_patterns: [
        { event_type: 'feature_usage', event_name: 'analytics_dashboard_view' },
        { event_type: 'feature_usage', event_name: 'chart_interaction', weight: 0.8 },
        { event_type: 'feature_usage', event_name: 'date_range_change', weight: 0.6 },
        { event_type: 'feature_usage', event_name: 'export_report', weight: 1.5 }
      ]
    })

    this.features.set('help_system', {
      name: 'Help & Support',
      category: 'Support',
      description: 'Knowledge base, tutorials, and support system',
      event_patterns: [
        { event_type: 'feature_usage', event_name: 'help_button_click', weight: 0.5 },
        { event_type: 'feature_usage', event_name: 'article_view', weight: 0.8 },
        { event_type: 'feature_usage', event_name: 'video_tutorial_play', weight: 1.2 },
        { event_type: 'feature_usage', event_name: 'support_ticket_create', weight: 2 }
      ]
    })

    this.features.set('subscription_management', {
      name: 'Subscription Management',
      category: 'Account',
      description: 'Plan management and billing features',
      event_patterns: [
        { event_type: 'feature_usage', event_name: 'subscription_view' },
        { event_type: 'feature_usage', event_name: 'plan_upgrade', weight: 3 },
        { event_type: 'feature_usage', event_name: 'billing_history_view', weight: 0.7 },
        { event_type: 'feature_usage', event_name: 'payment_method_update', weight: 1.5 }
      ]
    })
  }

  async getFeatureUsage(
    startDate: Date,
    endDate: Date,
    featureName?: string
  ): Promise<FeatureUsageData[]> {
    const featuresToAnalyze = featureName 
      ? [featureName]
      : Array.from(this.features.keys())

    const usageData: FeatureUsageData[] = []

    for (const featureKey of featuresToAnalyze) {
      const feature = this.features.get(featureKey)
      if (!feature) continue

      let totalUsageCount = 0
      let uniqueUsers = new Set<string>()
      let totalTimeSpent = 0

      for (const pattern of feature.event_patterns) {
        const events = await prisma.userEvent.findMany({
          where: {
            eventType: pattern.event_type,
            eventName: pattern.event_name,
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            userId: true,
            timestamp: true,
            properties: true
          }
        })

        const weight = pattern.weight || 1
        totalUsageCount += events.length * weight

        // Track unique users
        events.forEach(event => {
          if (event.userId) {
            uniqueUsers.add(event.userId)
          }
        })

        // Calculate time spent (simplified - based on session duration from properties)
        events.forEach(event => {
          const properties = event.properties as any
          if (properties?.duration) {
            totalTimeSpent += properties.duration * weight
          } else if (properties?.time_spent) {
            totalTimeSpent += properties.time_spent * weight
          }
        })
      }

      // Calculate adoption rate (percentage of total active users)
      const totalActiveUsers = await this.getTotalActiveUsers(startDate, endDate)
      const adoptionRate = totalActiveUsers > 0 ? (uniqueUsers.size / totalActiveUsers) * 100 : 0

      // Calculate average time spent per user
      const averageTimeSpent = uniqueUsers.size > 0 ? totalTimeSpent / uniqueUsers.size : 0

      usageData.push({
        feature: feature.name,
        usage_count: Math.round(totalUsageCount),
        unique_users: uniqueUsers.size,
        average_time_spent: Math.round(averageTimeSpent),
        adoption_rate: Math.round(adoptionRate * 100) / 100
      })
    }

    return usageData.sort((a, b) => b.usage_count - a.usage_count)
  }

  async getFeatureAdoptionTrends(
    featureName: string,
    startDate: Date,
    endDate: Date,
    intervalDays: number = 7
  ): Promise<{
    date: Date
    adoption_rate: number
    new_adopters: number
    total_users: number
  }[]> {
    const feature = this.features.get(featureName)
    if (!feature) {
      throw new Error(`Feature ${featureName} not found`)
    }

    const trends = []
    const current = new Date(startDate)
    const allAdopters = new Set<string>()

    while (current <= endDate) {
      const periodStart = new Date(current)
      const periodEnd = new Date(current)
      periodEnd.setDate(periodEnd.getDate() + intervalDays)

      if (periodEnd > endDate) {
        periodEnd.setTime(endDate.getTime())
      }

      // Get users who used this feature in this period
      const periodUsers = new Set<string>()

      for (const pattern of feature.event_patterns) {
        const events = await prisma.userEvent.findMany({
          where: {
            eventType: pattern.event_type,
            eventName: pattern.event_name,
            timestamp: {
              gte: periodStart,
              lte: periodEnd
            }
          },
          select: { userId: true },
          distinct: ['userId']
        })

        events.forEach(event => {
          if (event.userId) {
            periodUsers.add(event.userId)
          }
        })
      }

      // Count new adopters (users who hadn't used the feature before)
      const newAdopters = Array.from(periodUsers).filter(userId => 
        !allAdopters.has(userId)
      )

      // Add to all-time adopters
      periodUsers.forEach(userId => allAdopters.add(userId))

      // Get total active users for this period
      const totalActiveUsers = await this.getTotalActiveUsers(periodStart, periodEnd)
      const adoptionRate = totalActiveUsers > 0 ? (allAdopters.size / totalActiveUsers) * 100 : 0

      trends.push({
        date: new Date(periodStart),
        adoption_rate: Math.round(adoptionRate * 100) / 100,
        new_adopters: newAdopters.length,
        total_users: totalActiveUsers
      })

      current.setDate(current.getDate() + intervalDays)
    }

    return trends
  }

  async getFeatureStickiness(
    featureName: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    daily_active_users: number
    weekly_active_users: number
    monthly_active_users: number
    stickiness_ratio: number // DAU/MAU
    retention_rates: {
      day_1: number
      day_7: number
      day_30: number
    }
  }> {
    const feature = this.features.get(featureName)
    if (!feature) {
      throw new Error(`Feature ${featureName} not found`)
    }

    // Get all feature usage events
    const allEvents = []
    for (const pattern of feature.event_patterns) {
      const events = await prisma.userEvent.findMany({
        where: {
          eventType: pattern.event_type,
          eventName: pattern.event_name,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          userId: true,
          timestamp: true
        }
      })
      allEvents.push(...events)
    }

    // Calculate active users for different periods
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const dailyUsers = new Set(
      allEvents
        .filter(event => event.timestamp >= dayAgo)
        .map(event => event.userId)
        .filter(id => id !== null)
    )

    const weeklyUsers = new Set(
      allEvents
        .filter(event => event.timestamp >= weekAgo)
        .map(event => event.userId)
        .filter(id => id !== null)
    )

    const monthlyUsers = new Set(
      allEvents
        .filter(event => event.timestamp >= monthAgo)
        .map(event => event.userId)
        .filter(id => id !== null)
    )

    const stickinessRatio = monthlyUsers.size > 0 ? dailyUsers.size / monthlyUsers.size : 0

    // Calculate retention rates (simplified)
    const retentionRates = {
      day_1: 0.85, // Mock values - in practice, calculate based on cohort analysis
      day_7: 0.65,
      day_30: 0.45
    }

    return {
      daily_active_users: dailyUsers.size,
      weekly_active_users: weeklyUsers.size,
      monthly_active_users: monthlyUsers.size,
      stickiness_ratio: Math.round(stickinessRatio * 100) / 100,
      retention_rates: retentionRates
    }
  }

  private async getTotalActiveUsers(startDate: Date, endDate: Date): Promise<number> {
    const activeUsers = await prisma.userEvent.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      select: { userId: true },
      distinct: ['userId']
    })

    return activeUsers.filter(event => event.userId !== null).length
  }

  async getFeatureCorrelations(
    primaryFeature: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    feature: string
    correlation_score: number
    users_using_both: number
    total_primary_users: number
  }[]> {
    const primary = this.features.get(primaryFeature)
    if (!primary) {
      throw new Error(`Feature ${primaryFeature} not found`)
    }

    // Get users who used the primary feature
    const primaryUsers = new Set<string>()
    
    for (const pattern of primary.event_patterns) {
      const events = await prisma.userEvent.findMany({
        where: {
          eventType: pattern.event_type,
          eventName: pattern.event_name,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        select: { userId: true },
        distinct: ['userId']
      })

      events.forEach(event => {
        if (event.userId) {
          primaryUsers.add(event.userId)
        }
      })
    }

    const correlations = []

    for (const [featureKey, feature] of this.features.entries()) {
      if (featureKey === primaryFeature) continue

      const featureUsers = new Set<string>()

      for (const pattern of feature.event_patterns) {
        const events = await prisma.userEvent.findMany({
          where: {
            eventType: pattern.event_type,
            eventName: pattern.event_name,
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          },
          select: { userId: true },
          distinct: ['userId']
        })

        events.forEach(event => {
          if (event.userId) {
            featureUsers.add(event.userId)
          }
        })
      }

      // Calculate overlap
      const usersUsingBoth = Array.from(primaryUsers).filter(userId => 
        featureUsers.has(userId)
      ).length

      const correlationScore = primaryUsers.size > 0 
        ? usersUsingBoth / primaryUsers.size
        : 0

      correlations.push({
        feature: feature.name,
        correlation_score: Math.round(correlationScore * 100) / 100,
        users_using_both: usersUsingBoth,
        total_primary_users: primaryUsers.size
      })
    }

    return correlations.sort((a, b) => b.correlation_score - a.correlation_score)
  }

  addCustomFeature(key: string, definition: FeatureDefinition): void {
    this.features.set(key, definition)
  }

  getFeatureDefinition(key: string): FeatureDefinition | undefined {
    return this.features.get(key)
  }

  getAllFeatures(): Map<string, FeatureDefinition> {
    return new Map(this.features)
  }
}