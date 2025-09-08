'use client';

import { BusinessEvaluation } from '@/types/valuation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { MethodologyBreakdown } from './methodology-breakdown';
import { ConfidenceScoring } from './confidence-scoring';
import { IndustryBenchmarks } from './industry-benchmarks';
import { ValuationExport } from './valuation-export';
import { DollarSign, TrendingUp, Shield, Clock } from 'lucide-react';

interface MultiMethodologyResultsProps {
  evaluation: BusinessEvaluation;
}

export function MultiMethodologyResults({ evaluation }: MultiMethodologyResultsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Executive Summary */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold text-primary">
              Business Valuation Report
            </CardTitle>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {evaluation.status === 'completed' ? 'Completed' : evaluation.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Valuation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <DollarSign className="h-8 w-8 mx-auto text-primary" />
              <div className="text-sm text-muted-foreground">Final Valuation</div>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(evaluation.valuations.weighted.value)}
              </div>
              <div className="text-xs text-muted-foreground">
                Range: {formatCurrency(evaluation.valuations.weighted.range.min)} - {formatCurrency(evaluation.valuations.weighted.range.max)}
              </div>
            </div>

            <div className="text-center space-y-2">
              <Shield className="h-8 w-8 mx-auto text-green-600" />
              <div className="text-sm text-muted-foreground">Overall Confidence</div>
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(evaluation.valuations.weighted.confidence)}
              </div>
              <Badge variant={evaluation.valuations.weighted.confidence >= 0.8 ? 'default' : 'secondary'}>
                {getConfidenceLabel(evaluation.valuations.weighted.confidence)}
              </Badge>
            </div>

            <div className="text-center space-y-2">
              <TrendingUp className="h-8 w-8 mx-auto text-blue-600" />
              <div className="text-sm text-muted-foreground">Processing Time</div>
              <div className="text-2xl font-bold text-blue-600">
                {(evaluation.processingTime / 1000).toFixed(2)}s
              </div>
              <div className="text-xs text-muted-foreground">Sub-3 second target</div>
            </div>

            <div className="text-center space-y-2">
              <Clock className="h-8 w-8 mx-auto text-purple-600" />
              <div className="text-sm text-muted-foreground">Valuation Date</div>
              <div className="text-lg font-semibold text-purple-600">
                {evaluation.createdAt.toLocaleDateString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {evaluation.createdAt.toLocaleTimeString()}
              </div>
            </div>
          </div>

          <Separator />

          {/* Methodology Weights */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Methodology Weighting</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Asset-Based</span>
                  <span className="font-medium">
                    {formatPercentage(evaluation.valuations.weighted.weights.asset)}
                  </span>
                </div>
                <Progress 
                  value={evaluation.valuations.weighted.weights.asset * 100} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  Value: {formatCurrency(evaluation.valuations.assetBased.value)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Income-Based (DCF)</span>
                  <span className="font-medium">
                    {formatPercentage(evaluation.valuations.weighted.weights.income)}
                  </span>
                </div>
                <Progress 
                  value={evaluation.valuations.weighted.weights.income * 100} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  Value: {formatCurrency(evaluation.valuations.incomeBased.value)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Market-Based</span>
                  <span className="font-medium">
                    {formatPercentage(evaluation.valuations.weighted.weights.market)}
                  </span>
                </div>
                <Progress 
                  value={evaluation.valuations.weighted.weights.market * 100} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  Value: {formatCurrency(evaluation.valuations.marketBased.value)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Methodology Breakdown */}
        <MethodologyBreakdown evaluation={evaluation} />

        {/* Confidence Analysis */}
        <ConfidenceScoring evaluation={evaluation} />
      </div>

      {/* Industry Benchmarks */}
      <IndustryBenchmarks evaluation={evaluation} />

      {/* Export Options */}
      <ValuationExport evaluation={evaluation} />
    </div>
  );
}