'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  LineChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  Info,
  Activity,
  Zap
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  Area,
  AreaChart,
  ComposedChart,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// Type definitions
interface YearlyFinancials {
  year: number;
  revenue: number;
  ebitda: number;
  cashFlow: number;
  valuation: number;
  growthRate?: number;
  margin?: number;
}

interface ProjectionAssumption {
  category: string;
  description: string;
  value: string | number;
  confidence: 'low' | 'medium' | 'high';
}

interface ValueDriver {
  name: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  currentValue: number;
  projectedValue: number;
}

interface RiskFactor {
  category: string;
  description: string;
  probability: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  mitigation?: string;
}

interface FinancialProjection {
  scenarioName: string;
  projections: YearlyFinancials[];
  assumptions: ProjectionAssumption[];
  keyDrivers: ValueDriver[];
  riskFactors: RiskFactor[];
  confidence: number;
  probability: number;
}

interface SensitivityData {
  variables: {
    name: string;
    baseValue: number;
    variations: {
      pessimistic: number;
      optimistic: number;
    };
  }[];
  scenarios: {
    name: string;
    impacts: {
      revenue: number;
      ebitda: number;
      valuation: number;
    };
  }[];
}

interface ConfidenceInterval {
  metric: 'revenue' | 'ebitda' | 'cashflow' | 'valuation';
  year: number;
  lower: number;
  upper: number;
  mean: number;
}

interface MultiScenarioProjectionData {
  baseCase: FinancialProjection;
  optimisticCase: FinancialProjection;
  conservativeCase: FinancialProjection;
  customScenarios: FinancialProjection[];
  sensitivityAnalysis: SensitivityData;
  confidenceIntervals: ConfidenceInterval[];
}

// Helper functions for financial calculations
const calculateGrowthRate = (current: number, previous: number): number => {
  return previous > 0 ? ((current - previous) / previous) * 100 : 0;
};

