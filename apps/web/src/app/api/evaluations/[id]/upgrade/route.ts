import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { TierValidationMiddleware } from '@/lib/middleware/tier-validation'

/**
 * POST /api/evaluations/[id]/upgrade
 * Upgrades an existing evaluation to Professional tier
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const evaluationId = params.id
    const { targetTier, professionalData, userConsent } = await request.json()

    // Validate required fields
    if (!targetTier || !professionalData || !userConsent) {
      return NextResponse.json(
        { error: 'Missing required fields: targetTier, professionalData, userConsent' },
        { status: 400 }
      )
    }

    // Validate user consent for Professional tier
    if (!userConsent.dataProcessing || !userConsent.enhancedAnalytics || !userConsent.auditLogging) {
      return NextResponse.json(
        { error: 'All consent fields must be accepted for Professional tier upgrade' },
        { status: 400 }
      )
    }

    // Validate tier upgrade request
    const upgradeValidation = await TierValidationMiddleware.validateTierUpgrade(
      userId,
      evaluationId,
      targetTier,
      professionalData
    )

    if (!upgradeValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Tier upgrade validation failed',
          validationErrors: upgradeValidation.errors,
          canUpgrade: upgradeValidation.canUpgrade
        },
        { status: 400 }
      )
    }

    // Get existing evaluation
    const existingEvaluation = await prisma.businessEvaluation.findFirst({
      where: {
        id: evaluationId,
        userId,
        deletedAt: null
      }
    })

    if (!existingEvaluation) {
      return NextResponse.json(
        { error: 'Evaluation not found or access denied' },
        { status: 404 }
      )
    }

    // Validate Professional tier data
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

    // Perform tier upgrade
    const upgradedEvaluation = await prisma.businessEvaluation.update({
      where: { id: evaluationId },
      data: {
        professionalData: dataValidation.sanitizedData,
        subscriptionTier: targetTier,
        analysisDepth: targetTier,
        dataVersion: '2.0',
        updatedAt: new Date()
      }
    })

    // Create detailed audit log entry for the upgrade
    await prisma.professionalDataAudit.create({
      data: {
        businessEvaluationId: evaluationId,
        userId,
        changeType: 'tier_upgraded',
        previousData: existingEvaluation.professionalData,
        newData: dataValidation.sanitizedData,
        changedFields: ['tier_upgrade', 'professional_data'],
        userAgent: request.headers.get('user-agent'),
        ipAddress: getClientIpAddress(request),
        sessionId: getSessionId(request),
        requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
      }
    })

    // Log the upgrade for compliance
    await TierValidationMiddleware.logProfessionalDataAccess(
      evaluationId,
      userId,
      'update',
      request,
      {
        upgradeType: 'tier_upgrade',
        fromTier: existingEvaluation.subscriptionTier,
        toTier: targetTier,
        userConsent,
        timestamp: new Date().toISOString()
      }
    )

    // Validate tier result for response
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: targetTier as 'professional' | 'enterprise'
    })

    return TierValidationMiddleware.createTierAwareResponse(
      {
        ...upgradedEvaluation,
        upgrade: {
          successful: true,
          fromTier: existingEvaluation.subscriptionTier,
          toTier: targetTier,
          upgradedAt: new Date().toISOString(),
          userConsent
        }
      },
      tierResult,
      { includeMetadata: true }
    )

  } catch (error) {
    console.error('Failed to upgrade evaluation tier:', error)
    return NextResponse.json(
      { error: 'Failed to upgrade evaluation tier' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/evaluations/[id]/upgrade
 * Checks if an evaluation can be upgraded and returns upgrade options
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const evaluationId = params.id

    // Get evaluation details
    const evaluation = await prisma.businessEvaluation.findFirst({
      where: {
        id: evaluationId,
        userId,
        deletedAt: null
      }
    })

    if (!evaluation) {
      return NextResponse.json(
        { error: 'Evaluation not found or access denied' },
        { status: 404 }
      )
    }

    // Check current user tier
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'basic'
    })

    // Determine available upgrade options
    const upgradeOptions = []

    if (tierResult.userTier === 'basic') {
      upgradeOptions.push({
        targetTier: 'professional',
        benefits: [
          '45+ detailed business analysis fields',
          'Advanced financial metrics and KPIs',
          'Customer analytics and segmentation',
          'Market intelligence and competitor analysis',
          'Financial planning and forecasting',
          'Compliance and risk management tools',
          'Enhanced valuation methodologies',
          'Priority support'
        ],
        requirements: [
          'Professional subscription active',
          'Enhanced data processing consent',
          'Audit logging consent'
        ],
        estimatedUpgradeTime: '5-10 minutes',
        dataRequirements: {
          financialMetrics: 15,
          customerAnalytics: 8,
          operationalEfficiency: 7,
          marketIntelligence: 6,
          financialPlanning: 5,
          compliance: 4
        }
      })
    }

    if (tierResult.userTier !== 'enterprise') {
      upgradeOptions.push({
        targetTier: 'enterprise',
        benefits: [
          'All Professional tier features',
          'Strategic scenario modeling',
          'Advanced AI-powered insights',
          'Custom integration options',
          'Dedicated account management',
          'White-label reporting',
          'API access for automation'
        ],
        requirements: [
          'Enterprise subscription active',
          'Professional tier data completed',
          'Advanced analytics consent'
        ],
        estimatedUpgradeTime: '10-15 minutes'
      })
    }

    const response = {
      evaluationId,
      currentTier: evaluation.subscriptionTier,
      userTier: tierResult.userTier,
      canUpgrade: upgradeOptions.length > 0,
      upgradeOptions,
      currentData: {
        hasBasicData: !!evaluation.businessData,
        hasProfessionalData: !!evaluation.professionalData,
        dataVersion: evaluation.dataVersion,
        analysisDepth: evaluation.analysisDepth
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Failed to get upgrade options:', error)
    return NextResponse.json(
      { error: 'Failed to get upgrade options' },
      { status: 500 }
    )
  }
}

// Helper functions
function getClientIpAddress(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return 'unknown'
}

function getSessionId(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get('session-id')?.value
  const authHeader = request.headers.get('authorization')

  if (sessionCookie) {
    return sessionCookie
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7, 47)
  }

  return null
}