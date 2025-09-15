'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ImprovementOpportunity } from '@/types'

interface OpportunitiesListProps {
  opportunities: ImprovementOpportunity[]
  showImplementationGuides?: boolean
}

export default function OpportunitiesList({ opportunities, showImplementationGuides = false }: OpportunitiesListProps) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'operational': return 'bg-blue-100 text-blue-800'
      case 'financial': return 'bg-green-100 text-green-800'
      case 'strategic': return 'bg-purple-100 text-purple-800'
      case 'market': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!opportunities || opportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Improvement Opportunities</CardTitle>
          <CardDescription>
            No specific opportunities identified at this time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your business appears to be performing well across all key areas. 
            Continue monitoring your metrics and consider periodic re-evaluation.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Improvement Opportunities</CardTitle>
        <CardDescription>
          AI-identified areas with highest potential impact on business value
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {opportunities.map((opportunity, index) => (
            <div key={opportunity.id} className="border rounded-lg p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{opportunity.title}</h3>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(opportunity.category)}`}>
                        {opportunity.category}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(opportunity.difficulty)}`}>
                        {opportunity.difficulty} effort
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    +{formatCurrency(opportunity.impactEstimate.dollarAmount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Potential Impact
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed">
                {opportunity.description}
              </p>

              {/* Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 bg-muted/50 rounded-lg px-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {opportunity.impactEstimate.percentageIncrease}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Revenue Increase
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {opportunity.impactEstimate.confidence}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Confidence
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold capitalize">
                    {opportunity.difficulty}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Difficulty
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {opportunity.timeframe}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Timeline
                  </div>
                </div>
              </div>

              {/* Required Resources */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Required Resources:</h4>
                <div className="flex flex-wrap gap-2">
                  {opportunity.requiredResources.map((resource, idx) => (
                    <span key={idx} className="px-2 py-1 bg-muted text-xs rounded">
                      {resource}
                    </span>
                  ))}
                </div>
              </div>

              {/* Implementation Guide (Premium Feature) */}
              {showImplementationGuides && opportunity.implementationGuide ? (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium text-sm">Implementation Guide:</h4>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {opportunity.implementationGuide}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Want detailed implementation steps?</p>
                      <p className="text-xs text-muted-foreground">
                        Get step-by-step guidance with Premium
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Upgrade
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Overall CTA */}
        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Ready to Implement These Opportunities?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get personalized implementation roadmaps, progress tracking, and expert support
              </p>
              <div className="flex justify-center space-x-4">
                <Button>
                  Start Free Trial
                </Button>
                <Button variant="outline">
                  Schedule Consultation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}