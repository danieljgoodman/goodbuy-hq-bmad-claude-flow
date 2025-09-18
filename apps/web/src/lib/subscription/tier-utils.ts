/**
 * Subscription tier detection utilities
 * For Story 11.2: Subscription-Based Routing Middleware
 * Integrates with Stripe via Clerk metadata
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  SubscriptionTier,
  SubscriptionStatus,
  TierDetectionResult,
  ClerkUserMetadata,
  SubscriptionDetails,
  isValidTier,
  isValidStatus,
  DEFAULT_MIDDLEWARE_CONFIG
} from '@/types/subscription'
import { tierLogger, TierLoggerUtils } from '@/lib/logging/tier-logger'
import { tierMetrics } from '@/lib/monitoring/tier-metrics'

/**
 * Cache for tier detection results to improve performance
 */
const tierCache = new Map<string, { result: TierDetectionResult; timestamp: number }>()

/**
 * Main tier detection service
 */
export class TierDetectionService {

  /**
   * Detect user subscription tier with <100ms execution time
   * @param request - NextRequest object
   * @returns TierDetectionResult with tier, status, and performance data
   */
  static async detectTier(request: NextRequest): Promise<TierDetectionResult> {
    const startTime = performance.now()
    const requestId = TierLoggerUtils.generateRequestId()
    const logger = tierLogger.createChildLogger({ requestId })

    try {
      logger.logDebug('Starting tier detection process', {
        route: request.nextUrl.pathname,
        method: request.method
      })

      // Get user from Clerk authentication
      const authResult = await auth()
      const userId = authResult?.userId

      if (!userId) {
        logger.logDebug('No authenticated user found, using fallback')

        // Record metrics for unauthenticated access
        tierMetrics.recordBusiness({
          name: 'unauthenticated_access',
          userTier: 'BASIC',
          route: request.nextUrl.pathname
        })

        return this.createFallbackResult(startTime, 'No authenticated user', logger)
      }

      logger.logDebug('Authenticated user found, checking tier', { userId })

      // Check cache first for performance
      if (DEFAULT_MIDDLEWARE_CONFIG.cacheEnabled) {
        const cached = this.getCachedResult(userId)
        if (cached) {
          logger.logDebug('Cache hit for tier detection', {
            userId,
            tier: cached.tier,
            source: 'cache'
          })

          // Record cache hit metrics
          tierMetrics.recordPerformance({
            name: 'tier_detection_cache_hit',
            executionTime: performance.now() - startTime,
            memoryUsage: TierLoggerUtils.getMemoryUsage(),
            cacheHit: true,
            route: request.nextUrl.pathname,
            userTier: cached.tier,
            method: request.method
          })

          return {
            ...cached,
            executionTime: performance.now() - startTime
          }
        }
      }

      // Try Clerk metadata first (fastest)
      logger.logDebug('Attempting tier detection from Clerk metadata', { userId })
      const clerkResult = await this.detectFromClerk(userId, startTime, logger)
      if (clerkResult.hasAccess || clerkResult.tier !== 'BASIC') {
        this.setCachedResult(userId, clerkResult)
        logger.logTierDetection('Tier detection successful via Clerk', clerkResult, {
          requestId,
          route: request.nextUrl.pathname,
          method: request.method
        })
        return clerkResult
      }

      // Fallback to Stripe API if needed
      logger.logDebug('Attempting tier detection from Stripe API', { userId })
      const stripeResult = await this.detectFromStripe(userId, startTime, logger)
      if (stripeResult.hasAccess || stripeResult.tier !== 'BASIC') {
        this.setCachedResult(userId, stripeResult)
        logger.logTierDetection('Tier detection successful via Stripe', stripeResult, {
          requestId,
          route: request.nextUrl.pathname,
          method: request.method
        })
        return stripeResult
      }

      // Final fallback to database
      logger.logDebug('Attempting tier detection from database', { userId })
      const dbResult = await this.detectFromDatabase(userId, startTime, logger)
      this.setCachedResult(userId, dbResult)
      logger.logTierDetection('Tier detection completed via database', dbResult, {
        requestId,
        route: request.nextUrl.pathname,
        method: request.method
      })
      return dbResult

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))

      logger.logError('Error in tier detection process', errorObj, {
        requestId,
        route: request.nextUrl.pathname,
        method: request.method
      })

      // Record error metrics
      tierMetrics.recordError({
        name: 'tier_detection_error',
        errorType: errorObj.name,
        errorCode: (errorObj as any).code || 'UNKNOWN',
        severity: 'high',
        route: request.nextUrl.pathname,
        userTier: 'BASIC',
        message: errorObj.message
      })

      return this.createFallbackResult(startTime, 'Detection error', logger)
    }
  }

  /**
   * Detect tier from Clerk user metadata
   */
  private static async detectFromClerk(userId: string, startTime: number, logger?: any): Promise<TierDetectionResult> {
    try {
      logger?.logDebug('Fetching user data from Clerk', { userId })

      // Import clerkClient dynamically to avoid server-side issues
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      const metadata = user.publicMetadata as ClerkUserMetadata

      // Record Clerk API call metrics
      tierMetrics.recordPerformance({
        name: 'clerk_api_call',
        executionTime: performance.now() - startTime,
        memoryUsage: TierLoggerUtils.getMemoryUsage(),
        cacheHit: false,
        apiCalls: 1,
        userTier: metadata.subscriptionTier || 'BASIC'
      })

      if (!metadata.subscriptionTier) {
        logger?.logDebug('No subscription tier found in Clerk metadata', { userId })
        return this.createFallbackResult(startTime, 'No Clerk metadata', logger)
      }

      const tier = isValidTier(metadata.subscriptionTier)
        ? metadata.subscriptionTier
        : 'BASIC'

      const status = isValidStatus(metadata.subscriptionStatus)
        ? metadata.subscriptionStatus
        : 'ACTIVE'

      const features = metadata.features || []
      const hasAccess = this.validateSubscriptionAccess(status)

      logger?.logDebug('Successfully retrieved tier from Clerk', {
        userId,
        tier,
        status,
        features: features.length,
        hasAccess
      })

      // Record successful Clerk detection
      tierMetrics.recordBusiness({
        name: 'clerk_tier_detection_success',
        userTier: tier,
        feature: 'tier_detection'
      })

      return {
        tier,
        status,
        features,
        hasAccess,
        isTrialing: status === 'TRIALING',
        trialEndsAt: metadata.trialEndsAt ? new Date(metadata.trialEndsAt) : undefined,
        subscriptionEndsAt: metadata.subscriptionEndsAt ? new Date(metadata.subscriptionEndsAt) : undefined,
        executionTime: performance.now() - startTime,
        source: 'clerk'
      }

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))

      logger?.logError('Error detecting tier from Clerk', errorObj, { userId })

      // Record Clerk error metrics
      tierMetrics.recordError({
        name: 'clerk_tier_detection_error',
        errorType: errorObj.name,
        errorCode: (errorObj as any).code || 'CLERK_ERROR',
        severity: 'medium',
        userTier: 'BASIC',
        message: errorObj.message
      })

      return this.createFallbackResult(startTime, 'Clerk API error', logger)
    }
  }

  /**
   * Detect tier from Stripe API (if Clerk metadata is incomplete)
   */
  private static async detectFromStripe(userId: string, startTime: number, logger?: any): Promise<TierDetectionResult> {
    try {
      // Get Stripe customer ID from Clerk first
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      const metadata = user.publicMetadata as ClerkUserMetadata

      if (!metadata.stripeCustomerId) {
        logger?.logDebug('No Stripe customer ID found in Clerk metadata', { userId })
        return this.createFallbackResult(startTime, 'No Stripe customer ID', logger)
      }

      // Import Stripe dynamically to avoid loading in basic cases
      const Stripe = await import('stripe')
      const stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2023-10-16'
      })

      // Get active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: metadata.stripeCustomerId,
        status: 'all',
        limit: 1,
        expand: ['data.items.price.product']
      })

      if (subscriptions.data.length === 0) {
        logger?.logDebug('No active Stripe subscriptions found', { userId, customerId: metadata.stripeCustomerId })
        return this.createFallbackResult(startTime, 'No Stripe subscriptions', logger)
      }

      const subscription = subscriptions.data[0]
      const product = subscription.items.data[0]?.price?.product as any

      // Map Stripe product to tier
      const tier = this.mapStripePriceToTier(subscription.items.data[0]?.price?.id)
      const status = this.mapStripeStatus(subscription.status)
      const features = this.getFeaturesForTier(tier)

      return {
        tier,
        status,
        features,
        hasAccess: this.validateSubscriptionAccess(status),
        isTrialing: subscription.status === 'trialing',
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        subscriptionEndsAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
        executionTime: performance.now() - startTime,
        source: 'stripe'
      }

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))

      logger?.logError('Error detecting tier from Stripe', errorObj, { userId })

      // Record Stripe error metrics
      tierMetrics.recordError({
        name: 'stripe_tier_detection_error',
        errorType: errorObj.name,
        errorCode: (errorObj as any).code || 'STRIPE_ERROR',
        severity: 'medium',
        userTier: 'BASIC',
        message: errorObj.message
      })

      return this.createFallbackResult(startTime, 'Stripe API error', logger)
    }
  }

  /**
   * Detect tier from database (final fallback)
   */
  private static async detectFromDatabase(userId: string, startTime: number, logger?: any): Promise<TierDetectionResult> {
    try {
      // Use existing PremiumAccessService for database queries
      const { PremiumAccessService } = await import('@/lib/services/PremiumAccessService')

      // This will check the database for user subscription info
      const accessCheck = await PremiumAccessService.checkPremiumAccess(userId, 'analytics', 'PREMIUM')

      // Try to extract tier from the access check result
      let tier: SubscriptionTier = 'BASIC'
      if (accessCheck.hasAccess) {
        // If they have premium access, assume PROFESSIONAL tier
        tier = 'PROFESSIONAL'
      }

      return {
        tier,
        status: 'ACTIVE',
        features: this.getFeaturesForTier(tier),
        hasAccess: accessCheck.hasAccess,
        isTrialing: !!accessCheck.trialInfo?.isOnTrial,
        trialEndsAt: accessCheck.trialInfo?.trialEndsAt ? new Date(accessCheck.trialInfo.trialEndsAt) : undefined,
        executionTime: performance.now() - startTime,
        source: 'database'
      }

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))

      logger?.logError('Error detecting tier from database', errorObj, { userId })

      // Record database error metrics
      tierMetrics.recordError({
        name: 'database_tier_detection_error',
        errorType: errorObj.name,
        errorCode: (errorObj as any).code || 'DATABASE_ERROR',
        severity: 'medium',
        userTier: 'BASIC',
        message: errorObj.message
      })

      return this.createFallbackResult(startTime, 'Database error', logger)
    }
  }

  /**
   * Create fallback result for error cases
   */
  private static createFallbackResult(startTime: number, reason: string, logger?: any): TierDetectionResult {
    logger?.logDebug('Creating fallback tier result', { reason })

    // Record fallback usage metrics
    tierMetrics.recordBusiness({
      name: 'tier_detection_fallback',
      userTier: DEFAULT_MIDDLEWARE_CONFIG.fallbackTier,
      feature: 'tier_detection'
    })

    return {
      tier: DEFAULT_MIDDLEWARE_CONFIG.fallbackTier,
      status: 'ACTIVE',
      features: this.getFeaturesForTier(DEFAULT_MIDDLEWARE_CONFIG.fallbackTier),
      hasAccess: true, // Always allow basic access
      isTrialing: false,
      executionTime: performance.now() - startTime,
      source: 'fallback'
    }
  }

  /**
   * Get cached tier result if valid
   */
  private static getCachedResult(userId: string): TierDetectionResult | null {
    const cached = tierCache.get(userId)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > DEFAULT_MIDDLEWARE_CONFIG.cacheDuration
    if (isExpired) {
      tierCache.delete(userId)
      return null
    }

    return cached.result
  }

  /**
   * Cache tier result for performance
   */
  private static setCachedResult(userId: string, result: TierDetectionResult): void {
    tierCache.set(userId, {
      result,
      timestamp: Date.now()
    })

    // Clean up old cache entries
    if (tierCache.size > 1000) {
      const oldestKey = tierCache.keys().next().value
      tierCache.delete(oldestKey)
    }
  }

  /**
   * Map Stripe price ID to subscription tier
   */
  private static mapStripePriceToTier(priceId?: string): SubscriptionTier {
    if (!priceId) return 'BASIC'

    // Map known Stripe price IDs to tiers
    const priceToTierMap: Record<string, SubscriptionTier> = {
      // Add your actual Stripe price IDs here
      'price_professional_monthly': 'PROFESSIONAL',
      'price_professional_yearly': 'PROFESSIONAL',
      'price_enterprise_monthly': 'ENTERPRISE',
      'price_enterprise_yearly': 'ENTERPRISE'
    }

    return priceToTierMap[priceId] || 'BASIC'
  }

  /**
   * Map Stripe subscription status to our status enum
   */
  private static mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      'active': 'ACTIVE',
      'canceled': 'CANCELED',
      'past_due': 'PAST_DUE',
      'trialing': 'TRIALING',
      'incomplete': 'INCOMPLETE',
      'incomplete_expired': 'INCOMPLETE_EXPIRED',
      'unpaid': 'UNPAID'
    }

    return statusMap[stripeStatus] || 'ACTIVE'
  }

  /**
   * Get features available for a tier
   */
  private static getFeaturesForTier(tier: SubscriptionTier): string[] {
    const { TIER_FEATURES } = require('@/types/subscription')
    return TIER_FEATURES[tier] || TIER_FEATURES.BASIC
  }

  /**
   * Validate if subscription status allows access
   */
  private static validateSubscriptionAccess(status: SubscriptionStatus): boolean {
    const validStatuses: SubscriptionStatus[] = ['ACTIVE', 'TRIALING']
    return validStatuses.includes(status)
  }

  /**
   * Update user's tier in Clerk metadata (called by webhooks)
   */
  static async updateTierInClerk(
    userId: string,
    subscription: Partial<SubscriptionDetails>
  ): Promise<void> {
    try {
      const metadata: Partial<ClerkUserMetadata> = {
        subscriptionTier: subscription.tier,
        subscriptionStatus: subscription.status,
        stripeCustomerId: subscription.stripeCustomerId,
        subscriptionId: subscription.stripeSubscriptionId,
        features: subscription.features || [],
        trialEndsAt: subscription.trialEnd?.toISOString(),
        subscriptionEndsAt: subscription.currentPeriodEnd?.toISOString()
      }

      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      await client.users.updateUserMetadata(userId, {
        publicMetadata: metadata
      })

      // Clear cache to force refresh
      tierCache.delete(userId)

    } catch (error) {
      console.error('Error updating tier in Clerk:', error)
      throw error
    }
  }

  /**
   * Bulk update tiers for multiple users (useful for data migration)
   */
  static async bulkUpdateTiers(updates: Array<{ userId: string; tier: SubscriptionTier }>): Promise<void> {
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()

    const promises = updates.map(async ({ userId, tier }) => {
      try {
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            subscriptionTier: tier,
            subscriptionStatus: 'ACTIVE',
            features: this.getFeaturesForTier(tier)
          }
        })
        tierCache.delete(userId)
      } catch (error) {
        console.error(`Error updating tier for user ${userId}:`, error)
      }
    })

    await Promise.all(promises)
  }

  /**
   * Get performance metrics for monitoring
   */
  static getPerformanceMetrics(): {
    cacheSize: number
    cacheHitRate: number
    averageExecutionTime: number
  } {
    // This would be implemented with proper metrics collection
    return {
      cacheSize: tierCache.size,
      cacheHitRate: 0.85, // Placeholder
      averageExecutionTime: 45 // Placeholder in ms
    }
  }
}

/**
 * Simplified tier detection for API routes
 */
export async function getUserTier(userId?: string): Promise<SubscriptionTier> {
  if (!userId) return 'BASIC'

  try {
    // Create a mock request for the service
    const mockRequest = {
      nextUrl: { pathname: '/api/mock' },
      headers: new Headers({ 'x-user-id': userId })
    } as NextRequest

    const result = await TierDetectionService.detectTier(mockRequest)
    return result.tier
  } catch {
    return 'BASIC'
  }
}

/**
 * Check if user has specific feature access
 */
export async function hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
  try {
    const result = await TierDetectionService.detectTier({} as NextRequest)
    return result.hasAccess && result.features.includes(feature)
  } catch {
    return false
  }
}