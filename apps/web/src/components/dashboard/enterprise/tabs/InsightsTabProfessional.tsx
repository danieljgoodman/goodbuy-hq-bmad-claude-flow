'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { StrategicInsight } from '@/types/enterprise-dashboard';

interface InsightsTabProps {
  insights: StrategicInsight[];
  isLoading?: boolean;
}

export const InsightsTabProfessional: React.FC<InsightsTabProps> = ({
  insights,
  isLoading = false
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getActionPlanSteps = (insightId: string) => {
    const plans: Record<string, string[]> = {
      '1': [
        'Review current large-cap allocations and identify underweight positions',
        'Analyze AI sector holdings for growth potential',
        'Generate rebalancing trade list with target allocations',
        'Review tax implications of selling/buying positions',
        'Execute trades in phases to minimize market impact'
      ],
      '2': [
        'Document all tech holdings and calculate exact exposure (currently 42%)',
        'Identify healthcare and industrial sectors for diversification',
        'Research 3-5 quality non-tech stocks for investment',
        'Create phased selling plan for over-concentrated tech positions',
        'Monitor sector rotation trends and adjust timing'
      ],
      '3': [
        'Research current private credit market conditions',
        'Identify qualified private credit fund managers',
        'Review historical performance and track records',
        'Assess liquidity terms and lock-up periods',
        'Determine optimal allocation (3-5% of portfolio)'
      ],
      '4': [
        'Generate tax-loss harvesting report for all positions',
        'Identify $127,000 in commodity position losses',
        'Find substantially identical replacement securities',
        'Execute wash-sale compliant trades',
        'Document tax benefits for year-end reporting'
      ]
    };
    return plans[insightId] || ['No action plan available'];
  };

  if (isLoading) {
    return (
      <div className="section-spacing">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full mb-4" />
        ))}
      </div>
    );
  }

  return (
    <div className="enterprise-fade-in">
      {/* Total Value - Hero Metric */}
      <div className="hero-metric-card">
        <div className="metric-label">Total Opportunity Value</div>
        <div className="metric-primary">
          {formatCurrency(insights.reduce((sum, i) => sum + i.estimatedValue, 0))}
        </div>
        <div className="metric-context">
          {insights.length} strategic insights · {insights.filter(i => i.actionRequired).length} action required · {((insights.reduce((sum, i) => sum + i.estimatedValue, 0) / 13900000) * 100).toFixed(1)}% potential increase
        </div>
      </div>

      {/* Insights List - Professional Minimal */}
      <div className="section-spacing">
        <h2 className="text-lg font-semibold mb-4">Strategic Insights</h2>
        <div className="space-y-0">
          {insights.map((insight, index) => {
            const isExpanded = expandedId === insight.id;

            return (
              <div key={insight.id} className="border-b border-[var(--border)]">
                <div
                  className="metric-row cursor-pointer hover:bg-accent/50 px-3 -mx-3 rounded transition-colors py-4"
                  onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-xs font-mono text-muted-foreground w-6">
                      #{insight.priority}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium">{insight.title}</span>
                        <span className={`text-xs uppercase tracking-wide ${
                          insight.impact === 'high' ? 'text-error' :
                          insight.impact === 'medium' ? 'text-warning' : 'text-info'
                        }`}>
                          {insight.impact}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                          {insight.category}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {insight.description}
                      </div>
                      {insight.actionRequired && (
                        <div className="text-xs text-warning font-medium mt-2">
                          ⚠ Action required
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-success font-mono">
                      {formatCurrency(insight.estimatedValue)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {insight.timeline}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {insight.confidence}% confidence
                    </div>
                  </div>
                </div>

                {/* Expanded Action Plan */}
                {isExpanded && (
                  <div className="px-3 pb-4">
                    <div className="bg-accent/30 rounded p-4 mt-2">
                      <div className="text-sm font-semibold mb-3">Action Plan</div>
                      <ol className="text-sm text-muted-foreground space-y-2 ml-4">
                        {getActionPlanSteps(insight.id).map((step, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {idx + 1}. {step}
                          </li>
                        ))}
                      </ol>
                      <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--border)]">
                        <Button variant="ghost" size="sm" className="btn-minimal">
                          Export Plan
                        </Button>
                        <Button variant="ghost" size="sm" className="btn-minimal">
                          Schedule Review
                        </Button>
                        <Button variant="ghost" size="sm" className="btn-minimal">
                          Mark Complete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights Summary - Minimal Stats */}
      <div className="section-spacing">
        <h2 className="text-lg font-semibold mb-4">Insights Summary</h2>
        <div className="grid-layout-3">
          <div className="metric-row flex-col items-start">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              High Impact
            </div>
            <div className="text-2xl font-light mb-1">
              {insights.filter(i => i.impact === 'high').length}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(insights.filter(i => i.impact === 'high').reduce((sum, i) => sum + i.estimatedValue, 0))}
            </div>
          </div>

          <div className="metric-row flex-col items-start">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Opportunities
            </div>
            <div className="text-2xl font-light mb-1">
              {insights.filter(i => i.category === 'opportunity').length}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(insights.filter(i => i.category === 'opportunity').reduce((sum, i) => sum + i.estimatedValue, 0))}
            </div>
          </div>

          <div className="metric-row flex-col items-start">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Action Required
            </div>
            <div className="text-2xl font-light mb-1">
              {insights.filter(i => i.actionRequired).length}
            </div>
            <div className="text-xs text-muted-foreground">
              pending review
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
