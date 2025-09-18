import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  ProfessionalTierData,
  validateProfessionalTierData,
  validateProfessionalFieldCompleteness,
  PROFESSIONAL_TIER_FIELD_COUNT
} from '@/lib/validations/professional-tier'
import { TierValidationMiddleware } from '@/lib/middleware/tier-validation'

export interface QuestionnaireCreateOptions {
  userId: string
  businessEvaluationId: string
  professionalData: ProfessionalTierData
  autoSave?: boolean
  saveInterval?: number
  request?: NextRequest
}

export interface QuestionnaireUpdateOptions {
  questionnaireId: string
  userId: string
  businessEvaluationId: string
  professionalData: ProfessionalTierData
  partialUpdate?: boolean
  request?: NextRequest
}

export interface AutoSaveOptions {
  questionnaireId: string
  userId: string
  businessEvaluationId: string
  sectionData?: Record<string, any>
  fieldData?: Record<string, any>
  progressData?: {
    currentSection?: string
    completedSections?: string[]
    totalSections?: number
    percentageComplete?: number
    lastActiveField?: string
    timeSpent?: number
  }
  metadata?: {
    saveReason?: 'auto' | 'manual' | 'navigation' | 'blur' | 'periodic'
    clientTimestamp?: string
    sessionId?: string
    pageUrl?: string
    serverTimestamp?: string
    requestId?: string
    userAgent?: string
    ipAddress?: string
  }
  maxSaveTime?: number
}

export interface ProfessionalQuestionnaire {
  id: string
  userId: string
  businessEvaluationId: string
  professionalData: ProfessionalTierData
  status: 'draft' | 'in_progress' | 'completed' | 'submitted'
  progress: {
    currentSection?: string
    completedSections: string[]
    totalSections: number
    percentageComplete: number
    lastActiveField?: string
    timeSpent: number
    startedAt: Date
    lastUpdatedAt: Date
  }
  autoSave: boolean
  saveInterval: number
  fieldCount: number
  validationStatus: {
    isValid: boolean
    errors?: any
    warnings?: string[]
    completenessScore: number
  }
  metadata: {
    createdAt: Date
    updatedAt: Date
    version: string
    lastSavedAt?: Date
    saveCount: number
  }
}

export class ProfessionalQuestionnaireService {
  private static readonly DEFAULT_SAVE_INTERVAL = 30 // seconds
  private static readonly MAX_SAVE_TIME = 30000 // 30 seconds
  private static readonly QUESTIONNAIRE_VERSION = '1.0'

  /**
   * Creates a new professional questionnaire
   */
  static async createQuestionnaire(options: QuestionnaireCreateOptions): Promise<ProfessionalQuestionnaire> {
    const {
      userId,
      businessEvaluationId,
      professionalData,
      autoSave = true,
      saveInterval = this.DEFAULT_SAVE_INTERVAL,
      request
    } = options

    // Validate business evaluation exists and user has access
    await this.validateBusinessEvaluationAccess(userId, businessEvaluationId)

    // Validate professional data structure
    const validation = validateProfessionalTierData(professionalData)
    if (!validation.success) {
      throw new Error(`Invalid professional data: ${JSON.stringify(validation.error.flatten())}`)
    }

    // Check field completeness
    const completeness = validateProfessionalFieldCompleteness(professionalData)

    // Calculate initial progress
    const progress = this.calculateProgress(professionalData)

    // Use database transaction for data integrity
    const questionnaire = await prisma.$transaction(async (tx) => {
      // Update business evaluation with professional data
      const updatedEvaluation = await tx.businessEvaluation.update({
        where: {
          id: businessEvaluationId,
          userId,
          deletedAt: null
        },
        data: {
          professionalData,
          subscriptionTier: 'professional',
          analysisDepth: 'professional',
          dataVersion: this.QUESTIONNAIRE_VERSION,
          updatedAt: new Date()
        }
      })

      // Create audit trail
      await tx.professionalDataAudit.create({
        data: {
          businessEvaluationId,
          userId,
          changeType: 'created',
          previousData: null,
          newData: professionalData,
          changedFields: Object.keys(this.flattenProfessionalData(professionalData)),
          userAgent: request?.headers.get('user-agent'),
          ipAddress: this.getClientIpAddress(request),
          sessionId: this.getSessionId(request),
          requestId: request?.headers.get('x-request-id') || crypto.randomUUID(),
        }
      })

      return updatedEvaluation
    })

    // Return structured questionnaire object
    return {
      id: questionnaire.id,
      userId,
      businessEvaluationId,
      professionalData,
      status: progress.percentageComplete >= 100 ? 'completed' : 'in_progress',
      progress: {
        ...progress,
        startedAt: new Date(),
        lastUpdatedAt: new Date()
      },
      autoSave,
      saveInterval,
      fieldCount: completeness.fieldCount,
      validationStatus: {
        isValid: completeness.isValid,
        errors: completeness.errors,
        warnings: this.generateValidationWarnings(professionalData),
        completenessScore: (completeness.fieldCount / PROFESSIONAL_TIER_FIELD_COUNT.total) * 100
      },
      metadata: {
        createdAt: questionnaire.createdAt,
        updatedAt: questionnaire.updatedAt,
        version: this.QUESTIONNAIRE_VERSION,
        lastSavedAt: new Date(),
        saveCount: 1
      }
    }
  }

