import { SubscriptionTier } from '@/types/subscription';
// Permission cache invalidation - to be implemented
const invalidatePermissionCache = async (userId: string) => {
  // TODO: Implement cache invalidation
  console.log('Invalidating permission cache for user:', userId);
};
import { toast } from 'sonner';

export interface TierUpgradeEvent {
  userId: string;
  oldTier: SubscriptionTier;
  newTier: SubscriptionTier;
  timestamp: Date;
  stripeEventId?: string;
}

export interface FeatureUnlockEvent {
  features: string[];
  tier: SubscriptionTier;
  celebrationData: {
    title: string;
    description: string;
    features: Array<{
      name: string;
      description: string;
      icon: string;
    }>;
  };
}

export class TierUpgradeHandler {
  private static instance: TierUpgradeHandler;
  private subscribers: Array<(event: TierUpgradeEvent) => void> = [];
  private featureUnlockSubscribers: Array<(event: FeatureUnlockEvent) => void> = [];

  static getInstance(): TierUpgradeHandler {
    if (!TierUpgradeHandler.instance) {
      TierUpgradeHandler.instance = new TierUpgradeHandler();
    }
    return TierUpgradeHandler.instance;
  }

  /**
   * Subscribe to tier upgrade events
   */
  onTierUpgrade(callback: (event: TierUpgradeEvent) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Subscribe to feature unlock events
   */
  onFeatureUnlock(callback: (event: FeatureUnlockEvent) => void): () => void {
    this.featureUnlockSubscribers.push(callback);
    return () => {
      this.featureUnlockSubscribers = this.featureUnlockSubscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Handle subscription upgrade from webhook or client
   */
  async handleTierUpgrade(event: TierUpgradeEvent): Promise<void> {
    try {
      console.log('Processing tier upgrade:', event);

      // Invalidate permission cache
      await invalidatePermissionCache(event.userId);

      // Refresh user session if needed
      await this.refreshUserSession(event.userId);

      // Determine newly unlocked features
      const unlockedFeatures = this.getUnlockedFeatures(event.oldTier, event.newTier);

      // Trigger celebration if features were unlocked
      if (unlockedFeatures.length > 0) {
        const celebrationData = this.createCelebrationData(event.newTier, unlockedFeatures);

        // Notify feature unlock subscribers
        this.featureUnlockSubscribers.forEach(callback => {
          callback({
            features: unlockedFeatures,
            tier: event.newTier,
            celebrationData
          });
        });

        // Show celebration toast
        toast.success(celebrationData.title, {
          description: celebrationData.description,
          duration: 8000,
          action: {
            label: 'Explore Features',
            onClick: () => this.showFeatureOnboarding(unlockedFeatures)
          }
        });
      }

      // Notify tier upgrade subscribers
      this.subscribers.forEach(callback => callback(event));

      // Track analytics
      await this.trackUpgradeEvent(event);

    } catch (error) {
      console.error('Error handling tier upgrade:', error);
      toast.error('Failed to process upgrade', {
        description: 'Please refresh the page to see your new features.'
      });
    }
  }

  /**
   * Get features unlocked by tier upgrade
   */
  private getUnlockedFeatures(oldTier: SubscriptionTier, newTier: SubscriptionTier): string[] {
    const tierFeatures: Record<SubscriptionTier, string[]> = {
      free: [],
      professional: [
        'advanced-analytics',
        'custom-benchmarks',
        'api-access',
        'priority-support'
      ],
      enterprise: [
        'advanced-analytics',
        'custom-benchmarks',
        'api-access',
        'priority-support',
        'white-label',
        'custom-integrations',
        'dedicated-manager',
        'sla-guarantee'
      ]
    };

    const oldFeatures = tierFeatures[oldTier] || [];
    const newFeatures = tierFeatures[newTier] || [];

    return newFeatures.filter(feature => !oldFeatures.includes(feature));
  }

  /**
   * Create celebration data for newly unlocked features
   */
  private createCelebrationData(tier: SubscriptionTier, features: string[]): any {
    const featureDescriptions: Record<string, { name: string; description: string; icon: string }> = {
      'advanced-analytics': {
        name: 'Advanced Analytics',
        description: 'Deep insights with custom metrics and trend analysis',
        icon: '📊'
      },
      'custom-benchmarks': {
        name: 'Custom Benchmarks',
        description: 'Create and track your own performance benchmarks',
        icon: '🎯'
      },
      'api-access': {
        name: 'API Access',
        description: 'Integrate GoodBuy data into your own systems',
        icon: '🔌'
      },
      'priority-support': {
        name: 'Priority Support',
        description: '24/7 priority customer support with faster response times',
        icon: '🚀'
      },
      'white-label': {
        name: 'White Label',
        description: 'Brand the platform with your company identity',
        icon: '🏷️'
      },
      'custom-integrations': {
        name: 'Custom Integrations',
        description: 'Build custom integrations with your existing tools',
        icon: '🔗'
      },
      'dedicated-manager': {
        name: 'Dedicated Manager',
        description: 'Personal account manager for your success',
        icon: '👨‍💼'
      },
      'sla-guarantee': {
        name: 'SLA Guarantee',
        description: '99.9% uptime guarantee with service level agreement',
        icon: '✅'
      }
    };

    const tierTitles = {
      professional: 'Welcome to Professional! 🚀',
      enterprise: 'Welcome to Enterprise! 🏆'
    };

    return {
      title: tierTitles[tier] || 'Upgrade Complete!',
      description: `You now have access to ${features.length} new features!`,
      features: features.map(feature => featureDescriptions[feature]).filter(Boolean)
    };
  }

  /**
   * Refresh user session to pick up new permissions
   */
  private async refreshUserSession(userId: string): Promise<void> {
    try {
      // Force session refresh on client side
      if (typeof window !== 'undefined') {
        // Trigger a soft refresh of user data
        window.dispatchEvent(new CustomEvent('user-session-refresh', {
          detail: { userId }
        }));
      }
    } catch (error) {
      console.error('Error refreshing user session:', error);
    }
  }

  /**
   * Show feature onboarding for newly unlocked features
   */
  private showFeatureOnboarding(features: string[]): void {
    // Dispatch event for onboarding component to pick up
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('show-feature-onboarding', {
        detail: { features }
      }));
    }
  }

  /**
   * Track upgrade event for analytics
   */
  private async trackUpgradeEvent(event: TierUpgradeEvent): Promise<void> {
    try {
      // Track with analytics service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'tier_upgrade', {
          user_id: event.userId,
          old_tier: event.oldTier,
          new_tier: event.newTier,
          upgrade_timestamp: event.timestamp.toISOString()
        });
      }

