'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSafeUser as useUser } from './use-safe-clerk'

export interface ProgressData {
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
  }>
}

export interface ProgressTrackingOptions {
  questionnaireId: string
  businessEvaluationId: string
  autoSave?: boolean
  saveInterval?: number
  sessionPersistence?: boolean
  trackFieldLevel?: boolean
}

export interface ProgressUpdate {
  currentSection?: string
  completedSections?: string[]
  lastActiveField?: string
  sectionData?: Record<string, any>
  fieldData?: Record<string, any>
}

const STORAGE_PREFIX = 'prof_questionnaire_progress_'
const DEFAULT_SECTIONS = [
  'financialMetrics',
  'customerAnalytics',
  'operationalEfficiency',
  'marketIntelligence',
  'financialPlanning',
  'compliance'
]

export function useProfessionalQuestionnaireProgress(options: ProgressTrackingOptions) {
  const { user } = useUser()
  const {
    questionnaireId,
    businessEvaluationId,
    autoSave = true,
    saveInterval = 30,
    sessionPersistence = true,
    trackFieldLevel = true
  } = options

  const [progress, setProgress] = useState<ProgressData>({
    completedSections: [],
    totalSections: DEFAULT_SECTIONS.length,
    percentageComplete: 0,
    timeSpent: 0,
    startedAt: new Date(),
    lastUpdatedAt: new Date(),
    sectionProgress: {}
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Refs for tracking
  const startTimeRef = useRef<Date>(new Date())
  const currentSectionTimeRef = useRef<Date>(new Date())
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const progressDataRef = useRef<ProgressData>(progress)

  // Update ref when progress changes
  useEffect(() => {
    progressDataRef.current = progress
  }, [progress])

  // Storage key for session persistence
  const storageKey = `${STORAGE_PREFIX}${questionnaireId}`

  /**
   * Load progress from session storage
   */
  const loadStoredProgress = useCallback((): ProgressData | null => {
    if (!sessionPersistence || typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          ...parsed,
          startedAt: new Date(parsed.startedAt),
          lastUpdatedAt: new Date(parsed.lastUpdatedAt)
        }
      }
    } catch (error) {
      console.warn('Failed to load stored progress:', error)
    }

    return null
  }, [storageKey, sessionPersistence])

  /**
   * Save progress to session storage
   */
  const saveToStorage = useCallback((progressData: ProgressData) => {
    if (!sessionPersistence || typeof window === 'undefined') return

    try {
      localStorage.setItem(storageKey, JSON.stringify(progressData))
    } catch (error) {
      console.warn('Failed to save progress to storage:', error)
    }
  }, [storageKey, sessionPersistence])

  /**
   * Load initial progress from API and storage
   */
  const loadProgress = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      // Try to load from session storage first for immediate UX
      const storedProgress = loadStoredProgress()
      if (storedProgress) {
        setProgress(storedProgress)
      }

      // Then load from API for authoritative data
      const response = await fetch(
        `/api/questionnaire/professional?businessEvaluationId=${businessEvaluationId}&includeProgress=true`,
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
        const mergedProgress: ProgressData = {
          currentSection: storedProgress?.currentSection || serverProgress.currentSection,
          completedSections: serverProgress.completedSections || [],
          totalSections: serverProgress.totalSections || DEFAULT_SECTIONS.length,
          percentageComplete: serverProgress.percentageComplete || 0,
          lastActiveField: storedProgress?.lastActiveField || serverProgress.lastActiveField,
          timeSpent: Math.max(storedProgress?.timeSpent || 0, serverProgress.timeSpent || 0),
          startedAt: new Date(serverProgress.startedAt || storedProgress?.startedAt || new Date()),
          lastUpdatedAt: new Date(serverProgress.lastUpdatedAt || new Date()),
          sectionProgress: storedProgress?.sectionProgress || {}
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
  }, [user?.id, businessEvaluationId, loadStoredProgress, saveToStorage])

  /**
   * Auto-save progress to server
   */
  const autoSaveProgress = useCallback(async (progressUpdate: ProgressUpdate) => {
    if (!autoSave || !user?.id) return

    setSaveStatus('saving')

    try {
      const response = await fetch('/api/questionnaire/professional/save', {
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
            totalSections: DEFAULT_SECTIONS.length,
            percentageComplete: progressDataRef.current.percentageComplete,
            lastActiveField: progressUpdate.lastActiveField,
            timeSpent: progressDataRef.current.timeSpent
          },
          sectionData: progressUpdate.sectionData,
          fieldData: progressUpdate.fieldData,
          metadata: {
            saveReason: 'auto',
            clientTimestamp: new Date().toISOString(),
            sessionId: storageKey,
            pageUrl: window.location.href
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
  }, [autoSave, user?.id, questionnaireId, businessEvaluationId, storageKey])

  /**
   * Update progress with debounced auto-save
   */
  const updateProgress = useCallback((update: ProgressUpdate) => {
    const now = new Date()

    setProgress(prev => {
      const updated: ProgressData = {
        ...prev,
        currentSection: update.currentSection ?? prev.currentSection,
        completedSections: update.completedSections ?? prev.completedSections,
        lastActiveField: update.lastActiveField ?? prev.lastActiveField,
        lastUpdatedAt: now,
        timeSpent: prev.timeSpent + (now.getTime() - prev.lastUpdatedAt.getTime()) / 1000
      }

      // Update section progress if tracking field level
      if (trackFieldLevel && update.currentSection) {
        updated.sectionProgress[update.currentSection] = {
          ...updated.sectionProgress[update.currentSection],
          lastVisited: now,
          timeSpent: (updated.sectionProgress[update.currentSection]?.timeSpent || 0) +
            (now.getTime() - currentSectionTimeRef.current.getTime()) / 1000
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
  }, [trackFieldLevel, saveToStorage, autoSave, saveInterval, autoSaveProgress])

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
   * Force save progress immediately
   */
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    await autoSaveProgress({
      currentSection: progress.currentSection,
      completedSections: progress.completedSections,
      lastActiveField: progress.lastActiveField
    })
  }, [autoSaveProgress, progress])

  /**
   * Reset progress
   */
  const resetProgress = useCallback(() => {
    const resetData: ProgressData = {
      completedSections: [],
      totalSections: DEFAULT_SECTIONS.length,
      percentageComplete: 0,
      timeSpent: 0,
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
      sectionProgress: {}
    }

    setProgress(resetData)
    saveToStorage(resetData)
    startTimeRef.current = new Date()
    currentSectionTimeRef.current = new Date()
  }, [saveToStorage])

  /**
   * Get section progress details
   */
  const getSectionProgress = useCallback((sectionName: string) => {
    return progress.sectionProgress[sectionName] || {
      completed: progress.completedSections.includes(sectionName),
      fieldsCompleted: 0,
      totalFields: 0,
      timeSpent: 0
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
        '/api/questionnaire/professional/save',
        JSON.stringify({
          questionnaireId,
          businessEvaluationId,
          progressData: progressDataRef.current,
          metadata: {
            saveReason: 'navigation',
            clientTimestamp: new Date().toISOString()
          }
        })
      )
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [questionnaireId, businessEvaluationId])

  return {
    // Progress state
    progress,
    isLoading,
    error,

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
    saveNow,
    resetProgress,

    // Progress queries
    getSectionProgress,

    // Utils
    reload: loadProgress
  }
}