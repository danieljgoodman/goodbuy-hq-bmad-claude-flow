'use client';

import { BusinessEvaluation } from '@/types/valuation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Building, TrendingUp, BarChart3, Info } from 'lucide-react';

interface MethodologyBreakdownProps {
  evaluation: BusinessEvaluation;
}

export function MethodologyBreakdown({ evaluation }: MethodologyBreakdownProps) {
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

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (confidence >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Methodology Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="asset" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="asset" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Asset-Based
            </TabsTrigger>
            <TabsTrigger value="income" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Income-Based
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Market-Based
            </TabsTrigger>
          </TabsList>

          <TabsContent value="asset" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Asset-Based Valuation</h3>
              {getConfidenceBadge(evaluation.valuations.assetBased.confidence)}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(evaluation.valuations.assetBased.value)}
                </span>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Confidence</div>
                  <div className="text-sm font-medium">
                    {formatPercentage(evaluation.valuations.assetBased.confidence)}
                  </div>
                </div>
              </div>

              <Progress 
                value={evaluation.valuations.assetBased.confidence * 100} 
                className="h-2"
              />

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Methodology</h4>
                <p className="text-sm text-muted-foreground">
                  {evaluation.valuations.assetBased.methodology}
                </p>
              </div>

              {evaluation.valuations.assetBased.assumptions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Key Assumptions</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {evaluation.valuations.assetBased.assumptions.map((assumption, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Info className="h-3 w-3 mt-1 flex-shrink-0" />
                        {assumption}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.valuations.assetBased.adjustments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Industry Adjustments</h4>
                  <div className="space-y-2">
                    {evaluation.valuations.assetBased.adjustments.map((adjustment, index) => (
                      <div key={index} className="text-sm border rounded p-2">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{adjustment.reason}</span>
                          <Badge variant={adjustment.adjustmentType === 'premium' ? 'default' : 'secondary'}>
                            {adjustment.adjustmentType === 'premium' ? '+' : '-'}{((adjustment.factor - 1) * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Source: {adjustment.source} (Confidence: {formatPercentage(adjustment.confidence)})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="income" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Income-Based Valuation (DCF)</h3>
              {getConfidenceBadge(evaluation.valuations.incomeBased.confidence)}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(evaluation.valuations.incomeBased.value)}
                </span>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Confidence</div>
                  <div className="text-sm font-medium">
                    {formatPercentage(evaluation.valuations.incomeBased.confidence)}
                  </div>
                </div>
              </div>

              <Progress 
                value={evaluation.valuations.incomeBased.confidence * 100} 
                className="h-2"
              />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Discount Rate</span>
                  <div className="font-medium">{formatPercentage(evaluation.valuations.incomeBased.discountRate)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Terminal Value</span>
                  <div className="font-medium">{formatCurrency(evaluation.valuations.incomeBased.terminalValue)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Growth Assumptions</h4>
                <div className="grid grid-cols-5 gap-2">
                  {evaluation.valuations.incomeBased.growthAssumptions.map((growth, index) => (
                    <div key={index} className="text-center text-sm border rounded p-2">
                      <div className="text-xs text-muted-foreground">Year {index + 1}</div>
                      <div className="font-medium">{formatPercentage(growth)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Methodology</h4>
                <p className="text-sm text-muted-foreground">
                  {evaluation.valuations.incomeBased.methodology}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Market-Based Valuation</h3>
              {getConfidenceBadge(evaluation.valuations.marketBased.confidence)}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(evaluation.valuations.marketBased.value)}
                </span>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Confidence</div>
                  <div className="text-sm font-medium">
                    {formatPercentage(evaluation.valuations.marketBased.confidence)}
                  </div>
                </div>
              </div>

              <Progress 
                value={evaluation.valuations.marketBased.confidence * 100} 
                className="h-2"
              />

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Valuation Multiples</h4>
                <div className="grid grid-cols-2 gap-4">
                  {evaluation.valuations.marketBased.multiples.map((multiple, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{multiple.type}</span>
                        <Badge variant="outline">{formatPercentage(multiple.confidence)}</Badge>
                      </div>
                      <div className="text-lg font-bold">{multiple.value.toFixed(1)}x</div>
                      <div className="text-xs text-muted-foreground">
                        Industry Avg: {multiple.industryAverage.toFixed(1)}x
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Comparable Companies</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {evaluation.valuations.marketBased.comparableCompanies.map((company, index) => (
                    <div key={index} className="text-sm border rounded p-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Revenue: {formatCurrency(company.revenue)} | 
                            Multiple: {company.multiple.toFixed(1)}x
                          </div>
                        </div>
                        <Badge variant="outline">
                          {formatPercentage(company.similarityScore)} Similar
                        </Badge>
                      </div>
                      {company.adjustments.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Adjustments: {company.adjustments.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Methodology</h4>
                <p className="text-sm text-muted-foreground">
                  {evaluation.valuations.marketBased.methodology}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}