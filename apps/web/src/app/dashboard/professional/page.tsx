'use client'

import React, { useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Calculator,
  Activity,
  RefreshCw,
  Download,
  Settings,
  Bell,
  Crown,
  Zap
} from 'lucide-react'

// Import Professional Dashboard Components
import { MultiYearFinancialTrends } from '@/components/dashboard/professional/MultiYearFinancialTrends'
import { CustomerConcentrationRisk } from '@/components/dashboard/professional/CustomerConcentrationRisk'
import { CompetitivePositioningChart } from '@/components/dashboard/professional/CompetitivePositioningChart'
import { InvestmentROICalculator } from '@/components/dashboard/professional/InvestmentROICalculator'
import { OperationalCapacityUtilization } from '@/components/dashboard/professional/OperationalCapacityUtilization'

// Import Hooks and Types
import { useProfessionalDashboardData } from '@/hooks/useProfessionalDashboardData'
import type { ExportConfig } from '@/types/professional-dashboard'

// Import Professional Styles
import '@/styles/professional-dashboard.css'

interface DashboardLayoutMode {
  mode: 'overview' | 'detailed' | 'custom'
  columns: 1 | 2 | 3
}

type ExportFormat = 'pdf' | 'excel' | 'png' | 'pptx'
type TimeRangeFilter = '1-year' | '3-year' | '5-year' | 'all-time'

