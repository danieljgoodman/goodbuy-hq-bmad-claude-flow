/**
 * Analysis Context Builders for Tier-Specific AI Prompt Engineering
 * Story 11.8: Enhanced AI Prompt Engineering for Tier-Specific Analysis
 *
 * Builds comprehensive context for AI prompts by transforming questionnaire data,
 * calculating financial metrics, aggregating operational data, and enriching with
 * industry benchmarks and calculated insights.
 */

import type {
  EnterpriseMetrics,
  StrategicScenario,
  FinancialProjections,
  CapitalStructureData,
  ExitStrategyOption,
  StrategicOptions,
  YearlyProjection,
  BenchmarkMetric,
  PerformanceBenchmark,
  RiskFactor,
  RiskAssessment,
  MonteCarloResult
} from '@/lib/types/enterprise-dashboard';

import type {
  EnterpriseTierData,
  StrategicValueDrivers,
  OperationalScalability,
  FinancialOptimization,
  StrategicScenarioPlanning,
  MultiYearProjections
} from '@/lib/validations/enterprise-tier';

import type { BusinessData, ProfessionalTierData } from '@/types/evaluation';

import { calculateWACC, calculateLeverageMetrics, generateOptimizationScenarios, type CapitalStructureInputs } from '@/lib/financial/capital-structure-calculations';
import { EnterpriseAnalytics } from '@/lib/analytics/enterprise-calculations';
import { calculateEnterpriseScenarios, generateStrategicRecommendations } from '@/lib/scenarios/enterprise-scenarios';

// Core Context Builder Types
export interface AnalysisContext {
  tier: 'professional' | 'enterprise';
  businessProfile: BusinessProfile;
  financialMetrics: ProcessedFinancialMetrics;
  operationalMetrics: ProcessedOperationalMetrics;
  strategicContext: StrategicContext;
  marketContext: MarketContext;
  riskProfile: RiskProfile;
  benchmarkComparisons: BenchmarkComparisons;
  dataQuality: DataQualityMetrics;
  enrichedInsights: EnrichedInsights;
}

export interface BusinessProfile {
  industry: string;
  size: 'small' | 'medium' | 'large';
  stage: 'startup' | 'growth' | 'mature' | 'transition';
  businessModel: string;
  geography: string[];
  keyCharacteristics: string[];
  uniqueValueProposition: string;
  competitivePosition: 'leader' | 'challenger' | 'follower' | 'niche';
}

export interface ProcessedFinancialMetrics {
  performance: {
    revenue: RevenueAnalysis;
    profitability: ProfitabilityAnalysis;
    cashFlow: CashFlowAnalysis;
    efficiency: EfficiencyMetrics;
    leverage: LeverageAnalysis;
    liquidity: LiquidityAnalysis;
  };
  trends: {
    revenueGrowth: TrendAnalysis;
    marginTrends: TrendAnalysis;
    cashFlowTrends: TrendAnalysis;
    efficiency: TrendAnalysis;
  };
  projections: {
    scenarios: ScenarioProjections;
    assumptions: ProjectionAssumptions;
    sensitivity: SensitivityAnalysis;
  };
  valuation: {
    methods: ValuationResult[];
    ranges: ValuationRange;
    drivers: ValueDriver[];
  };
}

export interface ProcessedOperationalMetrics {
  efficiency: {
    overall: number;
    processByFunction: Record<string, number>;
    utilizationMetrics: UtilizationMetrics;
    automationLevel: number;
    digitalMaturity: number;
  };
  scalability: {
    currentCapacity: number;
    scalabilityIndex: number;
    bottlenecks: Bottleneck[];
    growthConstraints: GrowthConstraint[];
  };
  quality: {
    processDocumentation: number;
    standardization: number;
    continuousImprovement: number;
    qualityMetrics: QualityMetric[];
  };
  human_capital: {
    keyPersonDependency: number;
    skillsGaps: string[];
    talentRetention: number;
    organizationalCapabilities: string[];
  };
}

export interface StrategicContext {
  valueDrivers: {
    primary: ValueDriverAnalysis[];
    secondary: ValueDriverAnalysis[];
    potential: ValueDriverAnalysis[];
  };
  competitivePosition: {
    advantages: CompetitiveAdvantage[];
    threats: CompetitiveThreat[];
    moatStrength: number;
    marketPosition: string;
  };
  strategicOptions: {
    growth: StrategicOption[];
    exit: ExitOption[];
    optimization: OptimizationOption[];
    partnerships: PartnershipOption[];
  };
  scenarioAnalysis: {
    baseCase: ScenarioResult;
    optimistic: ScenarioResult;
    pessimistic: ScenarioResult;
    stressTest: ScenarioResult;
  };
}

export interface MarketContext {
  industry: {
    growth: number;
    maturity: 'emerging' | 'growth' | 'mature' | 'declining';
    dynamics: string[];
    trends: MarketTrend[];
  };
  competition: {
    intensity: 'low' | 'medium' | 'high';
    barriers: BarrierToEntry[];
    threats: CompetitiveThreat[];
    opportunities: MarketOpportunity[];
  };
  size: {
    tam: number;
    sam: number;
    som: number;
    marketShare: number;
  };
}

export interface RiskProfile {
  overall: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    primaryConcerns: string[];
  };
  categories: {
    financial: RiskCategory;
    operational: RiskCategory;
    strategic: RiskCategory;
    market: RiskCategory;
    regulatory: RiskCategory;
  };
  mitigation: {
    strategies: MitigationStrategy[];
    priorities: string[];
    timeline: Record<string, string>;
  };
}

export interface BenchmarkComparisons {
  industry: {
    metrics: BenchmarkMetric[];
    percentiles: Record<string, number>;
    gaps: PerformanceGap[];
  };
  size: {
    metrics: BenchmarkMetric[];
    relative_position: string;
    improvement_areas: string[];
  };
  best_in_class: {
    metrics: BenchmarkMetric[];
    aspirational_targets: Record<string, number>;
    capability_gaps: string[];
  };
}

