/**
 * Tests for Enhanced AI Analysis Engine
 * Story 11.8: Enhanced AI Prompt Engineering for Tier-Specific Analysis
 */

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import {
  EnhancedAnalysisEngine,
  enhancedAnalysisEngine,
  type AnalysisRequest,
  type AnalysisResult,
  type AnalysisError,
  type TokenOptimization,
  type QualityMetrics
} from '../enhanced-analysis-engine';
import { handleClaudeRequest } from '@/lib/services/claude-api-real';
import { createTierPromptConfig } from '../tier-specific-prompts';

// Mock dependencies
vi.mock('@/lib/services/claude-api-real', () => ({
  handleClaudeRequest: vi.fn()
}));

vi.mock('@/lib/config', () => ({
  config: {
    anthropic: {
      apiKey: 'test-api-key'
    }
  }
}));

vi.mock('../tier-specific-prompts', () => ({
  createTierPromptConfig: vi.fn(),
  generatePrompt: vi.fn(),
  validateOutput: vi.fn(),
  TIER_PROMPT_CONFIGS: {
    professional: {
      investment_analysis: { tier: 'professional', analysisType: 'investment_analysis' }
    },
    enterprise: {
      strategic_analysis: { tier: 'enterprise', analysisType: 'strategic_analysis' }
    }
  }
}));

const mockHandleClaudeRequest = handleClaudeRequest as MockedFunction<typeof handleClaudeRequest>;
const mockCreateTierPromptConfig = createTierPromptConfig as MockedFunction<typeof createTierPromptConfig>;

