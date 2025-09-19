"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  PlayCircle, RotateCcw, BookOpen, Lightbulb, Target,
  TrendingUp, BarChart3, Activity, Zap, Info
} from 'lucide-react';

import InteractiveModeling from '../InteractiveModeling';
import UnifiedStrategicDashboard from '../UnifiedStrategicDashboard';
import type { StrategicScenarioData } from '@/types/enterprise-dashboard';

// Example scenarios for demonstration
const demoScenarios: StrategicScenarioData = {
  scenarios: [
    {
      id: 'saas_expansion',
      name: 'SaaS Market Expansion',
      assumptions: [
        { id: '1', category: 'Market', description: 'SaaS market growth', value: 20, unit: '%', confidence: 85 },
        { id: '2', category: 'Product', description: 'Feature adoption rate', value: 65, unit: '%', confidence: 80 },
        { id: '3', category: 'Sales', description: 'Customer acquisition', value: 35, unit: '%', confidence: 75 }
      ],
      projections: [
        { year: 2025, revenue: 2500000, ebitda: 625000, cashFlow: 500000, valuation: 12500000 },
        { year: 2026, revenue: 3000000, ebitda: 750000, cashFlow: 600000, valuation: 15000000 },
        { year: 2027, revenue: 3600000, ebitda: 900000, cashFlow: 720000, valuation: 18000000 },
        { year: 2028, revenue: 4320000, ebitda: 1080000, cashFlow: 864000, valuation: 21600000 },
        { year: 2029, revenue: 5184000, ebitda: 1296000, cashFlow: 1036800, valuation: 25920000 }
      ],
      investmentRequired: 1500000,
      expectedROI: 32.5,
      riskLevel: 'medium',
      probabilityOfSuccess: 78,
      valuationImpact: 13420000,
      timeline: 18,
      keyDrivers: ['Market Penetration', 'Product Innovation', 'Customer Retention'],
      riskFactors: ['Competition', 'Technology Risk', 'Market Saturation']
    },
    {
      id: 'international_expansion',
      name: 'International Market Entry',
      assumptions: [
        { id: '4', category: 'Geographic', description: 'Market penetration', value: 15, unit: '%', confidence: 70 },
        { id: '5', category: 'Regulatory', description: 'Compliance overhead', value: 12, unit: '%', confidence: 85 },
        { id: '6', category: 'Operational', description: 'Localization costs', value: 8, unit: '%', confidence: 90 }
      ],
      projections: [
        { year: 2025, revenue: 1800000, ebitda: 360000, cashFlow: 288000, valuation: 7200000 },
        { year: 2026, revenue: 2070000, ebitda: 414000, cashFlow: 331200, valuation: 8280000 },
        { year: 2027, revenue: 2380500, ebitda: 476100, cashFlow: 380880, valuation: 9522000 },
        { year: 2028, revenue: 2737575, ebitda: 547515, cashFlow: 438012, valuation: 10950300 },
        { year: 2029, revenue: 3148211, ebitda: 629642, cashFlow: 503714, valuation: 12592845 }
      ],
      investmentRequired: 2200000,
      expectedROI: 24.8,
      riskLevel: 'high',
      probabilityOfSuccess: 65,
      valuationImpact: 5392845,
      timeline: 30,
      keyDrivers: ['Market Research', 'Local Partnerships', 'Regulatory Compliance'],
      riskFactors: ['Currency Risk', 'Political Risk', 'Cultural Barriers', 'Regulatory Changes']
    },
    {
      id: 'ai_integration',
      name: 'AI Technology Integration',
      assumptions: [
        { id: '7', category: 'Technology', description: 'AI efficiency gains', value: 30, unit: '%', confidence: 75 },
        { id: '8', category: 'Cost', description: 'Development investment', value: 18, unit: '%', confidence: 85 },
        { id: '9', category: 'Market', description: 'Customer willingness to pay', value: 25, unit: '%', confidence: 70 }
      ],
      projections: [
        { year: 2025, revenue: 3200000, ebitda: 960000, cashFlow: 768000, valuation: 16000000 },
        { year: 2026, revenue: 4160000, ebitda: 1248000, cashFlow: 998400, valuation: 20800000 },
        { year: 2027, revenue: 5408000, ebitda: 1622400, cashFlow: 1297920, valuation: 27040000 },
        { year: 2028, revenue: 7030400, ebitda: 2109120, cashFlow: 1687296, valuation: 35152000 },
        { year: 2029, revenue: 9139520, ebitda: 2741856, cashFlow: 2193485, valuation: 45697600 }
      ],
      investmentRequired: 3500000,
      expectedROI: 41.2,
      riskLevel: 'high',
      probabilityOfSuccess: 68,
      valuationImpact: 29697600,
      timeline: 24,
      keyDrivers: ['Technology Innovation', 'Market Differentiation', 'Operational Efficiency'],
      riskFactors: ['Technology Risk', 'Implementation Complexity', 'Market Acceptance', 'Competitive Response']
    }
  ],
  comparisonMetrics: [
    { id: 'roi', name: 'Return on Investment', unit: '%', weight: 0.3, benchmarkValue: 25 },
    { id: 'risk', name: 'Risk Level', unit: 'score', weight: 0.25, benchmarkValue: 5 },
    { id: 'timeline', name: 'Timeline', unit: 'months', weight: 0.2, benchmarkValue: 24 },
    { id: 'investment', name: 'Investment Required', unit: '$M', weight: 0.25, benchmarkValue: 2.5 }
  ],
  riskAssessment: {
    overallRisk: 'medium',
    riskFactors: [
      { factor: 'Market Risk', impact: 'high', probability: 60, description: 'Market volatility and competitive pressure' },
      { factor: 'Technology Risk', impact: 'medium', probability: 45, description: 'Implementation and adoption challenges' },
      { factor: 'Execution Risk', impact: 'medium', probability: 40, description: 'Project management and delivery risks' },
      { factor: 'Financial Risk', impact: 'low', probability: 25, description: 'Funding and cash flow risks' }
    ],
    mitigationStrategies: [
      'Phased implementation approach',
      'Strong project management and governance',
      'Market research and validation',
      'Technology partnerships and expertise',
      'Financial planning and contingency reserves'
    ],
    confidenceLevel: 82
  },
  recommendedPath: 'Begin with AI Technology Integration as the foundation, then expand to SaaS markets domestically before pursuing international expansion. This staged approach maximizes ROI while managing risk exposure.',
  sensitivityAnalysis: {
    variables: [
      { name: 'Market Growth Rate', baseValue: 20, range: [10, 35], unit: '%' },
      { name: 'Competition Intensity', baseValue: 6, range: [3, 9], unit: 'score' },
      { name: 'Technology Adoption', baseValue: 30, range: [15, 50], unit: '%' },
      { name: 'Customer Acquisition Cost', baseValue: 150, range: [100, 250], unit: '$' }
    ],
    results: [
      { variable: 'Market Growth Rate', change: 10, impact: 3500000, scenario: 'Optimistic Growth' },
      { variable: 'Market Growth Rate', change: -5, impact: -2200000, scenario: 'Pessimistic Growth' },
      { variable: 'Competition Intensity', change: 3, impact: -1800000, scenario: 'High Competition' },
      { variable: 'Technology Adoption', change: 15, impact: 2800000, scenario: 'Fast Tech Adoption' },
      { variable: 'Customer Acquisition Cost', change: -50, impact: 1500000, scenario: 'Efficient Acquisition' }
    ]
  },
  monteCarloSimulation: {
    iterations: 10000,
    expectedValue: 18500000,
    standardDeviation: 4200000,
    valueAtRisk: 12800000,
    distribution: [
      { value: 8000000, probability: 0.05 },
      { value: 12000000, probability: 0.15 },
      { value: 16000000, probability: 0.25 },
      { value: 20000000, probability: 0.30 },
      { value: 24000000, probability: 0.20 },
      { value: 28000000, probability: 0.05 }
    ],
    confidenceIntervals: [
      { level: 90, lower: 11200000, upper: 25800000 },
      { level: 95, lower: 10100000, upper: 26900000 },
      { level: 99, lower: 8500000, upper: 28500000 }
    ]
  }
};

