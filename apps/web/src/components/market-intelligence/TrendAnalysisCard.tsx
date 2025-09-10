'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MarketIntelligence } from '@/types'
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface TrendAnalysisCardProps {
  trendAnalysis: MarketIntelligence['trendAnalysis']
  industry: string
  onDrillDown: (data: any) => void
}

export function TrendAnalysisCard({ trendAnalysis, industry, onDrillDown }: TrendAnalysisCardProps) {
  // Generate mock historical data for the chart
  const generateHistoricalData = () => {
    const currentGrowth = trendAnalysis.growth_rate
    return [
      { year: '2021', growth: currentGrowth - 2.5, market_size: 100 },
      { year: '2022', growth: currentGrowth - 1.8, market_size: 105 },
      { year: '2023', growth: currentGrowth - 0.9, market_size: 112 },
      { year: '2024', growth: currentGrowth, market_size: 120 },
      { year: '2025', growth: currentGrowth + 0.5, market_size: 128 }
    ]
  }

  // Generate consolidation data for pie chart
  const consolidationData = [
    { name: 'Major Players', value: trendAnalysis.consolidation_index, color: '#3b82f6' },
    { name: 'Small/Medium', value: 100 - trendAnalysis.consolidation_index, color: '#e5e7eb' }
  ]

  const getTrendIcon = (rate: number) => {
    if (rate > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (rate < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  const getDisruptionColor = (indicator: string): string => {
    if (indicator.toLowerCase().includes('ai') || indicator.toLowerCase().includes('digital')) {
      return 'bg-blue-100 text-blue-800'
    }
    if (indicator.toLowerCase().includes('regulation') || indicator.toLowerCase().includes('compliance')) {
      return 'bg-orange-100 text-orange-800'
    }
    if (indicator.toLowerCase().includes('competition') || indicator.toLowerCase().includes('market')) {
      return 'bg-red-100 text-red-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const getMaturityDescription = (maturity: string): string => {
    switch (maturity.toLowerCase()) {
      case 'emerging':
        return 'Early stage market with high growth potential and uncertainty'
      case 'growth':
        return 'Rapidly expanding market with increasing competition'
      case 'mature':
        return 'Established market with stable growth and consolidated players'
      case 'declining':
        return 'Market showing signs of decline or disruption'
      default:
        return 'Market stage assessment not available'
    }
  }

  const historicalData = generateHistoricalData()

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Industry Trends</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDrillDown({
              type: 'trends',
              data: trendAnalysis,
              industry,
              historicalData
            })}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">{industry} Market Analysis</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Growth Rate Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Annual Growth Rate</h4>
            <div className="flex items-center gap-1">
              {getTrendIcon(trendAnalysis.growth_rate)}
              <span className={`font-semibold ${
                trendAnalysis.growth_rate > 0 ? 'text-green-600' : 
                trendAnalysis.growth_rate < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trendAnalysis.growth_rate > 0 ? '+' : ''}{trendAnalysis.growth_rate.toFixed(1)}%
              </span>
            </div>
          </div>
          
          {/* Mini Growth Chart */}
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData.slice(-4)}>
                <Line 
                  type="monotone" 
                  dataKey="growth" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Growth Rate']}
                  labelFormatter={(label) => `Year ${label}`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Consolidation Index */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Market Consolidation</h4>
            <span className="text-sm font-semibold text-blue-600">
              {trendAnalysis.consolidation_index.toFixed(0)}/100
            </span>
          </div>
          
          <Progress value={trendAnalysis.consolidation_index} className="h-2" />
          
          <div className="flex justify-between text-xs text-gray-600">
            <span>Fragmented</span>
            <span>Consolidated</span>
          </div>

          {/* Consolidation Pie Chart */}
          <div className="h-20 flex items-center justify-center">
            <PieChart width={80} height={80}>
              <Pie
                data={consolidationData}
                cx={40}
                cy={40}
                innerRadius={20}
                outerRadius={35}
                paddingAngle={2}
                dataKey="value"
              >
                {consolidationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `${value.toFixed(0)}%`} />
            </PieChart>
          </div>
        </div>

        {/* Market Maturity */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Market Maturity</h4>
          <div className="space-y-2">
            <Badge 
              variant="secondary" 
              className={`w-fit ${
                trendAnalysis.market_maturity.toLowerCase() === 'emerging' ? 'bg-green-100 text-green-800' :
                trendAnalysis.market_maturity.toLowerCase() === 'growth' ? 'bg-blue-100 text-blue-800' :
                trendAnalysis.market_maturity.toLowerCase() === 'mature' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}
            >
              {trendAnalysis.market_maturity}
            </Badge>
            <p className="text-xs text-gray-600">
              {getMaturityDescription(trendAnalysis.market_maturity)}
            </p>
          </div>
        </div>

        {/* Disruption Indicators */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Key Disruption Factors</h4>
          <div className="space-y-2">
            {trendAnalysis.disruption_indicators.slice(0, 3).map((indicator, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0" />
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getDisruptionColor(indicator)}`}
                >
                  {indicator}
                </Badge>
              </div>
            ))}
            
            {trendAnalysis.disruption_indicators.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-blue-600"
                onClick={() => onDrillDown({
                  type: 'disruption',
                  data: trendAnalysis.disruption_indicators,
                  industry
                })}
              >
                +{trendAnalysis.disruption_indicators.length - 3} more
              </Button>
            )}
          </div>
        </div>

        {/* Insights Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="text-sm font-medium text-blue-900">Key Insight</h5>
              <p className="text-xs text-blue-700 mt-1">
                {trendAnalysis.growth_rate > 5 
                  ? `Strong growth momentum indicates expanding market opportunities with ${trendAnalysis.growth_rate.toFixed(1)}% annual growth.`
                  : trendAnalysis.growth_rate > 0
                  ? `Stable growth pattern suggests mature market with ${trendAnalysis.growth_rate.toFixed(1)}% annual expansion.`
                  : `Market facing headwinds with ${Math.abs(trendAnalysis.growth_rate).toFixed(1)}% decline requiring strategic adaptation.`
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}