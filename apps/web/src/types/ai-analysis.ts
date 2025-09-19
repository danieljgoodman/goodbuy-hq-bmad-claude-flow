/**
 * AI Analysis Types - Story 11.8
 * Comprehensive TypeScript types for tier-specific AI analysis
 */

// Base analysis types
export type AnalysisTier = 'consumer' | 'professional' | 'enterprise';
export type AnalysisConfidence = 'low' | 'medium' | 'high' | 'very_high';
export type AnalysisQuality = 'poor' | 'fair' | 'good' | 'excellent' | 'exceptional';
export type PromptType = 'analysis' | 'validation' | 'recommendation' | 'scenario' | 'risk_assessment';

// Core AI Analysis structures
export interface AIAnalysisRequest {
  id: string;
  userId: string;
  tier: AnalysisTier;
  type: PromptType;
  context: AnalysisContext;
  prompt: OptimizedPrompt;
  metadata: AnalysisMetadata;
  createdAt: Date;
}

export interface AIAnalysisResponse {
  id: string;
  requestId: string;
  result: AnalysisResult;
  confidence: ConfidenceScoring;
  quality: QualityScoring;
  tokens: TokenUsage;
  processingTime: number;
  completedAt: Date;
}

// Analysis Context
export interface AnalysisContext {
  businessData: BusinessContextData;
  userPreferences: UserAnalysisPreferences;
  historicalData?: HistoricalAnalysisData;
  marketConditions?: MarketContextData;
  companyProfile?: CompanyProfileData;
}

export interface BusinessContextData {
  industry: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  revenue?: number;
  employees?: number;
  geography: string[];
  businessModel: string;
  stage: 'idea' | 'mvp' | 'growth' | 'scale' | 'mature' | 'exit';
}

export interface UserAnalysisPreferences {
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  focusAreas: string[];
  timeHorizon: 'short' | 'medium' | 'long';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  priorityMetrics: string[];
}

export interface HistoricalAnalysisData {
  previousAnalyses: PreviousAnalysis[];
  performanceHistory: PerformanceMetric[];
  decisionOutcomes: DecisionOutcome[];
}

export interface MarketContextData {
  marketSize: number;
  growthRate: number;
  competitiveIntensity: 'low' | 'medium' | 'high';
  marketTrends: string[];
  regulatoryEnvironment: string[];
}

export interface CompanyProfileData {
  foundedYear: number;
  fundingStage: string;
  keyMetrics: Record<string, number>;
  strengths: string[];
  challenges: string[];
  strategicGoals: string[];
}

// Optimized Prompt structures
export interface OptimizedPrompt {
  original: string;
  optimized: string;
  tokenCount: number;
  compressionRatio: number;
  priority: PromptPriority;
  structure: PromptStructure;
  tierSpecific: TierSpecificPrompt;
}

export interface PromptPriority {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: PriorityFactor[];
  score: number;
  reasoning: string;
}

export interface PriorityFactor {
  name: string;
  weight: number;
  value: number;
  impact: 'negative' | 'neutral' | 'positive';
}

export interface PromptStructure {
  sections: PromptSection[];
  instructions: string[];
  constraints: PromptConstraint[];
  outputFormat: OutputFormatSpec;
}

export interface PromptSection {
  name: string;
  content: string;
  tokenCount: number;
  priority: number;
  required: boolean;
}

export interface PromptConstraint {
  type: 'token_limit' | 'format' | 'content' | 'time' | 'quality';
  value: string | number;
  strict: boolean;
  fallback?: string;
}

export interface OutputFormatSpec {
  type: 'json' | 'markdown' | 'structured' | 'narrative';
  schema?: Record<string, any>;
  template?: string;
  validation: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'range' | 'format' | 'custom';
  condition: string;
  message: string;
}

// Tier-specific prompt configurations
export interface TierSpecificPrompt {
  tier: AnalysisTier;
  features: TierFeature[];
  limitations: TierLimitation[];
  enhancedCapabilities: EnhancedCapability[];
}

export interface TierFeature {
  name: string;
  description: string;
  available: boolean;
  tokenAllocation: number;
}

export interface TierLimitation {
  type: 'token' | 'feature' | 'frequency' | 'complexity';
  description: string;
  threshold: number;
  fallback: string;
}

export interface EnhancedCapability {
  name: string;
  tier: AnalysisTier;
  description: string;
  tokenCost: number;
  qualityBoost: number;
}

// Analysis Results
export interface AnalysisResult {
  summary: AnalysisSummary;
  findings: AnalysisFinding[];
  recommendations: AnalysisRecommendation[];
  insights: AnalysisInsight[];
  risks: RiskAssessment[];
  opportunities: OpportunityAssessment[];
  scenarios: ScenarioAnalysis[];
}

export interface AnalysisSummary {
  key_points: string[];
  main_conclusions: string[];
  confidence_level: AnalysisConfidence;
  quality_indicators: QualityIndicator[];
}

export interface AnalysisFinding {
  id: string;
  category: string;
  description: string;
  evidence: Evidence[];
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  tier_specific: boolean;
}

export interface Evidence {
  type: 'data' | 'calculation' | 'reference' | 'assumption';
  source: string;
  value: any;
  reliability: number;
}