const calculateMargin = (ebitda: number, revenue: number): number => {
  return revenue > 0 ? (ebitda / revenue) * 100 : 0;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Projection Controls Component
interface ProjectionControlsProps {
  selectedMetric: 'revenue' | 'ebitda' | 'cashflow' | 'valuation';
  onMetricChange: (metric: 'revenue' | 'ebitda' | 'cashflow' | 'valuation') => void;
  viewType: 'line' | 'waterfall' | 'sensitivity';
  onViewTypeChange: (viewType: 'line' | 'waterfall' | 'sensitivity') => void;
}

const ProjectionControls: React.FC<ProjectionControlsProps> = ({
  selectedMetric,
  onMetricChange,
  viewType,
  onViewTypeChange,
}) => {
  const metrics = [
    { value: 'revenue' as const, label: 'Revenue', icon: DollarSign },
    { value: 'ebitda' as const, label: 'EBITDA', icon: TrendingUp },
    { value: 'cashflow' as const, label: 'Cash Flow', icon: Activity },
    { value: 'valuation' as const, label: 'Valuation', icon: Target },
  ];

  const viewTypes = [
    { value: 'line' as const, label: 'Line Chart', icon: LineChart },
    { value: 'waterfall' as const, label: 'Waterfall', icon: BarChart3 },
    { value: 'sensitivity' as const, label: 'Sensitivity', icon: Zap },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Financial Metric
        </label>
        <Select value={selectedMetric} onValueChange={onMetricChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {metrics.map((metric) => {
              const IconComponent = metric.icon;
              return (
                <SelectItem key={metric.value} value={metric.value}>
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    {metric.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          View Type
        </label>
        <Select value={viewType} onValueChange={onViewTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {viewTypes.map((view) => {
              const IconComponent = view.icon;
              return (
                <SelectItem key={view.value} value={view.value}>
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    {view.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// Multi-Scenario Line Chart Component
interface MultiScenarioLineChartProps {
  scenarios: FinancialProjection[];
  metric: 'revenue' | 'ebitda' | 'cashflow' | 'valuation';
  confidenceIntervals: ConfidenceInterval[];
}

const MultiScenarioLineChart: React.FC<MultiScenarioLineChartProps> = ({
  scenarios,
  metric,
  confidenceIntervals,
}) => {
  const chartData = useMemo(() => {
    if (!scenarios.length) return [];

    const years = scenarios[0]?.projections.map(p => p.year) || [];

    return years.map(year => {
      const dataPoint: any = { year };

      scenarios.forEach(scenario => {
        const projection = scenario.projections.find(p => p.year === year);
        if (projection) {
          dataPoint[scenario.scenarioName] = projection[metric];
        }
      });

      // Add confidence intervals if available
      const confidence = confidenceIntervals.find(ci => ci.year === year && ci.metric === metric);
      if (confidence) {
        dataPoint.confidenceLower = confidence.lower;
        dataPoint.confidenceUpper = confidence.upper;
      }

      return dataPoint;
    });
  }, [scenarios, metric, confidenceIntervals]);

  const colors = {
    'Base Case': '#2563eb',
    'Optimistic Case': '#16a34a',
    'Conservative Case': '#dc2626',
    'Custom Scenario': '#7c3aed',
  };

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#6b7280' }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#6b7280' }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), '']}
            labelFormatter={(year) => `Year ${year}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend />

          {/* Confidence interval area */}
          {chartData.some(d => d.confidenceLower && d.confidenceUpper) && (
            <Area
              dataKey="confidenceUpper"
              stroke="none"
              fill="#3b82f6"
              fillOpacity={0.1}
              stackId="confidence"
            />
          )}

          {/* Scenario lines */}
          {scenarios.map((scenario, index) => (
            <Line
              key={scenario.scenarioName}
              type="monotone"
              dataKey={scenario.scenarioName}
              stroke={colors[scenario.scenarioName as keyof typeof colors] || `hsl(${index * 60}, 70%, 50%)`}
              strokeWidth={3}
              dot={{ fill: colors[scenario.scenarioName as keyof typeof colors] || `hsl(${index * 60}, 70%, 50%)`, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[scenario.scenarioName as keyof typeof colors] || `hsl(${index * 60}, 70%, 50%)` }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Waterfall Chart Component
interface WaterfallChartProps {
  baseCase: FinancialProjection;
  scenarios: FinancialProjection[];
  metric: 'revenue' | 'ebitda' | 'cashflow' | 'valuation';
}

const WaterfallChart: React.FC<WaterfallChartProps> = ({
  baseCase,
  scenarios,
  metric,
}) => {
  const chartData = useMemo(() => {
    if (!baseCase.projections.length) return [];

    const finalYear = Math.max(...baseCase.projections.map(p => p.year));
    const baseFinalValue = baseCase.projections.find(p => p.year === finalYear)?.[metric] || 0;

    const data = [
      {
        name: 'Base Case',
        value: baseFinalValue,
        cumulative: baseFinalValue,
        fill: '#2563eb',
      }
    ];

    let cumulative = baseFinalValue;

    scenarios.forEach(scenario => {
      const scenarioFinalValue = scenario.projections.find(p => p.year === finalYear)?.[metric] || 0;
      const impact = scenarioFinalValue - baseFinalValue;
      cumulative += impact;

      data.push({
        name: scenario.scenarioName,
        value: impact,
        cumulative,
        fill: impact >= 0 ? '#16a34a' : '#dc2626',
      });
    });

    return data;
  }, [baseCase, scenarios, metric]);

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Impact']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Bar dataKey="value" name="Impact">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Sensitivity Analysis Chart Component
interface SensitivityAnalysisChartProps {
  sensitivityData: SensitivityData;
  metric: 'revenue' | 'ebitda' | 'cashflow' | 'valuation';
}

const SensitivityAnalysisChart: React.FC<SensitivityAnalysisChartProps> = ({
  sensitivityData,
  metric,
}) => {
  const chartData = useMemo(() => {
    return sensitivityData.scenarios.map(scenario => ({
      scenario: scenario.name,
      impact: scenario.impacts[metric] || 0,
      fill: scenario.impacts[metric] >= 0 ? '#16a34a' : '#dc2626',
    }));
  }, [sensitivityData, metric]);

  return (
    <div className="space-y-6">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}%`}
            />
            <YAxis
              type="category"
              dataKey="scenario"
              tick={{ fontSize: 12 }}
              width={120}
            />
            <Tooltip
              formatter={(value: number) => [`${value > 0 ? '+' : ''}${value}%`, 'Impact']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Bar dataKey="impact" name="Impact">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Key Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sensitivityData.variables.map((variable, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{variable.name}</span>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {formatPercentage(variable.variations.pessimistic)} to {formatPercentage(variable.variations.optimistic)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Base: {formatPercentage(variable.baseValue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Impact Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.scenario}</span>
                  <Badge variant={item.impact >= 0 ? "default" : "destructive"}>
                    {item.impact > 0 ? '+' : ''}{formatPercentage(item.impact)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Projection Insights Component
interface ProjectionInsightsProps {
  scenarios: FinancialProjection[];
  selectedMetric: 'revenue' | 'ebitda' | 'cashflow' | 'valuation';
}

const ProjectionInsights: React.FC<ProjectionInsightsProps> = ({
  scenarios,
  selectedMetric,
}) => {
  const insights = useMemo(() => {
    if (!scenarios.length) return [];

    const baseCase = scenarios.find(s => s.scenarioName === 'Base Case');
    const optimisticCase = scenarios.find(s => s.scenarioName === 'Optimistic Case');
    const conservativeCase = scenarios.find(s => s.scenarioName === 'Conservative Case');

    if (!baseCase) return [];

    const finalYear = Math.max(...baseCase.projections.map(p => p.year));
    const baseFinalValue = baseCase.projections.find(p => p.year === finalYear)?.[selectedMetric] || 0;
    const baseInitialValue = baseCase.projections.find(p => p.year === Math.min(...baseCase.projections.map(p => p.year)))?.[selectedMetric] || 0;
    const baseCAGR = baseInitialValue > 0 ? (Math.pow(baseFinalValue / baseInitialValue, 1 / (finalYear - Math.min(...baseCase.projections.map(p => p.year)))) - 1) * 100 : 0;

    const results = [
      {
        title: 'Base Case CAGR',
        value: formatPercentage(baseCAGR),
        description: `${selectedMetric.toUpperCase()} compound annual growth rate`,
        type: 'neutral' as const,
        icon: TrendingUp,
      }
    ];

    if (optimisticCase) {
      const optimisticFinalValue = optimisticCase.projections.find(p => p.year === finalYear)?.[selectedMetric] || 0;
      const upside = baseFinalValue > 0 ? ((optimisticFinalValue - baseFinalValue) / baseFinalValue) * 100 : 0;
      results.push({
        title: 'Upside Potential',
        value: `+${formatPercentage(upside)}`,
        description: 'Optimistic case vs base case',
        type: 'positive' as const,
        icon: TrendingUp,
      });
    }

    if (conservativeCase) {
      const conservativeFinalValue = conservativeCase.projections.find(p => p.year === finalYear)?.[selectedMetric] || 0;
      const downside = baseFinalValue > 0 ? ((conservativeFinalValue - baseFinalValue) / baseFinalValue) * 100 : 0;
      results.push({
        title: 'Downside Risk',
        value: `${formatPercentage(downside)}`,
        description: 'Conservative case vs base case',
        type: 'negative' as const,
        icon: TrendingDown,
      });
    }

    // Add key drivers
    if (baseCase.keyDrivers.length > 0) {
      const criticalDrivers = baseCase.keyDrivers.filter(d => d.impact === 'critical' || d.impact === 'high');
      if (criticalDrivers.length > 0) {
        results.push({
          title: 'Key Drivers',
          value: `${criticalDrivers.length}`,
          description: `Critical value drivers identified`,
          type: 'neutral' as const,
          icon: Target,
        });
      }
    }

    // Add risk assessment
    if (baseCase.riskFactors.length > 0) {
      const highRisks = baseCase.riskFactors.filter(r => r.impact === 'critical' || r.impact === 'high');
      if (highRisks.length > 0) {
        results.push({
          title: 'Risk Factors',
          value: `${highRisks.length}`,
          description: `High-impact risks to monitor`,
          type: 'warning' as const,
          icon: AlertTriangle,
        });
      }
    }

    return results;
  }, [scenarios, selectedMetric]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Info className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Projection Insights</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {insights.map((insight, index) => {
          const IconComponent = insight.icon;
          const colorClasses = {
            positive: 'text-green-600 bg-green-50 border-green-200',
            negative: 'text-red-600 bg-red-50 border-red-200',
            warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
            neutral: 'text-blue-600 bg-blue-50 border-blue-200',
          };

          return (
            <Card key={index} className={`border ${colorClasses[insight.type]}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className="h-4 w-4" />
                  <span className="text-sm font-medium">{insight.title}</span>
                </div>
                <div className="text-lg font-bold mb-1">{insight.value}</div>
                <div className="text-xs text-gray-600">{insight.description}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Key Drivers Detail */}
      {scenarios.length > 0 && scenarios[0].keyDrivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Key Value Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scenarios[0].keyDrivers
                .filter(driver => driver.impact === 'critical' || driver.impact === 'high')
                .slice(0, 3)
                .map((driver, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm">{driver.name}</div>
                      <div className="text-xs text-gray-600">{driver.description}</div>
                    </div>
                    <Badge variant={driver.impact === 'critical' ? 'destructive' : 'default'}>
                      {driver.impact}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Main Component
interface MultiScenarioProjectionsProps {
  data: MultiScenarioProjectionData;
}

const MultiScenarioProjections: React.FC<MultiScenarioProjectionsProps> = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'ebitda' | 'cashflow' | 'valuation'>('revenue');
  const [viewType, setViewType] = useState<'line' | 'waterfall' | 'sensitivity'>('line');

  const allScenarios = useMemo(() => {
    return [data.baseCase, data.optimisticCase, data.conservativeCase, ...data.customScenarios];
  }, [data]);

  return (
    <Card className="border-tier-enterprise col-span-3">
      <CardHeader>
        <CardTitle className="text-tier-enterprise flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Multi-Scenario Financial Projections
        </CardTitle>
        <CardDescription>
          5-year financial projections across multiple strategic scenarios with sensitivity analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <ProjectionControls
            selectedMetric={selectedMetric}
            onMetricChange={setSelectedMetric}
            viewType={viewType}
            onViewTypeChange={setViewType}
          />

          {viewType === 'line' && (
            <MultiScenarioLineChart
              scenarios={allScenarios}
              metric={selectedMetric}
              confidenceIntervals={data.confidenceIntervals}
            />
          )}

          {viewType === 'waterfall' && (
            <WaterfallChart
              baseCase={data.baseCase}
              scenarios={data.customScenarios}
              metric={selectedMetric}
            />
          )}

          {viewType === 'sensitivity' && (
            <SensitivityAnalysisChart
              sensitivityData={data.sensitivityAnalysis}
              metric={selectedMetric}
            />
          )}

          <ProjectionInsights
            scenarios={[data.baseCase, data.optimisticCase, data.conservativeCase]}
            selectedMetric={selectedMetric}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiScenarioProjections;
export type {
  MultiScenarioProjectionData,
  FinancialProjection,
  YearlyFinancials,
  SensitivityData,
  ConfidenceInterval
};