'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Lock,
  Star,
  ArrowRight,
  Check,
  Zap,
  Crown,
  Shield,
  TrendingUp,
  Users,
  Settings,
  BarChart3,
  Database,
  Headphones
} from 'lucide-react';
import { SubscriptionTier } from '@/types/subscription';
import { cn } from '@/lib/utils';

interface AccessDeniedPageProps {
  feature: string;
  currentTier: SubscriptionTier;
  requiredTier: SubscriptionTier;
  className?: string;
}

interface TierFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

interface TierPlan {
  tier: SubscriptionTier;
  name: string;
  price: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: TierFeature[];
  popular?: boolean;
}

const TIER_PLANS: TierPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    icon: <Star className="h-5 w-5" />,
    color: 'text-gray-600',
    features: [
      {
        icon: <BarChart3 className="h-4 w-4" />,
        title: 'Basic Analytics',
        description: 'Essential metrics and reporting'
      },
      {
        icon: <Database className="h-4 w-4" />,
        title: 'Standard Reports',
        description: 'Pre-built analysis templates'
      },
      {
        icon: <Users className="h-4 w-4" />,
        title: 'Community Support',
        description: 'Access to community forums'
      }
    ]
  },
  {
    tier: 'professional',
    name: 'Professional',
    price: '$49',
    description: 'Advanced features for growing businesses',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-blue-600',
    popular: true,
    features: [
      {
        icon: <TrendingUp className="h-4 w-4" />,
        title: 'Advanced Analytics',
        description: 'Deep insights with custom metrics',
        highlight: true
      },
      {
        icon: <Settings className="h-4 w-4" />,
        title: 'Custom Benchmarks',
        description: 'Create your own performance benchmarks',
        highlight: true
      },
      {
        icon: <Database className="h-4 w-4" />,
        title: 'API Access',
        description: 'Integrate with your existing systems',
        highlight: true
      },
      {
        icon: <Headphones className="h-4 w-4" />,
        title: 'Priority Support',
        description: '24/7 priority customer support',
        highlight: true
      }
    ]
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: '$199',
    description: 'Full-scale solution for large organizations',
    icon: <Crown className="h-5 w-5" />,
    color: 'text-purple-600',
    features: [
      {
        icon: <Shield className="h-4 w-4" />,
        title: 'White Label',
        description: 'Brand the platform with your identity',
        highlight: true
      },
      {
        icon: <Settings className="h-4 w-4" />,
        title: 'Custom Integrations',
        description: 'Build custom integrations and workflows',
        highlight: true
      },
      {
        icon: <Users className="h-4 w-4" />,
        title: 'Dedicated Manager',
        description: 'Personal account manager for your success',
        highlight: true
      },
      {
        icon: <Shield className="h-4 w-4" />,
        title: 'SLA Guarantee',
        description: '99.9% uptime with service level agreement',
        highlight: true
      }
    ]
  }
];

const FEATURE_DESCRIPTIONS: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  'advanced-analytics': {
    title: 'Advanced Analytics',
    description: 'Unlock powerful insights with custom metrics, trend analysis, and advanced reporting capabilities.',
    icon: <TrendingUp className="h-8 w-8 text-blue-500" />
  },
  'custom-benchmarks': {
    title: 'Custom Benchmarks',
    description: 'Create and track your own performance benchmarks tailored to your business needs.',
    icon: <Settings className="h-8 w-8 text-green-500" />
  },
  'api-access': {
    title: 'API Access',
    description: 'Integrate GoodBuy data directly into your existing systems and workflows.',
    icon: <Database className="h-8 w-8 text-purple-500" />
  },
  'white-label': {
    title: 'White Label Solution',
    description: 'Brand the entire platform with your company identity and custom domain.',
    icon: <Crown className="h-8 w-8 text-yellow-500" />
  }
};

