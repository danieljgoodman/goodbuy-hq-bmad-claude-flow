'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface HealthScoreProps {
  score: number
  confidenceScore: number
  scoringFactors?: {
    financial: {
      score: number
      confidence: number
      factors: any[]
      recommendations: string[]
      trend: string
    }
    operational: {
      score: number
      confidence: number
      factors: any[]
      recommendations: string[]
      trend: string
    }
    market: {
      score: number
      confidence: number
      factors: any[]
      recommendations: string[]
      trend: string
    }
    risk: {
      score: number
      confidence: number
      factors: any[]
      recommendations: string[]
      trend: string
    }
    growth?: {
      score: number
      confidence: number
      factors: any[]
      recommendations: string[]
      trend: string
    }
  }
}

export default function HealthScore({ score, confidenceScore, scoringFactors }: HealthScoreProps) {
  const getScoreColor = (value: number): string => {
    if (value >= 80) return 'text-green-600'
    if (value >= 60) return 'text-yellow-600'
    if (value >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (value: number): string => {
    if (value >= 80) return 'bg-green-600'
    if (value >= 60) return 'bg-yellow-600'
    if (value >= 40) return 'bg-orange-600'
    return 'bg-red-600'
  }

  const getScoreLabel = (value: number): string => {
    if (value >= 80) return 'Excellent'
    if (value >= 60) return 'Good'
    if (value >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  const circumference = 2 * Math.PI * 45 // radius of 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Health Score</CardTitle>
        <CardDescription>
          Comprehensive assessment of your business performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-8">
          {/* Circular Progress */}
          <div className="relative w-40 h-40">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-muted"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className={getScoreColor(score)}
                style={{
                  transition: 'stroke-dashoffset 1s ease-in-out'
                }}
              />
            </svg>
            
            {/* Score text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </div>
                <div className="text-sm text-muted-foreground">
                  out of 100
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <p className={`text-xl font-semibold ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </p>
          <p className="text-sm text-muted-foreground">
            Analysis Confidence: {confidenceScore}%
          </p>
        </div>

        {/* Scoring Breakdown */}
        {scoringFactors && (
          <div className="space-y-4">
            <h4 className="font-semibold text-center mb-4">Score Breakdown</h4>
            
            {Object.entries(scoringFactors).map(([category, factorData]) => {
              const score = typeof factorData === 'object' && factorData.score ? factorData.score : 0
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize font-medium">
                      {category === 'risk' ? 'Risk Management' : `${category} Health`}
                    </span>
                    <span className={`font-semibold ${getScoreColor(score)}`}>
                      {score}/100
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBgColor(score)}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Score Interpretation */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h5 className="font-medium mb-2">What this means:</h5>
          <div className="text-sm text-muted-foreground space-y-1">
            {score >= 80 && (
              <>
                <p>• Your business shows excellent overall health</p>
                <p>• Strong performance across key metrics</p>
                <p>• Focus on maintaining current trajectory</p>
              </>
            )}
            {score >= 60 && score < 80 && (
              <>
                <p>• Your business demonstrates good fundamental health</p>
                <p>• Several areas showing strong performance</p>
                <p>• Key opportunities identified for improvement</p>
              </>
            )}
            {score >= 40 && score < 60 && (
              <>
                <p>• Your business has fair health with mixed performance</p>
                <p>• Some areas need attention for sustainable growth</p>
                <p>• Clear improvement opportunities available</p>
              </>
            )}
            {score < 40 && (
              <>
                <p>• Your business needs immediate attention in key areas</p>
                <p>• Several critical factors requiring improvement</p>
                <p>• Focus on highest-impact opportunities first</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}