/**
 * Metrics collection for tier operations
 * Story 11.2: Subscription-Based Routing Middleware
 *
 * Features:
 * - Real-time metrics collection
 * - Performance tracking
 * - Usage analytics
 * - Error rate monitoring
 * - Business metrics
 */

import { SubscriptionTier, SubscriptionStatus } from '@/types/subscription'

/**
 * Metric types for tier operations
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer'
}

/**
 * Metric categories
 */
export enum MetricCategory {
  PERFORMANCE = 'performance',
  BUSINESS = 'business',
  SECURITY = 'security',
  ERROR = 'error',
  ACCESS = 'access',
  ROUTING = 'routing'
}

/**
 * Base metric interface
 */
export interface BaseMetric {
  name: string
  type: MetricType
  category: MetricCategory
  value: number
  timestamp: Date
  tags: Record<string, string>
  metadata?: Record<string, any>
}

/**
 * Performance metrics
 */
export interface PerformanceMetric extends BaseMetric {
  type: MetricType.TIMER | MetricType.HISTOGRAM
  category: MetricCategory.PERFORMANCE
  executionTime: number
  memoryUsage: number
  cacheHit: boolean
  dbQueries: number
  apiCalls: number
}

/**
 * Business metrics
 */
export interface BusinessMetric extends BaseMetric {
  type: MetricType.COUNTER | MetricType.GAUGE
  category: MetricCategory.BUSINESS
  userTier: SubscriptionTier
  feature?: string
  revenue?: number
}

/**
 * Access metrics
 */
export interface AccessMetric extends BaseMetric {
  type: MetricType.COUNTER
  category: MetricCategory.ACCESS
  userTier: SubscriptionTier
  route: string
  allowed: boolean
  reason?: string
}

/**
 * Error metrics
 */
export interface ErrorMetric extends BaseMetric {
  type: MetricType.COUNTER
  category: MetricCategory.ERROR
  errorType: string
  errorCode?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  route?: string
  userTier?: SubscriptionTier
}

/**
 * Security metrics
 */
export interface SecurityMetric extends BaseMetric {
  type: MetricType.COUNTER
  category: MetricCategory.SECURITY
  threat: string
  action: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  blocked: boolean
}

/**
 * Routing metrics
 */
export interface RoutingMetric extends BaseMetric {
  type: MetricType.COUNTER | MetricType.TIMER
  category: MetricCategory.ROUTING
  originalRoute: string
  targetRoute?: string
  redirected: boolean
  userTier: SubscriptionTier
  reason: string
}

/**
 * Aggregated metrics for reporting
 */
export interface AggregatedMetrics {
  performance: {
    averageExecutionTime: number
    p95ExecutionTime: number
    p99ExecutionTime: number
    cacheHitRate: number
    errorRate: number
    throughput: number
  }
  business: {
    totalRequests: number
    requestsByTier: Record<SubscriptionTier, number>
    featureUsage: Record<string, number>
    conversionRate?: number
  }
  security: {
    threatCount: number
    blockedRequests: number
    riskDistribution: Record<string, number>
  }
  access: {
    allowedRequests: number
    deniedRequests: number
    accessRate: number
    tierDistribution: Record<SubscriptionTier, number>
  }
  routing: {
    redirectCount: number
    routingDecisions: Record<string, number>
    tierRedirects: Record<SubscriptionTier, number>
  }
}

/**
 * Metrics configuration
 */
interface MetricsConfig {
  enabled: boolean
  flushInterval: number // ms
  maxMetricsInMemory: number
  enableRealTimeExport: boolean
  enableAggregation: boolean
  aggregationWindow: number // ms
  retentionPeriod: number // ms
  exportEndpoints: string[]
}

/**
 * Default metrics configuration
 */
const DEFAULT_METRICS_CONFIG: MetricsConfig = {
  enabled: true,
  flushInterval: 30000, // 30 seconds
  maxMetricsInMemory: 10000,
  enableRealTimeExport: process.env.NODE_ENV === 'production',
  enableAggregation: true,
  aggregationWindow: 60000, // 1 minute
  retentionPeriod: 86400000, // 24 hours
  exportEndpoints: []
}

