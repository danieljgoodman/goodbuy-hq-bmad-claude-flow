/**
 * User Tier Service - Centralized tier management
 * Story 11.2: Subscription-Based Routing Middleware
 */

import { PrismaClient } from '@prisma/client'
import type {
  SubscriptionTier,
  SubscriptionStatus,
  SubscriptionDetails,
  TierDetectionResult,
  TIER_FEATURES,
  TIER_HIERARCHY
} from '@/types/subscription'
import { ClerkTierIntegration } from '@/lib/auth/clerk-tier-integration'

// Import TIER_FEATURES and TIER_HIERARCHY from types
const TIER_FEATURES_MAP = {
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
} as const

const TIER_HIERARCHY_MAP = {
  BASIC: 0,
  PROFESSIONAL: 1,
  ENTERPRISE: 2
} as const

interface CacheEntry {
  data: TierDetectionResult
  timestamp: number
  ttl: number
}

/**
 * Centralized service for managing user subscription tiers
 */
export class UserTierService {
  private static prisma = new PrismaClient()
  private static cache = new Map<string, CacheEntry>()
  private static readonly CACHE_TTL = 300000 // 5 minutes
  private static readonly MAX_EXECUTION_TIME = 100 // 100ms requirement

  /**
   * Get user tier with caching and fallback strategies
   */
  static async getUserTier(userId: string): Promise<TierDetectionResult> {
    const startTime = Date.now()

    try {
      // Check cache first
      const cached = this.getCachedTier(userId)
      if (cached) {
        cached.executionTime = Date.now() - startTime
        return cached
      }

      // Try multiple sources in order of preference
      let result: TierDetectionResult | null = null

      // 1. Try database first (most authoritative)
      try {
        result = await this.getTierFromDatabase(userId)
        if (result) {
          result.source = 'database'
        }
      } catch (error) {
        console.warn('Database tier lookup failed:', error)
      }

      // 2. Fallback to Clerk metadata
      if (!result) {
        try {
          result = await this.getTierFromClerk(userId)
          if (result) {
            result.source = 'clerk'
          }
        } catch (error) {
          console.warn('Clerk tier lookup failed:', error)
        }
      }

      // 3. Final fallback
      if (!result) {
        result = this.getFallbackTier(userId)
        result.source = 'fallback'
      }

      result.executionTime = Date.now() - startTime

      // Cache the result
      this.setCachedTier(userId, result)

      return result

    } catch (error) {
      console.error('Error getting user tier:', error)

      const fallback = this.getFallbackTier(userId)
      fallback.executionTime = Date.now() - startTime
      fallback.source = 'fallback'

      return fallback
    }
  }

