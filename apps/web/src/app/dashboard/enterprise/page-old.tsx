'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Shield,
  Target,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Activity,
  Globe,
  Calculator,
  Crown,
  Star,
  Layers,
  Users,
  Check,
  FileText,
  Info,
  HelpCircle
} from 'lucide-react';

// Import Enterprise-specific types and utilities
import type {
  EnterpriseMetrics,
  StrategicInsight,
  PortfolioAllocation,
  RiskMetric,
  ScenarioResult
} from '@/types/enterprise-dashboard';
import { EnterpriseAnalytics } from '@/lib/analytics/enterprise-calculations';
import { OptionPricingEngine } from '@/lib/financial/option-valuation';

// Import Professional Integration Component
import { ProfessionalIntegration } from '@/components/dashboard/enterprise/ProfessionalIntegration';

// Import Story 11.7 Enterprise Dashboard Components
import StrategicScenarioMatrix from '@/components/dashboard/enterprise/ScenarioMatrix';
import ExitStrategyDashboard from '@/components/dashboard/enterprise/ExitStrategyDashboard';
import CapitalStructureOptimizer from '@/components/dashboard/enterprise/CapitalStructureOptimizer';
import MultiScenarioProjections from '@/components/dashboard/enterprise/MultiScenarioProjections';
import StrategicOptionValuation from '@/components/dashboard/enterprise/StrategicOptionValuation';

// Import Tier Management
import {
  getUserTier,
  getTierPermissions,
  canAccessFeature,
  type UserTier
} from '@/lib/utils/tier-management';

// Import Enterprise dashboard styling
import '@/styles/enterprise-dashboard.css';

interface EnterpriseDashboardProps {
  // Optional props for configuration
  refreshInterval?: number;
  showAdvancedMetrics?: boolean;
  enableRealTimeUpdates?: boolean;
}

