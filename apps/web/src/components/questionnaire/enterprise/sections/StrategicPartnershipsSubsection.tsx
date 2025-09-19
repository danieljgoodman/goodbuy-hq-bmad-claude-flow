import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Users, DollarSign, Plus, X, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const partnershipSchema = z.object({
  partnerName: z.string().min(1, 'Partner name is required'),
  type: z.enum(['distribution', 'technology', 'manufacturing', 'marketing', 'joint_venture', 'strategic_alliance', 'other']),
  revenueContribution: z.number().min(0).max(100),
  contractValue: z.number().min(0),
  duration: z.string(),
  exclusivity: z.enum(['exclusive', 'non_exclusive', 'limited_exclusive']),
  terminationRisk: z.enum(['low', 'medium', 'high']),
  strategicImportance: z.enum(['low', 'medium', 'high', 'critical']),
  renewalTerms: z.string().optional(),
  keyBenefits: z.array(z.string()).optional()
});

const strategicPartnershipsSchema = z.object({
  totalPartners: z.number().min(0),
  revenueFromPartnerships: z.object({
    percentage: z.number().min(0).max(100),
    totalValue: z.number().min(0),
    topPartnerContribution: z.number().min(0).max(100)
  }),
  partnershipAgreements: z.object({
    totalValue: z.number().min(0),
    averageDuration: z.number().min(0),
    renewalRate: z.number().min(0).max(100)
  }),
  keyPartnerships: z.array(partnershipSchema).optional(),
  riskAssessment: z.object({
    concentrationRisk: z.enum(['low', 'medium', 'high']),
    dependencyLevel: z.enum(['low', 'medium', 'high']),
    diversificationScore: z.number().min(0).max(10)
  }),
  strategicValue: z.object({
    marketAccess: z.enum(['minimal', 'moderate', 'significant', 'transformative']),
    competitiveAdvantage: z.enum(['minimal', 'moderate', 'significant', 'transformative']),
    valueCreation: z.enum(['minimal', 'moderate', 'significant', 'transformative'])
  })
});

type StrategicPartnershipsData = z.infer<typeof strategicPartnershipsSchema>;

interface StrategicPartnershipsSubsectionProps {
  data: Partial<StrategicPartnershipsData>;
  onUpdate: (data: Partial<StrategicPartnershipsData>) => void;
}

