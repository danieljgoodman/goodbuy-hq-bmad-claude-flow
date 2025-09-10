'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarketOpportunity } from '@/types'
import { ExternalLink, Target, TrendingUp, Clock } from 'lucide-react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface OpportunityHeatmapProps {
  opportunities: MarketOpportunity[]
  industry: string
  onDrillDown: (data: any) => void
}

export function OpportunityHeatmap({ opportunities, industry, onDrillDown }: OpportunityHeatmapProps) {
  const getOpportunityColor = (impact: number, feasibility: number): string => {
    const combined = (impact + feasibility) / 2
    if (combined >= 80) return '#22c55e' // green
    if (combined >= 60) return '#3b82f6' // blue  
    if (combined >= 40) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  const getOpportunitySize = (impact: number): number => {
    return Math.max(60, Math.min(120, impact * 1.2))
  }

  const chartData = opportunities.map(opp => ({
    ...opp,
    x: opp.feasibility_score,
    y: opp.impact_score,
    color: getOpportunityColor(opp.impact_score, opp.feasibility_score),
    size: getOpportunitySize(opp.impact_score)
  }))

  const priorityOpportunities = opportunities
    .sort((a, b) => (b.impact_score * b.feasibility_score) - (a.impact_score * a.feasibility_score))
    .slice(0, 3)

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Market Opportunities</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDrillDown({
              type: 'opportunities',
              data: opportunities,
              industry,
              chartData
            })}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">Impact vs Feasibility Analysis</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Opportunity Scatter Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Feasibility" 
                domain={[0, 100]}
                label={{ value: 'Feasibility Score', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Impact" 
                domain={[0, 100]}
                label={{ value: 'Impact Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-medium">{data.title}</p>
                        <p className="text-sm text-gray-600">Impact: {data.impact_score}%</p>
                        <p className="text-sm text-gray-600">Feasibility: {data.feasibility_score}%</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {data.trends.slice(0, 2).map((trend: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {trend}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Scatter dataKey="y" fill="#3b82f6">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Opportunities List */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-600" />
            Top Priority Opportunities
          </h4>
          
          <div className="space-y-3">
            {priorityOpportunities.map((opportunity, index) => (
              <div key={opportunity.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full`} 
                         style={{ backgroundColor: getOpportunityColor(opportunity.impact_score, opportunity.feasibility_score) }} />
                    <h5 className="font-medium text-sm">{opportunity.title}</h5>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {opportunity.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-gray-600">
                        Impact: {opportunity.impact_score}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-gray-600">
                        Feasibility: {opportunity.feasibility_score}%
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => onDrillDown({
                      type: 'opportunity-detail',
                      data: opportunity,
                      industry
                    })}
                  >
                    Details
                  </Button>
                </div>
                
                {/* Trend Tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {opportunity.trends.slice(0, 3).map((trend, trendIndex) => (
                    <Badge key={trendIndex} variant="secondary" className="text-xs">
                      {trend}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="text-sm font-medium mb-2">Opportunity Matrix</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>High Impact & Feasible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Moderate Potential</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Challenging but Valuable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Low Priority</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}