'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowRight, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { ComparisonState } from '@/types/dashboard'
import type { BusinessEvaluation } from '@/types'

interface ComparisonViewProps {
  evaluations: BusinessEvaluation[]
  comparison: ComparisonState
  onComparisonChange: (comparison: ComparisonState) => void
  isLoading?: boolean
}

interface ComparisonMetric {
  id: string
  label: string
  getValue: (evaluation: BusinessEvaluation) => number
  formatter: (value: number) => string
}

const COMPARISON_METRICS: ComparisonMetric[] = [
  {
    id: 'healthScore',
    label: 'Health Score',
    getValue: (e) => e.healthScore,
    formatter: (v) => `${v}/100`
  },
  {
    id: 'valuation',
    label: 'Business Valuation',
    getValue: (e) => typeof e.valuations.weighted === 'object' ? e.valuations.weighted.value : e.valuations.weighted,
    formatter: (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)
  },
  {
    id: 'revenue',
    label: 'Annual Revenue',
    getValue: (e) => e.businessData.annualRevenue,
    formatter: (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)
  },
  {
    id: 'cashFlow',
    label: 'Cash Flow',
    getValue: (e) => e.businessData.cashFlow,
    formatter: (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)
  }
]

export default function ComparisonView({
  evaluations,
  comparison,
  onComparisonChange,
  isLoading = false
}: ComparisonViewProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('healthScore')

  const completedEvaluations = evaluations.filter(e => e.status === 'completed')
  const selectedEvaluations = completedEvaluations.filter(e => comparison.selectedEvaluations.includes(e.id))

  const addEvaluation = (evaluationId: string) => {
    if (comparison.selectedEvaluations.length >= 4) return // Limit to 4 comparisons
    
    onComparisonChange({
      ...comparison,
      selectedEvaluations: [...comparison.selectedEvaluations, evaluationId]
    })
  }

  const removeEvaluation = (evaluationId: string) => {
    onComparisonChange({
      ...comparison,
      selectedEvaluations: comparison.selectedEvaluations.filter(id => id !== evaluationId)
    })
  }

  const calculateTrend = (evaluations: BusinessEvaluation[], metricId: string) => {
    if (evaluations.length < 2) return { trend: 'neutral', change: 0 }
    
    const metric = COMPARISON_METRICS.find(m => m.id === metricId)
    if (!metric) return { trend: 'neutral', change: 0 }
    
    const sortedEvals = [...evaluations].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const oldestValue = metric.getValue(sortedEvals[0])
    const newestValue = metric.getValue(sortedEvals[sortedEvals.length - 1])
    
    const change = ((newestValue - oldestValue) / oldestValue) * 100
    const trend = change > 5 ? 'up' : change < -5 ? 'down' : 'neutral'
    
    return { trend, change }
  }

  const getTrendData = () => {
    return selectedEvaluations.map((evaluation, index) => {
      const dataPoint: any = {
        name: `Eval ${index + 1}`,
        date: new Date(evaluation.createdAt).toLocaleDateString()
      }
      
      COMPARISON_METRICS.forEach(metric => {
        dataPoint[metric.id] = metric.getValue(evaluation)
      })
      
      return dataPoint
    })
  }

  const getSideBySideData = () => {
    const metric = COMPARISON_METRICS.find(m => m.id === selectedMetric)
    if (!metric) return []
    
    return selectedEvaluations.map((evaluation, index) => ({
      name: `Evaluation ${index + 1}`,
      value: metric.getValue(evaluation),
      date: new Date(evaluation.createdAt).toLocaleDateString(),
      id: evaluation.id
    }))
  }

  return (
    <div className="space-y-6">
      {/* Evaluation Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Comparison Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Available Evaluations */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Available Evaluations ({completedEvaluations.length})
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {completedEvaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <div className="font-medium text-sm">
                      {new Date(evaluation.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Score: {evaluation.healthScore}/100
                    </div>
                  </div>
                  {comparison.selectedEvaluations.includes(evaluation.id) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeEvaluation(evaluation.id)}
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => addEvaluation(evaluation.id)}
                      disabled={comparison.selectedEvaluations.length >= 4}
                    >
                      Compare
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Evaluations */}
          {selectedEvaluations.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Selected for Comparison ({selectedEvaluations.length}/4)
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedEvaluations.map((evaluation, index) => (
                  <Badge key={evaluation.id} variant="secondary" className="px-3 py-1">
                    Evaluation {index + 1}
                    <button
                      onClick={() => removeEvaluation(evaluation.id)}
                      className="ml-2 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Comparison Mode */}
          <div>
            <label className="text-sm font-medium mb-2 block">Comparison Mode</label>
            <div className="flex gap-2">
              {[
                { value: 'side-by-side', label: 'Side by Side' },
                { value: 'trend', label: 'Trend Analysis' },
                { value: 'overlay', label: 'Overlay' }
              ].map((mode) => (
                <Button
                  key={mode.value}
                  size="sm"
                  variant={comparison.comparisonMode === mode.value ? 'default' : 'outline'}
                  onClick={() => onComparisonChange({ ...comparison, comparisonMode: mode.value as any })}
                >
                  {mode.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {selectedEvaluations.length >= 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Comparison Results</CardTitle>
              {comparison.comparisonMode === 'side-by-side' && (
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPARISON_METRICS.map((metric) => (
                      <SelectItem key={metric.id} value={metric.id}>
                        {metric.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {comparison.comparisonMode === 'side-by-side' && (
              <div className="space-y-6">
                {/* Side-by-Side Comparison Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getSideBySideData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name) => [
                          COMPARISON_METRICS.find(m => m.id === selectedMetric)?.formatter(value) || value,
                          COMPARISON_METRICS.find(m => m.id === selectedMetric)?.label || name
                        ]}
                      />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Metrics Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Metric</th>
                        {selectedEvaluations.map((_, index) => (
                          <th key={index} className="text-center p-2">
                            Evaluation {index + 1}
                          </th>
                        ))}
                        <th className="text-center p-2">Best</th>
                        <th className="text-center p-2">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMPARISON_METRICS.map((metric) => {
                        const values = selectedEvaluations.map(e => metric.getValue(e))
                        const bestIndex = values.indexOf(Math.max(...values))
                        const { trend, change } = calculateTrend(selectedEvaluations, metric.id)
                        
                        return (
                          <tr key={metric.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{metric.label}</td>
                            {values.map((value, index) => (
                              <td key={index} className="p-2 text-center">
                                <span className={index === bestIndex ? 'font-semibold text-green-600' : ''}>
                                  {metric.formatter(value)}
                                </span>
                              </td>
                            ))}
                            <td className="p-2 text-center">
                              <Badge variant="outline" className="text-green-600">
                                Eval {bestIndex + 1}
                              </Badge>
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center">
                                {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600 mr-1" />}
                                {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600 mr-1" />}
                                {trend === 'neutral' && <Minus className="h-4 w-4 text-muted-foreground mr-1" />}
                                <span className={`text-sm ${
                                  trend === 'up' ? 'text-green-600' :
                                  trend === 'down' ? 'text-red-600' :
                                  'text-muted-foreground'
                                }`}>
                                  {change.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {comparison.comparisonMode === 'trend' && (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {COMPARISON_METRICS.map((metric, index) => (
                      <Line
                        key={metric.id}
                        type="monotone"
                        dataKey={metric.id}
                        stroke={`hsl(${index * 90}, 70%, 50%)`}
                        strokeWidth={2}
                        name={metric.label}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {selectedEvaluations.length < 2 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground mb-4">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <h3 className="font-medium mb-1">No Comparison Selected</h3>
              <p className="text-sm">Select at least 2 evaluations to start comparing your business performance over time.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}