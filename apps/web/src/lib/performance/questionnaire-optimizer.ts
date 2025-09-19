'use client'

/**
 * Questionnaire Performance Optimizer
 *
 * Comprehensive performance utilities for the Professional tier questionnaire
 * Implements memoization, calculation optimization, and performance monitoring
 * Target: <3s load time, <30s save time for 45 fields
 */

import { useMemo, useCallback, useRef, useEffect } from 'react'
import debounce from 'lodash.debounce'
import { ProfessionalTierData } from '@/types/evaluation'

// Performance monitoring utilities
export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  saveTime: number
  fieldCount: number
  memoryUsage: number
  bundleSize: number
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private startTimes: Map<string, number> = new Map()

  startTimer(operation: string): void {
    this.startTimes.set(operation, performance.now())
  }

  endTimer(operation: string): number {
    const startTime = this.startTimes.get(operation)
    if (!startTime) return 0

    const duration = performance.now() - startTime
    this.startTimes.delete(operation)
    return duration
  }

  recordMetric(key: string, metrics: Partial<PerformanceMetrics>): void {
    const existing = this.metrics.get(key) || {
      loadTime: 0,
      renderTime: 0,
      saveTime: 0,
      fieldCount: 0,
      memoryUsage: 0,
      bundleSize: 0
    }

    this.metrics.set(key, { ...existing, ...metrics })
  }

  getMetrics(key: string): PerformanceMetrics | undefined {
    return this.metrics.get(key)
  }

  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics)
  }

  // Memory usage estimation
  estimateMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    return 0
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Memoization utilities for expensive calculations
export const useMemoizedCalculations = () => {
  const calculateFinancialRatios = useMemo(() => {
    return (data: ProfessionalTierData['financialMetrics']) => {
      // Memoized financial ratio calculations
      const profitMargin = data.annualRevenue > 0 ? (data.netProfit / data.annualRevenue) * 100 : 0
      const debtServiceCoverage = data.ebitda > 0 ? data.ebitda / (data.expenses * 0.1) : 0
      const returnOnAssets = data.netProfit / Math.max(data.workingCapital * 4, 1)
      const operatingMargin = data.annualRevenue > 0 ? (data.ebitda / data.annualRevenue) * 100 : 0

      return {
        profitMargin,
        debtServiceCoverage,
        returnOnAssets,
        operatingMargin,
        efficiency: Math.min(100, (profitMargin + operatingMargin) / 2)
      }
    }
  }, [])

  const calculateCustomerMetrics = useMemo(() => {
    return (data: ProfessionalTierData['customerAnalytics']) => {
      // Memoized customer analytics calculations
      const ltv = data.customerLifetimeValue
      const cac = data.customerAcquisitionCost
      const ltvCacRatio = cac > 0 ? ltv / cac : 0
      const paybackPeriod = data.averageOrderValue > 0 ? cac / data.averageOrderValue : 0

      return {
        ltvCacRatio,
        paybackPeriod,
        customerValue: ltv * data.monthlyActiveUsers,
        growthEfficiency: Math.min(100, ltvCacRatio * 10)
      }
    }
  }, [])

  const calculateValuationMetrics = useMemo(() => {
    return (
      financial: ProfessionalTierData['financialMetrics'],
      customer: ProfessionalTierData['customerAnalytics'],
      operational: ProfessionalTierData['operationalEfficiency']
    ) => {
      // Comprehensive valuation calculations
      const revenueMultiple = financial.ebitda > 0 ? financial.annualRevenue / financial.ebitda : 0
      const ebitdaMultiple = 8.5 // Industry average, could be dynamic
      const dcfBased = financial.cashFlow * 10 // Simplified DCF

      const assetBased = Math.max(0, financial.workingCapital * 1.2)
      const marketBased = financial.annualRevenue * revenueMultiple
      const incomeBased = financial.ebitda * ebitdaMultiple

      const weighted = (assetBased * 0.2) + (marketBased * 0.3) + (incomeBased * 0.5)

      return {
        assetBased,
        marketBased,
        incomeBased,
        dcfBased,
        weighted,
        confidence: Math.min(100, (operational.employeeProductivity + operational.capacityUtilization) / 2)
      }
    }
  }, [])

  return {
    calculateFinancialRatios,
    calculateCustomerMetrics,
    calculateValuationMetrics
  }
}

// Optimized form state management with debouncing
export const useOptimizedFormState = <T extends Record<string, any>>(
  initialData: T,
  onSave: (data: T) => Promise<void>,
  debounceMs: number = 1000
) => {
  const [data, setData] = useState<T>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (dataToSave: T) => {
      setIsSaving(true)
      performanceMonitor.startTimer('save-operation')

      try {
        await onSave(dataToSave)
        setLastSaved(new Date())

        const saveTime = performanceMonitor.endTimer('save-operation')
        performanceMonitor.recordMetric('questionnaire-save', { saveTime })

        // Alert if save time exceeds target
        if (saveTime > 30000) {
          console.warn(`Save operation took ${saveTime}ms, exceeding 30s target`)
        }
      } catch (error) {
        console.error('Save failed:', error)
      } finally {
        setIsSaving(false)
      }
    }, debounceMs),
    [onSave, debounceMs]
  )

  // Optimized update function with shallow comparison
  const updateData = useCallback((updates: Partial<T>) => {
    setData(prev => {
      const newData = { ...prev, ...updates }

      // Only trigger save if data actually changed
      const hasChanges = Object.keys(updates).some(key => prev[key] !== newData[key])
      if (hasChanges) {
        debouncedSave(newData)
      }

      return newData
    })
  }, [debouncedSave])

  // Immediate save function for critical operations
  const saveImmediately = useCallback(async () => {
    debouncedSave.cancel()
    setIsSaving(true)

    try {
      await onSave(data)
      setLastSaved(new Date())
    } finally {
      setIsSaving(false)
    }
  }, [data, onSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel()
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [debouncedSave])

  return {
    data,
    updateData,
    saveImmediately,
    isLoading,
    isSaving,
    lastSaved
  }
}

