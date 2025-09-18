import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { TierValidationMiddleware } from '@/lib/middleware/tier-validation'
import { ProfessionalTierDataSchema } from '@/lib/validations/professional-tier'

/**
 * POST /api/evaluations/professional
 * Creates a new Professional tier business evaluation
 */
export async function POST(request: NextRequest) {
  try {
    // Validate Professional tier access
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'professional',
      featureType: 'analytics',
      strict: true
    })

    if (!tierResult.hasAccess) {
      return NextResponse.json(
        {
          error: 'Professional tier access required',
          current: tierResult.userTier,
          required: tierResult.requiredTier,
          upgradeUrl: tierResult.upgradeUrl
        },
        { status: 403 }
      )
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const { businessData, professionalData } = await request.json()

    if (!businessData || !professionalData) {
      return NextResponse.json(
        { error: 'Both business data and professional data are required' },
        { status: 400 }
      )
    }

    // Validate Professional tier data structure
    const dataValidation = TierValidationMiddleware.validateProfessionalData(professionalData)
    if (!dataValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Invalid professional data format',
          validationErrors: dataValidation.errors
        },
        { status: 400 }
      )
    }

    // Create Professional tier evaluation
    const evaluation = await prisma.businessEvaluation.create({
      data: {
        userId,
        businessData,
        professionalData: dataValidation.sanitizedData,
        subscriptionTier: 'professional',
        analysisDepth: 'professional',
        dataVersion: '2.0',
        valuations: {}, // Will be populated by AI analysis
        status: 'PROCESSING'
      }
    })

    // Log the creation for audit trail
    await TierValidationMiddleware.logProfessionalDataAccess(
      evaluation.id,
      userId,
      'create',
      request,
      { evaluationCreated: true, dataFields: Object.keys(professionalData).length }
    )

    return TierValidationMiddleware.createTierAwareResponse(
      evaluation,
      tierResult,
      { includeUpgradeInfo: false, includeMetadata: true }
    )

  } catch (error) {
    console.error('Failed to create Professional evaluation:', error)
    return NextResponse.json(
      { error: 'Failed to create Professional evaluation' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/evaluations/professional
 * Retrieves Professional tier evaluations for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Validate Professional tier access
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'professional',
      featureType: 'analytics'
    })

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    // Get Professional tier evaluations
    const evaluations = await prisma.businessEvaluation.findMany({
      where: {
        userId,
        subscriptionTier: 'professional',
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        businessData: true,
        professionalData: tierResult.hasAccess, // Only include if user has access
        valuations: true,
        healthScore: true,
        confidenceScore: true,
        opportunities: true,
        status: true,
        subscriptionTier: true,
        analysisDepth: true,
        dataVersion: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Filter data based on user's current tier
    const filteredEvaluations = TierValidationMiddleware.filterDataByTier(
      evaluations,
      tierResult.userTier,
      'list'
    )

    // Log access for audit trail
    if (evaluations.length > 0 && tierResult.hasAccess) {
      await TierValidationMiddleware.logProfessionalDataAccess(
        evaluations[0].id,
        userId,
        'view',
        request,
        { evaluationsAccessed: evaluations.length }
      )
    }

    return TierValidationMiddleware.createTierAwareResponse(
      filteredEvaluations,
      tierResult,
      { includeUpgradeInfo: !tierResult.hasAccess, includeMetadata: true }
    )

  } catch (error) {
    console.error('Failed to get Professional evaluations:', error)
    return NextResponse.json(
      { error: 'Failed to get Professional evaluations' },
      { status: 500 }
    )
  }
}