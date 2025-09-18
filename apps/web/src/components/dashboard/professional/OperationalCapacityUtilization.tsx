'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Settings,
  Users,
  Clock,
  Download,
  Target,
  Zap,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'
import type { OperationalCapacityData, ExportConfig, CapacityMetric } from '@/types/professional-dashboard'
import { OperationalAnalytics } from '@/lib/analytics/professional-calculations'

interface OperationalCapacityUtilizationProps {
  data: OperationalCapacityData
  loading?: boolean
  error?: Error | null
  onExport?: (format: ExportConfig['format']) => Promise<string>
  className?: string
}

type ViewMode = 'overview' | 'utilization' | 'bottlenecks' | 'forecast'
type ChartType = 'bar' | 'radial' | 'line' | 'pie'
type MetricFilter = 'all' | 'high-utilization' | 'low-efficiency' | 'bottlenecks'

const PROFESSIONAL_COLORS = {
  primary: '#8b4513',
  secondary: '#d2b48c',
  accent: '#cd853f',
  success: '#2d5930',
  warning: '#b8860b',
  error: '#8b2635',
  info: '#4a6fa5'
}

const UTILIZATION_COLORS = {
  low: PROFESSIONAL_COLORS.error,      // <60%
  medium: PROFESSIONAL_COLORS.warning, // 60-85%
  high: PROFESSIONAL_COLORS.success,   // 85-95%
  critical: PROFESSIONAL_COLORS.error  // >95%
}

const BOTTLENECK_COLORS = {
  minor: '#95a5a6',
  moderate: PROFESSIONAL_COLORS.warning,
  severe: '#e67e22',
  critical: PROFESSIONAL_COLORS.error
}

