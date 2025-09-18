'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSafeUser as useUser } from './use-safe-clerk'
import { useProfessionalQuestionnaireProgress } from './useProfessionalQuestionnaireProgress'
import {
  ProfessionalTierData,
  validateProfessionalTierData,
  validateProfessionalFieldCompleteness
} from '@/lib/validations/professional-tier'

export interface QuestionnaireState {
  id?: string
  businessEvaluationId: string
  data: Partial<ProfessionalTierData>
  status: 'draft' | 'in_progress' | 'completed' | 'submitted'
  autoSave: boolean
  saveInterval: number
  validationStatus: {
    isValid: boolean
    errors?: any
    warnings?: string[]
    completenessScore: number
  }
  metadata: {
    createdAt?: Date
    updatedAt?: Date
    lastSavedAt?: Date
    version?: string
    fieldCount: number
  }
}

export interface QuestionnaireOptions {
  businessEvaluationId: string
  autoSave?: boolean
  saveInterval?: number
  loadOnMount?: boolean
  validateOnChange?: boolean
  debounceMs?: number
}

export interface ValidationResult {
  isValid: boolean
  errors?: any
  warnings: string[]
  completenessScore: number
  fieldCount: number
}

const DEFAULT_PROFESSIONAL_DATA: Partial<ProfessionalTierData> = {
  financialMetrics: {
    annualRevenue: 0,
    monthlyRecurring: 0,
    expenses: 0,
    cashFlow: 0,
    grossMargin: 0,
    netProfit: 0,
    ebitda: 0,
    burnRate: 0,
    runwayMonths: 0,
    debtToEquityRatio: 0,
    currentRatio: 0,
    quickRatio: 0,
    inventoryTurnover: 0,
    receivablesTurnover: 0,
    workingCapital: 0
  },
  customerAnalytics: {
    customerAcquisitionCost: 0,
    customerLifetimeValue: 0,
    churnRate: 0,
    netPromoterScore: 0,
    monthlyActiveUsers: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    repeatCustomerRate: 0
  },
  operationalEfficiency: {
    employeeProductivity: 0,
    operatingExpenseRatio: 0,
    capacityUtilization: 0,
    inventoryDaysOnHand: 0,
    paymentTermsDays: 0,
    vendorPaymentDays: 0,
    cashConversionCycle: 0
  },
  marketIntelligence: {
    marketShare: 0,
    marketGrowthRate: 0,
    competitorAnalysis: [],
    marketTrends: [],
    threatLevel: 'medium',
    opportunityScore: 0
  },
  financialPlanning: {
    revenueForecast12Month: new Array(12).fill(0),
    expenseForecast12Month: new Array(12).fill(0),
    cashFlowForecast12Month: new Array(12).fill(0),
    scenarioAnalysis: {
      optimistic: { revenue: 0, expenses: 0 },
      realistic: { revenue: 0, expenses: 0 },
      pessimistic: { revenue: 0, expenses: 0 }
    },
    budgetVariance: 0
  },
  compliance: {
    regulatoryCompliance: [],
    riskAssessment: {
      financialRisk: 'medium',
      operationalRisk: 'medium',
      marketRisk: 'medium',
      overallRiskScore: 50
    },
    insuranceCoverage: [],
    auditTrail: []
  }
}

