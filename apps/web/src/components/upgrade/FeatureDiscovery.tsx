'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Lock,
  Star,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Settings,
  Database,
  Crown,
  Zap,
  Users,
  Shield,
  Sparkles,
  Eye,
  Play,
  ChevronRight
} from 'lucide-react';
import { SubscriptionTier } from '@/types/subscription';
import { cn } from '@/lib/utils';
import { tierUpgradeHandler } from '@/lib/subscription/tier-upgrade-handler';

interface Feature {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: React.ReactNode;
  tier: SubscriptionTier;
  category: string;
  valueProposition: string;
  usageMetrics?: {
    potential: string;
    savings: string;
    efficiency: string;
  };
  previewImages?: string[];
  demoUrl?: string;
  locked: boolean;
}

interface FeatureDiscoveryProps {
  currentTier: SubscriptionTier;
  onUpgrade?: (tier: SubscriptionTier) => void;
  className?: string;
}

const FEATURES: Feature[] = [
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Deep insights with custom metrics and trend analysis',
    longDescription: 'Unlock powerful analytics capabilities including custom KPI tracking, advanced trend analysis, predictive modeling, and detailed performance breakdowns. Get actionable insights that drive business decisions.',
    icon: <TrendingUp className="h-6 w-6" />,
    tier: 'professional',
    category: 'Analytics',
    valueProposition: 'Increase decision-making accuracy by 40% with data-driven insights',
    usageMetrics: {
      potential: '2.5x faster analysis',
      savings: '$5,000/month in consultant fees',
      efficiency: '60% reduction in reporting time'
    },
    demoUrl: '/demo/advanced-analytics',
    locked: true
  },
  {
    id: 'custom-benchmarks',
    name: 'Custom Benchmarks',
    description: 'Create and track your own performance benchmarks',
    longDescription: 'Build custom benchmark suites tailored to your industry and business model. Compare performance against competitors, track improvements over time, and set data-driven goals.',
    icon: <Settings className="h-6 w-6" />,
    tier: 'professional',
    category: 'Performance',
    valueProposition: 'Outperform competitors by 25% with targeted benchmarking',
    usageMetrics: {
      potential: '3x better goal tracking',
      savings: '$8,000/month in external benchmarking',
      efficiency: '45% faster performance reviews'
    },
    demoUrl: '/demo/custom-benchmarks',
    locked: true
  },
  {
    id: 'api-access',
    name: 'API Access',
    description: 'Integrate GoodBuy data into your existing systems',
    longDescription: 'Connect GoodBuy\'s powerful analytics directly to your CRM, ERP, and business intelligence tools. Real-time data synchronization and automated workflows.',
    icon: <Database className="h-6 w-6" />,
    tier: 'professional',
    category: 'Integration',
    valueProposition: 'Save 15 hours/week with automated data integration',
    usageMetrics: {
      potential: '10x faster data access',
      savings: '$12,000/month in development costs',
      efficiency: '80% reduction in manual data entry'
    },
    locked: true
  },
  {
    id: 'white-label',
    name: 'White Label Solution',
    description: 'Brand the platform with your company identity',
    longDescription: 'Completely customize the platform with your branding, custom domain, and tailored user experience. Present GoodBuy as your own proprietary solution.',
    icon: <Crown className="h-6 w-6" />,
    tier: 'enterprise',
    category: 'Branding',
    valueProposition: 'Increase client retention by 35% with branded experience',
    usageMetrics: {
      potential: '5x higher brand recognition',
      savings: '$25,000/month in custom development',
      efficiency: '90% faster client onboarding'
    },
    locked: true
  },
  {
    id: 'custom-integrations',
    name: 'Custom Integrations',
    description: 'Build custom integrations with your existing tools',
    longDescription: 'Our development team will build custom integrations specifically for your tech stack. Connect to any system with dedicated support and ongoing maintenance.',
    icon: <Zap className="h-6 w-6" />,
    tier: 'enterprise',
    category: 'Integration',
    valueProposition: 'Unlock 100% of your data potential with seamless integration',
    usageMetrics: {
      potential: 'Unlimited system connections',
      savings: '$50,000/month in development costs',
      efficiency: '95% reduction in data silos'
    },
    locked: true
  },
  {
    id: 'dedicated-manager',
    name: 'Dedicated Account Manager',
    description: 'Personal account manager for your success',
    longDescription: 'Get a dedicated account manager who understands your business goals and helps optimize your GoodBuy usage. Weekly check-ins, custom training, and strategic guidance.',
    icon: <Users className="h-6 w-6" />,
    tier: 'enterprise',
    category: 'Support',
    valueProposition: 'Achieve ROI 3x faster with dedicated success management',
    usageMetrics: {
      potential: '24/7 priority support',
      savings: '$20,000/month in training costs',
      efficiency: '70% faster feature adoption'
    },
    locked: true
  }
];

