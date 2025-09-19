/**
 * AI Analysis Validation Schemas - Story 11.8
 * Comprehensive Zod validation schemas for AI analysis types
 */

import { z } from 'zod';

// Base enum schemas
export const AnalysisTierSchema = z.enum(['consumer', 'professional', 'enterprise']);
export const AnalysisConfidenceSchema = z.enum(['low', 'medium', 'high', 'very_high']);
export const AnalysisQualitySchema = z.enum(['poor', 'fair', 'good', 'excellent', 'exceptional']);
export const PromptTypeSchema = z.enum(['analysis', 'validation', 'recommendation', 'scenario', 'risk_assessment']);

// Business Context schemas
export const BusinessContextDataSchema = z.object({
  industry: z.string().min(1, 'Industry is required'),
  companySize: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']),
  revenue: z.number().positive().optional(),
  employees: z.number().int().positive().optional(),
  geography: z.array(z.string().min(1)).min(1, 'At least one geography required'),
  businessModel: z.string().min(1, 'Business model is required'),
  stage: z.enum(['idea', 'mvp', 'growth', 'scale', 'mature', 'exit'])
});

export const UserAnalysisPreferencesSchema = z.object({
  analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']),
  focusAreas: z.array(z.string().min(1)).min(1, 'At least one focus area required'),
  timeHorizon: z.enum(['short', 'medium', 'long']),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
  priorityMetrics: z.array(z.string().min(1))
});

export const PerformanceMetricSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
  date: z.date(),
  trend: z.enum(['improving', 'stable', 'declining']),
  benchmark: z.number().optional()
});

export const PreviousAnalysisSchema = z.object({
  id: z.string().uuid(),
  type: PromptTypeSchema,
  date: z.date(),
  confidence: z.number().min(0).max(1),
  quality: z.number().min(0).max(1),
  outcomes: z.array(z.string().min(1))
});

export const DecisionOutcomeSchema = z.object({
  decision: z.string().min(1),
  date: z.date(),
  expected_outcome: z.string().min(1),
  actual_outcome: z.string().min(1),
  success_score: z.number().min(0).max(1),
  lessons_learned: z.array(z.string().min(1))
});

export const HistoricalAnalysisDataSchema = z.object({
  previousAnalyses: z.array(PreviousAnalysisSchema),
  performanceHistory: z.array(PerformanceMetricSchema),
  decisionOutcomes: z.array(DecisionOutcomeSchema)
});

export const MarketContextDataSchema = z.object({
  marketSize: z.number().positive(),
  growthRate: z.number(),
  competitiveIntensity: z.enum(['low', 'medium', 'high']),
  marketTrends: z.array(z.string().min(1)),
  regulatoryEnvironment: z.array(z.string().min(1))
});

export const CompanyProfileDataSchema = z.object({
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()),
  fundingStage: z.string().min(1),
  keyMetrics: z.record(z.string(), z.number()),
  strengths: z.array(z.string().min(1)),
  challenges: z.array(z.string().min(1)),
  strategicGoals: z.array(z.string().min(1))
});

export const AnalysisContextSchema = z.object({
  businessData: BusinessContextDataSchema,
  userPreferences: UserAnalysisPreferencesSchema,
  historicalData: HistoricalAnalysisDataSchema.optional(),
  marketConditions: MarketContextDataSchema.optional(),
  companyProfile: CompanyProfileDataSchema.optional()
});

// Prompt structure schemas
export const PriorityFactorSchema = z.object({
  name: z.string().min(1),
  weight: z.number().min(0).max(1),
  value: z.number(),
  impact: z.enum(['negative', 'neutral', 'positive'])
});

export const PromptPrioritySchema = z.object({
  level: z.enum(['low', 'medium', 'high', 'critical']),
  factors: z.array(PriorityFactorSchema),
  score: z.number().min(0).max(1),
  reasoning: z.string().min(1)
});

export const ValidationRuleSchema = z.object({
  field: z.string().min(1),
  type: z.enum(['required', 'type', 'range', 'format', 'custom']),
  condition: z.string().min(1),
  message: z.string().min(1)
});

export const OutputFormatSpecSchema = z.object({
  type: z.enum(['json', 'markdown', 'structured', 'narrative']),
  schema: z.record(z.any()).optional(),
  template: z.string().optional(),
  validation: z.array(ValidationRuleSchema)
});

