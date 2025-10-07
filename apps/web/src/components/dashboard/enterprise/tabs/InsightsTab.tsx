'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Target, CheckCircle } from 'lucide-react';
import type { StrategicInsight } from '@/types/enterprise-dashboard';

interface InsightsTabProps {
  insights: StrategicInsight[];
  isLoading?: boolean;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({
  insights,
  isLoading = false
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

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

  return (
    <div className="enterprise-slide-up">
      {/* Value Waterfall Summary */}
      <Card className="enterprise-card mb-6 bg-gradient-to-r from-[var(--success)]/5 to-[var(--success)]/10 border-[var(--success)]/20">
        <CardContent className="py-6">
          <div className="text-center">
            <div className="text-sm text-[var(--muted-foreground)] mb-2">
              Total Value of All Insights
            </div>
            <div className="text-4xl font-bold text-[var(--success)] mb-2">
              {formatCurrency(insights.reduce((sum, i) => sum + i.estimatedValue, 0))}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Potential portfolio value increase: {((insights.reduce((sum, i) => sum + i.estimatedValue, 0) / 13900000) * 100).toFixed(1)}%
            </div>
          </div>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="space-y-4">
        {insights.map((insight) => {
          const impactColor =
            insight.impact === 'high' ? 'var(--error)' :
            insight.impact === 'medium' ? 'var(--warning)' :
            'var(--info)';

          return (
            <AccordionItem key={insight.id} value={insight.id} className="border-none">
              <Card className="enterprise-card hover:shadow-lg transition-shadow">
                <CardContent className="py-4">
                  {/* Header Row */}
                  <AccordionTrigger className="hover:no-underline w-full">
                    <div className="flex items-start justify-between w-full pr-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className="w-1 h-16 rounded-full flex-shrink-0"
                          style={{ backgroundColor: impactColor }}
                        />
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                              #{insight.priority}
                            </span>
                            <h3 className="font-semibold text-lg text-[var(--foreground)]">
                              {insight.title}
                            </h3>
                          </div>
                          <p className="text-sm text-[var(--muted-foreground)] mb-2">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge
                          variant={
                            insight.impact === 'high' ? 'destructive' :
                            insight.impact === 'medium' ? 'secondary' :
                            'default'
                          }
                        >
                          {insight.impact} impact
                        </Badge>
                        <Badge variant={
                          insight.category === 'risk' ? 'destructive' :
                          insight.category === 'opportunity' ? 'default' :
                          'secondary'
                        }>
                          {insight.category}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-[var(--accent)] rounded-lg">
                    <div>
                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Estimated Value</div>
                      <div className="font-semibold text-[var(--success)]">
                        {formatCurrency(insight.estimatedValue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Timeline</div>
                      <div className="font-medium text-[var(--foreground)]">{insight.timeline}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Confidence</div>
                      <div className="font-medium text-[var(--foreground)]">{insight.confidence}%</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {insight.actionRequired && (
                    <div className="flex gap-2 mb-2">
                      <Button variant="outline" size="sm">
                        Mark Complete
                      </Button>
                      <Button variant="ghost" size="sm">
                        Dismiss
                      </Button>
                    </div>
                  )}

                  {/* Expandable Action Plan */}
                  {insight.actionRequired && (
                    <AccordionContent>
                      <div className="mt-4 pt-4 border-t border-[var(--border)]">
                        <div className="bg-[var(--muted)] rounded-lg p-4">
                          <h4 className="font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Action Plan: {insight.title}
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm font-medium text-[var(--foreground)] mb-2">📋 Immediate Steps:</div>
                              <ol className="text-sm text-[var(--muted-foreground)] space-y-1 ml-4">
                                {getActionPlanSteps(insight.id).map((step, idx) => (
                                  <li key={idx}>{idx + 1}. {step}</li>
                                ))}
                              </ol>
                            </div>

                            <div className="flex gap-4 pt-3 border-t border-[var(--border)]">
                              <Button size="sm" variant="default">
                                Export Action Plan
                              </Button>
                              <Button size="sm" variant="outline">
                                Schedule Consultation
                              </Button>
                              <Button size="sm" variant="outline">
                                Set Reminders
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  )}
                </CardContent>
              </Card>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
