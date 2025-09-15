'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AnalyticsDashboard } from '@/components/analytics/dashboard/AnalyticsDashboard'
import { useAuth } from '@/lib/hooks/useAuth'
import { AlertTriangle, Loader2, Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      checkAccess()
    }
  }, [user?.id])

  const checkAccess = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const response = await fetch('/api/premium/check-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          featureType: 'analytics',
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
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please sign in to access advanced analytics.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3 text-lg">Checking access...</span>
        </div>
      </div>
    )
  }

  if (hasAccess === false) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Premium Feature</h3>
            <p className="text-gray-600 mb-6">
              Advanced analytics and trend analysis is available with a premium subscription.
            </p>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Upgrade to premium to access:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Advanced trend analysis with statistical confidence</li>
                    <li>Predictive modeling and forecasting</li>
                    <li>Seasonality detection and business cycle analysis</li>
                    <li>Model performance tracking and accuracy metrics</li>
                  </ul>
                </AlertDescription>
              </Alert>
              <Link href="/subscription">
                <Button className="w-full">
                  Upgrade to Premium
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AnalyticsDashboard 
        userId={user.id}
        onConfigChange={(config) => {
          console.log('Dashboard configuration updated:', config)
        }}
      />
    </div>
  )
}