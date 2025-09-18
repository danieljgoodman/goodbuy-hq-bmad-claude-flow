/**
 * Optimized Form State Management for Professional Questionnaire
 *
 * High-performance form state management with debounced saving,
 * real-time validation, and intelligent error handling
 * Target: <30s save time for 45 fields with optimal UX
 */

"use client"

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef
} from 'react'
import { ProfessionalTierData } from '@/types/evaluation'
import {
  useOptimizedFormState,
  performanceMonitor,
  performanceBenchmarks
} from '@/lib/performance/questionnaire-optimizer'
import { useQuestionnaireCache } from '@/lib/cache/questionnaire-cache'
import { toast } from 'sonner'

// Form state interface
interface FormState {
  data: ProfessionalTierData
  errors: Record<string, string>
  isLoading: boolean
  isSaving: boolean
  isDirty: boolean
  lastSaved: Date | null
  validationState: 'idle' | 'validating' | 'valid' | 'invalid'
  saveProgress: number
  autoSaveEnabled: boolean
}

// Form actions
type FormAction =
  | { type: 'SET_DATA'; payload: Partial<ProfessionalTierData> }
  | { type: 'SET_SECTION_DATA'; payload: { section: keyof ProfessionalTierData; data: any } }
  | { type: 'SET_FIELD_DATA'; payload: { section: keyof ProfessionalTierData; field: string; value: any } }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'SET_FIELD_ERROR'; payload: { field: string; error: string } }
  | { type: 'CLEAR_FIELD_ERROR'; payload: { field: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: Date }
  | { type: 'SET_VALIDATION_STATE'; payload: FormState['validationState'] }
  | { type: 'SET_SAVE_PROGRESS'; payload: number }
  | { type: 'TOGGLE_AUTO_SAVE' }
  | { type: 'RESET_FORM' }

// Initial state
const createInitialState = (initialData?: Partial<ProfessionalTierData>): FormState => ({
  data: {
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
      workingCapital: 0,
      ...initialData?.financialMetrics
    },
    customerAnalytics: {
      customerAcquisitionCost: 0,
      customerLifetimeValue: 0,
      churnRate: 0,
      netPromoterScore: 0,
      monthlyActiveUsers: 0,
      conversionRate: 0,
      averageOrderValue: 0,
      repeatCustomerRate: 0,
      ...initialData?.customerAnalytics
    },
    operationalEfficiency: {
      employeeProductivity: 0,
      operatingExpenseRatio: 0,
      capacityUtilization: 0,
      inventoryDaysOnHand: 0,
      paymentTermsDays: 0,
      vendorPaymentDays: 0,
      cashConversionCycle: 0,
      ...initialData?.operationalEfficiency
    },
    marketIntelligence: {
      marketShare: 0,
      marketGrowthRate: 0,
      competitorAnalysis: [],
      marketTrends: [],
      threatLevel: 'low' as const,
      opportunityScore: 0,
      ...initialData?.marketIntelligence
    },
    financialPlanning: {
      revenueForecast12Month: Array(12).fill(0),
      expenseForecast12Month: Array(12).fill(0),
      cashFlowForecast12Month: Array(12).fill(0),
      scenarioAnalysis: {
        optimistic: { revenue: 0, expenses: 0 },
        realistic: { revenue: 0, expenses: 0 },
        pessimistic: { revenue: 0, expenses: 0 }
      },
      budgetVariance: 0,
      ...initialData?.financialPlanning
    },
    compliance: {
      regulatoryCompliance: [],
      riskAssessment: {
        financialRisk: 'low' as const,
        operationalRisk: 'low' as const,
        marketRisk: 'low' as const,
        overallRiskScore: 0
      },
      insuranceCoverage: [],
      auditTrail: [],
      ...initialData?.compliance
    }
  },
  errors: {},
  isLoading: false,
  isSaving: false,
  isDirty: false,
  lastSaved: null,
  validationState: 'idle',
  saveProgress: 0,
  autoSaveEnabled: true
})

