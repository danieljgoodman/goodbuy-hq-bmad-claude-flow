/**
 * Lazy Loading Wrapper for Professional Questionnaire
 *
 * High-performance lazy loading with code splitting, dynamic imports,
 * and intelligent preloading for optimal user experience
 * Target: <3s load time with progressive enhancement
 */

"use client"

import React, { Suspense, lazy, useEffect, useState, useCallback } from 'react'
import { performanceMonitor, bundleOptimizer } from '@/lib/performance/questionnaire-optimizer'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle } from 'lucide-react'

// Loading states
interface LoadingState {
  isLoading: boolean
  hasError: boolean
  loadProgress: number
  errorMessage?: string
  estimatedTime?: number
}

// Component loading configuration
const COMPONENT_CONFIG = {
  preloadDelay: 100, // Preload after 100ms
  visibilityThreshold: 0.1, // Load when 10% visible
  retryAttempts: 3,
  retryDelay: 1000,
  progressUpdateInterval: 50
}

// Lazy-loaded components with error boundaries
const LazyFinancialSection = lazy(() =>
  bundleOptimizer.loadComponent(() =>
    import('./financial-section').then(module => ({ default: module.FinancialSection }))
  )
)

const LazyCustomerRiskSection = lazy(() =>
  bundleOptimizer.loadComponent(() =>
    import('./customer-risk-section').then(module => ({ default: module.CustomerRiskSection }))
  )
)

const LazyOperationalStrategicSection = lazy(() =>
  bundleOptimizer.loadComponent(() =>
    import('./operational-strategic-section').then(module => ({ default: module.OperationalStrategicSection }))
  )
)

const LazyCompetitiveMarketSection = lazy(() =>
  bundleOptimizer.loadComponent(() =>
    import('./competitive-market-section').then(module => ({ default: module.CompetitiveMarketSection }))
  )
)

const LazyValueEnhancementSection = lazy(() =>
  bundleOptimizer.loadComponent(() =>
    import('./value-enhancement-section').then(module => ({ default: module.ValueEnhancementSection }))
  )
)

// Enhanced loading skeleton with progress
const EnhancedSkeleton: React.FC<{
  title: string
  progress: number
  estimatedTime?: number
  hasError?: boolean
}> = ({ title, progress, estimatedTime, hasError }) => (
  <Card className="w-full border-2 border-dashed border-gray-300">
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          {hasError ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Loading {title}...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          {estimatedTime && (
            <p className="text-xs text-gray-500">
              Estimated time remaining: {Math.ceil(estimatedTime / 1000)}s
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
)

// Intersection Observer Hook for lazy loading
const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!elementRef) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback()
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: COMPONENT_CONFIG.visibilityThreshold, ...options })

    observer.observe(elementRef)

    return () => observer.disconnect()
  }, [elementRef, callback])

  return setElementRef
}

// Enhanced loading hook with progress tracking
const useEnhancedLoading = (componentName: string) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    hasError: false,
    loadProgress: 0,
    estimatedTime: 3000 // 3 second initial estimate
  })

  const startLoading = useCallback(() => {
    setLoadingState(prev => ({ ...prev, isLoading: true, hasError: false }))
    performanceMonitor.startTimer(`lazy-load-${componentName}`)

    // Simulate progressive loading with realistic progress updates
    let progress = 0
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15 + 5 // Increase by 5-20% each step

      if (progress >= 95) {
        clearInterval(progressInterval)
        progress = 95 // Leave 5% for actual loading completion
      }

      setLoadingState(prev => ({
        ...prev,
        loadProgress: Math.min(progress, 95),
        estimatedTime: Math.max(0, prev.estimatedTime! - COMPONENT_CONFIG.progressUpdateInterval)
      }))
    }, COMPONENT_CONFIG.progressUpdateInterval)

    return () => clearInterval(progressInterval)
  }, [componentName])

  const completeLoading = useCallback(() => {
    const loadTime = performanceMonitor.endTimer(`lazy-load-${componentName}`)

    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      loadProgress: 100,
      estimatedTime: 0
    }))

    // Record performance metrics
    performanceMonitor.recordMetric(`lazy-${componentName}`, { loadTime })

    // Warn if loading exceeds targets
    if (loadTime > 3000) {
      console.warn(`Component ${componentName} loaded in ${loadTime}ms, exceeding 3s target`)
    }
  }, [componentName])

  const handleError = useCallback((error: Error) => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      hasError: true,
      errorMessage: error.message
    }))

    console.error(`Failed to load component ${componentName}:`, error)
  }, [componentName])

  return {
    loadingState,
    startLoading,
    completeLoading,
    handleError
  }
}

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <this.props.fallback error={this.state.error!} />
    }

    return this.props.children
  }
}

