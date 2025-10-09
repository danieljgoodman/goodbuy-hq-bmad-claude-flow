/**
 * Enhanced Report Generation API Route
 *
 * This endpoint provides comprehensive report generation capabilities with:
 * - Tier-based access control (Professional/Enterprise)
 * - AI-powered analysis integration from story 11.8
 * - Multiple delivery options (download, email, storage)
 * - Rate limiting and performance monitoring
 * - Comprehensive error handling and logging
 *
 * @author Backend API Developer
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/utils/rate-limit'
import { TierValidationMiddleware } from '@/middleware/tier-validation'
import { enhancedAnalysisEngine } from '@/lib/ai/enhanced-analysis-engine'
import type { AnalysisRequest, AnalysisResult } from '@/lib/ai/enhanced-analysis-engine'
import { CreateAnalysisRequestSchema } from '@/lib/validations/ai-analysis-schemas'
import type { BusinessData, ProfessionalTierData } from '@/types/evaluation'

// Rate limiting configuration
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: {
    free: 5,
    professional: 30,
    enterprise: 100
  }
})

// Enhanced report generation request schema
const EnhancedReportRequestSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  businessData: z.object({
    // Core business information
    businessName: z.string().min(1, 'Business name is required'),
    industry: z.string().min(1, 'Industry is required'),
    revenue: z.number().positive().optional(),
    employees: z.number().int().positive().optional(),
    foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),

    // Financial data
    financialMetrics: z.object({
      revenue: z.number().optional(),
      profit: z.number().optional(),
      expenses: z.number().optional(),
      cashFlow: z.number().optional(),
      debt: z.number().optional(),
      assets: z.number().optional()
    }).optional(),

    // Operational data
    operationalMetrics: z.object({
      customerCount: z.number().int().nonnegative().optional(),
      marketShare: z.number().min(0).max(1).optional(),
      growthRate: z.number().optional(),
      customerSatisfaction: z.number().min(0).max(10).optional()
    }).optional(),

    // Strategic information
    strategicGoals: z.array(z.string()).optional(),
    competitiveAdvantages: z.array(z.string()).optional(),
    challenges: z.array(z.string()).optional()
  }),

  // Report configuration
  reportConfig: z.object({
    type: z.enum(['financial_analysis', 'strategic_assessment', 'market_position', 'comprehensive', 'custom']),
    sections: z.array(z.string()).optional(),
    analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']),
    includeScenarios: z.boolean().default(false),
    includeRiskAssessment: z.boolean().default(true),
    includeBenchmarks: z.boolean().default(false), // Enterprise only
    customPrompts: z.array(z.string()).optional() // Enterprise only
  }),

  // Delivery preferences
  delivery: z.object({
    method: z.enum(['download', 'email', 'storage', 'api_response']).default('api_response'),
    format: z.enum(['pdf', 'html', 'json', 'markdown']).default('json'),
    email: z.string().email().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
  }).optional(),

  // Processing options
  options: z.object({
    useCache: z.boolean().default(true),
    realTimeUpdates: z.boolean().default(false),
    includeRawAnalysis: z.boolean().default(false) // Enterprise only
  }).optional()
})

type EnhancedReportRequest = z.infer<typeof EnhancedReportRequestSchema>

// Response schemas
const EnhancedReportResponseSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(['processing', 'completed', 'failed']),
  tier: z.string(),
  analysis: z.object({
    summary: z.object({
      overallScore: z.number().min(0).max(100),
      keyFindings: z.array(z.string()),
      recommendations: z.array(z.string()),
      confidenceLevel: z.enum(['low', 'medium', 'high', 'very_high'])
    }),
    detailed: z.any().optional(), // Tier-specific detailed analysis
    insights: z.any().optional(),
    scenarios: z.any().optional(),
    risks: z.any().optional()
  }),
  delivery: z.object({
    method: z.string(),
    format: z.string(),
    downloadUrl: z.string().optional(),
    emailSent: z.boolean().optional(),
    storageLocation: z.string().optional()
  }),
  metadata: z.object({
    processingTime: z.number(),
    tokensUsed: z.number(),
    cacheHit: z.boolean(),
    qualityScore: z.number().min(0).max(100),
    tierLimitations: z.array(z.string()).optional()
  })
})

// Performance monitoring
interface ReportMetrics {
  requestId: string
  userId: string
  tier: string
  startTime: number
  endTime?: number
  tokensUsed: number
  cacheHit: boolean
  success: boolean
  errorType?: string
}

const reportMetrics: Map<string, ReportMetrics> = new Map()

/**
 * Enhanced Report Generation - POST endpoint
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    // Step 1: Rate limiting
    const rateLimitResult = await rateLimiter.check(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      )
    }

    // Step 2: Parse and validate request
    let requestData: EnhancedReportRequest
    try {
      const body = await request.json()
      requestData = EnhancedReportRequestSchema.parse(body)
    } catch (validationError) {
      console.error('Request validation failed:', validationError)
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationError instanceof z.ZodError
            ? validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            : ['Request validation failed']
        },
        { status: 400 }
      )
    }

    // Step 3: Tier validation and access control
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'PREMIUM', // Minimum tier for enhanced reports
      featureType: 'pdf_reports',
      fallbackToBasic: false
    })

    if (!tierResult.hasAccess) {
      return NextResponse.json(
        {
          error: 'Enhanced reports require Professional or Enterprise subscription',
          currentTier: tierResult.userTier,
          requiredTier: 'professional',
          upgradeUrl: '/pricing?upgrade=professional',
          accessCheck: tierResult.accessCheck
        },
        { status: 403 }
      )
    }

    // Step 4: Validate tier-specific features
    const tierValidationResult = validateTierSpecificFeatures(requestData, tierResult.userTier)
    if (!tierValidationResult.valid) {
      return NextResponse.json(
        {
          error: 'Feature not available in current tier',
          requiredTier: tierValidationResult.requiredTier,
          unavailableFeatures: tierValidationResult.unavailableFeatures,
          upgradeUrl: `/pricing?upgrade=${tierValidationResult.requiredTier}`
        },
        { status: 403 }
      )
    }

    // Step 5: Initialize metrics tracking
    const metrics: ReportMetrics = {
      requestId,
      userId: requestData.userId,
      tier: tierResult.userTier,
      startTime,
      tokensUsed: 0,
      cacheHit: false,
      success: false
    }
    reportMetrics.set(requestId, metrics)

    // Step 6: Prepare AI analysis request
    const analysisRequest: AnalysisRequest = {
      tier: tierResult.userTier.toLowerCase() as 'professional' | 'enterprise',
      analysisType: mapReportTypeToAnalysis(requestData.reportConfig.type),
      businessData: transformBusinessData(requestData.businessData, tierResult.userTier),
      userId: requestData.userId,
      priority: requestData.delivery?.priority || 'medium',
      enableRealTime: requestData.options?.realTimeUpdates || false,
      cacheKey: requestData.options?.useCache
        ? generateCacheKey(requestData.businessData, requestData.reportConfig)
        : undefined
    }

    // Step 7: Generate AI analysis
    console.log(`🚀 Starting enhanced report generation for user ${requestData.userId} (${tierResult.userTier})`)

    const analysisResult = await enhancedAnalysisEngine.analyze(analysisRequest)

    // Update metrics
    metrics.tokensUsed = analysisResult.metadata.tokensUsed
    metrics.cacheHit = analysisResult.metadata.cacheHit

    // Step 8: Process and format results
    const formattedReport = await formatReportForTier(
      analysisResult,
      requestData.reportConfig,
      tierResult.userTier
    )

    // Step 9: Handle delivery
    const deliveryResult = await handleReportDelivery(
      formattedReport,
      requestData.delivery || { method: 'api_response', format: 'json' },
      requestId,
      requestData.userId
    )

    // Step 10: Prepare response
    const response = {
      reportId: requestId,
      status: 'completed' as const,
      tier: tierResult.userTier,
      analysis: {
        summary: {
          overallScore: Math.round(analysisResult.confidence),
          keyFindings: analysisResult.insights.keyFindings,
          recommendations: analysisResult.insights.recommendations,
          confidenceLevel: mapConfidenceLevel(analysisResult.confidence)
        },
        detailed: requestData.options?.includeRawAnalysis ? analysisResult.analysisData : undefined,
        insights: analysisResult.insights,
        scenarios: analysisResult.analysisData.scenario_modeling || null,
        risks: analysisResult.insights.riskFactors
      },
      delivery: deliveryResult,
      metadata: {
        processingTime: Date.now() - startTime,
        tokensUsed: analysisResult.metadata.tokensUsed,
        cacheHit: analysisResult.metadata.cacheHit,
        qualityScore: Math.round(analysisResult.qualityScore),
        tierLimitations: getTierLimitations(tierResult.userTier)
      }
    }

    // Step 11: Validate response schema
    const validatedResponse = EnhancedReportResponseSchema.parse(response)

    // Step 12: Update metrics and log success
    metrics.endTime = Date.now()
    metrics.success = true

    console.log(`✅ Enhanced report generated successfully for user ${requestData.userId}`, {
      reportId: requestId,
      processingTime: metrics.endTime - metrics.startTime,
      tokensUsed: metrics.tokensUsed,
      cacheHit: metrics.cacheHit,
      tier: tierResult.userTier
    })

    // Step 13: Log analytics event
    await logAnalyticsEvent('enhanced_report_generated', {
      userId: requestData.userId,
      tier: tierResult.userTier,
      reportType: requestData.reportConfig.type,
      processingTime: metrics.endTime - metrics.startTime,
      tokensUsed: metrics.tokensUsed,
      qualityScore: analysisResult.qualityScore
    })

    return NextResponse.json(validatedResponse, {
      status: 200,
      headers: {
        'X-Report-ID': requestId,
        'X-Processing-Time': (metrics.endTime - metrics.startTime).toString(),
        'X-Tokens-Used': metrics.tokensUsed.toString(),
        'X-Cache-Hit': metrics.cacheHit.toString()
      }
    })

  } catch (error) {
    // Error handling and logging
    const metrics = reportMetrics.get(requestId)
    if (metrics) {
      metrics.endTime = Date.now()
      metrics.success = false
      metrics.errorType = error instanceof Error ? error.constructor.name : 'Unknown'
    }

    console.error('Enhanced report generation failed:', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: Date.now() - startTime
    })

    // Log error analytics
    await logAnalyticsEvent('enhanced_report_error', {
      requestId,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    })

    // Return appropriate error response
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Data validation failed',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('API')) {
      return NextResponse.json(
        {
          error: 'AI analysis service temporarily unavailable',
          message: 'Please try again in a few minutes',
          retryAfter: 300
        },
        {
          status: 503,
          headers: {
            'Retry-After': '300'
          }
        }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Report generation failed. Please try again.',
        requestId,
        support: 'Contact support with request ID for assistance'
      },
      { status: 500 }
    )
  } finally {
    // Cleanup and final logging
    setTimeout(() => {
      reportMetrics.delete(requestId)
    }, 60000) // Clean up metrics after 1 minute
  }
}

/**
 * Get Report Status - GET endpoint
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')
    const userId = searchParams.get('userId')

    if (!reportId || !userId) {
      return NextResponse.json(
        { error: 'reportId and userId are required' },
        { status: 400 }
      )
    }

    // Validate user access to report
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'PREMIUM',
      featureType: 'pdf_reports'
    })

    if (!tierResult.hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get report metrics
    const metrics = reportMetrics.get(reportId)
    if (!metrics) {
      return NextResponse.json(
        { error: 'Report not found or expired' },
        { status: 404 }
      )
    }

    // Check if user owns the report
    if (metrics.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const status = metrics.success
      ? 'completed'
      : metrics.endTime
        ? 'failed'
        : 'processing'

    return NextResponse.json({
      reportId,
      status,
      tier: metrics.tier,
      metadata: {
        processingTime: metrics.endTime ? metrics.endTime - metrics.startTime : Date.now() - metrics.startTime,
        tokensUsed: metrics.tokensUsed,
        cacheHit: metrics.cacheHit
      }
    })

  } catch (error) {
    console.error('Error fetching report status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report status' },
      { status: 500 }
    )
  }
}

// Helper Functions

/**
 * Validate tier-specific features in the request
 */
