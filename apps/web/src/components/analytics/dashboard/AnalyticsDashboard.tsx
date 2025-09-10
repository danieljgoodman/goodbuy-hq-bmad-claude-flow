'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TimeSeriesChart } from '../charts/TimeSeriesChart'
import { ValuationTrendChart } from '../charts/ValuationTrendChart'
import { HealthScoreChart } from '../charts/HealthScoreChart'
import { PerformanceIndicatorGrid } from '../indicators/PerformanceIndicatorGrid'
import { GoalProgressIndicator } from '../indicators/GoalProgressIndicator'
import { AnalyticsData, WidgetConfiguration } from '@/types'
import { PerformanceIndicatorData } from '@/lib/services/VisualizationService'
import { 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Download, 
  Share, 
  Maximize2,
  Eye,
  EyeOff,
  Plus,
  Calendar,
  Filter
} from 'lucide-react'

interface AnalyticsDashboardProps {
  userId: string
  dashboardConfig?: WidgetConfiguration
  onConfigChange?: (config: WidgetConfiguration) => void
}

interface Goal {
  id: string
  name: string
  description: string
  target: number
  current: number
  unit: string
  category: 'revenue' | 'valuation' | 'performance' | 'operational' | 'growth'
  deadline: Date
  priority: 'high' | 'medium' | 'low'
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved'
  milestones: Array<{
    id: string
    name: string
    target: number
    achieved: boolean
    achievedDate?: Date
  }>
}

