/**
 * Tier-Specific AI Analysis API Route
 * Story 11.8: Enhanced AI Prompt Engineering for Tier-Specific Analysis
 *
 * Provides sophisticated AI-driven analysis tailored to user's subscription tier
 * with comprehensive error handling, rate limiting, and webhook support.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { Anthropic } from '@anthropic-ai/sdk';
import { headers } from 'next/headers';
import Redis from 'ioredis';
import crypto from 'crypto';

// Import validation schemas and utilities
import { EnterpriseTierDataSchema, validateEnterpriseTierData } from '@/lib/validations/enterprise-tier';
import { EnterpriseAnalytics } from '@/lib/analytics/enterprise-calculations';
import { logAuditEvent } from '@/lib/audit/enterprise-audit-log';

// Initialize AI client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Initialize Redis for rate limiting and caching
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Request validation schema
const AnalysisRequestSchema = z.object({
  // Analysis configuration
  analysisType: z.enum([
    'comprehensive',
    'strategic',
    'financial',
    'operational',
    'market',
    'risk',
    'valuation',
    'exit-planning'
  ]),

  // Data inputs
  businessData: z.object({
    basic: z.object({
      industry: z.string().min(1).max(100),
      revenue: z.number().min(0),
      employees: z.number().min(0),
      yearEstablished: z.number().min(1800).max(2024),
      location: z.string().min(1).max(100)
    }),
    enterprise: EnterpriseTierDataSchema.optional()
  }),

  // Analysis parameters
  parameters: z.object({
    timeHorizon: z.number().min(1).max(10).default(5),
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).default('moderate'),
    primaryObjective: z.enum(['growth', 'profitability', 'exit', 'optimization']).default('growth'),
    includeProjections: z.boolean().default(true),
    includeBenchmarks: z.boolean().default(true),
    includeRecommendations: z.boolean().default(true)
  }),

  // Execution options
  options: z.object({
    async: z.boolean().default(false),
    webhookUrl: z.string().url().optional(),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
    format: z.enum(['json', 'pdf', 'excel']).default('json'),
    language: z.enum(['en', 'es', 'fr', 'de']).default('en')
  })
});

type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

// Response schema
const AnalysisResponseSchema = z.object({
  analysisId: z.string(),
  status: z.enum(['processing', 'completed', 'failed']),
  tier: z.enum(['free', 'professional', 'enterprise']),
  results: z.object({
    summary: z.string(),
    keyInsights: z.array(z.string()),
    recommendations: z.array(z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      timeframe: z.string(),
      investmentRequired: z.number().optional(),
      expectedROI: z.number().optional()
    })),
    financialProjections: z.object({
      revenue: z.array(z.number()),
      profitability: z.array(z.number()),
      cashFlow: z.array(z.number()),
      valuation: z.number().optional()
    }).optional(),
    riskAssessment: z.object({
      overallRiskScore: z.number().min(0).max(100),
      riskFactors: z.array(z.string()),
      mitigationStrategies: z.array(z.string())
    }).optional(),
    benchmarks: z.object({
      industryAverages: z.record(z.number()),
      competitivePosition: z.string(),
      performanceGaps: z.array(z.string())
    }).optional(),
    confidence: z.number().min(0).max(100),
    dataQuality: z.enum(['excellent', 'good', 'fair', 'poor']),
    limitations: z.array(z.string())
  }).optional(),
  metadata: z.object({
    processingTime: z.number(),
    tokenUsage: z.number(),
    modelVersion: z.string(),
    timestamp: z.string(),
    expiresAt: z.string()
  }),
  links: z.object({
    downloadPdf: z.string().optional(),
    downloadExcel: z.string().optional(),
    shareLink: z.string().optional()
  }).optional()
});

// Rate limiting configuration by tier
const RATE_LIMITS = {
  free: { requests: 5, window: 3600 }, // 5 requests per hour
  professional: { requests: 50, window: 3600 }, // 50 requests per hour
  enterprise: { requests: 500, window: 3600 } // 500 requests per hour
};

// Tier-specific prompt templates
const PROMPT_TEMPLATES = {
  free: {
    system: "You are a business analyst providing basic business insights. Focus on fundamental analysis and general recommendations.",
    maxTokens: 2000
  },
  professional: {
    system: "You are a senior business consultant providing professional-grade analysis. Include detailed financial analysis, strategic recommendations, and industry benchmarks.",
    maxTokens: 4000
  },
  enterprise: {
    system: "You are an elite management consultant providing executive-level strategic analysis. Deliver comprehensive insights with advanced financial modeling, scenario analysis, and strategic options evaluation.",
    maxTokens: 8000
  }
};

/**
 * Validate user authentication and get tier
 */
