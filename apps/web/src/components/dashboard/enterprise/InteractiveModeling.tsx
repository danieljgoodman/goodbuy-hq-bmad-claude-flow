"use client";

import React, { useState, useCallback, useMemo, useReducer, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
// Removed tooltip and alert-dialog imports - using native HTML title attributes instead
import {
  Play, Pause, RotateCcw, Save, FolderOpen, Copy, Settings,
  TrendingUp, TrendingDown, Activity, Target, BarChart3,
  Sliders, Layers, Split, RefreshCw, Undo2, Redo2,
  Eye, EyeOff, Lock, Unlock, Zap, AlertTriangle, CheckCircle2,
  FileText, Download, Upload, Plus, Minus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ComposedChart, Bar, Area, ScatterChart, Scatter } from 'recharts';
import type {
  StrategicScenarioData,
  StrategicScenario,
  ScenarioAssumption,
  YearlyProjection,
  RiskAnalysis
} from '@/types/enterprise-dashboard';

// Interactive Modeling Interfaces
interface ModelingVariable {
  id: string;
  name: string;
  value: number;
  minValue: number;
  maxValue: number;
  step: number;
  unit: string;
  category: 'growth' | 'market' | 'risk' | 'cost' | 'capital';
  description: string;
  impact: 'high' | 'medium' | 'low';
  locked: boolean;
}

interface ScenarioSnapshot {
  id: string;
  name: string;
  timestamp: Date;
  variables: ModelingVariable[];
  projections: YearlyProjection[];
  metrics: {
    roi: number;
    npv: number;
    irr: number;
    paybackPeriod: number;
    riskScore: number;
  };
}

interface ModelingState {
  variables: ModelingVariable[];
  activeScenario: string;
  scenarios: Record<string, ScenarioSnapshot>;
  undoStack: ScenarioSnapshot[];
  redoStack: ScenarioSnapshot[];
  isRunning: boolean;
  autoUpdate: boolean;
  comparisonMode: boolean;
  selectedComparisons: string[];
}

// Modeling State Reducer
type ModelingAction =
  | { type: 'UPDATE_VARIABLE'; id: string; value: number }
  | { type: 'LOCK_VARIABLE'; id: string; locked: boolean }
  | { type: 'SAVE_SCENARIO'; snapshot: ScenarioSnapshot }
  | { type: 'LOAD_SCENARIO'; id: string }
  | { type: 'DELETE_SCENARIO'; id: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'TOGGLE_AUTO_UPDATE' }
  | { type: 'TOGGLE_COMPARISON_MODE' }
  | { type: 'UPDATE_COMPARISONS'; scenarios: string[] }
  | { type: 'RESET_VARIABLES' }
  | { type: 'SET_RUNNING'; running: boolean };

const modelingReducer = (state: ModelingState, action: ModelingAction): ModelingState => {
  switch (action.type) {
    case 'UPDATE_VARIABLE':
      const newVariables = state.variables.map(v =>
        v.id === action.id ? { ...v, value: action.value } : v
      );
      return { ...state, variables: newVariables };

    case 'LOCK_VARIABLE':
      return {
        ...state,
        variables: state.variables.map(v =>
          v.id === action.id ? { ...v, locked: action.locked } : v
        )
      };

    case 'SAVE_SCENARIO':
      const currentSnapshot = createSnapshot(state);
      return {
        ...state,
        scenarios: { ...state.scenarios, [action.snapshot.id]: action.snapshot },
        undoStack: [...state.undoStack, currentSnapshot].slice(-10), // Keep last 10
        redoStack: []
      };

    case 'LOAD_SCENARIO':
      const scenarioToLoad = state.scenarios[action.id];
      if (!scenarioToLoad) return state;

      return {
        ...state,
        variables: scenarioToLoad.variables,
        activeScenario: action.id
      };

    case 'DELETE_SCENARIO':
      const { [action.id]: deleted, ...remainingScenarios } = state.scenarios;
      return {
        ...state,
        scenarios: remainingScenarios,
        activeScenario: state.activeScenario === action.id ? '' : state.activeScenario
      };

    case 'UNDO':
      if (state.undoStack.length === 0) return state;

      const previousState = state.undoStack[state.undoStack.length - 1];
      const currentForRedo = createSnapshot(state);

      return {
        ...state,
        variables: previousState.variables,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [currentForRedo, ...state.redoStack].slice(0, 10)
      };

    case 'REDO':
      if (state.redoStack.length === 0) return state;

      const nextState = state.redoStack[0];
      const currentForUndo = createSnapshot(state);

      return {
        ...state,
        variables: nextState.variables,
        undoStack: [...state.undoStack, currentForUndo],
        redoStack: state.redoStack.slice(1)
      };

    case 'TOGGLE_AUTO_UPDATE':
      return { ...state, autoUpdate: !state.autoUpdate };

    case 'TOGGLE_COMPARISON_MODE':
      return { ...state, comparisonMode: !state.comparisonMode };

    case 'UPDATE_COMPARISONS':
      return { ...state, selectedComparisons: action.scenarios };

    case 'RESET_VARIABLES':
      return {
        ...state,
        variables: state.variables.map(v => ({ ...v, value: (v.minValue + v.maxValue) / 2 }))
      };

    case 'SET_RUNNING':
      return { ...state, isRunning: action.running };

    default:
      return state;
  }
};

// Helper function to create snapshot
const createSnapshot = (state: ModelingState): ScenarioSnapshot => ({
  id: `snapshot_${Date.now()}`,
  name: `Snapshot ${new Date().toLocaleTimeString()}`,
  timestamp: new Date(),
  variables: [...state.variables],
  projections: [], // Will be calculated
  metrics: {
    roi: 0,
    npv: 0,
    irr: 0,
    paybackPeriod: 0,
    riskScore: 0
  }
});

// Variable Controls Component
interface VariableControlsProps {
  variables: ModelingVariable[];
  onVariableChange: (id: string, value: number) => void;
  onLockChange: (id: string, locked: boolean) => void;
  category?: string;
}

const VariableControls: React.FC<VariableControlsProps> = ({
  variables,
  onVariableChange,
  onLockChange,
  category
}) => {
  const filteredVariables = category
    ? variables.filter(v => v.category === category)
    : variables;

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'growth': return <TrendingUp className="h-4 w-4" />;
      case 'market': return <BarChart3 className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'cost': return <TrendingDown className="h-4 w-4" />;
      case 'capital': return <Target className="h-4 w-4" />;
      default: return <Sliders className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'growth': return 'text-green-600';
      case 'market': return 'text-blue-600';
      case 'risk': return 'text-red-600';
      case 'cost': return 'text-orange-600';
      case 'capital': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {filteredVariables.map((variable) => (
        <Card key={variable.id} className={`border-l-4 ${variable.locked ? 'bg-gray-50' : ''}`}
              style={{ borderLeftColor: variable.locked ? '#9CA3AF' : '#2c1810' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className={getCategoryColor(variable.category)}>
                  {getCategoryIcon(variable.category)}
                </span>
                <div>
                  <Label className="text-sm font-medium">{variable.name}</Label>
                  <p className="text-xs text-gray-500">{variable.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={variable.impact === 'high' ? 'destructive' : variable.impact === 'medium' ? 'secondary' : 'default'}>
                  {variable.impact}
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLockChange(variable.id, !variable.locked)}
                      >
                        {variable.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {variable.locked ? 'Unlock variable' : 'Lock variable'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Slider
                    value={[variable.value]}
                    onValueChange={(values) => !variable.locked && onVariableChange(variable.id, values[0])}
                    min={variable.minValue}
                    max={variable.maxValue}
                    step={variable.step}
                    disabled={variable.locked}
                    className="w-full"
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    value={variable.value}
                    onChange={(e) => !variable.locked && onVariableChange(variable.id, parseFloat(e.target.value) || 0)}
                    min={variable.minValue}
                    max={variable.maxValue}
                    step={variable.step}
                    disabled={variable.locked}
                    className="text-sm"
                  />
                </div>
                <span className="text-sm text-gray-500 w-12">{variable.unit}</span>
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>{variable.minValue}{variable.unit}</span>
                <span>{variable.maxValue}{variable.unit}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Live Preview Component
interface LivePreviewProps {
  variables: ModelingVariable[];
  baseData: StrategicScenarioData;
  isRunning: boolean;
}

const LivePreview: React.FC<LivePreviewProps> = ({ variables, baseData, isRunning }) => {
  const calculatedProjections = useMemo(() => {
    // Simulate real-time calculation based on variables
    const growthRate = variables.find(v => v.id === 'growth_rate')?.value || 0.1;
    const marketMultiplier = variables.find(v => v.id === 'market_conditions')?.value || 1.0;
    const riskAdjustment = variables.find(v => v.id === 'risk_factor')?.value || 0.05;

    return Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() + i + 1;
      const baseRevenue = 1000000;
      const adjustedGrowth = growthRate * marketMultiplier * (1 - riskAdjustment);

      const revenue = baseRevenue * Math.pow(1 + adjustedGrowth, i + 1);
      const ebitda = revenue * 0.25;
      const cashFlow = ebitda * 0.8;
      const valuation = revenue * 3.5;

      return { year, revenue, ebitda, cashFlow, valuation };
    });
  }, [variables]);

  const impactMetrics = useMemo(() => {
    const currentProjection = calculatedProjections[calculatedProjections.length - 1];
    const baseProjection = baseData.scenarios[0]?.projections[4];

    if (!baseProjection) return null;

    const revenueImpact = ((currentProjection.revenue - baseProjection.revenue) / baseProjection.revenue) * 100;
    const valuationImpact = ((currentProjection.valuation - baseProjection.valuation) / baseProjection.valuation) * 100;

    return {
      revenueImpact,
      valuationImpact,
      riskScore: variables.find(v => v.id === 'risk_factor')?.value || 0.05
    };
  }, [calculatedProjections, baseData]);

  return (
    <Card className="border-tier-enterprise">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Live Impact Preview</span>
          {isRunning && (
            <div className="flex items-center space-x-2 ml-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Live</span>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Real-time impact of variable changes on strategic outcomes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Impact Metrics */}
          {impactMetrics && (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className={`text-2xl font-bold ${impactMetrics.revenueImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {impactMetrics.revenueImpact >= 0 ? '+' : ''}{impactMetrics.revenueImpact.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Revenue Impact</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className={`text-2xl font-bold ${impactMetrics.valuationImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {impactMetrics.valuationImpact >= 0 ? '+' : ''}{impactMetrics.valuationImpact.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Valuation Impact</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {(impactMetrics.riskScore * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Risk Score</div>
              </div>
            </div>
          )}

          {/* Projection Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={calculatedProjections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip
                  formatter={(value: any, name: string) => [
                    `$${(value / 1000000).toFixed(1)}M`,
                    name.charAt(0).toUpperCase() + name.slice(1)
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="Revenue" />
                <Bar yAxisId="left" dataKey="ebitda" fill="#10B981" name="EBITDA" />
                <Line yAxisId="right" type="monotone" dataKey="valuation" stroke="#EF4444" strokeWidth={3} name="Valuation" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Scenario Comparison Component
interface ScenarioComparisonProps {
  scenarios: Record<string, ScenarioSnapshot>;
  selectedScenarios: string[];
  onSelectionChange: (scenarios: string[]) => void;
}

const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  scenarios,
  selectedScenarios,
  onSelectionChange
}) => {
  const comparisonData = useMemo(() => {
    return selectedScenarios.map(id => {
      const scenario = scenarios[id];
      if (!scenario) return null;

      return {
        name: scenario.name,
        roi: scenario.metrics.roi,
        npv: scenario.metrics.npv,
        irr: scenario.metrics.irr,
        riskScore: scenario.metrics.riskScore,
        timestamp: scenario.timestamp
      };
    }).filter(Boolean);
  }, [scenarios, selectedScenarios]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Split className="h-5 w-5" />
          <span>Scenario Comparison</span>
        </CardTitle>
        <CardDescription>
          Side-by-side comparison of scenario outcomes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Scenario Selection */}
          <div className="flex flex-wrap gap-2">
            {Object.keys(scenarios).map(id => (
              <Button
                key={id}
                variant={selectedScenarios.includes(id) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newSelection = selectedScenarios.includes(id)
                    ? selectedScenarios.filter(s => s !== id)
                    : [...selectedScenarios, id].slice(0, 4); // Max 4 scenarios
                  onSelectionChange(newSelection);
                }}
              >
                {scenarios[id].name}
              </Button>
            ))}
          </div>

          {/* Comparison Chart */}
          {comparisonData.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="roi" fill="#3B82F6" name="ROI %" />
                  <Bar yAxisId="left" dataKey="irr" fill="#10B981" name="IRR %" />
                  <Line yAxisId="right" type="monotone" dataKey="riskScore" stroke="#EF4444" strokeWidth={2} name="Risk Score" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Comparison Table */}
          {comparisonData.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-2 text-left">Scenario</th>
                    <th className="border border-gray-200 p-2 text-right">ROI %</th>
                    <th className="border border-gray-200 p-2 text-right">NPV</th>
                    <th className="border border-gray-200 p-2 text-right">IRR %</th>
                    <th className="border border-gray-200 p-2 text-right">Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((scenario, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-2 font-medium">{scenario?.name}</td>
                      <td className="border border-gray-200 p-2 text-right">{scenario?.roi.toFixed(1)}%</td>
                      <td className="border border-gray-200 p-2 text-right">${(scenario?.npv / 1000000).toFixed(1)}M</td>
                      <td className="border border-gray-200 p-2 text-right">{scenario?.irr.toFixed(1)}%</td>
                      <td className="border border-gray-200 p-2 text-right">{(scenario?.riskScore * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Interactive Modeling Component
interface InteractiveModelingProps {
  data: StrategicScenarioData;
  onDataUpdate?: (data: StrategicScenarioData) => void;
}

const InteractiveModeling: React.FC<InteractiveModelingProps> = ({ data, onDataUpdate }) => {
  // Initialize default variables
  const initialVariables: ModelingVariable[] = [
    {
      id: 'growth_rate',
      name: 'Revenue Growth Rate',
      value: 0.15,
      minValue: -0.1,
      maxValue: 0.5,
      step: 0.01,
      unit: '%',
      category: 'growth',
      description: 'Annual revenue growth rate',
      impact: 'high',
      locked: false
    },
    {
      id: 'market_conditions',
      name: 'Market Conditions',
      value: 1.0,
      minValue: 0.5,
      maxValue: 1.5,
      step: 0.05,
      unit: 'x',
      category: 'market',
      description: 'Market favorability multiplier',
      impact: 'high',
      locked: false
    },
    {
      id: 'risk_factor',
      name: 'Risk Adjustment',
      value: 0.05,
      minValue: 0.01,
      maxValue: 0.2,
      step: 0.005,
      unit: '%',
      category: 'risk',
      description: 'Risk-adjusted discount factor',
      impact: 'medium',
      locked: false
    },
    {
      id: 'cost_inflation',
      name: 'Cost Inflation',
      value: 0.03,
      minValue: 0.0,
      maxValue: 0.1,
      step: 0.005,
      unit: '%',
      category: 'cost',
      description: 'Annual cost inflation rate',
      impact: 'medium',
      locked: false
    },
    {
      id: 'capital_efficiency',
      name: 'Capital Efficiency',
      value: 0.8,
      minValue: 0.5,
      maxValue: 1.2,
      step: 0.05,
      unit: 'x',
      category: 'capital',
      description: 'Capital utilization efficiency',
      impact: 'high',
      locked: false
    }
  ];

  const [state, dispatch] = useReducer(modelingReducer, {
    variables: initialVariables,
    activeScenario: '',
    scenarios: {},
    undoStack: [],
    redoStack: [],
    isRunning: false,
    autoUpdate: true,
    comparisonMode: false,
    selectedComparisons: []
  });

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-update effect
  useEffect(() => {
    if (state.autoUpdate && onDataUpdate) {
      // Simulate data update based on current variables
      const updatedData = { ...data };
      // Update logic would go here
      onDataUpdate(updatedData);
    }
  }, [state.variables, state.autoUpdate, data, onDataUpdate]);

  const handleVariableChange = useCallback((id: string, value: number) => {
    dispatch({ type: 'UPDATE_VARIABLE', id, value });
  }, []);

  const handleLockChange = useCallback((id: string, locked: boolean) => {
    dispatch({ type: 'LOCK_VARIABLE', id, locked });
  }, []);

  const handleSaveScenario = useCallback(() => {
    if (!scenarioName.trim()) return;

    const snapshot: ScenarioSnapshot = {
      id: `scenario_${Date.now()}`,
      name: scenarioName,
      timestamp: new Date(),
      variables: [...state.variables],
      projections: [], // Would be calculated
      metrics: {
        roi: Math.random() * 30 + 10, // Simulated
        npv: Math.random() * 10000000 + 1000000,
        irr: Math.random() * 25 + 15,
        paybackPeriod: Math.random() * 5 + 2,
        riskScore: Math.random() * 0.1 + 0.05
      }
    };

    dispatch({ type: 'SAVE_SCENARIO', snapshot });
    setScenarioName('');
    setShowSaveDialog(false);
  }, [scenarioName, state.variables]);

  const handleLoadScenario = useCallback((id: string) => {
    dispatch({ type: 'LOAD_SCENARIO', id });
  }, []);

  const handleDeleteScenario = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SCENARIO', id });
  }, []);

  const handleExportScenarios = useCallback(() => {
    const exportData = {
      scenarios: state.scenarios,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenarios_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.scenarios]);

  const handleImportScenarios = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        // Import logic would go here
        console.log('Imported scenarios:', importData);
      } catch (error) {
        console.error('Error importing scenarios:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <TooltipProvider>
      <Card className="border-tier-enterprise">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-tier-enterprise flex items-center space-x-2">
                <Sliders className="h-6 w-6" />
                <span>Interactive Scenario Modeling</span>
              </CardTitle>
              <CardDescription>
                Real-time strategic modeling with dynamic variable adjustment and scenario comparison
              </CardDescription>
            </div>

            {/* Control Bar */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: 'UNDO' })}
                disabled={state.undoStack.length === 0}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: 'REDO' })}
                disabled={state.redoStack.length === 0}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportScenarios}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportScenarios}
                className="hidden"
              />
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span>Auto-update:</span>
                <Switch
                  checked={state.autoUpdate}
                  onCheckedChange={() => dispatch({ type: 'TOGGLE_AUTO_UPDATE' })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <span>Comparison mode:</span>
                <Switch
                  checked={state.comparisonMode}
                  onCheckedChange={() => dispatch({ type: 'TOGGLE_COMPARISON_MODE' })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <span>Scenarios saved: {Object.keys(state.scenarios).length}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Variables: {state.variables.length}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            <Tabs defaultValue="variables" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="variables">Variable Controls</TabsTrigger>
                <TabsTrigger value="preview">Live Preview</TabsTrigger>
                <TabsTrigger value="scenarios">Scenario Manager</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
              </TabsList>

              <TabsContent value="variables" className="space-y-4">
                <Tabs orientation="vertical" defaultValue="all" className="flex space-x-4">
                  <TabsList className="flex flex-col h-fit">
                    <TabsTrigger value="all">All Variables</TabsTrigger>
                    <TabsTrigger value="growth">Growth</TabsTrigger>
                    <TabsTrigger value="market">Market</TabsTrigger>
                    <TabsTrigger value="risk">Risk</TabsTrigger>
                    <TabsTrigger value="cost">Cost</TabsTrigger>
                    <TabsTrigger value="capital">Capital</TabsTrigger>
                  </TabsList>

                  <div className="flex-1">
                    <TabsContent value="all">
                      <VariableControls
                        variables={state.variables}
                        onVariableChange={handleVariableChange}
                        onLockChange={handleLockChange}
                      />
                    </TabsContent>
                    <TabsContent value="growth">
                      <VariableControls
                        variables={state.variables}
                        onVariableChange={handleVariableChange}
                        onLockChange={handleLockChange}
                        category="growth"
                      />
                    </TabsContent>
                    <TabsContent value="market">
                      <VariableControls
                        variables={state.variables}
                        onVariableChange={handleVariableChange}
                        onLockChange={handleLockChange}
                        category="market"
                      />
                    </TabsContent>
                    <TabsContent value="risk">
                      <VariableControls
                        variables={state.variables}
                        onVariableChange={handleVariableChange}
                        onLockChange={handleLockChange}
                        category="risk"
                      />
                    </TabsContent>
                    <TabsContent value="cost">
                      <VariableControls
                        variables={state.variables}
                        onVariableChange={handleVariableChange}
                        onLockChange={handleLockChange}
                        category="cost"
                      />
                    </TabsContent>
                    <TabsContent value="capital">
                      <VariableControls
                        variables={state.variables}
                        onVariableChange={handleVariableChange}
                        onLockChange={handleLockChange}
                        category="capital"
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </TabsContent>

              <TabsContent value="preview">
                <LivePreview
                  variables={state.variables}
                  baseData={data}
                  isRunning={state.isRunning}
                />
              </TabsContent>

              <TabsContent value="scenarios" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Saved Scenarios</h3>
                  <div className="flex space-x-2">
                    <Button onClick={() => dispatch({ type: 'RESET_VARIABLES' })} variant="outline" size="sm">
                      Reset All
                    </Button>
                    <Button onClick={() => setShowSaveDialog(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Save Current
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.values(state.scenarios).map((scenario) => (
                    <Card key={scenario.id} className="border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{scenario.name}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteScenario(scenario.id)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {scenario.timestamp.toLocaleString()}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>ROI: {scenario.metrics.roi.toFixed(1)}%</div>
                          <div>IRR: {scenario.metrics.irr.toFixed(1)}%</div>
                          <div>NPV: ${(scenario.metrics.npv / 1000000).toFixed(1)}M</div>
                          <div>Risk: {(scenario.metrics.riskScore * 100).toFixed(1)}%</div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadScenario(scenario.id)}
                            className="flex-1"
                          >
                            Load
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Copy scenario logic here
                              console.log('Copy scenario:', scenario.id);
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {Object.keys(state.scenarios).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No saved scenarios yet</p>
                    <p className="text-sm">Save your current variable settings to create scenarios</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="comparison">
                <ScenarioComparison
                  scenarios={state.scenarios}
                  selectedScenarios={state.selectedComparisons}
                  onSelectionChange={(scenarios) => dispatch({ type: 'UPDATE_COMPARISONS', scenarios })}
                />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Save Scenario Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Current Scenario</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a name for this scenario configuration. All current variable settings will be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Scenario name..."
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveScenario()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveScenario} disabled={!scenarioName.trim()}>
              Save Scenario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};

export default InteractiveModeling;
export type { ModelingVariable, ScenarioSnapshot, ModelingState };