/**
 * Metrics collector class
 */
class TierMetricsCollector {
  private metrics: BaseMetric[] = []
  private aggregatedMetrics: Map<string, AggregatedMetrics> = new Map()
  private config: MetricsConfig
  private flushTimer?: NodeJS.Timeout
  private aggregationTimer?: NodeJS.Timeout

  constructor(config?: Partial<MetricsConfig>) {
    this.config = { ...DEFAULT_METRICS_CONFIG, ...config }

    if (this.config.enabled) {
      this.startFlushTimer()
      if (this.config.enableAggregation) {
        this.startAggregationTimer()
      }
    }
  }

  /**
   * Record a performance metric
   */
  recordPerformance(data: {
    name: string
    executionTime: number
    memoryUsage: number
    cacheHit: boolean
    dbQueries?: number
    apiCalls?: number
    route?: string
    userTier?: SubscriptionTier
    method?: string
  }): void {
    if (!this.config.enabled) return

    const metric: PerformanceMetric = {
      name: data.name,
      type: MetricType.TIMER,
      category: MetricCategory.PERFORMANCE,
      value: data.executionTime,
      timestamp: new Date(),
      executionTime: data.executionTime,
      memoryUsage: data.memoryUsage,
      cacheHit: data.cacheHit,
      dbQueries: data.dbQueries || 0,
      apiCalls: data.apiCalls || 0,
      tags: {
        route: data.route || 'unknown',
        tier: data.userTier || 'unknown',
        method: data.method || 'unknown',
        cache_hit: data.cacheHit.toString()
      }
    }

    this.addMetric(metric)
  }

  /**
   * Record a business metric
   */
  recordBusiness(data: {
    name: string
    userTier: SubscriptionTier
    feature?: string
    count?: number
    revenue?: number
    route?: string
  }): void {
    if (!this.config.enabled) return

    const metric: BusinessMetric = {
      name: data.name,
      type: MetricType.COUNTER,
      category: MetricCategory.BUSINESS,
      value: data.count || 1,
      timestamp: new Date(),
      userTier: data.userTier,
      feature: data.feature,
      revenue: data.revenue,
      tags: {
        tier: data.userTier,
        feature: data.feature || 'none',
        route: data.route || 'unknown'
      }
    }

    this.addMetric(metric)
  }

  /**
   * Record an access metric
   */
  recordAccess(data: {
    name: string
    userTier: SubscriptionTier
    route: string
    allowed: boolean
    reason?: string
    method?: string
    requiredTier?: SubscriptionTier
  }): void {
    if (!this.config.enabled) return

    const metric: AccessMetric = {
      name: data.name,
      type: MetricType.COUNTER,
      category: MetricCategory.ACCESS,
      value: 1,
      timestamp: new Date(),
      userTier: data.userTier,
      route: data.route,
      allowed: data.allowed,
      reason: data.reason,
      tags: {
        tier: data.userTier,
        route: data.route,
        method: data.method || 'unknown',
        allowed: data.allowed.toString(),
        required_tier: data.requiredTier || 'none',
        reason: data.reason || 'none'
      }
    }

    this.addMetric(metric)
  }

  /**
   * Record an error metric
   */
  recordError(data: {
    name: string
    errorType: string
    errorCode?: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    route?: string
    userTier?: SubscriptionTier
    message?: string
  }): void {
    if (!this.config.enabled) return

    const metric: ErrorMetric = {
      name: data.name,
      type: MetricType.COUNTER,
      category: MetricCategory.ERROR,
      value: 1,
      timestamp: new Date(),
      errorType: data.errorType,
      errorCode: data.errorCode,
      severity: data.severity,
      route: data.route,
      userTier: data.userTier,
      tags: {
        error_type: data.errorType,
        error_code: data.errorCode || 'unknown',
        severity: data.severity,
        route: data.route || 'unknown',
        tier: data.userTier || 'unknown'
      },
      metadata: {
        message: data.message
      }
    }

    this.addMetric(metric)
  }