export function OperationalCapacityUtilization({
  data,
  loading = false,
  error,
  onExport,
  className = ''
}: OperationalCapacityUtilizationProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [metricFilter, setMetricFilter] = useState<MetricFilter>('all')
  const [sortBy, setSortBy] = useState<keyof CapacityMetric>('utilizationRate')

  // Filter and sort metrics
  const filteredMetrics = useMemo(() => {
    let filtered = [...data.metrics]

    switch (metricFilter) {
      case 'high-utilization':
        filtered = filtered.filter(m => m.utilizationRate > 85)
        break
      case 'low-efficiency':
        filtered = filtered.filter(m => m.efficiency < 70)
        break
      case 'bottlenecks':
        filtered = filtered.filter(m => m.bottleneckScore > 70)
        break
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'department') {
        return a[sortBy].localeCompare(b[sortBy])
      }
      return b[sortBy] - a[sortBy]
    })
  }, [data.metrics, metricFilter, sortBy])

  // Prepare chart data based on view and chart type
  const chartData = useMemo(() => {
    switch (viewMode) {
      case 'overview':
        return filteredMetrics.map(metric => ({
          department: metric.department.length > 12 ? metric.department.substring(0, 9) + '...' : metric.department,
          fullDepartment: metric.department,
          current: metric.currentCapacity,
          maximum: metric.maximumCapacity,
          utilization: metric.utilizationRate,
          efficiency: metric.efficiency,
          bottleneckScore: metric.bottleneckScore,
          growthPotential: metric.growthPotential
        }))

      case 'utilization':
        return filteredMetrics.map(metric => ({
          department: metric.department,
          utilization: metric.utilizationRate,
          efficiency: metric.efficiency,
          color: getUtilizationColor(metric.utilizationRate)
        }))

      case 'bottlenecks':
        return data.bottlenecks.map(bottleneck => ({
          department: bottleneck.department,
          severity: bottleneck.severity,
          impact: bottleneck.impact,
          actions: bottleneck.suggestedActions.length,
          color: BOTTLENECK_COLORS[bottleneck.severity]
        }))

      case 'forecast':
        return data.forecasting.capacityNeeds.map(need => ({
          timeframe: need.timeframe,
          additionalCapacity: need.additionalCapacity,
          investment: need.investmentRequired
        }))

      default:
        return []
    }
  }, [viewMode, filteredMetrics, data])

  // Get utilization color based on rate
  const getUtilizationColor = useCallback((rate: number) => {
    if (rate < 60) return UTILIZATION_COLORS.low
    if (rate < 85) return UTILIZATION_COLORS.medium
    if (rate < 95) return UTILIZATION_COLORS.high
    return UTILIZATION_COLORS.critical
  }, [])

  // Format percentage
  const formatPercentage = useCallback((value: number) => {
    return `${value.toFixed(1)}%`
  }, [])

  // Format currency
  const formatCurrency = useCallback((value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value.toLocaleString()}`
  }, [])

  // Get efficiency status
  const getEfficiencyStatus = useCallback((efficiency: number) => {
    if (efficiency >= 85) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' }
    if (efficiency >= 70) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' }
    if (efficiency >= 55) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-50' }
  }, [])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.fullDepartment || data.department || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {
                entry.name.includes('%') || entry.dataKey === 'utilization' || entry.dataKey === 'efficiency'
                  ? formatPercentage(entry.value)
                  : entry.name.includes('$') || entry.dataKey === 'investment'
                  ? formatCurrency(entry.value)
                  : entry.value
              }
            </p>
          ))}
          {data.bottleneckScore && (
            <p className="text-sm text-gray-600">
              Bottleneck Score: {data.bottleneckScore.toFixed(1)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // Export handler
  const handleExport = useCallback(async (format: ExportConfig['format']) => {
    if (onExport) {
      try {
        await onExport(format)
      } catch (error) {
        console.error('Failed to export capacity analysis:', error)
      }
    }
  }, [onExport])

  // Render summary cards
  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="professional-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Utilization</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(data.overallUtilization)}
              </p>
              <p className="text-xs text-gray-500">across all departments</p>
            </div>
            <div className={`p-3 rounded-full ${
              data.overallUtilization > 85 ? 'bg-green-100' :
              data.overallUtilization > 70 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <Activity className={`h-6 w-6 ${
                data.overallUtilization > 85 ? 'text-green-600' :
                data.overallUtilization > 70 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </div>
          <Progress value={data.overallUtilization} className="mt-2" />
        </CardContent>
      </Card>

      <Card className="professional-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Bottlenecks</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.bottlenecks.length}
              </p>
              <p className="text-xs text-gray-500">
                {data.bottlenecks.filter(b => b.severity === 'critical').length} critical
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              data.bottlenecks.filter(b => b.severity === 'critical').length > 0 ? 'bg-red-100' :
              data.bottlenecks.length > 2 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              <AlertTriangle className={`h-6 w-6 ${
                data.bottlenecks.filter(b => b.severity === 'critical').length > 0 ? 'text-red-600' :
                data.bottlenecks.length > 2 ? 'text-yellow-600' : 'text-green-600'
              }`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="professional-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Improvement Potential</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(data.optimization.potentialImprovement)}
              </p>
              <p className="text-xs text-gray-500">efficiency gains</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="professional-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Quick Wins</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.optimization.quickWins.length}
              </p>
              <p className="text-xs text-gray-500">opportunities</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render chart based on type and view
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="department"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10 }}
              />
              <YAxis tickFormatter={formatPercentage} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {viewMode === 'overview' && (
                <>
                  <Bar dataKey="utilization" fill={PROFESSIONAL_COLORS.primary} name="Utilization %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="efficiency" fill={PROFESSIONAL_COLORS.accent} name="Efficiency %" radius={[4, 4, 0, 0]} />
                </>
              )}
              {viewMode === 'utilization' && (
                <Bar dataKey="utilization" fill={PROFESSIONAL_COLORS.primary} name="Utilization %" radius={[4, 4, 0, 0]} />
              )}
              {viewMode === 'bottlenecks' && (
                <Bar dataKey="impact" fill={PROFESSIONAL_COLORS.error} name="Impact Score" radius={[4, 4, 0, 0]} />
              )}
              {viewMode === 'forecast' && (
                <Bar dataKey="additionalCapacity" fill={PROFESSIONAL_COLORS.info} name="Additional Capacity %" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'radial':
        const radialData = filteredMetrics.map(metric => ({
          name: metric.department,
          utilization: metric.utilizationRate,
          fill: getUtilizationColor(metric.utilizationRate)
        }))

        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={radialData}>
              <RadialBar
                minAngle={15}
                label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
                background
                clockWise
                dataKey="utilization"
              />
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="department" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={formatPercentage} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="utilization"
                stroke={PROFESSIONAL_COLORS.primary}
                strokeWidth={3}
                dot={{ fill: PROFESSIONAL_COLORS.primary, strokeWidth: 2, r: 6 }}
                name="Utilization %"
              />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke={PROFESSIONAL_COLORS.accent}
                strokeWidth={3}
                dot={{ fill: PROFESSIONAL_COLORS.accent, strokeWidth: 2, r: 6 }}
                name="Efficiency %"
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'pie':
        const pieData = viewMode === 'bottlenecks'
          ? Object.entries(BOTTLENECK_COLORS).map(([severity, color]) => ({
              name: severity.charAt(0).toUpperCase() + severity.slice(1),
              value: data.bottlenecks.filter(b => b.severity === severity).length,
              color
            })).filter(item => item.value > 0)
          : filteredMetrics.map(metric => ({
              name: metric.department,
              value: metric.utilizationRate,
              color: getUtilizationColor(metric.utilizationRate)
            }))

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${viewMode === 'bottlenecks' ? value : formatPercentage(value)}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  viewMode === 'bottlenecks' ? value : formatPercentage(Number(value)),
                  viewMode === 'bottlenecks' ? 'Count' : 'Utilization'
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <Card className={`professional-card ${className}`}>
        <CardHeader>
          <CardTitle>Operational Capacity Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="professional-loading">
            <div className="professional-loading-spinner" />
            <p>Loading capacity utilization data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`professional-card ${className}`}>
        <CardHeader>
          <CardTitle>Operational Capacity Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="professional-error">
            <div className="professional-error-icon">⚠️</div>
            <div className="professional-error-message">Failed to load capacity data</div>
            <div className="professional-error-details">{error.message}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`professional-card ${className}`}>
      <CardHeader className="professional-card-header">
        <div>
          <CardTitle className="professional-card-title">Operational Capacity Utilization</CardTitle>
          <p className="professional-card-subtitle">
            Current vs maximum capacity analysis with bottleneck identification
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Bar Chart</span>
                </div>
              </SelectItem>
              <SelectItem value="radial">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Radial</span>
                </div>
              </SelectItem>
              <SelectItem value="line">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Line Chart</span>
                </div>
              </SelectItem>
              <SelectItem value="pie">
                <div className="flex items-center space-x-2">
                  <PieChartIcon className="h-4 w-4" />
                  <span>Pie Chart</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={metricFilter} onValueChange={(value: MetricFilter) => setMetricFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="high-utilization">High Utilization</SelectItem>
              <SelectItem value="low-efficiency">Low Efficiency</SelectItem>
              <SelectItem value="bottlenecks">Bottlenecks</SelectItem>
            </SelectContent>
          </Select>

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('png')}
              className="professional-button-outline"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Main Content Tabs */}
        <Tabs value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
            <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Chart */}
            <div className="professional-chart-container large">
              {renderChart()}
            </div>

            {/* Department Details */}
            <Card className="professional-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Department Performance</CardTitle>
                  <Select value={sortBy} onValueChange={(value: keyof CapacityMetric) => setSortBy(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utilizationRate">Utilization Rate</SelectItem>
                      <SelectItem value="efficiency">Efficiency</SelectItem>
                      <SelectItem value="bottleneckScore">Bottleneck Score</SelectItem>
                      <SelectItem value="growthPotential">Growth Potential</SelectItem>
                      <SelectItem value="department">Department Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMetrics.map((metric, index) => {
                    const efficiencyStatus = getEfficiencyStatus(metric.efficiency)
                    return (
                      <div key={metric.department} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{metric.department}</h4>
                          <Badge
                            variant="outline"
                            className={efficiencyStatus.color}
                          >
                            {efficiencyStatus.label}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Utilization</span>
                              <span className="font-medium">{formatPercentage(metric.utilizationRate)}</span>
                            </div>
                            <Progress
                              value={metric.utilizationRate}
                              className="h-2"
                              style={{
                                backgroundColor: '#f0f0f0',
                                color: getUtilizationColor(metric.utilizationRate)
                              }}
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Efficiency</span>
                              <span className="font-medium">{formatPercentage(metric.efficiency)}</span>
                            </div>
                            <Progress value={metric.efficiency} className="h-2" />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>
                              <p>Current: {metric.currentCapacity}</p>
                            </div>
                            <div>
                              <p>Maximum: {metric.maximumCapacity}</p>
                            </div>
                          </div>

                          {metric.bottleneckScore > 50 && (
                            <div className="flex items-center space-x-2 text-xs">
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                              <span className="text-orange-600">
                                Bottleneck Risk: {metric.bottleneckScore.toFixed(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="utilization" className="space-y-6">
            <div className="professional-chart-container large">
              {renderChart()}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="professional-card">
                <CardHeader>
                  <CardTitle className="text-lg">Utilization Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries({
                      'Critical (>95%)': filteredMetrics.filter(m => m.utilizationRate > 95).length,
                      'High (85-95%)': filteredMetrics.filter(m => m.utilizationRate >= 85 && m.utilizationRate <= 95).length,
                      'Medium (60-85%)': filteredMetrics.filter(m => m.utilizationRate >= 60 && m.utilizationRate < 85).length,
                      'Low (<60%)': filteredMetrics.filter(m => m.utilizationRate < 60).length
                    }).map(([range, count]) => (
                      <div key={range} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{range}</span>
                        <Badge variant="outline">{count} departments</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="professional-card">
                <CardHeader>
                  <CardTitle className="text-lg">Efficiency Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Efficiency</span>
                      <span className="font-medium">
                        {formatPercentage(filteredMetrics.reduce((sum, m) => sum + m.efficiency, 0) / filteredMetrics.length)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Best Performing</span>
                      <span className="font-medium text-green-600">
                        {Math.max(...filteredMetrics.map(m => m.efficiency)).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Worst Performing</span>
                      <span className="font-medium text-red-600">
                        {Math.min(...filteredMetrics.map(m => m.efficiency)).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Departments Below 70%</span>
                      <span className="font-medium text-orange-600">
                        {filteredMetrics.filter(m => m.efficiency < 70).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bottlenecks" className="space-y-6">
            <div className="professional-chart-container large">
              {renderChart()}
            </div>

            <div className="space-y-4">
              {data.bottlenecks.map((bottleneck, index) => (
                <Card key={index} className="professional-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle
                          className={`h-5 w-5 ${
                            bottleneck.severity === 'critical' ? 'text-red-600' :
                            bottleneck.severity === 'severe' ? 'text-orange-600' :
                            bottleneck.severity === 'moderate' ? 'text-yellow-600' : 'text-gray-600'
                          }`}
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{bottleneck.department}</h4>
                          <Badge
                            variant="outline"
                            className={
                              bottleneck.severity === 'critical' ? 'text-red-600 border-red-300' :
                              bottleneck.severity === 'severe' ? 'text-orange-600 border-orange-300' :
                              bottleneck.severity === 'moderate' ? 'text-yellow-600 border-yellow-300' :
                              'text-gray-600 border-gray-300'
                            }
                          >
                            {bottleneck.severity} severity
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {bottleneck.impact.toFixed(0)}
                        </p>
                        <p className="text-xs text-gray-500">Impact Score</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h5 className="font-medium text-gray-700 mb-2">Suggested Actions:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {bottleneck.suggestedActions.map((action, actionIndex) => (
                          <li key={actionIndex} className="flex items-start space-x-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <div className="professional-chart-container large">
              {renderChart()}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="professional-card">
                <CardHeader>
                  <CardTitle className="text-lg">Capacity Planning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.forecasting.capacityNeeds.map((need, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-900">{need.timeframe}</h4>
                          <Badge variant="outline">
                            +{need.additionalCapacity}% capacity
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Investment Required: <span className="font-medium">{formatCurrency(need.investmentRequired)}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="professional-card">
                <CardHeader>
                  <CardTitle className="text-lg">Optimization Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Quick Wins</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        {data.optimization.quickWins.map((win, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{win}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Long-term Strategy</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {data.optimization.longTermStrategy.map((strategy, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Controls */}
        {onExport && (
          <div className="professional-export-controls">
            <Select onValueChange={(format: ExportConfig['format']) => handleExport(format)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG Image</SelectItem>
                <SelectItem value="pdf">PDF Report</SelectItem>
                <SelectItem value="excel">Excel Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  )
}