export function AccessDeniedPage({
  feature,
  currentTier,
  requiredTier,
  className
}: AccessDeniedPageProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const featureInfo = FEATURE_DESCRIPTIONS[feature] || {
    title: 'Premium Feature',
    description: 'This feature is available with higher tier plans.',
    icon: <Lock className="h-8 w-8 text-gray-500" />
  };

  const requiredPlan = TIER_PLANS.find(plan => plan.tier === requiredTier);
  const currentPlan = TIER_PLANS.find(plan => plan.tier === currentTier);

  const handleUpgrade = async (targetTier: SubscriptionTier) => {
    setIsUpgrading(true);
    try {
      // Redirect to Stripe Checkout
      const response = await fetch('/api/subscription/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier })
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setIsUpgrading(false);
    }
  };

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6", className)}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-full shadow-lg">
              {featureInfo.icon}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {featureInfo.title} Requires an Upgrade
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            {featureInfo.description}
          </p>

          <Badge variant="outline" className="text-sm">
            Available with {requiredPlan?.name} plan and above
          </Badge>
        </div>

        {/* Feature Preview */}
        <Card className="mb-8 border-2 border-dashed border-gray-300 bg-gray-50/50">
          <CardContent className="p-8 text-center">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Feature Preview Locked
            </h3>
            <p className="text-gray-600 mb-6">
              Upgrade to {requiredPlan?.name} to unlock this feature and start exploring its full potential.
            </p>
            <Button
              onClick={() => handleUpgrade(requiredTier)}
              disabled={isUpgrading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpgrading ? 'Processing...' : `Upgrade to ${requiredPlan?.name}`}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Tier Comparison */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-8">Choose Your Plan</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIER_PLANS.map((plan) => {
              const isCurrentPlan = plan.tier === currentTier;
              const isRequiredOrHigher = getTierLevel(plan.tier) >= getTierLevel(requiredTier);

              return (
                <Card
                  key={plan.tier}
                  className={cn(
                    "relative transition-all duration-200",
                    isCurrentPlan && "ring-2 ring-gray-400",
                    plan.popular && "ring-2 ring-blue-500 shadow-lg",
                    isRequiredOrHigher && !isCurrentPlan && "hover:shadow-xl hover:scale-105"
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600">
                      Most Popular
                    </Badge>
                  )}

                  {isCurrentPlan && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-600">
                      Current Plan
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className={cn("inline-flex p-2 rounded-lg mb-2", plan.color)}>
                      {plan.icon}
                    </div>

                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <div className="text-3xl font-bold">
                      {plan.price}
                      <span className="text-sm font-normal text-gray-600">/month</span>
                    </div>
                    <p className="text-gray-600">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex items-start space-x-3",
                            feature.highlight && "bg-blue-50 p-2 rounded-lg"
                          )}
                        >
                          <Check className={cn(
                            "h-4 w-4 mt-0.5 flex-shrink-0",
                            feature.highlight ? "text-blue-600" : "text-green-500"
                          )} />
                          <div>
                            <p className={cn(
                              "font-medium",
                              feature.highlight && "text-blue-900"
                            )}>
                              {feature.title}
                            </p>
                            <p className={cn(
                              "text-sm text-gray-600",
                              feature.highlight && "text-blue-700"
                            )}>
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="pt-4">
                      {isCurrentPlan ? (
                        <Button variant="outline" className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : isRequiredOrHigher ? (
                        <Button
                          onClick={() => handleUpgrade(plan.tier)}
                          disabled={isUpgrading}
                          className={cn(
                            "w-full",
                            plan.tier === requiredTier && "bg-blue-600 hover:bg-blue-700"
                          )}
                        >
                          {isUpgrading ? 'Processing...' : `Upgrade to ${plan.name}`}
                        </Button>
                      ) : (
                        <Button variant="ghost" className="w-full" disabled>
                          Not Available
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Value Proposition */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">
              Unlock Your Business Potential
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of businesses that have upgraded to access advanced features
              and drive better results with GoodBuy's powerful analytics platform.
            </p>
            <div className="flex justify-center space-x-8 text-center">
              <div>
                <div className="text-3xl font-bold">10,000+</div>
                <div className="text-sm opacity-80">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-sm opacity-80">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm opacity-80">Support</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to compare tier levels
function getTierLevel(tier: SubscriptionTier): number {
  const levels = { free: 0, professional: 1, enterprise: 2 };
  return levels[tier] || 0;
}