export function FeatureDiscovery({ currentTier, onUpgrade, className }: FeatureDiscoveryProps) {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUpgradeRecommendations();
  }, [currentTier]);

  const loadUpgradeRecommendations = async () => {
    try {
      const recs = await tierUpgradeHandler.getUpgradeRecommendations('current-user');
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const getAvailableFeatures = () => {
    return FEATURES.filter(feature => {
      const tierLevel = getTierLevel(feature.tier);
      const currentLevel = getTierLevel(currentTier);
      return tierLevel > currentLevel;
    });
  };

  const getFeaturesByTier = () => {
    const features = getAvailableFeatures();
    const professionalFeatures = features.filter(f => f.tier === 'professional');
    const enterpriseFeatures = features.filter(f => f.tier === 'enterprise');

    return { professionalFeatures, enterpriseFeatures };
  };

  const handleFeatureSelect = (feature: Feature) => {
    setSelectedFeature(feature);
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (onUpgrade) {
      onUpgrade(tier);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/subscription/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier })
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setIsLoading(false);
    }
  };

  const { professionalFeatures, enterpriseFeatures } = getFeaturesByTier();

  if (getAvailableFeatures().length === 0) {
    return (
      <Card className={cn("p-8 text-center", className)}>
        <Sparkles className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">All Features Unlocked!</h3>
        <p className="text-gray-600">You have access to all premium features. Start exploring!</p>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Discover Premium Features</h2>
        <p className="text-gray-600 text-lg">
          Unlock powerful capabilities to take your business to the next level
        </p>
      </div>

      {/* Upgrade Recommendations */}
      {recommendations && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Recommended: {recommendations.recommended === 'professional' ? 'Professional' : 'Enterprise'} Plan
                </h3>
                <p className="text-blue-700 text-sm">
                  Based on your usage patterns, upgrading could save you {recommendations.savings || '$5,000'}/month
                </p>
              </div>
              <Button
                onClick={() => handleUpgrade(recommendations.recommended)}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Upgrade Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Professional Features */}
      {professionalFeatures.length > 0 && (
        <div>
          <div className="flex items-center mb-6">
            <Zap className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-2xl font-bold">Professional Features</h3>
            <Badge className="ml-4 bg-blue-600">$49/month</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {professionalFeatures.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onSelect={handleFeatureSelect}
                onUpgrade={() => handleUpgrade('professional')}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Enterprise Features */}
      {enterpriseFeatures.length > 0 && (
        <div>
          <div className="flex items-center mb-6">
            <Crown className="h-6 w-6 text-purple-600 mr-2" />
            <h3 className="text-2xl font-bold">Enterprise Features</h3>
            <Badge className="ml-4 bg-purple-600">$199/month</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enterpriseFeatures.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onSelect={handleFeatureSelect}
                onUpgrade={() => handleUpgrade('enterprise')}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <FeatureDetailModal
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
          onUpgrade={handleUpgrade}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

interface FeatureCardProps {
  feature: Feature;
  onSelect: (feature: Feature) => void;
  onUpgrade: () => void;
  isLoading: boolean;
}

function FeatureCard({ feature, onSelect, onUpgrade, isLoading }: FeatureCardProps) {
  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-dashed border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
            {feature.icon}
          </div>
          <Lock className="h-4 w-4 text-gray-400" />
        </div>

        <CardTitle className="text-lg">{feature.name}</CardTitle>
        <Badge variant="outline" className="w-fit">
          {feature.category}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-gray-600 text-sm">{feature.description}</p>

        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-blue-900 text-sm font-medium">
            {feature.valueProposition}
          </p>
        </div>

        {feature.usageMetrics && (
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Potential:</span>
              <span className="font-medium">{feature.usageMetrics.potential}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Savings:</span>
              <span className="font-medium text-green-600">{feature.usageMetrics.savings}</span>
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(feature)}
            className="w-full"
          >
            <Eye className="mr-2 h-4 w-4" />
            Learn More
          </Button>

          <Button
            size="sm"
            onClick={onUpgrade}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Processing...' : 'Unlock Feature'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface FeatureDetailModalProps {
  feature: Feature;
  onClose: () => void;
  onUpgrade: (tier: SubscriptionTier) => void;
  isLoading: boolean;
}

function FeatureDetailModal({ feature, onClose, onUpgrade, isLoading }: FeatureDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                {feature.icon}
              </div>
              <div>
                <CardTitle className="text-xl">{feature.name}</CardTitle>
                <Badge className="mt-1">
                  {feature.tier === 'professional' ? 'Professional' : 'Enterprise'}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-gray-700">{feature.longDescription}</p>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Value Proposition</h4>
            <p className="text-blue-800">{feature.valueProposition}</p>
          </div>

          {feature.usageMetrics && (
            <div>
              <h4 className="font-semibold mb-3">Expected Impact</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-green-800 font-semibold">Potential</div>
                  <div className="text-green-600 text-sm">{feature.usageMetrics.potential}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-blue-800 font-semibold">Savings</div>
                  <div className="text-blue-600 text-sm">{feature.usageMetrics.savings}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-purple-800 font-semibold">Efficiency</div>
                  <div className="text-purple-600 text-sm">{feature.usageMetrics.efficiency}</div>
                </div>
              </div>
            </div>
          )}

          {feature.demoUrl && (
            <div>
              <Button variant="outline" className="w-full mb-4">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </div>
          )}

          <Separator />

          <div className="flex space-x-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button
              onClick={() => onUpgrade(feature.tier)}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Processing...' : `Upgrade to ${feature.tier === 'professional' ? 'Professional' : 'Enterprise'}`}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getTierLevel(tier: SubscriptionTier): number {
  const levels = { free: 0, professional: 1, enterprise: 2 };
  return levels[tier] || 0;
}