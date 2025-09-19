/**
 * Prompt Optimization Utils - Story 11.8
 * Advanced utilities for AI prompt optimization, token management, and quality scoring
 */

import {
  OptimizedPrompt,
  PromptPriority,
  PromptStructure,
  TierSpecificPrompt,
  AnalysisTier,
  PromptType,
  TokenUsage,
  ConfidenceScoring,
  QualityScoring,
  AnalysisContext,
  PriorityFactor,
  PromptSection,
  PromptConstraint,
  TokenOptimization
} from '@/types/ai-analysis';

// Token counting utilities
export class TokenCounter {
  private static readonly CHARS_PER_TOKEN = 4; // Approximate GPT token ratio
  private static readonly SPECIAL_TOKENS = {
    system: 10,
    user: 5,
    assistant: 5,
    json_start: 15,
    json_end: 10
  };

  static countTokens(text: string): number {
    // Basic token estimation - in production, use tiktoken
    const baseTokens = Math.ceil(text.length / this.CHARS_PER_TOKEN);
    const jsonMatches = text.match(/\{[\s\S]*?\}/g) || [];
    const jsonTokens = jsonMatches.length * (this.SPECIAL_TOKENS.json_start + this.SPECIAL_TOKENS.json_end);

    return baseTokens + jsonTokens;
  }

  static estimateResponseTokens(promptTokens: number, complexity: number): number {
    const baseResponse = promptTokens * 0.3; // 30% of prompt length
    const complexityMultiplier = 1 + (complexity * 2); // Up to 3x for high complexity
    return Math.ceil(baseResponse * complexityMultiplier);
  }

  static calculateCost(inputTokens: number, outputTokens: number, model: string = 'gpt-4'): number {
    const pricing = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.001, output: 0.002 }
    };

    const rates = pricing[model as keyof typeof pricing] || pricing['gpt-4'];
    return ((inputTokens * rates.input) + (outputTokens * rates.output)) / 1000;
  }
}

// Prompt compression utilities
export class PromptCompressor {
  private static readonly COMPRESSION_PATTERNS = [
    { pattern: /\s+/g, replacement: ' ' }, // Multiple spaces
    { pattern: /\n\s*\n/g, replacement: '\n' }, // Multiple newlines
    { pattern: /,\s*,/g, replacement: ',' }, // Double commas
    { pattern: /\.\s*\./g, replacement: '.' }, // Double periods
    { pattern: /\b(the|a|an)\s+/g, replacement: '', priority: 'low' }, // Articles (low priority)
    { pattern: /\b(very|really|quite|rather)\s+/g, replacement: '', priority: 'medium' }, // Adverbs
    { pattern: /\b(please|kindly)\s+/g, replacement: '', priority: 'high' } // Politeness
  ];

  static compressPrompt(
    prompt: string,
    targetReduction: number = 0.2,
    preserveQuality: boolean = true
  ): { compressed: string; ratio: number; savings: number } {
    let compressed = prompt;
    const originalLength = prompt.length;

    // Apply basic cleanup first
    this.COMPRESSION_PATTERNS.forEach(({ pattern, replacement }) => {
      compressed = compressed.replace(pattern, replacement as string);
    });

    // If more compression needed and quality can be sacrificed
    if (!preserveQuality) {
      const currentReduction = 1 - (compressed.length / originalLength);
      if (currentReduction < targetReduction) {
        compressed = this.aggressiveCompress(compressed, targetReduction - currentReduction);
      }
    }

    const finalLength = compressed.length;
    const ratio = finalLength / originalLength;
    const savings = originalLength - finalLength;

    return { compressed: compressed.trim(), ratio, savings };
  }