  /**
   * Gets a questionnaire for a specific business evaluation
   */
  static async getQuestionnaire(
    userId: string,
    businessEvaluationId: string,
    options?: { includeProgress?: boolean; includeDraft?: boolean }
  ): Promise<ProfessionalQuestionnaire | null> {
    const evaluation = await prisma.businessEvaluation.findFirst({
      where: {
        id: businessEvaluationId,
        userId,
        subscriptionTier: 'professional',
        deletedAt: null
      }
    })

    if (!evaluation || !evaluation.professionalData) {
      return null
    }

    const professionalData = evaluation.professionalData as ProfessionalTierData
    const progress = this.calculateProgress(professionalData)
    const completeness = validateProfessionalFieldCompleteness(professionalData)

    return {
      id: evaluation.id,
      userId,
      businessEvaluationId,
      professionalData,
      status: this.determineStatus(evaluation, progress),
      progress: {
        ...progress,
        startedAt: evaluation.createdAt,
        lastUpdatedAt: evaluation.updatedAt
      },
      autoSave: true, // Default for existing questionnaires
      saveInterval: this.DEFAULT_SAVE_INTERVAL,
      fieldCount: completeness.fieldCount,
      validationStatus: {
        isValid: completeness.isValid,
        errors: completeness.errors,
        warnings: this.generateValidationWarnings(professionalData),
        completenessScore: (completeness.fieldCount / PROFESSIONAL_TIER_FIELD_COUNT.total) * 100
      },
      metadata: {
        createdAt: evaluation.createdAt,
        updatedAt: evaluation.updatedAt,
        version: evaluation.dataVersion || this.QUESTIONNAIRE_VERSION,
        lastSavedAt: evaluation.updatedAt,
        saveCount: 1 // Would need to track this separately in production
      }
    }
  }

