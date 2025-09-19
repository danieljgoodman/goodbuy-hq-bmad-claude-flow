"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Layers, Settings, RefreshCw, Maximize2, Minimize2,
  Activity, TrendingUp, BarChart3, Target, PieChart,
  AlertTriangle, CheckCircle2, Info, Zap
} from 'lucide-react';

// Import existing components
import ScenarioMatrix from './ScenarioMatrix';
import CapitalStructureOptimizer from './CapitalStructureOptimizer';
import ExitStrategyDashboard from './ExitStrategyDashboard';
import InteractiveModeling from './InteractiveModeling';

// Import hooks and types
import { useInteractiveModeling } from '@/hooks/useInteractiveModeling';
import type { StrategicScenarioData } from '@/types/enterprise-dashboard';
import type { CapitalStructureData } from './CapitalStructureOptimizer';
import type { ModelingVariable } from './InteractiveModeling';

// Mock data for demonstration
const mockStrategicData: StrategicScenarioData = {
  scenarios: [
    {
      id: 'aggressive_growth',
      name: 'Aggressive Growth',
      assumptions: [
        { id: '1', category: 'Market', description: 'Market expansion', value: 25, unit: '%', confidence: 85 },
        { id: '2', category: 'Technology', description: 'Tech adoption', value: 40, unit: '%', confidence: 75 }
      ],
      projections: [
        { year: 2025, revenue: 5000000, ebitda: 1250000, cashFlow: 1000000, valuation: 15000000 },
        { year: 2026, revenue: 6250000, ebitda: 1562500, cashFlow: 1250000, valuation: 18750000 },
        { year: 2027, revenue: 7812500, ebitda: 1953125, cashFlow: 1562500, valuation: 23437500 },
        { year: 2028, revenue: 9765625, ebitda: 2441406, cashFlow: 1953125, valuation: 29296875 },
        { year: 2029, revenue: 12207031, ebitda: 3051758, cashFlow: 2441406, valuation: 36621094 }
      ],
      investmentRequired: 2000000,
      expectedROI: 28.5,
      riskLevel: 'high',
      probabilityOfSuccess: 75,
      valuationImpact: 21621094,
      timeline: 24,
      keyDrivers: ['Market Expansion', 'Technology Innovation', 'Strategic Partnerships'],
      riskFactors: ['Market Volatility', 'Competition', 'Execution Risk']
    },
    {
      id: 'conservative_growth',
      name: 'Conservative Growth',
      assumptions: [
        { id: '3', category: 'Market', description: 'Steady market growth', value: 10, unit: '%', confidence: 95 },
        { id: '4', category: 'Operations', description: 'Operational efficiency', value: 15, unit: '%', confidence: 90 }
      ],
      projections: [
        { year: 2025, revenue: 4500000, ebitda: 1125000, cashFlow: 900000, valuation: 13500000 },
        { year: 2026, revenue: 4950000, ebitda: 1237500, cashFlow: 990000, valuation: 14850000 },
        { year: 2027, revenue: 5445000, ebitda: 1361250, cashFlow: 1089000, valuation: 16335000 },
        { year: 2028, revenue: 5989500, ebitda: 1497375, cashFlow: 1197900, valuation: 17968500 },
        { year: 2029, revenue: 6588450, ebitda: 1647113, cashFlow: 1317690, valuation: 19765350 }
      ],
      investmentRequired: 1000000,
      expectedROI: 18.2,
      riskLevel: 'low',
      probabilityOfSuccess: 90,
      valuationImpact: 6265350,
      timeline: 30,
      keyDrivers: ['Operational Excellence', 'Market Stability', 'Cost Control'],
      riskFactors: ['Economic Downturn', 'Competitive Pressure']
    }
  ],
  comparisonMetrics: [
    { id: 'roi', name: 'Return on Investment', unit: '%', weight: 0.3, benchmarkValue: 20 },
    { id: 'risk', name: 'Risk Score', unit: 'score', weight: 0.25, benchmarkValue: 5 },
    { id: 'timeline', name: 'Implementation Timeline', unit: 'months', weight: 0.2, benchmarkValue: 24 },
    { id: 'investment', name: 'Investment Required', unit: '$M', weight: 0.25, benchmarkValue: 1.5 }
  ],
  riskAssessment: {
    overallRisk: 'medium',
    riskFactors: [
      { factor: 'Market Risk', impact: 'high', probability: 60, description: 'Market volatility and competition' },
      { factor: 'Execution Risk', impact: 'medium', probability: 40, description: 'Implementation challenges' },
      { factor: 'Technology Risk', impact: 'low', probability: 25, description: 'Technology adoption risks' }
    ],
    mitigationStrategies: [
      'Diversified market approach',
      'Phased implementation strategy',
      'Strong project management',
      'Regular milestone reviews'
    ],
    confidenceLevel: 82
  },
  recommendedPath: 'Balanced approach starting with conservative growth, then transitioning to aggressive expansion based on early results and market conditions.',
  sensitivityAnalysis: {
    variables: [
      { name: 'Market Growth Rate', baseValue: 15, range: [5, 30], unit: '%' },
      { name: 'Competition Intensity', baseValue: 7, range: [3, 10], unit: 'score' },
      { name: 'Technology Adoption', baseValue: 35, range: [20, 60], unit: '%' }
    ],
    results: [
      { variable: 'Market Growth Rate', change: 10, impact: 2500000, scenario: 'Optimistic' },
      { variable: 'Market Growth Rate', change: -5, impact: -1500000, scenario: 'Pessimistic' },
      { variable: 'Competition Intensity', change: 3, impact: -800000, scenario: 'High Competition' },
      { variable: 'Technology Adoption', change: 15, impact: 1800000, scenario: 'Fast Adoption' }
    ]
  }
};