// Tutorial steps for guided demonstration
const tutorialSteps = [
  {
    id: 'overview',
    title: 'Interactive Modeling Overview',
    description: 'Learn how to use real-time scenario modeling for strategic planning',
    content: `Interactive Modeling allows you to adjust key business variables in real-time and see immediate impact on strategic outcomes. This powerful tool integrates with all other strategic components to provide a unified modeling experience.`
  },
  {
    id: 'variables',
    title: 'Adjusting Variables',
    description: 'Control growth rates, market conditions, and risk factors',
    content: `Use sliders and input controls to adjust key variables like:
    • Revenue Growth Rate (0-50%)
    • Market Conditions (0.5x to 1.5x multiplier)
    • Risk Adjustment (1-20% discount factor)
    • Cost Inflation (0-10% annual increase)
    • Capital Efficiency (0.5x to 1.2x utilization)`
  },
  {
    id: 'live_preview',
    title: 'Live Impact Preview',
    description: 'See real-time impact on revenue, valuation, and risk metrics',
    content: `The Live Preview shows immediate impact of your variable changes:
    • Revenue Impact: Percentage change from baseline
    • Valuation Impact: Change in company valuation
    • Risk Score: Adjusted risk assessment
    • Interactive charts showing 5-year projections`
  },
  {
    id: 'scenarios',
    title: 'Scenario Management',
    description: 'Save, load, and compare different strategic scenarios',
    content: `Create and manage multiple scenarios:
    • Save current variable settings as named scenarios
    • Load previously saved scenarios
    • Export/import scenario configurations
    • Compare up to 4 scenarios side-by-side`
  },
  {
    id: 'integration',
    title: 'Component Integration',
    description: 'Unified experience across all strategic tools',
    content: `Interactive Modeling integrates with:
    • Scenario Matrix: Real-time scenario updates
    • Capital Structure: Dynamic optimization
    • Exit Strategy: Timing optimization
    • All changes propagate instantly across components`
  }
];

