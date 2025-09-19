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
import { Settings, Users, Server, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';

const operationalScalabilitySchema = z.object({
  processDocumentation: z.object({
    documentedProcessesPercent: z.number().min(0).max(100),
    keyPersonDependencies: z.number().min(0),
    knowledgeRiskLevel: z.enum(['low', 'medium', 'high', 'critical']),
    processMaturityScore: z.number().min(0).max(100),
    documentationGaps: z.array(z.string()),
    improvementPriority: z.enum(['low', 'medium', 'high', 'urgent'])
  }),
  managementSystems: z.object({
    ownerKnowledgeConcentration: z.number().min(0).max(100),
    managerCount: z.number().min(0),
    delegationEffectiveness: z.number().min(0).max(100),
    leadershipDepth: z.enum(['shallow', 'moderate', 'deep', 'excellent']),
    successionPlan: z.boolean(),
    managementGaps: z.array(z.string())
  }),
  technologyInfrastructure: z.object({
    operationalUtilization: z.number().min(0).max(100),
    automationOpportunities: z.array(z.string()),
    techInvestmentAnnual: z.number().min(0),
    systemIntegration: z.enum(['poor', 'fair', 'good', 'excellent']),
    cloudReadiness: z.number().min(0).max(100),
    cybersecurityScore: z.number().min(0).max(100)
  }),
  scalabilityMetrics: z.object({
    infrastructureThreshold: z.number().min(0),
    investmentRequired: z.number().min(0),
    identifiedBottlenecks: z.array(z.string()),
    scalabilityScore: z.number().min(0).max(100),
    growthCapacity: z.enum(['limited', 'moderate', 'strong', 'unlimited']),
    timelineToScale: z.number().min(0)
  })
});

interface OperationalScalabilitySectionProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const OperationalScalabilitySection: React.FC<OperationalScalabilitySectionProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const sectionData = data.operationalScalability || {};

  const updateField = (category: string, field: string, value: any) => {
    const updated = {
      ...data,
      operationalScalability: {
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
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
          <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
            <Settings className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Operational Scalability & Systems Maturity
            </h2>
            <Badge variant="secondary" className="tier-enterprise mt-2">
              Section 7 of 10
            </Badge>
          </div>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Assess your operational processes, management systems, technology infrastructure,
          and overall capacity for scaling business operations effectively.
        </p>
      </motion.div>

      {/* Process Documentation */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.1 }}
      >
        <Card className="tier-enterprise">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-600" />
              <span>Process Documentation & Knowledge Management</span>
            </CardTitle>
            <CardDescription>
              Evaluate the documentation and systematization of your business processes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="documentedProcesses">Documented Processes (%)</Label>
                <Input
                  id="documentedProcesses"
                  type="number"
                  min="0"
                  max="100"
                  value={sectionData.processDocumentation?.documentedProcessesPercent || ''}
                  onChange={(e) => updateField('processDocumentation', 'documentedProcessesPercent', Number(e.target.value))}
                  className="tier-enterprise"
                />
                <Progress
                  value={sectionData.processDocumentation?.documentedProcessesPercent || 0}
                  className="h-2"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="keyPersonDependencies">Key Person Dependencies (Count)</Label>
                <Input
                  id="keyPersonDependencies"
                  type="number"
                  min="0"
                  value={sectionData.processDocumentation?.keyPersonDependencies || ''}
                  onChange={(e) => updateField('processDocumentation', 'keyPersonDependencies', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="knowledgeRisk">Knowledge Risk Level</Label>
                <Select
                  value={sectionData.processDocumentation?.knowledgeRiskLevel || ''}
                  onValueChange={(value) => updateField('processDocumentation', 'knowledgeRiskLevel', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Well documented</SelectItem>
                    <SelectItem value="medium">Medium - Some gaps</SelectItem>
                    <SelectItem value="high">High - Significant gaps</SelectItem>
                    <SelectItem value="critical">Critical - Undocumented</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="processMaturity">Process Maturity Score (0-100)</Label>
                <Input
                  id="processMaturity"
                  type="number"
                  min="0"
                  max="100"
                  value={sectionData.processDocumentation?.processMaturityScore || ''}
                  onChange={(e) => updateField('processDocumentation', 'processMaturityScore', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Documentation Gaps</Label>
              <div className="space-y-2">
                {(sectionData.processDocumentation?.documentationGaps || []).map((gap: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={gap} readOnly className="tier-enterprise" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromArray('processDocumentation', 'documentationGaps', index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add documentation gap"
                    className="tier-enterprise"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('processDocumentation', 'documentationGaps', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addToArray('processDocumentation', 'documentationGaps', input.value);
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

      {/* Management Systems */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.2 }}
      >
        <Card className="tier-enterprise">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <span>Management Systems & Leadership</span>
            </CardTitle>
            <CardDescription>
              Analyze management depth, delegation effectiveness, and leadership scalability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="ownerKnowledge">Owner Knowledge Concentration (%)</Label>
                <Input
                  id="ownerKnowledge"
                  type="number"
                  min="0"
                  max="100"
                  value={sectionData.managementSystems?.ownerKnowledgeConcentration || ''}
                  onChange={(e) => updateField('managementSystems', 'ownerKnowledgeConcentration', Number(e.target.value))}
                  className="tier-enterprise"
                />
                <Progress
                  value={sectionData.managementSystems?.ownerKnowledgeConcentration || 0}
                  className="h-2"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="managerCount">Manager Count</Label>
                <Input
                  id="managerCount"
                  type="number"
                  min="0"
                  value={sectionData.managementSystems?.managerCount || ''}
                  onChange={(e) => updateField('managementSystems', 'managerCount', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="delegation">Delegation Effectiveness (%)</Label>
                <Input
                  id="delegation"
                  type="number"
                  min="0"
                  max="100"
                  value={sectionData.managementSystems?.delegationEffectiveness || ''}
                  onChange={(e) => updateField('managementSystems', 'delegationEffectiveness', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="leadershipDepth">Leadership Depth</Label>
                <Select
                  value={sectionData.managementSystems?.leadershipDepth || ''}
                  onValueChange={(value) => updateField('managementSystems', 'leadershipDepth', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select depth level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shallow">Shallow - Owner dependent</SelectItem>
                    <SelectItem value="moderate">Moderate - Some autonomy</SelectItem>
                    <SelectItem value="deep">Deep - Strong team</SelectItem>
                    <SelectItem value="excellent">Excellent - Self-managing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="successionPlan">Succession Plan in Place</Label>
                <Select
                  value={sectionData.managementSystems?.successionPlan?.toString() || ''}
                  onValueChange={(value) => updateField('managementSystems', 'successionPlan', value === 'true')}
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
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Technology Infrastructure */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.3 }}
      >
        <Card className="tier-enterprise">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-purple-600" />
              <span>Technology Infrastructure & Automation</span>
            </CardTitle>
            <CardDescription>
              Assess technology utilization, automation opportunities, and digital readiness
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="operationalUtil">Operational Utilization (%)</Label>
                <Input
                  id="operationalUtil"
                  type="number"
                  min="0"
                  max="100"
                  value={sectionData.technologyInfrastructure?.operationalUtilization || ''}
                  onChange={(e) => updateField('technologyInfrastructure', 'operationalUtilization', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="techInvestment">Annual Tech Investment ($)</Label>
                <Input
                  id="techInvestment"
                  type="number"
                  min="0"
                  value={sectionData.technologyInfrastructure?.techInvestmentAnnual || ''}
                  onChange={(e) => updateField('technologyInfrastructure', 'techInvestmentAnnual', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="systemIntegration">System Integration Level</Label>
                <Select
                  value={sectionData.technologyInfrastructure?.systemIntegration || ''}
                  onValueChange={(value) => updateField('technologyInfrastructure', 'systemIntegration', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poor">Poor - Siloed systems</SelectItem>
                    <SelectItem value="fair">Fair - Basic integration</SelectItem>
                    <SelectItem value="good">Good - Well integrated</SelectItem>
                    <SelectItem value="excellent">Excellent - Seamless</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="cloudReadiness">Cloud Readiness (%)</Label>
                <Input
                  id="cloudReadiness"
                  type="number"
                  min="0"
                  max="100"
                  value={sectionData.technologyInfrastructure?.cloudReadiness || ''}
                  onChange={(e) => updateField('technologyInfrastructure', 'cloudReadiness', Number(e.target.value))}
                  className="tier-enterprise"
                />
                <Progress
                  value={sectionData.technologyInfrastructure?.cloudReadiness || 0}
                  className="h-2"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="cybersecurity">Cybersecurity Score (%)</Label>
                <Input
                  id="cybersecurity"
                  type="number"
                  min="0"
                  max="100"
                  value={sectionData.technologyInfrastructure?.cybersecurityScore || ''}
                  onChange={(e) => updateField('technologyInfrastructure', 'cybersecurityScore', Number(e.target.value))}
                  className="tier-enterprise"
                />
                <Progress
                  value={sectionData.technologyInfrastructure?.cybersecurityScore || 0}
                  className="h-2"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Automation Opportunities</Label>
              <div className="space-y-2">
                {(sectionData.technologyInfrastructure?.automationOpportunities || []).map((opportunity: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={opportunity} readOnly className="tier-enterprise" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromArray('technologyInfrastructure', 'automationOpportunities', index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add automation opportunity"
                    className="tier-enterprise"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('technologyInfrastructure', 'automationOpportunities', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addToArray('technologyInfrastructure', 'automationOpportunities', input.value);
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

      {/* Scalability Metrics */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.4 }}
      >
        <Card className="tier-enterprise">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <span>Scalability Metrics & Growth Capacity</span>
            </CardTitle>
            <CardDescription>
              Evaluate your infrastructure's capacity to support business growth
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="infraThreshold">Infrastructure Threshold (Revenue $)</Label>
                <Input
                  id="infraThreshold"
                  type="number"
                  min="0"
                  value={sectionData.scalabilityMetrics?.infrastructureThreshold || ''}
                  onChange={(e) => updateField('scalabilityMetrics', 'infrastructureThreshold', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="investmentRequired">Investment Required ($)</Label>
                <Input
                  id="investmentRequired"
                  type="number"
                  min="0"
                  value={sectionData.scalabilityMetrics?.investmentRequired || ''}
                  onChange={(e) => updateField('scalabilityMetrics', 'investmentRequired', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="timelineToScale">Timeline to Scale (months)</Label>
                <Input
                  id="timelineToScale"
                  type="number"
                  min="0"
                  value={sectionData.scalabilityMetrics?.timelineToScale || ''}
                  onChange={(e) => updateField('scalabilityMetrics', 'timelineToScale', Number(e.target.value))}
                  className="tier-enterprise"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="scalabilityScore">Overall Scalability Score (%)</Label>
                <Input
                  id="scalabilityScore"
                  type="number"
                  min="0"
                  max="100"
                  value={sectionData.scalabilityMetrics?.scalabilityScore || ''}
                  onChange={(e) => updateField('scalabilityMetrics', 'scalabilityScore', Number(e.target.value))}
                  className="tier-enterprise"
                />
                <Progress
                  value={sectionData.scalabilityMetrics?.scalabilityScore || 0}
                  className="h-2"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="growthCapacity">Growth Capacity</Label>
                <Select
                  value={sectionData.scalabilityMetrics?.growthCapacity || ''}
                  onValueChange={(value) => updateField('scalabilityMetrics', 'growthCapacity', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select capacity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="limited">Limited - Major constraints</SelectItem>
                    <SelectItem value="moderate">Moderate - Some flexibility</SelectItem>
                    <SelectItem value="strong">Strong - Ready to scale</SelectItem>
                    <SelectItem value="unlimited">Unlimited - Highly scalable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Identified Bottlenecks</Label>
              <div className="space-y-2">
                {(sectionData.scalabilityMetrics?.identifiedBottlenecks || []).map((bottleneck: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={bottleneck} readOnly className="tier-enterprise" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromArray('scalabilityMetrics', 'identifiedBottlenecks', index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add identified bottleneck"
                    className="tier-enterprise"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('scalabilityMetrics', 'identifiedBottlenecks', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addToArray('scalabilityMetrics', 'identifiedBottlenecks', input.value);
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

      {/* Summary Dashboard */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.5 }}
      >
        <Card className="tier-enterprise bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle>Operational Scalability Summary</CardTitle>
            <CardDescription>
              Key metrics and insights from your operational assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  {sectionData.processDocumentation?.documentedProcessesPercent || 0}%
                </div>
                <p className="text-sm text-muted-foreground">Processes Documented</p>
              </div>
              <div className="text-center space-y-2">
                <div className={`text-2xl font-bold ${getRiskColor(sectionData.processDocumentation?.knowledgeRiskLevel)}`}>
                  {sectionData.processDocumentation?.knowledgeRiskLevel?.toUpperCase() || 'N/A'}
                </div>
                <p className="text-sm text-muted-foreground">Knowledge Risk</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-green-600">
                  {sectionData.managementSystems?.delegationEffectiveness || 0}%
                </div>
                <p className="text-sm text-muted-foreground">Delegation Effectiveness</p>
              </div>
              <div className="text-center space-y-2">
                <div className={`text-2xl font-bold ${getScoreColor(sectionData.scalabilityMetrics?.scalabilityScore || 0)}`}>
                  {sectionData.scalabilityMetrics?.scalabilityScore || 0}%
                </div>
                <p className="text-sm text-muted-foreground">Scalability Score</p>
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
          Continue to Financial Optimization
        </Button>
      </motion.div>
    </div>
  );
};

export { operationalScalabilitySchema };