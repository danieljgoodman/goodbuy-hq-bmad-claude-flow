/**
 * Test Suite for Tier-Specific Analysis API Route
 * Story 11.8: Enhanced AI Prompt Engineering for Tier-Specific Analysis
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { POST, GET, OPTIONS } from '../route';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  currentUser: jest.fn()
}));

jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn()
    }
  }))
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    setex: jest.fn(),
    get: jest.fn()
  }));
});

jest.mock('@/lib/audit/enterprise-audit-log', () => ({
  logAuditEvent: jest.fn()
}));

import { currentUser } from '@clerk/nextjs/server';
import { Anthropic } from '@anthropic-ai/sdk';

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

describe('/api/analysis/tier-specific', () => {
  let mockUser: any;
  let mockAnthropicInstance: any;
  let mockRedis: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default user mock
    mockUser = {
      id: 'user_123',
      publicMetadata: {
        subscriptionTier: 'professional',
        subscriptionStatus: 'active'
      }
    };

    mockCurrentUser.mockResolvedValue(mockUser);

    // Setup Anthropic mock
    mockAnthropicInstance = {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: JSON.stringify({
              summary: 'Comprehensive business analysis completed',
              keyInsights: [
                'Strong revenue growth potential',
                'Operational efficiency opportunities identified',
                'Market expansion potential in adjacent sectors'
              ],
              recommendations: [
                {
                  title: 'Optimize operational capacity',
                  description: 'Implement lean processes to improve efficiency',
                  priority: 'high',
                  timeframe: '3-6 months',
                  investmentRequired: 50000,
                  expectedROI: 3.2
                }
              ],
              financialProjections: {
                revenue: [1000000, 1200000, 1440000, 1728000, 2073600],
                profitability: [15, 18, 22, 25, 28],
                cashFlow: [150000, 216000, 316800, 432000, 580608]
              },
              riskAssessment: {
                overallRiskScore: 35,
                riskFactors: [
                  'Customer concentration risk',
                  'Market volatility'
                ],
                mitigationStrategies: [
                  'Diversify customer base',
                  'Build strategic reserves'
                ]
              },
              confidence: 85,
              dataQuality: 'good',
              limitations: ['Limited historical data for some metrics']
            })
          }],
          usage: {
            input_tokens: 1500,
            output_tokens: 800
          }
        })
      }
    };

    mockAnthropic.mockImplementation(() => mockAnthropicInstance);

    // Setup Redis mock
    const Redis = require('ioredis');
    mockRedis = new Redis();
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(3600);
    mockRedis.setex.mockResolvedValue('OK');
    mockRedis.get.mockResolvedValue(null);

    // Mock environment variables
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.REDIS_URL = 'redis://localhost:6379';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/analysis/tier-specific', () => {
    const validRequestBody = {
      analysisType: 'comprehensive' as const,
      businessData: {
        basic: {
          industry: 'Technology',
          revenue: 1000000,
          employees: 25,
          yearEstablished: 2020,
          location: 'New York, NY'
        }
      },
      parameters: {
        timeHorizon: 5,
        riskTolerance: 'moderate' as const,
        primaryObjective: 'growth' as const,
        includeProjections: true,
        includeBenchmarks: true,
        includeRecommendations: true
      },
      options: {
        async: false,
        priority: 'normal' as const,
        format: 'json' as const,
        language: 'en' as const
      }
    };

    it('should successfully process synchronous analysis for professional tier', async () => {
      const request = new NextRequest('http://localhost:3000/api/analysis/tier-specific', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('completed');
      expect(data.tier).toBe('professional');
      expect(data.results).toBeDefined();
      expect(data.results.summary).toContain('analysis');
      expect(data.results.keyInsights).toHaveLength(3);
      expect(data.results.recommendations).toHaveLength(1);
      expect(data.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should handle enterprise tier with advanced metrics', async () => {
      // Update user to enterprise tier
      mockUser.publicMetadata.subscriptionTier = 'enterprise';

      const enterpriseRequestBody = {
        ...validRequestBody,
        businessData: {
          ...validRequestBody.businessData,
          enterprise: {
            strategicValueDrivers: {
              patents: 5,
              trademarks: 3,
              hasTradeSecrets: true,
              hasCopyrights: true,
              ipPortfolioValue: 2000000,
              partnershipRevenuePercentage: 25,
              partnershipAgreementsValue: 5000000,
              brandDevelopmentInvestment: 500000,
              marketPosition: 'strong' as const,
              customerDatabaseValue: 1000000,
              customerAcquisitionCost: 500,
              competitiveAdvantages: [
                {
                  type: 'technology' as const,
                  rank: 1,
                  sustainability: 'high' as const
                }
              ]
            },
            operationalScalability: {
              processDocumentationPercentage: 80,
              keyPersonDependencyPercentage: 30,
              ownerKnowledgeConcentration: 40,
              operationalManagerCount: 5,
              operationalUtilization: 85,
              technologyInvestmentThreeYear: 500000,
              majorInfrastructureThreshold: 10000000,
              infrastructureInvestmentRequired: 200000,
              processOptimizationOpportunities: []
            },
            financialOptimization: {
              businessEntityType: 'ccorp' as const,
              taxOptimizationStrategies: 'Standard corporate tax planning',
              workingCapitalPercentage: 15,
              industryBenchmarkWorking: 20,
              workingCapitalReduction: 50000,
              debtToEquityRatio: 0.5,
              debtServiceRequirements: 100000,
              debtCapacityGrowth: 500000,
              ownerCompensation: 200000,
              marketRateCompensation: 180000,
              compensationAdjustment: 20000,
              oneTimeExpenses2024: 50000,
              oneTimeExpenses2023: 30000,
              oneTimeExpenses2022: 25000
            },
            strategicScenarioPlanning: {
              realisticGrowthRate: 25,
              marketExpansionOpportunities: [],
              conservativeScenario: {
                investmentAmount: 500000,
                revenueImpactPercentage: 15,
                timelineMonths: 12,
                riskLevel: 'low' as const
              },
              aggressiveScenario: {
                investmentAmount: 1000000,
                revenueImpactPercentage: 40,
                timelineMonths: 18,
                riskLevel: 'high' as const
              },
              acquisitionScenario: {
                investmentAmount: 2000000,
                revenueImpactPercentage: 60,
                timelineMonths: 24,
                riskLevel: 'medium' as const
              },
              preferredExitTimeline: 'five7years' as const,
              exitStrategyPreferences: [
                {
                  type: 'strategic' as const,
                  rank: 1,
                  feasibility: 'high' as const
                }
              ],
              transactionReadiness: 'mostly' as const,
              advisorsEngaged: ['broker', 'mna'],
              valueMaximizationPriorities: []
            },
            multiYearProjections: {
              baseCase: [
                { year: 2024, revenue: 1000000, grossMargin: 70, netMargin: 15, cashFlow: 150000, capex: 50000 },
                { year: 2025, revenue: 1200000, grossMargin: 72, netMargin: 18, cashFlow: 216000, capex: 60000 },
                { year: 2026, revenue: 1440000, grossMargin: 74, netMargin: 20, cashFlow: 288000, capex: 70000 },
                { year: 2027, revenue: 1728000, grossMargin: 75, netMargin: 22, cashFlow: 380160, capex: 80000 },
                { year: 2028, revenue: 2073600, grossMargin: 76, netMargin: 25, cashFlow: 518400, capex: 90000 }
              ],
              optimisticCase: [
                { year: 2024, revenue: 1100000, grossMargin: 72, netMargin: 18, cashFlow: 198000, capex: 55000 },
                { year: 2025, revenue: 1430000, grossMargin: 74, netMargin: 22, cashFlow: 314600, capex: 65000 },
                { year: 2026, revenue: 1859000, grossMargin: 76, netMargin: 25, cashFlow: 464750, capex: 75000 },
                { year: 2027, revenue: 2416700, grossMargin: 77, netMargin: 28, cashFlow: 676676, capex: 85000 },
                { year: 2028, revenue: 3141710, grossMargin: 78, netMargin: 30, cashFlow: 942513, capex: 95000 }
              ],
              conservativeCase: [
                { year: 2024, revenue: 950000, grossMargin: 68, netMargin: 12, cashFlow: 114000, capex: 45000 },
                { year: 2025, revenue: 1045000, grossMargin: 69, netMargin: 14, cashFlow: 146300, capex: 50000 },
                { year: 2026, revenue: 1149500, grossMargin: 70, netMargin: 16, cashFlow: 183920, capex: 55000 },
                { year: 2027, revenue: 1264450, grossMargin: 71, netMargin: 18, cashFlow: 227601, capex: 60000 },
                { year: 2028, revenue: 1390895, grossMargin: 72, netMargin: 20, cashFlow: 278179, capex: 65000 }
              ],
              currentGrossMargin: 70,
              projectedGrossMarginYear5: 76,
              currentNetMargin: 15,
              projectedNetMarginYear5: 25,
              maintenanceCapexPercentage: 3,
              growthCapexFiveYear: 360000,
              projectedMarketPosition: 'leader' as const,
              competitiveThreats: 'Emerging technology disruption',
              strategicOptions: []
            }
          }
        }
      };

      const request = new NextRequest('http://localhost:3000/api/analysis/tier-specific', {
        method: 'POST',
        body: JSON.stringify(enterpriseRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tier).toBe('enterprise');
      expect(data.results.advancedMetrics).toBeDefined();
    });

    it('should handle asynchronous processing', async () => {
      const asyncRequestBody = {
        ...validRequestBody,
        options: {
          ...validRequestBody.options,
          async: true,
          webhookUrl: 'https://example.com/webhook'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/analysis/tier-specific', {
        method: 'POST',
        body: JSON.stringify(asyncRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.status).toBe('processing');
      expect(data.analysisId).toMatch(/^analysis_/);
      expect(data.estimatedCompletion).toBeDefined();
    });

    it('should enforce rate limits', async () => {
      // Mock rate limit exceeded
      mockRedis.incr.mockResolvedValue(51); // Exceeds professional limit of 50

      const request = new NextRequest('http://localhost:3000/api/analysis/tier-specific', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Rate limit exceeded');
    });

    it('should validate request schema', async () => {
      const invalidRequestBody = {
        analysisType: 'invalid-type',
        businessData: {
          basic: {
            industry: '', // Invalid: empty string
            revenue: -1000, // Invalid: negative
            employees: -5, // Invalid: negative
            yearEstablished: 1700, // Invalid: too old
            location: 'NY'
          }
        }
      };

      const request = new NextRequest('http://localhost:3000/api/analysis/tier-specific', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });

    it('should require authentication', async () => {
      mockCurrentUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/analysis/tier-specific', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should handle free tier with basic analysis', async () => {
      mockUser.publicMetadata.subscriptionTier = 'free';

      const request = new NextRequest('http://localhost:3000/api/analysis/tier-specific', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tier).toBe('free');
      // Free tier should have limited features
      expect(data.results.benchmarks).toBeUndefined();
    });

    it('should handle AI service errors gracefully', async () => {
      mockAnthropicInstance.messages.create.mockRejectedValue(new Error('AI service unavailable'));

      const request = new NextRequest('http://localhost:3000/api/analysis/tier-specific', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should set proper CORS headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/analysis/tier-specific', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined();
    });
  });

  describe('GET /api/analysis/tier-specific', () => {
    const mockAnalysisResults = {
      summary: 'Test analysis results',
      keyInsights: ['Insight 1', 'Insight 2'],
      recommendations: [],
      confidence: 85,
      dataQuality: 'good',
      limitations: []
    };

    it('should retrieve cached analysis results', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(mockAnalysisResults));

      const request = new NextRequest('http://localhost:3000/api/analysis/tier-specific?analysisId=analysis_123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('completed');
      expect(data.results).toEqual(mockAnalysisResults);
    });

    it('should return 404 for non-existent analysis', async () => {
      mockRedis.get.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/analysis/tier-specific?analysisId=nonexistent');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Analysis not found or expired');
    });

    it('should require analysisId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/analysis/tier-specific');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Analysis ID required');
    });
  });

  describe('OPTIONS /api/analysis/tier-specific', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });
  });

  describe('Tier-specific behavior', () => {
    const testCases = [
      {
        tier: 'free',
        expectedFeatures: ['basic analysis', 'simple recommendations'],
        restrictedFeatures: ['benchmarks', 'advanced projections'],
        rateLimitPerHour: 5
      },
      {
        tier: 'professional',
        expectedFeatures: ['detailed analysis', 'benchmarks', 'risk assessment'],
        restrictedFeatures: ['enterprise scenarios'],
        rateLimitPerHour: 50
      },
      {
        tier: 'enterprise',
        expectedFeatures: ['comprehensive analysis', 'scenario modeling', 'advanced metrics'],
        restrictedFeatures: [],
        rateLimitPerHour: 500
      }
    ];

    testCases.forEach(({ tier, expectedFeatures, restrictedFeatures, rateLimitPerHour }) => {
      it(`should provide appropriate features for ${tier} tier`, async () => {
        mockUser.publicMetadata.subscriptionTier = tier;
        mockRedis.incr.mockResolvedValue(1); // Within rate limit

        const request = new NextRequest('http://localhost:3000/api/analysis/tier-specific', {
          method: 'POST',
          body: JSON.stringify(validRequestBody)
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.tier).toBe(tier);

        // Check that appropriate features are included based on tier
        if (tier === 'free') {
          expect(data.results.benchmarks).toBeUndefined();
          expect(data.results.riskAssessment).toBeUndefined();
        } else if (tier === 'professional') {
          expect(data.results.benchmarks).toBeDefined();
          expect(data.results.riskAssessment).toBeDefined();
        } else if (tier === 'enterprise') {
          expect(data.results.benchmarks).toBeDefined();
          expect(data.results.riskAssessment).toBeDefined();
          expect(data.results.advancedMetrics).toBeDefined();
        }
      });
    });
  });
});