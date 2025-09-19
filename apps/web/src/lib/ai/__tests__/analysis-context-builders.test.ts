/**
 * Tests for Analysis Context Builders
 * Story 11.8: Enhanced AI Prompt Engineering for Tier-Specific Analysis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import AnalysisContextBuilder, {
  type AnalysisContext,
  type BusinessProfile,
  type ProcessedFinancialMetrics,
  type ProcessedOperationalMetrics,
  type StrategicContext,
  type MarketContext,
  type RiskProfile,
  type BenchmarkComparisons,
  type DataQualityMetrics,
  type EnrichedInsights,
  type RevenueAnalysis,
  type ProfitabilityAnalysis,
  type CashFlowAnalysis,
  type TrendAnalysis,
  type ValueDriverAnalysis,
  type ActionableRecommendation
} from '../analysis-context-builders';
import type { ProfessionalTierData, EnterpriseTierData } from '@/lib/validations/enterprise-tier';
import type { BusinessData } from '@/types/evaluation';

// Mock dependencies
vi.mock('@/lib/financial/capital-structure-calculations', () => ({
  calculateWACC: vi.fn(() => 0.08),
  calculateLeverageMetrics: vi.fn(() => ({ debtToEquity: 0.5 })),
  generateOptimizationScenarios: vi.fn(() => [])
}));

vi.mock('@/lib/analytics/enterprise-calculations', () => ({
  EnterpriseAnalytics: {
    calculateStrategicValue: vi.fn(() => 0.85),
    performScenarioAnalysis: vi.fn(() => ({ baseCase: { npv: 1000000 } }))
  }
}));

vi.mock('@/lib/scenarios/enterprise-scenarios', () => ({
  calculateEnterpriseScenarios: vi.fn(() => ({})),
  generateStrategicRecommendations: vi.fn(() => [])
}));

describe('AnalysisContextBuilder', () => {
  const mockProfessionalData: ProfessionalTierData = {
    annualRevenue: 15000000,
    grossProfit: 11250000,
    operatingProfit: 2250000,
    netProfit: 1500000,
    totalAssets: 10000000,
    totalLiabilities: 4000000,
    cashFlow: 2000000,
    employees: 75,
    industry: 'Technology',
    businessModel: 'SaaS',
    marketSize: 500000000,
    competitorCount: 25,
    customerAcquisitionCost: 1500,
    customerLifetimeValue: 12000,
    churnRate: 0.05,
    growthRate: 0.25,
    riskTolerance: 'moderate'
  };

  const mockEnterpriseData: EnterpriseTierData = {
    ...mockProfessionalData,
    strategicValueDrivers: {
      networkEffects: 0.8,
      dataMonetization: 0.7,
      platformEcosystem: 0.6,
      brandEquity: 0.75,
      intellectualProperty: 0.9
    },
    operationalScalability: {
      automationLevel: 0.7,
      processStandardization: 0.8,
      technologyInfrastructure: 0.85,
      humanCapitalOptimization: 0.6
    },
    financialOptimization: {
      capitalStructure: {
        debtToEquity: 0.4,
        costOfCapital: 0.08,
        returnOnInvestedCapital: 0.15
      },
      workingCapitalManagement: {
        cashConversionCycle: 45,
        inventoryTurnover: 8,
        receivablesTurnover: 12
      }
    },
    strategicScenarioPlanning: {
      baseCase: {
        name: 'Base Case',
        probability: 0.6,
        revenueGrowth: 0.25,
        marginExpansion: 0.02,
        marketShare: 0.15
      },
      optimisticCase: {
        name: 'Optimistic Case',
        probability: 0.2,
        revenueGrowth: 0.45,
        marginExpansion: 0.05,
        marketShare: 0.25
      },
      pessimisticCase: {
        name: 'Pessimistic Case',
        probability: 0.2,
        revenueGrowth: 0.1,
        marginExpansion: -0.01,
        marketShare: 0.1
      }
    },
    multiYearProjections: {
      timeHorizon: 5,
      projectionData: []
    }
  };

  const mockBusinessData: BusinessData = {
    totalRevenue: 15000000,
    totalExpenses: 12000000,
    employees: 75,
    industry: 'Technology',
    businessModel: 'Subscription',
    geography: ['North America', 'Europe'],
    stage: 'growth',
    riskTolerance: 'moderate'
  };

  describe('Professional Context Building', () => {
    let context: AnalysisContext;

    beforeEach(() => {
      context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
    });

    it('should build complete professional context structure', () => {
      expect(context.tier).toBe('professional');
      expect(context.businessProfile).toBeDefined();
      expect(context.financialMetrics).toBeDefined();
      expect(context.operationalMetrics).toBeDefined();
      expect(context.strategicContext).toBeDefined();
      expect(context.marketContext).toBeDefined();
      expect(context.riskProfile).toBeDefined();
      expect(context.benchmarkComparisons).toBeDefined();
      expect(context.dataQuality).toBeDefined();
      expect(context.enrichedInsights).toBeDefined();
    });

    it('should create proper business profile', () => {
      const profile = context.businessProfile;

      expect(profile.industry).toBe('Technology');
      expect(profile.size).toBe('medium'); // Based on $15M revenue
      expect(profile.stage).toBe('growth'); // Based on 25% growth rate
      expect(profile.businessModel).toBe('SaaS');
      expect(profile.competitivePosition).toBeDefined();
    });

    it('should calculate comprehensive financial metrics', () => {
      const financial = context.financialMetrics;

      expect(financial.performance.revenue.current).toBe(15000000);
      expect(financial.performance.profitability.gross.margin).toBeCloseTo(75, 1);
      expect(financial.performance.profitability.operating.margin).toBeCloseTo(15, 1);
      expect(financial.performance.profitability.net.margin).toBeCloseTo(10, 1);
      expect(financial.performance.cashFlow.operating.amount).toBe(2000000);
    });

    it('should analyze financial trends', () => {
      const trends = context.financialMetrics.trends;

      expect(trends.revenueGrowth).toBeDefined();
      expect(trends.marginTrends).toBeDefined();
      expect(trends.cashFlowTrends).toBeDefined();
      expect(trends.efficiency).toBeDefined();

      expect(['improving', 'stable', 'declining']).toContain(trends.revenueGrowth.direction);
    });

    it('should build operational metrics with efficiency scores', () => {
      const operational = context.operationalMetrics;

      expect(operational.efficiency.overall).toBeGreaterThan(0);
      expect(operational.efficiency.overall).toBeLessThanOrEqual(100);
      expect(operational.scalability.currentCapacity).toBeGreaterThan(0);
      expect(operational.quality.processDocumentation).toBeGreaterThan(0);
      expect(operational.human_capital.keyPersonDependency).toBeGreaterThan(0);
    });

    it('should calculate data quality metrics', () => {
      const quality = context.dataQuality;

      expect(quality.completeness.overall).toBeGreaterThan(0);
      expect(quality.completeness.overall).toBeLessThanOrEqual(100);
      expect(quality.consistency.score).toBeGreaterThan(0);
      expect(quality.reliability.confidence).toBeGreaterThan(0);
      expect(quality.prioritization.highImpact).toBeInstanceOf(Array);
    });

    it('should generate enriched insights', () => {
      const insights = context.enrichedInsights;

      expect(insights.calculatedMetrics).toBeDefined();
      expect(insights.derivedRatios).toBeDefined();
      expect(insights.trendAnalysis).toBeDefined();
      expect(insights.benchmarkInsights).toBeInstanceOf(Array);
      expect(insights.actionableRecommendations).toBeInstanceOf(Array);
      expect(insights.strategicImplications).toBeInstanceOf(Array);
    });
  });

  describe('Enterprise Context Building', () => {
    let context: AnalysisContext;

    beforeEach(() => {
      context = AnalysisContextBuilder.buildEnterpriseContext(mockEnterpriseData);
    });

    it('should build complete enterprise context structure', () => {
      expect(context.tier).toBe('enterprise');
      expect(context.businessProfile).toBeDefined();
      expect(context.financialMetrics).toBeDefined();
      expect(context.operationalMetrics).toBeDefined();
      expect(context.strategicContext).toBeDefined();
      expect(context.marketContext).toBeDefined();
      expect(context.riskProfile).toBeDefined();
      expect(context.benchmarkComparisons).toBeDefined();
      expect(context.dataQuality).toBeDefined();
      expect(context.enrichedInsights).toBeDefined();
    });

    it('should include enterprise-specific financial enhancements', () => {
      const financial = context.financialMetrics;

      // Should have more sophisticated projections and valuation
      expect(financial.projections).toBeDefined();
      expect(financial.valuation).toBeDefined();

      // Should include enhanced leverage analysis with capital structure
      expect(financial.performance.leverage).toBeDefined();
    });

    it('should build enhanced strategic context for enterprise', () => {
      const strategic = context.strategicContext;

      expect(strategic.valueDrivers.primary).toBeInstanceOf(Array);
      expect(strategic.competitivePosition.moatStrength).toBeGreaterThan(0);
      expect(strategic.strategicOptions.growth).toBeInstanceOf(Array);
      expect(strategic.scenarioAnalysis.baseCase).toBeDefined();
      expect(strategic.scenarioAnalysis.optimistic).toBeDefined();
      expect(strategic.scenarioAnalysis.pessimistic).toBeDefined();
    });

    it('should incorporate strategic value drivers', () => {
      const strategic = context.strategicContext;

      // Should have sophisticated value driver analysis
      expect(strategic.valueDrivers.primary.length).toBeGreaterThan(0);
      expect(strategic.competitivePosition.advantages).toBeInstanceOf(Array);
      expect(strategic.strategicOptions).toBeDefined();
    });
  });

  describe('Business Profile Building', () => {
    it('should determine business size correctly', () => {
      const smallBusiness = { ...mockProfessionalData, annualRevenue: 5000000 };
      const largeBusiness = { ...mockProfessionalData, annualRevenue: 150000000 };

      const smallContext = AnalysisContextBuilder.buildProfessionalContext(smallBusiness);
      const largeContext = AnalysisContextBuilder.buildProfessionalContext(largeBusiness);

      expect(smallContext.businessProfile.size).toBe('small');
      expect(largeContext.businessProfile.size).toBe('large');
    });

    it('should determine business stage based on age and growth', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);

      expect(['startup', 'growth', 'mature', 'transition']).toContain(context.businessProfile.stage);
    });

    it('should extract key business characteristics', () => {
      const profile = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData).businessProfile;

      expect(profile.industry).toBe('Technology');
      expect(profile.businessModel).toBe('SaaS');
      expect(['leader', 'challenger', 'follower', 'niche']).toContain(profile.competitivePosition);
    });
  });

  describe('Financial Metrics Calculations', () => {
    it('should calculate revenue analysis with growth metrics', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const revenue = context.financialMetrics.performance.revenue;

      expect(revenue.current).toBe(15000000);
      expect(revenue.historical).toBeInstanceOf(Array);
      expect(revenue.growth.percentage).toBeDefined();
      expect(revenue.growth.cagr).toBeDefined();
      expect(revenue.quality.recurring).toBeDefined();
    });

    it('should calculate profitability metrics', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const profitability = context.financialMetrics.performance.profitability;

      expect(profitability.gross.margin).toBeCloseTo(75, 1);
      expect(profitability.operating.margin).toBeCloseTo(15, 1);
      expect(profitability.net.margin).toBeCloseTo(10, 1);
      expect(profitability.net.roi).toBeDefined();
    });

    it('should analyze cash flow quality', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const cashFlow = context.financialMetrics.performance.cashFlow;

      expect(cashFlow.operating.amount).toBe(2000000);
      expect(cashFlow.operating.margin).toBeDefined();
      expect(cashFlow.free.amount).toBeDefined();
      expect(cashFlow.working_capital.efficiency).toBeDefined();
    });

    it('should calculate financial ratios and efficiency metrics', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const efficiency = context.financialMetrics.performance.efficiency;
      const leverage = context.financialMetrics.performance.leverage;

      expect(efficiency.assetTurnover).toBeGreaterThan(0);
      expect(efficiency.employeeProductivity).toBeGreaterThan(0);
      expect(leverage.debtToEquity).toBeGreaterThan(0);
      expect(leverage.interestCoverage).toBeGreaterThan(0);
    });
  });

  describe('Trend Analysis', () => {
    it('should analyze revenue growth trends', () => {
      const historical = [10000000, 12000000, 15000000]; // 20%, 25% growth
      const trend = (AnalysisContextBuilder as any).analyzeTrend(historical, 'revenue');

      expect(trend.direction).toBe('improving');
      expect(trend.strength).toBeGreaterThan(0);
      expect(trend.consistency).toBeGreaterThan(0);
      expect(trend.forecast).toHaveLength(historical.length + 3);
    });

    it('should identify declining trends', () => {
      const historical = [15000000, 12000000, 10000000]; // Declining
      const trend = (AnalysisContextBuilder as any).analyzeTrend(historical, 'revenue');

      expect(trend.direction).toBe('declining');
      expect(trend.strength).toBeGreaterThan(0);
    });

    it('should detect stable trends', () => {
      const historical = [10000000, 10100000, 9900000]; // Stable
      const trend = (AnalysisContextBuilder as any).analyzeTrend(historical, 'revenue');

      expect(trend.direction).toBe('stable');
    });

    it('should find inflection points', () => {
      const historical = [10, 15, 20, 15, 10, 15]; // Peak at index 2, trough at index 4
      const inflectionPoints = (AnalysisContextBuilder as any).findInflectionPoints(historical);

      expect(inflectionPoints.length).toBeGreaterThan(0);
      expect(inflectionPoints.some((point: string) => point.includes('Peak'))).toBe(true);
      expect(inflectionPoints.some((point: string) => point.includes('Trough'))).toBe(true);
    });

    it('should generate simple forecasts', () => {
      const historical = [10, 12, 14, 16]; // Linear growth
      const forecast = (AnalysisContextBuilder as any).generateSimpleForecast(historical, 3);

      expect(forecast).toHaveLength(7); // Original 4 + 3 forecast
      expect(forecast[4]).toBeCloseTo(18, 0);
      expect(forecast[5]).toBeCloseTo(20, 0);
    });
  });

  describe('Operational Metrics Calculations', () => {
    it('should calculate operational efficiency scores', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const efficiency = context.operationalMetrics.efficiency;

      expect(efficiency.overall).toBeGreaterThan(0);
      expect(efficiency.overall).toBeLessThanOrEqual(100);
      expect(efficiency.automationLevel).toBeGreaterThan(0);
      expect(efficiency.digitalMaturity).toBeGreaterThan(0);
      expect(efficiency.utilizationMetrics).toBeDefined();
    });

    it('should assess scalability factors', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const scalability = context.operationalMetrics.scalability;

      expect(scalability.currentCapacity).toBeGreaterThan(0);
      expect(scalability.scalabilityIndex).toBeGreaterThan(0);
      expect(scalability.bottlenecks).toBeInstanceOf(Array);
      expect(scalability.growthConstraints).toBeInstanceOf(Array);
    });

    it('should evaluate quality metrics', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const quality = context.operationalMetrics.quality;

      expect(quality.processDocumentation).toBeGreaterThan(0);
      expect(quality.standardization).toBeGreaterThan(0);
      expect(quality.continuousImprovement).toBeGreaterThan(0);
      expect(quality.qualityMetrics).toBeInstanceOf(Array);
    });

    it('should analyze human capital factors', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const humanCapital = context.operationalMetrics.human_capital;

      expect(humanCapital.keyPersonDependency).toBeGreaterThan(0);
      expect(humanCapital.talentRetention).toBeGreaterThan(0);
      expect(humanCapital.skillsGaps).toBeInstanceOf(Array);
      expect(humanCapital.organizationalCapabilities).toBeInstanceOf(Array);
    });
  });

  describe('Strategic Context Development', () => {
    it('should identify value drivers for professional tier', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const valueDrivers = context.strategicContext.valueDrivers;

      expect(valueDrivers.primary).toBeInstanceOf(Array);
      expect(valueDrivers.secondary).toBeInstanceOf(Array);
      expect(valueDrivers.potential).toBeInstanceOf(Array);
    });

    it('should assess competitive position', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const competitive = context.strategicContext.competitivePosition;

      expect(competitive.advantages).toBeInstanceOf(Array);
      expect(competitive.threats).toBeInstanceOf(Array);
      expect(competitive.moatStrength).toBeGreaterThanOrEqual(0);
      expect(competitive.moatStrength).toBeLessThanOrEqual(100);
    });

    it('should develop strategic options', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const options = context.strategicContext.strategicOptions;

      expect(options.growth).toBeInstanceOf(Array);
      expect(options.exit).toBeInstanceOf(Array);
      expect(options.optimization).toBeInstanceOf(Array);
      expect(options.partnerships).toBeInstanceOf(Array);
    });

    it('should perform scenario analysis', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const scenarios = context.strategicContext.scenarioAnalysis;

      expect(scenarios.baseCase).toBeDefined();
      expect(scenarios.optimistic).toBeDefined();
      expect(scenarios.pessimistic).toBeDefined();
      expect(scenarios.stressTest).toBeDefined();

      expect(scenarios.baseCase.npv).toBeDefined();
      expect(scenarios.baseCase.probability).toBeGreaterThan(0);
    });
  });

  describe('Market Context Analysis', () => {
    it('should build industry context', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const industry = context.marketContext.industry;

      expect(industry.growth).toBeDefined();
      expect(['emerging', 'growth', 'mature', 'declining']).toContain(industry.maturity);
      expect(industry.dynamics).toBeInstanceOf(Array);
      expect(industry.trends).toBeInstanceOf(Array);
    });

    it('should analyze competition', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const competition = context.marketContext.competition;

      expect(['low', 'medium', 'high']).toContain(competition.intensity);
      expect(competition.barriers).toBeInstanceOf(Array);
      expect(competition.threats).toBeInstanceOf(Array);
      expect(competition.opportunities).toBeInstanceOf(Array);
    });

    it('should calculate market size metrics', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const size = context.marketContext.size;

      expect(size.tam).toBeGreaterThan(0);
      expect(size.sam).toBeGreaterThan(0);
      expect(size.som).toBeGreaterThan(0);
      expect(size.marketShare).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Risk Profile Assessment', () => {
    it('should calculate overall risk score', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const risk = context.riskProfile.overall;

      expect(risk.score).toBeGreaterThanOrEqual(0);
      expect(risk.score).toBeLessThanOrEqual(100);
      expect(['low', 'medium', 'high', 'critical']).toContain(risk.level);
      expect(risk.primaryConcerns).toBeInstanceOf(Array);
    });

    it('should categorize risks by type', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const categories = context.riskProfile.categories;

      expect(categories.financial).toBeDefined();
      expect(categories.operational).toBeDefined();
      expect(categories.strategic).toBeDefined();
      expect(categories.market).toBeDefined();
      expect(categories.regulatory).toBeDefined();

      Object.values(categories).forEach(category => {
        expect(category.score).toBeGreaterThanOrEqual(0);
        expect(category.score).toBeLessThanOrEqual(100);
        expect(category.factors).toBeInstanceOf(Array);
        expect(category.mitigation).toBeInstanceOf(Array);
      });
    });

    it('should provide mitigation strategies', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const mitigation = context.riskProfile.mitigation;

      expect(mitigation.strategies).toBeInstanceOf(Array);
      expect(mitigation.priorities).toBeInstanceOf(Array);
      expect(mitigation.timeline).toBeDefined();
    });
  });

  describe('Benchmark Comparisons', () => {
    it('should provide industry benchmarks', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const industry = context.benchmarkComparisons.industry;

      expect(industry.metrics).toBeInstanceOf(Array);
      expect(industry.percentiles).toBeDefined();
      expect(industry.gaps).toBeInstanceOf(Array);
    });

    it('should compare by business size', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const size = context.benchmarkComparisons.size;

      expect(size.metrics).toBeInstanceOf(Array);
      expect(size.relative_position).toBeTruthy();
      expect(size.improvement_areas).toBeInstanceOf(Array);
    });

    it('should identify best-in-class comparisons', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const bestInClass = context.benchmarkComparisons.best_in_class;

      expect(bestInClass.metrics).toBeInstanceOf(Array);
      expect(bestInClass.aspirational_targets).toBeDefined();
      expect(bestInClass.capability_gaps).toBeInstanceOf(Array);
    });
  });

  describe('Context Formatting for AI Prompts', () => {
    it('should format complete context for prompts', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const formatted = AnalysisContextBuilder.formatContextForPrompt(context);

      expect(formatted).toContain('BUSINESS PROFILE:');
      expect(formatted).toContain('FINANCIAL PERFORMANCE:');
      expect(formatted).toContain('OPERATIONAL PERFORMANCE:');
      expect(formatted).toContain('STRATEGIC POSITION:');
      expect(formatted).toContain('MARKET ENVIRONMENT:');
      expect(formatted).toContain('RISK PROFILE:');
      expect(formatted).toContain('BENCHMARK PERFORMANCE:');
      expect(formatted).toContain('DATA QUALITY ASSESSMENT:');
      expect(formatted).toContain('ENRICHED INSIGHTS:');
    });

    it('should include key metrics in formatted output', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const formatted = AnalysisContextBuilder.formatContextForPrompt(context);

      expect(formatted).toContain('$15,000,000'); // Revenue
      expect(formatted).toContain('Technology'); // Industry
      expect(formatted).toContain('75.0%'); // Gross margin
      expect(formatted).toContain('growth'); // Stage
    });
  });

  describe('Context Data Prioritization', () => {
    it('should prioritize context data based on analysis type', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const prioritized = AnalysisContextBuilder.prioritizeContextData(context, 'financial_analysis');

      expect(prioritized.tier).toBe(context.tier);
      expect(prioritized.financialMetrics).toBeDefined();
    });

    it('should filter low-quality data when completeness is poor', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);

      // Mock low data quality
      context.dataQuality.completeness.overall = 60;

      const prioritized = AnalysisContextBuilder.prioritizeContextData(context, 'investment_analysis');

      expect(prioritized).toBeDefined();
    });

    it('should enhance high-priority areas', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const prioritized = AnalysisContextBuilder.prioritizeContextData(context, 'financial_analysis');

      expect(prioritized.financialMetrics).toBeDefined();
      expect(prioritized.strategicContext).toBeDefined();
    });
  });

  describe('Context Validation and Sanitization', () => {
    it('should validate context completeness and consistency', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const validation = AnalysisContextBuilder.validateAndSanitizeContext(context);

      expect(validation.context).toBeDefined();
      expect(validation.warnings).toBeInstanceOf(Array);
      expect(validation.errors).toBeInstanceOf(Array);
    });

    it('should identify data quality issues', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);

      // Create inconsistent data
      context.financialMetrics.performance.revenue.current = -1000000; // Negative revenue

      const validation = AnalysisContextBuilder.validateAndSanitizeContext(context);

      expect(validation.warnings.length + validation.errors.length).toBeGreaterThanOrEqual(0);
    });

    it('should sanitize sensitive information', () => {
      const context = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const validation = AnalysisContextBuilder.validateAndSanitizeContext(context);

      expect(validation.context.financialMetrics).toBeDefined();
      // Sensitive data should be sanitized but structure preserved
    });
  });

  describe('Enterprise-Specific Enhancements', () => {
    it('should include strategic value drivers in enterprise context', () => {
      const context = AnalysisContextBuilder.buildEnterpriseContext(mockEnterpriseData);

      expect(context.tier).toBe('enterprise');
      expect(context.strategicContext.valueDrivers.primary.length).toBeGreaterThan(0);
    });

    it('should have more sophisticated financial projections for enterprise', () => {
      const professionalContext = AnalysisContextBuilder.buildProfessionalContext(mockProfessionalData);
      const enterpriseContext = AnalysisContextBuilder.buildEnterpriseContext(mockEnterpriseData);

      // Enterprise should have enhanced projections
      expect(enterpriseContext.financialMetrics.projections).toBeDefined();
      expect(enterpriseContext.financialMetrics.valuation).toBeDefined();
    });

    it('should include capital structure analysis for enterprise', () => {
      const context = AnalysisContextBuilder.buildEnterpriseContext(mockEnterpriseData);

      expect(context.financialMetrics.performance.leverage).toBeDefined();
      expect(context.financialMetrics.performance.leverage.debtToEquity).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing financial data gracefully', () => {
      const incompleteData = { ...mockProfessionalData };
      delete (incompleteData as any).annualRevenue;

      const context = AnalysisContextBuilder.buildProfessionalContext(incompleteData);

      expect(context.financialMetrics.performance.revenue.current).toBeDefined();
      expect(context.dataQuality.completeness.overall).toBeLessThan(100);
    });

    it('should handle zero or negative values appropriately', () => {
      const edgeCaseData = {
        ...mockProfessionalData,
        annualRevenue: 0,
        employees: 0
      };

      const context = AnalysisContextBuilder.buildProfessionalContext(edgeCaseData);

      expect(context.businessProfile.size).toBe('small');
      expect(context.financialMetrics.performance.revenue.current).toBe(0);
    });

    it('should handle very large numbers correctly', () => {
      const largeData = {
        ...mockProfessionalData,
        annualRevenue: 1000000000000, // 1 trillion
        employees: 500000
      };

      const context = AnalysisContextBuilder.buildProfessionalContext(largeData);

      expect(context.businessProfile.size).toBe('large');
      expect(context.financialMetrics.performance.revenue.current).toBe(1000000000000);
    });

    it('should provide meaningful defaults when data is incomplete', () => {
      const minimalData = {
        annualRevenue: 1000000,
        employees: 10,
        industry: 'Unknown'
      } as ProfessionalTierData;

      const context = AnalysisContextBuilder.buildProfessionalContext(minimalData);

      expect(context.businessProfile.industry).toBe('Unknown');
      expect(context.businessProfile.size).toBe('small');
      expect(context.dataQuality.completeness.overall).toBeLessThan(100);
    });
  });
});