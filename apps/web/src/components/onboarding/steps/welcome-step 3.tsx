'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CheckCircle, Play, TrendingUp, Users, Award, ArrowRight } from 'lucide-react'
import { OnboardingStepProps } from '@/contexts/onboarding-context'

const successStories = [
  {
    name: "TechStart Solutions",
    industry: "Technology",
    valuation: "$2.4M",
    improvement: "+40%",
    description: "Identified key operational inefficiencies and increased valuation by 40% in 6 months"
  },
  {
    name: "Green Valley Cafe",
    industry: "Food & Beverage", 
    valuation: "$850K",
    improvement: "+25%",
    description: "Optimized menu pricing and operations, boosted profitability significantly"
  },
  {
    name: "Metro Logistics",
    industry: "Transportation",
    valuation: "$1.8M", 
    improvement: "+35%",
    description: "Streamlined delivery routes and improved customer satisfaction metrics"
  }
]

const platformBenefits = [
  {
    icon: TrendingUp,
    title: "Accurate Valuations",
    description: "AI-powered analysis using 50+ valuation metrics"
  },
  {
    icon: Users,
    title: "Expert Insights",
    description: "Professional-grade recommendations from industry experts"
  },
  {
    icon: Award,
    title: "Implementation Guides", 
    description: "Step-by-step plans to increase your business value"
  }
]

export default function WelcomeStep({ onNext, onComplete, isActive }: OnboardingStepProps) {
  const [watchedOverview, setWatchedOverview] = useState(false)
  const [viewedExamples, setViewedExamples] = useState(false)
  const [selectedStory, setSelectedStory] = useState(0)

  const canProceed = watchedOverview && viewedExamples

  const handleWatchOverview = () => {
    setWatchedOverview(true)
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'onboarding_overview_watched', {
        event_category: 'onboarding',
        event_label: 'welcome_step'
      })
    }
  }

  const handleViewExamples = () => {
    setViewedExamples(true)
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'onboarding_examples_viewed', {
        event_category: 'onboarding', 
        event_label: 'welcome_step'
      })
    }
  }

  const handleComplete = () => {
    onComplete(['watched_overview', 'viewed_examples'])
  }

  useEffect(() => {
    if (canProceed) {
      const timer = setTimeout(() => {
        handleComplete()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [canProceed])

  if (!isActive) return null

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Award className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome to Business Valuation AI
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover how thousands of business owners have unlocked their company's true potential with our AI-powered valuation platform.
        </p>
      </div>

      {/* Platform Overview */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Play className="w-5 h-5" />
            Platform Overview
            {watchedOverview && <CheckCircle className="w-5 h-5 text-green-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {platformBenefits.map((benefit, index) => (
              <div key={index} className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={handleWatchOverview}
              className="gap-2"
              variant={watchedOverview ? "outline" : "default"}
            >
              <Play className="w-4 h-4" />
              {watchedOverview ? "Overview Watched" : "Watch 2-Minute Overview"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Success Stories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5" />
            Success Stories
            {viewedExamples && <CheckCircle className="w-5 h-5 text-green-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            {successStories.map((story, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedStory === index 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedStory(index)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{story.name}</h4>
                    <p className="text-sm text-muted-foreground">{story.industry}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{story.valuation}</div>
                    <div className="text-sm text-green-600 font-medium">{story.improvement}</div>
                  </div>
                </div>
                <p className="text-sm">{story.description}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={handleViewExamples}
              variant={viewedExamples ? "outline" : "default"}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              {viewedExamples ? "Examples Viewed" : "View More Success Stories"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Next Step */}
      {canProceed && (
        <div className="text-center pt-4">
          <Button onClick={handleComplete} size="lg" className="gap-2">
            Continue to Dashboard Tour
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="text-center text-sm text-muted-foreground">
        Step 1 of 4 • Estimated time: 2-3 minutes
      </div>
    </div>
  )
}