  /**
   * Record a security metric
   */
  recordSecurity(data: {
    name: string
    threat: string
    action: string
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    blocked: boolean
    route?: string
    userTier?: SubscriptionTier
    ip?: string
  }): void {
    if (!this.config.enabled) return

    const metric: SecurityMetric = {
      name: data.name,
      type: MetricType.COUNTER,
      category: MetricCategory.SECURITY,
      value: 1,
      timestamp: new Date(),
      threat: data.threat,
      action: data.action,
      riskLevel: data.riskLevel,
      blocked: data.blocked,
      tags: {
        threat: data.threat,
        action: data.action,
        risk_level: data.riskLevel,
        blocked: data.blocked.toString(),
        route: data.route || 'unknown',
        tier: data.userTier || 'unknown'
      },
      metadata: {
        ip: data.ip
      }
    }

    this.addMetric(metric)
  }

  /**
   * Record a routing metric
   */
  recordRouting(data: {
    name: string
    originalRoute: string
    targetRoute?: string
    redirected: boolean
    userTier: SubscriptionTier
    reason: string
    executionTime?: number
  }): void {
    if (!this.config.enabled) return

    const metric: RoutingMetric = {
      name: data.name,
      type: data.executionTime ? MetricType.TIMER : MetricType.COUNTER,
      category: MetricCategory.ROUTING,
      value: data.executionTime || 1,
      timestamp: new Date(),
      originalRoute: data.originalRoute,
      targetRoute: data.targetRoute,
      redirected: data.redirected,
      userTier: data.userTier,
      reason: data.reason,
      tags: {
        original_route: data.originalRoute,
        target_route: data.targetRoute || 'none',
        redirected: data.redirected.toString(),
        tier: data.userTier,
        reason: data.reason
      }
    }

    this.addMetric(metric)
  }

