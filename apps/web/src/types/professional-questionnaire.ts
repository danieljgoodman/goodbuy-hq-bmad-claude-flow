// Professional Tier Questionnaire TypeScript Interfaces
// Provides type safety for the Professional tier form validation and data structures

import type {
  FinancialPerformance,
  CustomerRiskAnalysis,
  CompetitiveMarket,
  OperationalStrategic,
  ValueEnhancement,
  ProfessionalQuestionnaire,
  CompleteProfessionalBusinessData
} from '../lib/validations/professional-questionnaire'

// Re-export validation types for consistency
export type {
  FinancialPerformance,
  CustomerRiskAnalysis,
  CompetitiveMarket,
  OperationalStrategic,
  ValueEnhancement,
  ProfessionalQuestionnaire,
  CompleteProfessionalBusinessData
}

// Enhanced interfaces for UI components and form management

// Form step configuration for multi-step Professional questionnaire
export interface ProfessionalQuestionnaireStep {
  id: string
  title: string
  description: string
  fields: readonly string[]
  validationSchema: any
  estimatedTimeMinutes: number
  prerequisiteSteps?: readonly string[]
  isOptional?: boolean
}

// Form validation state management
export interface ProfessionalQuestionnaireFormState {
  currentStep: string
  completedSteps: readonly string[]
  validationErrors: Record<string, string[]>
  fieldCompletionStatus: Record<string, boolean>
  sectionProgress: Record<string, {
    completed: number
    total: number
    percentage: number
  }>
  overallProgress: {
    completed: number
    total: number
    percentage: number
    meetsMinimumRequirement: boolean
  }
}

// Professional questionnaire section definitions
export interface ProfessionalQuestionnaireSection {
  id: keyof ProfessionalQuestionnaire
  title: string
  description: string
  methodology: string
  fields: readonly ProfessionalQuestionnaireField[]
  estimatedTimeMinutes: number
  requiredFields: number
  totalFields: number
}

// Individual field configuration with validation and UI metadata
export interface ProfessionalQuestionnaireField {
  id: string
  name: string
  label: string
  type: 'number' | 'select' | 'multiselect' | 'text' | 'percentage' | 'currency' | 'array'
  placeholder?: string
  helpText?: string
  methodologyExplanation: string
  validationRules: {
    required: boolean
    min?: number
    max?: number
    pattern?: string
    customValidation?: string
  }
  options?: readonly { value: string; label: string; description?: string }[]
  dependencies?: readonly {
    field: string
    condition: string
    value: any
  }[]
  businessImpact: {
    category: 'valuation' | 'risk' | 'growth' | 'efficiency' | 'strategic'
    weight: number
    description: string
  }
}

// Professional tier upgrade decision support
export interface TierUpgradeAnalysis {
  currentTierCapabilities: readonly string[]
  professionalTierBenefits: readonly string[]
  missingProfessionalFields: readonly string[]
  estimatedValueIncrease: {
    percentageIncrease: number
    dollarAmount?: number
    confidence: number
  }
  recommendedUpgrade: boolean
  upgradeJustification: string
}

// Business methodology explanations for professional fields
export interface BusinessMethodology {
  concept: string
  definition: string
  importance: string
  calculation?: string
  industryBenchmarks?: {
    poor: number
    average: number
    good: number
    excellent: number
  }
  improvementStrategies: readonly string[]
  relatedMetrics: readonly string[]
}

// Field mapping for database storage and API communication
export interface ProfessionalQuestionnaireFieldMapping {
  formField: string
  databaseColumn: string
  dataType: 'integer' | 'decimal' | 'varchar' | 'text' | 'json' | 'enum'
  nullable: boolean
  defaultValue?: any
  transformation?: {
    input: string // Function name for form -> database
    output: string // Function name for database -> form
  }
}

// Validation result with enhanced Professional tier context
export interface ProfessionalValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  fieldCount: number
  sectionCompleteness: Record<string, {
    completed: number
    total: number
    percentage: number
  }>
  overallCompleteness: {
    completed: number
    total: number
    percentage: number
    meetsMinimumRequirement: boolean
  }
  businessInsights: readonly {
    category: string
    message: string
    severity: 'info' | 'warning' | 'error'
  }[]
  recommendations: readonly {
    field: string
    suggestion: string
    impact: string
  }[]
}

// Professional questionnaire submission payload
export interface ProfessionalQuestionnaireSubmission {
  userId: string
  evaluationId?: string
  questionnaire: ProfessionalQuestionnaire
  metadata: {
    submissionDate: Date
    completionTimeMinutes: number
    userAgent: string
    sourceVersion: string
  }
  businessContext: {
    industry: string
    businessSize: string
    marketType: string
  }
}

// Progressive disclosure configuration
export interface ProgressiveDisclosureConfig {
  enableProgressiveForms: boolean
  minimumFieldsPerStep: number
  maximumFieldsPerStep: number
  allowSkipOptionalSections: boolean
  saveProgressAutomatically: boolean
  showCompletionPercentage: boolean
  adaptiveQuestionFlow: boolean
}

// Professional questionnaire analytics
export interface ProfessionalQuestionnaireAnalytics {
  formMetrics: {
    averageCompletionTimeMinutes: number
    mostSkippedFields: readonly string[]
    highestDropoffSteps: readonly string[]
    conversionRate: number
  }
  businessInsights: {
    commonBusinessPatterns: readonly {
      pattern: string
      frequency: number
      valuationImpact: number
    }[]
    industryBenchmarks: Record<string, {
      fieldName: string
      average: number
      median: number
      standardDeviation: number
    }>
  }
  userExperience: {
    satisfactionScore: number
    easiestSections: readonly string[]
    mostDifficultSections: readonly string[]
    helpRequestFrequency: Record<string, number>
  }
}

// Error handling for Professional questionnaire
export interface ProfessionalQuestionnaireError {
  code: string
  message: string
  field?: string
  section?: string
  severity: 'warning' | 'error' | 'critical'
  suggestions: readonly string[]
  helpUrl?: string
}

// Configuration for Professional questionnaire display
export interface ProfessionalQuestionnaireDisplayConfig {
  showMethodologyExplanations: boolean
  showBusinessImpact: boolean
  showProgressIndicators: boolean
  enableFieldTooltips: boolean
  highlightRequiredFields: boolean
  showValidationInRealTime: boolean
  adaptiveLayoutByDevice: boolean
  professionalStyling: {
    primaryColor: string
    accentColor: string
    fontFamily: string
    spacingScale: number
  }
}

// Constants for Professional questionnaire configuration
export const PROFESSIONAL_QUESTIONNAIRE_CONFIG = {
  MINIMUM_FIELDS_REQUIRED: 30,
  TOTAL_PROFESSIONAL_FIELDS: 44,
  ESTIMATED_COMPLETION_MINUTES: 25,
  SECTIONS: [
    'financialPerformance',
    'customerRiskAnalysis',
    'competitiveMarket',
    'operationalStrategic',
    'valueEnhancement'
  ] as const,
  VALIDATION_DEBOUNCE_MS: 300,
  AUTO_SAVE_INTERVAL_MS: 30000,
  SESSION_TIMEOUT_MINUTES: 60
} as const

export type ProfessionalQuestionnaireSection = typeof PROFESSIONAL_QUESTIONNAIRE_CONFIG.SECTIONS[number]