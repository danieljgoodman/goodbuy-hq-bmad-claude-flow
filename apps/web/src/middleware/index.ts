/**
 * Middleware exports for easy importing
 */

export { TierValidationMiddleware } from './tier-validation'
export type { TierValidationOptions, TierValidationResult } from './tier-validation'

/**
 * Convenience functions for common tier validation scenarios
 */
import { TierValidationMiddleware } from './tier-validation'
import { NextRequest } from 'next/server'

/**
 * Quick tier validation for evaluation endpoints
 */
export const validateEvaluationAccess = (request: NextRequest) =>
  TierValidationMiddleware.validateTier(request, {
    requiredTier: 'PREMIUM',
    featureType: 'analytics',
    fallbackToBasic: true
  })

/**
 * Quick tier validation for report generation
 */
export const validateReportAccess = (request: NextRequest) =>
  TierValidationMiddleware.validateTier(request, {
    requiredTier: 'PREMIUM',
    featureType: 'pdf_reports',
    fallbackToBasic: false
  })

/**
 * Quick tier validation for AI features
 */
export const validateAIAccess = (request: NextRequest) =>
  TierValidationMiddleware.validateTier(request, {
    requiredTier: 'PREMIUM',
    featureType: 'ai_guides',
    fallbackToBasic: false
  })

/**
 * Quick tier validation for benchmarking (Enterprise only)
 */
export const validateBenchmarkAccess = (request: NextRequest) =>
  TierValidationMiddleware.validateTier(request, {
    requiredTier: 'ENTERPRISE',
    featureType: 'benchmarks',
    fallbackToBasic: false
  })