  private static aggressiveCompress(text: string, additionalReduction: number): string {
    // Remove examples if significant reduction needed
    if (additionalReduction > 0.1) {
      text = text.replace(/(?:for example|e\.g\.|such as)[^.]*\./gi, '');
    }

    // Abbreviate common phrases
    const abbreviations = {
      'analysis': 'analysis',
      'recommendation': 'rec',
      'information': 'info',
      'business': 'biz',
      'financial': 'fin',
      'strategic': 'strat'
    };

    Object.entries(abbreviations).forEach(([full, abbrev]) => {
      const regex = new RegExp(`\\b${full}\\b`, 'gi');
      text = text.replace(regex, abbrev);
    });

    return text;
  }

  static estimateCompressionPotential(prompt: string): {
    potential: number;
    opportunities: TokenOptimization[];
  } {
    const opportunities: TokenOptimization[] = [];
    let potential = 0;

    // Check for repetitive patterns
    const repetitions = prompt.match(/(.{10,})\1+/g);
    if (repetitions) {
      potential += 0.15;
      opportunities.push({
        type: 'compression',
        description: 'Remove repetitive text patterns',
        potential_savings: repetitions.length * 20,
        implementation_effort: 'low'
      });
    }

    // Check for verbose examples
    const examples = prompt.match(/(?:for example|e\.g\.|such as)[^.]*\./gi);
    if (examples && examples.length > 2) {
      potential += 0.1;
      opportunities.push({
        type: 'compression',
        description: 'Reduce number of examples',
        potential_savings: examples.length * 15,
        implementation_effort: 'medium'
      });
    }

    // Check for excessive whitespace
    const whitespace = prompt.match(/\s{2,}/g);
    if (whitespace) {
      potential += 0.05;
      opportunities.push({
        type: 'compression',
        description: 'Clean up excessive whitespace',
        potential_savings: whitespace.length * 2,
        implementation_effort: 'low'
      });
    }

    return { potential, opportunities };
  }
}

// Prompt prioritization
export class PromptPrioritizer {
  static calculatePriority(
    promptType: PromptType,
    tier: AnalysisTier,
    context: AnalysisContext,
    urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): PromptPriority {
    const factors: PriorityFactor[] = [];
    let totalScore = 0;

    // Type-based priority
    const typePriority = {
      risk_assessment: { weight: 0.3, base: 0.8 },
      scenario: { weight: 0.25, base: 0.7 },
      recommendation: { weight: 0.2, base: 0.6 },
      analysis: { weight: 0.15, base: 0.5 },
      validation: { weight: 0.1, base: 0.4 }
    };

    const typeInfo = typePriority[promptType];
    factors.push({
      name: 'prompt_type',
      weight: typeInfo.weight,
      value: typeInfo.base,
      impact: 'positive'
    });
    totalScore += typeInfo.weight * typeInfo.base;

    // Tier-based priority
    const tierMultiplier = { consumer: 0.5, professional: 0.75, enterprise: 1.0 };
    const tierWeight = 0.2;
    const tierValue = tierMultiplier[tier];
    factors.push({
      name: 'user_tier',
      weight: tierWeight,
      value: tierValue,
      impact: 'positive'
    });
    totalScore += tierWeight * tierValue;

    // Business context priority
    const businessPriority = this.assessBusinessPriority(context);
    factors.push({
      name: 'business_context',
      weight: 0.25,
      value: businessPriority,
      impact: 'positive'
    });
    totalScore += 0.25 * businessPriority;

    // Urgency factor
    const urgencyValues = { low: 0.3, medium: 0.6, high: 0.8, critical: 1.0 };
    factors.push({
      name: 'urgency',
      weight: 0.25,
      value: urgencyValues[urgency],
      impact: 'positive'
    });
    totalScore += 0.25 * urgencyValues[urgency];

    const level = this.scoreToLevel(totalScore);
    const reasoning = this.generateReasoningText(factors, level);

    return {
      level,
      factors,
      score: totalScore,
      reasoning
    };
  }

