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

// Epic 4: Market Intelligence types
export interface MarketIntelligence {
  id: string
  userId: string
  industry: string
  sector: string
  trendAnalysis: {
    growth_rate: number
    consolidation_index: number
    disruption_indicators: string[]
    market_maturity: string
  }
  competitivePositioning: {
    industry_avg_metrics: Record<string, number>
    user_vs_industry: Record<string, number>
    top_performer_gap: Record<string, number>
    positioning_score: number
  }
  opportunities: MarketOpportunity[]
  lastUpdated: Date
  nextUpdate: Date
}

export interface MarketOpportunity {
  id: string
  title: string
  description: string
  impact_score: number
  feasibility_score: number
  trends: string[]
}

export interface IndustryBenchmark {
  id: string
  industry: string
  sector: string
  metrics: Record<string, {
    average: number
    median: number
    top_quartile: number
    data_source: string
  }>
  sample_size: number
  last_updated: Date
}

export interface MarketAlert {
  id: string
  userId: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'trend' | 'competitive' | 'opportunity' | 'risk'
  triggerData: Record<string, any>
  actionable: boolean
  dismissed: boolean
  createdAt: Date
  expiresAt?: Date
}

// Epic 4.2: Account Management types
export interface UserProfile {
  id: string
  userId: string
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
  businessSize?: string
  timezone: string
  language: string
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  id: string
  userId: string
  notifications: {
    email_updates: boolean
    platform_alerts: boolean
    market_intelligence: boolean
    improvement_reminders: boolean
    billing_updates: boolean
  }
  privacy: {
    data_sharing_analytics: boolean
    data_sharing_marketing: boolean
    public_profile: boolean
  }
  dashboard: {
    default_view: string
    chart_preferences: Record<string, any>
  }
  updatedAt: Date
}

export interface SecuritySettings {
  id: string
  userId: string
  twoFactorEnabled: boolean
  twoFactorSecret?: string
  backupCodes?: string[]
  loginNotifications: boolean
  trustedDevices: TrustedDevice[]
  sessionTimeout: number
  lastPasswordChange: Date
  updatedAt: Date
}

export interface TrustedDevice {
  id: string
  deviceName: string
  lastUsed: Date
  trustedUntil: Date
}

export interface DataExportRequest {
  id: string
  userId: string
  requestType: 'full' | 'profile' | 'evaluations' | 'preferences'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  downloadUrl?: string
  expiresAt?: Date
  createdAt: Date
  completedAt?: Date
}

export interface LoginHistory {
  id: string
  userId: string
  ipAddress: string
  userAgent: string
  location?: string
  successful: boolean
  failureReason?: string
  sessionId?: string
  createdAt: Date
}

// Epic 4.3: Advanced Data Visualization & Interactive Analytics types
export interface AnalyticsData {
  id: string
  userId: string
  metric: string
  value: number
  timestamp: Date
  metadata: {
    source: string
    confidence: number
    industry_benchmark?: number
    target_value?: number
  }
  category: 'valuation' | 'health_score' | 'performance' | 'improvement'
  tags: string[]
}

export interface BusinessMetrics {
  id: string
  userId: string
  period: Date
  metrics: {
    valuation: number
    health_score: number
    revenue: number
    profit_margin: number
    growth_rate: number
    efficiency_score: number
    risk_assessment: number
  }
  industry_benchmarks: Record<string, number>
  goals: Record<string, number>
  improvements_implemented: string[]
  calculatedAt: Date
}

export interface ComparisonAnalysis {
  id: string
  userId: string
  comparison_type: 'before_after' | 'period_over_period' | 'benchmark' | 'scenario'
  baseline: {
    period: Date
    metrics: Record<string, number>
    label: string
  }
  comparison: {
    period: Date
    metrics: Record<string, number>
    label: string
  }
  analysis: {
    improvements: string[]
    declines: string[]
    impact_attribution: Record<string, number>
    roi_calculation: number
    confidence: number
  }
  createdAt: Date
}

export interface WidgetConfiguration {
  id: string
  userId: string
  dashboard_id: string
  widgets: DashboardWidget[]
  layout: string
  is_default: boolean
  shared_with: string[]
  updatedAt: Date
}

