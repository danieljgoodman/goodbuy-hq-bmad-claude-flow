'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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

export const OverviewTabProfessional: React.FC<OverviewTabProps> = ({
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
      <div className="section-spacing">
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-48 w-full mb-6" />
        <div className="grid-layout-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-fade-in">
      {/* Hero Metric - Data First, Bloomberg Style */}
      <div className="hero-metric-card">
        <div className="metric-label">Total Portfolio Value</div>
        {metrics && (
          <>
            <div className="metric-primary">
              {formatCurrency(metrics.totalInvestmentValue)}
              <span className="metric-change positive">
                {formatPercentage(metrics.portfolioGrowthRate)}
              </span>
            </div>
            <div className="metric-context">
              Year-to-date performance · Risk-adjusted return {formatPercentage(metrics.expectedAnnualReturn)} · Diversification {metrics.diversificationIndex}/10
            </div>
          </>
        )}
      </div>

      {/* Priority Actions - Minimal List */}
      {insights.length > 0 && (
        <div className="section-spacing">
          <h2 className="text-lg font-semibold mb-4">Priority Actions</h2>
          <div className="space-y-0">
            {insights.slice(0, 3).map((insight, index) => (
              <div
                key={insight.id}
                className="metric-row cursor-pointer hover:bg-accent/50 px-3 -mx-3 rounded transition-colors"
                onClick={() => onTabChange('insights')}
              >
                <div className="flex items-start gap-4 flex-1">
                  <span className="text-xs font-mono text-muted-foreground w-6">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{insight.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {insight.timeline} · {insight.confidence}% confidence
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-success font-mono">
                    {formatCurrency(insight.estimatedValue)}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {insight.impact} impact
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button
              variant="ghost"
              className="btn-minimal w-full"
              onClick={() => onTabChange('insights')}
            >
              View All {insights.length} Insights
            </Button>
          </div>
        </div>
      )}

      {/* Portfolio & Risk - Side by Side Grid */}
      <div className="grid-layout-2">
        {/* Asset Allocation */}
        <div className="section-spacing">
          <h2 className="text-lg font-semibold mb-4">Asset Allocation</h2>
          <table className="professional-table">
            <thead>
              <tr>
                <th>Asset Class</th>
                <th className="text-right">Current</th>
                <th className="text-right">Target</th>
                <th className="text-right">Variance</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.slice(0, 5).map((allocation, index) => (
                <tr key={index}>
                  <td className="font-medium">{allocation.assetClass}</td>
                  <td className="text-right font-mono">{allocation.currentAllocation}%</td>
                  <td className="text-right font-mono text-muted-foreground">
                    {allocation.targetAllocation}%
                  </td>
                  <td className={`text-right font-mono font-semibold ${
                    allocation.variance > 0 ? 'text-success' :
                    allocation.variance < 0 ? 'text-error' :
                    'text-muted-foreground'
                  }`}>
                    {allocation.variance !== 0 ? formatPercentage(allocation.variance) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4">
            <Button
              variant="ghost"
              className="btn-minimal w-full"
              onClick={() => onTabChange('portfolio')}
            >
              Full Analysis
            </Button>
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="section-spacing">
          <h2 className="text-lg font-semibold mb-4">Key Risk Metrics</h2>
          <div className="space-y-4">
            {riskMetrics.slice(0, 4).map((risk, index) => {
              const percentage = (risk.currentLevel / risk.threshold) * 100;
              const status =
                percentage > 90 ? 'critical' :
                percentage > 75 ? 'moderate' : 'good';

              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`status-dot ${status}`}></span>
                      <span className="text-sm font-medium capitalize">{risk.type} Risk</span>
                    </div>
                    <span className="text-sm font-mono">
                      {risk.currentLevel}/{risk.threshold}
                    </span>
                  </div>
                  <div className="progress-container">
                    <div
                      className={`progress-fill ${
                        status === 'critical' ? 'error' :
                        status === 'moderate' ? 'warning' : 'success'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <Button
              variant="ghost"
              className="btn-minimal w-full"
              onClick={() => onTabChange('risk')}
            >
              Risk Management
            </Button>
          </div>
        </div>
      </div>

      {/* Professional Features - Minimal Section */}
      {hasProfessionalAccess && (
        <div className="section-spacing">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Professional Analytics Included</h2>
            <Button
              variant="ghost"
              className="btn-minimal"
              onClick={() => onTabChange('professional')}
            >
              View All →
            </Button>
          </div>
          <div className="grid-layout-3">
            <div
              className="metric-row cursor-pointer hover:bg-accent/50 p-3 -m-3 rounded transition-colors flex-col items-start"
              onClick={() => onTabChange('professional')}
            >
              <div className="font-medium text-sm mb-1">Financial Trends</div>
              <div className="text-xs text-muted-foreground">Multi-year analysis</div>
            </div>
            <div
              className="metric-row cursor-pointer hover:bg-accent/50 p-3 -m-3 rounded transition-colors flex-col items-start"
              onClick={() => onTabChange('professional')}
            >
              <div className="font-medium text-sm mb-1">Customer Concentration</div>
              <div className="text-xs text-muted-foreground">Risk assessment</div>
            </div>
            <div
              className="metric-row cursor-pointer hover:bg-accent/50 p-3 -m-3 rounded transition-colors flex-col items-start"
              onClick={() => onTabChange('professional')}
            >
              <div className="font-medium text-sm mb-1">Market Position</div>
              <div className="text-xs text-muted-foreground">Competitive analysis</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