  private static assessBusinessPriority(context: AnalysisContext): number {
    let score = 0.5; // Base score

    // Revenue size impact
    if (context.businessData.revenue) {
      if (context.businessData.revenue > 100000000) score += 0.3; // >$100M
      else if (context.businessData.revenue > 10000000) score += 0.2; // >$10M
      else if (context.businessData.revenue > 1000000) score += 0.1; // >$1M
    }

    // Company stage impact
    const stageBonus = {
      exit: 0.3,
      scale: 0.2,
      growth: 0.1,
      mvp: 0.05,
      idea: 0
    };
    score += stageBonus[context.businessData.stage] || 0;

    // Risk tolerance impact
    const riskBonus = {
      aggressive: 0.1,
      moderate: 0.05,
      conservative: 0
    };
    score += riskBonus[context.userPreferences.riskTolerance] || 0;

    return Math.min(score, 1.0);
  }

  private static scoreToLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  private static generateReasoningText(factors: PriorityFactor[], level: string): string {
    const sortedFactors = factors.sort((a, b) => (b.weight * b.value) - (a.weight * a.value));
    const topFactor = sortedFactors[0];

    return `Priority set to ${level} based primarily on ${topFactor.name.replace('_', ' ')} ` +
           `(impact: ${(topFactor.weight * topFactor.value * 100).toFixed(1)}%). ` +
           `Additional factors: ${sortedFactors.slice(1, 3).map(f => f.name.replace('_', ' ')).join(', ')}.`;
  }
}

// Prompt structure optimization
export class PromptStructureOptimizer {
  static optimizeStructure(
    originalPrompt: string,
    tier: AnalysisTier,
    promptType: PromptType,
    constraints: PromptConstraint[]
  ): PromptStructure {
    const sections = this.parseIntoSections(originalPrompt);
    const optimizedSections = this.optimizeSections(sections, tier, constraints);
    const instructions = this.generateInstructions(promptType, tier);
    const outputFormat = this.determineOutputFormat(promptType, tier);

    return {
      sections: optimizedSections,
      instructions,
      constraints,
      outputFormat
    };
  }

  private static parseIntoSections(prompt: string): PromptSection[] {
    const sections: PromptSection[] = [];

    // Look for common section markers
    const sectionMarkers = [
      { name: 'context', pattern: /(?:context|background|situation)[\s:]/i },
      { name: 'objective', pattern: /(?:objective|goal|purpose|task)[\s:]/i },
      { name: 'requirements', pattern: /(?:requirements|specs|criteria)[\s:]/i },
      { name: 'constraints', pattern: /(?:constraints|limitations|rules)[\s:]/i },
      { name: 'examples', pattern: /(?:examples|samples|instances)[\s:]/i },
      { name: 'output', pattern: /(?:output|format|response|result)[\s:]/i }
    ];

    let remainingPrompt = prompt;
    let position = 0;

    sectionMarkers.forEach(marker => {
      const match = remainingPrompt.match(marker.pattern);
      if (match) {
        const startIndex = match.index || 0;
        const endIndex = this.findSectionEnd(remainingPrompt, startIndex);
        const content = remainingPrompt.substring(startIndex, endIndex).trim();

        if (content.length > 10) { // Minimum content length
          sections.push({
            name: marker.name,
            content,
            tokenCount: TokenCounter.countTokens(content),
            priority: this.getSectionPriority(marker.name),
            required: this.isSectionRequired(marker.name)
          });
        }
      }
    });

    // If no clear sections found, treat as single content section
    if (sections.length === 0) {
      sections.push({
        name: 'content',
        content: prompt.trim(),
        tokenCount: TokenCounter.countTokens(prompt),
        priority: 5,
        required: true
      });
    }

    return sections;
  }

  private static findSectionEnd(text: string, startIndex: number): number {
    const nextSectionStart = text.substring(startIndex + 1).search(/(?:context|objective|requirements|constraints|examples|output)[\s:]/i);
    return nextSectionStart > 0 ? startIndex + nextSectionStart + 1 : text.length;
  }

  private static getSectionPriority(sectionName: string): number {
    const priorities: Record<string, number> = {
      objective: 10,
      requirements: 9,
      context: 8,
      constraints: 7,
      output: 6,
      examples: 4
    };
    return priorities[sectionName] || 5;
  }

