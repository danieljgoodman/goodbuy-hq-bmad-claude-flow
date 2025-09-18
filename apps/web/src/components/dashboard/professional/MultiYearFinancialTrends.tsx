'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Download, BarChart3, LineChart as LineChartIcon, AreaChartIcon } from 'lucide-react'
import type { MultiYearFinancialData, ExportConfig } from '@/types/professional-dashboard'
import { FinancialAnalytics } from '@/lib/analytics/professional-calculations'

interface MultiYearFinancialTrendsProps {
  data: MultiYearFinancialData
  loading?: boolean
  error?: Error | null
  onExport?: (format: ExportConfig['format']) => Promise<string>
  className?: string
}

type ChartType = 'line' | 'area' | 'bar'
type TimeRange = 'all' | '3-year' | '5-year' | 'projection'
type MetricFocus = 'all' | 'revenue' | 'profit' | 'cashFlow'

const PROFESSIONAL_COLORS = {
  primary: '#8b4513',
  secondary: '#d2b48c',
  accent: '#cd853f',
  success: '#2d5930',
  warning: '#b8860b',
  error: '#8b2635',
  info: '#4a6fa5'
}

const CHART_COLORS = {
  revenue: PROFESSIONAL_COLORS.primary,
  profit: PROFESSIONAL_COLORS.accent,
  cashFlow: PROFESSIONAL_COLORS.info,
  industryRevenue: '#e8e4e0',
  industryProfit: '#f5f3f0',
  marketRevenue: '#c8a882',
  marketProfit: '#b8956a'
}

