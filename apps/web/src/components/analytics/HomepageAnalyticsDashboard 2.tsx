'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ConversionMetrics {
  bounceRate: number
  timeOnPage: number
  trialSignupRate: number
  evaluationStartRate: number
  sectionEngagement: Record<string, number>
  performance: {
    avgPageLoadTime: number
    coreWebVitals: {
      firstContentfulPaint: number
      largestContentfulPaint: number
      firstInputDelay: number
      cumulativeLayoutShift: number
    }
  }
  experimentMetrics?: Record<string, {
    pageViews: number
    conversions: number
    conversionRate: number
    buttonClicks: number
    avgTimeOnPage: number
    statisticalSignificance?: {
      zScore: number
      pValue: number
      isSignificant: boolean
      confidenceLevel: number
    }
  }>
  totalEvents: number
  dateRange: {
    startDate: string
    endDate: string
  }
}

interface HomepageAnalyticsDashboardProps {
  experimentId?: string
}

export function HomepageAnalyticsDashboard({ experimentId }: HomepageAnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/homepage-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }

      const data = await response.json()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [experimentId])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Analytics</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchMetrics} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>No analytics data found for the selected period.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`
  const formatTime = (ms: number) => `${(ms / 1000).toFixed(1)}s`
  const formatNumber = (value: number) => Math.round(value).toLocaleString()

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics.bounceRate)}</div>
            <Badge variant={metrics.bounceRate < 40 ? 'default' : metrics.bounceRate < 60 ? 'secondary' : 'destructive'}>
              {metrics.bounceRate < 40 ? 'Excellent' : metrics.bounceRate < 60 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time on Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.timeOnPage)}</div>
            <Badge variant={metrics.timeOnPage > 60000 ? 'default' : 'secondary'}>
              {metrics.timeOnPage > 60000 ? 'Good Engagement' : 'Room for Improvement'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trial Signup Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics.trialSignupRate)}</div>
            <Badge variant={metrics.trialSignupRate > 5 ? 'default' : 'secondary'}>
              Target: 30%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evaluation Start Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics.evaluationStartRate)}</div>
            <Badge variant={metrics.evaluationStartRate > 70 ? 'default' : 'secondary'}>
              Of Trial Signups
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Core Web Vitals and page load performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Page Load Time</div>
              <div className="text-xl font-bold">{formatTime(metrics.performance.avgPageLoadTime)}</div>
              <Badge variant={metrics.performance.avgPageLoadTime < 2000 ? 'default' : 'destructive'}>
                Target: &lt;2s
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">First Contentful Paint</div>
              <div className="text-xl font-bold">{formatTime(metrics.performance.coreWebVitals.firstContentfulPaint)}</div>
              <Badge variant={metrics.performance.coreWebVitals.firstContentfulPaint < 1800 ? 'default' : 'secondary'}>
                Target: &lt;1.8s
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Largest Contentful Paint</div>
              <div className="text-xl font-bold">{formatTime(metrics.performance.coreWebVitals.largestContentfulPaint)}</div>
              <Badge variant={metrics.performance.coreWebVitals.largestContentfulPaint < 2500 ? 'default' : 'secondary'}>
                Target: &lt;2.5s
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">First Input Delay</div>
              <div className="text-xl font-bold">{metrics.performance.coreWebVitals.firstInputDelay.toFixed(0)}ms</div>
              <Badge variant={metrics.performance.coreWebVitals.firstInputDelay < 100 ? 'default' : 'secondary'}>
                Target: &lt;100ms
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Cumulative Layout Shift</div>
              <div className="text-xl font-bold">{metrics.performance.coreWebVitals.cumulativeLayoutShift.toFixed(3)}</div>
              <Badge variant={metrics.performance.coreWebVitals.cumulativeLayoutShift < 0.1 ? 'default' : 'secondary'}>
                Target: &lt;0.1
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Engagement */}
      <Card>
        <CardHeader>
          <CardTitle>Section Engagement</CardTitle>
          <CardDescription>How users interact with different homepage sections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(metrics.sectionEngagement).map(([section, views]) => (
              <div key={section} className="space-y-2">
                <div className="text-sm font-medium capitalize">{section.replace('-', ' ')}</div>
                <div className="text-xl font-bold">{formatNumber(views)}</div>
                <div className="text-xs text-muted-foreground">views</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* A/B Testing Results */}
      {metrics.experimentMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>A/B Testing Results</CardTitle>
            <CardDescription>Comparison of experiment variants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.experimentMetrics).map(([variant, data]) => (
                <div key={variant} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium capitalize">{variant}</h4>
                    {data.statisticalSignificance && (
                      <Badge variant={data.statisticalSignificance.isSignificant ? 'default' : 'secondary'}>
                        {data.statisticalSignificance.isSignificant ? 'Significant' : 'Not Significant'}
                        {data.statisticalSignificance.isSignificant && 
                          ` (${data.statisticalSignificance.confidenceLevel.toFixed(1)}%)`
                        }
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Page Views</div>
                      <div className="font-medium">{formatNumber(data.pageViews)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Conversions</div>
                      <div className="font-medium">{formatNumber(data.conversions)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Conversion Rate</div>
                      <div className="font-medium">{formatPercentage(data.conversionRate)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg. Time on Page</div>
                      <div className="font-medium">{formatTime(data.avgTimeOnPage)}</div>
                    </div>
                  </div>
                  
                  {data.statisticalSignificance && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      p-value: {data.statisticalSignificance.pValue.toFixed(4)} | 
                      z-score: {data.statisticalSignificance.zScore.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            Data from {new Date(metrics.dateRange.startDate).toLocaleDateString()} to{' '}
            {new Date(metrics.dateRange.endDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Total Events: {formatNumber(metrics.totalEvents)}
          </div>
          <Button onClick={fetchMetrics} variant="outline" className="mt-4">
            Refresh Data
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}