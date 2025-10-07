'use client'

import { useState, useEffect } from 'react'
import KPICards from './kpi-cards'
import ActivityFeed from './activity-feed'
import DashboardFiltersComponent from './dashboard-filters'
import ComparisonView from './comparison-view'
import ExportModal from './export-modal'
import WelcomeEmptyState from './welcome-empty-state'
import PerformanceAnalytics from './performance-analytics'
import RecentEvaluations from './recent-evaluations'
import QuickActions from './quick-actions'
import AIInsights from './ai-insights'
import ValuationChart from '@/components/charts/valuation-chart'
import TrendBarChart from '@/components/charts/trend-bar-chart'
import InteractiveChartWrapper from '@/components/charts/interactive-chart-wrapper'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Plus, BarChart3, TrendingUp, FileText, Eye, ArrowRight, ChevronDown, ChevronUp, Activity, Clock, Zap, Settings, Download, Share } from 'lucide-react'
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
  onViewAllEvaluations?: () => void
  onViewAnalytics?: () => void
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
  onViewAllEvaluations,
  onViewAnalytics,
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
    <div className={`min-h-screen bg-background ${className}`}>
      {/* HEADER SECTION - Clean professional design */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Business Dashboard
              </h1>
              <Badge variant="success" className="gap-1.5">
                <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                <span className="font-medium">Live</span>
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || isLoading} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportData} className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              {onShareDashboard && (
                <Button variant="outline" size="sm" onClick={onShareDashboard} className="gap-2">
                  <Share className="h-4 w-4" />
                  Share
                </Button>
              )}
              {onCreateEvaluation && (
                <Button size="sm" onClick={onCreateEvaluation} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Evaluation
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT - 70/30 Layout Structure */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Empty State Check */}
        {!displayMetrics ? (
          <WelcomeEmptyState onCreateEvaluation={onCreateEvaluation || (() => {})} />
        ) : (
          <div className="flex flex-col xl:flex-row gap-8">
            {/* LEFT COLUMN - 70% */}
            <div className="flex-1 xl:w-[70%] space-y-8">
              {/* KPI CARDS */}
              <KPICards metrics={displayMetrics} isLoading={isLoading} />

              {/* PERFORMANCE ANALYTICS */}
              <PerformanceAnalytics
                valuationData={displayValuationData}
                trendData={displayTrendData}
                healthBreakdown={displayHealthBreakdown}
              />

              {/* RECENT EVALUATIONS */}
              <RecentEvaluations
                evaluations={evaluations}
                onViewEvaluation={onViewEvaluation}
                onViewAllEvaluations={onViewAllEvaluations}
                onDeleteEvaluation={onDeleteEvaluation}
              />
            </div>

            {/* RIGHT SIDEBAR - 30% */}
            <div className="xl:w-[30%] space-y-6">
              {/* QUICK ACTIONS */}
              <QuickActions
                onViewAllEvaluations={onViewAllEvaluations}
                onViewAnalytics={onViewAnalytics}
                onExportData={handleExportData}
              />

              {/* RECENT ACTIVITY */}
              <ActivityFeed
                activities={displayActivities.slice(0, 6)}
                isLoading={isLoading}
                onRefresh={handleRefresh}
                maxItems={6}
                showTimestamps={true}
                className="border-border"
              />

              {/* AI INSIGHTS */}
              <AIInsights
                metrics={displayMetrics}
                className="border-border"
              />
            </div>
          </div>
        )}
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