'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MarketIntelligence } from '@/types'
import { Users, TrendingUp, TrendingDown, ExternalLink, Target, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

interface CompetitivePositioningCardProps {
  competitivePositioning: MarketIntelligence['competitivePositioning']
  industry: string
  onDrillDown: (data: any) => void
}

export function CompetitivePositioningCard({ competitivePositioning, industry, onDrillDown }: CompetitivePositioningCardProps) {
  // Generate comparative data for charts
  const generateComparisonData = () => {
    return [
      {
        metric: 'Revenue/Employee',
        user: competitivePositioning.user_vs_industry.revenuePerEmployee || 0,
        industry: 0,
        topPerformer: competitivePositioning.user_vs_industry.revenuePerEmployee + (competitivePositioning.top_performer_gap.revenuePerEmployee || 50)
      },
      {
        metric: 'Growth Rate',
        user: competitivePositioning.user_vs_industry.growthRate || 0,
        industry: 0,
        topPerformer: (competitivePositioning.user_vs_industry.growthRate || 0) + 10
      },
      {
        metric: 'Efficiency',
        user: competitivePositioning.user_vs_industry.efficiency || 0,
        industry: 0,
        topPerformer: (competitivePositioning.user_vs_industry.efficiency || 0) + 25
      }
    ]
  }

  // Generate radar chart data for positioning
  const generatePositioningRadar = () => {
    const baseScore = competitivePositioning.positioning_score
    return [
      {
        dimension: 'Market Share',
        value: Math.min(100, Math.max(0, baseScore + (Math.random() - 0.5) * 20)),
        fullMark: 100
      },
      {
        dimension: 'Innovation',
        value: Math.min(100, Math.max(0, baseScore + (Math.random() - 0.5) * 30)),
        fullMark: 100
      },
      {
        dimension: 'Customer Satisfaction',
        value: Math.min(100, Math.max(0, baseScore + (Math.random() - 0.5) * 15)),
        fullMark: 100
      },
      {
        dimension: 'Financial Performance',
        value: Math.min(100, Math.max(0, baseScore + (Math.random() - 0.5) * 25)),
        fullMark: 100
      },
      {
        dimension: 'Brand Recognition',
        value: Math.min(100, Math.max(0, baseScore + (Math.random() - 0.5) * 35)),
        fullMark: 100
      }
    ]
  }

  const getPerformanceIcon = (value: number) => {
    if (value > 10) return <ArrowUp className="h-4 w-4 text-green-600" />
    if (value < -10) return <ArrowDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  const getPerformanceColor = (value: number): string => {
    if (value > 10) return 'text-green-600'
    if (value < -10) return 'text-red-600'
    return 'text-gray-600'
  }

  const getPositionBadgeColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-blue-100 text-blue-800'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getPositionLabel = (score: number): string => {
    if (score >= 80) return 'Market Leader'
    if (score >= 60) return 'Strong Competitor'
    if (score >= 40) return 'Growing Player'
    return 'Market Challenger'
  }

  const comparisonData = generateComparisonData()
  const radarData = generatePositioningRadar()

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Competitive Position</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDrillDown({
              type: 'competitive',
              data: competitivePositioning,
              industry,
              comparisonData,
              radarData
            })}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">Market positioning analysis</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Positioning Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Position Score</h4>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-blue-600">
                {competitivePositioning.positioning_score.toFixed(0)}/100
              </span>
            </div>
          </div>
          
          <Progress value={competitivePositioning.positioning_score} className="h-2" />
          
          <div className="flex items-center justify-between">
            <Badge 
              variant="secondary" 
              className={getPositionBadgeColor(competitivePositioning.positioning_score)}
            >
              {getPositionLabel(competitivePositioning.positioning_score)}
            </Badge>
            <span className="text-xs text-gray-600">
              Industry Rank: Top {(100 - competitivePositioning.positioning_score).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Performance vs Industry */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">vs Industry Average</h4>
          
          <div className="space-y-2">
            {Object.entries(competitivePositioning.user_vs_industry).slice(0, 3).map(([metric, value]) => (
              <div key={metric} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getPerformanceIcon(value as number)}
                  <span className="text-sm capitalize">
                    {metric.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                </div>
                <span className={`text-sm font-semibold ${getPerformanceColor(value as number)}`}>
                  {value > 0 ? '+' : ''}{(value as number).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Competitive Gaps */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Opportunity Gaps</h4>
          
          {Object.entries(competitivePositioning.top_performer_gap).slice(0, 2).map(([metric, gap]) => (
            <div key={metric} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 capitalize">
                  {metric.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
                <span className="text-xs font-medium text-orange-600">
                  {typeof gap === 'number' ? `${gap.toFixed(0)}% gap` : gap}
                </span>
              </div>
              <Progress 
                value={typeof gap === 'number' ? Math.max(0, 100 - gap) : 50} 
                className="h-1"
              />
            </div>
          ))}
        </div>

        {/* Mini Radar Chart */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Positioning Radar</h4>
          
          <div className="h-32 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid gridType="polygon" />
                <PolarAngleAxis 
                  dataKey="dimension" 
                  tick={{ fontSize: 10 }}
                  className="text-gray-600"
                />
                <PolarRadiusAxis 
                  domain={[0, 100]} 
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Position"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value.toFixed(0)}%`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Industry Metrics Overview */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Key Industry Metrics</h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(competitivePositioning.industry_avg_metrics).slice(0, 4).map(([metric, value]) => (
              <div key={metric} className="bg-blue-50 p-2 rounded">
                <div className="font-medium text-blue-900 capitalize">
                  {metric.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </div>
                <div className="text-blue-700">
                  {typeof value === 'number' 
                    ? value > 1000 
                      ? `$${(value / 1000).toFixed(0)}K`
                      : value.toFixed(1)
                    : value
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Insight */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="text-sm font-medium text-purple-900">Competitive Insight</h5>
              <p className="text-xs text-purple-700 mt-1">
                {competitivePositioning.positioning_score >= 70
                  ? 'Strong competitive position with opportunities to expand market leadership through strategic initiatives.'
                  : competitivePositioning.positioning_score >= 50
                  ? 'Solid market position with clear paths for improvement in key competitive areas.'
                  : 'Significant competitive opportunities identified. Focus on core strengths while addressing key gaps.'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}