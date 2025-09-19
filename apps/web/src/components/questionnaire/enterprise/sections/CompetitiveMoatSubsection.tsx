import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Target, Shield, Lock, Zap, Plus, X, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const competitiveMoatSchema = z.object({
  primaryAdvantages: z.array(z.object({
    type: z.enum(['technology', 'network_effects', 'switching_costs', 'brand', 'cost', 'scale', 'regulatory', 'data', 'location', 'other']),
    description: z.string().min(1),
    strength: z.enum(['weak', 'moderate', 'strong', 'dominant']),
    sustainability: z.enum(['short_term', 'medium_term', 'long_term', 'permanent']),
    defensibility: z.number().min(1).max(10)
  })),
  barrierAnalysis: z.object({
    entryBarriers: z.object({
      capitalRequirements: z.enum(['low', 'medium', 'high', 'prohibitive']),
      technicalComplexity: z.enum(['low', 'medium', 'high', 'extreme']),
      regulatoryBarriers: z.enum(['minimal', 'moderate', 'significant', 'extensive']),
      networkEffects: z.enum(['none', 'weak', 'moderate', 'strong'])
    }),
    switchingCosts: z.object({
      customerSwitchingCost: z.enum(['low', 'medium', 'high', 'prohibitive']),
      integrationComplexity: z.enum(['simple', 'moderate', 'complex', 'extremely_complex']),
      dataPortability: z.enum(['easy', 'moderate', 'difficult', 'impossible']),
      contractualLockIn: z.enum(['none', 'short_term', 'medium_term', 'long_term'])
    })
  }),
  competitiveThreats: z.object({
    newEntrants: z.enum(['low', 'medium', 'high', 'critical']),
    substitutes: z.enum(['low', 'medium', 'high', 'critical']),
    supplierPower: z.enum(['low', 'medium', 'high', 'critical']),
    buyerPower: z.enum(['low', 'medium', 'high', 'critical']),
    incumbentRivalry: z.enum(['low', 'medium', 'high', 'intense'])
  }),
  moatSustainability: z.object({
    overallMoatStrength: z.enum(['weak', 'moderate', 'strong', 'exceptional']),
    timeToErode: z.enum(['immediate', 'short_term', 'medium_term', 'long_term', 'sustainable']),
    investmentRequired: z.number().min(0),
    riskFactors: z.array(z.string()).optional(),
    strategicInitiatives: z.array(z.string()).optional()
  })
});

type CompetitiveMoatData = z.infer<typeof competitiveMoatSchema>;

interface CompetitiveMoatSubsectionProps {
  data: Partial<CompetitiveMoatData>;
  onUpdate: (data: Partial<CompetitiveMoatData>) => void;
}

