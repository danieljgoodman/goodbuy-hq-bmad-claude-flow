'use client'

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// Note: Select component removed for build compatibility
import { Badge } from '@/components/ui/badge'
import type { ChartDataPoint, DateRange } from '@/types/dashboard'
import type { BarChartProps } from '@/types/charts'
import { useState } from 'react'
import { cssVars } from '@/lib/utils/colors'

interface TrendBarChartProps extends Omit<BarChartProps, 'data' | 'xAxisKey' | 'yAxisKey'> {
  data: ChartDataPoint[]
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange['period']) => void
  title?: string
  subtitle?: string
  dataKey?: string
  barColors?: string[]
  showComparison?: boolean
}

const formatValue = (value: number, category: string) => {
  switch (category) {
    case 'revenue':
    case 'valuation':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        notation: value >= 1000000 ? 'compact' : 'standard'
      }).format(value)
    
    case 'growth':
    case 'score':
      return `${value.toFixed(1)}%`
    
    case 'count':
    default:
      return new Intl.NumberFormat('en-US').format(value)
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium">{formatDate(label)}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 mt-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">
              {entry.name}: {formatValue(entry.value, data?.category || 'number')}
            </span>
          </div>
        ))}
        {data?.metadata && (
          <div className="text-xs text-muted-foreground mt-2">
            {Object.entries(data.metadata).map(([key, value]) => (
              <div key={key}>{key}: {String(value)}</div>
            ))}
          </div>
        )}
      </div>
    )
  }
  return null
}

const getBarColor = (category: string) => {
  const colorMap: Record<string, string> = {
    revenue: cssVars.success,
    valuation: cssVars.info, 
    growth: cssVars.chart5,
    score: cssVars.warning,
    health: cssVars.warning,
    count: cssVars.neutral,
    risk: cssVars.danger
  }
  return colorMap[category] || cssVars.neutral
}

export default function TrendBarChart({
  data,
  dateRange,
  onDateRangeChange,
  title = "Performance Trends",
  subtitle = "Track key metrics over time",
  dataKey = "value",
  barColors,
  showComparison = false,
  height = 300,
  responsive = true,
  orientation = 'vertical',
  showLabels = false,
  className = "",
  onBarClick
}: TrendBarChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<DateRange['period']>('30d')
  const [selectedMetric, setSelectedMetric] = useState('all')

  const handlePeriodChange = (period: DateRange['period']) => {
    setSelectedPeriod(period)
    onDateRangeChange?.(period)
  }

  // Get unique categories for metric selection
  const categories = Array.from(new Set(data.map(d => d.category)))
  const filteredData = selectedMetric === 'all' ? data : data.filter(d => d.category === selectedMetric)

  // Calculate trend
  const trend = filteredData.length > 1 ? {
    change: ((filteredData[filteredData.length - 1]?.value - filteredData[0]?.value) / Math.abs(filteredData[0]?.value) * 100) || 0,
    isPositive: (filteredData[filteredData.length - 1]?.value || 0) > (filteredData[0]?.value || 0)
  } : null

  // Determine if this should be a line chart (for health scores)
  const shouldShowAsLineChart = title.toLowerCase().includes('health score') || 
                                title.toLowerCase().includes('progression') ||
                                filteredData[0]?.category === 'score' ||
                                filteredData[0]?.category === 'health'

  const chartComponent = responsive ? (
    <ResponsiveContainer width="100%" height={height}>
      {shouldShowAsLineChart ? (
        <LineChart 
          data={filteredData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tickFormatter={formatDate} />
          <YAxis tickFormatter={(value) => formatValue(value, filteredData[0]?.category || 'number')} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={barColors?.[0] || getBarColor(filteredData[0]?.category || 'number')}
            strokeWidth={2}
            dot={{ r: 4, fill: barColors?.[0] || getBarColor(filteredData[0]?.category || 'number') }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      ) : (
        <BarChart 
          data={filteredData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          {orientation === 'horizontal' ? (
            <>
              <XAxis type="number" tickFormatter={(value) => formatValue(value, filteredData[0]?.category || 'number')} />
              <YAxis type="category" dataKey="date" tickFormatter={formatDate} />
            </>
          ) : (
            <>
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis tickFormatter={(value) => formatValue(value, filteredData[0]?.category || 'number')} />
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          {categories.length > 1 && <Legend />}
          
          {categories.length === 1 ? (
            <Bar 
              dataKey={dataKey}
              fill={barColors?.[0] || getBarColor(filteredData[0]?.category || 'number')}
              radius={[4, 4, 0, 0]}
              name={filteredData[0]?.category || 'Value'}
              onClick={onBarClick}
            />
          ) : (
            categories.map((category, index) => (
              <Bar
                key={category}
                dataKey={dataKey}
                fill={barColors?.[index] || getBarColor(category)}
                radius={[4, 4, 0, 0]}
                name={category}
                onClick={onBarClick}
              />
            ))
          )}
        </BarChart>
      )}
    </ResponsiveContainer>
  ) : (
    <BarChart 
      width={800} 
      height={height} 
      data={filteredData}
      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
      <XAxis dataKey="date" tickFormatter={formatDate} />
      <YAxis tickFormatter={(value) => formatValue(value, filteredData[0]?.category || 'number')} />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Bar 
        dataKey={dataKey}
        fill={barColors?.[0] || getBarColor(filteredData[0]?.category || 'number')}
        radius={[4, 4, 0, 0]}
        onClick={onBarClick}
      />
    </BarChart>
  )

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg">{title}</CardTitle>
              {trend && (
                <Badge variant={trend.isPositive ? "default" : "destructive"} className="text-xs">
                  {trend.isPositive ? '+' : ''}{trend.change.toFixed(1)}%
                </Badge>
              )}
            </div>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            {categories.length > 1 && (
              <div className="text-sm px-3 py-1 border rounded">
                {selectedMetric === 'all' ? 'All Metrics' : selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
              </div>
            )}
            
            <div className="text-sm px-3 py-1 border rounded">
              {selectedPeriod === '7d' && '7 Days'}
              {selectedPeriod === '30d' && '30 Days'}
              {selectedPeriod === '90d' && '90 Days'}
              {selectedPeriod === '1y' && '1 Year'}
              {selectedPeriod === 'all' && 'All Time'}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p>No trend data available</p>
              <p className="text-sm mt-1">Complete evaluations to see performance trends</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chartComponent}
            
            <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
              <div>
                Latest: {formatValue(filteredData[filteredData.length - 1]?.value || 0, filteredData[0]?.category || 'number')}
              </div>
              <div>
                {filteredData.length} data point{filteredData.length !== 1 ? 's' : ''}
              </div>
              <div>
                {selectedMetric !== 'all' && (
                  <>Metric: {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}</>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}