import { PrismaClient } from '@prisma/client'
import { AnalyticsDataRepository } from '../repositories/AnalyticsDataRepository'
import { BusinessMetricsRepository } from '../repositories/BusinessMetricsRepository'
import { WidgetConfigurationRepository } from '../repositories/WidgetConfigurationRepository'
import { AnalyticsData, BusinessMetrics, WidgetConfiguration, ComparisonAnalysis, ExportableReport } from '@/types'

export interface TimeSeriesRequest {
  userId: string
  metrics: string[]
  timeRange: {
    start: Date
    end: Date
  }
  aggregation?: 'hour' | 'day' | 'week' | 'month'
}

export interface PerformanceIndicatorData {
  name: string
  current: number
  target?: number
  benchmark?: number
  trend: 'up' | 'down' | 'stable'
  change_percentage?: number
  status: 'good' | 'warning' | 'critical'
}

export interface ComparisonRequest {
  userId: string
  type: 'before_after' | 'period_over_period' | 'benchmark' | 'scenario'
  baseline: {
    period: Date
    label: string
  }
  comparison: {
    period: Date
    label: string
  }
  metrics: string[]
}

export class VisualizationService {
  private prisma: PrismaClient
  private analyticsRepo: AnalyticsDataRepository
  private metricsRepo: BusinessMetricsRepository
  private widgetRepo: WidgetConfigurationRepository
  private static cache = new Map<string, { data: any; expiry: number }>()

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.analyticsRepo = new AnalyticsDataRepository(prisma)
    this.metricsRepo = new BusinessMetricsRepository(prisma)
    this.widgetRepo = new WidgetConfigurationRepository(prisma)
  }

  async generateTimeSeriesData(request: TimeSeriesRequest): Promise<Record<string, AnalyticsData[]>> {
    // Input validation
    if (!request.userId || !request.metrics || request.metrics.length === 0) {
      throw new Error('Invalid request: userId and metrics are required')
    }

    // Check cache first
    const cacheKey = `timeseries-${request.userId}-${request.metrics.join(',')}-${request.timeRange.start.getTime()}-${request.timeRange.end.getTime()}-${request.aggregation || 'day'}`
    const cached = VisualizationService.cache.get(cacheKey)
    if (cached && cached.expiry > Date.now()) {
      return cached.data
    }

    try {
      const data = await this.analyticsRepo.getTimeSeriesData(
        request.userId,
        request.metrics,
        request.timeRange
      )

      // Apply aggregation if requested
      let result = data
      if (request.aggregation && request.aggregation !== 'day') {
        result = this.aggregateTimeSeriesData(data, request.aggregation)
      }

      // Cache the result
      VisualizationService.cache.set(cacheKey, {
        data: result,
        expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
      })

      return result
    } catch (error) {
      console.error('Failed to generate time series data:', error)
      return {}
    }
  }

  async getPerformanceIndicators(userId: string, metricNames: string[]): Promise<PerformanceIndicatorData[]> {
    try {
      const comparison = await this.metricsRepo.getPerformanceComparison(userId, metricNames)
      
      return metricNames.map(metric => {
        const current = comparison.current[metric] || 0
        const previous = comparison.previous[metric] || 0
        const target = comparison.goals[metric]
        const benchmark = comparison.industry[metric]

        let trend: 'up' | 'down' | 'stable' = 'stable'
        let changePercentage = 0

        if (previous > 0) {
          changePercentage = ((current - previous) / previous) * 100
          if (Math.abs(changePercentage) > 5) {
            trend = changePercentage > 0 ? 'up' : 'down'
          }
        }

        let status: 'good' | 'warning' | 'critical' = 'good'
        if (target && current < target * 0.8) {
          status = 'critical'
        } else if (target && current < target * 0.9) {
          status = 'warning'
        } else if (benchmark && current < benchmark * 0.8) {
          status = 'warning'
        }

        return {
          name: metric,
          current,
          target,
          benchmark,
          trend,
          change_percentage: changePercentage,
          status
        }
      })
    } catch (error) {
      console.error('Failed to get performance indicators:', error)
      return []
    }
  }

  async generateComparison(request: ComparisonRequest): Promise<ComparisonAnalysis> {
    try {
      const baselineMetrics = await this.getMetricsForPeriod(request.userId, request.baseline.period)
      const comparisonMetrics = await this.getMetricsForPeriod(request.userId, request.comparison.period)

      const improvements: string[] = []
      const declines: string[] = []
      const impactAttribution: Record<string, number> = {}
      let totalImpact = 0

      request.metrics.forEach(metric => {
        const baselineValue = baselineMetrics?.[metric] || 0
        const comparisonValue = comparisonMetrics?.[metric] || 0
        const change = comparisonValue - baselineValue

        if (change > 0) {
          improvements.push(`${metric}: +${change.toFixed(2)}`)
        } else if (change < 0) {
          declines.push(`${metric}: ${change.toFixed(2)}`)
        }

        impactAttribution[metric] = change
        totalImpact += Math.abs(change)
      })

      const roiCalculation = totalImpact > 0 ? (totalImpact / Math.abs(Object.values(impactAttribution).reduce((sum, val) => sum + val, 0))) * 100 : 0

      return {
        id: `comp_${Date.now()}`,
        userId: request.userId,
        comparison_type: request.type,
        baseline: {
          period: request.baseline.period,
          metrics: baselineMetrics || {},
          label: request.baseline.label
        },
        comparison: {
          period: request.comparison.period,
          metrics: comparisonMetrics || {},
          label: request.comparison.label
        },
        analysis: {
          improvements,
          declines,
          impact_attribution: impactAttribution,
          roi_calculation: roiCalculation,
          confidence: 0.85
        },
        createdAt: new Date()
      }
    } catch (error) {
      console.error('Failed to generate comparison:', error)
      throw error
    }
  }

  async getDashboardConfiguration(userId: string, dashboardId?: string): Promise<WidgetConfiguration | null> {
    try {
      if (dashboardId) {
        return await this.widgetRepo.getWidgetConfiguration(userId, dashboardId)
      }
      
      // Get default configuration or create one
      const defaultConfig = await this.widgetRepo.getDefaultWidgetConfiguration(userId)
      if (defaultConfig) {
        return defaultConfig
      }

      // Create default dashboard configuration
      return await this.createDefaultDashboard(userId)
    } catch (error) {
      console.error('Failed to get dashboard configuration:', error)
      return null
    }
  }

  async updateDashboardConfiguration(
    userId: string,
    dashboardId: string,
    updates: Partial<WidgetConfiguration>
  ): Promise<WidgetConfiguration> {
    return await this.widgetRepo.updateWidgetConfiguration(userId, dashboardId, updates)
  }

  async recordAnalyticsEvent(
    userId: string,
    metric: string,
    value: number,
    category: 'valuation' | 'health_score' | 'performance' | 'improvement',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.analyticsRepo.createAnalyticsData({
      userId,
      metric,
      value,
      timestamp: new Date(),
      metadata,
      category,
      tags: []
    })
  }

  private async getMetricsForPeriod(userId: string, period: Date): Promise<Record<string, number> | null> {
    const metrics = await this.metricsRepo.getBusinessMetricsByPeriod(
      userId,
      new Date(period.getTime() - 24 * 60 * 60 * 1000), // Start of day
      new Date(period.getTime() + 24 * 60 * 60 * 1000)  // End of day
    )

    return metrics.length > 0 ? metrics[0].metrics : null
  }

  private aggregateTimeSeriesData(
    data: Record<string, AnalyticsData[]>,
    aggregation: 'hour' | 'week' | 'month'
  ): Record<string, AnalyticsData[]> {
    const aggregated: Record<string, AnalyticsData[]> = {}

    Object.keys(data).forEach(metric => {
      const points = data[metric]
      const grouped: Record<string, AnalyticsData[]> = {}

      points.forEach(point => {
        const key = this.getAggregationKey(point.timestamp, aggregation)
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(point)
      })

      aggregated[metric] = Object.keys(grouped).map(key => {
        const group = grouped[key]
        const avgValue = group.reduce((sum, p) => sum + p.value, 0) / group.length

        return {
          ...group[0],
          value: avgValue,
          timestamp: new Date(key)
        }
      }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    })

    return aggregated
  }

  private getAggregationKey(date: Date, aggregation: 'hour' | 'week' | 'month'): string {
    switch (aggregation) {
      case 'hour':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toISOString()
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).toISOString()
      case 'month':
        return new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
      default:
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString()
    }
  }

  private async createDefaultDashboard(userId: string): Promise<WidgetConfiguration> {
    const defaultWidgets = [
      {
        id: 'valuation-trend',
        type: 'chart' as const,
        position: { x: 0, y: 0, w: 6, h: 4 },
        config: {
          metrics: ['valuation'],
          time_range: '6months',
          chart_type: 'line',
          colors: ['#3b82f6'],
          title: 'Valuation Trend',
          show_benchmark: true,
          show_goals: true
        }
      },
      {
        id: 'health-score',
        type: 'kpi' as const,
        position: { x: 6, y: 0, w: 3, h: 2 },
        config: {
          metrics: ['health_score'],
          time_range: 'current',
          chart_type: 'gauge',
          colors: ['#10b981'],
          title: 'Health Score',
          show_benchmark: true,
          show_goals: false
        }
      },
      {
        id: 'revenue-performance',
        type: 'comparison' as const,
        position: { x: 9, y: 0, w: 3, h: 2 },
        config: {
          metrics: ['revenue'],
          time_range: '1year',
          chart_type: 'bar',
          colors: ['#8b5cf6'],
          title: 'Revenue vs Target',
          show_benchmark: true,
          show_goals: true
        }
      }
    ]

    return await this.widgetRepo.createWidgetConfiguration({
      userId,
      dashboard_id: 'default',
      widgets: defaultWidgets,
      layout: 'grid',
      is_default: true,
      shared_with: []
    })
  }

}