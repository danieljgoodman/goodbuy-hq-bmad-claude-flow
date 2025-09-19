'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { tierUpgradeHandler, TierUpgradeEvent } from '@/lib/subscription/tier-upgrade-handler';
import { SubscriptionTier } from '@/types/subscription';
import { toast } from 'sonner';

interface UpgradeState {
  isUpgrading: boolean;
  isLoading: boolean;
  error: string | null;
  currentTier: SubscriptionTier;
  canUpgrade: boolean;
}

interface UseSubscriptionUpgradeReturn extends UpgradeState {
  handleUpgrade: (targetTier: SubscriptionTier) => Promise<void>;
  checkFeatureAccess: (feature: string) => Promise<boolean>;
  clearError: () => void;
  refreshSubscription: () => Promise<void>;
}

export function useSubscriptionUpgrade(): UseSubscriptionUpgradeReturn {
  const { user, isLoaded } = useUser();
  const [state, setState] = useState<UpgradeState>({
    isUpgrading: false,
    isLoading: true,
    error: null,
    currentTier: 'free',
    canUpgrade: true
  });

  // Get current tier from user metadata
  useEffect(() => {
    if (isLoaded && user) {
      const tier = (user.publicMetadata?.subscriptionTier as SubscriptionTier) || 'free';
      setState(prev => ({
        ...prev,
        currentTier: tier,
        isLoading: false
      }));
    }
  }, [isLoaded, user]);

  // Subscribe to tier upgrade events
  useEffect(() => {
    const unsubscribe = tierUpgradeHandler.onTierUpgrade((event: TierUpgradeEvent) => {
      if (user && event.userId === user.id) {
        setState(prev => ({
          ...prev,
          currentTier: event.newTier,
          isUpgrading: false
        }));

        // Force user refresh to get updated metadata
        window.location.reload();
      }
    });

    return unsubscribe;
  }, [user]);

  // Handle session refresh events
  useEffect(() => {
    const handleSessionRefresh = async (event: CustomEvent) => {
      if (user && event.detail.userId === user.id) {
        await refreshSubscription();
      }
    };

    window.addEventListener('user-session-refresh', handleSessionRefresh as EventListener);

    return () => {
      window.removeEventListener('user-session-refresh', handleSessionRefresh as EventListener);
    };
  }, [user]);

  const handleUpgrade = useCallback(async (targetTier: SubscriptionTier): Promise<void> => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return;
    }

    setState(prev => ({ ...prev, isUpgrading: true, error: null }));

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/subscription/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: targetTier,
          userId: user.id,
          returnUrl: window.location.href
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Track upgrade attempt
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'upgrade_attempt', {
          user_id: user.id,
          target_tier: targetTier,
          current_tier: state.currentTier
        });
      }

      // Redirect to Stripe Checkout
      window.location.href = url;

    } catch (error) {
      console.error('Error during upgrade:', error);
      setState(prev => ({
        ...prev,
        isUpgrading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }));

      toast.error('Upgrade Failed', {
        description: error instanceof Error ? error.message : 'Please try again later.'
      });
    }
  }, [user, state.currentTier]);

  const checkFeatureAccess = useCallback(async (feature: string): Promise<boolean> => {
    if (!user) return false;

    try {
      return await tierUpgradeHandler.checkFeatureAccess(user.id, feature);
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }, [user]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refreshSubscription = useCallback(async (): Promise<void> => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Fetch latest subscription data
      const response = await fetch('/api/subscription/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const { tier } = await response.json();
        setState(prev => ({
          ...prev,
          currentTier: tier,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  return {
    ...state,
    handleUpgrade,
    checkFeatureAccess,
    clearError,
    refreshSubscription
  };
}

// Hook for checking if a specific feature is accessible
export function useFeatureAccess(feature: string) {
  const { checkFeatureAccess, currentTier } = useSubscriptionUpgrade();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      setIsChecking(true);
      try {
        const access = await checkFeatureAccess(feature);
        setHasAccess(access);
      } catch (error) {
        console.error('Error checking feature access:', error);
        setHasAccess(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [feature, checkFeatureAccess, currentTier]);

  return { hasAccess, isChecking };
}

// Hook for upgrade recommendations
export function useUpgradeRecommendations() {
  const { user } = useUser();
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!user) return;

      try {
        const recs = await tierUpgradeHandler.getUpgradeRecommendations(user.id);
        setRecommendations(recs);
      } catch (error) {
        console.error('Error loading upgrade recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, [user]);

  return { recommendations, isLoading };
}

// Hook for tracking upgrade events
export function useUpgradeTracking() {
  const { user } = useUser();

  const trackUpgradeEvent = useCallback((
    event: 'upgrade_attempt' | 'upgrade_success' | 'upgrade_cancelled',
    data: Record<string, any>
  ) => {
    if (!user) return;

    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, {
        user_id: user.id,
        ...data
      });
    }

    // Internal tracking
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        userId: user.id,
        properties: data
      })
    }).catch(error => {
      console.error('Error tracking upgrade event:', error);
    });
  }, [user]);

  return { trackUpgradeEvent };
}