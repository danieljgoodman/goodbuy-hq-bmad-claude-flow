'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, ArrowRight, TrendingUp, Target, Users, Award, Crown, Zap } from 'lucide-react'
import { OnboardingStepProps } from '@/contexts/onboarding-context'
import { useAuthStore } from '@/stores/auth-store'

interface ImprovementArea {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  impact: 'High' | 'Medium' | 'Low'
  timeframe: string
  isPremium?: boolean
}

interface PremiumFeature {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  benefits: string[]
}

const improvementAreas: ImprovementArea[] = [
  {
    id: 'financial-optimization',
    title: 'Financial Optimization',
    description: 'Improve profit margins and cash flow management',
    icon: TrendingUp,
    impact: 'High',
    timeframe: '3-6 months'
  },
  {
    id: 'operational-efficiency',
    title: 'Operational Efficiency',
    description: 'Streamline processes and reduce operational costs',
    icon: Target,
    impact: 'High', 
    timeframe: '2-4 months'
  },
  {
    id: 'market-expansion',
    title: 'Market Expansion',
    description: 'Identify new customer segments and growth opportunities',
    icon: Users,
    impact: 'Medium',
    timeframe: '6-12 months'
  },
  {
    id: 'brand-development',
    title: 'Brand & Marketing',
    description: 'Enhance brand value and marketing effectiveness',
    icon: Award,
    impact: 'Medium',
    timeframe: '4-8 months',
    isPremium: true
  }
]

const premiumFeatures: PremiumFeature[] = [
  {
    title: 'Implementation Guides',
    description: 'Step-by-step action plans for each improvement area',
    icon: Target,
    benefits: [
      'Detailed roadmaps with timelines',
      'Resource requirements and ROI projections', 
      'Risk assessment and mitigation strategies'
    ]
  },
  {
    title: 'Progress Tracking',
    description: 'Monitor your improvement efforts and valuation changes',
    icon: TrendingUp,
    benefits: [
      'Monthly progress reports',
      'Valuation impact tracking',
      'Benchmark comparisons'
    ]
  },
  {
    title: 'Expert Consultations',
    description: '1-on-1 sessions with business valuation experts',
    icon: Users,
    benefits: [
      '30-minute quarterly calls',
      'Personalized recommendations',
      'Industry-specific insights'
    ]
  }
]

export default function NextStepsStep({ onNext, onSkip, onComplete, isActive }: OnboardingStepProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [viewedImprovements, setViewedImprovements] = useState(false)
  const [understoodPremium, setUnderstoodPremium] = useState(false)
  const [selectedImprovement, setSelectedImprovement] = useState<string | null>(null)

  const isPremium = user?.tier !== 'FREE'
  const canProceed = viewedImprovements && understoodPremium

  const handleViewImprovements = () => {
    setViewedImprovements(true)
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'onboarding_improvements_viewed', {
        event_category: 'onboarding',
        event_label: 'next_steps'
      })
    }
  }

  const handleUnderstandPremium = () => {
    setUnderstoodPremium(true)
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'onboarding_premium_understood', {
        event_category: 'onboarding',
        event_label: 'next_steps'
      })
    }
  }

  const handleUpgrade = () => {
    router.push('/pricing')
  }

  const handleComplete = () => {
    onComplete(['viewed_improvements', 'understood_premium'])
  }

  const handleSkip = () => {
    if (onSkip) onSkip()
  }

  const handleImprovementSelect = (improvementId: string) => {
    setSelectedImprovement(improvementId)
    if (!viewedImprovements) {
      handleViewImprovements()
    }
  }

  useEffect(() => {
    if (canProceed) {
      const timer = setTimeout(() => {
        handleComplete()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [canProceed])

  if (!isActive) return null

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Maximize Your Business Value
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Now that you know your current valuation, let's explore how to systematically increase your business value over time.
        </p>
      </div>

      {/* Improvement Areas */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Key Improvement Opportunities</h2>
          <p className="text-muted-foreground">
            Based on thousands of business evaluations, these areas typically offer the highest ROI
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {improvementAreas.map((area) => (
            <Card 
              key={area.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedImprovement === area.id ? 'ring-2 ring-primary' : ''
              } ${area.isPremium && !isPremium ? 'opacity-60' : ''}`}
              onClick={() => handleImprovementSelect(area.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <area.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {area.title}
                        {area.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                      </div>
                      <div className="text-sm font-normal text-muted-foreground">
                        {area.timeframe}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={area.impact === 'High' ? 'destructive' : area.impact === 'Medium' ? 'default' : 'secondary'}
                  >
                    {area.impact} Impact
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{area.description}</p>
                
                {selectedImprovement === area.id && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="text-sm font-medium">What you'll get:</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Detailed analysis of current performance
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Specific improvement recommendations
                      </div>
                      {area.isPremium && !isPremium ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Crown className="w-4 h-4 text-yellow-500" />
                          Step-by-step implementation guide (Premium)
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Implementation roadmap with timelines
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {area.isPremium && !isPremium && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Premium Feature
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Upgrade to access detailed implementation guides
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {viewedImprovements && (
          <div className="text-center pt-4">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-green-600 font-medium">Improvement areas explored!</p>
          </div>
        )}
      </div>

      {/* Premium Features Section */}
      {!isPremium && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Unlock Premium Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Take your business optimization to the next level with our premium tools and expert guidance.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                    <ul className="space-y-1">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-4">
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleUnderstandPremium}>
                  {understoodPremium ? 'Premium Features Understood' : 'Learn More'}
                </Button>
                <Button onClick={handleUpgrade} className="gap-2">
                  <Crown className="w-4 h-4" />
                  Upgrade to Premium
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isPremium && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <div>
                <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
                  You're all set with Premium!
                </h3>
                <p className="text-green-600 dark:text-green-400">
                  You have access to all implementation guides, progress tracking, and expert consultations.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleUnderstandPremium}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                {understoodPremium ? 'Ready to Go!' : 'Understood'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={handleSkip}>
          Skip This Step  
        </Button>

        {canProceed && (
          <Button onClick={handleComplete} className="gap-2">
            Complete Onboarding
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="text-center text-sm text-muted-foreground">
        Step 4 of 4 • Estimated time: 3-4 minutes
      </div>
    </div>
  )
}