import { UserTierService } from '@/lib/services/user-tier-service'
import { PremiumAccessService } from '@/lib/services/PremiumAccessService'
import { TierValidationMiddleware } from '@/middleware/tier-validation'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { SubscriptionTier } from '@/types/subscription'

const checkAccessSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  featureType: z.enum(['ai_guides', 'progress_tracking', 'pdf_reports', 'analytics', 'benchmarks', 'priority_support', 'basic_evaluation', 'basic_reports', 'basic_analytics', 'professional_evaluation', 'advanced_analytics', 'export_data', 'enterprise_evaluation', 'multi_user', 'api_access', 'custom_branding', 'dedicated_support', 'sla_guarantee']),
  requiredTier: z.enum(['BASIC', 'PROFESSIONAL', 'ENTERPRISE']).optional().default('PROFESSIONAL'),
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { userId, featureType, requiredTier } = checkAccessSchema.parse(body)

    // Primary: Use the new UserTierService for tier-based access control
    const [tierResult, hasFeatureAccess] = await Promise.all([
      UserTierService.getUserTier(userId),
      UserTierService.hasFeatureAccess(userId, featureType, requiredTier as SubscriptionTier)
    ])

    // Secondary: Use middleware for additional validation
    let middlewareResult = null
    try {
      middlewareResult = await TierValidationMiddleware.validateTier(request, {
        requiredTier: requiredTier as any,
        featureType: featureType as any,
        fallbackToBasic: false
      })
    } catch (middlewareError) {
      console.warn('Middleware validation failed:', middlewareError)
    }

    // Legacy support: Keep original service for backward compatibility
    let legacyResult = null
    try {
      legacyResult = await PremiumAccessService.checkPremiumAccess(
        userId,
        featureType as any,
        requiredTier as any
      )
    } catch (legacyError) {
      console.warn('Legacy service check failed:', legacyError)
    }

    const executionTime = Date.now() - startTime

    // Determine final access decision based on new service
    const hasAccess = hasFeatureAccess && ['ACTIVE', 'TRIALING'].includes(tierResult.status)

    return NextResponse.json({
      success: true,
      hasAccess,
      userTier: tierResult.tier,
      userStatus: tierResult.status,
      isTrialing: tierResult.isTrialing,
      features: tierResult.features,
      trialEndsAt: tierResult.trialEndsAt,
      subscriptionEndsAt: tierResult.subscriptionEndsAt,
      executionTime,
      source: tierResult.source,
      // Additional validation results for comparison
      middleware: middlewareResult ? {
        hasAccess: middlewareResult.hasAccess,
        userTier: middlewareResult.userTier,
        accessCheck: middlewareResult.accessCheck
      } : null,
      legacy: legacyResult,
      // Access decision breakdown
      accessAnalysis: {
        tierCheck: tierResult.tier,
        featureAvailable: tierResult.features.includes(featureType),
        statusValid: ['ACTIVE', 'TRIALING'].includes(tierResult.status),
        tierHierarchyMet: await UserTierService.canAccessTier(userId, requiredTier as SubscriptionTier)
      }
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('Error checking premium access:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors,
          executionTime
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to check premium access',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const featureType = searchParams.get('featureType') as any
    const requiredTier = (searchParams.get('requiredTier') as any) || 'PROFESSIONAL'

    if (!userId || !featureType) {
      return NextResponse.json(
        {
          error: 'User ID and feature type are required',
          executionTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    const validatedData = checkAccessSchema.parse({
      userId,
      featureType,
      requiredTier,
    })

    // Primary: Use the new UserTierService
    const [tierResult, hasFeatureAccess] = await Promise.all([
      UserTierService.getUserTier(validatedData.userId),
      UserTierService.hasFeatureAccess(validatedData.userId, validatedData.featureType, validatedData.requiredTier as SubscriptionTier)
    ])

    // Secondary: Use middleware for additional validation
    let middlewareResult = null
    try {
      middlewareResult = await TierValidationMiddleware.validateTier(request, {
        requiredTier: validatedData.requiredTier as any,
        featureType: validatedData.featureType as any,
        fallbackToBasic: false
      })
    } catch (middlewareError) {
      console.warn('Middleware validation failed:', middlewareError)
    }

    // Legacy support
    let legacyResult = null
    try {
      legacyResult = await PremiumAccessService.checkPremiumAccess(
        validatedData.userId,
        validatedData.featureType as any,
        validatedData.requiredTier as any
      )
    } catch (legacyError) {
      console.warn('Legacy service check failed:', legacyError)
    }

    const executionTime = Date.now() - startTime
    const hasAccess = hasFeatureAccess && ['ACTIVE', 'TRIALING'].includes(tierResult.status)

    return NextResponse.json({
      success: true,
      hasAccess,
      userTier: tierResult.tier,
      userStatus: tierResult.status,
      isTrialing: tierResult.isTrialing,
      features: tierResult.features,
      trialEndsAt: tierResult.trialEndsAt,
      subscriptionEndsAt: tierResult.subscriptionEndsAt,
      executionTime,
      source: tierResult.source,
      middleware: middlewareResult ? {
        hasAccess: middlewareResult.hasAccess,
        userTier: middlewareResult.userTier,
        accessCheck: middlewareResult.accessCheck
      } : null,
      legacy: legacyResult,
      accessAnalysis: {
        tierCheck: tierResult.tier,
        featureAvailable: tierResult.features.includes(validatedData.featureType),
        statusValid: ['ACTIVE', 'TRIALING'].includes(tierResult.status),
        tierHierarchyMet: await UserTierService.canAccessTier(validatedData.userId, validatedData.requiredTier as SubscriptionTier)
      }
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('Error checking premium access:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: error.errors,
          executionTime
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to check premium access',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: 500 }
    )
  }
}