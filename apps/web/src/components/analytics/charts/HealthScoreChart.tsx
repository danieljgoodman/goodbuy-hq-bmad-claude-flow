'use client'

import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AnalyticsData } from '@/types'
import { Heart, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle } from 'lucide-react'

interface HealthScoreChartProps {
  data: AnalyticsData[]
  title?: string
  showBreakdown?: boolean
  showMilestones?: boolean
  height?: number
  target?: number
}

interface HealthDimension {
  name: string
  score: number
  weight: number
  color: string
  status: 'good' | 'warning' | 'critical'
}

export function HealthScoreChart({
  data,
  title = 'Business Health Score',
  showBreakdown = true,
  showMilestones = true,
  height = 350,
  target = 80
}: HealthScoreChartProps) {
  const [viewMode, setViewMode] = useState<'trend' | 'current' | 'breakdown'>('current')

  // Mock health dimensions for breakdown
  const healthDimensions: HealthDimension[] = [
    { name: 'Financial', score: 85, weight: 30, color: '#10b981', status: 'good' },
    { name: 'Operational', score: 72, weight: 25, color: '#f59e0b', status: 'warning' },
    { name: 'Market', score: 78, weight: 20, color: '#3b82f6', status: 'good' },
    { name: 'Risk', score: 65, weight: 15, color: '#ef4444', status: 'critical' },
    { name: 'Growth', score: 88, weight: 10, color: '#8b5cf6', status: 'good' }
  ]

  // Process data for different views
  const trendData = data.map(point => ({
    date: point.timestamp.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    score: point.value,
    target: target
  }))

  const currentScore = data.length > 0 ? data[data.length - 1].value : 0
  const previousScore = data.length > 1 ? data[data.length - 2].value : 0
  const change = currentScore - previousScore
  const changePercentage = previousScore > 0 ? (change / previousScore) * 100 : 0

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981' // Green
    if (score >= 60) return '#f59e0b' // Yellow
    return '#ef4444' // Red
  }

  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'good'
    if (score >= 60) return 'warning'
    return 'critical'
  }

  const RadialChart = ({ score }: { score: number }) => {
    const data = [{ value: score, fill: getScoreColor(score) }]
    
    return (
      <div className="relative">
        <ResponsiveContainer width={200} height={200}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={getScoreColor(score)}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: getScoreColor(score) }}>
              {score.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
        </div>
      </div>
    )
  }

  const BreakdownChart = () => {
    const pieData = healthDimensions.map(dim => ({
      name: dim.name,
      value: dim.score,
      fill: dim.color
    }))

    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <ResponsiveContainer width={250} height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0]
                  return (
                    <div className="bg-white border rounded-lg shadow-lg p-3">
                      <p className="font-medium text-sm">{data.name}</p>
                      <p className="text-sm" style={{ color: data.payload.fill }}>
                        Score: {data.value}/100
                      </p>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Dimension details */}
        <div className="space-y-2">
          {healthDimensions.map((dim) => (
            <div key={dim.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: dim.color }}
                ></div>
                <div>
                  <p className="font-medium text-sm">{dim.name}</p>
                  <p className="text-xs text-gray-600">Weight: {dim.weight}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{dim.score}</span>
                {dim.status === 'good' && <CheckCircle className="h-4 w-4 text-green-600" />}
                {dim.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                {dim.status === 'critical' && <AlertTriangle className="h-4 w-4 text-red-600" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-600" />
          {title}
        </CardTitle>
        
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current</SelectItem>
              <SelectItem value="trend">Trend</SelectItem>
              <SelectItem value="breakdown">Breakdown</SelectItem>
            </SelectContent>
          </Select>

          <Badge 
            variant={currentScore >= target ? 'default' : currentScore >= 60 ? 'secondary' : 'destructive'}
            className="flex items-center gap-1"
          >
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
        {/* Current Score View */}
        {viewMode === 'current' && (
          <div className="flex items-center justify-center">
            <RadialChart score={currentScore} />
          </div>
        )}

        {/* Trend View */}
        {viewMode === 'trend' && (
          <div style={{ width: '100%', height: height }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    
                    return (
                      <div className="bg-white border rounded-lg shadow-lg p-3">
                        <p className="font-medium text-sm mb-2">{label}</p>
                        <p className="text-sm" style={{ color: getScoreColor(payload[0].value as number) }}>
                          Health Score: {payload[0].value}/100
                        </p>
                        <p className="text-sm text-gray-600">
                          Target: {target}/100
                        </p>
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={getScoreColor(currentScore)}
                  strokeWidth={3}
                  dot={{ r: 4, fill: getScoreColor(currentScore) }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Breakdown View */}
        {viewMode === 'breakdown' && showBreakdown && (
          <BreakdownChart />
        )}

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Current</p>
            <p className="text-xl font-bold" style={{ color: getScoreColor(currentScore) }}>
              {currentScore.toFixed(0)}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Target</p>
            <p className="text-xl font-bold text-blue-600">{target}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Change</p>
            <p className={`text-xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Status</p>
            <p className={`text-xl font-bold ${
              getScoreStatus(currentScore) === 'good' ? 'text-green-600' :
              getScoreStatus(currentScore) === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {getScoreStatus(currentScore) === 'good' ? 'Good' :
               getScoreStatus(currentScore) === 'warning' ? 'Fair' : 'Poor'}
            </p>
          </div>
        </div>

        {/* Milestones */}
        {showMilestones && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Milestones
            </h4>
            <div className="space-y-2">
              {[
                { score: 60, label: 'Baseline Health', completed: currentScore >= 60 },
                { score: 70, label: 'Good Health', completed: currentScore >= 70 },
                { score: 80, label: 'Excellent Health', completed: currentScore >= 80 },
                { score: 90, label: 'Outstanding Health', completed: currentScore >= 90 }
              ].map((milestone) => (
                <div key={milestone.score} className="flex items-center justify-between text-sm">
                  <span className={milestone.completed ? 'text-green-600' : 'text-gray-600'}>
                    {milestone.label} ({milestone.score}+)
                  </span>
                  {milestone.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}