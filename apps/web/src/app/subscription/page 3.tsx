'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  PricingCard, 
  defaultPricingTiers, 
  PricingTier 
} from '@/components/premium/PricingCard'
import { SubscriptionManager } from '@/components/premium/SubscriptionManager'
import { TrialBanner } from '@/components/premium/TrialBanner'
import { StripeProvider } from '@/components/premium/StripeProvider'
import { PaymentForm } from '@/components/premium/PaymentForm'
import { 
  CreditCard, 
  Crown, 
  Shield, 
  Zap, 
  TrendingUp, 
  Users, 
  CheckCircle,
  AlertCircle
} from 'lucide-react'

// Mock user data - in production this would come from auth context
const MOCK_USER = {
  id: 'user-123',
  email: 'user@example.com',
  businessName: 'Example Business',
  subscriptionTier: 'FREE' as const,
}

interface PremiumStatus {
  user: {
    email: string
    businessName: string
    currentTier: string
  }
  subscription: {
    id: string
    status: string
    tier: string
    billingCycle: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    trialEndsAt: string | null
  } | null
  trial: {
    isOnTrial: boolean
    daysRemaining: number
    trialEndsAt: string | null
  }
  features: Record<string, any>
}

export default function SubscriptionPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'manage'>('plans')
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<{ priceId: string; planName: string } | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchPremiumStatus()
  }, [])

  useEffect(() => {
    if (premiumStatus?.subscription) {
      setActiveTab('manage')
    }
  }, [premiumStatus])

  const fetchPremiumStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/premium/status?userId=${MOCK_USER.id}`)
      const data = await response.json()

      if (response.ok) {
        setPremiumStatus(data)
      }
    } catch (error) {
      console.error('Error fetching premium status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPlan = async (priceId: string, planName: string) => {
    setSelectedPlan({ priceId, planName })
    setActionLoading(true)

    try {
      const response = await fetch('/api/stripe/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: MOCK_USER.id,
          email: MOCK_USER.email,
          priceId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      setClientSecret(data.clientSecret)
    } catch (error) {
      console.error('Error creating subscription:', error)
      alert('Failed to start subscription process. Please try again.')
      setSelectedPlan(null)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    setSelectedPlan(null)
    setClientSecret(null)
    setActiveTab('manage')
    fetchPremiumStatus()
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    alert(`Payment failed: ${error}`)
  }

  const handleUpgrade = () => {
    setActiveTab('plans')
  }

  const premiumFeatures = [
    {
      icon: Zap,
      title: 'AI-Powered Implementation Guides',
      description: 'Get detailed step-by-step guides for every improvement opportunity',
      tier: 'PREMIUM'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking & ROI Analysis',
      description: 'Track your improvements and measure real business impact',
      tier: 'PREMIUM'
    },
    {
      icon: CreditCard,
      title: 'Professional PDF Reports',
      description: 'Generate comprehensive reports for stakeholders and investors',
      tier: 'PREMIUM'
    },
    {
      icon: Shield,
      title: 'Advanced Analytics Dashboard',
      description: 'Access trend analysis, forecasting, and performance metrics',
      tier: 'PREMIUM'
    },
    {
      icon: Users,
      title: 'Priority Support',
      description: 'Get faster response times and dedicated customer success',
      tier: 'PREMIUM'
    },
    {
      icon: Crown,
      title: 'Industry Benchmarking',
      description: 'Compare your performance against industry standards',
      tier: 'ENTERPRISE'
    }
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Subscription Management</h1>
          <p className="text-xl text-muted-foreground">
            Manage your premium subscription and access advanced business insights
          </p>
        </div>

        {/* Trial Banner */}
        {premiumStatus?.trial.isOnTrial && (
          <TrialBanner userId={MOCK_USER.id} onUpgrade={handleUpgrade} />
        )}

        {/* Current Status Summary */}
        {premiumStatus && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    {premiumStatus.user.currentTier === 'FREE' ? (
                      <Crown className="w-6 h-6 text-white" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{premiumStatus.user.businessName}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant={premiumStatus.user.currentTier === 'FREE' ? 'secondary' : 'default'}>
                        {premiumStatus.user.currentTier} Plan
                      </Badge>
                      {premiumStatus.subscription && (
                        <Badge variant="outline">
                          {premiumStatus.subscription.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {premiumStatus.user.currentTier === 'FREE' && (
                  <Button onClick={() => setActiveTab('plans')}>
                    Upgrade Now
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'plans' | 'manage')}>
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="plans">Pricing Plans</TabsTrigger>
            <TabsTrigger value="manage">Manage Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-8">
            {selectedPlan && clientSecret ? (
              <StripeProvider clientSecret={clientSecret}>
                <div className="max-w-md mx-auto">
                  <PaymentForm
                    planName={selectedPlan.planName}
                    trialDays={14}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </div>
              </StripeProvider>
            ) : (
              <>
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'annual')}>
                      <TabsList>
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        <TabsTrigger value="annual">
                          Annual
                          <Badge className="ml-2 text-xs bg-green-100 text-green-800">Save 17%</Badge>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {defaultPricingTiers.map((tier) => (
                    <PricingCard
                      key={tier.id}
                      tier={tier}
                      billingCycle={billingCycle}
                      onSelectPlan={handleSelectPlan}
                      isCurrentPlan={premiumStatus?.user.currentTier === tier.name.toUpperCase()}
                      isLoading={actionLoading && selectedPlan?.priceId === (billingCycle === 'monthly' ? tier.monthlyPriceId : tier.annualPriceId)}
                    />
                  ))}
                </div>

                {/* Feature Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>What's Included</CardTitle>
                    <CardDescription>
                      Compare features across our different plans
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {premiumFeatures.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            feature.tier === 'PREMIUM' ? 'bg-blue-100' : 'bg-purple-100'
                          }`}>
                            <feature.icon className={`w-4 h-4 ${
                              feature.tier === 'PREMIUM' ? 'text-blue-600' : 'text-purple-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{feature.title}</h4>
                              <Badge variant={feature.tier === 'PREMIUM' ? 'default' : 'secondary'}>
                                {feature.tier}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            {premiumStatus?.subscription ? (
              <SubscriptionManager 
                userId={MOCK_USER.id} 
                onSubscriptionChange={fetchPremiumStatus}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <AlertCircle className="mx-auto w-12 h-12 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">No Active Subscription</h3>
                      <p className="text-muted-foreground">
                        You don't have an active subscription yet. Choose a plan to get started.
                      </p>
                    </div>
                    <Button onClick={() => setActiveTab('plans')}>
                      View Pricing Plans
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}