export const CompetitiveMoatSubsection: React.FC<CompetitiveMoatSubsectionProps> = ({
  data,
  onUpdate
}) => {
  const [showAddAdvantage, setShowAddAdvantage] = React.useState(false);
  const [newAdvantage, setNewAdvantage] = React.useState<Partial<z.infer<typeof competitiveMoatSchema>['primaryAdvantages'][0]>>({});

  const updateField = (section: keyof CompetitiveMoatData, field: string, value: any) => {
    onUpdate({
      ...data,
      [section]: {
        ...data[section],
        [field]: value
      }
    });
  };

  const updateNestedField = (section: keyof CompetitiveMoatData, subsection: string, field: string, value: any) => {
    onUpdate({
      ...data,
      [section]: {
        ...data[section],
        [subsection]: {
          ...(data[section] as any)?.[subsection],
          [field]: value
        }
      }
    });
  };

  const addAdvantage = () => {
    const advantages = data.primaryAdvantages || [];
    onUpdate({
      ...data,
      primaryAdvantages: [...advantages, newAdvantage as z.infer<typeof competitiveMoatSchema>['primaryAdvantages'][0]]
    });
    setNewAdvantage({});
    setShowAddAdvantage(false);
  };

  const removeAdvantage = (index: number) => {
    const advantages = data.primaryAdvantages || [];
    onUpdate({
      ...data,
      primaryAdvantages: advantages.filter((_, i) => i !== index)
    });
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'bg-red-100 text-red-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'strong': return 'bg-green-100 text-green-800';
      case 'dominant': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="tier-enterprise">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-orange-600" />
            <span>Competitive Moat Analysis</span>
          </CardTitle>
          <CardDescription>
            Assess your sustainable competitive advantages, barriers to entry, and the strength
            of your defensive position in the market.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Primary Competitive Advantages */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-orange-600" />
                <h4 className="font-semibold text-lg">Primary Competitive Advantages</h4>
              </div>
              <Button
                onClick={() => setShowAddAdvantage(true)}
                variant="outline"
                size="sm"
                className="tier-enterprise"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Advantage
              </Button>
            </div>

            {/* Existing Advantages */}
            {data.primaryAdvantages && data.primaryAdvantages.length > 0 && (
              <div className="space-y-4">
                {data.primaryAdvantages.map((advantage, index) => (
                  <Card key={index} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{advantage.type}</Badge>
                            <Badge className={getStrengthColor(advantage.strength)}>
                              {advantage.strength}
                            </Badge>
                            <Badge variant="outline">{advantage.sustainability}</Badge>
                          </div>
                          <p className="font-medium">{advantage.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Defensibility: {advantage.defensibility}/10</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => removeAdvantage(index)}
                          variant="ghost"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Add Advantage Form */}
            {showAddAdvantage && (
              <Card className="border-dashed">
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="advantage-type">Advantage Type</Label>
                        <Select 
                          value={newAdvantage.type || ''}
                          onValueChange={(value) => setNewAdvantage({ ...newAdvantage, type: value as z.infer<typeof competitiveMoatSchema>['primaryAdvantages'][0]['type'] })}
                        >
                          <SelectTrigger className="tier-enterprise">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="network_effects">Network Effects</SelectItem>
                            <SelectItem value="switching_costs">Switching Costs</SelectItem>
                            <SelectItem value="brand">Brand</SelectItem>
                            <SelectItem value="cost">Cost Advantage</SelectItem>
                            <SelectItem value="scale">Economies of Scale</SelectItem>
                            <SelectItem value="regulatory">Regulatory</SelectItem>
                            <SelectItem value="data">Data Advantage</SelectItem>
                            <SelectItem value="location">Location</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="advantage-strength">Strength</Label>
                        <Select 
                          value={newAdvantage.strength || ''}
                          onValueChange={(value) => setNewAdvantage({ ...newAdvantage, strength: value as z.infer<typeof competitiveMoatSchema>['primaryAdvantages'][0]['strength'] })}
                        >
                          <SelectTrigger className="tier-enterprise">
                            <SelectValue placeholder="Select strength" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weak">Weak</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="strong">Strong</SelectItem>
                            <SelectItem value="dominant">Dominant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="advantage-sustainability">Sustainability</Label>
                        <Select 
                          value={newAdvantage.sustainability || ''}
                          onValueChange={(value) => setNewAdvantage({ ...newAdvantage, sustainability: value as z.infer<typeof competitiveMoatSchema>['primaryAdvantages'][0]['sustainability'] })}
                        >
                          <SelectTrigger className="tier-enterprise">
                            <SelectValue placeholder="Select sustainability" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short_term">Short Term (under 1 year)</SelectItem>
                            <SelectItem value="medium_term">Medium Term (1-3 years)</SelectItem>
                            <SelectItem value="long_term">Long Term (3+ years)</SelectItem>
                            <SelectItem value="permanent">Permanent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="advantage-defensibility">Defensibility (1-10)</Label>
                        <Input
                          id="advantage-defensibility"
                          type="number"
                          min="1"
                          max="10"
                          value={newAdvantage.defensibility || ''}
                          onChange={(e) => setNewAdvantage({ ...newAdvantage, defensibility: parseInt(e.target.value) || 1 })}
                          className="tier-enterprise"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="advantage-description">Description</Label>
                      <Textarea
                        id="advantage-description"
                        value={newAdvantage.description || ''}
                        onChange={(e) => setNewAdvantage({ ...newAdvantage, description: e.target.value })}
                        className="tier-enterprise"
                        placeholder="Describe this competitive advantage in detail..."
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={addAdvantage} className="tier-enterprise">
                        Add Advantage
                      </Button>
                      <Button 
                        onClick={() => setShowAddAdvantage(false)} 
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Barrier Analysis */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-lg">Barrier Analysis</h4>
            </div>

            {/* Entry Barriers */}
            <div className="space-y-4">
              <h5 className="font-medium">Barriers to Entry</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capital-requirements">Capital Requirements</Label>
                  <Select 
                    value={data.barrierAnalysis?.entryBarriers?.capitalRequirements || ''}
                    onValueChange={(value) => updateNestedField('barrierAnalysis', 'entryBarriers', 'capitalRequirements', value)}
                  >
                    <SelectTrigger className="tier-enterprise">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="prohibitive">Prohibitive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technical-complexity">Technical Complexity</Label>
                  <Select 
                    value={data.barrierAnalysis?.entryBarriers?.technicalComplexity || ''}
                    onValueChange={(value) => updateNestedField('barrierAnalysis', 'entryBarriers', 'technicalComplexity', value)}
                  >
                    <SelectTrigger className="tier-enterprise">
                      <SelectValue placeholder="Select complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="extreme">Extreme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regulatory-barriers">Regulatory Barriers</Label>
                  <Select 
                    value={data.barrierAnalysis?.entryBarriers?.regulatoryBarriers || ''}
                    onValueChange={(value) => updateNestedField('barrierAnalysis', 'entryBarriers', 'regulatoryBarriers', value)}
                  >
                    <SelectTrigger className="tier-enterprise">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="significant">Significant</SelectItem>
                      <SelectItem value="extensive">Extensive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="network-effects">Network Effects</Label>
                  <Select 
                    value={data.barrierAnalysis?.entryBarriers?.networkEffects || ''}
                    onValueChange={(value) => updateNestedField('barrierAnalysis', 'entryBarriers', 'networkEffects', value)}
                  >
                    <SelectTrigger className="tier-enterprise">
                      <SelectValue placeholder="Select strength" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="weak">Weak</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="strong">Strong</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Switching Costs */}
            <div className="space-y-4">
              <h5 className="font-medium">Customer Switching Costs</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-switching-cost">Customer Switching Cost</Label>
                  <Select 
                    value={data.barrierAnalysis?.switchingCosts?.customerSwitchingCost || ''}
                    onValueChange={(value) => updateNestedField('barrierAnalysis', 'switchingCosts', 'customerSwitchingCost', value)}
                  >
                    <SelectTrigger className="tier-enterprise">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="prohibitive">Prohibitive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="integration-complexity">Integration Complexity</Label>
                  <Select 
                    value={data.barrierAnalysis?.switchingCosts?.integrationComplexity || ''}
                    onValueChange={(value) => updateNestedField('barrierAnalysis', 'switchingCosts', 'integrationComplexity', value)}
                  >
                    <SelectTrigger className="tier-enterprise">
                      <SelectValue placeholder="Select complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="complex">Complex</SelectItem>
                      <SelectItem value="extremely_complex">Extremely Complex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data-portability">Data Portability</Label>
                  <Select 
                    value={data.barrierAnalysis?.switchingCosts?.dataPortability || ''}
                    onValueChange={(value) => updateNestedField('barrierAnalysis', 'switchingCosts', 'dataPortability', value)}
                  >
                    <SelectTrigger className="tier-enterprise">
                      <SelectValue placeholder="Select ease" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="difficult">Difficult</SelectItem>
                      <SelectItem value="impossible">Impossible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractual-lock-in">Contractual Lock-In</Label>
                  <Select 
                    value={data.barrierAnalysis?.switchingCosts?.contractualLockIn || ''}
                    onValueChange={(value) => updateNestedField('barrierAnalysis', 'switchingCosts', 'contractualLockIn', value)}
                  >
                    <SelectTrigger className="tier-enterprise">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="short_term">Short Term (under 1 year)</SelectItem>
                      <SelectItem value="medium_term">Medium Term (1-3 years)</SelectItem>
                      <SelectItem value="long_term">Long Term (3+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Competitive Threats */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-red-600" />
              <h4 className="font-semibold text-lg">Competitive Threats (Porter's Five Forces)</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-entrants">Threat of New Entrants</Label>
                <Select 
                  value={data.competitiveThreats?.newEntrants || ''}
                  onValueChange={(value) => updateField('competitiveThreats', 'newEntrants', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select threat level" />
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
                <Label htmlFor="substitutes">Threat of Substitutes</Label>
                <Select 
                  value={data.competitiveThreats?.substitutes || ''}
                  onValueChange={(value) => updateField('competitiveThreats', 'substitutes', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select threat level" />
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
                <Label htmlFor="supplier-power">Supplier Power</Label>
                <Select 
                  value={data.competitiveThreats?.supplierPower || ''}
                  onValueChange={(value) => updateField('competitiveThreats', 'supplierPower', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select power level" />
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
                <Label htmlFor="buyer-power">Buyer Power</Label>
                <Select 
                  value={data.competitiveThreats?.buyerPower || ''}
                  onValueChange={(value) => updateField('competitiveThreats', 'buyerPower', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select power level" />
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
                <Label htmlFor="incumbent-rivalry">Incumbent Rivalry</Label>
                <Select 
                  value={data.competitiveThreats?.incumbentRivalry || ''}
                  onValueChange={(value) => updateField('competitiveThreats', 'incumbentRivalry', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select intensity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="intense">Intense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Moat Sustainability */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-gold-600" />
              <h4 className="font-semibold text-lg">Moat Sustainability Assessment</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="overall-moat-strength">Overall Moat Strength</Label>
                <Select 
                  value={data.moatSustainability?.overallMoatStrength || ''}
                  onValueChange={(value) => updateField('moatSustainability', 'overallMoatStrength', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select strength" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weak">Weak</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                    <SelectItem value="exceptional">Exceptional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time-to-erode">Time to Erode</Label>
                <Select 
                  value={data.moatSustainability?.timeToErode || ''}
                  onValueChange={(value) => updateField('moatSustainability', 'timeToErode', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate (&lt; 6 months)</SelectItem>
                    <SelectItem value="short_term">Short Term (6-18 months)</SelectItem>
                    <SelectItem value="medium_term">Medium Term (1.5-5 years)</SelectItem>
                    <SelectItem value="long_term">Long Term (5-10 years)</SelectItem>
                    <SelectItem value="sustainable">Sustainable (10+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="investment-required">Annual Investment Required ($)</Label>
                <Input
                  id="investment-required"
                  type="number"
                  min="0"
                  value={data.moatSustainability?.investmentRequired || ''}
                  onChange={(e) => updateField('moatSustainability', 'investmentRequired', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                  placeholder="Investment to maintain moat"
                />
              </div>
            </div>
          </div>

          {/* Moat Summary */}
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Shield className="h-6 w-6 text-orange-600 mx-auto" />
                  </div>
                  <h5 className="font-medium">Advantages</h5>
                  <p className="text-2xl font-bold text-orange-600">
                    {data.primaryAdvantages?.length || 0}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Target className="h-6 w-6 text-blue-600 mx-auto" />
                  </div>
                  <h5 className="font-medium">Moat Strength</h5>
                  <p className="text-lg font-bold text-blue-600 capitalize">
                    {data.moatSustainability?.overallMoatStrength || 'Not Set'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Lock className="h-6 w-6 text-green-600 mx-auto" />
                  </div>
                  <h5 className="font-medium">Time to Erode</h5>
                  <p className="text-lg font-bold text-green-600 capitalize">
                    {data.moatSustainability?.timeToErode?.replace('_', ' ') || 'Not Set'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Award className="h-6 w-6 text-purple-600 mx-auto" />
                  </div>
                  <h5 className="font-medium">Investment</h5>
                  <p className="text-xl font-bold text-purple-600">
                    ${(data.moatSustainability?.investmentRequired || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};