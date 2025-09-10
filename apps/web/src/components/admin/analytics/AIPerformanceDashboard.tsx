'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, Area, AreaChart
} from 'recharts'
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface AIPerformanceData {
  models: {
    model_name: string
    version: string
    metrics: {
      accuracy: { average: number; trend: string; sample_size: number }
      confidence: { average: number; trend: string }
      response_time: { average: number; p95: number; trend: string }
      user_satisfaction: { average: number; helpful_percentage: number; total_feedback: number }
    }
    alerts: Array<{
      metric: string
      current_value: number
      threshold: number
      severity: string
      message: string
    }>
    recommendations: string[]
  }[]
  trends: Array<{
    model: string
    accuracy_trend: string
    response_time_trend: string
    confidence_trend: string
  }>
  alerts: Array<{
    model: string
    metric: string
    severity: string
    message: string
    created_at: string
  }>
}

const TrendIcon = ({ trend }: { trend: string }) => {
  switch (trend) {
    case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
    case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
    default: return <Minus className="h-4 w-4 text-gray-400" />
  }
}

const SeverityBadge = ({ severity }: { severity: string }) => {
  const variants = {
    low: 'secondary',
    medium: 'outline',
    high: 'destructive',
    critical: 'destructive'
  } as const

  return (
    <Badge variant={variants[severity as keyof typeof variants] || 'secondary'}>
      {severity.toUpperCase()}
    </Badge>
  )
}

