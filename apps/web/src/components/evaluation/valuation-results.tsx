'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEvaluationStore } from '@/stores/evaluation-store'
import { useRouter } from 'next/navigation'
import type { BusinessEvaluation } from '@/types'

interface ValuationResultsProps {
  evaluation: BusinessEvaluation
}

export default function ValuationResults({ evaluation }: ValuationResultsProps) {
  const router = useRouter()
  const { evaluations, loadEvaluations } = useEvaluationStore()
  const formatCurrency = (value: number | undefined | null): string => {
    if (typeof value !== 'number' || isNaN(value)) {
      return '$0'
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getValuationValue = (valuation: any): number => {
    if (typeof valuation === 'object' && valuation?.value) {
      return valuation.value
    }
    if (typeof valuation === 'number') {
      return valuation
    }
    return 0
  }

  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getHealthScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  if (evaluation.status === 'processing') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Analyzing Your Business</CardTitle>
            <CardDescription>
              Our AI is analyzing your business data. This usually takes 2-3 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div>
                <p className="font-medium">Processing your evaluation...</p>
                <p className="text-sm text-muted-foreground">
                  Analyzing financial metrics, market position, and growth opportunities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (evaluation.status === 'failed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis Failed</CardTitle>
          <CardDescription>
            We encountered an error processing your business evaluation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Please try submitting your information again. If the problem persists, 
            contact our support team.
          </p>
          <Button variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Calculate key metrics
  const netProfit = evaluation.businessData.annualRevenue - evaluation.businessData.expenses
  const profitMargin = evaluation.businessData.annualRevenue > 0 
    ? (netProfit / evaluation.businessData.annualRevenue) * 100 
    : 0

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl">Your Business Health Analysis</CardTitle>
          <CardDescription>
            AI-powered comprehensive assessment based on your business data
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Health Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Business Health Score</CardTitle>
          <CardDescription>
            Comprehensive score based on financial, operational, and market factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="text-center">
              <div className={`text-5xl font-bold ${getHealthScoreColor(evaluation.healthScore)}`}>
                {evaluation.healthScore}
              </div>
              <p className="text-sm text-muted-foreground">out of 100</p>
              <p className={`text-lg font-semibold ${getHealthScoreColor(evaluation.healthScore)}`}>
                {getHealthScoreLabel(evaluation.healthScore)}
              </p>
            </div>
            
            <div className="flex-1 ml-8">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Confidence Level</span>
                    <span>{evaluation.confidenceScore}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${evaluation.confidenceScore}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Methodology:</strong> {evaluation.valuations.methodology || 
                    'Comprehensive analysis of financial performance, operational efficiency, market position, and risk factors.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Annual Revenue</p>
              <p className="text-lg font-semibold">
                {formatCurrency(evaluation.businessData.annualRevenue)}
              </p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
              <p className={`text-lg font-semibold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Profit Margin</p>
              <p className={`text-lg font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Valuation */}
      <Card>
        <CardHeader>
          <CardTitle>Business Valuation Range</CardTitle>
          <CardDescription>
            Estimated market value based on multiple valuation approaches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Asset-Based Value</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(getValuationValue(evaluation.valuations.assetBased))}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Income-Based Value</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(getValuationValue(evaluation.valuations.incomeBased))}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Market-Based Value</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(getValuationValue(evaluation.valuations.marketBased))}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg bg-primary/5">
              <p className="text-sm text-muted-foreground mb-2">Weighted Average</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(getValuationValue(evaluation.valuations.weighted))}
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Valuations are estimates based on provided data and industry benchmarks. 
              Actual business value may vary based on market conditions, buyer preferences, and due diligence results.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Top Growth Opportunities</CardTitle>
          <CardDescription>
            AI-identified areas with highest potential impact on business value
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {evaluation.opportunities.slice(0, 3).map((opportunity, index) => (
              <div key={opportunity.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <h4 className="font-semibold">{opportunity.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      opportunity.difficulty === 'low' ? 'bg-green-100 text-green-800' :
                      opportunity.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {opportunity.difficulty} effort
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      +{formatCurrency(opportunity.impactEstimate.dollarAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {opportunity.timeframe}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {opportunity.description}
                </p>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Category: {opportunity.category}</span>
                  <span>Confidence: {opportunity.impactEstimate.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Premium CTA */}
      <Card className="bg-gradient-to-r from-secondary/5 to-secondary/10 border-secondary/20">
        <CardHeader>
          <CardTitle>Want More Detailed Analysis?</CardTitle>
          <CardDescription>
            Unlock comprehensive implementation guides and advanced insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-2">Premium Features Include:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Detailed implementation roadmaps</li>
                <li>• Industry-specific benchmarking</li>
                <li>• Monthly progress tracking</li>
                <li>• Expert consultation calls</li>
              </ul>
            </div>
            <div className="text-right">
              <Button variant="outline" className="mb-2">
                Upgrade to Premium
              </Button>
              <p className="text-xs text-muted-foreground">
                Starting at $49/month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}