export const PromptConstraintSchema = z.object({
  type: z.enum(['token_limit', 'format', 'content', 'time', 'quality']),
  value: z.union([z.string(), z.number()]),
  strict: z.boolean(),
  fallback: z.string().optional()
});

export const PromptSectionSchema = z.object({
  name: z.string().min(1),
  content: z.string().min(1),
  tokenCount: z.number().int().positive(),
  priority: z.number().min(0).max(10),
  required: z.boolean()
});

export const PromptStructureSchema = z.object({
  sections: z.array(PromptSectionSchema).min(1),
  instructions: z.array(z.string().min(1)),
  constraints: z.array(PromptConstraintSchema),
  outputFormat: OutputFormatSpecSchema
});

// Tier-specific schemas
export const TierFeatureSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  available: z.boolean(),
  tokenAllocation: z.number().int().positive()
});

export const TierLimitationSchema = z.object({
  type: z.enum(['token', 'feature', 'frequency', 'complexity']),
  description: z.string().min(1),
  threshold: z.number().positive(),
  fallback: z.string().min(1)
});

export const EnhancedCapabilitySchema = z.object({
  name: z.string().min(1),
  tier: AnalysisTierSchema,
  description: z.string().min(1),
  tokenCost: z.number().int().positive(),
  qualityBoost: z.number().min(0).max(1)
});

export const TierSpecificPromptSchema = z.object({
  tier: AnalysisTierSchema,
  features: z.array(TierFeatureSchema),
  limitations: z.array(TierLimitationSchema),
  enhancedCapabilities: z.array(EnhancedCapabilitySchema)
});

export const OptimizedPromptSchema = z.object({
  original: z.string().min(1, 'Original prompt is required'),
  optimized: z.string().min(1, 'Optimized prompt is required'),
  tokenCount: z.number().int().positive(),
  compressionRatio: z.number().min(0).max(1),
  priority: PromptPrioritySchema,
  structure: PromptStructureSchema,
  tierSpecific: TierSpecificPromptSchema
});

// Model and metadata schemas
export const ModelParametersSchema = z.object({
  temperature: z.number().min(0).max(2),
  max_tokens: z.number().int().positive(),
  top_p: z.number().min(0).max(1),
  frequency_penalty: z.number().min(-2).max(2),
  presence_penalty: z.number().min(-2).max(2),
  custom_parameters: z.record(z.any()).optional()
});

export const AnalysisFlagSchema = z.object({
  name: z.string().min(1),
  value: z.union([z.boolean(), z.string(), z.number()]),
  description: z.string().min(1),
  impact: z.enum(['performance', 'quality', 'cost', 'feature'])
});

export const AnalysisEnvironmentSchema = z.object({
  tier: AnalysisTierSchema,
  user_context: z.string().min(1),
  session_id: z.string().uuid(),
  request_timestamp: z.date(),
  feature_flags: z.record(z.boolean())
});

export const AnalysisMetadataSchema = z.object({
  version: z.string().min(1),
  model: z.string().min(1),
  parameters: ModelParametersSchema,
  flags: z.array(AnalysisFlagSchema),
  environment: AnalysisEnvironmentSchema
});

// Request schema
export const AIAnalysisRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  tier: AnalysisTierSchema,
  type: PromptTypeSchema,
  context: AnalysisContextSchema,
  prompt: OptimizedPromptSchema,
  metadata: AnalysisMetadataSchema,
  createdAt: z.date()
});

// Result schemas
export const EvidenceSchema = z.object({
  type: z.enum(['data', 'calculation', 'reference', 'assumption']),
  source: z.string().min(1),
  value: z.any(),
  reliability: z.number().min(0).max(1)
});

export const AnalysisFindingSchema = z.object({
  id: z.string().uuid(),
  category: z.string().min(1),
  description: z.string().min(1),
  evidence: z.array(EvidenceSchema),
  confidence: z.number().min(0).max(1),
  impact: z.enum(['low', 'medium', 'high', 'critical']),
  tier_specific: z.boolean()
});

export const ImpactMeasureSchema = z.object({
  direction: z.enum(['positive', 'negative', 'neutral']),
  magnitude: z.enum(['low', 'medium', 'high']),
  confidence: z.number().min(0).max(1),
  quantified: z.number().optional(),
  unit: z.string().optional()
});