export default function ProfessionalDashboardPage() {
  const { user, isLoading: authLoading } = useAuthStore()
  const router = useRouter()

  // Dashboard state
  const [layoutMode, setLayoutMode] = useState<DashboardLayoutMode>({
    mode: 'overview',
    columns: 2
  })
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('3-year')
  const [isExporting, setIsExporting] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Load Professional dashboard data
  const {
    data: dashboardData,
    isLoading: dataLoading,
    error: dataError,
    refresh: refreshData,
    lastFetched
  } = useProfessionalDashboardData({
    userId: user?.id || '',
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    timeRange: {
      start: new Date(Date.now() - (timeRange === '1-year' ? 365 : timeRange === '3-year' ? 1095 : timeRange === '5-year' ? 1825 : 3650) * 24 * 60 * 60 * 1000),
      end: new Date()
    }
  })

  // Check subscription tier access
  const hasProAccess = user?.subscriptionTier === 'professional' || user?.subscriptionTier === 'enterprise'

  // Export handler
  const handleExport = useCallback(async (format: ExportConfig['format']): Promise<string> => {
    if (!dashboardData) return ''

    setIsExporting(true)
    try {
      // Call API to generate export
      const response = await fetch('/api/exports/professional-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id,
          format,
          data: dashboardData,
          timeRange,
          layout: layoutMode
        })
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const result = await response.json()
      return result.downloadUrl
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    } finally {
      setIsExporting(false)
    }
  }, [dashboardData, user?.id, timeRange, layoutMode])

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      await refreshData()
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error)
    }
  }, [refreshData])

  // Navigation handlers
  const handleUpgrade = useCallback(() => {
    router.push('/pricing')
  }, [router])

  const handleSettings = useCallback(() => {
    router.push('/settings/dashboard')
  }, [router])

  // Render loading state
  if (authLoading || dataLoading) {
    return (
      <ProtectedRoute>
        <div className="professional-dashboard">
          <div className="professional-dashboard-container">
            <div className="professional-loading">
              <div className="professional-loading-spinner" />
              <p>Loading Professional Dashboard...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Render access denied for non-professional users
  if (!hasProAccess) {
    return (
      <ProtectedRoute>
        <div className="professional-dashboard">
          <div className="professional-dashboard-container">
            <Card className="max-w-2xl mx-auto mt-20">
              <CardHeader className="text-center">
                <Crown className="h-16 w-16 mx-auto mb-4 text-yellow-600" />
                <CardTitle className="text-2xl">Professional Tier Required</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  Access to the Professional Dashboard requires a Professional or Enterprise subscription.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold mb-2">Professional Features</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Multi-year financial trend analysis</li>
                      <li>• Customer concentration risk assessment</li>
                      <li>• Competitive positioning analytics</li>
                      <li>• Investment ROI calculator</li>
                      <li>• Operational capacity optimization</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold mb-2">Advanced Analytics</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Real-time performance metrics</li>
                      <li>• Industry benchmarking</li>
                      <li>• Predictive modeling</li>
                      <li>• Custom report generation</li>
                      <li>• Priority support</li>
                    </ul>
                  </div>
                </div>
                <div className="flex space-x-4 justify-center mt-6">
                  <Button onClick={handleUpgrade} className="professional-button-primary">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Professional
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/dashboard')}>
                    Back to Basic Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Render error state
  if (dataError) {
    return (
      <ProtectedRoute>
        <div className="professional-dashboard">
          <div className="professional-dashboard-container">
            <Card className="max-w-2xl mx-auto mt-20">
              <CardHeader>
                <CardTitle className="text-red-600">Dashboard Error</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="professional-error">
                  <div className="professional-error-message">
                    Failed to load Professional Dashboard data
                  </div>
                  <div className="professional-error-details">
                    {dataError.message}
                  </div>
                  <Button onClick={handleRefresh} className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Main dashboard render
  return (
    <ProtectedRoute>
      <div className="professional-dashboard">
        <div className="professional-dashboard-container">
          {/* Header */}
          <div className="professional-dashboard-header">
            <div>
              <h1 className="professional-dashboard-title">
                Professional Dashboard
              </h1>
              <p className="professional-dashboard-subtitle">
                Advanced business intelligence and analytics for {user?.businessName}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="default" className="bg-yellow-600">
                  <Crown className="h-3 w-3 mr-1" />
                  Professional Tier
                </Badge>
                {lastFetched && (
                  <span className="text-sm text-gray-500">
                    Last updated: {lastFetched.toLocaleTimeString()}
                  </span>
                )}
                {dashboardData?.dataQuality && (
                  <Badge
                    variant={
                      dashboardData.dataQuality.overallScore > 80 ? 'default' :
                      dashboardData.dataQuality.overallScore > 60 ? 'secondary' : 'destructive'
                    }
                  >
                    Data Quality: {dashboardData.dataQuality.overallScore.toFixed(0)}%
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Select value={timeRange} onValueChange={(value: TimeRangeFilter) => setTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-year">1 Year</SelectItem>
                  <SelectItem value="3-year">3 Years</SelectItem>
                  <SelectItem value="5-year">5 Years</SelectItem>
                  <SelectItem value="all-time">All Time</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={layoutMode.mode}
                onValueChange={(value: DashboardLayoutMode['mode']) =>
                  setLayoutMode(prev => ({ ...prev, mode: value }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={dataLoading}
              >
                <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSettings}
              >
                <Settings className="h-4 w-4" />
              </Button>

              <Select onValueChange={(format: ExportFormat) => handleExport(format)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="excel">Excel Data</SelectItem>
                  <SelectItem value="png">PNG Images</SelectItem>
                  <SelectItem value="pptx">PowerPoint</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Content */}
          {dashboardData && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="financial">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Financial
                </TabsTrigger>
                <TabsTrigger value="customers">
                  <Users className="h-4 w-4 mr-2" />
                  Customers
                </TabsTrigger>
                <TabsTrigger value="competitive">
                  <Target className="h-4 w-4 mr-2" />
                  Competition
                </TabsTrigger>
                <TabsTrigger value="investment">
                  <Calculator className="h-4 w-4 mr-2" />
                  Investment
                </TabsTrigger>
                <TabsTrigger value="operations">
                  <Activity className="h-4 w-4 mr-2" />
                  Operations
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {layoutMode.mode === 'overview' && (
                  <div className="professional-grid professional-grid-2">
                    <MultiYearFinancialTrends
                      data={dashboardData.financial}
                      onExport={handleExport}
                      loading={false}
                      className="col-span-2"
                    />
                    <CustomerConcentrationRisk
                      data={dashboardData.customerRisk}
                      onExport={handleExport}
                      loading={false}
                    />
                    <CompetitivePositioningChart
                      data={dashboardData.competitive}
                      onExport={handleExport}
                      loading={false}
                    />
                    <InvestmentROICalculator
                      data={dashboardData.investment}
                      onExport={handleExport}
                      loading={false}
                      className="col-span-2"
                    />
                    <OperationalCapacityUtilization
                      data={dashboardData.operational}
                      onExport={handleExport}
                      loading={false}
                      className="col-span-2"
                    />
                  </div>
                )}

                {layoutMode.mode === 'detailed' && (
                  <div className="space-y-8">
                    <MultiYearFinancialTrends
                      data={dashboardData.financial}
                      onExport={handleExport}
                      loading={false}
                    />
                    <div className="professional-grid professional-grid-2">
                      <CustomerConcentrationRisk
                        data={dashboardData.customerRisk}
                        onExport={handleExport}
                        loading={false}
                      />
                      <CompetitivePositioningChart
                        data={dashboardData.competitive}
                        onExport={handleExport}
                        loading={false}
                      />
                    </div>
                    <InvestmentROICalculator
                      data={dashboardData.investment}
                      onExport={handleExport}
                      loading={false}
                    />
                    <OperationalCapacityUtilization
                      data={dashboardData.operational}
                      onExport={handleExport}
                      loading={false}
                    />
                  </div>
                )}
              </TabsContent>

              {/* Individual Component Tabs */}
              <TabsContent value="financial" className="space-y-6">
                <MultiYearFinancialTrends
                  data={dashboardData.financial}
                  onExport={handleExport}
                  loading={false}
                />
              </TabsContent>

              <TabsContent value="customers" className="space-y-6">
                <CustomerConcentrationRisk
                  data={dashboardData.customerRisk}
                  onExport={handleExport}
                  loading={false}
                />
              </TabsContent>

              <TabsContent value="competitive" className="space-y-6">
                <CompetitivePositioningChart
                  data={dashboardData.competitive}
                  onExport={handleExport}
                  loading={false}
                />
              </TabsContent>

              <TabsContent value="investment" className="space-y-6">
                <InvestmentROICalculator
                  data={dashboardData.investment}
                  onExport={handleExport}
                  loading={false}
                />
              </TabsContent>

              <TabsContent value="operations" className="space-y-6">
                <OperationalCapacityUtilization
                  data={dashboardData.operational}
                  onExport={handleExport}
                  loading={false}
                />
              </TabsContent>
            </Tabs>
          )}

          {/* Performance Indicator */}
          {dashboardData && (
            <Card className="professional-card mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                  Dashboard Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">&lt;2s</p>
                    <p className="text-sm text-gray-600">Load Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">&lt;200ms</p>
                    <p className="text-sm text-gray-600">Interaction Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {dashboardData.dataQuality.completeness.toFixed(0)}%
                    </p>
                    <p className="text-sm text-gray-600">Data Completeness</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {dashboardData.dataQuality.freshness.toFixed(0)}%
                    </p>
                    <p className="text-sm text-gray-600">Data Freshness</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Status */}
          {isExporting && (
            <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="professional-loading-spinner" />
                <div>
                  <p className="font-medium">Generating Export...</p>
                  <p className="text-sm text-gray-600">This may take a few moments</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}