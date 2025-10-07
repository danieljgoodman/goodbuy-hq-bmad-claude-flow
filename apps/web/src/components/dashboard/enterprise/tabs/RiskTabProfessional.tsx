'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { RiskMetric, ScenarioResult, EnterpriseMetrics } from '@/types/enterprise-dashboard';

interface RiskTabProps {
  riskMetrics: RiskMetric[];
  scenarios: ScenarioResult[];
  metrics: EnterpriseMetrics | null;
  isLoading?: boolean;
}

export const RiskTabProfessional: React.FC<RiskTabProps> = ({
  riskMetrics,
  scenarios,
  metrics,
  isLoading = false
}) => {
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="section-spacing">
        <Skeleton className="h-32 w-full mb-6" />
        <div className="grid-layout-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-fade-in">
      {/* Overall Risk Score - Hero Metric */}
      <div className="hero-metric-card">
        <div className="metric-label">Overall Risk Assessment</div>
        <div className="metric-primary">
          {metrics ? metrics.riskAssessmentScore : 68}
          <span className="metric-change" style={{ color: 'var(--warning)' }}>
            /100
          </span>
        </div>
        <div className="metric-context">
          Moderate risk level · {riskMetrics.filter(r => (r.currentLevel / r.threshold) > 0.75).length} metrics above threshold
        </div>
      </div>

      {/* Risk Metrics - Professional Grid */}
      <div className="section-spacing">
        <h2 className="text-lg font-semibold mb-4">Risk Metrics</h2>
        <div className="grid-layout-3">
          {riskMetrics.map((risk, index) => {
            const percentage = (risk.currentLevel / risk.threshold) * 100;
            const status =
              percentage > 90 ? 'critical' :
              percentage > 75 ? 'moderate' : 'good';

            return (
              <div key={index}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`status-dot ${status}`}></span>
                    <span className="text-sm font-medium capitalize">{risk.type} Risk</span>
                  </div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {risk.trend}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-2xl font-light">{risk.currentLevel}</span>
                    <span className="text-xs text-muted-foreground">of {risk.threshold}</span>
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

                <div className="text-xs text-muted-foreground">
                  {risk.mitigation}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scenario Analysis - Professional Table */}
      <div className="section-spacing">
        <h2 className="text-lg font-semibold mb-4">Scenario Stress Testing</h2>
        <table className="professional-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th className="text-right">Probability</th>
              <th className="text-right">Expected</th>
              <th className="text-right">Best Case</th>
              <th className="text-right">Worst Case</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario, index) => (
              <tr key={index}>
                <td>
                  <div className="font-medium">{scenario.scenario}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {scenario.description}
                  </div>
                </td>
                <td className="text-right font-mono">
                  {(scenario.probability * 100).toFixed(0)}%
                </td>
                <td className={`text-right font-mono font-semibold ${
                  scenario.expectedReturn > 0 ? 'text-success' : 'text-error'
                }`}>
                  {formatPercentage(scenario.expectedReturn * 100)}
                </td>
                <td className="text-right font-mono text-success">
                  {formatPercentage(scenario.bestCase * 100)}
                </td>
                <td className="text-right font-mono text-error">
                  {formatPercentage(scenario.worstCase * 100)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Risk Summary - Minimal Stats */}
      <div className="section-spacing">
        <h2 className="text-lg font-semibold mb-4">Risk Summary</h2>
        <div className="grid-layout-3">
          <div className="metric-row flex-col items-start">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Metrics at Risk
            </div>
            <div className="text-2xl font-light mb-1">
              {riskMetrics.filter(r => (r.currentLevel / r.threshold) > 0.75).length}
            </div>
            <div className="text-xs text-muted-foreground">
              of {riskMetrics.length} total metrics
            </div>
          </div>

          <div className="metric-row flex-col items-start">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Average Probability
            </div>
            <div className="text-2xl font-light mb-1">
              {(scenarios.reduce((sum, s) => sum + s.probability, 0) / scenarios.length * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">
              across {scenarios.length} scenarios
            </div>
          </div>

          <div className="metric-row flex-col items-start">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Trending
            </div>
            <div className="text-2xl font-light mb-1">
              {riskMetrics.filter(r => r.trend === 'increasing').length}
            </div>
            <div className="text-xs text-muted-foreground">
              metrics increasing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
