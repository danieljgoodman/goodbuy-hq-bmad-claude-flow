import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { experimentId, dateRange } = await request.json()
    
    const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const endDate = dateRange?.end ? new Date(dateRange.end) : new Date()

    // Get homepage events
    const events = await prisma.userEvent.findMany({
      where: {
        eventType: {
          in: ['page', 'interaction', 'engagement', 'conversion', 'performance']
        },
        eventName: {
          in: ['homepage_view', 'button_click', 'section_view', 'trial_signup', 'evaluation_start', 'core_web_vital', 'page_load_complete']
        },
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        ...(experimentId && { experimentVariant: { not: null } })
      },
      include: {
        user: true
      }
    })

    // Calculate conversion metrics
    const pageViews = events.filter(e => e.eventName === 'homepage_view').length
    const trialSignups = events.filter(e => e.eventName === 'trial_signup').length
    const evaluationStarts = events.filter(e => e.eventName === 'evaluation_start').length
    const buttonClicks = events.filter(e => e.eventName === 'button_click').length

    // Calculate bounce rate (sessions with only 1 page view)
    const sessionEvents = new Map<string, any[]>()
    events.forEach(event => {
      const sessionId = event.sessionId || 'unknown'
      if (!sessionEvents.has(sessionId)) {
        sessionEvents.set(sessionId, [])
      }
      sessionEvents.get(sessionId)!.push(event)
    })

    const bouncedSessions = Array.from(sessionEvents.values()).filter(sessionEvts => 
      sessionEvts.filter(e => e.eventType === 'page' || e.eventType === 'interaction').length <= 1
    ).length

    const bounceRate = sessionEvents.size > 0 ? (bouncedSessions / sessionEvents.size) * 100 : 0

    // Calculate average time on page
    const timeOnPageEvents = events.filter(e => e.properties && e.properties.time_on_page)
    const avgTimeOnPage = timeOnPageEvents.length > 0 
      ? timeOnPageEvents.reduce((sum, e) => sum + (e.properties?.time_on_page || 0), 0) / timeOnPageEvents.length
      : 0

    // Calculate conversion rates
    const trialSignupRate = pageViews > 0 ? (trialSignups / pageViews) * 100 : 0
    const evaluationStartRate = trialSignups > 0 ? (evaluationStarts / trialSignups) * 100 : 0

    // Calculate section engagement
    const sectionViews = events.filter(e => e.eventName === 'section_view')
    const sectionEngagement: Record<string, number> = {}
    
    sectionViews.forEach(event => {
      const section = event.properties?.section
      if (section) {
        sectionEngagement[section] = (sectionEngagement[section] || 0) + 1
      }
    })

    // Calculate performance metrics
    const performanceEvents = events.filter(e => e.eventType === 'performance')
    const avgPageLoadTime = performanceEvents
      .filter(e => e.eventName === 'page_load_complete')
      .reduce((sum, e) => sum + (e.properties?.pageLoadTime || 0), 0) / 
      Math.max(1, performanceEvents.filter(e => e.eventName === 'page_load_complete').length)

    const coreWebVitals = {
      firstContentfulPaint: calculateAverage(performanceEvents, 'first_contentful_paint'),
      largestContentfulPaint: calculateAverage(performanceEvents, 'largest_contentful_paint'),
      firstInputDelay: calculateAverage(performanceEvents, 'first_input_delay'),
      cumulativeLayoutShift: calculateAverage(performanceEvents, 'cumulative_layout_shift')
    }

    // A/B testing metrics (if experiment specified)
    let experimentMetrics = null
    if (experimentId) {
      const variants = new Map<string, any>()
      
      events.forEach(event => {
        const variant = event.experimentVariant || 'control'
        if (!variants.has(variant)) {
          variants.set(variant, {
            pageViews: 0,
            conversions: 0,
            buttonClicks: 0,
            avgTimeOnPage: 0,
            timeOnPageEvents: []
          })
        }
        
        const variantData = variants.get(variant)
        if (event.eventName === 'homepage_view') variantData.pageViews++
        if (event.eventName === 'trial_signup') variantData.conversions++
        if (event.eventName === 'button_click') variantData.buttonClicks++
        if (event.properties?.time_on_page) {
          variantData.timeOnPageEvents.push(event.properties.time_on_page)
        }
      })

      // Calculate variant metrics
      experimentMetrics = Object.fromEntries(
        Array.from(variants.entries()).map(([variant, data]) => [
          variant,
          {
            pageViews: data.pageViews,
            conversions: data.conversions,
            conversionRate: data.pageViews > 0 ? (data.conversions / data.pageViews) * 100 : 0,
            buttonClicks: data.buttonClicks,
            avgTimeOnPage: data.timeOnPageEvents.length > 0 
              ? data.timeOnPageEvents.reduce((a: number, b: number) => a + b, 0) / data.timeOnPageEvents.length 
              : 0
          }
        ])
      )

      // Calculate statistical significance if control and variant exist
      if (variants.has('control') && variants.size > 1) {
        const control = variants.get('control')
        const controlRate = control.pageViews > 0 ? control.conversions / control.pageViews : 0
        
        Array.from(variants.keys()).forEach(variantName => {
          if (variantName !== 'control') {
            const variant = variants.get(variantName)
            const variantRate = variant.pageViews > 0 ? variant.conversions / variant.pageViews : 0
            
            // Simple statistical significance calculation (z-test)
            const pooledRate = (control.conversions + variant.conversions) / (control.pageViews + variant.pageViews)
            const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/control.pageViews + 1/variant.pageViews))
            const zScore = Math.abs(variantRate - controlRate) / standardError
            const pValue = 2 * (1 - normalCDF(Math.abs(zScore)))
            
            experimentMetrics[variantName].statisticalSignificance = {
              zScore,
              pValue,
              isSignificant: pValue < 0.05,
              confidenceLevel: (1 - pValue) * 100
            }
          }
        })
      }
    }

    return NextResponse.json({
      bounceRate,
      timeOnPage: avgTimeOnPage,
      trialSignupRate,
      evaluationStartRate,
      sectionEngagement,
      performance: {
        avgPageLoadTime,
        coreWebVitals
      },
      experimentMetrics,
      totalEvents: events.length,
      dateRange: { startDate, endDate }
    })

  } catch (error) {
    console.error('Homepage metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch homepage metrics' },
      { status: 500 }
    )
  }
}

function calculateAverage(events: any[], metricName: string): number {
  const relevantEvents = events.filter(e => 
    e.eventName === 'core_web_vital' && e.properties?.metric === metricName
  )
  
  if (relevantEvents.length === 0) return 0
  
  return relevantEvents.reduce((sum, e) => sum + (e.properties?.value || 0), 0) / relevantEvents.length
}

// Approximation of normal CDF for statistical significance
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)))
}

function erf(x: number): number {
  // Approximation of error function
  const a1 =  0.254829592
  const a2 = -0.284496736
  const a3 =  1.421413741
  const a4 = -1.453152027
  const a5 =  1.061405429
  const p  =  0.3275911

  const sign = x >= 0 ? 1 : -1
  x = Math.abs(x)

  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}