export const StrategicPartnershipsSubsection: React.FC<StrategicPartnershipsSubsectionProps> = ({
  data,
  onUpdate
}) => {
  const [showAddPartnership, setShowAddPartnership] = React.useState(false);
  const [newPartnership, setNewPartnership] = React.useState<Partial<z.infer<typeof partnershipSchema>>>({});

  const updateField = (section: keyof StrategicPartnershipsData, field: string, value: any) => {
    onUpdate({
      ...data,
      [section]: {
        ...data[section] as any,
        [field]: value
      }
    });
  };

  const addPartnership = () => {
    const partnerships = data.keyPartnerships || [];
    onUpdate({
      ...data,
      keyPartnerships: [...partnerships, newPartnership as z.infer<typeof partnershipSchema>]
    });
    setNewPartnership({});
    setShowAddPartnership(false);
  };

  const removePartnership = (index: number) => {
    const partnerships = data.keyPartnerships || [];
    onUpdate({
      ...data,
      keyPartnerships: partnerships.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <Card className="tier-enterprise">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-green-600" />
            <span>Strategic Partnerships</span>
          </CardTitle>
          <CardDescription>
            Evaluate your strategic partnerships, their revenue contribution, and the value they
            create for your enterprise through market access and competitive advantages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Partnership Overview */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Partnership Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total-partners">Total Strategic Partners</Label>
                <Input
                  id="total-partners"
                  type="number"
                  min="0"
                  value={data.totalPartners || ''}
                  onChange={(e) => onUpdate({ ...data, totalPartners: parseInt(e.target.value) || 0 })}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partnership-revenue-percentage">Revenue from Partnerships (%)</Label>
                <Input
                  id="partnership-revenue-percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={data.revenueFromPartnerships?.percentage || ''}
                  onChange={(e) => updateField('revenueFromPartnerships', 'percentage', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partnership-revenue-value">Partnership Revenue Value ($)</Label>
                <Input
                  id="partnership-revenue-value"
                  type="number"
                  min="0"
                  value={data.revenueFromPartnerships?.totalValue || ''}
                  onChange={(e) => updateField('revenueFromPartnerships', 'totalValue', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Partnership Agreements */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Partnership Agreements</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agreements-total-value">Total Agreement Value ($)</Label>
                <Input
                  id="agreements-total-value"
                  type="number"
                  min="0"
                  value={data.partnershipAgreements?.totalValue || ''}
                  onChange={(e) => updateField('partnershipAgreements', 'totalValue', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="average-duration">Average Duration (months)</Label>
                <Input
                  id="average-duration"
                  type="number"
                  min="0"
                  value={data.partnershipAgreements?.averageDuration || ''}
                  onChange={(e) => updateField('partnershipAgreements', 'averageDuration', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="renewal-rate">Renewal Rate (%)</Label>
                <Input
                  id="renewal-rate"
                  type="number"
                  min="0"
                  max="100"
                  value={data.partnershipAgreements?.renewalRate || ''}
                  onChange={(e) => updateField('partnershipAgreements', 'renewalRate', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Key Partnerships */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg">Key Strategic Partnerships</h4>
              <Button
                onClick={() => setShowAddPartnership(true)}
                variant="outline"
                size="sm"
                className="tier-enterprise"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Partnership
              </Button>
            </div>

            {/* Existing Partnerships */}
            {data.keyPartnerships && data.keyPartnerships.length > 0 && (
              <div className="space-y-4">
                {data.keyPartnerships.map((partnership, index) => (
                  <Card key={index} className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <h5 className="font-medium">{partnership.partnerName}</h5>
                            <Badge variant="secondary">{partnership.type}</Badge>
                            <Badge 
                              variant={partnership.strategicImportance === 'critical' ? 'destructive' : 'outline'}
                            >
                              {partnership.strategicImportance} importance
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Revenue Contribution: {partnership.revenueContribution}% | 
                            Contract Value: ${partnership.contractValue?.toLocaleString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => removePartnership(index)}
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

            {/* Add Partnership Form */}
            {showAddPartnership && (
              <Card className="border-dashed">
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="partner-name">Partner Name</Label>
                        <Input
                          id="partner-name"
                          value={newPartnership.partnerName || ''}
                          onChange={(e) => setNewPartnership({ ...newPartnership, partnerName: e.target.value })}
                          className="tier-enterprise"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partnership-type">Partnership Type</Label>
                        <Select 
                          value={newPartnership.type || ''}
                          onValueChange={(value) => setNewPartnership({ ...newPartnership, type: value as z.infer<typeof partnershipSchema>['type'] })}
                        >
                          <SelectTrigger className="tier-enterprise">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="distribution">Distribution</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="joint_venture">Joint Venture</SelectItem>
                            <SelectItem value="strategic_alliance">Strategic Alliance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="revenue-contribution">Revenue Contribution (%)</Label>
                        <Input
                          id="revenue-contribution"
                          type="number"
                          min="0"
                          max="100"
                          value={newPartnership.revenueContribution || ''}
                          onChange={(e) => setNewPartnership({ ...newPartnership, revenueContribution: parseInt(e.target.value) || 0 })}
                          className="tier-enterprise"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contract-value">Contract Value ($)</Label>
                        <Input
                          id="contract-value"
                          type="number"
                          min="0"
                          value={newPartnership.contractValue || ''}
                          onChange={(e) => setNewPartnership({ ...newPartnership, contractValue: parseInt(e.target.value) || 0 })}
                          className="tier-enterprise"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={addPartnership} className="tier-enterprise">
                        Add Partnership
                      </Button>
                      <Button 
                        onClick={() => setShowAddPartnership(false)} 
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

          {/* Risk Assessment */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Partnership Risk Assessment</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="concentration-risk">Concentration Risk</Label>
                <Select 
                  value={data.riskAssessment?.concentrationRisk || ''}
                  onValueChange={(value) => updateField('riskAssessment', 'concentrationRisk', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dependency-level">Dependency Level</Label>
                <Select 
                  value={data.riskAssessment?.dependencyLevel || ''}
                  onValueChange={(value) => updateField('riskAssessment', 'dependencyLevel', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select dependency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diversification-score">Diversification Score (1-10)</Label>
                <Input
                  id="diversification-score"
                  type="number"
                  min="0"
                  max="10"
                  value={data.riskAssessment?.diversificationScore || ''}
                  onChange={(e) => updateField('riskAssessment', 'diversificationScore', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Strategic Value */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Strategic Value Creation</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="market-access">Market Access</Label>
                <Select 
                  value={data.strategicValue?.marketAccess || ''}
                  onValueChange={(value) => updateField('strategicValue', 'marketAccess', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="significant">Significant</SelectItem>
                    <SelectItem value="transformative">Transformative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="competitive-advantage">Competitive Advantage</Label>
                <Select 
                  value={data.strategicValue?.competitiveAdvantage || ''}
                  onValueChange={(value) => updateField('strategicValue', 'competitiveAdvantage', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="significant">Significant</SelectItem>
                    <SelectItem value="transformative">Transformative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value-creation">Value Creation</Label>
                <Select 
                  value={data.strategicValue?.valueCreation || ''}
                  onValueChange={(value) => updateField('strategicValue', 'valueCreation', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="significant">Significant</SelectItem>
                    <SelectItem value="transformative">Transformative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};