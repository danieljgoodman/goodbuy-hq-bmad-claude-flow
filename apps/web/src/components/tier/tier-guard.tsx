'use client'

import React from 'react'
import { useSubscriptionTier } from '@/hooks/use-subscription-tier'
import { UpgradePrompt } from './upgrade-prompt'

type FeatureType = 'ai_guides' | 'progress_tracking' | 'pdf_reports' | 'analytics' | 'benchmarks' | 'priority_support'
type RequiredTier = 'premium' | 'enterprise'

interface TierGuardProps {
  feature: FeatureType
  requiredTier?: RequiredTier
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
  restrictContent?: boolean
  blurContent?: boolean
}

/**
 * TierGuard component that conditionally renders children based on user's subscription tier
 *
 * @param feature - The feature being guarded
 * @param requiredTier - The minimum tier required (defaults based on feature)
 * @param children - Content to show when user has access
 * @param fallback - Custom fallback content when access is denied
 * @param showUpgradePrompt - Whether to show upgrade prompt by default
 * @param restrictContent - Whether to hide content completely
 * @param blurContent - Whether to blur content instead of hiding
 */
export function TierGuard({
  feature,
  requiredTier,
  children,
  fallback,
  showUpgradePrompt = true,
  restrictContent = false,
  blurContent = false
}: TierGuardProps) {
  const { hasFeatureAccess } = useSubscriptionTier()

  const hasAccess = hasFeatureAccess(feature)

  // If user has access, render children normally
  if (hasAccess) {
    return <>{children}</>
  }

  // If we should completely restrict content
  if (restrictContent) {
    return (
      <>
        {fallback || (
          showUpgradePrompt ? (
            <UpgradePrompt
              feature={feature}
              requiredTier={requiredTier}
              variant="card"
            />
          ) : null
        )}
      </>
    )
  }

  // If we should blur content
  if (blurContent) {
    return (
      <div className="relative">
        <div className="filter blur-sm pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          {fallback || (
            showUpgradePrompt ? (
              <UpgradePrompt
                feature={feature}
                requiredTier={requiredTier}
                variant="card"
                size="sm"
              />
            ) : (
              <div className="text-center p-4">
                <p className="text-muted-foreground">This feature requires a higher subscription tier</p>
              </div>
            )
          )}
        </div>
      </div>
    )
  }

  // Default: show content with overlay upgrade prompt
  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        {fallback || (
          showUpgradePrompt ? (
            <UpgradePrompt
              feature={feature}
              requiredTier={requiredTier}
              variant="inline"
            />
          ) : (
            <div className="text-center p-4 bg-background/90 rounded-lg border">
              <p className="text-muted-foreground">Premium Feature</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}

// Specialized guards for common features
export function AnalyticsGuard(props: Omit<TierGuardProps, 'feature'>) {
  return <TierGuard feature="analytics" {...props} />
}

export function ProgressTrackingGuard(props: Omit<TierGuardProps, 'feature'>) {
  return <TierGuard feature="progress_tracking" {...props} />
}

export function PDFReportsGuard(props: Omit<TierGuardProps, 'feature'>) {
  return <TierGuard feature="pdf_reports" {...props} />
}

export function BenchmarkingGuard(props: Omit<TierGuardProps, 'feature' | 'requiredTier'>) {
  return <TierGuard feature="benchmarks" requiredTier="enterprise" {...props} />
}

// Hook-based guard for conditional rendering
export function useTierGuard(feature: FeatureType): {
  hasAccess: boolean
  GuardComponent: React.ComponentType<Omit<TierGuardProps, 'feature'>>
} {
  const { hasFeatureAccess } = useSubscriptionTier()

  return {
    hasAccess: hasFeatureAccess(feature),
    GuardComponent: (props) => <TierGuard feature={feature} {...props} />
  }
}