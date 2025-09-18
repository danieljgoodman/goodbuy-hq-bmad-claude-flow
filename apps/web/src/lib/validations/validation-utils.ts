import { ZodError, ZodSchema } from 'zod'
import {
  BusinessDataSchema,
  EvaluationSchema,
  BusinessBasicsSchema,
  FinancialMetricsSchema,
  OperationalDataSchema
} from '../../types/evaluation'
import {
  ProfessionalTierDataSchema,
  ProfessionalBusinessDataSchema,
  ProfessionalEvaluationSchema,
  ProfessionalFinancialMetricsSchema,
  CustomerAnalyticsSchema,
  OperationalEfficiencySchema,
  MarketIntelligenceSchema,
  FinancialPlanningSchema,
  ComplianceSchema,
  validateProfessionalTierData,
  validateProfessionalBusinessData,
  validateProfessionalEvaluation
} from './professional-tier'

// Validation result type
export interface ValidationResult<T = unknown> {
  success: boolean
  data?: T
  errors?: ZodError['flatten']['fieldErrors']
  message?: string
}

// Generic validation function
export function validateWithSchema<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data)

  if (result.success) {
    return {
      success: true,
      data: result.data
    }
  }

  return {
    success: false,
    errors: result.error.flatten().fieldErrors,
    message: 'Validation failed'
  }
}

// Tier-aware validation functions
export function validateBusinessData(data: unknown, tier: 'basic' | 'professional' = 'basic'): ValidationResult {
  const schema = tier === 'professional' ? ProfessionalBusinessDataSchema : BusinessDataSchema
  return validateWithSchema(schema, data)
}

export function validateEvaluation(data: unknown, tier: 'basic' | 'professional' = 'basic'): ValidationResult {
  const schema = tier === 'professional' ? ProfessionalEvaluationSchema : EvaluationSchema
  return validateWithSchema(schema, data)
}

// Professional tier specific validation with field count verification
export function validateProfessionalTierWithFieldCount(data: unknown): ValidationResult & {
  fieldCount?: number
  meetsMinimumRequirement?: boolean
} {
  const basicValidation = validateProfessionalTierData(data)

  if (!basicValidation.success) {
    return {
      success: false,
      errors: basicValidation.error?.flatten().fieldErrors,
      message: 'Professional tier validation failed'
    }
  }

  // Additional field count validation
  const completenessCheck = require('./professional-tier').validateProfessionalFieldCompleteness(basicValidation.data)

  return {
    success: completenessCheck.isValid && completenessCheck.meetsMinimumRequirement,
    data: basicValidation.data,
    fieldCount: completenessCheck.fieldCount,
    meetsMinimumRequirement: completenessCheck.meetsMinimumRequirement,
    message: completenessCheck.meetsMinimumRequirement
      ? 'Professional tier validation successful'
      : `Insufficient fields: ${completenessCheck.fieldCount}/45 required`
  }
}

// Form step validation utilities
export const FormValidators = {
  businessBasics: (data: unknown) => validateWithSchema(BusinessBasicsSchema, data),
  financialMetrics: (data: unknown) => validateWithSchema(FinancialMetricsSchema, data),
  operationalData: (data: unknown) => validateWithSchema(OperationalDataSchema, data),

  // Professional tier form validators
  professionalFinancialMetrics: (data: unknown) => validateWithSchema(ProfessionalFinancialMetricsSchema, data),
  customerAnalytics: (data: unknown) => validateWithSchema(CustomerAnalyticsSchema, data),
  operationalEfficiency: (data: unknown) => validateWithSchema(OperationalEfficiencySchema, data),
  marketIntelligence: (data: unknown) => validateWithSchema(MarketIntelligenceSchema, data),
  financialPlanning: (data: unknown) => validateWithSchema(FinancialPlanningSchema, data),
  compliance: (data: unknown) => validateWithSchema(ComplianceSchema, data)
}

// Error formatting utilities
export function formatValidationErrors(errors: ZodError['flatten']['fieldErrors']): string[] {
  const formattedErrors: string[] = []

  Object.entries(errors).forEach(([field, fieldErrors]) => {
    if (fieldErrors && fieldErrors.length > 0) {
      fieldErrors.forEach(error => {
        formattedErrors.push(`${field}: ${error}`)
      })
    }
  })

  return formattedErrors
}

export function getFieldErrorMessage(
  errors: ZodError['flatten']['fieldErrors'],
  fieldName: string
): string | undefined {
  return errors[fieldName]?.[0]
}

// Type guard functions for runtime type checking
export function isProfessionalTierData(data: unknown): data is import('./professional-tier').ProfessionalTierData {
  return ProfessionalTierDataSchema.safeParse(data).success
}

export function isProfessionalBusinessData(data: unknown): data is import('./professional-tier').ProfessionalBusinessData {
  return ProfessionalBusinessDataSchema.safeParse(data).success
}

export function isProfessionalEvaluation(data: unknown): data is import('./professional-tier').ProfessionalEvaluation {
  return ProfessionalEvaluationSchema.safeParse(data).success
}

// Validation middleware for API routes
export function createValidationMiddleware<T>(schema: ZodSchema<T>) {
  return (data: unknown): T => {
    const result = schema.parse(data) // Throws on validation error
    return result
  }
}

// Professional tier feature detection
export function detectTierRequirements(data: unknown): {
  suggestedTier: 'basic' | 'professional'
  hasAdvancedFields: boolean
  missingProfessionalFields: string[]
} {
  // Check if data contains professional-tier specific fields
  const hasAdvancedFields = data && typeof data === 'object' && (
    'professionalTierData' in data ||
    'customerAnalytics' in data ||
    'operationalEfficiency' in data ||
    'marketIntelligence' in data ||
    'financialPlanning' in data ||
    'compliance' in data
  )

  const missingProfessionalFields: string[] = []

  if (hasAdvancedFields) {
    const professionalValidation = validateProfessionalTierData(data)
    if (!professionalValidation.success && professionalValidation.error) {
      const fieldErrors = professionalValidation.error.flatten().fieldErrors
      missingProfessionalFields.push(...Object.keys(fieldErrors))
    }
  }

  return {
    suggestedTier: hasAdvancedFields ? 'professional' : 'basic',
    hasAdvancedFields: Boolean(hasAdvancedFields),
    missingProfessionalFields
  }
}

// Export schemas for external use
export {
  BusinessDataSchema,
  EvaluationSchema,
  BusinessBasicsSchema,
  FinancialMetricsSchema,
  OperationalDataSchema,
  ProfessionalTierDataSchema,
  ProfessionalBusinessDataSchema,
  ProfessionalEvaluationSchema,
  ProfessionalFinancialMetricsSchema,
  CustomerAnalyticsSchema,
  OperationalEfficiencySchema,
  MarketIntelligenceSchema,
  FinancialPlanningSchema,
  ComplianceSchema
}