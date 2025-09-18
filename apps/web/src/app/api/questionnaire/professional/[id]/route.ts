import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProfessionalQuestionnaireService } from '@/lib/services/professional-questionnaire-service'
import { TierValidationMiddleware } from '@/lib/middleware/tier-validation'
import { ProfessionalTierDataSchema } from '@/lib/validations/professional-tier'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const UpdateQuestionnaireSchema = z.object({
  professionalData: ProfessionalTierDataSchema.partial().optional(),
  sectionData: z.record(z.any()).optional(),
  progressData: z.object({
    currentSection: z.string().optional(),
    completedSections: z.array(z.string()).optional(),
    totalSections: z.number().optional(),
    percentageComplete: z.number().min(0).max(100).optional(),
    lastActiveField: z.string().optional(),
    timeSpent: z.number().min(0).optional(),
  }).optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'submitted']).optional(),
  autoSave: z.boolean().optional(),
  saveInterval: z.number().min(10).max(300).optional(),
})

const GetOptionsSchema = z.object({
  includeProgress: z.boolean().optional().default(true),
  includeHistory: z.boolean().optional().default(false),
  includeDraft: z.boolean().optional().default(true),
  includeValidation: z.boolean().optional().default(false),
})

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Validate questionnaire ID
    const questionnaireId = params.id
    if (!z.string().uuid().safeParse(questionnaireId).success) {
      return NextResponse.json(
        { error: 'Invalid questionnaire ID format' },
        { status: 400 }
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
    const optionsValidation = GetOptionsSchema.safeParse({
      includeProgress: searchParams.get('includeProgress') === 'true',
      includeHistory: searchParams.get('includeHistory') === 'true',
      includeDraft: searchParams.get('includeDraft') === 'true',
      includeValidation: searchParams.get('includeValidation') === 'true'
    })

    if (!optionsValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: optionsValidation.error.flatten(),
          executionTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    const options = optionsValidation.data

    // Get questionnaire
    const questionnaire = await ProfessionalQuestionnaireService.getQuestionnaireById(
      questionnaireId,
      userId,
      options
    )

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found or access denied' },
        { status: 404 }
      )
    }

    // Log access
    await TierValidationMiddleware.logProfessionalDataAccess(
      questionnaire.businessEvaluationId,
      userId,
      'view',
      request,
      { questionnaireId, action: 'get_questionnaire' }
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
        options
      }
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('Failed to get questionnaire:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      questionnaireId: params.id,
      userId: (await auth()).userId,
      executionTime
    })

    return NextResponse.json(
      {
        error: 'Failed to get questionnaire',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Validate questionnaire ID
    const questionnaireId = params.id
    if (!z.string().uuid().safeParse(questionnaireId).success) {
      return NextResponse.json(
        { error: 'Invalid questionnaire ID format' },
        { status: 400 }
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
    const validationResult = UpdateQuestionnaireSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid update data',
          details: validationResult.error.flatten(),
          executionTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Update questionnaire
    const updatedQuestionnaire = await ProfessionalQuestionnaireService.updateQuestionnaireById({
      questionnaireId,
      userId,
      updateData,
      request
    })

    if (!updatedQuestionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found or access denied' },
        { status: 404 }
      )
    }

    // Log update
    await TierValidationMiddleware.logProfessionalDataAccess(
      updatedQuestionnaire.businessEvaluationId,
      userId,
      'update',
      request,
      {
        questionnaireId,
        updateType: 'full_update',
        fieldsUpdated: Object.keys(updateData).length
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
        fieldsUpdated: Object.keys(updateData).length
      }
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('Failed to update questionnaire:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      questionnaireId: params.id,
      userId: (await auth()).userId,
      executionTime
    })

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.message,
          executionTime
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to update questionnaire',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Validate questionnaire ID
    const questionnaireId = params.id
    if (!z.string().uuid().safeParse(questionnaireId).success) {
      return NextResponse.json(
        { error: 'Invalid questionnaire ID format' },
        { status: 400 }
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

    // Parse query parameters for soft/hard delete
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'
    const reason = searchParams.get('reason') || 'user_requested'

    // Delete questionnaire
    const deleted = await ProfessionalQuestionnaireService.deleteQuestionnaire({
      questionnaireId,
      userId,
      hardDelete,
      reason,
      request
    })

    if (!deleted) {
      return NextResponse.json(
        { error: 'Questionnaire not found or access denied' },
        { status: 404 }
      )
    }

    // Log deletion
    await TierValidationMiddleware.logProfessionalDataAccess(
      deleted.businessEvaluationId,
      userId,
      'update', // Deletion is tracked as an update
      request,
      {
        questionnaireId,
        action: 'delete',
        hardDelete,
        reason
      }
    )

    const executionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      deleted: true,
      questionnaire: deleted,
      metadata: {
        executionTime,
        hardDelete,
        reason
      }
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('Failed to delete questionnaire:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      questionnaireId: params.id,
      userId: (await auth()).userId,
      executionTime
    })

    return NextResponse.json(
      {
        error: 'Failed to delete questionnaire',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Validate questionnaire ID
    const questionnaireId = params.id
    if (!z.string().uuid().safeParse(questionnaireId).success) {
      return NextResponse.json(
        { error: 'Invalid questionnaire ID format' },
        { status: 400 }
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

    // Parse and validate request body for partial update
    const body = await request.json()
    const validationResult = UpdateQuestionnaireSchema.partial().safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid patch data',
          details: validationResult.error.flatten(),
          executionTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    const patchData = validationResult.data

    // Perform partial update
    const updatedQuestionnaire = await ProfessionalQuestionnaireService.patchQuestionnaire({
      questionnaireId,
      userId,
      patchData,
      request
    })

    if (!updatedQuestionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found or access denied' },
        { status: 404 }
      )
    }

    // Log partial update
    await TierValidationMiddleware.logProfessionalDataAccess(
      updatedQuestionnaire.businessEvaluationId,
      userId,
      'update',
      request,
      {
        questionnaireId,
        updateType: 'partial_update',
        fieldsPatched: Object.keys(patchData).length
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
        fieldsPatched: Object.keys(patchData).length,
        updateType: 'partial'
      }
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('Failed to patch questionnaire:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      questionnaireId: params.id,
      userId: (await auth()).userId,
      executionTime
    })

    return NextResponse.json(
      {
        error: 'Failed to patch questionnaire',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: 500 }
    )
  }
}