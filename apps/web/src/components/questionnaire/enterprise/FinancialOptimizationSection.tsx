import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, PieChart, TrendingDown, Calculator, Building, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';

const financialOptimizationSchema = z.object({
  taxStrategy: z.object({
    entityType: z.enum(['sole_proprietorship', 'partnership', 'llc', 's_corp', 'c_corp', 'other']),
    optimizationOpportunities: z.array(z.string()),
    taxAdvisorEngaged: z.boolean(),
    effectiveTaxRate: z.number().min(0).max(100),
    annualTaxSavings: z.number().min(0),
    taxPlanningScore: z.number().min(0).max(100)
  }),
  workingCapital: z.object({
    currentRatio: z.number().min(0),
    benchmarkRatio: z.number().min(0),
    optimizationPotential: z.number().min(0),
    cashCycleDays: z.number().min(0),
    inventoryTurnover: z.number().min(0),
    receivablesDays: z.number().min(0),
    payablesDays: z.number().min(0)
  }),
  capitalStructure: z.object({
    debtToEquityCurrent: z.number().min(0),
    debtToEquityOptimal: z.number().min(0),
    debtServiceCoverage: z.number().min(0),
    availableCapacity: z.number().min(0),
    costOfCapital: z.number().min(0),
    creditRating: z.enum(['excellent', 'good', 'fair', 'poor', 'unknown'])
  }),
  ownerCompensation: z.object({
    currentTotal: z.number().min(0),
    marketRate: z.number().min(0),
    adjustmentOpportunity: z.number(),
    compensationStructure: z.array(z.string()),
    benefitsPackage: z.array(z.string()),
    retirementContributions: z.number().min(0)
  })
});

interface FinancialOptimizationSectionProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const FinancialOptimizationSection: React.FC<FinancialOptimizationSectionProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const sectionData = data.financialOptimization || {};

  const updateField = (category: string, field: string, value: any) => {
    const updated = {
      ...data,
      financialOptimization: {
        ...sectionData,
        [category]: {
          ...sectionData[category],
          [field]: value
        }
      }
    };
    onUpdate(updated);
  };

  const addToArray = (category: string, field: string, value: string) => {
    if (!value.trim()) return;
    const currentArray = sectionData[category]?.[field] || [];
    updateField(category, field, [...currentArray, value]);
  };

  const removeFromArray = (category: string, field: string, index: number) => {
    const currentArray = sectionData[category]?.[field] || [];
    updateField(category, field, currentArray.filter((_: unknown, i: number) => i !== index));
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getFinancialHealthColor = (ratio: number, optimal: number) => {
    const difference = Math.abs(ratio - optimal);
    if (difference <= 0.2) return 'text-green-600';
    if (difference <= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
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
          <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Financial Optimization & Capital Structure
            </h2>
            <Badge variant="secondary" className="tier-enterprise mt-2">
              Section 8 of 10
            </Badge>
          </div>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Optimize your tax strategy, working capital management, capital structure,
          and owner compensation for maximum financial efficiency and value creation.
        </p>
      </motion.div>

      {/* Tax Strategy */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.1 }}
      >
        <Card className="tier-enterprise">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-green-600" />
              <span>Tax Strategy & Optimization</span>
            </CardTitle>
            <CardDescription>
              Evaluate your tax structure and identify optimization opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="entityType">Entity Type</Label>
                <Select
                  value={sectionData.taxStrategy?.entityType || ''}
                  onValueChange={(value) => updateField('taxStrategy', 'entityType', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="llc">LLC</SelectItem>
                    <SelectItem value="s_corp">S Corporation</SelectItem>
                    <SelectItem value="c_corp">C Corporation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="effectiveTaxRate">Effective Tax Rate (%)</Label>
                <Input
                  id="effectiveTaxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={sectionData.taxStrategy?.effectiveTaxRate || ''}
                  onChange={(e) => updateField('taxStrategy', 'effectiveTaxRate', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="annualTaxSavings">Annual Tax Savings Potential ($)</Label>
                <Input
                  id="annualTaxSavings"
                  type="number"
                  min="0"
                  value={sectionData.taxStrategy?.annualTaxSavings || ''}
                  onChange={(e) => updateField('taxStrategy', 'annualTaxSavings', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="taxAdvisor">Tax Advisor Engaged</Label>
                <Select
                  value={sectionData.taxStrategy?.taxAdvisorEngaged?.toString() || ''}
                  onValueChange={(value) => updateField('taxStrategy', 'taxAdvisorEngaged', value === 'true')}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="taxPlanningScore">Tax Planning Score (%)</Label>
                <Input
                  id="taxPlanningScore"
                  type="number"
                  min="0"
                  max="100"
                  value={sectionData.taxStrategy?.taxPlanningScore || ''}
                  onChange={(e) => updateField('taxStrategy', 'taxPlanningScore', Number(e.target.value))}
                  className="tier-enterprise"
                />
                <Progress
                  value={sectionData.taxStrategy?.taxPlanningScore || 0}
                  className="h-2"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Tax Optimization Opportunities</Label>
              <div className="space-y-2">
                {(sectionData.taxStrategy?.optimizationOpportunities || []).map((opportunity: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={opportunity} readOnly className="tier-enterprise" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromArray('taxStrategy', 'optimizationOpportunities', index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add tax optimization opportunity"
                    className="tier-enterprise"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('taxStrategy', 'optimizationOpportunities', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addToArray('taxStrategy', 'optimizationOpportunities', input.value);
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

      {/* Working Capital */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.2 }}
      >
        <Card className="tier-enterprise">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-blue-600" />
              <span>Working Capital Management</span>
            </CardTitle>
            <CardDescription>
              Analyze working capital efficiency and cash flow optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-3">
                <Label htmlFor="currentRatio">Current Ratio</Label>
                <Input
                  id="currentRatio"
                  type="number"
                  min="0"
                  step="0.1"
                  value={sectionData.workingCapital?.currentRatio || ''}
                  onChange={(e) => updateField('workingCapital', 'currentRatio', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="benchmarkRatio">Benchmark Ratio</Label>
                <Input
                  id="benchmarkRatio"
                  type="number"
                  min="0"
                  step="0.1"
                  value={sectionData.workingCapital?.benchmarkRatio || ''}
                  onChange={(e) => updateField('workingCapital', 'benchmarkRatio', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="optimizationPotential">Optimization Potential ($)</Label>
                <Input
                  id="optimizationPotential"
                  type="number"
                  min="0"
                  value={sectionData.workingCapital?.optimizationPotential || ''}
                  onChange={(e) => updateField('workingCapital', 'optimizationPotential', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="cashCycleDays">Cash Cycle (Days)</Label>
                <Input
                  id="cashCycleDays"
                  type="number"
                  min="0"
                  value={sectionData.workingCapital?.cashCycleDays || ''}
                  onChange={(e) => updateField('workingCapital', 'cashCycleDays', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="inventoryTurnover">Inventory Turnover</Label>
                <Input
                  id="inventoryTurnover"
                  type="number"
                  min="0"
                  step="0.1"
                  value={sectionData.workingCapital?.inventoryTurnover || ''}
                  onChange={(e) => updateField('workingCapital', 'inventoryTurnover', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="receivablesDays">Receivables Days</Label>
                <Input
                  id="receivablesDays"
                  type="number"
                  min="0"
                  value={sectionData.workingCapital?.receivablesDays || ''}
                  onChange={(e) => updateField('workingCapital', 'receivablesDays', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="payablesDays">Payables Days</Label>
                <Input
                  id="payablesDays"
                  type="number"
                  min="0"
                  value={sectionData.workingCapital?.payablesDays || ''}
                  onChange={(e) => updateField('workingCapital', 'payablesDays', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
            </div>

            {/* Working Capital Health Indicator */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-900">Working Capital Health</h4>
                  <p className="text-sm text-blue-700">
                    Current vs. Benchmark Ratio Analysis
                  </p>
                </div>
                <div className={`text-2xl font-bold ${getFinancialHealthColor(
                  sectionData.workingCapital?.currentRatio || 0,
                  sectionData.workingCapital?.benchmarkRatio || 1.5
                )}`}>
                  {sectionData.workingCapital?.currentRatio || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Capital Structure */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.3 }}
      >
        <Card className="tier-enterprise">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              <span>Capital Structure Optimization</span>
            </CardTitle>
            <CardDescription>
              Evaluate debt-to-equity ratios and capital efficiency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="debtToEquityCurrent">Current Debt-to-Equity</Label>
                <Input
                  id="debtToEquityCurrent"
                  type="number"
                  min="0"
                  step="0.1"
                  value={sectionData.capitalStructure?.debtToEquityCurrent || ''}
                  onChange={(e) => updateField('capitalStructure', 'debtToEquityCurrent', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="debtToEquityOptimal">Optimal Debt-to-Equity</Label>
                <Input
                  id="debtToEquityOptimal"
                  type="number"
                  min="0"
                  step="0.1"
                  value={sectionData.capitalStructure?.debtToEquityOptimal || ''}
                  onChange={(e) => updateField('capitalStructure', 'debtToEquityOptimal', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="debtServiceCoverage">Debt Service Coverage</Label>
                <Input
                  id="debtServiceCoverage"
                  type="number"
                  min="0"
                  step="0.1"
                  value={sectionData.capitalStructure?.debtServiceCoverage || ''}
                  onChange={(e) => updateField('capitalStructure', 'debtServiceCoverage', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="availableCapacity">Available Debt Capacity ($)</Label>
                <Input
                  id="availableCapacity"
                  type="number"
                  min="0"
                  value={sectionData.capitalStructure?.availableCapacity || ''}
                  onChange={(e) => updateField('capitalStructure', 'availableCapacity', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="costOfCapital">Cost of Capital (%)</Label>
                <Input
                  id="costOfCapital"
                  type="number"
                  min="0"
                  step="0.1"
                  value={sectionData.capitalStructure?.costOfCapital || ''}
                  onChange={(e) => updateField('capitalStructure', 'costOfCapital', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="creditRating">Credit Rating</Label>
                <Select
                  value={sectionData.capitalStructure?.creditRating || ''}
                  onValueChange={(value) => updateField('capitalStructure', 'creditRating', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent (750+)</SelectItem>
                    <SelectItem value="good">Good (700-749)</SelectItem>
                    <SelectItem value="fair">Fair (650-699)</SelectItem>
                    <SelectItem value="poor">Poor (&lt;650)</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Capital Structure Visualization */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-purple-900 mb-2">Current Structure</h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-purple-600 h-4 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (sectionData.capitalStructure?.debtToEquityCurrent || 0) * 50)}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-purple-700">
                      {sectionData.capitalStructure?.debtToEquityCurrent || 0}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900 mb-2">Optimal Structure</h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-green-600 h-4 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (sectionData.capitalStructure?.debtToEquityOptimal || 0) * 50)}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-green-700">
                      {sectionData.capitalStructure?.debtToEquityOptimal || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Owner Compensation */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.4 }}
      >
        <Card className="tier-enterprise">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-orange-600" />
              <span>Owner Compensation Strategy</span>
            </CardTitle>
            <CardDescription>
              Optimize owner compensation structure for tax efficiency and market alignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-3">
                <Label htmlFor="currentTotal">Current Total Compensation ($)</Label>
                <Input
                  id="currentTotal"
                  type="number"
                  min="0"
                  value={sectionData.ownerCompensation?.currentTotal || ''}
                  onChange={(e) => updateField('ownerCompensation', 'currentTotal', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="marketRate">Market Rate ($)</Label>
                <Input
                  id="marketRate"
                  type="number"
                  min="0"
                  value={sectionData.ownerCompensation?.marketRate || ''}
                  onChange={(e) => updateField('ownerCompensation', 'marketRate', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="adjustmentOpportunity">Adjustment Opportunity ($)</Label>
                <Input
                  id="adjustmentOpportunity"
                  type="number"
                  value={sectionData.ownerCompensation?.adjustmentOpportunity || ''}
                  onChange={(e) => updateField('ownerCompensation', 'adjustmentOpportunity', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="retirementContributions">Retirement Contributions ($)</Label>
                <Input
                  id="retirementContributions"
                  type="number"
                  min="0"
                  value={sectionData.ownerCompensation?.retirementContributions || ''}
                  onChange={(e) => updateField('ownerCompensation', 'retirementContributions', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
            </div>

            {/* Compensation Structure */}
            <div className="space-y-3">
              <Label>Compensation Structure Components</Label>
              <div className="space-y-2">
                {(sectionData.ownerCompensation?.compensationStructure || []).map((component: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={component} readOnly className="tier-enterprise" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromArray('ownerCompensation', 'compensationStructure', index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add compensation component (e.g., Salary, Bonus, Distributions)"
                    className="tier-enterprise"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('ownerCompensation', 'compensationStructure', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addToArray('ownerCompensation', 'compensationStructure', input.value);
                      input.value = '';
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Benefits Package */}
            <div className="space-y-3">
              <Label>Benefits Package</Label>
              <div className="space-y-2">
                {(sectionData.ownerCompensation?.benefitsPackage || []).map((benefit: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={benefit} readOnly className="tier-enterprise" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromArray('ownerCompensation', 'benefitsPackage', index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add benefit (e.g., Health Insurance, Life Insurance, Company Car)"
                    className="tier-enterprise"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('ownerCompensation', 'benefitsPackage', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addToArray('ownerCompensation', 'benefitsPackage', input.value);
                      input.value = '';
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Compensation Analysis */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(sectionData.ownerCompensation?.currentTotal || 0)}
                  </div>
                  <p className="text-sm text-orange-700">Current Total</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(sectionData.ownerCompensation?.marketRate || 0)}
                  </div>
                  <p className="text-sm text-blue-700">Market Rate</p>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${
                    (sectionData.ownerCompensation?.adjustmentOpportunity || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(sectionData.ownerCompensation?.adjustmentOpportunity || 0)}
                  </div>
                  <p className="text-sm text-gray-700">Adjustment Opportunity</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Financial Optimization Summary */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.5 }}
      >
        <Card className="tier-enterprise bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle>Financial Optimization Summary</CardTitle>
            <CardDescription>
              Key financial optimization metrics and opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(sectionData.taxStrategy?.annualTaxSavings || 0)}
                </div>
                <p className="text-sm text-muted-foreground">Tax Savings Potential</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {sectionData.workingCapital?.cashCycleDays || 0} days
                </div>
                <p className="text-sm text-muted-foreground">Cash Cycle</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {sectionData.capitalStructure?.debtServiceCoverage || 0}x
                </div>
                <p className="text-sm text-muted-foreground">Debt Service Coverage</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(sectionData.ownerCompensation?.adjustmentOpportunity || 0)}
                </div>
                <p className="text-sm text-muted-foreground">Compensation Adjustment</p>
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
          Continue to Strategic Scenario Planning
        </Button>
      </motion.div>
    </div>
  );
};

export { financialOptimizationSchema };