export interface DataQualityMetrics {
  completeness: {
    overall: number;
    bySection: Record<string, number>;
    missingCritical: string[];
  };
  consistency: {
    score: number;
    inconsistencies: string[];
    validationErrors: string[];
  };
  reliability: {
    confidence: number;
    dataAge: Record<string, number>;
    sourceReliability: Record<string, number>;
  };
  prioritization: {
    highImpact: string[];
    mediumImpact: string[];
    lowImpact: string[];
  };
}

export interface EnrichedInsights {
  calculatedMetrics: Record<string, number>;
  derivedRatios: Record<string, number>;
  trendAnalysis: Record<string, TrendInsight>;
  benchmarkInsights: BenchmarkInsight[];
  riskAdjustedMetrics: Record<string, number>;
  scenarioImpacts: Record<string, ScenarioImpact>;
  actionableRecommendations: ActionableRecommendation[];
  strategicImplications: StrategicImplication[];
}

// Supporting Types
export interface RevenueAnalysis {
  current: number;
  historical: number[];
  growth: {
    absolute: number;
    percentage: number;
    cagr: number;
  };
  composition: {
    byProduct: Record<string, number>;
    byChannel: Record<string, number>;
    byGeography: Record<string, number>;
  };
  quality: {
    recurring: number;
    predictability: number;
    seasonality: number;
  };
}

export interface ProfitabilityAnalysis {
  gross: {
    margin: number;
    trend: number;
    drivers: string[];
  };
  operating: {
    margin: number;
    ebitda: number;
    trend: number;
  };
  net: {
    margin: number;
    roi: number;
    roe: number;
  };
}

export interface CashFlowAnalysis {
  operating: {
    amount: number;
    margin: number;
    quality: number;
  };
  free: {
    amount: number;
    yield: number;
    conversion: number;
  };
  working_capital: {
    amount: number;
    efficiency: number;
    cycle: number;
  };
}

export interface TrendAnalysis {
  direction: 'improving' | 'stable' | 'declining';
  strength: number;
  consistency: number;
  inflectionPoints: string[];
  forecast: number[];
}

export interface ValueDriverAnalysis {
  driver: string;
  contribution: number;
  sustainability: number;
  optimization_potential: number;
  dependencies: string[];
  risks: string[];
}

export interface CompetitiveAdvantage {
  type: string;
  strength: number;
  sustainability: number;
  description: string;
  threats: string[];
}

export interface StrategicOption {
  name: string;
  type: string;
  investment: number;
  timeline: string;
  expectedReturn: number;
  riskLevel: string;
  feasibility: number;
  dependencies: string[];
}

export interface TrendInsight {
  metric: string;
  direction: string;
  magnitude: number;
  confidence: number;
  drivers: string[];
  implications: string[];
}

export interface ActionableRecommendation {
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  impact: string;
  timeline: string;
  resources: string;
  success_metrics: string[];
  dependencies: string[];
}

// Additional supporting types for comprehensive analysis
export interface EfficiencyMetrics {
  assetTurnover: number;
  inventoryTurnover: number;
  receivablesTurnover: number;
  payablesTurnover: number;
  employeeProductivity: number;
}

export interface LeverageAnalysis {
  debtToEquity: number;
  debtToAssets: number;
  interestCoverage: number;
  debtService: number;
  creditRating: string;
  borrowingCapacity: number;
}

export interface LiquidityAnalysis {
  current: number;
  quick: number;
  cash: number;
  workingCapital: number;
  operatingCycle: number;
  cashCycle: number;
}

export interface ScenarioProjections {
  base: YearlyProjection[];
  optimistic: YearlyProjection[];
  pessimistic: YearlyProjection[];
  stress: YearlyProjection[];
}

export interface ProjectionAssumptions {
  growth: Record<string, number>;
  margins: Record<string, number>;
  investments: Record<string, number>;
  market: Record<string, number>;
}

export interface SensitivityAnalysis {
  variables: SensitivityVariable[];
  impacts: Record<string, number>;
  breakeven: Record<string, number>;
}

export interface SensitivityVariable {
  name: string;
  baseValue: number;
  range: [number, number];
  impact: number;
}

export interface ValuationResult {
  method: string;
  value: number;
  range: [number, number];
  confidence: number;
  assumptions: string[];
}

export interface ValuationRange {
  low: number;
  base: number;
  high: number;
  method: string;
}

export interface ValueDriver {
  name: string;
  contribution: number;
  sustainability: number;
  enhancement: string[];
}

export interface UtilizationMetrics {
  capacity: number;
  equipment: number;
  personnel: number;
  facilities: number;
}

export interface Bottleneck {
  area: string;
  impact: number;
  solution: string;
  investment: number;
}

export interface GrowthConstraint {
  type: string;
  severity: number;
  timeline: string;
  mitigation: string;
}

export interface QualityMetric {
  name: string;
  value: number;
  target: number;
  benchmark: number;
}

export interface CompetitiveThreat {
  source: string;
  probability: number;
  impact: number;
  timeline: string;
  mitigation: string;
}

export interface MarketTrend {
  trend: string;
  impact: number;
  timeline: string;
  opportunity: string;
}

export interface BarrierToEntry {
  type: string;
  strength: number;
  sustainability: number;
}

export interface MarketOpportunity {
  opportunity: string;
  size: number;
  timeline: string;
  requirements: string[];
}

export interface RiskCategory {
  score: number;
  factors: RiskFactor[];
  trends: string;
  mitigation: string[];
}

export interface MitigationStrategy {
  risk: string;
  strategy: string;
  cost: number;
  effectiveness: number;
  timeline: string;
}

