import { EventTracker } from './EventTracker'
import { ABTestingService } from './ABTestingService'

interface HomepageEvent {
  type: 'page_view' | 'button_click' | 'section_view' | 'conversion'
  element?: string
  variant?: string
  duration?: number
  metadata?: Record<string, any>
}

interface ConversionMetrics {
  bounceRate: number
  timeOnPage: number
  trialSignupRate: number
  evaluationStartRate: number
  sectionEngagement: Record<string, number>
}

interface PerformanceMetrics {
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
}

export class HomepageAnalytics {
  private eventTracker: EventTracker
  private abTestingService: ABTestingService
  private sessionStartTime: number
  private performanceObserver: PerformanceObserver | null = null

  constructor(userId?: string) {
    this.eventTracker = new EventTracker(userId)
    this.abTestingService = new ABTestingService()
    this.sessionStartTime = Date.now()
    
    // Only setup performance tracking on client side
    if (typeof window !== 'undefined') {
      this.setupPerformanceTracking()
    }
  }

  // Track page view with experiment variant
  async trackPageView(variant?: string): Promise<void> {
    await this.eventTracker.track({
      eventType: 'page',
      eventName: 'homepage_view',
      properties: {
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        referrer: document.referrer || 'direct'
      },
      experimentVariant: variant
    })

    // Track Core Web Vitals
    this.trackCoreWebVitals()
  }

  // Track button clicks with conversion funnel
  async trackButtonClick(buttonType: 'cta_primary' | 'cta_secondary' | 'trust_signal', variant?: string): Promise<void> {
    await this.eventTracker.track({
      eventType: 'interaction',
      eventName: 'button_click',
      properties: {
        button_type: buttonType,
        timestamp: new Date(),
        scroll_position: window.scrollY,
        time_on_page: Date.now() - this.sessionStartTime
      },
      funnelStep: 'homepage_engagement',
      experimentVariant: variant
    })
  }

  // Track section visibility and engagement
  async trackSectionView(section: string, duration: number, variant?: string): Promise<void> {
    await this.eventTracker.track({
      eventType: 'engagement',
      eventName: 'section_view',
      properties: {
        section,
        duration_ms: duration,
        timestamp: new Date()
      },
      experimentVariant: variant
    })
  }

  // Track trial signup conversion
  async trackTrialSignup(variant?: string): Promise<void> {
    await this.eventTracker.track({
      eventType: 'conversion',
      eventName: 'trial_signup',
      properties: {
        conversion_time: Date.now() - this.sessionStartTime,
        timestamp: new Date()
      },
      funnelStep: 'trial_conversion',
      experimentVariant: variant
    })
  }

  // Track evaluation creation start
  async trackEvaluationStart(variant?: string): Promise<void> {
    await this.eventTracker.track({
      eventType: 'conversion',
      eventName: 'evaluation_start',
      properties: {
        conversion_time: Date.now() - this.sessionStartTime,
        timestamp: new Date()
      },
      funnelStep: 'evaluation_conversion',
      experimentVariant: variant
    })
  }

  // Get conversion metrics for analysis
  async getConversionMetrics(experimentId?: string): Promise<ConversionMetrics> {
    // This would integrate with the existing analytics API
    const response = await fetch('/api/analytics/homepage-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experimentId })
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch conversion metrics')
    }
    
    return response.json()
  }

  // A/B testing integration
  async getExperimentVariant(experimentName: string): Promise<string> {
    // Integration with existing ABTestingService
    try {
      const experiment = await this.abTestingService.getActiveExperiment(experimentName)
      if (experiment) {
        const variant = await this.abTestingService.assignUserToVariant(experiment.id)
        return variant.name
      }
    } catch (error) {
      console.warn('Failed to get experiment variant:', error)
    }
    return 'control'
  }

  // Performance tracking setup
  private setupPerformanceTracking(): void {
    if ('PerformanceObserver' in window) {
      // Track Largest Contentful Paint
      this.performanceObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.trackPerformanceMetric(entry)
        }
      })

      try {
        this.performanceObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error)
      }
    }

    // Track page load time
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        this.trackPageLoadPerformance(navigation)
      }, 0)
    })
  }

  // Track Core Web Vitals
  private trackCoreWebVitals(): void {
    // First Contentful Paint
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.eventTracker.track({
            eventType: 'performance',
            eventName: 'core_web_vital',
            properties: {
              metric: 'first_contentful_paint',
              value: entry.startTime,
              timestamp: new Date()
            }
          })
        }
      }
    })

    try {
      observer.observe({ entryTypes: ['paint'] })
    } catch (error) {
      console.warn('Paint observer not supported:', error)
    }
  }

  // Track individual performance metrics
  private async trackPerformanceMetric(entry: PerformanceEntry): Promise<void> {
    let metricName = ''
    let value = 0

    if (entry.entryType === 'largest-contentful-paint') {
      metricName = 'largest_contentful_paint'
      value = entry.startTime
    } else if (entry.entryType === 'first-input') {
      metricName = 'first_input_delay'
      value = (entry as PerformanceEventTiming).processingStart - entry.startTime
    } else if (entry.entryType === 'layout-shift') {
      metricName = 'cumulative_layout_shift'
      value = (entry as any).value
    }

    if (metricName) {
      await this.eventTracker.track({
        eventType: 'performance',
        eventName: 'core_web_vital',
        properties: {
          metric: metricName,
          value,
          timestamp: new Date()
        }
      })
    }
  }

  // Track page load performance
  private async trackPageLoadPerformance(navigation: PerformanceNavigationTiming): Promise<void> {
    const metrics: PerformanceMetrics = {
      pageLoadTime: navigation.loadEventEnd - navigation.navigationStart,
      firstContentfulPaint: 0, // Will be tracked separately
      largestContentfulPaint: 0, // Will be tracked separately  
      firstInputDelay: 0, // Will be tracked separately
      cumulativeLayoutShift: 0 // Will be tracked separately
    }

    await this.eventTracker.track({
      eventType: 'performance',
      eventName: 'page_load_complete',
      properties: {
        ...metrics,
        timestamp: new Date()
      }
    })
  }

  // Cleanup
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }
  }
}

// Export singleton instance (client-side only)
export const homepageAnalytics = typeof window !== 'undefined' ? new HomepageAnalytics() : null