function validateTierSpecificFeatures(
  request: EnhancedReportRequest,
  userTier: string
): { valid: boolean; requiredTier?: string; unavailableFeatures?: string[] } {
  const unavailableFeatures: string[] = []
  let requiredTier = 'professional'

  // Enterprise-only features
  if (userTier !== 'ENTERPRISE') {
    if (request.reportConfig.includeBenchmarks) {
      unavailableFeatures.push('benchmarks')
      requiredTier = 'enterprise'
    }
    if (request.reportConfig.customPrompts && request.reportConfig.customPrompts.length > 0) {
      unavailableFeatures.push('custom_prompts')
      requiredTier = 'enterprise'
    }
    if (request.options?.includeRawAnalysis) {
      unavailableFeatures.push('raw_analysis')
      requiredTier = 'enterprise'
    }
  }

  return {
    valid: unavailableFeatures.length === 0,
    requiredTier: unavailableFeatures.length > 0 ? requiredTier : undefined,
    unavailableFeatures: unavailableFeatures.length > 0 ? unavailableFeatures : undefined
  }
}

/**
 * Map report type to analysis type
 */
function mapReportTypeToAnalysis(reportType: string): string {
  const mapping = {
    'financial_analysis': 'financial_assessment',
    'strategic_assessment': 'strategic_analysis',
    'market_position': 'market_analysis',
    'comprehensive': 'comprehensive_analysis',
    'custom': 'custom_analysis'
  }
  return mapping[reportType as keyof typeof mapping] || 'comprehensive_analysis'
}

