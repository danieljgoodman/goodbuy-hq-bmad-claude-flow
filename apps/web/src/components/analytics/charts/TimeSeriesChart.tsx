'use client'

import React, { useState, useMemo } from 'react'
import { Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Brush } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { AnalyticsData } from '@/types'
import { TrendingUp, TrendingDown, Download, Settings, Maximize2 } from 'lucide-react'

interface TimeSeriesChartProps {
  data: Record<string, AnalyticsData[]>
  title: string
  showBenchmarks?: boolean
  showGoals?: boolean
  height?: number
  allowZoom?: boolean
  allowExport?: boolean
  colors?: string[]
  timeRange?: string
  onTimeRangeChange?: (range: string) => void
  onExport?: () => void
}

const timeRangeOptions = [
  { value: '7days', label: '7 Days' },
  { value: '1month', label: '1 Month' },
  { value: '3months', label: '3 Months' },
  { value: '6months', label: '6 Months' },
  { value: '1year', label: '1 Year' },
  { value: 'all', label: 'All Time' }
]

const defaultColors = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'
]

export function TimeSeriesChart({ 
  data, 
  title,
  showBenchmarks = false,
  showGoals = false,
  height = 300,
  allowZoom = true,
  allowExport = true,
  colors = defaultColors,
  timeRange = '3months',
  onTimeRangeChange,
  onExport
}: TimeSeriesChartProps) {
  const [selectedRange, setSelectedRange] = useState(timeRange)
  const [zoomEnabled, setZoomEnabled] = useState(false)
  const [showLegend, setShowLegend] = useState(true)

  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return []

    // Get all unique timestamps
    const allTimestamps = new Set<string>()
    Object.values(data).forEach(metricData => {
      metricData.forEach(point => {
        allTimestamps.add(point.timestamp.toISOString())
      })
    })

    // Sort timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort()

    // Create chart data points
    return sortedTimestamps.map(timestamp => {
      const dataPoint: any = {
        timestamp,
        date: new Date(timestamp).toLocaleDateString(),
        fullDate: new Date(timestamp)
      }

      // Add values for each metric
      Object.keys(data).forEach(metric => {
        const metricPoint = data[metric].find(p => 
          p.timestamp.toISOString() === timestamp
        )
        if (metricPoint) {
          dataPoint[metric] = metricPoint.value
          // Add benchmark and goal if available
          if (showBenchmarks && metricPoint.metadata.industry_benchmark) {
            dataPoint[`${metric}_benchmark`] = metricPoint.metadata.industry_benchmark
          }
          if (showGoals && metricPoint.metadata.target_value) {
            dataPoint[`${metric}_goal`] = metricPoint.metadata.target_value
          }
        }
      })

      return dataPoint
    })
  }, [data, showBenchmarks, showGoals])

  const metrics = Object.keys(data || {})

  const handleTimeRangeChange = (newRange: string) => {
    setSelectedRange(newRange)
    onTimeRangeChange?.(newRange)
  }

  const handleExport = () => {
    onExport?.()
  }

  const formatValue = (value: number, metric: string) => {
    if (metric.includes('percentage') || metric.includes('rate')) {
      return `${value.toFixed(1)}%`
    }
    if (metric.includes('revenue') || metric.includes('valuation')) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    if (metric.includes('score')) {
      return value.toFixed(1)
    }
    return value.toLocaleString()
  }

  const getTrendDirection = (metricData: AnalyticsData[]) => {
    if (metricData.length < 2) return null
    const first = metricData[0].value
    const last = metricData[metricData.length - 1].value
    return last > first ? 'up' : 'down'
  }

  const calculateTrendPercentage = (metricData: AnalyticsData[]) => {
    if (metricData.length < 2) return 0
    const first = metricData[0].value
    const last = metricData[metricData.length - 1].value
    return ((last - first) / first) * 100
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {/* Trend indicators */}
          {metrics.map((metric, index) => {
            const trendDirection = getTrendDirection(data[metric])
            const trendPercentage = calculateTrendPercentage(data[metric])
            if (!trendDirection) return null

            return (
              <Badge 
                key={metric}
                variant={trendDirection === 'up' ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                {trendDirection === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(trendPercentage).toFixed(1)}%
              </Badge>
            )
          })}

          {/* Controls */}
          <Select value={selectedRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {allowExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Chart controls */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <Switch
              id="zoom"
              checked={zoomEnabled}
              onCheckedChange={setZoomEnabled}
            />
            <label htmlFor="zoom">Enable Zoom</label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="legend"
              checked={showLegend}
              onCheckedChange={setShowLegend}
            />
            <label htmlFor="legend">Show Legend</label>
          </div>
        </div>

        {/* Chart */}
        <div style={{ width: '100%', height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                  return value.toFixed(0)
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  
                  return (
                    <div className="bg-white border rounded-lg shadow-lg p-3">
                      <p className="font-medium text-sm mb-2">{label}</p>
                      {payload.map((entry, index) => {
                        if (!entry.dataKey?.toString().includes('benchmark') && 
                            !entry.dataKey?.toString().includes('goal')) {
                          return (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.dataKey}: {formatValue(entry.value as number, entry.dataKey as string)}
                            </p>
                          )
                        }
                        return null
                      })}
                    </div>
                  )
                }}
              />
              {showLegend && <Legend />}

              {/* Metric lines */}
              {metrics.map((metric, index) => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name={metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                />
              ))}

              {/* Benchmark lines */}
              {showBenchmarks && metrics.map((metric, index) => (
                <ReferenceLine
                  key={`${metric}_benchmark`}
                  y={data[metric]?.[0]?.metadata?.industry_benchmark}
                  stroke={colors[index % colors.length]}
                  strokeDasharray="5 5"
                  opacity={0.6}
                />
              ))}

              {/* Goal lines */}
              {showGoals && metrics.map((metric, index) => (
                <ReferenceLine
                  key={`${metric}_goal`}
                  y={data[metric]?.[0]?.metadata?.target_value}
                  stroke={colors[index % colors.length]}
                  strokeDasharray="10 5"
                  opacity={0.8}
                />
              ))}

              {/* Zoom brush */}
              {zoomEnabled && (
                <Brush 
                  dataKey="date"
                  height={30}
                  stroke={colors[0]}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        {metrics.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => {
              const metricData = data[metric]
              if (!metricData || metricData.length === 0) return null

              const currentValue = metricData[metricData.length - 1].value
              const previousValue = metricData.length > 1 ? metricData[metricData.length - 2].value : 0
              const change = currentValue - previousValue
              const changePercentage = previousValue > 0 ? (change / previousValue) * 100 : 0

              return (
                <div key={metric} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">
                    {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-lg font-bold">
                    {formatValue(currentValue, metric)}
                  </p>
                  <p className={`text-sm ${changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {changePercentage >= 0 ? '+' : ''}{changePercentage.toFixed(1)}%
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}