export const ExpectedImpactSchema = z.object({
  financial: ImpactMeasureSchema,
  operational: ImpactMeasureSchema,
  strategic: ImpactMeasureSchema,
  time_to_value: z.string().min(1)
});

export const AnalysisRecommendationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  rationale: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  effort: z.enum(['minimal', 'moderate', 'significant', 'major']),
  timeline: z.string().min(1),
  expected_impact: ExpectedImpactSchema,
  prerequisites: z.array(z.string().min(1)),
  risks: z.array(z.string().min(1))
});

export const AnalysisInsightSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['pattern', 'correlation', 'anomaly', 'trend', 'benchmark']),
  description: z.string().min(1),
  significance: z.number().min(0).max(1),
  context: z.string().min(1),
  actionable: z.boolean()
});

export const RiskAssessmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['financial', 'operational', 'strategic', 'regulatory', 'market']),
  probability: z.number().min(0).max(1),
  impact: z.number().min(0).max(1),
  risk_score: z.number().min(0).max(1),
  mitigation_strategies: z.array(z.string().min(1)),
  monitoring_indicators: z.array(z.string().min(1))
});

export const OpportunityAssessmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  potential_value: z.number(),
  probability: z.number().min(0).max(1),
  time_to_realize: z.string().min(1),
  investment_required: z.string().min(1),
  strategic_alignment: z.number().min(0).max(1)
});

export const ScenarioOutcomeSchema = z.object({
  metric: z.string().min(1),
  optimistic: z.number(),
  realistic: z.number(),
  pessimistic: z.number(),
  unit: z.string().min(1)
});

export const ScenarioAnalysisSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  probability: z.number().min(0).max(1),
  outcomes: z.array(ScenarioOutcomeSchema),
  key_drivers: z.array(z.string().min(1)),
  indicators: z.array(z.string().min(1))
});

export const QualityIndicatorSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
  threshold: z.number(),
  status: z.enum(['pass', 'warning', 'fail']),
  description: z.string().min(1)
});

export const AnalysisSummarySchema = z.object({
  key_points: z.array(z.string().min(1)).min(1),
  main_conclusions: z.array(z.string().min(1)).min(1),
  confidence_level: AnalysisConfidenceSchema,
  quality_indicators: z.array(QualityIndicatorSchema)
});

export const AnalysisResultSchema = z.object({
  summary: AnalysisSummarySchema,
  findings: z.array(AnalysisFindingSchema),
  recommendations: z.array(AnalysisRecommendationSchema),
  insights: z.array(AnalysisInsightSchema),
  risks: z.array(RiskAssessmentSchema),
  opportunities: z.array(OpportunityAssessmentSchema),
  scenarios: z.array(ScenarioAnalysisSchema)
});

// Confidence scoring schemas
export const ConfidenceFactorSchema = z.object({
  name: z.string().min(1),
  weight: z.number().min(0).max(1),
  score: z.number().min(0).max(1),
  description: z.string().min(1),
  impact: z.enum(['increase', 'decrease', 'neutral'])
});

export const ConfidenceBreakdownSchema = z.object({
  data_quality: z.number().min(0).max(1),
  model_reliability: z.number().min(0).max(1),
  context_completeness: z.number().min(0).max(1),
  historical_accuracy: z.number().min(0).max(1),
  expert_validation: z.number().min(0).max(1)
});

export const ConfidenceIntervalSchema = z.object({
  level: z.number().min(0).max(1),
  lower_bound: z.number(),
  upper_bound: z.number(),
  coverage: z.number().min(0).max(1)
});

export const ConfidenceCalibrationSchema = z.object({
  calibrated_confidence: z.number().min(0).max(1),
  adjustment_factor: z.number(),
  historical_accuracy: z.number().min(0).max(1),
  confidence_intervals: z.array(ConfidenceIntervalSchema)
});

export const ConfidenceScoringSchema = z.object({
  overall: z.number().min(0).max(1),
  breakdown: ConfidenceBreakdownSchema,
  factors: z.array(ConfidenceFactorSchema),
  calibration: ConfidenceCalibrationSchema
});

// Quality scoring schemas
export const QualityCriterionSchema = z.object({
  name: z.string().min(1),
  score: z.number().min(0).max(1),
  threshold: z.number().min(0).max(1),
  met: z.boolean(),
  evidence: z.string().min(1)
});

