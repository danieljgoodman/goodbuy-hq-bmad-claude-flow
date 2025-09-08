'use client';

import { useState, useEffect } from 'react';
import { X, Crown, Sparkles, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUnifiedDashboardStore, useUpgradePrompt } from '@/stores/unified-dashboard-store';
import type { UpgradePrompt as UpgradePromptType } from '@/types/unified-dashboard';

interface UpgradePromptProps {
  context: 'export' | 'drill_down' | 'advanced_analysis' | 'consultation';
  feature: string;
  trigger?: string;
}

interface PromptVariant {
  id: string;
  headline: string;
  description: string;
  benefits: string[];
  callToAction: string;
  urgency?: string;
  design: 'modal' | 'banner' | 'inline' | 'sidebar';
}

const PROMPT_VARIANTS: Record<string, PromptVariant[]> = {
  export: [
    {
      id: 'export_professional',
      headline: 'Unlock Professional Export Features',
      description: 'Create stunning, branded reports with advanced templates and white-label options.',
      benefits: [
        'PowerPoint & custom templates',
        'White-label branding options',
        'Automated report scheduling',
        'Advanced export formats'
      ],
      callToAction: 'Upgrade to Premium',
      design: 'modal'
    },
    {
      id: 'export_banner',
      headline: 'Limited Export Options',
      description: 'Upgrade for professional templates and branding',
      benefits: ['Professional templates', 'Custom branding'],
      callToAction: 'See Premium Features',
      design: 'banner'
    }
  ],
  drill_down: [
    {
      id: 'analysis_deep',
      headline: 'Deep Dive Into Your Data',
      description: 'Advanced analytics, interactive charts, and AI-powered insights await.',
      benefits: [
        'Interactive data exploration',
        'Advanced filtering & comparisons',
        'AI-powered trend analysis',
        'Custom visualization options'
      ],
      callToAction: 'Start Premium Trial',
      urgency: 'Limited time: 14-day free trial',
      design: 'modal'
    },
    {
      id: 'analysis_inline',
      headline: 'More Analysis Available',
      description: 'Unlock advanced charts and comparisons',
      benefits: ['Interactive charts', 'Advanced filters'],
      callToAction: 'Upgrade Now',
      design: 'inline'
    }
  ],
  advanced_analysis: [
    {
      id: 'ai_insights',
      headline: 'AI-Powered Business Insights',
      description: 'Get personalized recommendations and predictive analytics for your business.',
      benefits: [
        'Predictive business modeling',
        'Personalized recommendations',
        'Industry benchmarking',
        'Risk assessment analysis'
      ],
      callToAction: 'Unlock AI Features',
      urgency: 'New: Advanced AI analysis now available',
      design: 'modal'
    }
  ],
  consultation: [
    {
      id: 'expert_consultation',
      headline: 'Expert Business Consultation',
      description: 'Schedule 1-on-1 sessions with our business analysts for personalized guidance.',
      benefits: [
        '1-on-1 expert consultations',
        'Personalized growth strategies',
        'Implementation roadmaps',
        'Ongoing business support'
      ],
      callToAction: 'Book Consultation',
      urgency: 'Book now: Limited slots available',
      design: 'sidebar'
    }
  ]
};

export function UpgradePrompts({ context, feature, trigger }: UpgradePromptProps) {
  const [selectedVariant, setSelectedVariant] = useState<PromptVariant | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const { trackUpgradeInteraction, showUpgradePrompt } = useUnifiedDashboardStore();
  const { visible, prompt } = useUpgradePrompt();

  useEffect(() => {
    // Determine which variant to show based on user behavior and A/B testing
    const variants = PROMPT_VARIANTS[context] || [];
    if (variants.length > 0) {
      // Simple A/B testing: randomly select variant
      const variant = variants[Math.floor(Math.random() * variants.length)];
      setSelectedVariant(variant);
      
      // Show prompt based on trigger conditions
      const shouldShow = determineShouldShow(context, feature, trigger);
      if (shouldShow) {
        setIsVisible(true);
        trackUpgradeInteraction('view', variant.id);
      }
    }
  }, [context, feature, trigger]);

  const determineShouldShow = (context: string, feature: string, trigger?: string): boolean => {
    // Logic to determine when to show upgrade prompts
    // This would typically involve checking user history, current session activity, etc.
    
    const showConditions = {
      export: !hasInteracted && Math.random() > 0.7, // 30% chance
      drill_down: trigger === 'advanced_chart_click',
      advanced_analysis: trigger === 'ai_feature_access',
      consultation: trigger === 'complex_analysis_complete'
    };

    return showConditions[context as keyof typeof showConditions] || false;
  };

  const handlePromptClick = () => {
    if (!selectedVariant) return;
    
    setHasInteracted(true);
    trackUpgradeInteraction('click', selectedVariant.id);
    
    // Navigate to upgrade page or show detailed modal
    if (selectedVariant.design === 'modal') {
      showUpgradePrompt(selectedVariant);
    } else {
      window.open('/premium/upgrade', '_blank');
    }
  };

  const handleDismiss = () => {
    if (!selectedVariant) return;
    
    setIsVisible(false);
    setHasInteracted(true);
    trackUpgradeInteraction('dismiss', selectedVariant.id);
  };

  const renderPromptContent = (variant: PromptVariant) => (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold text-lg">{variant.headline}</h3>
          </div>
          <p className="text-muted-foreground">{variant.description}</p>
          {variant.urgency && (
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-orange-600">{variant.urgency}</span>
            </div>
          )}
        </div>
        {variant.design !== 'modal' && (
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-sm">Premium Benefits:</h4>
        <ul className="space-y-1">
          {variant.benefits.map((benefit, index) => (
            <li key={index} className="flex items-center space-x-2 text-sm">
              <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button 
        onClick={handlePromptClick}
        className="w-full"
        size={variant.design === 'banner' ? 'sm' : 'default'}
      >
        {variant.callToAction}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );

  if (!selectedVariant || !isVisible) return null;

  // Render different prompt designs
  switch (selectedVariant.design) {
    case 'banner':
      return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-5 w-5 text-yellow-500" />
              <div>
                <h4 className="font-medium">{selectedVariant.headline}</h4>
                <p className="text-sm text-muted-foreground">{selectedVariant.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={handlePromptClick}>
                {selectedVariant.callToAction}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );

    case 'inline':
      return (
        <Card className="border-dashed border-blue-300 bg-blue-50/50">
          <CardContent className="p-4">
            {renderPromptContent(selectedVariant)}
          </CardContent>
        </Card>
      );

    case 'sidebar':
      return (
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Crown className="h-5 w-5 text-yellow-500 mr-2" />
              Premium Feature
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderPromptContent(selectedVariant)}
          </CardContent>
        </Card>
      );

    case 'modal':
      return (
        <Dialog open={visible} onOpenChange={() => setIsVisible(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Crown className="h-5 w-5 text-yellow-500 mr-2" />
                Upgrade to Premium
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {renderPromptContent(selectedVariant)}
            </div>
          </DialogContent>
        </Dialog>
      );

    default:
      return null;
  }
}

// Higher-order component to wrap features with upgrade prompts
export function withUpgradePrompt<T extends object>(
  Component: React.ComponentType<T>,
  context: UpgradePromptProps['context'],
  feature: string
) {
  return function UpgradeWrappedComponent(props: T) {
    const [showPrompt, setShowPrompt] = useState(false);

    const handleFeatureClick = () => {
      setShowPrompt(true);
    };

    return (
      <div className="relative">
        <Component {...props} />
        {showPrompt && (
          <UpgradePrompts
            context={context}
            feature={feature}
            trigger="feature_click"
          />
        )}
      </div>
    );
  };
}

// Context-aware upgrade prompt trigger
export function useUpgradePromptTrigger(context: UpgradePromptProps['context']) {
  const { trackUpgradeInteraction } = useUnifiedDashboardStore();

  return {
    triggerPrompt: (feature: string, trigger?: string) => {
      // Logic to determine and show appropriate upgrade prompt
      const event = new CustomEvent('showUpgradePrompt', {
        detail: { context, feature, trigger }
      });
      window.dispatchEvent(event);
      
      trackUpgradeInteraction('trigger', `${context}_${feature}`);
    }
  };
}