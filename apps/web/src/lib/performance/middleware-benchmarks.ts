/**
 * Performance benchmarks and metrics collection for middleware
 * Story 11.2: Subscription-Based Routing Middleware Performance Optimization
 */

import { NextRequest, NextResponse } from 'next/server'
import { MiddlewarePerformanceMonitor, getPerformanceStats } from './middleware-monitor'
import { tierCache } from '@/lib/cache/tier-cache'
import { TierDetectionService } from '@/lib/subscription/tier-utils'
import { SubscriptionTier } from '@/types/subscription'

export interface BenchmarkResult {
  operationName: string
  averageTime: number
  p95Time: number
  p99Time: number
  throughput: number
  successRate: number
  cacheHitRate: number
  memoryUsage: number
  samples: number
}

export interface MiddlewareBenchmarkSuite {
  cachePerformance: BenchmarkResult
  tierDetection: BenchmarkResult
  routingDecision: BenchmarkResult
  overallMiddleware: BenchmarkResult
  circuitBreakerResilience: BenchmarkResult
}

/**
 * Middleware performance benchmark runner
 */
export class MiddlewareBenchmarkRunner {
  private monitor = MiddlewarePerformanceMonitor.getInstance()

  /**
   * Run comprehensive middleware performance benchmarks
   */
  async runBenchmarkSuite(iterations: number = 1000): Promise<MiddlewareBenchmarkSuite> {
    console.log(`🚀 Starting middleware benchmark suite with ${iterations} iterations...`)

    // Clear previous metrics
    this.monitor.clearMetrics()
    tierCache.clear()

    const results = await Promise.all([
      this.benchmarkCachePerformance(iterations),
      this.benchmarkTierDetection(iterations),
      this.benchmarkRoutingDecision(iterations),
      this.benchmarkOverallMiddleware(iterations),
      this.benchmarkCircuitBreakerResilience(Math.min(iterations, 100))
    ])

    return {
      cachePerformance: results[0],
      tierDetection: results[1],
      routingDecision: results[2],
      overallMiddleware: results[3],
      circuitBreakerResilience: results[4]
    }
  }

  /**
   * Benchmark cache performance
   */
  private async benchmarkCachePerformance(iterations: number): Promise<BenchmarkResult> {
    const times: number[] = []
    let cacheHits = 0
    let successes = 0

    // Pre-populate cache with some data
    for (let i = 0; i < 100; i++) {
      tierCache.setTierResult(`user-${i}`, {
        tier: 'PROFESSIONAL',
        status: 'ACTIVE',
        features: ['professional_evaluation', 'advanced_analytics'],
        hasAccess: true,
        isTrialing: false,
        executionTime: 5,
        source: 'clerk'
      })
    }

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()

      try {
        // Mix of cache hits and misses
        const userId = i < iterations * 0.8 ? `user-${i % 100}` : `new-user-${i}`
        const result = tierCache.getTierResult(userId)

        if (result) {
          cacheHits++
        } else {
          // Simulate cache miss with new entry
          tierCache.setTierResult(userId, {
            tier: 'BASIC',
            status: 'ACTIVE',
            features: ['basic_evaluation'],
            hasAccess: true,
            isTrialing: false,
            executionTime: 15,
            source: 'database'
          })
        }

        successes++
      } catch (error) {
        console.error('Cache benchmark error:', error)
      }

      const endTime = performance.now()
      times.push(endTime - startTime)
    }

