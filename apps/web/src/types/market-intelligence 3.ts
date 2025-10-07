// Strongly typed interfaces for Market Intelligence

export interface TrendAnalysis {
  growth_rate: number
  consolidation_index: number
  disruption_indicators: string[]
  market_maturity: 'emerging' | 'growth' | 'mature' | 'declining'
  confidence?: number
  methodology?: string
}

export interface CompetitivePositioning {
  industry_avg_metrics: Record<string, number>
  user_vs_industry: Record<string, number>
  top_performer_gap: Record<string, number>
  positioning_score: number
  confidence?: number
  percentile_rank?: number
}

export interface MarketOpportunity {
  id: string
  title: string
  description: string
  impact_score: number // 0-100
  feasibility_score: number // 0-100
  trends: string[]
  timeline?: string
  investment_level?: 'low' | 'medium' | 'high'
  risks?: string[]
}

export interface MarketIntelligence {
  id: string
  userId: string
  industry: string
  sector: string
  trendAnalysis: TrendAnalysis
  competitivePositioning: CompetitivePositioning
  opportunities: MarketOpportunity[]
  lastUpdated: Date
  nextUpdate: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface IndustryBenchmarkMetric {
  average: number
  median: number
  top_quartile: number
  data_source: string
  confidence?: number
}

export interface IndustryBenchmark {
  id: string
  industry: string
  sector: string
  metrics: Record<string, IndustryBenchmarkMetric>
  sample_size: number
  last_updated: Date
  createdAt?: Date
  updatedAt?: Date
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
export type AlertCategory = 'trend' | 'competitive' | 'opportunity' | 'risk' | 'regulatory'

export interface MarketAlert {
  id: string
  userId: string
  title: string
  description: string
  severity: AlertSeverity
  category: AlertCategory
  triggerData: Record<string, any>
  actionable: boolean
  dismissed: boolean
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Service request/response types
export interface TrendAnalysisRequest {
  industry: string
  sector: string
  businessData: {
    annualRevenue: number
    yearsInBusiness: number
    employeeCount: number
    marketPosition: string
  }
}

export interface TrendAnalysisResult extends TrendAnalysis {
  confidence: number
  methodology: string
}

export interface CompetitivePositioningResult extends CompetitivePositioning {
  confidence: number
  percentile_rank: number
}

export interface MarketOpportunityResult {
  opportunities: MarketOpportunity[]
  confidence: number
  methodology: string
  total_impact_potential: number
}

// API response types
export interface MarketIntelligenceDashboardData {
  intelligence: MarketIntelligence[]
  alerts: MarketAlert[]
  totalAlerts: number
  summary: {
    totalIntelligenceReports: number
    averageGrowthRate: number
    averagePositioningScore: number
    totalOpportunities: number
    lastUpdated: number | null
  }
}

// Error types
export interface MarketIntelligenceError {
  code: string
  message: string
  details?: any
}

// Configuration types
export interface MarketIntelligenceConfig {
  cacheExpiryMinutes: number
  refreshIntervalDays: number
  maxOpportunities: number
  confidenceThreshold: number
}