export default function AIPerformanceDashboard() {
  const [data, setData] = useState<AIPerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAIPerformanceData()
  }, [])

  const fetchAIPerformanceData = async () => {
    try {
      setLoading(true)
      
      // Mock data for demo purposes
      const mockData: AIPerformanceData = {
        models: [
          {
            model_name: 'Business Valuation Model',
            version: '1.0',
            metrics: {
              accuracy: { average: 0.87, trend: 'up', sample_size: 1245 },
              confidence: { average: 0.82, trend: 'stable' },
              response_time: { average: 3200, p95: 5400, trend: 'down' },
              user_satisfaction: { average: 4.2, helpful_percentage: 85, total_feedback: 234 }
            },
            alerts: [
              {
                metric: 'response_time',
                current_value: 5400,
                threshold: 5000,
                severity: 'medium',
                message: 'P95 response time slightly above threshold'
              }
            ],
            recommendations: [
              'Model accuracy is performing well above baseline',
              'Consider optimizing response time for better user experience',
              'User feedback is positive - maintain current approach'
            ]
          },
          {
            model_name: 'Health Score Model',
            version: '1.0',
            metrics: {
              accuracy: { average: 0.91, trend: 'up', sample_size: 856 },
              confidence: { average: 0.89, trend: 'up' },
              response_time: { average: 2100, p95: 3200, trend: 'stable' },
              user_satisfaction: { average: 4.5, helpful_percentage: 92, total_feedback: 145 }
            },
            alerts: [],
            recommendations: [
              'Excellent performance across all metrics',
              'High user satisfaction indicates strong model-market fit',
              'Continue current training approach'
            ]
          },
          {
            model_name: 'Recommendations Model',
            version: '1.0',
            metrics: {
              accuracy: { average: 0.78, trend: 'down', sample_size: 1023 },
              confidence: { average: 0.74, trend: 'down' },
              response_time: { average: 4500, p95: 7200, trend: 'up' },
              user_satisfaction: { average: 3.8, helpful_percentage: 72, total_feedback: 189 }
            },
            alerts: [
              {
                metric: 'accuracy',
                current_value: 0.78,
                threshold: 0.82,
                severity: 'high',
                message: 'Model accuracy has dropped below expected threshold'
              },
              {
                metric: 'response_time',
                current_value: 7200,
                threshold: 6000,
                severity: 'medium',
                message: 'Response times degrading'
              }
            ],
            recommendations: [
              'Investigate recent accuracy drop - may need model retraining',
              'Optimize inference pipeline to improve response times',
              'Review user feedback for common issues'
            ]
          }
        ],
        trends: [
          { model: 'Business Valuation', accuracy_trend: 'up', response_time_trend: 'down', confidence_trend: 'stable' },
          { model: 'Health Score', accuracy_trend: 'up', response_time_trend: 'stable', confidence_trend: 'up' },
          { model: 'Recommendations', accuracy_trend: 'down', response_time_trend: 'up', confidence_trend: 'down' }
        ],
        alerts: [
          {
            model: 'Recommendations Model',
            metric: 'accuracy',
            severity: 'high',
            message: 'Model accuracy has dropped below expected threshold (78% vs 82% target)',
            created_at: '2024-03-15T10:30:00Z'
          },
          {
            model: 'Business Valuation Model',
            metric: 'response_time',
            severity: 'medium',
            message: 'P95 response time slightly above threshold (5.4s vs 5.0s target)',
            created_at: '2024-03-15T09:15:00Z'
          }
        ]
      }

      setData(mockData)
    } catch (error) {
      console.error('Failed to fetch AI performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading AI performance data...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Failed to load AI performance data</div>
      </div>
    )
  }

  const activeAlerts = data.alerts.filter(alert => alert.severity === 'high' || alert.severity === 'critical')

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Performance Monitor</h1>
          <p className="text-muted-foreground">Real-time monitoring of AI model performance and health</p>
        </div>
        <div className="flex gap-4 items-center">
          <Badge variant={activeAlerts.length > 0 ? 'destructive' : 'secondary'}>
            {activeAlerts.length} Active Alerts
          </Badge>
          <Button onClick={fetchAIPerformanceData}>Refresh</Button>
        </div>
      </div>

      {activeAlerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Active Performance Issues</AlertTitle>
          <AlertDescription>
            {activeAlerts.length} models have performance issues requiring attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Model Details</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((data.models.reduce((sum, model) => sum + model.metrics.accuracy.average, 0) / data.models.length) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Across all models</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(data.models.reduce((sum, model) => sum + model.metrics.response_time.average, 0) / data.models.length)}ms
                </div>
                <p className="text-xs text-muted-foreground">Average across models</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(data.models.reduce((sum, model) => sum + model.metrics.user_satisfaction.average, 0) / data.models.length).toFixed(1)}/5
                </div>
                <p className="text-xs text-muted-foreground">Average rating</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{activeAlerts.length}</div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Performance Overview</CardTitle>
                <CardDescription>Key metrics by model</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.models.map((model, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{model.model_name}</span>
                        {model.alerts.length > 0 && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Accuracy</span>
                          <span>{(model.metrics.accuracy.average * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={model.metrics.accuracy.average * 100} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>User Satisfaction</span>
                          <span>{model.metrics.user_satisfaction.average.toFixed(1)}/5</span>
                        </div>
                        <Progress value={(model.metrics.user_satisfaction.average / 5) * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
                <CardDescription>Average and P95 response times</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.models.map(model => ({
                    name: model.model_name.split(' ')[0],
                    avg: model.metrics.response_time.average,
                    p95: model.metrics.response_time.p95
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avg" name="Average" fill="#8884d8" />
                    <Bar dataKey="p95" name="P95" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          {data.models.map((model, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{model.model_name} v{model.version}</CardTitle>
                    <CardDescription>Detailed performance metrics and recommendations</CardDescription>
                  </div>
                  {model.alerts.length > 0 && (
                    <Badge variant="destructive">{model.alerts.length} Alert{model.alerts.length > 1 ? 's' : ''}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Accuracy</span>
                      <TrendIcon trend={model.metrics.accuracy.trend} />
                    </div>
                    <div className="text-xl font-bold">{(model.metrics.accuracy.average * 100).toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">
                      {model.metrics.accuracy.sample_size.toLocaleString()} samples
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Confidence</span>
                      <TrendIcon trend={model.metrics.confidence.trend} />
                    </div>
                    <div className="text-xl font-bold">{(model.metrics.confidence.average * 100).toFixed(1)}%</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Response Time</span>
                      <TrendIcon trend={model.metrics.response_time.trend} />
                    </div>
                    <div className="text-xl font-bold">{model.metrics.response_time.average}ms</div>
                    <div className="text-sm text-muted-foreground">
                      P95: {model.metrics.response_time.p95}ms
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">User Satisfaction</span>
                    <div className="text-xl font-bold">{model.metrics.user_satisfaction.average.toFixed(1)}/5</div>
                    <div className="text-sm text-muted-foreground">
                      {model.metrics.user_satisfaction.helpful_percentage}% helpful ({model.metrics.user_satisfaction.total_feedback} reviews)
                    </div>
                  </div>
                </div>

                {model.alerts.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Active Alerts</h4>
                    <div className="space-y-2">
                      {model.alerts.map((alert, alertIndex) => (
                        <Alert key={alertIndex}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle className="flex items-center gap-2">
                            {alert.metric.toUpperCase()}
                            <SeverityBadge severity={alert.severity} />
                          </AlertTitle>
                          <AlertDescription>{alert.message}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {model.recommendations.map((rec, recIndex) => (
                      <li key={recIndex}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Model performance trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.trends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <span className="font-medium">{trend.model}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Accuracy</span>
                        <TrendIcon trend={trend.accuracy_trend} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Response Time</span>
                        <TrendIcon trend={trend.response_time_trend} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Confidence</span>
                        <TrendIcon trend={trend.confidence_trend} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Performance alerts and issues</CardDescription>
            </CardHeader>
            <CardContent>
              {data.alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">No Active Alerts</p>
                  <p className="text-muted-foreground">All models are performing within expected parameters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.alerts.map((alert, index) => (
                    <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{alert.model}</span>
                          <SeverityBadge severity={alert.severity} />
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Investigate
                      </Button>
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