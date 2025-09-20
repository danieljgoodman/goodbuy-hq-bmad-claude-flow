/**
 * Clerk Tier Integration for Story 11.10
 * Comprehensive authentication integration with seamless tier system,
 * session enrichment, and real-time subscription updates
 */

import { clerkClient } from '@clerk/nextjs/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { cache } from 'react'
import type {
  SubscriptionTier,
  SubscriptionStatus,
  ClerkUserMetadata,
  TierDetectionResult,
  MiddlewarePerformance
} from '@/types/subscription'
import type {
  UserTier,
  Permission,
  TierPermissions
} from '@/lib/access-control/permission-matrix'

interface TierUpdateData {
  tier: SubscriptionTier
  status: SubscriptionStatus
  stripeCustomerId?: string
  subscriptionId?: string
  trialEndsAt?: string
  subscriptionEndsAt?: string
  features?: string[]
  metadata?: Record<string, any>
}

interface SessionEnrichmentData {
  userId: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  permissions: TierPermissions
  features: string[]
  limits: Record<string, number>
  isTrialing: boolean
  trialEndsAt?: Date
  subscriptionEndsAt?: Date
  lastSyncAt: Date
}

interface PermissionContext {
  userId: string
  tier: SubscriptionTier
  permissions: TierPermissions
  sessionId: string
  isAuthenticated: boolean
  features: string[]
  limits: Record<string, number>
  metadata: Record<string, any>
}

interface WebhookUpdateData {
  type: 'subscription.created' | 'subscription.updated' | 'subscription.deleted' | 'customer.subscription.trial_will_end'
  userId?: string
  stripeCustomerId?: string
  subscriptionId: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  currentPeriodEnd?: Date
  trialEnd?: Date
  metadata?: Record<string, any>
}

/**
 * Enhanced Clerk Tier Integration Service
 * Provides seamless integration between Clerk authentication and subscription tiers
 * with real-time updates, session enrichment, and comprehensive permission management
 */
export class ClerkTierIntegration {
  private static readonly METADATA_KEY = 'subscriptionData'
  private static readonly SESSION_CACHE_KEY = 'enrichedSession'
  private static readonly PERMISSION_CACHE_KEY = 'permissionContext'
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // In-memory cache for performance
  private static sessionCache = new Map<string, { data: SessionEnrichmentData; expiresAt: number }>()
  private static permissionCache = new Map<string, { data: PermissionContext; expiresAt: number }>()

