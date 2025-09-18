/**
 * Clerk Metadata Integration for Tier Management
 * Story 11.2: Subscription-Based Routing Middleware
 */

import { clerkClient } from '@clerk/nextjs/server'
import type {
  SubscriptionTier,
  SubscriptionStatus,
  ClerkUserMetadata
} from '@/types/subscription'

interface TierUpdateData {
  tier: SubscriptionTier
  status: SubscriptionStatus
  stripeCustomerId?: string
  subscriptionId?: string
  trialEndsAt?: string
  subscriptionEndsAt?: string
}

/**
 * Service for managing user subscription tier data in Clerk metadata
 */
export class ClerkTierIntegration {
  private static readonly METADATA_KEY = 'subscriptionData'

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
}