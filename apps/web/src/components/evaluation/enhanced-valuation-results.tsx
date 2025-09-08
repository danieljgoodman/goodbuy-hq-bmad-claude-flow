'use client'

import { useState } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  Building, 
  BarChart3, 
  Target, 
  Info,
  HelpCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { MultiMethodologyValuation } from '@/lib/services/claude-service'

interface EnhancedValuationResultsProps {
  valuation: MultiMethodologyValuation
  businessName?: string
}

export function EnhancedValuationResults({ valuation, businessName }: EnhancedValuationResultsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="space-y-6">
      {/* Header Card with Weighted Valuation */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Business Valuation Results</CardTitle>
              {businessName && <CardDescription>Complete valuation for {businessName}</CardDescription>}
            </div>
            <Badge variant="outline" className={getConfidenceColor(valuation.weighted.confidence)}>
              {valuation.weighted.confidence}% Confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Weighted Business Value</p>
              <p className="text-4xl font-bold text-primary">
                {formatCurrency(valuation.weighted.value)}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm font-medium">Conservative</p>
                <p className="text-xl font-semibold text-red-600">
                  {formatCurrency(valuation.valuationRange.low)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Most Likely</p>
                <p className="text-xl font-semibold text-green-600">
                  {formatCurrency(valuation.valuationRange.mostLikely)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Optimistic</p>
                <p className="text-xl font-semibold text-blue-600">
                  {formatCurrency(valuation.valuationRange.high)}
                </p>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Methodology Weighting</p>
              <div className="flex justify-center space-x-4 text-sm">
                <span>Asset-Based: {(valuation.weighted.weightings.assetBased * 100)}%</span>
                <span>Income-Based: {(valuation.weighted.weightings.incomeBased * 100)}%</span>
                <span>Market-Based: {(valuation.weighted.weightings.marketBased * 100)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Valuation Methodologies */}
      <div className="grid gap-4">
        {/* Asset-Based Valuation */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Asset-Based Valuation</CardTitle>
                <Badge variant="outline" className={getConfidenceColor(valuation.assetBased.confidence)}>
                  {valuation.assetBased.confidence}% confidence
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('asset')}
                className="p-1"
              >
                {expandedSection === 'asset' ? <ChevronDown /> : <ChevronRight />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(valuation.assetBased.value)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {valuation.assetBased.methodology}
                </p>
              </div>
              <Progress value={valuation.assetBased.confidence} className="w-32" />
            </div>
            
            {expandedSection === 'asset' && (
              <div className="space-y-3 border-t pt-4">
                <div>
                  <h4 className="font-medium mb-2">Key Factors Considered:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {valuation.assetBased.factors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>About Asset-Based Valuation:</strong> This method values the business based on 
                    its net asset value, considering both tangible and intangible assets minus liabilities. 
                    Most suitable for asset-heavy businesses or liquidation scenarios.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income-Based Valuation */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Income-Based Valuation</CardTitle>
                <Badge variant="outline" className={getConfidenceColor(valuation.incomeBased.confidence)}>
                  {valuation.incomeBased.confidence}% confidence
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('income')}
                className="p-1"
              >
                {expandedSection === 'income' ? <ChevronDown /> : <ChevronRight />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(valuation.incomeBased.value)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {valuation.incomeBased.methodology} ({valuation.incomeBased.multiple}x multiple)
                </p>
              </div>
              <Progress value={valuation.incomeBased.confidence} className="w-32" />
            </div>
            
            {expandedSection === 'income' && (
              <div className="space-y-3 border-t pt-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="font-medium text-green-800">Earnings Multiple: {valuation.incomeBased.multiple}x</p>
                  <p className="text-sm text-green-700">
                    Applied to normalized earnings based on industry standards and business risk profile.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Key Factors Considered:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {valuation.incomeBased.factors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>About Income-Based Valuation:</strong> This method focuses on the business&apos;s 
                    earning capacity, using multiples of profit or cash flow. Most suitable for 
                    profitable businesses with predictable income streams.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market-Based Valuation */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Market-Based Valuation</CardTitle>
                <Badge variant="outline" className={getConfidenceColor(valuation.marketBased.confidence)}>
                  {valuation.marketBased.confidence}% confidence
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('market')}
                className="p-1"
              >
                {expandedSection === 'market' ? <ChevronDown /> : <ChevronRight />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(valuation.marketBased.value)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {valuation.marketBased.methodology}
                </p>
              </div>
              <Progress value={valuation.marketBased.confidence} className="w-32" />
            </div>
            
            {expandedSection === 'market' && (
              <div className="space-y-3 border-t pt-4">
                <div>
                  <h4 className="font-medium mb-2">Market Comparables:</h4>
                  {valuation.marketBased.comparables.length > 0 ? (
                    <div className="space-y-2">
                      {valuation.marketBased.comparables.map((comp, index) => (
                        <div key={index} className="bg-purple-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{comp.companyName}</p>
                              <p className="text-sm text-muted-foreground">{comp.industry}</p>
                            </div>
                            <Badge variant="outline">
                              {comp.relevanceScore}% match
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                            <div>Revenue: {formatCurrency(comp.revenue)}</div>
                            <div>Valuation: {formatCurrency(comp.valuation)}</div>
                            <div>Multiple: {comp.multiple.toFixed(1)}x</div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Source: {comp.source}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Limited comparable data available</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Key Factors Considered:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {valuation.marketBased.factors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>About Market-Based Valuation:</strong> This method uses recent sales of 
                    comparable businesses to determine value. Most reliable when sufficient 
                    comparable transactions are available.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Industry Adjustments */}
      {valuation.industryAdjustments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Industry-Specific Adjustments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {valuation.industryAdjustments.map((adjustment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{adjustment.factor}</p>
                    <p className="text-sm text-muted-foreground">{adjustment.reasoning}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${adjustment.adjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {adjustment.adjustment >= 0 ? '+' : ''}{(adjustment.adjustment * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">{adjustment.confidence}% confidence</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Methodology Explanation */}
      <Alert>
        <HelpCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Understanding Your Valuation:</strong> This analysis uses multiple professional 
          valuation methodologies to provide a comprehensive assessment. The weighted value combines 
          all methods based on their relevance to your business type and available data quality. 
          The valuation range provides conservative, most likely, and optimistic scenarios to help 
          you understand the potential value spectrum.
        </AlertDescription>
      </Alert>
    </div>
  )
}