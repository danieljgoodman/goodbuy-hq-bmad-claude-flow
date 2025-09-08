'use client'

import { useState } from 'react'
import { 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Users,
  Zap,
  Building
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { BusinessHealthScore } from '@/types/health-analysis'

interface ComprehensiveHealthDashboardProps {
  healthScore: BusinessHealthScore
  businessName?: string
}

export function ComprehensiveHealthDashboard({ 
  healthScore, 
  businessName 
}: ComprehensiveHealthDashboardProps) {
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    if (score >= 40) return 'bg-orange-50 border-orange-200'
    return 'bg-red-50 border-red-200'
  }

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Attention'
  }

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getDimensionIcon = (dimension: string) => {
    switch (dimension) {
      case 'financial':
        return <DollarSign className="h-5 w-5" />
      case 'operational':
        return <Zap className="h-5 w-5" />
      case 'market':
        return <Target className="h-5 w-5" />
      case 'growth':
        return <TrendingUp className="h-5 w-5" />
      default:
        return <BarChart3 className="h-5 w-5" />
    }
  }

  const toggleDimension = (dimension: string) => {
    setExpandedDimension(expandedDimension === dimension ? null : dimension)
  }

  const formatPercentile = (percentile: number) => {
    const suffix = percentile === 1 ? 'st' : percentile === 2 ? 'nd' : percentile === 3 ? 'rd' : 'th'
    return `${percentile}${suffix} percentile`
  }

  const renderDimensionCard = (dimension: any, dimensionKey: string) => {
    const isExpanded = expandedDimension === dimensionKey
    
    return (
      <Card key={dimensionKey} className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getHealthBgColor(dimension.score)}`}>
                {getDimensionIcon(dimensionKey)}
              </div>
              <div>
                <CardTitle className="text-lg capitalize">{dimensionKey} Health</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-2xl font-bold ${getHealthColor(dimension.score)}`}>
                    {dimension.score}
                  </span>
                  {getTrendIcon(dimension.trendDirection)}
                  <Badge variant="outline" className="text-xs">
                    {dimension.confidence}% confidence
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                {formatPercentile(dimension.benchmarkComparison.percentile)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleDimension(dimensionKey)}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={dimension.score} className="mb-4" />
          
          {/* Benchmark comparison */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Your Score</p>
              <p className={`font-semibold ${getHealthColor(dimension.score)}`}>{dimension.score}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Industry Avg</p>
              <p className="font-semibold">{dimension.benchmarkComparison.industryAverage}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Quartile</p>
              <p className="font-semibold">Q{dimension.benchmarkComparison.quartile}</p>
            </div>
          </div>

          {isExpanded && (
            <div className="space-y-4 border-t pt-4">
              {/* Key Insights */}
              {dimension.keyInsights.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Key Insights
                  </h4>
                  <ul className="space-y-1">
                    {dimension.keyInsights.map((insight: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Component Breakdown */}
              <div>
                <h4 className="font-medium mb-3">Component Analysis</h4>
                <div className="space-y-2">
                  {dimension.components.map((component: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{component.name}</p>
                        <p className="text-sm text-muted-foreground">{component.description}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs">
                          <span>Weight: {Math.round(component.weight * 100)}%</span>
                          <span className={component.impact === 'positive' ? 'text-green-600' : 
                                         component.impact === 'negative' ? 'text-red-600' : 'text-gray-600'}>
                            {component.impact} impact
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${getHealthColor(component.score)}`}>
                          {component.score}
                        </p>
                        {component.improvementPotential > 0 && (
                          <p className="text-xs text-muted-foreground">
                            +{component.improvementPotential} potential
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Factors */}
              {dimension.criticalFactors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Critical Factors
                  </h4>
                  <ul className="space-y-1">
                    {dimension.criticalFactors.map((factor: string, index: number) => (
                      <li key={index} className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Health Score Header */}
      <Card className={`border-2 ${getHealthBgColor(healthScore.overallScore)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className={`h-8 w-8 ${getHealthColor(healthScore.overallScore)}`} />
              <div>
                <CardTitle className="text-2xl">Comprehensive Business Health Analysis</CardTitle>
                {businessName && (
                  <CardDescription>Multi-dimensional health assessment for {businessName}</CardDescription>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {healthScore.confidenceScore}% confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div>
              <p className={`text-6xl font-bold ${getHealthColor(healthScore.overallScore)}`}>
                {healthScore.overallScore}
              </p>
              <p className={`text-xl font-semibold ${getHealthColor(healthScore.overallScore)}`}>
                {getHealthLabel(healthScore.overallScore)}
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <Progress value={healthScore.overallScore} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              {healthScore.methodology}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Dimension Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(healthScore.dimensions).map(([key, dimension]) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${getHealthBgColor(dimension.score)}`}>
                      {getDimensionIcon(key)}
                    </div>
                    <div>
                      <h3 className="font-medium capitalize">{key}</h3>
                      <p className={`text-2xl font-bold ${getHealthColor(dimension.score)}`}>
                        {dimension.score}
                      </p>
                    </div>
                  </div>
                  <Progress value={dimension.score} className="mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatPercentile(dimension.benchmarkComparison.percentile)}</span>
                    {getTrendIcon(dimension.trendDirection)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Alerts Section */}
          {healthScore.alerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Health Alerts
              </h3>
              {healthScore.alerts.map((alert) => (
                <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{alert.type.replace('_', ' ').toUpperCase()}:</strong> {alert.message}
                    {alert.recommendations.length > 0 && (
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        {alert.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="dimensions" className="space-y-4">
          {Object.entries(healthScore.dimensions).map(([key, dimension]) => 
            renderDimensionCard(dimension, key)
          )}
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-4">
          {healthScore.industryBenchmarks.map((benchmark) => (
            <Card key={benchmark.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {benchmark.industry} Benchmarks
                </CardTitle>
                <CardDescription>
                  {benchmark.sector} | {benchmark.companySize} companies | Sample: {benchmark.sampleSize}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(benchmark.metrics).map(([metric, data]) => (
                    <div key={metric} className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium capitalize">{metric.replace('_', ' ')}</h4>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Average:</span>
                          <span className="font-semibold">{data.average}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Top 25%:</span>
                          <span className="font-semibold">{data.percentiles[75]}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trend Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Overall Trend Direction:</span>
                  <Badge variant={healthScore.trendAnalysis.trendDirection === 'upward' ? 'default' : 
                                  healthScore.trendAnalysis.trendDirection === 'downward' ? 'destructive' : 'secondary'}>
                    {healthScore.trendAnalysis.trendDirection}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Change Rate:</span>
                  <span className="font-semibold">{healthScore.trendAnalysis.changeRate.toFixed(1)}%</span>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Key Trend Drivers:</h4>
                  <ul className="space-y-1">
                    {healthScore.trendAnalysis.keyTrendDrivers.map((driver, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                        {driver}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4">
          {healthScore.improvementPaths.map((path) => (
            <Card key={path.id}>
              <CardHeader>
                <CardTitle className="capitalize">{path.dimension} Improvement Path</CardTitle>
                <CardDescription>
                  Current: {path.currentScore} → Target: {path.targetScore} 
                  (+{path.improvementPotential} points over {path.timeframe})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={(path.currentScore / path.targetScore) * 100} />
                  
                  <div>
                    <h4 className="font-medium mb-2">Priority Actions:</h4>
                    <div className="space-y-2">
                      {path.actions.map((action) => (
                        <div key={action.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <Badge variant={action.priority === 1 ? 'default' : 'secondary'}>
                            P{action.priority}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium">{action.title}</p>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                            <div className="flex gap-4 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {action.effort} effort
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {action.impact} impact
                              </Badge>
                              <span className="text-xs text-muted-foreground">{action.timeframe}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}