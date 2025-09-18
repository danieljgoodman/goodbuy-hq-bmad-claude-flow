import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProfessionalQuestionnaireService } from '@/lib/services/professional-questionnaire-service'
import { TierValidationMiddleware } from '@/lib/middleware/tier-validation'
import { z } from 'zod'

const AutoSaveSchema = z.object({
  questionnaireId: z.string().uuid('Invalid questionnaire ID'),
  businessEvaluationId: z.string().uuid('Invalid business evaluation ID'),
  sectionData: z.record(z.any()).optional(), // Partial data for specific sections
  fieldData: z.record(z.any()).optional(), // Individual field updates
  progressData: z.object({
    currentSection: z.string().optional(),
    completedSections: z.array(z.string()).optional(),
    totalSections: z.number().optional(),
    percentageComplete: z.number().min(0).max(100).optional(),
    lastActiveField: z.string().optional(),
    timeSpent: z.number().min(0).optional(), // seconds
  }).optional(),
  metadata: z.object({
    saveReason: z.enum(['auto', 'manual', 'navigation', 'blur', 'periodic']).default('auto'),
    clientTimestamp: z.string().datetime().optional(),
    sessionId: z.string().optional(),
    pageUrl: z.string().optional(),
  }).optional(),
})

const SAVE_TIME_THRESHOLD = 30000 // 30 seconds max save time

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

    // Quick tier validation (cached result acceptable for auto-save)
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'professional',
      featureType: 'professional_evaluation',
      strict: false // Allow cached results for performance
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
    const validationResult = AutoSaveSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid auto-save data',
          details: validationResult.error.flatten(),
          executionTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    const {
      questionnaireId,
      businessEvaluationId,
      sectionData,
      fieldData,
      progressData,
      metadata
    } = validationResult.data

    // Perform auto-save with performance optimization
    const saveResult = await ProfessionalQuestionnaireService.autoSave({
      questionnaireId,
      userId,
      businessEvaluationId,
      sectionData,
      fieldData,
      progressData,
      metadata: {
        ...metadata,
        serverTimestamp: new Date().toISOString(),
        requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
        userAgent: request.headers.get('user-agent'),
        ipAddress: TierValidationMiddleware.getClientIpAddress ?
          (TierValidationMiddleware as any).getClientIpAddress(request) : 'unknown'
      },
      maxSaveTime: SAVE_TIME_THRESHOLD
    })

    const executionTime = Date.now() - startTime

    // Log auto-save (lightweight logging for performance)
    if (executionTime > 5000) { // Only log slow saves
      console.warn('Slow auto-save detected:', {
        questionnaireId,
        executionTime,
        userId,
        saveReason: metadata?.saveReason
      })
    }

    // Return optimized response
    return NextResponse.json({
      success: true,
      saved: saveResult.saved,
      saveId: saveResult.saveId,
      progress: saveResult.progress,
      conflicts: saveResult.conflicts || [],
      metadata: {
        executionTime,
        saveReason: metadata?.saveReason || 'auto',
        fieldsUpdated: saveResult.fieldsUpdated || 0,
        timestamp: new Date().toISOString(),
        performanceOptimized: executionTime < SAVE_TIME_THRESHOLD
      }
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('Auto-save failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: (await auth()).userId,
      executionTime,
      stack: error instanceof Error ? error.stack : undefined
    })

    // Return appropriate error response based on error type
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Questionnaire not found',
          retryable: false,
          executionTime
        },
        { status: 404 }
      )
    }

    if (error instanceof Error && error.message.includes('conflict')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data conflict detected',
          retryable: true,
          conflictData: error instanceof Error ? error.message : null,
          executionTime
        },
        { status: 409 }
      )
    }

    if (executionTime > SAVE_TIME_THRESHOLD) {
      return NextResponse.json(
        {
          success: false,
          error: 'Save timeout',
          retryable: true,
          timeout: SAVE_TIME_THRESHOLD,
          executionTime
        },
        { status: 408 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Auto-save failed',
        retryable: true,
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const questionnaireId = searchParams.get('questionnaireId')
    const businessEvaluationId = searchParams.get('businessEvaluationId')
    const includeHistory = searchParams.get('includeHistory') === 'true'

    if (!questionnaireId || !businessEvaluationId) {
      return NextResponse.json(
        {
          error: 'Questionnaire ID and Business Evaluation ID are required',
          executionTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    // Validate IDs
    const idValidation = z.object({
      questionnaireId: z.string().uuid(),
      businessEvaluationId: z.string().uuid()
    }).safeParse({ questionnaireId, businessEvaluationId })

    if (!idValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid ID format',
          details: idValidation.error.flatten(),
          executionTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    // Get auto-save status and history
    const saveStatus = await ProfessionalQuestionnaireService.getAutoSaveStatus({
      questionnaireId,
      userId,
      businessEvaluationId,
      includeHistory
    })

    const executionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      autoSaveStatus: saveStatus,
      metadata: {
        executionTime,
        includeHistory
      }
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('Failed to get auto-save status:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: (await auth()).userId,
      executionTime
    })

    return NextResponse.json(
      {
        error: 'Failed to get auto-save status',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const questionnaireId = searchParams.get('questionnaireId')
    const saveId = searchParams.get('saveId')
    const clearAll = searchParams.get('clearAll') === 'true'

    if (!questionnaireId) {
      return NextResponse.json(
        {
          error: 'Questionnaire ID is required',
          executionTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    // Clear auto-save data
    const cleared = await ProfessionalQuestionnaireService.clearAutoSave({
      questionnaireId,
      userId,
      saveId,
      clearAll
    })

    const executionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      cleared,
      metadata: {
        executionTime,
        clearAll,
        saveId
      }
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('Failed to clear auto-save data:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: (await auth()).userId,
      executionTime
    })

    return NextResponse.json(
      {
        error: 'Failed to clear auto-save data',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: 500 }
    )
  }
}