const mockCapitalData: CapitalStructureData = {
  currentStructure: {
    debt: 60,
    equity: 40,
    debtToEquity: 1.5,
    weightedAverageCostOfCapital: 0.085,
    debtServiceCoverage: 2.1,
    creditRating: 'BBB+'
  },
  optimizedStructure: {
    debt: 55,
    equity: 45,
    debtToEquity: 1.22,
    weightedAverageCostOfCapital: 0.078,
    debtServiceCoverage: 2.4,
    creditRating: 'A-'
  },
  scenarios: [
    { name: 'Conservative', debtRatio: 0.8, wacc: 0.082, creditRating: 'A', riskLevel: 'low' },
    { name: 'Moderate', debtRatio: 1.2, wacc: 0.078, creditRating: 'BBB+', riskLevel: 'medium' },
    { name: 'Aggressive', debtRatio: 1.8, wacc: 0.075, creditRating: 'BBB', riskLevel: 'high' }
  ],
  costOfCapital: {
    costOfDebt: 0.045,
    costOfEquity: 0.12,
    wacc: 0.085,
    taxRate: 0.25,
    riskFreeRate: 0.025,
    marketRiskPremium: 0.08,
    beta: 1.2
  },
  leverageAnalysis: {
    debtToEquityRatio: 1.5,
    debtToAssetRatio: 0.6,
    interestCoverageRatio: 3.2,
    debtServiceCoverageRatio: 2.1,
    timesInterestEarned: 3.2,
    cashCoverageRatio: 1.8
  }
};

// Dashboard Layout Configuration
interface DashboardLayout {
  interactive: boolean;
  scenarioMatrix: boolean;
  capitalStructure: boolean;
  exitStrategy: boolean;
  fullscreen: string | null;
}

interface UnifiedStrategicDashboardProps {
  initialData?: StrategicScenarioData;
  initialCapitalData?: CapitalStructureData;
  onDataChange?: (data: StrategicScenarioData) => void;
}