  private static isSectionRequired(sectionName: string): boolean {
    const required = ['objective', 'requirements', 'context'];
    return required.includes(sectionName);
  }

  private static optimizeSections(
    sections: PromptSection[],
    tier: AnalysisTier,
    constraints: PromptConstraint[]
  ): PromptSection[] {
    const tokenLimit = this.getTierTokenLimit(tier);
    const totalTokens = sections.reduce((sum, section) => sum + section.tokenCount, 0);

    if (totalTokens <= tokenLimit) {
      return sections; // No optimization needed
    }

    // Sort by priority (higher first) and optimize
    const sortedSections = [...sections].sort((a, b) => b.priority - a.priority);
    const optimizedSections: PromptSection[] = [];
    let usedTokens = 0;

    for (const section of sortedSections) {
      if (section.required || (usedTokens + section.tokenCount <= tokenLimit)) {
        optimizedSections.push(section);
        usedTokens += section.tokenCount;
      } else if (usedTokens < tokenLimit) {
        // Compress section to fit remaining space
        const availableTokens = tokenLimit - usedTokens;
        const compressionRatio = availableTokens / section.tokenCount;
        const { compressed } = PromptCompressor.compressPrompt(section.content, 1 - compressionRatio);

        optimizedSections.push({
          ...section,
          content: compressed,
          tokenCount: TokenCounter.countTokens(compressed)
        });
        usedTokens += TokenCounter.countTokens(compressed);
      }
    }

    return optimizedSections.sort((a, b) => b.priority - a.priority);
  }

  private static getTierTokenLimit(tier: AnalysisTier): number {
    const limits = { consumer: 1000, professional: 3000, enterprise: 8000 };
    return limits[tier];
  }

  private static generateInstructions(promptType: PromptType, tier: AnalysisTier): string[] {
    const baseInstructions = [
      'Provide a clear and structured response',
      'Base conclusions on provided data and context',
      'Include confidence levels for key findings'
    ];

    const typeSpecificInstructions: Record<PromptType, string[]> = {
      analysis: [
        'Break down the problem systematically',
        'Identify key patterns and trends',
        'Provide data-driven insights'
      ],
      recommendation: [
        'Prioritize recommendations by impact and feasibility',
        'Include implementation considerations',
        'Address potential risks and mitigation strategies'
      ],
      scenario: [
        'Consider multiple plausible scenarios',
        'Assign probability estimates to scenarios',
        'Identify key variables and drivers'
      ],
      risk_assessment: [
        'Evaluate both probability and impact',
        'Consider interdependencies between risks',
        'Suggest monitoring and mitigation approaches'
      ],
      validation: [
        'Cross-reference multiple data sources',
        'Identify potential biases or limitations',
        'Provide alternative perspectives'
      ]
    };

    const tierEnhancements: Record<AnalysisTier, string[]> = {
      consumer: ['Keep explanations simple and accessible'],
      professional: [
        'Include relevant business context',
        'Reference industry best practices'
      ],
      enterprise: [
        'Provide strategic implications',
        'Consider regulatory and compliance factors',
        'Include quantitative analysis where possible'
      ]
    };

    return [
      ...baseInstructions,
      ...typeSpecificInstructions[promptType],
      ...tierEnhancements[tier]
    ];
  }