      // Also track internally
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'tier_upgrade',
          userId: event.userId,
          properties: {
            oldTier: event.oldTier,
            newTier: event.newTier,
            stripeEventId: event.stripeEventId
          }
        })
      });
    } catch (error) {
      console.error('Error tracking upgrade event:', error);
    }
  }

  /**
   * Handle downgrade scenarios
   */
  async handleTierDowngrade(event: TierUpgradeEvent): Promise<void> {
    try {
      console.log('Processing tier downgrade:', event);

      // Invalidate permission cache
      await invalidatePermissionCache(event.userId);

      // Show graceful downgrade message
      toast.info('Subscription Updated', {
        description: 'Some features are no longer available with your current plan.',
        duration: 6000,
        action: {
          label: 'View Plans',
          onClick: () => window.open('/pricing', '_blank')
        }
      });

      // Notify subscribers
      this.subscribers.forEach(callback => callback(event));

    } catch (error) {
      console.error('Error handling tier downgrade:', error);
    }
  }

  /**
   * Check if user has access to specific feature
   */
  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/access-control/check-feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, feature })
      });

      const { hasAccess } = await response.json();
      return hasAccess;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Get upgrade recommendations based on usage patterns
   */
  async getUpgradeRecommendations(userId: string): Promise<{
    recommended: SubscriptionTier;
    reasons: string[];
    savings?: number;
  }> {
    try {
      const response = await fetch(`/api/subscription/upgrade-recommendations?userId=${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting upgrade recommendations:', error);
      return { recommended: 'professional', reasons: [] };
    }
  }
}

// Export singleton instance
export const tierUpgradeHandler = TierUpgradeHandler.getInstance();

// Utility function for webhook handlers
export async function processTierUpgradeFromWebhook(
  userId: string,
  oldTier: SubscriptionTier,
  newTier: SubscriptionTier,
  stripeEventId?: string
): Promise<void> {
  const event: TierUpgradeEvent = {
    userId,
    oldTier,
    newTier,
    timestamp: new Date(),
    stripeEventId
  };

  if (oldTier === newTier) return;

  if (getTierLevel(newTier) > getTierLevel(oldTier)) {
    await tierUpgradeHandler.handleTierUpgrade(event);
  } else {
    await tierUpgradeHandler.handleTierDowngrade(event);
  }
}

// Helper function to compare tier levels
function getTierLevel(tier: SubscriptionTier): number {
  const levels = { free: 0, professional: 1, enterprise: 2 };
  return levels[tier] || 0;
}