  /**
   * Add metric to collection
   */
  private addMetric(metric: BaseMetric): void {
    this.metrics.push(metric)

    // Prevent memory overflow
    if (this.metrics.length > this.config.maxMetricsInMemory) {
      this.metrics = this.metrics.slice(-this.config.maxMetricsInMemory / 2)
    }

    // Real-time export if enabled
    if (this.config.enableRealTimeExport) {
      this.exportMetric(metric).catch(console.error)
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(category?: MetricCategory, since?: Date): BaseMetric[] {
    let filtered = this.metrics

    if (category) {
      filtered = filtered.filter(m => m.category === category)
    }

    if (since) {
      filtered = filtered.filter(m => m.timestamp >= since)
    }

    return filtered
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(windowKey?: string): AggregatedMetrics | undefined {
    if (!windowKey) {
      // Return latest aggregation
      const keys = Array.from(this.aggregatedMetrics.keys()).sort()
      windowKey = keys[keys.length - 1]
    }

    return this.aggregatedMetrics.get(windowKey)
  }

  /**
   * Calculate aggregated metrics
   */
  private calculateAggregations(): void {
    const now = new Date()
    const windowStart = new Date(now.getTime() - this.config.aggregationWindow)
    const windowKey = this.getWindowKey(now)

    const recentMetrics = this.metrics.filter(m => m.timestamp >= windowStart)

    if (recentMetrics.length === 0) return

    const aggregated: AggregatedMetrics = {
      performance: this.aggregatePerformance(recentMetrics),
      business: this.aggregateBusiness(recentMetrics),
      security: this.aggregateSecurity(recentMetrics),
      access: this.aggregateAccess(recentMetrics),
      routing: this.aggregateRouting(recentMetrics)
    }

    this.aggregatedMetrics.set(windowKey, aggregated)

    // Clean old aggregations
    this.cleanOldAggregations()
  }

  /**
   * Aggregate performance metrics
   */
  private aggregatePerformance(metrics: BaseMetric[]) {
    const perfMetrics = metrics.filter(m => m.category === MetricCategory.PERFORMANCE) as PerformanceMetric[]

    if (perfMetrics.length === 0) {
      return {
        averageExecutionTime: 0,
        p95ExecutionTime: 0,
        p99ExecutionTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        throughput: 0
      }
    }

    const executionTimes = perfMetrics.map(m => m.executionTime).sort((a, b) => a - b)
    const cacheHits = perfMetrics.filter(m => m.cacheHit).length
    const errorMetrics = metrics.filter(m => m.category === MetricCategory.ERROR)

    return {
      averageExecutionTime: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
      p95ExecutionTime: executionTimes[Math.floor(executionTimes.length * 0.95)] || 0,
      p99ExecutionTime: executionTimes[Math.floor(executionTimes.length * 0.99)] || 0,
      cacheHitRate: cacheHits / perfMetrics.length,
      errorRate: errorMetrics.length / (perfMetrics.length + errorMetrics.length),
      throughput: perfMetrics.length / (this.config.aggregationWindow / 1000)
    }
  }

  /**
   * Aggregate business metrics
   */
  private aggregateBusiness(metrics: BaseMetric[]) {
    const bizMetrics = metrics.filter(m => m.category === MetricCategory.BUSINESS) as BusinessMetric[]

    const requestsByTier = bizMetrics.reduce((acc, m) => {
      acc[m.userTier] = (acc[m.userTier] || 0) + m.value
      return acc
    }, {} as Record<SubscriptionTier, number>)

    const featureUsage = bizMetrics.reduce((acc, m) => {
      if (m.feature) {
        acc[m.feature] = (acc[m.feature] || 0) + m.value
      }
      return acc
    }, {} as Record<string, number>)

    return {
      totalRequests: bizMetrics.reduce((sum, m) => sum + m.value, 0),
      requestsByTier,
      featureUsage
    }
  }

  /**
   * Aggregate security metrics
   */
  private aggregateSecurity(metrics: BaseMetric[]) {
    const secMetrics = metrics.filter(m => m.category === MetricCategory.SECURITY) as SecurityMetric[]

    const riskDistribution = secMetrics.reduce((acc, m) => {
      acc[m.riskLevel] = (acc[m.riskLevel] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      threatCount: secMetrics.length,
      blockedRequests: secMetrics.filter(m => m.blocked).length,
      riskDistribution
    }
  }

  /**
   * Aggregate access metrics
   */
  private aggregateAccess(metrics: BaseMetric[]) {
    const accessMetrics = metrics.filter(m => m.category === MetricCategory.ACCESS) as AccessMetric[]

    const allowed = accessMetrics.filter(m => m.allowed).length
    const denied = accessMetrics.filter(m => !m.allowed).length

    const tierDistribution = accessMetrics.reduce((acc, m) => {
      acc[m.userTier] = (acc[m.userTier] || 0) + 1
      return acc
    }, {} as Record<SubscriptionTier, number>)

    return {
      allowedRequests: allowed,
      deniedRequests: denied,
      accessRate: allowed / (allowed + denied) || 0,
      tierDistribution
    }
  }

  /**
   * Aggregate routing metrics
   */
  private aggregateRouting(metrics: BaseMetric[]) {
    const routingMetrics = metrics.filter(m => m.category === MetricCategory.ROUTING) as RoutingMetric[]

    const redirectCount = routingMetrics.filter(m => m.redirected).length

    const routingDecisions = routingMetrics.reduce((acc, m) => {
      acc[m.reason] = (acc[m.reason] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const tierRedirects = routingMetrics
      .filter(m => m.redirected)
      .reduce((acc, m) => {
        acc[m.userTier] = (acc[m.userTier] || 0) + 1
        return acc
      }, {} as Record<SubscriptionTier, number>)

    return {
      redirectCount,
      routingDecisions,
      tierRedirects
    }
  }

  /**
   * Export single metric
   */
  private async exportMetric(metric: BaseMetric): Promise<void> {
    // Implementation would depend on your monitoring service
    // Examples: DataDog, New Relic, CloudWatch, Prometheus, etc.

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Metric Export:', {
        name: metric.name,
        type: metric.type,
        category: metric.category,
        value: metric.value,
        tags: metric.tags
      })
    }

    // Example implementations:
    // await this.exportToDataDog(metric)
    // await this.exportToNewRelic(metric)
    // await this.exportToPrometheus(metric)
  }

  /**
   * Flush all metrics
   */
  async flush(): Promise<void> {
    if (this.config.enableRealTimeExport) {
      // Export any remaining metrics
      const promises = this.metrics.map(metric => this.exportMetric(metric))
      await Promise.allSettled(promises)
    }

    // Calculate final aggregations
    if (this.config.enableAggregation) {
      this.calculateAggregations()
    }

    this.metrics = []
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error)
    }, this.config.flushInterval)
  }

  /**
   * Start aggregation timer
   */
  private startAggregationTimer(): void {
    this.aggregationTimer = setInterval(() => {
      this.calculateAggregations()
    }, this.config.aggregationWindow)
  }

  /**
   * Get window key for aggregation
   */
  private getWindowKey(date: Date): string {
    const window = Math.floor(date.getTime() / this.config.aggregationWindow)
    return `window_${window}`
  }

  /**
   * Clean old aggregations
   */
  private cleanOldAggregations(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod)
    const cutoffWindow = this.getWindowKey(cutoff)

    for (const [key] of this.aggregatedMetrics) {
      if (key < cutoffWindow) {
        this.aggregatedMetrics.delete(key)
      }
    }
  }

  /**
   * Stop timers and cleanup
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer)
    }
    this.flush().catch(console.error)
  }
}

/**
 * Global metrics collector instance
 */
export const tierMetrics = new TierMetricsCollector()

/**
 * Utility functions for metrics
 */
export const MetricsUtils = {
  /**
   * Create performance tracker with automatic recording
   */
  createPerformanceTracker(name: string, tags?: Record<string, string>) {
    const startTime = performance.now()
    const startMemory = process.memoryUsage().heapUsed

    return {
      addDbQuery() {
        this.dbQueries = (this.dbQueries || 0) + 1
      },
      addApiCall() {
        this.apiCalls = (this.apiCalls || 0) + 1
      },
      setCacheHit(hit: boolean) {
        this.cacheHit = hit
      },
      finish(additionalTags?: Record<string, string>) {
        const executionTime = performance.now() - startTime
        const memoryUsage = Math.round((process.memoryUsage().heapUsed - startMemory) / 1024 / 1024 * 100) / 100

        tierMetrics.recordPerformance({
          name,
          executionTime,
          memoryUsage,
          cacheHit: this.cacheHit || false,
          dbQueries: this.dbQueries || 0,
          apiCalls: this.apiCalls || 0,
          ...additionalTags
        })

        return { executionTime, memoryUsage }
      },
      dbQueries: 0,
      apiCalls: 0,
      cacheHit: false
    }
  },

  /**
   * Calculate percentile from array of numbers
   */
  calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  },

  /**
   * Format metrics for display
   */
  formatMetricsForDisplay(metrics: AggregatedMetrics) {
    return {
      performance: {
        'Avg Execution Time': `${metrics.performance.averageExecutionTime.toFixed(2)}ms`,
        'P95 Execution Time': `${metrics.performance.p95ExecutionTime.toFixed(2)}ms`,
        'P99 Execution Time': `${metrics.performance.p99ExecutionTime.toFixed(2)}ms`,
        'Cache Hit Rate': `${(metrics.performance.cacheHitRate * 100).toFixed(1)}%`,
        'Error Rate': `${(metrics.performance.errorRate * 100).toFixed(2)}%`,
        'Throughput': `${metrics.performance.throughput.toFixed(1)} req/s`
      },
      business: {
        'Total Requests': metrics.business.totalRequests.toLocaleString(),
        'Basic Tier': metrics.business.requestsByTier.BASIC || 0,
        'Professional Tier': metrics.business.requestsByTier.PROFESSIONAL || 0,
        'Enterprise Tier': metrics.business.requestsByTier.ENTERPRISE || 0
      },
      access: {
        'Allowed Requests': metrics.access.allowedRequests.toLocaleString(),
        'Denied Requests': metrics.access.deniedRequests.toLocaleString(),
        'Access Rate': `${(metrics.access.accessRate * 100).toFixed(1)}%`
      },
      security: {
        'Threat Count': metrics.security.threatCount.toLocaleString(),
        'Blocked Requests': metrics.security.blockedRequests.toLocaleString(),
        'Critical Risks': metrics.security.riskDistribution.critical || 0
      }
    }
  }
}

export default TierMetricsCollector