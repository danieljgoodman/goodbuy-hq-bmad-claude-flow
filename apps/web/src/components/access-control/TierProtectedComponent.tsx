'use client';

import React, { ReactNode, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Lock, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTierAccess, useUpgradeRecommendation } from '@/hooks/useTierAccess';
import { UserTier, TierPermissions, AccessResult, UsageContext } from '@/lib/access-control/tier-access-control';
import { UpgradePrompt } from './UpgradePrompt';

export interface TierProtectedComponentProps {
  children: ReactNode;
  feature: keyof TierPermissions['features'];
  action: string;
  context?: UsageContext;
  fallbackComponent?: ReactNode;
  loadingComponent?: ReactNode;
  requiredTier?: UserTier;
  showUpgradePrompt?: boolean;
  customAccessDeniedMessage?: string;
  onAccessDenied?: (result: AccessResult) => void;
  onUpgradeClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
  hideOnNoAccess?: boolean;
}

/**
 * Tier-protected component wrapper with graceful fallbacks and upgrade prompts
 * Provides comprehensive access control with beautiful loading states and error handling
 */
export function TierProtectedComponent({
  children,
  feature,
  action,
  context,
  fallbackComponent,
  loadingComponent,
  requiredTier,
  showUpgradePrompt = true,
  customAccessDeniedMessage,
  onAccessDenied,
  onUpgradeClick,
  className = '',
  variant = 'default',
  hideOnNoAccess = false
}: TierProtectedComponentProps) {
  const { userTier, checkFeatureAccess, isLoading, error } = useTierAccess();
  const { recommendation, needsUpgrade } = useUpgradeRecommendation(feature, action);

  // Check access with context
  const accessResult = React.useMemo(() => {
    if (isLoading) return null;
    return checkFeatureAccess(feature, action, context);
  }, [checkFeatureAccess, feature, action, context, isLoading]);

  // Handle access denied callback
  React.useEffect(() => {
    if (accessResult && !accessResult.allowed && onAccessDenied) {
      onAccessDenied(accessResult);
    }
  }, [accessResult, onAccessDenied]);

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        {loadingComponent || <TierProtectedSkeleton variant={variant} />}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access control error: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Access denied
  if (!accessResult?.allowed) {
    if (hideOnNoAccess) {
      return null;
    }

    if (fallbackComponent) {
      return <div className={className}>{fallbackComponent}</div>;
    }

    return (
      <div className={className}>
        <AccessDeniedFallback
          variant={variant}
          userTier={userTier}
          feature={feature}
          action={action}
          accessResult={accessResult}
          recommendation={recommendation}
          customMessage={customAccessDeniedMessage}
          showUpgradePrompt={showUpgradePrompt && needsUpgrade}
          onUpgradeClick={onUpgradeClick}
        />
      </div>
    );
  }

  // Access granted - render children with animation
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="content"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Loading skeleton component
 */
function TierProtectedSkeleton({ variant }: { variant: 'default' | 'compact' | 'minimal' }) {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 mt-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Access denied fallback component
 */
interface AccessDeniedFallbackProps {
  variant: 'default' | 'compact' | 'minimal';
  userTier: UserTier;
  feature: keyof TierPermissions['features'];
  action: string;
  accessResult: AccessResult;
  recommendation: any;
  customMessage?: string;
  showUpgradePrompt: boolean;
  onUpgradeClick?: () => void;
}

function AccessDeniedFallback({
  variant,
  userTier,
  feature,
  action,
  accessResult,
  recommendation,
  customMessage,
  showUpgradePrompt,
  onUpgradeClick
}: AccessDeniedFallbackProps) {
  const formatFeatureName = (feature: string) => {
    return feature
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTierName = (tier: UserTier) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span className="text-sm">
          {customMessage || `Requires ${formatTierName(accessResult.upgradeRequired || 'professional')} tier`}
        </span>
        {showUpgradePrompt && (
          <Button
            variant="outline"
            size="sm"
            onClick={onUpgradeClick}
            className="ml-2"
          >
            Upgrade
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Lock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {formatFeatureName(feature)} - {action}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {customMessage || accessResult.reason || 'This feature requires a higher tier'}
              </p>
              {showUpgradePrompt && recommendation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUpgradeClick}
                  className="mt-3"
                >
                  Upgrade to {formatTierName(recommendation.tier)}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Lock className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-lg text-gray-900">
              Access Restricted
            </CardTitle>
            <CardDescription>
              {formatFeatureName(feature)} - {action}
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-auto">
            Current: {formatTierName(userTier)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              {customMessage || accessResult.reason || 
                'This feature is not available in your current subscription tier.'}
            </AlertDescription>
          </Alert>

          {accessResult.conditions && accessResult.conditions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Restrictions:</h4>
              <ul className="space-y-1">
                {accessResult.conditions.map((condition, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                    {condition.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showUpgradePrompt && recommendation && (
            <div className="pt-4 border-t border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Upgrade to {formatTierName(recommendation.tier)}
                  </p>
                  <p className="text-xs text-gray-600">
                    Unlock this feature and more
                  </p>
                </div>
                <Button
                  onClick={onUpgradeClick}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Higher-order component for tier protection
 */
export function withTierProtection<P extends object>(
  Component: React.ComponentType<P>,
  protectionConfig: {
    feature: keyof TierPermissions['features'];
    action: string;
    context?: UsageContext;
    fallback?: ReactNode;
    requiredTier?: UserTier;
  }
) {
  return function TierProtectedWrapper(props: P) {
    return (
      <TierProtectedComponent
        feature={protectionConfig.feature}
        action={protectionConfig.action}
        context={protectionConfig.context}
        fallbackComponent={protectionConfig.fallback}
        requiredTier={protectionConfig.requiredTier}
      >
        <Component {...props} />
      </TierProtectedComponent>
    );
  };
}

/**
 * Suspense-wrapped tier protected component
 */
export function SuspenseTierProtectedComponent(props: TierProtectedComponentProps) {
  return (
    <Suspense fallback={<TierProtectedSkeleton variant={props.variant || 'default'} />}>
      <TierProtectedComponent {...props} />
    </Suspense>
  );
}

export default TierProtectedComponent;