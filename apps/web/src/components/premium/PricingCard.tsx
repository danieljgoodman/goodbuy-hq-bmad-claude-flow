'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

export interface PricingTier {
  id: string
  name: string
  description: string
  features: string[]
  monthlyPrice: number
  annualPrice: number
  monthlyPriceId: string
  annualPriceId: string
  popular?: boolean
  buttonText?: string
}

interface PricingCardProps {
  tier: PricingTier
  billingCycle: 'monthly' | 'annual'
  onSelectPlan: (priceId: string, planName: string) => void
  isCurrentPlan?: boolean
  isLoading?: boolean
}

export function PricingCard({
  tier,
  billingCycle,
  onSelectPlan,
  isCurrentPlan = false,
  isLoading = false
}: PricingCardProps) {
  const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.annualPrice
  const priceId = billingCycle === 'monthly' ? tier.monthlyPriceId : tier.annualPriceId
  const annualSavings = billingCycle === 'annual' ? Math.round(((tier.monthlyPrice * 12) - tier.annualPrice) / (tier.monthlyPrice * 12) * 100) : 0

  return (
    <Card className={`relative ${tier.popular ? 'border-primary shadow-lg' : ''}`}>
      {tier.popular && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
        <CardDescription>{tier.description}</CardDescription>
        
        <div className="mt-4">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold">${price}</span>
            <span className="text-muted-foreground ml-1">
              /{billingCycle === 'monthly' ? 'month' : 'year'}
            </span>
          </div>
          
          {billingCycle === 'annual' && annualSavings > 0 && (
            <div className="text-sm text-green-600 mt-1">
              Save {annualSavings}% annually
            </div>
          )}
          
          {billingCycle === 'annual' && (
            <div className="text-xs text-muted-foreground mt-1">
              ${Math.round(tier.annualPrice / 12)} per month
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {tier.features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full"
          variant={tier.popular ? "default" : "outline"}
          onClick={() => onSelectPlan(priceId, tier.name)}
          disabled={isCurrentPlan || isLoading}
        >
          {isLoading ? (
            'Processing...'
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : (
            tier.buttonText || `Choose ${tier.name}`
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

// Default pricing tiers configuration
export const defaultPricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Basic business evaluation',
    features: [
      'One business evaluation per month',
      'Basic business health score',
      'Limited improvement opportunities',
      'Email support',
    ],
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyPriceId: '',
    annualPriceId: '',
    buttonText: 'Get Started',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Advanced AI-powered insights',
    features: [
      'Unlimited business evaluations',
      'Advanced AI improvement guides',
      'Progress tracking & ROI analysis',
      'Professional PDF reports',
      'Priority support',
      '14-day free trial',
    ],
    monthlyPrice: 29,
    annualPrice: 299,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_ANNUAL_PRICE_ID || '',
    popular: true,
    buttonText: 'Start Free Trial',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for larger organizations',
    features: [
      'Everything in Premium',
      'Custom implementation guides',
      'Industry benchmarking',
      'Dedicated account manager',
      'Custom integrations',
      'Advanced analytics',
    ],
    monthlyPrice: 99,
    annualPrice: 999,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || '',
    buttonText: 'Contact Sales',
  },
]