export function MultiYearFinancialTrends({
  data,
  loading = false,
  error,
  onExport,
  className = ''
}: MultiYearFinancialTrendsProps) {
  const [chartType, setChartType] = useState<ChartType>('line')
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [metricFocus, setMetricFocus] = useState<MetricFocus>('all')
  const [showBenchmarks, setShowBenchmarks] = useState(true)
  const [showProjections, setShowProjections] = useState(true)

  // Prepare chart data based on filters
  const chartData = useMemo(() => {
    let baseData = [...data.trends]

    // Add projections if enabled
    if (showProjections) {
      baseData = [...baseData, ...data.projections.map(p => ({ ...p, isProjection: true }))]
    }

    // Filter by time range
    if (timeRange === '3-year') {
      const cutoffYear = Math.max(...baseData.map(d => d.year)) - 2
      baseData = baseData.filter(d => d.year >= cutoffYear)
    } else if (timeRange === '5-year') {
      const cutoffYear = Math.max(...baseData.map(d => d.year)) - 4
      baseData = baseData.filter(d => d.year >= cutoffYear)
    } else if (timeRange === 'projection') {
      baseData = data.projections
    }

    // Add benchmark data if enabled
    if (showBenchmarks && timeRange !== 'projection') {
      const trendsOnly = baseData.filter(d => !d.isProjection)
      const industryData = data.benchmarks.industry.slice(0, trendsOnly.length)
      const marketData = data.benchmarks.market.slice(0, trendsOnly.length)

      return baseData.map((item, index) => {
        const result = { ...item }
        if (!item.isProjection && industryData[index] && marketData[index]) {
          result.industryRevenue = industryData[index].revenue
          result.industryProfit = industryData[index].profit
          result.marketRevenue = marketData[index].revenue
          result.marketProfit = marketData[index].profit
        }
        return result
      })
    }

    return baseData
  }, [data, timeRange, showBenchmarks, showProjections])

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const latest = data.trends[data.trends.length - 1]
    const previous = data.trends[data.trends.length - 2]

    if (!latest || !previous) {
      return {
        revenueGrowth: 0,
        profitGrowth: 0,
        cashFlowGrowth: 0,
        cagr: 0
      }
    }

    const revenueGrowth = FinancialAnalytics.calculateGrowthRate(latest.revenue, previous.revenue)
    const profitGrowth = FinancialAnalytics.calculateGrowthRate(latest.profit, previous.profit)
    const cashFlowGrowth = FinancialAnalytics.calculateGrowthRate(latest.cashFlow, previous.cashFlow)

    const firstYear = data.trends[0]
    const years = latest.year - firstYear.year
    const cagr = FinancialAnalytics.calculateCAGR(firstYear.revenue, latest.revenue, years)

    return {
      revenueGrowth,
      profitGrowth,
      cashFlowGrowth,
      cagr
    }
  }, [data.trends])

  // Format currency values
  const formatCurrency = useCallback((value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value.toLocaleString()}`
  }, [])

  // Format percentage values
  const formatPercentage = useCallback((value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }, [])

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isProjection = payload[0]?.payload?.isProjection
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">
            {label} {isProjection && <Badge variant="outline">Projected</Badge>}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
              {entry.payload.growthRate && entry.dataKey === 'revenue' && (
                <span className="ml-2 text-xs text-gray-500">
                  ({formatPercentage(entry.payload.growthRate.revenue)})
                </span>
              )}
            </p>
          ))}
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
        console.error('Failed to export chart:', error)
      }
    }
  }, [onExport])

  // Render growth indicator
  const renderGrowthIndicator = (value: number, label: string) => {
    const isPositive = value > 0
    const isNegative = value < 0
    const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

    return (
      <div className="flex items-center space-x-2">
        <Icon
          className={`h-4 w-4 ${
            isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-400'
          }`}
        />
        <span className="text-sm font-medium">{label}</span>
        <span
          className={`text-sm font-bold ${
            isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
          }`}
        >
          {formatPercentage(value)}
        </span>
      </div>
    )
  }

  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    }

    const getMetricLines = () => {
      const lines = []

      if (metricFocus === 'all' || metricFocus === 'revenue') {
        lines.push(
          chartType === 'line' ? (
            <Line
              key="revenue"
              type="monotone"
              dataKey="revenue"
              stroke={CHART_COLORS.revenue}
              strokeWidth={3}
              dot={{ fill: CHART_COLORS.revenue, strokeWidth: 2, r: 4 }}
              name="Revenue"
            />
          ) : chartType === 'area' ? (
            <Area
              key="revenue"
              type="monotone"
              dataKey="revenue"
              stackId="1"
              stroke={CHART_COLORS.revenue}
              fill={CHART_COLORS.revenue}
              fillOpacity={0.6}
              name="Revenue"
            />
          ) : (
            <Bar
              key="revenue"
              dataKey="revenue"
              fill={CHART_COLORS.revenue}
              name="Revenue"
            />
          )
        )
      }

      if (metricFocus === 'all' || metricFocus === 'profit') {
        lines.push(
          chartType === 'line' ? (
            <Line
              key="profit"
              type="monotone"
              dataKey="profit"
              stroke={CHART_COLORS.profit}
              strokeWidth={3}
              dot={{ fill: CHART_COLORS.profit, strokeWidth: 2, r: 4 }}
              name="Profit"
            />
          ) : chartType === 'area' ? (
            <Area
              key="profit"
              type="monotone"
              dataKey="profit"
              stackId="2"
              stroke={CHART_COLORS.profit}
              fill={CHART_COLORS.profit}
              fillOpacity={0.6}
              name="Profit"
            />
          ) : (
            <Bar
              key="profit"
              dataKey="profit"
              fill={CHART_COLORS.profit}
              name="Profit"
            />
          )
        )
      }

      if (metricFocus === 'all' || metricFocus === 'cashFlow') {
        lines.push(
          chartType === 'line' ? (
            <Line
              key="cashFlow"
              type="monotone"
              dataKey="cashFlow"
              stroke={CHART_COLORS.cashFlow}
              strokeWidth={3}
              dot={{ fill: CHART_COLORS.cashFlow, strokeWidth: 2, r: 4 }}
              name="Cash Flow"
            />
          ) : chartType === 'area' ? (
            <Area
              key="cashFlow"
              type="monotone"
              dataKey="cashFlow"
              stackId="3"
              stroke={CHART_COLORS.cashFlow}
              fill={CHART_COLORS.cashFlow}
              fillOpacity={0.6}
              name="Cash Flow"
            />
          ) : (
            <Bar
              key="cashFlow"
              dataKey="cashFlow"
              fill={CHART_COLORS.cashFlow}
              name="Cash Flow"
            />
          )
        )
      }

      // Add benchmark lines for line charts only
      if (chartType === 'line' && showBenchmarks) {
        if (metricFocus === 'all' || metricFocus === 'revenue') {
          lines.push(
            <Line
              key="industryRevenue"
              type="monotone"
              dataKey="industryRevenue"
              stroke={CHART_COLORS.industryRevenue}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Industry Avg Revenue"
            />,
            <Line
              key="marketRevenue"
              type="monotone"
              dataKey="marketRevenue"
              stroke={CHART_COLORS.marketRevenue}
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={false}
              name="Market Leader Revenue"
            />
          )
        }
      }

      return lines
    }

    const ChartComponent = chartType === 'line' ? LineChart : chartType === 'area' ? AreaChart : BarChart

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="year"
            stroke="#666"
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#d0d0d0' }}
          />
          <YAxis
            stroke="#666"
            tick={{ fontSize: 12 }}
            tickFormatter={formatCurrency}
            axisLine={{ stroke: '#d0d0d0' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {getMetricLines()}
          {showProjections && (
            <ReferenceLine
              x={data.trends[data.trends.length - 1]?.year}
              stroke="#999"
              strokeDasharray="2 2"
              label="Projection Start"
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    )
  }

  if (loading) {
    return (
      <Card className={`professional-card ${className}`}>
        <CardHeader>
          <CardTitle>Multi-Year Financial Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="professional-loading">
            <div className="professional-loading-spinner" />
            <p>Loading financial trend data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`professional-card ${className}`}>
        <CardHeader>
          <CardTitle>Multi-Year Financial Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="professional-error">
            <div className="professional-error-icon">⚠️</div>
            <div className="professional-error-message">Failed to load financial data</div>
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
          <CardTitle className="professional-card-title">Multi-Year Financial Trends</CardTitle>
          <p className="professional-card-subtitle">
            3-year revenue, profit, and cash flow analysis with growth calculations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">
                <div className="flex items-center space-x-2">
                  <LineChartIcon className="h-4 w-4" />
                  <span>Line</span>
                </div>
              </SelectItem>
              <SelectItem value="area">
                <div className="flex items-center space-x-2">
                  <AreaChartIcon className="h-4 w-4" />
                  <span>Area</span>
                </div>
              </SelectItem>
              <SelectItem value="bar">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Bar</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="3-year">Last 3 Years</SelectItem>
              <SelectItem value="5-year">Last 5 Years</SelectItem>
              <SelectItem value="projection">Projections</SelectItem>
            </SelectContent>
          </Select>

          <Select value={metricFocus} onValueChange={(value: MetricFocus) => setMetricFocus(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              <SelectItem value="revenue">Revenue Only</SelectItem>
              <SelectItem value="profit">Profit Only</SelectItem>
              <SelectItem value="cashFlow">Cash Flow Only</SelectItem>
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
        {/* Key Metrics Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="professional-metric">
            <div className="professional-metric-value">
              {formatPercentage(keyMetrics.cagr)}
            </div>
            <div className="professional-metric-label">CAGR</div>
          </div>
          <div className="professional-metric">
            <div className="professional-metric-value">
              {formatCurrency(data.trends[data.trends.length - 1]?.revenue || 0)}
            </div>
            <div className="professional-metric-label">Latest Revenue</div>
          </div>
          <div className="professional-metric">
            <div className="professional-metric-value">
              {data.insights.volatilityIndex.toFixed(1)}
            </div>
            <div className="professional-metric-label">Volatility Index</div>
          </div>
          <div className="professional-metric">
            <Badge
              variant={
                data.insights.trendDirection === 'positive'
                  ? 'default'
                  : data.insights.trendDirection === 'negative'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {data.insights.trendDirection}
            </Badge>
            <div className="professional-metric-label">Trend Direction</div>
          </div>
        </div>

        {/* Growth Indicators */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {renderGrowthIndicator(keyMetrics.revenueGrowth, 'Revenue Growth')}
          {renderGrowthIndicator(keyMetrics.profitGrowth, 'Profit Growth')}
          {renderGrowthIndicator(keyMetrics.cashFlowGrowth, 'Cash Flow Growth')}
        </div>

        {/* Chart */}
        <div className="professional-chart-container large">
          {renderChart()}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showBenchmarks}
                onChange={(e) => setShowBenchmarks(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Show Benchmarks</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showProjections}
                onChange={(e) => setShowProjections(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Show Projections</span>
            </label>
          </div>

          {onExport && (
            <div className="professional-export-controls">
              <Select onValueChange={(format: ExportConfig['format']) => handleExport(format)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG Image</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="excel">Excel Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Insights and Recommendations */}
        {data.insights.recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Key Insights</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {data.insights.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}