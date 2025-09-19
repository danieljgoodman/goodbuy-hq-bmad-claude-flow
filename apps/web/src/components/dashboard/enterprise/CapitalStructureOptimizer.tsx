'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart, TrendingUp, Target, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react'
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts'

// Interfaces based on story 11.7 specification
interface CapitalStructure {
  debt: number;
  equity: number;
  debtToEquity: number;
  weightedAverageCostOfCapital: number;
  debtServiceCoverage: number;
  creditRating: string;
}

interface CostAnalysis {
  costOfDebt: number;
  costOfEquity: number;
  wacc: number;
  taxRate: number;
  riskFreeRate: number;
  marketRiskPremium: number;
  beta: number;
}

interface LeverageMetrics {
  debtToEquityRatio: number;
  debtToAssetRatio: number;
  interestCoverageRatio: number;
  debtServiceCoverageRatio: number;
  timesInterestEarned: number;
  cashCoverageRatio: number;
}

interface CapitalScenario {
  name: string;
  debtRatio: number;
  wacc: number;
  creditRating: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface CapitalStructureData {
  currentStructure: CapitalStructure;
  optimizedStructure: CapitalStructure;
  scenarios: CapitalScenario[];
  costOfCapital: CostAnalysis;
  leverageAnalysis: LeverageMetrics;
}

// Optimization Controls Subcomponent
interface OptimizationControlsProps {
  targetRatio: number;
  onRatioChange: (ratio: number) => void;
  goal: 'wacc' | 'coverage' | 'rating';
  onGoalChange: (goal: 'wacc' | 'coverage' | 'rating') => void;
}

const OptimizationControls: React.FC<OptimizationControlsProps> = ({
  targetRatio,
  onRatioChange,
  goal,
  onGoalChange
}) => {
  return (
    <Card className="border-tier-enterprise-light">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-4 w-4 text-tier-enterprise" />
          Optimization Controls
        </CardTitle>
        <CardDescription>
          Adjust target debt-to-equity ratio and optimization goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Target Debt-to-Equity Ratio</label>
            <span className="text-sm font-bold text-tier-enterprise">{targetRatio.toFixed(2)}</span>
          </div>
          <Slider
            value={[targetRatio]}
            onValueChange={(value) => onRatioChange(value[0])}
            max={2.0}
            min={0.1}
            step={0.05}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Conservative (0.1)</span>
            <span>Moderate (1.0)</span>
            <span>Aggressive (2.0)</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Optimization Goal</label>
          <Select value={goal} onValueChange={(value: 'wacc' | 'coverage' | 'rating') => onGoalChange(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select optimization goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wacc">Minimize WACC</SelectItem>
              <SelectItem value="coverage">Maximize Coverage Ratio</SelectItem>
              <SelectItem value="rating">Improve Credit Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={goal === 'wacc' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onGoalChange('wacc')}
            className="text-xs"
          >
            Min WACC
          </Button>
          <Button
            variant={goal === 'coverage' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onGoalChange('coverage')}
            className="text-xs"
          >
            Max Coverage
          </Button>
          <Button
            variant={goal === 'rating' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onGoalChange('rating')}
            className="text-xs"
          >
            Improve Rating
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Capital Structure Chart Subcomponent
interface CapitalStructureChartProps {
  current: CapitalStructure;
  optimized: CapitalStructure;
  target: number;
}

const CapitalStructureChart: React.FC<CapitalStructureChartProps> = ({
  current,
  optimized,
  target
}) => {
  const chartData = [
    {
      name: 'Current',
      debt: current.debt,
      equity: current.equity,
      debtRatio: current.debtToEquity
    },
    {
      name: 'Optimized',
      debt: optimized.debt,
      equity: optimized.equity,
      debtRatio: optimized.debtToEquity
    },
    {
      name: 'Target',
      debt: target * 100 / (1 + target),
      equity: 100 / (1 + target),
      debtRatio: target
    }
  ];

  const pieData = [
    { name: 'Debt', value: current.debt, color: '#dc2626' },
    { name: 'Equity', value: current.equity, color: '#059669' }
  ];

  const optimizedPieData = [
    { name: 'Debt', value: optimized.debt, color: '#dc2626' },
    { name: 'Equity', value: optimized.equity, color: '#059669' }
  ];

  return (
    <Card className="border-tier-enterprise-light">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PieChart className="h-4 w-4 text-tier-enterprise" />
          Capital Structure Comparison
        </CardTitle>
        <CardDescription>
          Current vs optimized capital structure visualization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Structure Chart</TabsTrigger>
            <TabsTrigger value="comparison">Pie Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
                />
                <Legend />
                <Bar dataKey="debt" fill="#dc2626" name="Debt %" />
                <Bar dataKey="equity" fill="#059669" name="Equity %" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2 text-center">Current Structure</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <RechartsPieChart data={pieData}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPieChart>
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 text-center">Optimized Structure</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <RechartsPieChart data={optimizedPieData}>
                      {optimizedPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPieChart>
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Cost of Capital Analysis Subcomponent
interface CostOfCapitalAnalysisProps {
  costAnalysis: CostAnalysis;
  targetRatio: number;
}

const CostOfCapitalAnalysis: React.FC<CostOfCapitalAnalysisProps> = ({
  costAnalysis,
  targetRatio
}) => {
  // Calculate target WACC based on target ratio
  const calculateTargetWACC = (targetDebtRatio: number) => {
    const weightDebt = targetDebtRatio / (1 + targetDebtRatio);
    const weightEquity = 1 / (1 + targetDebtRatio);
    return (costAnalysis.costOfDebt * (1 - costAnalysis.taxRate) * weightDebt) +
           (costAnalysis.costOfEquity * weightEquity);
  };

  const targetWACC = calculateTargetWACC(targetRatio);

  const waccData = [
    { component: 'Cost of Debt', current: costAnalysis.costOfDebt, target: costAnalysis.costOfDebt },
    { component: 'Cost of Equity', current: costAnalysis.costOfEquity, target: costAnalysis.costOfEquity },
    { component: 'WACC', current: costAnalysis.wacc, target: targetWACC }
  ];

  return (
    <Card className="border-tier-enterprise-light">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-tier-enterprise" />
          Cost of Capital Analysis
        </CardTitle>
        <CardDescription>
          Weighted Average Cost of Capital (WACC) optimization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Current WACC:</span>
              <span className="font-bold text-lg">{(costAnalysis.wacc * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Target WACC:</span>
              <span className="font-bold text-lg text-tier-enterprise">{(targetWACC * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Potential Savings:</span>
              <span className={`font-bold ${(costAnalysis.wacc - targetWACC) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {((costAnalysis.wacc - targetWACC) * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Cost of Debt:</span>
              <span className="font-medium">{(costAnalysis.costOfDebt * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Cost of Equity:</span>
              <span className="font-medium">{(costAnalysis.costOfEquity * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Tax Shield:</span>
              <span className="font-medium">{(costAnalysis.taxRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">WACC Components</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={waccData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="component" />
              <YAxis />
              <Tooltip formatter={(value) => `${(Number(value) * 100).toFixed(2)}%`} />
              <Legend />
              <Bar dataKey="current" fill="#374151" name="Current" />
              <Bar dataKey="target" fill="#2c1810" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Leverage Metrics Table Subcomponent
interface LeverageMetricsTableProps {
  metrics: LeverageMetrics;
}

const LeverageMetricsTable: React.FC<LeverageMetricsTableProps> = ({ metrics }) => {
  const getStatusIcon = (value: number, threshold: number, higher_is_better = true) => {
    const isGood = higher_is_better ? value >= threshold : value <= threshold;
    return isGood ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-600" />
    );
  };

  const leverageData = [
    {
      metric: 'Debt-to-Equity Ratio',
      value: metrics.debtToEquityRatio,
      benchmark: 1.0,
      format: 'ratio',
      higherIsBetter: false,
      description: 'Total debt relative to equity'
    },
    {
      metric: 'Debt-to-Asset Ratio',
      value: metrics.debtToAssetRatio,
      benchmark: 0.4,
      format: 'percentage',
      higherIsBetter: false,
      description: 'Total debt as percentage of assets'
    },
    {
      metric: 'Interest Coverage',
      value: metrics.interestCoverageRatio,
      benchmark: 2.5,
      format: 'ratio',
      higherIsBetter: true,
      description: 'Ability to pay interest expenses'
    },
    {
      metric: 'Debt Service Coverage',
      value: metrics.debtServiceCoverageRatio,
      benchmark: 1.25,
      format: 'ratio',
      higherIsBetter: true,
      description: 'Ability to cover debt payments'
    },
    {
      metric: 'Times Interest Earned',
      value: metrics.timesInterestEarned,
      benchmark: 2.0,
      format: 'ratio',
      higherIsBetter: true,
      description: 'Earnings coverage of interest'
    },
    {
      metric: 'Cash Coverage Ratio',
      value: metrics.cashCoverageRatio,
      benchmark: 1.5,
      format: 'ratio',
      higherIsBetter: true,
      description: 'Cash available for debt service'
    }
  ];

  return (
    <Card className="border-tier-enterprise-light">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-tier-enterprise" />
          Leverage Metrics Dashboard
        </CardTitle>
        <CardDescription>
          Comprehensive debt service coverage and leverage analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium">Metric</th>
                <th className="text-right py-2 px-3 font-medium">Current</th>
                <th className="text-right py-2 px-3 font-medium">Benchmark</th>
                <th className="text-center py-2 px-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {leverageData.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <div>
                      <div className="font-medium text-sm">{item.metric}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-medium">
                    {item.format === 'percentage'
                      ? `${(item.value * 100).toFixed(1)}%`
                      : item.value.toFixed(2)
                    }
                  </td>
                  <td className="py-3 px-3 text-right text-gray-600">
                    {item.format === 'percentage'
                      ? `${(item.benchmark * 100).toFixed(1)}%`
                      : item.benchmark.toFixed(2)
                    }
                  </td>
                  <td className="py-3 px-3 text-center">
                    {getStatusIcon(item.value, item.benchmark, item.higherIsBetter)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// Capital Optimization Recommendations Subcomponent
interface CapitalOptimizationRecommendationsProps {
  currentStructure: CapitalStructure;
  optimizedStructure: CapitalStructure;
}

const CapitalOptimizationRecommendations: React.FC<CapitalOptimizationRecommendationsProps> = ({
  currentStructure,
  optimizedStructure
}) => {
  const getRecommendations = () => {
    const recommendations = [];

    if (optimizedStructure.debtToEquity < currentStructure.debtToEquity) {
      recommendations.push({
        type: 'debt_reduction',
        title: 'Reduce Debt Leverage',
        description: `Consider reducing debt-to-equity ratio from ${currentStructure.debtToEquity.toFixed(2)} to ${optimizedStructure.debtToEquity.toFixed(2)}`,
        impact: 'high',
        timeframe: '6-12 months',
        actions: ['Pay down high-cost debt', 'Retain earnings for debt reduction', 'Consider equity financing']
      });
    } else if (optimizedStructure.debtToEquity > currentStructure.debtToEquity) {
      recommendations.push({
        type: 'leverage_increase',
        title: 'Optimize Debt Utilization',
        description: `Consider increasing leverage to optimize WACC from ${(currentStructure.weightedAverageCostOfCapital * 100).toFixed(2)}% to ${(optimizedStructure.weightedAverageCostOfCapital * 100).toFixed(2)}%`,
        impact: 'medium',
        timeframe: '3-6 months',
        actions: ['Evaluate low-cost debt options', 'Refinance existing debt', 'Consider strategic debt for growth']
      });
    }

    if (currentStructure.creditRating !== optimizedStructure.creditRating) {
      recommendations.push({
        type: 'credit_improvement',
        title: 'Improve Credit Profile',
        description: `Target credit rating improvement from ${currentStructure.creditRating} to ${optimizedStructure.creditRating}`,
        impact: 'high',
        timeframe: '12-18 months',
        actions: ['Improve debt service coverage', 'Strengthen balance sheet', 'Enhance financial reporting']
      });
    }

    if (optimizedStructure.debtServiceCoverage > currentStructure.debtServiceCoverage * 1.2) {
      recommendations.push({
        type: 'coverage_optimization',
        title: 'Enhance Debt Service Coverage',
        description: `Improve coverage ratio from ${currentStructure.debtServiceCoverage.toFixed(2)} to ${optimizedStructure.debtServiceCoverage.toFixed(2)}`,
        impact: 'medium',
        timeframe: '6-9 months',
        actions: ['Increase operational cash flow', 'Optimize working capital', 'Reduce non-essential expenses']
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  const getImpactBadge = (impact: string) => {
    const variants = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return variants[impact as keyof typeof variants] || variants.medium;
  };

  return (
    <Card className="border-tier-enterprise-light">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-4 w-4 text-tier-enterprise" />
          Strategic Optimization Recommendations
        </CardTitle>
        <CardDescription>
          Action-oriented guidance for capital structure optimization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <p className="text-lg font-medium">Optimal Structure Achieved</p>
            <p className="text-sm">Your current capital structure is well-optimized.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-lg">{rec.title}</h4>
                  <div className="flex gap-2">
                    <Badge className={getImpactBadge(rec.impact)}>
                      {rec.impact.toUpperCase()} Impact
                    </Badge>
                    <Badge variant="outline">{rec.timeframe}</Badge>
                  </div>
                </div>

                <p className="text-gray-700 mb-3">{rec.description}</p>

                <div>
                  <h5 className="font-medium text-sm mb-2">Recommended Actions:</h5>
                  <ul className="list-disc list-inside space-y-1">
                    {rec.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="text-sm text-gray-600">{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main Capital Structure Optimizer Component
interface CapitalStructureOptimizerProps {
  data: CapitalStructureData;
}

const CapitalStructureOptimizer: React.FC<CapitalStructureOptimizerProps> = ({ data }) => {
  const [targetDebtRatio, setTargetDebtRatio] = useState(data.currentStructure.debtToEquity);
  const [optimizationGoal, setOptimizationGoal] = useState<'wacc' | 'coverage' | 'rating'>('wacc');

  return (
    <Card className="border-tier-enterprise">
      <CardHeader>
        <CardTitle className="text-tier-enterprise flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Capital Structure Optimization
        </CardTitle>
        <CardDescription>
          Optimize debt-to-equity ratio for minimum cost of capital and maximum enterprise value
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <OptimizationControls
            targetRatio={targetDebtRatio}
            onRatioChange={setTargetDebtRatio}
            goal={optimizationGoal}
            onGoalChange={setOptimizationGoal}
          />

          <div className="grid grid-cols-2 gap-6">
            <CapitalStructureChart
              current={data.currentStructure}
              optimized={data.optimizedStructure}
              target={targetDebtRatio}
            />

            <CostOfCapitalAnalysis
              costAnalysis={data.costOfCapital}
              targetRatio={targetDebtRatio}
            />
          </div>

          <LeverageMetricsTable metrics={data.leverageAnalysis} />

          <CapitalOptimizationRecommendations
            currentStructure={data.currentStructure}
            optimizedStructure={data.optimizedStructure}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CapitalStructureOptimizer;
export type { CapitalStructureData, CapitalStructure, CostAnalysis, LeverageMetrics, CapitalScenario };