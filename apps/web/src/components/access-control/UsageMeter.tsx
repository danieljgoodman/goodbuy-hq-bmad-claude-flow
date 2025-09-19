'use client';

import React from 'react';
import { AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUsageTracking } from '@/hooks/useTierAccess';
import { UsageMeterProps } from '@/types/access-control';
import { TierPermissions } from '@/lib/access-control/tier-access-control';

/**
 * Usage meter component for tracking feature usage limits
 */
export function UsageMeter({
  feature,
  action,
  variant = 'default',
  showLabels = true,
  warningThreshold = 80,
  dangerThreshold = 95,
  className
}: UsageMeterProps) {
  const {
    currentUsage,
    usageLimit,
    usagePercentage,
    canUse,
    isAtLimit,
    timeRestriction,
    isLoading,
    error
  } = useUsageTracking(feature, action);

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        {variant === 'compact' ? (
          <div className="h-4 bg-gray-200 rounded" />
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-2 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn('border-red-200 bg-red-50', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Usage tracking error</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usageLimit) {
    return (
      <div className={cn('flex items-center gap-2 text-green-600', className)}>
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">Unlimited</span>
      </div>
    );
  }

  const getProgressColor = () => {
    if (usagePercentage >= dangerThreshold) return 'bg-red-500';
    if (usagePercentage >= warningThreshold) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getStatusBadge = () => {
    if (isAtLimit) {
      return (
        <Badge variant="destructive" className="text-xs">
          Limit Reached
        </Badge>
      );
    }
    if (usagePercentage >= dangerThreshold) {
      return (
        <Badge variant="outline" className="text-xs border-red-200 text-red-600">
          Critical
        </Badge>
      );
    }
    if (usagePercentage >= warningThreshold) {
      return (
        <Badge variant="outline" className="text-xs border-amber-200 text-amber-600">
          Warning
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs border-green-200 text-green-600">
        Good
      </Badge>
    );
  };

  const formatFeatureName = (feature: keyof TierPermissions['features']) => {
    return feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimeRestriction = (restriction: string | null) => {
    if (!restriction) return '';
    return `per ${restriction.replace('ly', '')}`;
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            {showLabels && (
              <span className="text-xs text-gray-600">
                {formatFeatureName(feature)}
              </span>
            )}
            <span className="text-xs font-medium">
              {currentUsage}/{usageLimit}
            </span>
          </div>
          <Progress 
            value={usagePercentage} 
            className="h-2"
          />
        </div>
        {getStatusBadge()}
      </div>
    );
  }

  if (variant === 'circular') {
    const circumference = 2 * Math.PI * 20; // radius = 20
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (usagePercentage / 100) * circumference;

    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r="20"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="22"
              cy="22"
              r="20"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={cn(
                'transition-all duration-300 ease-in-out',
                usagePercentage >= dangerThreshold ? 'text-red-500' :
                usagePercentage >= warningThreshold ? 'text-amber-500' :
                'text-green-500'
              )}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium">
              {Math.round(usagePercentage)}%
            </span>
          </div>
        </div>
        {showLabels && (
          <div className="flex-1">
            <p className="text-sm font-medium">{formatFeatureName(feature)}</p>
            <p className="text-xs text-gray-600">
              {currentUsage} of {usageLimit} used {formatTimeRestriction(timeRestriction)}
            </p>
            {getStatusBadge()}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">
              {formatFeatureName(feature)} Usage
            </CardTitle>
            {timeRestriction && (
              <CardDescription className="flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                Resets {formatTimeRestriction(timeRestriction)}
              </CardDescription>
            )}
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Used</span>
            <span className="font-medium">
              {currentUsage} of {usageLimit}
            </span>
          </div>
          
          <Progress 
            value={usagePercentage} 
            className="h-3"
          />
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>0</span>
            <span>{Math.round(usagePercentage)}% used</span>
            <span>{usageLimit}</span>
          </div>
          
          {!canUse && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Usage limit reached for this {timeRestriction || 'period'}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default UsageMeter;