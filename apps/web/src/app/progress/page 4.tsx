'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Crown, Target, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

export default function ProgressTracking() {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  const checkAccess = async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch('/api/premium/check-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          featureType: 'progress_tracking',
          requiredTier: 'PREMIUM'
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setHasAccess(result.hasAccess)
      } else {
        setHasAccess(false)
      }
    } catch (error) {
      console.error('Error checking access:', error)
      setHasAccess(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      checkAccess()
    }
  }, [user?.id])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please sign in to access progress tracking.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasAccess === false) {
    return (
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-amber-500 mr-2" />
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">PRO Feature</Badge>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Progress Tracking
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Monitor your business improvement initiatives and track their impact on your valuation over time
          </p>
        </div>

        {/* Upgrade Notice */}
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-3" />
              <div>
                <h3 className="font-semibold text-amber-900">Premium Feature Required</h3>
                <p className="text-amber-700">Upgrade to Professional to access Progress Tracking</p>
              </div>
            </div>
            <Link href="/subscription">
              <Button className="bg-amber-600 hover:bg-amber-700">
                Upgrade Now
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Feature Benefits */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>ROI Measurement</CardTitle>
              <CardDescription>
                Track the financial impact of each improvement initiative
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                See exactly how each change affects your business valuation with detailed ROI analysis and impact measurements.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline Management</CardTitle>
              <CardDescription>
                Set milestones and track completion timelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Organize your improvement initiatives with clear timelines, milestones, and automated progress tracking.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-muted rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Start tracking your progress today</h2>
          <p className="text-muted-foreground mb-6">
            Turn insights into action and measure real business impact
          </p>
          <div className="space-x-4">
            <Link href="/subscription">
              <Button size="lg">
                Upgrade to Professional
              </Button>
            </Link>
            <Link href="/support">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Premium content - user has access but feature requires database setup
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
          <Target className="h-8 w-8" />
          <span>Progress Tracking</span>
          <Crown className="h-6 w-6 text-yellow-600" />
        </h1>
        <p className="text-lg text-muted-foreground">
          Monitor your business improvement initiatives and track their impact over time
        </p>
      </div>

      {/* Feature Status */}
      <Card className="mb-8">
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Progress Tracking Ready</h3>
          <p className="text-gray-600 mb-4">
            Your enterprise subscription includes access to Progress Tracking.
          </p>
          <p className="text-sm text-gray-500">
            This feature requires database initialization to track your business improvement initiatives.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}