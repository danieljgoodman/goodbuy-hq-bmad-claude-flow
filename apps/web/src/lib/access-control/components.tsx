/**
 * React Components for Tier-Based Access Control UI
 * Story 11.10: Reusable components for permission-based rendering and upgrade prompts
 */

'use client';

import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Lock, Crown, Zap, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
import {
  UserTier,
  TierPermissions
} from './tier-access-control';
import {
  useTier,
  useFeatureAccess,
  useTierAccess,
  useTierLimits,
  useUpgradeRecommendations,
  useSubscriptionIntegration
} from './hooks';

/**
 * Component props interfaces
 */
export interface TierGateProps {
  requiredTier?: UserTier;
  feature?: keyof TierPermissions['features'];
  action?: string;
  fallback?: ReactNode;
  upgradePrompt?: ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
  children: ReactNode;
}

export interface UpgradePromptProps {
  feature?: keyof TierPermissions['features'];
  action?: string;
  requiredTier?: UserTier;
  variant?: 'card' | 'banner' | 'modal' | 'inline';
  title?: string;
  description?: string;
  benefits?: string[];
  onUpgrade?: () => void;
  className?: string;
}

export interface TierBadgeProps {
  tier: UserTier;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  showIcon?: boolean;
  className?: string;
}

export interface FeatureLockProps {
  feature: keyof TierPermissions['features'];
  action: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

export interface UsageMeterProps {
  limitType: keyof TierPermissions['limits'];
  currentUsage: number;
  label?: string;
  showUpgrade?: boolean;
  className?: string;
}

/**
 * Main gate component for conditional rendering based on permissions
 */
export function TierGate({
  requiredTier,
  feature,
  action,
  fallback,
  upgradePrompt,
  showUpgradePrompt = true,
  className,
  children
}: TierGateProps) {
  const { userTier, isLoading } = useTier();
  const tierAccess = useTierAccess(requiredTier || 'basic');
  const featureAccess = useFeatureAccess({
    feature: feature || 'dashboard',
    action: action || 'view'
  });

  // Show loading state
  if (isLoading || tierAccess.isLoading || featureAccess.isLoading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded h-20 ${className}`}>
        <div className="flex items-center justify-center h-full text-gray-500">
          Loading permissions...
        </div>
      </div>
    );
  }

  // Check tier access first
  if (requiredTier && !tierAccess.hasAccess) {
    if (showUpgradePrompt && upgradePrompt) {
      return <>{upgradePrompt}</>;
    }
    if (showUpgradePrompt) {
      return (
        <UpgradePrompt
          requiredTier={requiredTier}
          variant="card"
          className={className}
        />
      );
    }
    return fallback ? <>{fallback}</> : null;
  }

  // Check feature permission
  if (feature && action && !featureAccess.allowed) {
    if (showUpgradePrompt && upgradePrompt) {
      return <>{upgradePrompt}</>;
    }
    if (showUpgradePrompt) {
      return (
        <UpgradePrompt
          feature={feature}
          action={action}
          requiredTier={featureAccess.upgradeRequired}
          variant="card"
          className={className}
        />
      );
    }
    return fallback ? <>{fallback}</> : null;
  }

  return <div className={className}>{children}</div>;
}

/**
 * Upgrade prompt component with multiple variants
 */
export function UpgradePrompt({
  feature,
  action,
  requiredTier,
  variant = 'card',
  title,
  description,
  benefits,
  onUpgrade,
  className
}: UpgradePromptProps) {
  const { userTier } = useTier();
  const { upgradeToTier, isUpgrading } = useSubscriptionIntegration();
  const recommendation = useUpgradeRecommendations(
    feature || 'dashboard',
    action || 'view'
  );

  const targetTier = requiredTier || recommendation.recommendation?.tier || 'professional';
  const upgradeBenefits = benefits || recommendation.recommendation?.benefits || [
    'Unlock advanced features',
    'Increase usage limits',
    'Priority support'
  ];

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      upgradeToTier(targetTier);
    }
  };

  const tierIcons = {
    basic: <Lock className="h-4 w-4" />,
    professional: <Crown className="h-4 w-4" />,
    enterprise: <Shield className="h-4 w-4" />
  };

  const tierColors = {
    basic: 'bg-gray-100 text-gray-800',
    professional: 'bg-blue-100 text-blue-800',
    enterprise: 'bg-purple-100 text-purple-800'
  };

  const content = (
    <>
      <div className="flex items-center gap-2 mb-2">
        {tierIcons[targetTier]}
        <Badge className={tierColors[targetTier]}>
          {targetTier.toUpperCase()} Required
        </Badge>
      </div>

      <h3 className="font-semibold text-lg mb-2">
        {title || `Upgrade to ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)}`}
      </h3>

      <p className="text-gray-600 mb-4">
        {description || `This feature requires ${targetTier} tier access. Upgrade now to unlock:`}
      </p>

      <ul className="space-y-1 mb-4">
        {upgradeBenefits.map((benefit, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-3 w-3 text-green-600" />
            {benefit}
          </li>
        ))}
      </ul>

      <Button
        onClick={handleUpgrade}
        disabled={isUpgrading}
        className="w-full"
        size="sm"
      >
        {isUpgrading ? 'Upgrading...' : `Upgrade to ${targetTier}`}
      </Button>
    </>
  );

  switch (variant) {
    case 'banner':
      return (
        <Alert className={`border-l-4 border-blue-500 ${className}`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Feature Locked</AlertTitle>
          <AlertDescription className="mt-2">
            {content}
          </AlertDescription>
        </Alert>
      );

    case 'inline':
      return (
        <div className={`p-3 bg-gray-50 rounded-lg border ${className}`}>
          {content}
        </div>
      );

    case 'modal':
      // This would integrate with your modal system
      return (
        <Card className={`max-w-md mx-auto ${className}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Feature Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            {content}
          </CardContent>
        </Card>
      );

    case 'card':
    default:
      return (
        <Card className={`${className}`}>
          <CardContent className="p-6">
            {content}
          </CardContent>
        </Card>
      );
  }
}

