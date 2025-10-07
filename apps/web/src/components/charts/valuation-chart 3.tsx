'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// Note: Select component removed for build compatibility
import { Badge } from '@/components/ui/badge'
import type { ChartDataPoint, DateRange } from '@/types/dashboard'
import type { LineChartProps } from '@/types/charts'
import { useState } from 'react'

interface ValuationChartProps extends Omit<LineChartProps, 'data' | 'xAxisKey' | 'yAxisKey'> {
  data: ChartDataPoint[]
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange['period']) => void
  showComparison?: boolean
  title?: string
  subtitle?: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: value >= 1000000 ? 'compact' : 'standard'
  }).format(value)
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
              {entry.name}: {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function ValuationChart({
  data,
  dateRange,
  onDateRangeChange,
  showComparison = false,
  title = "Business Valuation Trend",
  subtitle = "Track your business value over time",
  height = 300,
  responsive = true,
  lineColor = "#3B82F6",
  strokeWidth = 2,
  showDots = true,
  showGrid = true,
  className = "",
  onPointClick
}: ValuationChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<DateRange['period']>('30d')

  const handlePeriodChange = (period: DateRange['period']) => {
    setSelectedPeriod(period)
    onDateRangeChange?.(period)
  }

  // Calculate trend
  const trend = data.length > 1 ? {
    change: ((data[data.length - 1]?.value - data[0]?.value) / data[0]?.value * 100) || 0,
    isPositive: (data[data.length - 1]?.value || 0) > (data[0]?.value || 0)
  } : null

  const chartComponent = responsive ? (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          className="text-muted-foreground text-xs"
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tickFormatter={formatCurrency}
          className="text-muted-foreground text-xs"
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={lineColor}
          strokeWidth={strokeWidth}
          dot={showDots ? { fill: lineColor, strokeWidth: 2, r: 4 } : false}
          activeDot={{ r: 6, fill: lineColor }}
          name="Valuation"
          onClick={onPointClick}
        />
      </LineChart>
    </ResponsiveContainer>
  ) : (
    <LineChart width={800} height={height} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
      <XAxis 
        dataKey="date" 
        tickFormatter={formatDate}
        className="text-muted-foreground text-xs"
      />
      <YAxis 
        tickFormatter={formatCurrency}
        className="text-muted-foreground text-xs"
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Line 
        type="monotone" 
        dataKey="value" 
        stroke={lineColor}
        strokeWidth={strokeWidth}
        dot={showDots ? { fill: lineColor, strokeWidth: 2, r: 4 } : false}
        activeDot={{ r: 6, fill: lineColor }}
        name="Valuation"
        onClick={onPointClick}
      />
    </LineChart>
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
          
          <div className="text-sm px-3 py-1 border rounded">
            {selectedPeriod === '7d' && '7 Days'}
            {selectedPeriod === '30d' && '30 Days'}
            {selectedPeriod === '90d' && '90 Days'}
            {selectedPeriod === '1y' && '1 Year'}
            {selectedPeriod === 'all' && 'All Time'}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p>No valuation data available</p>
              <p className="text-sm mt-1">Complete an evaluation to see trends</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chartComponent}
            
            {data.length > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
                <div>
                  Latest: {formatCurrency(data[data.length - 1]?.value || 0)}
                </div>
                <div>
                  {data.length} data point{data.length !== 1 ? 's' : ''}
                </div>
                <div>
                  Range: {formatDate(data[0]?.date || '')} - {formatDate(data[data.length - 1]?.date || '')}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}