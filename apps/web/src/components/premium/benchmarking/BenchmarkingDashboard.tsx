'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BarChart3, 
  Target,
  Award,
  AlertTriangle,
  Crown,
  RefreshCw,
  Share2
} from 'lucide-react'
import { BenchmarkComparison, CompetitivePosition, MarketTrendData } from '@/lib/services/BenchmarkingService'
import { useAuth } from '@/lib/hooks/useAuth'

interface BenchmarkingDashboardProps {
  industryCode?: string
}

export function BenchmarkingDashboard({ industryCode = 'tech' }: BenchmarkingDashboardProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [comparisons, setComparisons] = useState<BenchmarkComparison[]>([])
  const [competitivePosition, setCompetitivePosition] = useState<CompetitivePosition | null>(null)
  const [marketTrends, setMarketTrends] = useState<MarketTrendData | null>(null)
  const [insights, setInsights] = useState<{
    insights: string[]
    recommendations: string[]
    priorityActions: string[]
  } | null>(null)
  const [peerSharing, setPeerSharing] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadBenchmarkingData()
    }
  }, [user?.id, industryCode])

  const loadBenchmarkingData = async () => {
    try {
      setLoading(true)
      
      // Load all benchmarking data
      const [comparisonsRes, positionRes, trendsRes, insightsRes] = await Promise.all([
        fetch(`/api/benchmarks/compare?userId=${user?.id}&industry=${industryCode}`),
        fetch(`/api/benchmarks/competitive-position?userId=${user?.id}&industry=${industryCode}`),
        fetch(`/api/benchmarks/market-trends?industry=${industryCode}`),
        fetch(`/api/benchmarks/insights?userId=${user?.id}&industry=${industryCode}`)
      ])

      if (comparisonsRes.ok) {
        const data = await comparisonsRes.json()
        setComparisons(data.comparisons)
      }

      if (positionRes.ok) {
        const data = await positionRes.json()
        setCompetitivePosition(data.position)
      }

      if (trendsRes.ok) {
        const data = await trendsRes.json()
        setMarketTrends(data.trends)
      }

      if (insightsRes.ok) {
        const data = await insightsRes.json()
        setInsights(data)
      }

    } catch (error) {
      console.error('Error loading benchmarking data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'top_quartile': return 'text-green-600 bg-green-100'
      case 'above_average': return 'text-blue-600 bg-blue-100'
      case 'below_average': return 'text-orange-600 bg-orange-100'
      case 'bottom_quartile': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPerformanceIcon = (level: string) => {
    switch (level) {
      case 'top_quartile': return <Award className="h-4 w-4" />
      case 'above_average': return <TrendingUp className="h-4 w-4" />
      case 'below_average': return <TrendingDown className="h-4 w-4" />
      case 'bottom_quartile': return <AlertTriangle className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const formatMetricValue = (value: number, type: string) => {
    switch (type) {
      case 'health_score':
        return `${value.toFixed(0)}/100`
      case 'valuation':
        return `${value.toFixed(1)}x`
      case 'growth':
        return `${value.toFixed(1)}%`
      case 'risk':
        return `${value.toFixed(1)}/5`
      default:
        return value.toFixed(1)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <span>Industry Benchmarking</span>
              <RefreshCw className="h-4 w-4 animate-spin" />
            </CardTitle>
            <CardDescription>Loading competitive analysis...</CardDescription>
          </CardHeader>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-300 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <span>Industry Benchmarking</span>
              <Badge variant="secondary">Technology Sector</Badge>
            </CardTitle>
            <CardDescription>
              Compare your performance against industry standards and peers
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={loadBenchmarkingData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share Results
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {comparisons.map((comparison) => (
          <Card key={comparison.industryBenchmark.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">
                  {comparison.industryBenchmark.metric}
                </div>
                {getPerformanceIcon(comparison.performanceLevel)}
              </div>
              
              <div className="flex items-baseline space-x-2 mb-3">
                <div className="text-2xl font-bold">
                  {formatMetricValue(comparison.userMetric, comparison.industryBenchmark.benchmarkType)}
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getPerformanceColor(comparison.performanceLevel)}`}
                >
                  {comparison.percentileRanking.toFixed(0)}th percentile
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Industry Median</span>
                  <span>{formatMetricValue(comparison.industryBenchmark.percentile50, comparison.industryBenchmark.benchmarkType)}</span>
                </div>
                <Progress 
                  value={comparison.percentileRanking} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  {comparison.gapAnalysis.differenceFromMedian > 0 ? '+' : ''}
                  {comparison.gapAnalysis.differenceFromMedian.toFixed(1)} vs median
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="competitive" className="space-y-4">
        <TabsList>
          <TabsTrigger value="competitive">Competitive Position</TabsTrigger>
          <TabsTrigger value="peers">Peer Comparison</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="competitive">
          <CompetitivePositionView position={competitivePosition} />
        </TabsContent>

        <TabsContent value="peers">
          <PeerComparisonView />
        </TabsContent>

        <TabsContent value="trends">
          <MarketTrendsView trends={marketTrends} />
        </TabsContent>

        <TabsContent value="insights">
          <BenchmarkInsightsView insights={insights} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Competitive Position Component
function CompetitivePositionView({ position }: { position: CompetitivePosition | null }) {
  if (!position) return <div>Loading competitive position...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Industry Rankings</CardTitle>
          <CardDescription>Your position across key metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(position.industryRanking).map(([metric, percentile]) => (
            <div key={metric} className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">
                {metric.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <div className="flex items-center space-x-2">
                <Progress value={percentile} className="w-24 h-2" />
                <span className="text-sm font-medium w-12">
                  {percentile.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SWOT Analysis</CardTitle>
          <CardDescription>Strategic positioning overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
              <ul className="space-y-1 text-green-600">
                {position.strengths.slice(0, 3).map((strength, i) => (
                  <li key={i} className="flex items-start space-x-1">
                    <span>•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-red-700 mb-2">Weaknesses</h4>
              <ul className="space-y-1 text-red-600">
                {position.weaknesses.slice(0, 3).map((weakness, i) => (
                  <li key={i} className="flex items-start space-x-1">
                    <span>•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-blue-700 mb-2">Opportunities</h4>
              <ul className="space-y-1 text-blue-600">
                {position.opportunities.slice(0, 3).map((opportunity, i) => (
                  <li key={i} className="flex items-start space-x-1">
                    <span>•</span>
                    <span>{opportunity}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-orange-700 mb-2">Threats</h4>
              <ul className="space-y-1 text-orange-600">
                {position.threats.slice(0, 3).map((threat, i) => (
                  <li key={i} className="flex items-start space-x-1">
                    <span>•</span>
                    <span>{threat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Peer Comparison Component
function PeerComparisonView() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Peer Group Analysis</span>
          </CardTitle>
          <CardDescription>
            Compare with similar businesses in your industry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">47</div>
              <div className="text-sm text-gray-600">Peer Businesses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">68%</div>
              <div className="text-sm text-gray-600">Above Peer Average</div>
            </div>
            <div className="text-2xl font-bold text-purple-600 text-center">
              <div>Top 25%</div>
              <div className="text-sm text-gray-600">Overall Ranking</div>
            </div>
          </div>

          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              <strong>Peer Group Characteristics:</strong> Technology businesses with $1M-$5M revenue, 10-50 employees, North America region
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

// Market Trends Component
function MarketTrendsView({ trends }: { trends: MarketTrendData | null }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Market Context</span>
          </CardTitle>
          <CardDescription>
            Industry trends and economic indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Industry Indicators</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Market Growth Rate</span>
                  <span className="font-medium text-green-600">+12.8%</span>
                </div>
                <div className="flex justify-between">
                  <span>Competition Level</span>
                  <Badge variant="outline" className="text-xs">High</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Market Maturity</span>
                  <Badge variant="outline" className="text-xs">Growth Stage</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Economic Context</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>GDP Growth</span>
                  <span className="font-medium">+2.3%</span>
                </div>
                <div className="flex justify-between">
                  <span>Inflation Rate</span>
                  <span className="font-medium text-orange-600">3.1%</span>
                </div>
                <div className="flex justify-between">
                  <span>Market Sentiment</span>
                  <Badge variant="outline" className="text-xs text-green-600">Positive</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Benchmark Insights Component
function BenchmarkInsightsView({ insights }: { 
  insights: { insights: string[]; recommendations: string[]; priorityActions: string[] } | null 
}) {
  if (!insights) return <div>Loading insights...</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700">Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {insights.insights.map((insight, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <div className="h-1.5 w-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {insights.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <div className="h-1.5 w-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-orange-700">Priority Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {insights.priorityActions.map((action, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <div className="h-1.5 w-1.5 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BenchmarkingDashboard