import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { TierValidationMiddleware } from '@/lib/middleware/tier-validation'
import { z } from 'zod'

const GetQuestionnaireSchema = z.object({
  businessEvaluationId: z.string().uuid('Invalid business evaluation ID').optional(),
  includeProgress: z.boolean().optional().default(true),
  includeDraft: z.boolean().optional().default(true),
})

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

    // Validate Enterprise tier access
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'enterprise',
      featureType: 'enterprise_evaluation',
      strict: true
    })

    if (!tierResult.hasAccess) {
      return NextResponse.json(
        {
          error: 'Enterprise tier access required',
          required: 'enterprise',
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

    // Mock progress data for now - this should be fetched from database
    const mockProgress = {
      currentSection: 'strategic-value-drivers',
      completedSections: ['financial-performance', 'customer-risk', 'competitive-market', 'operational-strategic', 'value-enhancement'],
      totalSections: 10,
      percentageComplete: 50,
      lastActiveField: null,
      timeSpent: 1800, // 30 minutes
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      lastUpdatedAt: new Date(),
      professionalDataImported: true,
      professionalImportedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      enterpriseData: {},
      sectionProgress: {
        'financial-performance': {
          completed: true,
          fieldsCompleted: 13,
          totalFields: 13,
          timeSpent: 300
        },
        'customer-risk': {
          completed: true,
          fieldsCompleted: 10,
          totalFields: 10,
          timeSpent: 240
        },
        'competitive-market': {
          completed: true,
          fieldsCompleted: 9,
          totalFields: 9,
          timeSpent: 200
        },
        'operational-strategic': {
          completed: true,
          fieldsCompleted: 7,
          totalFields: 7,
          timeSpent: 180
        },
        'value-enhancement': {
          completed: true,
          fieldsCompleted: 5,
          totalFields: 5,
          timeSpent: 150
        },
        'strategic-value-drivers': {
          completed: false,
          fieldsCompleted: 5,
          totalFields: 15,
          timeSpent: 300
        }
      }
    }

    const questionnaire = businessEvaluationId ? {
      id: crypto.randomUUID(),
      userId,
      businessEvaluationId,
      status: 'in_progress',
      progress: includeProgress ? mockProgress : undefined,
      draft: includeDraft ? {} : undefined,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    } : []

    // Log access for specific questionnaire
    if (businessEvaluationId) {
      await TierValidationMiddleware.logEnterpriseDataAccess(
        businessEvaluationId,
        userId,
        'view',
        request,
        { action: 'enterprise_questionnaire_view' }
      )
    }

    const executionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      questionnaires: questionnaire,
      tierInfo: {
        userTier: tierResult.userTier,
        hasAccess: true,
        restrictions: tierResult.restrictions
      },
      metadata: {
        executionTime,
        includeProgress,
        includeDraft
      }
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('Failed to get enterprise questionnaires:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: (await auth()).userId,
      executionTime
    })

    return NextResponse.json(
      {
        error: 'Failed to get enterprise questionnaires',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: 500 }
    )
  }
}

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

    // Validate Enterprise tier access
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'enterprise',
      featureType: 'enterprise_evaluation',
      strict: true
    })

    if (!tierResult.hasAccess) {
      return NextResponse.json(
        {
          error: 'Enterprise tier access required',
          required: 'enterprise',
          current: tierResult.userTier,
          upgradeUrl: tierResult.upgradeUrl,
          upgradeRequired: true
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { businessEvaluationId, enterpriseData, autoSave = true, saveInterval = 30 } = body

    if (!businessEvaluationId) {
      return NextResponse.json(
        {
          error: 'Business evaluation ID is required',
          executionTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    // Create enterprise questionnaire (mock for now)
    const questionnaire = {
      id: crypto.randomUUID(),
      userId,
      businessEvaluationId,
      enterpriseData: enterpriseData || {},
      status: 'in_progress',
      autoSave,
      saveInterval,
      fieldCount: 125, // Total fields for enterprise tier
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Log enterprise data access
    await TierValidationMiddleware.logEnterpriseDataAccess(
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
    console.error('Failed to create enterprise questionnaire:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: (await auth()).userId,
      executionTime
    })

    return NextResponse.json(
      {
        error: 'Failed to create enterprise questionnaire',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: 500 }
    )
  }
}