  /**
   * Update user tier metadata in Clerk
   */
  static async updateUserTierMetadata(
    userId: string,
    tierData: TierUpdateData
  ): Promise<void> {
    try {
      const features = this.getTierFeatures(tierData.tier)

      const metadata: ClerkUserMetadata = {
        subscriptionTier: tierData.tier,
        subscriptionStatus: tierData.status,
        features,
        stripeCustomerId: tierData.stripeCustomerId,
        subscriptionId: tierData.subscriptionId,
        trialEndsAt: tierData.trialEndsAt,
        subscriptionEndsAt: tierData.subscriptionEndsAt
      }

      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          [this.METADATA_KEY]: metadata
        }
      })

      console.log(`Updated Clerk metadata for user ${userId} to tier ${tierData.tier}`)

    } catch (error) {
      console.error('Error updating Clerk tier metadata:', error)
      throw new Error(`Failed to update Clerk metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get user tier metadata from Clerk
   */
  static async getUserTierMetadata(userId: string): Promise<ClerkUserMetadata | null> {
    try {
      const user = await clerkClient.users.getUser(userId)

      if (!user.privateMetadata || !user.privateMetadata[this.METADATA_KEY]) {
        return null
      }

      const metadata = user.privateMetadata[this.METADATA_KEY] as ClerkUserMetadata

      // Validate metadata structure
      if (!this.isValidTierMetadata(metadata)) {
        console.warn(`Invalid tier metadata for user ${userId}:`, metadata)
        return null
      }

      return metadata

    } catch (error) {
      console.error('Error getting Clerk tier metadata:', error)
      return null
    }
  }

  /**
   * Clear user tier metadata from Clerk
   */
  static async clearUserTierMetadata(userId: string): Promise<void> {
    try {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          [this.METADATA_KEY]: null
        }
      })

      console.log(`Cleared Clerk metadata for user ${userId}`)

    } catch (error) {
      console.error('Error clearing Clerk tier metadata:', error)
      throw new Error(`Failed to clear Clerk metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Batch update multiple users' tier metadata
   */
  static async batchUpdateTierMetadata(
    updates: Array<{ userId: string; tierData: TierUpdateData }>
  ): Promise<void> {
    try {
      const updatePromises = updates.map(({ userId, tierData }) =>
        this.updateUserTierMetadata(userId, tierData)
      )

      await Promise.all(updatePromises)

      console.log(`Batch updated ${updates.length} users' tier metadata`)

    } catch (error) {
      console.error('Error in batch tier metadata update:', error)
      throw error
    }
  }

  /**
   * Sync user tier from external source to Clerk
   */
  static async syncUserTier(
    userId: string,
    externalTierData: {
      tier: SubscriptionTier
      status: SubscriptionStatus
      stripeCustomerId?: string
      stripeSubscriptionId?: string
      currentPeriodEnd?: Date
      trialEnd?: Date
    }
  ): Promise<void> {
    try {
      const tierData: TierUpdateData = {
        tier: externalTierData.tier,
        status: externalTierData.status,
        stripeCustomerId: externalTierData.stripeCustomerId,
        subscriptionId: externalTierData.stripeSubscriptionId,
        trialEndsAt: externalTierData.trialEnd?.toISOString(),
        subscriptionEndsAt: externalTierData.currentPeriodEnd?.toISOString()
      }

      await this.updateUserTierMetadata(userId, tierData)

    } catch (error) {
      console.error('Error syncing user tier to Clerk:', error)
      throw error
    }
  }

  /**
   * Get users by tier (for admin operations)
   */
  static async getUsersByTier(tier: SubscriptionTier): Promise<string[]> {
    try {
      // Note: Clerk doesn't have direct metadata querying in free tier
      // This would require iterating through users or using Clerk's paid features
      console.warn('getUsersByTier: Not implemented due to Clerk API limitations')
      return []

    } catch (error) {
      console.error('Error getting users by tier:', error)
      return []
    }
  }

  /**
   * Validate user session has tier access
   */
  static async validateSessionTierAccess(
    userId: string,
    requiredTier: SubscriptionTier
  ): Promise<boolean> {
    try {
      const metadata = await this.getUserTierMetadata(userId)

      if (!metadata) {
        return false
      }

      // Check if user's tier meets the requirement
      const tierHierarchy = {
        BASIC: 0,
        PROFESSIONAL: 1,
        ENTERPRISE: 2
      }

      const userTierLevel = tierHierarchy[metadata.subscriptionTier]
      const requiredTierLevel = tierHierarchy[requiredTier]

      if (userTierLevel < requiredTierLevel) {
        return false
      }

      // Check if subscription is active
      const activeStatuses = ['ACTIVE', 'TRIALING']
      return activeStatuses.includes(metadata.subscriptionStatus)

    } catch (error) {
      console.error('Error validating session tier access:', error)
      return false
    }
  }

  /**
   * Check if user's trial is ending soon
   */
  static async isTrialEndingSoon(
    userId: string,
    daysThreshold: number = 3
  ): Promise<boolean> {
    try {
      const metadata = await this.getUserTierMetadata(userId)

      if (!metadata || !metadata.trialEndsAt) {
        return false
      }

      const trialEnd = new Date(metadata.trialEndsAt)
      const now = new Date()
      const daysUntilEnd = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      return daysUntilEnd <= daysThreshold && daysUntilEnd > 0

    } catch (error) {
      console.error('Error checking trial ending status:', error)
      return false
    }
  }

  /**
   * Get tier upgrade recommendations for user
   */
  static async getTierUpgradeRecommendations(userId: string): Promise<{
    currentTier: SubscriptionTier
    recommendedTier?: SubscriptionTier
    benefits: string[]
  } | null> {
    try {
      const metadata = await this.getUserTierMetadata(userId)

      if (!metadata) {
        return null
      }

      const currentTier = metadata.subscriptionTier

      // Simple upgrade logic - could be more sophisticated
      let recommendedTier: SubscriptionTier | undefined
      let benefits: string[] = []

      if (currentTier === 'BASIC') {
        recommendedTier = 'PROFESSIONAL'
        benefits = [
          'Advanced AI-powered valuations',
          'Detailed PDF reports',
          'Progress tracking',
          'Priority support',
          'Export capabilities'
        ]
      } else if (currentTier === 'PROFESSIONAL') {
        recommendedTier = 'ENTERPRISE'
        benefits = [
          'Enterprise-grade evaluations',
          'Advanced benchmarking',
          'Multi-user support',
          'API access',
          'Custom branding',
          'Dedicated support'
        ]
      }

      return {
        currentTier,
        recommendedTier,
        benefits
      }

    } catch (error) {
      console.error('Error getting tier upgrade recommendations:', error)
      return null
    }
  }

  /**
   * Get enriched session data with tier and permission information
   */
  static async getEnrichedSession(userId?: string): Promise<SessionEnrichmentData | null> {
    try {
      const targetUserId = userId || (await auth()).userId
      if (!targetUserId) return null

      // Check cache first
      const cached = this.getCachedSession(targetUserId)
      if (cached) return cached

      const metadata = await this.getUserTierMetadata(targetUserId)
      if (!metadata) return null

      const enrichedSession: SessionEnrichmentData = {
        userId: targetUserId,
        tier: metadata.subscriptionTier,
        status: metadata.subscriptionStatus,
        permissions: await this.getTierPermissions(metadata.subscriptionTier),
        features: metadata.features,
        limits: await this.getTierLimits(metadata.subscriptionTier),
        isTrialing: metadata.subscriptionStatus === 'TRIALING',
        trialEndsAt: metadata.trialEndsAt ? new Date(metadata.trialEndsAt) : undefined,
        subscriptionEndsAt: metadata.subscriptionEndsAt ? new Date(metadata.subscriptionEndsAt) : undefined,
        lastSyncAt: new Date()
      }

      // Cache the session
      this.setCachedSession(targetUserId, enrichedSession)

      return enrichedSession
    } catch (error) {
      console.error('Error getting enriched session:', error)
      return null
    }
  }

  /**
   * Get permission context for the current user
   */
  static async getPermissionContext(userId?: string): Promise<PermissionContext | null> {
    try {
      const targetUserId = userId || (await auth()).userId
      if (!targetUserId) return null

      // Check cache first
      const cached = this.getCachedPermissionContext(targetUserId)
      if (cached) return cached

      const session = await this.getEnrichedSession(targetUserId)
      if (!session) return null

      const { sessionId } = await auth()
      const permissionContext: PermissionContext = {
        userId: targetUserId,
        tier: session.tier,
        permissions: session.permissions,
        sessionId: sessionId || '',
        isAuthenticated: true,
        features: session.features,
        limits: session.limits,
        metadata: {
          isTrialing: session.isTrialing,
          trialEndsAt: session.trialEndsAt?.toISOString(),
          subscriptionEndsAt: session.subscriptionEndsAt?.toISOString(),
          lastSyncAt: session.lastSyncAt.toISOString()
        }
      }

      // Cache the permission context
      this.setCachedPermissionContext(targetUserId, permissionContext)

      return permissionContext
    } catch (error) {
      console.error('Error getting permission context:', error)
      return null
    }
  }

  /**
   * Handle real-time subscription updates from Stripe webhooks
   */
  static async handleWebhookUpdate(webhookData: WebhookUpdateData): Promise<void> {
    try {
      let userId = webhookData.userId

      // If userId not provided, look it up by Stripe customer ID
      if (!userId && webhookData.stripeCustomerId) {
        userId = await this.getUserIdByStripeCustomerId(webhookData.stripeCustomerId)
      }

      if (!userId) {
        console.warn('Unable to find user for webhook update:', webhookData.subscriptionId)
        return
      }

      const tierData: TierUpdateData = {
        tier: webhookData.tier,
        status: webhookData.status,
        stripeCustomerId: webhookData.stripeCustomerId,
        subscriptionId: webhookData.subscriptionId,
        trialEndsAt: webhookData.trialEnd?.toISOString(),
        subscriptionEndsAt: webhookData.currentPeriodEnd?.toISOString(),
        metadata: webhookData.metadata
      }

      // Update Clerk metadata
      await this.updateUserTierMetadata(userId, tierData)

      // Clear cached data to force refresh
      this.clearUserCache(userId)

      // Emit event for real-time updates (if needed)
      await this.emitTierUpdateEvent(userId, webhookData.type, tierData)

      console.log(`Processed webhook ${webhookData.type} for user ${userId}`)
    } catch (error) {
      console.error('Error handling webhook update:', error)
      throw error
    }
  }

  /**
   * Refresh user session after tier change
   */
  static async refreshUserSession(userId: string): Promise<SessionEnrichmentData | null> {
    try {
      // Clear existing cache
      this.clearUserCache(userId)

      // Get fresh session data
      const enrichedSession = await this.getEnrichedSession(userId)

      // Force session refresh in Clerk
      await this.forceClerkSessionRefresh(userId)

      return enrichedSession
    } catch (error) {
      console.error('Error refreshing user session:', error)
      return null
    }
  }

  /**
   * Check if user has permission for a specific action
   */
  static async hasPermission(
    feature: string,
    action: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const context = await this.getPermissionContext(userId)
      if (!context) return false

      const featurePermissions = context.permissions.features[feature as keyof typeof context.permissions.features]
      if (!featurePermissions) return false

      const permission = featurePermissions[action]
      if (!permission) return false

      return permission !== 'none'
    } catch (error) {
      console.error('Error checking permission:', error)
      return false
    }
  }

  /**
   * Get current user's tier (cached)
   */
  static async getCurrentUserTier(userId?: string): Promise<SubscriptionTier | null> {
    try {
      const session = await this.getEnrichedSession(userId)
      return session?.tier || null
    } catch (error) {
      console.error('Error getting current user tier:', error)
      return null
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  static async hasFeatureAccess(feature: string, userId?: string): Promise<boolean> {
    try {
      const session = await this.getEnrichedSession(userId)
      return session?.features.includes(feature) || false
    } catch (error) {
      console.error('Error checking feature access:', error)
      return false
    }
  }

  /**
   * Handle authentication edge cases
   */
  static async handleAuthEdgeCase(
    scenario: 'session_expired' | 'tier_downgrade' | 'subscription_cancelled' | 'trial_expired',
    userId: string,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      switch (scenario) {
        case 'session_expired':
          await this.handleExpiredSession(userId)
          break
        case 'tier_downgrade':
          await this.handleTierDowngrade(userId, context?.previousTier, context?.newTier)
          break
        case 'subscription_cancelled':
          await this.handleSubscriptionCancellation(userId)
          break
        case 'trial_expired':
          await this.handleTrialExpiration(userId)
          break
        default:
          console.warn(`Unknown auth edge case: ${scenario}`)
      }
    } catch (error) {
      console.error(`Error handling auth edge case ${scenario}:`, error)
      throw error
    }
  }

  /**
   * Validate session integrity
   */
  static async validateSessionIntegrity(userId: string): Promise<{
    isValid: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []

    try {
      const session = await this.getEnrichedSession(userId)
      if (!session) {
        issues.push('No session data found')
        recommendations.push('Re-authenticate user')
        return { isValid: false, issues, recommendations }
      }

      // Check if session is stale
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      if (Date.now() - session.lastSyncAt.getTime() > maxAge) {
        issues.push('Session data is stale')
        recommendations.push('Refresh session data')
      }

      // Check trial expiration
      if (session.isTrialing && session.trialEndsAt && session.trialEndsAt < new Date()) {
        issues.push('Trial has expired')
        recommendations.push('Upgrade subscription or handle trial expiration')
      }

      // Check subscription status
      if (!['ACTIVE', 'TRIALING'].includes(session.status)) {
        issues.push(`Subscription status is ${session.status}`)
        recommendations.push('Handle subscription status issue')
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations
      }
    } catch (error) {
      return {
        isValid: false,
        issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: ['Check system logs and retry validation']
      }
    }
  }

  /**
   * Private helper methods
   */

  private static getTierFeatures(tier: SubscriptionTier): string[] {
    const tierFeatures = {
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

    return tierFeatures[tier] || tierFeatures.BASIC
  }

  private static isValidTierMetadata(metadata: any): metadata is ClerkUserMetadata {
    if (!metadata || typeof metadata !== 'object') {
      return false
    }

    const validTiers = ['BASIC', 'PROFESSIONAL', 'ENTERPRISE']
    const validStatuses = [
      'ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING',
      'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'UNPAID'
    ]

    return (
      validTiers.includes(metadata.subscriptionTier) &&
      validStatuses.includes(metadata.subscriptionStatus) &&
      Array.isArray(metadata.features)
    )
  }

  // Cache management methods
  private static getCachedSession(userId: string): SessionEnrichmentData | null {
    const cached = this.sessionCache.get(userId)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }
    this.sessionCache.delete(userId)
    return null
  }

  private static setCachedSession(userId: string, data: SessionEnrichmentData): void {
    this.sessionCache.set(userId, {
      data,
      expiresAt: Date.now() + this.CACHE_DURATION
    })
  }

  private static getCachedPermissionContext(userId: string): PermissionContext | null {
    const cached = this.permissionCache.get(userId)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }
    this.permissionCache.delete(userId)
    return null
  }

  private static setCachedPermissionContext(userId: string, data: PermissionContext): void {
    this.permissionCache.set(userId, {
      data,
      expiresAt: Date.now() + this.CACHE_DURATION
    })
  }

  private static clearUserCache(userId: string): void {
    this.sessionCache.delete(userId)
    this.permissionCache.delete(userId)
  }

  // Tier and permission helper methods
  private static async getTierPermissions(tier: SubscriptionTier): Promise<TierPermissions> {
    // This would integrate with the access control system
    const { getPermissionsForTier } = await import('@/lib/access-control/tier-access-control')
    return getPermissionsForTier(tier.toLowerCase() as UserTier)
  }

  private static async getTierLimits(tier: SubscriptionTier): Promise<Record<string, number>> {
    const permissions = await this.getTierPermissions(tier)
    return permissions.limits
  }

  // Stripe integration helpers
  private static async getUserIdByStripeCustomerId(stripeCustomerId: string): Promise<string | null> {
    try {
      // This would typically query your database
      // For now, we'll search through Clerk users (not efficient for production)
      console.warn('getUserIdByStripeCustomerId: Implement efficient database lookup')
      return null
    } catch (error) {
      console.error('Error looking up user by Stripe customer ID:', error)
      return null
    }
  }

  // Session management helpers
  private static async forceClerkSessionRefresh(userId: string): Promise<void> {
    try {
      // Update user metadata to trigger session refresh
      const user = await clerkClient.users.getUser(userId)
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          ...user.privateMetadata,
          lastRefresh: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Error forcing Clerk session refresh:', error)
    }
  }

  // Event emission for real-time updates
  private static async emitTierUpdateEvent(
    userId: string,
    eventType: string,
    tierData: TierUpdateData
  ): Promise<void> {
    try {
      // Implement real-time event emission (WebSockets, Server-Sent Events, etc.)
      console.log(`Emitting tier update event: ${eventType} for user ${userId}`)
      // Example: await eventEmitter.emit('tier.updated', { userId, eventType, tierData })
    } catch (error) {
      console.error('Error emitting tier update event:', error)
    }
  }

  // Edge case handlers
  private static async handleExpiredSession(userId: string): Promise<void> {
    await this.clearUserTierMetadata(userId)
    this.clearUserCache(userId)
  }

  private static async handleTierDowngrade(
    userId: string,
    previousTier?: SubscriptionTier,
    newTier?: SubscriptionTier
  ): Promise<void> {
    // Clear cache and update session
    this.clearUserCache(userId)
    if (newTier) {
      await this.updateUserTierMetadata(userId, {
        tier: newTier,
        status: 'ACTIVE'
      })
    }
  }

  private static async handleSubscriptionCancellation(userId: string): Promise<void> {
    await this.updateUserTierMetadata(userId, {
      tier: 'BASIC',
      status: 'CANCELED'
    })
    this.clearUserCache(userId)
  }

  private static async handleTrialExpiration(userId: string): Promise<void> {
    await this.updateUserTierMetadata(userId, {
      tier: 'BASIC',
      status: 'ACTIVE'
    })
    this.clearUserCache(userId)
  }
}

/**
 * Cached helper functions for common operations
 */
export const getCurrentUserTier = cache(ClerkTierIntegration.getCurrentUserTier)
export const getEnrichedSession = cache(ClerkTierIntegration.getEnrichedSession)
export const getPermissionContext = cache(ClerkTierIntegration.getPermissionContext)
export const hasFeatureAccess = cache(ClerkTierIntegration.hasFeatureAccess)
export const hasPermission = cache(ClerkTierIntegration.hasPermission)

/**
 * Hook-style helper for client-side usage
 */
export async function useAuthTierIntegration(userId?: string) {
  const session = await getEnrichedSession(userId)
  const permissionContext = await getPermissionContext(userId)

  return {
    session,
    permissionContext,
    isAuthenticated: !!session,
    tier: session?.tier || 'BASIC',
    features: session?.features || [],
    isTrialing: session?.isTrialing || false,
    hasFeature: (feature: string) => session?.features.includes(feature) || false,
    checkPermission: (feature: string, action: string) => hasPermission(feature, action, userId)
  }
}