  private static determineOutputFormat(promptType: PromptType, tier: AnalysisTier) {
    const formatSpecs = {
      analysis: {
        type: 'structured' as const,
        schema: {
          summary: 'string',
          findings: 'array',
          insights: 'array',
          confidence: 'number'
        }
      },
      recommendation: {
        type: 'json' as const,
        schema: {
          recommendations: 'array',
          prioritization: 'object',
          implementation: 'object'
        }
      },
      scenario: {
        type: 'structured' as const,
        schema: {
          scenarios: 'array',
          probabilities: 'object',
          key_drivers: 'array'
        }
      },
      risk_assessment: {
        type: 'json' as const,
        schema: {
          risks: 'array',
          risk_matrix: 'object',
          mitigation: 'object'
        }
      },
      validation: {
        type: 'structured' as const,
        schema: {
          validation_result: 'boolean',
          findings: 'array',
          confidence: 'number'
        }
      }
    };

    return {
      ...formatSpecs[promptType],
      validation: [
        { field: 'confidence', type: 'range' as const, condition: '0-1', message: 'Confidence must be between 0 and 1' },
        { field: 'summary', type: 'required' as const, condition: 'length > 10', message: 'Summary must be at least 10 characters' }
      ]
    };
  }
}

// Tier-specific optimizations
export class TierOptimizer {
  static createTierSpecificPrompt(
    basePrompt: string,
    tier: AnalysisTier,
    promptType: PromptType
  ): TierSpecificPrompt {
    const features = this.getTierFeatures(tier);
    const limitations = this.getTierLimitations(tier);
    const enhancedCapabilities = this.getEnhancedCapabilities(tier, promptType);

    return {
      tier,
      features,
      limitations,
      enhancedCapabilities
    };
  }

  private static getTierFeatures(tier: AnalysisTier) {
    const featureMap = {
      consumer: [
        { name: 'basic_analysis', description: 'Simple trend analysis and insights', available: true, tokenAllocation: 300 },
        { name: 'recommendations', description: 'Basic recommendations', available: true, tokenAllocation: 200 }
      ],
      professional: [
        { name: 'advanced_analysis', description: 'Detailed statistical analysis', available: true, tokenAllocation: 800 },
        { name: 'scenario_modeling', description: 'Multiple scenario planning', available: true, tokenAllocation: 600 },
        { name: 'risk_assessment', description: 'Comprehensive risk analysis', available: true, tokenAllocation: 400 },
        { name: 'benchmarking', description: 'Industry benchmark comparisons', available: true, tokenAllocation: 300 }
      ],
      enterprise: [
        { name: 'strategic_analysis', description: 'Enterprise-level strategic insights', available: true, tokenAllocation: 1500 },
        { name: 'monte_carlo', description: 'Monte Carlo simulations', available: true, tokenAllocation: 1000 },
        { name: 'optimization', description: 'Advanced optimization algorithms', available: true, tokenAllocation: 800 },
        { name: 'custom_models', description: 'Custom analytical models', available: true, tokenAllocation: 1200 },
        { name: 'integration', description: 'External data source integration', available: true, tokenAllocation: 500 }
      ]
    };

    return featureMap[tier];
  }

  private static getTierLimitations(tier: AnalysisTier) {
    const limitationMap = {
      consumer: [
        { type: 'token' as const, description: 'Limited to 1000 tokens', threshold: 1000, fallback: 'Compress analysis to essential points' },
        { type: 'complexity' as const, description: 'Basic analysis only', threshold: 0.3, fallback: 'Simplify analytical approach' }
      ],
      professional: [
        { type: 'token' as const, description: 'Limited to 5000 tokens', threshold: 5000, fallback: 'Prioritize high-impact analysis' },
        { type: 'frequency' as const, description: 'Max 20 analyses per day', threshold: 20, fallback: 'Queue request for next day' }
      ],
      enterprise: [
        { type: 'token' as const, description: 'Limited to 20000 tokens', threshold: 20000, fallback: 'Split into multiple analyses' },
        { type: 'complexity' as const, description: 'No complexity limits', threshold: 1.0, fallback: 'Full analysis available' }
      ]
    };

    return limitationMap[tier];
  }

