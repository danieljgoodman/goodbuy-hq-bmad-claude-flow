import React, { useState } from 'react';
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

export const MultiScenarioWizard: React.FC<MultiScenarioWizardProps> = ({
  scenarios = [],
  onUpdate,
  onAnalyze
}) => {
  const [activeScenario, setActiveScenario] = useState<string>(scenarios[0]?.id || 'base');
  const [compareMode, setCompareMode] = useState(false);

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

  // Initialize with default scenarios if none provided
  const currentScenarios = scenarios.length > 0 ? scenarios : defaultScenarios;

  const updateScenario = (scenarioId: string, field: keyof Scenario, value: any) => {
    const updated = currentScenarios.map(scenario =>
      scenario.id === scenarioId ? { ...scenario, [field]: value } : scenario
    );
    onUpdate(updated);
  };

  const addScenario = () => {
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
  };

  const removeScenario = (scenarioId: string) => {
    if (currentScenarios.length <= 1) return;
    const updated = currentScenarios.filter(scenario => scenario.id !== scenarioId);
    onUpdate(updated);
    if (activeScenario === scenarioId) {
      setActiveScenario(updated[0]?.id || '');
    }
  };

  const duplicateScenario = (scenarioId: string) => {
    const scenario = currentScenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const newScenario: Scenario = {
      ...scenario,
      id: `${scenario.id}_copy_${Date.now()}`,
      name: `${scenario.name} (Copy)`,
    };
    onUpdate([...currentScenarios, newScenario]);
    setActiveScenario(newScenario.id);
  };

  const addToArray = (scenarioId: string, field: 'keyAssumptions' | 'investmentAreas', value: string) => {
    if (!value.trim()) return;
    const scenario = currentScenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const currentArray = scenario[field] || [];
    updateScenario(scenarioId, field, [...currentArray, value]);
  };

  const removeFromArray = (scenarioId: string, field: 'keyAssumptions' | 'investmentAreas', index: number) => {
    const scenario = currentScenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const currentArray = scenario[field] || [];
    updateScenario(scenarioId, field, currentArray.filter((_, i) => i !== index));
  };

  const getScenarioActive = () => currentScenarios.find(s => s.id === activeScenario);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
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
              onClick={onAnalyze}
              className="tier-enterprise"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Analyze
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
                    <tr className="border-b">
                      <td className="p-3 font-medium">Probability</td>
                      {currentScenarios.map(scenario => (
                        <td key={scenario.id} className="p-3 text-center">
                          {scenario.probability}%
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Revenue Growth</td>
                      {currentScenarios.map(scenario => (
                        <td key={scenario.id} className="p-3 text-center">
                          <span className={scenario.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {scenario.revenueGrowth}%
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Margin Improvement</td>
                      {currentScenarios.map(scenario => (
                        <td key={scenario.id} className="p-3 text-center">
                          <span className={scenario.marginImprovement >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {scenario.marginImprovement}%
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Capital Required</td>
                      {currentScenarios.map(scenario => (
                        <td key={scenario.id} className="p-3 text-center">
                          {formatCurrency(scenario.capitalRequirement)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Expected ROI</td>
                      {currentScenarios.map(scenario => (
                        <td key={scenario.id} className="p-3 text-center">
                          <span className={scenario.expectedROI >= 15 ? 'text-green-600' : scenario.expectedROI >= 10 ? 'text-yellow-600' : 'text-red-600'}>
                            {scenario.expectedROI}%
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Valuation Impact</td>
                      {currentScenarios.map(scenario => (
                        <td key={scenario.id} className="p-3 text-center">
                          <span className={scenario.valuationImpact >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {scenario.valuationImpact}%
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Timeline</td>
                      {currentScenarios.map(scenario => (
                        <td key={scenario.id} className="p-3 text-center">
                          {scenario.timeline} months
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Metrics */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <h4 className="font-semibold mb-3">Weighted Expected Values</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(currentScenarios.reduce((acc, s) => acc + (s.revenueGrowth * s.probability / 100), 0)).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Expected Revenue Growth</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(currentScenarios.reduce((acc, s) => acc + (s.expectedROI * s.probability / 100), 0)).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Expected ROI</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(currentScenarios.reduce((acc, s) => acc + (s.capitalRequirement * s.probability / 100), 0))}
                    </div>
                    <p className="text-sm text-muted-foreground">Expected Capital Need</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {(currentScenarios.reduce((acc, s) => acc + (s.valuationImpact * s.probability / 100), 0)).toFixed(1)}%
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
  );
};