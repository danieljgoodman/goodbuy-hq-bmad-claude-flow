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
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { EnhancedHealthAnalysis } from '@/lib/services/claude-service'

interface EnhancedHealthScoreProps {
  analysis: EnhancedHealthAnalysis
  businessName?: string
}

export function EnhancedHealthScore({ analysis, businessName }: EnhancedHealthScoreProps) {
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null)

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

  const toggleDimension = (dimension: string) => {
    setExpandedDimension(expandedDimension === dimension ? null : dimension)
  }

  const formatPercentile = (percentile: number) => {
    const suffix = percentile === 1 ? 'st' : percentile === 2 ? 'nd' : percentile === 3 ? 'rd' : 'th'
    return `${percentile}${suffix} percentile`
  }

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <Card className={`border-2 ${getHealthBgColor(analysis.healthScore)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className={`h-8 w-8 ${getHealthColor(analysis.healthScore)}`} />
              <div>
                <CardTitle className="text-2xl">Business Health Score</CardTitle>
                {businessName && <CardDescription>Overall health assessment for {businessName}</CardDescription>}
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {analysis.confidenceScore}% confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div>
              <p className={`text-6xl font-bold ${getHealthColor(analysis.healthScore)}`}>
                {analysis.healthScore}
              </p>
              <p className={`text-xl font-semibold ${getHealthColor(analysis.healthScore)}`}>
                {getHealthLabel(analysis.healthScore)}
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <Progress 
                value={analysis.healthScore} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              {analysis.methodology}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Industry Benchmarking */}
      {analysis.industryBenchmarks && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Industry Benchmarking
            </CardTitle>
            <CardDescription>
              How your business compares to industry peers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{formatPercentile(analysis.industryBenchmarks.percentile)}</p>
                <p className="text-sm text-muted-foreground">Industry Ranking</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{analysis.industryBenchmarks.industryAverage}</p>
                <p className="text-sm text-muted-foreground">Industry Average</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600">{analysis.industryBenchmarks.topPerformers}</p>
                <p className="text-sm text-muted-foreground">Top Performers</p>
              </div>
            </div>

            <div className="space-y-3">
              {analysis.industryBenchmarks.benchmarkCategories.map((category, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{category.category}</h4>
                    <Badge variant={category.percentile >= 75 ? 'default' : category.percentile >= 50 ? 'secondary' : 'destructive'}>
                      {formatPercentile(category.percentile)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Your Value</p>
                      <p className="font-semibold">{category.userValue.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Industry Avg</p>
                      <p className="font-semibold">{category.industryAverage.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Top Quartile</p>
                      <p className="font-semibold">{category.topQuartile.toFixed(1)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{category.interpretation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Dimensions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Health Dimensions Analysis</h3>
        
        {/* Financial Health */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getHealthBgColor(analysis.scoringFactors.financial.score)}`}>
                  <BarChart3 className={`h-5 w-5 ${getHealthColor(analysis.scoringFactors.financial.score)}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">Financial Health</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getHealthColor(analysis.scoringFactors.financial.score)}`}>
                      {analysis.scoringFactors.financial.score}
                    </span>
                    {getTrendIcon(analysis.scoringFactors.financial.trend)}
                    <Badge variant="outline" className="text-xs">
                      {analysis.scoringFactors.financial.confidence}% confidence
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleDimension('financial')}
              >
                {expandedDimension === 'financial' ? <ChevronDown /> : <ChevronRight />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={analysis.scoringFactors.financial.score} className="mb-4" />
            
            {expandedDimension === 'financial' && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <h4 className="font-medium mb-3">Key Metrics Analysis:</h4>
                  <div className="space-y-2">
                    {analysis.scoringFactors.financial.factors.map((factor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{factor.metric}</p>
                          <p className="text-sm text-muted-foreground">
                            Your value: {factor.value.toLocaleString()} | 
                            Benchmark: {factor.benchmark.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{factor.impact}% impact</p>
                          <p className={`text-sm ${factor.value >= factor.benchmark ? 'text-green-600' : 'text-red-600'}`}>
                            {factor.value >= factor.benchmark ? 'Above' : 'Below'} benchmark
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {analysis.scoringFactors.financial.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Operational Efficiency */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getHealthBgColor(analysis.scoringFactors.operational.score)}`}>
                  <Target className={`h-5 w-5 ${getHealthColor(analysis.scoringFactors.operational.score)}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">Operational Efficiency</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getHealthColor(analysis.scoringFactors.operational.score)}`}>
                      {analysis.scoringFactors.operational.score}
                    </span>
                    {getTrendIcon(analysis.scoringFactors.operational.trend)}
                    <Badge variant="outline" className="text-xs">
                      {analysis.scoringFactors.operational.confidence}% confidence
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleDimension('operational')}
              >
                {expandedDimension === 'operational' ? <ChevronDown /> : <ChevronRight />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={analysis.scoringFactors.operational.score} className="mb-4" />
            
            {expandedDimension === 'operational' && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <h4 className="font-medium mb-3">Key Metrics Analysis:</h4>
                  <div className="space-y-2">
                    {analysis.scoringFactors.operational.factors.map((factor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{factor.metric}</p>
                          <p className="text-sm text-muted-foreground">
                            Your value: {factor.value.toLocaleString()} | 
                            Benchmark: {factor.benchmark.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{factor.impact}% impact</p>
                          <p className={`text-sm ${factor.value >= factor.benchmark ? 'text-green-600' : 'text-red-600'}`}>
                            {factor.value >= factor.benchmark ? 'Above' : 'Below'} benchmark
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {analysis.scoringFactors.operational.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Continue with other dimensions... (Market, Risk, Growth) */}
        {/* Similar structure for market, risk, and growth dimensions */}
      </div>

      {/* Summary Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Understanding Your Health Score:</strong> This comprehensive analysis evaluates 
          your business across five critical dimensions. Each dimension is weighted based on its 
          importance to overall business health and compared against industry benchmarks. 
          Focus on the lowest-scoring dimensions for maximum impact on your overall health score.
        </AlertDescription>
      </Alert>
    </div>
  )
}