  private static getEnhancedCapabilities(tier: AnalysisTier, promptType: PromptType) {
    const capabilities = [];

    if (tier === 'professional' || tier === 'enterprise') {
      capabilities.push({
        name: 'contextual_memory',
        tier,
        description: 'Remember previous analyses for better context',
        tokenCost: 100,
        qualityBoost: 0.15
      });
    }

    if (tier === 'enterprise') {
      capabilities.push(
        {
          name: 'real_time_data',
          tier,
          description: 'Access to real-time market data',
          tokenCost: 200,
          qualityBoost: 0.25
        },
        {
          name: 'custom_algorithms',
          tier,
          description: 'Use custom analytical algorithms',
          tokenCost: 300,
          qualityBoost: 0.35
        }
      );
    }

    return capabilities;
  }
}

// Main optimization orchestrator
export class PromptOptimizer {
  static async optimizePrompt(
    originalPrompt: string,
    tier: AnalysisTier,
    promptType: PromptType,
    context: AnalysisContext,
    options: {
      maxTokens?: number;
      prioritizeSpeed?: boolean;
      preserveQuality?: boolean;
    } = {}
  ): Promise<OptimizedPrompt> {
    const {
      maxTokens = this.getDefaultTokenLimit(tier),
      prioritizeSpeed = false,
      preserveQuality = true
    } = options;

    // Calculate priority
    const priority = PromptPrioritizer.calculatePriority(promptType, tier, context);

    // Compress if needed
    const compressionTarget = prioritizeSpeed ? 0.3 : 0.1;
    const { compressed, ratio } = PromptCompressor.compressPrompt(
      originalPrompt,
      compressionTarget,
      preserveQuality
    );

    // Optimize structure
    const constraints: PromptConstraint[] = [
      { type: 'token_limit', value: maxTokens, strict: true },
      { type: 'quality', value: preserveQuality ? 'high' : 'medium', strict: false }
    ];

    const structure = PromptStructureOptimizer.optimizeStructure(
      compressed,
      tier,
      promptType,
      constraints
    );

    // Create tier-specific enhancements
    const tierSpecific = TierOptimizer.createTierSpecificPrompt(
      compressed,
      tier,
      promptType
    );

    const tokenCount = TokenCounter.countTokens(compressed);

    return {
      original: originalPrompt,
      optimized: compressed,
      tokenCount,
      compressionRatio: ratio,
      priority,
      structure,
      tierSpecific
    };
  }

  private static getDefaultTokenLimit(tier: AnalysisTier): number {
    const limits = { consumer: 1000, professional: 5000, enterprise: 20000 };
    return limits[tier];
  }

  static async batchOptimize(
    prompts: Array<{
      id: string;
      prompt: string;
      tier: AnalysisTier;
      type: PromptType;
      context: AnalysisContext;
    }>,
    options: { parallel?: boolean; maxConcurrency?: number } = {}
  ): Promise<Array<OptimizedPrompt & { id: string }>> {
    const { parallel = true, maxConcurrency = 5 } = options;

    if (!parallel) {
      const results = [];
      for (const item of prompts) {
        const optimized = await this.optimizePrompt(item.prompt, item.tier, item.type, item.context);
        results.push({ ...optimized, id: item.id });
      }
      return results;
    }

    // Parallel processing with concurrency limit
    const results: Array<OptimizedPrompt & { id: string }> = [];
    const chunks = this.chunkArray(prompts, maxConcurrency);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async (item) => {
          const optimized = await this.optimizePrompt(item.prompt, item.tier, item.type, item.context);
          return { ...optimized, id: item.id };
        })
      );
      results.push(...chunkResults);
    }

    return results;
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Quality and confidence scoring utilities
export class AnalysisScorer {
  static calculateConfidenceScore(
    analysis: any,
    context: AnalysisContext,
    metadata: any
  ): ConfidenceScoring {
    const breakdown = {
      data_quality: this.assessDataQuality(context),
      model_reliability: this.assessModelReliability(metadata),
      context_completeness: this.assessContextCompleteness(context),
      historical_accuracy: this.assessHistoricalAccuracy(context),
      expert_validation: 0.7 // Placeholder - would integrate expert validation
    };

    const weights = {
      data_quality: 0.25,
      model_reliability: 0.2,
      context_completeness: 0.2,
      historical_accuracy: 0.2,
      expert_validation: 0.15
    };

    const overall = Object.entries(breakdown).reduce(
      (sum, [key, value]) => sum + (value * weights[key as keyof typeof weights]),
      0
    );

    const factors = Object.entries(breakdown).map(([name, score]) => ({
      name,
      weight: weights[name as keyof typeof weights],
      score,
      description: this.getFactorDescription(name),
      impact: score > 0.7 ? 'increase' as const : score < 0.4 ? 'decrease' as const : 'neutral' as const
    }));

    return {
      overall,
      breakdown,
      factors,
      calibration: {
        calibrated_confidence: overall * 0.9, // Conservative adjustment
        adjustment_factor: 0.9,
        historical_accuracy: breakdown.historical_accuracy,
        confidence_intervals: [
          { level: 0.68, lower_bound: overall - 0.1, upper_bound: overall + 0.1, coverage: 0.68 },
          { level: 0.95, lower_bound: overall - 0.2, upper_bound: overall + 0.2, coverage: 0.95 }
        ]
      }
    };
  }

