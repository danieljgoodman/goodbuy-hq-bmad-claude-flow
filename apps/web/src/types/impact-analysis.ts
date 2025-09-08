import { ScenarioProjection } from './index';

export interface BusinessMetrics {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  employeeCount: number;
  customerCount: number;
  marketShare?: number;
}

export interface FinancialOpportunityPattern {
  pattern: string;
  indicators: string[];
  typicalImpact: {
    revenueIncrease: number;
    costReduction: number;
    implementationCost: number;
    paybackPeriod: number;
  };
  difficulty: 'low' | 'medium' | 'high' | 'very_high';
  applicability: (metrics: BusinessMetrics) => number;
}

export interface OperationalOpportunityPattern {
  pattern: string;
  indicators: string[];
  typicalImpact: {
    efficiencyGain: number;
    costReduction: number;
    timeReduction: number;
    qualityImprovement: number;
  };
  difficulty: 'low' | 'medium' | 'high' | 'very_high';
  applicability: (metrics: BusinessMetrics) => number;
}

export interface MarketingOpportunityPattern {
  pattern: string;
  indicators: string[];
  typicalImpact: {
    customerAcquisition: number;
    conversionImprovement: number;
    brandValueIncrease: number;
    marketShareGrowth: number;
  };
  difficulty: 'low' | 'medium' | 'high' | 'very_high';
  applicability: (metrics: BusinessMetrics) => number;
}

export interface StrategicOpportunityPattern {
  pattern: string;
  indicators: string[];
  typicalImpact: {
    competitiveAdvantage: number;
    marketPosition: number;
    longTermValue: number;
    riskReduction: number;
  };
  difficulty: 'low' | 'medium' | 'high' | 'very_high';
  applicability: (metrics: BusinessMetrics) => number;
}

export interface OpportunityIdentificationResult {
  category: 'financial' | 'operational' | 'marketing' | 'strategic';
  opportunities: {
    pattern: string;
    relevance: number;
    confidence: number;
    estimatedImpact: number;
    reasoning: string[];
  }[];
  overallScore: number;
  methodology: string;
}

export interface ROICalculationInputs {
  initialInvestment: number;
  annualBenefits: number[];
  implementationCosts: number[];
  maintenanceCosts: number[];
  discountRate: number;
  timeHorizon: number;
  riskFactor: number;
}

export interface ROICalculationResults {
  npv: number;
  irr: number;
  paybackPeriod: number;
  roi: number;
  riskAdjustedROI: number;
  breakEvenPoint: number;
  totalReturn: number;
  confidence: number;
}

export interface ScenarioModelingInputs {
  baseCase: ROICalculationInputs;
  variableRanges: {
    variable: string;
    min: number;
    max: number;
    distribution: 'normal' | 'uniform' | 'triangular';
  }[];
  correlations?: {
    variable1: string;
    variable2: string;
    correlation: number;
  }[];
}

export interface ScenarioModelingResults {
  conservative: ROICalculationResults;
  realistic: ROICalculationResults;
  optimistic: ROICalculationResults;
  probability: {
    positiveROI: number;
    breakEven: number;
    targetReturn: number;
  };
  sensitivityRanking: {
    variable: string;
    impactOnROI: number;
  }[];
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

export interface CompetitiveAnalysis {
  competitor: string;
  marketPosition: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface MarketAnalysis {
  marketSize: number;
  growthRate: number;
  trends: string[];
  opportunities: string[];
  threats: string[];
  competitiveIntensity: number;
  competitors: CompetitiveAnalysis[];
}

export interface IndustryBenchmark {
  metric: string;
  industryAverage: number;
  topQuartile: number;
  bottomQuartile: number;
  companyValue: number;
  percentileRank: number;
  gapAnalysis: {
    gap: number;
    opportunity: string;
    priority: number;
  };
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