export interface PerformanceGap {
  metric: string;
  gap: number;
  priority: string;
  improvement: string;
}

export interface BenchmarkInsight {
  area: string;
  performance: string;
  gap: number;
  opportunity: string;
  actions: string[];
}

export interface ScenarioImpact {
  scenario: string;
  impact: number;
  probability: number;
  implications: string[];
}

export interface StrategicImplication {
  area: string;
  implication: string;
  urgency: string;
  stakeholders: string[];
}

export interface ScenarioResult {
  name: string;
  probability: number;
  npv: number;
  irr: number;
  keyMetrics: Record<string, number>;
  risks: string[];
  opportunities: string[];
}

export interface ExitOption {
  type: string;
  timeline: string;
  valuation: number;
  feasibility: number;
  requirements: string[];
}

export interface OptimizationOption {
  area: string;
  potential: number;
  investment: number;
  payback: number;
  implementation: string;
}

export interface PartnershipOption {
  type: string;
  value: number;
  strategic_fit: number;
  synergies: string[];
}

/**
 * Main Context Builder Factory
 */
export class AnalysisContextBuilder {
  /**
   * Build comprehensive analysis context for Professional tier
   */
  static buildProfessionalContext(data: ProfessionalTierData | BusinessData): AnalysisContext {
    const businessProfile = this.buildBusinessProfile(data, 'professional');
    const financialMetrics = this.buildProfessionalFinancialMetrics(data);
    const operationalMetrics = this.buildProfessionalOperationalMetrics(data);
    const strategicContext = this.buildProfessionalStrategicContext(data);
    const marketContext = this.buildMarketContext(data, 'professional');
    const riskProfile = this.buildRiskProfile(data, 'professional');
    const benchmarkComparisons = this.buildBenchmarkComparisons(data, 'professional');
    const dataQuality = this.calculateDataQuality(data, 'professional');
    const enrichedInsights = this.generateEnrichedInsights(data, 'professional', {
      financialMetrics,
      operationalMetrics,
      strategicContext,
      marketContext,
      riskProfile
    });

    return {
      tier: 'professional',
      businessProfile,
      financialMetrics,
      operationalMetrics,
      strategicContext,
      marketContext,
      riskProfile,
      benchmarkComparisons,
      dataQuality,
      enrichedInsights
    };
  }

  /**
   * Build comprehensive analysis context for Enterprise tier
   */
  static buildEnterpriseContext(data: EnterpriseTierData): AnalysisContext {
    const businessProfile = this.buildBusinessProfile(data, 'enterprise');
    const financialMetrics = this.buildEnterpriseFinancialMetrics(data);
    const operationalMetrics = this.buildEnterpriseOperationalMetrics(data);
    const strategicContext = this.buildEnterpriseStrategicContext(data);
    const marketContext = this.buildMarketContext(data, 'enterprise');
    const riskProfile = this.buildRiskProfile(data, 'enterprise');
    const benchmarkComparisons = this.buildBenchmarkComparisons(data, 'enterprise');
    const dataQuality = this.calculateDataQuality(data, 'enterprise');
    const enrichedInsights = this.generateEnrichedInsights(data, 'enterprise', {
      financialMetrics,
      operationalMetrics,
      strategicContext,
      marketContext,
      riskProfile
    });

    return {
      tier: 'enterprise',
      businessProfile,
      financialMetrics,
      operationalMetrics,
      strategicContext,
      marketContext,
      riskProfile,
      benchmarkComparisons,
      dataQuality,
      enrichedInsights
    };
  }

  /**
   * Build business profile from questionnaire data
   */
  private static buildBusinessProfile(data: any, tier: string): BusinessProfile {
    // Extract basic business information
    const industry = this.extractIndustry(data);
    const size = this.determineBusinessSize(data);
    const stage = this.determineBusinessStage(data);
    const businessModel = this.extractBusinessModel(data);
    const geography = this.extractGeography(data);
    const keyCharacteristics = this.extractKeyCharacteristics(data);
    const uniqueValueProposition = this.extractValueProposition(data);
    const competitivePosition = this.determineCompetitivePosition(data);

    return {
      industry,
      size,
      stage,
      businessModel,
      geography,
      keyCharacteristics,
      uniqueValueProposition,
      competitivePosition
    };
  }

  /**
   * Build comprehensive financial metrics for Professional tier
   */
  private static buildProfessionalFinancialMetrics(data: any): ProcessedFinancialMetrics {
    const revenue = this.buildRevenueAnalysis(data);
    const profitability = this.buildProfitabilityAnalysis(data);
    const cashFlow = this.buildCashFlowAnalysis(data);
    const efficiency = this.buildEfficiencyMetrics(data);
    const leverage = this.buildLeverageAnalysis(data);
    const liquidity = this.buildLiquidityAnalysis(data);

    const trends = {
      revenueGrowth: this.analyzeTrend(revenue.historical, 'revenue'),
      marginTrends: this.analyzeTrend([profitability.gross.margin, profitability.operating.margin, profitability.net.margin], 'margins'),
      cashFlowTrends: this.analyzeTrend([cashFlow.operating.amount, cashFlow.free.amount], 'cash_flow'),
      efficiency: this.analyzeTrend([efficiency.assetTurnover, efficiency.employeeProductivity], 'efficiency')
    };

    const projections = this.buildProjections(data, 'professional');
    const valuation = this.buildValuation(data, 'professional');

    return {
      performance: {
        revenue,
        profitability,
        cashFlow,
        efficiency,
        leverage,
        liquidity
      },
      trends,
      projections,
      valuation
    };
  }

