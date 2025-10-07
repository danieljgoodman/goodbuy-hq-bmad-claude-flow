'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Crown, Zap, TrendingUp, Users, Star } from 'lucide-react'
import { PricingCard, defaultPricingTiers } from './PricingCard'
import { StripeProvider } from './StripeProvider'
import { PaymentForm } from './PaymentForm'

interface UpgradePromptProps {
  feature?: string
  variant?: 'banner' | 'modal' | 'card'
  onUpgrade?: () => void
  userId?: string
  userEmail?: string
}

export function UpgradePrompt({ 
  feature = 'premium features',
  variant = 'card',
  onUpgrade,
  userId,
  userEmail
}: UpgradePromptProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{ priceId: string; planName: string } | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const premiumFeatures = [
    { icon: Zap, title: 'Advanced AI Analysis', description: 'Get deeper insights with our most advanced AI models' },
    { icon: TrendingUp, title: 'Progress Tracking', description: 'Track your improvements and ROI over time' },
    { icon: Crown, title: 'Premium Templates', description: 'Access professional implementation guides and templates' },
    { icon: Users, title: 'Priority Support', description: 'Get help when you need it most' },
    { icon: Star, title: 'Industry Benchmarks', description: 'Compare your business against industry standards' },
  ]

  const handleSelectPlan = async (priceId: string, planName: string) => {
    if (!userId || !userEmail) {
      alert('Please sign in to continue')
      return
    }

    setSelectedPlan({ priceId, planName })
    setIsLoading(true)

    try {
      const response = await fetch('/api/stripe/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userEmail,
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
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    setShowUpgradeModal(false)
    setSelectedPlan(null)
    setClientSecret(null)
    onUpgrade?.()
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    alert(`Payment failed: ${error}`)
  }

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="h-5 w-5" />
            <div>
              <p className="font-medium">Upgrade to Premium</p>
              <p className="text-sm opacity-90">Unlock {feature} and advanced AI insights</p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setShowUpgradeModal(true)}
          >
            Upgrade
          </Button>
        </div>
      </div>
    )
  }

  if (variant === 'modal') {
    return (
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upgrade to Premium</DialogTitle>
          </DialogHeader>
          {/* Modal content would go here */}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-2">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <CardTitle>Premium Feature</CardTitle>
          <CardDescription>
            Upgrade to premium to unlock {feature} and advanced AI-powered business insights
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {premiumFeatures.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <feature.icon className="h-4 w-4 text-purple-600" />
                <div className="text-sm">
                  <p className="font-medium">{feature.title}</p>
                  <p className="text-muted-foreground text-xs">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              14-day free trial
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Cancel anytime
            </Badge>
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            onClick={() => setShowUpgradeModal(true)}
          >
            Start Free Trial
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
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
                <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'annual')}>
                  <TabsList className="grid w-full grid-cols-2 max-w-xs mx-auto">
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="annual">
                      Annual
                      <Badge className="ml-2 text-xs bg-green-100 text-green-800">Save 17%</Badge>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value={billingCycle} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {defaultPricingTiers.map((tier) => (
                        <PricingCard
                          key={tier.id}
                          tier={tier}
                          billingCycle={billingCycle}
                          onSelectPlan={handleSelectPlan}
                          isLoading={isLoading && selectedPlan?.priceId === (billingCycle === 'monthly' ? tier.monthlyPriceId : tier.annualPriceId)}
                        />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-4 text-center">What's included with Premium?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {premiumFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <feature.icon className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{feature.title}</p>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}