// Form reducer
const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        data: { ...state.data, ...action.payload },
        isDirty: true,
        validationState: 'idle'
      }

    case 'SET_SECTION_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          [action.payload.section]: {
            ...state.data[action.payload.section],
            ...action.payload.data
          }
        },
        isDirty: true,
        validationState: 'idle'
      }

    case 'SET_FIELD_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          [action.payload.section]: {
            ...state.data[action.payload.section],
            [action.payload.field]: action.payload.value
          }
        },
        isDirty: true,
        validationState: 'idle'
      }

    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload,
        validationState: Object.keys(action.payload).length > 0 ? 'invalid' : 'valid'
      }

    case 'SET_FIELD_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.field]: action.payload.error
        },
        validationState: 'invalid'
      }

    case 'CLEAR_FIELD_ERROR':
      const newErrors = { ...state.errors }
      delete newErrors[action.payload.field]
      return {
        ...state,
        errors: newErrors,
        validationState: Object.keys(newErrors).length > 0 ? 'invalid' : 'valid'
      }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_SAVING':
      return { ...state, isSaving: action.payload }

    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload }

    case 'SET_LAST_SAVED':
      return {
        ...state,
        lastSaved: action.payload,
        isDirty: false,
        saveProgress: 0
      }

    case 'SET_VALIDATION_STATE':
      return { ...state, validationState: action.payload }

    case 'SET_SAVE_PROGRESS':
      return { ...state, saveProgress: action.payload }

    case 'TOGGLE_AUTO_SAVE':
      return { ...state, autoSaveEnabled: !state.autoSaveEnabled }

    case 'RESET_FORM':
      return createInitialState()

    default:
      return state
  }
}

// Context interface
interface FormContextValue {
  state: FormState
  actions: {
    updateData: (data: Partial<ProfessionalTierData>) => void
    updateSection: (section: keyof ProfessionalTierData, data: any) => void
    updateField: (section: keyof ProfessionalTierData, field: string, value: any) => void
    setFieldError: (field: string, error: string) => void
    clearFieldError: (field: string) => void
    saveForm: () => Promise<void>
    loadForm: () => Promise<void>
    resetForm: () => void
    validateForm: () => Promise<boolean>
    toggleAutoSave: () => void
  }
  performance: {
    metrics: Record<string, number>
    benchmarksPassing: boolean
    saveEstimate: number
  }
}

// Create context
const FormContext = createContext<FormContextValue | null>(null)

// Form provider props
interface FormProviderProps {
  children: React.ReactNode
  userId: string
  initialData?: Partial<ProfessionalTierData>
  onSave?: (data: ProfessionalTierData) => Promise<void>
  enableCache?: boolean
  autoSaveInterval?: number
}

