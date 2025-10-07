'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, ArrowRight, BarChart3, Clock, User, Plus, Bell, Map, Eye } from 'lucide-react'
import { OnboardingStepProps } from '@/contexts/onboarding-context'
import { useAuthStore } from '@/stores/auth-store'

interface TourSpot {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  position: string
  badge?: string
  requiresPremium?: boolean
}

const tourSpots: TourSpot[] = [
  {
    id: 'dashboard-overview',
    title: 'Dashboard Overview',
    description: 'Your business metrics and recent evaluations at a glance',
    icon: BarChart3,
    position: 'center'
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    description: 'Start new evaluations or access recent reports instantly',
    icon: Plus,
    position: 'top-right'
  },
  {
    id: 'evaluation-history',
    title: 'Evaluation History',
    description: 'Track your business valuation progress over time',
    icon: Clock,
    position: 'left'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Stay updated on evaluation results and recommendations',
    icon: Bell,
    position: 'top-right',
    badge: '3'
  },
  {
    id: 'premium-features',
    title: 'Premium Features',
    description: 'Advanced analytics, implementation guides, and expert consultations',
    icon: User,
    position: 'right',
    badge: 'Premium',
    requiresPremium: true
  }
]

export default function DashboardTourStep({ onNext, onSkip, onComplete, isActive }: OnboardingStepProps) {
  const { user } = useAuthStore()
  const [currentSpot, setCurrentSpot] = useState(0)
  const [touredSpots, setTouredSpots] = useState<string[]>([])
  const [understoodNavigation, setUnderstoodNavigation] = useState(false)

  const isPremium = user?.tier !== 'FREE'
  const filteredSpots = tourSpots.filter(spot => !spot.requiresPremium || isPremium)
  const canProceed = touredSpots.length >= 3 && understoodNavigation

  const handleSpotVisit = (spotId: string) => {
    if (!touredSpots.includes(spotId)) {
      setTouredSpots(prev => [...prev, spotId])
      
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_tour_spot_visited', {
          event_category: 'onboarding',
          event_label: spotId
        })
      }
    }
  }

  const handleNavigationUnderstanding = () => {
    setUnderstoodNavigation(true)
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'onboarding_navigation_understood', {
        event_category: 'onboarding',
        event_label: 'dashboard_tour'
      })
    }
  }

  const handleComplete = () => {
    onComplete(['toured_dashboard', 'understood_navigation'])
  }

  const handleSkip = () => {
    if (onSkip) onSkip()
  }

  const nextSpot = () => {
    if (currentSpot < filteredSpots.length - 1) {
      setCurrentSpot(prev => prev + 1)
    } else {
      handleNavigationUnderstanding()
    }
  }

  const prevSpot = () => {
    if (currentSpot > 0) {
      setCurrentSpot(prev => prev - 1)
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

  const currentTourSpot = filteredSpots[currentSpot]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Tour Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Map className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Your Dashboard Tour
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Let's explore the key areas of your dashboard so you can navigate like a pro.
        </p>
      </div>

      {/* Interactive Tour */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Dashboard Mockup */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Dashboard Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-muted/30 rounded-lg p-4 min-h-[400px]">
              {/* Mockup Dashboard Elements */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div 
                  className={`p-3 bg-background rounded-lg border cursor-pointer transition-all ${
                    currentTourSpot?.id === 'dashboard-overview' ? 'ring-2 ring-primary' : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleSpotVisit('dashboard-overview')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm font-medium">Overview</span>
                  </div>
                  <div className="text-2xl font-bold">$1.2M</div>
                  <div className="text-xs text-green-600">+15% this month</div>
                </div>

                <div 
                  className={`p-3 bg-background rounded-lg border cursor-pointer transition-all ${
                    currentTourSpot?.id === 'quick-actions' ? 'ring-2 ring-primary' : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleSpotVisit('quick-actions')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Quick Actions</span>
                  </div>
                  <Button size="sm" className="w-full">New Evaluation</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div 
                  className={`p-3 bg-background rounded-lg border cursor-pointer transition-all ${
                    currentTourSpot?.id === 'evaluation-history' ? 'ring-2 ring-primary' : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleSpotVisit('evaluation-history')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Recent Evaluations</span>
                    </div>
                    {currentTourSpot?.id === 'evaluation-history' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Tech Startup - $850K</div>
                    <div className="text-xs text-muted-foreground">Restaurant - $1.2M</div>
                  </div>
                </div>

                {isPremium && (
                  <div 
                    className={`p-3 bg-background rounded-lg border cursor-pointer transition-all ${
                      currentTourSpot?.id === 'premium-features' ? 'ring-2 ring-primary' : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleSpotVisit('premium-features')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">Premium Analytics</span>
                      </div>
                      <Badge variant="default">Premium</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">Advanced insights & guides</div>
                  </div>
                )}
              </div>

              {/* Tour Spotlight */}
              {currentTourSpot && (
                <div className="absolute inset-0 bg-black/20 rounded-lg pointer-events-none">
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                    Currently Exploring
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tour Guide Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <currentTourSpot.icon className="w-5 h-5" />
                {currentTourSpot.title}
                {touredSpots.includes(currentTourSpot.id) && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{currentTourSpot.description}</p>
              
              {currentTourSpot.requiresPremium && !isPremium && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-primary">Premium Feature</p>
                  <p className="text-xs text-muted-foreground">
                    Upgrade to access advanced analytics and implementation guides
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={prevSpot}
                  disabled={currentSpot === 0}
                >
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  {filteredSpots.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentSpot ? 'bg-primary' : 'bg-muted'
                      }`} 
                    />
                  ))}
                </div>

                <Button onClick={nextSpot}>
                  {currentSpot === filteredSpots.length - 1 ? 'Finish Tour' : 'Next'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tour Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {touredSpots.length} / {filteredSpots.length} areas explored
                  </span>
                </div>
                
                <div className="space-y-2">
                  {filteredSpots.map((spot) => (
                    <div key={spot.id} className="flex items-center gap-2">
                      <CheckCircle 
                        className={`w-4 h-4 ${
                          touredSpots.includes(spot.id) ? 'text-green-500' : 'text-muted'
                        }`} 
                      />
                      <span className="text-sm">{spot.title}</span>
                      {spot.badge && (
                        <Badge variant="outline" className="text-xs">
                          {spot.badge}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={handleSkip}>
          Skip Tour
        </Button>

        {canProceed && (
          <Button onClick={handleComplete} className="gap-2">
            Continue to First Evaluation
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="text-center text-sm text-muted-foreground">
        Step 2 of 4 • Estimated time: 2 minutes
      </div>
    </div>
  )
}