/**
 * Tests for Prompt Optimization Utils
 * Story 11.8: Enhanced AI Prompt Engineering for Tier-Specific Analysis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TokenCounter,
  PromptCompressor,
  PromptPrioritizer,
  PromptStructureOptimizer,
  TierOptimizer,
  PromptOptimizer,
  AnalysisScorer
} from '../prompt-optimization-utils';
import type {
  AnalysisTier,
  PromptType,
  AnalysisContext,
  OptimizedPrompt,
  PromptPriority,
  PromptStructure,
  PromptConstraint,
  TierSpecificPrompt,
  ConfidenceScoring,
  QualityScoring
} from '@/types/ai-analysis';

describe('Prompt Optimization Utils', () => {
  const mockAnalysisContext: AnalysisContext = {
    businessData: {
      industry: 'Technology',
      companySize: 'medium',
      revenue: 15000000,
      employees: 75,
      geography: ['North America'],
      businessModel: 'SaaS',
      stage: 'growth'
    },
    userPreferences: {
      analysisDepth: 'detailed',
      focusAreas: ['financial', 'operational'],
      timeHorizon: 'medium',
      riskTolerance: 'moderate',
      priorityMetrics: ['revenue_growth', 'profitability']
    },
    historicalData: {
      previousAnalyses: [],
      performanceHistory: [],
      decisionOutcomes: [
        { decision: 'Expand team', date: new Date(), expected_outcome: 'growth', actual_outcome: 'growth', success_score: 0.8, lessons_learned: ['Good timing'] }
      ]
    },
    marketConditions: {
      marketSize: 500000000,
      growthRate: 0.15,
      competitiveIntensity: 'high',
      marketTrends: ['AI adoption', 'Remote work'],
      regulatoryEnvironment: ['GDPR', 'SOX']
    }
  };

  describe('TokenCounter', () => {
    it('should count tokens accurately for simple text', () => {
      const text = 'This is a simple test with approximately twenty characters per token.';
      const tokenCount = TokenCounter.countTokens(text);

      expect(tokenCount).toBeGreaterThan(0);
      expect(tokenCount).toBeLessThan(text.length); // Should be less than character count
    });

    it('should handle JSON content with special token counting', () => {
      const jsonText = '{"financial_score": 85, "analysis": {"revenue": 1000000, "growth": 0.15}}';
      const tokenCount = TokenCounter.countTokens(jsonText);

      expect(tokenCount).toBeGreaterThan(15); // Should account for JSON structure tokens
    });

    it('should count tokens for empty and null inputs', () => {
      expect(TokenCounter.countTokens('')).toBe(0);
      expect(TokenCounter.countTokens('   ')).toBeGreaterThan(0);
    });

    it('should estimate response tokens based on prompt complexity', () => {
      const promptTokens = 100;
      const lowComplexity = TokenCounter.estimateResponseTokens(promptTokens, 0.1);
      const highComplexity = TokenCounter.estimateResponseTokens(promptTokens, 0.9);

      expect(highComplexity).toBeGreaterThan(lowComplexity);
      expect(lowComplexity).toBeGreaterThan(0);
    });

    it('should calculate cost for different models', () => {
      const inputTokens = 1000;
      const outputTokens = 500;

      const gpt4Cost = TokenCounter.calculateCost(inputTokens, outputTokens, 'gpt-4');
      const gpt35Cost = TokenCounter.calculateCost(inputTokens, outputTokens, 'gpt-3.5-turbo');

      expect(gpt4Cost).toBeGreaterThan(gpt35Cost);
      expect(gpt4Cost).toBeGreaterThan(0);
      expect(gpt35Cost).toBeGreaterThan(0);
    });

    it('should handle unknown models with default pricing', () => {
      const cost = TokenCounter.calculateCost(1000, 500, 'unknown-model');
      const defaultCost = TokenCounter.calculateCost(1000, 500, 'gpt-4');

      expect(cost).toBe(defaultCost);
    });
  });

  describe('PromptCompressor', () => {
    const verbosePrompt = `
      This is a very verbose prompt with  multiple   spaces and

      unnecessary line breaks. Please   analyze the financial performance,
      really carefully examine the data, and kindly provide recommendations.

      For example, you should look at revenue trends. For example, check growth rates.
      Such as quarterly performance and such as annual comparisons.
    `;

    it('should compress prompts while preserving quality', () => {
      const result = PromptCompressor.compressPrompt(verbosePrompt, 0.2, true);

      expect(result.compressed.length).toBeLessThan(verbosePrompt.length);
      expect(result.ratio).toBeLessThan(1);
      expect(result.savings).toBeGreaterThan(0);
      expect(result.compressed).not.toContain('  '); // No double spaces
    });

    it('should apply aggressive compression when quality preservation is disabled', () => {
      const conservativeResult = PromptCompressor.compressPrompt(verbosePrompt, 0.3, true);
      const aggressiveResult = PromptCompressor.compressPrompt(verbosePrompt, 0.3, false);

      expect(aggressiveResult.compressed.length).toBeLessThanOrEqual(conservativeResult.compressed.length);
    });

    it('should clean up whitespace and formatting', () => {
      const messyText = 'Text   with    multiple\n\n\nspaces  and,,  punctuation..';
      const result = PromptCompressor.compressPrompt(messyText);

      expect(result.compressed).not.toContain('   ');
      expect(result.compressed).not.toContain('\n\n\n');
      expect(result.compressed).not.toContain(',,');
      expect(result.compressed).not.toContain('..');
    });

    it('should estimate compression potential', () => {
      const analysis = PromptCompressor.estimateCompressionPotential(verbosePrompt);

      expect(analysis.potential).toBeGreaterThan(0);
      expect(analysis.opportunities).toBeInstanceOf(Array);
      expect(analysis.opportunities.length).toBeGreaterThan(0);

      analysis.opportunities.forEach(opportunity => {
        expect(opportunity.type).toBe('compression');
        expect(opportunity.potential_savings).toBeGreaterThan(0);
        expect(['low', 'medium', 'high']).toContain(opportunity.implementation_effort);
      });
    });

    it('should identify repetitive patterns', () => {
      const repetitiveText = 'This pattern repeats. This pattern repeats. This pattern repeats. Additional content here.';
      const analysis = PromptCompressor.estimateCompressionPotential(repetitiveText);

      const repetitionOpportunity = analysis.opportunities.find(op =>
        op.description.includes('repetitive')
      );
      expect(repetitionOpportunity).toBeDefined();
    });

    it('should identify excessive examples', () => {
      const exampleHeavyText = `
        For example, revenue growth. For example, profit margins.
        E.g., market share. Such as customer acquisition.
        For example, operational efficiency.
      `;
      const analysis = PromptCompressor.estimateCompressionPotential(exampleHeavyText);

      const exampleOpportunity = analysis.opportunities.find(op =>
        op.description.includes('examples')
      );
      expect(exampleOpportunity).toBeDefined();
    });
  });

  describe('PromptPrioritizer', () => {
    it('should calculate priority for different prompt types', () => {
      const riskPriority = PromptPrioritizer.calculatePriority(
        'risk_assessment',
        'professional',
        mockAnalysisContext,
        'high'
      );

      const analysisPriority = PromptPrioritizer.calculatePriority(
        'analysis',
        'professional',
        mockAnalysisContext,
        'medium'
      );

      expect(riskPriority.score).toBeGreaterThan(analysisPriority.score);
      expect(['low', 'medium', 'high', 'critical']).toContain(riskPriority.level);
      expect(riskPriority.factors).toHaveLength(4);
    });

    it('should prioritize enterprise tier higher than professional', () => {
      const professionalPriority = PromptPrioritizer.calculatePriority(
        'analysis',
        'professional',
        mockAnalysisContext
      );

      const enterprisePriority = PromptPrioritizer.calculatePriority(
        'analysis',
        'enterprise',
        mockAnalysisContext
      );

      expect(enterprisePriority.score).toBeGreaterThanOrEqual(professionalPriority.score);
    });

    it('should consider business context in priority calculation', () => {
      const largeRevenueContext = {
        ...mockAnalysisContext,
        businessData: {
          ...mockAnalysisContext.businessData,
          revenue: 500000000 // Large revenue
        }
      };

      const largePriority = PromptPrioritizer.calculatePriority(
        'analysis',
        'professional',
        largeRevenueContext
      );

      const smallPriority = PromptPrioritizer.calculatePriority(
        'analysis',
        'professional',
        mockAnalysisContext
      );

      expect(largePriority.score).toBeGreaterThan(smallPriority.score);
    });

    it('should include meaningful reasoning in priority assessment', () => {
      const priority = PromptPrioritizer.calculatePriority(
        'risk_assessment',
        'enterprise',
        mockAnalysisContext,
        'critical'
      );

      expect(priority.reasoning).toBeTruthy();
      expect(priority.reasoning.length).toBeGreaterThan(50);
      expect(priority.reasoning).toContain('Priority set to');
    });

    it('should handle different urgency levels', () => {
      const lowUrgency = PromptPrioritizer.calculatePriority(
        'analysis',
        'professional',
        mockAnalysisContext,
        'low'
      );

      const criticalUrgency = PromptPrioritizer.calculatePriority(
        'analysis',
        'professional',
        mockAnalysisContext,
        'critical'
      );

      expect(criticalUrgency.score).toBeGreaterThan(lowUrgency.score);
    });

    it('should factor in company stage and risk tolerance', () => {
      const exitStageContext = {
        ...mockAnalysisContext,
        businessData: { ...mockAnalysisContext.businessData, stage: 'exit' as const },
        userPreferences: { ...mockAnalysisContext.userPreferences, riskTolerance: 'aggressive' as const }
      };

      const exitPriority = PromptPrioritizer.calculatePriority(
        'analysis',
        'professional',
        exitStageContext
      );

      const growthPriority = PromptPrioritizer.calculatePriority(
        'analysis',
        'professional',
        mockAnalysisContext
      );

      expect(exitPriority.score).toBeGreaterThan(growthPriority.score);
    });
  });

  describe('PromptStructureOptimizer', () => {
    const samplePrompt = `
      Context: This is a technology company analysis
      Objective: Analyze financial performance and strategic position
      Requirements: Provide comprehensive assessment with quantitative metrics
      Constraints: Keep analysis under 1000 tokens
      Examples: Revenue growth analysis should include CAGR calculations
      Output: JSON format with structured findings
    `;

    it('should parse prompt into structured sections', () => {
      const structure = PromptStructureOptimizer.optimizeStructure(
        samplePrompt,
        'professional',
        'analysis',
        []
      );

      expect(structure.sections.length).toBeGreaterThan(0);
      expect(structure.instructions).toBeInstanceOf(Array);
      expect(structure.constraints).toBeInstanceOf(Array);
      expect(structure.outputFormat).toBeDefined();

      const sectionNames = structure.sections.map(s => s.name);
      expect(sectionNames).toContain('context');
      expect(sectionNames).toContain('objective');
    });

    it('should prioritize sections by importance', () => {
      const structure = PromptStructureOptimizer.optimizeStructure(
        samplePrompt,
        'professional',
        'analysis',
        []
      );

      const sortedSections = structure.sections.sort((a, b) => b.priority - a.priority);
      expect(sortedSections[0].priority).toBeGreaterThanOrEqual(sortedSections[1]?.priority || 0);
    });

    it('should optimize sections when token limit is exceeded', () => {
      const longPrompt = 'A'.repeat(10000); // Very long prompt
      const constraints: PromptConstraint[] = [
        { type: 'token_limit', value: 1000, strict: true }
      ];

      const structure = PromptStructureOptimizer.optimizeStructure(
        longPrompt,
        'professional',
        'analysis',
        constraints
      );

      const totalTokens = structure.sections.reduce((sum, section) => sum + section.tokenCount, 0);
      expect(totalTokens).toBeLessThanOrEqual(1000);
    });

    it('should generate tier-appropriate instructions', () => {
      const professionalStructure = PromptStructureOptimizer.optimizeStructure(
        samplePrompt,
        'professional',
        'recommendation',
        []
      );

      const enterpriseStructure = PromptStructureOptimizer.optimizeStructure(
        samplePrompt,
        'enterprise',
        'recommendation',
        []
      );

      expect(professionalStructure.instructions).toContain('Include relevant business context');
      expect(enterpriseStructure.instructions).toContain('Provide strategic implications');
    });

    it('should determine appropriate output formats', () => {
      const analysisStructure = PromptStructureOptimizer.optimizeStructure(
        samplePrompt,
        'professional',
        'analysis',
        []
      );

      const riskStructure = PromptStructureOptimizer.optimizeStructure(
        samplePrompt,
        'enterprise',
        'risk_assessment',
        []
      );

      expect(analysisStructure.outputFormat.type).toBe('structured');
      expect(riskStructure.outputFormat.type).toBe('json');
      expect(analysisStructure.outputFormat.validation).toBeInstanceOf(Array);
    });

    it('should handle prompts without clear section markers', () => {
      const unstructuredPrompt = 'Analyze this business and provide recommendations for growth and risk mitigation.';

      const structure = PromptStructureOptimizer.optimizeStructure(
        unstructuredPrompt,
        'professional',
        'analysis',
        []
      );

      expect(structure.sections).toHaveLength(1);
      expect(structure.sections[0].name).toBe('content');
      expect(structure.sections[0].required).toBe(true);
    });
  });

  describe('TierOptimizer', () => {
    it('should create tier-specific prompts with appropriate features', () => {
      const professionalPrompt = TierOptimizer.createTierSpecificPrompt(
        'Analyze this business',
        'professional',
        'analysis'
      );

      const enterprisePrompt = TierOptimizer.createTierSpecificPrompt(
        'Analyze this business',
        'enterprise',
        'scenario'
      );

      expect(professionalPrompt.tier).toBe('professional');
      expect(enterprisePrompt.tier).toBe('enterprise');

      expect(professionalPrompt.features.length).toBeLessThan(enterprisePrompt.features.length);
      expect(enterprisePrompt.enhancedCapabilities.length).toBeGreaterThan(professionalPrompt.enhancedCapabilities.length);
    });

    it('should define appropriate limitations for each tier', () => {
      const consumerPrompt = TierOptimizer.createTierSpecificPrompt(
        'Simple analysis',
        'consumer',
        'analysis'
      );

      const enterprisePrompt = TierOptimizer.createTierSpecificPrompt(
        'Complex analysis',
        'enterprise',
        'scenario'
      );

      expect(consumerPrompt.limitations.length).toBeGreaterThan(enterprisePrompt.limitations.length);

      const consumerTokenLimit = consumerPrompt.limitations.find(l => l.type === 'token');
      const enterpriseTokenLimit = enterprisePrompt.limitations.find(l => l.type === 'token');

      expect(consumerTokenLimit?.threshold).toBeLessThan(enterpriseTokenLimit?.threshold || 0);
    });

    it('should provide enhanced capabilities for higher tiers', () => {
      const professionalPrompt = TierOptimizer.createTierSpecificPrompt(
        'Analysis',
        'professional',
        'analysis'
      );

      const enterprisePrompt = TierOptimizer.createTierSpecificPrompt(
        'Analysis',
        'enterprise',
        'analysis'
      );

      expect(professionalPrompt.enhancedCapabilities).toHaveLength(1); // contextual_memory
      expect(enterprisePrompt.enhancedCapabilities).toHaveLength(3); // contextual_memory + real_time_data + custom_algorithms

      enterprisePrompt.enhancedCapabilities.forEach(capability => {
        expect(capability.qualityBoost).toBeGreaterThan(0);
        expect(capability.tokenCost).toBeGreaterThan(0);
      });
    });

    it('should allocate tokens appropriately across features', () => {
      const enterprisePrompt = TierOptimizer.createTierSpecificPrompt(
        'Complex analysis',
        'enterprise',
        'scenario'
      );

      const totalTokenAllocation = enterprisePrompt.features.reduce(
        (sum, feature) => sum + feature.tokenAllocation, 0
      );

      expect(totalTokenAllocation).toBeLessThanOrEqual(20000); // Enterprise limit
      expect(totalTokenAllocation).toBeGreaterThan(1000); // Minimum meaningful allocation
    });
  });

  describe('PromptOptimizer (Main Orchestrator)', () => {
    const basePrompt = `
      Analyze the financial performance of this technology company with $15M revenue.
      Focus on growth trends, profitability, and operational efficiency.
      Provide recommendations for strategic improvements and risk mitigation.
      Include quantitative metrics and benchmark comparisons where possible.
    `;

    it('should orchestrate complete prompt optimization', async () => {
      const optimized = await PromptOptimizer.optimizePrompt(
        basePrompt,
        'professional',
        'analysis',
        mockAnalysisContext,
        { maxTokens: 3000, prioritizeSpeed: false, preserveQuality: true }
      );

      expect(optimized.original).toBe(basePrompt);
      expect(optimized.optimized.length).toBeLessThanOrEqual(basePrompt.length);
      expect(optimized.tokenCount).toBeGreaterThan(0);
      expect(optimized.compressionRatio).toBeLessThanOrEqual(1);
      expect(optimized.priority).toBeDefined();
      expect(optimized.structure).toBeDefined();
      expect(optimized.tierSpecific).toBeDefined();
    });

    it('should handle different optimization strategies', async () => {
      const speedOptimized = await PromptOptimizer.optimizePrompt(
        basePrompt,
        'professional',
        'analysis',
        mockAnalysisContext,
        { prioritizeSpeed: true, preserveQuality: false }
      );

      const qualityOptimized = await PromptOptimizer.optimizePrompt(
        basePrompt,
        'professional',
        'analysis',
        mockAnalysisContext,
        { prioritizeSpeed: false, preserveQuality: true }
      );

      expect(speedOptimized.compressionRatio).toBeLessThanOrEqual(qualityOptimized.compressionRatio);
    });

    it('should respect token limits for different tiers', async () => {
      const consumerOptimized = await PromptOptimizer.optimizePrompt(
        basePrompt,
        'consumer',
        'analysis',
        mockAnalysisContext
      );

      const enterpriseOptimized = await PromptOptimizer.optimizePrompt(
        basePrompt,
        'enterprise',
        'scenario',
        mockAnalysisContext
      );

      expect(consumerOptimized.tokenCount).toBeLessThanOrEqual(1000);
      expect(enterpriseOptimized.tokenCount).toBeLessThanOrEqual(20000);
    });

    it('should process batch optimization efficiently', async () => {
      const prompts = [
        { id: '1', prompt: basePrompt, tier: 'professional' as const, type: 'analysis' as const, context: mockAnalysisContext },
        { id: '2', prompt: basePrompt, tier: 'enterprise' as const, type: 'scenario' as const, context: mockAnalysisContext },
        { id: '3', prompt: basePrompt, tier: 'professional' as const, type: 'recommendation' as const, context: mockAnalysisContext }
      ];

      const results = await PromptOptimizer.batchOptimize(prompts, { parallel: true, maxConcurrency: 2 });

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.id).toBe(prompts[index].id);
        expect(result.optimized).toBeDefined();
        expect(result.tokenCount).toBeGreaterThan(0);
      });
    });

    it('should handle sequential batch processing', async () => {
      const prompts = [
        { id: '1', prompt: basePrompt, tier: 'professional' as const, type: 'analysis' as const, context: mockAnalysisContext },
        { id: '2', prompt: basePrompt, tier: 'enterprise' as const, type: 'scenario' as const, context: mockAnalysisContext }
      ];

      const results = await PromptOptimizer.batchOptimize(prompts, { parallel: false });

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('1');
      expect(results[1].id).toBe('2');
    });
  });

  describe('AnalysisScorer', () => {
    const mockAnalysisResult = {
      overall_score: 85,
      financial_analysis: { score: 80, revenue_growth: 0.15 },
      operational_analysis: { efficiency_score: 75 },
      recommendations: ['Expand market', 'Improve efficiency'],
      investment_thesis: 'Strong growth potential'
    };

    const mockMetadata = {
      model: 'claude-3-5-sonnet',
      version: '1.0',
      processingTime: 2500
    };

    it('should calculate comprehensive confidence scoring', () => {
      const confidence = AnalysisScorer.calculateConfidenceScore(
        mockAnalysisResult,
        mockAnalysisContext,
        mockMetadata
      );

      expect(confidence.overall).toBeGreaterThan(0);
      expect(confidence.overall).toBeLessThanOrEqual(1);

      expect(confidence.breakdown.data_quality).toBeDefined();
      expect(confidence.breakdown.model_reliability).toBeDefined();
      expect(confidence.breakdown.context_completeness).toBeDefined();
      expect(confidence.breakdown.historical_accuracy).toBeDefined();

      expect(confidence.factors).toHaveLength(5);
      confidence.factors.forEach(factor => {
        expect(factor.weight).toBeGreaterThan(0);
        expect(factor.score).toBeGreaterThanOrEqual(0);
        expect(factor.score).toBeLessThanOrEqual(1);
        expect(['increase', 'decrease', 'neutral']).toContain(factor.impact);
      });
    });

    it('should provide calibrated confidence with intervals', () => {
      const confidence = AnalysisScorer.calculateConfidenceScore(
        mockAnalysisResult,
        mockAnalysisContext,
        mockMetadata
      );

      expect(confidence.calibration.calibrated_confidence).toBeLessThanOrEqual(confidence.overall);
      expect(confidence.calibration.adjustment_factor).toBeLessThanOrEqual(1);
      expect(confidence.calibration.confidence_intervals).toHaveLength(2);

      confidence.calibration.confidence_intervals.forEach(interval => {
        expect(interval.lower_bound).toBeLessThanOrEqual(interval.upper_bound);
        expect(interval.coverage).toBeGreaterThan(0);
        expect(interval.coverage).toBeLessThanOrEqual(1);
      });
    });

    it('should assess data quality factors', () => {
      const contextWithCompleteData = {
        ...mockAnalysisContext,
        historicalData: mockAnalysisContext.historicalData,
        marketConditions: mockAnalysisContext.marketConditions,
        companyProfile: {
          foundedYear: 2015,
          fundingStage: 'Series B',
          keyMetrics: { revenue: 15000000 },
          strengths: ['Technology', 'Team'],
          challenges: ['Competition'],
          strategicGoals: ['Growth', 'Profitability']
        }
      };

      const confidence = AnalysisScorer.calculateConfidenceScore(
        mockAnalysisResult,
        contextWithCompleteData,
        mockMetadata
      );

      expect(confidence.breakdown.data_quality).toBeGreaterThan(0.5);
      expect(confidence.breakdown.context_completeness).toBeGreaterThan(0.5);
    });

    it('should calculate quality scores with multiple dimensions', () => {
      const quality = AnalysisScorer.calculateQualityScore(
        mockAnalysisResult,
        'Analyze financial performance',
        'professional'
      );

      expect(quality.overall).toBeGreaterThan(0);
      expect(quality.overall).toBeLessThanOrEqual(1);
      expect(quality.dimensions).toBeInstanceOf(Array);

      quality.dimensions.forEach(dimension => {
        expect(dimension.score).toBeGreaterThan(0);
        expect(dimension.weight).toBeGreaterThan(0);
        expect(dimension.criteria).toBeInstanceOf(Array);

        dimension.criteria.forEach(criterion => {
          expect(criterion.score).toBeGreaterThanOrEqual(0);
          expect(criterion.threshold).toBeGreaterThan(0);
          expect(typeof criterion.met).toBe('boolean');
        });
      });
    });

    it('should handle incomplete analysis data gracefully', () => {
      const incompleteAnalysis = {
        overall_score: 60
        // Missing many fields
      };

      const confidence = AnalysisScorer.calculateConfidenceScore(
        incompleteAnalysis,
        mockAnalysisContext,
        mockMetadata
      );

      expect(confidence.overall).toBeGreaterThan(0);
      expect(confidence.overall).toBeLessThan(0.8); // Should be lower due to incomplete data
    });

    it('should incorporate historical accuracy when available', () => {
      const contextWithHistory = {
        ...mockAnalysisContext,
        historicalData: {
          ...mockAnalysisContext.historicalData!,
          decisionOutcomes: [
            { decision: 'Expand', date: new Date(), expected_outcome: 'growth', actual_outcome: 'growth', success_score: 0.9, lessons_learned: [] },
            { decision: 'Optimize', date: new Date(), expected_outcome: 'efficiency', actual_outcome: 'efficiency', success_score: 0.85, lessons_learned: [] }
          ]
        }
      };

      const confidence = AnalysisScorer.calculateConfidenceScore(
        mockAnalysisResult,
        contextWithHistory,
        mockMetadata
      );

      expect(confidence.breakdown.historical_accuracy).toBeGreaterThan(0.8);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete optimization workflow', async () => {
      const complexPrompt = `
        Perform a comprehensive strategic analysis of this technology company.

        Context: SaaS business with $15M ARR, 75 employees, operating in competitive market.

        Requirements:
        - Analyze financial performance including revenue trends, profitability, cash flow
        - Assess operational efficiency and scalability
        - Evaluate competitive position and strategic options
        - Provide risk assessment and mitigation strategies
        - Recommend strategic initiatives with implementation roadmap

        Constraints:
        - Focus on actionable insights
        - Include quantitative metrics where possible
        - Benchmark against industry standards

        Output: Structured analysis with executive summary, detailed findings, and recommendations.
      `;

      const optimized = await PromptOptimizer.optimizePrompt(
        complexPrompt,
        'enterprise',
        'scenario',
        mockAnalysisContext,
        { maxTokens: 8000, preserveQuality: true }
      );

      expect(optimized.tokenCount).toBeLessThanOrEqual(8000);
      expect(optimized.priority.level).toBeDefined();
      expect(optimized.structure.sections.length).toBeGreaterThan(3);
      expect(optimized.tierSpecific.features.length).toBeGreaterThan(3);

      // Should maintain key analytical requirements
      expect(optimized.optimized).toContain('financial');
      expect(optimized.optimized).toContain('strategic');
      expect(optimized.optimized).toContain('recommendations');
    });

    it('should optimize for different use cases appropriately', async () => {
      const riskPrompt = 'Assess the risks facing this business';
      const growthPrompt = 'Analyze growth opportunities for this company';

      const riskOptimized = await PromptOptimizer.optimizePrompt(
        riskPrompt,
        'professional',
        'risk_assessment',
        mockAnalysisContext
      );

      const growthOptimized = await PromptOptimizer.optimizePrompt(
        growthPrompt,
        'professional',
        'analysis',
        mockAnalysisContext
      );

      expect(riskOptimized.priority.level).toBeOneOf(['medium', 'high', 'critical']);
      expect(growthOptimized.priority.level).toBeOneOf(['low', 'medium', 'high']);
      expect(riskOptimized.priority.score).toBeGreaterThanOrEqual(growthOptimized.priority.score);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty prompts gracefully', async () => {
      const result = await PromptOptimizer.optimizePrompt(
        '',
        'professional',
        'analysis',
        mockAnalysisContext
      );

      expect(result.optimized).toBeDefined();
      expect(result.tokenCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long prompts', async () => {
      const veryLongPrompt = 'A'.repeat(50000);
      const result = await PromptOptimizer.optimizePrompt(
        veryLongPrompt,
        'professional',
        'analysis',
        mockAnalysisContext,
        { maxTokens: 2000 }
      );

      expect(result.tokenCount).toBeLessThanOrEqual(2000);
      expect(result.compressionRatio).toBeLessThan(0.5);
    });

    it('should handle prompts with special characters and formatting', async () => {
      const specialPrompt = `
        Analyze: {"revenue": $15M, "growth": 25%}
        Requirements:
        • Financial analysis
        • Strategic review
        → Recommendations
        ★ High priority
      `;

      const result = await PromptOptimizer.optimizePrompt(
        specialPrompt,
        'professional',
        'analysis',
        mockAnalysisContext
      );

      expect(result.optimized).toBeDefined();
      expect(result.tokenCount).toBeGreaterThan(0);
    });

    it('should handle invalid tier and prompt type combinations', async () => {
      const result = await PromptOptimizer.optimizePrompt(
        'Analyze business',
        'consumer',
        'scenario', // Complex analysis for simple tier
        mockAnalysisContext
      );

      expect(result).toBeDefined();
      expect(result.tierSpecific.limitations.length).toBeGreaterThan(0);
    });
  });
});