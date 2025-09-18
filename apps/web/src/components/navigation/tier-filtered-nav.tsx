'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  ChevronDown, 
  Plus, 
  FileText, 
  BarChart3, 
  Activity, 
  TrendingUp, 
  Target, 
  Lock,
  Crown,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSubscriptionTier } from '@/hooks/use-subscription-tier'
import { TierBadge, FeatureRequirementBadge } from '../tier/tier-badge'
import { UpgradePrompt } from '../tier/upgrade-prompt'

interface NavItem {
  href: string
  label: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  feature?: 'ai_guides' | 'progress_tracking' | 'pdf_reports' | 'analytics' | 'benchmarks' | 'priority_support'
  requiredTier?: 'premium' | 'enterprise'
  category?: string
}

interface TierFilteredNavProps {
  items: NavItem[]
  categories?: { [key: string]: { label: string; description?: string } }
  showUpgradePrompts?: boolean
  variant?: 'dropdown' | 'sidebar' | 'horizontal'
  triggerLabel?: string
  className?: string
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  // Evaluation section
  {
    href: '/onboarding',
    label: 'New Evaluation',
    description: 'Start a fresh business valuation assessment',
    icon: Plus,
    category: 'evaluation'
  },
  {
    href: '/reports',
    label: 'Reports',
    description: 'View and download previous valuations',
    icon: FileText,
    category: 'evaluation'
  },
  
  // Analysis section (Premium features)
  {
    href: '/progress',
    label: 'Progress Tracking',
    description: 'Monitor business growth over time',
    icon: Activity,
    feature: 'progress_tracking',
    requiredTier: 'premium',
    category: 'analysis'
  },
  {
    href: '/analytics',
    label: 'Analytics Dashboard',
    description: 'Track performance metrics and trends',
    icon: BarChart3,
    feature: 'analytics',
    requiredTier: 'premium',
    category: 'analysis'
  },
  
  // Market Insights section
  {
    href: '/market-intelligence',
    label: 'Market Intelligence',
    description: 'Industry trends and competitive analysis',
    icon: TrendingUp,
    feature: 'analytics',
    requiredTier: 'premium',
    category: 'market'
  },
  {
    href: '/benchmarking',
    label: 'Industry Benchmarking',
    description: 'Compare against sector standards',
    icon: Target,
    feature: 'benchmarks',
    requiredTier: 'enterprise',
    category: 'market'
  }
]

const DEFAULT_CATEGORIES = {
  evaluation: {
    label: 'Evaluation',
    description: 'Core valuation tools'
  },
  analysis: {
    label: 'Analysis',
    description: 'Advanced analytics and tracking'
  },
  market: {
    label: 'Market Insights',
    description: 'Industry intelligence and benchmarking'
  }
}

