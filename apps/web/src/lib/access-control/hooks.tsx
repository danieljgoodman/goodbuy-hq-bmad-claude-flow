/**
 * React Hooks for Tier-Based Access Control
 * Story 11.10: React hooks and components for permission management
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  UserTier,
  TierPermissions,
  checkPermission,
  hasTierAccess,
  checkTierLimits,
  getAvailableFeatures,
  getUpgradeRecommendations,
  UsageContext,
  AccessResult
} from './tier-access-control';

/**
 * User tier context type
 */
export interface TierContextType {
  userTier: UserTier | null;
  isLoading: boolean;
  error: string | null;
  refreshTier: () => Promise<void>;
}

/**
 * Context for user tier information
 */
const TierContext = createContext<TierContextType | undefined>(undefined);

/**
 * Provider component for tier context
 */
export interface TierProviderProps {
  children: ReactNode;
  fallbackTier?: UserTier;
}

export function TierProvider({ children, fallbackTier = 'basic' }: TierProviderProps) {
  const { user, isLoaded } = useUser();
  const [userTier, setUserTier] = useState<UserTier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserTier = async () => {
    if (!user) {
      setUserTier(fallbackTier);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch user tier from your API
      const response = await fetch('/api/user/tier');
      if (!response.ok) {
        throw new Error('Failed to fetch user tier');
      }

      const data = await response.json();
      setUserTier(data.tier || fallbackTier);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUserTier(fallbackTier);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchUserTier();
    }
  }, [user, isLoaded]);

  const refreshTier = async () => {
    await fetchUserTier();
  };

  return (
    <TierContext.Provider value={{
      userTier,
      isLoading,
      error,
      refreshTier
    }}>
      {children}
    </TierContext.Provider>
  );
}

/**
 * Hook to get user tier context
 */
export function useTier(): TierContextType {
  const context = useContext(TierContext);
  if (context === undefined) {
    throw new Error('useTier must be used within a TierProvider');
  }
  return context;
}

/**
 * Hook for checking feature permissions
 */
export interface UseFeatureAccessOptions {
  feature: keyof TierPermissions['features'];
  action: string;
  context?: Partial<UsageContext>;
}

export interface UseFeatureAccessResult extends AccessResult {
  isLoading: boolean;
  error?: string;
}

export function useFeatureAccess({
  feature,
  action,
  context
}: UseFeatureAccessOptions): UseFeatureAccessResult {
  const { userTier, isLoading: tierLoading } = useTier();
  const { user } = useUser();
  const [result, setResult] = useState<UseFeatureAccessResult>({
    allowed: false,
    permission: 'none',
    isLoading: true
  });

  useEffect(() => {
    if (tierLoading || !userTier) {
      setResult(prev => ({ ...prev, isLoading: true }));
      return;
    }

    try {
      const fullContext: UsageContext = {
        userId: user?.id || '',
        feature,
        action,
        timestamp: new Date(),
        ...context
      };

      const accessResult = checkPermission(userTier, feature, action, fullContext);

      setResult({
        ...accessResult,
        isLoading: false
      });
    } catch (error) {
      setResult({
        allowed: false,
        permission: 'none',
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [userTier, tierLoading, feature, action, context, user?.id]);

  return result;
}

/**
 * Hook for checking tier access
 */
export function useTierAccess(requiredTier: UserTier): {
  hasAccess: boolean;
  isLoading: boolean;
  currentTier: UserTier | null;
  upgradeRequired: boolean;
} {
  const { userTier, isLoading } = useTier();

  return {
    hasAccess: userTier ? hasTierAccess(userTier, requiredTier) : false,
    isLoading,
    currentTier: userTier,
    upgradeRequired: userTier ? !hasTierAccess(userTier, requiredTier) : true
  };
}

/**
 * Hook for checking tier limits
 */
export function useTierLimits(
  limitType: keyof TierPermissions['limits'],
  currentValue: number
): {
  withinLimit: boolean;
  limit: number;
  isLoading: boolean;
  upgradeRequired?: UserTier;
} {
  const { userTier, isLoading } = useTier();
  const [result, setResult] = useState({
    withinLimit: false,
    limit: 0,
    isLoading: true,
    upgradeRequired: undefined as UserTier | undefined
  });

  useEffect(() => {
    if (isLoading || !userTier) {
      setResult(prev => ({ ...prev, isLoading: true }));
      return;
    }

    const limitResult = checkTierLimits(userTier, limitType, currentValue);

    setResult({
      withinLimit: limitResult.allowed,
      limit: limitResult.allowed ? -1 : currentValue, // Simplified limit display
      isLoading: false,
      upgradeRequired: limitResult.upgradeRequired
    });
  }, [userTier, isLoading, limitType, currentValue]);

  return result;
}

/**
 * Hook for getting available features
 */
export function useAvailableFeatures(): {
  features: string[];
  isLoading: boolean;
} {
  const { userTier, isLoading } = useTier();

  return {
    features: userTier ? getAvailableFeatures(userTier) : [],
    isLoading
  };
}

/**
 * Hook for upgrade recommendations
 */
export function useUpgradeRecommendations(
  feature: keyof TierPermissions['features'],
  action: string
): {
  recommendation: { tier: UserTier; benefits: string[] } | null;
  isLoading: boolean;
} {
  const { userTier, isLoading } = useTier();

  return {
    recommendation: userTier ? getUpgradeRecommendations(userTier, feature, action) : null,
    isLoading
  };
}

/**
 * Hook for usage tracking
 */
export function useUsageTracking() {
  const { userTier } = useTier();
  const { user } = useUser();

  const trackFeatureUsage = React.useCallback((
    feature: keyof TierPermissions['features'],
    action: string,
    metadata?: Record<string, any>
  ) => {
    if (!userTier || !user?.id) return;

    // Track usage via API call
    fetch('/api/usage/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        feature,
        action,
        timestamp: new Date().toISOString(),
        metadata
      })
    }).catch(error => {
      console.error('Failed to track usage:', error);
    });
  }, [userTier, user?.id]);

  return { trackFeatureUsage };
}

/**
 * Hook for real-time permission checking with automatic refresh
 */
export function useRealtimePermissions(
  feature: keyof TierPermissions['features'],
  action: string,
  refreshInterval = 30000 // 30 seconds
): UseFeatureAccessResult {
  const baseResult = useFeatureAccess({ feature, action });
  const { refreshTier } = useTier();

  useEffect(() => {
    const interval = setInterval(() => {
      refreshTier();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshTier, refreshInterval]);

  return baseResult;
}

/**
 * Hook for batch permission checking
 */
export function useBatchPermissions(
  permissions: Array<{ feature: keyof TierPermissions['features']; action: string }>
): {
  results: Record<string, AccessResult>;
  isLoading: boolean;
  allAllowed: boolean;
} {
  const { userTier, isLoading } = useTier();
  const { user } = useUser();
  const [results, setResults] = useState<Record<string, AccessResult>>({});

  useEffect(() => {
    if (isLoading || !userTier) return;

    const batchResults: Record<string, AccessResult> = {};

    permissions.forEach(({ feature, action }) => {
      const key = `${feature}:${action}`;
      const context: UsageContext = {
        userId: user?.id || '',
        feature,
        action,
        timestamp: new Date()
      };

      batchResults[key] = checkPermission(userTier, feature, action, context);
    });

    setResults(batchResults);
  }, [userTier, isLoading, permissions, user?.id]);

  const allAllowed = Object.values(results).every(result => result.allowed);

  return {
    results,
    isLoading,
    allAllowed
  };
}

/**
 * Hook for subscription management integration
 */
export function useSubscriptionIntegration() {
  const { userTier, refreshTier } = useTier();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const upgradeToTier = async (targetTier: UserTier) => {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetTier })
      });

      if (!response.ok) {
        throw new Error('Upgrade failed');
      }

      const data = await response.json();

      // If payment is required, redirect to Stripe
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      // Refresh tier information
      await refreshTier();

    } catch (error) {
      console.error('Upgrade error:', error);
      throw error;
    } finally {
      setIsUpgrading(false);
    }
  };

  const downgradeToTier = async (targetTier: UserTier) => {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/subscription/downgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetTier })
      });

      if (!response.ok) {
        throw new Error('Downgrade failed');
      }

      await refreshTier();

    } catch (error) {
      console.error('Downgrade error:', error);
      throw error;
    } finally {
      setIsUpgrading(false);
    }
  };

  return {
    currentTier: userTier,
    upgradeToTier,
    downgradeToTier,
    isUpgrading
  };
}

/**
 * Hook for feature analytics and usage insights
 */
export function useFeatureAnalytics() {
  const { userTier } = useTier();
  const { user } = useUser();
  const [analytics, setAnalytics] = useState<{
    usage: Record<string, number>;
    limits: Record<string, number>;
    recommendations: string[];
  }>({
    usage: {},
    limits: {},
    recommendations: []
  });

  useEffect(() => {
    if (!userTier || !user?.id) return;

    fetch('/api/analytics/usage')
      .then(response => response.json())
      .then(data => setAnalytics(data))
      .catch(error => console.error('Failed to fetch analytics:', error));
  }, [userTier, user?.id]);

  return analytics;
}

/**
 * Export all hooks and types
 */
export {
  TierContext,
  type TierContextType,
  type UseFeatureAccessOptions,
  type UseFeatureAccessResult
};