/**
 * Access Control Components
 * Story 11.10: Complete client-side access control system
 * 
 * This module provides a comprehensive suite of components for implementing
 * tier-based access control with beautiful UI components and upgrade flows.
 */

// Core components
export { TierProtectedComponent, withTierProtection, SuspenseTierProtectedComponent } from './TierProtectedComponent';
export { UpgradePrompt } from './UpgradePrompt';
export { TierBadge } from './TierBadge';
export { UsageMeter } from './UsageMeter';

// Hooks
export {
  useTierAccess,
  usePermissions,
  useUpgradeRecommendation,
  useSubscriptionStatus,
  useUsageTracking,
  useTierLimits
} from '@/hooks/useTierAccess';

// Types
export type {
  TierProtectionConfig,
  UpgradeRecommendationData,
  AccessControlContextValue,
  BulkPermissionCheck,
  BulkPermissionResult,
  UsageTrackingData,
  TierLimitStatus,
  SubscriptionChangeEvent,
  AccessControlMetrics,
  TierBadgeProps,
  FeatureGateProps,
  UsageMeterProps,
  TierComparisonProps,
  AccessControlError,
  TierValidationError,
  UsageLimitError,
  AccessControlEventType,
  AccessControlEvent,
  TierChangeDirection,
  TierChangeAnalysis
} from '@/types/access-control';

// Core access control functionality
export {
  tierAccessControl,
  hasTierAccess,
  checkPermission,
  getPermissionsForTier,
  checkTierLimits,
  trackUsage,
  getAvailableFeatures,
  getUpgradeRecommendations,
  type UserTier,
  type Permission,
  type AccessResult,
  type UsageContext,
  type TierPermissions
} from '@/lib/access-control/tier-access-control';

/**
 * Utility functions for common access control patterns
 */

/**
 * Check if a feature is available for a specific tier
 */
export function isFeatureAvailable(
  userTier: UserTier,
  feature: keyof TierPermissions['features'],
  action: string
): boolean {
  try {
    const result = checkPermission(userTier, feature, action);
    return result.allowed;
  } catch {
    return false;
  }
}

/**
 * Get the minimum tier required for a feature
 */
export function getMinimumTierForFeature(
  feature: keyof TierPermissions['features'],
  action: string
): UserTier | null {
  const tiers: UserTier[] = ['basic', 'professional', 'enterprise'];
  
  for (const tier of tiers) {
    if (isFeatureAvailable(tier, feature, action)) {
      return tier;
    }
  }
  
  return null;
}

/**
 * Check if user can upgrade to access a feature
 */
export function canUpgradeForFeature(
  currentTier: UserTier,
  feature: keyof TierPermissions['features'],
  action: string
): { canUpgrade: boolean; targetTier?: UserTier } {
  const minimumTier = getMinimumTierForFeature(feature, action);
  
  if (!minimumTier) {
    return { canUpgrade: false };
  }
  
  const tierHierarchy: Record<UserTier, number> = {
    basic: 1,
    professional: 2,
    enterprise: 3
  };
  
  const canUpgrade = tierHierarchy[minimumTier] > tierHierarchy[currentTier];
  
  return {
    canUpgrade,
    targetTier: canUpgrade ? minimumTier : undefined
  };
}

/**
 * Format tier name for display
 */
export function formatTierName(tier: UserTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

/**
 * Format feature name for display
 */
export function formatFeatureName(feature: keyof TierPermissions['features']): string {
  return feature
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Constants
 */
export const TIER_COLORS: Record<UserTier, string> = {
  basic: 'blue',
  professional: 'amber',
  enterprise: 'purple'
};

export const TIER_HIERARCHY: Record<UserTier, number> = {
  basic: 1,
  professional: 2,
  enterprise: 3
};

export const DEFAULT_TIER: UserTier = 'basic';

export default {
  TierProtectedComponent,
  UpgradePrompt,
  TierBadge,
  UsageMeter,
  useTierAccess,
  usePermissions,
  useUpgradeRecommendation,
  isFeatureAvailable,
  getMinimumTierForFeature,
  canUpgradeForFeature,
  formatTierName,
  formatFeatureName
};