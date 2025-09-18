/**
 * Performance monitoring utilities for middleware
 * Story 11.2: Subscription-Based Routing Middleware Performance Optimization
 */

export interface PerformanceMetrics {
  executionTime: number
  cacheHitRate: number
  dbQueries: number
  apiCalls: number
  memoryUsage: number
  timestamp: number
  endpoint: string
  userTier: string
  source: string
}

export interface CircuitBreakerState {
  failures: number
  lastFailure: number
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  timeout: number
}

export interface PerformanceThresholds {
  maxExecutionTime: number
  maxCacheSize: number
  maxMemoryUsage: number
  circuitBreakerThreshold: number
  circuitBreakerTimeout: number
}

/**
 * Performance monitoring class with circuit breaker pattern
 */
export class MiddlewarePerformanceMonitor {
  private static instance: MiddlewarePerformanceMonitor
  private metrics: PerformanceMetrics[] = []
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map()
  private activeTimers: Map<string, number> = new Map()

  private readonly thresholds: PerformanceThresholds = {
    maxExecutionTime: 100, // 100ms requirement
    maxCacheSize: 1000,
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 30000 // 30 seconds
  }

  static getInstance(): MiddlewarePerformanceMonitor {
    if (!this.instance) {
      this.instance = new MiddlewarePerformanceMonitor()
    }
    return this.instance
  }

  /**
   * Start performance timing for a specific operation
   */
  startTimer(operationId: string): void {
    this.activeTimers.set(operationId, performance.now())
  }

