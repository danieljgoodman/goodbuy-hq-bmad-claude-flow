import { useEffect, useState, useRef } from 'react'
import { homepageAnalytics } from '@/lib/services/HomepageAnalytics'

interface UseHomepageAnalyticsProps {
  experimentName?: string
  enableConsentTracking?: boolean
}

interface AnalyticsHook {
  variant: string
  trackPageView: () => void
  trackButtonClick: (buttonType: 'cta_primary' | 'cta_secondary' | 'trust_signal') => void
  trackSectionView: (section: string, duration: number) => void
  trackTrialSignup: () => void
  trackEvaluationStart: () => void
  isLoading: boolean
  hasConsent: boolean
  requestConsent: () => Promise<boolean>
}

export function useHomepageAnalytics({ 
  experimentName = 'homepage_v1',
  enableConsentTracking = true 
}: UseHomepageAnalyticsProps = {}): AnalyticsHook {
  const [variant, setVariant] = useState<string>('control')
  const [isLoading, setIsLoading] = useState(true)
  const [hasConsent, setHasConsent] = useState(false)
  const [sectionObservers] = useState(new Map<string, IntersectionObserver>())
  const sectionViewTimes = useRef(new Map<string, number>())

  // Check for existing consent or request new consent
  useEffect(() => {
    const checkConsent = async () => {
      if (!enableConsentTracking) {
        setHasConsent(true)
        setIsLoading(false)
        return
      }

      // Check localStorage for existing consent
      const existingConsent = localStorage.getItem('analytics_consent')
      if (existingConsent === 'true') {
        setHasConsent(true)
        setIsLoading(false)
        return
      }

      // If no consent, show consent banner or modal
      // For now, we'll default to requesting consent
      const consent = await requestConsent()
      setHasConsent(consent)
      setIsLoading(false)
    }

    checkConsent()
  }, [enableConsentTracking])

  // Get experiment variant
  useEffect(() => {
    const getVariant = async () => {
      if (!hasConsent || !homepageAnalytics) return

      try {
        const experimentVariant = await homepageAnalytics.getExperimentVariant(experimentName)
        setVariant(experimentVariant)
      } catch (error) {
        console.warn('Failed to get experiment variant:', error)
        setVariant('control')
      }
    }

    if (hasConsent && homepageAnalytics) {
      getVariant()
    }
  }, [experimentName, hasConsent])

  // Request user consent for analytics
  const requestConsent = async (): Promise<boolean> => {
    // Check if consent banner already exists to prevent duplicates
    if (document.getElementById('analytics-consent-banner')) {
      return new Promise((resolve) => {
        // Wait for existing banner to be resolved
        const checkExistingConsent = () => {
          const existingConsent = localStorage.getItem('analytics_consent')
          if (existingConsent) {
            resolve(existingConsent === 'true')
          } else {
            setTimeout(checkExistingConsent, 100)
          }
        }
        checkExistingConsent()
      })
    }

    return new Promise((resolve) => {
      // Create simple consent banner with unique ID
      const consentBanner = document.createElement('div')
      consentBanner.id = 'analytics-consent-banner'
      consentBanner.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #333;
        color: white;
        padding: 16px;
        z-index: 9999;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      `

      consentBanner.innerHTML = `
        <div style="flex: 1; min-width: 200px;">
          <p style="margin: 0; font-size: 14px;">
            We use analytics to improve your experience. 
            <a href="/privacy" style="color: #ccc;">Learn more</a>
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="analytics-accept" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          ">Accept</button>
          <button id="analytics-decline" style="
            background: transparent;
            color: #ccc;
            border: 1px solid #ccc;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          ">Decline</button>
        </div>
      `

      document.body.appendChild(consentBanner)

      const acceptButton = document.getElementById('analytics-accept')
      const declineButton = document.getElementById('analytics-decline')

      acceptButton?.addEventListener('click', () => {
        localStorage.setItem('analytics_consent', 'true')
        const banner = document.getElementById('analytics-consent-banner')
        if (banner) {
          document.body.removeChild(banner)
        }
        resolve(true)
      })

      declineButton?.addEventListener('click', () => {
        localStorage.setItem('analytics_consent', 'false')
        const banner = document.getElementById('analytics-consent-banner')
        if (banner) {
          document.body.removeChild(banner)
        }
        resolve(false)
      })
    })
  }

  // Track page view
  const trackPageView = () => {
    if (!hasConsent || !homepageAnalytics) return
    homepageAnalytics.trackPageView(variant)
  }

  // Track button clicks
  const trackButtonClick = (buttonType: 'cta_primary' | 'cta_secondary' | 'trust_signal') => {
    if (!hasConsent || !homepageAnalytics) return
    homepageAnalytics.trackButtonClick(buttonType, variant)
  }

  // Track section views with duration
  const trackSectionView = (section: string, duration: number) => {
    if (!hasConsent || !homepageAnalytics) return
    homepageAnalytics.trackSectionView(section, duration, variant)
  }

  // Track trial signup conversion
  const trackTrialSignup = () => {
    if (!hasConsent || !homepageAnalytics) return
    homepageAnalytics.trackTrialSignup(variant)
  }

  // Track evaluation start conversion
  const trackEvaluationStart = () => {
    if (!hasConsent || !homepageAnalytics) return
    homepageAnalytics.trackEvaluationStart(variant)
  }

  // Setup intersection observer for section tracking
  const setupSectionTracking = (sectionRef: HTMLElement, sectionName: string) => {
    if (!hasConsent || sectionObservers.has(sectionName)) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Section entered viewport
            sectionViewTimes.current.set(sectionName, Date.now())
          } else {
            // Section left viewport
            const startTime = sectionViewTimes.current.get(sectionName)
            if (startTime) {
              const duration = Date.now() - startTime
              if (duration > 1000) { // Only track if viewed for more than 1 second
                trackSectionView(sectionName, duration)
              }
              sectionViewTimes.current.delete(sectionName)
            }
          }
        })
      },
      { threshold: 0.5 } // Trigger when 50% of section is visible
    )

    observer.observe(sectionRef)
    sectionObservers.set(sectionName, observer)
  }

  // Cleanup observers on unmount
  useEffect(() => {
    return () => {
      sectionObservers.forEach(observer => observer.disconnect())
      sectionObservers.clear()
    }
  }, [sectionObservers])

  return {
    variant,
    trackPageView,
    trackButtonClick,
    trackSectionView,
    trackTrialSignup,
    trackEvaluationStart,
    isLoading,
    hasConsent,
    requestConsent
  }
}

// Hook for section tracking with intersection observer
// Note: This should be used in conjunction with useHomepageAnalytics, not separately
export function useSectionTracking(
  sectionName: string, 
  ref: React.RefObject<HTMLElement>, 
  trackSectionView: (section: string, duration: number) => void,
  hasConsent: boolean
) {
  const startTime = useRef<number | null>(null)

  useEffect(() => {
    if (!ref.current || !hasConsent) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startTime.current = Date.now()
          } else if (startTime.current) {
            const duration = Date.now() - startTime.current
            if (duration > 1000) { // Only track if viewed for more than 1 second
              trackSectionView(sectionName, duration)
            }
            startTime.current = null
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
      if (startTime.current) {
        const duration = Date.now() - startTime.current
        if (duration > 1000) {
          trackSectionView(sectionName, duration)
        }
      }
    }
  }, [ref, sectionName, trackSectionView, hasConsent])
}