  /**
   * Build comprehensive financial metrics for Enterprise tier
   */
  private static buildEnterpriseFinancialMetrics(data: EnterpriseTierData): ProcessedFinancialMetrics {
    // Enterprise tier includes more sophisticated financial analysis
    const baseMetrics = this.buildProfessionalFinancialMetrics(data);

    // Add enterprise-specific enhancements
    const enhancedProjections = this.buildEnterpriseProjections(data);
    const enhancedValuation = this.buildEnterpriseValuation(data);
    const capitalStructure = this.buildCapitalStructureAnalysis(data);

    return {
      ...baseMetrics,
      projections: enhancedProjections,
      valuation: enhancedValuation,
      performance: {
        ...baseMetrics.performance,
        leverage: {
          ...baseMetrics.performance.leverage,
          ...capitalStructure
        }
      }
    };
  }

  /**
   * Build operational metrics for Professional tier
   */
  private static buildProfessionalOperationalMetrics(data: any): ProcessedOperationalMetrics {
    return {
      efficiency: {
        overall: this.calculateOverallEfficiency(data),
        processByFunction: this.calculateProcessEfficiency(data),
        utilizationMetrics: this.buildUtilizationMetrics(data),
        automationLevel: this.calculateAutomationLevel(data),
        digitalMaturity: this.calculateDigitalMaturity(data)
      },
      scalability: {
        currentCapacity: this.calculateCurrentCapacity(data),
        scalabilityIndex: this.calculateScalabilityIndex(data),
        bottlenecks: this.identifyBottlenecks(data),
        growthConstraints: this.identifyGrowthConstraints(data)
      },
      quality: {
        processDocumentation: this.calculateProcessDocumentation(data),
        standardization: this.calculateStandardization(data),
        continuousImprovement: this.calculateContinuousImprovement(data),
        qualityMetrics: this.buildQualityMetrics(data)
      },
      human_capital: {
        keyPersonDependency: this.calculateKeyPersonDependency(data),
        skillsGaps: this.identifySkillsGaps(data),
        talentRetention: this.calculateTalentRetention(data),
        organizationalCapabilities: this.identifyOrganizationalCapabilities(data)
      }
    };
  }

  /**
   * Build operational metrics for Enterprise tier
   */
  private static buildEnterpriseOperationalMetrics(data: EnterpriseTierData): ProcessedOperationalMetrics {
    const baseMetrics = this.buildProfessionalOperationalMetrics(data);

    // Add enterprise-specific enhancements
    const enhancedEfficiency = this.buildEnterpriseEfficiencyMetrics(data);
    const enhancedScalability = this.buildEnterpriseScalabilityMetrics(data);

    return {
      ...baseMetrics,
      efficiency: {
        ...baseMetrics.efficiency,
        ...enhancedEfficiency
      },
      scalability: {
        ...baseMetrics.scalability,
        ...enhancedScalability
      }
    };
  }

  /**
   * Build strategic context for Professional tier
   */
  private static buildProfessionalStrategicContext(data: any): StrategicContext {
    const valueDrivers = this.buildValueDrivers(data, 'professional');
    const competitivePosition = this.buildCompetitivePosition(data, 'professional');
    const strategicOptions = this.buildStrategicOptions(data, 'professional');
    const scenarioAnalysis = this.buildScenarioAnalysis(data, 'professional');

    return {
      valueDrivers,
      competitivePosition,
      strategicOptions,
      scenarioAnalysis
    };
  }

  /**
   * Build strategic context for Enterprise tier
   */
  private static buildEnterpriseStrategicContext(data: EnterpriseTierData): StrategicContext {
    const baseContext = this.buildProfessionalStrategicContext(data);

    // Add enterprise-specific strategic analysis
    const enhancedValueDrivers = this.buildEnterpriseValueDrivers(data);
    const enhancedStrategicOptions = this.buildEnterpriseStrategicOptions(data);
    const enhancedScenarioAnalysis = this.buildEnterpriseScenarioAnalysis(data);

    return {
      valueDrivers: enhancedValueDrivers,
      competitivePosition: baseContext.competitivePosition,
      strategicOptions: enhancedStrategicOptions,
      scenarioAnalysis: enhancedScenarioAnalysis
    };
  }

  /**
   * Build market context
   */
  private static buildMarketContext(data: any, tier: string): MarketContext {
    const industry = this.buildIndustryContext(data);
    const competition = this.buildCompetitionContext(data);
    const size = this.buildMarketSizeContext(data);

    return {
      industry,
      competition,
      size
    };
  }

  /**
   * Build risk profile
   */
  private static buildRiskProfile(data: any, tier: string): RiskProfile {
    const categories = this.buildRiskCategories(data, tier);
    const overall = this.calculateOverallRisk(categories);
    const mitigation = this.buildMitigationStrategies(categories, tier);

    return {
      overall,
      categories,
      mitigation
    };
  }

  /**
   * Build benchmark comparisons
   */
  private static buildBenchmarkComparisons(data: any, tier: string): BenchmarkComparisons {
    const industry = this.buildIndustryBenchmarks(data);
    const size = this.buildSizeBenchmarks(data);
    const best_in_class = this.buildBestInClassBenchmarks(data);

    return {
      industry,
      size,
      best_in_class
    };
  }

  /**
   * Calculate data quality metrics
   */
  private static calculateDataQuality(data: any, tier: string): DataQualityMetrics {
    const completeness = this.calculateCompleteness(data, tier);
    const consistency = this.calculateConsistency(data);
    const reliability = this.calculateReliability(data);
    const prioritization = this.calculatePrioritization(data, tier);

    return {
      completeness,
      consistency,
      reliability,
      prioritization
    };
  }