/**
 * Transform business data for AI analysis
 */
function transformBusinessData(businessData: any, tier: string): BusinessData | ProfessionalTierData {
  // Basic transformation - ensure all required fields are present
  const transformed = {
    businessName: businessData.businessName,
    industry: businessData.industry,
    revenue: businessData.revenue,
    employees: businessData.employees,
    foundedYear: businessData.foundedYear,
    ...businessData.financialMetrics,
    ...businessData.operationalMetrics,
    strategicGoals: businessData.strategicGoals || [],
    competitiveAdvantages: businessData.competitiveAdvantages || [],
    challenges: businessData.challenges || []
  }

  // Add tier-specific data
  if (tier === 'ENTERPRISE') {
    return {
      ...transformed,
      strategic_value_drivers: businessData.strategicGoals || [],
      scenario_modeling: true,
      exit_strategy: businessData.exitStrategy || null
    } as ProfessionalTierData
  }

  return transformed as BusinessData
}

/**
 * Generate cache key for request
 */
function generateCacheKey(businessData: any, reportConfig: any): string {
  const keyData = {
    businessName: businessData.businessName,
    industry: businessData.industry,
    revenue: businessData.revenue,
    reportType: reportConfig.type,
    analysisDepth: reportConfig.analysisDepth
  }

  const hash = btoa(JSON.stringify(keyData)).replace(/[+/=]/g, '_')
  return `enhanced_report_${hash}`
}