const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({
  refreshInterval = 30000,
  showAdvancedMetrics = true,
  enableRealTimeUpdates = true
}) => {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<EnterpriseMetrics | null>(null);
  const [insights, setInsights] = useState<StrategicInsight[]>([]);
  const [portfolioData, setPortfolioData] = useState<PortfolioAllocation[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [debtRatioSlider, setDebtRatioSlider] = useState(0.35);

  // Tier management state - Override for demo/testing
  const isTestAccount = user?.primaryEmailAddress?.emailAddress === 'danielgoodman14@gmail.com';
  const userTier = isTestAccount ? 'enterprise' : getUserTier(user);
  const permissions = getTierPermissions(userTier);
  const hasEnterpriseAccess = userTier === 'enterprise' || isTestAccount;
  const hasProfessionalAccess = permissions.canAccessProfessionalDashboard || hasEnterpriseAccess;

  // Enhanced mock data for danielgoodman14@gmail.com account
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Enhanced mock portfolio allocations with more realistic data
        const mockAllocations: PortfolioAllocation[] = [
          {
            assetClass: 'Large Cap Stocks',
            currentAllocation: 35,
            targetAllocation: 40,
            variance: -5,
            performance: 24.8,
            riskLevel: 'medium',
            totalValue: 4850000
          },
          {
            assetClass: 'International Stocks',
            currentAllocation: 20,
            targetAllocation: 25,
            variance: -5,
            performance: 18.6,
            riskLevel: 'medium',
            totalValue: 2770000
          },
          {
            assetClass: 'Government Bonds',
            currentAllocation: 18,
            targetAllocation: 15,
            variance: 3,
            performance: 4.2,
            riskLevel: 'low',
            totalValue: 2495000
          },
          {
            assetClass: 'Real Estate',
            currentAllocation: 12,
            targetAllocation: 10,
            variance: 2,
            performance: 21.3,
            riskLevel: 'high',
            totalValue: 1663000
          },
          {
            assetClass: 'Private Equity',
            currentAllocation: 8,
            targetAllocation: 5,
            variance: 3,
            performance: 32.7,
            riskLevel: 'high',
            totalValue: 1108000
          },
          {
            assetClass: 'Hedge Funds',
            currentAllocation: 4,
            targetAllocation: 3,
            variance: 1,
            performance: 15.2,
            riskLevel: 'medium',
            totalValue: 554000
          },
          {
            assetClass: 'Commodities',
            currentAllocation: 2,
            targetAllocation: 2,
            variance: 0,
            performance: -2.3,
            riskLevel: 'high',
            totalValue: 277000
          },
          {
            assetClass: 'Cash & Equivalents',
            currentAllocation: 1,
            targetAllocation: 0,
            variance: 1,
            performance: 2.1,
            riskLevel: 'low',
            totalValue: 138000
          }
        ];

        // Calculate enterprise metrics
        const calculatedMetrics = EnterpriseAnalytics.calculatePortfolioMetrics(mockAllocations);

        // Enhanced strategic insights with more detailed analysis
        const mockInsights: StrategicInsight[] = [
          {
            id: '1',
            title: 'Portfolio Rebalancing Opportunity',
            description: 'Your large-cap allocation is 5% below target, missing potential gains in the current bull market. Recent AI sector growth suggests immediate rebalancing could capture $325,000 in value.',
            impact: 'high',
            category: 'optimization',
            priority: 1,
            actionRequired: true,
            estimatedValue: 325000,
            timeline: '1-2 weeks',
            confidence: 92
          },
          {
            id: '2',
            title: 'Tech Sector Concentration Risk',
            description: 'Technology holdings now represent 42% of equity portfolio, creating significant concentration risk. Recommend diversifying into healthcare and industrial sectors to maintain balanced exposure.',
            impact: 'high',
            category: 'risk',
            priority: 2,
            actionRequired: true,
            estimatedValue: 185000,
            timeline: '2-3 weeks',
            confidence: 88
          },
          {
            id: '3',
            title: 'Private Credit Opportunity',
            description: 'Current market conditions present exceptional private credit opportunities with 12-15% yields. Consider allocating 3-5% of portfolio to senior secured loans.',
            impact: 'high',
            category: 'opportunity',
            priority: 3,
            actionRequired: false,
            estimatedValue: 450000,
            timeline: '1-2 months',
            confidence: 85
          },
          {
            id: '4',
            title: 'Tax-Loss Harvesting Available',
            description: 'Identify $127,000 in tax-loss harvesting opportunities from underperforming commodity positions. Could offset capital gains and reduce tax liability.',
            impact: 'medium',
            category: 'optimization',
            priority: 4,
            actionRequired: true,
            estimatedValue: 127000,
            timeline: 'Before year-end',
            confidence: 95
          },
          {
            id: '5',
            title: 'ESG Transition Strategy',
            description: 'Climate-focused funds outperforming traditional energy by 18% YTD. Strategic shift could improve both returns and sustainability metrics.',
            impact: 'medium',
            category: 'opportunity',
            priority: 5,
            actionRequired: false,
            estimatedValue: 280000,
            timeline: '3-6 months',
            confidence: 78
          },
          {
            id: '6',
            title: 'Currency Hedge Recommendation',
            description: 'International exposure creating 8% FX risk. Implementing currency hedging could protect $221,000 in portfolio value.',
            impact: 'medium',
            category: 'risk',
            priority: 6,
            actionRequired: false,
            estimatedValue: 221000,
            timeline: '1 month',
            confidence: 82
          }
        ];

        // Enhanced risk metrics with more comprehensive analysis
        const mockRiskMetrics: RiskMetric[] = [
          {
            type: 'market',
            currentLevel: 72,
            threshold: 75,
            trend: 'increasing',
            mitigation: 'Market volatility rising. Consider defensive hedges and increasing bond allocation by 3%',
            lastUpdated: new Date()
          },
          {
            type: 'credit',
            currentLevel: 28,
            threshold: 40,
            trend: 'stable',
            mitigation: 'Credit exposure well-managed. Continue monitoring high-yield positions',
            lastUpdated: new Date()
          },
          {
            type: 'liquidity',
            currentLevel: 38,
            threshold: 30,
            trend: 'increasing',
            mitigation: 'Liquidity slightly elevated. Consider reallocating 2% from alternatives to liquid assets',
            lastUpdated: new Date()
          },
          {
            type: 'concentration',
            currentLevel: 42,
            threshold: 35,
            trend: 'increasing',
            mitigation: 'Tech sector concentration above threshold. Immediate diversification recommended',
            lastUpdated: new Date()
          },
          {
            type: 'currency',
            currentLevel: 31,
            threshold: 25,
            trend: 'stable',
            mitigation: 'FX exposure manageable but monitor USD strength impact on international holdings',
            lastUpdated: new Date()
          },
          {
            type: 'interest-rate',
            currentLevel: 55,
            threshold: 60,
            trend: 'decreasing',
            mitigation: 'Duration risk declining as rates stabilize. Current positioning appropriate',
            lastUpdated: new Date()
          }
        ];

        // Run scenario analysis
        const scenarioResults = EnterpriseAnalytics.runScenarioAnalysis(mockAllocations, 1, 1000);

        setPortfolioData(mockAllocations);
        setMetrics(calculatedMetrics);
        setInsights(mockInsights);
        setRiskMetrics(mockRiskMetrics);
        setScenarios(scenarioResults);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    const interval = setInterval(() => {
      setLastUpdated(new Date());
      // In a real implementation, this would trigger a data refresh
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, enableRealTimeUpdates]);

  if (!isLoaded || isLoading) {
    return (
      <div className="enterprise-dashboard">
        <div className="enterprise-loading">
          <div className="enterprise-spinner" />
        </div>
      </div>
    );
  }

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

  return (
    <div className="enterprise-dashboard">
      <div className="enterprise-dashboard-container">
        {/* Enterprise Header */}
        <div className="enterprise-header enterprise-fade-in">
          <div className="flex justify-between items-start">
            <div>
              <h1>Enterprise Investment Dashboard</h1>
              <p className="enterprise-subtitle">
                Strategic portfolio management and risk analysis for {user?.firstName || 'Enterprise Client'}
              </p>
            </div>
            <div className="text-right">
              <Badge className="enterprise-status info mb-2">
                <Activity className="w-4 h-4" />
                Live Data
              </Badge>
              <p className="text-sm opacity-75">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="enterprise-nav-tabs">
            <TabsTrigger value="overview" className="enterprise-nav-tab">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="professional" className="enterprise-nav-tab">
              <Crown className="w-4 h-4" />
              Professional Analytics
              {hasProfessionalAccess && (
                <Badge className="ml-2 bg-yellow-600 text-white text-xs">
                  Included
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="enterprise-nav-tab">
              <PieChart className="w-4 h-4" />
              Portfolio Analysis
            </TabsTrigger>
            <TabsTrigger value="risk" className="enterprise-nav-tab">
              <Shield className="w-4 h-4" />
              Risk Management
            </TabsTrigger>
            <TabsTrigger value="strategic-value" className="enterprise-nav-tab">
              <Calculator className="w-4 h-4" />
              Strategic Value
            </TabsTrigger>
            <TabsTrigger value="insights" className="enterprise-nav-tab">
              <Target className="w-4 h-4" />
              Strategic Insights
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="enterprise-tab-trigger">
              <Activity className="h-4 w-4 mr-2" />
              Scenarios
            </TabsTrigger>
            <TabsTrigger value="exit" className="enterprise-tab-trigger">
              <Target className="h-4 w-4 mr-2" />
              Exit Strategy
            </TabsTrigger>
            <TabsTrigger value="capital" className="enterprise-tab-trigger">
              <Calculator className="h-4 w-4 mr-2" />
              Capital Structure
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="enterprise-slide-up">
            {/* Hero Metric Section - Improvement #1: Make portfolio value more prominent */}
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
                      {/* Mini sparkline placeholder */}
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

            {/* Strategic Insights Spotlight - Improvement #2: Show top 3 priorities only */}
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
                        onClick={() => setActiveTab('insights')}
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
                      onClick={() => setActiveTab('insights')}
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
                          <Badge className={`enterprise-status ${
                            allocation.variance > 0 ? 'warning' :
                            allocation.variance < 0 ? 'info' : 'success'
                          }`}>
                            {allocation.variance !== 0 ? `${allocation.variance > 0 ? '+' : ''}${allocation.variance}%` : 'On Target'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <Button
                      className="enterprise-button secondary w-full mt-4"
                      onClick={() => setActiveTab('portfolio')}
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
                      className="enterprise-button secondary w-full mt-4"
                      onClick={() => setActiveTab('risk')}
                    >
                      Risk Management Tools
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Professional Features Quick Access - Improvement #3: Simplified to 3 features */}
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
                      onClick={() => setActiveTab('professional')}
                    >
                      View All →
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--warning)] hover:bg-[var(--accent)] transition-all text-left"
                      onClick={() => setActiveTab('professional')}
                    >
                      <TrendingUp className="w-5 h-5 text-[var(--warning)] mb-2" />
                      <div className="font-medium text-sm text-[var(--foreground)]">Financial Trends</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Multi-year analysis</div>
                    </button>
                    <button
                      className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--warning)] hover:bg-[var(--accent)] transition-all text-left"
                      onClick={() => setActiveTab('professional')}
                    >
                      <Users className="w-5 h-5 text-[var(--warning)] mb-2" />
                      <div className="font-medium text-sm text-[var(--foreground)]">Customer Risk</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Concentration analysis</div>
                    </button>
                    <button
                      className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--warning)] hover:bg-[var(--accent)] transition-all text-left"
                      onClick={() => setActiveTab('professional')}
                    >
                      <Target className="w-5 h-5 text-[var(--warning)] mb-2" />
                      <div className="font-medium text-sm text-[var(--foreground)]">Competitive Position</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Market analysis</div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

          </TabsContent>

          {/* Professional Analytics Tab - Improvement #9-13: Flatten nested tabs */}
          <TabsContent value="professional" className="enterprise-slide-up">
            {/* Compact banner instead of large header */}
            <div className="mb-6 p-4 bg-[var(--accent)] rounded-lg border border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-[var(--warning)]" />
                <div>
                  <div className="font-semibold text-[var(--foreground)]">
                    ✓ Professional Features Included
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    All Professional tier analytics are available with your Enterprise subscription
                  </div>
                </div>
              </div>
            </div>

            {/* Display Professional Integration without nested tabs */}
            <ProfessionalIntegration
              showComparison={false}
              enableTierSwitching={false}
              demoMode={!hasEnterpriseAccess}
              className="enterprise-professional-integration"
            />
          </TabsContent>

          {/* Portfolio Analysis Tab - Improvement #14-20: Add interactivity and filters */}
          <TabsContent value="portfolio" className="enterprise-slide-up">
            <div className="space-y-6">
              <Card className="enterprise-card">
                <CardHeader className="enterprise-card-header">
                  <div className="flex items-center justify-between">
                    <CardTitle className="enterprise-card-title">Portfolio Allocation Analysis</CardTitle>
                    {/* Quick Filters - Improvement #19 */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs">
                        Show All
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        Underweight Only
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        High Risk Only
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="enterprise-chart-container">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Pie Chart */}
                      <div className="flex items-center justify-center">
                        <svg viewBox="0 0 400 400" className="w-full max-w-md">
                          {/* Generate pie chart slices */}
                          {(() => {
                            let currentAngle = 0;
                            const colors = [
                              '#c96442', // primary
                              '#b05730', // chart-1
                              '#9c87f5', // chart-2
                              '#b4552d', // chart-5
                              '#10b981', // success
                              '#f59e0b', // warning
                              '#3b82f6', // info
                              '#ded8c4'  // chart-3
                            ];

                            return portfolioData.map((allocation, index) => {
                              const percentage = allocation.currentAllocation / 100;
                              const angle = percentage * 360;
                              const startAngle = currentAngle;
                              const endAngle = currentAngle + angle;

                              // Convert to radians
                              const startRad = (startAngle - 90) * Math.PI / 180;
                              const endRad = (endAngle - 90) * Math.PI / 180;

                              // Calculate path
                              const x1 = 200 + 150 * Math.cos(startRad);
                              const y1 = 200 + 150 * Math.sin(startRad);
                              const x2 = 200 + 150 * Math.cos(endRad);
                              const y2 = 200 + 150 * Math.sin(endRad);

                              const largeArc = angle > 180 ? 1 : 0;
                              const path = `M 200 200 L ${x1} ${y1} A 150 150 0 ${largeArc} 1 ${x2} ${y2} Z`;

                              currentAngle = endAngle;

                              return (
                                <g key={index}>
                                  <path
                                    d={path}
                                    fill={colors[index % colors.length]}
                                    opacity="0.9"
                                    className="hover:opacity-100 transition-opacity cursor-pointer"
                                  />
                                </g>
                              );
                            });
                          })()}

                          {/* Center circle for donut effect */}
                          <circle cx="200" cy="200" r="80" fill="white" />
                          <text x="200" y="195" textAnchor="middle" className="text-2xl font-bold fill-gray-800">
                            $13.9M
                          </text>
                          <text x="200" y="220" textAnchor="middle" className="text-sm fill-gray-500">
                            Total Value
                          </text>
                        </svg>
                      </div>

                      {/* Legend */}
                      <div className="flex flex-col justify-center space-y-3">
                        {portfolioData.map((allocation, index) => {
                          const colors = [
                            '#c96442', // primary
                            '#b05730', // chart-1
                            '#9c87f5', // chart-2
                            '#b4552d', // chart-5
                            '#10b981', // success
                            '#f59e0b', // warning
                            '#3b82f6', // info
                            '#ded8c4'  // chart-3
                          ];
                          return (
                            <div key={index} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded transition-colors">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: colors[index % colors.length] }}
                                />
                                <span className="text-sm font-medium text-gray-700">{allocation.assetClass}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-gray-900">{allocation.currentAllocation}%</span>
                                <span className="text-xs text-gray-500">{formatCurrency(allocation.totalValue)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="enterprise-card">
                <CardHeader className="enterprise-card-header">
                  <CardTitle className="enterprise-card-title">Asset Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="enterprise-table">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr>
                          <th className="cursor-pointer hover:bg-[var(--accent)] transition-colors">
                            Asset Class ↕
                          </th>
                          <th className="cursor-pointer hover:bg-[var(--accent)] transition-colors">
                            Current ↕
                          </th>
                          <th className="cursor-pointer hover:bg-[var(--accent)] transition-colors">
                            Target ↕
                          </th>
                          <th className="cursor-pointer hover:bg-[var(--accent)] transition-colors">
                            Performance ↕
                          </th>
                          <th className="cursor-pointer hover:bg-[var(--accent)] transition-colors">
                            Risk ↕
                          </th>
                          <th className="cursor-pointer hover:bg-[var(--accent)] transition-colors">
                            Value ↕
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioData.map((allocation, index) => (
                          <tr key={index} className="hover:bg-[var(--accent)] transition-colors">
                            <td className="font-medium text-[var(--foreground)]">{allocation.assetClass}</td>
                            <td className="text-[var(--foreground)]">{allocation.currentAllocation}%</td>
                            <td className="text-[var(--muted-foreground)]">{allocation.targetAllocation}%</td>
                            <td>
                              {/* Improvement #16: Color-code variance */}
                              <div className="flex items-center gap-2">
                                <span className={allocation.performance > 0 ? 'text-[var(--success)] font-medium' : 'text-[var(--error)] font-medium'}>
                                  {formatPercentage(allocation.performance)}
                                </span>
                                {allocation.variance !== 0 && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    allocation.variance > 0 ? 'bg-[var(--warning)]/10 text-[var(--warning)]' :
                                    'bg-[var(--info)]/10 text-[var(--info)]'
                                  }`}>
                                    {allocation.variance > 0 ? '+' : ''}{allocation.variance}%
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <Badge className={`${
                                allocation.riskLevel === 'low' ? 'bg-[var(--status-good)] text-white' :
                                allocation.riskLevel === 'medium' ? 'bg-[var(--status-moderate)] text-white' :
                                'bg-[var(--status-caution)] text-white'
                              }`}>
                                {allocation.riskLevel}
                              </Badge>
                            </td>
                            <td className="font-medium text-[var(--foreground)]">{formatCurrency(allocation.totalValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Risk Management Tab - Improvement #21-26: Add Risk Dashboard */}
          <TabsContent value="risk" className="enterprise-slide-up">
            <div className="space-y-6">
              {/* Overall Risk Score - Hero Card */}
              <Card className="enterprise-card border-2 border-[var(--warning)]">
                <CardContent className="py-6">
                  <div className="text-center">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-[var(--warning)]" />
                    <div className="text-sm text-[var(--muted-foreground)] mb-2">Overall Risk Score</div>
                    <div className="text-5xl font-bold text-[var(--foreground)] mb-2">
                      {metrics ? metrics.riskAssessmentScore : 68}/100
                    </div>
                    <Badge className="bg-[var(--status-moderate)] text-white px-3 py-1">
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
                  const statusBg =
                    percentage > 90 ? 'bg-[var(--status-critical)]' :
                    percentage > 75 ? 'bg-[var(--status-caution)]' :
                    percentage > 50 ? 'bg-[var(--status-moderate)]' :
                    'bg-[var(--status-good)]';

                  return (
                    <Card key={index} className="enterprise-card">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-sm capitalize text-[var(--foreground)]">
                            {risk.type} Risk
                          </span>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusBg}`}>
                            {risk.trend}
                          </div>
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
                          <Badge className="bg-[var(--info)] text-white">
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
          </TabsContent>

          {/* Strategic Value Analysis Tab */}
          <TabsContent value="strategic-value" className="enterprise-slide-up">
            <div className="space-y-6">
              {/* Real Options Analysis */}
              <Card className="enterprise-card">
                <CardHeader className="enterprise-card-header">
                  <CardTitle className="enterprise-card-title">Real Options Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    Strategic business opportunities that provide flexibility and value creation potential beyond traditional DCF analysis.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        title: 'Market Expansion Option',
                        description: 'Value of entering new geographic markets or customer segments',
                        value: 2800000,
                        probability: 0.72,
                        timeline: '12-18 months',
                        risk: 'medium'
                      },
                      {
                        title: 'Product Development Option',
                        description: 'Option to invest in new product lines based on market validation',
                        value: 1900000,
                        probability: 0.65,
                        timeline: '18-24 months',
                        risk: 'high'
                      },
                      {
                        title: 'Acquisition Option',
                        description: 'Strategic M&A opportunities to accelerate growth',
                        value: 5200000,
                        probability: 0.58,
                        timeline: '6-12 months',
                        risk: 'medium'
                      },
                      {
                        title: 'Technology Platform Option',
                        description: 'Investment in scalable infrastructure for long-term growth',
                        value: 3400000,
                        probability: 0.78,
                        timeline: '12-24 months',
                        risk: 'low'
                      }
                    ].map((option, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h4 className="font-semibold text-gray-800 mb-2">{option.title}</h4>
                        <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Option Value:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(option.value)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Success Probability:</span>
                            <span className="font-medium">{(option.probability * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Timeline:</span>
                            <span className="font-medium">{option.timeline}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Risk Level:</span>
                            <Badge className={`enterprise-status ${
                              option.risk === 'low' ? 'success' :
                              option.risk === 'medium' ? 'warning' : 'danger'
                            }`}>
                              {option.risk}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* M&A Valuation Models */}
              <Card className="enterprise-card">
                <CardHeader className="enterprise-card-header">
                  <CardTitle className="enterprise-card-title">M&A Valuation Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="text-sm text-gray-500 mb-1">Strategic Buyer Valuation</div>
                      <div className="text-2xl font-bold text-gray-800 mb-2">{formatCurrency(18500000)}</div>
                      <div className="text-sm text-gray-600">Includes synergies and strategic premium (35% above DCF)</div>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <div className="text-sm text-gray-500 mb-1">Financial Buyer Valuation</div>
                      <div className="text-2xl font-bold text-gray-800 mb-2">{formatCurrency(14200000)}</div>
                      <div className="text-sm text-gray-600">PE firm valuation based on cash flow multiples (8.2x EBITDA)</div>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <div className="text-sm text-gray-500 mb-1">Asset-Based Valuation</div>
                      <div className="text-2xl font-bold text-gray-800 mb-2">{formatCurrency(11800000)}</div>
                      <div className="text-sm text-gray-600">Conservative liquidation value with adjusted book value</div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Recommended Exit Strategy</h4>
                    <p className="text-sm text-blue-700">
                      Based on current market conditions and business performance, a strategic buyer approach could maximize value at
                      <span className="font-bold"> {formatCurrency(18500000)}</span>, representing a <span className="font-bold">34% premium</span> over financial buyer offers.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Growth Investment Calculator */}
              <Card className="enterprise-card">
                <CardHeader className="enterprise-card-header">
                  <CardTitle className="enterprise-card-title">Growth Investment ROI Calculator</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Investment Type</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Required Capital</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Expected ROI</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Payback Period</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">NPV</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {[
                          { type: 'Sales Team Expansion', capital: 450000, roi: 285, payback: '8 months', npv: 1283000 },
                          { type: 'Marketing Automation', capital: 180000, roi: 420, payback: '5 months', npv: 756000 },
                          { type: 'Production Capacity', capital: 850000, roi: 195, payback: '14 months', npv: 1658000 },
                          { type: 'Technology Infrastructure', capital: 320000, roi: 340, payback: '7 months', npv: 1088000 },
                          { type: 'R&D / Product Innovation', capital: 520000, roi: 265, payback: '11 months', npv: 1378000 }
                        ].map((investment, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-800">{investment.type}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(investment.capital)}</td>
                            <td className="px-4 py-3 text-sm text-right">
                              <span className="font-semibold text-green-600">{investment.roi}%</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">{investment.payback}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-800">{formatCurrency(investment.npv)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button className="enterprise-button primary">
                      Build Custom Investment Model
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Strategic Insights Tab - Improvement #33-38: Expandable inline action plans */}
          <TabsContent value="insights" className="enterprise-slide-up">
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

            <div className="space-y-4">
              {insights.map((insight) => {
                const isExpanded = expandedInsight === insight.id;
                const impactColor =
                  insight.impact === 'high' ? 'var(--error)' :
                  insight.impact === 'medium' ? 'var(--warning)' :
                  'var(--info)';

                return (
                  <Card key={insight.id} className="enterprise-card hover:shadow-lg transition-shadow">
                    <CardContent className="py-4">
                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className="w-1 h-16 rounded-full flex-shrink-0"
                            style={{ backgroundColor: impactColor }}
                          />
                          <div className="flex-1">
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
                            className="text-white"
                            style={{ backgroundColor: impactColor }}
                          >
                            {insight.impact} impact
                          </Badge>
                          <Badge className={`${
                            insight.category === 'risk' ? 'bg-[var(--error)]' :
                            insight.category === 'opportunity' ? 'bg-[var(--success)]' :
                            'bg-[var(--warning)]'
                          } text-white`}>
                            {insight.category}
                          </Badge>
                        </div>
                      </div>

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
                        <div className="flex gap-2">
                          <Button
                            variant={isExpanded ? "default" : "outline"}
                            size="sm"
                            onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {isExpanded ? 'Hide Action Plan' : 'View Action Plan'}
                          </Button>
                          <Button variant="outline" size="sm">
                            Mark Complete
                          </Button>
                          <Button variant="ghost" size="sm">
                            Dismiss
                          </Button>
                        </div>
                      )}

                      {/* Expandable Action Plan - Improvement #33 */}
                      {isExpanded && insight.actionRequired && (
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
                                  {insight.id === '1' && (
                                    <>
                                      <li>1. Review current large-cap allocations and identify underweight positions</li>
                                      <li>2. Analyze AI sector holdings for growth potential</li>
                                      <li>3. Generate rebalancing trade list with target allocations</li>
                                      <li>4. Review tax implications of selling/buying positions</li>
                                      <li>5. Execute trades in phases to minimize market impact</li>
                                    </>
                                  )}
                                  {insight.id === '2' && (
                                    <>
                                      <li>1. Document all tech holdings and calculate exact exposure (currently 42%)</li>
                                      <li>2. Identify healthcare and industrial sectors for diversification</li>
                                      <li>3. Research 3-5 quality non-tech stocks for investment</li>
                                      <li>4. Create phased selling plan for over-concentrated tech positions</li>
                                      <li>5. Monitor sector rotation trends and adjust timing</li>
                                    </>
                                  )}
                                  {insight.id === '3' && (
                                    <>
                                      <li>1. Research current private credit market conditions</li>
                                      <li>2. Identify qualified private credit fund managers</li>
                                      <li>3. Review historical performance and track records</li>
                                      <li>4. Assess liquidity terms and lock-up periods</li>
                                      <li>5. Determine optimal allocation (3-5% of portfolio)</li>
                                    </>
                                  )}
                                  {insight.id === '4' && (
                                    <>
                                      <li>1. Generate tax-loss harvesting report for all positions</li>
                                      <li>2. Identify $127,000 in commodity position losses</li>
                                      <li>3. Find substantially identical replacement securities</li>
                                      <li>4. Execute wash-sale compliant trades</li>
                                      <li>5. Document tax benefits for year-end reporting</li>
                                    </>
                                  )}
                                </ol>
                              </div>

                              <div className="flex gap-4 pt-3 border-t border-[var(--border)]">
                                <Button size="sm" className="bg-[var(--primary)]">
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
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Scenarios Tab - Story 11.7 Component */}
          <TabsContent value="scenarios" className="enterprise-slide-up">
            <StrategicScenarioMatrix
              data={{
                scenarios: scenarios.map((scenario, index) => {
                  const currentYear = new Date().getFullYear();
                  const baseValuation = 13900000;
                  const growthRate = scenario.expectedReturn;

                  return {
                    id: `scenario-${index}`,
                    name: scenario.scenario,
                    assumptions: [{
                      id: '1',
                      description: scenario.description,
                      impact: 'high',
                      confidence: scenario.probability
                    }],
                    projections: Array.from({ length: 5 }, (_, i) => ({
                      year: currentYear + i,
                      valuation: baseValuation * Math.pow(1 + growthRate, i),
                      revenue: baseValuation * Math.pow(1 + growthRate, i) * 0.8,
                      profit: baseValuation * Math.pow(1 + growthRate, i) * 0.15,
                      growthRate: growthRate,
                      marketShare: 0
                    })),
                    investmentRequired: 0,
                    expectedROI: scenario.expectedReturn * 100,
                    riskLevel: scenario.expectedReturn > 0.1 ? 'high' : scenario.expectedReturn > 0 ? 'medium' : 'low',
                    probabilityOfSuccess: scenario.probability,
                    valuationImpact: baseValuation * growthRate,
                    timeline: 12,
                    keyDrivers: [
                      scenario.scenario === 'Bull Market' ? 'Bull Market' :
                      scenario.scenario === 'Normal Market' ? 'Normal Market' :
                      'Bear Market'
                    ],
                    riskFactors: [
                      scenario.scenario === 'Bull Market' ? 'Market volatility' :
                      scenario.scenario === 'Normal Market' ? 'Competition' :
                      'Economic downturn'
                    ]
                  };
                }),
                comparisonMetrics: [],
                riskAssessment: {
                  overallRisk: 'medium',
                  factors: [],
                  mitigationStrategies: []
                },
                recommendedPath: scenarios.length > 0 ? scenarios[0].scenario : '',
                sensitivityAnalysis: {
                  variables: [],
                  results: []
                }
              }}
            />
          </TabsContent>

          {/* Exit Strategy Tab - Story 11.7 Component */}
          <TabsContent value="exit" className="enterprise-slide-up">
            {/* Week 2 Improvement: Hero Recommendation Card */}
            <Card className="enterprise-card mb-6 border-2 border-[var(--success)]">
              <CardContent className="py-8">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-[var(--success)]/10 rounded-full">
                    <TrendingUp className="w-12 h-12 text-[var(--success)]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[var(--success)] mb-2">RECOMMENDED STRATEGY</div>
                    <h3 className="text-3xl font-bold text-[var(--foreground)] mb-3">Management Buyout (MBO)</h3>
                    <p className="text-[var(--muted-foreground)] mb-4">
                      Based on your company profile, market conditions, and readiness assessment, a Management Buyout offers
                      the highest probability of success (92%) with the fastest execution timeline (12 months).
                    </p>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-2xl font-bold text-[var(--foreground)]">92%</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Feasibility</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[var(--foreground)]">{formatCurrency(11800000)}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Est. Valuation</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[var(--foreground)]">12 mo</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Timeline</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[var(--status-good)]">Low</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Risk Level</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button className="bg-[var(--success)] text-white hover:bg-[var(--success-dark)]">
                        <FileText className="w-4 h-4 mr-2" />
                        View Detailed Plan
                      </Button>
                      <Button variant="outline">
                        Compare All Options
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ExitStrategyDashboard
              data={{
                exitOptions: [
                  {
                    type: 'strategic',
                    feasibilityScore: 85,
                    expectedValuation: 18500000,
                    timeToExit: 18,
                    riskFactors: ['Market consolidation', 'Competitive response'],
                    advantages: ['Premium valuation', 'Synergy opportunities', 'Market leadership'],
                    requiredPreparation: [
                      { step: 'Financial audit completion', completed: true, importance: 'critical', estimatedTime: '2-3 months' },
                      { step: 'Strategic buyer identification', completed: false, importance: 'critical', estimatedTime: '1-2 months' }
                    ]
                  },
                  {
                    type: 'financial',
                    feasibilityScore: 78,
                    expectedValuation: 14200000,
                    timeToExit: 24,
                    riskFactors: ['Debt markets', 'Return requirements'],
                    advantages: ['Management retention', 'Growth capital', 'Operational improvements'],
                    requiredPreparation: [
                      { step: 'Management presentation ready', completed: false, importance: 'critical', estimatedTime: '2-4 weeks' }
                    ]
                  },
                  {
                    type: 'ipo',
                    feasibilityScore: 45,
                    expectedValuation: 22000000,
                    timeToExit: 36,
                    riskFactors: ['Market volatility', 'Size requirements', 'Public readiness'],
                    advantages: ['Maximum valuation', 'Liquidity', 'Growth capital'],
                    requiredPreparation: [
                      { step: 'SOX compliance implementation', completed: false, importance: 'critical', estimatedTime: '12-18 months' }
                    ]
                  },
                  {
                    type: 'mbo',
                    feasibilityScore: 92,
                    expectedValuation: 11800000,
                    timeToExit: 12,
                    riskFactors: ['Financing availability', 'Management capacity'],
                    advantages: ['Management continuity', 'Cultural preservation', 'Faster execution'],
                    requiredPreparation: [
                      { step: 'Management equity structure', completed: true, importance: 'critical', estimatedTime: '1-2 months' }
                    ]
                  },
                  {
                    type: 'esop',
                    feasibilityScore: 68,
                    expectedValuation: 13200000,
                    timeToExit: 30,
                    riskFactors: ['Employee acceptance', 'Tax implications'],
                    advantages: ['Employee ownership', 'Tax benefits', 'Legacy preservation'],
                    requiredPreparation: [
                      { step: 'ESOP feasibility study', completed: false, importance: 'important', estimatedTime: '3-4 months' }
                    ]
                  },
                  {
                    type: 'family',
                    feasibilityScore: 72,
                    expectedValuation: 10500000,
                    timeToExit: 60,
                    riskFactors: ['Family member readiness', 'Succession planning'],
                    advantages: ['Family legacy', 'Gradual transition', 'Cultural continuity'],
                    requiredPreparation: [
                      { step: 'Succession planning documentation', completed: false, importance: 'critical', estimatedTime: '6-12 months' }
                    ]
                  }
                ],
                valuationProjections: [
                  {
                    exitType: 'strategic',
                    timeHorizon: 36,
                    optimisticValuation: 22000000,
                    baseValuation: 18500000,
                    conservativeValuation: 15000000,
                    probabilityWeights: [0.2, 0.6, 0.2]
                  },
                  {
                    exitType: 'financial',
                    timeHorizon: 36,
                    optimisticValuation: 17500000,
                    baseValuation: 14200000,
                    conservativeValuation: 11500000,
                    probabilityWeights: [0.2, 0.6, 0.2]
                  },
                  {
                    exitType: 'ipo',
                    timeHorizon: 36,
                    optimisticValuation: 28000000,
                    baseValuation: 22000000,
                    conservativeValuation: 16000000,
                    probabilityWeights: [0.15, 0.5, 0.35]
                  },
                  {
                    exitType: 'mbo',
                    timeHorizon: 36,
                    optimisticValuation: 14500000,
                    baseValuation: 11800000,
                    conservativeValuation: 9500000,
                    probabilityWeights: [0.25, 0.6, 0.15]
                  },
                  {
                    exitType: 'esop',
                    timeHorizon: 36,
                    optimisticValuation: 16000000,
                    baseValuation: 13200000,
                    conservativeValuation: 10800000,
                    probabilityWeights: [0.2, 0.6, 0.2]
                  },
                  {
                    exitType: 'family',
                    timeHorizon: 36,
                    optimisticValuation: 12500000,
                    baseValuation: 10500000,
                    conservativeValuation: 8500000,
                    probabilityWeights: [0.2, 0.65, 0.15]
                  }
                ],
                transactionReadiness: {
                  overallScore: 73,
                  financialReadiness: 85,
                  operationalReadiness: 78,
                  legalReadiness: 65,
                  marketReadiness: 82,
                  improvementAreas: ['Legal documentation update', 'Management system formalization']
                },
                optimizationRecommendations: [
                  {
                    id: '1',
                    title: 'Complete Financial Audit',
                    description: 'Engage top-tier accounting firm for comprehensive financial review',
                    impact: 'high',
                    timeline: '2-3 months',
                    valuationIncrease: 8,
                    effort: 'medium',
                    category: 'financial'
                  },
                  {
                    id: '2',
                    title: 'Formalize Management Systems',
                    description: 'Document and systematize all critical business processes',
                    impact: 'high',
                    timeline: '4-6 months',
                    valuationIncrease: 12,
                    effort: 'high',
                    category: 'operational'
                  },
                  {
                    id: '3',
                    title: 'Update Legal Documentation',
                    description: 'Review and update all corporate governance and compliance documents',
                    impact: 'high',
                    timeline: '2-4 months',
                    valuationIncrease: 5,
                    effort: 'medium',
                    category: 'legal'
                  },
                  {
                    id: '4',
                    title: 'Strengthen Customer Contracts',
                    description: 'Convert key customers to long-term agreements',
                    impact: 'high',
                    timeline: '3-6 months',
                    valuationIncrease: 15,
                    effort: 'high',
                    category: 'strategic'
                  }
                ],
                marketTiming: {
                  currentMarketConditions: 'good',
                  sectorMultiples: {
                    current: 6.8,
                    historical: 5.8,
                    trend: 'increasing'
                  },
                  liquidityIndex: 78,
                  recommendedTiming: 'Consider exit within next 12-18 months to capitalize on favorable market conditions',
                  keyFactors: ['Strong M&A activity in sector', 'Favorable financing conditions', 'Industry consolidation trends', 'High buyer demand']
                }
              }}
            />
          </TabsContent>

          {/* Capital Structure Tab - Story 11.7 Component */}
          <TabsContent value="capital" className="enterprise-slide-up">
            {/* Week 2 Improvement: Educational Tooltips & Interactive Demo */}
            <Card className="enterprise-card mb-6 bg-[var(--info)]/5 border-[var(--info)]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-[var(--info)]" />
                  <CardTitle className="text-lg">Understanding Capital Structure</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-[var(--card)] rounded-lg border border-[var(--border)]">
                      <div className="flex items-start gap-2 mb-2">
                        <HelpCircle className="w-4 h-4 text-[var(--info)] mt-0.5" />
                        <div>
                          <div className="font-semibold text-sm">Debt-to-Equity Ratio</div>
                          <p className="text-xs text-[var(--muted-foreground)] mt-1">
                            Measures how much debt your business uses compared to equity. Lower ratios indicate less financial risk.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-[var(--card)] rounded-lg border border-[var(--border)]">
                      <div className="flex items-start gap-2 mb-2">
                        <HelpCircle className="w-4 h-4 text-[var(--info)] mt-0.5" />
                        <div>
                          <div className="font-semibold text-sm">WACC</div>
                          <p className="text-xs text-[var(--muted-foreground)] mt-1">
                            Weighted Average Cost of Capital - the average rate you pay to finance assets. Lower is better.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-[var(--card)] rounded-lg border border-[var(--border)]">
                      <div className="flex items-start gap-2 mb-2">
                        <HelpCircle className="w-4 h-4 text-[var(--info)] mt-0.5" />
                        <div>
                          <div className="font-semibold text-sm">Credit Rating</div>
                          <p className="text-xs text-[var(--muted-foreground)] mt-1">
                            Assessment of your creditworthiness. Higher ratings (AAA to BBB) mean lower borrowing costs.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Slider Demo */}
                  <div className="mt-6 p-4 bg-[var(--card)] rounded-lg border-2 border-[var(--border)]">
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Debt Ratio Simulator</label>
                        <span className="text-lg font-bold text-[var(--primary)]">
                          {(debtRatioSlider * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.15"
                        max="0.65"
                        step="0.05"
                        value={debtRatioSlider}
                        onChange={(e) => setDebtRatioSlider(parseFloat(e.target.value))}
                        className="w-full h-2 bg-[var(--muted)] rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, var(--success) 0%, var(--warning) 50%, var(--error) 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
                        <span>Conservative (15%)</span>
                        <span>Moderate (35%)</span>
                        <span>Aggressive (65%)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="text-center p-3 bg-[var(--muted)] rounded">
                        <div className="text-xs text-[var(--muted-foreground)]">Est. WACC</div>
                        <div className="text-lg font-bold">
                          {(7.5 + debtRatioSlider * 4).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-[var(--muted)] rounded">
                        <div className="text-xs text-[var(--muted-foreground)]">Risk Level</div>
                        <div className="text-lg font-bold">
                          {debtRatioSlider < 0.3 ? 'Low' : debtRatioSlider < 0.45 ? 'Medium' : 'High'}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-[var(--muted)] rounded">
                        <div className="text-xs text-[var(--muted-foreground)]">Credit Rating</div>
                        <div className="text-lg font-bold">
                          {debtRatioSlider < 0.25 ? 'A+' : debtRatioSlider < 0.40 ? 'A-' : 'BBB'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <CapitalStructureOptimizer
              data={{
                currentStructure: {
                  debt: 6250000,
                  equity: 13900000,
                  debtToEquity: 0.45,
                  weightedAverageCostOfCapital: 9.2,
                  debtServiceCoverage: 2.8,
                  creditRating: 'BBB+'
                },
                optimizedStructure: {
                  debt: 4865000,
                  equity: 13900000,
                  debtToEquity: 0.35,
                  weightedAverageCostOfCapital: 8.1,
                  debtServiceCoverage: 3.5,
                  creditRating: 'A-'
                },
                scenarios: [
                  { name: 'Conservative', debtRatio: 0.25, wacc: 7.8, creditRating: 'A+', riskLevel: 'low' },
                  { name: 'Moderate', debtRatio: 0.35, wacc: 8.1, creditRating: 'A-', riskLevel: 'medium' },
                  { name: 'Aggressive', debtRatio: 0.50, wacc: 9.5, creditRating: 'BBB', riskLevel: 'high' }
                ],
                costOfCapital: {
                  costOfDebt: 5.5,
                  costOfEquity: 12.3,
                  wacc: 9.2,
                  taxRate: 0.25,
                  riskFreeRate: 4.2,
                  marketRiskPremium: 7.5,
                  beta: 1.08
                },
                leverageAnalysis: {
                  debtToEquityRatio: 0.45,
                  debtToAssetRatio: 0.31,
                  interestCoverageRatio: 8.5,
                  debtServiceCoverageRatio: 2.8,
                  timesInterestEarned: 8.5,
                  cashCoverageRatio: 3.2
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnterpriseDashboard;