/**
 * Type definitions for tier validation system
 */

export type SubscriptionTier = 'FREE' | 'PREMIUM' | 'ENTERPRISE'

export type FeatureType =
  | 'ai_guides'
  | 'progress_tracking'
  | 'pdf_reports'
  | 'analytics'
  | 'benchmarks'
  | 'priority_support'

export interface TierValidationOptions {
  requiredTier?: 'PREMIUM' | 'ENTERPRISE'
  featureType?: FeatureType
  fallbackToBasic?: boolean
  customErrorMessage?: string
}

export interface TierValidationResult {
  hasAccess: boolean
  userTier: string
  accessCheck: PremiumAccessCheck
  userId: string
  user: any
}

export interface PremiumAccessCheck {
  hasAccess: boolean
  reason?: string
  subscriptionStatus?: string
  trialInfo?: {
    isOnTrial: boolean
    daysRemaining: number
    trialEndsAt: string | null
  }
  upgradeRequired?: {
    currentTier: string
    requiredTier: string
    benefits: string[]
    ctaText: string
  }
}

export interface TierAwareResponse<T = any> {
  data: T
  meta: {
    userTier: string
    hasFullAccess: boolean
    accessLimited: boolean
    upgradeRequired?: {
      currentTier: string
      requiredTier: string
      benefits: string[]
      ctaText: string
    }
  }
}

/**
 * Feature tier requirements mapping
 */
export const FEATURE_TIER_REQUIREMENTS: Record<FeatureType, SubscriptionTier> = {
  ai_guides: 'PREMIUM',
  progress_tracking: 'PREMIUM',
  pdf_reports: 'PREMIUM',
  analytics: 'PREMIUM',
  benchmarks: 'ENTERPRISE',
  priority_support: 'PREMIUM'
}

/**
 * Tier hierarchy for comparison
 */
export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  FREE: 0,
  PREMIUM: 1,
  ENTERPRISE: 2
}

/**
 * Data filtering types
 */
export type DataFilterType = 'evaluation' | 'report' | 'analytics'

/**
 * Evaluation data structure with tier-sensitive fields
 */
export interface TierSensitiveEvaluation {
  id: string
  businessData: any
  valuations?: {
    // Basic tier
    revenue_multiple?: any
    asset_based?: any
    // Premium tier
    dcf_analysis?: any
    market_comparison?: any
    risk_adjusted?: any
  }
  opportunities?: Array<{
    title: string
    impact: string
    priority: number
  }>
  insights?: {
    summary: string
    // Premium only fields
    market_analysis?: string | null
    competitive_positioning?: string | null
    growth_projections?: string | null
    risk_factors?: string
  }
  healthScore?: number
  confidenceScore?: number
  createdAt: string
}

/**
 * API Response wrapper for tier-aware endpoints
 */
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  accessRequired?: boolean
  reason?: string
  subscriptionStatus?: string
  upgradeRequired?: {
    currentTier: string
    requiredTier: string
    benefits: string[]
    ctaText: string
  }
  trialInfo?: {
    isOnTrial: boolean
    daysRemaining: number
    trialEndsAt: string | null
  }
  meta?: {
    userTier: string
    hasFullAccess: boolean
    accessLimited: boolean
  }
}