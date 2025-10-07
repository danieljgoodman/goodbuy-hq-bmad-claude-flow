'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  PieChart,
  AlertTriangle,
  Target,
  Crown,
  Users,
  CheckCircle
} from 'lucide-react';
import type {
  EnterpriseMetrics,
  StrategicInsight,
  PortfolioAllocation,
  RiskMetric
} from '@/types/enterprise-dashboard';

interface OverviewTabProps {
  metrics: EnterpriseMetrics | null;
  insights: StrategicInsight[];
  portfolioData: PortfolioAllocation[];
  riskMetrics: RiskMetric[];
  hasProfessionalAccess: boolean;
  isLoading?: boolean;
  onTabChange: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  metrics,
  insights,
  portfolioData,
  riskMetrics,
  hasProfessionalAccess,
  isLoading = false,
  onTabChange
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-slide-up">
      {/* Hero Metric Section */}
      <Card className="enterprise-card mb-6 border-2 border-[var(--primary)]">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="text-sm text-[var(--muted-foreground)] mb-2">Total Portfolio Value</div>
            {metrics && (
              <>
                <div className="text-5xl font-bold text-[var(--foreground)] mb-2">
                  {formatCurrency(metrics.totalInvestmentValue)}
                </div>
                <div className="flex items-center justify-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                  <span className="font-semibold text-[var(--success)]">
                    {formatPercentage(metrics.portfolioGrowthRate)}
                  </span>
                  <span className="text-[var(--muted-foreground)] text-sm">YTD</span>
                </div>
                <div className="mt-4 flex justify-center">
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Risk-Adjusted Return: {formatPercentage(metrics.expectedAnnualReturn)} |
                    Diversification: {metrics.diversificationIndex}/10
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Strategic Insights Spotlight */}
      {insights.length > 0 && (
        <Card className="enterprise-card mb-6">
          <CardHeader className="enterprise-card-header pb-3">
            <CardTitle className="enterprise-card-title text-lg">
              <Target className="w-5 h-5" />
              Priority Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--accent)] transition-colors cursor-pointer"
                  onClick={() => onTabChange('insights')}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-2 h-2 rounded-full ${
                      insight.impact === 'high' ? 'bg-[var(--error)]' :
                      insight.impact === 'medium' ? 'bg-[var(--warning)]' :
                      'bg-[var(--info)]'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-[var(--foreground)]">{insight.title}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{insight.timeline}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[var(--success)] text-sm">
                      {formatCurrency(insight.estimatedValue)}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">{insight.confidence}% confidence</div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => onTabChange('insights')}
              >
                View All {insights.length} Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Portfolio Summary */}
      <div className="enterprise-grid enterprise-grid-2">
        <Card className="enterprise-card">
          <CardHeader className="enterprise-card-header">
            <CardTitle className="enterprise-card-title">
              <PieChart className="w-5 h-5" />
              Asset Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolioData.slice(0, 3).map((allocation, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{allocation.assetClass}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{allocation.currentAllocation}%</span>
                    <Badge variant={
                      allocation.variance > 0 ? 'secondary' :
                      allocation.variance < 0 ? 'default' : 'outline'
                    }>
                      {allocation.variance !== 0 ? `${allocation.variance > 0 ? '+' : ''}${allocation.variance}%` : 'On Target'}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button
                variant="secondary"
                className="w-full mt-4"
                onClick={() => onTabChange('portfolio')}
              >
                View Full Analysis
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="enterprise-card">
          <CardHeader className="enterprise-card-header">
            <CardTitle className="enterprise-card-title">
              <AlertTriangle className="w-5 h-5" />
              Key Risk Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskMetrics.slice(0, 3).map((risk, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium capitalize">{risk.type} Risk</span>
                    <span className="text-sm">{risk.currentLevel}/{risk.threshold}</span>
                  </div>
                  <div className="enterprise-progress">
                    <div
                      className={`enterprise-progress-bar ${
                        risk.currentLevel / risk.threshold > 0.8 ? 'danger' :
                        risk.currentLevel / risk.threshold > 0.6 ? 'warning' : 'success'
                      }`}
                      style={{ width: `${(risk.currentLevel / risk.threshold) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="secondary"
                className="w-full mt-4"
                onClick={() => onTabChange('risk')}
              >
                Risk Management Tools
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Professional Features Quick Access */}
      {hasProfessionalAccess && (
        <Card className="enterprise-card mt-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[var(--warning)]" />
                <span className="font-semibold text-[var(--foreground)]">Professional Features Included</span>
              </div>
              <Button
                variant="link"
                className="text-[var(--primary)]"
                onClick={() => onTabChange('professional')}
              >
                View All →
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="p-4 h-auto flex-col items-start text-left"
                onClick={() => onTabChange('professional')}
              >
                <TrendingUp className="w-5 h-5 text-[var(--warning)] mb-2" />
                <div className="font-medium text-sm text-[var(--foreground)]">Financial Trends</div>
                <div className="text-xs text-[var(--muted-foreground)]">Multi-year analysis</div>
              </Button>
              <Button
                variant="outline"
                className="p-4 h-auto flex-col items-start text-left"
                onClick={() => onTabChange('professional')}
              >
                <Users className="w-5 h-5 text-[var(--warning)] mb-2" />
                <div className="font-medium text-sm text-[var(--foreground)]">Customer Risk</div>
                <div className="text-xs text-[var(--muted-foreground)]">Concentration analysis</div>
              </Button>
              <Button
                variant="outline"
                className="p-4 h-auto flex-col items-start text-left"
                onClick={() => onTabChange('professional')}
              >
                <Target className="w-5 h-5 text-[var(--warning)] mb-2" />
                <div className="font-medium text-sm text-[var(--foreground)]">Competitive Position</div>
                <div className="text-xs text-[var(--muted-foreground)]">Market analysis</div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
