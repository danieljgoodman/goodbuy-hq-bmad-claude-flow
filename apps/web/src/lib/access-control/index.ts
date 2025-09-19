/**
 * Tier-Based Access Control System - Main Export
 * Story 11.10: Complete access control system with permission checking,
 * usage limits, tier inheritance, and React integration
 *
 * This module provides a comprehensive tier-based access control system that:
 * - Enforces permission boundaries across basic, professional, and enterprise tiers
 * - Tracks usage limits and enforces quotas
 * - Provides React hooks and components for UI integration
 * - Includes middleware for API and route protection
 * - Supports real-time permission updates and subscription changes
 */

// Core access control system
export {
  TierAccessControl,
  tierAccessControl,
  hasTierAccess,
  checkPermission,
  getPermissionsForTier,
  checkTierLimits,
  trackUsage,
  getAvailableFeatures,
  getUpgradeRecommendations,
} from './tier-access-control';

// Permission matrix and types
export {
  PERMISSION_MATRIX,
  PermissionChecker,
  type UserTier,
  type Permission,
  type ConditionalPermission,
  type FeaturePermissions,
  type ResourcePermissions,
  type TierPermissions,
  type TierPermissionMatrix,
} from './permission-matrix';

// Additional types from access control
export type {
  FeaturePermission,
  AccessCondition,
  AccessResult,
  UsageContext,
} from './tier-access-control';

// Middleware and protection utilities
export {
  withTierProtection,
  withAPITierProtection,
  TierGate,
  usePermissionCheck,
  enforceTierLimits,
  createPermissionResponse,
  RequiresTier,
  RequiresPermission,
  type RouteProtectionConfig,
  type APIProtectionConfig,
  type TierGateProps as MiddlewareTierGateProps,
  type UsePermissionCheckResult,
} from './middleware';

// React hooks
export {
  TierProvider,
  useTier,
  useFeatureAccess,
  useTierAccess,
  useTierLimits,
  useAvailableFeatures,
  useUpgradeRecommendations,
  useUsageTracking,
  useRealtimePermissions,
  useBatchPermissions,
  useSubscriptionIntegration,
  useFeatureAnalytics,
  type TierContextType,
  type UseFeatureAccessOptions,
  type UseFeatureAccessResult,
} from './hooks';

// React components
export {
  TierGate as TierGateComponent,
  UpgradePrompt,
  TierBadge,
  FeatureLock,
  UsageMeter,
  FeatureAvailability,
  TierComparison,
  type TierGateProps,
  type UpgradePromptProps,
  type TierBadgeProps,
  type FeatureLockProps,
  type UsageMeterProps,
  type FeatureAvailabilityProps,
  type TierComparisonProps,
} from './components';

// Convenience utilities for common use cases

/**
 * Quick permission check for features implemented in stories 11.1-11.9
 */
export const StoryFeatures = {
  // Story 11.1-11.2: Basic tier features
  basicQuestionnaire: {
    feature: 'questionnaire' as const,
    actions: ['view', 'create', 'edit'] as const
  },
  basicDashboard: {
    feature: 'dashboard' as const,
    actions: ['view', 'widgets'] as const
  },
  basicReports: {
    feature: 'reports' as const,
    actions: ['view', 'create', 'export'] as const
  },

  // Story 11.3-11.5: Professional tier features
  aiAnalysis: {
    feature: 'ai_analysis' as const,
    actions: ['view', 'create', 'edit', 'insights'] as const
  },
  roiCalculator: {
    feature: 'roi_calculator' as const,
    actions: ['view', 'create', 'scenarios', 'forecasting'] as const
  },
  financialTrends: {
    feature: 'financial_trends' as const,
    actions: ['view', 'create', 'analysis', 'forecasting'] as const
  },

  // Story 11.6-11.9: Enterprise tier features
  scenarioModeling: {
    feature: 'scenario_modeling' as const,
    actions: ['view', 'create', 'advanced', 'simulation'] as const
  },
  exitPlanning: {
    feature: 'exit_planning' as const,
    actions: ['view', 'create', 'strategies', 'valuation'] as const
  },
  strategicOptions: {
    feature: 'strategic_options' as const,
    actions: ['view', 'create', 'analysis', 'recommendations'] as const
  },
  admin: {
    feature: 'admin' as const,
    actions: ['view', 'user_management', 'system_settings'] as const
  }
} as const;

