import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Plus,
  Minus,
  Copy,
  Save,
  RefreshCw,
  Calculator,
  PieChart,
  LineChart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { performanceMonitor, withPerformanceTracking } from '@/lib/utils/performance-monitoring';

interface Scenario {
  id: string;
  name: string;
  description: string;
  probability: number;
  revenueGrowth: number;
  marginImprovement: number;
  capitalRequirement: number;
  timeline: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keyAssumptions: string[];
  investmentAreas: string[];
  expectedROI: number;
  valuationImpact: number;
}

interface MultiScenarioWizardProps {
  scenarios: Scenario[];
  onUpdate: (scenarios: Scenario[]) => void;
  onAnalyze?: () => void;
}

// Lazy load heavy components for code splitting
const ScenarioVisualization = lazy(() => import('./ScenarioVisualization').catch(() => ({
  default: () => <div>Visualization not available</div>
})));

// Memoized comparison table row component
const MemoizedComparisonRow = React.memo<{
  label: string;
  scenarios: Scenario[];
  getValue: (scenario: Scenario) => string | number;
  formatValue?: (value: string | number) => string;
}>(({ label, scenarios, getValue, formatValue = (v) => String(v) }) => (
  <tr className="border-b">
    <td className="p-3 font-medium">{label}</td>
    {scenarios.map(scenario => (
      <td key={scenario.id} className="p-3 text-center">
        {formatValue(getValue(scenario))}
      </td>
    ))}
  </tr>
));

MemoizedComparisonRow.displayName = 'MemoizedComparisonRow';

// Skeleton component for loading states
const ScenarioSkeleton = () => (
  <Card className="tier-enterprise">
    <CardHeader>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </CardContent>
  </Card>
);