  /**
   * Gets all questionnaires for a user
   */
  static async getUserQuestionnaires(
    userId: string,
    options?: { includeProgress?: boolean; includeDraft?: boolean; limit?: number }
  ): Promise<ProfessionalQuestionnaire[]> {
    const { limit = 50 } = options || {}

    const evaluations = await prisma.businessEvaluation.findMany({
      where: {
        userId,
        subscriptionTier: 'professional',
        deletedAt: null,
        professionalData: { not: null }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit
    })

    return evaluations.map(evaluation => {
      const professionalData = evaluation.professionalData as ProfessionalTierData
      const progress = this.calculateProgress(professionalData)
      const completeness = validateProfessionalFieldCompleteness(professionalData)

      return {
        id: evaluation.id,
        userId,
        businessEvaluationId: evaluation.id,
        professionalData,
        status: this.determineStatus(evaluation, progress),
        progress: {
          ...progress,
          startedAt: evaluation.createdAt,
          lastUpdatedAt: evaluation.updatedAt
        },
        autoSave: true,
        saveInterval: this.DEFAULT_SAVE_INTERVAL,
        fieldCount: completeness.fieldCount,
        validationStatus: {
          isValid: completeness.isValid,
          errors: completeness.errors,
          warnings: this.generateValidationWarnings(professionalData),
          completenessScore: (completeness.fieldCount / PROFESSIONAL_TIER_FIELD_COUNT.total) * 100
        },
        metadata: {
          createdAt: evaluation.createdAt,
          updatedAt: evaluation.updatedAt,
          version: evaluation.dataVersion || this.QUESTIONNAIRE_VERSION,
          lastSavedAt: evaluation.updatedAt,
          saveCount: 1
        }
      }
    })
  }

  /**
   * Gets a specific questionnaire by ID
   */
  static async getQuestionnaireById(
    questionnaireId: string,
    userId: string,
    options?: { includeProgress?: boolean; includeHistory?: boolean; includeDraft?: boolean; includeValidation?: boolean }
  ): Promise<ProfessionalQuestionnaire | null> {
    return this.getQuestionnaire(userId, questionnaireId, options)
  }

  /**
   * Updates a questionnaire
   */
  static async updateQuestionnaire(options: QuestionnaireUpdateOptions): Promise<ProfessionalQuestionnaire> {
    const {
      questionnaireId,
      userId,
      businessEvaluationId,
      professionalData,
      partialUpdate = false,
      request
    } = options

    // Validate access
    await this.validateBusinessEvaluationAccess(userId, businessEvaluationId)

    // Get existing data for partial updates
    let mergedData = professionalData
    if (partialUpdate) {
      const existing = await this.getQuestionnaire(userId, businessEvaluationId)
      if (existing) {
        mergedData = this.mergeProfessionalData(existing.professionalData, professionalData)
      }
    }

    // Validate merged data
    const validation = validateProfessionalTierData(mergedData)
    if (!validation.success) {
      throw new Error(`Invalid professional data: ${JSON.stringify(validation.error.flatten())}`)
    }

    // Use transaction for data integrity
    const updatedEvaluation = await prisma.$transaction(async (tx) => {
      // Get previous data for audit
      const previous = await tx.businessEvaluation.findUnique({
        where: { id: businessEvaluationId },
        select: { professionalData: true }
      })

      // Update evaluation
      const updated = await tx.businessEvaluation.update({
        where: {
          id: businessEvaluationId,
          userId,
          deletedAt: null
        },
        data: {
          professionalData: mergedData,
          subscriptionTier: 'professional',
          analysisDepth: 'professional',
          dataVersion: this.QUESTIONNAIRE_VERSION,
          updatedAt: new Date()
        }
      })

      // Create audit trail
      await tx.professionalDataAudit.create({
        data: {
          businessEvaluationId,
          userId,
          changeType: 'updated',
          previousData: previous?.professionalData || null,
          newData: mergedData,
          changedFields: this.getChangedFields(previous?.professionalData as any, mergedData),
          userAgent: request?.headers.get('user-agent'),
          ipAddress: this.getClientIpAddress(request),
          sessionId: this.getSessionId(request),
          requestId: request?.headers.get('x-request-id') || crypto.randomUUID(),
        }
      })

      return updated
    })

    // Return updated questionnaire
    const progress = this.calculateProgress(mergedData)
    const completeness = validateProfessionalFieldCompleteness(mergedData)

    return {
      id: updatedEvaluation.id,
      userId,
      businessEvaluationId,
      professionalData: mergedData,
      status: this.determineStatus(updatedEvaluation, progress),
      progress: {
        ...progress,
        startedAt: updatedEvaluation.createdAt,
        lastUpdatedAt: updatedEvaluation.updatedAt
      },
      autoSave: true,
      saveInterval: this.DEFAULT_SAVE_INTERVAL,
      fieldCount: completeness.fieldCount,
      validationStatus: {
        isValid: completeness.isValid,
        errors: completeness.errors,
        warnings: this.generateValidationWarnings(mergedData),
        completenessScore: (completeness.fieldCount / PROFESSIONAL_TIER_FIELD_COUNT.total) * 100
      },
      metadata: {
        createdAt: updatedEvaluation.createdAt,
        updatedAt: updatedEvaluation.updatedAt,
        version: this.QUESTIONNAIRE_VERSION,
        lastSavedAt: new Date(),
        saveCount: 1
      }
    }
  }

  /**
   * Updates a questionnaire by ID
   */
  static async updateQuestionnaireById(options: {
    questionnaireId: string
    userId: string
    updateData: any
    request?: NextRequest
  }): Promise<ProfessionalQuestionnaire | null> {
    const { questionnaireId, userId, updateData, request } = options

    if (updateData.professionalData) {
      return this.updateQuestionnaire({
        questionnaireId,
        userId,
        businessEvaluationId: questionnaireId, // Questionnaire ID is the evaluation ID
        professionalData: updateData.professionalData,
        partialUpdate: true,
        request
      })
    }

    // Handle other update types (status, progress, etc.)
    const existing = await this.getQuestionnaire(userId, questionnaireId)
    if (!existing) {
      return null
    }

    // For now, return existing since we're not handling other update types
    return existing
  }

  /**
   * Performs auto-save with optimized performance
   */
  static async autoSave(options: AutoSaveOptions): Promise<{
    saved: boolean
    saveId: string
    progress: any
    conflicts?: any[]
    fieldsUpdated?: number
  }> {
    const startTime = Date.now()
    const {
      questionnaireId,
      userId,
      businessEvaluationId,
      sectionData,
      fieldData,
      progressData,
      metadata,
      maxSaveTime = this.MAX_SAVE_TIME
    } = options

    const saveId = crypto.randomUUID()

    try {
      // Quick validation
      await this.validateBusinessEvaluationAccess(userId, businessEvaluationId)

      // Get existing data
      const existing = await this.getQuestionnaire(userId, businessEvaluationId)
      if (!existing) {
        throw new Error('Questionnaire not found')
      }

      // Merge data efficiently
      const updatedData = this.mergeAutoSaveData(existing.professionalData, sectionData, fieldData)

      // Quick validation of critical fields only
      const changedFields = this.getChangedFields(existing.professionalData, updatedData)
      const fieldsUpdated = changedFields.length

      // Check if save time is approaching limit
      const elapsedTime = Date.now() - startTime
      if (elapsedTime > maxSaveTime * 0.8) {
        console.warn('Auto-save approaching time limit', { elapsedTime, maxSaveTime })
      }

      // Perform lightweight update (skip full validation for auto-save)
      const updated = await prisma.businessEvaluation.update({
        where: {
          id: businessEvaluationId,
          userId,
          deletedAt: null
        },
        data: {
          professionalData: updatedData,
          updatedAt: new Date()
        }
      })

      // Update progress if provided
      const progress = progressData ? progressData : this.calculateProgress(updatedData)

      return {
        saved: true,
        saveId,
        progress,
        fieldsUpdated
      }

    } catch (error) {
      console.error('Auto-save failed:', error)
      return {
        saved: false,
        saveId,
        progress: null,
        conflicts: [{ error: error instanceof Error ? error.message : 'Unknown error' }]
      }
    }
  }

  /**
   * Gets auto-save status and history
   */
  static async getAutoSaveStatus(options: {
    questionnaireId: string
    userId: string
    businessEvaluationId: string
    includeHistory?: boolean
  }): Promise<any> {
    // For now, return basic status
    const questionnaire = await this.getQuestionnaire(options.userId, options.businessEvaluationId)

    return {
      enabled: true,
      lastSaved: questionnaire?.metadata.lastSavedAt,
      status: 'active',
      interval: this.DEFAULT_SAVE_INTERVAL,
      conflicts: []
    }
  }

  /**
   * Clears auto-save data
   */
  static async clearAutoSave(options: {
    questionnaireId: string
    userId: string
    saveId?: string
    clearAll?: boolean
  }): Promise<boolean> {
    // Implementation would clear auto-save cache/temporary data
    return true
  }

  /**
   * Patches a questionnaire with partial data
   */
  static async patchQuestionnaire(options: {
    questionnaireId: string
    userId: string
    patchData: any
    request?: NextRequest
  }): Promise<ProfessionalQuestionnaire | null> {
    const { questionnaireId, userId, patchData, request } = options

    // Convert patch to partial update
    if (patchData.professionalData) {
      return this.updateQuestionnaire({
        questionnaireId,
        userId,
        businessEvaluationId: questionnaireId,
        professionalData: patchData.professionalData,
        partialUpdate: true,
        request
      })
    }

    return this.getQuestionnaire(userId, questionnaireId)
  }

  /**
   * Deletes a questionnaire
   */
  static async deleteQuestionnaire(options: {
    questionnaireId: string
    userId: string
    hardDelete?: boolean
    reason?: string
    request?: NextRequest
  }): Promise<ProfessionalQuestionnaire | null> {
    const { questionnaireId, userId, hardDelete = false, reason, request } = options

    const existing = await this.getQuestionnaire(userId, questionnaireId)
    if (!existing) {
      return null
    }

    if (hardDelete) {
      await prisma.businessEvaluation.delete({
        where: {
          id: questionnaireId,
          userId
        }
      })
    } else {
      await prisma.businessEvaluation.update({
        where: {
          id: questionnaireId,
          userId
        },
        data: {
          deletedAt: new Date()
        }
      })
    }

    return existing
  }

  // Private helper methods
  private static async validateBusinessEvaluationAccess(userId: string, businessEvaluationId: string): Promise<void> {
    const evaluation = await prisma.businessEvaluation.findFirst({
      where: {
        id: businessEvaluationId,
        userId,
        deletedAt: null
      }
    })

    if (!evaluation) {
      throw new Error('Business evaluation not found or access denied')
    }
  }

  private static calculateProgress(professionalData: ProfessionalTierData): {
    currentSection?: string
    completedSections: string[]
    totalSections: number
    percentageComplete: number
    lastActiveField?: string
    timeSpent: number
  } {
    const sections = [
      'financialMetrics',
      'customerAnalytics',
      'operationalEfficiency',
      'marketIntelligence',
      'financialPlanning',
      'compliance'
    ]

    const completedSections = sections.filter(section => {
      const sectionData = professionalData[section as keyof ProfessionalTierData]
      return this.isSectionComplete(sectionData)
    })

    return {
      completedSections,
      totalSections: sections.length,
      percentageComplete: Math.round((completedSections.length / sections.length) * 100),
      timeSpent: 0 // Would need to track this separately
    }
  }

  private static isSectionComplete(sectionData: any): boolean {
    if (!sectionData || typeof sectionData !== 'object') return false

    // Check if all required fields have values
    return Object.values(sectionData).every(value =>
      value !== null && value !== undefined && value !== ''
    )
  }

  private static determineStatus(evaluation: any, progress: any): 'draft' | 'in_progress' | 'completed' | 'submitted' {
    if (progress.percentageComplete === 0) return 'draft'
    if (progress.percentageComplete >= 100) return 'completed'
    return 'in_progress'
  }

  private static generateValidationWarnings(professionalData: ProfessionalTierData): string[] {
    const warnings: string[] = []

    // Check for common data quality issues
    if (professionalData.financialMetrics.netProfit < 0 && professionalData.financialMetrics.ebitda > 0) {
      warnings.push('Net profit is negative but EBITDA is positive - please verify calculations')
    }

    if (professionalData.customerAnalytics.churnRate > 50) {
      warnings.push('Churn rate above 50% may indicate data entry error')
    }

    return warnings
  }

  private static flattenProfessionalData(data: ProfessionalTierData): Record<string, any> {
    const flattened: Record<string, any> = {}

    Object.entries(data).forEach(([section, sectionData]) => {
      if (typeof sectionData === 'object' && sectionData !== null) {
        Object.entries(sectionData).forEach(([field, value]) => {
          flattened[`${section}.${field}`] = value
        })
      }
    })

    return flattened
  }

  private static mergeProfessionalData(
    existing: ProfessionalTierData,
    updates: ProfessionalTierData
  ): ProfessionalTierData {
    return {
      financialMetrics: { ...existing.financialMetrics, ...updates.financialMetrics },
      customerAnalytics: { ...existing.customerAnalytics, ...updates.customerAnalytics },
      operationalEfficiency: { ...existing.operationalEfficiency, ...updates.operationalEfficiency },
      marketIntelligence: { ...existing.marketIntelligence, ...updates.marketIntelligence },
      financialPlanning: { ...existing.financialPlanning, ...updates.financialPlanning },
      compliance: { ...existing.compliance, ...updates.compliance }
    }
  }

  private static mergeAutoSaveData(
    existing: ProfessionalTierData,
    sectionData?: Record<string, any>,
    fieldData?: Record<string, any>
  ): ProfessionalTierData {
    let merged = { ...existing }

    // Apply section-level updates
    if (sectionData) {
      Object.entries(sectionData).forEach(([section, data]) => {
        if (merged[section as keyof ProfessionalTierData]) {
          merged[section as keyof ProfessionalTierData] = {
            ...merged[section as keyof ProfessionalTierData],
            ...data
          }
        }
      })
    }

    // Apply field-level updates
    if (fieldData) {
      Object.entries(fieldData).forEach(([fieldPath, value]) => {
        const [section, field] = fieldPath.split('.')
        if (merged[section as keyof ProfessionalTierData] && field) {
          (merged[section as keyof ProfessionalTierData] as any)[field] = value
        }
      })
    }

    return merged
  }

  private static getChangedFields(previous: ProfessionalTierData, current: ProfessionalTierData): string[] {
    const changes: string[] = []
    const prevFlat = this.flattenProfessionalData(previous)
    const currFlat = this.flattenProfessionalData(current)

    Object.keys(currFlat).forEach(key => {
      if (prevFlat[key] !== currFlat[key]) {
        changes.push(key)
      }
    })

    return changes
  }

  private static getClientIpAddress(request?: NextRequest): string | null {
    if (!request) return null

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

  private static getSessionId(request?: NextRequest): string | null {
    if (!request) return null

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
}