export interface DashboardWidget {
  id: string
  type: 'chart' | 'kpi' | 'comparison' | 'progress' | 'table'
  position: { x: number; y: number; w: number; h: number }
  config: {
    metrics: string[]
    time_range: string
    chart_type: string
    colors: string[]
    title: string
    show_benchmark: boolean
    show_goals: boolean
    [key: string]: any
  }
}

export interface ExportableReport {
  id: string
  userId: string
  title: string
  report_type: 'executive_summary' | 'detailed_analysis' | 'comparison' | 'performance_review'
  content: {
    charts: ReportChart[]
    kpis: ReportKPI[]
    insights: string[]
    recommendations: string[]
  }
  format: 'pdf' | 'excel' | 'powerpoint'
  sharing: {
    access_level: 'private' | 'shared' | 'public'
    shared_with: string[]
    expires_at?: Date
  }
  branding?: {
    logo?: string
    colors: string[]
    company_name: string
  }
  createdAt: Date
  generatedAt?: Date
}

export interface ReportChart {
  id: string
  chart_type: string
  title: string
  data: any[]
  config: Record<string, any>
}

export interface ReportKPI {
  id: string
  name: string
  value: number
  target?: number
  benchmark?: number
  trend: 'up' | 'down' | 'stable'
  change_percentage?: number
}

// Epic 4.4: Comprehensive Help System & User Support types
export interface HelpContent {
  id: string
  title: string
  content: string
  category: string
  subcategory?: string
  type: 'article' | 'faq' | 'tutorial' | 'guide'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  related_articles: string[]
  view_count: number
  helpful_votes: number
  premium_only: boolean
  last_updated: Date
  author: string
  status: 'draft' | 'published' | 'archived'
  created_at: Date
  updated_at: Date
}

export interface GuideStep {
  id: string
  guide_id: string
  step_number: number
  title: string
  content: string
  target_element?: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action_type?: 'click' | 'hover' | 'input' | 'scroll' | 'wait'
  is_optional: boolean
  created_at: Date
}

export interface VideoContent {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url?: string
  duration: number
  category: string
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  transcript?: string
  chapters: VideoChapter[]
  view_count: number
  premium_only: boolean
  created_at: Date
  updated_at: Date
}

export interface VideoChapter {
  id: string
  title: string
  start_time: number
  end_time: number
  description?: string
}

export interface SupportTicket {
  id: string
  userId: string
  subject: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed'
  assigned_to?: string
  subscription_tier: string
  created_at: Date
  updated_at: Date
  resolved_at?: Date
  messages: SupportMessage[]
  satisfaction_rating?: number
  satisfaction_feedback?: string
}

export interface SupportMessage {
  id: string
  ticket_id: string
  sender_id: string
  sender_type: 'user' | 'support'
  message: string
  timestamp: Date
  attachments?: string[]
}

export interface CommunityPost {
  id: string
  userId: string
  title: string
  content: string
  category: string
  type: 'question' | 'success_story' | 'discussion' | 'tip'
  tags: string[]
  upvotes: number
  downvotes: number
  view_count: number
  reply_count: number
  is_featured: boolean
  is_moderated: boolean
  moderation_status: 'approved' | 'pending' | 'flagged'
  created_at: Date
  updated_at: Date
  replies: CommunityReply[]
}

export interface CommunityReply {
  id: string
  post_id: string
  userId: string
  content: string
  upvotes: number
  is_solution: boolean
  created_at: Date
  updated_at: Date
}

export interface TutorialProgress {
  id: string
  userId: string
  video_id: string
  progress_percentage: number
  completed: boolean
  last_watched_at: Date
  bookmarks: number[]
  notes?: string
}

export interface UserFeedback {
  id: string
  userId: string
  content_id: string
  content_type: 'article' | 'video' | 'tutorial' | 'support'
  feedback_type: 'helpful' | 'not_helpful' | 'rating' | 'comment'
  rating?: number
  comment?: string
  created_at: Date
}

// Story 4.5: Platform Analytics & Performance Optimization Types

export interface UserEvent {
  id: string
  userId?: string
  sessionId: string
  event_type: string
  event_name: string
  properties: Record<string, any>
  page_url: string
  referrer?: string
  user_agent: string
  ip_address: string
  timestamp: Date
  funnel_step?: string
  experiment_variant?: string
}