  /**
   * Update user tier across all systems
   */
  static async updateUserTier(
    userId: string,
    tierData: Partial<SubscriptionDetails>
  ): Promise<void> {
    try {
      // Update database
      await this.updateTierInDatabase(userId, tierData)

      // Update Clerk metadata
      if (tierData.tier && tierData.status) {
        await ClerkTierIntegration.updateUserTierMetadata(userId, {
          tier: tierData.tier,
          status: tierData.status,
          stripeCustomerId: tierData.stripeCustomerId,
          subscriptionId: tierData.stripeSubscriptionId,
          trialEndsAt: tierData.trialEnd?.toISOString(),
          subscriptionEndsAt: tierData.currentPeriodEnd?.toISOString()
        })
      }

      // Invalidate cache
      this.invalidateUserCache(userId)

    } catch (error) {
      console.error('Error updating user tier:', error)
      throw new Error(`Failed to update user tier: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  static async hasFeatureAccess(
    userId: string,
    feature: string,
    requiredTier?: SubscriptionTier
  ): Promise<boolean> {
    try {
      const tierResult = await this.getUserTier(userId)

      // Check feature-specific access
      if (TIER_FEATURES_MAP[tierResult.tier]?.includes(feature)) {
        return true
      }

      // Check tier hierarchy if required tier is specified
      if (requiredTier) {
        return TIER_HIERARCHY_MAP[tierResult.tier] >= TIER_HIERARCHY_MAP[requiredTier]
      }

      return false

    } catch (error) {
      console.error('Error checking feature access:', error)
      return false
    }
  }

  /**
   * Check if user can access a specific tier level
   */
  static async canAccessTier(
    userId: string,
    requiredTier: SubscriptionTier
  ): Promise<boolean> {
    try {
      const tierResult = await this.getUserTier(userId)
      return TIER_HIERARCHY_MAP[tierResult.tier] >= TIER_HIERARCHY_MAP[requiredTier]
    } catch (error) {
      console.error('Error checking tier access:', error)
      return false
    }
  }

  /**
   * Get all features available to user's tier
   */
  static async getUserFeatures(userId: string): Promise<string[]> {
    try {
      const tierResult = await this.getUserTier(userId)
      return TIER_FEATURES_MAP[tierResult.tier] || []
    } catch (error) {
      console.error('Error getting user features:', error)
      return TIER_FEATURES_MAP.BASIC
    }
  }

  /**
   * Invalidate user caches
   */
  static async invalidateUserCaches(userId: string): Promise<void> {
    // Clear local cache
    this.invalidateUserCache(userId)

    // Could also clear external caches (Redis, etc.) here
    console.log(`Invalidated caches for user ${userId}`)
  }

  /**
   * Batch tier updates for multiple users
   */
  static async batchUpdateTiers(
    updates: Array<{ userId: string; tierData: Partial<SubscriptionDetails> }>
  ): Promise<void> {
    try {
      await Promise.all(
        updates.map(({ userId, tierData }) => this.updateUserTier(userId, tierData))
      )
    } catch (error) {
      console.error('Error in batch tier update:', error)
      throw error
    }
  }

  /**
   * Private methods
   */

  private static async getTierFromDatabase(userId: string): Promise<TierDetectionResult | null> {
    try {
      // First try to get from subscription table
      const subscription = await this.prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          tier: true,
          status: true,
          currentPeriodEnd: true,
          trialEndsAt: true
        }
      })

      // Also get user data for fallback tier info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionTier: true
        }
      })

      if (!user) {
        return null
      }

      // Use subscription data if available, otherwise user tier
      const dbTier = subscription?.tier || user.subscriptionTier
      const mappedTier = this.mapFromSubscriptionTier(dbTier)
      const status = subscription?.status || 'ACTIVE'
      const isTrialing = status === 'TRIALING'
      const trialEndsAt = subscription?.trialEndsAt
      const subscriptionEndsAt = subscription?.currentPeriodEnd

      return {
        tier: mappedTier,
        status: status as SubscriptionStatus,
        features: TIER_FEATURES_MAP[mappedTier] || [],
        hasAccess: ['ACTIVE', 'TRIALING'].includes(status),
        isTrialing,
        trialEndsAt,
        subscriptionEndsAt,
        executionTime: 0, // Set by caller
        source: 'database'
      }

    } catch (error) {
      console.error('Database tier lookup error:', error)
      return null
    }
  }

  private static async getTierFromClerk(userId: string): Promise<TierDetectionResult | null> {
    try {
      const clerkData = await ClerkTierIntegration.getUserTierMetadata(userId)

      if (!clerkData) {
        return null
      }

      return {
        tier: clerkData.subscriptionTier,
        status: clerkData.subscriptionStatus,
        features: clerkData.features || TIER_FEATURES_MAP[clerkData.subscriptionTier] || [],
        hasAccess: ['ACTIVE', 'TRIALING'].includes(clerkData.subscriptionStatus),
        isTrialing: clerkData.subscriptionStatus === 'TRIALING',
        trialEndsAt: clerkData.trialEndsAt ? new Date(clerkData.trialEndsAt) : undefined,
        subscriptionEndsAt: clerkData.subscriptionEndsAt ? new Date(clerkData.subscriptionEndsAt) : undefined,
        executionTime: 0,
        source: 'clerk'
      }

    } catch (error) {
      console.error('Clerk tier lookup error:', error)
      return null
    }
  }

  private static getFallbackTier(userId: string): TierDetectionResult {
    return {
      tier: 'BASIC',
      status: 'ACTIVE',
      features: TIER_FEATURES_MAP.BASIC,
      hasAccess: true,
      isTrialing: false,
      executionTime: 0,
      source: 'fallback'
    }
  }

  private static async updateTierInDatabase(
    userId: string,
    tierData: Partial<SubscriptionDetails>
  ): Promise<void> {
    try {
      // Map subscription tier to match existing schema
      const subscriptionTier = this.mapToSubscriptionTier(tierData.tier)

      // Update subscription record if stripeSubscriptionId provided
      if (tierData.stripeSubscriptionId) {
        await this.prisma.subscription.upsert({
          where: { stripeSubscriptionId: tierData.stripeSubscriptionId },
          update: {
            tier: subscriptionTier,
            status: this.mapToDbStatus(tierData.status),
            stripePriceId: tierData.stripePriceId || '',
            currentPeriodStart: tierData.currentPeriodStart || new Date(),
            currentPeriodEnd: tierData.currentPeriodEnd || new Date(),
            cancelAtPeriodEnd: tierData.cancelAtPeriodEnd || false,
            trialEndsAt: tierData.trialEnd,
            cancelledAt: tierData.status === 'CANCELED' ? new Date() : null,
            updatedAt: new Date()
          },
          create: {
            userId,
            stripeSubscriptionId: tierData.stripeSubscriptionId,
            tier: subscriptionTier,
            status: this.mapToDbStatus(tierData.status) || 'ACTIVE',
            stripePriceId: tierData.stripePriceId || '',
            currentPeriodStart: tierData.currentPeriodStart || new Date(),
            currentPeriodEnd: tierData.currentPeriodEnd || new Date(),
            cancelAtPeriodEnd: tierData.cancelAtPeriodEnd || false,
            trialEndsAt: tierData.trialEnd,
            billingCycle: 'MONTHLY' // Default, could be enhanced
          }
        })
      }

      // Always update user subscription tier for consistency
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: subscriptionTier,
          updatedAt: new Date()
        }
      })

    } catch (error) {
      console.error('Database tier update error:', error)
      throw error
    }
  }

  /**
   * Map our internal tier types to database schema
   */
  private static mapToSubscriptionTier(tier?: SubscriptionTier): string {
    const tierMap: Record<SubscriptionTier, string> = {
      'BASIC': 'free',
      'PROFESSIONAL': 'premium',
      'ENTERPRISE': 'enterprise'
    }
    return tier ? tierMap[tier] : 'free'
  }

  private static mapFromSubscriptionTier(tier: string): SubscriptionTier {
    const reverseMap: Record<string, SubscriptionTier> = {
      'free': 'BASIC',
      'premium': 'PROFESSIONAL',
      'enterprise': 'ENTERPRISE'
    }
    return reverseMap[tier] || 'BASIC'
  }

  private static mapToDbStatus(status?: SubscriptionStatus) {
    if (!status) return undefined

    // Map from our types to Prisma enum values
    const statusMap = {
      'ACTIVE': 'ACTIVE' as const,
      'CANCELED': 'CANCELED' as const,
      'PAST_DUE': 'PAST_DUE' as const,
      'TRIALING': 'TRIALING' as const,
      'INCOMPLETE': 'INCOMPLETE' as const,
      'INCOMPLETE_EXPIRED': 'INCOMPLETE_EXPIRED' as const,
      'UNPAID': 'UNPAID' as const
    }

    return statusMap[status] || 'ACTIVE'
  }

  /**
   * Cache management
   */

  private static getCachedTier(userId: string): TierDetectionResult | null {
    const entry = this.cache.get(userId)

    if (!entry) {
      return null
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(userId)
      return null
    }

    return entry.data
  }

  private static setCachedTier(userId: string, data: TierDetectionResult): void {
    this.cache.set(userId, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    })
  }

  private static invalidateUserCache(userId: string): void {
    this.cache.delete(userId)
  }

  /**
   * Clear all caches (for maintenance)
   */
  static clearAllCaches(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Would need to track hits/misses for real implementation
    }
  }
}