describe('EnhancedAnalysisEngine', () => {
  let engine: EnhancedAnalysisEngine;

  const mockBusinessData = {
    annualRevenue: 10000000,
    grossProfit: 7500000,
    employees: 50,
    industry: 'Technology'
  };

  const mockAnalysisRequest: AnalysisRequest = {
    tier: 'professional',
    analysisType: 'investment_analysis',
    businessData: mockBusinessData,
    userId: 'test-user-123',
    priority: 'medium'
  };

  const mockTierConfig = {
    tier: 'professional' as const,
    analysisType: 'investment_analysis',
    sections: [
      {
        name: 'Financial Analysis',
        weight: 0.5,
        prompt: 'Analyze financial performance',
        chainOfThought: ['Step 1', 'Step 2'],
        outputFormat: '{"score": 85}'
      }
    ],
    weights: [],
    fewShotExamples: [],
    systemPrompt: 'You are a financial analyst',
    outputSchema: {
      type: 'object',
      required: ['overall_score', 'financial_analysis']
    }
  };

  beforeEach(() => {
    engine = new EnhancedAnalysisEngine();
    vi.clearAllMocks();

    mockCreateTierPromptConfig.mockReturnValue(mockTierConfig);
    mockHandleClaudeRequest.mockResolvedValue({
      analysisText: JSON.stringify({
        overall_score: 85,
        financial_analysis: { score: 80, revenue_growth: 0.15 },
        operational_analysis: { efficiency_score: 75 },
        investment_thesis: 'Strong growth potential'
      }),
      fallback: false
    });
  });

  afterEach(() => {
    engine.clearCache();
  });

  describe('Engine Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(engine).toBeInstanceOf(EnhancedAnalysisEngine);
      expect(engine.getCacheStats().size).toBe(0);
    });

    it('should start cache cleanup interval', () => {
      const spy = vi.spyOn(global, 'setInterval');
      new EnhancedAnalysisEngine();
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 60 * 60 * 1000);
    });
  });

  describe('Basic Analysis', () => {
    it('should perform successful professional tier analysis', async () => {
      const result = await engine.analyze(mockAnalysisRequest);

      expect(result.status).toBe('completed');
      expect(result.tier).toBe('professional');
      expect(result.analysisData.overall_score).toBe(85);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.qualityScore).toBeGreaterThan(0);
    });

    it('should handle enterprise tier analysis', async () => {
      const enterpriseRequest: AnalysisRequest = {
        ...mockAnalysisRequest,
        tier: 'enterprise',
        analysisType: 'strategic_analysis'
      };

      mockCreateTierPromptConfig.mockReturnValue({
        ...mockTierConfig,
        tier: 'enterprise',
        analysisType: 'strategic_analysis'
      });

      mockHandleClaudeRequest.mockResolvedValue({
        analysisText: JSON.stringify({
          strategic_value_score: 90,
          value_driver_analysis: { primary_drivers: [] },
          scenario_modeling: { base_case_npv: 1000000 },
          strategic_recommendations: ['Expand market']
        }),
        fallback: false
      });

      const result = await engine.analyze(enterpriseRequest);

      expect(result.status).toBe('completed');
      expect(result.tier).toBe('enterprise');
      expect(result.analysisData.strategic_value_score).toBe(90);
    });

    it('should generate unique analysis IDs', async () => {
      const result1 = await engine.analyze(mockAnalysisRequest);
      const result2 = await engine.analyze(mockAnalysisRequest);

      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).toContain('analysis_professional_investment_analysis');
      expect(result2.id).toContain('analysis_professional_investment_analysis');
    });

    it('should track processing time', async () => {
      const result = await engine.analyze(mockAnalysisRequest);

      expect(result.metadata.processingTime).toBeGreaterThan(0);
      expect(result.metadata.timestamp).toBeInstanceOf(Date);
    });

    it('should estimate token usage', async () => {
      const result = await engine.analyze(mockAnalysisRequest);

      expect(result.metadata.tokensUsed).toBeGreaterThan(0);
      expect(typeof result.metadata.tokensUsed).toBe('number');
    });
  });

  describe('Error Handling and Retries', () => {
    it('should handle API errors with retry logic', async () => {
      mockHandleClaudeRequest
        .mockRejectedValueOnce(new Error('API timeout'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          analysisText: JSON.stringify({ overall_score: 75 }),
          fallback: false
        });

      const result = await engine.analyze(mockAnalysisRequest);

      expect(result.status).toBe('completed');
      expect(mockHandleClaudeRequest).toHaveBeenCalledTimes(3);
    });

    it('should fail after maximum retries', async () => {
      mockHandleClaudeRequest.mockRejectedValue(new Error('Persistent API error'));

      await expect(engine.analyze(mockAnalysisRequest)).rejects.toThrow();
      expect(mockHandleClaudeRequest).toHaveBeenCalledTimes(3);
    });

    it('should handle invalid configuration errors', async () => {
      mockCreateTierPromptConfig.mockReturnValue(null as any);

      await expect(engine.analyze(mockAnalysisRequest)).rejects.toThrow('No configuration found');
    });

    it('should handle invalid request data', async () => {
      const invalidRequest = {
        ...mockAnalysisRequest,
        tier: 'invalid-tier' as any
      };

      await expect(engine.analyze(invalidRequest)).rejects.toThrow('Invalid tier specified');
    });

    it('should handle missing business data', async () => {
      const invalidRequest = {
        ...mockAnalysisRequest,
        businessData: undefined as any
      };

      await expect(engine.analyze(invalidRequest)).rejects.toThrow('Business data is required');
    });

    it('should handle fallback responses from Claude API', async () => {
      mockHandleClaudeRequest.mockResolvedValue({
        analysisText: 'Fallback response',
        fallback: true
      });

      await expect(engine.analyze(mockAnalysisRequest)).rejects.toThrow('Claude API unavailable');
    });
  });

  describe('Caching Functionality', () => {
    it('should cache successful analysis results', async () => {
      const cacheKey = 'test-cache-key';
      const requestWithCache = { ...mockAnalysisRequest, cacheKey };

      const result1 = await engine.analyze(requestWithCache);
      expect(result1.metadata.cacheHit).toBe(false);

      const result2 = await engine.analyze(requestWithCache);
      expect(result2.metadata.cacheHit).toBe(true);
      expect(result2.id).toBe(result1.id);

      // Should only call Claude API once
      expect(mockHandleClaudeRequest).toHaveBeenCalledTimes(1);
    });

    it('should not cache low-quality results', async () => {
      // Mock low quality response
      mockHandleClaudeRequest.mockResolvedValue({
        analysisText: JSON.stringify({ overall_score: 30 }), // Low score
        fallback: false
      });

      const result1 = await engine.analyze(mockAnalysisRequest);
      const result2 = await engine.analyze(mockAnalysisRequest);

      expect(result1.metadata.cacheHit).toBe(false);
      expect(result2.metadata.cacheHit).toBe(false);
      expect(mockHandleClaudeRequest).toHaveBeenCalledTimes(2);
    });

    it('should provide cache statistics', async () => {
      await engine.analyze({ ...mockAnalysisRequest, cacheKey: 'key1' });
      await engine.analyze({ ...mockAnalysisRequest, cacheKey: 'key2' });

      const stats = engine.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.totalAccess).toBe(2);
      expect(stats.avgAge).toBeGreaterThanOrEqual(0);
    });

    it('should clear cache by pattern', async () => {
      await engine.analyze({ ...mockAnalysisRequest, cacheKey: 'test-key-1' });
      await engine.analyze({ ...mockAnalysisRequest, cacheKey: 'other-key-1' });

      engine.clearCache('test-*');

      const stats = engine.getCacheStats();
      expect(stats.size).toBe(1); // Only 'other-key-1' should remain
    });

    it('should handle cache expiry', async () => {
      const engine = new EnhancedAnalysisEngine();

      // Mock expired cache entry
      const mockExpiredEntry = {
        key: 'expired-key',
        result: { id: 'test', status: 'completed' } as AnalysisResult,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        accessCount: 1,
        lastAccessed: new Date()
      };

      // Access private cache to add expired entry
      (engine as any).cache.set('expired-key', mockExpiredEntry);

      const result = await engine.getAnalysisStatus('test');
      expect(result).toBeNull(); // Should not return expired entry
    });
  });

  describe('Real-time Analysis', () => {
    it('should support real-time analysis with callbacks', async () => {
      const callbacks: AnalysisResult[] = [];
      const callback = (result: AnalysisResult) => callbacks.push(result);

      const analysisId = await engine.analyzeRealTime(mockAnalysisRequest, callback);

      expect(analysisId).toBeTruthy();
      expect(analysisId).toContain('analysis_professional');

      // Wait a bit for async completion
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(callbacks.length).toBeGreaterThan(0);
    });

    it('should handle real-time subscription management', () => {
      const callback = vi.fn();
      const unsubscribe = engine.subscribeToUpdates('test-id', callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      // After unsubscribe, callback should not be called
    });

    it('should notify subscribers on analysis completion', async () => {
      const callback = vi.fn();
      engine.subscribeToUpdates('test-analysis-id', callback);

      const requestWithRealTime = { ...mockAnalysisRequest, enableRealTime: true };
      await engine.analyze(requestWithRealTime);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Batch Analysis', () => {
    it('should process multiple analysis requests', async () => {
      const requests = [
        { ...mockAnalysisRequest, userId: 'user1' },
        { ...mockAnalysisRequest, userId: 'user2' },
        { ...mockAnalysisRequest, userId: 'user3' }
      ];

      const results = await engine.analyzeBatch(requests);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.status).toBe('completed');
      });
    });

    it('should handle mixed success and failure in batch', async () => {
      mockHandleClaudeRequest
        .mockResolvedValueOnce({ analysisText: JSON.stringify({ overall_score: 80 }), fallback: false })
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({ analysisText: JSON.stringify({ overall_score: 75 }), fallback: false });

      const requests = [
        { ...mockAnalysisRequest, userId: 'user1' },
        { ...mockAnalysisRequest, userId: 'user2' },
        { ...mockAnalysisRequest, userId: 'user3' }
      ];

      const results = await engine.analyzeBatch(requests);

      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('completed');
      expect(results[1].status).toBe('failed');
      expect(results[2].status).toBe('completed');
    });
  });

  describe('Data Optimization', () => {
    it('should optimize business data for professional tier', async () => {
      const largeBusinessData = {
        ...mockBusinessData,
        description: 'A'.repeat(1000), // Long description
        metadata: { internal: 'notes' }, // Should be excluded
        strategic_value_drivers: 'Important data' // Should be kept for enterprise
      };

      const requestWithLargeData = {
        ...mockAnalysisRequest,
        businessData: largeBusinessData
      };

      await engine.analyze(requestWithLargeData);

      // Verify Claude was called with optimized data
      expect(mockHandleClaudeRequest).toHaveBeenCalled();
      const callArgs = mockHandleClaudeRequest.mock.calls[0][0];
      expect(callArgs.businessData).toBeDefined();
    });

    it('should apply different optimization for enterprise tier', async () => {
      const enterpriseRequest = {
        ...mockAnalysisRequest,
        tier: 'enterprise' as const,
        businessData: {
          ...mockBusinessData,
          strategic_value_drivers: 'Very important strategic data',
          metadata: 'Should be excluded'
        }
      };

      mockCreateTierPromptConfig.mockReturnValue({
        ...mockTierConfig,
        tier: 'enterprise'
      });

      await engine.analyze(enterpriseRequest);

      expect(mockHandleClaudeRequest).toHaveBeenCalled();
    });
  });

  describe('Analysis Result Processing', () => {
    it('should extract meaningful insights from analysis data', async () => {
      const detailedAnalysisData = {
        overall_score: 85,
        financial_analysis: { score: 80, revenue_growth: 0.15 },
        operational_analysis: { efficiency_score: 75, improvement_opportunities: ['Automation', 'Training'] },
        strategic_positioning: { strategic_risks: ['Competition', 'Market changes'] },
        recommendations: ['Improve operations', 'Expand market'],
        investment_thesis: 'Strong growth company with solid fundamentals'
      };

      mockHandleClaudeRequest.mockResolvedValue({
        analysisText: JSON.stringify(detailedAnalysisData),
        fallback: false
      });

      const result = await engine.analyze(mockAnalysisRequest);

      expect(result.insights.keyFindings).toContain('Overall business health: 85/100');
      expect(result.insights.keyFindings).toContain('Strong growth company with solid fundamentals');
      expect(result.insights.recommendations).toContain('Improve operations');
      expect(result.insights.riskFactors).toContain('Competition');
      expect(result.insights.opportunities).toContain('Automation');
    });

    it('should validate analysis results', async () => {
      const validAnalysisData = {
        overall_score: 85,
        financial_analysis: { score: 80 },
        operational_analysis: { efficiency_score: 75 },
        investment_thesis: 'Good investment'
      };

      mockHandleClaudeRequest.mockResolvedValue({
        analysisText: JSON.stringify(validAnalysisData),
        fallback: false
      });

      const result = await engine.analyze(mockAnalysisRequest);

      expect(result.validation.isValid).toBe(true);
      expect(result.validation.errors).toHaveLength(0);
      expect(result.validation.completeness).toBe(100);
    });

    it('should handle invalid analysis responses', async () => {
      const invalidAnalysisData = {
        overall_score: 85
        // Missing required fields
      };

      mockHandleClaudeRequest.mockResolvedValue({
        analysisText: JSON.stringify(invalidAnalysisData),
        fallback: false
      });

      const result = await engine.analyze(mockAnalysisRequest);

      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(0);
      expect(result.validation.completeness).toBeLessThan(100);
    });
  });

  describe('Quality and Confidence Scoring', () => {
    it('should calculate quality scores based on analysis completeness', async () => {
      const result = await engine.analyze(mockAnalysisRequest);

      expect(result.qualityScore).toBeGreaterThan(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
    });

    it('should calculate confidence scores based on tier and data', async () => {
      const result = await engine.analyze(mockAnalysisRequest);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should provide higher confidence for enterprise tier', async () => {
      const professionalResult = await engine.analyze(mockAnalysisRequest);

      const enterpriseRequest = { ...mockAnalysisRequest, tier: 'enterprise' as const };
      mockCreateTierPromptConfig.mockReturnValue({
        ...mockTierConfig,
        tier: 'enterprise'
      });

      const enterpriseResult = await engine.analyze(enterpriseRequest);

      expect(enterpriseResult.confidence).toBeGreaterThanOrEqual(professionalResult.confidence);
    });
  });

  describe('Analysis Status and Monitoring', () => {
    it('should track analysis status', async () => {
      const result = await engine.analyze(mockAnalysisRequest);
      const status = await engine.getAnalysisStatus(result.id);

      expect(status).not.toBeNull();
      expect(status?.id).toBe(result.id);
      expect(status?.status).toBe('completed');
    });

    it('should return null for non-existent analysis', async () => {
      const status = await engine.getAnalysisStatus('non-existent-id');
      expect(status).toBeNull();
    });
  });

  describe('Response Parsing', () => {
    it('should parse valid JSON responses', async () => {
      const jsonResponse = JSON.stringify({
        overall_score: 85,
        financial_analysis: { score: 80 },
        operational_analysis: { efficiency_score: 75 },
        investment_thesis: 'Strong growth potential'
      });

      mockHandleClaudeRequest.mockResolvedValue({
        analysisText: jsonResponse,
        fallback: false
      });

      const result = await engine.analyze(mockAnalysisRequest);

      expect(result.status).toBe('completed');
      expect(result.analysisData.overall_score).toBe(85);
    });

    it('should handle malformed JSON with fallback parsing', async () => {
      const malformedResponse = 'Overall score: 85\nFinancial analysis shows good performance\nRecommendations:\n- Improve efficiency\n- Expand market';

      mockHandleClaudeRequest.mockResolvedValue({
        analysisText: malformedResponse,
        fallback: false
      });

      const result = await engine.analyze(mockAnalysisRequest);

      expect(result.status).toBe('completed');
      expect(result.analysisData).toBeDefined();
    });

    it('should create fallback analysis when parsing fails', async () => {
      mockHandleClaudeRequest.mockResolvedValue({
        analysisText: 'Completely unparseable response ###',
        fallback: false
      });

      const result = await engine.analyze(mockAnalysisRequest);

      expect(result.status).toBe('completed');
      expect(result.analysisData.overall_score).toBeDefined();
      expect(result.analysisData.investment_thesis).toBeDefined();
    });
  });

  describe('Singleton Instance', () => {
    it('should provide singleton instance', () => {
      expect(enhancedAnalysisEngine).toBeInstanceOf(EnhancedAnalysisEngine);
    });

    it('should maintain state across singleton access', async () => {
      await enhancedAnalysisEngine.analyze({ ...mockAnalysisRequest, cacheKey: 'singleton-test' });

      const stats = enhancedAnalysisEngine.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });
  });
});