const MultiScenarioWizardComponent: React.FC<MultiScenarioWizardProps> = ({
  scenarios = [],
  onUpdate,
  onAnalyze
}) => {
  const [activeScenario, setActiveScenario] = useState<string>(scenarios[0]?.id || 'base');
  const [compareMode, setCompareMode] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const defaultScenarios: Scenario[] = [
    {
      id: 'base',
      name: 'Base Case',
      description: 'Conservative projection based on current trends',
      probability: 70,
      revenueGrowth: 15,
      marginImprovement: 2,
      capitalRequirement: 0,
      timeline: 12,
      riskLevel: 'low',
      keyAssumptions: ['Current market conditions continue', 'No major competitive disruption'],
      investmentAreas: ['Operations optimization', 'Customer retention'],
      expectedROI: 18,
      valuationImpact: 10
    },
    {
      id: 'optimistic',
      name: 'Optimistic Case',
      description: 'Aggressive growth scenario with favorable conditions',
      probability: 25,
      revenueGrowth: 35,
      marginImprovement: 8,
      capitalRequirement: 250000,
      timeline: 18,
      riskLevel: 'medium',
      keyAssumptions: ['Market expansion successful', 'New product adoption high'],
      investmentAreas: ['Market expansion', 'Product development', 'Technology'],
      expectedROI: 45,
      valuationImpact: 60
    },
    {
      id: 'conservative',
      name: 'Conservative Case',
      description: 'Minimal growth scenario accounting for potential challenges',
      probability: 5,
      revenueGrowth: 5,
      marginImprovement: -2,
      capitalRequirement: 0,
      timeline: 24,
      riskLevel: 'high',
      keyAssumptions: ['Economic downturn', 'Increased competition'],
      investmentAreas: ['Cost reduction', 'Risk mitigation'],
      expectedROI: 8,
      valuationImpact: -15
    }
  ];

  // Memoize current scenarios to prevent unnecessary recalculations
  const currentScenarios = useMemo(() =>
    scenarios.length > 0 ? scenarios : defaultScenarios,
    [scenarios, defaultScenarios]
  );

  // Memoized update function
  const updateScenario = useCallback((scenarioId: string, field: keyof Scenario, value: any) => {
    const updated = currentScenarios.map(scenario =>
      scenario.id === scenarioId ? { ...scenario, [field]: value } : scenario
    );
    onUpdate(updated);
  }, [currentScenarios, onUpdate]);

  // Memoized scenario manipulation functions
  const addScenario = useCallback(() => {
    const newScenario: Scenario = {
      id: `custom_${Date.now()}`,
      name: 'Custom Scenario',
      description: 'Custom scenario description',
      probability: 10,
      revenueGrowth: 20,
      marginImprovement: 5,
      capitalRequirement: 100000,
      timeline: 12,
      riskLevel: 'medium',
      keyAssumptions: [],
      investmentAreas: [],
      expectedROI: 25,
      valuationImpact: 20
    };
    onUpdate([...currentScenarios, newScenario]);
    setActiveScenario(newScenario.id);
  }, [currentScenarios, onUpdate]);

  const removeScenario = useCallback((scenarioId: string) => {
    if (currentScenarios.length <= 1) return;
    const updated = currentScenarios.filter(scenario => scenario.id !== scenarioId);
    onUpdate(updated);
    if (activeScenario === scenarioId) {
      setActiveScenario(updated[0]?.id || '');
    }
  }, [currentScenarios, onUpdate, activeScenario]);

  const duplicateScenario = useCallback((scenarioId: string) => {
    const scenario = currentScenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const newScenario: Scenario = {
      ...scenario,
      id: `${scenario.id}_copy_${Date.now()}`,
      name: `${scenario.name} (Copy)`,
    };
    onUpdate([...currentScenarios, newScenario]);
    setActiveScenario(newScenario.id);
  }, [currentScenarios, onUpdate]);

  // Memoized array manipulation functions
  const addToArray = useCallback((scenarioId: string, field: 'keyAssumptions' | 'investmentAreas', value: string) => {
    if (!value.trim()) return;
    const scenario = currentScenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const currentArray = scenario[field] || [];
    updateScenario(scenarioId, field, [...currentArray, value]);
  }, [currentScenarios, updateScenario]);

  const removeFromArray = useCallback((scenarioId: string, field: 'keyAssumptions' | 'investmentAreas', index: number) => {
    const scenario = currentScenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const currentArray = scenario[field] || [];
    updateScenario(scenarioId, field, currentArray.filter((_, i) => i !== index));
  }, [currentScenarios, updateScenario]);

  // Memoized active scenario
  const activeScenarioData = useMemo(() =>
    currentScenarios.find(s => s.id === activeScenario),
    [currentScenarios, activeScenario]
  );

  // Memoized utility functions
  const getRiskColor = useCallback((level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }, []);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  // Memoized weighted calculations for comparison view
  const weightedMetrics = useMemo(() => {
    const totalProbability = currentScenarios.reduce((sum, s) => sum + s.probability, 0);
    if (totalProbability === 0) return { revenueGrowth: 0, expectedROI: 0, capitalNeed: 0, valueImpact: 0 };

    return {
      revenueGrowth: currentScenarios.reduce((acc, s) => acc + (s.revenueGrowth * s.probability / 100), 0),
      expectedROI: currentScenarios.reduce((acc, s) => acc + (s.expectedROI * s.probability / 100), 0),
      capitalNeed: currentScenarios.reduce((acc, s) => acc + (s.capitalRequirement * s.probability / 100), 0),
      valueImpact: currentScenarios.reduce((acc, s) => acc + (s.valuationImpact * s.probability / 100), 0)
    };
  }, [currentScenarios]);

  // Enhanced analyze function with Web Worker
  const handleAnalyze = useCallback(async () => {
    if (!onAnalyze) return;

    setIsCalculating(true);
    performanceMonitor.markMilestone('scenario-analysis-start');

    try {
      // Run analysis in Web Worker if available
      if (typeof Worker !== 'undefined') {
        const worker = new Worker(new URL('@/lib/workers/enterprise-calculations.worker.ts', import.meta.url));

        worker.postMessage({
          id: 'scenario-analysis',
          type: 'scenario-analysis',
          params: {
            baseCase: currentScenarios.find(s => s.id === 'base') || currentScenarios[0],
            scenarios: currentScenarios,
            correlations: [[1, 0.3, 0.2], [0.3, 1, 0.4], [0.2, 0.4, 1]], // Example correlation matrix
            confidenceLevel: 0.95
          }
        });

        worker.onmessage = (e) => {
          const { result, error } = e.data;
          if (error) {
            console.error('Worker error:', error);
          } else {
            console.log('Analysis result:', result);
          }
          setIsCalculating(false);
          worker.terminate();
        };
      } else {
        // Fallback for environments without Web Worker support
        await onAnalyze();
        setIsCalculating(false);
      }

      performanceMonitor.markMilestone('scenario-analysis-end');
    } catch (error) {
      console.error('Analysis failed:', error);
      setIsCalculating(false);
    }
  }, [onAnalyze, currentScenarios]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Suspense fallback={<ScenarioSkeleton />}>
      <div className="space-y-6">
        {/* Header Controls */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="flex items-center justify-between"
        >
        <div>
          <h3 className="text-xl font-semibold">Multi-Scenario Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Compare different growth scenarios and their implications
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompareMode(!compareMode)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {compareMode ? 'Edit Mode' : 'Compare Mode'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addScenario}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Scenario
          </Button>
          {onAnalyze && (
            <Button
              size="sm"
              onClick={handleAnalyze}
              className="tier-enterprise"
              disabled={isCalculating}
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>

      {compareMode ? (
        /* Comparison View */
        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ delay: 0.1 }}
        >
          <Card className="tier-enterprise">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-purple-600" />
                <span>Scenario Comparison</span>
              </CardTitle>
              <CardDescription>
                Side-by-side comparison of all scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Metric</th>
                      {currentScenarios.map(scenario => (
                        <th key={scenario.id} className="text-center p-3 font-medium min-w-[120px]">
                          <div>
                            <div className="font-semibold">{scenario.name}</div>
                            <Badge variant="outline" className={getRiskColor(scenario.riskLevel)}>
                              {scenario.riskLevel}
                            </Badge>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <MemoizedComparisonRow
                      label="Probability"
                      scenarios={currentScenarios}
                      getValue={(s) => s.probability}
                      formatValue={(v) => `${v}%`}
                    />
                    <MemoizedComparisonRow
                      label="Revenue Growth"
                      scenarios={currentScenarios}
                      getValue={(s) => s.revenueGrowth}
                      formatValue={(v) => (
                        <span className={Number(v) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {v}%
                        </span>
                      )}
                    />
                    <MemoizedComparisonRow
                      label="Margin Improvement"
                      scenarios={currentScenarios}
                      getValue={(s) => s.marginImprovement}
                      formatValue={(v) => (
                        <span className={Number(v) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {v}%
                        </span>
                      )}
                    />
                    <MemoizedComparisonRow
                      label="Capital Required"
                      scenarios={currentScenarios}
                      getValue={(s) => s.capitalRequirement}
                      formatValue={(v) => formatCurrency(Number(v))}
                    />
                    <MemoizedComparisonRow
                      label="Expected ROI"
                      scenarios={currentScenarios}
                      getValue={(s) => s.expectedROI}
                      formatValue={(v) => {
                        const val = Number(v);
                        const color = val >= 15 ? 'text-green-600' : val >= 10 ? 'text-yellow-600' : 'text-red-600';
                        return <span className={color}>{val}%</span>;
                      }}
                    />
                    <MemoizedComparisonRow
                      label="Valuation Impact"
                      scenarios={currentScenarios}
                      getValue={(s) => s.valuationImpact}
                      formatValue={(v) => (
                        <span className={Number(v) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {v}%
                        </span>
                      )}
                    />
                    <MemoizedComparisonRow
                      label="Timeline"
                      scenarios={currentScenarios}
                      getValue={(s) => s.timeline}
                      formatValue={(v) => `${v} months`}
                    />
                  </tbody>
                </table>
              </div>

              {/* Summary Metrics */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <h4 className="font-semibold mb-3">Weighted Expected Values</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {weightedMetrics.revenueGrowth.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Expected Revenue Growth</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {weightedMetrics.expectedROI.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Expected ROI</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(weightedMetrics.capitalNeed)}
                    </div>
                    <p className="text-sm text-muted-foreground">Expected Capital Need</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {weightedMetrics.valueImpact.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Expected Value Impact</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        /* Edit View */
        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeScenario} onValueChange={setActiveScenario}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
              {currentScenarios.map(scenario => (
                <TabsTrigger key={scenario.id} value={scenario.id} className="text-xs">
                  {scenario.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {currentScenarios.map(scenario => (
              <TabsContent key={scenario.id} value={scenario.id}>
                <Card className="tier-enterprise">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          <span>{scenario.name}</span>
                          <Badge variant="outline" className={getRiskColor(scenario.riskLevel)}>
                            {scenario.riskLevel}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{scenario.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateScenario(scenario.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {currentScenarios.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeScenario(scenario.id)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor={`name_${scenario.id}`}>Scenario Name</Label>
                        <Input
                          id={`name_${scenario.id}`}
                          value={scenario.name}
                          onChange={(e) => updateScenario(scenario.id, 'name', e.target.value)}
                          className="tier-enterprise"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor={`probability_${scenario.id}`}>Probability (%)</Label>
                        <Input
                          id={`probability_${scenario.id}`}
                          type="number"
                          min="0"
                          max="100"
                          value={scenario.probability}
                          onChange={(e) => updateScenario(scenario.id, 'probability', Number(e.target.value))}
                          className="tier-enterprise"
                        />
                        <Progress value={scenario.probability} className="h-2" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor={`description_${scenario.id}`}>Description</Label>
                      <Textarea
                        id={`description_${scenario.id}`}
                        value={scenario.description}
                        onChange={(e) => updateScenario(scenario.id, 'description', e.target.value)}
                        className="tier-enterprise"
                        rows={2}
                      />
                    </div>

                    {/* Financial Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor={`revenueGrowth_${scenario.id}`}>Revenue Growth (%)</Label>
                        <Input
                          id={`revenueGrowth_${scenario.id}`}
                          type="number"
                          value={scenario.revenueGrowth}
                          onChange={(e) => updateScenario(scenario.id, 'revenueGrowth', Number(e.target.value))}
                          className="tier-enterprise"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor={`marginImprovement_${scenario.id}`}>Margin Improvement (%)</Label>
                        <Input
                          id={`marginImprovement_${scenario.id}`}
                          type="number"
                          value={scenario.marginImprovement}
                          onChange={(e) => updateScenario(scenario.id, 'marginImprovement', Number(e.target.value))}
                          className="tier-enterprise"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor={`capitalRequirement_${scenario.id}`}>Capital Requirement ($)</Label>
                        <Input
                          id={`capitalRequirement_${scenario.id}`}
                          type="number"
                          min="0"
                          value={scenario.capitalRequirement}
                          onChange={(e) => updateScenario(scenario.id, 'capitalRequirement', Number(e.target.value))}
                          className="tier-enterprise"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor={`timeline_${scenario.id}`}>Timeline (months)</Label>
                        <Input
                          id={`timeline_${scenario.id}`}
                          type="number"
                          min="0"
                          value={scenario.timeline}
                          onChange={(e) => updateScenario(scenario.id, 'timeline', Number(e.target.value))}
                          className="tier-enterprise"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor={`expectedROI_${scenario.id}`}>Expected ROI (%)</Label>
                        <Input
                          id={`expectedROI_${scenario.id}`}
                          type="number"
                          value={scenario.expectedROI}
                          onChange={(e) => updateScenario(scenario.id, 'expectedROI', Number(e.target.value))}
                          className="tier-enterprise"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor={`valuationImpact_${scenario.id}`}>Valuation Impact (%)</Label>
                        <Input
                          id={`valuationImpact_${scenario.id}`}
                          type="number"
                          value={scenario.valuationImpact}
                          onChange={(e) => updateScenario(scenario.id, 'valuationImpact', Number(e.target.value))}
                          className="tier-enterprise"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor={`riskLevel_${scenario.id}`}>Risk Level</Label>
                      <Select
                        value={scenario.riskLevel}
                        onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') =>
                          updateScenario(scenario.id, 'riskLevel', value)
                        }
                      >
                        <SelectTrigger className="tier-enterprise">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Risk</SelectItem>
                          <SelectItem value="medium">Medium Risk</SelectItem>
                          <SelectItem value="high">High Risk</SelectItem>
                          <SelectItem value="critical">Critical Risk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Key Assumptions */}
                    <div className="space-y-3">
                      <Label>Key Assumptions</Label>
                      <div className="space-y-2">
                        {scenario.keyAssumptions.map((assumption: string, index: number) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input value={assumption} readOnly className="tier-enterprise" />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromArray(scenario.id, 'keyAssumptions', index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Add key assumption"
                            className="tier-enterprise"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addToArray(scenario.id, 'keyAssumptions', e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              addToArray(scenario.id, 'keyAssumptions', input.value);
                              input.value = '';
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Investment Areas */}
                    <div className="space-y-3">
                      <Label>Investment Areas</Label>
                      <div className="space-y-2">
                        {scenario.investmentAreas.map((area: string, index: number) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input value={area} readOnly className="tier-enterprise" />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromArray(scenario.id, 'investmentAreas', index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Add investment area"
                            className="tier-enterprise"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addToArray(scenario.id, 'investmentAreas', e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              addToArray(scenario.id, 'investmentAreas', input.value);
                              input.value = '';
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
        )}
      </div>
    </Suspense>
  );
};

// Export the memoized and performance-tracked component
export const MultiScenarioWizard = React.memo(
  withPerformanceTracking(
    MultiScenarioWizardComponent,
    'MultiScenarioWizard'
  )
);