/**
 * Tests for Tier-Specific AI Prompt Templates
 * Story 11.8: Enhanced AI Prompt Engineering for Tier-Specific Analysis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PROFESSIONAL_TIER_WEIGHTS,
  ENTERPRISE_TIER_WEIGHTS,
  PROFESSIONAL_FINANCIAL_ANALYSIS,
  PROFESSIONAL_OPERATIONAL_ANALYSIS,
  ENTERPRISE_STRATEGIC_VALUE_ANALYSIS,
  ENTERPRISE_SCENARIO_MODELING,
  PROFESSIONAL_FEW_SHOT_EXAMPLES,
  ENTERPRISE_FEW_SHOT_EXAMPLES,
  PROFESSIONAL_SYSTEM_PROMPT,
  ENTERPRISE_SYSTEM_PROMPT,
  PROFESSIONAL_OUTPUT_SCHEMA,
  ENTERPRISE_OUTPUT_SCHEMA,
  createTierPromptConfig,
  generatePrompt,
  validateOutput,
  TIER_PROMPT_CONFIGS,
  type TierPromptConfig,
  type PromptWeight,
  type AnalysisSection,
  type FewShotExample
} from '../tier-specific-prompts';

describe('Tier-Specific Prompts', () => {
  describe('Professional Tier Weights', () => {
    it('should have correct weight distribution for professional tier', () => {
      expect(PROFESSIONAL_TIER_WEIGHTS).toHaveLength(5);

      const totalWeight = PROFESSIONAL_TIER_WEIGHTS.reduce((sum, weight) => sum + weight.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);

      const financialWeight = PROFESSIONAL_TIER_WEIGHTS.find(w => w.category === 'financial_performance');
      expect(financialWeight?.weight).toBe(0.30);

      const operationalWeight = PROFESSIONAL_TIER_WEIGHTS.find(w => w.category === 'operational_risk_efficiency');
      expect(operationalWeight?.weight).toBe(0.25);
    });

    it('should have meaningful descriptions for each weight category', () => {
      PROFESSIONAL_TIER_WEIGHTS.forEach(weight => {
        expect(weight.description).toBeTruthy();
        expect(weight.description.length).toBeGreaterThan(20);
        expect(weight.category).toBeTruthy();
      });
    });

    it('should prioritize financial performance as highest weight', () => {
      const sortedWeights = [...PROFESSIONAL_TIER_WEIGHTS].sort((a, b) => b.weight - a.weight);
      expect(sortedWeights[0].category).toBe('financial_performance');
    });
  });

  describe('Enterprise Tier Weights', () => {
    it('should have correct weight distribution for enterprise tier', () => {
      expect(ENTERPRISE_TIER_WEIGHTS).toHaveLength(5);

      const totalWeight = ENTERPRISE_TIER_WEIGHTS.reduce((sum, weight) => sum + weight.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);

      const strategicWeight = ENTERPRISE_TIER_WEIGHTS.find(w => w.category === 'strategic_value_drivers');
      expect(strategicWeight?.weight).toBe(0.25);

      const scenarioWeight = ENTERPRISE_TIER_WEIGHTS.find(w => w.category === 'multi_scenario_modeling');
      expect(scenarioWeight?.weight).toBe(0.25);
    });

    it('should focus on strategic and scenario analysis', () => {
      const topCategories = ENTERPRISE_TIER_WEIGHTS
        .filter(w => w.weight >= 0.25)
        .map(w => w.category);

      expect(topCategories).toContain('strategic_value_drivers');
      expect(topCategories).toContain('multi_scenario_modeling');
    });

    it('should include exit strategy optimization', () => {
      const exitStrategy = ENTERPRISE_TIER_WEIGHTS.find(w => w.category === 'exit_strategy_optimization');
      expect(exitStrategy).toBeTruthy();
      expect(exitStrategy?.weight).toBe(0.20);
    });
  });

  describe('Professional Analysis Sections', () => {
    it('should have properly structured financial analysis section', () => {
      expect(PROFESSIONAL_FINANCIAL_ANALYSIS.name).toBe('Financial Performance Analysis');
      expect(PROFESSIONAL_FINANCIAL_ANALYSIS.weight).toBe(0.30);
      expect(PROFESSIONAL_FINANCIAL_ANALYSIS.prompt).toContain('investment-grade rigor');
      expect(PROFESSIONAL_FINANCIAL_ANALYSIS.chainOfThought).toHaveLength(5);
    });

    it('should include comprehensive chain of thought for financial analysis', () => {
      const chainOfThought = PROFESSIONAL_FINANCIAL_ANALYSIS.chainOfThought;

      expect(chainOfThought[0]).toContain('gather and normalize financial data');
      expect(chainOfThought[1]).toContain('calculate key financial metrics');
      expect(chainOfThought[2]).toContain('benchmark these metrics');
      expect(chainOfThought[3]).toContain('Identify trends');
      expect(chainOfThought[4]).toContain('synthesize findings');
    });

    it('should have valid JSON output format for financial analysis', () => {
      const outputFormat = PROFESSIONAL_FINANCIAL_ANALYSIS.outputFormat;
      expect(outputFormat).toContain('financial_score');
      expect(outputFormat).toContain('revenue_analysis');
      expect(outputFormat).toContain('profitability');
      expect(outputFormat).toContain('investment_thesis');

      // Should be valid JSON structure
      expect(() => JSON.parse(outputFormat.trim())).not.toThrow();
    });

    it('should have properly structured operational analysis section', () => {
      expect(PROFESSIONAL_OPERATIONAL_ANALYSIS.name).toBe('Operational Risk & Efficiency Analysis');
      expect(PROFESSIONAL_OPERATIONAL_ANALYSIS.weight).toBe(0.25);
      expect(PROFESSIONAL_OPERATIONAL_ANALYSIS.prompt).toContain('operational analysis');
      expect(PROFESSIONAL_OPERATIONAL_ANALYSIS.chainOfThought).toHaveLength(5);
    });

    it('should cover key operational areas in analysis prompt', () => {
      const prompt = PROFESSIONAL_OPERATIONAL_ANALYSIS.prompt;

      expect(prompt).toContain('Operational Efficiency Assessment');
      expect(prompt).toContain('Risk Factor Identification');
      expect(prompt).toContain('Operational Excellence Evaluation');
      expect(prompt).toContain('Continuous Improvement Capabilities');
    });
  });

  describe('Enterprise Analysis Sections', () => {
    it('should have sophisticated strategic value analysis', () => {
      expect(ENTERPRISE_STRATEGIC_VALUE_ANALYSIS.name).toBe('Strategic Value Driver Analysis');
      expect(ENTERPRISE_STRATEGIC_VALUE_ANALYSIS.weight).toBe(0.25);
      expect(ENTERPRISE_STRATEGIC_VALUE_ANALYSIS.prompt).toContain('strategic consultant-level analysis');
      expect(ENTERPRISE_STRATEGIC_VALUE_ANALYSIS.chainOfThought).toHaveLength(5);
    });

    it('should include advanced strategic frameworks in chain of thought', () => {
      const chainOfThought = ENTERPRISE_STRATEGIC_VALUE_ANALYSIS.chainOfThought;

      expect(chainOfThought[1]).toContain("Porter's Five Forces");
      expect(chainOfThought[1]).toContain('Resource-Based View');
      expect(chainOfThought[1]).toContain('Dynamic Capabilities');
      expect(chainOfThought[2]).toContain('DCF');
      expect(chainOfThought[2]).toContain('option pricing models');
    });

    it('should have comprehensive scenario modeling section', () => {
      expect(ENTERPRISE_SCENARIO_MODELING.name).toBe('Multi-Scenario Strategic Modeling');
      expect(ENTERPRISE_SCENARIO_MODELING.weight).toBe(0.25);
      expect(ENTERPRISE_SCENARIO_MODELING.prompt).toContain('sophisticated scenario models');
      expect(ENTERPRISE_SCENARIO_MODELING.chainOfThought).toHaveLength(5);
    });

    it('should include advanced modeling techniques', () => {
      const prompt = ENTERPRISE_SCENARIO_MODELING.prompt;

      expect(prompt).toContain('Monte Carlo simulation');
      expect(prompt).toContain('real options methodology');
      expect(prompt).toContain('Value at Risk');
      expect(prompt).toContain('black swan events');
    });
  });

  describe('Few-Shot Examples', () => {
    it('should have realistic professional tier examples', () => {
      expect(PROFESSIONAL_FEW_SHOT_EXAMPLES).toHaveLength(2);

      const saasExample = PROFESSIONAL_FEW_SHOT_EXAMPLES[0];
      expect(saasExample.scenario).toBe('SaaS Company Financial Analysis');
      expect(saasExample.input.revenue).toHaveLength(3);
      expect(saasExample.input.customer_acquisition_cost).toBe(1200);
      expect(saasExample.input.customer_lifetime_value).toBe(8500);
    });

    it('should have valid expected outputs in professional examples', () => {
      PROFESSIONAL_FEW_SHOT_EXAMPLES.forEach(example => {
        expect(() => JSON.parse(example.expectedOutput)).not.toThrow();

        const parsed = JSON.parse(example.expectedOutput);
        expect(parsed.financial_score).toBeTypeOf('number');
        expect(parsed.revenue_analysis).toBeDefined();
        expect(parsed.investment_thesis).toBeTypeOf('string');
      });
    });

    it('should include reasoning for each professional example', () => {
      PROFESSIONAL_FEW_SHOT_EXAMPLES.forEach(example => {
        expect(example.reasoning).toBeTruthy();
        expect(example.reasoning.length).toBeGreaterThan(50);
      });
    });

    it('should have sophisticated enterprise tier examples', () => {
      expect(ENTERPRISE_FEW_SHOT_EXAMPLES).toHaveLength(1);

      const platformExample = ENTERPRISE_FEW_SHOT_EXAMPLES[0];
      expect(platformExample.scenario).toBe('Tech Platform Strategic Value Analysis');
      expect(platformExample.input.network_effects_strength).toBe(0.85);
      expect(platformExample.input.platform_users).toBe(50000000);
    });

    it('should demonstrate strategic sophistication in enterprise examples', () => {
      const example = ENTERPRISE_FEW_SHOT_EXAMPLES[0];
      const parsed = JSON.parse(example.expectedOutput);

      expect(parsed.strategic_value_score).toBe(91);
      expect(parsed.value_drivers.primary_drivers).toHaveLength(3);
      expect(parsed.strategic_recommendations).toBeDefined();

      expect(example.reasoning).toContain('network effects');
      expect(example.reasoning).toContain('data moats');
    });
  });

  describe('System Prompts', () => {
    it('should have investment-grade professional system prompt', () => {
      expect(PROFESSIONAL_SYSTEM_PROMPT).toContain('investment-grade financial analyst');
      expect(PROFESSIONAL_SYSTEM_PROMPT).toContain('business valuation');
      expect(PROFESSIONAL_SYSTEM_PROMPT).toContain('private equity firms');
      expect(PROFESSIONAL_SYSTEM_PROMPT).toContain('Investment memorandum quality');
    });

    it('should include key principles for professional analysis', () => {
      expect(PROFESSIONAL_SYSTEM_PROMPT).toContain('rigorous analytical frameworks');
      expect(PROFESSIONAL_SYSTEM_PROMPT).toContain('quantitative analysis');
      expect(PROFESSIONAL_SYSTEM_PROMPT).toContain('industry standards');
      expect(PROFESSIONAL_SYSTEM_PROMPT).toContain('risk-adjusted returns');
    });

    it('should have strategic consultant-level enterprise system prompt', () => {
      expect(ENTERPRISE_SYSTEM_PROMPT).toContain('strategic consultant');
      expect(ENTERPRISE_SYSTEM_PROMPT).toContain('McKinsey, BCG, Bain');
      expect(ENTERPRISE_SYSTEM_PROMPT).toContain('C-suite level insights');
      expect(ENTERPRISE_SYSTEM_PROMPT).toContain('board-level strategic decision-making');
    });

    it('should emphasize sophisticated analysis for enterprise', () => {
      expect(ENTERPRISE_SYSTEM_PROMPT).toContain('sophisticated strategic frameworks');
      expect(ENTERPRISE_SYSTEM_PROMPT).toContain('Multi-scenario analysis');
      expect(ENTERPRISE_SYSTEM_PROMPT).toContain('probabilistic outcomes');
      expect(ENTERPRISE_SYSTEM_PROMPT).toContain('portfolio optimization');
    });
  });

  describe('Output Schemas', () => {
    it('should have valid professional output schema structure', () => {
      expect(PROFESSIONAL_OUTPUT_SCHEMA.type).toBe('object');
      expect(PROFESSIONAL_OUTPUT_SCHEMA.required).toContain('overall_score');
      expect(PROFESSIONAL_OUTPUT_SCHEMA.required).toContain('financial_analysis');
      expect(PROFESSIONAL_OUTPUT_SCHEMA.required).toContain('operational_analysis');
      expect(PROFESSIONAL_OUTPUT_SCHEMA.required).toContain('investment_thesis');
    });

    it('should define proper score ranges in professional schema', () => {
      expect(PROFESSIONAL_OUTPUT_SCHEMA.properties.overall_score.minimum).toBe(1);
      expect(PROFESSIONAL_OUTPUT_SCHEMA.properties.overall_score.maximum).toBe(100);
    });

    it('should have comprehensive enterprise output schema', () => {
      expect(ENTERPRISE_OUTPUT_SCHEMA.type).toBe('object');
      expect(ENTERPRISE_OUTPUT_SCHEMA.required).toContain('strategic_value_score');
      expect(ENTERPRISE_OUTPUT_SCHEMA.required).toContain('value_driver_analysis');
      expect(ENTERPRISE_OUTPUT_SCHEMA.required).toContain('scenario_modeling');
      expect(ENTERPRISE_OUTPUT_SCHEMA.required).toContain('strategic_recommendations');
    });

    it('should include enterprise-specific analysis components', () => {
      const properties = ENTERPRISE_OUTPUT_SCHEMA.properties;

      expect(properties.exit_strategy_analysis).toBeDefined();
      expect(properties.implementation_roadmap).toBeDefined();
      expect(properties.scenario_modeling).toBeDefined();
    });
  });

  describe('Tier Prompt Configuration Factory', () => {
    it('should create valid professional tier configuration', () => {
      const config = createTierPromptConfig('professional', 'investment_analysis');

      expect(config.tier).toBe('professional');
      expect(config.analysisType).toBe('investment_analysis');
      expect(config.sections).toHaveLength(2);
      expect(config.weights).toBe(PROFESSIONAL_TIER_WEIGHTS);
      expect(config.fewShotExamples).toBe(PROFESSIONAL_FEW_SHOT_EXAMPLES);
      expect(config.systemPrompt).toBe(PROFESSIONAL_SYSTEM_PROMPT);
      expect(config.outputSchema).toBe(PROFESSIONAL_OUTPUT_SCHEMA);
    });

    it('should create valid enterprise tier configuration', () => {
      const config = createTierPromptConfig('enterprise', 'strategic_analysis');

      expect(config.tier).toBe('enterprise');
      expect(config.analysisType).toBe('strategic_analysis');
      expect(config.sections).toHaveLength(2);
      expect(config.weights).toBe(ENTERPRISE_TIER_WEIGHTS);
      expect(config.fewShotExamples).toBe(ENTERPRISE_FEW_SHOT_EXAMPLES);
      expect(config.systemPrompt).toBe(ENTERPRISE_SYSTEM_PROMPT);
      expect(config.outputSchema).toBe(ENTERPRISE_OUTPUT_SCHEMA);
    });

    it('should include correct sections for each tier', () => {
      const professionalConfig = createTierPromptConfig('professional', 'investment_analysis');
      expect(professionalConfig.sections[0]).toBe(PROFESSIONAL_FINANCIAL_ANALYSIS);
      expect(professionalConfig.sections[1]).toBe(PROFESSIONAL_OPERATIONAL_ANALYSIS);

      const enterpriseConfig = createTierPromptConfig('enterprise', 'strategic_analysis');
      expect(enterpriseConfig.sections[0]).toBe(ENTERPRISE_STRATEGIC_VALUE_ANALYSIS);
      expect(enterpriseConfig.sections[1]).toBe(ENTERPRISE_SCENARIO_MODELING);
    });
  });

  describe('Prompt Generation', () => {
    const mockBusinessData = {
      annualRevenue: 10000000,
      grossMargin: 0.75,
      employees: 50,
      industry: 'Technology',
      stage: 'growth'
    };

    it('should generate comprehensive professional prompt', () => {
      const config = createTierPromptConfig('professional', 'investment_analysis');
      const prompt = generatePrompt(config, mockBusinessData);

      expect(prompt).toContain(PROFESSIONAL_SYSTEM_PROMPT);
      expect(prompt).toContain('## Analysis Examples');
      expect(prompt).toContain('## Current Analysis Task');
      expect(prompt).toContain('Business Data:');
      expect(prompt).toContain(JSON.stringify(mockBusinessData, null, 2));
    });

    it('should include few-shot examples in generated prompt', () => {
      const config = createTierPromptConfig('professional', 'investment_analysis');
      const prompt = generatePrompt(config, mockBusinessData);

      expect(prompt).toContain('SaaS Company Financial Analysis');
      expect(prompt).toContain('Manufacturing Company Operational Analysis');
      expect(prompt).toContain('Analysis:');
      expect(prompt).toContain('Output:');
    });

    it('should include section-specific prompts with weights', () => {
      const config = createTierPromptConfig('professional', 'investment_analysis');
      const prompt = generatePrompt(config, mockBusinessData);

      expect(prompt).toContain('Financial Performance Analysis (Weight: 30%)');
      expect(prompt).toContain('Operational Risk & Efficiency Analysis (Weight: 25%)');
      expect(prompt).toContain('Chain of Thought Process:');
    });

    it('should generate enterprise-specific prompt with advanced techniques', () => {
      const config = createTierPromptConfig('enterprise', 'strategic_analysis');
      const prompt = generatePrompt(config, mockBusinessData);

      expect(prompt).toContain('strategic consultant-level analysis');
      expect(prompt).toContain('Multi-Scenario Strategic Modeling');
      expect(prompt).toContain('Tech Platform Strategic Value Analysis');
      expect(prompt).toContain('Monte Carlo simulation');
    });

    it('should end with clear instruction', () => {
      const config = createTierPromptConfig('professional', 'investment_analysis');
      const prompt = generatePrompt(config, mockBusinessData);

      expect(prompt).toContain('Please provide your analysis following the structured output format and chain of thought reasoning.');
    });
  });

  describe('Output Validation', () => {
    it('should validate professional output correctly', () => {
      const validOutput = {
        overall_score: 85,
        financial_analysis: { score: 80 },
        operational_analysis: { efficiency_score: 75 },
        investment_thesis: 'Strong growth potential'
      };

      expect(validateOutput(validOutput, PROFESSIONAL_OUTPUT_SCHEMA)).toBe(true);
    });

    it('should reject professional output missing required fields', () => {
      const invalidOutput = {
        overall_score: 85,
        financial_analysis: { score: 80 }
        // Missing operational_analysis and investment_thesis
      };

      expect(validateOutput(invalidOutput, PROFESSIONAL_OUTPUT_SCHEMA)).toBe(false);
    });

    it('should validate enterprise output correctly', () => {
      const validOutput = {
        strategic_value_score: 90,
        value_driver_analysis: { primary_drivers: [] },
        scenario_modeling: { base_case_npv: 1000000 },
        strategic_recommendations: ['Expand market', 'Optimize operations']
      };

      expect(validateOutput(validOutput, ENTERPRISE_OUTPUT_SCHEMA)).toBe(true);
    });

    it('should handle empty or null outputs', () => {
      expect(validateOutput(null, PROFESSIONAL_OUTPUT_SCHEMA)).toBe(false);
      expect(validateOutput({}, PROFESSIONAL_OUTPUT_SCHEMA)).toBe(false);
      expect(validateOutput(undefined, ENTERPRISE_OUTPUT_SCHEMA)).toBe(false);
    });
  });

  describe('Tier Prompt Configurations', () => {
    it('should have all professional configurations', () => {
      expect(TIER_PROMPT_CONFIGS.professional).toBeDefined();
      expect(TIER_PROMPT_CONFIGS.professional.investment_analysis).toBeDefined();
      expect(TIER_PROMPT_CONFIGS.professional.operational_review).toBeDefined();
      expect(TIER_PROMPT_CONFIGS.professional.risk_assessment).toBeDefined();
    });

    it('should have all enterprise configurations', () => {
      expect(TIER_PROMPT_CONFIGS.enterprise).toBeDefined();
      expect(TIER_PROMPT_CONFIGS.enterprise.strategic_analysis).toBeDefined();
      expect(TIER_PROMPT_CONFIGS.enterprise.scenario_modeling).toBeDefined();
      expect(TIER_PROMPT_CONFIGS.enterprise.exit_planning).toBeDefined();
      expect(TIER_PROMPT_CONFIGS.enterprise.capital_optimization).toBeDefined();
    });

    it('should maintain consistent structure across all configurations', () => {
      const allConfigs = [
        ...Object.values(TIER_PROMPT_CONFIGS.professional),
        ...Object.values(TIER_PROMPT_CONFIGS.enterprise)
      ];

      allConfigs.forEach((config: TierPromptConfig) => {
        expect(config.tier).toBeTruthy();
        expect(config.analysisType).toBeTruthy();
        expect(config.sections).toBeInstanceOf(Array);
        expect(config.weights).toBeInstanceOf(Array);
        expect(config.fewShotExamples).toBeInstanceOf(Array);
        expect(config.systemPrompt).toBeTruthy();
        expect(config.outputSchema).toBeDefined();
      });
    });
  });

  describe('Chain of Thought Reasoning', () => {
    it('should provide step-by-step reasoning for professional analysis', () => {
      const financialChain = PROFESSIONAL_FINANCIAL_ANALYSIS.chainOfThought;

      expect(financialChain).toHaveLength(5);
      expect(financialChain[0]).toContain('gather and normalize');
      expect(financialChain[1]).toContain('calculate key financial metrics');
      expect(financialChain[2]).toContain('benchmark');
      expect(financialChain[3]).toContain('trends');
      expect(financialChain[4]).toContain('synthesize');
    });

    it('should provide strategic reasoning for enterprise analysis', () => {
      const strategicChain = ENTERPRISE_STRATEGIC_VALUE_ANALYSIS.chainOfThought;

      expect(strategicChain).toHaveLength(5);
      expect(strategicChain[0]).toContain('deconstructing the business model');
      expect(strategicChain[1]).toContain('strategic frameworks');
      expect(strategicChain[2]).toContain('Quantify value contribution');
      expect(strategicChain[3]).toContain('Benchmark');
      expect(strategicChain[4]).toContain('strategic recommendations');
    });

    it('should include advanced methodologies in enterprise reasoning', () => {
      const scenarioChain = ENTERPRISE_SCENARIO_MODELING.chainOfThought;

      expect(scenarioChain.join(' ')).toContain('uncertainty drivers');
      expect(scenarioChain.join(' ')).toContain('real options');
      expect(scenarioChain.join(' ')).toContain('Monte Carlo');
      expect(scenarioChain.join(' ')).toContain('sensitivity analysis');
      expect(scenarioChain.join(' ')).toContain('risk-return trade-offs');
    });
  });

  describe('Prompt Configuration Completeness', () => {
    it('should have complete weight categories for each tier', () => {
      const professionalCategories = PROFESSIONAL_TIER_WEIGHTS.map(w => w.category);
      const enterpriseCategories = ENTERPRISE_TIER_WEIGHTS.map(w => w.category);

      expect(professionalCategories).toContain('financial_performance');
      expect(professionalCategories).toContain('operational_risk_efficiency');
      expect(professionalCategories).toContain('strategic_positioning');

      expect(enterpriseCategories).toContain('strategic_value_drivers');
      expect(enterpriseCategories).toContain('multi_scenario_modeling');
      expect(enterpriseCategories).toContain('exit_strategy_optimization');
    });

    it('should have realistic weight distributions', () => {
      const professionalWeights = PROFESSIONAL_TIER_WEIGHTS.map(w => w.weight);
      const enterpriseWeights = ENTERPRISE_TIER_WEIGHTS.map(w => w.weight);

      // Check that weights are reasonable (between 0.05 and 0.35)
      professionalWeights.forEach(weight => {
        expect(weight).toBeGreaterThanOrEqual(0.05);
        expect(weight).toBeLessThanOrEqual(0.35);
      });

      enterpriseWeights.forEach(weight => {
        expect(weight).toBeGreaterThanOrEqual(0.05);
        expect(weight).toBeLessThanOrEqual(0.35);
      });
    });

    it('should have meaningful analysis section names', () => {
      expect(PROFESSIONAL_FINANCIAL_ANALYSIS.name).toContain('Financial');
      expect(PROFESSIONAL_OPERATIONAL_ANALYSIS.name).toContain('Operational');
      expect(ENTERPRISE_STRATEGIC_VALUE_ANALYSIS.name).toContain('Strategic');
      expect(ENTERPRISE_SCENARIO_MODELING.name).toContain('Scenario');
    });
  });
});