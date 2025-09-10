'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, Target, X } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

interface DrillDownModalProps {
  type: 'trends' | 'competitive' | 'opportunities'
  data: any
  isOpen: boolean
  onClose: () => void
}

export function DrillDownModal({ type, data, isOpen, onClose }: DrillDownModalProps) {
  const renderTrendsDetail = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Historical Growth Chart */}
        <div className="space-y-3">
          <h4 className="font-medium">Historical Growth Trend</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Growth Rate']} />
                <Line type="monotone" dataKey="growth" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Size Evolution */}
        <div className="space-y-3">
          <h4 className="font-medium">Market Size Evolution</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value}`, 'Market Index']} />
                <Bar dataKey="market_size" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Disruption Analysis */}
      <div className="space-y-3">
        <h4 className="font-medium">Disruption Factor Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.data.disruption_indicators.map((indicator: string, index: number) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <h5 className="font-medium text-sm">{indicator}</h5>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                This disruption factor is impacting market dynamics through 
                technology adoption and changing customer expectations.
              </p>
              <Badge variant="outline" className="text-xs">
                Impact Level: {Math.floor(Math.random() * 30 + 70)}%
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderCompetitiveDetail = () => (
    <div className="space-y-6">
      {/* Competitive Radar Chart */}
      <div className="space-y-3">
        <h4 className="font-medium">Competitive Position Radar</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data.radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="dimension" className="text-sm" />
              <PolarRadiusAxis domain={[0, 100]} tick={false} />
              <Radar
                name="Your Position"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip formatter={(value: any) => [`${value.toFixed(0)}%`, 'Score']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Competitive Benchmark Details */}
      <div className="space-y-3">
        <h4 className="font-medium">Detailed Benchmarking</h4>
        <div className="space-y-4">
          {data.comparisonData.map((item: any, index: number) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium">{item.metric}</h5>
                <div className="flex gap-2">
                  <Badge variant="outline">Your Score: {item.user.toFixed(1)}%</Badge>
                  <Badge variant="secondary">Top Performer: {item.topPerformer.toFixed(1)}%</Badge>
                </div>
              </div>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[item]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="user" fill="#3b82f6" name="Your Performance" />
                    <Bar dataKey="industry" fill="#6b7280" name="Industry Average" />
                    <Bar dataKey="topPerformer" fill="#10b981" name="Top Performer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderOpportunitiesDetail = () => (
    <div className="space-y-6">
      {/* Detailed Opportunity Analysis */}
      <div className="space-y-4">
        <h4 className="font-medium">Opportunity Deep Dive</h4>
        {data.data.map((opportunity: any, index: number) => (
          <div key={opportunity.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-medium">{opportunity.title}</h5>
              <div className="flex gap-2">
                <Badge variant="outline">
                  Impact: {opportunity.impact_score}%
                </Badge>
                <Badge variant="outline">
                  Feasibility: {opportunity.feasibility_score}%
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">{opportunity.description}</p>
            
            <div className="space-y-2">
              <h6 className="text-sm font-medium">Supporting Trends:</h6>
              <div className="flex flex-wrap gap-2">
                {opportunity.trends.map((trend: string, trendIndex: number) => (
                  <Badge key={trendIndex} variant="secondary" className="text-xs">
                    {trend}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Estimated Timeline:</span>
                <p className="text-gray-600">6-12 months</p>
              </div>
              <div>
                <span className="font-medium">Investment Level:</span>
                <p className="text-gray-600">
                  {opportunity.feasibility_score > 70 ? 'Low' : 
                   opportunity.feasibility_score > 40 ? 'Medium' : 'High'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const getModalTitle = () => {
    switch (type) {
      case 'trends': return 'Industry Trend Analysis'
      case 'competitive': return 'Competitive Positioning Detail'
      case 'opportunities': return 'Market Opportunities Analysis'
      default: return 'Detailed Analysis'
    }
  }

  const getModalIcon = () => {
    switch (type) {
      case 'trends': return <TrendingUp className="h-5 w-5 text-blue-600" />
      case 'competitive': return <Users className="h-5 w-5 text-purple-600" />
      case 'opportunities': return <Target className="h-5 w-5 text-green-600" />
      default: return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getModalIcon()}
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {type === 'trends' && renderTrendsDetail()}
          {type === 'competitive' && renderCompetitiveDetail()}
          {type === 'opportunities' && renderOpportunitiesDetail()}
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>Export Analysis</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}