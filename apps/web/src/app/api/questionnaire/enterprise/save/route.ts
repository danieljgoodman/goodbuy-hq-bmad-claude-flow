import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { TierValidationMiddleware } from '@/lib/middleware/tier-validation'
import { z } from 'zod'

const SaveProgressSchema = z.object({
  questionnaireId: z.string().uuid('Invalid questionnaire ID'),
  businessEvaluationId: z.string().uuid('Invalid business evaluation ID'),
  progressData: z.object({
    currentSection: z.string().optional(),
    completedSections: z.array(z.string()).optional(),
    totalSections: z.number().optional(),
    percentageComplete: z.number().min(0).max(100).optional(),
    lastActiveField: z.string().optional(),
    timeSpent: z.number().optional(),
    professionalDataImported: z.boolean().optional(),
    professionalImportedAt: z.date().optional(),
    validationResults: z.object({
      isValid: z.boolean(),
      errors: z.array(z.string()),
      sectionErrors: z.record(z.array(z.string()))
    }).optional()
  }).optional(),
  sectionData: z.record(z.any()).optional(),
  fieldData: z.record(z.any()).optional(),
  enterpriseData: z.record(z.any()).optional(),
  metadata: z.object({
    saveReason: z.enum(['auto', 'manual', 'navigation']),
    clientTimestamp: z.string(),
    sessionId: z.string().optional(),
    pageUrl: z.string().optional(),
    encryptionEnabled: z.boolean().optional()
  }).optional()
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

    // Parse and validate request body
    const body = await request.json()
    const validationResult = SaveProgressSchema.safeParse(body)

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

    const {
      questionnaireId,
      businessEvaluationId,
      progressData,
      sectionData,
      fieldData,
      enterpriseData,
      metadata
    } = validationResult.data

    // Mock save operation - in production, this would save to database
    const savedProgress = {
      id: crypto.randomUUID(),
      questionnaireId,
      businessEvaluationId,
      userId,
      progressData: {
        ...progressData,
        lastUpdatedAt: new Date()
      },
      sectionData,
      fieldData,
      enterpriseData,
      metadata: {
        ...metadata,
        serverTimestamp: new Date().toISOString(),
        saveId: crypto.randomUUID()
      },
      savedAt: new Date()
    }

    // Log the save operation
    await TierValidationMiddleware.logEnterpriseDataAccess(
      businessEvaluationId,
      userId,
      'save',
      request,
      {
        questionnaireId,
        saveReason: metadata?.saveReason || 'auto',
        encryptionEnabled: metadata?.encryptionEnabled || false,
        fieldsUpdated: Object.keys(fieldData || {}).length,
        sectionsUpdated: Object.keys(sectionData || {}).length
      }
    )

    const executionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: {
        saveId: savedProgress.metadata.saveId,
        savedAt: savedProgress.savedAt,
        progressData: savedProgress.progressData
      },
      metadata: {
        executionTime,
        saveReason: metadata?.saveReason || 'auto',
        serverProcessed: true
      }
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('Failed to save enterprise questionnaire progress:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: (await auth()).userId,
      executionTime
    })

    return NextResponse.json(
      {
        error: 'Failed to save progress',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: 500 }
    )
  }
}

// Support for beacon API (navigator.sendBeacon)
export async function PUT(request: NextRequest) {
  return POST(request)
}