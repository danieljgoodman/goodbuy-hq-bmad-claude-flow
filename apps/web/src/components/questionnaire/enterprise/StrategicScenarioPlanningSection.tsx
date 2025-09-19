import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MultiScenarioWizard } from './MultiScenarioWizard';
import {
  Target,
  TrendingUp,
  MapPin,
  Clock,
  DollarSign,
  Shield,
  Users,
  Building2,
  Globe,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';

const strategicScenarioPlanningSchema = z.object({
  growthScenarios: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    probability: z.number().min(0).max(100),
    revenueGrowth: z.number(),
    marginImprovement: z.number(),
    capitalRequirement: z.number().min(0),
    timeline: z.number().min(0),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
    keyAssumptions: z.array(z.string()),
    investmentAreas: z.array(z.string()),
    expectedROI: z.number(),
    valuationImpact: z.number()
  })),
  investmentStrategies: z.object({
    organicGrowth: z.object({
      priority: z.number().min(1).max(10),
      investmentAmount: z.number().min(0),
      expectedReturn: z.number(),
      timeline: z.number().min(0),
      riskAssessment: z.enum(['low', 'medium', 'high']),
      keyInitiatives: z.array(z.string())
    }),
    acquisition: z.object({
      priority: z.number().min(1).max(10),
      targetMarketSize: z.number().min(0),
      averageDealSize: z.number().min(0),
      expectedSynergies: z.number(),
      integrationComplexity: z.enum(['low', 'medium', 'high']),
      targetCriteria: z.array(z.string())
    }),
    marketExpansion: z.object({
      priority: z.number().min(1).max(10),
      targetMarkets: z.array(z.string()),
      investmentRequired: z.number().min(0),
      expectedRevenue: z.number().min(0),
      timeToBreakeven: z.number().min(0),
      marketingStrategy: z.string()
    })
  }),
  exitPlanning: z.object({
    preferredTimeline: z.number().min(0),
    exitStrategy: z.enum(['strategic_sale', 'financial_buyer', 'ipo', 'management_buyout', 'family_succession', 'liquidation']),
    strategyRanking: z.array(z.string()),
    readinessScore: z.number().min(0).max(100),
    advisorTeam: z.object({
      investmentBanker: z.boolean(),
      attorney: z.boolean(),
      accountant: z.boolean(),
      taxAdvisor: z.boolean(),
      wealthManager: z.boolean()
    }),
    preparationGaps: z.array(z.string())
  }),
  valueMaximization: z.object({
    driverPriorities: z.array(z.object({
      driver: z.string(),
      currentScore: z.number().min(0).max(100),
      targetScore: z.number().min(0).max(100),
      investmentRequired: z.number().min(0),
      timeline: z.number().min(0),
      impactLevel: z.enum(['low', 'medium', 'high', 'critical'])
    })),
    investmentSequencing: z.array(z.string()),
    riskMitigation: z.array(z.object({
      risk: z.string(),
      impact: z.enum(['low', 'medium', 'high', 'critical']),
      probability: z.enum(['low', 'medium', 'high']),
      mitigation: z.string(),
      cost: z.number().min(0)
    }))
  })
});

interface StrategicScenarioPlanningProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const StrategicScenarioPlanningSection: React.FC<StrategicScenarioPlanningProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const sectionData = data.strategicScenarioPlanning || {};

  const updateField = (category: string, field: string, value: any) => {
    const updated = {
      ...data,
      strategicScenarioPlanning: {
        ...sectionData,
        [category]: {
          ...sectionData[category],
          [field]: value
        }
      }
    };
    onUpdate(updated);
  };

  const updateScenarios = (scenarios: any[]) => {
    updateField('growthScenarios', '', scenarios);
  };

  const addToArray = (category: string, field: string, value: string | object) => {
    if (typeof value === 'string' && !value.trim()) return;
    const currentArray = sectionData[category]?.[field] || [];
    updateField(category, field, [...currentArray, value]);
  };

  const removeFromArray = (category: string, field: string, index: number) => {
    const currentArray = sectionData[category]?.[field] || [];
    updateField(category, field, currentArray.filter((_: unknown, i: number) => i !== index));
  };

  const updateArrayItem = (category: string, field: string, index: number, updates: any) => {
    const currentArray = sectionData[category]?.[field] || [];
    const updatedArray = currentArray.map((item: any, i: number) =>
      i === index ? { ...item, ...updates } : item
    );
    updateField(category, field, updatedArray);
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
            <Target className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Strategic Scenario Planning & Exit Optimization
            </h2>
            <Badge variant="secondary" className="tier-enterprise mt-2">
              Section 9 of 10
            </Badge>
          </div>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Plan multiple growth scenarios, investment strategies, exit planning, and value maximization
          to optimize your strategic decisions and future outcomes.
        </p>
      </motion.div>

      {/* Growth Scenarios */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.1 }}
      >
        <Card className="tier-enterprise">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Growth Scenarios Analysis</span>
            </CardTitle>
            <CardDescription>
              Model different growth scenarios to understand potential outcomes and plan accordingly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultiScenarioWizard
              scenarios={sectionData.growthScenarios || []}
              onUpdate={updateScenarios}
              onAnalyze={() => {
                // Analytics functionality could be implemented here
                console.log('Analyzing scenarios...');
              }}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Investment Strategies */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.2 }}
      >
        <Card className="tier-enterprise">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span>Investment Strategies</span>
            </CardTitle>
            <CardDescription>
              Evaluate and prioritize different investment approaches for growth
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Organic Growth */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-green-600" />
                <h4 className="text-lg font-semibold">Organic Growth Strategy</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="organicPriority">Priority (1-10)</Label>
                  <Input
                    id="organicPriority"
                    type="number"
                    min="1"
                    max="10"
                    value={sectionData.investmentStrategies?.organicGrowth?.priority || ''}
                    onChange={(e) => updateField('investmentStrategies', 'organicGrowth', {
                      ...sectionData.investmentStrategies?.organicGrowth,
                      priority: Number(e.target.value)
                    })}
                    className="tier-enterprise"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="organicInvestment">Investment Amount ($)</Label>
                  <Input
                    id="organicInvestment"
                    type="number"
                    min="0"
                    value={sectionData.investmentStrategies?.organicGrowth?.investmentAmount || ''}
                    onChange={(e) => updateField('investmentStrategies', 'organicGrowth', {
                      ...sectionData.investmentStrategies?.organicGrowth,
                      investmentAmount: Number(e.target.value)
                    })}
                    className="tier-enterprise"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="organicReturn">Expected Return (%)</Label>
                  <Input
                    id="organicReturn"
                    type="number"
                    value={sectionData.investmentStrategies?.organicGrowth?.expectedReturn || ''}
                    onChange={(e) => updateField('investmentStrategies', 'organicGrowth', {
                      ...sectionData.investmentStrategies?.organicGrowth,
                      expectedReturn: Number(e.target.value)
                    })}
                    className="tier-enterprise"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Acquisition Strategy */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h4 className="text-lg font-semibold">Acquisition Strategy</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="acquisitionPriority">Priority (1-10)</Label>
                  <Input
                    id="acquisitionPriority"
                    type="number"
                    min="1"
                    max="10"
                    value={sectionData.investmentStrategies?.acquisition?.priority || ''}
                    onChange={(e) => updateField('investmentStrategies', 'acquisition', {
                      ...sectionData.investmentStrategies?.acquisition,
                      priority: Number(e.target.value)
                    })}
                    className="tier-enterprise"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="targetMarketSize">Target Market Size ($)</Label>
                  <Input
                    id="targetMarketSize"
                    type="number"
                    min="0"
                    value={sectionData.investmentStrategies?.acquisition?.targetMarketSize || ''}
                    onChange={(e) => updateField('investmentStrategies', 'acquisition', {
                      ...sectionData.investmentStrategies?.acquisition,
                      targetMarketSize: Number(e.target.value)
                    })}
                    className="tier-enterprise"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="averageDealSize">Average Deal Size ($)</Label>
                  <Input
                    id="averageDealSize"
                    type="number"
                    min="0"
                    value={sectionData.investmentStrategies?.acquisition?.averageDealSize || ''}
                    onChange={(e) => updateField('investmentStrategies', 'acquisition', {
                      ...sectionData.investmentStrategies?.acquisition,
                      averageDealSize: Number(e.target.value)
                    })}
                    className="tier-enterprise"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Market Expansion */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-purple-600" />
                <h4 className="text-lg font-semibold">Market Expansion Strategy</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="expansionPriority">Priority (1-10)</Label>
                  <Input
                    id="expansionPriority"
                    type="number"
                    min="1"
                    max="10"
                    value={sectionData.investmentStrategies?.marketExpansion?.priority || ''}
                    onChange={(e) => updateField('investmentStrategies', 'marketExpansion', {
                      ...sectionData.investmentStrategies?.marketExpansion,
                      priority: Number(e.target.value)
                    })}
                    className="tier-enterprise"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="expansionInvestment">Investment Required ($)</Label>
                  <Input
                    id="expansionInvestment"
                    type="number"
                    min="0"
                    value={sectionData.investmentStrategies?.marketExpansion?.investmentRequired || ''}
                    onChange={(e) => updateField('investmentStrategies', 'marketExpansion', {
                      ...sectionData.investmentStrategies?.marketExpansion,
                      investmentRequired: Number(e.target.value)
                    })}
                    className="tier-enterprise"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="expansionRevenue">Expected Revenue ($)</Label>
                  <Input
                    id="expansionRevenue"
                    type="number"
                    min="0"
                    value={sectionData.investmentStrategies?.marketExpansion?.expectedRevenue || ''}
                    onChange={(e) => updateField('investmentStrategies', 'marketExpansion', {
                      ...sectionData.investmentStrategies?.marketExpansion,
                      expectedRevenue: Number(e.target.value)
                    })}
                    className="tier-enterprise"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Exit Planning */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.3 }}
      >
        <Card className="tier-enterprise">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              <span>Exit Planning & Strategy</span>
            </CardTitle>
            <CardDescription>
              Plan your exit strategy and assess readiness for optimal value realization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="exitTimeline">Preferred Timeline (years)</Label>
                <Input
                  id="exitTimeline"
                  type="number"
                  min="0"
                  value={sectionData.exitPlanning?.preferredTimeline || ''}
                  onChange={(e) => updateField('exitPlanning', 'preferredTimeline', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="exitStrategy">Primary Exit Strategy</Label>
                <Select
                  value={sectionData.exitPlanning?.exitStrategy || ''}
                  onValueChange={(value) => updateField('exitPlanning', 'exitStrategy', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strategic_sale">Strategic Sale</SelectItem>
                    <SelectItem value="financial_buyer">Financial Buyer (PE/VC)</SelectItem>
                    <SelectItem value="ipo">Initial Public Offering</SelectItem>
                    <SelectItem value="management_buyout">Management Buyout</SelectItem>
                    <SelectItem value="family_succession">Family Succession</SelectItem>
                    <SelectItem value="liquidation">Liquidation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="readinessScore">Exit Readiness Score (%)</Label>
                <Input
                  id="readinessScore"
                  type="number"
                  min="0"
                  max="100"
                  value={sectionData.exitPlanning?.readinessScore || ''}
                  onChange={(e) => updateField('exitPlanning', 'readinessScore', Number(e.target.value))}
                  className="tier-enterprise"
                />
                <Progress value={sectionData.exitPlanning?.readinessScore || 0} className="h-2" />
              </div>
            </div>

            {/* Advisor Team */}
            <div className="space-y-3">
              <Label>Advisory Team in Place</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { key: 'investmentBanker', label: 'Investment Banker' },
                  { key: 'attorney', label: 'Attorney' },
                  { key: 'accountant', label: 'Accountant' },
                  { key: 'taxAdvisor', label: 'Tax Advisor' },
                  { key: 'wealthManager', label: 'Wealth Manager' }
                ].map(({ key, label }, _: number) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={key}
                      checked={sectionData.exitPlanning?.advisorTeam?.[key] || false}
                      onChange={(e) => updateField('exitPlanning', 'advisorTeam', {
                        ...sectionData.exitPlanning?.advisorTeam,
                        [key]: e.target.checked
                      })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={key} className="text-sm">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Preparation Gaps */}
            <div className="space-y-3">
              <Label>Preparation Gaps</Label>
              <div className="space-y-2">
                {(sectionData.exitPlanning?.preparationGaps || []).map((gap: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={gap} readOnly className="tier-enterprise" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromArray('exitPlanning', 'preparationGaps', index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add preparation gap"
                    className="tier-enterprise"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('exitPlanning', 'preparationGaps', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addToArray('exitPlanning', 'preparationGaps', input.value);
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
      </motion.div>

      {/* Value Maximization */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.4 }}
      >
        <Card className="tier-enterprise">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <span>Value Maximization & Risk Mitigation</span>
            </CardTitle>
            <CardDescription>
              Prioritize value drivers and mitigate risks to maximize enterprise value
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Value Driver Priorities */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Value Driver Priorities</h4>
              <div className="space-y-3">
                {(sectionData.valueMaximization?.driverPriorities || []).map((driver: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Driver</Label>
                        <Input
                          value={driver.driver || ''}
                          onChange={(e) => updateArrayItem('valueMaximization', 'driverPriorities', index, {
                            driver: e.target.value
                          })}
                          className="tier-enterprise"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Current Score</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={driver.currentScore || ''}
                          onChange={(e) => updateArrayItem('valueMaximization', 'driverPriorities', index, {
                            currentScore: Number(e.target.value)
                          })}
                          className="tier-enterprise"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Target Score</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={driver.targetScore || ''}
                          onChange={(e) => updateArrayItem('valueMaximization', 'driverPriorities', index, {
                            targetScore: Number(e.target.value)
                          })}
                          className="tier-enterprise"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Investment ($)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={driver.investmentRequired || ''}
                          onChange={(e) => updateArrayItem('valueMaximization', 'driverPriorities', index, {
                            investmentRequired: Number(e.target.value)
                          })}
                          className="tier-enterprise"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromArray('valueMaximization', 'driverPriorities', index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => addToArray('valueMaximization', 'driverPriorities', {
                    driver: '',
                    currentScore: 0,
                    targetScore: 0,
                    investmentRequired: 0,
                    timeline: 0,
                    impactLevel: 'medium'
                  })}
                >
                  Add Value Driver
                </Button>
              </div>
            </div>

            <Separator />

            {/* Risk Mitigation */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Risk Mitigation Strategies</h4>
              <div className="space-y-3">
                {(sectionData.valueMaximization?.riskMitigation || []).map((risk: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Risk Description</Label>
                        <Input
                          value={risk.risk || ''}
                          onChange={(e) => updateArrayItem('valueMaximization', 'riskMitigation', index, {
                            risk: e.target.value
                          })}
                          className="tier-enterprise"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mitigation Strategy</Label>
                        <Input
                          value={risk.mitigation || ''}
                          onChange={(e) => updateArrayItem('valueMaximization', 'riskMitigation', index, {
                            mitigation: e.target.value
                          })}
                          className="tier-enterprise"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Impact Level</Label>
                        <Select
                          value={risk.impact || ''}
                          onValueChange={(value) => updateArrayItem('valueMaximization', 'riskMitigation', index, {
                            impact: value
                          })}
                        >
                          <SelectTrigger className="tier-enterprise">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Probability</Label>
                        <Select
                          value={risk.probability || ''}
                          onValueChange={(value) => updateArrayItem('valueMaximization', 'riskMitigation', index, {
                            probability: value
                          })}
                        >
                          <SelectTrigger className="tier-enterprise">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Mitigation Cost ($)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={risk.cost || ''}
                          onChange={(e) => updateArrayItem('valueMaximization', 'riskMitigation', index, {
                            cost: Number(e.target.value)
                          })}
                          className="tier-enterprise"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromArray('valueMaximization', 'riskMitigation', index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => addToArray('valueMaximization', 'riskMitigation', {
                    risk: '',
                    impact: 'medium',
                    probability: 'medium',
                    mitigation: '',
                    cost: 0
                  })}
                >
                  Add Risk Mitigation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Dashboard */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.5 }}
      >
        <Card className="tier-enterprise bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle>Strategic Planning Summary</CardTitle>
            <CardDescription>
              Key insights from your strategic scenario planning analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {sectionData.growthScenarios?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Growth Scenarios</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {sectionData.exitPlanning?.preferredTimeline || 0} years
                </div>
                <p className="text-sm text-muted-foreground">Exit Timeline</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {sectionData.exitPlanning?.readinessScore || 0}%
                </div>
                <p className="text-sm text-muted-foreground">Exit Readiness</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {sectionData.valueMaximization?.driverPriorities?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Value Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.6 }}
        className="flex justify-between pt-8"
      >
        <Button
          variant="outline"
          onClick={onPrevious}
          className="tier-enterprise"
        >
          Previous Section
        </Button>
        <Button
          onClick={onNext}
          className="tier-enterprise"
        >
          Continue to Multi-Year Projections
        </Button>
      </motion.div>
    </div>
  );
};

export { strategicScenarioPlanningSchema };