import { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  UserTier,
  TierPermissions,
  AccessResult,
  UsageContext,
  tierAccessControl,
  checkPermission,
  getPermissionsForTier,
  checkTierLimits,
  trackUsage,
  getAvailableFeatures,
  getUpgradeRecommendations
} from '@/lib/access-control/tier-access-control';

export interface TierAccessHookResult {
  userTier: UserTier;
  hasAccess: (feature: keyof TierPermissions['features'], action: string) => boolean;
  checkFeatureAccess: (feature: keyof TierPermissions['features'], action: string, context?: UsageContext) => AccessResult;
  getPermissions: () => TierPermissions;
  isLoading: boolean;
  error: string | null;
}

export interface PermissionCheck {
  feature: keyof TierPermissions['features'];
  action: string;
  context?: UsageContext;
}

export interface BulkPermissionResult {
  [key: string]: AccessResult;
}

export interface UpgradeRecommendation {
  tier: UserTier;
  benefits: string[];
  feature: keyof TierPermissions['features'];
  action: string;
  currentTier: UserTier;
}

/**
 * Enhanced hook for checking tier-based access control
 * Provides comprehensive permission checking with real-time updates
 */
export function useTierAccess(): TierAccessHookResult {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user tier from Clerk metadata with fallback
  const userTier = useMemo((): UserTier => {
    if (!isLoaded || !user) return 'basic';
    
    const tierFromMetadata = user.publicMetadata?.tier as UserTier;
    if (tierFromMetadata && ['basic', 'professional', 'enterprise'].includes(tierFromMetadata)) {
      return tierFromMetadata;
    }
    
    return 'basic';
  }, [user, isLoaded]);

  // Update loading state
  useEffect(() => {
    setIsLoading(!isLoaded);
  }, [isLoaded]);

  // Memoized permission checking function
  const hasAccess = useCallback(
    (feature: keyof TierPermissions['features'], action: string): boolean => {
      try {
        const result = tierAccessControl.checkPermission(userTier, feature, action);
        return result.allowed;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Permission check failed');
        return false;
      }
    },
    [userTier]
  );

  // Comprehensive access checking with context
  const checkFeatureAccess = useCallback(
    (feature: keyof TierPermissions['features'], action: string, context?: UsageContext): AccessResult => {
      try {
        return tierAccessControl.checkPermission(userTier, feature, action, context);
      } catch (err) {
        const errorResult: AccessResult = {
          allowed: false,
          permission: 'none',
          reason: err instanceof Error ? err.message : 'Permission check failed'
        };
        setError(errorResult.reason);
        return errorResult;
      }
    },
    [userTier]
  );

  // Get all permissions for current tier
  const getPermissions = useCallback((): TierPermissions => {
    try {
      return getPermissionsForTier(userTier);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get permissions');
      return getPermissionsForTier('basic'); // Fallback to basic
    }
  }, [userTier]);

  return {
    userTier,
    hasAccess,
    checkFeatureAccess,
    getPermissions,
    isLoading,
    error
  };
}

/**
 * Hook for bulk permission checking
 * Efficiently checks multiple permissions at once
 */
export function usePermissions(checks: PermissionCheck[]): {
  results: BulkPermissionResult;
  isLoading: boolean;
  error: string | null;
  hasAnyAccess: boolean;
  hasAllAccess: boolean;
} {
  const { userTier, isLoading, error } = useTierAccess();
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const results = useMemo((): BulkPermissionResult => {
    if (isLoading) return {};

    const permissionResults: BulkPermissionResult = {};

    checks.forEach((check, index) => {
      const key = `${String(check.feature)}.${check.action}`;
      try {
        permissionResults[key] = tierAccessControl.checkPermission(
          userTier,
          check.feature,
          check.action,
          check.context
        );
      } catch (err) {
        setPermissionError(err instanceof Error ? err.message : 'Bulk permission check failed');
        permissionResults[key] = {
          allowed: false,
          permission: 'none',
          reason: 'Permission check failed'
        };
      }
    });

    return permissionResults;
  }, [checks, userTier, isLoading]);

  const hasAnyAccess = useMemo(
    () => Object.values(results).some(result => result.allowed),
    [results]
  );

  const hasAllAccess = useMemo(
    () => Object.values(results).every(result => result.allowed),
    [results]
  );

  return {
    results,
    isLoading,
    error: error || permissionError,
    hasAnyAccess,
    hasAllAccess
  };
}

