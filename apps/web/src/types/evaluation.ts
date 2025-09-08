import { z } from 'zod'

export const BusinessDataSchema = z.object({
  // Business Basics
  businessType: z.string().min(1, 'Business type is required'),
  industryFocus: z.string().min(1, 'Industry focus is required'),
  yearsInBusiness: z.number().min(0, 'Years in business must be 0 or greater'),
  businessModel: z.string().min(1, 'Business model is required'),
  revenueModel: z.string().min(1, 'Revenue model is required'),
  
  // Financial Metrics
  annualRevenue: z.number().min(0, 'Annual revenue must be 0 or greater'),
  monthlyRecurring: z.number().min(0, 'Monthly recurring revenue must be 0 or greater'),
  expenses: z.number().min(0, 'Annual expenses must be 0 or greater'),
  cashFlow: z.number(),
  grossMargin: z.number().min(0).max(100, 'Gross margin must be between 0-100%'),
  
  // Operational Data
  customerCount: z.number().min(0, 'Customer count must be 0 or greater'),
  employeeCount: z.number().min(0, 'Employee count must be 0 or greater'),
  marketPosition: z.string().min(1, 'Market position is required'),
  competitiveAdvantages: z.array(z.string()).min(1, 'At least one competitive advantage is required'),
  primaryChannels: z.array(z.string()).min(1, 'At least one sales channel is required'),
  assets: z.number().min(0, 'Total assets must be 0 or greater'),
  liabilities: z.number().min(0, 'Total liabilities must be 0 or greater'),
})

export const EvaluationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  businessData: BusinessDataSchema,
  valuations: z.object({
    assetBased: z.number(),
    incomeBased: z.number(),
    marketBased: z.number(),
    weighted: z.number(),
    methodology: z.string(),
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
})

export type BusinessData = z.infer<typeof BusinessDataSchema>
export type Evaluation = z.infer<typeof EvaluationSchema>
export type EvaluationStatus = Evaluation['status']

// Form validation schemas for individual steps
export const BusinessBasicsSchema = z.object({
  businessType: z.string().min(1, 'Please select a business type'),
  industryFocus: z.string().min(1, 'Please specify your industry focus'),
  yearsInBusiness: z.number().min(0, 'Years in business must be 0 or greater'),
  businessModel: z.string().min(1, 'Please select a business model'),
  revenueModel: z.string().min(1, 'Please select a revenue model'),
})

export const FinancialMetricsSchema = z.object({
  annualRevenue: z.number().min(0, 'Annual revenue must be 0 or greater'),
  monthlyRecurring: z.number().min(0, 'Monthly recurring revenue must be 0 or greater'),
  expenses: z.number().min(0, 'Annual expenses must be 0 or greater'),
  cashFlow: z.number(),
  grossMargin: z.number().min(0).max(100, 'Gross margin must be between 0-100%'),
})

export const OperationalDataSchema = z.object({
  customerCount: z.number().min(0, 'Customer count must be 0 or greater'),
  employeeCount: z.number().min(0, 'Employee count must be 0 or greater'),
  marketPosition: z.string().min(1, 'Please select your market position'),
  competitiveAdvantages: z.array(z.string()).min(1, 'Please select at least one competitive advantage'),
  primaryChannels: z.array(z.string()).min(1, 'Please select at least one sales channel'),
  assets: z.number().min(0, 'Total assets must be 0 or greater'),
  liabilities: z.number().min(0, 'Total liabilities must be 0 or greater'),
})

export type BusinessBasics = z.infer<typeof BusinessBasicsSchema>
export type FinancialMetrics = z.infer<typeof FinancialMetricsSchema>
export type OperationalData = z.infer<typeof OperationalDataSchema>