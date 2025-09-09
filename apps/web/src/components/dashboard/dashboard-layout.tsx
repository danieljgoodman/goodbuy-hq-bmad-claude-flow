'use client'

import { useState, useEffect } from 'react'
import KPICards from './kpi-cards'
import ActivityFeed from './activity-feed'
import DashboardFiltersComponent from './dashboard-filters'
import ComparisonView from './comparison-view'
import ExportModal from './export-modal'
import QuickActions from './quick-actions'
import ValuationChart from '@/components/charts/valuation-chart'
import HealthScoreGauge from '@/components/charts/health-score-gauge'
import TrendBarChart from '@/components/charts/trend-bar-chart'
import InteractiveChartWrapper from '@/components/charts/interactive-chart-wrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Plus, BarChart3, TrendingUp, FileText, Eye, ArrowRight } from 'lucide-react'
import type { 
  DashboardMetrics, 
  ActivityItem, 
  ChartDataPoint, 
  HealthScoreBreakdown,
  DateRange,
  DashboardFilters,
  ComparisonState,
  ExportData
} from '@/types/dashboard'
import type { BusinessEvaluation } from '@/types'

interface DashboardLayoutProps {
  metrics?: DashboardMetrics | null
  activities?: ActivityItem[]
  valuationData?: ChartDataPoint[]
  healthBreakdown?: HealthScoreBreakdown
  trendData?: ChartDataPoint[]
  evaluations?: BusinessEvaluation[]
  filters?: DashboardFilters
  comparison?: ComparisonState
  isLoading?: boolean
  onRefresh?: () => void
  onCreateEvaluation?: () => void
  onViewEvaluation?: (id: string) => void
  onDateRangeChange?: (range: DateRange['period']) => void
  onFiltersChange?: (filters: DashboardFilters) => void
  onComparisonChange?: (comparison: ComparisonState) => void
  onExport?: (exportData: ExportData) => Promise<string>
  onShareDashboard?: () => void
  onUpdateLatestEvaluation?: () => void
  className?: string
}


