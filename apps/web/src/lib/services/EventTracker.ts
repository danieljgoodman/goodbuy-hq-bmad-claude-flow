import { UserEvent, FunnelAnalysis, FeatureUsageData } from '@/types'

interface EventProperties {
  [key: string]: any
}

interface TrackEventParams {
  eventType: string
  eventName: string
  userId?: string
  properties?: EventProperties
  funnelStep?: string
  experimentVariant?: string
}

export class EventTracker {
  private sessionId: string
  private userId?: string
  private queue: Partial<UserEvent>[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor(userId?: string) {
    this.userId = userId
    this.sessionId = this.generateSessionId()
    this.startFlushTimer()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private startFlushTimer() {
    // Flush events every 5 seconds or when queue reaches 10 events
    this.flushInterval = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush()
      }
    }, 5000)
  }

  async track({
    eventType,
    eventName,
    userId,
    properties = {},
    funnelStep,
    experimentVariant
  }: TrackEventParams): Promise<void> {
    try {
      const event: Partial<UserEvent> = {
        userId: userId || this.userId,
        sessionId: this.sessionId,
        event_type: eventType,
        event_name: eventName,
        properties,
        page_url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        ip_address: await this.getClientIP(),
        timestamp: new Date(),
        funnel_step: funnelStep,
        experiment_variant: experimentVariant
      }

      this.queue.push(event)

      // Flush immediately for critical events or when queue is full
      if (eventType === 'conversion' || eventType === 'error' || this.queue.length >= 10) {
        await this.flush()
      }
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      // In real implementation, this would be determined server-side
      // For privacy, we should hash or anonymize the IP
      return 'anonymous'
    } catch {
      return 'unknown'
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return

    const events = [...this.queue]
    this.queue = []

    try {
      const response = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      // Silent fail for analytics - don't pollute console in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('Analytics tracking failed (non-critical):', error instanceof Error ? error.message : 'Unknown error')
      }
      
      // Re-queue events for retry (with limit to prevent infinite growth)
      if (this.queue.length < 50) {
        this.queue.unshift(...events)
      }
    }
  }

  // Convenience methods for common events
  async trackPageView(path: string, properties?: EventProperties): Promise<void> {
    await this.track({
      eventType: 'navigation',
      eventName: 'page_view',
      properties: { path, ...properties }
    })
  }

  async trackClick(element: string, properties?: EventProperties): Promise<void> {
    await this.track({
      eventType: 'interaction',
      eventName: 'click',
      properties: { element, ...properties }
    })
  }

  async trackFormSubmit(formName: string, properties?: EventProperties): Promise<void> {
    await this.track({
      eventType: 'interaction',
      eventName: 'form_submit',
      properties: { form_name: formName, ...properties }
    })
  }

  async trackFeatureUsage(feature: string, action: string, properties?: EventProperties): Promise<void> {
    await this.track({
      eventType: 'feature_usage',
      eventName: `${feature}_${action}`,
      properties: { feature, action, ...properties }
    })
  }

  async trackConversion(conversionType: string, value?: number, properties?: EventProperties): Promise<void> {
    await this.track({
      eventType: 'conversion',
      eventName: conversionType,
      properties: { value, ...properties }
    })
  }

  async trackError(errorType: string, message: string, properties?: EventProperties): Promise<void> {
    await this.track({
      eventType: 'error',
      eventName: errorType,
      properties: { message, stack: properties?.stack, ...properties }
    })
  }

  async trackFunnelStep(funnelName: string, step: string, stepIndex: number, properties?: EventProperties): Promise<void> {
    await this.track({
      eventType: 'funnel',
      eventName: `${funnelName}_step_${stepIndex}`,
      funnelStep: step,
      properties: { funnel_name: funnelName, step_index: stepIndex, ...properties }
    })
  }

  async trackSearchQuery(query: string, resultsCount: number, properties?: EventProperties): Promise<void> {
    await this.track({
      eventType: 'search',
      eventName: 'search_query',
      properties: { query, results_count: resultsCount, ...properties }
    })
  }

  async trackSessionStart(properties?: EventProperties): Promise<void> {
    await this.track({
      eventType: 'session',
      eventName: 'session_start',
      properties: { session_id: this.sessionId, ...properties }
    })
  }

  async trackSessionEnd(duration: number, properties?: EventProperties): Promise<void> {
    await this.track({
      eventType: 'session',
      eventName: 'session_end',
      properties: { session_id: this.sessionId, duration, ...properties }
    })
    
    // Final flush before ending
    await this.flush()
  }

  // Clean up resources
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    
    // Final flush
    this.flush().catch(console.error)
  }
}

// Singleton instance for global usage
let globalTracker: EventTracker | null = null

export function getEventTracker(userId?: string): EventTracker {
  if (!globalTracker || (userId && globalTracker['userId'] !== userId)) {
    if (globalTracker) {
      globalTracker.destroy()
    }
    globalTracker = new EventTracker(userId)
  }
  return globalTracker
}

// React hook for tracking
export function useEventTracker(userId?: string) {
  const tracker = getEventTracker(userId)
  
  return {
    track: tracker.track.bind(tracker),
    trackPageView: tracker.trackPageView.bind(tracker),
    trackClick: tracker.trackClick.bind(tracker),
    trackFormSubmit: tracker.trackFormSubmit.bind(tracker),
    trackFeatureUsage: tracker.trackFeatureUsage.bind(tracker),
    trackConversion: tracker.trackConversion.bind(tracker),
    trackError: tracker.trackError.bind(tracker),
    trackFunnelStep: tracker.trackFunnelStep.bind(tracker),
    trackSearchQuery: tracker.trackSearchQuery.bind(tracker)
  }
}

// Auto-tracking utilities
export function initializeAutoTracking(userId?: string): EventTracker {
  const tracker = getEventTracker(userId)
  
  if (typeof window !== 'undefined') {
    // Auto-track page views
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      tracker.trackPageView(window.location.pathname)
    }
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args)
      tracker.trackPageView(window.location.pathname)
    }
    
    window.addEventListener('popstate', () => {
      tracker.trackPageView(window.location.pathname)
    })
    
    // Auto-track session start
    tracker.trackSessionStart({
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
    
    // Track session end on page unload
    let sessionStartTime = Date.now()
    
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - sessionStartTime
      tracker.trackSessionEnd(sessionDuration)
    })
    
    // Auto-track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      
      // Track button clicks
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button')!
        tracker.trackClick('button', {
          button_text: button.textContent?.trim(),
          button_id: button.id,
          button_class: button.className
        })
      }
      
      // Track link clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target : target.closest('a')! as HTMLAnchorElement
        tracker.trackClick('link', {
          link_text: link.textContent?.trim(),
          link_url: link.href,
          link_id: link.id
        })
      }
    })
    
    // Auto-track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      tracker.trackFormSubmit(form.name || form.id || 'unnamed_form', {
        form_id: form.id,
        form_class: form.className,
        form_method: form.method,
        form_action: form.action
      })
    })
    
    // Auto-track JavaScript errors
    window.addEventListener('error', (event) => {
      tracker.trackError('javascript_error', event.message, {
        filename: event.filename,
        line_number: event.lineno,
        column_number: event.colno,
        stack: event.error?.stack
      })
    })
    
    // Auto-track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      tracker.trackError('unhandled_promise_rejection', event.reason?.toString() || 'Unknown promise rejection', {
        stack: event.reason?.stack
      })
    })
  }
  
  return tracker
}