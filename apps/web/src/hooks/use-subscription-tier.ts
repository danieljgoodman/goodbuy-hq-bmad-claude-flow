'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSafeUser as useUser } from './use-safe-clerk'
import { useRouter } from 'next/navigation'

type SubscriptionTier = 'free' | 'premium' | 'enterprise'
type FeatureType = 'ai_guides' | 'progress_tracking' | 'pdf_reports' | 'analytics' | 'benchmarks' | 'priority_support'
type RequiredTier = 'PREMIUM' | 'ENTERPRISE'

export interface TierAccess {
  hasAccess: boolean
  userTier: SubscriptionTier
  requiredTier?: RequiredTier
  upgradeRequired: boolean
  upgradeUrl?: string
  restrictions?: string[]
}

export interface SubscriptionTierHook {
  // Current user tier
  currentTier: SubscriptionTier
  isLoading: boolean
  
  // Feature access checks
  checkFeatureAccess: (feature: FeatureType, requiredTier?: RequiredTier) => Promise<TierAccess>
  hasFeatureAccess: (feature: FeatureType) => boolean
  
  // Premium features
  hasAnalytics: boolean
  hasPDFReports: boolean
  hasProgressTracking: boolean
  hasAIGuides: boolean
  hasBenchmarks: boolean
  hasPrioritySupport: boolean
  
  // Navigation helpers
  getUpgradeUrl: (targetTier?: RequiredTier) => string
  showUpgradePrompt: (feature: FeatureType) => void
  
  // Refresh tier data
  refreshTier: () => Promise<void>
}

const FEATURE_TIER_MAPPING: Record<FeatureType, RequiredTier> = {
  ai_guides: 'PREMIUM',
  progress_tracking: 'PREMIUM', 
  pdf_reports: 'PREMIUM',
  analytics: 'PREMIUM',
  benchmarks: 'ENTERPRISE',
  priority_support: 'PREMIUM'
}

const TIER_HIERARCHY = {
  free: 0,
  premium: 1,
  enterprise: 2
}

export function useSubscriptionTier(): SubscriptionTierHook {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free')
  const [isLoading, setIsLoading] = useState(true)
  const [tierCache, setTierCache] = useState<Record<string, TierAccess>>({})

  // Extract tier from user metadata or default to free
  const getUserTier = useCallback((): SubscriptionTier => {
    if (!user) return 'free'
    
    // Check user's public metadata for subscription tier
    const tier = user.publicMetadata?.subscriptionTier as string
    
    if (tier === 'premium' || tier === 'enterprise') {
      return tier as SubscriptionTier
    }
    
    // Fallback: check for any premium indicators
    if (user.publicMetadata?.isPremium) {
      return 'premium'
    }
    
    return 'free'
  }, [user])

  // Initialize tier when user loads
  useEffect(() => {
    if (isLoaded) {
      const tier = getUserTier()
      setCurrentTier(tier)
      setIsLoading(false)
    }
  }, [isLoaded, getUserTier])

  // Check feature access with API call
  const checkFeatureAccess = useCallback(async (
    feature: FeatureType, 
    requiredTier?: RequiredTier
  ): Promise<TierAccess> => {
    if (!user) {
      return {
        hasAccess: false,
        userTier: 'free',
        requiredTier: requiredTier || FEATURE_TIER_MAPPING[feature],
        upgradeRequired: true
      }
    }

    const tier = requiredTier || FEATURE_TIER_MAPPING[feature]
    const cacheKey = `${feature}-${tier}`
    
    // Return cached result if available
    if (tierCache[cacheKey]) {
      return tierCache[cacheKey]
    }

    try {
      const response = await fetch('/api/premium/check-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          featureType: feature,
          requiredTier: tier
        })
      })

      if (!response.ok) {
        throw new Error('Failed to check tier access')
      }

      const data = await response.json()
      
      const tierAccess: TierAccess = {
        hasAccess: data.hasAccess || false,
        userTier: data.userTier || 'free',
        requiredTier: tier,
        upgradeRequired: !data.hasAccess,
        upgradeUrl: data.hasAccess ? undefined : getUpgradeUrl(tier),
        restrictions: data.restrictions
      }

      // Cache the result for 5 minutes
      setTierCache(prev => ({ ...prev, [cacheKey]: tierAccess }))
      setTimeout(() => {
        setTierCache(prev => {
          const { [cacheKey]: _, ...rest } = prev
          return rest
        })
      }, 5 * 60 * 1000)

      return tierAccess
    } catch (error) {
      console.error('Error checking feature access:', error)
      
      // Fallback to local check
      const userTierLevel = TIER_HIERARCHY[currentTier]
      const requiredTierLevel = tier === 'PREMIUM' ? TIER_HIERARCHY.premium : TIER_HIERARCHY.enterprise
      const hasAccess = userTierLevel >= requiredTierLevel
      
      return {
        hasAccess,
        userTier: currentTier,
        requiredTier: tier,
        upgradeRequired: !hasAccess,
        upgradeUrl: hasAccess ? undefined : getUpgradeUrl(tier)
      }
    }
  }, [user, currentTier, tierCache])

  // Simple local feature access check
  const hasFeatureAccess = useCallback((feature: FeatureType): boolean => {
    const requiredTier = FEATURE_TIER_MAPPING[feature]
    const userTierLevel = TIER_HIERARCHY[currentTier]
    const requiredTierLevel = requiredTier === 'PREMIUM' ? TIER_HIERARCHY.premium : TIER_HIERARCHY.enterprise
    
    return userTierLevel >= requiredTierLevel
  }, [currentTier])

  // Get upgrade URL
  const getUpgradeUrl = useCallback((targetTier?: RequiredTier): string => {
    const tier = targetTier || 'PREMIUM'
    return `/upgrade?from=${currentTier}&to=${tier.toLowerCase()}&utm_source=tier_check&utm_medium=hook`
  }, [currentTier])

  // Show upgrade prompt
  const showUpgradePrompt = useCallback((feature: FeatureType) => {
    const requiredTier = FEATURE_TIER_MAPPING[feature]
    router.push(getUpgradeUrl(requiredTier))
  }, [router, getUpgradeUrl])

  // Refresh tier data
  const refreshTier = useCallback(async () => {
    if (!user) return
    
    try {
      // Force refresh user data
      await user.reload()
      
      // Update tier
      const newTier = getUserTier()
      setCurrentTier(newTier)
      
      // Clear cache
      setTierCache({})
    } catch (error) {
      console.error('Error refreshing tier:', error)
    }
  }, [user, getUserTier])

  // Computed feature access flags
  const hasAnalytics = hasFeatureAccess('analytics')
  const hasPDFReports = hasFeatureAccess('pdf_reports')
  const hasProgressTracking = hasFeatureAccess('progress_tracking')
  const hasAIGuides = hasFeatureAccess('ai_guides')
  const hasBenchmarks = hasFeatureAccess('benchmarks')
  const hasPrioritySupport = hasFeatureAccess('priority_support')

  return {
    currentTier,
    isLoading,
    checkFeatureAccess,
    hasFeatureAccess,
    hasAnalytics,
    hasPDFReports,
    hasProgressTracking,
    hasAIGuides,
    hasBenchmarks,
    hasPrioritySupport,
    getUpgradeUrl,
    showUpgradePrompt,
    refreshTier
  }
}