export function AnalyticsDashboard({ 
  userId, 
  dashboardConfig,
  onConfigChange 
}: AnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('3months')
  const [showBenchmarks, setShowBenchmarks] = useState(true)
  const [showGoals, setShowGoals] = useState(true)
  const [activeView, setActiveView] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - in real implementation, this would come from the VisualizationService
  const [analyticsData, setAnalyticsData] = useState<Record<string, AnalyticsData[]>>({})
  const [performanceIndicators, setPerformanceIndicators] = useState<PerformanceIndicatorData[]>([])
  const [goals, setGoals] = useState<Goal[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [userId, selectedTimeRange])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // In real implementation, call VisualizationService here
      const mockData = generateMockData()
      setAnalyticsData(mockData.timeSeries)
      setPerformanceIndicators(mockData.indicators)
      setGoals(mockData.goals)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockData = () => {
    const now = new Date()
    const startDate = new Date()
    startDate.setMonth(now.getMonth() - 6)

    // Generate mock time series data
    const timeSeries: Record<string, AnalyticsData[]> = {
      valuation: [],
      health_score: [],
      revenue: [],
      growth_rate: []
    }

    for (let i = 0; i < 180; i += 7) { // Weekly data points
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      
      timeSeries.valuation.push({
        id: `val_${i}`,
        userId,
        metric: 'valuation',
        value: 1000000 + Math.random() * 500000 + (i * 2000),
        timestamp: date,
        metadata: { 
          source: 'mock', 
          confidence: 0.85,
          industry_benchmark: 1200000,
          target_value: 1500000
        },
        category: 'valuation',
        tags: ['mock']
      })

      timeSeries.health_score.push({
        id: `health_${i}`,
        userId,
        metric: 'health_score',
        value: 65 + Math.random() * 20 + (i * 0.1),
        timestamp: date,
        metadata: { 
          source: 'mock', 
          confidence: 0.9,
          industry_benchmark: 75,
          target_value: 85
        },
        category: 'performance',
        tags: ['mock']
      })

      timeSeries.revenue.push({
        id: `rev_${i}`,
        userId,
        metric: 'revenue',
        value: 50000 + Math.random() * 20000 + (i * 500),
        timestamp: date,
        metadata: { 
          source: 'mock', 
          confidence: 0.95,
          industry_benchmark: 60000,
          target_value: 80000
        },
        category: 'performance',
        tags: ['mock']
      })

      timeSeries.growth_rate.push({
        id: `growth_${i}`,
        userId,
        metric: 'growth_rate',
        value: 5 + Math.random() * 15 + (i * 0.05),
        timestamp: date,
        metadata: { 
          source: 'mock', 
          confidence: 0.8,
          industry_benchmark: 12,
          target_value: 20
        },
        category: 'growth',
        tags: ['mock']
      })
    }

    // Generate mock performance indicators
    const indicators: PerformanceIndicatorData[] = [
      {
        name: 'Business Valuation',
        current: 1250000,
        target: 1500000,
        benchmark: 1200000,
        trend: 'up',
        change_percentage: 12.5,
        status: 'good'
      },
      {
        name: 'Health Score',
        current: 78,
        target: 85,
        benchmark: 75,
        trend: 'up',
        change_percentage: 8.2,
        status: 'good'
      },
      {
        name: 'Monthly Revenue',
        current: 65000,
        target: 80000,
        benchmark: 60000,
        trend: 'up',
        change_percentage: 15.3,
        status: 'good'
      },
      {
        name: 'Growth Rate',
        current: 18.5,
        target: 20,
        benchmark: 12,
        trend: 'stable',
        change_percentage: 2.1,
        status: 'warning'
      },
      {
        name: 'Customer Satisfaction',
        current: 4.2,
        target: 4.5,
        benchmark: 4.0,
        trend: 'down',
        change_percentage: -3.2,
        status: 'warning'
      },
      {
        name: 'Operational Efficiency',
        current: 72,
        target: 90,
        benchmark: 80,
        trend: 'down',
        change_percentage: -5.8,
        status: 'critical'
      }
    ]

    // Generate mock goals
    const mockGoals: Goal[] = [
      {
        id: 'goal_1',
        name: 'Reach $1.5M Valuation',
        description: 'Increase business valuation to $1.5M by Q4',
        target: 1500000,
        current: 1250000,
        unit: 'currency',
        category: 'valuation',
        deadline: new Date(now.getFullYear(), 11, 31),
        priority: 'high',
        status: 'on_track',
        milestones: [
          { id: 'm1', name: '1.2M Milestone', target: 1200000, achieved: true },
          { id: 'm2', name: '1.35M Milestone', target: 1350000, achieved: false },
          { id: 'm3', name: '1.5M Target', target: 1500000, achieved: false }
        ]
      },
      {
        id: 'goal_2',
        name: 'Achieve 85+ Health Score',
        description: 'Improve overall business health score to 85 or above',
        target: 85,
        current: 78,
        unit: 'score',
        category: 'performance',
        deadline: new Date(now.getFullYear(), 9, 30),
        priority: 'medium',
        status: 'on_track',
        milestones: [
          { id: 'm4', name: 'Financial Health 80+', target: 80, achieved: true },
          { id: 'm5', name: 'Operational Health 75+', target: 75, achieved: false },
          { id: 'm6', name: 'Overall Health 85+', target: 85, achieved: false }
        ]
      },
      {
        id: 'goal_3',
        name: 'Scale to $100K MRR',
        description: 'Grow monthly recurring revenue to $100K',
        target: 100000,
        current: 65000,
        unit: 'currency',
        category: 'revenue',
        deadline: new Date(now.getFullYear() + 1, 2, 31),
        priority: 'high',
        status: 'at_risk',
        milestones: [
          { id: 'm7', name: '70K Milestone', target: 70000, achieved: false },
          { id: 'm8', name: '85K Milestone', target: 85000, achieved: false },
          { id: 'm9', name: '100K Target', target: 100000, achieved: false }
        ]
      }
    ]

    return { timeSeries, indicators, goals: mockGoals }
  }

  const handleExportData = () => {
    console.log('Exporting dashboard data...')
    // Implementation for data export
  }

  const handleShareDashboard = () => {
    console.log('Sharing dashboard...')
    // Implementation for dashboard sharing
  }

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Interactive data visualization and business intelligence
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          {/* Display Options */}
          <div className="flex items-center gap-2 text-sm">
            <Switch
              id="benchmarks"
              checked={showBenchmarks}
              onCheckedChange={setShowBenchmarks}
            />
            <label htmlFor="benchmarks">Benchmarks</label>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Switch
              id="goals"
              checked={showGoals}
              onCheckedChange={setShowGoals}
            />
            <label htmlFor="goals">Goals</label>
          </div>

          {/* Action Buttons */}
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>

          <Button variant="outline" size="sm" onClick={handleShareDashboard}>
            <Share className="h-4 w-4 mr-1" />
            Share
          </Button>

          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceIndicators.slice(0, 4).map((indicator, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{indicator.name}</p>
                      <p className="text-2xl font-bold">
                        {indicator.name.includes('Valuation') || indicator.name.includes('Revenue') 
                          ? `$${(indicator.current / 1000).toFixed(0)}K`
                          : indicator.name.includes('Score') || indicator.name.includes('Rate')
                            ? `${indicator.current.toFixed(1)}${indicator.name.includes('Rate') ? '%' : ''}`
                            : indicator.current.toLocaleString()
                        }
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {indicator.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : indicator.trend === 'down' ? (
                          <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                        ) : null}
                        <span className={`text-sm ${
                          indicator.trend === 'up' ? 'text-green-600' :
                          indicator.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {Math.abs(indicator.change_percentage || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Badge variant={
                      indicator.status === 'good' ? 'default' :
                      indicator.status === 'warning' ? 'secondary' : 'destructive'
                    }>
                      {indicator.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ValuationTrendChart 
              data={analyticsData.valuation || []}
              showBenchmark={showBenchmarks}
              showGoal={showGoals}
              benchmark={1200000}
              goal={1500000}
            />
            <HealthScoreChart 
              data={analyticsData.health_score || []}
              target={85}
              showBreakdown={true}
            />
          </div>

          {/* Full Width Chart */}
          <TimeSeriesChart
            data={analyticsData}
            title="Multi-Metric Analysis"
            showBenchmarks={showBenchmarks}
            showGoals={showGoals}
            height={400}
            timeRange={selectedTimeRange}
            onTimeRangeChange={setSelectedTimeRange}
            onExport={handleExportData}
          />
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {Object.entries(analyticsData).map(([metric, data]) => (
              <ValuationTrendChart
                key={metric}
                data={data}
                title={`${metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Trend`}
                showProjection={true}
                height={300}
              />
            ))}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <PerformanceIndicatorGrid
            indicators={performanceIndicators}
            showBenchmarks={showBenchmarks}
            showTargets={showGoals}
            onIndicatorClick={(indicator) => {
              console.log('Clicked indicator:', indicator)
            }}
          />
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <GoalProgressIndicator
            goals={goals}
            showMilestones={true}
            onGoalClick={(goal) => {
              console.log('Clicked goal:', goal)
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}