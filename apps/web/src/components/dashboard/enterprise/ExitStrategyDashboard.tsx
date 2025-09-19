'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Alert } from '@/components/ui/alert';
import {
  Target,
  TrendingUp,
  Building2,
  Users,
  Crown,
  Heart,
  Briefcase,
  Banknote,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  Info
} from 'lucide-react';

// Types based on enterprise-dashboard.ts and story specification
interface ExitStrategyData {
  exitOptions: ExitOption[];
  valuationProjections: ValuationProjection[];
  transactionReadiness: TransactionReadiness;
  optimizationRecommendations: OptimizationAction[];
  marketTiming: MarketTimingAnalysis;
}

interface ExitOption {
  type: 'strategic' | 'financial' | 'ipo' | 'mbo' | 'esop' | 'family';
  feasibilityScore: number;
  expectedValuation: number;
  timeToExit: number; // months
  riskFactors: string[];
  advantages: string[];
  requiredPreparation: PreparationStep[];
}

interface ValuationProjection {
  exitType: string;
  timeHorizon: number;
  optimisticValuation: number;
  baseValuation: number;
  conservativeValuation: number;
  probabilityWeights: number[];
}

interface TransactionReadiness {
  overallScore: number;
  financialReadiness: number;
  operationalReadiness: number;
  legalReadiness: number;
  marketReadiness: number;
  improvementAreas: string[];
}

interface OptimizationAction {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeline: string;
  valuationIncrease: number;
  effort: 'low' | 'medium' | 'high';
  category: 'financial' | 'operational' | 'strategic' | 'legal';
}

