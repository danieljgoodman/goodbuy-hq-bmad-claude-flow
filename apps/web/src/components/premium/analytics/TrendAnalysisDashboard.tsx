'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Calendar,
  Filter,
  Download
} from 'lucide-react'

interface TrendAnalysisDashboardProps {
  userId: string
}

interface DashboardData {
  advancedTrends: any
  predictions: any[]
  seasonality: any[]
  modelPerformance: any
  summary: {
    totalEvaluations: number
    dataQuality: number
    predictionAccuracy: number
    hasSufficientData: boolean
  }
}

export function TrendAnalysisDashboard({ userId }: TrendAnalysisDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('6m')
  const [activeTab, setActiveTab] = useState<string>('overview')

  useEffect(() => {
    loadDashboardData()
  }, [userId, selectedTimeframe])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/dashboard?userId=${userId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load analytics data')
      }

      setData(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data'
      setError(errorMessage)
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getQualityLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent'
    if (score >= 0.6) return 'Good'
    if (score >= 0.4) return 'Fair'
    return 'Poor'
  }

  const getTrendIcon = (direction: string, strength: number) => {
    if (direction === 'increasing') {
      return <TrendingUp className={`h-4 w-4 ${strength > 0.7 ? 'text-green-600' : 'text-green-400'}`} />
    } else if (direction === 'decreasing') {
      return <TrendingDown className={`h-4 w-4 ${strength > 0.7 ? 'text-red-600' : 'text-red-400'}`} />
    }
    return <Activity className="h-4 w-4 text-gray-400" />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3 text-lg">Loading advanced analytics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
          <p className="text-gray-600">
            Complete at least 3 business evaluations to access advanced analytics.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            AI-powered trend analysis and predictive insights for your business
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Data Quality Alert */}
      {data?.summary?.dataQuality && data.summary.dataQuality < 0.6 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your data quality score is {getQualityLabel(data?.summary?.dataQuality || 0).toLowerCase()}. 
            Complete more evaluations for more accurate trend analysis and predictions.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{data?.summary?.totalEvaluations || 0}</p>
                <p className="text-sm text-muted-foreground">Evaluations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <p className={`text-2xl font-bold ${getQualityColor(data?.summary?.dataQuality || 0)}`}>
                  {((data?.summary?.dataQuality || 0) * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">Data Quality</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {((data?.summary?.predictionAccuracy || 0) * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">Model Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              {data?.summary?.hasSufficientData ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <p className="text-2xl font-bold">
                  {data?.summary?.hasSufficientData ? 'Ready' : 'Building'}
                </p>
                <p className="text-sm text-muted-foreground">Analysis Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="seasonality">Seasonality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Key Metric Trends</CardTitle>
              <CardDescription>
                Statistical analysis of your business metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.advancedTrends?.trends?.map((trend: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTrendIcon(trend.direction, trend.strength)}
                      <div>
                        <h3 className="font-medium">{trend.metric}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span className="capitalize">{trend.direction}</span>
                          <Badge variant="outline" className="text-xs">
                            {(trend.strength * 100).toFixed(0)}% strength
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {formatPercentage(trend.projectedChange)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(trend.confidenceScore * 100).toFixed(0)}% confidence
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Valuation & Projection */}
          {(data?.predictions?.length || 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Valuation Outlook</CardTitle>
                <CardDescription>
                  Current valuation and 6-month projection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-600 mb-2">Current Valuation</h3>
                    <div className="text-3xl font-bold text-blue-800">
                      {(data?.advancedTrends?.metrics?.length || 0) > 0 
                        ? formatCurrency(data.advancedTrends.metrics[0]?.currentValue || 0)
                        : 'N/A'
                      }
                    </div>
                    <p className="text-sm text-blue-600 mt-2">
                      Based on latest evaluation
                    </p>
                  </div>

                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <h3 className="text-sm font-medium text-green-600 mb-2">6-Month Projection</h3>
                    <div className="text-3xl font-bold text-green-800">
                      {formatCurrency(data?.predictions?.[data.predictions?.length - 1]?.predictedValue || 0)}
                    </div>
                    <p className="text-sm text-green-600 mt-2">
                      {((data?.predictions?.[data.predictions?.length - 1]?.confidenceLevel || 0) * 100).toFixed(0)}% confidence
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Trend Analysis</CardTitle>
              <CardDescription>
                Statistical significance and confidence intervals for all metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data?.advancedTrends?.metrics?.map((metric: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">{metric.name}</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {metric.name.includes('Score') 
                            ? metric.currentValue.toFixed(1)
                            : formatCurrency(metric.currentValue)
                          }
                        </div>
                        <div className={`text-sm ${metric.changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(metric.changePercentage)} from last period
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Trend Direction</div>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(metric.trend.direction, metric.trend.strength)}
                          <span className="capitalize font-medium">{metric.trend.direction}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-muted-foreground mb-1">Statistical Confidence</div>
                        <div className="font-medium">
                          {(metric.trend.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-muted-foreground mb-1">R-Squared</div>
                        <div className="font-medium">
                          {metric.trend.rSquared.toFixed(3)}
                        </div>
                      </div>
                    </div>

                    {/* Simple trend line visualization */}
                    <div className="mt-4 h-2 bg-gray-200 rounded-full">
                      <div
                        className={`h-2 rounded-full ${
                          metric.trend.direction === 'increasing' ? 'bg-green-600' : 
                          metric.trend.direction === 'decreasing' ? 'bg-red-600' : 'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(metric.trend.strength * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Trend strength: {(metric.trend.strength * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Valuation Forecasts</CardTitle>
              <CardDescription>
                AI-powered predictions with confidence intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(data?.predictions?.length || 0) === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Insufficient data for predictions</h3>
                  <p className="text-gray-600">
                    Complete at least 3 evaluations to generate forecasts.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data?.predictions?.slice(0, 6)?.map((prediction: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium">
                            {new Date(prediction.date).toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </h3>
                          <div className="text-sm text-muted-foreground">
                            Range: {formatCurrency(prediction.lowerBound)} - {formatCurrency(prediction.upperBound)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {formatCurrency(prediction.predictedValue)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(prediction.confidenceLevel * 100).toFixed(0)}% confidence
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Performance</CardTitle>
              <CardDescription>
                Historical accuracy of prediction models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {((data?.modelPerformance?.accuracy || 0) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-blue-600">Accuracy</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {data?.modelPerformance?.historicalPredictions?.length || 0}
                  </div>
                  <div className="text-sm text-green-600">Predictions Made</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(data?.modelPerformance?.meanAbsoluteError || 0)}
                  </div>
                  <div className="text-sm text-purple-600">Avg Error</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasonality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Patterns</CardTitle>
              <CardDescription>
                Recurring patterns in your business metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(data?.seasonality?.length || 0) === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No seasonal patterns detected</h3>
                  <p className="text-gray-600">
                    Complete at least 12 evaluations over different periods to detect seasonal patterns.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data?.seasonality?.map((pattern: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Period</div>
                          <div className="font-semibold">{pattern.period} months</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground">Amplitude</div>
                          <div className="font-semibold">{pattern.amplitude.toFixed(2)}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground">Strength</div>
                          <div className="font-semibold">{(pattern.strength * 100).toFixed(1)}%</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground">Peak Phase</div>
                          <div className="font-semibold">Month {Math.round(pattern.phase * pattern.period)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TrendAnalysisDashboard