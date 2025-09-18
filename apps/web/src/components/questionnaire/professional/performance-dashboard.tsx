/**
 * Performance Dashboard for Professional Questionnaire
 *
 * Real-time performance monitoring, metrics visualization,
 * and optimization recommendations for form performance
 */

"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  Zap,
  Clock,
  HardDrive,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Settings,
  RefreshCw
} from 'lucide-react'
import {
  performanceMonitor,
  performanceBenchmarks,
  PerformanceMetrics
} from '@/lib/performance/questionnaire-optimizer'
import { useOptimizedForm } from './optimized-form-state'

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  excellent: 90,
  good: 70,
  fair: 50,
  poor: 0
}

// Performance level type
type PerformanceLevel = 'excellent' | 'good' | 'fair' | 'poor'

// Get performance level
const getPerformanceLevel = (score: number): PerformanceLevel => {
  if (score >= PERFORMANCE_THRESHOLDS.excellent) return 'excellent'
  if (score >= PERFORMANCE_THRESHOLDS.good) return 'good'
  if (score >= PERFORMANCE_THRESHOLDS.fair) return 'fair'
  return 'poor'
}

// Performance level colors
const LEVEL_COLORS = {
  excellent: 'bg-green-500',
  good: 'bg-blue-500',
  fair: 'bg-yellow-500',
  poor: 'bg-red-500'
}

// Performance level text colors
const LEVEL_TEXT_COLORS = {
  excellent: 'text-green-700',
  good: 'text-blue-700',
  fair: 'text-yellow-700',
  poor: 'text-red-700'
}

// Metric card component
const MetricCard: React.FC<{
  title: string
  value: string | number
  target: string | number
  unit?: string
  icon: React.ReactNode
  level: PerformanceLevel
  description: string
}> = ({ title, value, target, unit = '', icon, level, description }) => (
  <Card className="relative overflow-hidden">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Target: {target}{unit}</span>
          <Badge variant="outline" className={LEVEL_TEXT_COLORS[level]}>
            {level}
          </Badge>
        </div>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
      <div className={`absolute bottom-0 left-0 h-1 w-full ${LEVEL_COLORS[level]}`} />
    </CardContent>
  </Card>
)

