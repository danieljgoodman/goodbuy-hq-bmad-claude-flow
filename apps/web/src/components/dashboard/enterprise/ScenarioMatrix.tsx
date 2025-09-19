"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Target, BarChart3, AlertTriangle, CheckCircle, Info, Zap, DollarSign, TrendingDown, Activity, PieChart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ComposedChart, Area, AreaChart, ResponsiveContainer, ScatterChart, Scatter, Cell, PieChart as RechartsPieChart } from 'recharts';
import type {
  StrategicScenarioData,
  StrategicScenario,
  ScenarioAssumption,
  YearlyProjection,
  ScenarioMetric,
  RiskAnalysis,
  RiskFactor,
  SensitivityData,
  SensitivityVariable,
  SensitivityResult,
  MonteCarloResults,
  ConfidenceInterval,
  DistributionPoint
} from '@/types/enterprise-dashboard';

// Scenario Selection Controls Component
const ScenarioSelectionControls: React.FC<{
  scenarios: StrategicScenario[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
}> = ({ scenarios, selected, onSelectionChange }) => {
  const handleScenarioToggle = (scenarioId: string) => {
    const newSelected = selected.includes(scenarioId)
      ? selected.filter(id => id !== scenarioId)
      : [...selected, scenarioId].slice(0, 5); // Max 5 scenarios
    onSelectionChange(newSelected);
  };

  const selectAll = () => {
    onSelectionChange(scenarios.slice(0, 5).map(s => s.id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Select Scenarios to Compare</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              selected.includes(scenario.id)
                ? 'border-tier-enterprise bg-tier-enterprise bg-opacity-5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleScenarioToggle(scenario.id)}
          >
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selected.includes(scenario.id)}
                onChange={() => handleScenarioToggle(scenario.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {scenario.name}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge
                    variant={scenario.riskLevel === 'low' ? 'default' : scenario.riskLevel === 'medium' ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {scenario.riskLevel} risk
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {scenario.expectedROI.toFixed(1)}% ROI
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500">
        {selected.length} of 5 scenarios selected
      </div>
    </div>
  );
};

// Scenario Side-by-Side View Component
const ScenarioSideBySideView: React.FC<{
  scenarios: StrategicScenario[];
}> = ({ scenarios }) => {
  if (!scenarios.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Select scenarios to compare</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(scenarios.length, 3)}, 1fr)` }}>
      {scenarios.slice(0, 3).map((scenario) => (
        <Card key={scenario.id} className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{scenario.name}</CardTitle>
              <Badge
                variant={scenario.riskLevel === 'low' ? 'default' : scenario.riskLevel === 'medium' ? 'secondary' : 'destructive'}
              >
                {scenario.riskLevel} risk
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Key Metrics */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Expected ROI</span>
                <span className="text-sm font-medium text-green-600">
                  {scenario.expectedROI.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Investment Required</span>
                <span className="text-sm font-medium">
                  ${(scenario.investmentRequired / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Success Probability</span>
                <span className="text-sm font-medium">
                  {scenario.probabilityOfSuccess}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Timeline</span>
                <span className="text-sm font-medium">
                  {scenario.timeline} months
                </span>
              </div>
            </div>

            <Separator />

            {/* 5-Year Projection Chart */}
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scenario.projections}>
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="valuation"
                    stroke="#2c1810"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Key Drivers */}
            <div>
              <h5 className="text-xs font-medium text-gray-900 mb-2">Key Drivers</h5>
              <div className="flex flex-wrap gap-1">
                {scenario.keyDrivers.slice(0, 3).map((driver, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {driver}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Risk Factors */}
            <div>
              <h5 className="text-xs font-medium text-gray-900 mb-2">Risk Factors</h5>
              <div className="flex flex-wrap gap-1">
                {scenario.riskFactors.slice(0, 2).map((risk, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {risk}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Scenario Overlay Chart Component
const ScenarioOverlayChart: React.FC<{
  scenarios: StrategicScenario[];
}> = ({ scenarios }) => {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'ebitda' | 'cashFlow' | 'valuation'>('valuation');

  const colors = ['#2c1810', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

  const chartData = useMemo(() => {
    if (!scenarios.length) return [];

    const years = scenarios[0]?.projections?.map(p => p.year) || [];
    return years.map(year => {
      const dataPoint: any = { year };
      scenarios.forEach((scenario, index) => {
        const projection = scenario.projections.find(p => p.year === year);
        if (projection) {
          dataPoint[scenario.name] = projection[selectedMetric];
        }
      });
      return dataPoint;
    });
  }, [scenarios, selectedMetric]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="ebitda">EBITDA</SelectItem>
            <SelectItem value="cashFlow">Cash Flow</SelectItem>
            <SelectItem value="valuation">Valuation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip
              formatter={(value: any) => [`$${(value / 1000000).toFixed(1)}M`, '']}
              labelFormatter={(label) => `Year ${label}`}
            />
            <Legend />
            {scenarios.map((scenario, index) => (
              <Line
                key={scenario.id}
                type="monotone"
                dataKey={scenario.name}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Scenario Comparison Table Component
const ScenarioComparisonTable: React.FC<{
  scenarios: StrategicScenario[];
  metrics: ScenarioMetric[];
}> = ({ scenarios, metrics }) => {
  if (!scenarios.length) return null;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Metric</TableHead>
            {scenarios.map(scenario => (
              <TableHead key={scenario.id} className="text-center">
                {scenario.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Expected ROI</TableCell>
            {scenarios.map(scenario => (
              <TableCell key={scenario.id} className="text-center">
                <span className="text-green-600 font-medium">
                  {scenario.expectedROI.toFixed(1)}%
                </span>
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Investment Required</TableCell>
            {scenarios.map(scenario => (
              <TableCell key={scenario.id} className="text-center">
                ${(scenario.investmentRequired / 1000000).toFixed(1)}M
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Risk Level</TableCell>
            {scenarios.map(scenario => (
              <TableCell key={scenario.id} className="text-center">
                <Badge
                  variant={scenario.riskLevel === 'low' ? 'default' : scenario.riskLevel === 'medium' ? 'secondary' : 'destructive'}
                >
                  {scenario.riskLevel}
                </Badge>
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Success Probability</TableCell>
            {scenarios.map(scenario => (
              <TableCell key={scenario.id} className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <Progress value={scenario.probabilityOfSuccess} className="w-16 h-2" />
                  <span className="text-sm">{scenario.probabilityOfSuccess}%</span>
                </div>
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Timeline (months)</TableCell>
            {scenarios.map(scenario => (
              <TableCell key={scenario.id} className="text-center">
                {scenario.timeline}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Valuation Impact</TableCell>
            {scenarios.map(scenario => (
              <TableCell key={scenario.id} className="text-center">
                ${(scenario.valuationImpact / 1000000).toFixed(1)}M
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

// Strategic Recommendations Component
const StrategicRecommendations: React.FC<{
  recommendedPath: string;
  riskAssessment: RiskAnalysis;
  scenarios?: StrategicScenario[];
}> = ({ recommendedPath, riskAssessment, scenarios = [] }) => {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <CheckCircle className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-900">Recommended Strategic Path</h4>
        </div>
        <p className="text-blue-800">{recommendedPath}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span>Risk Assessment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Risk</span>
                <Badge
                  variant={riskAssessment.overallRisk === 'low' ? 'default' : riskAssessment.overallRisk === 'medium' ? 'secondary' : 'destructive'}
                >
                  {riskAssessment.overallRisk}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confidence Level</span>
                <span className="text-sm font-medium">
                  {riskAssessment.confidenceLevel}%
                </span>
              </div>
              <div>
                <h5 className="text-xs font-medium text-gray-900 mb-2">Key Risk Factors</h5>
                <div className="space-y-1">
                  {riskAssessment.riskFactors.slice(0, 3).map((factor, index) => (
                    <div key={index} className="text-xs text-gray-600">
                      • {factor.factor}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Zap className="h-4 w-4 text-green-600" />
              <span>Mitigation Strategies</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskAssessment.mitigationStrategies.slice(0, 4).map((strategy, index) => (
                <div key={index} className="text-xs text-gray-600">
                  • {strategy}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Sensitivity Analysis Component
const SensitivityAnalysisView: React.FC<{
  sensitivityData: SensitivityData;
}> = ({ sensitivityData }) => {
  const [selectedVariable, setSelectedVariable] = useState(sensitivityData.variables[0]?.name || '');

  const filteredResults = sensitivityData.results.filter(r => r.variable === selectedVariable);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Sensitivity Analysis</h4>
        <Select value={selectedVariable} onValueChange={setSelectedVariable}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select variable" />
          </SelectTrigger>
          <SelectContent>
            {sensitivityData.variables.map(variable => (
              <SelectItem key={variable.name} value={variable.name}>
                {variable.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredResults}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="scenario" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="impact" fill="#2c1810" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Monte Carlo Simulation Component
const MonteCarloSimulationView: React.FC<{
  monteCarloResults?: MonteCarloResults;
}> = ({ monteCarloResults }) => {
  if (!monteCarloResults) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Monte Carlo simulation not available</p>
        <Button variant="outline" className="mt-4" size="sm">
          Run Simulation
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${(monteCarloResults.expectedValue / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-gray-500">Expected Value</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${(monteCarloResults.standardDeviation / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-gray-500">Standard Deviation</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                ${(monteCarloResults.valueAtRisk / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-gray-500">Value at Risk (95%)</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monteCarloResults.distribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="value" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="probability"
              stroke="#2c1810"
              fill="#2c1810"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h5 className="text-sm font-medium mb-2">Confidence Intervals</h5>
        <div className="space-y-2">
          {monteCarloResults.confidenceIntervals.map(interval => (
            <div key={interval.level} className="flex items-center justify-between text-sm">
              <span>{interval.level}% Confidence</span>
              <span>
                ${(interval.lower / 1000000).toFixed(1)}M - ${(interval.upper / 1000000).toFixed(1)}M
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Strategic Scenario Matrix Component
const ScenarioMatrix: React.FC<{ data: StrategicScenarioData }> = ({ data }) => {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [comparisonView, setComparisonView] = useState<'side-by-side' | 'overlay' | 'table'>('side-by-side');

  // Initialize with first 3 scenarios
  React.useEffect(() => {
    if (data.scenarios.length > 0 && selectedScenarios.length === 0) {
      setSelectedScenarios(data.scenarios.slice(0, 3).map(s => s.id));
    }
  }, [data.scenarios, selectedScenarios.length]);

  const selectedScenarioData = data.scenarios.filter(s => selectedScenarios.includes(s.id));

  return (
    <Card className="border-tier-enterprise col-span-2">
      <CardHeader>
        <CardTitle className="text-tier-enterprise flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Strategic Scenario Comparison Matrix
        </CardTitle>
        <CardDescription>
          Comprehensive analysis of strategic paths with risk-adjusted ROI projections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <ScenarioSelectionControls
            scenarios={data.scenarios}
            selected={selectedScenarios}
            onSelectionChange={setSelectedScenarios}
          />

          <Tabs value={comparisonView} onValueChange={(v) => setComparisonView(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
              <TabsTrigger value="overlay">Overlay View</TabsTrigger>
              <TabsTrigger value="table">Comparison Table</TabsTrigger>
              <TabsTrigger value="analysis">Advanced Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="side-by-side" className="space-y-4">
              <ScenarioSideBySideView scenarios={selectedScenarioData} />
            </TabsContent>

            <TabsContent value="overlay" className="space-y-4">
              <ScenarioOverlayChart scenarios={selectedScenarioData} />
            </TabsContent>

            <TabsContent value="table" className="space-y-4">
              <ScenarioComparisonTable
                scenarios={selectedScenarioData}
                metrics={data.comparisonMetrics}
              />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Sensitivity Analysis</h4>
                  <SensitivityAnalysisView sensitivityData={data.sensitivityAnalysis} />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-4">Monte Carlo Simulation</h4>
                  <MonteCarloSimulationView monteCarloResults={data.monteCarloSimulation} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <StrategicRecommendations
            recommendedPath={data.recommendedPath}
            riskAssessment={data.riskAssessment}
            scenarios={selectedScenarioData}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ScenarioMatrix;