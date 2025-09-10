'use client'

import React, { useState } from 'react'
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AnalyticsData } from '@/types'
import { TrendingUp, TrendingDown, DollarSign, Target, Activity } from 'lucide-react'

interface ValuationTrendChartProps {
  data: AnalyticsData[]
  title?: string
  showProjection?: boolean
  showBenchmark?: boolean
  showGoal?: boolean
  height?: number
  benchmark?: number
  goal?: number
}

export function ValuationTrendChart({
  data,
  title = 'Business Valuation Trend',
  showProjection = true,
  showBenchmark = false,
  showGoal = false,
  height = 350,
  benchmark,
  goal
}: ValuationTrendChartProps) {
  const [selectedView, setSelectedView] = useState<'absolute' | 'percentage'>('absolute')

  // Process data for chart
  const chartData = data.map((point, index) => ({
    date: point.timestamp.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    fullDate: point.timestamp,
    value: point.value,
    // Calculate percentage change from baseline
    percentageChange: index > 0 ? ((point.value - data[0].value) / data[0].value) * 100 : 0,
    confidence: point.metadata.confidence || 0.8
  }))

  // Add projection data if enabled
  if (showProjection && data.length > 0) {
    const lastValue = data[data.length - 1].value
    const lastDate = data[data.length - 1].timestamp
    const trend = calculateTrend(data)
    
    // Project 3 months ahead
    for (let i = 1; i <= 12; i++) {
      const futureDate = new Date(lastDate)
      futureDate.setDate(futureDate.getDate() + (i * 7)) // Weekly projections
      
      const projectedValue = lastValue + (trend.slope * i * 7)
      const uncertainty = Math.min(0.15 * i, 0.5) // Increasing uncertainty
      
      chartData.push({
        date: futureDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        fullDate: futureDate,
        value: projectedValue,
        percentageChange: ((projectedValue - data[0].value) / data[0].value) * 100,
        confidence: Math.max(0.4, 0.9 - uncertainty),
        isProjection: true
      })
    }
  }

  const currentValue = data.length > 0 ? data[data.length - 1].value : 0
  const previousValue = data.length > 1 ? data[data.length - 2].value : 0
  const change = currentValue - previousValue
  const changePercentage = previousValue > 0 ? (change / previousValue) * 100 : 0
  const trend = calculateTrend(data)

  const formatValue = (value: number) => {
    if (selectedView === 'percentage') {
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
    }
    return `$${(value / 1000).toFixed(0)}K`
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          {title}
        </CardTitle>
        
        <div className="flex items-center gap-2">
          <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="absolute">Absolute</SelectItem>
              <SelectItem value="percentage">% Change</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant={changePercentage >= 0 ? 'default' : 'destructive'} className="flex items-center gap-1">
            {changePercentage >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(changePercentage).toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Current Value</p>
            <p className="text-xl font-bold text-green-600">
              ${(currentValue / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Change</p>
            <p className={`text-xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}${(change / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Trend Confidence</p>
            <p className="text-xl font-bold text-blue-600">
              {(trend.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Chart */}
        <div style={{ width: '100%', height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="valuationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatValue}
              />
              
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  
                  const data = payload[0].payload
                  return (
                    <div className="bg-white border rounded-lg shadow-lg p-3">
                      <p className="font-medium text-sm mb-2">{label}</p>
                      <p className="text-sm text-green-600">
                        Value: ${(data.value / 1000).toFixed(0)}K
                      </p>
                      <p className="text-sm text-gray-600">
                        Change: {data.percentageChange >= 0 ? '+' : ''}{data.percentageChange.toFixed(1)}%
                      </p>
                      {data.isProjection && (
                        <p className="text-sm text-blue-600">
                          Confidence: {(data.confidence * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  )
                }}
              />

              <Area
                type="monotone"
                dataKey={selectedView === 'absolute' ? 'value' : 'percentageChange'}
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#valuationGradient)"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />

              {/* Benchmark line */}
              {showBenchmark && benchmark && (
                <ReferenceLine
                  y={benchmark}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  label={{ value: "Industry Avg", position: "topLeft" }}
                />
              )}

              {/* Goal line */}
              {showGoal && goal && (
                <ReferenceLine
                  y={goal}
                  stroke="#ef4444"
                  strokeDasharray="10 5"
                  label={{ value: "Target", position: "topLeft" }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Trend analysis */}
        <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Trend Analysis</p>
              <p className="text-xs text-gray-600">
                {trend.direction === 'increasing' ? 'Upward' : 
                 trend.direction === 'decreasing' ? 'Downward' : 'Stable'} trend
                with {(trend.confidence * 100).toFixed(0)}% confidence
              </p>
            </div>
          </div>

          {showProjection && (
            <div className="text-right">
              <p className="text-sm font-medium">3-Month Projection</p>
              <p className="text-xs text-gray-600">
                ${((currentValue + trend.slope * 90) / 1000).toFixed(0)}K
                {trend.slope > 0 ? ' (Growth)' : ' (Decline)'}
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Historical Data</span>
          </div>
          {showProjection && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded opacity-60"></div>
              <span>Projection</span>
            </div>
          )}
          {showBenchmark && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-yellow-500 border-dashed"></div>
              <span>Benchmark</span>
            </div>
          )}
          {showGoal && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500 border-dashed"></div>
              <span>Target</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function calculateTrend(data: AnalyticsData[]) {
  if (data.length < 2) {
    return { slope: 0, direction: 'stable' as const, confidence: 0 }
  }

  // Simple linear regression
  const n = data.length
  const x = data.map((_, i) => i)
  const y = data.map(d => d.value)
  
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  
  // Calculate R-squared for confidence
  const yMean = sumY / n
  const totalSumSquares = y.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0)
  const residualSumSquares = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + (sumY - slope * sumX) / n
    return sum + (yi - predicted) ** 2
  }, 0)
  
  const rSquared = 1 - residualSumSquares / totalSumSquares
  const confidence = Math.max(0, Math.min(1, rSquared))
  
  const direction = Math.abs(slope) < 100 ? 'stable' : slope > 0 ? 'increasing' : 'decreasing'
  
  return { slope, direction, confidence }
}