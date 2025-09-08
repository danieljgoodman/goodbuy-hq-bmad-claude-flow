'use client';

import { BusinessEvaluation } from '@/types/valuation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface ConfidenceScoringProps {
  evaluation: BusinessEvaluation;
}

export function ConfidenceScoring({ evaluation }: ConfidenceScoringProps) {
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return { label: 'High', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (confidence >= 0.6) return { label: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { label: 'Low', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getRiskIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getRiskBadgeVariant = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const overallLevel = getConfidenceLevel(evaluation.confidenceFactors.overall);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Confidence & Risk Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Confidence Score */}
        <div className={`rounded-lg p-4 ${overallLevel.bgColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Overall Confidence</h3>
              <p className="text-sm text-muted-foreground">
                Based on data quality, industry reliability, and business stability
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${overallLevel.color}`}>
                {formatPercentage(evaluation.confidenceFactors.overall)}
              </div>
              <Badge className={overallLevel.bgColor + ' ' + overallLevel.color}>
                {overallLevel.label} Confidence
              </Badge>
            </div>
          </div>
        </div>

        {/* Confidence Factor Breakdown */}
        <div className="space-y-4">
          <h3 className="font-semibold">Confidence Factors</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Data Quality</span>
              <span className="text-sm">{formatPercentage(evaluation.confidenceFactors.dataQuality)}</span>
            </div>
            <Progress value={evaluation.confidenceFactors.dataQuality * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Completeness and accuracy of financial and business data provided
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Industry Reliability</span>
              <span className="text-sm">{formatPercentage(evaluation.confidenceFactors.industryReliability)}</span>
            </div>
            <Progress value={evaluation.confidenceFactors.industryReliability * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Availability and reliability of {evaluation.businessData.industry} industry benchmarks
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Business Stability</span>
              <span className="text-sm">{formatPercentage(evaluation.confidenceFactors.businessStability)}</span>
            </div>
            <Progress value={evaluation.confidenceFactors.businessStability * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Business age, profitability, and operational consistency factors
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Market Conditions</span>
              <span className="text-sm">{formatPercentage(evaluation.confidenceFactors.marketConditions)}</span>
            </div>
            <Progress value={evaluation.confidenceFactors.marketConditions * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Current market environment and economic conditions impact
            </p>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="space-y-4">
          <h3 className="font-semibold">Identified Risk Factors</h3>
          
          {evaluation.riskFactors.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No significant risk factors identified. This contributes to higher confidence in the valuation.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {evaluation.riskFactors.map((risk, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getRiskIcon(risk.impact)}
                      <span className="font-medium">{risk.factor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRiskBadgeVariant(risk.impact)}>
                        {risk.impact.toUpperCase()} RISK
                      </Badge>
                      <Badge variant="outline">
                        {formatPercentage(risk.likelihood)} Likelihood
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {risk.description}
                  </p>
                  
                  <Badge variant="secondary" className="text-xs mb-2">
                    {risk.category.charAt(0).toUpperCase() + risk.category.slice(1)} Risk
                  </Badge>
                  
                  {risk.mitigation.length > 0 && (
                    <div className="mt-2">
                      <h5 className="text-xs font-medium mb-1">Potential Mitigation Strategies:</h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {risk.mitigation.map((strategy, strategyIndex) => (
                          <li key={strategyIndex} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confidence Recommendations */}
        <div className="space-y-4">
          <h3 className="font-semibold">Recommendations for Improving Confidence</h3>
          
          <div className="space-y-2">
            {evaluation.confidenceFactors.dataQuality < 0.7 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Consider providing more detailed financial statements and operational metrics to improve data quality confidence.
                </AlertDescription>
              </Alert>
            )}
            
            {evaluation.confidenceFactors.businessStability < 0.6 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Business stability concerns detected. Focus on consistent profitability and operational improvements.
                </AlertDescription>
              </Alert>
            )}
            
            {evaluation.riskFactors.filter(r => r.impact === 'high').length > 0 && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  High-risk factors identified. Address these issues to improve business value and reduce valuation uncertainty.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Methodology Confidence Comparison */}
        <div className="space-y-4">
          <h3 className="font-semibold">Methodology Confidence Levels</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="text-sm font-medium">Asset-Based</div>
              <div className="text-lg font-bold text-primary">
                {formatPercentage(evaluation.valuations.assetBased.confidence)}
              </div>
              <Progress 
                value={evaluation.valuations.assetBased.confidence * 100} 
                className="h-2"
              />
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-sm font-medium">Income-Based</div>
              <div className="text-lg font-bold text-primary">
                {formatPercentage(evaluation.valuations.incomeBased.confidence)}
              </div>
              <Progress 
                value={evaluation.valuations.incomeBased.confidence * 100} 
                className="h-2"
              />
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-sm font-medium">Market-Based</div>
              <div className="text-lg font-bold text-primary">
                {formatPercentage(evaluation.valuations.marketBased.confidence)}
              </div>
              <Progress 
                value={evaluation.valuations.marketBased.confidence * 100} 
                className="h-2"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}