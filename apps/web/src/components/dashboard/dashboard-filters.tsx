'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, Filter, X, RotateCcw } from 'lucide-react'
import type { DashboardFilters } from '@/types/dashboard'

interface DashboardFiltersProps {
  filters: DashboardFilters
  onFiltersChange: (filters: DashboardFilters) => void
  businessCategories?: string[]
  isLoading?: boolean
}

const PREDEFINED_RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
  { label: 'Custom', days: 0 }
]

const EVALUATION_TYPES = [
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'processing', label: 'Processing', color: 'yellow' },
  { value: 'failed', label: 'Failed', color: 'red' }
] as const

const DEFAULT_BUSINESS_CATEGORIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Manufacturing',
  'Services',
  'Education',
  'Real Estate',
  'Energy',
  'Transportation'
]

export default function DashboardFilters({
  filters,
  onFiltersChange,
  businessCategories = DEFAULT_BUSINESS_CATEGORIES,
  isLoading = false
}: DashboardFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateDateRange = (days: number) => {
    if (days === 0) return // Custom range - handle separately
    
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    
    onFiltersChange({
      ...filters,
      dateRange: { start, end },
      customTimeframe: { label: `${days} days`, days }
    })
  }

  const toggleBusinessCategory = (category: string) => {
    const updated = filters.businessCategories.includes(category)
      ? filters.businessCategories.filter(c => c !== category)
      : [...filters.businessCategories, category]
    
    onFiltersChange({
      ...filters,
      businessCategories: updated
    })
  }

  const toggleEvaluationType = (type: 'completed' | 'processing' | 'failed') => {
    const updated = filters.evaluationTypes.includes(type)
      ? filters.evaluationTypes.filter(t => t !== type)
      : [...filters.evaluationTypes, type]
    
    onFiltersChange({
      ...filters,
      evaluationTypes: updated
    })
  }

  const resetFilters = () => {
    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(now.getDate() - 30)
    
    onFiltersChange({
      dateRange: { start: thirtyDaysAgo, end: now },
      businessCategories: [],
      evaluationTypes: ['completed', 'processing', 'failed'],
      customTimeframe: { label: '30 days', days: 30 }
    })
  }

  const activeFiltersCount = 
    filters.businessCategories.length + 
    (filters.evaluationTypes.length !== 3 ? 1 : 0) +
    (filters.customTimeframe?.days !== 30 ? 1 : 0)

  return (
    <Card className="bg-gray-50/50 border-gray-200">
      <CardContent className="py-4">
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                disabled={isLoading}
                className="h-7 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 px-2 text-xs"
              >
                {isExpanded ? 'Less' : 'More'}
              </Button>
            </div>
          </div>

          {/* Filters Row - Full Width */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Time Period Selector */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-gray-700">Time Period</span>
              </div>
              <div className="flex space-x-1">
                {PREDEFINED_RANGES.slice(0, 4).map((range) => (
                  <Button
                    key={range.days}
                    variant={
                      (filters.customTimeframe?.days === range.days) || 
                      (!filters.customTimeframe && range.days === 30) ? 
                      'default' : 'outline'
                    }
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => updateDateRange(range.days)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Evaluation Status */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-blue-400"></div>
                <span className="text-sm font-medium text-gray-700">Status</span>
              </div>
              <div className="flex space-x-1">
                {EVALUATION_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant={filters.evaluationTypes.includes(type.value as any) ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => toggleEvaluationType(type.value as any)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Expanded Section */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-200 mt-4">
        {/* Date Range */}
        <div>
          <label className="text-sm font-medium mb-2 flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Time Period
          </label>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_RANGES.map((range) => (
              <Button
                key={range.label}
                variant={filters.customTimeframe?.days === range.days ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateDateRange(range.days)}
                disabled={isLoading || range.days === 0} // Disable custom for now
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Evaluation Status */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Evaluation Status
          </label>
          <div className="flex flex-wrap gap-2">
            {EVALUATION_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={filters.evaluationTypes.includes(type.value) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleEvaluationType(type.value)}
                disabled={isLoading}
                className="text-xs"
              >
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  type.color === 'green' ? 'bg-green-500' :
                  type.color === 'yellow' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                {type.label}
                {filters.evaluationTypes.includes(type.value) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Business Categories */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Business Categories
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {businessCategories.map((category) => (
              <Button
                key={category}
                variant={filters.businessCategories.includes(category) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleBusinessCategory(category)}
                disabled={isLoading}
                className="text-xs justify-start"
              >
                {category}
                {filters.businessCategories.includes(category) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Button>
            ))}
          </div>
        </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-2">Active filters:</div>
            <div className="flex flex-wrap gap-1">
              {filters.customTimeframe && filters.customTimeframe.days !== 30 && (
                <Badge variant="outline" className="text-xs">
                  {filters.customTimeframe.label}
                </Badge>
              )}
              {filters.evaluationTypes.length !== 3 && (
                <Badge variant="outline" className="text-xs">
                  Status: {filters.evaluationTypes.length} selected
                </Badge>
              )}
              {filters.businessCategories.map((category) => (
                <Badge key={category} variant="outline" className="text-xs">
                  {category}
                  <button
                    onClick={() => toggleBusinessCategory(category)}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}