const UnifiedStrategicDashboard: React.FC<UnifiedStrategicDashboardProps> = ({
  initialData = mockStrategicData,
  initialCapitalData = mockCapitalData,
  onDataChange
}) => {
  // State management
  const [layout, setLayout] = useState<DashboardLayout>({
    interactive: true,
    scenarioMatrix: true,
    capitalStructure: true,
    exitStrategy: true,
    fullscreen: null
  });

  const [isLiveMode, setIsLiveMode] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  // Interactive modeling integration
  const {
    currentData,
    isModelingActive,
    lastUpdate,
    activateModeling,
    deactivateModeling,
    integrateWithComponents,
    applyScenarioSnapshot
  } = useInteractiveModeling(initialData);

  // Handle data updates from interactive modeling
  const handleModelingUpdate = useCallback((updatedData: StrategicScenarioData) => {
    setSyncStatus('syncing');

    // Simulate integration time
    setTimeout(() => {
      setLastSync(new Date());
      setSyncStatus('synced');
      onDataChange?.(updatedData);
    }, 500);
  }, [onDataChange]);

  // Handle variable changes from interactive modeling
  const handleVariableChange = useCallback((variables: ModelingVariable[]) => {
    if (isLiveMode) {
      const integrationResults = integrateWithComponents(variables);
      // Update all components based on integration results
      console.log('Integration results:', integrationResults);
    }
  }, [isLiveMode, integrateWithComponents]);

  // Toggle component visibility
  const toggleComponent = useCallback((component: keyof Omit<DashboardLayout, 'fullscreen'>) => {
    setLayout(prev => ({
      ...prev,
      [component]: !prev[component]
    }));
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback((component: string | null) => {
    setLayout(prev => ({
      ...prev,
      fullscreen: prev.fullscreen === component ? null : component
    }));
  }, []);

  // Toggle live mode
  const toggleLiveMode = useCallback(() => {
    setIsLiveMode(prev => {
      if (!prev) {
        activateModeling();
      } else {
        deactivateModeling();
      }
      return !prev;
    });
  }, [activateModeling, deactivateModeling]);

  // Get sync status icon and color
  const getSyncStatus = () => {
    switch (syncStatus) {
      case 'syncing':
        return { icon: RefreshCw, color: 'text-blue-500', text: 'Syncing...' };
      case 'error':
        return { icon: AlertTriangle, color: 'text-red-500', text: 'Sync Error' };
      default:
        return { icon: CheckCircle2, color: 'text-green-500', text: 'Synced' };
    }
  };

  const statusInfo = getSyncStatus();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <Card className="border-tier-enterprise">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-tier-enterprise flex items-center space-x-2">
                <Layers className="h-6 w-6" />
                <span>Unified Strategic Dashboard</span>
              </CardTitle>
              <CardDescription>
                Integrated real-time strategic modeling and analysis platform
              </CardDescription>
            </div>

            {/* Status and Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <StatusIcon className={`h-4 w-4 ${statusInfo.color} ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span className={statusInfo.color}>{statusInfo.text}</span>
                <span className="text-gray-500">
                  {lastSync.toLocaleTimeString()}
                </span>
              </div>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center space-x-2">
                <span className="text-sm">Live Mode:</span>
                <Switch
                  checked={isLiveMode}
                  onCheckedChange={toggleLiveMode}
                />
              </div>

              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Component Toggle Bar */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Active Components:</span>

              <Button
                variant={layout.interactive ? "default" : "outline"}
                size="sm"
                onClick={() => toggleComponent('interactive')}
              >
                <Activity className="h-4 w-4 mr-2" />
                Interactive Modeling
              </Button>

              <Button
                variant={layout.scenarioMatrix ? "default" : "outline"}
                size="sm"
                onClick={() => toggleComponent('scenarioMatrix')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Scenario Matrix
              </Button>

              <Button
                variant={layout.capitalStructure ? "default" : "outline"}
                size="sm"
                onClick={() => toggleComponent('capitalStructure')}
              >
                <PieChart className="h-4 w-4 mr-2" />
                Capital Structure
              </Button>

              <Button
                variant={layout.exitStrategy ? "default" : "outline"}
                size="sm"
                onClick={() => toggleComponent('exitStrategy')}
              >
                <Target className="h-4 w-4 mr-2" />
                Exit Strategy
              </Button>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Active: {Object.values(layout).filter(v => v === true).length}</span>
              {isModelingActive && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Zap className="h-3 w-3 mr-1" />
                  Modeling Active
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Live Mode Alert */}
      {isLiveMode && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Live mode is active. Changes in Interactive Modeling will automatically update all connected components.
            Last update: {lastUpdate.toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Dashboard Content */}
      <div className="space-y-6">
        {/* Fullscreen Mode */}
        {layout.fullscreen && (
          <div className="fixed inset-0 z-50 bg-background">
            <div className="h-full p-6 overflow-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold capitalize">{layout.fullscreen}</h2>
                <Button
                  variant="outline"
                  onClick={() => toggleFullscreen(null)}
                >
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Exit Fullscreen
                </Button>
              </div>

              {layout.fullscreen === 'interactive' && (
                <InteractiveModeling
                  data={currentData}
                  onDataUpdate={handleModelingUpdate}
                />
              )}

              {layout.fullscreen === 'scenarioMatrix' && (
                <ScenarioMatrix data={currentData} />
              )}

              {layout.fullscreen === 'capitalStructure' && (
                <CapitalStructureOptimizer data={initialCapitalData} />
              )}

              {layout.fullscreen === 'exitStrategy' && (
                <ExitStrategyDashboard />
              )}
            </div>
          </div>
        )}

        {/* Grid Layout */}
        {!layout.fullscreen && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Interactive Modeling */}
            {layout.interactive && (
              <div className="xl:col-span-2">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFullscreen('interactive')}
                    className="absolute top-4 right-4 z-10"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <InteractiveModeling
                    data={currentData}
                    onDataUpdate={handleModelingUpdate}
                  />
                </div>
              </div>
            )}

            {/* Scenario Matrix */}
            {layout.scenarioMatrix && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFullscreen('scenarioMatrix')}
                  className="absolute top-4 right-4 z-10"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <ScenarioMatrix data={currentData} />
              </div>
            )}

            {/* Capital Structure */}
            {layout.capitalStructure && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFullscreen('capitalStructure')}
                  className="absolute top-4 right-4 z-10"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <CapitalStructureOptimizer data={initialCapitalData} />
              </div>
            )}

            {/* Exit Strategy */}
            {layout.exitStrategy && (
              <div className="xl:col-span-2 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFullscreen('exitStrategy')}
                  className="absolute top-4 right-4 z-10"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <ExitStrategyDashboard />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedStrategicDashboard;