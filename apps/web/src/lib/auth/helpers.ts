/**
 * Authentication Helper Functions for Story 11.10
 * Comprehensive helper functions for tier access, permission checking,
 * and authentication edge cases handling
 */

import { auth, currentUser } from '@clerk/nextjs'
import { cache } from 'react'
import {
  ClerkTierIntegration,
  getCurrentUserTier,
  getEnrichedSession,
  getPermissionContext,
  hasFeatureAccess,
  hasPermission
} from './clerk-tier-integration'
import { tierAccessControl } from '@/lib/access-control/tier-access-control'
import type {
  SubscriptionTier,
  SubscriptionStatus,
  TierDetectionResult
} from '@/types/subscription'
import type {
  UserTier,
  TierPermissions,
  AccessResult,
  UsageContext
} from '@/lib/access-control/tier-access-control'

/**
 * Authentication state interface
 */
export interface AuthState {
  isAuthenticated: boolean
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    imageUrl?: string
  } | null
  tier: SubscriptionTier
  status: SubscriptionStatus
  features: string[]
  permissions: TierPermissions | null
  isTrialing: boolean
  trialEndsAt?: Date
  subscriptionEndsAt?: Date
  lastSyncAt?: Date
}

/**
 * Permission check result with detailed information
 */
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  requiredTier?: SubscriptionTier
  requiredFeatures?: string[]
  upgradeUrl?: string
  blockedBy?: 'tier' | 'feature' | 'usage_limit' | 'status' | 'trial_expired'
}

/**
 * Feature access result with usage information
 */
export interface FeatureAccessResult {
  hasAccess: boolean
  usageCount: number
  usageLimit: number
  remainingUsage: number
  resetDate?: Date
  reason?: string
}

/**
 * Get current authentication state with tier information
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isAuthenticated: false,
        user: null,
        tier: 'BASIC',
        status: 'ACTIVE',
        features: [],
        permissions: null,
        isTrialing: false
      }
    }

    const [user, enrichedSession, permissionContext] = await Promise.all([
      currentUser(),
      getEnrichedSession(userId),
      getPermissionContext(userId)
    ])

    return {
      isAuthenticated: true,
      user: user ? {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        imageUrl: user.imageUrl || undefined
      } : null,
      tier: enrichedSession?.tier || 'BASIC',
      status: enrichedSession?.status || 'ACTIVE',
      features: enrichedSession?.features || [],
      permissions: enrichedSession?.permissions || null,
      isTrialing: enrichedSession?.isTrialing || false,
      trialEndsAt: enrichedSession?.trialEndsAt,
      subscriptionEndsAt: enrichedSession?.subscriptionEndsAt,
      lastSyncAt: enrichedSession?.lastSyncAt
    }
  } catch (error) {
    console.error('Error getting auth state:', error)
    return {
      isAuthenticated: false,
      user: null,
      tier: 'BASIC',
      status: 'ACTIVE',
      features: [],
      permissions: null,
      isTrialing: false
    }
  }
})

/**
 * Check if user has access to a specific tier
 */