// Form provider component
export const OptimizedFormProvider: React.FC<FormProviderProps> = ({
  children,
  userId,
  initialData,
  onSave,
  enableCache = true,
  autoSaveInterval = 5000
}) => {
  const [state, dispatch] = useReducer(formReducer, createInitialState(initialData))
  const saveTimerRef = useRef<NodeJS.Timeout>()
  const performanceMetrics = useRef<Record<string, number>>({})

  // Cache integration
  const cache = useQuestionnaireCache(userId)

  // Optimized form state hook
  const { updateData, saveImmediately, isLoading, isSaving, lastSaved } = useOptimizedFormState(
    state.data,
    async (data: ProfessionalTierData) => {
      performanceMonitor.startTimer('form-save')

      try {
        // Update save progress
        dispatch({ type: 'SET_SAVE_PROGRESS', payload: 25 })

        // Save to cache if enabled
        if (enableCache) {
          cache.saveComplete(data)
          dispatch({ type: 'SET_SAVE_PROGRESS', payload: 50 })
        }

        // Call external save function
        if (onSave) {
          await onSave(data)
        }

        dispatch({ type: 'SET_SAVE_PROGRESS', payload: 100 })

        const saveTime = performanceMonitor.endTimer('form-save')
        performanceMetrics.current.saveTime = saveTime

        // Check save time benchmark
        if (saveTime > performanceBenchmarks.targets.saveTime) {
          toast.warning(`Save took ${Math.round(saveTime / 1000)}s (target: 30s)`)
        } else {
          toast.success('Form saved successfully')
        }

        dispatch({ type: 'SET_LAST_SAVED', payload: new Date() })

      } catch (error) {
        console.error('Save failed:', error)
        toast.error('Failed to save form')
        throw error
      }
    },
    autoSaveInterval
  )

  // Validation logic
  const validateForm = useCallback(async (): Promise<boolean> => {
    dispatch({ type: 'SET_VALIDATION_STATE', payload: 'validating' })

    const errors: Record<string, string> = {}

    // Financial validation
    if (state.data.financialMetrics.annualRevenue <= 0) {
      errors['annualRevenue'] = 'Annual revenue is required'
    }
    if (state.data.financialMetrics.grossMargin < 0 || state.data.financialMetrics.grossMargin > 100) {
      errors['grossMargin'] = 'Gross margin must be between 0-100%'
    }

    // Customer validation
    if (state.data.customerAnalytics.customerAcquisitionCost <= 0) {
      errors['customerAcquisitionCost'] = 'Customer acquisition cost is required'
    }
    if (state.data.customerAnalytics.customerLifetimeValue <= 0) {
      errors['customerLifetimeValue'] = 'Customer lifetime value is required'
    }

    dispatch({ type: 'SET_ERRORS', payload: errors })

    const isValid = Object.keys(errors).length === 0
    dispatch({ type: 'SET_VALIDATION_STATE', payload: isValid ? 'valid' : 'invalid' })

    return isValid
  }, [state.data])

  // Form actions
  const actions = useMemo(() => ({
    updateData: (data: Partial<ProfessionalTierData>) => {
      dispatch({ type: 'SET_DATA', payload: data })
      updateData(data)
    },

    updateSection: (section: keyof ProfessionalTierData, data: any) => {
      dispatch({ type: 'SET_SECTION_DATA', payload: { section, data } })
      updateData({ [section]: { ...state.data[section], ...data } })
    },

    updateField: (section: keyof ProfessionalTierData, field: string, value: any) => {
      dispatch({ type: 'SET_FIELD_DATA', payload: { section, field, value } })
      updateData({
        [section]: {
          ...state.data[section],
          [field]: value
        }
      })
    },

    setFieldError: (field: string, error: string) => {
      dispatch({ type: 'SET_FIELD_ERROR', payload: { field, error } })
    },

    clearFieldError: (field: string) => {
      dispatch({ type: 'CLEAR_FIELD_ERROR', payload: { field } })
    },

    saveForm: async () => {
      const isValid = await validateForm()
      if (isValid) {
        await saveImmediately()
      }
    },

    loadForm: async () => {
      dispatch({ type: 'SET_LOADING', payload: true })

      try {
        if (enableCache) {
          const cachedData = cache.loadComplete()
          if (cachedData) {
            dispatch({ type: 'SET_DATA', payload: cachedData })
            toast.success('Form data loaded from cache')
          }
        }
      } catch (error) {
        console.error('Load failed:', error)
        toast.error('Failed to load form data')
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },

    resetForm: () => {
      dispatch({ type: 'RESET_FORM' })
      if (enableCache) {
        cache.clearData()
      }
      toast.success('Form reset')
    },

    validateForm,

    toggleAutoSave: () => {
      dispatch({ type: 'TOGGLE_AUTO_SAVE' })
      toast.info(state.autoSaveEnabled ? 'Auto-save disabled' : 'Auto-save enabled')
    }
  }), [state, updateData, saveImmediately, validateForm, cache, enableCache])

  // Performance monitoring
  const performance = useMemo(() => {
    const metrics = performanceMetrics.current
    const benchmarks = performanceBenchmarks.checkBenchmarks({
      loadTime: metrics.loadTime || 0,
      saveTime: metrics.saveTime || 0,
      renderTime: metrics.renderTime || 0,
      bundleSize: metrics.bundleSize || 0,
      memoryUsage: performanceMonitor.estimateMemoryUsage(),
      fieldCount: 45
    })

    return {
      metrics,
      benchmarksPassing: Object.values(benchmarks).every(Boolean),
      saveEstimate: metrics.saveTime || 30000 // Default estimate
    }
  }, [])

  // Auto-save effect
  useEffect(() => {
    if (state.autoSaveEnabled && state.isDirty && !state.isSaving) {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = setTimeout(() => {
        actions.saveForm()
      }, autoSaveInterval)
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [state.autoSaveEnabled, state.isDirty, state.isSaving, actions.saveForm, autoSaveInterval])

  // Load form on mount
  useEffect(() => {
    actions.loadForm()
  }, []) // Only run on mount

  // Update state from external hooks
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: isLoading })
  }, [isLoading])

  useEffect(() => {
    dispatch({ type: 'SET_SAVING', payload: isSaving })
  }, [isSaving])

  useEffect(() => {
    if (lastSaved) {
      dispatch({ type: 'SET_LAST_SAVED', payload: lastSaved })
    }
  }, [lastSaved])

  const contextValue: FormContextValue = {
    state,
    actions,
    performance
  }

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  )
}

// Hook to use form context
export const useOptimizedForm = () => {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('useOptimizedForm must be used within OptimizedFormProvider')
  }
  return context
}

// Form status indicator component
export const FormStatusIndicator: React.FC = () => {
  const { state, performance } = useOptimizedForm()

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Save status */}
      <div className="flex items-center gap-1">
        {state.isSaving ? (
          <>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Saving... ({state.saveProgress}%)</span>
          </>
        ) : state.isDirty ? (
          <>
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Unsaved changes</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Saved</span>
          </>
        )}
      </div>

      {/* Last saved */}
      {state.lastSaved && (
        <span className="text-gray-500">
          Last saved: {state.lastSaved.toLocaleTimeString()}
        </span>
      )}

      {/* Performance indicator */}
      <div className={`w-2 h-2 rounded-full ${
        performance.benchmarksPassing ? 'bg-green-500' : 'bg-red-500'
      }`} title={performance.benchmarksPassing ? 'Performance targets met' : 'Performance needs optimization'} />
    </div>
  )
}

export default OptimizedFormProvider