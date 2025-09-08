'use client';

import { BusinessEvaluation } from '@/types/valuation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Target } from 'lucide-react';

interface IndustryBenchmarksProps {
  evaluation: BusinessEvaluation;
}

export function IndustryBenchmarks({ evaluation }: IndustryBenchmarksProps) {
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

  const calculateRevenueMultiple = () => {
    return evaluation.valuations.weighted.value / evaluation.businessData.annualRevenue;
  };

  const getIndustryBenchmarks = () => {
    const industry = evaluation.businessData.industry.toLowerCase();
    
    // Industry benchmark data (in real app, this would come from a service)
    const benchmarks = {
      technology: {
        revenueMultiple: { min: 2.0, median: 4.5, max: 12.0 },
        ebitdaMultiple: { min: 8.0, median: 15.0, max: 25.0 },
        growthRate: { min: 0.15, median: 0.30, max: 0.60 },
        marginProfile: { min: 0.15, median: 0.25, max: 0.40 },
      },
      healthcare: {
        revenueMultiple: { min: 1.5, median: 3.0, max: 8.0 },
        ebitdaMultiple: { min: 6.0, median: 12.0, max: 20.0 },
        growthRate: { min: 0.08, median: 0.15, max: 0.25 },
        marginProfile: { min: 0.12, median: 0.20, max: 0.30 },
      },
      manufacturing: {
        revenueMultiple: { min: 0.8, median: 1.5, max: 3.0 },
        ebitdaMultiple: { min: 4.0, median: 8.0, max: 15.0 },
        growthRate: { min: 0.03, median: 0.08, max: 0.15 },
        marginProfile: { min: 0.08, median: 0.15, max: 0.25 },
      },
      retail: {
        revenueMultiple: { min: 0.5, median: 1.2, max: 2.5 },
        ebitdaMultiple: { min: 3.0, median: 6.0, max: 12.0 },
        growthRate: { min: 0.02, median: 0.06, max: 0.12 },
        marginProfile: { min: 0.05, median: 0.10, max: 0.18 },
      },
      services: {
        revenueMultiple: { min: 1.0, median: 2.0, max: 4.0 },
        ebitdaMultiple: { min: 4.0, median: 8.0, max: 15.0 },
        growthRate: { min: 0.05, median: 0.12, max: 0.20 },
        marginProfile: { min: 0.10, median: 0.18, max: 0.30 },
      },
    };
    
    return benchmarks[industry as keyof typeof benchmarks] || benchmarks.services;
  };

  const benchmarks = getIndustryBenchmarks();
  const currentRevenueMultiple = calculateRevenueMultiple();
  const currentMargin = evaluation.businessData.cashFlow / evaluation.businessData.annualRevenue;

  const getPerformanceIndicator = (current: number, benchmark: { min: number; median: number; max: number }) => {
    if (current >= benchmark.median) return { label: 'Above Average', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (current >= benchmark.min) return { label: 'Below Average', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { label: 'Below Industry', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getPercentilePosition = (current: number, benchmark: { min: number; median: number; max: number }) => {
    if (current <= benchmark.min) return 10;
    if (current >= benchmark.max) return 90;
    if (current <= benchmark.median) {
      return 10 + ((current - benchmark.min) / (benchmark.median - benchmark.min)) * 40;
    } else {
      return 50 + ((current - benchmark.median) / (benchmark.max - benchmark.median)) * 40;
    }
  };

  const multipleIndicator = getPerformanceIndicator(currentRevenueMultiple, benchmarks.revenueMultiple);
  const growthIndicator = getPerformanceIndicator(evaluation.businessData.growthRate, benchmarks.growthRate);
  const marginIndicator = getPerformanceIndicator(currentMargin, benchmarks.marginProfile);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Industry Benchmarks - {evaluation.businessData.industry}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Multiple */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Revenue Multiple</h3>
              <Badge className={multipleIndicator.bgColor + ' ' + multipleIndicator.color}>
                {multipleIndicator.label}
              </Badge>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">
                {currentRevenueMultiple.toFixed(1)}x
              </div>
              <div className="text-sm text-muted-foreground">
                Industry Median: {benchmarks.revenueMultiple.median.toFixed(1)}x
              </div>
            </div>
            
            <div className="relative">
              <Progress 
                value={getPercentilePosition(currentRevenueMultiple, benchmarks.revenueMultiple)} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{benchmarks.revenueMultiple.min.toFixed(1)}x</span>
                <span>{benchmarks.revenueMultiple.max.toFixed(1)}x</span>
              </div>
            </div>
          </div>

          {/* Growth Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Growth Rate</h3>
              <Badge className={growthIndicator.bgColor + ' ' + growthIndicator.color}>
                {growthIndicator.label}
              </Badge>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">
                {formatPercentage(evaluation.businessData.growthRate)}
              </div>
              <div className="text-sm text-muted-foreground">
                Industry Median: {formatPercentage(benchmarks.growthRate.median)}
              </div>
            </div>
            
            <div className="relative">
              <Progress 
                value={getPercentilePosition(evaluation.businessData.growthRate, benchmarks.growthRate)} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatPercentage(benchmarks.growthRate.min)}</span>
                <span>{formatPercentage(benchmarks.growthRate.max)}</span>
              </div>
            </div>
          </div>

          {/* Profit Margin */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Cash Flow Margin</h3>
              <Badge className={marginIndicator.bgColor + ' ' + marginIndicator.color}>
                {marginIndicator.label}
              </Badge>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">
                {formatPercentage(currentMargin)}
              </div>
              <div className="text-sm text-muted-foreground">
                Industry Median: {formatPercentage(benchmarks.marginProfile.median)}
              </div>
            </div>
            
            <div className="relative">
              <Progress 
                value={getPercentilePosition(currentMargin, benchmarks.marginProfile)} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatPercentage(benchmarks.marginProfile.min)}</span>
                <span>{formatPercentage(benchmarks.marginProfile.max)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Benchmark Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Valuation Multiples */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Valuation Multiple Benchmarks
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>Revenue Multiple Range</span>
                <span>{benchmarks.revenueMultiple.min.toFixed(1)}x - {benchmarks.revenueMultiple.max.toFixed(1)}x</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Your Revenue Multiple</span>
                <span className="font-medium">{currentRevenueMultiple.toFixed(1)}x</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>EBITDA Multiple Range</span>
                <span>{benchmarks.ebitdaMultiple.min.toFixed(1)}x - {benchmarks.ebitdaMultiple.max.toFixed(1)}x</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Est. EBITDA Multiple</span>
                <span className="font-medium">
                  {evaluation.valuations.marketBased.multiples
                    .find(m => m.type === 'ebitda')?.value.toFixed(1) || 'N/A'}x
                </span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance Benchmarks
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>Industry Growth Range</span>
                <span>{formatPercentage(benchmarks.growthRate.min)} - {formatPercentage(benchmarks.growthRate.max)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Your Growth Rate</span>
                <span className="font-medium">{formatPercentage(evaluation.businessData.growthRate)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Industry Margin Range</span>
                <span>{formatPercentage(benchmarks.marginProfile.min)} - {formatPercentage(benchmarks.marginProfile.max)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Your Cash Flow Margin</span>
                <span className="font-medium">{formatPercentage(currentMargin)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Positioning Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Competitive Positioning Summary</h3>
          <p className="text-sm text-muted-foreground">
            Based on the analysis, your business is positioned {' '}
            {currentRevenueMultiple >= benchmarks.revenueMultiple.median ? 'above' : 'below'} the industry median 
            for revenue multiples in the {evaluation.businessData.industry} sector. {' '}
            {evaluation.businessData.growthRate >= benchmarks.growthRate.median 
              ? 'Your growth rate exceeds industry expectations, which positively impacts valuation.' 
              : 'Consider strategies to improve growth rate to achieve higher valuation multiples.'
            } {' '}
            {currentMargin >= benchmarks.marginProfile.median
              ? 'Your profitability margins are competitive within the industry.'
              : 'Improving operational efficiency and margins could enhance business value.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}