export default function DashboardLayout({
  metrics,
  activities,
  valuationData,
  healthBreakdown,
  trendData,
  evaluations = [],
  filters,
  comparison,
  isLoading = false,
  onRefresh,
  onCreateEvaluation,
  onViewEvaluation,
  onDateRangeChange,
  onFiltersChange,
  onComparisonChange,
  onExport,
  onShareDashboard,
  onUpdateLatestEvaluation,
  className = ""
}: DashboardLayoutProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange['period']>('30d')
  const [viewMode, setViewMode] = useState<'dashboard' | 'comparison'>('dashboard')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

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

  const handleExportData = () => {
    setIsExportModalOpen(true)
  }

  const recentEvaluationId = evaluations.length > 0 ? evaluations[0].id : undefined

  // Default filters if not provided
  const defaultFilters: DashboardFilters = {
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    businessCategories: [],
    evaluationTypes: ['completed', 'processing', 'failed'],
    customTimeframe: { label: '30 days', days: 30 }
  }

  const currentFilters = filters || defaultFilters
  
  // Default comparison state if not provided
  const defaultComparison: ComparisonState = {
    selectedEvaluations: [],
    comparisonMode: 'side-by-side',
    metrics: ['healthScore', 'valuation']
  }

  const currentComparison = comparison || defaultComparison

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your business performance and recent activity
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'dashboard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('dashboard')}
            >
              Dashboard
            </Button>
            <Button
              variant={viewMode === 'comparison' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('comparison')}
              disabled={evaluations.filter(e => e.status === 'completed').length < 2}
              title={evaluations.filter(e => e.status === 'completed').length < 2 
                ? "You need at least 2 completed evaluations to compare" 
                : "Compare multiple business evaluations side-by-side to analyze trends and changes over time"}
            >
              Compare
              {evaluations.filter(e => e.status === 'completed').length >= 2 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {evaluations.filter(e => e.status === 'completed').length}
                </Badge>
              )}
            </Button>
          </div>
          
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

      {/* Filters */}
      {onFiltersChange && viewMode === 'dashboard' && (
        <DashboardFiltersComponent
          filters={currentFilters}
          onFiltersChange={onFiltersChange}
          isLoading={isLoading}
        />
      )}

      {/* Main Content */}
      {viewMode === 'comparison' ? (
        onComparisonChange ? (
          <ComparisonView
            evaluations={evaluations}
            comparison={currentComparison}
            onComparisonChange={onComparisonChange}
            isLoading={isLoading}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Comparison functionality not available</p>
          </div>
        )
      ) : (
        <>
          {/* Top Section - Health Score & Dashboard Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            {/* Business Health Score - Show when available */}
            {displayMetrics && displayMetrics.healthScore ? (
              <div className="lg:col-span-2 h-full">
                <HealthScoreGauge
                  healthScore={displayMetrics.healthScore}
                  breakdown={displayHealthBreakdown}
                  title="Business Health Score"
                  subtitle="Overall performance indicator"
                  showBreakdown={!!displayHealthBreakdown}
                  size={240}
                  className="h-full"
                />
              </div>
            ) : (
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg bg-green-100">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <span>Business Health Score</span>
                    </CardTitle>
                    <CardDescription>Get a comprehensive health assessment of your business</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <div className="text-center space-y-3 max-w-sm">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-3">
                        <BarChart3 className="h-8 w-8 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">No Health Score Yet</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Complete your first evaluation to get a comprehensive health score based on financial metrics, risk assessment, and growth potential.
                      </p>
                      {onCreateEvaluation && (
                        <Button onClick={onCreateEvaluation} className="mt-4 w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Evaluation
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Dashboard Actions - Always show */}
            <div className="lg:col-span-3 h-full">
              <QuickActions
                onNewEvaluation={onCreateEvaluation || (() => {})}
                onRefreshData={handleRefresh}
                onShareDashboard={onShareDashboard || (() => {})}
                onExportData={handleExportData}
                onUpdateData={onUpdateLatestEvaluation || (() => {})}
                recentEvaluationId={recentEvaluationId}
                isLoading={isLoading}
                className="h-full"
              />
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Left Column - Charts (Now takes more space) */}
            <div className="xl:col-span-3 space-y-8">
              {/* Enhanced Valuation Chart - Increased height */}
              {displayValuationData.length > 0 ? (
                <InteractiveChartWrapper
                  title="Business Valuation Trend"
                  subtitle="Track your business value over time with advanced interactions"
                  data={displayValuationData}
                  chartType="line"
                  height={300}
                  showZoom={true}
                  showBrush={true}
                  showCustomPeriod={true}
                  onDrillDown={(dataPoint) => {
                    console.log('Drill down to:', dataPoint)
                  }}
                  onExport={() => {
                    console.log('Export chart data')
                  }}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Business Valuation Trend</CardTitle>
                    <CardDescription>Track your business value over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] flex flex-col items-center justify-center">
                    <div className="text-center space-y-4 max-w-sm mx-auto">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">No Valuation Data</h4>
                        <p className="text-sm text-muted-foreground">Complete your first business evaluation to start tracking your company's value over time.</p>
                      </div>
                      {onCreateEvaluation && (
                        <Button onClick={onCreateEvaluation} className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Evaluation
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Performance Trends - Increased height */}
              {displayTrendData.length > 0 ? (
                <InteractiveChartWrapper
                  title="Business Performance Metrics"
                  subtitle="Track key performance indicators: Health Score, Revenue Growth, Cash Flow, and Risk Assessment over time"
                  data={displayTrendData}
                  chartType="bar"
                  height={280}
                  showZoom={true}
                  showBrush={displayTrendData.length > 5}
                  showCustomPeriod={true}
                  onDrillDown={(dataPoint) => {
                    console.log('Drill down to performance detail:', dataPoint)
                  }}
                  onExport={() => {
                    console.log('Export performance data')
                  }}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Business Performance Metrics</CardTitle>
                    <CardDescription>
                      This chart will display trends for:
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <span>• Health Score progression</span>
                        <span>• Revenue growth rate</span>  
                        <span>• Cash flow changes</span>
                        <span>• Risk level variations</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px] flex flex-col items-center justify-center">
                    <div className="text-center space-y-4 max-w-sm mx-auto">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-amber-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-8 w-8 text-orange-600" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">No Performance Data</h4>
                        <p className="text-sm text-muted-foreground">Complete 2+ evaluations to see performance trends and comparisons.</p>
                      </div>
                      {onCreateEvaluation && (
                        <Button onClick={onCreateEvaluation} className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Evaluation
                        </Button>
                      )}
                    </div>
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
              
              <Card className="cursor-pointer hover:shadow-lg hover:bg-accent/5 transition-all duration-200 border-2 hover:border-purple-200" onClick={() => {
                // TODO: Navigate to documents page
                console.log('Navigate to documents page')
              }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <FileText className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Documents</p>
                        <p className="text-2xl font-bold">{displayMetrics.documentsProcessed}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Button size="sm" variant="ghost" className="text-purple-700 hover:text-purple-800 hover:bg-purple-50 px-3 py-1 h-auto font-medium">
                        View All
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
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

            {/* Right Column - Recent Activity (Compact) */}
            <div className="space-y-6">
              {/* Recent Activity - Reduced to 4 items */}
              <ActivityFeed
                activities={displayActivities}
                isLoading={isLoading}
                onRefresh={handleRefresh}
                maxItems={4}
                showTimestamps={false}
              />
            </div>
          </div>

          {/* Evaluation History */}
          {evaluations.length > 0 && (
            <div className="space-y-6 border-t border-gray-200 pt-8 pb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Your Business Evaluations</h2>
                <Badge variant="outline" className="text-xs">
                  {evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        </>
      )}

      {/* Footer Info */}
      <div className="border-t border-gray-200 pt-8 mt-8">
        <Card className="bg-gray-50/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                {displayMetrics ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Last updated: {displayMetrics.lastUpdated.toLocaleString()}</span>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      Risk Level: {displayMetrics.riskLevel}
                    </Badge>
                  </>
                ) : (
                  <span>No evaluation data available</span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-6 text-xs">
                <span>Data points: {displayValuationData.length}</span>
                <span>Period: {selectedDateRange}</span>
                <span>Evaluations: {evaluations.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Modal */}
      {onExport && (
        <ExportModal
          isOpen={isExportModalOpen}
          onOpenChange={setIsExportModalOpen}
          evaluations={evaluations}
          filters={currentFilters}
          onExport={onExport}
        />
      )}
    </div>
  )
}