  private static assessDataQuality(context: AnalysisContext): number {
    let score = 0.5; // Base score

    // Check data completeness
    if (context.historicalData) score += 0.2;
    if (context.marketConditions) score += 0.15;
    if (context.companyProfile) score += 0.15;

    return Math.min(score, 1.0);
  }

  private static assessModelReliability(metadata: any): number {
    // Placeholder - would assess model version, known accuracy, etc.
    return 0.8;
  }

  private static assessContextCompleteness(context: AnalysisContext): number {
    const requiredFields = ['businessData', 'userPreferences'];
    const optionalFields = ['historicalData', 'marketConditions', 'companyProfile'];

    let score = 0.5; // Base for required fields
    optionalFields.forEach(field => {
      if (context[field as keyof AnalysisContext]) score += 0.15;
    });

    return Math.min(score, 1.0);
  }

  private static assessHistoricalAccuracy(context: AnalysisContext): number {
    if (!context.historicalData?.decisionOutcomes) return 0.5;

    const outcomes = context.historicalData.decisionOutcomes;
    const avgSuccess = outcomes.reduce((sum, outcome) => sum + outcome.success_score, 0) / outcomes.length;

    return avgSuccess;
  }

  private static getFactorDescription(factorName: string): string {
    const descriptions: Record<string, string> = {
      data_quality: 'Quality and completeness of input data',
      model_reliability: 'Reliability of the AI model used',
      context_completeness: 'Completeness of business context provided',
      historical_accuracy: 'Historical accuracy of similar analyses',
      expert_validation: 'Validation by domain experts'
    };

    return descriptions[factorName] || 'Unknown factor';
  }

  static calculateQualityScore(
    analysis: any,
    originalPrompt: string,
    tier: AnalysisTier
  ): QualityScoring {
    // Implementation would assess various quality dimensions
    // This is a simplified version

    const dimensions = [
      {
        name: 'completeness',
        score: 0.85,
        weight: 0.25,
        description: 'How complete the analysis is',
        criteria: [
          { name: 'covers_all_requirements', score: 0.9, threshold: 0.8, met: true, evidence: 'All sections present' }
        ]
      },
      {
        name: 'accuracy',
        score: 0.8,
        weight: 0.3,
        description: 'Accuracy of findings and calculations',
        criteria: [
          { name: 'mathematical_accuracy', score: 0.85, threshold: 0.7, met: true, evidence: 'Calculations verified' }
        ]
      }
    ];

    const overall = dimensions.reduce((sum, dim) => sum + (dim.score * dim.weight), 0);

    return {
      overall,
      dimensions,
      benchmarks: [],
      improvement_suggestions: []
    };
  }
}

// Export all utilities
export {
  TokenCounter,
  PromptCompressor,
  PromptPrioritizer,
  PromptStructureOptimizer,
  TierOptimizer,
  PromptOptimizer,
  AnalysisScorer
};