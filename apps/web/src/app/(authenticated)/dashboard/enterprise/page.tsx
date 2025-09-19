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
  Check
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

  // Tier management state
  const userTier = getUserTier(user);
  const permissions = getTierPermissions(userTier);
  const hasEnterpriseAccess = userTier === 'enterprise';
  const hasProfessionalAccess = permissions.canAccessProfessionalDashboard;

  // Mock data for initial implementation
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock portfolio allocations data
        const mockAllocations: PortfolioAllocation[] = [
          {
            assetClass: 'Large Cap Stocks',
            currentAllocation: 35,
            targetAllocation: 40,
            variance: -5,
            performance: 12.5,
            riskLevel: 'medium',
            totalValue: 2500000
          },
          {
            assetClass: 'International Stocks',
            currentAllocation: 20,
            targetAllocation: 25,
            variance: -5,
            performance: 8.3,
            riskLevel: 'medium',
            totalValue: 1400000
          },
          {
            assetClass: 'Government Bonds',
            currentAllocation: 25,
            targetAllocation: 20,
            variance: 5,
            performance: 3.2,
            riskLevel: 'low',
            totalValue: 1750000
          },
          {
            assetClass: 'Real Estate',
            currentAllocation: 15,
            targetAllocation: 10,
            variance: 5,
            performance: 15.7,
            riskLevel: 'high',
            totalValue: 1050000
          },
          {
            assetClass: 'Alternatives',
            currentAllocation: 5,
            targetAllocation: 5,
            variance: 0,
            performance: 18.2,
            riskLevel: 'high',
            totalValue: 350000
          }
        ];

        // Calculate enterprise metrics
        const calculatedMetrics = EnterpriseAnalytics.calculatePortfolioMetrics(mockAllocations);

        // Mock strategic insights
        const mockInsights: StrategicInsight[] = [
          {
            id: '1',
            title: 'Portfolio Rebalancing Opportunity',
            description: 'Current allocation deviates from target by 5% in large-cap stocks. Consider rebalancing to optimize risk-return profile.',
            impact: 'high',
            category: 'optimization',
            priority: 1,
            actionRequired: true,
            estimatedValue: 125000,
            timeline: '2-4 weeks',
            confidence: 85
          },
          {
            id: '2',
            title: 'Risk Concentration Alert',
            description: 'Technology sector exposure exceeds 25% threshold. Diversification across sectors recommended.',
            impact: 'medium',
            category: 'risk',
            priority: 2,
            actionRequired: true,
            estimatedValue: 75000,
            timeline: '1-2 months',
            confidence: 92
          },
          {
            id: '3',
            title: 'ESG Investment Opportunity',
            description: 'Emerging sustainable technology sector showing strong growth potential with favorable regulatory environment.',
            impact: 'medium',
            category: 'opportunity',
            priority: 3,
            actionRequired: false,
            estimatedValue: 200000,
            timeline: '3-6 months',
            confidence: 78
          }
        ];

        // Mock risk metrics
        const mockRiskMetrics: RiskMetric[] = [
          {
            type: 'market',
            currentLevel: 65,
            threshold: 75,
            trend: 'stable',
            mitigation: 'Maintain diversification across asset classes',
            lastUpdated: new Date()
          },
          {
            type: 'credit',
            currentLevel: 25,
            threshold: 40,
            trend: 'decreasing',
            mitigation: 'High-grade bond allocation within acceptable limits',
            lastUpdated: new Date()
          },
          {
            type: 'liquidity',
            currentLevel: 35,
            threshold: 30,
            trend: 'increasing',
            mitigation: 'Consider increasing liquid asset allocation',
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
            <TabsTrigger value="options" className="enterprise-nav-tab">
              <Calculator className="w-4 h-4" />
              Options Valuation
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
            {/* Tier Access Information */}
            <div className="mb-6">
              <Card className="enterprise-card bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Star className="w-6 h-6 text-purple-600" />
                      <div>
                        <h3 className="font-semibold text-purple-900">Enterprise Tier Dashboard</h3>
                        <p className="text-sm text-purple-700">
                          Access to all Professional features plus Enterprise-exclusive analytics
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-purple-600 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Enterprise
                      </Badge>
                      {hasProfessionalAccess && (
                        <Badge className="bg-yellow-600 text-white">
                          <Crown className="w-3 h-3 mr-1" />
                          Professional Included
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {metrics && (
              <div className="enterprise-grid enterprise-grid-4 mb-8">
                <Card className="enterprise-card">
                  <CardContent className="enterprise-metric">
                    <span className="enterprise-metric-value">
                      {formatCurrency(metrics.totalInvestmentValue)}
                    </span>
                    <div className="enterprise-metric-label">Total Portfolio Value</div>
                    <div className="enterprise-metric-change positive">
                      {formatPercentage(metrics.portfolioGrowthRate)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="enterprise-card">
                  <CardContent className="enterprise-metric">
                    <span className="enterprise-metric-value">
                      {metrics.diversificationIndex}
                    </span>
                    <div className="enterprise-metric-label">Diversification Index</div>
                    <div className="enterprise-metric-change positive">
                      Excellent
                    </div>
                  </CardContent>
                </Card>

                <Card className="enterprise-card">
                  <CardContent className="enterprise-metric">
                    <span className="enterprise-metric-value">
                      {formatPercentage(metrics.expectedAnnualReturn)}
                    </span>
                    <div className="enterprise-metric-label">Expected Annual Return</div>
                    <div className="enterprise-metric-change positive">
                      Above Target
                    </div>
                  </CardContent>
                </Card>

                <Card className="enterprise-card">
                  <CardContent className="enterprise-metric">
                    <span className="enterprise-metric-value">
                      {metrics.riskAssessmentScore}/100
                    </span>
                    <div className="enterprise-metric-label">Risk Score</div>
                    <div className="enterprise-metric-change neutral">
                      Moderate
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                    <Button className="enterprise-button secondary w-full mt-4">
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
                    <Button className="enterprise-button secondary w-full mt-4">
                      Risk Management Tools
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Professional Features Quick Access */}
            {hasProfessionalAccess && (
              <Card className="enterprise-card mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader className="enterprise-card-header">
                  <CardTitle className="enterprise-card-title text-yellow-800">
                    <Crown className="w-5 h-5" />
                    Professional Analytics Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-yellow-700 mb-4">
                    Your Enterprise subscription includes full access to all Professional tier features.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="h-auto p-4 border-yellow-300 hover:bg-yellow-100"
                      onClick={() => setActiveTab('professional')}
                    >
                      <div className="text-center">
                        <TrendingUp className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                        <div className="font-medium">Financial Trends</div>
                        <div className="text-xs text-gray-600">Multi-year analysis</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 border-yellow-300 hover:bg-yellow-100"
                      onClick={() => setActiveTab('professional')}
                    >
                      <div className="text-center">
                        <Users className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                        <div className="font-medium">Customer Risk</div>
                        <div className="text-xs text-gray-600">Concentration analysis</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 border-yellow-300 hover:bg-yellow-100"
                      onClick={() => setActiveTab('professional')}
                    >
                      <div className="text-center">
                        <Target className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                        <div className="font-medium">Competitive</div>
                        <div className="text-xs text-gray-600">Market positioning</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tier Upgrade Prompt for Non-Enterprise Users */}
            {!hasEnterpriseAccess && (
              <Card className="enterprise-card mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <CardHeader className="enterprise-card-header">
                  <CardTitle className="enterprise-card-title text-purple-800">
                    <Star className="w-5 h-5" />
                    Unlock Enterprise Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-purple-700 mb-4">
                        Upgrade to Enterprise tier to access advanced analytics, Professional features, and strategic planning tools.
                      </p>
                      <ul className="space-y-2 text-sm text-purple-600">
                        <li className="flex items-center">
                          <Check className="w-4 h-4 mr-2" />
                          All Professional features included
                        </li>
                        <li className="flex items-center">
                          <Check className="w-4 h-4 mr-2" />
                          Multi-scenario projections
                        </li>
                        <li className="flex items-center">
                          <Check className="w-4 h-4 mr-2" />
                          Capital structure optimization
                        </li>
                        <li className="flex items-center">
                          <Check className="w-4 h-4 mr-2" />
                          Exit strategy planning
                        </li>
                      </ul>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">5.8x</div>
                      <p className="text-sm text-purple-700 mb-4">Expected ROI</p>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Star className="w-4 h-4 mr-2" />
                        Upgrade to Enterprise
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Professional Analytics Tab */}
          <TabsContent value="professional" className="enterprise-slide-up">
            <ProfessionalIntegration
              showComparison={true}
              enableTierSwitching={true}
              demoMode={!hasEnterpriseAccess}
              className="enterprise-professional-integration"
            />
          </TabsContent>

          {/* Portfolio Analysis Tab */}
          <TabsContent value="portfolio" className="enterprise-slide-up">
            <div className="space-y-6">
              <Card className="enterprise-card">
                <CardHeader className="enterprise-card-header">
                  <CardTitle className="enterprise-card-title">Portfolio Allocation Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="enterprise-chart-container">
                    <p className="text-center text-gray-500 mt-20">
                      Portfolio allocation chart will be implemented here
                    </p>
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
                      <thead>
                        <tr>
                          <th>Asset Class</th>
                          <th>Current Allocation</th>
                          <th>Target Allocation</th>
                          <th>Performance</th>
                          <th>Risk Level</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioData.map((allocation, index) => (
                          <tr key={index}>
                            <td className="font-medium">{allocation.assetClass}</td>
                            <td>{allocation.currentAllocation}%</td>
                            <td>{allocation.targetAllocation}%</td>
                            <td className={allocation.performance > 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatPercentage(allocation.performance)}
                            </td>
                            <td>
                              <Badge className={`enterprise-status ${
                                allocation.riskLevel === 'low' ? 'success' :
                                allocation.riskLevel === 'medium' ? 'warning' : 'danger'
                              }`}>
                                {allocation.riskLevel}
                              </Badge>
                            </td>
                            <td>{formatCurrency(allocation.totalValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Risk Management Tab */}
          <TabsContent value="risk" className="enterprise-slide-up">
            <div className="space-y-6">
              <Card className="enterprise-card">
                <CardHeader className="enterprise-card-header">
                  <CardTitle className="enterprise-card-title">Scenario Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scenarios.map((scenario, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{scenario.scenario}</h4>
                          <Badge className="enterprise-status info">
                            {(scenario.probability * 100).toFixed(0)}% probability
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Expected Return:</span>
                            <span className={`ml-2 font-medium ${scenario.expectedReturn > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(scenario.expectedReturn * 100)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Best Case:</span>
                            <span className="ml-2 font-medium text-green-600">
                              {formatPercentage(scenario.bestCase * 100)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Worst Case:</span>
                            <span className="ml-2 font-medium text-red-600">
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

          {/* Options Valuation Tab */}
          <TabsContent value="options" className="enterprise-slide-up">
            <Card className="enterprise-card">
              <CardHeader className="enterprise-card-header">
                <CardTitle className="enterprise-card-title">Options Portfolio Valuation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calculator className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Advanced Options Analysis
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Black-Scholes pricing models, Greeks calculations, and portfolio risk metrics will be implemented here.
                  </p>
                  <Button className="enterprise-button primary">
                    Configure Options Portfolio
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strategic Insights Tab */}
          <TabsContent value="insights" className="enterprise-slide-up">
            <div className="space-y-6">
              {insights.map((insight) => (
                <Card key={insight.id} className="enterprise-card">
                  <CardHeader className="enterprise-card-header">
                    <div className="flex justify-between items-start">
                      <CardTitle className="enterprise-card-title">{insight.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge className={`enterprise-status ${
                          insight.impact === 'high' ? 'danger' :
                          insight.impact === 'medium' ? 'warning' : 'info'
                        }`}>
                          {insight.impact} impact
                        </Badge>
                        <Badge className={`enterprise-status ${
                          insight.category === 'risk' ? 'danger' :
                          insight.category === 'opportunity' ? 'success' :
                          insight.category === 'optimization' ? 'warning' : 'info'
                        }`}>
                          {insight.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{insight.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Estimated Value:</span>
                        <div className="font-medium text-green-600">
                          {formatCurrency(insight.estimatedValue)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Timeline:</span>
                        <div className="font-medium">{insight.timeline}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Confidence:</span>
                        <div className="font-medium">{insight.confidence}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Priority:</span>
                        <div className="font-medium">#{insight.priority}</div>
                      </div>
                    </div>
                    {insight.actionRequired && (
                      <div className="mt-4 pt-4 border-t">
                        <Button className="enterprise-button primary">
                          <CheckCircle className="w-4 h-4" />
                          Take Action
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Scenarios Tab - Story 11.7 Component */}
          <TabsContent value="scenarios" className="enterprise-slide-up">
            <StrategicScenarioMatrix
              data={{
                scenarios: scenarios || [],
                baseCase: metrics?.baseCase || {},
                optimisticCase: metrics?.optimisticCase || {},
                conservativeCase: metrics?.conservativeCase || {},
                monteCarloSimulations: 10000,
                confidenceInterval: 0.95
              }}
            />
          </TabsContent>

          {/* Exit Strategy Tab - Story 11.7 Component */}
          <TabsContent value="exit" className="enterprise-slide-up">
            <ExitStrategyDashboard
              data={{
                exitTimeline: '3-5 years',
                preferredStrategies: ['strategic', 'financial'],
                currentValuation: metrics?.currentValuation || 0,
                projectedValuation: metrics?.projectedValuation || 0,
                transactionReadiness: 75,
                advisorsEngaged: ['broker', 'legal', 'tax']
              }}
            />
          </TabsContent>

          {/* Capital Structure Tab - Story 11.7 Component */}
          <TabsContent value="capital" className="enterprise-slide-up">
            <CapitalStructureOptimizer
              data={{
                currentDebtEquityRatio: 0.45,
                optimalDebtEquityRatio: 0.35,
                wacc: 8.5,
                creditRating: 'BBB+',
                debtCapacity: 5000000,
                interestCoverage: 4.2,
                debtServiceCoverage: 1.8
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnterpriseDashboard;