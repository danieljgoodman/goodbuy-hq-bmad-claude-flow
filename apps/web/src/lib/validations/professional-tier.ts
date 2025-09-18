import { z } from 'zod'

// Enhanced Financial Metrics Schema (15 fields)
export const ProfessionalFinancialMetricsSchema = z.object({
  // Core metrics (from basic tier)
  annualRevenue: z.number().min(0, 'Annual revenue must be 0 or greater'),
  monthlyRecurring: z.number().min(0, 'Monthly recurring revenue must be 0 or greater'),
  expenses: z.number().min(0, 'Annual expenses must be 0 or greater'),
  cashFlow: z.number(),
  grossMargin: z.number().min(0).max(100, 'Gross margin must be between 0-100%'),

  // Professional tier additions
  netProfit: z.number(),
  ebitda: z.number(),
  burnRate: z.number().min(0, 'Burn rate must be 0 or greater'),
  runwayMonths: z.number().min(0, 'Runway months must be 0 or greater'),
  debtToEquityRatio: z.number().min(0, 'Debt to equity ratio must be 0 or greater'),
  currentRatio: z.number().min(0, 'Current ratio must be 0 or greater'),
  quickRatio: z.number().min(0, 'Quick ratio must be 0 or greater'),
  inventoryTurnover: z.number().min(0, 'Inventory turnover must be 0 or greater'),
  receivablesTurnover: z.number().min(0, 'Receivables turnover must be 0 or greater'),
  workingCapital: z.number(),
})

// Customer Analytics & Segmentation Schema (8 fields)
export const CustomerAnalyticsSchema = z.object({
  customerAcquisitionCost: z.number().min(0, 'Customer acquisition cost must be 0 or greater'),
  customerLifetimeValue: z.number().min(0, 'Customer lifetime value must be 0 or greater'),
  churnRate: z.number().min(0).max(100, 'Churn rate must be between 0-100%'),
  netPromoterScore: z.number().min(-100).max(100, 'NPS must be between -100 and 100'),
  monthlyActiveUsers: z.number().min(0, 'Monthly active users must be 0 or greater'),
  conversionRate: z.number().min(0).max(100, 'Conversion rate must be between 0-100%'),
  averageOrderValue: z.number().min(0, 'Average order value must be 0 or greater'),
  repeatCustomerRate: z.number().min(0).max(100, 'Repeat customer rate must be between 0-100%'),
})

// Operational Efficiency Schema (7 fields)
export const OperationalEfficiencySchema = z.object({
  employeeProductivity: z.number().min(0, 'Employee productivity must be 0 or greater'),
  operatingExpenseRatio: z.number().min(0).max(100, 'Operating expense ratio must be between 0-100%'),
  capacityUtilization: z.number().min(0).max(100, 'Capacity utilization must be between 0-100%'),
  inventoryDaysOnHand: z.number().min(0, 'Inventory days on hand must be 0 or greater'),
  paymentTermsDays: z.number().min(0, 'Payment terms days must be 0 or greater'),
  vendorPaymentDays: z.number().min(0, 'Vendor payment days must be 0 or greater'),
  cashConversionCycle: z.number(),
})

// Competitor Analysis Schema
export const CompetitorAnalysisSchema = z.object({
  name: z.string().min(1, 'Competitor name is required'),
  marketShare: z.number().min(0).max(100, 'Market share must be between 0-100%'),
  strengths: z.array(z.string()).min(1, 'At least one strength is required'),
  weaknesses: z.array(z.string()).min(1, 'At least one weakness is required'),
})

// Market Intelligence Schema (6 fields)
export const MarketIntelligenceSchema = z.object({
  marketShare: z.number().min(0).max(100, 'Market share must be between 0-100%'),
  marketGrowthRate: z.number(),
  competitorAnalysis: z.array(CompetitorAnalysisSchema).min(1, 'At least one competitor analysis is required'),
  marketTrends: z.array(z.string()).min(1, 'At least one market trend is required'),
  threatLevel: z.enum(['low', 'medium', 'high'], {
    required_error: 'Threat level must be low, medium, or high'
  }),
  opportunityScore: z.number().min(0).max(100, 'Opportunity score must be between 0-100'),
})

// Scenario Analysis Schema
export const ScenarioAnalysisSchema = z.object({
  optimistic: z.object({
    revenue: z.number().min(0, 'Optimistic revenue must be 0 or greater'),
    expenses: z.number().min(0, 'Optimistic expenses must be 0 or greater'),
  }),
  realistic: z.object({
    revenue: z.number().min(0, 'Realistic revenue must be 0 or greater'),
    expenses: z.number().min(0, 'Realistic expenses must be 0 or greater'),
  }),
  pessimistic: z.object({
    revenue: z.number().min(0, 'Pessimistic revenue must be 0 or greater'),
    expenses: z.number().min(0, 'Pessimistic expenses must be 0 or greater'),
  }),
})

// Financial Planning & Forecasting Schema (5 fields)
export const FinancialPlanningSchema = z.object({
  revenueForecast12Month: z.array(z.number().min(0))
    .length(12, 'Revenue forecast must include exactly 12 months'),
  expenseForecast12Month: z.array(z.number().min(0))
    .length(12, 'Expense forecast must include exactly 12 months'),
  cashFlowForecast12Month: z.array(z.number())
    .length(12, 'Cash flow forecast must include exactly 12 months'),
  scenarioAnalysis: ScenarioAnalysisSchema,
  budgetVariance: z.number().min(-100).max(100, 'Budget variance must be between -100% and 100%'),
})

// Regulatory Compliance Schema
export const RegulatoryComplianceSchema = z.object({
  regulation: z.string().min(1, 'Regulation name is required'),
  status: z.enum(['compliant', 'non-compliant', 'pending'], {
    required_error: 'Status must be compliant, non-compliant, or pending'
  }),
  lastAuditDate: z.date(),
  nextAuditDate: z.date(),
})

// Risk Assessment Schema
export const RiskAssessmentSchema = z.object({
  financialRisk: z.enum(['low', 'medium', 'high'], {
    required_error: 'Financial risk must be low, medium, or high'
  }),
  operationalRisk: z.enum(['low', 'medium', 'high'], {
    required_error: 'Operational risk must be low, medium, or high'
  }),
  marketRisk: z.enum(['low', 'medium', 'high'], {
    required_error: 'Market risk must be low, medium, or high'
  }),
  overallRiskScore: z.number().min(0).max(100, 'Overall risk score must be between 0-100'),
})

// Insurance Coverage Schema
export const InsuranceCoverageSchema = z.object({
  type: z.string().min(1, 'Insurance type is required'),
  coverage: z.number().min(0, 'Coverage amount must be 0 or greater'),
  premium: z.number().min(0, 'Premium amount must be 0 or greater'),
  expires: z.date(),
})

// Audit Trail Schema
export const AuditTrailSchema = z.object({
  date: z.date(),
  action: z.string().min(1, 'Action description is required'),
  user: z.string().min(1, 'User identifier is required'),
  details: z.string().min(1, 'Details are required'),
})

// Compliance & Risk Management Schema (4 fields)
export const ComplianceSchema = z.object({
  regulatoryCompliance: z.array(RegulatoryComplianceSchema)
    .min(1, 'At least one regulatory compliance entry is required'),
  riskAssessment: RiskAssessmentSchema,
  insuranceCoverage: z.array(InsuranceCoverageSchema)
    .min(1, 'At least one insurance coverage is required'),
  auditTrail: z.array(AuditTrailSchema)
    .min(1, 'At least one audit trail entry is required'),
})

// Complete Professional Tier Data Schema (45+ fields total)
export const ProfessionalTierDataSchema = z.object({
  financialMetrics: ProfessionalFinancialMetricsSchema,
  customerAnalytics: CustomerAnalyticsSchema,
  operationalEfficiency: OperationalEfficiencySchema,
  marketIntelligence: MarketIntelligenceSchema,
  financialPlanning: FinancialPlanningSchema,
  compliance: ComplianceSchema,
})

// Extended Business Data Schema for Professional Tier
export const ProfessionalBusinessDataSchema = z.object({
  // Include all basic tier fields
  businessType: z.string().min(1, 'Business type is required'),
  industryFocus: z.string().min(1, 'Industry focus is required'),
  yearsInBusiness: z.number().min(0, 'Years in business must be 0 or greater'),
  businessModel: z.string().min(1, 'Business model is required'),
  revenueModel: z.string().min(1, 'Revenue model is required'),

  // Basic financial metrics (still included for backward compatibility)
  annualRevenue: z.number().min(0, 'Annual revenue must be 0 or greater'),
  monthlyRecurring: z.number().min(0, 'Monthly recurring revenue must be 0 or greater'),
  expenses: z.number().min(0, 'Annual expenses must be 0 or greater'),
  cashFlow: z.number(),
  grossMargin: z.number().min(0).max(100, 'Gross margin must be between 0-100%'),

  // Basic operational data
  customerCount: z.number().min(0, 'Customer count must be 0 or greater'),
  employeeCount: z.number().min(0, 'Employee count must be 0 or greater'),
  marketPosition: z.string().min(1, 'Market position is required'),
  competitiveAdvantages: z.array(z.string()).min(1, 'At least one competitive advantage is required'),
  primaryChannels: z.array(z.string()).min(1, 'At least one sales channel is required'),
  assets: z.number().min(0, 'Total assets must be 0 or greater'),
  liabilities: z.number().min(0, 'Total liabilities must be 0 or greater'),

  // Professional tier extended data
  professionalTierData: ProfessionalTierDataSchema,
})

