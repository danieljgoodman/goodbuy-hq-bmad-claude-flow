'use client';

import React from 'react';
import { Crown, Star, Zap, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserTier } from '@/lib/access-control/tier-access-control';
import { TierBadgeProps } from '@/types/access-control';

const TIER_CONFIG: Record<UserTier, {
  label: string;
  icon: React.ComponentType<any>;
  className: string;
  buttonClassName: string;
}> = {
  basic: {
    label: 'Basic',
    icon: Star,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    buttonClassName: 'text-blue-600 hover:text-blue-700'
  },
  professional: {
    label: 'Professional',
    icon: Zap,
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    buttonClassName: 'text-amber-600 hover:text-amber-700'
  },
  enterprise: {
    label: 'Enterprise',
    icon: Crown,
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    buttonClassName: 'text-purple-600 hover:text-purple-700'
  }
};

/**
 * Tier badge component with optional upgrade button
 */
export function TierBadge({
  tier,
  variant = 'default',
  showUpgradeButton = false,
  onUpgradeClick,
  className
}: TierBadgeProps) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge variant="outline" className={config.className}>
          <Icon className="mr-1 h-3 w-3" />
          {config.label}
        </Badge>
        {showUpgradeButton && tier !== 'enterprise' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUpgradeClick}
            className={config.buttonClassName}
          >
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('flex items-center justify-between p-3 bg-white border rounded-lg', className)}>
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', config.className.replace('text-', 'text-white bg-').replace('-100', '-500'))}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{config.label} Plan</p>
            <p className="text-sm text-gray-500">Current subscription</p>
          </div>
        </div>
        {showUpgradeButton && tier !== 'enterprise' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onUpgradeClick}
            className={config.buttonClassName}
          >
            Upgrade
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant="outline" className={cn('px-2 py-1', config.className)}>
        <Icon className="mr-1 h-4 w-4" />
        {config.label}
      </Badge>
      {showUpgradeButton && tier !== 'enterprise' && (
        <Button
          variant="outline"
          size="sm"
          onClick={onUpgradeClick}
          className={config.buttonClassName}
        >
          Upgrade
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export default TierBadge;