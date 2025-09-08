import { z } from 'zod'

// Core health analysis types
export interface HealthDimension {
  id: string
  dimension: 'financial' | 'operational' | 'market' | 'growth'
  score: number
  weight: number
  confidence: number
  components: HealthComponent[]
  benchmarkComparison: {
    industryAverage: number
    percentile: number
    quartile: number
  }
  trendDirection: 'improving' | 'stable' | 'declining'
  keyInsights: string[]
  criticalFactors: string[]
}

export interface HealthComponent {
  id: string
  name: string
  category: string
  score: number
  weight: number
  value: number
  benchmarkValue: number
  impact: 'positive' | 'neutral' | 'negative'
  description: string
  improvementPotential: number
}

export interface IndustryBenchmark {
  id: string
  industry: string
  sector: string
  companySize: 'small' | 'medium' | 'large'
  geography: string
  metrics: {
    [key: string]: {
      average: number
      median: number
      percentiles: { [key: number]: number }
      standardDeviation: number
    }
  }
  sampleSize: number
  dataDate: Date
  source: string
}

export interface TrendAnalysis {
  id: string
  healthScoreId: string
  timeframe: string
  historicalData: HistoricalDataPoint[]
  trendDirection: 'upward' | 'stable' | 'downward'
  changeRate: number
  seasonality: SeasonalPattern[]
  volatility: number
  projectedScores: ProjectedScore[]
  keyTrendDrivers: string[]
}

export interface HistoricalDataPoint {
  date: Date
  overallScore: number
  dimensions: {
    financial: number
    operational: number
    market: number
    growth: number
  }
  contextualFactors: string[]
}

export interface SeasonalPattern {
  period: string
  amplitude: number
  phase: number
  description: string
}

export interface ProjectedScore {
  date: Date
  projectedScore: number
  confidence: number
  scenario: 'conservative' | 'realistic' | 'optimistic'
}

export interface PredictiveIndicator {
  id: string
  name: string
  category: 'leading' | 'lagging' | 'coincident'
  currentValue: number
  predictedValue: number
  confidence: number
  timeHorizon: string
  significance: 'high' | 'medium' | 'low'
  description: string
  actionable: boolean
}

export interface ImprovementPath {
  id: string
  dimension: string
  currentScore: number
  targetScore: number
  improvementPotential: number
  timeframe: string
  actions: ImprovementAction[]
  requiredResources: Resource[]
  riskFactors: string[]
  successMetrics: string[]
}

export interface ImprovementAction {
  id: string
  title: string
  description: string
  priority: number
  effort: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  timeframe: string
  dependencies: string[]
}

export interface Resource {
  type: 'financial' | 'human' | 'technical' | 'time'
  description: string
  amount: number
  unit: string
}

export interface HealthAlert {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'score_decline' | 'benchmark_gap' | 'trend_reversal' | 'predictive_warning'
  message: string
  affectedDimensions: string[]
  recommendations: string[]
  createdAt: Date
}

export interface BusinessHealthScore {
  id: string
  evaluationId: string
  overallScore: number
  dimensions: {
    financial: HealthDimension
    operational: HealthDimension
    market: HealthDimension
    growth: HealthDimension
  }
  industryBenchmarks: IndustryBenchmark[]
  trendAnalysis: TrendAnalysis
  predictiveIndicators: PredictiveIndicator[]
  improvementPaths: ImprovementPath[]
  alerts: HealthAlert[]
  calculatedAt: Date
  validUntil: Date
  methodology: string
  confidenceScore: number
}

// Zod schemas for validation
export const HealthComponentSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  value: z.number(),
  benchmarkValue: z.number(),
  impact: z.enum(['positive', 'neutral', 'negative']),
  description: z.string(),
  improvementPotential: z.number().min(0).max(100)
})

export const HealthDimensionSchema = z.object({
  id: z.string(),
  dimension: z.enum(['financial', 'operational', 'market', 'growth']),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  confidence: z.number().min(0).max(100),
  components: z.array(HealthComponentSchema),
  benchmarkComparison: z.object({
    industryAverage: z.number(),
    percentile: z.number(),
    quartile: z.number()
  }),
  trendDirection: z.enum(['improving', 'stable', 'declining']),
  keyInsights: z.array(z.string()),
  criticalFactors: z.array(z.string())
})

export const BusinessHealthScoreSchema = z.object({
  id: z.string(),
  evaluationId: z.string(),
  overallScore: z.number().min(0).max(100),
  dimensions: z.object({
    financial: HealthDimensionSchema,
    operational: HealthDimensionSchema,
    market: HealthDimensionSchema,
    growth: HealthDimensionSchema
  }),
  calculatedAt: z.date(),
  validUntil: z.date(),
  methodology: z.string(),
  confidenceScore: z.number().min(0).max(100)
})

export type BusinessHealthScoreData = z.infer<typeof BusinessHealthScoreSchema>