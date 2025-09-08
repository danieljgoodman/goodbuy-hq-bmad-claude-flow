export interface User {
  id: string
  email: string
  businessName: string
  industry: string
  role: 'owner' | 'manager' | 'advisor'
  subscriptionTier: 'free' | 'premium' | 'enterprise'
  inputMethod?: 'manual' | 'document_upload'
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
}

// Epic 2: Enhanced BusinessEvaluation with multi-methodology valuations and document intelligence
export interface BusinessEvaluation {
  id: string
  userId: string
  businessData: {
    // Existing fields
    annualRevenue: number
    monthlyRecurring: number
    expenses: number
    cashFlow: number
    assets: number
    liabilities: number
    customerCount: number
    marketPosition: string
    businessType?: string
    industryFocus?: string
    yearsInBusiness?: number
    businessModel?: string
    revenueModel?: string
    teamSize?: number
    primaryMarkets?: string[]
    competitiveDifferentiators?: string[]
    primaryChannels?: string[]
    grossMargin?: number
    employeeCount?: number
    competitiveAdvantages?: string[]
    // Epic 2: Enhanced with document-extracted data
    extractedFinancials?: ExtractedFinancialData
    documentQualityScore?: number
    lastDocumentUpdate?: Date
  }
  // Epic 2: Enhanced multi-methodology valuations
  valuations: {
    assetBased: {
      value: number
      confidence: number
      methodology: string
      factors: string[]
    }
    incomeBased: {
      value: number
      confidence: number
      methodology: string
      multiple: number
      factors: string[]
    }
    marketBased: {
      value: number
      confidence: number
      methodology: string
      comparables: MarketComparable[]
      factors: string[]
    }
    weighted: {
      value: number
      confidence: number
      methodology: string
      weightings: {
        assetBased: number
        incomeBased: number
        marketBased: number
      }
    }
    methodology: string
    industryAdjustments: IndustryAdjustment[]
    valuationRange: {
      low: number
      high: number
      mostLikely: number
    }
  }
  // Epic 2: Enhanced multi-dimensional health scoring
  healthScore: number
  confidenceScore: number
  scoringFactors: {
    financial: HealthDimension
    operational: HealthDimension
    market: HealthDimension
    risk: HealthDimension
    growth: HealthDimension
  }
  // Epic 2: Industry benchmarking
  industryBenchmarks?: {
    percentile: number
    industryAverage: number
    topPerformers: number
    benchmarkCategories: BenchmarkCategory[]
  }
  opportunities: ImprovementOpportunity[]
  // Epic 2: Document intelligence
  documentAnalysis?: DocumentIntelligence[]
  uploadedDocuments?: DocumentProcessingResult[]
  status: 'processing' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

// Epic 2: Enhanced ImprovementOpportunity with quantified impact
export interface ImprovementOpportunity {
  id: string
  category: 'operational' | 'financial' | 'strategic' | 'market'
  title: string
  description: string
  impactEstimate: {
    dollarAmount: number
    percentageIncrease: number
    confidence: number
    roiEstimate: number
    timeline: string
  }
  difficulty: 'low' | 'medium' | 'high'
  timeframe: string
  priority: number
  implementationGuide?: string
  requiredResources: string[]
  // Epic 2: Enhanced opportunity intelligence
  specificAnalysis: string
  selectionRationale: string
  riskFactors: string[]
  prerequisites: string[]
}

// Epic 2: New interfaces for enhanced functionality

export interface ExtractedFinancialData {
  source: 'pdf' | 'excel' | 'image' | 'manual'
  extractionDate: Date
  confidence: number
  revenue: {
    value: number
    confidence: number
    source: string
    breakdown?: { category: string; amount: number; percentage?: number }[]
    timeFrame?: string
  }
  expenses: {
    value: number
    confidence: number
    breakdown: { category: string; amount: number; percentage?: number }[]
    source: string
  }
  cashFlow: {
    value: number
    confidence: number
    source: string
    breakdown?: { category: string; amount: number; percentage?: number }[]
  }
  balanceSheet: {
    assets: number
    liabilities: number
    confidence: number
    source: string
  }
  dataQualityFlags: string[]
  inconsistencies: string[]
  missingData: string[]
}

export interface MarketComparable {
  companyName: string
  industry: string
  revenue: number
  valuation: number
  multiple: number
  source: string
  relevanceScore: number
}

export interface IndustryAdjustment {
  factor: string
  adjustment: number
  reasoning: string
  confidence: number
}

export interface HealthDimension {
  score: number
  confidence: number
  factors: {
    metric: string
    value: number
    benchmark: number
    impact: number
  }[]
  recommendations: string[]
  trend: 'improving' | 'stable' | 'declining'
}

export interface BenchmarkCategory {
  category: string
  userValue: number
  industryAverage: number
  topQuartile: number
  percentile: number
  interpretation: string
}

export interface DocumentIntelligence {
  id: string
  fileName: string
  fileType: 'pdf' | 'excel' | 'image'
  fileSize: number
  uploadDate: Date
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  extractedData: ExtractedFinancialData
  qualityScore: number
  processingTime: number
  insights: string[]
  redFlags: string[]
}

// Epic 2: Document upload types
export interface DocumentUpload {
  file: File
  category: 'financial_statement' | 'tax_return' | 'bank_statement' | 'other'
  description?: string
  documentId?: string
  userId?: string
  evaluationId?: string
}

export interface DocumentProcessingResult {
  id: string
  originalFileName: string
  extractedData: ExtractedFinancialData
  qualityAssessment: {
    overallScore: number
    completeness: number
    accuracy: number
    consistency: number
    flags: string[]
  }
  processingMetadata: {
    processingTime: number
    aiModel: string
    confidence: number
    extractionMethod: string
  }
}

// Missing summary types for data aggregator
export interface ValuationSummary {
  currentValue: number
  confidence: number
  methodology: string
  marketMultiple?: number
  revenueMultiple?: number
  growthRate?: number
}

export interface HealthScoreSummary {
  overallScore: number
  dimensions: Record<string, number>
  trend: 'improving' | 'stable' | 'declining'
}

export interface DocumentAnalysisSummary {
  totalDocuments: number
  averageQualityScore: number
  lastProcessed: Date | null
  keyInsights: number
}

export interface OpportunitiesSummary {
  totalOpportunities: number
  estimatedImpact: number
  priorityDistribution: Record<string, number>
  potentialValue: number
}

// Missing ScenarioProjection type
export interface ScenarioProjection {
  name: string
  probability: number
  valuationImpact: number
  description: string
}