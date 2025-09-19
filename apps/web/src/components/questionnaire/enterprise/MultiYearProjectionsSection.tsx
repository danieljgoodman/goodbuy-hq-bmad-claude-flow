import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  TrendingUp,
  Globe,
  Building,
  Zap,
  Calculator,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';

const multiYearProjectionsSchema = z.object({
  fiveYearProjections: z.object({
    revenueProjections: z.array(z.object({
      year: z.number(),
      revenue: z.number().min(0),
      growthRate: z.number(),
      assumptions: z.array(z.string())
    })),
    marginEvolution: z.array(z.object({
      year: z.number(),
      grossMargin: z.number(),
      operatingMargin: z.number(),
      netMargin: z.number(),
      drivers: z.array(z.string())
    })),
    capitalRequirements: z.array(z.object({
      year: z.number(),
      capex: z.number().min(0),
      workingCapital: z.number(),
      totalCapital: z.number().min(0),
      fundingSources: z.array(z.string())
    }))
  }),
  marketEvolution: z.object({
    marketPosition: z.enum(['leader', 'challenger', 'follower', 'niche']),
    competitiveThreats: z.array(z.object({
      threat: z.string(),
      impact: z.enum(['low', 'medium', 'high', 'critical']),
      timeline: z.number().min(0),
      mitigation: z.string()
    })),
    disruptionRisk: z.enum(['low', 'medium', 'high', 'critical']),
    technologyImpact: z.string(),
    regulatoryChanges: z.array(z.string())
  }),
  strategicOptions: z.array(z.object({
    option: z.string(),
    description: z.string(),
    type: z.enum(['international_expansion', 'platform_development', 'franchising', 'vertical_integration', 'rollup', 'other']),
    investmentRequired: z.number().min(0),
    expectedROI: z.number(),
    timeline: z.number().min(0),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
    prerequisites: z.array(z.string()),
    successFactors: z.array(z.string())
  })),
  optionAnalysis: z.object({
    prioritization: z.array(z.string()),
    investmentSequencing: z.array(z.object({
      phase: z.number(),
      options: z.array(z.string()),
      totalInvestment: z.number().min(0),
      timeline: z.number().min(0)
    })),
    sensitivityAnalysis: z.array(z.object({
      variable: z.string(),
      baseCase: z.number(),
      optimistic: z.number(),
      pessimistic: z.number(),
      impact: z.string()
    }))
  })
});

interface MultiYearProjectionsSectionProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const MultiYearProjectionsSection: React.FC<MultiYearProjectionsSectionProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [activeTab, setActiveTab] = useState('projections');
  const sectionData = data.multiYearProjections || {};

  const updateField = (category: string, field: string, value: any) => {
    const updated = {
      ...data,
      multiYearProjections: {
        ...sectionData,
        [category]: {
          ...sectionData[category],
          [field]: value
        }
      }
    };
    onUpdate(updated);
  };

  const addToArray = (category: string, field: string, value: any) => {
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

  // Initialize 5-year projections if empty
  const initializeProjections = () => {
    const currentYear = new Date().getFullYear();
    const years = [1, 2, 3, 4, 5];

    if (!sectionData.fiveYearProjections?.revenueProjections?.length) {
      const revenueProjections = years.map(year => ({
        year: currentYear + year,
        revenue: 0,
        growthRate: 0,
        assumptions: []
      }));
      updateField('fiveYearProjections', 'revenueProjections', revenueProjections);
    }

    if (!sectionData.fiveYearProjections?.marginEvolution?.length) {
      const marginEvolution = years.map(year => ({
        year: currentYear + year,
        grossMargin: 0,
        operatingMargin: 0,
        netMargin: 0,
        drivers: []
      }));
      updateField('fiveYearProjections', 'marginEvolution', marginEvolution);
    }

    if (!sectionData.fiveYearProjections?.capitalRequirements?.length) {
      const capitalRequirements = years.map(year => ({
        year: currentYear + year,
        capex: 0,
        workingCapital: 0,
        totalCapital: 0,
        fundingSources: []
      }));
      updateField('fiveYearProjections', 'capitalRequirements', capitalRequirements);
    }
  };

  // Initialize projections on component mount
  React.useEffect(() => {
    initializeProjections();
  }, []);

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
          <div className="p-3 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl">
            <LineChart className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Multi-Year Projections & Strategic Options
            </h2>
            <Badge variant="secondary" className="tier-enterprise mt-2">
              Section 10 of 10
            </Badge>
          </div>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Build comprehensive 5-year financial projections, analyze market evolution,
          and evaluate strategic options for long-term value creation.
        </p>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projections">Financial Projections</TabsTrigger>
            <TabsTrigger value="market">Market Evolution</TabsTrigger>
            <TabsTrigger value="options">Strategic Options</TabsTrigger>
            <TabsTrigger value="analysis">Option Analysis</TabsTrigger>
          </TabsList>

          {/* Financial Projections Tab */}
          <TabsContent value="projections">
            <div className="space-y-6">
              {/* Revenue Projections */}
              <Card className="tier-enterprise">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>5-Year Revenue Projections</span>
                  </CardTitle>
                  <CardDescription>
                    Project revenue growth and key assumptions for the next 5 years
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Year</th>
                          <th className="text-left p-3 font-medium">Revenue ($)</th>
                          <th className="text-left p-3 font-medium">Growth Rate (%)</th>
                          <th className="text-left p-3 font-medium">Key Assumptions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(sectionData.fiveYearProjections?.revenueProjections || []).map((projection: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="p-3 font-medium">{projection.year}</td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                value={projection.revenue || ''}
                                onChange={(e) => updateArrayItem('fiveYearProjections', 'revenueProjections', index, {
                                  revenue: Number(e.target.value)
                                })}
                                className="tier-enterprise w-32"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                value={projection.growthRate || ''}
                                onChange={(e) => updateArrayItem('fiveYearProjections', 'revenueProjections', index, {
                                  growthRate: Number(e.target.value)
                                })}
                                className="tier-enterprise w-24"
                              />
                            </td>
                            <td className="p-3">
                              <Textarea
                                value={projection.assumptions?.join(', ') || ''}
                                onChange={(e) => updateArrayItem('fiveYearProjections', 'revenueProjections', index, {
                                  assumptions: e.target.value.split(', ').filter(a => a.trim())
                                })}
                                className="tier-enterprise"
                                rows={2}
                                placeholder="Key assumptions for this year"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Margin Evolution */}
              <Card className="tier-enterprise">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Margin Evolution</span>
                  </CardTitle>
                  <CardDescription>
                    Track how margins evolve over the 5-year period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Year</th>
                          <th className="text-left p-3 font-medium">Gross Margin (%)</th>
                          <th className="text-left p-3 font-medium">Operating Margin (%)</th>
                          <th className="text-left p-3 font-medium">Net Margin (%)</th>
                          <th className="text-left p-3 font-medium">Key Drivers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(sectionData.fiveYearProjections?.marginEvolution || []).map((margin: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="p-3 font-medium">{margin.year}</td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={margin.grossMargin || ''}
                                onChange={(e) => updateArrayItem('fiveYearProjections', 'marginEvolution', index, {
                                  grossMargin: Number(e.target.value)
                                })}
                                className="tier-enterprise w-24"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                value={margin.operatingMargin || ''}
                                onChange={(e) => updateArrayItem('fiveYearProjections', 'marginEvolution', index, {
                                  operatingMargin: Number(e.target.value)
                                })}
                                className="tier-enterprise w-24"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                value={margin.netMargin || ''}
                                onChange={(e) => updateArrayItem('fiveYearProjections', 'marginEvolution', index, {
                                  netMargin: Number(e.target.value)
                                })}
                                className="tier-enterprise w-24"
                              />
                            </td>
                            <td className="p-3">
                              <Textarea
                                value={margin.drivers?.join(', ') || ''}
                                onChange={(e) => updateArrayItem('fiveYearProjections', 'marginEvolution', index, {
                                  drivers: e.target.value.split(', ').filter(d => d.trim())
                                })}
                                className="tier-enterprise"
                                rows={2}
                                placeholder="Margin improvement drivers"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Capital Requirements */}
              <Card className="tier-enterprise">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-purple-600" />
                    <span>Capital Requirements</span>
                  </CardTitle>
                  <CardDescription>
                    Plan capital expenditures and funding requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Year</th>
                          <th className="text-left p-3 font-medium">CapEx ($)</th>
                          <th className="text-left p-3 font-medium">Working Capital ($)</th>
                          <th className="text-left p-3 font-medium">Total Capital ($)</th>
                          <th className="text-left p-3 font-medium">Funding Sources</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(sectionData.fiveYearProjections?.capitalRequirements || []).map((capital: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="p-3 font-medium">{capital.year}</td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                value={capital.capex || ''}
                                onChange={(e) => updateArrayItem('fiveYearProjections', 'capitalRequirements', index, {
                                  capex: Number(e.target.value)
                                })}
                                className="tier-enterprise w-32"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                value={capital.workingCapital || ''}
                                onChange={(e) => updateArrayItem('fiveYearProjections', 'capitalRequirements', index, {
                                  workingCapital: Number(e.target.value)
                                })}
                                className="tier-enterprise w-32"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                value={capital.totalCapital || ''}
                                onChange={(e) => updateArrayItem('fiveYearProjections', 'capitalRequirements', index, {
                                  totalCapital: Number(e.target.value)
                                })}
                                className="tier-enterprise w-32"
                              />
                            </td>
                            <td className="p-3">
                              <Textarea
                                value={capital.fundingSources?.join(', ') || ''}
                                onChange={(e) => updateArrayItem('fiveYearProjections', 'capitalRequirements', index, {
                                  fundingSources: e.target.value.split(', ').filter(s => s.trim())
                                })}
                                className="tier-enterprise"
                                rows={2}
                                placeholder="Cash flow, debt, equity, etc."
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Market Evolution Tab */}
          <TabsContent value="market">
            <div className="space-y-6">
              {/* Market Position */}
              <Card className="tier-enterprise">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span>Market Position & Evolution</span>
                  </CardTitle>
                  <CardDescription>
                    Assess your current market position and future evolution
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="marketPosition">Current Market Position</Label>
                      <Select
                        value={sectionData.marketEvolution?.marketPosition || ''}
                        onValueChange={(value) => updateField('marketEvolution', 'marketPosition', value)}
                      >
                        <SelectTrigger className="tier-enterprise">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="leader">Market Leader</SelectItem>
                          <SelectItem value="challenger">Challenger</SelectItem>
                          <SelectItem value="follower">Follower</SelectItem>
                          <SelectItem value="niche">Niche Player</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="disruptionRisk">Disruption Risk Level</Label>
                      <Select
                        value={sectionData.marketEvolution?.disruptionRisk || ''}
                        onValueChange={(value) => updateField('marketEvolution', 'disruptionRisk', value)}
                      >
                        <SelectTrigger className="tier-enterprise">
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Risk</SelectItem>
                          <SelectItem value="medium">Medium Risk</SelectItem>
                          <SelectItem value="high">High Risk</SelectItem>
                          <SelectItem value="critical">Critical Risk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="technologyImpact">Technology Impact Assessment</Label>
                      <Textarea
                        id="technologyImpact"
                        value={sectionData.marketEvolution?.technologyImpact || ''}
                        onChange={(e) => updateField('marketEvolution', 'technologyImpact', e.target.value)}
                        className="tier-enterprise"
                        rows={3}
                        placeholder="How will technology impact your industry?"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Competitive Threats */}
              <Card className="tier-enterprise">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span>Competitive Threats</span>
                  </CardTitle>
                  <CardDescription>
                    Identify and assess potential competitive threats
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(sectionData.marketEvolution?.competitiveThreats || []).map((threat: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Threat Description</Label>
                          <Input
                            value={threat.threat || ''}
                            onChange={(e) => updateArrayItem('marketEvolution', 'competitiveThreats', index, {
                              threat: e.target.value
                            })}
                            className="tier-enterprise"
                            placeholder="Describe the competitive threat"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mitigation Strategy</Label>
                          <Input
                            value={threat.mitigation || ''}
                            onChange={(e) => updateArrayItem('marketEvolution', 'competitiveThreats', index, {
                              mitigation: e.target.value
                            })}
                            className="tier-enterprise"
                            placeholder="How will you mitigate this threat?"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Impact Level</Label>
                          <Select
                            value={threat.impact || ''}
                            onValueChange={(value) => updateArrayItem('marketEvolution', 'competitiveThreats', index, {
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
                          <Label>Timeline (months)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={threat.timeline || ''}
                            onChange={(e) => updateArrayItem('marketEvolution', 'competitiveThreats', index, {
                              timeline: Number(e.target.value)
                            })}
                            className="tier-enterprise"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromArray('marketEvolution', 'competitiveThreats', index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addToArray('marketEvolution', 'competitiveThreats', {
                      threat: '',
                      impact: 'medium',
                      timeline: 12,
                      mitigation: ''
                    })}
                  >
                    Add Competitive Threat
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Strategic Options Tab */}
          <TabsContent value="options">
            <div className="space-y-6">
              <Card className="tier-enterprise">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    <span>Strategic Growth Options</span>
                  </CardTitle>
                  <CardDescription>
                    Evaluate different strategic options for business growth
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(sectionData.strategicOptions || []).map((option: any, index: number) => (
                    <div key={index} className="p-6 border rounded-lg space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Strategic Option</Label>
                          <Input
                            value={option.option || ''}
                            onChange={(e) => updateArrayItem('strategicOptions', '', index, {
                              option: e.target.value
                            })}
                            className="tier-enterprise"
                            placeholder="Name of strategic option"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Option Type</Label>
                          <Select
                            value={option.type || ''}
                            onValueChange={(value) => updateArrayItem('strategicOptions', '', index, {
                              type: value
                            })}
                          >
                            <SelectTrigger className="tier-enterprise">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="international_expansion">International Expansion</SelectItem>
                              <SelectItem value="platform_development">Platform Development</SelectItem>
                              <SelectItem value="franchising">Franchising</SelectItem>
                              <SelectItem value="vertical_integration">Vertical Integration</SelectItem>
                              <SelectItem value="rollup">Roll-up Strategy</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={option.description || ''}
                          onChange={(e) => updateArrayItem('strategicOptions', '', index, {
                            description: e.target.value
                          })}
                          className="tier-enterprise"
                          rows={3}
                          placeholder="Detailed description of the strategic option"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Investment Required ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={option.investmentRequired || ''}
                            onChange={(e) => updateArrayItem('strategicOptions', '', index, {
                              investmentRequired: Number(e.target.value)
                            })}
                            className="tier-enterprise"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Expected ROI (%)</Label>
                          <Input
                            type="number"
                            value={option.expectedROI || ''}
                            onChange={(e) => updateArrayItem('strategicOptions', '', index, {
                              expectedROI: Number(e.target.value)
                            })}
                            className="tier-enterprise"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Timeline (months)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={option.timeline || ''}
                            onChange={(e) => updateArrayItem('strategicOptions', '', index, {
                              timeline: Number(e.target.value)
                            })}
                            className="tier-enterprise"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Risk Level</Label>
                          <Select
                            value={option.riskLevel || ''}
                            onValueChange={(value) => updateArrayItem('strategicOptions', '', index, {
                              riskLevel: value
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
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Prerequisites</Label>
                          <Textarea
                            value={option.prerequisites?.join(', ') || ''}
                            onChange={(e) => updateArrayItem('strategicOptions', '', index, {
                              prerequisites: e.target.value.split(', ').filter(p => p.trim())
                            })}
                            className="tier-enterprise"
                            rows={2}
                            placeholder="What needs to happen first?"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Success Factors</Label>
                          <Textarea
                            value={option.successFactors?.join(', ') || ''}
                            onChange={(e) => updateArrayItem('strategicOptions', '', index, {
                              successFactors: e.target.value.split(', ').filter(f => f.trim())
                            })}
                            className="tier-enterprise"
                            rows={2}
                            placeholder="Key factors for success"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromArray('strategicOptions', '', index)}
                        >
                          Remove Option
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addToArray('strategicOptions', '', {
                      option: '',
                      description: '',
                      type: 'other',
                      investmentRequired: 0,
                      expectedROI: 0,
                      timeline: 12,
                      riskLevel: 'medium',
                      prerequisites: [],
                      successFactors: []
                    })}
                  >
                    Add Strategic Option
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Option Analysis Tab */}
          <TabsContent value="analysis">
            <div className="space-y-6">
              {/* Prioritization */}
              <Card className="tier-enterprise">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span>Option Prioritization & Sequencing</span>
                  </CardTitle>
                  <CardDescription>
                    Rank and sequence your strategic options for optimal execution
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Priority Ranking (1 = Highest Priority)</Label>
                    <div className="space-y-2">
                      {(sectionData.optionAnalysis?.prioritization || []).map((priority: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <Input
                            value={priority}
                            onChange={(e) => {
                              const updated = [...(sectionData.optionAnalysis?.prioritization || [])];
                              updated[index] = e.target.value;
                              updateField('optionAnalysis', 'prioritization', updated);
                            }}
                            className="tier-enterprise"
                            placeholder="Strategic option name"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromArray('optionAnalysis', 'prioritization', index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => addToArray('optionAnalysis', 'prioritization', '')}
                      >
                        Add Priority
                      </Button>
                    </div>
                  </div>

                  {/* Investment Sequencing */}
                  <div className="space-y-3">
                    <Label>Investment Sequencing by Phase</Label>
                    <div className="space-y-4">
                      {(sectionData.optionAnalysis?.investmentSequencing || []).map((phase: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Phase Number</Label>
                              <Input
                                type="number"
                                min="1"
                                value={phase.phase || ''}
                                onChange={(e) => updateArrayItem('optionAnalysis', 'investmentSequencing', index, {
                                  phase: Number(e.target.value)
                                })}
                                className="tier-enterprise"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Total Investment ($)</Label>
                              <Input
                                type="number"
                                min="0"
                                value={phase.totalInvestment || ''}
                                onChange={(e) => updateArrayItem('optionAnalysis', 'investmentSequencing', index, {
                                  totalInvestment: Number(e.target.value)
                                })}
                                className="tier-enterprise"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Timeline (months)</Label>
                              <Input
                                type="number"
                                min="0"
                                value={phase.timeline || ''}
                                onChange={(e) => updateArrayItem('optionAnalysis', 'investmentSequencing', index, {
                                  timeline: Number(e.target.value)
                                })}
                                className="tier-enterprise"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Options in this Phase</Label>
                            <Textarea
                              value={phase.options?.join(', ') || ''}
                              onChange={(e) => updateArrayItem('optionAnalysis', 'investmentSequencing', index, {
                                options: e.target.value.split(', ').filter(o => o.trim())
                              })}
                              className="tier-enterprise"
                              rows={2}
                              placeholder="List strategic options for this phase"
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromArray('optionAnalysis', 'investmentSequencing', index)}
                            >
                              Remove Phase
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => addToArray('optionAnalysis', 'investmentSequencing', {
                          phase: 1,
                          options: [],
                          totalInvestment: 0,
                          timeline: 12
                        })}
                      >
                        Add Phase
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sensitivity Analysis */}
              <Card className="tier-enterprise">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Sensitivity Analysis</span>
                  </CardTitle>
                  <CardDescription>
                    Analyze how key variables affect your strategic options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(sectionData.optionAnalysis?.sensitivityAnalysis || []).map((analysis: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Variable</Label>
                          <Input
                            value={analysis.variable || ''}
                            onChange={(e) => updateArrayItem('optionAnalysis', 'sensitivityAnalysis', index, {
                              variable: e.target.value
                            })}
                            className="tier-enterprise"
                            placeholder="e.g., Market growth rate"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Impact Description</Label>
                          <Input
                            value={analysis.impact || ''}
                            onChange={(e) => updateArrayItem('optionAnalysis', 'sensitivityAnalysis', index, {
                              impact: e.target.value
                            })}
                            className="tier-enterprise"
                            placeholder="How does this variable impact outcomes?"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Base Case</Label>
                          <Input
                            type="number"
                            value={analysis.baseCase || ''}
                            onChange={(e) => updateArrayItem('optionAnalysis', 'sensitivityAnalysis', index, {
                              baseCase: Number(e.target.value)
                            })}
                            className="tier-enterprise"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Optimistic</Label>
                          <Input
                            type="number"
                            value={analysis.optimistic || ''}
                            onChange={(e) => updateArrayItem('optionAnalysis', 'sensitivityAnalysis', index, {
                              optimistic: Number(e.target.value)
                            })}
                            className="tier-enterprise"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Pessimistic</Label>
                          <Input
                            type="number"
                            value={analysis.pessimistic || ''}
                            onChange={(e) => updateArrayItem('optionAnalysis', 'sensitivityAnalysis', index, {
                              pessimistic: Number(e.target.value)
                            })}
                            className="tier-enterprise"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromArray('optionAnalysis', 'sensitivityAnalysis', index)}
                        >
                          Remove Analysis
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addToArray('optionAnalysis', 'sensitivityAnalysis', {
                      variable: '',
                      baseCase: 0,
                      optimistic: 0,
                      pessimistic: 0,
                      impact: ''
                    })}
                  >
                    Add Sensitivity Analysis
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Summary Dashboard */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.5 }}
      >
        <Card className="tier-enterprise bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardHeader>
            <CardTitle>Multi-Year Planning Summary</CardTitle>
            <CardDescription>
              Key insights from your comprehensive strategic analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-indigo-600">
                  5 Years
                </div>
                <p className="text-sm text-muted-foreground">Planning Horizon</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {sectionData.strategicOptions?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Strategic Options</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {sectionData.marketEvolution?.competitiveThreats?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Competitive Threats</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {sectionData.optionAnalysis?.investmentSequencing?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Investment Phases</p>
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
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete Assessment
        </Button>
      </motion.div>
    </div>
  );
};

export { multiYearProjectionsSchema };