export interface AnalysisRecommendation {
  id: string;
  title: string;
  description: string;
  rationale: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  effort: 'minimal' | 'moderate' | 'significant' | 'major';
  timeline: string;
  expected_impact: ExpectedImpact;
  prerequisites: string[];
  risks: string[];
}

export interface ExpectedImpact {
  financial: ImpactMeasure;
  operational: ImpactMeasure;
  strategic: ImpactMeasure;
  time_to_value: string;
}

export interface ImpactMeasure {
  direction: 'positive' | 'negative' | 'neutral';
  magnitude: 'low' | 'medium' | 'high';
  confidence: number;
  quantified?: number;
  unit?: string;
}

export interface AnalysisInsight {
  id: string;
  type: 'pattern' | 'correlation' | 'anomaly' | 'trend' | 'benchmark';
  description: string;
  significance: number;
  context: string;
  actionable: boolean;
}

export interface RiskAssessment {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'strategic' | 'regulatory' | 'market';
  probability: number;
  impact: number;
  risk_score: number;
  mitigation_strategies: string[];
  monitoring_indicators: string[];
}

export interface OpportunityAssessment {
  id: string;
  name: string;
  description: string;
  potential_value: number;
  probability: number;
  time_to_realize: string;
  investment_required: string;
  strategic_alignment: number;
}

export interface ScenarioAnalysis {
  id: string;
  name: string;
  description: string;
  probability: number;
  outcomes: ScenarioOutcome[];
  key_drivers: string[];
  indicators: string[];
}

export interface ScenarioOutcome {
  metric: string;
  optimistic: number;
  realistic: number;
  pessimistic: number;
  unit: string;
}

// Confidence and Quality Scoring
export interface ConfidenceScoring {
  overall: number;
  breakdown: ConfidenceBreakdown;
  factors: ConfidenceFactor[];
  calibration: ConfidenceCalibration;
}

export interface ConfidenceBreakdown {
  data_quality: number;
  model_reliability: number;
  context_completeness: number;
  historical_accuracy: number;
  expert_validation: number;
}

export interface ConfidenceFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
  impact: 'increase' | 'decrease' | 'neutral';
}

export interface ConfidenceCalibration {
  calibrated_confidence: number;
  adjustment_factor: number;
  historical_accuracy: number;
  confidence_intervals: ConfidenceInterval[];
}

export interface ConfidenceInterval {
  level: number;
  lower_bound: number;
  upper_bound: number;
  coverage: number;
}

export interface QualityScoring {
  overall: number;
  dimensions: QualityDimension[];
  benchmarks: QualityBenchmark[];
  improvement_suggestions: QualityImprovement[];
}

export interface QualityDimension {
  name: string;
  score: number;
  weight: number;
  description: string;
  criteria: QualityCriterion[];
}

export interface QualityCriterion {
  name: string;
  score: number;
  threshold: number;
  met: boolean;
  evidence: string;
}

export interface QualityBenchmark {
  category: string;
  industry_average: number;
  best_practice: number;
  current_score: number;
  gap: number;
}

export interface QualityImprovement {
  dimension: string;
  suggestion: string;
  potential_impact: number;
  effort_required: 'low' | 'medium' | 'high';
  priority: number;
}

// Token Usage and Management
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
  efficiency_score: number;
  optimization_opportunities: TokenOptimization[];
}

export interface TokenOptimization {
  type: 'compression' | 'prioritization' | 'caching' | 'batching';
  description: string;
  potential_savings: number;
  implementation_effort: 'low' | 'medium' | 'high';
}

// Supporting types
export interface PreviousAnalysis {
  id: string;
  type: PromptType;
  date: Date;
  confidence: number;
  quality: number;
  outcomes: string[];
}

export interface PerformanceMetric {
  name: string;
  value: number;
  date: Date;
  trend: 'improving' | 'stable' | 'declining';
  benchmark?: number;
}

export interface DecisionOutcome {
  decision: string;
  date: Date;
  expected_outcome: string;
  actual_outcome: string;
  success_score: number;
  lessons_learned: string[];
}

export interface QualityIndicator {
  name: string;
  value: number;
  threshold: number;
  status: 'pass' | 'warning' | 'fail';
  description: string;
}

// Analysis metadata
export interface AnalysisMetadata {
  version: string;
  model: string;
  parameters: ModelParameters;
  flags: AnalysisFlag[];
  environment: AnalysisEnvironment;
}

export interface ModelParameters {
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  custom_parameters?: Record<string, any>;
}

export interface AnalysisFlag {
  name: string;
  value: boolean | string | number;
  description: string;
  impact: 'performance' | 'quality' | 'cost' | 'feature';
}

export interface AnalysisEnvironment {
  tier: AnalysisTier;
  user_context: string;
  session_id: string;
  request_timestamp: Date;
  feature_flags: Record<string, boolean>;
}

// Export utility types
export type AnalysisMetrics = Pick<AIAnalysisResponse, 'confidence' | 'quality' | 'tokens'>;
export type PromptOptimizationResult = Pick<OptimizedPrompt, 'optimized' | 'tokenCount' | 'compressionRatio'>;
export type TierCapabilities = Pick<TierSpecificPrompt, 'features' | 'limitations' | 'enhancedCapabilities'>;