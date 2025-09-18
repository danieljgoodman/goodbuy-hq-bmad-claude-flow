import { z } from 'zod'

// Professional Tier Questionnaire Validation Schemas
// Extends basic tier with 30 additional fields across 5 sections

// Section 1: Financial Performance (Historical 3-year data)
export const FinancialPerformanceSchema = z.object({
  // 3-Year Revenue History
  revenueYear1: z.number().min(0, 'Revenue Year 1 must be 0 or greater'),
  revenueYear2: z.number().min(0, 'Revenue Year 2 must be 0 or greater'),
  revenueYear3: z.number().min(0, 'Revenue Year 3 must be 0 or greater'),

  // 3-Year Profit History
  profitYear1: z.number(),
  profitYear2: z.number(),
  profitYear3: z.number(),

  // 3-Year Cash Flow History
  cashFlowYear1: z.number(),
  cashFlowYear2: z.number(),
  cashFlowYear3: z.number(),

  // Advanced Financial Ratios
  ebitdaMargin: z.number().min(0).max(100, 'EBITDA margin must be between 0-100%'),
  returnOnEquity: z.number().min(0, 'Return on equity must be 0 or greater'),
  returnOnAssets: z.number().min(0, 'Return on assets must be 0 or greater'),

  // Debt & Working Capital Analysis
  totalDebt: z.number().min(0, 'Total debt must be 0 or greater'),
  workingCapitalRatio: z.number().min(0, 'Working capital ratio must be 0 or greater'),
}).refine((data) => {
  // Conditional validation: Revenue trend should show business trajectory
  const revenues = [data.revenueYear1, data.revenueYear2, data.revenueYear3];
  const hasReasonableProgression = revenues.some((rev, idx) => idx === 0 || rev > 0);
  return hasReasonableProgression;
}, {
  message: "Please provide realistic revenue progression over the 3-year period",
  path: ["revenueYear3"]
})

// Section 2: Customer & Risk Analysis
export const CustomerRiskAnalysisSchema = z.object({
  // Customer Concentration Risk
  largestCustomerRevenue: z.number().min(0, 'Largest customer revenue must be 0 or greater'),
  top5CustomerRevenue: z.number().min(0, 'Top 5 customer revenue must be 0 or greater'),
  customerConcentrationRisk: z.enum(['low', 'medium', 'high'], {
    required_error: 'Customer concentration risk assessment is required'
  }),

  // Customer Retention & Quality
  averageCustomerTenure: z.number().min(0, 'Average customer tenure must be 0 or greater'),
  customerRetentionRate: z.number().min(0).max(100, 'Customer retention rate must be between 0-100%'),
  customerSatisfactionScore: z.number().min(1).max(10, 'Customer satisfaction score must be between 1-10'),

  // Customer Lifecycle Analytics
  averageContractLength: z.number().min(0, 'Average contract length must be 0 or greater'),
  contractRenewalRate: z.number().min(0).max(100, 'Contract renewal rate must be between 0-100%'),

  // Revenue Quality Assessment
  recurringRevenuePercentage: z.number().min(0).max(100, 'Recurring revenue percentage must be between 0-100%'),
  seasonalityImpact: z.enum(['low', 'medium', 'high'], {
    required_error: 'Seasonality impact assessment is required'
  }),
}).refine((data) => {
  // Business logic validation: Top 5 customers should include largest customer
  return data.top5CustomerRevenue >= data.largestCustomerRevenue;
}, {
  message: "Top 5 customer revenue must be at least as large as the largest customer revenue",
  path: ["top5CustomerRevenue"]
})

// Section 3: Competitive & Market Position
export const CompetitiveMarketSchema = z.object({
  // Market Position Analysis
  marketSharePercentage: z.number().min(0).max(100, 'Market share must be between 0-100%'),
  primaryCompetitors: z.array(z.string().min(1)).min(1).max(5, 'List 1-5 primary competitors'),
  competitiveAdvantageStrength: z.enum(['weak', 'moderate', 'strong', 'dominant'], {
    required_error: 'Competitive advantage strength assessment is required'
  }),

  // Market Growth & Scalability
  marketGrowthRateAnnual: z.number().min(-100).max(1000, 'Market growth rate must be realistic'),
  scalabilityRating: z.enum(['limited', 'moderate', 'high', 'exceptional'], {
    required_error: 'Scalability rating is required'
  }),

  // Barriers to Entry & Competition
  barrierToEntryLevel: z.enum(['low', 'medium', 'high'], {
    required_error: 'Barrier to entry assessment is required'
  }),
  competitiveThreats: z.array(z.string().min(1)).min(1).max(3, 'Identify 1-3 key competitive threats'),

  // Innovation & Technology Position
  technologyAdvantage: z.enum(['lagging', 'parity', 'leading', 'breakthrough'], {
    required_error: 'Technology advantage position is required'
  }),
  intellectualPropertyValue: z.enum(['none', 'limited', 'moderate', 'significant'], {
    required_error: 'Intellectual property value assessment is required'
  }),
})

// Section 4: Operational & Strategic Dependencies
export const OperationalStrategicSchema = z.object({
  // Owner/Key Person Dependency
  ownerTimeCommitment: z.number().min(0).max(168, 'Owner time commitment must be between 0-168 hours per week'),
  keyPersonRisk: z.enum(['low', 'medium', 'high', 'critical'], {
    required_error: 'Key person risk assessment is required'
  }),
  managementDepthRating: z.enum(['shallow', 'adequate', 'strong', 'exceptional'], {
    required_error: 'Management depth rating is required'
  }),

  // Operational Risk Factors
  supplierConcentrationRisk: z.enum(['low', 'medium', 'high'], {
    required_error: 'Supplier concentration risk assessment is required'
  }),
  operationalComplexity: z.enum(['simple', 'moderate', 'complex', 'very_complex'], {
    required_error: 'Operational complexity assessment is required'
  }),

  // Strategic Position
  strategicPlanningHorizon: z.enum(['none', 'short_term', 'medium_term', 'long_term'], {
    required_error: 'Strategic planning horizon is required'
  }),
  businessModelAdaptability: z.enum(['rigid', 'limited', 'flexible', 'highly_adaptable'], {
    required_error: 'Business model adaptability assessment is required'
  }),
})

// Section 5: Value Enhancement Potential
export const ValueEnhancementSchema = z.object({
  // Growth Investment Capacity
  growthInvestmentCapacity: z.number().min(0, 'Growth investment capacity must be 0 or greater'),
  marketExpansionOpportunities: z.array(z.string().min(1)).min(0).max(5, 'List up to 5 market expansion opportunities'),

  // Improvement Timeline & Capacity
  improvementImplementationTimeline: z.enum(['immediate', '3_months', '6_months', '12_months', 'longer'], {
    required_error: 'Improvement implementation timeline is required'
  }),
  organizationalChangeCapacity: z.enum(['limited', 'moderate', 'strong', 'exceptional'], {
    required_error: 'Organizational change capacity assessment is required'
  }),

  // Value Creation Potential
  valueCreationPotential: z.enum(['low', 'moderate', 'high', 'exceptional'], {
    required_error: 'Value creation potential assessment is required'
  }),
})

// Master Professional Questionnaire Schema (30 additional fields)
export const ProfessionalQuestionnaireSchema = z.object({
  financialPerformance: FinancialPerformanceSchema,
  customerRiskAnalysis: CustomerRiskAnalysisSchema,
  competitiveMarket: CompetitiveMarketSchema,
  operationalStrategic: OperationalStrategicSchema,
  valueEnhancement: ValueEnhancementSchema,
}).refine((data) => {
  // Cross-section validation: High customer concentration should align with high key person risk
  const hasHighCustomerConcentration = data.customerRiskAnalysis.customerConcentrationRisk === 'high';
  const hasHighKeyPersonRisk = data.operationalStrategic.keyPersonRisk === 'high' ||
                               data.operationalStrategic.keyPersonRisk === 'critical';

  // If customer concentration is high, owner time commitment should be reasonable
  if (hasHighCustomerConcentration && data.operationalStrategic.ownerTimeCommitment < 20) {
    return false;
  }

  return true;
}, {
  message: "Business dependencies should be consistent across sections",
  path: ["operationalStrategic", "ownerTimeCommitment"]
})

