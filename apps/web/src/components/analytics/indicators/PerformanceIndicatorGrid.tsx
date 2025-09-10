'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PerformanceIndicatorData } from '@/lib/services/VisualizationService'
import { TrendingUp, TrendingDown, Minus, Target, Activity, AlertTriangle, CheckCircle, Settings } from 'lucide-react'

interface PerformanceIndicatorGridProps {
  indicators: PerformanceIndicatorData[]
  title?: string
  showBenchmarks?: boolean
  showTargets?: boolean
  layout?: 'grid' | 'list'
  onIndicatorClick?: (indicator: PerformanceIndicatorData) => void
}

export function PerformanceIndicatorGrid({
  indicators,
  title = 'Performance Indicators',
  showBenchmarks = true,
  showTargets = true,
  layout = 'grid',
  onIndicatorClick
}: PerformanceIndicatorGridProps) {
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'change' | 'status'>('status')
  const [filterStatus, setFilterStatus] = useState<'all' | 'good' | 'warning' | 'critical'>('all')

  // Filter and sort indicators
  const processedIndicators = indicators
    .filter(indicator => 
      filterStatus === 'all' || indicator.status === filterStatus
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'value':
          return b.current - a.current
        case 'change':
          return (b.change_percentage || 0) - (a.change_percentage || 0)
        case 'status':
          const statusOrder = { 'critical': 0, 'warning': 1, 'good': 2 }
          return statusOrder[a.status] - statusOrder[b.status]
        default:
          return 0
      }
    })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const formatValue = (value: number, name: string) => {
    if (name.toLowerCase().includes('percentage') || name.toLowerCase().includes('rate')) {
      return `${value.toFixed(1)}%`
    }
    if (name.toLowerCase().includes('revenue') || name.toLowerCase().includes('valuation')) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    if (name.toLowerCase().includes('score')) {
      return `${value.toFixed(1)}/100`
    }
    return value.toLocaleString()
  }

  const IndicatorCard = ({ indicator }: { indicator: PerformanceIndicatorData }) => (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${getStatusColor(indicator.status)}`}
      onClick={() => onIndicatorClick?.(indicator)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="truncate">{indicator.name}</span>
          {getStatusIcon(indicator.status)}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Current Value */}
        <div className="text-center">
          <div className="text-2xl font-bold">
            {formatValue(indicator.current, indicator.name)}
          </div>
          <div className="flex items-center justify-center gap-1 text-sm">
            {getTrendIcon(indicator.trend)}
            <span className={
              indicator.trend === 'up' ? 'text-green-600' :
              indicator.trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }>
              {indicator.change_percentage ? `${Math.abs(indicator.change_percentage).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Target vs Benchmark */}
        {(showTargets || showBenchmarks) && (
          <div className="space-y-2">
            {showTargets && indicator.target && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Target
                </span>
                <span className="font-medium">
                  {formatValue(indicator.target, indicator.name)}
                </span>
              </div>
            )}
            {showBenchmarks && indicator.benchmark && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Benchmark</span>
                <span className="font-medium">
                  {formatValue(indicator.benchmark, indicator.name)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {indicator.target && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>{((indicator.current / indicator.target) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  indicator.status === 'good' ? 'bg-green-600' :
                  indicator.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ 
                  width: `${Math.min(100, (indicator.current / indicator.target) * 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const IndicatorListItem = ({ indicator }: { indicator: PerformanceIndicatorData }) => (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-sm"
      onClick={() => onIndicatorClick?.(indicator)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(indicator.status)}
            <div>
              <h4 className="font-medium">{indicator.name}</h4>
              <p className="text-sm text-gray-600">
                Current: {formatValue(indicator.current, indicator.name)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            {/* Change */}
            <div className="flex items-center gap-1">
              {getTrendIcon(indicator.trend)}
              <span className={`text-sm font-medium ${
                indicator.trend === 'up' ? 'text-green-600' :
                indicator.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {indicator.change_percentage ? `${Math.abs(indicator.change_percentage).toFixed(1)}%` : '0%'}
              </span>
            </div>

            {/* Target Progress */}
            {indicator.target && (
              <div className="text-sm">
                <span className="text-gray-600">Target: </span>
                <span className="font-medium">
                  {((indicator.current / indicator.target) * 100).toFixed(0)}%
                </span>
              </div>
            )}

            {/* Status Badge */}
            <Badge 
              variant={
                indicator.status === 'good' ? 'default' :
                indicator.status === 'warning' ? 'secondary' : 'destructive'
              }
            >
              {indicator.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            {title}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Filter by status */}
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="good">Good</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort by */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="value">Value</SelectItem>
                <SelectItem value="change">Change</SelectItem>
              </SelectContent>
            </Select>

            {/* Layout toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">Good</p>
            <p className="text-xl font-bold text-green-600">
              {indicators.filter(i => i.status === 'good').length}
            </p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-600">Warning</p>
            <p className="text-xl font-bold text-yellow-600">
              {indicators.filter(i => i.status === 'warning').length}
            </p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">Critical</p>
            <p className="text-xl font-bold text-red-600">
              {indicators.filter(i => i.status === 'critical').length}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-xl font-bold text-gray-600">
              {indicators.length}
            </p>
          </div>
        </div>

        {/* Indicators Display */}
        {layout === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {processedIndicators.map((indicator, index) => (
              <IndicatorCard key={`${indicator.name}-${index}`} indicator={indicator} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {processedIndicators.map((indicator, index) => (
              <IndicatorListItem key={`${indicator.name}-${index}`} indicator={indicator} />
            ))}
          </div>
        )}

        {processedIndicators.length === 0 && (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              No indicators match the current filter
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}