// Recommendations component
const PerformanceRecommendations: React.FC<{ metrics: PerformanceMetrics }> = ({ metrics }) => {
  const recommendations = useMemo(() => {
    const items: Array<{ type: 'warning' | 'info' | 'success'; message: string }> = []

    // Load time recommendations
    if (metrics.loadTime > 3000) {
      items.push({
        type: 'warning',
        message: 'Consider enabling component preloading to reduce load time'
      })
    }

    // Save time recommendations
    if (metrics.saveTime > 30000) {
      items.push({
        type: 'warning',
        message: 'Save time exceeds target. Enable debounced saving and field-level validation'
      })
    }

    // Memory recommendations
    if (metrics.memoryUsage > 50) {
      items.push({
        type: 'warning',
        message: 'High memory usage detected. Consider implementing virtual scrolling'
      })
    }

    // Bundle size recommendations
    if (metrics.bundleSize > 500) {
      items.push({
        type: 'warning',
        message: 'Large bundle size. Implement code splitting and tree shaking'
      })
    }

    // Positive feedback
    if (metrics.loadTime <= 3000 && metrics.saveTime <= 30000) {
      items.push({
        type: 'success',
        message: 'Performance targets met! Consider further optimizations for exceptional UX'
      })
    }

    return items
  }, [metrics])

  if (recommendations.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">All performance targets met</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {recommendations.map((rec, index) => (
        <div key={index} className={`flex items-start gap-2 text-sm p-2 rounded ${
          rec.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
          rec.type === 'success' ? 'bg-green-50 text-green-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {rec.type === 'warning' && <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
          {rec.type === 'success' && <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
          {rec.type === 'info' && <Activity className="h-4 w-4 mt-0.5 flex-shrink-0" />}
          <span>{rec.message}</span>
        </div>
      ))}
    </div>
  )
}

// Real-time metrics hook
const useRealTimeMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    saveTime: 0,
    fieldCount: 45,
    memoryUsage: 0,
    bundleSize: 0
  })

  const [isCollecting, setIsCollecting] = useState(false)

  useEffect(() => {
    const updateMetrics = () => {
      const allMetrics = performanceMonitor.getAllMetrics()
      let aggregated: PerformanceMetrics = {
        loadTime: 0,
        renderTime: 0,
        saveTime: 0,
        fieldCount: 45,
        memoryUsage: performanceMonitor.estimateMemoryUsage(),
        bundleSize: 0
      }

      // Aggregate metrics from all components
      allMetrics.forEach((metric) => {
        aggregated.loadTime = Math.max(aggregated.loadTime, metric.loadTime)
        aggregated.renderTime = Math.max(aggregated.renderTime, metric.renderTime)
        aggregated.saveTime = Math.max(aggregated.saveTime, metric.saveTime)
        aggregated.bundleSize += metric.bundleSize
      })

      setMetrics(aggregated)
    }

    // Update metrics every second when collecting
    let interval: NodeJS.Timeout
    if (isCollecting) {
      interval = setInterval(updateMetrics, 1000)
      updateMetrics() // Initial update
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isCollecting])

  const startCollecting = () => setIsCollecting(true)
  const stopCollecting = () => setIsCollecting(false)
  const refreshMetrics = () => {
    const allMetrics = performanceMonitor.getAllMetrics()
    let aggregated: PerformanceMetrics = {
      loadTime: 0,
      renderTime: 0,
      saveTime: 0,
      fieldCount: 45,
      memoryUsage: performanceMonitor.estimateMemoryUsage(),
      bundleSize: 0
    }

    allMetrics.forEach((metric) => {
      aggregated.loadTime = Math.max(aggregated.loadTime, metric.loadTime)
      aggregated.renderTime = Math.max(aggregated.renderTime, metric.renderTime)
      aggregated.saveTime = Math.max(aggregated.saveTime, metric.saveTime)
      aggregated.bundleSize += metric.bundleSize
    })

    setMetrics(aggregated)
  }

  return {
    metrics,
    isCollecting,
    startCollecting,
    stopCollecting,
    refreshMetrics
  }
}

// Main dashboard component
export const PerformanceDashboard: React.FC<{
  className?: string
  compact?: boolean
}> = ({ className = '', compact = false }) => {
  const { performance } = useOptimizedForm()
  const {
    metrics,
    isCollecting,
    startCollecting,
    stopCollecting,
    refreshMetrics
  } = useRealTimeMetrics()

  // Calculate overall performance score
  const overallScore = useMemo(() => {
    const benchmarks = performanceBenchmarks.checkBenchmarks(metrics)
    const passingCount = Object.values(benchmarks).filter(Boolean).length
    return Math.round((passingCount / Object.keys(benchmarks).length) * 100)
  }, [metrics])

  const performanceLevel = getPerformanceLevel(overallScore)

  if (compact) {
    return (
      <div className={`flex items-center gap-4 p-3 bg-gray-50 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${LEVEL_COLORS[performanceLevel]}`} />
          <span className="text-sm font-medium">Performance: {overallScore}%</span>
        </div>
        <div className="text-xs text-gray-600">
          Load: {metrics.loadTime.toFixed(0)}ms | Save: {(metrics.saveTime / 1000).toFixed(1)}s
        </div>
        <Button size="sm" variant="outline" onClick={refreshMetrics}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-gray-600">Real-time questionnaire performance monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isCollecting ? "destructive" : "default"}
            onClick={isCollecting ? stopCollecting : startCollecting}
          >
            {isCollecting ? "Stop" : "Start"} Monitoring
          </Button>
          <Button variant="outline" onClick={refreshMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Overall Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">{overallScore}%</div>
              <div className="flex-1">
                <Progress value={overallScore} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span>
                  <span>Fair</span>
                  <span>Good</span>
                  <span>Excellent</span>
                </div>
              </div>
              <Badge variant="outline" className={LEVEL_TEXT_COLORS[performanceLevel]}>
                {performanceLevel.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Based on load time, save performance, memory usage, and bundle optimization
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Load Time"
          value={metrics.loadTime.toFixed(0)}
          target="3000"
          unit="ms"
          icon={<Clock className="h-4 w-4" />}
          level={getPerformanceLevel(metrics.loadTime <= 3000 ? 100 : 0)}
          description="Time to load and render questionnaire"
        />

        <MetricCard
          title="Save Time"
          value={(metrics.saveTime / 1000).toFixed(1)}
          target="30"
          unit="s"
          icon={<HardDrive className="h-4 w-4" />}
          level={getPerformanceLevel(metrics.saveTime <= 30000 ? 100 : 0)}
          description="Time to save all 45 form fields"
        />

        <MetricCard
          title="Memory Usage"
          value={metrics.memoryUsage.toFixed(1)}
          target="50"
          unit="MB"
          icon={<Activity className="h-4 w-4" />}
          level={getPerformanceLevel(metrics.memoryUsage <= 50 ? 100 : 0)}
          description="Current JavaScript heap usage"
        />

        <MetricCard
          title="Bundle Size"
          value={(metrics.bundleSize / 1024).toFixed(1)}
          target="500"
          unit="KB"
          icon={<Zap className="h-4 w-4" />}
          level={getPerformanceLevel(metrics.bundleSize <= 500 * 1024 ? 100 : 0)}
          description="Total loaded JavaScript bundle"
        />
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Performance Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceRecommendations metrics={metrics} />
        </CardContent>
      </Card>

      {/* Real-time Status */}
      {isCollecting && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="font-medium">Real-time monitoring active</span>
              <span className="text-sm text-blue-600">
                Collecting performance data every second
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PerformanceDashboard