export function useProfessionalQuestionnaire(options: QuestionnaireOptions) {
  const { user } = useUser()
  const {
    businessEvaluationId,
    autoSave = true,
    saveInterval = 30,
    loadOnMount = true,
    validateOnChange = true,
    debounceMs = 500
  } = options

  // State
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireState>({
    businessEvaluationId,
    data: DEFAULT_PROFESSIONAL_DATA,
    status: 'draft',
    autoSave,
    saveInterval,
    validationStatus: {
      isValid: false,
      warnings: [],
      completenessScore: 0
    },
    metadata: {
      fieldCount: 0
    }
  })

  const [isLoading, setIsLoading] = useState(loadOnMount)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<any[]>([])

  // Progress tracking
  const progressTracking = useProfessionalQuestionnaireProgress({
    questionnaireId: questionnaire.id || businessEvaluationId,
    businessEvaluationId,
    autoSave,
    saveInterval,
    sessionPersistence: true,
    trackFieldLevel: true
  })

  // Refs for debouncing and optimization
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSaveRef = useRef<Date>()
  const validationTimeoutRef = useRef<NodeJS.Timeout>()

  /**
   * Validate questionnaire data
   */
  const validateData = useCallback((data: Partial<ProfessionalTierData>): ValidationResult => {
    try {
      // Attempt to validate as complete data
      const completeValidation = validateProfessionalTierData(data as ProfessionalTierData)

      if (completeValidation.success) {
        const completeness = validateProfessionalFieldCompleteness(data as ProfessionalTierData)
        return {
          isValid: true,
          warnings: [],
          completenessScore: completeness.fieldCount ?
            (completeness.fieldCount / 45) * 100 : 0,
          fieldCount: completeness.fieldCount || 0
        }
      }

      // If complete validation fails, check partial completeness
      const fieldCount = countCompletedFields(data)
      const completenessScore = (fieldCount / 45) * 100

      return {
        isValid: false,
        errors: completeValidation.error?.flatten(),
        warnings: generateWarnings(data),
        completenessScore,
        fieldCount
      }
    } catch (error) {
      return {
        isValid: false,
        errors: { general: 'Validation error' },
        warnings: [],
        completenessScore: 0,
        fieldCount: 0
      }
    }
  }, [])

  /**
   * Load questionnaire from server
   */
  const loadQuestionnaire = useCallback(async (showLoading = true) => {
    if (!user?.id) return

    if (showLoading) setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/questionnaire/professional?businessEvaluationId=${businessEvaluationId}&includeProgress=true&includeDraft=true`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          // No existing questionnaire, keep default data
          return
        }
        throw new Error('Failed to load questionnaire')
      }

      const result = await response.json()
      if (result.success && result.questionnaires) {
        const loadedQuestionnaire = result.questionnaires
        const validation = validateData(loadedQuestionnaire.professionalData)

        setQuestionnaire({
          id: loadedQuestionnaire.id,
          businessEvaluationId,
          data: loadedQuestionnaire.professionalData,
          status: loadedQuestionnaire.status,
          autoSave,
          saveInterval,
          validationStatus: validation,
          metadata: {
            createdAt: new Date(loadedQuestionnaire.metadata.createdAt),
            updatedAt: new Date(loadedQuestionnaire.metadata.updatedAt),
            lastSavedAt: loadedQuestionnaire.metadata.lastSavedAt ?
              new Date(loadedQuestionnaire.metadata.lastSavedAt) : undefined,
            version: loadedQuestionnaire.metadata.version,
            fieldCount: validation.fieldCount
          }
        })

        lastSaveRef.current = new Date(loadedQuestionnaire.metadata.lastSavedAt || loadedQuestionnaire.metadata.updatedAt)
      }
    } catch (err) {
      console.error('Failed to load questionnaire:', err)
      setError(err instanceof Error ? err.message : 'Failed to load questionnaire')
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [user?.id, businessEvaluationId, autoSave, saveInterval, validateData])

  /**
   * Save questionnaire to server
   */
  const saveQuestionnaire = useCallback(async (data?: Partial<ProfessionalTierData>, immediate = false) => {
    if (!user?.id) return

    const dataToSave = data || questionnaire.data
    setIsSaving(true)
    setError(null)

    try {
      const url = questionnaire.id
        ? `/api/questionnaire/professional/${questionnaire.id}`
        : '/api/questionnaire/professional'

      const method = questionnaire.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(questionnaire.id ? { questionnaireId: questionnaire.id } : {}),
          businessEvaluationId,
          professionalData: dataToSave,
          autoSave,
          saveInterval,
          partialUpdate: !immediate
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save questionnaire')
      }

      const result = await response.json()
      if (result.success) {
        const savedQuestionnaire = result.questionnaire
        const validation = validateData(savedQuestionnaire.professionalData)

        setQuestionnaire(prev => ({
          ...prev,
          id: savedQuestionnaire.id,
          data: savedQuestionnaire.professionalData,
          status: savedQuestionnaire.status,
          validationStatus: validation,
          metadata: {
            ...prev.metadata,
            updatedAt: new Date(savedQuestionnaire.metadata.updatedAt),
            lastSavedAt: new Date(),
            fieldCount: validation.fieldCount
          }
        }))

        lastSaveRef.current = new Date()
        setConflicts([])

        return result
      }
    } catch (err) {
      console.error('Failed to save questionnaire:', err)
      setError(err instanceof Error ? err.message : 'Failed to save questionnaire')
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [user?.id, questionnaire, businessEvaluationId, autoSave, saveInterval, validateData])

  /**
   * Auto-save with debouncing
   */
  const autoSaveQuestionnaire = useCallback((data: Partial<ProfessionalTierData>) => {
    if (!autoSave) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await progressTracking.updateSectionData('auto-save', data)
      } catch (error) {
        console.warn('Auto-save via progress tracking failed:', error)
        // Fallback to direct save
        try {
          await saveQuestionnaire(data, false)
        } catch (saveError) {
          console.error('Auto-save fallback failed:', saveError)
        }
      }
    }, debounceMs)
  }, [autoSave, debounceMs, progressTracking, saveQuestionnaire])

  /**
   * Update questionnaire data
   */
  const updateData = useCallback((
    updates: Partial<ProfessionalTierData> | ((prev: Partial<ProfessionalTierData>) => Partial<ProfessionalTierData>),
    section?: string
  ) => {
    setQuestionnaire(prev => {
      const newData = typeof updates === 'function' ? updates(prev.data) : { ...prev.data, ...updates }

      // Validate if enabled
      let validation = prev.validationStatus
      if (validateOnChange) {
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current)
        }

        validationTimeoutRef.current = setTimeout(() => {
          validation = validateData(newData)
          setQuestionnaire(current => ({
            ...current,
            validationStatus: validation
          }))
        }, 300)
      }

      const updated = {
        ...prev,
        data: newData,
        status: (prev.status === 'draft' ? 'in_progress' : prev.status) as any,
        metadata: {
          ...prev.metadata,
          fieldCount: validation.fieldCount
        }
      }

      // Trigger auto-save
      autoSaveQuestionnaire(newData)

      // Update progress tracking
      if (section) {
        progressTracking.updateSectionData(section, updates)
      } else {
        progressTracking.updateProgress({
          sectionData: updates as Record<string, any>
        })
      }

      return updated
    })
  }, [validateOnChange, validateData, autoSaveQuestionnaire, progressTracking])

  /**
   * Update specific field
   */
  const updateField = useCallback((fieldPath: string, value: any) => {
    const [section, field] = fieldPath.split('.')

    if (!section || !field) {
      console.warn('Invalid field path:', fieldPath)
      return
    }

    updateData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof ProfessionalTierData],
        [field]: value
      }
    }), section)

    // Update progress tracking for field-level changes
    progressTracking.updateFieldData(fieldPath, value)
    progressTracking.setLastActiveField(fieldPath)
  }, [updateData, progressTracking])

  /**
   * Update entire section
   */
  const updateSection = useCallback((sectionName: keyof ProfessionalTierData, sectionData: any) => {
    updateData(prev => ({
      ...prev,
      [sectionName]: sectionData
    }), sectionName)

    progressTracking.setCurrentSection(sectionName)
  }, [updateData, progressTracking])

  /**
   * Mark section as completed
   */
  const completeSection = useCallback((sectionName: string) => {
    progressTracking.completeSection(sectionName)

    // Update status if all sections are completed
    const allSections = ['financialMetrics', 'customerAnalytics', 'operationalEfficiency', 'marketIntelligence', 'financialPlanning', 'compliance']
    const completedSections = [...progressTracking.progress.completedSections, sectionName]

    if (completedSections.length === allSections.length) {
      setQuestionnaire(prev => ({
        ...prev,
        status: 'completed'
      }))
    }
  }, [progressTracking])

  /**
   * Submit questionnaire for final processing
   */
  const submitQuestionnaire = useCallback(async () => {
    try {
      // Final validation
      const validation = validateData(questionnaire.data)
      if (!validation.isValid) {
        setError('Please complete all required fields before submitting')
        return false
      }

      // Save with final status
      await saveQuestionnaire(questionnaire.data, true)

      setQuestionnaire(prev => ({
        ...prev,
        status: 'submitted'
      }))

      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit questionnaire')
      return false
    }
  }, [questionnaire.data, validateData, saveQuestionnaire])

  /**
   * Reset questionnaire to default state
   */
  const resetQuestionnaire = useCallback(() => {
    setQuestionnaire({
      businessEvaluationId,
      data: DEFAULT_PROFESSIONAL_DATA,
      status: 'draft',
      autoSave,
      saveInterval,
      validationStatus: {
        isValid: false,
        warnings: [],
        completenessScore: 0
      },
      metadata: {
        fieldCount: 0
      }
    })

    progressTracking.resetProgress()
    setError(null)
    setConflicts([])
  }, [businessEvaluationId, autoSave, saveInterval, progressTracking])

  // Load questionnaire on mount
  useEffect(() => {
    if (loadOnMount) {
      loadQuestionnaire()
    }
  }, [loadOnMount, loadQuestionnaire])

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])

  return {
    // State
    questionnaire,
    isLoading,
    isSaving,
    error,
    conflicts,

    // Progress tracking
    progress: progressTracking.progress,
    saveStatus: progressTracking.saveStatus,
    lastSaved: lastSaveRef.current,

    // Data manipulation
    updateData,
    updateField,
    updateSection,
    completeSection,

    // Questionnaire operations
    loadQuestionnaire,
    saveQuestionnaire,
    submitQuestionnaire,
    resetQuestionnaire,

    // Validation
    validateData,

    // Utilities
    reload: () => loadQuestionnaire(false),
    saveNow: () => saveQuestionnaire(questionnaire.data, true),
    setCurrentSection: progressTracking.setCurrentSection,
    getSectionProgress: progressTracking.getSectionProgress
  }
}

// Helper functions
function countCompletedFields(data: Partial<ProfessionalTierData>): number {
  let count = 0

  Object.entries(data).forEach(([section, sectionData]) => {
    if (sectionData && typeof sectionData === 'object') {
      Object.values(sectionData).forEach(value => {
        if (value !== null && value !== undefined && value !== '' &&
            !(Array.isArray(value) && value.length === 0)) {
          count++
        }
      })
    }
  })

  return count
}

function generateWarnings(data: Partial<ProfessionalTierData>): string[] {
  const warnings: string[] = []

  // Financial metrics warnings
  if (data.financialMetrics) {
    const fm = data.financialMetrics
    if (fm.netProfit !== undefined && fm.ebitda !== undefined &&
        fm.netProfit < 0 && fm.ebitda > 0) {
      warnings.push('Net profit is negative but EBITDA is positive - please verify calculations')
    }
  }

  // Customer analytics warnings
  if (data.customerAnalytics) {
    const ca = data.customerAnalytics
    if (ca.churnRate !== undefined && ca.churnRate > 50) {
      warnings.push('Churn rate above 50% may indicate data entry error')
    }
  }

  return warnings
}