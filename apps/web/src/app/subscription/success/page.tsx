'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Sparkles,
  ArrowRight,
  Crown,
  Zap,
  Users,
  Calendar,
  CreditCard,
  Mail,
  Gift
} from 'lucide-react';
import { SubscriptionTier } from '@/types/subscription';
import { FeatureCelebration } from '@/components/upgrade/FeatureCelebration';
import { tierUpgradeHandler } from '@/lib/subscription/tier-upgrade-handler';

interface SubscriptionDetails {
  tier: SubscriptionTier;
  sessionId: string;
  amount: number;
  currency: string;
  nextBillingDate: Date;
  trialEnd?: Date;
  features: string[];
}

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (isLoaded && user && sessionId) {
      verifySubscription(sessionId);
    } else if (isLoaded && !sessionId) {
      setError('No session ID provided');
      setIsLoading(false);
    }
  }, [isLoaded, user, sessionId]);

  const verifySubscription = async (sessionId: string) => {
    try {
      setIsLoading(true);

      // Verify the checkout session and get subscription details
      const response = await fetch('/api/subscription/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        throw new Error('Failed to verify subscription');
      }

      const data = await response.json();
      setSubscriptionDetails(data);

      // Trigger celebration for new features
      setTimeout(() => {
        setShowCelebration(true);
      }, 1000);

      // Track successful upgrade
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'upgrade_success', {
          user_id: user?.id,
          tier: data.tier,
          amount: data.amount,
          currency: data.currency
        });
      }

    } catch (error) {
      console.error('Error verifying subscription:', error);
      setError('Failed to verify your subscription. Please contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // Redirect to dashboard with success parameter
    router.push('/dashboard?upgraded=true');
  };

  const handleContactSupport = () => {
    window.open('mailto:support@goodbuy.com', '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Verifying Your Subscription</h3>
            <p className="text-gray-600">Please wait while we confirm your upgrade...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-red-900">Verification Error</h3>
            <p className="text-red-700 mb-6">{error}</p>
            <div className="space-y-3">
              <Button
                onClick={handleContactSupport}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Contact Support
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subscriptionDetails) {
    return null;
  }

  const tierInfo = {
    professional: {
      name: 'Professional',
      icon: <Zap className="h-8 w-8 text-blue-500" />,
      color: 'text-blue-600',
      bgColor: 'from-blue-50 to-purple-50'
    },
    enterprise: {
      name: 'Enterprise',
      icon: <Crown className="h-8 w-8 text-purple-500" />,
      color: 'text-purple-600',
      bgColor: 'from-purple-50 to-pink-50'
    }
  };

  const currentTierInfo = tierInfo[subscriptionDetails.tier];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTierInfo.bgColor} p-6`}>
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              {/* Animated sparkles */}
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500 animate-pulse" />
              <Sparkles className="absolute -bottom-1 -left-2 h-4 w-4 text-blue-500 animate-bounce" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to {currentTierInfo.name}! 🎉
          </h1>

          <p className="text-xl text-gray-600 mb-6">
            Your subscription has been successfully activated. You now have access to all premium features!
          </p>

          <Badge className={`${currentTierInfo.color} text-lg px-4 py-2`}>
            {currentTierInfo.name} Plan Activated
          </Badge>
        </div>

        {/* Subscription Details */}
        <Card className="mb-8 border-2 border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="flex items-center space-x-3">
              {currentTierInfo.icon}
              <span>Subscription Details</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-semibold">{currentTierInfo.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">
                    {subscriptionDetails.currency.toUpperCase()} ${subscriptionDetails.amount}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Session ID:</span>
                  <span className="font-mono text-sm text-gray-500">
                    {subscriptionDetails.sessionId.slice(-12)}...
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Next Billing:
                  </span>
                  <span className="font-semibold">
                    {subscriptionDetails.nextBillingDate.toLocaleDateString()}
                  </span>
                </div>

                {subscriptionDetails.trialEnd && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center">
                      <Gift className="h-4 w-4 mr-2" />
                      Trial Ends:
                    </span>
                    <span className="font-semibold text-blue-600">
                      {subscriptionDetails.trialEnd.toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Status:
                  </span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Unlocked */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              <span>Features Unlocked</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptionDetails.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-green-900">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-500" />
              <span>What's Next?</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Explore Your New Features</h4>
                  <p className="text-blue-700 text-sm">
                    Head to your dashboard to start using advanced analytics, custom benchmarks, and more.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-purple-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900">Set Up Your Preferences</h4>
                  <p className="text-purple-700 text-sm">
                    Customize your analytics dashboard and configure notifications for maximum value.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-green-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Get Support When Needed</h4>
                  <p className="text-green-700 text-sm">
                    As a premium subscriber, you have access to priority support. Contact us anytime!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleContinue}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
            size="lg"
          >
            Explore Your Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            onClick={handleContactSupport}
            size="lg"
            className="px-8 py-3"
          >
            <Mail className="mr-2 h-5 w-5" />
            Contact Support
          </Button>
        </div>

        {/* Feature Celebration Modal */}
        <FeatureCelebration
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
        />
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