/**
 * Tier limits as defined in the stories
 */
export const StoryLimits = {
  basic: {
    evaluations: 2,
    reports: 5,
    aiAnalyses: 0,
    scenarios: 0
  },
  professional: {
    evaluations: 10,
    reports: 25,
    aiAnalyses: 20,
    scenarios: 8
  },
  enterprise: {
    evaluations: -1, // unlimited
    reports: -1,     // unlimited
    aiAnalyses: -1,  // unlimited
    scenarios: -1    // unlimited
  }
} as const;

/**
 * Helper function to check if a story feature is available for a tier
 */
export function checkStoryFeature(
  userTier: UserTier,
  storyFeature: keyof typeof StoryFeatures,
  action: string
): AccessResult {
  const feature = StoryFeatures[storyFeature];
  return checkPermission(userTier, feature.feature, action);
}

/**
 * Helper function to get all available story features for a tier
 */
export function getAvailableStoryFeatures(userTier: UserTier): Array<{
  story: keyof typeof StoryFeatures;
  feature: string;
  actions: readonly string[];
}> {
  return Object.entries(StoryFeatures)
    .filter(([_, featureConfig]) => {
      // Check if any action is available for this feature
      return featureConfig.actions.some(action =>
        checkPermission(userTier, featureConfig.feature, action).allowed
      );
    })
    .map(([storyKey, featureConfig]) => ({
      story: storyKey as keyof typeof StoryFeatures,
      feature: featureConfig.feature,
      actions: featureConfig.actions
    }));
}

/**
 * Helper function to check tier usage limits from stories
 */
export function checkStoryLimits(
  userTier: UserTier,
  limitType: keyof typeof StoryLimits.basic,
  currentUsage: number
): { withinLimit: boolean; limit: number; upgradeRequired?: UserTier } {
  const limits = StoryLimits[userTier];
  const limit = limits[limitType];

  if (limit === -1) {
    return { withinLimit: true, limit: -1 };
  }

  const withinLimit = currentUsage < limit;
  let upgradeRequired: UserTier | undefined;

  if (!withinLimit) {
    if (userTier === 'basic') upgradeRequired = 'professional';
    else if (userTier === 'professional') upgradeRequired = 'enterprise';
  }

  return { withinLimit, limit, upgradeRequired };
}

/**
 * Default export with commonly used functions
 */
const AccessControl = {
  // Core functions
  checkPermission,
  hasTierAccess,
  checkTierLimits,
  trackUsage,

  // Story-specific helpers
  checkStoryFeature,
  getAvailableStoryFeatures,
  checkStoryLimits,

  // Constants
  StoryFeatures,
  StoryLimits,

  // System
  TierAccessControl,
  PERMISSION_MATRIX
};

export default AccessControl;

/**
 * Example usage:
 *
 * ```typescript
 * import AccessControl, {
 *   TierProvider,
 *   TierGateComponent as TierGate,
 *   UpgradePrompt
 * } from '@/lib/access-control';
 *
 * // Check permission
 * const canUseAI = AccessControl.checkPermission('professional', 'ai_analysis', 'create');
 *
 * // Check story feature
 * const canUseROI = AccessControl.checkStoryFeature('professional', 'roiCalculator', 'scenarios');
 *
 * // Component usage
 * <TierProvider>
 *   <TierGate feature="ai_analysis" action="create">
 *     <AIAnalysisComponent />
 *   </TierGate>
 * </TierProvider>
 * ```
 */