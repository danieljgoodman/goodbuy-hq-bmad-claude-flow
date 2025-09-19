'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Party,
  Star,
  Crown,
  Zap,
  ArrowRight,
  CheckCircle,
  Gift,
  Rocket,
  Trophy
} from 'lucide-react';
import { SubscriptionTier } from '@/types/subscription';
import { tierUpgradeHandler, FeatureUnlockEvent } from '@/lib/subscription/tier-upgrade-handler';
import { cn } from '@/lib/utils';

interface FeatureCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function FeatureCelebration({ isOpen, onClose, className }: FeatureCelebrationProps) {
  const [celebrationData, setCelebrationData] = useState<FeatureUnlockEvent | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Subscribe to feature unlock events
    const unsubscribe = tierUpgradeHandler.onFeatureUnlock((event) => {
      setCelebrationData(event);
      setCurrentStep(0);
      setIsVisible(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen]);

  const handleNext = () => {
    if (!celebrationData) return;

    if (currentStep < celebrationData.features.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setCelebrationData(null);
      setCurrentStep(0);
      onClose();
    }, 300);
  };

  const handleExploreFeatures = () => {
    // Navigate to features page or trigger onboarding
    window.location.href = '/dashboard';
  };

  if (!isVisible || !celebrationData) return null;

  const currentFeature = celebrationData.features[currentStep];
  const isLastStep = currentStep === celebrationData.features.length - 1;

  return (
    <div className={cn(
      "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 transition-opacity duration-300",
      isVisible ? "opacity-100" : "opacity-0",
      className
    )}>
      <Card className={cn(
        "max-w-md w-full transform transition-all duration-300",
        isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
      )}>
        {/* Celebration Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 text-white p-6 rounded-t-lg">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <Sparkles className="absolute top-2 left-4 h-4 w-4 animate-pulse opacity-80" />
            <Star className="absolute top-4 right-6 h-3 w-3 animate-bounce opacity-60" />
            <Trophy className="absolute bottom-2 left-6 h-5 w-5 animate-pulse opacity-70" />
            <Gift className="absolute bottom-4 right-4 h-4 w-4 animate-bounce opacity-80" />
          </div>

          <div className="relative text-center">
            <div className="mb-4">
              {celebrationData.tier === 'professional' ? (
                <Zap className="h-12 w-12 mx-auto text-yellow-300 animate-pulse" />
              ) : (
                <Crown className="h-12 w-12 mx-auto text-yellow-300 animate-pulse" />
              )}
            </div>

            <h2 className="text-2xl font-bold mb-2 animate-fade-in">
              {celebrationData.celebrationData.title}
            </h2>

            <p className="text-blue-100 opacity-90 animate-fade-in animation-delay-200">
              {celebrationData.celebrationData.description}
            </p>

            <Badge className="mt-3 bg-white/20 text-white border-white/30 animate-fade-in animation-delay-400">
              Feature {currentStep + 1} of {celebrationData.features.length}
            </Badge>
          </div>
        </div>

        {/* Feature Content */}
        <CardContent className="p-6 space-y-6">
          {/* Feature Icon and Title */}
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
                <span className="text-3xl">{currentFeature.icon}</span>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {currentFeature.name}
            </h3>

            <p className="text-gray-600 text-sm leading-relaxed">
              {currentFeature.description}
            </p>
          </div>

          {/* Feature Highlight */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-semibold text-green-900">Now Available!</span>
            </div>
            <p className="text-green-800 text-sm">
              This feature is now active in your account and ready to use.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center space-x-2">
            {celebrationData.features.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "w-8 bg-blue-600"
                    : index < currentStep
                    ? "w-2 bg-green-500"
                    : "w-2 bg-gray-300"
                )}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {!isLastStep ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Skip Tour
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Next Feature
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={handleExploreFeatures}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  Explore Features
                </Button>
              </>
            )}
          </div>
        </CardContent>

        {/* Animated confetti for celebration */}
        {currentStep === 0 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute animate-bounce opacity-60",
                  i % 4 === 0 && "text-yellow-400",
                  i % 4 === 1 && "text-blue-400",
                  i % 4 === 2 && "text-pink-400",
                  i % 4 === 3 && "text-green-400"
                )}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              >
                ✨
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Celebration trigger component for manual testing
export function CelebrationTrigger() {
  const [showCelebration, setShowCelebration] = useState(false);

  const triggerCelebration = (tier: SubscriptionTier) => {
    const mockEvent: FeatureUnlockEvent = {
      features: tier === 'professional'
        ? ['advanced-analytics', 'custom-benchmarks', 'api-access']
        : ['white-label', 'custom-integrations', 'dedicated-manager'],
      tier,
      celebrationData: {
        title: `Welcome to ${tier === 'professional' ? 'Professional' : 'Enterprise'}! 🚀`,
        description: `You now have access to ${tier === 'professional' ? '4' : '8'} new features!`,
        features: tier === 'professional' ? [
          {
            name: 'Advanced Analytics',
            description: 'Deep insights with custom metrics and trend analysis',
            icon: '📊'
          },
          {
            name: 'Custom Benchmarks',
            description: 'Create and track your own performance benchmarks',
            icon: '🎯'
          },
          {
            name: 'API Access',
            description: 'Integrate GoodBuy data into your own systems',
            icon: '🔌'
          }
        ] : [
          {
            name: 'White Label',
            description: 'Brand the platform with your company identity',
            icon: '🏷️'
          },
          {
            name: 'Custom Integrations',
            description: 'Build custom integrations with your existing tools',
            icon: '🔗'
          },
          {
            name: 'Dedicated Manager',
            description: 'Personal account manager for your success',
            icon: '👨‍💼'
          }
        ]
      }
    };

    // Trigger the celebration
    tierUpgradeHandler.onFeatureUnlock(() => {})(mockEvent);
    setShowCelebration(true);
  };

  return (
    <div className="p-4 space-y-2">
      <Button onClick={() => triggerCelebration('professional')}>
        Test Professional Celebration
      </Button>
      <Button onClick={() => triggerCelebration('enterprise')}>
        Test Enterprise Celebration
      </Button>
      <FeatureCelebration
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
}