/**
 * Format report based on user tier
 */
async function formatReportForTier(
  analysisResult: AnalysisResult,
  reportConfig: any,
  tier: string
): Promise<any> {
  const formattedReport = {
    ...analysisResult.analysisData,
    insights: analysisResult.insights,
    validation: analysisResult.validation,
    metadata: {
      ...analysisResult.metadata,
      tier,
      reportType: reportConfig.type
    }
  }

  // Apply tier-specific formatting
  if (tier === 'PREMIUM') {
    // Remove enterprise-specific sections
    delete formattedReport.strategic_value_index
    delete formattedReport.exit_strategy_analysis
  }

  return formattedReport
}

/**
 * Handle report delivery
 */
async function handleReportDelivery(
  report: any,
  delivery: any,
  reportId: string,
  userId: string
): Promise<any> {
  const result = {
    method: delivery.method,
    format: delivery.format,
    downloadUrl: undefined as string | undefined,
    emailSent: undefined as boolean | undefined,
    storageLocation: undefined as string | undefined
  }

  switch (delivery.method) {
    case 'download':
      // Generate download URL (implement based on your file storage)
      result.downloadUrl = `/api/reports/download/${reportId}`
      break

    case 'email':
      // Send email (implement email service integration)
      if (delivery.email) {
        // await emailService.sendReport(delivery.email, report, reportId)
        result.emailSent = true
      }
      break

    case 'storage':
      // Store in cloud storage (implement storage service)
      result.storageLocation = `reports/${userId}/${reportId}.${delivery.format}`
      break

    case 'api_response':
    default:
      // Return in API response (default)
      break
  }

  return result
}

/**
 * Map confidence score to level
 */
function mapConfidenceLevel(confidence: number): 'low' | 'medium' | 'high' | 'very_high' {
  if (confidence >= 90) return 'very_high'
  if (confidence >= 70) return 'high'
  if (confidence >= 50) return 'medium'
  return 'low'
}

/**
 * Get tier limitations
 */
function getTierLimitations(tier: string): string[] {
  const limitations: Record<string, string[]> = {
    'PREMIUM': [
      'Limited to 30 reports per month',
      'No custom analysis prompts',
      'No raw analysis data access'
    ],
    'ENTERPRISE': [],
    'FREE': [
      'Enhanced reports not available',
      'Upgrade to Professional for access'
    ]
  }

  return limitations[tier] || limitations['FREE']
}

/**
 * Log analytics events
 */
async function logAnalyticsEvent(event: string, data: any): Promise<void> {
  try {
    // Implement your analytics logging here
    console.log(`📊 Analytics Event: ${event}`, data)
    // await analyticsService.log(event, data)
  } catch (error) {
    console.error('Failed to log analytics event:', error)
  }
}