'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Crown, Star, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSubscriptionTier } from '@/hooks/use-subscription-tier'

interface TierBadgeProps {
  tier?: 'free' | 'premium' | 'enterprise'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
  variant?: 'default' | 'outline' | 'minimal'
}

const TIER_CONFIG = {
  free: {
    label: 'Free',
    icon: Zap,
    variant: 'outline' as const,
    className: 'border-slate-300 text-slate-600 bg-slate-50'
  },
  premium: {
    label: 'Premium',
    icon: Star,
    variant: 'default' as const,
    className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500'
  },
  enterprise: {
    label: 'Enterprise',
    icon: Crown,
    variant: 'default' as const,
    className: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-500'
  }
} as const

const SIZE_CONFIG = {
  sm: {
    badge: 'text-xs px-2 py-0.5',
    icon: 'h-3 w-3'
  },
  md: {
    badge: 'text-sm px-2.5 py-0.5',
    icon: 'h-3.5 w-3.5'
  },
  lg: {
    badge: 'text-sm px-3 py-1',
    icon: 'h-4 w-4'
  }
} as const

export function TierBadge({
  tier: propTier,
  size = 'md',
  showIcon = true,
  className,
  variant = 'default'
}: TierBadgeProps) {
  const { currentTier } = useSubscriptionTier()
  const tier = propTier || currentTier
  
  const config = TIER_CONFIG[tier]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  const badgeClassName = cn(
    'inline-flex items-center gap-1.5 font-medium rounded-full transition-all',
    sizeConfig.badge,
    variant === 'minimal' ? 'bg-transparent border-0 px-0' : config.className,
    className
  )

  return (
    <Badge className={badgeClassName}>
      {showIcon && (
        <Icon className={cn('flex-shrink-0', sizeConfig.icon)} />
      )}
      <span>{config.label}</span>
    </Badge>
  )
}

// Specialized tier badge variants
export function PremiumBadge({ className, ...props }: Omit<TierBadgeProps, 'tier'>) {
  return (
    <TierBadge 
      tier="premium" 
      className={cn('bg-primary text-primary-foreground', className)} 
      {...props} 
    />
  )
}

export function EnterpriseBadge({ className, ...props }: Omit<TierBadgeProps, 'tier'>) {
  return (
    <TierBadge 
      tier="enterprise" 
      className={cn('bg-purple-500 text-white', className)} 
      {...props} 
    />
  )
}

// Feature requirement badge
interface FeatureRequirementBadgeProps {
  requiredTier: 'premium' | 'enterprise'
  className?: string
  size?: 'sm' | 'md'
}

export function FeatureRequirementBadge({ 
  requiredTier, 
  className, 
  size = 'sm' 
}: FeatureRequirementBadgeProps) {
  const { currentTier } = useSubscriptionTier()
  const hasAccess = currentTier === requiredTier || 
    (requiredTier === 'premium' && currentTier === 'enterprise')

  if (hasAccess) {
    return null // Don't show badge if user has access
  }

  return (
    <TierBadge
      tier={requiredTier}
      size={size}
      className={cn('ml-2', className)}
      showIcon={false}
    />
  )
}

// Upgrade prompt badge
interface UpgradePromptBadgeProps {
  requiredTier: 'premium' | 'enterprise'
  feature?: string
  className?: string
  onClick?: () => void
}

export function UpgradePromptBadge({ 
  requiredTier, 
  feature, 
  className, 
  onClick 
}: UpgradePromptBadgeProps) {
  const { showUpgradePrompt } = useSubscriptionTier()
  
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (feature) {
      showUpgradePrompt(feature as any)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center transition-all hover:scale-105"
    >
      <TierBadge
        tier={requiredTier}
        size="sm"
        className={cn(
          'cursor-pointer hover:opacity-80 transition-opacity',
          className
        )}
      />
    </button>
  )
}