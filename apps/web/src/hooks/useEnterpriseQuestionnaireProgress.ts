'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSafeUser as useUser } from './use-safe-clerk'
import {
  EnterpriseTierData,
  validateEnterpriseTierData,
  EnterpriseTierDataSchema,
  PartialEnterpriseTierDataSchema
} from '@/lib/validations/enterprise-tier'

export interface EnterpriseProgressData {
  currentSection?: string
  completedSections: string[]
  totalSections: number
  percentageComplete: number
  lastActiveField?: string
  timeSpent: number
  startedAt: Date
  lastUpdatedAt: Date
  sectionProgress: Record<string, {
    completed: boolean
    fieldsCompleted: number
    totalFields: number
    timeSpent: number
    lastVisited?: Date
    validationErrors?: string[]
    isValid?: boolean
  }>
  professionalDataImported?: boolean
  professionalImportedAt?: Date
  enterpriseData?: Partial<EnterpriseTierData>
  validationResults?: {
    isValid: boolean
    errors: string[]
    sectionErrors: Record<string, string[]>
  }
}

export interface EnterpriseProgressTrackingOptions {
  questionnaireId: string
  businessEvaluationId: string
  autoSave?: boolean
  saveInterval?: number
  sessionPersistence?: boolean
  trackFieldLevel?: boolean
  enableEncryption?: boolean
  validateOnUpdate?: boolean
}

export interface EnterpriseProgressUpdate {
  currentSection?: string
  completedSections?: string[]
  lastActiveField?: string
  sectionData?: Record<string, any>
  fieldData?: Record<string, any>
  enterpriseData?: Partial<EnterpriseTierData>
  validationOverride?: boolean
}

const STORAGE_PREFIX = 'enterprise_questionnaire_progress_'
const DEFAULT_ENTERPRISE_SECTIONS = [
  // Professional tier sections (5)
  'financial-performance',
  'customer-risk',
  'competitive-market',
  'operational-strategic',
  'value-enhancement',
  // Enterprise tier sections (5)
  'strategic-value-drivers',
  'operational-scalability',
  'financial-optimization',
  'strategic-scenario-planning',
  'multi-year-projections'
]

const SECTION_FIELD_COUNTS = {
  'financial-performance': 13,
  'customer-risk': 10,
  'competitive-market': 9,
  'operational-strategic': 7,
  'value-enhancement': 5,
  'strategic-value-drivers': 15,
  'operational-scalability': 12,
  'financial-optimization': 16,
  'strategic-scenario-planning': 18,
  'multi-year-projections': 20
} as const

