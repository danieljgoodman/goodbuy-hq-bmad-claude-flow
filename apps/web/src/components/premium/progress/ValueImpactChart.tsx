'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Target,
  AlertCircle,
  Loader2,
  ArrowRight,
  BarChart3
} from 'lucide-react'

interface ValueImpactData {
  beforeValuation: number
  afterValuation: number
  totalIncrease: number
  totalIncreasePercentage: number
  improvementsCount: number
  timespan: number
  averageConfidenceScore: number
}

interface ValueImpactChartProps {
  userId: string
  guideId?: string
}

export function ValueImpactChart({ userId, guideId }: ValueImpactChartProps) {
  const [impactData, setImpactData] = useState<ValueImpactData | null>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState<'comparison' | 'timeline'>('comparison')

  useEffect(() => {
    loadImpactAnalysis()
  }, [userId, guideId])

  const loadImpactAnalysis = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ userId })
      if (guideId) params.append('guideId', guideId)
      
      const response = await fetch(`/api/valuations/impact-analysis?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load impact analysis')
      }

      setImpactData(data.impactAnalysis.beforeAfterComparison)
      setTimeline(data.impactAnalysis.valueImpactTimeline || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load impact analysis'
      setError(errorMessage)
      console.error('Error loading impact analysis:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading value impact analysis...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!impactData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No value impact data yet</h3>
          <p className="text-gray-600">
            Complete some improvement steps to see how they impact your business valuation.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex space-x-2">
        <Button
          variant={selectedView === 'comparison' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('comparison')}
        >
          Before/After Comparison
        </Button>
        <Button
          variant={selectedView === 'timeline' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('timeline')}
        >
          Impact Timeline
        </Button>
      </div>

      {selectedView === 'comparison' && (
        <>
          {/* Main Comparison */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Business Valuation Impact</span>
              </CardTitle>
              <CardDescription>
                Showing the measurable impact of your implemented improvements
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Before Value */}
                <div className="text-center">
                  <div className="bg-gray-100 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Before</h3>
                    <div className="text-3xl font-bold text-gray-800">
                      {formatCurrency(impactData.beforeValuation)}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Baseline valuation</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <div className="flex flex-col items-center space-y-2">
                    <ArrowRight className="h-8 w-8 text-blue-600" />
                    <Badge className="bg-blue-100 text-blue-800">
                      {impactData.improvementsCount} improvements
                    </Badge>
                  </div>
                </div>

                {/* After Value */}
                <div className="text-center">
                  <div className="bg-green-100 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-green-600 mb-2">After</h3>
                    <div className="text-3xl font-bold text-green-800">
                      {formatCurrency(impactData.afterValuation)}
                    </div>
                    <p className="text-sm text-green-600 mt-2">Current valuation</p>
                  </div>
                </div>
              </div>

              {/* Impact Summary */}
              <div className="bg-white rounded-lg border p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <DollarSign className="h-5 w-5 text-green-600 mr-1" />
                      <span className="text-sm font-medium">Total Increase</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(impactData.totalIncrease)}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600 mr-1" />
                      <span className="text-sm font-medium">Percentage Gain</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPercentage(impactData.totalIncreasePercentage)}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="h-5 w-5 text-blue-600 mr-1" />
                      <span className="text-sm font-medium">Timespan</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {impactData.timespan} days
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="h-5 w-5 text-purple-600 mr-1" />
                      <span className="text-sm font-medium">Confidence</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(impactData.averageConfidenceScore * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedView === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Value Impact Timeline</span>
            </CardTitle>
            <CardDescription>
              See how each improvement contributed to your business valuation over time
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {timeline.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No timeline data</h3>
                <p className="text-gray-600">
                  Impact timeline will appear as you complete more improvements.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {timeline.map((impact, index) => (
                  <div key={impact.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{impact.title}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{impact.category}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(impact.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${impact.valuationIncrease >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {impact.valuationIncrease >= 0 ? '+' : ''}{formatCurrency(impact.valuationIncrease)}
                        </div>
                        <div className={`text-sm ${impact.impactPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(impact.impactPercentage)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4" />
                        <span>ROI: {impact.roi.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Time to value: {impact.timeToValue} days</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Confidence: {Math.round(impact.confidenceScore * 100)}%</span>
                      </div>
                    </div>

                    {/* Valuation progression bar */}
                    <div className="mt-4 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            Math.max((impact.updatedValuation / impact.baselineValuation - 1) * 100, 0),
                            100
                          )}%`
                        }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Valuation: {formatCurrency(impact.baselineValuation)} → {formatCurrency(impact.updatedValuation)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ValueImpactChart