interface MarketTimingAnalysis {
  currentMarketConditions: 'excellent' | 'good' | 'fair' | 'poor';
  sectorMultiples: {
    current: number;
    historical: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  liquidityIndex: number;
  recommendedTiming: string;
  keyFactors: string[];
}

interface PreparationStep {
  step: string;
  completed: boolean;
  importance: 'critical' | 'important' | 'nice-to-have';
  estimatedTime: string;
}

// Mock data for demonstration
const mockExitStrategyData: ExitStrategyData = {
  exitOptions: [
    {
      type: 'strategic',
      feasibilityScore: 85,
      expectedValuation: 12500000,
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
      expectedValuation: 11200000,
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
      expectedValuation: 15000000,
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
      expectedValuation: 9800000,
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
      expectedValuation: 10500000,
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
      expectedValuation: 8500000,
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
      optimisticValuation: 15000000,
      baseValuation: 12500000,
      conservativeValuation: 10000000,
      probabilityWeights: [0.2, 0.6, 0.2]
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
    }
  ],
  marketTiming: {
    currentMarketConditions: 'good',
    sectorMultiples: {
      current: 6.2,
      historical: 5.8,
      trend: 'increasing'
    },
    liquidityIndex: 78,
    recommendedTiming: 'Consider exit within next 12-18 months',
    keyFactors: ['Strong M&A activity', 'Favorable financing conditions', 'Sector consolidation trends']
  }
};

// Exit Option Icons
const getExitIcon = (type: ExitOption['type']) => {
  switch (type) {
    case 'strategic': return <Building2 className="h-5 w-5" />;
    case 'financial': return <Briefcase className="h-5 w-5" />;
    case 'ipo': return <TrendingUp className="h-5 w-5" />;
    case 'mbo': return <Users className="h-5 w-5" />;
    case 'esop': return <Crown className="h-5 w-5" />;
    case 'family': return <Heart className="h-5 w-5" />;
    default: return <Target className="h-5 w-5" />;
  }
};

const getExitLabel = (type: ExitOption['type']) => {
  switch (type) {
    case 'strategic': return 'Strategic Sale';
    case 'financial': return 'Financial Buyer';
    case 'ipo': return 'IPO';
    case 'mbo': return 'Management Buyout';
    case 'esop': return 'Employee Stock Plan';
    case 'family': return 'Family Transfer';
    default: return type;
  }
};

// Subcomponent: Exit Option Selector
const ExitOptionSelector: React.FC<{
  options: ExitOption[];
  selected: string;
  onSelect: (type: string) => void;
}> = ({ options, selected, onSelect }) => {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-tier-enterprise">Exit Strategy Options</h4>
      {options.map((option) => (
        <Card
          key={option.type}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selected === option.type ? 'ring-2 ring-tier-enterprise border-tier-enterprise' : 'border-gray-200'
          }`}
          onClick={() => onSelect(option.type)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              {getExitIcon(option.type)}
              <div className="flex-1">
                <div className="font-medium">{getExitLabel(option.type)}</div>
                <div className="text-sm text-gray-500">
                  ${(option.expectedValuation / 1000000).toFixed(1)}M • {option.timeToExit}mo
                </div>
              </div>
              <Badge
                variant={option.feasibilityScore >= 80 ? 'default' : option.feasibilityScore >= 60 ? 'secondary' : 'destructive'}
              >
                {option.feasibilityScore}%
              </Badge>
            </div>
            <Progress value={option.feasibilityScore} className="h-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Subcomponent: Time Horizon Slider
const TimeHorizonSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}> = ({ value, onChange, min, max }) => {
  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-tier-enterprise">Time Horizon</h4>
        <Badge variant="outline">{value} months</Badge>
      </div>
      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        min={min}
        max={max}
        step={6}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min}mo</span>
        <span>{max}mo</span>
      </div>
    </div>
  );
};

// Subcomponent: Exit Valuation Chart
const ExitValuationChart: React.FC<{
  projections: ValuationProjection[];
  selectedExit: string;
  timeHorizon: number;
}> = ({ projections, selectedExit, timeHorizon }) => {
  const projection = projections.find(p => p.exitType === selectedExit) || projections[0];

  if (!projection) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No valuation data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-tier-enterprise">Valuation Projections</h4>
        <Badge variant="outline">
          {getExitLabel(selectedExit as ExitOption['type'])}
        </Badge>
      </div>

      {/* Simplified chart representation */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">Conservative</div>
            <div className="text-lg font-semibold text-red-600">
              ${(projection.conservativeValuation / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Base Case</div>
            <div className="text-xl font-bold text-tier-enterprise">
              ${(projection.baseValuation / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Optimistic</div>
            <div className="text-lg font-semibold text-green-600">
              ${(projection.optimisticValuation / 1000000).toFixed(1)}M
            </div>
          </div>
        </div>

        {/* Timeline visualization */}
        <div className="relative h-24 bg-white rounded border">
          <div className="absolute inset-0 flex items-center px-4">
            <div className="w-full flex justify-between items-center">
              <div className="flex flex-col items-center">
                <Clock className="h-4 w-4 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Today</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-2 bg-gradient-to-r from-gray-300 via-tier-enterprise to-green-500 rounded"></div>
              </div>
              <div className="flex flex-col items-center">
                <Target className="h-4 w-4 text-green-600 mb-1" />
                <span className="text-xs text-gray-500">{timeHorizon}mo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Subcomponent: Transaction Readiness Score
const TransactionReadinessScore: React.FC<{
  readiness: TransactionReadiness;
}> = ({ readiness }) => {
  const categories = [
    { name: 'Financial', score: readiness.financialReadiness, icon: <Banknote className="h-4 w-4" /> },
    { name: 'Operational', score: readiness.operationalReadiness, icon: <BarChart3 className="h-4 w-4" /> },
    { name: 'Legal', score: readiness.legalReadiness, icon: <Building2 className="h-4 w-4" /> },
    { name: 'Market', score: readiness.marketReadiness, icon: <TrendingUp className="h-4 w-4" /> }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-tier-enterprise" />
          Transaction Readiness
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-tier-enterprise mb-2">
              {readiness.overallScore}%
            </div>
            <div className="text-sm text-gray-500">Overall Readiness Score</div>
            <Progress value={readiness.overallScore} className="mt-2" />
          </div>

          <Separator />

          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {category.icon}
                  <span className="text-sm">{category.name}</span>
                </div>
                <div className={`font-semibold ${getScoreColor(category.score)}`}>
                  {category.score}%
                </div>
              </div>
            ))}
          </div>

          {readiness.improvementAreas.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-2">Key Improvement Areas:</div>
                <ul className="text-sm text-gray-600 space-y-1">
                  {readiness.improvementAreas.map((area, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-tier-enterprise rounded-full"></div>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Subcomponent: Exit Optimization Actions
const ExitOptimizationActions: React.FC<{
  actions: OptimizationAction[];
}> = ({ actions }) => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortIcon = (effort: string) => {
    switch (effort) {
      case 'low': return <ArrowDown className="h-3 w-3 text-green-600" />;
      case 'medium': return <Minus className="h-3 w-3 text-yellow-600" />;
      case 'high': return <ArrowUp className="h-3 w-3 text-red-600" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-tier-enterprise" />
          Optimization Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actions.map((action) => (
            <div key={action.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{action.description}</div>
                </div>
                <Badge className={getImpactColor(action.impact)}>
                  {action.impact} impact
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {action.timeline}
                  </div>
                  <div className="flex items-center gap-1">
                    {getEffortIcon(action.effort)}
                    {action.effort} effort
                  </div>
                </div>
                <div className="font-semibold text-green-600">
                  +{action.valuationIncrease}% value
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Subcomponent: Market Timing Indicator
const MarketTimingIndicator: React.FC<{
  timing: MarketTimingAnalysis;
}> = ({ timing }) => {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'decreasing': return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-600" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-tier-enterprise" />
          Market Timing Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-2">Market Conditions</div>
              <Badge className={`${getConditionColor(timing.currentMarketConditions)} text-sm px-3 py-1`}>
                {timing.currentMarketConditions.toUpperCase()}
              </Badge>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-2">Liquidity Index</div>
              <div className="flex items-center gap-2">
                <Progress value={timing.liquidityIndex} className="flex-1" />
                <span className="text-sm font-medium">{timing.liquidityIndex}%</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-2">Sector Multiples</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current</span>
                <span className="font-semibold">{timing.sectorMultiples.current}x</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Historical</span>
                <span className="text-gray-600">{timing.sectorMultiples.historical}x</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Trend</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(timing.sectorMultiples.trend)}
                  <span className="text-sm capitalize">{timing.sectorMultiples.trend}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-2">Key Factors</div>
            <ul className="space-y-1">
              {timing.keyFactors.map((factor, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <div className="w-1 h-1 bg-tier-enterprise rounded-full mt-2"></div>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <div>
            <div className="font-medium">Recommendation</div>
            <div className="text-sm">{timing.recommendedTiming}</div>
          </div>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Main Exit Strategy Dashboard Component
const ExitStrategyDashboard: React.FC<{ data?: ExitStrategyData }> = ({
  data = mockExitStrategyData
}) => {
  const [selectedExit, setSelectedExit] = useState<string>('strategic');
  const [timeHorizon, setTimeHorizon] = useState<number>(36); // months

  return (
    <Card className="border-tier-enterprise col-span-2">
      <CardHeader>
        <CardTitle className="text-tier-enterprise flex items-center gap-2">
          <Target className="h-5 w-5" />
          Exit Strategy Modeling & Optimization
        </CardTitle>
        <CardDescription>
          Strategic exit planning with valuation optimization and transaction readiness analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <ExitOptionSelector
              options={data.exitOptions}
              selected={selectedExit}
              onSelect={setSelectedExit}
            />

            <TimeHorizonSlider
              value={timeHorizon}
              onChange={setTimeHorizon}
              min={12}
              max={84}
            />
          </div>

          <div className="col-span-2">
            <ExitValuationChart
              projections={data.valuationProjections}
              selectedExit={selectedExit}
              timeHorizon={timeHorizon}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <TransactionReadinessScore readiness={data.transactionReadiness} />
          <ExitOptimizationActions actions={data.optimizationRecommendations} />
        </div>

        <MarketTimingIndicator timing={data.marketTiming} />
      </CardContent>
    </Card>
  );
};

export default ExitStrategyDashboard;

// Export subcomponents for reuse
export {
  ExitOptionSelector,
  TimeHorizonSlider,
  ExitValuationChart,
  TransactionReadinessScore,
  ExitOptimizationActions,
  MarketTimingIndicator
};

// Export types
export type {
  ExitStrategyData,
  ExitOption,
  ValuationProjection,
  TransactionReadiness,
  OptimizationAction,
  MarketTimingAnalysis,
  PreparationStep
};