'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Zap,
  Check,
  X,
  ArrowRight,
  Star,
  Shield,
  Infinity,
  Users,
  BarChart3,
  Bot,
  Settings,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { UserTier, TierPermissions } from '@/lib/access-control/tier-access-control';
import { useTierAccess, useUpgradeRecommendation } from '@/hooks/useTierAccess';

export interface UpgradePromptProps {
  feature?: keyof TierPermissions['features'];
  action?: string;
  currentTier?: UserTier;
  targetTier?: UserTier;
  trigger?: React.ReactNode;
  variant?: 'dialog' | 'inline' | 'banner' | 'compact';
  showComparison?: boolean;
  customBenefits?: string[];
  onUpgrade?: (tier: UserTier) => void;
  onCancel?: () => void;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Tier pricing and feature information
 */
const TIER_INFO: Record<UserTier, {
  name: string;
  price: string;
  description: string;
  popular?: boolean;
  features: string[];
  limits: {
    reports: string;
    evaluations: string;
    storage: string;
    users: string;
    aiAnalyses: string;
    support: string;
  };
  color: string;
  icon: React.ComponentType<any>;
}> = {
  basic: {
    name: 'Basic',
    price: 'Free',
    description: 'Perfect for getting started with business evaluation',
    features: [
      'Basic questionnaires and reports',
      'ROI calculator',
      'Standard dashboard',
      'Email support',
      '30-day data retention'
    ],
    limits: {
      reports: '5 reports/month',
      evaluations: '2 evaluations/month',
      storage: '100MB storage',
      users: '1 user',
      aiAnalyses: 'No AI analysis',
      support: 'Email support'
    },
    color: 'text-blue-600',
    icon: Star
  },
  professional: {
    name: 'Professional',
    price: '$29/month',
    description: 'Advanced features for growing businesses',
    popular: true,
    features: [
      'Advanced AI analysis and insights',
      'Financial trend analysis',
      'Custom dashboards and widgets',
      'Export and sharing capabilities',
      'Priority support',
      'API access',
      '1-year data retention'
    ],
    limits: {
      reports: '25 reports/month',
      evaluations: '10 evaluations/month',
      storage: '1GB storage',
      users: '3 users',
      aiAnalyses: '20 AI analyses/month',
      support: 'Priority support'
    },
    color: 'text-amber-600',
    icon: Zap
  },
  enterprise: {
    name: 'Enterprise',
    price: '$99/month',
    description: 'Complete solution for large organizations',
    features: [
      'Unlimited AI analysis and advanced modeling',
      'Custom integrations and SSO',
      'White-label reporting',
      'Advanced compliance tools',
      'Dedicated account manager',
      'Custom training and onboarding',
      'Unlimited data retention'
    ],
    limits: {
      reports: 'Unlimited',
      evaluations: 'Unlimited',
      storage: 'Unlimited',
      users: 'Unlimited',
      aiAnalyses: 'Unlimited',
      support: 'Dedicated support'
    },
    color: 'text-purple-600',
    icon: Crown
  }
};

/**
 * Feature icons mapping
 */
const FEATURE_ICONS: Record<string, React.ComponentType<any>> = {
  reports: BarChart3,
  ai_analysis: Bot,
  dashboard: Settings,
  compliance: Shield,
  users: Users,
  unlimited: Infinity
};

/**
 * Beautiful upgrade prompt component with feature comparison and value propositions
 */
export function UpgradePrompt({
  feature,
  action,
  currentTier,
  targetTier,
  trigger,
  variant = 'dialog',
  showComparison = true,
  customBenefits,
  onUpgrade,
  onCancel,
  className,
  open,
  onOpenChange
}: UpgradePromptProps) {
  const { userTier } = useTierAccess();
  const { recommendation } = useUpgradeRecommendation(feature, action);
  const [selectedTier, setSelectedTier] = useState<UserTier>(targetTier || recommendation?.tier || 'professional');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const effectiveCurrentTier = currentTier || userTier;
  
  const handleUpgrade = async (tier: UserTier) => {
    setIsUpgrading(true);
    try {
      await onUpgrade?.(tier);
    } finally {
      setIsUpgrading(false);
    }
  };

  const formatFeatureName = (feature: string) => {
    return feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (variant === 'compact') {
    return (
      <CompactUpgradePrompt
        currentTier={effectiveCurrentTier}
        targetTier={selectedTier}
        feature={feature}
        action={action}
        onUpgrade={() => handleUpgrade(selectedTier)}
        className={className}
      />
    );
  }

  if (variant === 'banner') {
    return (
      <BannerUpgradePrompt
        currentTier={effectiveCurrentTier}
        targetTier={selectedTier}
        feature={feature}
        action={action}
        onUpgrade={() => handleUpgrade(selectedTier)}
        onCancel={onCancel}
        className={className}
      />
    );
  }

  if (variant === 'inline') {
    return (
      <InlineUpgradePrompt
        currentTier={effectiveCurrentTier}
        targetTier={selectedTier}
        feature={feature}
        action={action}
        showComparison={showComparison}
        customBenefits={customBenefits}
        onUpgrade={handleUpgrade}
        onCancel={onCancel}
        selectedTier={selectedTier}
        onTierSelect={setSelectedTier}
        isUpgrading={isUpgrading}
        className={className}
      />
    );
  }

  // Dialog variant (default)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Unlock Premium Features
          </DialogTitle>
          <DialogDescription className="text-base">
            {feature && action ? (
              <>Upgrade your plan to access <strong>{formatFeatureName(feature)}</strong> - {action}</>
            ) : (
              'Choose the perfect plan for your business needs'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {showComparison && (
            <TierComparisonTable
              currentTier={effectiveCurrentTier}
              selectedTier={selectedTier}
              onTierSelect={setSelectedTier}
            />
          )}

          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={onCancel}>
              Maybe Later
            </Button>
            <Button
              onClick={() => handleUpgrade(selectedTier)}
              disabled={isUpgrading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isUpgrading ? (
                <>Upgrading...</>
              ) : (
                <>
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to {TIER_INFO[selectedTier].name}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact upgrade prompt for inline use
 */
function CompactUpgradePrompt({
  currentTier,
  targetTier,
  feature,
  action,
  onUpgrade,
  className
}: {
  currentTier: UserTier;
  targetTier: UserTier;
  feature?: keyof TierPermissions['features'];
  action?: string;
  onUpgrade: () => void;
  className?: string;
}) {
  const targetInfo = TIER_INFO[targetTier];
  const Icon = targetInfo.icon;

  return (
    <Card className={cn('border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-orange-50', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg bg-white', targetInfo.color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                Upgrade to {targetInfo.name}
              </p>
              <p className="text-sm text-gray-600">
                {targetInfo.price} • Unlock premium features
              </p>
            </div>
          </div>
          <Button onClick={onUpgrade} size="sm">
            Upgrade
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Banner upgrade prompt for page-wide notifications
 */
function BannerUpgradePrompt({
  currentTier,
  targetTier,
  feature,
  action,
  onUpgrade,
  onCancel,
  className
}: {
  currentTier: UserTier;
  targetTier: UserTier;
  feature?: keyof TierPermissions['features'];
  action?: string;
  onUpgrade: () => void;
  onCancel?: () => void;
  className?: string;
}) {
  const targetInfo = TIER_INFO[targetTier];

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={cn(
        'bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              Unlock {targetInfo.name} Features
            </h3>
            <p className="text-blue-100">
              {feature && action
                ? `Access ${feature.replace(/_/g, ' ')} and ${targetInfo.features.length - 2} more features`
                : `Get access to all premium features starting at ${targetInfo.price}`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-white hover:bg-white/20">
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={onUpgrade}
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <Crown className="mr-2 h-4 w-4" />
            Upgrade Now
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Inline upgrade prompt with full feature comparison
 */
function InlineUpgradePrompt({
  currentTier,
  targetTier,
  feature,
  action,
  showComparison,
  customBenefits,
  onUpgrade,
  onCancel,
  selectedTier,
  onTierSelect,
  isUpgrading,
  className
}: {
  currentTier: UserTier;
  targetTier: UserTier;
  feature?: keyof TierPermissions['features'];
  action?: string;
  showComparison: boolean;
  customBenefits?: string[];
  onUpgrade: (tier: UserTier) => void;
  onCancel?: () => void;
  selectedTier: UserTier;
  onTierSelect: (tier: UserTier) => void;
  isUpgrading: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Upgrade Your Plan
        </h2>
        <p className="text-gray-600">
          {feature && action
            ? `Unlock ${feature.replace(/_/g, ' ')} and access premium features`
            : 'Choose the perfect plan for your business needs'
          }
        </p>
      </div>

      {showComparison && (
        <TierComparisonTable
          currentTier={currentTier}
          selectedTier={selectedTier}
          onTierSelect={onTierSelect}
        />
      )}

      {customBenefits && customBenefits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              What You'll Get
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {customBenefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 justify-center">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Maybe Later
          </Button>
        )}
        <Button
          onClick={() => onUpgrade(selectedTier)}
          disabled={isUpgrading}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isUpgrading ? (
            <>Upgrading...</>
          ) : (
            <>
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to {TIER_INFO[selectedTier].name}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Tier comparison table component
 */
function TierComparisonTable({
  currentTier,
  selectedTier,
  onTierSelect
}: {
  currentTier: UserTier;
  selectedTier: UserTier;
  onTierSelect: (tier: UserTier) => void;
}) {
  const tiers: UserTier[] = ['basic', 'professional', 'enterprise'];
  const features = [
    { key: 'reports', label: 'Monthly Reports', icon: BarChart3 },
    { key: 'evaluations', label: 'Business Evaluations', icon: Star },
    { key: 'storage', label: 'Storage Space', icon: Settings },
    { key: 'users', label: 'Team Members', icon: Users },
    { key: 'aiAnalyses', label: 'AI Analysis', icon: Bot },
    { key: 'support', label: 'Support Level', icon: Shield }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {tiers.map((tier) => {
        const tierInfo = TIER_INFO[tier];
        const Icon = tierInfo.icon;
        const isSelected = selectedTier === tier;
        const isCurrent = currentTier === tier;
        
        return (
          <Card
            key={tier}
            className={cn(
              'relative cursor-pointer transition-all duration-200 hover:shadow-lg',
              isSelected && 'ring-2 ring-blue-500 ring-offset-2',
              isCurrent && 'border-green-500 bg-green-50/50',
              tierInfo.popular && 'border-amber-500'
            )}
            onClick={() => onTierSelect(tier)}
          >
            {tierInfo.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-amber-500 text-white">
                  Most Popular
                </Badge>
              </div>
            )}
            {isCurrent && (
              <div className="absolute -top-3 right-4">
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  Current
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className={cn('mx-auto p-3 rounded-xl bg-gray-100', tierInfo.color)}>
                <Icon className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl">{tierInfo.name}</CardTitle>
              <div className="text-2xl font-bold text-blue-600">{tierInfo.price}</div>
              <CardDescription className="text-sm">
                {tierInfo.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {features.map((feature) => {
                const FeatureIcon = feature.icon;
                const limit = tierInfo.limits[feature.key as keyof typeof tierInfo.limits];
                
                return (
                  <div key={feature.key} className="flex items-center gap-3 text-sm">
                    <FeatureIcon className="h-4 w-4 text-gray-500" />
                    <span className="flex-1">{feature.label}</span>
                    <span className="font-medium text-gray-900">{limit}</span>
                  </div>
                );
              })}
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                {tierInfo.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
                {tierInfo.features.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{tierInfo.features.length - 3} more features
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default UpgradePrompt;