async function validateUserAndGetTier(): Promise<{ userId: string; tier: string; user: any }> {
  const user = await currentUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  const metadata = user.publicMetadata as any;
  const tier = metadata?.subscriptionTier || 'free';

  return { userId: user.id, tier, user };
}

/**
 * Check rate limits
 */
async function checkRateLimit(userId: string, tier: string): Promise<void> {
  const limits = RATE_LIMITS[tier as keyof typeof RATE_LIMITS];
  const key = `rate_limit:analysis:${userId}`;

  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, limits.window);
  }

  if (current > limits.requests) {
    const ttl = await redis.ttl(key);
    throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(ttl / 60)} minutes.`);
  }
}

/**
 * Generate tier-specific AI analysis
 */
async function generateAIAnalysis(
  request: AnalysisRequest,
  tier: string,
  userId: string
): Promise<any> {
  const template = PROMPT_TEMPLATES[tier as keyof typeof PROMPT_TEMPLATES];

  // Build context-aware prompt
  const prompt = buildAnalysisPrompt(request, tier);

  try {
    const startTime = Date.now();

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: template.maxTokens,
      system: template.system,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const processingTime = Date.now() - startTime;
    const content = response.content[0];

    if (content.type !== 'text') {
      throw new Error('Unexpected response format from AI');
    }

    // Parse AI response
    const analysisResults = parseAIResponse(content.text, tier);

    // Enhance with tier-specific calculations
    if (tier === 'enterprise' && request.businessData.enterprise) {
      analysisResults.advancedMetrics = await generateAdvancedMetrics(
        request.businessData.enterprise
      );
    }

    return {
      ...analysisResults,
      metadata: {
        processingTime,
        tokenUsage: response.usage?.input_tokens + response.usage?.output_tokens || 0,
        modelVersion: "claude-3-5-sonnet",
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }
    };

  } catch (error) {
    console.error('AI analysis error:', error);
    throw new Error('Failed to generate AI analysis');
  }
}

/**
 * Build tier-specific analysis prompt
 */
function buildAnalysisPrompt(request: AnalysisRequest, tier: string): string {
  const { businessData, parameters, analysisType } = request;

  let prompt = `Please analyze the following business and provide ${analysisType} insights:\n\n`;

  // Basic business information
  prompt += `Business Overview:\n`;
  prompt += `- Industry: ${businessData.basic.industry}\n`;
  prompt += `- Annual Revenue: $${businessData.basic.revenue.toLocaleString()}\n`;
  prompt += `- Employees: ${businessData.basic.employees}\n`;
  prompt += `- Established: ${businessData.basic.yearEstablished}\n`;
  prompt += `- Location: ${businessData.basic.location}\n\n`;

  // Tier-specific data inclusion
  if (tier === 'enterprise' && businessData.enterprise) {
    prompt += `Enterprise Strategic Data:\n`;
    prompt += JSON.stringify(businessData.enterprise, null, 2);
    prompt += `\n\n`;
  }

  // Analysis parameters
  prompt += `Analysis Parameters:\n`;
  prompt += `- Time Horizon: ${parameters.timeHorizon} years\n`;
  prompt += `- Risk Tolerance: ${parameters.riskTolerance}\n`;
  prompt += `- Primary Objective: ${parameters.primaryObjective}\n\n`;

  // Tier-specific instructions
  if (tier === 'free') {
    prompt += `Provide a basic analysis focusing on:\n`;
    prompt += `- High-level business assessment\n`;
    prompt += `- 3-5 key recommendations\n`;
    prompt += `- General industry insights\n`;
  } else if (tier === 'professional') {
    prompt += `Provide a professional analysis including:\n`;
    prompt += `- Detailed financial analysis\n`;
    prompt += `- Strategic recommendations with implementation timelines\n`;
    prompt += `- Industry benchmarking\n`;
    prompt += `- Risk assessment\n`;
    prompt += `- Growth projections\n`;
  } else if (tier === 'enterprise') {
    prompt += `Provide an executive-level analysis including:\n`;
    prompt += `- Comprehensive strategic analysis\n`;
    prompt += `- Advanced financial modeling and projections\n`;
    prompt += `- Scenario analysis with multiple outcomes\n`;
    prompt += `- Competitive positioning and market analysis\n`;
    prompt += `- Exit strategy recommendations\n`;
    prompt += `- Value optimization strategies\n`;
    prompt += `- Investment and acquisition opportunities\n`;
  }

  prompt += `\nPlease format your response as a structured JSON object with the following sections:\n`;
  prompt += `- summary: Executive summary\n`;
  prompt += `- keyInsights: Array of key insights\n`;
  prompt += `- recommendations: Array of actionable recommendations\n`;

  if (parameters.includeProjections) {
    prompt += `- financialProjections: Revenue, profitability, and cash flow projections\n`;
  }

  if (parameters.includeBenchmarks && tier !== 'free') {
    prompt += `- benchmarks: Industry comparisons and competitive analysis\n`;
  }

  if (tier !== 'free') {
    prompt += `- riskAssessment: Risk factors and mitigation strategies\n`;
  }

  prompt += `- confidence: Confidence level (0-100)\n`;
  prompt += `- dataQuality: Assessment of data quality\n`;
  prompt += `- limitations: Analysis limitations\n`;

  return prompt;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(aiResponse: string, tier: string): any {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback: Create structured response from text
    return {
      summary: aiResponse.substring(0, 500),
      keyInsights: ["Analysis completed successfully"],
      recommendations: [{
        title: "Review Analysis",
        description: "Please review the generated analysis",
        priority: "medium" as const,
        timeframe: "immediate"
      }],
      confidence: 75,
      dataQuality: "good" as const,
      limitations: ["Response parsing required fallback method"]
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error('Failed to parse AI analysis response');
  }
}

/**
 * Generate advanced metrics for enterprise tier
 */
async function generateAdvancedMetrics(enterpriseData: any): Promise<any> {
  try {
    // Validate enterprise data
    const validationResult = validateEnterpriseTierData(enterpriseData);
    if (!validationResult.isValid) {
      return { validationErrors: validationResult.errors };
    }

    // Calculate advanced analytics
    const metrics = {
      strategicValueScore: calculateStrategicValueScore(enterpriseData),
      operationalEfficiencyIndex: calculateOperationalEfficiency(enterpriseData),
      financialOptimizationScore: calculateFinancialOptimization(enterpriseData),
      exitReadinessScore: calculateExitReadiness(enterpriseData),
      scenarioAnalysis: generateScenarioAnalysis(enterpriseData)
    };

    return metrics;
  } catch (error) {
    console.error('Error generating advanced metrics:', error);
    return { error: 'Failed to generate advanced metrics' };
  }
}

/**
 * Calculate strategic value score
 */
function calculateStrategicValueScore(data: any): number {
  const { strategicValueDrivers } = data;

  let score = 0;

  // IP portfolio value (0-25 points)
  if (strategicValueDrivers.ipPortfolioValue > 10000000) score += 25;
  else if (strategicValueDrivers.ipPortfolioValue > 1000000) score += 15;
  else if (strategicValueDrivers.ipPortfolioValue > 100000) score += 10;
  else if (strategicValueDrivers.ipPortfolioValue > 0) score += 5;

  // Market position (0-25 points)
  const positionScores = { leader: 25, strong: 20, niche: 15, emerging: 10 };
  score += positionScores[strategicValueDrivers.marketPosition as keyof typeof positionScores] || 0;

  // Competitive advantages (0-25 points)
  score += Math.min(strategicValueDrivers.competitiveAdvantages.length * 5, 25);

  // Partnership revenue (0-25 points)
  if (strategicValueDrivers.partnershipRevenuePercentage > 50) score += 25;
  else if (strategicValueDrivers.partnershipRevenuePercentage > 30) score += 20;
  else if (strategicValueDrivers.partnershipRevenuePercentage > 15) score += 15;
  else if (strategicValueDrivers.partnershipRevenuePercentage > 0) score += 10;

  return Math.min(score, 100);
}

/**
 * Calculate operational efficiency index
 */
function calculateOperationalEfficiency(data: any): number {
  const { operationalScalability } = data;

  let score = 0;

  // Process documentation (0-30 points)
  score += (operationalScalability.processDocumentationPercentage / 100) * 30;

  // Key person dependency (0-20 points) - lower is better
  score += ((100 - operationalScalability.keyPersonDependencyPercentage) / 100) * 20;

  // Operational utilization (0-25 points)
  if (operationalScalability.operationalUtilization > 120) score += 25;
  else if (operationalScalability.operationalUtilization > 100) score += 20;
  else if (operationalScalability.operationalUtilization > 80) score += 15;
  else score += 10;

  // Technology investment (0-25 points)
  if (operationalScalability.technologyInvestmentThreeYear > 1000000) score += 25;
  else if (operationalScalability.technologyInvestmentThreeYear > 500000) score += 20;
  else if (operationalScalability.technologyInvestmentThreeYear > 100000) score += 15;
  else if (operationalScalability.technologyInvestmentThreeYear > 0) score += 10;

  return Math.min(score, 100);
}

/**
 * Calculate financial optimization score
 */
function calculateFinancialOptimization(data: any): number {
  const { financialOptimization } = data;

  let score = 0;

  // Working capital efficiency (0-30 points)
  if (financialOptimization.workingCapitalPercentage < 10) score += 30;
  else if (financialOptimization.workingCapitalPercentage < 20) score += 25;
  else if (financialOptimization.workingCapitalPercentage < 30) score += 20;
  else score += 10;

  // Debt management (0-25 points)
  if (financialOptimization.debtToEquityRatio < 1) score += 25;
  else if (financialOptimization.debtToEquityRatio < 2) score += 20;
  else if (financialOptimization.debtToEquityRatio < 5) score += 15;
  else score += 5;

  // Tax optimization (0-20 points)
  if (financialOptimization.taxOptimizationStrategies.length > 500) score += 20;
  else if (financialOptimization.taxOptimizationStrategies.length > 200) score += 15;
  else if (financialOptimization.taxOptimizationStrategies.length > 0) score += 10;

  // Compensation alignment (0-25 points)
  const compensationRatio = financialOptimization.ownerCompensation / Math.max(financialOptimization.marketRateCompensation, 1);
  if (compensationRatio > 0.8 && compensationRatio < 1.2) score += 25;
  else if (compensationRatio > 0.6 && compensationRatio < 1.5) score += 20;
  else score += 10;

  return Math.min(score, 100);
}

/**
 * Calculate exit readiness score
 */
function calculateExitReadiness(data: any): number {
  const { strategicScenarioPlanning } = data;

  let score = 0;

  // Transaction readiness (0-40 points)
  const readinessScores = { ready: 40, mostly: 30, some: 20, significant: 10 };
  score += readinessScores[strategicScenarioPlanning.transactionReadiness as keyof typeof readinessScores] || 0;

  // Advisors engaged (0-30 points)
  score += Math.min(strategicScenarioPlanning.advisorsEngaged.length * 5, 30);

  // Exit strategy clarity (0-30 points)
  score += Math.min(strategicScenarioPlanning.exitStrategyPreferences.length * 5, 30);

  return Math.min(score, 100);
}

/**
 * Generate scenario analysis
 */
function generateScenarioAnalysis(data: any): any {
  const { strategicScenarioPlanning, multiYearProjections } = data;

  return {
    baseCase: {
      description: "Most likely scenario based on current trajectory",
      probability: 0.6,
      projectedValue: calculateScenarioValue(multiYearProjections.baseCase),
      keyDrivers: ["Current growth rate", "Market conditions", "Operational efficiency"]
    },
    optimisticCase: {
      description: "Best case scenario with favorable conditions",
      probability: 0.2,
      projectedValue: calculateScenarioValue(multiYearProjections.optimisticCase),
      keyDrivers: ["Market expansion", "Operational optimization", "Strategic partnerships"]
    },
    conservativeCase: {
      description: "Conservative scenario with market challenges",
      probability: 0.2,
      projectedValue: calculateScenarioValue(multiYearProjections.conservativeCase),
      keyDrivers: ["Market contraction", "Increased competition", "Economic headwinds"]
    }
  };
}

/**
 * Calculate scenario value
 */
function calculateScenarioValue(projections: any[]): number {
  const finalYear = projections[projections.length - 1];
  const multiple = finalYear.netMargin > 20 ? 8 : finalYear.netMargin > 10 ? 6 : 4;
  return finalYear.revenue * (finalYear.netMargin / 100) * multiple;
}

/**
 * Process webhook notification
 */
async function sendWebhookNotification(
  webhookUrl: string,
  analysisId: string,
  status: string,
  results?: any
): Promise<void> {
  try {
    const payload = {
      analysisId,
      status,
      timestamp: new Date().toISOString(),
      results: status === 'completed' ? results : undefined
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoodBuy-Analysis-Service/1.0'
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Webhook notification failed:', error);
    // Don't throw - webhook failures shouldn't fail the main request
  }
}

/**
 * Main POST handler
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // Set CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Validate authentication and get user tier
    const { userId, tier, user } = await validateUserAndGetTier();

    // Parse and validate request
    const body = await request.json();
    const validatedRequest = AnalysisRequestSchema.parse(body);

    // Check rate limits
    await checkRateLimit(userId, tier);

    // Log audit event
    await logAuditEvent({
      userId,
      action: 'analysis_requested',
      resource: 'tier_specific_analysis',
      details: {
        analysisType: validatedRequest.analysisType,
        tier,
        requestId
      }
    });

    const analysisId = `analysis_${requestId}`;

    // Handle async processing
    if (validatedRequest.options.async) {
      // Start background processing
      processAnalysisAsync(validatedRequest, tier, userId, analysisId);

      return NextResponse.json({
        analysisId,
        status: 'processing',
        tier,
        estimatedCompletion: new Date(Date.now() + (tier === 'enterprise' ? 300000 : 60000)).toISOString(),
        message: 'Analysis started. You will receive a webhook notification when complete.',
        metadata: {
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }, {
        status: 202,
        headers: corsHeaders
      });
    }

    // Synchronous processing
    const results = await generateAIAnalysis(validatedRequest, tier, userId);

    // Cache results
    await redis.setex(
      `analysis_results:${analysisId}`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify(results)
    );

    // Log successful completion
    await logAuditEvent({
      userId,
      action: 'analysis_completed',
      resource: 'tier_specific_analysis',
      details: {
        analysisId,
        tier,
        processingTime: Date.now() - startTime
      }
    });

    const response = {
      analysisId,
      status: 'completed' as const,
      tier,
      results,
      metadata: {
        ...results.metadata,
        requestId,
        totalProcessingTime: Date.now() - startTime
      }
    };

    return NextResponse.json(response, { headers: corsHeaders });

  } catch (error) {
    console.error('Analysis API error:', error);

    // Log error event
    try {
      const { userId } = await validateUserAndGetTier();
      await logAuditEvent({
        userId,
        action: 'analysis_failed',
        resource: 'tier_specific_analysis',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          requestId
        }
      });
    } catch {
      // Ignore logging errors during error handling
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors,
        requestId
      }, { status: 400 });
    }

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({
          error: 'Authentication required',
          requestId
        }, { status: 401 });
      }

      if (error.message.includes('Rate limit exceeded')) {
        return NextResponse.json({
          error: error.message,
          requestId
        }, { status: 429 });
      }
    }

    return NextResponse.json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your analysis request',
      requestId
    }, { status: 500 });
  }
}

/**
 * Handle OPTIONS for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * GET handler for retrieving analysis results
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, tier } = await validateUserAndGetTier();
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');

    if (!analysisId) {
      return NextResponse.json({
        error: 'Analysis ID required'
      }, { status: 400 });
    }

    // Retrieve cached results
    const cachedResults = await redis.get(`analysis_results:${analysisId}`);

    if (!cachedResults) {
      return NextResponse.json({
        error: 'Analysis not found or expired'
      }, { status: 404 });
    }

    const results = JSON.parse(cachedResults);

    return NextResponse.json({
      analysisId,
      status: 'completed',
      tier,
      results,
      metadata: {
        retrievedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Analysis retrieval error:', error);

    return NextResponse.json({
      error: 'Failed to retrieve analysis'
    }, { status: 500 });
  }
}

/**
 * Background async processing
 */
async function processAnalysisAsync(
  request: AnalysisRequest,
  tier: string,
  userId: string,
  analysisId: string
): Promise<void> {
  try {
    const results = await generateAIAnalysis(request, tier, userId);

    // Cache results
    await redis.setex(
      `analysis_results:${analysisId}`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify(results)
    );

    // Send webhook notification
    if (request.options.webhookUrl) {
      await sendWebhookNotification(
        request.options.webhookUrl,
        analysisId,
        'completed',
        results
      );
    }

    // Log completion
    await logAuditEvent({
      userId,
      action: 'analysis_completed_async',
      resource: 'tier_specific_analysis',
      details: { analysisId, tier }
    });

  } catch (error) {
    console.error('Async analysis processing error:', error);

    // Send failure webhook
    if (request.options.webhookUrl) {
      await sendWebhookNotification(
        request.options.webhookUrl,
        analysisId,
        'failed'
      );
    }

    // Log failure
    await logAuditEvent({
      userId,
      action: 'analysis_failed_async',
      resource: 'tier_specific_analysis',
      details: {
        analysisId,
        tier,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}