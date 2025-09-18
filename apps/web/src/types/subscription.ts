/**
 * Subscription tier types and interfaces
 * For Story 11.2: Subscription-Based Routing Middleware
 */

import { z } from 'zod'

export type SubscriptionTier = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'UNPAID'

/**
 * Stripe subscription metadata structure
 */
export interface StripeSubscriptionMetadata {
  tier: SubscriptionTier
  features: string[]
  customerId: string
  priceId: string
}

/**
 * Clerk user metadata with subscription information
 */
export interface ClerkUserMetadata {
  subscriptionTier: SubscriptionTier
  stripeCustomerId?: string
  subscriptionId?: string
  subscriptionStatus: SubscriptionStatus
  features: string[]
  trialEndsAt?: string
  subscriptionEndsAt?: string
}

/**
 * Subscription details with Stripe integration
 */
export interface SubscriptionDetails {
  id: string
  userId: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripePriceId: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialStart?: Date
  trialEnd?: Date
  features: string[]
  metadata: Record<string, string>
  createdAt: Date
  updatedAt: Date
}

/**
 * Tier feature mapping
 */
export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  BASIC: [
    'basic_evaluation',
    'basic_reports',
    'basic_analytics'
  ],
  PROFESSIONAL: [
    'basic_evaluation',
    'basic_reports',
    'basic_analytics',
    'professional_evaluation',
    'ai_guides',
    'progress_tracking',
    'pdf_reports',
    'advanced_analytics',
    'priority_support',
    'export_data'
  ],
  ENTERPRISE: [
    'basic_evaluation',
    'basic_reports',
    'basic_analytics',
    'professional_evaluation',
    'ai_guides',
    'progress_tracking',
    'pdf_reports',
    'advanced_analytics',
    'priority_support',
    'export_data',
    'enterprise_evaluation',
    'benchmarks',
    'multi_user',
    'api_access',
    'custom_branding',
    'dedicated_support',
    'sla_guarantee'
  ]
}

/**
 * Tier hierarchy for access control
 */
export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  BASIC: 0,
  PROFESSIONAL: 1,
  ENTERPRISE: 2
}

/**
 * Route patterns for tier-based routing
 */
export interface TierRouteConfig {
  pattern: string
  requiredTier: SubscriptionTier
  requiredFeature?: string
  fallbackRoute?: string
  exactMatch?: boolean
}

/**
 * Dashboard routes by tier
 */
export const DASHBOARD_ROUTES: Record<SubscriptionTier, string> = {
  BASIC: '/dashboard/basic',
  PROFESSIONAL: '/dashboard/professional',
  ENTERPRISE: '/dashboard/enterprise'
}

/**
 * Subscription validation schemas
 */
export const SubscriptionTierSchema = z.enum(['BASIC', 'PROFESSIONAL', 'ENTERPRISE'])
export const SubscriptionStatusSchema = z.enum([
  'ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING',
  'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'UNPAID'
])

export const SubscriptionDetailsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tier: SubscriptionTierSchema,
  status: SubscriptionStatusSchema,
  stripeCustomerId: z.string(),
  stripeSubscriptionId: z.string(),
  stripePriceId: z.string(),
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  cancelAtPeriodEnd: z.boolean(),
  trialStart: z.date().optional(),
  trialEnd: z.date().optional(),
  features: z.array(z.string()),
  metadata: z.record(z.string()),
  createdAt: z.date(),
  updatedAt: z.date()
})

/**
 * Middleware tier detection result
 */
export interface TierDetectionResult {
  tier: SubscriptionTier
  status: SubscriptionStatus
  features: string[]
  hasAccess: boolean
  isTrialing: boolean
  trialEndsAt?: Date
  subscriptionEndsAt?: Date
  executionTime: number
  source: 'clerk' | 'stripe' | 'database' | 'fallback'
}

/**
 * Routing decision result
 */
export interface RoutingDecision {
  shouldRoute: boolean
  targetRoute?: string
  reason: string
  allowAccess: boolean
  requiredTier?: SubscriptionTier
  currentTier: SubscriptionTier
  missingFeatures: string[]
}

/**
 * Middleware configuration options
 */
export interface MiddlewareConfig {
  enableTierRouting: boolean
  enableFeatureGating: boolean
  fallbackTier: SubscriptionTier
  maxExecutionTime: number
  cacheEnabled: boolean
  cacheDuration: number
  debugMode: boolean
}

/**
 * Error types for subscription middleware
 */
export class SubscriptionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'SubscriptionError'
  }
}

export class TierAccessError extends SubscriptionError {
  constructor(
    required: SubscriptionTier,
    current: SubscriptionTier,
    feature?: string
  ) {
    const message = feature
      ? `Feature '${feature}' requires ${required} tier (current: ${current})`
      : `Access requires ${required} tier (current: ${current})`

    super(message, 'TIER_ACCESS_DENIED', 403)
  }
}

/**
 * Performance monitoring for middleware
 */
export interface MiddlewarePerformance {
  startTime: number
  endTime: number
  executionTime: number
  cacheHit: boolean
  dbQueries: number
  stripeApiCalls: number
  memoryUsage: number
}

/**
 * Type guards
 */
export function isValidTier(tier: any): tier is SubscriptionTier {
  return ['BASIC', 'PROFESSIONAL', 'ENTERPRISE'].includes(tier)
}

export function isValidStatus(status: any): status is SubscriptionStatus {
  return [
    'ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING',
    'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'UNPAID'
  ].includes(status)
}

export function hasFeature(tier: SubscriptionTier, feature: string): boolean {
  return TIER_FEATURES[tier]?.includes(feature) ?? false
}

export function canAccessTier(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier]
}

/**
 * Default middleware configuration
 */
export const DEFAULT_MIDDLEWARE_CONFIG: MiddlewareConfig = {
  enableTierRouting: true,
  enableFeatureGating: true,
  fallbackTier: 'BASIC',
  maxExecutionTime: 100, // 100ms requirement
  cacheEnabled: true,
  cacheDuration: 300000, // 5 minutes
  debugMode: process.env.NODE_ENV === 'development'
}