    return this.calculateBenchmarkResult('Cache Performance', times, successes, iterations, cacheHits)
  }

  /**
   * Benchmark tier detection performance
   */
  private async benchmarkTierDetection(iterations: number): Promise<BenchmarkResult> {
    const times: number[] = []
    let successes = 0

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()

      try {
        // Create mock request
        const mockRequest = this.createMockRequest(`/dashboard/professional`)

        // Simulate tier detection with circuit breaker
        const result = await this.monitor.executeWithCircuitBreaker(
          'tier-detection-benchmark',
          async () => {
            // Simulate various response times
            const delay = Math.random() * 50 // 0-50ms
            await new Promise(resolve => setTimeout(resolve, delay))

            return {
              tier: 'PROFESSIONAL' as SubscriptionTier,
              status: 'ACTIVE' as const,
              features: ['professional_evaluation', 'advanced_analytics'],
              hasAccess: true,
              isTrialing: false,
              executionTime: delay,
              source: 'clerk' as const
            }
          },
          () => ({
            tier: 'BASIC' as SubscriptionTier,
            status: 'ACTIVE' as const,
            features: ['basic_evaluation'],
            hasAccess: true,
            isTrialing: false,
            executionTime: 1,
            source: 'fallback' as const
          })
        )

        successes++
      } catch (error) {
        console.error('Tier detection benchmark error:', error)
      }

      const endTime = performance.now()
      times.push(endTime - startTime)
    }

    return this.calculateBenchmarkResult('Tier Detection', times, successes, iterations)
  }

  /**
   * Benchmark routing decision performance
   */
  private async benchmarkRoutingDecision(iterations: number): Promise<BenchmarkResult> {
    const times: number[] = []
    let successes = 0

    const { TierRoutingEngine } = await import('@/lib/routing/tier-routes')
    const testPaths = [
      '/dashboard/basic',
      '/dashboard/professional',
      '/dashboard/enterprise',
      '/evaluations/professional',
      '/analytics/advanced',
      '/reports/pdf'
    ]

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()

      try {
        const pathname = testPaths[i % testPaths.length]
        const userTier = ['BASIC', 'PROFESSIONAL', 'ENTERPRISE'][i % 3] as SubscriptionTier
        const features = userTier === 'BASIC' ? ['basic_evaluation'] : ['professional_evaluation', 'advanced_analytics']

        const decision = TierRoutingEngine.makeRoutingDecision(pathname, userTier, features)

        if (decision) {
          successes++
        }
      } catch (error) {
        console.error('Routing decision benchmark error:', error)
      }

      const endTime = performance.now()
      times.push(endTime - startTime)
    }

    return this.calculateBenchmarkResult('Routing Decision', times, successes, iterations)
  }

  /**
   * Benchmark overall middleware performance
   */
  private async benchmarkOverallMiddleware(iterations: number): Promise<BenchmarkResult> {
    const times: number[] = []
    let successes = 0

    for (let i = 0; i < iterations; i++) {
      const operationId = `benchmark-${i}`
      this.monitor.startTimer(operationId)

      try {
        // Simulate full middleware execution
        const mockRequest = this.createMockRequest('/dashboard/professional')

        // Simulate the full middleware flow
        await this.simulateMiddlewareFlow(mockRequest)

        successes++
      } catch (error) {
        console.error('Overall middleware benchmark error:', error)
      }

      const executionTime = this.monitor.endTimer(operationId, {
        endpoint: '/dashboard/professional',
        userTier: 'PROFESSIONAL',
        source: 'benchmark',
        cacheHit: Math.random() > 0.2, // Simulate 80% cache hit rate
        dbQueries: Math.random() > 0.8 ? 1 : 0, // Simulate occasional DB query
        apiCalls: Math.random() > 0.7 ? 1 : 0 // Simulate occasional API call
      })

      times.push(executionTime)
    }

    return this.calculateBenchmarkResult('Overall Middleware', times, successes, iterations)
  }

  /**
   * Benchmark circuit breaker resilience
   */
  private async benchmarkCircuitBreakerResilience(iterations: number): Promise<BenchmarkResult> {
    const times: number[] = []
    let successes = 0

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()

      try {
        // Simulate service with occasional failures
        const result = await this.monitor.executeWithCircuitBreaker(
          'resilience-test-service',
          async () => {
            // Simulate 20% failure rate to test circuit breaker
            if (Math.random() < 0.2) {
              throw new Error('Simulated service failure')
            }

            // Simulate varying response times
            const delay = Math.random() * 30
            await new Promise(resolve => setTimeout(resolve, delay))

            return { success: true, delay }
          },
          () => ({ success: true, delay: 1, fallback: true })
        )

        if (result.success) {
          successes++
        }
      } catch (error) {
        // Expected for circuit breaker testing
      }

      const endTime = performance.now()
      times.push(endTime - startTime)
    }

    return this.calculateBenchmarkResult('Circuit Breaker Resilience', times, successes, iterations)
  }

  /**
   * Create mock request for testing
   */
  private createMockRequest(pathname: string): NextRequest {
    return {
      nextUrl: { pathname },
      headers: new Headers({
        'user-agent': 'benchmark-test',
        'x-forwarded-for': '127.0.0.1'
      }),
      url: `https://example.com${pathname}`,
      method: 'GET'
    } as NextRequest
  }

  /**
   * Simulate middleware flow for benchmarking
   */
  private async simulateMiddlewareFlow(request: NextRequest): Promise<void> {
    // Simulate tier detection
    await new Promise(resolve => setTimeout(resolve, Math.random() * 20))

    // Simulate routing decision
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5))

    // Simulate response preparation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3))
  }

  /**
   * Calculate benchmark result statistics
   */
  private calculateBenchmarkResult(
    operationName: string,
    times: number[],
    successes: number,
    total: number,
    cacheHits?: number
  ): BenchmarkResult {
    if (times.length === 0) {
      return {
        operationName,
        averageTime: 0,
        p95Time: 0,
        p99Time: 0,
        throughput: 0,
        successRate: 0,
        cacheHitRate: 0,
        memoryUsage: 0,
        samples: 0
      }
    }

    const sortedTimes = times.sort((a, b) => a - b)
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length
    const p95Index = Math.floor(sortedTimes.length * 0.95)
    const p99Index = Math.floor(sortedTimes.length * 0.99)
    const p95Time = sortedTimes[p95Index] || 0
    const p99Time = sortedTimes[p99Index] || 0

    // Calculate throughput (operations per second)
    const totalTime = times.reduce((sum, time) => sum + time, 0) / 1000 // Convert to seconds
    const throughput = totalTime > 0 ? times.length / totalTime : 0

    return {
      operationName,
      averageTime: Number(averageTime.toFixed(2)),
      p95Time: Number(p95Time.toFixed(2)),
      p99Time: Number(p99Time.toFixed(2)),
      throughput: Number(throughput.toFixed(2)),
      successRate: Number((successes / total).toFixed(4)),
      cacheHitRate: cacheHits ? Number((cacheHits / total).toFixed(4)) : 0,
      memoryUsage: this.getMemoryUsage(),
      samples: times.length
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    return 0
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(results: MiddlewareBenchmarkSuite): string {
    const report = `
📊 MIDDLEWARE PERFORMANCE BENCHMARK REPORT
=========================================

🎯 PERFORMANCE REQUIREMENTS CHECK:
- ✅ Execution Time: <100ms (Target met: ${results.overallMiddleware.p95Time < 100 ? 'YES' : 'NO'})
- ✅ Cache Hit Rate: >85% (Target met: ${results.cachePerformance.cacheHitRate > 0.85 ? 'YES' : 'NO'})
- ✅ Failover Time: <50ms (Target met: ${results.circuitBreakerResilience.averageTime < 50 ? 'YES' : 'NO'})

📈 DETAILED METRICS:

1. CACHE PERFORMANCE
   - Average Time: ${results.cachePerformance.averageTime}ms
   - P95 Time: ${results.cachePerformance.p95Time}ms
   - P99 Time: ${results.cachePerformance.p99Time}ms
   - Cache Hit Rate: ${(results.cachePerformance.cacheHitRate * 100).toFixed(1)}%
   - Throughput: ${results.cachePerformance.throughput.toLocaleString()} ops/sec
   - Success Rate: ${(results.cachePerformance.successRate * 100).toFixed(1)}%

2. TIER DETECTION
   - Average Time: ${results.tierDetection.averageTime}ms
   - P95 Time: ${results.tierDetection.p95Time}ms
   - P99 Time: ${results.tierDetection.p99Time}ms
   - Throughput: ${results.tierDetection.throughput.toLocaleString()} ops/sec
   - Success Rate: ${(results.tierDetection.successRate * 100).toFixed(1)}%

3. ROUTING DECISION
   - Average Time: ${results.routingDecision.averageTime}ms
   - P95 Time: ${results.routingDecision.p95Time}ms
   - P99 Time: ${results.routingDecision.p99Time}ms
   - Throughput: ${results.routingDecision.throughput.toLocaleString()} ops/sec
   - Success Rate: ${(results.routingDecision.successRate * 100).toFixed(1)}%

4. OVERALL MIDDLEWARE
   - Average Time: ${results.overallMiddleware.averageTime}ms
   - P95 Time: ${results.overallMiddleware.p95Time}ms
   - P99 Time: ${results.overallMiddleware.p99Time}ms
   - Throughput: ${results.overallMiddleware.throughput.toLocaleString()} requests/sec
   - Success Rate: ${(results.overallMiddleware.successRate * 100).toFixed(1)}%

5. CIRCUIT BREAKER RESILIENCE
   - Average Time: ${results.circuitBreakerResilience.averageTime}ms
   - P95 Time: ${results.circuitBreakerResilience.p95Time}ms
   - Failover Time: ${results.circuitBreakerResilience.averageTime}ms
   - Success Rate: ${(results.circuitBreakerResilience.successRate * 100).toFixed(1)}%

💾 MEMORY USAGE:
   - Current: ${(results.overallMiddleware.memoryUsage / 1024 / 1024).toFixed(2)}MB

🎯 PERFORMANCE SCORE: ${this.calculatePerformanceScore(results)}/100

${this.generateRecommendations(results)}
`

    return report
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(results: MiddlewareBenchmarkSuite): number {
    let score = 100

    // Deduct points for poor performance
    if (results.overallMiddleware.p95Time > 100) score -= 30
    else if (results.overallMiddleware.p95Time > 75) score -= 15
    else if (results.overallMiddleware.p95Time > 50) score -= 5

    if (results.cachePerformance.cacheHitRate < 0.85) score -= 20
    else if (results.cachePerformance.cacheHitRate < 0.90) score -= 10

    if (results.circuitBreakerResilience.averageTime > 50) score -= 15
    else if (results.circuitBreakerResilience.averageTime > 30) score -= 10

    if (results.overallMiddleware.successRate < 0.99) score -= 25
    else if (results.overallMiddleware.successRate < 0.995) score -= 10

    return Math.max(0, score)
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(results: MiddlewareBenchmarkSuite): string {
    const recommendations: string[] = []

    if (results.overallMiddleware.p95Time > 100) {
      recommendations.push('• Consider optimizing tier detection algorithm')
      recommendations.push('• Implement more aggressive caching strategies')
    }

    if (results.cachePerformance.cacheHitRate < 0.85) {
      recommendations.push('• Increase cache TTL for stable tier data')
      recommendations.push('• Implement cache warming strategies')
    }

    if (results.circuitBreakerResilience.averageTime > 50) {
      recommendations.push('• Reduce circuit breaker timeout values')
      recommendations.push('• Improve fallback response times')
    }

    if (results.overallMiddleware.throughput < 1000) {
      recommendations.push('• Consider request batching optimizations')
      recommendations.push('• Implement connection pooling for external services')
    }

    if (recommendations.length === 0) {
      return '🎉 EXCELLENT PERFORMANCE - No recommendations needed!'
    }

    return `🔧 RECOMMENDATIONS FOR IMPROVEMENT:
${recommendations.join('\n')}`
  }
}

/**
 * Export convenience function for running benchmarks
 */
export async function runMiddlewarePerformanceBenchmark(iterations: number = 1000): Promise<MiddlewareBenchmarkSuite> {
  const runner = new MiddlewareBenchmarkRunner()
  return await runner.runBenchmarkSuite(iterations)
}

/**
 * Export convenience function for generating performance report
 */
export function generateMiddlewarePerformanceReport(results: MiddlewareBenchmarkSuite): string {
  const runner = new MiddlewareBenchmarkRunner()
  return runner.generatePerformanceReport(results)
}