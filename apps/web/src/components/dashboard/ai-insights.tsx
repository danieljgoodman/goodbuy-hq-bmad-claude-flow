'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain } from 'lucide-react'
import type { DashboardMetrics } from '@/types/dashboard'

interface AIInsightsProps {
  metrics?: DashboardMetrics | null
  className?: string
}

interface Insight {
  id: string
  text: string
  colorClass: string
}

export default function AIInsights({ metrics, className = "" }: AIInsightsProps) {
  // Generate insights based on metrics data
  const generateInsights = (): Insight[] => {
    if (!metrics) {
      return [
        {
          id: "no-data",
          text: "Complete your first evaluation to see AI insights",
          colorClass: "bg-muted"
        }
      ]
    }

    const insights: Insight[] = []
    
    // Health Score Insight
    const healthGrade = metrics.healthScore >= 85 ? 'excellent' : 
                       metrics.healthScore >= 75 ? 'strong' : 
                       metrics.healthScore >= 65 ? 'good' : 'needs improvement'
    
    insights.push({
      id: "health-score",
      text: `Your health score of ${metrics.healthScore} is ${healthGrade} for your business stage`,
      colorClass: metrics.healthScore >= 75 ? "bg-chart-1" : "bg-chart-2"
    })

    // Risk Level Insight
    const riskInsight = metrics.riskLevel === 'low' ? 
      'Low risk profile indicates stable operations' :
      metrics.riskLevel === 'medium' ?
      'Medium risk level suggests monitoring key metrics' :
      'High risk areas need immediate attention'
    
    insights.push({
      id: "risk-level",
      text: riskInsight,
      colorClass: metrics.riskLevel === 'low' ? "bg-primary" : 
                  metrics.riskLevel === 'medium' ? "bg-chart-2" : "bg-destructive"
    })

    // Growth/Evaluation Insight  
    if (metrics.totalEvaluations >= 3) {
      const growthTrend = metrics.growthRate > 0 ? 'positive growth trajectory' : 
                         metrics.growthRate === 0 ? 'stable performance' : 
                         'declining trend needs attention'
      
      insights.push({
        id: "growth-trend",
        text: `${metrics.totalEvaluations} evaluations show ${growthTrend}`,
        colorClass: metrics.growthRate > 0 ? "bg-chart-1" : "bg-chart-2"
      })
    } else {
      insights.push({
        id: "evaluation-progress",
        text: `Complete ${3 - metrics.totalEvaluations} more evaluations for trend analysis`,
        colorClass: "bg-chart-2"
      })
    }

    return insights
  }

  const insights = generateInsights()

  return (
    <Card className={`border-border bg-card ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center">
          <Brain className="h-5 w-5 mr-2 text-primary" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => (
          <div key={insight.id} className="flex items-start space-x-3">
            <div className={`w-2 h-2 rounded-full ${insight.colorClass} mt-2 flex-shrink-0`} />
            <p className="text-sm text-foreground leading-relaxed">
              {insight.text}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}