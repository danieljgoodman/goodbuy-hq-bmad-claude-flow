'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  Star, 
  Crown, 
  Check, 
  X, 
  TrendingUp, 
  FileText,
  BarChart3,
  Target,
  Headphones,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSubscriptionTier } from '@/hooks/use-subscription-tier'
import { TierBadge } from './tier-badge'

type FeatureType = 'ai_guides' | 'progress_tracking' | 'pdf_reports' | 'analytics' | 'benchmarks' | 'priority_support'
type RequiredTier = 'premium' | 'enterprise'

interface UpgradePromptProps {
  feature?: FeatureType
  requiredTier?: RequiredTier
  trigger?: React.ReactNode
  title?: string
  description?: string
  benefits?: string[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  size?: 'sm' | 'lg'
  variant?: 'dialog' | 'card' | 'inline'
}

const FEATURE_CONFIG = {
  ai_guides: {
    title: 'AI-Powered Business Guides',
    description: 'Get personalized improvement recommendations powered by advanced AI analysis',
    icon: Sparkles,
    requiredTier: 'premium' as const
  },
  progress_tracking: {
    title: 'Progress Tracking',
    description: 'Monitor your business growth and track improvements over time',
    icon: TrendingUp,
    requiredTier: 'premium' as const
  },
  pdf_reports: {
    title: 'Professional PDF Reports',
    description: 'Generate beautiful, comprehensive reports you can share with stakeholders',
    icon: FileText,
    requiredTier: 'premium' as const
  },
  analytics: {
    title: 'Advanced Analytics',
    description: 'Deep insights into your business performance with industry benchmarks',
    icon: BarChart3,
    requiredTier: 'premium' as const
  },
  benchmarks: {
    title: 'Industry Benchmarking',
    description: 'Compare your business against industry standards and top performers',
    icon: Target,
    requiredTier: 'enterprise' as const
  },
  priority_support: {
    title: 'Priority Support',
    description: 'Get faster response times and dedicated support from our team',
    icon: Headphones,
    requiredTier: 'premium' as const
  }
} as const

const TIER_PLANS = {
  premium: {
    name: 'Premium',
    price: '$29',
    period: 'month',
    description: 'Perfect for growing businesses',
    features: [
      'AI-powered business guides',
      'Progress tracking & analytics',
      'Professional PDF reports',
      'Advanced valuation methods',
      'Priority customer support',
      'Unlimited evaluations'
    ],
    popular: true
  },
  enterprise: {
    name: 'Enterprise',
    price: '$99',
    period: 'month',
    description: 'For established businesses and teams',
    features: [
      'Everything in Premium',
      'Industry benchmarking',
      'Custom reporting & branding',
      'API access & integrations',
      'Dedicated account manager',
      'Team collaboration tools'
    ],
    popular: false
  }
} as const

export function UpgradePrompt({
  feature,
  requiredTier: propRequiredTier,
  trigger,
  title,
  description,
  benefits,
  open,
  onOpenChange,
  size = 'lg',
  variant = 'dialog'
}: UpgradePromptProps) {
  const { currentTier, getUpgradeUrl } = useSubscriptionTier()
  const [isOpen, setIsOpen] = useState(false)
  
  const featureConfig = feature ? FEATURE_CONFIG[feature] : null
  const requiredTier = propRequiredTier || featureConfig?.requiredTier || 'premium'
  const finalTitle = title || featureConfig?.title || 'Upgrade Required'
  const finalDescription = description || featureConfig?.description || 'This feature requires a premium subscription'
  
  const plan = TIER_PLANS[requiredTier]
  const Icon = featureConfig?.icon || Star
  
  const handleUpgrade = () => {
    window.open(getUpgradeUrl(requiredTier.toUpperCase() as any), '_blank')
  }

  const dialogOpen = open !== undefined ? open : isOpen
  const setDialogOpen = onOpenChange || setIsOpen

  if (variant === 'inline') {
    return (
      <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{finalTitle}</h3>
                <TierBadge tier={requiredTier} size="sm" />
              </div>
              <p className="text-sm text-muted-foreground">{finalDescription}</p>
              <Button onClick={handleUpgrade} size="sm" className="mt-3">
                Upgrade Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'card') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            {finalTitle}
            <TierBadge tier={requiredTier} size="sm" />
          </CardTitle>
          <CardDescription>{finalDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold">
              {plan.price}
              <span className="text-lg font-normal text-muted-foreground">/{plan.period}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
          </div>
          
          <ul className="space-y-2 text-sm">
            {plan.features.slice(0, 4).map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          
          <Button onClick={handleUpgrade} className="w-full" size="lg">
            Upgrade to {plan.name}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Icon className="mr-2 h-4 w-4" />
      Upgrade Required
    </Button>
  )

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className={cn(
        "max-w-2xl",
        size === 'sm' && "max-w-md"
      )}>
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <DialogTitle className="flex items-center justify-center gap-2 text-xl">
              {finalTitle}
              <TierBadge tier={requiredTier} size="md" />
            </DialogTitle>
            <DialogDescription className="mt-2">
              {finalDescription}
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Current vs Required Tier */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Current Plan</div>
              <TierBadge tier={currentTier} size="lg" />
            </div>
            <div className="text-center p-4 border-2 border-primary rounded-lg bg-primary/5">
              <div className="text-sm text-muted-foreground mb-2">Required Plan</div>
              <TierBadge tier={requiredTier} size="lg" />
            </div>
          </div>
          
          {/* Plan Details */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    {plan.popular && (
                      <Badge variant="secondary">Most Popular</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-lg font-normal text-muted-foreground">/{plan.period}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} size="lg" className="flex-1">
            Upgrade to {plan.name}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Convenience components for specific features
export function AnalyticsUpgradePrompt(props: Omit<UpgradePromptProps, 'feature'>) {
  return <UpgradePrompt feature="analytics" {...props} />
}

export function PDFReportsUpgradePrompt(props: Omit<UpgradePromptProps, 'feature'>) {
  return <UpgradePrompt feature="pdf_reports" {...props} />
}

export function ProgressTrackingUpgradePrompt(props: Omit<UpgradePromptProps, 'feature'>) {
  return <UpgradePrompt feature="progress_tracking" {...props} />
}

export function BenchmarkingUpgradePrompt(props: Omit<UpgradePromptProps, 'feature'>) {
  return <UpgradePrompt feature="benchmarks" requiredTier="enterprise" {...props} />
}

// Simple upgrade button
interface UpgradeButtonProps {
  feature?: FeatureType
  requiredTier?: RequiredTier
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  children?: React.ReactNode
}

export function UpgradeButton({
  feature,
  requiredTier = 'premium',
  variant = 'default',
  size = 'default',
  className,
  children
}: UpgradeButtonProps) {
  const { getUpgradeUrl } = useSubscriptionTier()
  
  const handleUpgrade = () => {
    window.open(getUpgradeUrl(requiredTier.toUpperCase() as any), '_blank')
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleUpgrade}
      className={className}
    >
      {children || (
        <>
          <Star className="mr-2 h-4 w-4" />
          Upgrade Now
        </>
      )}
    </Button>
  )
}