/**
 * Hook for upgrade recommendations
 * Provides smart upgrade suggestions based on feature access patterns
 */
export function useUpgradeRecommendation(
  feature?: keyof TierPermissions['features'],
  action?: string
): {
  recommendation: UpgradeRecommendation | null;
  needsUpgrade: boolean;
  isLoading: boolean;
  error: string | null;
} {
  const { userTier, isLoading, error } = useTierAccess();
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const recommendation = useMemo((): UpgradeRecommendation | null => {
    if (isLoading || !feature || !action) return null;

    try {
      const upgradeRec = getUpgradeRecommendations(userTier, feature, action);
      
      if (!upgradeRec) return null;

      return {
        ...upgradeRec,
        feature,
        action,
        currentTier: userTier
      };
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : 'Failed to get upgrade recommendation');
      return null;
    }
  }, [userTier, feature, action, isLoading]);

  const needsUpgrade = useMemo(() => {
    if (!feature || !action || isLoading) return false;
    
    try {
      const result = tierAccessControl.checkPermission(userTier, feature, action);
      return !result.allowed && result.upgradeRequired !== undefined;
    } catch {
      return false;
    }
  }, [userTier, feature, action, isLoading]);

  return {
    recommendation,
    needsUpgrade,
    isLoading,
    error: error || upgradeError
  };
}

/**
 * Hook for real-time subscription change detection
 * Monitors user tier changes and provides subscription status
 */
