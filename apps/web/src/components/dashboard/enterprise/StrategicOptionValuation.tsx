'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  Target,
  Globe,
  Building,
  Lightbulb,
  Calculator,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  Percent,
  Calendar,
  Settings
} from 'lucide-react';

import { OptionPricingEngine } from '@/lib/financial/option-valuation';
import type { OptionValuation } from '@/types/enterprise-dashboard';

// Strategic Option Types
export type StrategicOptionType = 'expansion' | 'acquisition' | 'innovation' | 'platform' | 'international';

export type ValuationModel = 'black-scholes' | 'binomial' | 'monte-carlo';

export interface StrategicOption {
  id: string;
  type: StrategicOptionType;
  name: string;
  description: string;
  investmentRequired: number;
  timeToExpiry: number;
  volatility: number;
  riskFreeRate: number;
  expectedValue: number;
  probability: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'pending' | 'exercised' | 'expired';
  timingScore: number;
  strategicValue: number;
}

export interface PortfolioOptimization {
  recommendedOptions: StrategicOption[];
  totalInvestment: number;
  expectedReturn: number;
  riskScore: number;
  diversificationScore: number;
  optimalTiming: { [key: string]: number };
}

interface StrategicOptionValuationProps {
  className?: string;
}

// Option Selection Grid Component
const OptionSelectionGrid: React.FC<{
  options: StrategicOption[];
  selectedOptions: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}> = ({ options, selectedOptions, onSelectionChange }) => {
  const toggleOption = (optionId: string) => {
    const newSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId];
    onSelectionChange(newSelection);
  };

  const getOptionIcon = (type: StrategicOptionType) => {
    switch (type) {
      case 'expansion': return <TrendingUp className="h-5 w-5" />;
      case 'acquisition': return <Building className="h-5 w-5" />;
      case 'innovation': return <Lightbulb className="h-5 w-5" />;
      case 'platform': return <Target className="h-5 w-5" />;
      case 'international': return <Globe className="h-5 w-5" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {options.map((option) => (
        <Card
          key={option.id}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedOptions.includes(option.id)
              ? 'ring-2 ring-blue-500 border-blue-300'
              : 'border-gray-200'
          }`}
          onClick={() => toggleOption(option.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getOptionIcon(option.type)}
                <CardTitle className="text-sm font-medium">{option.name}</CardTitle>
              </div>
              {selectedOptions.includes(option.id) && (
                <CheckCircle className="h-5 w-5 text-blue-600" />
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <p className="text-xs text-gray-600 line-clamp-2">{option.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Investment:</span>
                  <div className="font-medium">${(option.investmentRequired / 1000000).toFixed(1)}M</div>
                </div>
                <div>
                  <span className="text-gray-500">Expected Value:</span>
                  <div className="font-medium">${(option.expectedValue / 1000000).toFixed(1)}M</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="secondary" className={`text-xs ${getRiskColor(option.riskLevel)}`}>
                  {option.riskLevel.toUpperCase()} RISK
                </Badge>
                <div className="text-xs text-gray-500">
                  {(option.probability * 100).toFixed(0)}% probability
                </div>
              </div>

              <Progress value={option.timingScore} className="h-2" />
              <div className="text-xs text-center text-gray-500">
                Timing Score: {option.timingScore}/100
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Valuation Model Selector Component
const ValuationModelSelector: React.FC<{
  selectedModel: ValuationModel;
  onModelChange: (model: ValuationModel) => void;
  parameters: { [key: string]: number };
  onParameterChange: (param: string, value: number) => void;
}> = ({ selectedModel, onModelChange, parameters, onParameterChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Valuation Model Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="model-select">Valuation Model</Label>
          <Select value={selectedModel} onValueChange={(value) => onModelChange(value as ValuationModel)}>
            <SelectTrigger>
              <SelectValue placeholder="Select valuation model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="black-scholes">Black-Scholes Model</SelectItem>
              <SelectItem value="binomial">Binomial Tree Model</SelectItem>
              <SelectItem value="monte-carlo">Monte Carlo Simulation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label>Risk-Free Rate: {(parameters.riskFreeRate * 100).toFixed(2)}%</Label>
            <Slider
              value={[parameters.riskFreeRate * 100]}
              onValueChange={([value]) => onParameterChange('riskFreeRate', value / 100)}
              max={10}
              min={0}
              step={0.1}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Market Volatility: {(parameters.volatility * 100).toFixed(1)}%</Label>
            <Slider
              value={[parameters.volatility * 100]}
              onValueChange={([value]) => onParameterChange('volatility', value / 100)}
              max={100}
              min={5}
              step={1}
              className="mt-2"
            />
          </div>

          {selectedModel === 'binomial' && (
            <div>
              <Label>Tree Steps: {parameters.steps}</Label>
              <Slider
                value={[parameters.steps]}
                onValueChange={([value]) => onParameterChange('steps', value)}
                max={100}
                min={10}
                step={5}
                className="mt-2"
              />
            </div>
          )}

          {selectedModel === 'monte-carlo' && (
            <div>
              <Label>Simulations: {parameters.simulations.toLocaleString()}</Label>
              <Slider
                value={[Math.log10(parameters.simulations)]}
                onValueChange={([value]) => onParameterChange('simulations', Math.pow(10, value))}
                max={6}
                min={3}
                step={0.1}
                className="mt-2"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Option Valuation Chart Component
const OptionValuationChart: React.FC<{
  options: StrategicOption[];
  valuations: { [key: string]: number };
}> = ({ options, valuations }) => {
  const maxValue = Math.max(...Object.values(valuations));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Option Valuations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {options.map((option) => {
            const value = valuations[option.id] || 0;
            const percentage = (value / maxValue) * 100;

            return (
              <div key={option.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{option.name}</span>
                  <span className="text-sm text-gray-600">
                    ${(value / 1000000).toFixed(2)}M
                  </span>
                </div>
                <Progress value={percentage} className="h-3" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Option Metrics Component
const OptionMetrics: React.FC<{
  option: StrategicOption;
  valuation: number;
  greeks?: { delta: number; gamma: number; theta: number; vega: number; rho: number };
}> = ({ option, valuation, greeks }) => {
  const roi = ((valuation - option.investmentRequired) / option.investmentRequired) * 100;
  const npv = valuation - option.investmentRequired;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {option.name} Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Option Value:</span>
              <span className="font-medium">${(valuation / 1000000).toFixed(2)}M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Investment Required:</span>
              <span className="font-medium">${(option.investmentRequired / 1000000).toFixed(2)}M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Net Present Value:</span>
              <span className={`font-medium ${npv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(npv / 1000000).toFixed(2)}M
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ROI:</span>
              <span className={`font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roi.toFixed(1)}%
              </span>
            </div>
          </div>

          {greeks && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Option Greeks:</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Delta:</span>
                  <span className="font-medium">{greeks.delta.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gamma:</span>
                  <span className="font-medium">{greeks.gamma.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Theta:</span>
                  <span className="font-medium">{greeks.theta.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vega:</span>
                  <span className="font-medium">{greeks.vega.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rho:</span>
                  <span className="font-medium">{greeks.rho.toFixed(3)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Timing Recommendations Component
const TimingRecommendations: React.FC<{
  options: StrategicOption[];
  marketConditions: { [key: string]: number };
}> = ({ options, marketConditions }) => {
  const getTimingRecommendation = (option: StrategicOption) => {
    if (option.timingScore >= 80) return { action: 'Execute Now', color: 'text-green-600', icon: ArrowUpRight };
    if (option.timingScore >= 60) return { action: 'Execute Soon', color: 'text-yellow-600', icon: Clock };
    if (option.timingScore >= 40) return { action: 'Wait & Monitor', color: 'text-orange-600', icon: Clock };
    return { action: 'Hold', color: 'text-red-600', icon: ArrowDownRight };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Option Timing Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {options.map((option) => {
            const recommendation = getTimingRecommendation(option);
            const IconComponent = recommendation.icon;

            return (
              <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-md">
                    {option.type === 'expansion' && <TrendingUp className="h-4 w-4" />}
                    {option.type === 'acquisition' && <Building className="h-4 w-4" />}
                    {option.type === 'innovation' && <Lightbulb className="h-4 w-4" />}
                    {option.type === 'platform' && <Target className="h-4 w-4" />}
                    {option.type === 'international' && <Globe className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{option.name}</div>
                    <div className="text-xs text-gray-500">
                      {option.timeToExpiry} years to expiry
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${recommendation.color}`}>
                      {recommendation.action}
                    </div>
                    <div className="text-xs text-gray-500">
                      Score: {option.timingScore}/100
                    </div>
                  </div>
                  <IconComponent className={`h-4 w-4 ${recommendation.color}`} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Portfolio Optimization View Component
const PortfolioOptimizationView: React.FC<{
  options: StrategicOption[];
  optimization: PortfolioOptimization;
}> = ({ options, optimization }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Portfolio Optimization
        </CardTitle>
        <CardDescription>
          Optimal strategic option portfolio based on risk-return profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Investment</div>
              <div className="text-lg font-bold text-blue-600">
                ${(optimization.totalInvestment / 1000000).toFixed(1)}M
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Expected Return</div>
              <div className="text-lg font-bold text-green-600">
                {(optimization.expectedReturn * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Risk Score</div>
              <div className="text-lg font-bold text-orange-600">
                {optimization.riskScore.toFixed(1)}/10
              </div>
            </div>
          </div>

          {/* Recommended Options */}
          <div>
            <h4 className="font-medium text-sm mb-3">Recommended Option Allocation</h4>
            <div className="space-y-3">
              {optimization.recommendedOptions.map((option) => {
                const weight = (option.investmentRequired / optimization.totalInvestment) * 100;

                return (
                  <div key={option.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span className="text-sm">{option.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{weight.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">
                        ${(option.investmentRequired / 1000000).toFixed(1)}M
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diversification Score */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Diversification Score</span>
              <span className="text-sm text-gray-600">
                {optimization.diversificationScore.toFixed(1)}/10
              </span>
            </div>
            <Progress value={optimization.diversificationScore * 10} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Strategic Option Valuation Component
const StrategicOptionValuation: React.FC<StrategicOptionValuationProps> = ({ className }) => {
  // Sample strategic options data
  const [strategicOptions] = useState<StrategicOption[]>([
    {
      id: 'exp-1',
      type: 'expansion',
      name: 'Market Expansion',
      description: 'Expand into new geographic markets with existing products',
      investmentRequired: 5000000,
      timeToExpiry: 2,
      volatility: 0.3,
      riskFreeRate: 0.05,
      expectedValue: 8000000,
      probability: 0.75,
      riskLevel: 'medium',
      status: 'active',
      timingScore: 85,
      strategicValue: 7.5
    },
    {
      id: 'acq-1',
      type: 'acquisition',
      name: 'Competitor Acquisition',
      description: 'Acquire smaller competitor to gain market share',
      investmentRequired: 15000000,
      timeToExpiry: 1.5,
      volatility: 0.45,
      riskFreeRate: 0.05,
      expectedValue: 20000000,
      probability: 0.65,
      riskLevel: 'high',
      status: 'active',
      timingScore: 72,
      strategicValue: 8.2
    },
    {
      id: 'inn-1',
      type: 'innovation',
      name: 'Product Innovation',
      description: 'Develop next-generation product line',
      investmentRequired: 8000000,
      timeToExpiry: 3,
      volatility: 0.6,
      riskFreeRate: 0.05,
      expectedValue: 15000000,
      probability: 0.55,
      riskLevel: 'high',
      status: 'active',
      timingScore: 45,
      strategicValue: 9.1
    },
    {
      id: 'plt-1',
      type: 'platform',
      name: 'Platform Development',
      description: 'Build scalable technology platform',
      investmentRequired: 12000000,
      timeToExpiry: 2.5,
      volatility: 0.4,
      riskFreeRate: 0.05,
      expectedValue: 25000000,
      probability: 0.7,
      riskLevel: 'medium',
      status: 'active',
      timingScore: 90,
      strategicValue: 8.8
    },
    {
      id: 'int-1',
      type: 'international',
      name: 'International Expansion',
      description: 'Enter European and Asian markets',
      investmentRequired: 10000000,
      timeToExpiry: 3,
      volatility: 0.5,
      riskFreeRate: 0.05,
      expectedValue: 18000000,
      probability: 0.6,
      riskLevel: 'high',
      status: 'active',
      timingScore: 68,
      strategicValue: 7.8
    }
  ]);

  const [selectedOptions, setSelectedOptions] = useState<string[]>(['exp-1', 'plt-1']);
  const [selectedModel, setSelectedModel] = useState<ValuationModel>('black-scholes');
  const [activeTab, setActiveTab] = useState('overview');
  const [modelParameters, setModelParameters] = useState({
    riskFreeRate: 0.05,
    volatility: 0.3,
    steps: 50,
    simulations: 10000
  });

  const [valuations, setValuations] = useState<{ [key: string]: number }>({});
  const [portfolioOptimization, setPortfolioOptimization] = useState<PortfolioOptimization | null>(null);

  // Calculate option valuations when parameters change
  useEffect(() => {
    const newValuations: { [key: string]: number } = {};

    strategicOptions.forEach(option => {
      if (selectedModel === 'black-scholes') {
        newValuations[option.id] = OptionPricingEngine.calculateBlackScholes(
          option.expectedValue,
          option.investmentRequired,
          option.timeToExpiry,
          modelParameters.riskFreeRate,
          option.volatility
        );
      } else if (selectedModel === 'binomial') {
        newValuations[option.id] = OptionPricingEngine.calculateBinomial(
          option.expectedValue,
          option.investmentRequired,
          option.timeToExpiry,
          modelParameters.riskFreeRate,
          option.volatility,
          modelParameters.steps
        );
      } else {
        // Monte Carlo simulation
        const monteCarloResult = OptionPricingEngine.calculateMonteCarlo(
          option.expectedValue,
          option.investmentRequired,
          option.timeToExpiry,
          modelParameters.riskFreeRate,
          option.volatility,
          modelParameters.simulations
        );
        newValuations[option.id] = monteCarloResult.value;
      }
    });

    setValuations(newValuations);
  }, [strategicOptions, selectedModel, modelParameters]);

  // Calculate portfolio optimization
  useEffect(() => {
    const selectedOpts = strategicOptions.filter(opt => selectedOptions.includes(opt.id));
    if (selectedOpts.length > 0) {
      const totalInvestment = selectedOpts.reduce((sum, opt) => sum + opt.investmentRequired, 0);
      const weightedReturn = selectedOpts.reduce((sum, opt) => {
        const weight = opt.investmentRequired / totalInvestment;
        const returnRate = ((valuations[opt.id] || 0) - opt.investmentRequired) / opt.investmentRequired;
        return sum + weight * returnRate;
      }, 0);

      const riskScore = selectedOpts.reduce((sum, opt) => sum + opt.volatility, 0) / selectedOpts.length;
      const diversificationScore = Math.min(10, selectedOpts.length * 2);

      setPortfolioOptimization({
        recommendedOptions: selectedOpts,
        totalInvestment,
        expectedReturn: weightedReturn,
        riskScore: riskScore * 10,
        diversificationScore,
        optimalTiming: selectedOpts.reduce((acc, opt) => {
          acc[opt.id] = opt.timingScore / 100;
          return acc;
        }, {} as { [key: string]: number })
      });
    }
  }, [selectedOptions, strategicOptions, valuations]);

  const handleParameterChange = (param: string, value: number) => {
    setModelParameters(prev => ({ ...prev, [param]: value }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Strategic Option Valuation</h2>
          <p className="text-gray-600">
            Advanced option pricing models for strategic investment analysis
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Enterprise Analytics
        </Badge>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="selection">Option Selection</TabsTrigger>
          <TabsTrigger value="valuation">Valuation Models</TabsTrigger>
          <TabsTrigger value="timing">Timing Analysis</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OptionValuationChart options={selectedOptions.map(id => strategicOptions.find(opt => opt.id === id)!)} valuations={valuations} />
            {portfolioOptimization && (
              <PortfolioOptimizationView options={strategicOptions} optimization={portfolioOptimization} />
            )}
          </div>

          {selectedOptions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedOptions.slice(0, 2).map(optionId => {
                const option = strategicOptions.find(opt => opt.id === optionId)!;
                const greeks = OptionPricingEngine.calculateGreeks(
                  option.expectedValue,
                  option.investmentRequired,
                  option.timeToExpiry,
                  modelParameters.riskFreeRate,
                  option.volatility
                );
                return (
                  <OptionMetrics
                    key={optionId}
                    option={option}
                    valuation={valuations[optionId] || 0}
                    greeks={greeks}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="selection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Option Selection</CardTitle>
              <CardDescription>
                Select strategic options to include in your portfolio analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OptionSelectionGrid
                options={strategicOptions}
                selectedOptions={selectedOptions}
                onSelectionChange={setSelectedOptions}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="valuation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ValuationModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              parameters={modelParameters}
              onParameterChange={handleParameterChange}
            />
            <OptionValuationChart
              options={selectedOptions.map(id => strategicOptions.find(opt => opt.id === id)!)}
              valuations={valuations}
            />
          </div>
        </TabsContent>

        <TabsContent value="timing" className="space-y-6">
          <TimingRecommendations
            options={strategicOptions}
            marketConditions={{
              economicGrowth: 0.7,
              interestRates: 0.05,
              marketVolatility: 0.3,
              competitiveIntensity: 0.6
            }}
          />
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          {portfolioOptimization && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PortfolioOptimizationView options={strategicOptions} optimization={portfolioOptimization} />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Optimization Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Risk Tolerance</Label>
                    <Select defaultValue="moderate">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservative</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Investment Horizon: 3 years</Label>
                    <Slider
                      defaultValue={[3]}
                      max={10}
                      min={1}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="correlation" />
                    <Label htmlFor="correlation">Consider option correlations</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="rebalancing" defaultChecked />
                    <Label htmlFor="rebalancing">Enable auto-rebalancing</Label>
                  </div>

                  <Button className="w-full">
                    Optimize Portfolio
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StrategicOptionValuation;