export async function checkTierAccess(
  requiredTier: SubscriptionTier,
  userId?: string
): Promise<PermissionCheckResult> {
  try {
    const currentTier = await getCurrentUserTier(userId)

    if (!currentTier) {
      return {
        allowed: false,
        reason: 'User tier not found',
        requiredTier,
        upgradeUrl: `/pricing?upgrade=${requiredTier.toLowerCase()}`,
        blockedBy: 'tier'
      }
    }

    const hasAccess = tierAccessControl.hasTierAccess(
      currentTier.toLowerCase() as UserTier,
      requiredTier.toLowerCase() as UserTier
    )

    return {
      allowed: hasAccess,
      reason: hasAccess ? undefined : `Requires ${requiredTier} tier`,
      requiredTier: hasAccess ? undefined : requiredTier,
      upgradeUrl: hasAccess ? undefined : `/pricing?upgrade=${requiredTier.toLowerCase()}`,
      blockedBy: hasAccess ? undefined : 'tier'
    }
  } catch (error) {
    console.error('Error checking tier access:', error)
    return {
      allowed: false,
      reason: 'Error checking tier access',
      requiredTier,
      upgradeUrl: `/pricing?upgrade=${requiredTier.toLowerCase()}`,
      blockedBy: 'tier'
    }
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeatureAccess(
  feature: string,
  action: string = 'read',
  userId?: string
): Promise<PermissionCheckResult> {
  try {
    const permissionContext = await getPermissionContext(userId)

    if (!permissionContext) {
      return {
        allowed: false,
        reason: 'Permission context not found',
        upgradeUrl: '/pricing',
        blockedBy: 'feature'
      }
    }

    const hasAccess = await hasPermission(feature, action, userId)

    if (!hasAccess) {
      // Find minimum tier that has this feature
      const tiers: SubscriptionTier[] = ['BASIC', 'PROFESSIONAL', 'ENTERPRISE']
      let requiredTier: SubscriptionTier | undefined

      for (const tier of tiers) {
        const tierPermissions = tierAccessControl.getPermissionsForTier(tier.toLowerCase() as UserTier)
        const featurePermissions = tierPermissions.features[feature as keyof typeof tierPermissions.features]

        if (featurePermissions && featurePermissions[action] && featurePermissions[action] !== 'none') {
          requiredTier = tier
          break
        }
      }

      return {
        allowed: false,
        reason: `Feature '${feature}' not available in current tier`,
        requiredTier,
        requiredFeatures: [feature],
        upgradeUrl: requiredTier ? `/pricing?upgrade=${requiredTier.toLowerCase()}&feature=${feature}` : '/pricing',
        blockedBy: 'feature'
      }
    }

    return {
      allowed: true
    }
  } catch (error) {
    console.error('Error checking feature access:', error)
    return {
      allowed: false,
      reason: 'Error checking feature access',
      upgradeUrl: '/pricing',
      blockedBy: 'feature'
    }
  }
}

/**
 * Check comprehensive permission with usage tracking
 */
export async function checkPermissionWithUsage(
  feature: string,
  action: string,
  userId?: string,
  trackUsage: boolean = false
): Promise<PermissionCheckResult & { usageInfo?: FeatureAccessResult }> {
  try {
    const authState = await getAuthState()
    const targetUserId = userId || authState.user?.id

    if (!targetUserId) {
      return {
        allowed: false,
        reason: 'User not authenticated',
        blockedBy: 'status'
      }
    }

    // Check basic permission
    const featureCheck = await checkFeatureAccess(feature, action, targetUserId)
    if (!featureCheck.allowed) {
      return featureCheck
    }

    // Check subscription status
    if (!['ACTIVE', 'TRIALING'].includes(authState.status)) {
      return {
        allowed: false,
        reason: `Subscription status is ${authState.status}`,
        upgradeUrl: '/pricing',
        blockedBy: 'status'
      }
    }

    // Check trial expiration
    if (authState.isTrialing && authState.trialEndsAt && authState.trialEndsAt < new Date()) {
      return {
        allowed: false,
        reason: 'Trial has expired',
        upgradeUrl: '/pricing?reason=trial_expired',
        blockedBy: 'trial_expired'
      }
    }

    // Check usage limits
    const usageContext: UsageContext = {
      userId: targetUserId,
      feature: feature as keyof TierPermissions['features'],
      action,
      timestamp: new Date()
    }

    const accessResult = tierAccessControl.checkPermission(
      authState.tier.toLowerCase() as UserTier,
      feature as keyof TierPermissions['features'],
      action,
      usageContext
    )

    if (!accessResult.allowed) {
      let blockedBy: PermissionCheckResult['blockedBy'] = 'usage_limit'

      if (accessResult.conditions?.some(c => c.type === 'usage_limit')) {
        blockedBy = 'usage_limit'
      }

      return {
        allowed: false,
        reason: accessResult.reason,
        upgradeUrl: accessResult.upgradeRequired ?
          `/pricing?upgrade=${accessResult.upgradeRequired}&reason=usage_limit` : '/pricing',
        blockedBy
      }
    }

    // Track usage if requested
    if (trackUsage) {
      tierAccessControl.trackUsage(usageContext)
    }

    // Get usage information
    const currentUsage = tierAccessControl.getCurrentUsage(
      targetUserId,
      feature as keyof TierPermissions['features'],
      action,
      'monthly'
    )

    const permissions = authState.permissions
    const usageLimit = permissions?.limits.monthlyApiCalls || -1

    const usageInfo: FeatureAccessResult = {
      hasAccess: true,
      usageCount: currentUsage,
      usageLimit,
      remainingUsage: usageLimit === -1 ? -1 : Math.max(0, usageLimit - currentUsage),
      resetDate: getNextMonthStart()
    }

    return {
      allowed: true,
      usageInfo
    }
  } catch (error) {
    console.error('Error checking permission with usage:', error)
    return {
      allowed: false,
      reason: 'Error checking permission',
      upgradeUrl: '/pricing'
    }
  }
}

/**
 * Get user's feature access status
 */
export async function getFeatureAccessStatus(
  features: string[],
  userId?: string
): Promise<Record<string, FeatureAccessResult>> {
  try {
    const authState = await getAuthState()
    const targetUserId = userId || authState.user?.id

    if (!targetUserId) {
      return features.reduce((acc, feature) => ({
        ...acc,
        [feature]: {
          hasAccess: false,
          usageCount: 0,
          usageLimit: 0,
          remainingUsage: 0,
          reason: 'User not authenticated'
        }
      }), {})
    }

    const results: Record<string, FeatureAccessResult> = {}

    for (const feature of features) {
      const hasAccess = await hasFeatureAccess(feature, targetUserId)
      const currentUsage = tierAccessControl.getCurrentUsage(
        targetUserId,
        feature as keyof TierPermissions['features'],
        'read',
        'monthly'
      )

      const permissions = authState.permissions
      const usageLimit = permissions?.limits.monthlyApiCalls || -1

      results[feature] = {
        hasAccess,
        usageCount: currentUsage,
        usageLimit,
        remainingUsage: usageLimit === -1 ? -1 : Math.max(0, usageLimit - currentUsage),
        resetDate: getNextMonthStart(),
        reason: hasAccess ? undefined : `Feature not available in ${authState.tier} tier`
      }
    }

    return results
  } catch (error) {
    console.error('Error getting feature access status:', error)
    return features.reduce((acc, feature) => ({
      ...acc,
      [feature]: {
        hasAccess: false,
        usageCount: 0,
        usageLimit: 0,
        remainingUsage: 0,
        reason: 'Error checking feature access'
      }
    }), {})
  }
}

/**
 * Handle authentication edge cases
 */
export async function handleAuthEdgeCase(
  scenario: 'session_expired' | 'tier_downgrade' | 'subscription_cancelled' | 'trial_expired',
  userId?: string,
  context?: Record<string, any>
): Promise<{ success: boolean; redirectUrl?: string; message?: string }> {
  try {
    const authState = await getAuthState()
    const targetUserId = userId || authState.user?.id

    if (!targetUserId) {
      return {
        success: false,
        message: 'User not authenticated',
        redirectUrl: '/sign-in'
      }
    }

    await ClerkTierIntegration.handleAuthEdgeCase(scenario, targetUserId, context)

    switch (scenario) {
      case 'session_expired':
        return {
          success: true,
          message: 'Session refreshed',
          redirectUrl: '/sign-in?reason=session_expired'
        }

      case 'tier_downgrade':
        return {
          success: true,
          message: 'Tier downgraded, access updated',
          redirectUrl: '/dashboard?notice=tier_downgraded'
        }

      case 'subscription_cancelled':
        return {
          success: true,
          message: 'Subscription cancelled, moved to basic tier',
          redirectUrl: '/dashboard?notice=subscription_cancelled'
        }

      case 'trial_expired':
        return {
          success: true,
          message: 'Trial expired, please upgrade',
          redirectUrl: '/pricing?reason=trial_expired'
        }

      default:
        return {
          success: false,
          message: 'Unknown edge case scenario'
        }
    }
  } catch (error) {
    console.error('Error handling auth edge case:', error)
    return {
      success: false,
      message: 'Error handling authentication issue',
      redirectUrl: '/dashboard'
    }
  }
}

/**
 * Refresh user permissions after tier change
 */
export async function refreshPermissionsAfterTierChange(
  userId?: string
): Promise<{ success: boolean; newTier?: SubscriptionTier; message?: string }> {
  try {
    const authState = await getAuthState()
    const targetUserId = userId || authState.user?.id

    if (!targetUserId) {
      return {
        success: false,
        message: 'User not authenticated'
      }
    }

    const refreshedSession = await ClerkTierIntegration.refreshUserSession(targetUserId)

    if (refreshedSession) {
      return {
        success: true,
        newTier: refreshedSession.tier,
        message: 'Permissions refreshed successfully'
      }
    }

    return {
      success: false,
      message: 'Failed to refresh permissions'
    }
  } catch (error) {
    console.error('Error refreshing permissions:', error)
    return {
      success: false,
      message: 'Error refreshing permissions'
    }
  }
}

/**
 * Get upgrade recommendations for blocked features
 */
export async function getUpgradeRecommendations(
  blockedFeatures: string[],
  userId?: string
): Promise<{
  recommendedTier: SubscriptionTier
  benefits: string[]
  features: string[]
  estimatedPrice: string
  upgradeUrl: string
}> {
  try {
    const authState = await getAuthState()

    // Determine minimum tier needed for all blocked features
    let recommendedTier: SubscriptionTier = 'PROFESSIONAL'

    for (const feature of blockedFeatures) {
      const tiers: SubscriptionTier[] = ['BASIC', 'PROFESSIONAL', 'ENTERPRISE']

      for (const tier of tiers) {
        const tierPermissions = tierAccessControl.getPermissionsForTier(tier.toLowerCase() as UserTier)
        const featurePermissions = tierPermissions.features[feature as keyof typeof tierPermissions.features]

        if (featurePermissions && Object.values(featurePermissions).some(p => p !== 'none')) {
          if (tier === 'ENTERPRISE') {
            recommendedTier = 'ENTERPRISE'
            break
          } else if (tier === 'PROFESSIONAL' && recommendedTier === 'BASIC') {
            recommendedTier = 'PROFESSIONAL'
          }
        }
      }
    }

    // Get tier benefits
    const benefits = getTierBenefits(recommendedTier)
    const features = getTierFeatures(recommendedTier)
    const estimatedPrice = getTierPrice(recommendedTier)

    return {
      recommendedTier,
      benefits,
      features,
      estimatedPrice,
      upgradeUrl: `/pricing?upgrade=${recommendedTier.toLowerCase()}&features=${blockedFeatures.join(',')}`
    }
  } catch (error) {
    console.error('Error getting upgrade recommendations:', error)
    return {
      recommendedTier: 'PROFESSIONAL',
      benefits: ['Access to blocked features'],
      features: blockedFeatures,
      estimatedPrice: '$29/month',
      upgradeUrl: '/pricing'
    }
  }
}

// Helper functions

function getNextMonthStart(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1)
}

function getTierBenefits(tier: SubscriptionTier): string[] {
  const benefits = {
    BASIC: ['Basic evaluations', 'Simple reports', 'Community support'],
    PROFESSIONAL: [
      'Advanced AI-powered evaluations',
      'Professional PDF reports',
      'Progress tracking',
      'Priority support',
      'Export capabilities',
      'Advanced analytics'
    ],
    ENTERPRISE: [
      'Enterprise-grade evaluations',
      'Custom branding',
      'Multi-user support',
      'API access',
      'Dedicated support',
      'SLA guarantees',
      'Advanced benchmarking'
    ]
  }

  return benefits[tier] || benefits.BASIC
}

function getTierFeatures(tier: SubscriptionTier): string[] {
  const features = {
    BASIC: ['basic_evaluation', 'basic_reports', 'basic_analytics'],
    PROFESSIONAL: [
      'professional_evaluation', 'ai_guides', 'progress_tracking',
      'pdf_reports', 'advanced_analytics', 'export_data'
    ],
    ENTERPRISE: [
      'enterprise_evaluation', 'benchmarks', 'multi_user',
      'api_access', 'custom_branding', 'dedicated_support'
    ]
  }

  return features[tier] || features.BASIC
}

function getTierPrice(tier: SubscriptionTier): string {
  const prices = {
    BASIC: 'Free',
    PROFESSIONAL: '$29/month',
    ENTERPRISE: '$99/month'
  }

  return prices[tier] || 'Contact sales'
}

// Export cached versions for better performance
export const cachedGetAuthState = cache(getAuthState)
export const cachedCheckTierAccess = cache(checkTierAccess)
export const cachedCheckFeatureAccess = cache(checkFeatureAccess)
export const cachedGetFeatureAccessStatus = cache(getFeatureAccessStatus)