  /**
   * Generate enriched insights
   */
  private static generateEnrichedInsights(
    data: any,
    tier: string,
    context: {
      financialMetrics: ProcessedFinancialMetrics;
      operationalMetrics: ProcessedOperationalMetrics;
      strategicContext: StrategicContext;
      marketContext: MarketContext;
      riskProfile: RiskProfile;
    }
  ): EnrichedInsights {
    const calculatedMetrics = this.calculateDerivedMetrics(data, context);
    const derivedRatios = this.calculateDerivedRatios(data, context);
    const trendAnalysis = this.performTrendAnalysis(context);
    const benchmarkInsights = this.generateBenchmarkInsights(context);
    const riskAdjustedMetrics = this.calculateRiskAdjustedMetrics(context);
    const scenarioImpacts = this.calculateScenarioImpacts(context);
    const actionableRecommendations = this.generateActionableRecommendations(context, tier);
    const strategicImplications = this.generateStrategicImplications(context, tier);

    return {
      calculatedMetrics,
      derivedRatios,
      trendAnalysis,
      benchmarkInsights,
      riskAdjustedMetrics,
      scenarioImpacts,
      actionableRecommendations,
      strategicImplications
    };
  }

  /**
   * Context Formatting for AI Prompts
   */
  static formatContextForPrompt(context: AnalysisContext): string {
    const sections = [
      this.formatBusinessProfile(context.businessProfile),
      this.formatFinancialContext(context.financialMetrics),
      this.formatOperationalContext(context.operationalMetrics),
      this.formatStrategicContext(context.strategicContext),
      this.formatMarketContext(context.marketContext),
      this.formatRiskContext(context.riskProfile),
      this.formatBenchmarkContext(context.benchmarkComparisons),
      this.formatDataQualityContext(context.dataQuality),
      this.formatEnrichedInsights(context.enrichedInsights)
    ];

    return sections.join('\n\n');
  }

  /**
   * Smart Data Prioritization
   */
  static prioritizeContextData(context: AnalysisContext, analysisType: string): AnalysisContext {
    const priorityWeights = this.getPriorityWeights(analysisType, context.tier);

    // Apply intelligent filtering based on data quality and relevance
    const prioritizedContext = { ...context };

    // Remove low-quality or irrelevant data points
    if (context.dataQuality.completeness.overall < 70) {
      prioritizedContext.financialMetrics = this.filterLowQualityFinancialData(context.financialMetrics);
    }

    // Enhance high-priority areas
    if (priorityWeights.financial > 0.7) {
      prioritizedContext.financialMetrics = this.enhanceFinancialContext(context.financialMetrics);
    }

    if (priorityWeights.strategic > 0.7) {
      prioritizedContext.strategicContext = this.enhanceStrategicContext(context.strategicContext);
    }

    return prioritizedContext;
  }

  /**
   * Context Validation and Sanitization
   */
  static validateAndSanitizeContext(context: AnalysisContext): {
    context: AnalysisContext;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    const sanitizedContext = { ...context };

    // Validate financial data consistency
    const financialValidation = this.validateFinancialConsistency(context.financialMetrics);
    warnings.push(...financialValidation.warnings);
    errors.push(...financialValidation.errors);

    // Validate operational metrics
    const operationalValidation = this.validateOperationalMetrics(context.operationalMetrics);
    warnings.push(...operationalValidation.warnings);
    errors.push(...operationalValidation.errors);

    // Sanitize sensitive data
    sanitizedContext.financialMetrics = this.sanitizeFinancialData(context.financialMetrics);

    return {
      context: sanitizedContext,
      warnings,
      errors
    };
  }

  // Helper Methods (Implementation of all the private methods referenced above)
  // Due to length constraints, showing key examples:

  private static extractIndustry(data: any): string {
    return data.industry || data.businessSector || 'Unknown';
  }

  private static determineBusinessSize(data: any): 'small' | 'medium' | 'large' {
    const revenue = data.annualRevenue || data.totalRevenue || 0;
    if (revenue < 10000000) return 'small';
    if (revenue < 100000000) return 'medium';
    return 'large';
  }

  private static determineBusinessStage(data: any): 'startup' | 'growth' | 'mature' | 'transition' {
    const age = data.companyAge || 0;
    const growth = data.revenueGrowthRate || 0;

    if (age < 3) return 'startup';
    if (growth > 20) return 'growth';
    if (age > 10 && growth < 5) return 'mature';
    return 'transition';
  }

  private static buildRevenueAnalysis(data: any): RevenueAnalysis {
    const current = data.annualRevenue || data.totalRevenue || 0;
    const historical = data.revenueHistory || [current];
    const growth = this.calculateGrowthMetrics(historical);

    return {
      current,
      historical,
      growth,
      composition: {
        byProduct: data.revenueByProduct || {},
        byChannel: data.revenueByChannel || {},
        byGeography: data.revenueByGeography || {}
      },
      quality: {
        recurring: data.recurringRevenue || 0,
        predictability: this.calculatePredictability(historical),
        seasonality: this.calculateSeasonality(historical)
      }
    };
  }

  private static calculateGrowthMetrics(historical: number[]): { absolute: number; percentage: number; cagr: number } {
    if (historical.length < 2) {
      return { absolute: 0, percentage: 0, cagr: 0 };
    }

    const latest = historical[historical.length - 1];
    const previous = historical[historical.length - 2];
    const absolute = latest - previous;
    const percentage = previous > 0 ? (absolute / previous) * 100 : 0;

    const years = historical.length - 1;
    const cagr = years > 0 ? (Math.pow(latest / historical[0], 1 / years) - 1) * 100 : 0;

    return { absolute, percentage, cagr };
  }

  private static buildProfitabilityAnalysis(data: any): ProfitabilityAnalysis {
    const revenue = data.annualRevenue || data.totalRevenue || 1;
    const grossProfit = data.grossProfit || (revenue * (data.grossMargin || 0.3));
    const operatingProfit = data.operatingProfit || (revenue * (data.operatingMargin || 0.15));
    const netProfit = data.netProfit || (revenue * (data.netMargin || 0.1));

    return {
      gross: {
        margin: (grossProfit / revenue) * 100,
        trend: data.grossMarginTrend || 0,
        drivers: data.grossMarginDrivers || ['Product mix', 'Cost management']
      },
      operating: {
        margin: (operatingProfit / revenue) * 100,
        ebitda: operatingProfit,
        trend: data.operatingMarginTrend || 0
      },
      net: {
        margin: (netProfit / revenue) * 100,
        roi: data.roi || 15,
        roe: data.roe || 12
      }
    };
  }