// Extended Evaluation Schema for Professional Tier
export const ProfessionalEvaluationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  businessData: ProfessionalBusinessDataSchema,
  valuations: z.object({
    assetBased: z.number(),
    incomeBased: z.number(),
    marketBased: z.number(),
    weighted: z.number(),
    methodology: z.string(),
    // Professional tier enhanced valuations
    discountedCashFlow: z.number().optional(),
    comparableCompany: z.number().optional(),
    precedentTransaction: z.number().optional(),
  }),
  healthScore: z.number().min(0).max(100),
  confidenceScore: z.number().min(0).max(100),
  opportunities: z.array(z.object({
    id: z.string(),
    category: z.enum(['operational', 'financial', 'strategic', 'market']),
    title: z.string(),
    description: z.string(),
    impactEstimate: z.object({
      dollarAmount: z.number(),
      percentageIncrease: z.number(),
      confidence: z.number(),
    }),
    difficulty: z.enum(['low', 'medium', 'high']),
    timeframe: z.string(),
    priority: z.number(),
    implementationGuide: z.string().optional(),
    requiredResources: z.array(z.string()),
  })),
  status: z.enum(['processing', 'completed', 'failed']),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Professional tier specific fields
  tier: z.literal('professional'),
  advancedAnalytics: z.object({
    benchmarkComparison: z.object({
      industryAverage: z.record(z.number()),
      topQuartile: z.record(z.number()),
      bottomQuartile: z.record(z.number()),
    }),
    predictiveModeling: z.object({
      growthPrediction: z.number(),
      riskPrediction: z.number(),
      valuationTrend: z.array(z.number()),
    }),
    sensitivityAnalysis: z.record(z.array(z.number())),
  }).optional(),
})

// Type exports
export type ProfessionalFinancialMetrics = z.infer<typeof ProfessionalFinancialMetricsSchema>
export type CustomerAnalytics = z.infer<typeof CustomerAnalyticsSchema>
export type OperationalEfficiency = z.infer<typeof OperationalEfficiencySchema>
export type CompetitorAnalysis = z.infer<typeof CompetitorAnalysisSchema>
export type MarketIntelligence = z.infer<typeof MarketIntelligenceSchema>
export type ScenarioAnalysis = z.infer<typeof ScenarioAnalysisSchema>
export type FinancialPlanning = z.infer<typeof FinancialPlanningSchema>
export type RegulatoryCompliance = z.infer<typeof RegulatoryComplianceSchema>
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>
export type InsuranceCoverage = z.infer<typeof InsuranceCoverageSchema>
export type AuditTrail = z.infer<typeof AuditTrailSchema>
export type Compliance = z.infer<typeof ComplianceSchema>
export type ProfessionalTierData = z.infer<typeof ProfessionalTierDataSchema>
export type ProfessionalBusinessData = z.infer<typeof ProfessionalBusinessDataSchema>
export type ProfessionalEvaluation = z.infer<typeof ProfessionalEvaluationSchema>

// Validation utilities for form steps
export const validateProfessionalFinancialMetrics = (data: unknown) => {
  return ProfessionalFinancialMetricsSchema.safeParse(data)
}

export const validateCustomerAnalytics = (data: unknown) => {
  return CustomerAnalyticsSchema.safeParse(data)
}

export const validateOperationalEfficiency = (data: unknown) => {
  return OperationalEfficiencySchema.safeParse(data)
}

export const validateMarketIntelligence = (data: unknown) => {
  return MarketIntelligenceSchema.safeParse(data)
}

export const validateFinancialPlanning = (data: unknown) => {
  return FinancialPlanningSchema.safeParse(data)
}

export const validateCompliance = (data: unknown) => {
  return ComplianceSchema.safeParse(data)
}

export const validateProfessionalTierData = (data: unknown) => {
  return ProfessionalTierDataSchema.safeParse(data)
}

export const validateProfessionalBusinessData = (data: unknown) => {
  return ProfessionalBusinessDataSchema.safeParse(data)
}

export const validateProfessionalEvaluation = (data: unknown) => {
  return ProfessionalEvaluationSchema.safeParse(data)
}

// Field count validation - ensures exactly 45+ fields are present
export const PROFESSIONAL_TIER_FIELD_COUNT = {
  financialMetrics: 15,
  customerAnalytics: 8,
  operationalEfficiency: 7,
  marketIntelligence: 6, // Base fields, competitors and trends are arrays
  financialPlanning: 5, // Base fields, forecasts are arrays
  compliance: 4, // Base fields, arrays contain detailed objects
  total: 45
}

// Validation helper for ensuring all required professional fields are present
export const validateProfessionalFieldCompleteness = (data: ProfessionalTierData) => {
  const result = ProfessionalTierDataSchema.safeParse(data)
  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.flatten(),
      fieldCount: 0
    }
  }

  // Count actual fields (this is a basic count, in production you might want more sophisticated validation)
  const fieldCount = Object.keys(data.financialMetrics).length +
                    Object.keys(data.customerAnalytics).length +
                    Object.keys(data.operationalEfficiency).length +
                    Object.keys(data.marketIntelligence).length +
                    Object.keys(data.financialPlanning).length +
                    Object.keys(data.compliance).length

  return {
    isValid: true,
    errors: null,
    fieldCount,
    meetsMinimumRequirement: fieldCount >= PROFESSIONAL_TIER_FIELD_COUNT.total
  }
}