interface InteractiveModelingExampleProps {
  onLaunchDemo?: () => void;
}

const InteractiveModelingExample: React.FC<InteractiveModelingExampleProps> = ({ onLaunchDemo }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [showDemo, setShowDemo] = useState(false);
  const [demoMode, setDemoMode] = useState<'tutorial' | 'sandbox' | 'unified'>('tutorial');

  const handleStartDemo = () => {
    setShowDemo(true);
    onLaunchDemo?.();
  };

  const handleResetDemo = () => {
    setShowDemo(false);
    setActiveStep(0);
    setDemoMode('tutorial');
  };

  return (
    <div className="space-y-6">
      {!showDemo ? (
        <>
          {/* Introduction */}
          <Card className="border-tier-enterprise">
            <CardHeader>
              <CardTitle className="text-tier-enterprise flex items-center space-x-2">
                <Activity className="h-6 w-6" />
                <span>Interactive Scenario Modeling Demo</span>
              </CardTitle>
              <CardDescription>
                Experience real-time strategic modeling with dynamic variable adjustment and integrated component updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Feature Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Zap className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium text-blue-900">Real-time Updates</h4>
                      </div>
                      <p className="text-sm text-blue-800">
                        Instant impact visualization as you adjust variables
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium text-green-900">Scenario Management</h4>
                      </div>
                      <p className="text-sm text-green-800">
                        Save, load, and compare multiple strategic scenarios
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                        <h4 className="font-medium text-purple-900">Unified Integration</h4>
                      </div>
                      <p className="text-sm text-purple-800">
                        Seamless integration with all strategic components
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Demo Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Choose Your Experience</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => {
                        setDemoMode('tutorial');
                        handleStartDemo();
                      }}
                      className="h-auto p-4 justify-start"
                      variant="outline"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-5 w-5" />
                          <span className="font-medium">Guided Tutorial</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Step-by-step walkthrough of all features
                        </p>
                      </div>
                    </Button>

                    <Button
                      onClick={() => {
                        setDemoMode('sandbox');
                        handleStartDemo();
                      }}
                      className="h-auto p-4 justify-start"
                      variant="outline"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <PlayCircle className="h-5 w-5" />
                          <span className="font-medium">Interactive Sandbox</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Explore modeling features freely
                        </p>
                      </div>
                    </Button>

                    <Button
                      onClick={() => {
                        setDemoMode('unified');
                        handleStartDemo();
                      }}
                      className="h-auto p-4 justify-start"
                      variant="outline"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5" />
                          <span className="font-medium">Unified Dashboard</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Full integrated strategic dashboard
                        </p>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Key Features */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Key Capabilities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center space-x-2">
                        <Lightbulb className="h-4 w-4" />
                        <span>Variable Controls</span>
                      </h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Interactive sliders for all key variables</li>
                        <li>• Category-based organization (Growth, Market, Risk, etc.)</li>
                        <li>• Variable locking to preserve settings</li>
                        <li>• Impact indicators (High/Medium/Low)</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center space-x-2">
                        <Activity className="h-4 w-4" />
                        <span>Live Analysis</span>
                      </h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Real-time impact calculation</li>
                        <li>• Interactive projection charts</li>
                        <li>• Risk score updates</li>
                        <li>• ROI and valuation changes</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center space-x-2">
                        <Target className="h-4 w-4" />
                        <span>Scenario Management</span>
                      </h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Save unlimited scenarios</li>
                        <li>• Export/import configurations</li>
                        <li>• Side-by-side comparison</li>
                        <li>• Undo/redo functionality</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Integration</span>
                      </h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Unified dashboard experience</li>
                        <li>• Cross-component synchronization</li>
                        <li>• Auto-update propagation</li>
                        <li>• Consistent data flow</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Scenarios Included</CardTitle>
              <CardDescription>
                Pre-configured scenarios to demonstrate different strategic approaches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {demoScenarios.scenarios.map((scenario) => (
                  <Card key={scenario.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{scenario.name}</h4>
                          <Badge
                            variant={scenario.riskLevel === 'low' ? 'default' : scenario.riskLevel === 'medium' ? 'secondary' : 'destructive'}
                          >
                            {scenario.riskLevel} risk
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Expected ROI:</span>
                            <span className="font-medium text-green-600">{scenario.expectedROI}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Investment:</span>
                            <span className="font-medium">${(scenario.investmentRequired / 1000000).toFixed(1)}M</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Timeline:</span>
                            <span className="font-medium">{scenario.timeline} months</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Success Rate:</span>
                            <span className="font-medium">{scenario.probabilityOfSuccess}%</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 mb-1">Key Drivers:</p>
                          <div className="flex flex-wrap gap-1">
                            {scenario.keyDrivers.slice(0, 2).map((driver, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {driver}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Demo Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Demo Active
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Mode: {demoMode.charAt(0).toUpperCase() + demoMode.slice(1)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleResetDemo}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Demo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tutorial Mode */}
          {demoMode === 'tutorial' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Tutorial: {tutorialSteps[activeStep].title}</CardTitle>
                    <Badge variant="outline">
                      Step {activeStep + 1} of {tutorialSteps.length}
                    </Badge>
                  </div>
                  <CardDescription>
                    {tutorialSteps[activeStep].description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        {tutorialSteps[activeStep].content}
                      </AlertDescription>
                    </Alert>

                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                        disabled={activeStep === 0}
                      >
                        Previous
                      </Button>

                      <div className="flex space-x-1">
                        {tutorialSteps.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index === activeStep ? 'bg-tier-enterprise' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>

                      <Button
                        onClick={() => setActiveStep(Math.min(tutorialSteps.length - 1, activeStep + 1))}
                        disabled={activeStep === tutorialSteps.length - 1}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <InteractiveModeling data={demoScenarios} />
            </div>
          )}

          {/* Sandbox Mode */}
          {demoMode === 'sandbox' && (
            <div className="space-y-6">
              <Alert>
                <PlayCircle className="h-4 w-4" />
                <AlertDescription>
                  Sandbox Mode: Freely explore all interactive modeling features. Try adjusting variables, saving scenarios, and using the comparison tools.
                </AlertDescription>
              </Alert>

              <InteractiveModeling data={demoScenarios} />
            </div>
          )}

          {/* Unified Dashboard Mode */}
          {demoMode === 'unified' && (
            <div className="space-y-6">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Unified Dashboard: Experience the full integrated strategic dashboard with live synchronization between all components.
                </AlertDescription>
              </Alert>

              <UnifiedStrategicDashboard initialData={demoScenarios} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InteractiveModelingExample;