// Export all upgrade-related components for easy importing
export { AccessDeniedPage } from './AccessDeniedPage';
export { FeatureDiscovery } from './FeatureDiscovery';
export { FeatureCelebration, CelebrationTrigger } from './FeatureCelebration';
export { GracefulDenial } from './GracefulDenial';

// Export utility functions
export { useSubscriptionUpgrade, useFeatureAccess, useUpgradeRecommendations, useUpgradeTracking } from '../../hooks/useSubscriptionUpgrade';

// Export tier upgrade handler
export { tierUpgradeHandler, processTierUpgradeFromWebhook } from '../../lib/subscription/tier-upgrade-handler';
export type { TierUpgradeEvent, FeatureUnlockEvent } from '../../lib/subscription/tier-upgrade-handler';