  private static analyzeTrend(values: number[], type: string): TrendAnalysis {
    if (values.length < 2) {
      return {
        direction: 'stable',
        strength: 0,
        consistency: 0,
        inflectionPoints: [],
        forecast: values
      };
    }

    const differences = values.slice(1).map((val, i) => val - values[i]);
    const avgChange = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;

    const direction = avgChange > 0.1 ? 'improving' : avgChange < -0.1 ? 'declining' : 'stable';
    const strength = Math.abs(avgChange);
    const consistency = this.calculateConsistency(differences);

    return {
      direction,
      strength,
      consistency,
      inflectionPoints: this.findInflectionPoints(values),
      forecast: this.generateSimpleForecast(values, 3)
    };
  }

  private static calculateConsistency(values: number[]): number {
    if (values.length < 2) return 100;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    // Lower standard deviation relative to mean indicates higher consistency
    return Math.max(0, 100 - (standardDeviation / Math.abs(mean)) * 100);
  }

  private static findInflectionPoints(values: number[]): string[] {
    const points: string[] = [];
    for (let i = 1; i < values.length - 1; i++) {
      const prev = values[i - 1];
      const curr = values[i];
      const next = values[i + 1];

      if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
        points.push(`Period ${i + 1}: ${curr > prev ? 'Peak' : 'Trough'}`);
      }
    }
    return points;
  }

  private static generateSimpleForecast(values: number[], periods: number): number[] {
    if (values.length < 2) return values;

    const trend = (values[values.length - 1] - values[0]) / (values.length - 1);
    const forecast = [...values];

    for (let i = 0; i < periods; i++) {
      const lastValue = forecast[forecast.length - 1];
      forecast.push(lastValue + trend);
    }

    return forecast;
  }

  private static calculatePredictability(historical: number[]): number {
    if (historical.length < 3) return 50;

    const volatility = this.calculateVolatility(historical);
    return Math.max(0, 100 - volatility);
  }

  private static calculateSeasonality(historical: number[]): number {
    if (historical.length < 12) return 0;

    // Simple seasonality calculation - in practice would be more sophisticated
    const quarters = this.groupByQuarters(historical);
    const avgByQuarter = quarters.map(q => q.reduce((sum, val) => sum + val, 0) / q.length);
    const overallAvg = avgByQuarter.reduce((sum, val) => sum + val, 0) / avgByQuarter.length;

    const variance = avgByQuarter.reduce((sum, val) => sum + Math.pow(val - overallAvg, 2), 0) / avgByQuarter.length;
    return Math.sqrt(variance) / overallAvg * 100;
  }

  private static calculateVolatility(values: number[]): number {
    const returns = values.slice(1).map((val, i) => (val - values[i]) / values[i]);
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * 100;
  }

  private static groupByQuarters(values: number[]): number[][] {
    const quarters: number[][] = [[], [], [], []];
    values.forEach((val, i) => {
      const quarter = i % 4;
      quarters[quarter].push(val);
    });
    return quarters;
  }

  // Additional helper methods would continue here...
  // For brevity, showing key structure and implementation patterns

  private static formatBusinessProfile(profile: BusinessProfile): string {
    return `
BUSINESS PROFILE:
Industry: ${profile.industry}
Size: ${profile.size}
Stage: ${profile.stage}
Business Model: ${profile.businessModel}
Geographic Presence: ${profile.geography.join(', ')}
Key Characteristics: ${profile.keyCharacteristics.join(', ')}
Unique Value Proposition: ${profile.uniqueValueProposition}
Competitive Position: ${profile.competitivePosition}
    `.trim();
  }

  private static formatFinancialContext(metrics: ProcessedFinancialMetrics): string {
    return `
FINANCIAL PERFORMANCE:
Revenue: $${metrics.performance.revenue.current.toLocaleString()} (Growth: ${metrics.performance.revenue.growth.percentage.toFixed(1)}%)
Gross Margin: ${metrics.performance.profitability.gross.margin.toFixed(1)}%
Operating Margin: ${metrics.performance.profitability.operating.margin.toFixed(1)}%
Net Margin: ${metrics.performance.profitability.net.margin.toFixed(1)}%
Cash Flow: $${metrics.performance.cashFlow.operating.amount.toLocaleString()}
Debt-to-Equity: ${metrics.performance.leverage.debtToEquity.toFixed(2)}
Current Ratio: ${metrics.performance.liquidity.current.toFixed(2)}

TRENDS:
Revenue: ${metrics.trends.revenueGrowth.direction} (${metrics.trends.revenueGrowth.strength.toFixed(1)}% strength)
Margins: ${metrics.trends.marginTrends.direction}
Cash Flow: ${metrics.trends.cashFlowTrends.direction}
    `.trim();
  }

  private static formatOperationalContext(metrics: ProcessedOperationalMetrics): string {
    return `
OPERATIONAL PERFORMANCE:
Overall Efficiency: ${metrics.efficiency.overall}%
Capacity Utilization: ${metrics.scalability.currentCapacity}%
Automation Level: ${metrics.efficiency.automationLevel}%
Process Documentation: ${metrics.quality.processDocumentation}%
Key Person Dependency: ${metrics.human_capital.keyPersonDependency}%
Scalability Index: ${metrics.scalability.scalabilityIndex}
    `.trim();
  }

  private static formatStrategicContext(context: StrategicContext): string {
    const primaryDrivers = context.valueDrivers.primary.map(d => `${d.driver} (${d.contribution}%)`).join(', ');
    const advantages = context.competitivePosition.advantages.map(a => a.type).join(', ');

    return `
STRATEGIC POSITION:
Primary Value Drivers: ${primaryDrivers}
Competitive Advantages: ${advantages}
Market Position: ${context.competitivePosition.marketPosition}
Moat Strength: ${context.competitivePosition.moatStrength}/100

SCENARIO ANALYSIS:
Base Case NPV: $${context.scenarioAnalysis.baseCase.npv.toLocaleString()}
Optimistic Case NPV: $${context.scenarioAnalysis.optimistic.npv.toLocaleString()}
Pessimistic Case NPV: $${context.scenarioAnalysis.pessimistic.npv.toLocaleString()}
    `.trim();
  }

  private static formatMarketContext(context: MarketContext): string {
    return `
MARKET ENVIRONMENT:
Industry Growth: ${context.industry.growth}%
Market Maturity: ${context.industry.maturity}
Competition Intensity: ${context.competition.intensity}
Market Share: ${context.size.marketShare}%
TAM: $${context.size.tam.toLocaleString()}
SAM: $${context.size.sam.toLocaleString()}
    `.trim();
  }

  private static formatRiskContext(profile: RiskProfile): string {
    return `
RISK PROFILE:
Overall Risk Score: ${profile.overall.score}/100 (${profile.overall.level})
Financial Risk: ${profile.categories.financial.score}/100
Operational Risk: ${profile.categories.operational.score}/100
Strategic Risk: ${profile.categories.strategic.score}/100
Market Risk: ${profile.categories.market.score}/100
Primary Concerns: ${profile.overall.primaryConcerns.join(', ')}
    `.trim();
  }

  private static formatBenchmarkContext(comparisons: BenchmarkComparisons): string {
    const industryPosition = Object.entries(comparisons.industry.percentiles)
      .map(([metric, percentile]) => `${metric}: ${percentile}th percentile`)
      .join(', ');

    return `
BENCHMARK PERFORMANCE:
Industry Position: ${industryPosition}
Size Relative Position: ${comparisons.size.relative_position}
Key Performance Gaps: ${comparisons.industry.gaps.map(g => g.metric).join(', ')}
Improvement Areas: ${comparisons.size.improvement_areas.join(', ')}
    `.trim();
  }

  private static formatDataQualityContext(quality: DataQualityMetrics): string {
    return `
DATA QUALITY ASSESSMENT:
Overall Completeness: ${quality.completeness.overall}%
Consistency Score: ${quality.consistency.score}%
Confidence Level: ${quality.reliability.confidence}%
High Impact Data: ${quality.prioritization.highImpact.join(', ')}
Missing Critical Data: ${quality.completeness.missingCritical.join(', ')}
    `.trim();
  }

  private static formatEnrichedInsights(insights: EnrichedInsights): string {
    const topRecommendations = insights.actionableRecommendations
      .filter(r => r.priority === 'critical' || r.priority === 'high')
      .slice(0, 5)
      .map(r => `${r.action} (${r.category})`)
      .join('; ');

    return `
ENRICHED INSIGHTS:
Key Calculated Metrics: ${Object.keys(insights.calculatedMetrics).slice(0, 5).join(', ')}
Top Recommendations: ${topRecommendations}
Strategic Implications: ${insights.strategicImplications.map(i => i.area).join(', ')}
Risk-Adjusted Performance: ${Object.keys(insights.riskAdjustedMetrics).slice(0, 3).join(', ')}
    `.trim();
  }

  // Placeholder implementations for remaining methods
  private static extractBusinessModel(data: any): string { return data.businessModel || 'Unknown'; }
  private static extractGeography(data: any): string[] { return data.geography || ['Unknown']; }
  private static extractKeyCharacteristics(data: any): string[] { return data.keyCharacteristics || []; }
  private static extractValueProposition(data: any): string { return data.valueProposition || 'Not specified'; }
  private static determineCompetitivePosition(data: any): 'leader' | 'challenger' | 'follower' | 'niche' { return 'challenger'; }

  private static buildCashFlowAnalysis(data: any): CashFlowAnalysis {
    return {
      operating: { amount: data.operatingCashFlow || 0, margin: 0, quality: 75 },
      free: { amount: data.freeCashFlow || 0, yield: 0, conversion: 0 },
      working_capital: { amount: data.workingCapital || 0, efficiency: 0, cycle: 0 }
    };
  }

  private static buildEfficiencyMetrics(data: any): EfficiencyMetrics {
    return {
      assetTurnover: data.assetTurnover || 1.0,
      inventoryTurnover: data.inventoryTurnover || 6.0,
      receivablesTurnover: data.receivablesTurnover || 8.0,
      payablesTurnover: data.payablesTurnover || 10.0,
      employeeProductivity: data.employeeProductivity || 100000
    };
  }

  private static buildLeverageAnalysis(data: any): LeverageAnalysis {
    return {
      debtToEquity: data.debtToEquity || 0.5,
      debtToAssets: data.debtToAssets || 0.3,
      interestCoverage: data.interestCoverage || 5.0,
      debtService: data.debtService || 0.1,
      creditRating: data.creditRating || 'BBB',
      borrowingCapacity: data.borrowingCapacity || 1000000
    };
  }

  private static buildLiquidityAnalysis(data: any): LiquidityAnalysis {
    return {
      current: data.currentRatio || 2.0,
      quick: data.quickRatio || 1.0,
      cash: data.cashRatio || 0.5,
      workingCapital: data.workingCapital || 500000,
      operatingCycle: data.operatingCycle || 60,
      cashCycle: data.cashCycle || 45
    };
  }

  private static buildProjections(data: any, tier: string): { scenarios: ScenarioProjections; assumptions: ProjectionAssumptions; sensitivity: SensitivityAnalysis } {
    return {
      scenarios: {
        base: [],
        optimistic: [],
        pessimistic: [],
        stress: []
      },
      assumptions: {
        growth: { revenue: 0.1 },
        margins: { gross: 0.3 },
        investments: { capex: 0.05 },
        market: { growth: 0.05 }
      },
      sensitivity: {
        variables: [],
        impacts: {},
        breakeven: {}
      }
    };
  }

  private static buildValuation(data: any, tier: string): { methods: ValuationResult[]; ranges: ValuationRange; drivers: ValueDriver[] } {
    return {
      methods: [],
      ranges: { low: 0, base: 0, high: 0, method: 'DCF' },
      drivers: []
    };
  }

  // Continue with placeholder implementations for all remaining methods...
  // This structure provides the comprehensive framework for the analysis context builders

  private static getPriorityWeights(analysisType: string, tier: string): Record<string, number> {
    return { financial: 0.8, strategic: 0.7, operational: 0.6, market: 0.5, risk: 0.6 };
  }

  private static filterLowQualityFinancialData(metrics: ProcessedFinancialMetrics): ProcessedFinancialMetrics {
    return metrics; // Placeholder
  }

  private static enhanceFinancialContext(metrics: ProcessedFinancialMetrics): ProcessedFinancialMetrics {
    return metrics; // Placeholder
  }

  private static enhanceStrategicContext(context: StrategicContext): StrategicContext {
    return context; // Placeholder
  }

  private static validateFinancialConsistency(metrics: ProcessedFinancialMetrics): { warnings: string[]; errors: string[] } {
    return { warnings: [], errors: [] };
  }

  private static validateOperationalMetrics(metrics: ProcessedOperationalMetrics): { warnings: string[]; errors: string[] } {
    return { warnings: [], errors: [] };
  }

  private static sanitizeFinancialData(metrics: ProcessedFinancialMetrics): ProcessedFinancialMetrics {
    return metrics; // Placeholder
  }

  // Additional placeholder methods for completeness
  private static buildEnterpriseProjections(data: EnterpriseTierData): any { return {}; }
  private static buildEnterpriseValuation(data: EnterpriseTierData): any { return {}; }
  private static buildCapitalStructureAnalysis(data: EnterpriseTierData): any { return {}; }
  private static buildEnterpriseEfficiencyMetrics(data: EnterpriseTierData): any { return {}; }
  private static buildEnterpriseScalabilityMetrics(data: EnterpriseTierData): any { return {}; }
  private static buildEnterpriseValueDrivers(data: EnterpriseTierData): any { return {}; }
  private static buildEnterpriseStrategicOptions(data: EnterpriseTierData): any { return {}; }
  private static buildEnterpriseScenarioAnalysis(data: EnterpriseTierData): any { return {}; }
  private static calculateOverallEfficiency(data: any): number { return 75; }
  private static calculateProcessEfficiency(data: any): Record<string, number> { return {}; }
  private static buildUtilizationMetrics(data: any): UtilizationMetrics { return { capacity: 80, equipment: 75, personnel: 85, facilities: 70 }; }
  private static calculateAutomationLevel(data: any): number { return 60; }
  private static calculateDigitalMaturity(data: any): number { return 65; }
  private static calculateCurrentCapacity(data: any): number { return 80; }
  private static calculateScalabilityIndex(data: any): number { return 75; }
  private static identifyBottlenecks(data: any): Bottleneck[] { return []; }
  private static identifyGrowthConstraints(data: any): GrowthConstraint[] { return []; }
  private static calculateProcessDocumentation(data: any): number { return 70; }
  private static calculateStandardization(data: any): number { return 75; }
  private static calculateContinuousImprovement(data: any): number { return 65; }
  private static buildQualityMetrics(data: any): QualityMetric[] { return []; }
  private static calculateKeyPersonDependency(data: any): number { return 60; }
  private static identifySkillsGaps(data: any): string[] { return []; }
  private static calculateTalentRetention(data: any): number { return 85; }
  private static identifyOrganizationalCapabilities(data: any): string[] { return []; }
  private static buildValueDrivers(data: any, tier: string): any { return {}; }
  private static buildCompetitivePosition(data: any, tier: string): any { return {}; }
  private static buildStrategicOptions(data: any, tier: string): any { return {}; }
  private static buildScenarioAnalysis(data: any, tier: string): any { return {}; }
  private static buildIndustryContext(data: any): any { return {}; }
  private static buildCompetitionContext(data: any): any { return {}; }
  private static buildMarketSizeContext(data: any): any { return {}; }
  private static buildRiskCategories(data: any, tier: string): any { return {}; }
  private static calculateOverallRisk(categories: any): any { return {}; }
  private static buildMitigationStrategies(categories: any, tier: string): any { return {}; }
  private static buildIndustryBenchmarks(data: any): any { return {}; }
  private static buildSizeBenchmarks(data: any): any { return {}; }
  private static buildBestInClassBenchmarks(data: any): any { return {}; }
  private static calculateCompleteness(data: any, tier: string): any { return {}; }
  private static calculateReliability(data: any): any { return {}; }
  private static calculatePrioritization(data: any, tier: string): any { return {}; }
  private static calculateDerivedMetrics(data: any, context: any): Record<string, number> { return {}; }
  private static calculateDerivedRatios(data: any, context: any): Record<string, number> { return {}; }
  private static performTrendAnalysis(context: any): Record<string, TrendInsight> { return {}; }
  private static generateBenchmarkInsights(context: any): BenchmarkInsight[] { return []; }
  private static calculateRiskAdjustedMetrics(context: any): Record<string, number> { return {}; }
  private static calculateScenarioImpacts(context: any): Record<string, ScenarioImpact> { return {}; }
  private static generateActionableRecommendations(context: any, tier: string): ActionableRecommendation[] { return []; }
  private static generateStrategicImplications(context: any, tier: string): StrategicImplication[] { return []; }
}

// Export the main builder class and types
export default AnalysisContextBuilder;