export function useEnterpriseQuestionnaireProgress(options: EnterpriseProgressTrackingOptions) {
  const { user } = useUser()
  const {
    questionnaireId,
    businessEvaluationId,
    autoSave = true,
    saveInterval = 30,
    sessionPersistence = true,
    trackFieldLevel = true,
    enableEncryption = true,
    validateOnUpdate = true
  } = options

  const [progress, setProgress] = useState<EnterpriseProgressData>({
    completedSections: [],
    totalSections: DEFAULT_ENTERPRISE_SECTIONS.length,
    percentageComplete: 0,
    timeSpent: 0,
    startedAt: new Date(),
    lastUpdatedAt: new Date(),
    sectionProgress: {},
    professionalDataImported: false,
    enterpriseData: {},
    validationResults: {
      isValid: false,
      errors: [],
      sectionErrors: {}
    }
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])

  // Refs for tracking
  const startTimeRef = useRef<Date>(new Date())
  const currentSectionTimeRef = useRef<Date>(new Date())
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const progressDataRef = useRef<EnterpriseProgressData>(progress)
  const encryptionKeyRef = useRef<string>()

  // Update ref when progress changes
  useEffect(() => {
    progressDataRef.current = progress
  }, [progress])

  // Storage key for session persistence
  const storageKey = `${STORAGE_PREFIX}${questionnaireId}`

  /**
   * Initialize encryption key for sensitive data
   */
  const initializeEncryption = useCallback(() => {
    if (!enableEncryption || encryptionKeyRef.current) return

    // Generate or retrieve encryption key
    const storedKey = sessionStorage.getItem(`${storageKey}_encryption_key`)
    if (storedKey) {
      encryptionKeyRef.current = storedKey
    } else {
      // Generate new key
      const key = btoa(Math.random().toString(36)).substring(0, 32)
      encryptionKeyRef.current = key
      sessionStorage.setItem(`${storageKey}_encryption_key`, key)
    }
  }, [enableEncryption, storageKey])

  /**
   * Encrypt sensitive field data
   */
  const encryptSensitiveData = useCallback((data: any): any => {
    if (!enableEncryption || !encryptionKeyRef.current) return data

    // This is a simplified encryption - in production, use proper crypto libraries
    try {
      const sensitiveFields = [
        'ownerCompensation',
        'marketRateCompensation',
        'totalDebt',
        'debtServiceRequirements',
        'cashFlow',
        'annualRevenue'
      ]

      const encryptedData = { ...data }

      for (const field of sensitiveFields) {
        if (encryptedData[field] !== undefined) {
          const value = JSON.stringify(encryptedData[field])
          encryptedData[field] = btoa(value + encryptionKeyRef.current)
        }
      }

      return encryptedData
    } catch (error) {
      console.warn('Failed to encrypt sensitive data:', error)
      return data
    }
  }, [enableEncryption])

  /**
   * Decrypt sensitive field data
   */
  const decryptSensitiveData = useCallback((data: any): any => {
    if (!enableEncryption || !encryptionKeyRef.current) return data

    try {
      const sensitiveFields = [
        'ownerCompensation',
        'marketRateCompensation',
        'totalDebt',
        'debtServiceRequirements',
        'cashFlow',
        'annualRevenue'
      ]

      const decryptedData = { ...data }

      for (const field of sensitiveFields) {
        if (decryptedData[field] && typeof decryptedData[field] === 'string') {
          try {
            const decrypted = atob(decryptedData[field])
            const value = decrypted.replace(encryptionKeyRef.current!, '')
            decryptedData[field] = JSON.parse(value)
          } catch (error) {
            // If decryption fails, assume data is not encrypted
            continue
          }
        }
      }

      return decryptedData
    } catch (error) {
      console.warn('Failed to decrypt sensitive data:', error)
      return data
    }
  }, [enableEncryption])

  /**
   * Validate enterprise data using comprehensive schema
   */
  const validateEnterpriseData = useCallback((data: Partial<EnterpriseTierData>) => {
    if (!validateOnUpdate) return { isValid: true, errors: [] }

    try {
      // Use partial schema for incremental validation
      const result = PartialEnterpriseTierDataSchema.safeParse(data)

      if (result.success) {
        // Perform cross-section validation if we have complete data
        const completeData = EnterpriseTierDataSchema.safeParse(data)
        if (completeData.success) {
          return validateEnterpriseTierData(completeData.data)
        }
        return { isValid: true, errors: [] }
      } else {
        return {
          isValid: false,
          errors: result.error.issues.map(issue =>
            `${issue.path.join('.')}: ${issue.message}`
          )
        }
      }
    } catch (error) {
      console.error('Validation error:', error)
      return {
        isValid: false,
        errors: ['Validation failed due to unexpected error']
      }
    }
  }, [validateOnUpdate])

  /**
   * Load progress from session storage
   */
  const loadStoredProgress = useCallback((): EnterpriseProgressData | null => {
    if (!sessionPersistence || typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        const decryptedData = decryptSensitiveData(parsed.enterpriseData || {})

        return {
          ...parsed,
          startedAt: new Date(parsed.startedAt),
          lastUpdatedAt: new Date(parsed.lastUpdatedAt),
          professionalImportedAt: parsed.professionalImportedAt ? new Date(parsed.professionalImportedAt) : undefined,
          enterpriseData: decryptedData
        }
      }
    } catch (error) {
      console.warn('Failed to load stored progress:', error)
    }

    return null
  }, [storageKey, sessionPersistence, decryptSensitiveData])

  /**
   * Save progress to session storage
   */
  const saveToStorage = useCallback((progressData: EnterpriseProgressData) => {
    if (!sessionPersistence || typeof window === 'undefined') return

    try {
      const encryptedData = encryptSensitiveData(progressData.enterpriseData || {})
      const dataToStore = {
        ...progressData,
        enterpriseData: encryptedData
      }
      localStorage.setItem(storageKey, JSON.stringify(dataToStore))
    } catch (error) {
      console.warn('Failed to save progress to storage:', error)
    }
  }, [storageKey, sessionPersistence, encryptSensitiveData])

  /**
   * Import Professional tier data
   */
  const importProfessionalData = useCallback(async (professionalData: any) => {
    try {
      setProgress(prev => ({
        ...prev,
        professionalDataImported: true,
        professionalImportedAt: new Date(),
        lastUpdatedAt: new Date(),
        // Map professional data to appropriate sections
        sectionProgress: {
          ...prev.sectionProgress,
          'financial-performance': {
            ...prev.sectionProgress['financial-performance'],
            completed: true,
            fieldsCompleted: SECTION_FIELD_COUNTS['financial-performance'],
            totalFields: SECTION_FIELD_COUNTS['financial-performance'],
            timeSpent: 0
          },
          'customer-risk': {
            ...prev.sectionProgress['customer-risk'],
            completed: true,
            fieldsCompleted: SECTION_FIELD_COUNTS['customer-risk'],
            totalFields: SECTION_FIELD_COUNTS['customer-risk'],
            timeSpent: 0
          },
          'competitive-market': {
            ...prev.sectionProgress['competitive-market'],
            completed: true,
            fieldsCompleted: SECTION_FIELD_COUNTS['competitive-market'],
            totalFields: SECTION_FIELD_COUNTS['competitive-market'],
            timeSpent: 0
          },
          'operational-strategic': {
            ...prev.sectionProgress['operational-strategic'],
            completed: true,
            fieldsCompleted: SECTION_FIELD_COUNTS['operational-strategic'],
            totalFields: SECTION_FIELD_COUNTS['operational-strategic'],
            timeSpent: 0
          },
          'value-enhancement': {
            ...prev.sectionProgress['value-enhancement'],
            completed: true,
            fieldsCompleted: SECTION_FIELD_COUNTS['value-enhancement'],
            totalFields: SECTION_FIELD_COUNTS['value-enhancement'],
            timeSpent: 0
          }
        },
        completedSections: [
          ...prev.completedSections.filter(s => !s.startsWith('financial-') &&
            !s.startsWith('customer-') && !s.startsWith('competitive-') &&
            !s.startsWith('operational-') && !s.startsWith('value-')),
          'financial-performance',
          'customer-risk',
          'competitive-market',
          'operational-strategic',
          'value-enhancement'
        ]
      }))
    } catch (error) {
      console.error('Failed to import professional data:', error)
      setError('Failed to import professional tier data')
    }
  }, [])

  /**
   * Load initial progress from API and storage
   */
  const loadProgress = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)
    initializeEncryption()

    try {
      // Try to load from session storage first for immediate UX
      const storedProgress = loadStoredProgress()
      if (storedProgress) {
        setProgress(storedProgress)
      }

      // Then load from API for authoritative data
      const response = await fetch(
        `/api/questionnaire/enterprise?businessEvaluationId=${businessEvaluationId}&includeProgress=true`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to load progress')
      }

      const data = await response.json()
      if (data.success && data.questionnaires) {
        const questionnaire = data.questionnaires
        const serverProgress = questionnaire.progress

        // Merge server data with local tracking
        const mergedProgress: EnterpriseProgressData = {
          currentSection: storedProgress?.currentSection || serverProgress.currentSection,
          completedSections: serverProgress.completedSections || [],
          totalSections: serverProgress.totalSections || DEFAULT_ENTERPRISE_SECTIONS.length,
          percentageComplete: serverProgress.percentageComplete || 0,
          lastActiveField: storedProgress?.lastActiveField || serverProgress.lastActiveField,
          timeSpent: Math.max(storedProgress?.timeSpent || 0, serverProgress.timeSpent || 0),
          startedAt: new Date(serverProgress.startedAt || storedProgress?.startedAt || new Date()),
          lastUpdatedAt: new Date(serverProgress.lastUpdatedAt || new Date()),
          sectionProgress: storedProgress?.sectionProgress || {},
          professionalDataImported: serverProgress.professionalDataImported || false,
          professionalImportedAt: serverProgress.professionalImportedAt ? new Date(serverProgress.professionalImportedAt) : undefined,
          enterpriseData: decryptSensitiveData(serverProgress.enterpriseData || {}),
          validationResults: {
            isValid: false,
            errors: [],
            sectionErrors: {}
          }
        }

        setProgress(mergedProgress)
        saveToStorage(mergedProgress)
      }
    } catch (err) {
      console.error('Failed to load progress:', err)
      setError(err instanceof Error ? err.message : 'Failed to load progress')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, businessEvaluationId, loadStoredProgress, saveToStorage, initializeEncryption, decryptSensitiveData])

  /**
   * Auto-save progress to server
   */
  const autoSaveProgress = useCallback(async (progressUpdate: EnterpriseProgressUpdate) => {
    if (!autoSave || !user?.id) return

    setSaveStatus('saving')

    try {
      const response = await fetch('/api/questionnaire/enterprise/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionnaireId,
          businessEvaluationId,
          progressData: {
            currentSection: progressUpdate.currentSection,
            completedSections: progressUpdate.completedSections,
            totalSections: DEFAULT_ENTERPRISE_SECTIONS.length,
            percentageComplete: progressDataRef.current.percentageComplete,
            lastActiveField: progressUpdate.lastActiveField,
            timeSpent: progressDataRef.current.timeSpent,
            professionalDataImported: progressDataRef.current.professionalDataImported,
            professionalImportedAt: progressDataRef.current.professionalImportedAt,
            validationResults: progressDataRef.current.validationResults
          },
          sectionData: progressUpdate.sectionData,
          fieldData: progressUpdate.fieldData,
          enterpriseData: encryptSensitiveData(progressUpdate.enterpriseData || {}),
          metadata: {
            saveReason: 'auto',
            clientTimestamp: new Date().toISOString(),
            sessionId: storageKey,
            pageUrl: window.location.href,
            encryptionEnabled: enableEncryption
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setLastSaved(new Date())
          setSaveStatus('saved')

          // Reset to idle after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000)
        } else {
          throw new Error(data.error || 'Save failed')
        }
      } else {
        throw new Error('Save request failed')
      }
    } catch (err) {
      console.error('Auto-save failed:', err)
      setSaveStatus('error')

      // Reset to idle after 5 seconds on error
      setTimeout(() => setSaveStatus('idle'), 5000)
    }
  }, [autoSave, user?.id, questionnaireId, businessEvaluationId, storageKey, enableEncryption, encryptSensitiveData])

  /**
   * Update progress with debounced auto-save and validation
   */
  const updateProgress = useCallback((update: EnterpriseProgressUpdate) => {
    const now = new Date()

    setProgress(prev => {
      const updated: EnterpriseProgressData = {
        ...prev,
        currentSection: update.currentSection ?? prev.currentSection,
        completedSections: update.completedSections ?? prev.completedSections,
        lastActiveField: update.lastActiveField ?? prev.lastActiveField,
        lastUpdatedAt: now,
        timeSpent: prev.timeSpent + (now.getTime() - prev.lastUpdatedAt.getTime()) / 1000,
        enterpriseData: {
          ...prev.enterpriseData,
          ...update.enterpriseData
        }
      }

      // Update section progress if tracking field level
      if (trackFieldLevel && update.currentSection) {
        updated.sectionProgress[update.currentSection] = {
          ...updated.sectionProgress[update.currentSection],
          lastVisited: now,
          timeSpent: (updated.sectionProgress[update.currentSection]?.timeSpent || 0) +
            (now.getTime() - currentSectionTimeRef.current.getTime()) / 1000,
          totalFields: SECTION_FIELD_COUNTS[update.currentSection as keyof typeof SECTION_FIELD_COUNTS] || 0
        }
      }

      // Validate enterprise data if enabled
      if (validateOnUpdate && updated.enterpriseData) {
        const validationResult = validateEnterpriseData(updated.enterpriseData)
        updated.validationResults = {
          ...validationResult,
          sectionErrors: {} // TODO: Implement section-specific validation
        }

        if (!validationResult.isValid) {
          setValidationWarnings(validationResult.errors)
        } else {
          setValidationWarnings([])
        }
      }

      // Recalculate percentage
      updated.percentageComplete = Math.round(
        (updated.completedSections.length / updated.totalSections) * 100
      )

      // Save to local storage immediately
      saveToStorage(updated)

      return updated
    })

    // Update section time tracking
    currentSectionTimeRef.current = now

    // Debounced auto-save
    if (autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        autoSaveProgress(update)
      }, saveInterval * 1000)
    }
  }, [trackFieldLevel, saveToStorage, autoSave, saveInterval, autoSaveProgress, validateOnUpdate, validateEnterpriseData])

  /**
   * Mark section as completed
   */
  const completeSection = useCallback((sectionName: string) => {
    updateProgress({
      completedSections: [...new Set([...progress.completedSections, sectionName])]
    })
  }, [progress.completedSections, updateProgress])

  /**
   * Set current active section
   */
  const setCurrentSection = useCallback((sectionName: string) => {
    updateProgress({
      currentSection: sectionName
    })
  }, [updateProgress])

  /**
   * Set last active field
   */
  const setLastActiveField = useCallback((fieldName: string) => {
    updateProgress({
      lastActiveField: fieldName
    })
  }, [updateProgress])

  /**
   * Update field data with progress tracking
   */
  const updateFieldData = useCallback((fieldPath: string, value: any) => {
    updateProgress({
      fieldData: { [fieldPath]: value },
      lastActiveField: fieldPath
    })
  }, [updateProgress])

  /**
   * Update section data with progress tracking
   */
  const updateSectionData = useCallback((sectionName: string, data: any) => {
    updateProgress({
      sectionData: { [sectionName]: data },
      currentSection: sectionName
    })
  }, [updateProgress])

  /**
   * Update enterprise-specific data
   */
  const updateEnterpriseData = useCallback((data: Partial<EnterpriseTierData>) => {
    updateProgress({
      enterpriseData: data
    })
  }, [updateProgress])

  /**
   * Force save progress immediately
   */
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    await autoSaveProgress({
      currentSection: progress.currentSection,
      completedSections: progress.completedSections,
      lastActiveField: progress.lastActiveField,
      enterpriseData: progress.enterpriseData
    })
  }, [autoSaveProgress, progress])

  /**
   * Reset progress
   */
  const resetProgress = useCallback(() => {
    const resetData: EnterpriseProgressData = {
      completedSections: [],
      totalSections: DEFAULT_ENTERPRISE_SECTIONS.length,
      percentageComplete: 0,
      timeSpent: 0,
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
      sectionProgress: {},
      professionalDataImported: false,
      enterpriseData: {},
      validationResults: {
        isValid: false,
        errors: [],
        sectionErrors: {}
      }
    }

    setProgress(resetData)
    saveToStorage(resetData)
    startTimeRef.current = new Date()
    currentSectionTimeRef.current = new Date()
    setValidationWarnings([])
  }, [saveToStorage])

  /**
   * Get section progress details
   */
  const getSectionProgress = useCallback((sectionName: string) => {
    return progress.sectionProgress[sectionName] || {
      completed: progress.completedSections.includes(sectionName),
      fieldsCompleted: 0,
      totalFields: SECTION_FIELD_COUNTS[sectionName as keyof typeof SECTION_FIELD_COUNTS] || 0,
      timeSpent: 0,
      validationErrors: [],
      isValid: true
    }
  }, [progress.sectionProgress, progress.completedSections])

  // Initialize progress on mount
  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Save progress before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      // Force immediate save on page unload
      navigator.sendBeacon(
        '/api/questionnaire/enterprise/save',
        JSON.stringify({
          questionnaireId,
          businessEvaluationId,
          progressData: progressDataRef.current,
          enterpriseData: encryptSensitiveData(progressDataRef.current.enterpriseData || {}),
          metadata: {
            saveReason: 'navigation',
            clientTimestamp: new Date().toISOString(),
            encryptionEnabled: enableEncryption
          }
        })
      )
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [questionnaireId, businessEvaluationId, enableEncryption, encryptSensitiveData])

  return {
    // Progress state
    progress,
    isLoading,
    error,
    validationWarnings,

    // Save status
    lastSaved,
    saveStatus,

    // Progress actions
    updateProgress,
    completeSection,
    setCurrentSection,
    setLastActiveField,
    updateFieldData,
    updateSectionData,
    updateEnterpriseData,
    saveNow,
    resetProgress,
    importProfessionalData,

    // Progress queries
    getSectionProgress,

    // Utils
    reload: loadProgress
  }
}