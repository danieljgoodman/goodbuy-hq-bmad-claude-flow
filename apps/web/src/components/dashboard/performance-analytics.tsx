'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp,
  DollarSign,
  Users
} from 'lucide-react'
import ValuationChart from '@/components/charts/valuation-chart'
import TrendBarChart from '@/components/charts/trend-bar-chart'
import type { ChartDataPoint } from '@/types/dashboard'

interface PerformanceAnalyticsProps {
  className?: string
  isCollapsed?: boolean
  onToggleCollapse?: (collapsed: boolean) => void
  valuationData?: ChartDataPoint[]
  trendData?: ChartDataPoint[]
  healthBreakdown?: import('@/types/dashboard').HealthScoreBreakdown
}

type TimeRange = '7 Days' | '30 Days' | '90 Days' | '1 Year'

interface MetricData {
  value: string
  label: string
  color: 'orange' | 'purple'
  icon: React.ReactNode
}

const PerformanceAnalytics = ({ 
  className = '',
  isCollapsed = false,
  onToggleCollapse,
  valuationData = [],
  trendData = [],
  healthBreakdown
}: PerformanceAnalyticsProps) => {
  const [activeTab, setActiveTab] = useState<TimeRange>('30 Days')
  const [collapsed, setCollapsed] = useState(isCollapsed)

  const timeRanges: TimeRange[] = ['7 Days', '30 Days', '90 Days', '1 Year']

  // Calculate real metrics from health breakdown and trend data
  const calculateRealMetrics = (): MetricData[] => {
    const currentHealthScore = trendData.length > 0 ? trendData[trendData.length - 1].value : 0
    
    // Default metrics if no health breakdown data
    if (!healthBreakdown) {
      const gradeMapping = (score: number) => {
        if (score >= 90) return 'A+'
        if (score >= 85) return 'A'
        if (score >= 80) return 'B+'
        if (score >= 75) return 'B'
        if (score >= 70) return 'C+'
        if (score >= 65) return 'C'
        return 'D'
      }

      return [
        {
          value: `${Math.round(currentHealthScore)}/100`,
          label: `Overall Health (${gradeMapping(currentHealthScore)})`,
          color: 'orange',
          icon: <TrendingUp className="w-4 h-4" />
        },
        {
          value: `${trendData.length}`,
          label: 'Completed Evals',
          color: 'orange', 
          icon: <DollarSign className="w-4 h-4" />
        },
        {
          value: currentHealthScore >= 80 ? 'Strong' : currentHealthScore >= 60 ? 'Fair' : 'Needs Work',
          label: 'Health Status',
          color: 'purple',
          icon: <Users className="w-4 h-4" />
        }
      ]
    }

    // Calculate metrics from health breakdown
    const categories = [
      { name: 'Financial', score: healthBreakdown.financial.score },
      { name: 'Operational', score: healthBreakdown.operational.score },
      { name: 'Market', score: healthBreakdown.market.score },
      { name: 'Risk', score: healthBreakdown.risk.score },
      { name: 'Growth', score: healthBreakdown.growth.score }
    ]

    const bestCategory = categories.reduce((prev, current) => 
      current.score > prev.score ? current : prev
    )

    const worstCategory = categories.reduce((prev, current) => 
      current.score < prev.score ? current : prev
    )

    const gradeMapping = (score: number) => {
      if (score >= 90) return 'A+'
      if (score >= 85) return 'A' 
      if (score >= 80) return 'B+'
      if (score >= 75) return 'B'
      if (score >= 70) return 'C+'
      if (score >= 65) return 'C'
      return 'D'
    }

    return [
      {
        value: `${Math.round(currentHealthScore)}/100`,
        label: `Overall Health (${gradeMapping(currentHealthScore)})`,
        color: 'orange',
        icon: <TrendingUp className="w-4 h-4" />
      },
      {
        value: `${Math.round(bestCategory.score)}% ${bestCategory.name}`,
        label: 'Top Category',
        color: 'orange',
        icon: <DollarSign className="w-4 h-4" />
      },
      {
        value: `${Math.round(worstCategory.score)}% ${worstCategory.name}`,
        label: 'Focus Area', 
        color: 'purple',
        icon: <Users className="w-4 h-4" />
      }
    ]
  }

  const metricsData = calculateRealMetrics()

  const handleToggleCollapse = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    onToggleCollapse?.(newCollapsed)
  }

  return (
    <Card className={`bg-card border border-border ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg font-semibold text-foreground">
              Performance Analytics
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleCollapse}
            className="text-muted-foreground hover:text-foreground"
          >
            <span className="text-sm mr-2">Collapse</span>
            {collapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed business metrics and trends over time
        </p>
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-0">
          {/* Tab Navigation */}
          <div className="flex items-center justify-start mb-6 border-b border-border">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setActiveTab(range)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === range
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Real Chart Area - Display actual evaluation data */}
          <div className="space-y-6 mb-6">
            {/* Show charts if we have data, otherwise show empty state */}
            {(valuationData.length > 0 || trendData.length > 0) ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Valuation Trend Chart */}
                {valuationData.length > 0 && (
                  <div className="lg:col-span-2">
                    <ValuationChart
                      data={valuationData}
                      title="Business Valuation Trends"
                      subtitle="Track your business value over time"
                      height={280}
                      lineColor="hsl(var(--primary))"
                      className="border-0 shadow-none bg-card/50"
                    />
                  </div>
                )}
                
                {/* Health Score Trend */}
                {trendData.length > 0 && (
                  <div className="lg:col-span-2">
                    <TrendBarChart
                      data={trendData}
                      title="Health Score Progression" 
                      subtitle="Monitor your business health over time"
                      height={280}
                      className="border-0 shadow-none bg-card/50"
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Empty state when no data is available */
              <div className="bg-muted/30 rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px] border border-border/20">
                <BarChart3 className="w-12 h-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Data Available
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Complete your first business evaluation to see analytics and trends appear here
                </p>
              </div>
            )}
          </div>

          {/* Bottom Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metricsData.map((metric, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg border border-border/30"
              >
                <div className={`p-2 rounded-full ${
                  metric.color === 'orange' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-chart-2/10 text-chart-2'
                }`}>
                  {metric.icon}
                </div>
                <div>
                  <div className={`text-2xl font-bold ${
                    metric.color === 'orange' 
                      ? 'text-primary' 
                      : 'text-chart-2'
                  }`}>
                    {metric.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {metric.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default PerformanceAnalytics