/**
 * Tier badge component
 */
export function TierBadge({
  tier,
  size = 'md',
  variant = 'default',
  showIcon = true,
  className
}: TierBadgeProps) {
  const icons = {
    basic: <Lock className="h-3 w-3" />,
    professional: <Crown className="h-3 w-3" />,
    enterprise: <Shield className="h-3 w-3" />
  };

  const colors = {
    basic: 'bg-gray-100 text-gray-800 border-gray-300',
    professional: 'bg-blue-100 text-blue-800 border-blue-300',
    enterprise: 'bg-purple-100 text-purple-800 border-purple-300'
  };

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <Badge
      variant={variant}
      className={`
        ${colors[tier]}
        ${sizes[size]}
        ${className}
        flex items-center gap-1
      `}
    >
      {showIcon && icons[tier]}
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </Badge>
  );
}

/**
 * Feature lock indicator component
 */
export function FeatureLock({
  feature,
  action,
  title,
  description,
  icon,
  className
}: FeatureLockProps) {
  const featureAccess = useFeatureAccess({ feature, action });

  if (featureAccess.allowed) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 p-4 bg-gray-50 rounded-lg border ${className}`}>
      <div className="flex-shrink-0">
        {icon || <Lock className="h-5 w-5 text-gray-400" />}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">
          {title || 'Feature Locked'}
        </h4>
        <p className="text-sm text-gray-600">
          {description || `${feature} ${action} requires a higher tier subscription.`}
        </p>
      </div>
      <Button size="sm" variant="outline">
        Upgrade
      </Button>
    </div>
  );
}

/**
 * Usage meter component
 */
export function UsageMeter({
  limitType,
  currentUsage,
  label,
  showUpgrade = true,
  className
}: UsageMeterProps) {
  const { userTier } = useTier();
  const { withinLimit, upgradeRequired } = useTierLimits(limitType, currentUsage);
  const { upgradeToTier, isUpgrading } = useSubscriptionIntegration();

  // Get the actual limit from tier configuration
  const getTierLimit = (tier: UserTier): number => {
    const limits = {
      basic: { maxReports: 5, maxEvaluations: 2, maxAiAnalyses: 0 },
      professional: { maxReports: 25, maxEvaluations: 10, maxAiAnalyses: 20 },
      enterprise: { maxReports: -1, maxEvaluations: -1, maxAiAnalyses: -1 }
    };
    return limits[tier]?.[limitType as keyof typeof limits.basic] || 0;
  };

  const limit = userTier ? getTierLimit(userTier) : 0;
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 100 : Math.min((currentUsage / limit) * 100, 100);

  const getProgressColor = () => {
    if (isUnlimited) return 'bg-green-500';
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {label || limitType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </span>
          <span className="text-sm text-gray-600">
            {isUnlimited ? '∞' : `${currentUsage}/${limit}`}
          </span>
        </div>

        <Progress
          value={percentage}
          className="mb-2"
          // Custom color would need to be implemented in your Progress component
        />

        {!withinLimit && showUpgrade && upgradeRequired && (
          <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
            <p className="text-xs text-red-700 mb-2">
              Limit exceeded. Upgrade to continue.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => upgradeToTier(upgradeRequired)}
              disabled={isUpgrading}
              className="w-full text-xs"
            >
              {isUpgrading ? 'Upgrading...' : `Upgrade to ${upgradeRequired}`}
            </Button>
          </div>
        )}

        {isUnlimited && (
          <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
            <Zap className="h-3 w-3" />
            Unlimited
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Feature availability indicator
 */
export interface FeatureAvailabilityProps {
  features: Array<{
    name: string;
    feature: keyof TierPermissions['features'];
    action: string;
    icon?: ReactNode;
  }>;
  className?: string;
}

export function FeatureAvailability({ features, className }: FeatureAvailabilityProps) {
  const { userTier } = useTier();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TierBadge tier={userTier || 'basic'} />
          Feature Access
        </CardTitle>
        <CardDescription>
          Features available with your current subscription
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {features.map((item, index) => {
            const access = useFeatureAccess({
              feature: item.feature,
              action: item.action
            });

            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-2 rounded ${
                  access.allowed ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0">
                  {item.icon || (
                    access.allowed ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-400" />
                    )
                  )}
                </div>
                <span className={`flex-1 text-sm ${
                  access.allowed ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {item.name}
                </span>
                {access.allowed ? (
                  <Badge variant="outline" className="text-xs">
                    Available
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Locked
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Tier comparison component
 */
export interface TierComparisonProps {
  currentTier: UserTier;
  className?: string;
}

export function TierComparison({ currentTier, className }: TierComparisonProps) {
  const { upgradeToTier, isUpgrading } = useSubscriptionIntegration();

  const tiers = [
    {
      name: 'Basic',
      tier: 'basic' as UserTier,
      price: 'Free',
      features: [
        'Basic questionnaire',
        'Simple dashboard',
        'Basic reports',
        '2 evaluations/month'
      ]
    },
    {
      name: 'Professional',
      tier: 'professional' as UserTier,
      price: '$29/month',
      features: [
        'Advanced questionnaire',
        'AI analysis',
        'ROI calculator',
        '10 evaluations/month',
        'Export & sharing'
      ]
    },
    {
      name: 'Enterprise',
      tier: 'enterprise' as UserTier,
      price: '$99/month',
      features: [
        'Everything in Professional',
        'Unlimited evaluations',
        'Admin controls',
        'Compliance tools',
        'Priority support'
      ]
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {tiers.map((tier) => (
        <Card
          key={tier.tier}
          className={`relative ${
            currentTier === tier.tier
              ? 'ring-2 ring-blue-500 border-blue-500'
              : ''
          }`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{tier.name}</CardTitle>
              <TierBadge tier={tier.tier} size="sm" />
            </div>
            <CardDescription className="text-xl font-bold">
              {tier.price}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-4">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>

            {currentTier === tier.tier ? (
              <Badge className="w-full justify-center">
                Current Plan
              </Badge>
            ) : (
              <Button
                variant={tier.tier === 'enterprise' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => upgradeToTier(tier.tier)}
                disabled={isUpgrading}
              >
                {isUpgrading ? 'Processing...' : `Upgrade to ${tier.name}`}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default {
  TierGate,
  UpgradePrompt,
  TierBadge,
  FeatureLock,
  UsageMeter,
  FeatureAvailability,
  TierComparison
};