// Bundle size optimization utilities
export const bundleOptimizer = {
  // Dynamic import with error handling
  loadComponent: async <T>(importFn: () => Promise<T>): Promise<T> => {
    performanceMonitor.startTimer('component-load')

    try {
      const component = await importFn()
      const loadTime = performanceMonitor.endTimer('component-load')

      performanceMonitor.recordMetric('dynamic-import', { loadTime })
      return component
    } catch (error) {
      console.error('Dynamic import failed:', error)
      throw error
    }
  },

  // Preload critical components
  preloadComponents: () => {
    if (typeof window !== 'undefined') {
      // Preload questionnaire sections
      import('@/components/questionnaire/professional/financial-section')
      import('@/components/questionnaire/professional/customer-risk-section')
      import('@/components/questionnaire/professional/operational-strategic-section')
    }
  },

  // Code splitting utilities
  lazy: <T extends React.ComponentType<any>>(importFn: () => Promise<{ default: T }>) => {
    return React.lazy(() => {
      performanceMonitor.startTimer('lazy-load')

      return importFn().then(module => {
        const loadTime = performanceMonitor.endTimer('lazy-load')
        performanceMonitor.recordMetric('lazy-component', { loadTime })
        return module
      })
    })
  }
}

// Field-level performance optimization
export const useFieldOptimization = () => {
  const [fieldMetrics, setFieldMetrics] = useState<Map<string, number>>(new Map())

  const trackFieldPerformance = useCallback((fieldName: string, renderTime: number) => {
    setFieldMetrics(prev => new Map(prev.set(fieldName, renderTime)))
  }, [])

  const optimizeFieldOrder = useCallback((fields: Array<{ name: string; priority: number }>) => {
    // Sort fields by performance metrics and priority
    return fields.sort((a, b) => {
      const aTime = fieldMetrics.get(a.name) || 0
      const bTime = fieldMetrics.get(b.name) || 0

      // Prioritize faster-rendering fields and higher priority
      return (aTime - bTime) + (b.priority - a.priority) * 10
    })
  }, [fieldMetrics])

  return {
    trackFieldPerformance,
    optimizeFieldOrder,
    fieldMetrics
  }
}

// Performance benchmark utilities
export const performanceBenchmarks = {
  // Target benchmarks
  targets: {
    loadTime: 3000, // 3 seconds
    saveTime: 30000, // 30 seconds
    renderTime: 100, // 100ms per field
    bundleSize: 500, // 500KB
    memoryUsage: 50 // 50MB
  },

  // Check if metrics meet targets
  checkBenchmarks: (metrics: PerformanceMetrics): Record<string, boolean> => {
    return {
      loadTime: metrics.loadTime <= performanceBenchmarks.targets.loadTime,
      saveTime: metrics.saveTime <= performanceBenchmarks.targets.saveTime,
      renderTime: metrics.renderTime <= performanceBenchmarks.targets.renderTime,
      bundleSize: metrics.bundleSize <= performanceBenchmarks.targets.bundleSize,
      memoryUsage: metrics.memoryUsage <= performanceBenchmarks.targets.memoryUsage
    }
  },

  // Generate performance report
  generateReport: (metrics: Map<string, PerformanceMetrics>): string => {
    const reports: string[] = []

    metrics.forEach((metric, key) => {
      const benchmarks = performanceBenchmarks.checkBenchmarks(metric)
      const passing = Object.values(benchmarks).filter(Boolean).length
      const total = Object.keys(benchmarks).length

      reports.push(`${key}: ${passing}/${total} benchmarks passing`)
    })

    return reports.join('\n')
  }
}

// React performance hooks
export const usePerformanceOptimization = () => {
  const renderCountRef = useRef(0)
  const lastRenderTime = useRef(performance.now())

  useEffect(() => {
    renderCountRef.current++
    const currentTime = performance.now()
    const renderTime = currentTime - lastRenderTime.current
    lastRenderTime.current = currentTime

    if (renderTime > 100) {
      console.warn(`Slow render detected: ${renderTime}ms`)
    }
  })

  const optimizedCallback = useCallback((fn: Function) => {
    return (...args: any[]) => {
      const start = performance.now()
      const result = fn(...args)
      const duration = performance.now() - start

      if (duration > 10) {
        console.warn(`Slow callback execution: ${duration}ms`)
      }

      return result
    }
  }, [])

  return {
    renderCount: renderCountRef.current,
    optimizedCallback
  }
}

// Export all utilities
export default {
  performanceMonitor,
  useMemoizedCalculations,
  useOptimizedFormState,
  bundleOptimizer,
  useFieldOptimization,
  performanceBenchmarks,
  usePerformanceOptimization
}