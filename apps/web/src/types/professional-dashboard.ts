// Professional Tier Dashboard TypeScript Interfaces
// Provides comprehensive type safety for Professional tier dashboard components

import type { ChartDataPoint, ActivityItem } from './dashboard'

// Financial Trend Analysis Types
export interface FinancialTrendData {
  year: number
  revenue: number
  profit: number
  cashFlow: number
  growthRate: {
    revenue: number
    profit: number
    cashFlow: number
  }
}

export interface MultiYearFinancialData {
  trends: FinancialTrendData[]
  projections: FinancialTrendData[]
  benchmarks: {
    industry: FinancialTrendData[]
    market: FinancialTrendData[]
  }
  insights: {
    strongestMetric: keyof Omit<FinancialTrendData, 'year' | 'growthRate'>
    volatilityIndex: number
    trendDirection: 'positive' | 'negative' | 'stable'
    recommendations: string[]
  }
}

// Customer Concentration Risk Types
export interface CustomerRiskData {
  customerId: string
  customerName: string
  revenueContribution: number
  percentageOfTotal: number
  contractDuration: number
  riskScore: number
  riskCategory: 'low' | 'medium' | 'high' | 'critical'
  lastOrderDate: Date
  paymentHistory: 'excellent' | 'good' | 'fair' | 'poor'
}

export interface CustomerConcentrationAnalysis {
  customers: CustomerRiskData[]
  topCustomersRisk: {
    top5Percentage: number
    top10Percentage: number
    concentrationIndex: number
  }
  riskMetrics: {
    overallRiskScore: number
    diversificationScore: number
    vulnerabilityIndex: number
  }
  heatMapData: {
    x: string
    y: string
    value: number
    risk: CustomerRiskData['riskCategory']
  }[]
  recommendations: string[]
}

// Competitive Positioning Types
export interface CompetitiveMetric {
  metric: string
  companyScore: number
  industryAverage: number
  topPerformerScore: number
  weight: number
  category: 'market' | 'product' | 'financial' | 'operational' | 'innovation'
}

export interface CompetitivePositioning {
  metrics: CompetitiveMetric[]
  overallPosition: {
    score: number
    ranking: number
    totalCompetitors: number
    marketPosition: 'leader' | 'challenger' | 'follower' | 'niche'
  }
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
  benchmarkData: {
    [category: string]: {
      companyAverage: number
      industryAverage: number
      topPerformerAverage: number
    }
  }
}

// Investment ROI Calculator Types
export interface InvestmentScenario {
  id: string
  name: string
  investmentAmount: number
  expectedReturn: number
  timeHorizon: number
  riskLevel: 'low' | 'medium' | 'high'
  category: 'expansion' | 'technology' | 'marketing' | 'operations' | 'acquisition'
}

export interface ROICalculation {
  scenario: InvestmentScenario
  projectedROI: number
  netPresentValue: number
  internalRateOfReturn: number
  paybackPeriod: number
  riskAdjustedReturn: number
  cashFlowProjection: {
    year: number
    cashFlow: number
    cumulativeCashFlow: number
  }[]
}

export interface InvestmentAnalysis {
  scenarios: InvestmentScenario[]
  calculations: ROICalculation[]
  comparison: {
    bestROI: ROICalculation
    safestInvestment: ROICalculation
    fastestPayback: ROICalculation
  }
  portfolioOptimization: {
    recommendedMix: {
      scenarioId: string
      allocation: number
    }[]
    expectedPortfolioROI: number
    riskScore: number
  }
}

// Operational Capacity Types
export interface CapacityMetric {
  department: string
  currentCapacity: number
  maximumCapacity: number
  utilizationRate: number
  bottleneckScore: number
  efficiency: number
  growthPotential: number
}

export interface OperationalCapacityData {
  metrics: CapacityMetric[]
  overallUtilization: number
  bottlenecks: {
    department: string
    severity: 'minor' | 'moderate' | 'severe' | 'critical'
    impact: number
    suggestedActions: string[]
  }[]
  optimization: {
    potentialImprovement: number
    quickWins: string[]
    longTermStrategy: string[]
  }
  forecasting: {
    capacityNeeds: {
      timeframe: string
      additionalCapacity: number
      investmentRequired: number
    }[]
  }
}

// Dashboard Data Aggregation Types
export interface ProfessionalDashboardData {
  financial: MultiYearFinancialData
  customerRisk: CustomerConcentrationAnalysis
  competitive: CompetitivePositioning
  investment: InvestmentAnalysis
  operational: OperationalCapacityData
  lastUpdated: Date
  dataQuality: {
    completeness: number
    accuracy: number
    freshness: number
    overallScore: number
  }
}

// Chart Configuration Types
export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'radar' | 'heatmap' | 'scatter'
  responsive: boolean
  maintainAspectRatio: boolean
  colors: string[]
  animation: {
    duration: number
    easing: string
  }
  legend: {
    display: boolean
    position: 'top' | 'bottom' | 'left' | 'right'
  }
  tooltip: {
    enabled: boolean
    format: string
  }
}

// Export Configuration Types
export interface ExportConfig {
  format: 'pdf' | 'png' | 'jpeg' | 'svg' | 'excel'
  quality: 'low' | 'medium' | 'high'
  includeData: boolean
  includeCharts: boolean
  includeInsights: boolean
  customBranding: boolean
}

// Performance Optimization Types
export interface ComponentPerformanceMetrics {
  componentName: string
  loadTime: number
  renderTime: number
  interactionTime: number
  memoryUsage: number
  dataFetchTime: number
  status: 'optimal' | 'acceptable' | 'slow' | 'critical'
}

export interface DashboardPerformanceData {
  overall: {
    totalLoadTime: number
    averageInteractionTime: number
    performanceScore: number
  }
  components: ComponentPerformanceMetrics[]
  optimization: {
    suggestions: string[]
    priorityActions: string[]
  }
}

// Hook Return Types
export interface UseProfessionalDashboardDataReturn {
  data: ProfessionalDashboardData | null
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  lastFetched: Date | null
}

// Component Props Types
export interface ProfessionalDashboardProps {
  userId: string
  evaluationId?: string
  timeRange?: {
    start: Date
    end: Date
  }
  refreshInterval?: number
  onExport?: (config: ExportConfig) => Promise<string>
  onRefresh?: () => void
}

export interface ChartComponentProps {
  data: any
  config: ChartConfig
  loading?: boolean
  error?: Error | null
  height?: number
  onDataPointClick?: (data: any) => void
  onExport?: (format: ExportConfig['format']) => Promise<string>
}

// Analytics and Insights Types
export interface ProfessionalInsight {
  id: string
  category: 'financial' | 'risk' | 'competitive' | 'operational' | 'strategic'
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  confidence: number
  impact: 'low' | 'medium' | 'high'
  actionRequired: boolean
  recommendations: string[]
  dataSource: string[]
  generatedAt: Date
}

export interface AnalyticsResults {
  insights: ProfessionalInsight[]
  summary: {
    totalInsights: number
    criticalIssues: number
    opportunities: number
    overallHealth: number
  }
  trends: {
    improving: string[]
    declining: string[]
    stable: string[]
  }
}