export const QualityDimensionSchema = z.object({
  name: z.string().min(1),
  score: z.number().min(0).max(1),
  weight: z.number().min(0).max(1),
  description: z.string().min(1),
  criteria: z.array(QualityCriterionSchema)
});

export const QualityBenchmarkSchema = z.object({
  category: z.string().min(1),
  industry_average: z.number().min(0).max(1),
  best_practice: z.number().min(0).max(1),
  current_score: z.number().min(0).max(1),
  gap: z.number()
});

export const QualityImprovementSchema = z.object({
  dimension: z.string().min(1),
  suggestion: z.string().min(1),
  potential_impact: z.number().min(0).max(1),
  effort_required: z.enum(['low', 'medium', 'high']),
  priority: z.number().min(0).max(10)
});

export const QualityScoringSchema = z.object({
  overall: z.number().min(0).max(1),
  dimensions: z.array(QualityDimensionSchema),
  benchmarks: z.array(QualityBenchmarkSchema),
  improvement_suggestions: z.array(QualityImprovementSchema)
});

// Token usage schemas
export const TokenOptimizationSchema = z.object({
  type: z.enum(['compression', 'prioritization', 'caching', 'batching']),
  description: z.string().min(1),
  potential_savings: z.number().min(0),
  implementation_effort: z.enum(['low', 'medium', 'high'])
});

export const TokenUsageSchema = z.object({
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
  cost: z.number().nonnegative(),
  efficiency_score: z.number().min(0).max(1),
  optimization_opportunities: z.array(TokenOptimizationSchema)
});

// Response schema
export const AIAnalysisResponseSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  result: AnalysisResultSchema,
  confidence: ConfidenceScoringSchema,
  quality: QualityScoringSchema,
  tokens: TokenUsageSchema,
  processingTime: z.number().positive(),
  completedAt: z.date()
});

// Validation utilities
export const validateTierAccess = (tier: string, feature: string): boolean => {
  const tierFeatures = {
    consumer: ['basic_analysis', 'simple_recommendations'],
    professional: ['advanced_analysis', 'scenario_modeling', 'risk_assessment'],
    enterprise: ['comprehensive_analysis', 'monte_carlo', 'strategic_planning', 'custom_models']
  };

  return tierFeatures[tier as keyof typeof tierFeatures]?.includes(feature) ?? false;
};

export const validateTokenLimits = (tier: string, tokenCount: number): boolean => {
  const tokenLimits = {
    consumer: 1000,
    professional: 5000,
    enterprise: 20000
  };

  return tokenCount <= (tokenLimits[tier as keyof typeof tokenLimits] ?? 0);
};

export const validateAnalysisComplexity = (tier: string, complexity: number): boolean => {
  const complexityLimits = {
    consumer: 0.3,
    professional: 0.7,
    enterprise: 1.0
  };

  return complexity <= (complexityLimits[tier as keyof typeof complexityLimits] ?? 0);
};

// Input validation schemas for API endpoints
export const CreateAnalysisRequestSchema = z.object({
  userId: z.string().uuid(),
  tier: AnalysisTierSchema,
  type: PromptTypeSchema,
  context: AnalysisContextSchema,
  originalPrompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  preferences: z.object({
    maxTokens: z.number().int().positive().optional(),
    prioritizeSpeed: z.boolean().optional(),
    includeScenarios: z.boolean().optional(),
    detailLevel: z.enum(['basic', 'detailed', 'comprehensive']).optional()
  }).optional()
});

export const UpdateAnalysisRequestSchema = z.object({
  context: AnalysisContextSchema.partial().optional(),
  prompt: z.string().min(10).optional(),
  preferences: z.object({
    maxTokens: z.number().int().positive().optional(),
    prioritizeSpeed: z.boolean().optional(),
    includeScenarios: z.boolean().optional(),
    detailLevel: z.enum(['basic', 'detailed', 'comprehensive']).optional()
  }).optional()
});

export const AnalysisQuerySchema = z.object({
  tier: AnalysisTierSchema.optional(),
  type: PromptTypeSchema.optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  confidenceMin: z.number().min(0).max(1).optional(),
  qualityMin: z.number().min(0).max(1).optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0)
});

// Export all schemas for use in API routes and components
export {
  AIAnalysisRequestSchema,
  AIAnalysisResponseSchema,
  CreateAnalysisRequestSchema,
  UpdateAnalysisRequestSchema,
  AnalysisQuerySchema
};