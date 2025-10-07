'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Activity } from 'lucide-react';
import type { RiskMetric, ScenarioResult, EnterpriseMetrics } from '@/types/enterprise-dashboard';

interface RiskTabProps {
  riskMetrics: RiskMetric[];
  scenarios: ScenarioResult[];
  metrics: EnterpriseMetrics | null;
  isLoading?: boolean;
}

export const RiskTab: React.FC<RiskTabProps> = ({
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
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-slide-up space-y-6">
      {/* Overall Risk Score - Hero Card */}
      <Card className="enterprise-card border-2 border-[var(--warning)]">
        <CardContent className="py-6">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-3 text-[var(--warning)]" />
            <div className="text-sm text-[var(--muted-foreground)] mb-2">Overall Risk Score</div>
            <div className="text-5xl font-bold text-[var(--foreground)] mb-2">
              {metrics ? metrics.riskAssessmentScore : 68}/100
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              Moderate Risk Level
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Risk Metrics Dashboard - Grid of 6 risk categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {riskMetrics.map((risk, index) => {
          const percentage = (risk.currentLevel / risk.threshold) * 100;
          const statusColor =
            percentage > 90 ? 'var(--status-critical)' :
            percentage > 75 ? 'var(--status-caution)' :
            percentage > 50 ? 'var(--status-moderate)' :
            'var(--status-good)';
          const variant =
            percentage > 90 ? 'destructive' :
            percentage > 75 ? 'secondary' :
            'default';

          return (
            <Card key={index} className="enterprise-card">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm capitalize text-[var(--foreground)]">
                    {risk.type} Risk
                  </span>
                  <Badge variant={variant}>
                    {risk.trend}
                  </Badge>
                </div>

                {/* Circular gauge visualization */}
                <div className="flex items-center justify-center mb-3">
                  <div className="relative w-24 h-24">
                    <svg className="transform -rotate-90 w-24 h-24">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="var(--border)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke={statusColor}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${percentage * 2.51}, 251`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold" style={{ color: statusColor }}>
                        {risk.currentLevel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-2">
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Threshold: {risk.threshold}
                  </div>
                </div>

                <div className="text-xs text-[var(--muted-foreground)] text-center">
                  {risk.mitigation}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Scenario Analysis - Expandable Section */}
      <Card className="enterprise-card">
        <CardHeader className="enterprise-card-header">
          <CardTitle className="enterprise-card-title">
            <Activity className="w-5 h-5" />
            Scenario Stress Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scenarios.map((scenario, index) => (
              <div key={index} className="border-l-4 border-[var(--info)] pl-4 py-2">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-[var(--foreground)]">{scenario.scenario}</h4>
                  <Badge variant="outline">
                    {(scenario.probability * 100).toFixed(0)}% probability
                  </Badge>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mb-2">{scenario.description}</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-[var(--muted-foreground)]">Expected:</span>
                    <span className={`ml-2 font-medium ${scenario.expectedReturn > 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                      {formatPercentage(scenario.expectedReturn * 100)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Best:</span>
                    <span className="ml-2 font-medium text-[var(--success)]">
                      {formatPercentage(scenario.bestCase * 100)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Worst:</span>
                    <span className="ml-2 font-medium text-[var(--error)]">
                      {formatPercentage(scenario.worstCase * 100)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
