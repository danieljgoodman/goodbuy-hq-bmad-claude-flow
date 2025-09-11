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
  // Generate insights based on metrics data or use mockup fallback
  const generateInsights = (): Insight[] => {
    if (metrics) {
      return [
        {
          id: "health-score",
          text: `Your health score is ${metrics.healthScore >= 75 ? '12% above' : '8% below'} industry average`,
          colorClass: "bg-primary"
        },
        {
          id: "revenue-growth",
          text: `Revenue growth is ${metrics.riskLevel === 'Low' ? 'accelerating (+15% this quarter)' : 'stable (+5% this quarter)'}`,
          colorClass: "bg-chart-1"
        },
        {
          id: "market-expansion",
          text: "Consider expanding market reach in Q4",
          colorClass: "bg-chart-2"
        }
      ]
    }
    
    // Fallback to exact mockup specifications
    return [
      {
        id: "health-score",
        text: "Your health score is 12% above industry average",
        colorClass: "bg-primary"
      },
      {
        id: "revenue-growth", 
        text: "Revenue growth is accelerating (+15% this quarter)",
        colorClass: "bg-chart-1"
      },
      {
        id: "market-expansion",
        text: "Consider expanding market reach in Q4", 
        colorClass: "bg-chart-2"
      }
    ]
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