'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Lock,
  Crown,
  Zap,
  ArrowRight,
  Eye,
  Play,
  Star,
  TrendingUp,
  Users,
  Shield,
  ChevronRight,
  Gift,
  Sparkles
} from 'lucide-react';
import { SubscriptionTier } from '@/types/subscription';
import { cn } from '@/lib/utils';

interface GracefulDenialProps {
  feature: string;
  requiredTier: SubscriptionTier;
  currentTier: SubscriptionTier;
  context?: 'navigation' | 'action' | 'api' | 'component';
  customMessage?: string;
  onUpgrade?: (tier: SubscriptionTier) => void;
  onDismiss?: () => void;
  className?: string;
}

interface DenialTemplate {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaText: string;
  benefits: string[];
  previewAvailable?: boolean;
}

const DENIAL_TEMPLATES: Record<string, DenialTemplate> = {
  'advanced-analytics': {
    icon: <TrendingUp className="h-8 w-8 text-blue-500" />,
    title: 'Advanced Analytics',
    description: 'Unlock powerful insights with custom metrics, trend analysis, and predictive modeling.',
    ctaText: 'Upgrade for Advanced Analytics',
    benefits: [
      'Custom KPI tracking',
      'Predictive trend analysis',
      'Advanced data visualization',
      'Export capabilities'
    ],
    previewAvailable: true
  },
  'custom-benchmarks': {
    icon: <Star className="h-8 w-8 text-green-500" />,
    title: 'Custom Benchmarks',
    description: 'Create and track your own performance benchmarks tailored to your business.',
    ctaText: 'Unlock Custom Benchmarks',
    benefits: [
      'Industry-specific benchmarks',
      'Competitor comparisons',
      'Goal tracking',
      'Performance alerts'
    ],
    previewAvailable: true
  },
  'api-access': {
    icon: <Shield className="h-8 w-8 text-purple-500" />,
    title: 'API Access',
    description: 'Integrate GoodBuy data directly into your existing systems and workflows.',
    ctaText: 'Get API Access',
    benefits: [
      'RESTful API endpoints',
      'Real-time data sync',
      'Webhook notifications',
      'Developer documentation'
    ],
    previewAvailable: false
  },
  'white-label': {
    icon: <Crown className="h-8 w-8 text-yellow-500" />,
    title: 'White Label Solution',
    description: 'Brand the entire platform with your company identity and custom domain.',
    ctaText: 'Enable White Label',
    benefits: [
      'Custom branding',
      'Your domain',
      'Logo integration',
      'Color customization'
    ],
    previewAvailable: true
  },
  default: {
    icon: <Lock className="h-8 w-8 text-gray-500" />,
    title: 'Premium Feature',
    description: 'This feature is available with higher tier plans.',
    ctaText: 'Upgrade Your Plan',
    benefits: [
      'Enhanced functionality',
      'Priority support',
      'Advanced features',
      'Better performance'
    ],
    previewAvailable: false
  }
};

const CONTEXT_STYLES = {
  navigation: 'border-l-4 border-l-blue-500 bg-blue-50',
  action: 'border border-yellow-400 bg-yellow-50',
  api: 'border border-red-400 bg-red-50',
  component: 'border-2 border-dashed border-gray-300 bg-gray-50'
};

export function GracefulDenial({
  feature,
  requiredTier,
  currentTier,
  context = 'component',
  customMessage,
  onUpgrade,
  onDismiss,
  className
}: GracefulDenialProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const template = DENIAL_TEMPLATES[feature] || DENIAL_TEMPLATES.default;
  const tierName = requiredTier === 'professional' ? 'Professional' : 'Enterprise';
  const tierPrice = requiredTier === 'professional' ? '$49' : '$199';

  const handleUpgrade = async () => {
    if (onUpgrade) {
      onUpgrade(requiredTier);
      return;
    }

    setIsUpgrading(true);
    try {
      const response = await fetch('/api/subscription/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: requiredTier })
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setIsUpgrading(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
    // You could implement a modal or redirect to a demo page
  };

  // Inline denial for small components
  if (context === 'component') {
    return (
      <Card className={cn(CONTEXT_STYLES[context], className)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {template.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">
                {template.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {customMessage || template.description}
              </p>
            </div>

            <div className="flex-shrink-0 space-y-2">
              <Badge variant="outline" className="text-xs">
                {tierName}
              </Badge>
              <Button
                size="sm"
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full text-xs"
              >
                {isUpgrading ? 'Loading...' : 'Upgrade'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Navigation-style denial
  if (context === 'navigation') {
    return (
      <div className={cn(CONTEXT_STYLES[context], "p-4 m-2 rounded-lg", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Lock className="h-5 w-5 text-blue-600" />
            <div>
              <span className="font-medium text-blue-900">
                {template.title} - {tierName} Feature
              </span>
              <p className="text-sm text-blue-700 mt-1">
                Upgrade to access this feature
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Upgrade
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // Full-featured denial modal/page
  return (
    <Card className={cn("max-w-2xl mx-auto", className)}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full">
            {template.icon}
          </div>
        </div>

        <CardTitle className="text-2xl mb-2">
          {template.title}
        </CardTitle>

        <p className="text-gray-600 text-lg">
          {customMessage || template.description}
        </p>

        <div className="flex justify-center items-center space-x-2 mt-4">
          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            {tierName} Feature
          </Badge>
          <span className="text-sm text-gray-500">
            {tierPrice}/month
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Feature Benefits */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
            What You'll Get
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {template.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0" />
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Upgrade Incentive */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                Limited Time: 30% Off First Month
              </h4>
              <p className="text-blue-700 text-sm">
                Upgrade now and save on your first billing cycle
              </p>
            </div>
            <Gift className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          {template.previewAvailable && (
            <Button
              variant="outline"
              onClick={handlePreview}
              className="flex-1"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview Feature
            </Button>
          )}

          <Button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className={cn(
              "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
              template.previewAvailable ? "flex-1" : "w-full"
            )}
          >
            {isUpgrading ? 'Processing...' : template.ctaText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Dismissal Option */}
        {onDismiss && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-gray-500 hover:text-gray-700"
            >
              Maybe later
            </Button>
          </div>
        )}

        {/* Social Proof */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-center space-x-8 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">10,000+</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">24/7</div>
              <div className="text-sm text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Feature Preview Modal */}
      {showPreview && (
        <FeaturePreviewModal
          feature={feature}
          onClose={() => setShowPreview(false)}
          onUpgrade={handleUpgrade}
        />
      )}
    </Card>
  );
}

interface FeaturePreviewModalProps {
  feature: string;
  onClose: () => void;
  onUpgrade: () => void;
}

function FeaturePreviewModal({ feature, onClose, onUpgrade }: FeaturePreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Feature Preview: {DENIAL_TEMPLATES[feature]?.title}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Feature Demo Content */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-lg text-center">
            <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Interactive Demo
            </h3>
            <p className="text-gray-600">
              See how {DENIAL_TEMPLATES[feature]?.title} can transform your workflow
            </p>
          </div>

          <div className="flex space-x-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close Preview
            </Button>
            <Button onClick={onUpgrade} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Upgrade to Unlock
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}