export function useSubscriptionStatus(): {
  userTier: UserTier;
  previousTier: UserTier | null;
  hasUpgraded: boolean;
  hasDowngraded: boolean;
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
} {
  const { user, isLoaded } = useUser();
  const [previousTier, setPreviousTier] = useState<UserTier | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userTier = useMemo((): UserTier => {
    if (!isLoaded || !user) return 'basic';
    
    const tierFromMetadata = user.publicMetadata?.tier as UserTier;
    if (tierFromMetadata && ['basic', 'professional', 'enterprise'].includes(tierFromMetadata)) {
      return tierFromMetadata;
    }
    
    return 'basic';
  }, [user, isLoaded]);

  // Track tier changes
  useEffect(() => {
    if (isLoaded && userTier && userTier !== previousTier) {
      if (previousTier !== null) {
        setLastUpdated(new Date());
      }
      setPreviousTier(userTier);
    }
  }, [userTier, previousTier, isLoaded]);

  // Real-time subscription monitoring via Clerk webhooks
  useEffect(() => {
    if (!isLoaded || !user) return;

    // Listen for user updates (in a real implementation, this would use
    // Clerk's real-time updates or WebSocket connections)
    const handleUserUpdate = () => {
      try {
        user.reload(); // Refresh user data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update user data');
      }
    };

    // Set up periodic checks for subscription changes
    const interval = setInterval(handleUserUpdate, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user, isLoaded]);

  const tierHierarchy: Record<UserTier, number> = {
    basic: 1,
    professional: 2,
    enterprise: 3
  };

  const hasUpgraded = useMemo(() => {
    if (!previousTier || previousTier === userTier) return false;
    return tierHierarchy[userTier] > tierHierarchy[previousTier];
  }, [userTier, previousTier]);

  const hasDowngraded = useMemo(() => {
    if (!previousTier || previousTier === userTier) return false;
    return tierHierarchy[userTier] < tierHierarchy[previousTier];
  }, [userTier, previousTier]);

  return {
    userTier,
    previousTier,
    hasUpgraded,
    hasDowngraded,
    isLoading: !isLoaded,
    lastUpdated,
    error
  };
}

/**
 * Hook for usage tracking and limits
 * Provides usage monitoring and limit checking functionality
 */
export function useUsageTracking(
  feature: keyof TierPermissions['features'],
  action: string
): {
  currentUsage: number;
  usageLimit: number | null;
  usagePercentage: number;
  canUse: boolean;
  isAtLimit: boolean;
  timeRestriction: string | null;
  trackAction: () => void;
  resetUsage: () => void;
  isLoading: boolean;
  error: string | null;
} {
  const { user } = useUser();
  const { userTier, isLoading } = useTierAccess();
  const [currentUsage, setCurrentUsage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id || 'anonymous';

  // Get usage limit information
  const { usageLimit, timeRestriction } = useMemo(() => {
    try {
      const permission = tierAccessControl.checkPermission(userTier, feature, action);
      
      if (typeof permission.permission === 'string' || !permission.conditions) {
        return { usageLimit: null, timeRestriction: null };
      }

      const usageLimitCondition = permission.conditions.find(c => c.type === 'usage_limit');
      const timeRestrictionCondition = permission.conditions.find(c => c.type === 'time_restriction');

      return {
        usageLimit: usageLimitCondition?.value || null,
        timeRestriction: timeRestrictionCondition?.value || null
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get usage limits');
      return { usageLimit: null, timeRestriction: null };
    }
  }, [userTier, feature, action]);

  // Get current usage
  useEffect(() => {
    if (isLoading || !userId) return;

    try {
      const usage = tierAccessControl.getCurrentUsage(
        userId,
        feature,
        action,
        timeRestriction as 'daily' | 'weekly' | 'monthly' | undefined
      );
      setCurrentUsage(usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get current usage');
    }
  }, [userId, feature, action, timeRestriction, isLoading]);

  const usagePercentage = useMemo(() => {
    if (!usageLimit || usageLimit <= 0) return 0;
    return Math.min((currentUsage / usageLimit) * 100, 100);
  }, [currentUsage, usageLimit]);

  const canUse = useMemo(() => {
    if (!usageLimit) return true; // No limit means unlimited
    return currentUsage < usageLimit;
  }, [currentUsage, usageLimit]);

  const isAtLimit = useMemo(() => {
    if (!usageLimit) return false;
    return currentUsage >= usageLimit;
  }, [currentUsage, usageLimit]);

  const trackAction = useCallback(() => {
    if (!userId) return;

    try {
      const context: UsageContext = {
        userId,
        feature,
        action,
        currentUsage,
        timestamp: new Date()
      };

      trackUsage(context);
      setCurrentUsage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track usage');
    }
  }, [userId, feature, action, currentUsage]);

  const resetUsage = useCallback(() => {
    if (!userId) return;

    try {
      tierAccessControl.resetUsage(
        userId,
        feature,
        action,
        timeRestriction as 'daily' | 'weekly' | 'monthly' | undefined
      );
      setCurrentUsage(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset usage');
    }
  }, [userId, feature, action, timeRestriction]);

  return {
    currentUsage,
    usageLimit,
    usagePercentage,
    canUse,
    isAtLimit,
    timeRestriction,
    trackAction,
    resetUsage,
    isLoading,
    error
  };
}

/**
 * Hook for checking tier limits (storage, users, etc.)
 */
export function useTierLimits(): {
  limits: TierPermissions['limits'];
  checkLimit: (limitType: keyof TierPermissions['limits'], currentValue: number) => AccessResult;
  isWithinLimit: (limitType: keyof TierPermissions['limits'], currentValue: number) => boolean;
  getUsagePercentage: (limitType: keyof TierPermissions['limits'], currentValue: number) => number;
  isLoading: boolean;
  error: string | null;
} {
  const { userTier, isLoading, error } = useTierAccess();

  const limits = useMemo(() => {
    try {
      return getPermissionsForTier(userTier).limits;
    } catch {
      return getPermissionsForTier('basic').limits; // Fallback
    }
  }, [userTier]);

  const checkLimit = useCallback(
    (limitType: keyof TierPermissions['limits'], currentValue: number): AccessResult => {
      try {
        return checkTierLimits(userTier, limitType, currentValue);
      } catch (err) {
        return {
          allowed: false,
          permission: 'none',
          reason: err instanceof Error ? err.message : 'Limit check failed'
        };
      }
    },
    [userTier]
  );

  const isWithinLimit = useCallback(
    (limitType: keyof TierPermissions['limits'], currentValue: number): boolean => {
      const limit = limits[limitType];
      if (limit === -1) return true; // Unlimited
      return currentValue < limit;
    },
    [limits]
  );

  const getUsagePercentage = useCallback(
    (limitType: keyof TierPermissions['limits'], currentValue: number): number => {
      const limit = limits[limitType];
      if (limit === -1) return 0; // Unlimited
      if (limit === 0) return 100; // No access
      return Math.min((currentValue / limit) * 100, 100);
    },
    [limits]
  );

  return {
    limits,
    checkLimit,
    isWithinLimit,
    getUsagePercentage,
    isLoading,
    error
  };
}

export default useTierAccess;