export function TierFilteredNav({
  items = DEFAULT_NAV_ITEMS,
  categories = DEFAULT_CATEGORIES,
  showUpgradePrompts = true,
  variant = 'dropdown',
  triggerLabel = 'Features',
  className
}: TierFilteredNavProps) {
  const pathname = usePathname()
  const { 
    currentTier, 
    hasFeatureAccess, 
    checkFeatureAccess,
    showUpgradePrompt 
  } = useSubscriptionTier()

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  const handleRestrictedNavigation = async (item: NavItem, e: React.MouseEvent) => {
    if (!item.feature || !item.requiredTier) return

    const hasAccess = hasFeatureAccess(item.feature)
    if (!hasAccess) {
      e.preventDefault()
      if (showUpgradePrompts) {
        showUpgradePrompt(item.feature)
      }
    }
  }

  const renderNavItem = (item: NavItem, inDropdown = false) => {
    const Icon = item.icon
    const hasAccess = !item.feature || hasFeatureAccess(item.feature)
    const isActive = pathname === item.href
    
    const baseClasses = cn(
      'flex items-start space-x-3 transition-colors',
      inDropdown ? 'p-3 w-full' : 'p-2 rounded-md',
      isActive ? 'text-primary bg-primary/10' : 'text-foreground hover:text-primary',
      !hasAccess && 'opacity-60 cursor-not-allowed'
    )

    const content = (
      <>
        {Icon && (
          <div className={cn(
            'flex items-center justify-center flex-shrink-0 rounded-md',
            inDropdown ? 'w-8 h-8 bg-muted' : 'w-6 h-6'
          )}>
            {!hasAccess ? (
              <Lock className={cn(
                'text-muted-foreground',
                inDropdown ? 'h-4 w-4' : 'h-3 w-3'
              )} />
            ) : (
              <Icon className={cn(
                'text-current',
                inDropdown ? 'h-4 w-4' : 'h-3 w-3'
              )} />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'font-medium',
              inDropdown ? 'text-sm' : 'text-xs'
            )}>
              {item.label}
            </span>
            {item.requiredTier && (
              <FeatureRequirementBadge 
                requiredTier={item.requiredTier}
                size="sm"
              />
            )}
          </div>
          {item.description && inDropdown && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.description}
            </p>
          )}
        </div>
      </>
    )

    if (!hasAccess && showUpgradePrompts) {
      return (
        <UpgradePrompt
          key={item.href}
          feature={item.feature}
          requiredTier={item.requiredTier}
          trigger={
            <button className={baseClasses}>
              {content}
            </button>
          }
          size="sm"
        />
      )
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={baseClasses}
        onClick={(e) => handleRestrictedNavigation(item, e)}
      >
        {content}
      </Link>
    )
  }

  if (variant === 'horizontal') {
    return (
      <div className={cn('flex items-center space-x-1', className)}>
        {items.slice(0, 4).map(item => (
          <div key={item.href} className="relative">
            {renderNavItem(item)}
          </div>
        ))}
        {items.length > 4 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                More
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {items.slice(4).map(item => (
                <DropdownMenuItem key={item.href} asChild>
                  {renderNavItem(item, true)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
  }

  if (variant === 'sidebar') {
    return (
      <nav className={cn('space-y-1', className)}>
        {Object.entries(groupedItems).map(([categoryKey, categoryItems]) => {
          const category = categories[categoryKey]
          if (!category) return null

          return (
            <div key={categoryKey} className="space-y-1">
              <div className="px-2 py-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {category.label}
                </h3>
                {category.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {category.description}
                  </p>
                )}
              </div>
              <div className="space-y-0.5">
                {categoryItems.map(item => renderNavItem(item))}
              </div>
            </div>
          )
        })}
      </nav>
    )
  }

  // Default dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn('text-sm font-medium', className)}>
          {triggerLabel}
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[720px]">
        <div className="grid grid-cols-2 gap-6 p-4">
          {Object.entries(groupedItems).map(([categoryKey, categoryItems]) => {
            const category = categories[categoryKey]
            if (!category) return null

            return (
              <div key={categoryKey} className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {category.label}
                  </div>
                  <div className="space-y-2">
                    {categoryItems.map(item => (
                      <DropdownMenuItem key={item.href} asChild className="p-0">
                        {renderNavItem(item, true)}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Tier status footer */}
        <DropdownMenuSeparator />
        <div className="p-3 bg-muted/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current Plan:</span>
            <TierBadge tier={currentTier} size="sm" />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Specialized navigation components
export function AnalyticsNav(props: Omit<TierFilteredNavProps, 'items'>) {
  const analyticsItems: NavItem[] = [
    {
      href: '/analytics',
      label: 'Analytics Dashboard',
      description: 'Business performance metrics',
      icon: BarChart3,
      feature: 'analytics',
      requiredTier: 'premium'
    },
    {
      href: '/progress',
      label: 'Progress Tracking',
      description: 'Track improvements over time',
      icon: Activity,
      feature: 'progress_tracking',
      requiredTier: 'premium'
    },
    {
      href: '/benchmarking',
      label: 'Industry Benchmarks',
      description: 'Compare with industry standards',
      icon: Target,
      feature: 'benchmarks',
      requiredTier: 'enterprise'
    }
  ]

  return <TierFilteredNav items={analyticsItems} {...props} />
}

export function ReportsNav(props: Omit<TierFilteredNavProps, 'items'>) {
  const reportsItems: NavItem[] = [
    {
      href: '/reports',
      label: 'Basic Reports',
      description: 'View your evaluation reports',
      icon: FileText
    },
    {
      href: '/reports/professional',
      label: 'Professional Reports',
      description: 'Branded PDF exports',
      icon: FileText,
      feature: 'pdf_reports',
      requiredTier: 'premium'
    }
  ]

  return <TierFilteredNav items={reportsItems} {...props} />
}