  /**
   * End performance timing and record metrics
   */
  endTimer(
    operationId: string,
    metadata: {
      endpoint: string
      userTier: string
      source: string
      cacheHit?: boolean
      dbQueries?: number
      apiCalls?: number
    }
  ): number {
    const startTime = this.activeTimers.get(operationId)
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationId}`)
      return 0
    }

    const executionTime = performance.now() - startTime
    this.activeTimers.delete(operationId)

    // Record metrics
    const metrics: PerformanceMetrics = {
      executionTime,
      cacheHitRate: metadata.cacheHit ? 1 : 0,
      dbQueries: metadata.dbQueries || 0,
      apiCalls: metadata.apiCalls || 0,
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now(),
      endpoint: metadata.endpoint,
      userTier: metadata.userTier,
      source: metadata.source
    }

    this.recordMetrics(metrics)

    // Check performance thresholds
    this.checkPerformanceThresholds(metrics)

    return executionTime
  }

  /**
   * Record metrics and maintain sliding window
   */
  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics)

    // Keep only last 1000 metrics (sliding window)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }

  /**
   * Check if performance thresholds are exceeded
   */
  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    if (metrics.executionTime > this.thresholds.maxExecutionTime) {
      console.warn(`⚠️ Middleware execution time exceeded: ${metrics.executionTime.toFixed(2)}ms (threshold: ${this.thresholds.maxExecutionTime}ms)`)

      // Log detailed breakdown for debugging
      this.logSlowOperation(metrics)
    }

    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      console.warn(`⚠️ Memory usage exceeded: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`)
    }
  }

  /**
   * Circuit breaker pattern for external service calls
   */
  async executeWithCircuitBreaker<T>(
    serviceId: string,
    operation: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    const state = this.getCircuitBreakerState(serviceId)

    // If circuit is open and timeout hasn't passed, return fallback
    if (state.state === 'OPEN') {
      const timeoutPassed = Date.now() - state.lastFailure > state.timeout
      if (!timeoutPassed) {
        if (fallback) {
          return fallback()
        }
        throw new Error(`Circuit breaker is OPEN for service: ${serviceId}`)
      } else {
        // Move to half-open state
        state.state = 'HALF_OPEN'
      }
    }

    try {
      const result = await operation()

      // Success: reset failure count and close circuit
      state.failures = 0
      state.state = 'CLOSED'
      this.circuitBreakers.set(serviceId, state)

      return result
    } catch (error) {
      // Failure: increment count and potentially open circuit
      state.failures++
      state.lastFailure = Date.now()

      if (state.failures >= this.thresholds.circuitBreakerThreshold) {
        state.state = 'OPEN'
        console.warn(`🔴 Circuit breaker OPENED for service: ${serviceId} (failures: ${state.failures})`)
      }

      this.circuitBreakers.set(serviceId, state)

      if (fallback && state.state === 'OPEN') {
        return fallback()
      }

      throw error
    }
  }

  /**
   * Get circuit breaker state for a service
   */
  private getCircuitBreakerState(serviceId: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(serviceId)) {
      this.circuitBreakers.set(serviceId, {
        failures: 0,
        lastFailure: 0,
        state: 'CLOSED',
        timeout: this.thresholds.circuitBreakerTimeout
      })
    }
    return this.circuitBreakers.get(serviceId)!
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    // Fallback for edge runtime
    return 0
  }

  /**
   * Get aggregated performance statistics
   */
  getPerformanceStats(timeWindow?: number): {
    averageExecutionTime: number
    p95ExecutionTime: number
    p99ExecutionTime: number
    cacheHitRate: number
    slowOperationsCount: number
    totalOperations: number
    errorRate: number
    memoryUsage: {
      current: number
      average: number
      peak: number
    }
  } {
    const now = Date.now()
    const windowMs = timeWindow || 300000 // Default 5 minutes

    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp <= windowMs
    )

    if (recentMetrics.length === 0) {
      return {
        averageExecutionTime: 0,
        p95ExecutionTime: 0,
        p99ExecutionTime: 0,
        cacheHitRate: 0,
        slowOperationsCount: 0,
        totalOperations: 0,
        errorRate: 0,
        memoryUsage: {
          current: this.getMemoryUsage(),
          average: 0,
          peak: 0
        }
      }
    }

    // Calculate execution time statistics
    const executionTimes = recentMetrics.map(m => m.executionTime).sort((a, b) => a - b)
    const averageExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
    const p95Index = Math.floor(executionTimes.length * 0.95)
    const p99Index = Math.floor(executionTimes.length * 0.99)
    const p95ExecutionTime = executionTimes[p95Index] || 0
    const p99ExecutionTime = executionTimes[p99Index] || 0

    // Calculate cache hit rate
    const cacheHits = recentMetrics.filter(m => m.cacheHitRate > 0).length
    const cacheHitRate = cacheHits / recentMetrics.length

    // Count slow operations
    const slowOperationsCount = recentMetrics.filter(
      m => m.executionTime > this.thresholds.maxExecutionTime
    ).length

    // Memory statistics
    const memoryUsages = recentMetrics.map(m => m.memoryUsage).filter(m => m > 0)
    const averageMemory = memoryUsages.length > 0
      ? memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length
      : 0
    const peakMemory = memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0

    return {
      averageExecutionTime,
      p95ExecutionTime,
      p99ExecutionTime,
      cacheHitRate,
      slowOperationsCount,
      totalOperations: recentMetrics.length,
      errorRate: 0, // Calculate based on circuit breaker failures
      memoryUsage: {
        current: this.getMemoryUsage(),
        average: averageMemory,
        peak: peakMemory
      }
    }
  }

  /**
   * Log detailed information about slow operations
   */
  private logSlowOperation(metrics: PerformanceMetrics): void {
    console.log('🐌 Slow Operation Detected:', {
      endpoint: metrics.endpoint,
      executionTime: `${metrics.executionTime.toFixed(2)}ms`,
      userTier: metrics.userTier,
      source: metrics.source,
      cacheHit: metrics.cacheHitRate > 0,
      dbQueries: metrics.dbQueries,
      apiCalls: metrics.apiCalls,
      memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      timestamp: new Date(metrics.timestamp).toISOString()
    })
  }

  /**
   * Get circuit breaker status for all services
   */
  getCircuitBreakerStatus(): Array<{
    serviceId: string
    state: CircuitBreakerState['state']
    failures: number
    lastFailure: string | null
  }> {
    return Array.from(this.circuitBreakers.entries()).map(([serviceId, state]) => ({
      serviceId,
      state: state.state,
      failures: state.failures,
      lastFailure: state.lastFailure > 0 ? new Date(state.lastFailure).toISOString() : null
    }))
  }

  /**
   * Reset circuit breaker for a specific service
   */
  resetCircuitBreaker(serviceId: string): void {
    if (this.circuitBreakers.has(serviceId)) {
      this.circuitBreakers.set(serviceId, {
        failures: 0,
        lastFailure: 0,
        state: 'CLOSED',
        timeout: this.thresholds.circuitBreakerTimeout
      })
      console.log(`✅ Circuit breaker reset for service: ${serviceId}`)
    }
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clearMetrics(): void {
    this.metrics = []
    this.circuitBreakers.clear()
    this.activeTimers.clear()
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): {
    performance: PerformanceMetrics[]
    circuitBreakers: Array<{
      serviceId: string
      state: CircuitBreakerState
    }>
    summary: ReturnType<typeof this.getPerformanceStats>
  } {
    return {
      performance: [...this.metrics],
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([serviceId, state]) => ({
        serviceId,
        state
      })),
      summary: this.getPerformanceStats()
    }
  }
}

/**
 * Convenience functions for middleware usage
 */
export function startPerformanceTimer(operationId: string): void {
  MiddlewarePerformanceMonitor.getInstance().startTimer(operationId)
}

export function endPerformanceTimer(
  operationId: string,
  metadata: {
    endpoint: string
    userTier: string
    source: string
    cacheHit?: boolean
    dbQueries?: number
    apiCalls?: number
  }
): number {
  return MiddlewarePerformanceMonitor.getInstance().endTimer(operationId, metadata)
}

export function executeWithCircuitBreaker<T>(
  serviceId: string,
  operation: () => Promise<T>,
  fallback?: () => T
): Promise<T> {
  return MiddlewarePerformanceMonitor.getInstance().executeWithCircuitBreaker(
    serviceId,
    operation,
    fallback
  )
}

export function getPerformanceStats(timeWindow?: number) {
  return MiddlewarePerformanceMonitor.getInstance().getPerformanceStats(timeWindow)
}

export function getCircuitBreakerStatus() {
  return MiddlewarePerformanceMonitor.getInstance().getCircuitBreakerStatus()
}

/**
 * Performance monitoring middleware wrapper
 */
export function withPerformanceMonitoring<T extends any[], R>(
  operationName: string,
  operation: (...args: T) => Promise<R>,
  metadata: {
    endpoint: string
    userTier: string
    source: string
  }
) {
  return async (...args: T): Promise<R> => {
    const operationId = `${operationName}-${Date.now()}-${Math.random()}`

    startPerformanceTimer(operationId)

    try {
      const result = await operation(...args)

      endPerformanceTimer(operationId, {
        ...metadata,
        cacheHit: true // Determine this based on your logic
      })

      return result
    } catch (error) {
      endPerformanceTimer(operationId, {
        ...metadata,
        cacheHit: false
      })
      throw error
    }
  }
}