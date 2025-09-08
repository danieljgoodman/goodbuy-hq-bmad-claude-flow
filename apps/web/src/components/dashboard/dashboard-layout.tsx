'use client'

import { useState, useEffect } from 'react'
import KPICards from './kpi-cards'
import ActivityFeed from './activity-feed'
import ValuationChart from '@/components/charts/valuation-chart'
import HealthScoreGauge from '@/components/charts/health-score-gauge'
import TrendBarChart from '@/components/charts/trend-bar-chart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Plus, BarChart3, TrendingUp, FileText, Eye } from 'lucide-react'
import type { 
  DashboardMetrics, 
  ActivityItem, 
  ChartDataPoint, 
  HealthScoreBreakdown,
  DateRange 
} from '@/types/dashboard'
import type { BusinessEvaluation } from '@/types'

interface DashboardLayoutProps {
  metrics?: DashboardMetrics | null
  activities?: ActivityItem[]
  valuationData?: ChartDataPoint[]
  healthBreakdown?: HealthScoreBreakdown
  trendData?: ChartDataPoint[]
  evaluations?: BusinessEvaluation[]
  isLoading?: boolean
  onRefresh?: () => void
  onCreateEvaluation?: () => void
  onViewEvaluation?: (id: string) => void
  onDateRangeChange?: (range: DateRange['period']) => void
  className?: string
}


export default function DashboardLayout({
  metrics,
  activities,
  valuationData,
  healthBreakdown,
  trendData,
  evaluations = [],
  isLoading = false,
  onRefresh,
  onCreateEvaluation,
  onViewEvaluation,
  onDateRangeChange,
  className = ""
}: DashboardLayoutProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange['period']>('30d')

  // Use real data only - no mock data fallbacks
  const displayMetrics = metrics
  const displayActivities = activities || []
  const displayValuationData = valuationData || []
  const displayTrendData = trendData || []
  const displayHealthBreakdown = healthBreakdown

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh?.()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDateRangeChange = (range: DateRange['period']) => {
    setSelectedDateRange(range)
    onDateRangeChange?.(range)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your business performance and recent activity
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing || isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {onCreateEvaluation && (
            <Button onClick={onCreateEvaluation}>
              <Plus className="h-4 w-4 mr-2" />
              New Evaluation
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {displayMetrics ? (
        <KPICards metrics={displayMetrics} isLoading={isLoading} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="col-span-full">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No evaluation data available yet. Create your first evaluation to see KPI metrics.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Valuation Chart */}
          {displayValuationData.length > 0 ? (
            <ValuationChart
              data={displayValuationData}
              onDateRangeChange={handleDateRangeChange}
              title="Business Valuation Trend"
              subtitle="Track your business value over time"
              height={350}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Business Valuation Trend</CardTitle>
                <CardDescription>Track your business value over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] flex items-center justify-center">
                <p className="text-muted-foreground">No valuation data available. Complete evaluations to see trends.</p>
              </CardContent>
            </Card>
          )}

          {/* Performance Trends */}
          {displayTrendData.length > 0 ? (
            <TrendBarChart
              data={displayTrendData}
              onDateRangeChange={handleDateRangeChange}
              title="Performance Trends"
              subtitle="Key metrics and growth indicators"
              height={300}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Key metrics and growth indicators</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No performance data available. Complete evaluations to see trends.</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          {displayMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Evaluations</p>
                      <p className="text-2xl font-bold">{displayMetrics.totalEvaluations}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Growth Rate</p>
                      <p className="text-2xl font-bold">{displayMetrics.growthRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Documents</p>
                      <p className="text-2xl font-bold">{displayMetrics.documentsProcessed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Complete evaluations to see detailed statistics.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Health Score & Activity */}
        <div className="space-y-6">
          {/* Health Score Gauge */}
          {displayMetrics && displayHealthBreakdown ? (
            <HealthScoreGauge
              healthScore={displayMetrics.healthScore}
              breakdown={displayHealthBreakdown}
              title="Business Health Score"
              subtitle="Overall performance indicator"
              showBreakdown={true}
              size={180}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Business Health Score</CardTitle>
                <CardDescription>Overall performance indicator</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">No health score data available. Complete evaluations to see your business health.</p>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <ActivityFeed
            activities={displayActivities}
            isLoading={isLoading}
            onRefresh={handleRefresh}
            maxItems={8}
            showTimestamps={true}
          />
        </div>
      </div>

      {/* Evaluation History */}
      {evaluations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Your Business Evaluations</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {evaluations.map((evaluation) => (
              <Card key={evaluation.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Business Evaluation</CardTitle>
                    <Badge variant={
                      evaluation.status === 'completed' ? 'default' :
                      evaluation.status === 'processing' ? 'secondary' :
                      'destructive'
                    }>
                      {evaluation.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {new Date(evaluation.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {evaluation.status === 'completed' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Health Score</span>
                        <span className={`font-semibold ${
                          evaluation.healthScore >= 80 ? 'text-green-600' :
                          evaluation.healthScore >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {evaluation.healthScore}/100
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Estimated Value</span>
                        <span className="font-semibold">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(
                            typeof evaluation.valuations.weighted === 'object' && evaluation.valuations.weighted?.value 
                              ? evaluation.valuations.weighted.value 
                              : typeof evaluation.valuations.weighted === 'number'
                              ? evaluation.valuations.weighted
                              : 0
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Annual Revenue</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(evaluation.businessData.annualRevenue)}
                        </span>
                      </div>
                      <Button 
                        className="w-full mt-3"
                        onClick={() => onViewEvaluation?.(evaluation.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Report
                      </Button>
                    </div>
                  ) : evaluation.status === 'processing' ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Analysis in progress...</p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-red-600 mb-2">Analysis failed</p>
                      <Button variant="outline" size="sm">
                        Try Again
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              {displayMetrics ? (
                <>
                  <span>Last updated: {displayMetrics.lastUpdated.toLocaleString()}</span>
                  <Badge variant="outline">
                    Risk Level: {displayMetrics.riskLevel}
                  </Badge>
                </>
              ) : (
                <span>No evaluation data available</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span>Data points: {displayValuationData.length}</span>
              <span>Period: {selectedDateRange}</span>
              <span>Evaluations: {evaluations.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}