// Error fallback component
const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <Card className="border-red-200 bg-red-50">
    <CardContent className="p-6">
      <div className="flex items-center gap-2 text-red-600 mb-2">
        <AlertCircle className="h-5 w-5" />
        <h3 className="font-medium">Failed to load component</h3>
      </div>
      <p className="text-sm text-red-700 mb-4">{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </CardContent>
  </Card>
)

// Main lazy loader component
interface LazyLoaderProps {
  section: 'financial' | 'customer' | 'operational' | 'competitive' | 'value'
  data: any
  onChange: (data: any) => void
  errors?: Record<string, string>
  preload?: boolean
  priority?: 'high' | 'medium' | 'low'
}

export const LazyLoader: React.FC<LazyLoaderProps> = ({
  section,
  data,
  onChange,
  errors,
  preload = false,
  priority = 'medium'
}) => {
  const [shouldLoad, setShouldLoad] = useState(preload)
  const { loadingState, startLoading, completeLoading, handleError } = useEnhancedLoading(section)

  // Component mapping
  const componentMap = {
    financial: LazyFinancialSection,
    customer: LazyCustomerRiskSection,
    operational: LazyOperationalStrategicSection,
    competitive: LazyCompetitiveMarketSection,
    value: LazyValueEnhancementSection
  }

  const sectionTitles = {
    financial: 'Enhanced Financial Metrics',
    customer: 'Customer Analytics & Risk',
    operational: 'Operational & Strategic',
    competitive: 'Competitive Market Analysis',
    value: 'Value Enhancement Opportunities'
  }

  const Component = componentMap[section]
  const title = sectionTitles[section]

  // Intersection observer for lazy loading
  const elementRef = useIntersectionObserver(() => {
    if (!shouldLoad) {
      setShouldLoad(true)
      startLoading()
    }
  })

  // Preloading logic
  useEffect(() => {
    if (preload || priority === 'high') {
      const timer = setTimeout(() => {
        setShouldLoad(true)
        startLoading()
      }, COMPONENT_CONFIG.preloadDelay)

      return () => clearTimeout(timer)
    }
  }, [preload, priority, startLoading])

  // Handle loading completion
  useEffect(() => {
    if (shouldLoad && !loadingState.isLoading) {
      completeLoading()
    }
  }, [shouldLoad, loadingState.isLoading, completeLoading])

  if (!shouldLoad) {
    return (
      <div ref={elementRef} className="min-h-[400px]">
        <EnhancedSkeleton
          title={title}
          progress={0}
          hasError={false}
        />
      </div>
    )
  }

  return (
    <LazyErrorBoundary fallback={ErrorFallback}>
      <Suspense
        fallback={
          <EnhancedSkeleton
            title={title}
            progress={loadingState.loadProgress}
            estimatedTime={loadingState.estimatedTime}
            hasError={loadingState.hasError}
          />
        }
      >
        <Component
          data={data}
          onChange={onChange}
          errors={errors}
        />
      </Suspense>
    </LazyErrorBoundary>
  )
}

// Preloader utility for critical components
export const useComponentPreloader = () => {
  const preloadAll = useCallback(() => {
    performanceMonitor.startTimer('preload-all')

    // Preload all questionnaire components
    const preloadPromises = [
      import('./financial-section'),
      import('./customer-risk-section'),
      import('./operational-strategic-section'),
      import('./competitive-market-section'),
      import('./value-enhancement-section')
    ]

    Promise.all(preloadPromises)
      .then(() => {
        const preloadTime = performanceMonitor.endTimer('preload-all')
        performanceMonitor.recordMetric('preload-all', { loadTime: preloadTime })
        console.log(`All components preloaded in ${preloadTime}ms`)
      })
      .catch((error) => {
        console.error('Preloading failed:', error)
      })
  }, [])

  const preloadCritical = useCallback(() => {
    // Preload only the most important components first
    import('./financial-section')
    import('./customer-risk-section')
  }, [])

  return { preloadAll, preloadCritical }
}

export default LazyLoader