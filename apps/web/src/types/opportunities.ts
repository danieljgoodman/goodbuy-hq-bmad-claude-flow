export interface Resource {
  type: 'human' | 'financial' | 'technical' | 'physical';
  description: string;
  quantity: number;
  cost: number;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  templateType: 'document' | 'spreadsheet' | 'checklist' | 'process';
  content: string;
  instructions: string;
  customizationPoints: CustomizationPoint[];
  relatedOpportunities: string[];
  premiumRequired: boolean;
  downloadCount: number;
  rating: number;
  createdAt: Date;
}

export interface CustomizationPoint {
  field: string;
  description: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
}

export interface CaseStudy {
  id: string;
  title: string;
  industry: string;
  description: string;
  results: string[];
  timeframe: string;
  investment: number;
  roi: number;
}

export interface SuccessMetric {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue?: number;
  unit: string;
  measurementFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  category: 'financial' | 'operational' | 'marketing' | 'strategic';
}

export interface ImprovementOpportunity {
  id: string;
  evaluationId: string;
  category: 'financial' | 'operational' | 'marketing' | 'strategic' | 'technology' | 'hr';
  subcategory: string;
  title: string;
  description: string;
  detailedAnalysis: string;
  impactEstimate: {
    revenueIncrease: {
      amount: number;
      percentage: number;
      timeframe: string;
      confidence: number;
    };
    costReduction: {
      amount: number;
      percentage: number;
      timeframe: string;
      confidence: number;
    };
    roi: {
      percentage: number;
      paybackPeriod: string;
      npv: number;
      irr: number;
    };
    riskAdjustedReturn: number;
  };
  implementationRequirements: {
    difficulty: 'low' | 'medium' | 'high' | 'very_high';
    timelineEstimate: string;
    resourceRequirements: Resource[];
    skillsNeeded: string[];
    investmentRequired: number;
    dependencies: string[];
  };
  priorityScore: number;
  priorityFactors: {
    impactWeight: number;
    easeWeight: number;
    timeWeight: number;
    costWeight: number;
    strategicAlignment: number;
  };
  contentTier: 'free' | 'premium' | 'enterprise';
  freeContent: {
    summary: string;
    keyBenefits: string[];
    basicSteps: string[];
  };
  premiumContent?: {
    implementationGuide: string;
    templates: Template[];
    expertInsights: string;
    caseStudies: CaseStudy[];
    consultationAccess: boolean;
  };
  successMetrics: SuccessMetric[];
  relatedOpportunities: string[];
  marketTrends: string[];
  industryRelevance: number;
  confidence: number;
  identifiedAt: Date;
  lastUpdated: Date;
}

export interface ScenarioProjection {
  revenueImpact: number;
  costImpact: number;
  timeline: string;
  probability: number;
  keyAssumptions: string[];
}

export interface SensitivityFactor {
  variable: string;
  baseValue: number;
  lowValue: number;
  highValue: number;
  impactOnROI: {
    low: number;
    high: number;
  };
}

export interface BenchmarkData {
  industry: string;
  metric: string;
  industryAverage: number;
  topQuartile: number;
  companyValue: number;
  percentileRank: number;
}

export interface MarketFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: number;
  description: string;
}

export interface RiskAssessment {
  risk: string;
  probability: number;
  impact: number;
  mitigation: string;
  riskScore: number;
}

export interface ImpactAnalysis {
  id: string;
  opportunityId: string;
  methodology: string;
  assumptions: string[];
  scenarios: {
    conservative: ScenarioProjection;
    realistic: ScenarioProjection;
    optimistic: ScenarioProjection;
  };
  sensitivityAnalysis: SensitivityFactor[];
  benchmarkComparison: BenchmarkData;
  marketConditions: MarketFactor[];
  riskFactors: RiskAssessment[];
  confidenceLevel: number;
  analysisDate: Date;
}

export interface OpportunityRanking {
  opportunityId: string;
  rank: number;
  score: number;
  impactScore: number;
  effortScore: number;
  timelineScore: number;
  riskScore: number;
  strategicScore: number;
}

export interface ImplementationSequence {
  phase: number;
  opportunities: string[];
  duration: string;
  dependencies: string[];
  expectedValue: number;
}

export interface PriorityTier {
  tier: 'high' | 'medium' | 'low';
  opportunities: string[];
  totalValue: number;
  description: string;
}

export interface PriorityMatrix {
  id: string;
  evaluationId: string;
  opportunities: OpportunityRanking[];
  criteria: {
    impact: { weight: number; description: string };
    effort: { weight: number; description: string };
    timeline: { weight: number; description: string };
    risk: { weight: number; description: string };
    strategic: { weight: number; description: string };
  };
  methodology: string;
  recommendedSequence: ImplementationSequence[];
  totalPotentialValue: number;
  priorityTiers: PriorityTier[];
  calculatedAt: Date;
}

export interface ImplementationPhase {
  phase: number;
  name: string;
  description: string;
  duration: string;
  tasks: string[];
  deliverables: string[];
  successCriteria: string[];
}

export interface TimelineEvent {
  date: Date;
  event: string;
  type: 'milestone' | 'task' | 'decision_point' | 'review';
  description: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  completionCriteria: string[];
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
}

export interface Dependency {
  id: string;
  name: string;
  type: 'resource' | 'external' | 'internal' | 'technology';
  description: string;
  criticality: 'high' | 'medium' | 'low';
  status: 'pending' | 'available' | 'blocked';
}

export interface ResourceAllocation {
  resource: Resource;
  phase: number;
  allocation: number;
  startDate: Date;
  endDate: Date;
}

export interface RiskMitigation {
  risk: string;
  likelihood: number;
  impact: number;
  mitigation: string;
  contingencyPlan: string;
  owner: string;
}

export interface SuccessCriteria {
  criteria: string;
  metric: string;
  target: number;
  measurement: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface MonitoringMetric {
  metric: string;
  description: string;
  target: number;
  threshold: number;
  alertCondition: string;
  reportingFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface BudgetBreakdown {
  totalBudget: number;
  categories: {
    personnel: number;
    technology: number;
    external: number;
    operations: number;
    contingency: number;
  };
  phaseBreakdown: {
    phase: number;
    amount: number;
    percentage: number;
  }[];
}

export interface ImplementationRoadmap {
  id: string;
  opportunityId: string;
  phases: ImplementationPhase[];
  timeline: TimelineEvent[];
  milestones: Milestone[];
  dependencies: Dependency[];
  resourcePlan: ResourceAllocation[];
  riskMitigation: RiskMitigation[];
  successCriteria: SuccessCriteria[];
  monitoringPlan: MonitoringMetric[];
  budgetRequirement: BudgetBreakdown;
  createdAt: Date;
}

export interface PriorityCalculationCriteria {
  impact: {
    weight: number;
    metrics: {
      revenueImpact: number;
      costImpact: number;
      strategicValue: number;
    };
  };
  effort: {
    weight: number;
    metrics: {
      complexity: number;
      resourceRequirement: number;
      timeRequirement: number;
    };
  };
  risk: {
    weight: number;
    metrics: {
      implementationRisk: number;
      marketRisk: number;
      financialRisk: number;
    };
  };
  timing: {
    weight: number;
    metrics: {
      urgency: number;
      marketWindow: number;
      competitiveThreat: number;
    };
  };
}

export interface PriorityScore {
  totalScore: number;
  componentScores: {
    impact: number;
    effort: number;
    risk: number;
    timing: number;
  };
  normalizedScore: number;
  tier: 'high' | 'medium' | 'low';
  reasoning: string[];
}