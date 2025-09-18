import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProfessionalQuestionnaireService } from '@/lib/services/professional-questionnaire-service'
import { TierValidationMiddleware } from '@/lib/middleware/tier-validation'
import { ProfessionalTierDataSchema } from '@/lib/validations/professional-tier'
import { z } from 'zod'

const CreateQuestionnaireSchema = z.object({
  businessEvaluationId: z.string().uuid('Invalid business evaluation ID'),
  professionalData: ProfessionalTierDataSchema,
  autoSave: z.boolean().optional().default(true),
  saveInterval: z.number().min(10).max(300).optional().default(30), // seconds
})

const GetQuestionnaireSchema = z.object({
  businessEvaluationId: z.string().uuid('Invalid business evaluation ID').optional(),
  includeProgress: z.boolean().optional().default(true),
  includeDraft: z.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Validate user authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate Professional tier access
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'professional',
      featureType: 'professional_evaluation',
      strict: true
    })

    if (!tierResult.hasAccess) {
      return NextResponse.json(
        {
          error: 'Professional tier access required',
          required: 'professional',
          current: tierResult.userTier,
          upgradeUrl: tierResult.upgradeUrl,
          upgradeRequired: true
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = CreateQuestionnaireSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.flatten(),
          executionTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    const { businessEvaluationId, professionalData, autoSave, saveInterval } = validationResult.data

    // Create professional questionnaire
    const questionnaire = await ProfessionalQuestionnaireService.createQuestionnaire({
      userId,
      businessEvaluationId,
      professionalData,
      autoSave,
      saveInterval,
      request
    })

    // Log professional data access
    await TierValidationMiddleware.logProfessionalDataAccess(
      businessEvaluationId,
      userId,
      'create',
      request,
      { questionnaireId: questionnaire.id, fieldCount: questionnaire.fieldCount }
    )

    const executionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      questionnaire,
      tierInfo: {
        userTier: tierResult.userTier,
        hasAccess: true,
        restrictions: tierResult.restrictions
      },
      metadata: {
        executionTime,
        autoSaveEnabled: autoSave,
        saveInterval,
        fieldCount: questionnaire.fieldCount
      }
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('Failed to create professional questionnaire:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: (await auth()).userId,
      executionTime
    })

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: 'Business evaluation not found or access denied',
          executionTime
        },
        { status: 404 }
      )
    }

    if (error instanceof Error && error.message.includes('tier')) {
      return NextResponse.json(
        {
          error: 'Insufficient tier access',
          details: error.message,
          executionTime
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to create professional questionnaire',
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
    // Validate user authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate Professional tier access
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'professional',
      featureType: 'professional_evaluation',
      strict: true
    })

    if (!tierResult.hasAccess) {
      return NextResponse.json(
        {
          error: 'Professional tier access required',
          required: 'professional',
          current: tierResult.userTier,
          upgradeUrl: tierResult.upgradeUrl
        },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryValidation = GetQuestionnaireSchema.safeParse({
      businessEvaluationId: searchParams.get('businessEvaluationId'),
      includeProgress: searchParams.get('includeProgress') === 'true',
      includeDraft: searchParams.get('includeDraft') === 'true'
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: queryValidation.error.flatten(),
          executionTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    const { businessEvaluationId, includeProgress, includeDraft } = queryValidation.data

    // Get questionnaires
    const questionnaires = businessEvaluationId
      ? await ProfessionalQuestionnaireService.getQuestionnaire(userId, businessEvaluationId, {
          includeProgress,
          includeDraft
        })
      : await ProfessionalQuestionnaireService.getUserQuestionnaires(userId, {
          includeProgress,
          includeDraft,
          limit: 50
        })

    // Log access for specific questionnaire
    if (businessEvaluationId && questionnaires) {
      await TierValidationMiddleware.logProfessionalDataAccess(
        businessEvaluationId,
        userId,
        'view',
        request,
        { action: 'questionnaire_view' }
      )
    }

    const executionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      questionnaires: businessEvaluationId ? questionnaires : questionnaires,
      tierInfo: {
        userTier: tierResult.userTier,
        hasAccess: true,
        restrictions: tierResult.restrictions
      },
      metadata: {
        executionTime,
        count: Array.isArray(questionnaires) ? questionnaires.length : (questionnaires ? 1 : 0),
        includeProgress,
        includeDraft
      }
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('Failed to get professional questionnaires:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: (await auth()).userId,
      executionTime
    })

    return NextResponse.json(
      {
        error: 'Failed to get professional questionnaires',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Validate user authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate Professional tier access
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'professional',
      featureType: 'professional_evaluation',
      strict: true
    })

    if (!tierResult.hasAccess) {
      return NextResponse.json(
        {
          error: 'Professional tier access required',
          upgradeRequired: true
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = CreateQuestionnaireSchema.extend({
      questionnaireId: z.string().uuid('Invalid questionnaire ID'),
      partialUpdate: z.boolean().optional().default(false)
    }).safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.flatten(),
          executionTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    const { questionnaireId, businessEvaluationId, professionalData, partialUpdate } = validationResult.data

    // Update questionnaire
    const updatedQuestionnaire = await ProfessionalQuestionnaireService.updateQuestionnaire({
      questionnaireId,
      userId,
      businessEvaluationId,
      professionalData,
      partialUpdate,
      request
    })

    // Log update
    await TierValidationMiddleware.logProfessionalDataAccess(
      businessEvaluationId,
      userId,
      'update',
      request,
      {
        questionnaireId,
        partialUpdate,
        fieldCount: updatedQuestionnaire.fieldCount
      }
    )

    const executionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      questionnaire: updatedQuestionnaire,
      tierInfo: {
        userTier: tierResult.userTier,
        hasAccess: true
      },
      metadata: {
        executionTime,
        partialUpdate,
        fieldCount: updatedQuestionnaire.fieldCount
      }
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('Failed to update professional questionnaire:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: (await auth()).userId,
      executionTime
    })

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: 'Questionnaire not found or access denied',
          executionTime
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to update professional questionnaire',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: 500 }
    )
  }
}