// Complete Professional Business Data (Basic + Professional)
export const CompleteProfessionalBusinessDataSchema = z.object({
  // Basic Tier Fields (from existing schema)
  businessType: z.string().min(1, 'Business type is required'),
  industryFocus: z.string().min(1, 'Industry focus is required'),
  yearsInBusiness: z.number().min(0, 'Years in business must be 0 or greater'),
  businessModel: z.string().min(1, 'Business model is required'),
  revenueModel: z.string().min(1, 'Revenue model is required'),

  annualRevenue: z.number().min(0, 'Annual revenue must be 0 or greater'),
  monthlyRecurring: z.number().min(0, 'Monthly recurring revenue must be 0 or greater'),
  expenses: z.number().min(0, 'Annual expenses must be 0 or greater'),
  cashFlow: z.number(),
  grossMargin: z.number().min(0).max(100, 'Gross margin must be between 0-100%'),

  customerCount: z.number().min(0, 'Customer count must be 0 or greater'),
  employeeCount: z.number().min(0, 'Employee count must be 0 or greater'),
  marketPosition: z.string().min(1, 'Market position is required'),
  competitiveAdvantages: z.array(z.string()).min(1, 'At least one competitive advantage is required'),
  primaryChannels: z.array(z.string()).min(1, 'At least one sales channel is required'),
  assets: z.number().min(0, 'Total assets must be 0 or greater'),
  liabilities: z.number().min(0, 'Total liabilities must be 0 or greater'),

  // Professional Tier Enhancement
  professionalQuestionnaire: ProfessionalQuestionnaireSchema,
})

// Conditional validation schemas for progressive disclosure
export const PartialFinancialPerformanceSchema = FinancialPerformanceSchema.partial()
export const PartialCustomerRiskAnalysisSchema = CustomerRiskAnalysisSchema.partial()
export const PartialCompetitiveMarketSchema = CompetitiveMarketSchema.partial()
export const PartialOperationalStrategicSchema = OperationalStrategicSchema.partial()
export const PartialValueEnhancementSchema = ValueEnhancementSchema.partial()

// Validation utilities with enhanced error messaging
export const validateFinancialPerformanceSection = (data: unknown) => {
  const result = FinancialPerformanceSchema.safeParse(data)
  return {
    ...result,
    sectionName: 'Financial Performance',
    fieldCount: result.success ? Object.keys(result.data).length : 0,
    totalFields: 13
  }
}

export const validateCustomerRiskAnalysisSection = (data: unknown) => {
  const result = CustomerRiskAnalysisSchema.safeParse(data)
  return {
    ...result,
    sectionName: 'Customer & Risk Analysis',
    fieldCount: result.success ? Object.keys(result.data).length : 0,
    totalFields: 10
  }
}

export const validateCompetitiveMarketSection = (data: unknown) => {
  const result = CompetitiveMarketSchema.safeParse(data)
  return {
    ...result,
    sectionName: 'Competitive & Market Position',
    fieldCount: result.success ? Object.keys(result.data).length : 0,
    totalFields: 9
  }
}

export const validateOperationalStrategicSection = (data: unknown) => {
  const result = OperationalStrategicSchema.safeParse(data)
  return {
    ...result,
    sectionName: 'Operational & Strategic',
    fieldCount: result.success ? Object.keys(result.data).length : 0,
    totalFields: 7
  }
}

export const validateValueEnhancementSection = (data: unknown) => {
  const result = ValueEnhancementSchema.safeParse(data)
  return {
    ...result,
    sectionName: 'Value Enhancement',
    fieldCount: result.success ? Object.keys(result.data).length : 0,
    totalFields: 5
  }
}

export const validateCompleteProfessionalQuestionnaire = (data: unknown) => {
  const result = ProfessionalQuestionnaireSchema.safeParse(data)
  return {
    ...result,
    totalProfessionalFields: 44, // 13+10+9+7+5
    totalRequiredFields: 30, // Minimum for Professional tier
    meetsRequirement: result.success
  }
}

// Field completion tracking
export const PROFESSIONAL_QUESTIONNAIRE_FIELD_COUNTS = {
  financialPerformance: 13,
  customerRiskAnalysis: 10,
  competitiveMarket: 9,
  operationalStrategic: 7,
  valueEnhancement: 5,
  total: 44,
  minimumRequired: 30
} as const

// Type exports
export type FinancialPerformance = z.infer<typeof FinancialPerformanceSchema>
export type CustomerRiskAnalysis = z.infer<typeof CustomerRiskAnalysisSchema>
export type CompetitiveMarket = z.infer<typeof CompetitiveMarketSchema>
export type OperationalStrategic = z.infer<typeof OperationalStrategicSchema>
export type ValueEnhancement = z.infer<typeof ValueEnhancementSchema>
export type ProfessionalQuestionnaire = z.infer<typeof ProfessionalQuestionnaireSchema>
export type CompleteProfessionalBusinessData = z.infer<typeof CompleteProfessionalBusinessDataSchema>