export interface AIPerformanceMetric {
  id: string
  userId?: string
  model_name: string
  version: string
  metric_type: 'accuracy' | 'confidence' | 'response_time' | 'user_satisfaction'
  value: number
  context: {
    industry?: string
    business_size?: string
    evaluation_type?: string
  }
  user_feedback?: {
    helpful: boolean
    accuracy_rating: number
    comments?: string
  }
  timestamp: Date
  batch_id?: string
}

export interface PlatformMetric {
  id: string
  metric_type: 'response_time' | 'error_rate' | 'throughput' | 'cpu_usage' | 'memory_usage'
  value: number
  endpoint?: string
  service?: string
  status_code?: number
  error_type?: string
  user_count?: number
  timestamp: Date
  tags: Record<string, string>
}

export interface ABTestExperiment {
  id: string
  name: string
  description: string
  hypothesis: string
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived'
  variants: {
    id: string
    name: string
    description: string
    traffic_percentage: number
    config: Record<string, any>
  }[]
  target_metric: string
  success_criteria: {
    metric: string
    threshold: number
    direction: 'increase' | 'decrease'
  }
  start_date: Date
  end_date?: Date
  sample_size_required: number
  confidence_level: number
  statistical_significance?: number
  winner_variant?: string
  results: {
    variant_id: string
    conversion_rate: number
    confidence_interval: [number, number]
    sample_size: number
  }[]
  created_at: Date
  updated_at: Date
}

export interface ABTestParticipant {
  id: string
  userId: string
  experiment_id: string
  variant_id: string
  assigned_at: Date
  converted: boolean
  converted_at?: Date
  events: Record<string, any>[]
}

export interface BusinessIntelligenceMetric {
  id: string
  metric_type: 'revenue' | 'churn_rate' | 'conversion_rate' | 'user_growth' | 'subscription_metrics' | 'feature_adoption' | 'user_satisfaction' | 'platform_usage'
  value: number
  dimensions: Record<string, any>
  period: string
  period_start: Date
  period_end: Date
  calculated_at: Date
  metadata: Record<string, any>
}

export interface PerformanceAlert {
  id: string
  alert_type: 'performance' | 'error_rate' | 'user_behavior' | 'business_metric' | 'ai_accuracy'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  metric_type: string
  threshold: number
  current_value: number
  status: 'active' | 'acknowledged' | 'resolved'
  triggered_at: Date
  resolved_at?: Date
  metadata: Record<string, any>
}

// Analytics utility types
export interface FunnelStep {
  name: string
  users: number
  conversion_rate: number
  drop_off: number
}

export interface FunnelAnalysis {
  funnel_name: string
  steps: FunnelStep[]
  overall_conversion_rate: number
  total_users: number
}

export interface FeatureUsageData {
  feature: string
  usage_count: number
  unique_users: number
  average_time_spent: number
  adoption_rate: number
}

export interface CohortData {
  cohort_date: Date
  cohort_size: number
  retention_rates: Record<string, number>
}

export interface ExperimentResult {
  variant_id: string
  variant_name: string
  participants: number
  conversions: number
  conversion_rate: number
  confidence_interval: [number, number]
  statistical_significance: number
  is_winner: boolean
}

export interface BusinessIntelligenceSummary {
  revenue: {
    current_month: number
    previous_month: number
    growth_rate: number
    forecast: number
  }
  subscriptions: {
    total_subscribers: number
    new_subscribers: number
    churned_subscribers: number
    churn_rate: number
  }
  user_metrics: {
    total_users: number
    active_users: number
    user_growth_rate: number
    average_session_duration: number
  }
  feature_adoption: {
    feature: string
    adoption_rate: number
    trend: 'up' | 'down' | 'stable'
  }[]
}

// Professional Tier Types - Re-export from evaluation.ts and validations
export type { ProfessionalTierData } from './evaluation'

// Professional Tier Validation Types - Re-export from validations
export type {
  ProfessionalFinancialMetrics,
  CustomerAnalytics,
  OperationalEfficiency,
  CompetitorAnalysis,
  MarketIntelligence,
  ScenarioAnalysis,
  FinancialPlanning,
  RegulatoryCompliance,
  RiskAssessment,
  InsuranceCoverage,
  AuditTrail,
  Compliance,
  ProfessionalBusinessData,
  ProfessionalEvaluation
} from '../lib/validations/professional-tier'