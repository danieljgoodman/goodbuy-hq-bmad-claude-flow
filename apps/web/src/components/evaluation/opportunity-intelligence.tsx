'use client'

import { useState } from 'react'
import { 
  Target, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Zap,
  Shield,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { EnhancedHealthAnalysis } from '@/lib/services/claude-service'

interface OpportunityIntelligenceProps {
  analysis: EnhancedHealthAnalysis
  businessName?: string
}

export function OpportunityIntelligence({ analysis, businessName }: OpportunityIntelligenceProps) {
  const [expandedOpportunity, setExpandedOpportunity] = useState<string | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial':
        return <DollarSign className="h-5 w-5" />
      case 'operational':
        return <Target className="h-5 w-5" />
      case 'strategic':
        return <Lightbulb className="h-5 w-5" />
      case 'market':
        return <TrendingUp className="h-5 w-5" />
      default:
        return <Zap className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'operational':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'strategic':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'market':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'low':
        return 'text-green-600 bg-green-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'high':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityLabel = (priority: number) => {
    if (priority === 1) return 'High Priority'
    if (priority === 2) return 'Medium Priority'
    return 'Lower Priority'
  }

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'bg-red-100 text-red-800'
    if (priority === 2) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const toggleOpportunity = (opportunityId: string) => {
    setExpandedOpportunity(expandedOpportunity === opportunityId ? null : opportunityId)
  }

  // Calculate total potential impact
  const totalPotentialImpact = analysis.topOpportunities.reduce((sum, opp) => 
    sum + opp.impactEstimate.dollarAmount, 0
  )

  const averageROI = analysis.topOpportunities.reduce((sum, opp) => 
    sum + opp.impactEstimate.roiEstimate, 0
  ) / analysis.topOpportunities.length

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Target className="h-6 w-6" />
            Improvement Opportunity Intelligence
          </CardTitle>
          {businessName && (
            <CardDescription>
              AI-identified opportunities to maximize value for {businessName}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPotentialImpact)}
              </p>
              <p className="text-sm text-green-700">Total Potential Impact</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">
                {averageROI.toFixed(1)}x
              </p>
              <p className="text-sm text-blue-700">Average ROI</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-2xl font-bold text-purple-600">
                {analysis.topOpportunities.length}
              </p>
              <p className="text-sm text-purple-700">Opportunities Identified</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunity Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Prioritized Opportunities</h3>
        
        {analysis.topOpportunities.map((opportunity, index) => (
          <Card key={opportunity.id} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(opportunity.category)}`}>
                    {getCategoryIcon(opportunity.category)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getPriorityColor(opportunity.priority)}>
                        #{opportunity.priority} {getPriorityLabel(opportunity.priority)}
                      </Badge>
                      <Badge variant="outline" className={getDifficultyColor(opportunity.difficulty)}>
                        {opportunity.difficulty} difficulty
                      </Badge>
                      <Badge variant="outline">
                        {opportunity.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleOpportunity(opportunity.id)}
                >
                  {expandedOpportunity === opportunity.id ? <ChevronDown /> : <ChevronRight />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Impact Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(opportunity.impactEstimate.dollarAmount)}
                  </p>
                  <p className="text-xs text-green-700">Potential Value</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-600">
                    +{opportunity.impactEstimate.percentageIncrease}%
                  </p>
                  <p className="text-xs text-blue-700">Improvement</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-purple-600">
                    {opportunity.impactEstimate.roiEstimate.toFixed(1)}x
                  </p>
                  <p className="text-xs text-purple-700">ROI</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-orange-600">
                    {opportunity.impactEstimate.timeline}
                  </p>
                  <p className="text-xs text-orange-700">Timeline</p>
                </div>
              </div>

              {/* Confidence Indicator */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Confidence Level</span>
                  <span>{opportunity.impactEstimate.confidence}%</span>
                </div>
                <Progress value={opportunity.impactEstimate.confidence} />
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4">
                {opportunity.description}
              </p>

              {/* Expanded Details */}
              {expandedOpportunity === opportunity.id && (
                <div className="space-y-4 border-t pt-4">
                  {/* AI Analysis */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      AI-Specific Analysis
                    </h4>
                    <p className="text-sm text-blue-700">{opportunity.specificAnalysis}</p>
                  </div>

                  {/* Selection Rationale */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Why This Opportunity Was Selected
                    </h4>
                    <p className="text-sm text-green-700">{opportunity.selectionRationale}</p>
                  </div>

                  {/* Implementation Requirements */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Required Resources
                      </h4>
                      <ul className="space-y-1">
                        {opportunity.requiredResources.map((resource, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            {resource}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Prerequisites
                      </h4>
                      <ul className="space-y-1">
                        {opportunity.prerequisites.map((prereq, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <Clock className="h-3 w-3 text-orange-600" />
                            {prereq}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  {opportunity.riskFactors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        Risk Factors to Consider
                      </h4>
                      <ul className="space-y-1">
                        {opportunity.riskFactors.map((risk, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Implementation Timeline */}
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Implementation Timeline</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Expected Duration: {opportunity.timeframe}</span>
                      <span className="mx-2">•</span>
                      <span>Results Timeline: {opportunity.impactEstimate.timeline}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="default" size="sm">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Start Implementation
                    </Button>
                    <Button variant="outline" size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      Get Premium Guide
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Alert */}
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          <strong>Opportunity Intelligence:</strong> These opportunities are ranked by potential ROI 
          and selected specifically for your business based on comprehensive analysis. Each opportunity 
          includes quantified impact estimates, implementation guidance, and risk assessment. 
          Premium subscribers receive detailed implementation guides with step-by-step instructions.
        </AlertDescription>
      </Alert>
    </div>
  )
}