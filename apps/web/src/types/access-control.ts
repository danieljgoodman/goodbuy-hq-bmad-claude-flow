import {
  UserTier,
  Permission,
  AccessResult,
  UsageContext,
  TierPermissions
} from '@/lib/access-control/tier-access-control';

/**
 * Client-side access control types
 */
export interface AccessControlContextValue {
  userTier: UserTier;
  hasAccess: (feature: keyof TierPermissions['features'], action: string) => boolean;
  checkFeatureAccess: (feature: keyof TierPermissions['features'], action: string, context?: UsageContext) => AccessResult;
  getPermissions: () => TierPermissions;
  isLoading: boolean;
  error: string | null;
}

export interface TierProtectionConfig {
  feature: keyof TierPermissions['features'];
  action: string;
  context?: UsageContext;
  fallback?: React.ReactNode;
  requiredTier?: UserTier;
  showUpgradePrompt?: boolean;
  customAccessDeniedMessage?: string;
  onAccessDenied?: (result: AccessResult) => void;
  onUpgradeClick?: () => void;
}

export interface UpgradeRecommendationData {
  tier: UserTier;
  benefits: string[];
  feature: keyof TierPermissions['features'];
  action: string;
  currentTier: UserTier;
  pricing?: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  estimatedSavings?: {
    timePerMonth: number;
    productivityGain: number;
    costReduction: number;
  };
}

export interface AccessControlHookOptions {
  enableRealTimeUpdates?: boolean;
  cacheTimeout?: number;
  retryAttempts?: number;
  fallbackTier?: UserTier;
}

export interface BulkPermissionCheck {
  feature: keyof TierPermissions['features'];
  action: string;
  context?: UsageContext;
  id?: string;
}

export interface BulkPermissionResult {
  [key: string]: AccessResult;
}

export interface UsageTrackingData {
  feature: keyof TierPermissions['features'];
  action: string;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

export interface TierLimitStatus {
  limitType: keyof TierPermissions['limits'];
  currentValue: number;
  limit: number;
  percentage: number;
  isAtLimit: boolean;
  isNearLimit: boolean;
  canUpgrade: boolean;
  nextTierLimit?: number;
}

export interface SubscriptionChangeEvent {
  userId: string;
  previousTier: UserTier;
  newTier: UserTier;
  timestamp: Date;
  reason: 'upgrade' | 'downgrade' | 'renewal' | 'cancellation';
  effectiveDate: Date;
}

export interface AccessControlMetrics {
  totalChecks: number;
  deniedAccess: number;
  upgradePrompts: number;
  successfulUpgrades: number;
  mostDeniedFeatures: Array<{
    feature: keyof TierPermissions['features'];
    action: string;
    count: number;
  }>;
  conversionRate: number;
  averageTimeToUpgrade: number;
}

/**
 * Component prop types
 */
export interface TierBadgeProps {
  tier: UserTier;
  variant?: 'default' | 'compact' | 'detailed';
  showUpgradeButton?: boolean;
  onUpgradeClick?: () => void;
  className?: string;
}

export interface FeatureGateProps {
  feature: keyof TierPermissions['features'];
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  showUpgradePrompt?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  hideOnNoAccess?: boolean;
  context?: UsageContext;
}

export interface UsageMeterProps {
  feature: keyof TierPermissions['features'];
  action: string;
  variant?: 'default' | 'compact' | 'circular';
  showLabels?: boolean;
  warningThreshold?: number;
  dangerThreshold?: number;
  className?: string;
}

export interface TierComparisonProps {
  currentTier: UserTier;
  highlightTier?: UserTier;
  onTierSelect?: (tier: UserTier) => void;
  showPricing?: boolean;
  showFeatures?: boolean;
  variant?: 'table' | 'cards' | 'compact';
  className?: string;
}

/**
 * Error types
 */
export class AccessControlError extends Error {
  constructor(
    message: string,
    public code: string,
    public feature?: keyof TierPermissions['features'],
    public action?: string,
    public userTier?: UserTier
  ) {
    super(message);
    this.name = 'AccessControlError';
  }
}

export class TierValidationError extends Error {
  constructor(
    message: string,
    public invalidTier: string,
    public validTiers: UserTier[]
  ) {
    super(message);
    this.name = 'TierValidationError';
  }
}

export class UsageLimitError extends Error {
  constructor(
    message: string,
    public feature: keyof TierPermissions['features'],
    public action: string,
    public currentUsage: number,
    public limit: number
  ) {
    super(message);
    this.name = 'UsageLimitError';
  }
}

/**
 * Utility types
 */
export type AccessControlEventType = 
  | 'access_granted'
  | 'access_denied'
  | 'upgrade_prompt_shown'
  | 'upgrade_initiated'
  | 'upgrade_completed'
  | 'usage_tracked'
  | 'limit_reached'
  | 'tier_changed';

export interface AccessControlEvent {
  type: AccessControlEventType;
  timestamp: Date;
  userId: string;
  userTier: UserTier;
  feature?: keyof TierPermissions['features'];
  action?: string;
  metadata?: Record<string, any>;
}

export type TierChangeDirection = 'upgrade' | 'downgrade' | 'same';

export interface TierChangeAnalysis {
  direction: TierChangeDirection;
  previousTier: UserTier;
  newTier: UserTier;
  newFeatures: string[];
  lostFeatures: string[];
  limitChanges: Record<keyof TierPermissions['limits'], {
    previous: number;
    new: number;
    change: number;
  }>;
  estimatedImpact: {
    positiveChanges: string[];
    negativeChanges: string[];
    recommendations: string[];
  };
}

/**
 * Storage and persistence types
 */
export interface AccessControlCache {
  userId: string;
  userTier: UserTier;
  permissions: TierPermissions;
  usageData: Record<string, number>;
  lastUpdated: Date;
  expiresAt: Date;
}

export interface AccessControlStorage {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any, ttl?: number) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

/**
 * Re-export core types
 */
export {
  UserTier,
  Permission,
  AccessResult,
  UsageContext,
  TierPermissions
} from '@/lib/access-control/tier-access-control';

export default {
  AccessControlError,
  TierValidationError,
  UsageLimitError
};