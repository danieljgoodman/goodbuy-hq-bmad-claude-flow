'use client'

import { useState, useEffect } from 'react'
import KPICards from './kpi-cards'
import ActivityFeed from './activity-feed'
import DashboardFiltersComponent from './dashboard-filters'
import ComparisonView from './comparison-view'
import ExportModal from './export-modal'
import WelcomeEmptyState from './welcome-empty-state'
import ValuationChart from '@/components/charts/valuation-chart'
import TrendBarChart from '@/components/charts/trend-bar-chart'
import InteractiveChartWrapper from '@/components/charts/interactive-chart-wrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RefreshCw, Plus, BarChart3, TrendingUp, FileText, Eye, ArrowRight, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
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
  onDeleteEvaluation?: (id: string) => Promise<void>
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
  onDeleteEvaluation,
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
  const [showCharts, setShowCharts] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; evaluationId: string | null; isDeleting: boolean }>({
    open: false,
    evaluationId: null,
    isDeleting: false
  })

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

  const handleDeleteClick = (evaluationId: string) => {
    setDeleteDialog({ open: true, evaluationId, isDeleting: false })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.evaluationId || !onDeleteEvaluation) return

    setDeleteDialog(prev => ({ ...prev, isDeleting: true }))
    try {
      await onDeleteEvaluation(deleteDialog.evaluationId)
      setDeleteDialog({ open: false, evaluationId: null, isDeleting: false })
    } catch (error) {
      console.error('Failed to delete evaluation:', error)
      setDeleteDialog(prev => ({ ...prev, isDeleting: false }))
    }
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

      {/* Main Content - Empty State or Dashboard */}
      {!displayMetrics ? (
        <WelcomeEmptyState onCreateEvaluation={onCreateEvaluation || (() => {})} />
      ) : (
        <>
          {/* KPI Cards - Only when we have data */}
          <KPICards metrics={displayMetrics} isLoading={isLoading} />
        </>
      )}

      {/* Only show advanced features when we have data */}
      {displayMetrics && (
        <>
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

          {/* Collapsible Charts Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setShowCharts(!showCharts)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Analytics & Charts</CardTitle>
                    <CardDescription>
                      View detailed trends and performance metrics
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {displayValuationData.length + displayTrendData.length} data points
                    </Badge>
                    {showCharts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
              
              {showCharts && (
                <CardContent className="space-y-6">
                  {/* Valuation Chart */}
                  {displayValuationData.length > 0 ? (
                    <InteractiveChartWrapper
                      title="Business Valuation Trend"
                      subtitle="Track your business value over time"
                      data={displayValuationData}
                      chartType="line"
                      height={280}
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
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Complete more evaluations to see valuation trends</p>
                    </div>
                  )}

                  {/* Performance Chart */}
                  {displayTrendData.length > 0 ? (
                    <InteractiveChartWrapper
                      title="Performance Metrics"
                      subtitle="Track health score and business metrics"
                      data={displayTrendData}
                      chartType="bar"
                      height={240}
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
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Complete 2+ evaluations to see performance trends</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>

          {/* Activity Feed */}
          <ActivityFeed
            activities={displayActivities}
            isLoading={isLoading}
            onRefresh={handleRefresh}
            maxItems={4}
            showTimestamps={false}
          />

          {/* Collapsible Evaluation History */}
          {evaluations.length > 0 && (
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setShowHistory(!showHistory)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Evaluation History</CardTitle>
                    <CardDescription>
                      View and manage your business evaluations
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''}
                    </Badge>
                    {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
              
              {showHistory && (
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {evaluations.map((evaluation) => (
                      <Card key={evaluation.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Business Evaluation</CardTitle>
                            <Badge variant={
                              evaluation.status === 'completed' ? 'default' :
                              evaluation.status === 'processing' ? 'secondary' :
                              'destructive'
                            } className="text-xs">
                              {evaluation.status}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs">
                            {new Date(evaluation.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {evaluation.status === 'completed' ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Health Score</span>
                                <span className={`font-semibold ${
                                  evaluation.healthScore >= 80 ? 'text-green-600' :
                                  evaluation.healthScore >= 60 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {evaluation.healthScore}/100
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Value</span>
                                <span className="font-semibold text-xs">
                                  {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    notation: 'compact',
                                    maximumFractionDigits: 1,
                                  }).format(
                                    typeof evaluation.valuations.weighted === 'object' && evaluation.valuations.weighted?.value 
                                      ? evaluation.valuations.weighted.value 
                                      : typeof evaluation.valuations.weighted === 'number'
                                      ? evaluation.valuations.weighted
                                      : 0
                                  )}
                                </span>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button 
                                  size="sm"
                                  className="flex-1 text-xs h-8"
                                  onClick={() => onViewEvaluation?.(evaluation.id)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                {onDeleteEvaluation && (
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteClick(evaluation.id)
                                    }}
                                    className="px-2 h-8"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : evaluation.status === 'processing' ? (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                              <p className="text-xs text-muted-foreground">Processing...</p>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-xs text-red-600 mb-2">Failed</p>
                              <Button variant="outline" size="sm" className="text-xs h-7">
                                Retry
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}
          </>
        )}
      </>
    )}

      {/* Footer Info - Only show when we have data */}
      {displayMetrics && (
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
      )}

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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        title="Delete Evaluation"
        description="Are you sure you want to delete this business evaluation? This action cannot be undone. All related improvement opportunities and progress tracking will also be removed."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteDialog.isDeleting}
      />
    </div>
  )
}