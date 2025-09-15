'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, Crown, CreditCard, AlertTriangle } from 'lucide-react'

interface TrialBannerProps {
  userId: string
  onUpgrade?: () => void
}

interface TrialInfo {
  isOnTrial: boolean
  trialEndsAt: string | null
  daysRemaining: number
  subscriptionTier: string
  status: string
}

export function TrialBanner({ userId, onUpgrade }: TrialBannerProps) {
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    fetchTrialStatus()
  }, [userId])

  const fetchTrialStatus = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/stripe/subscriptions/status?userId=${userId}`)
      const data = await response.json()

      if (response.ok && data.subscription) {
        const subscription = data.subscription
        const trialEndsAt = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : null
        const now = new Date()
        
        const isOnTrial = subscription.status === 'TRIALING' && !!trialEndsAt && trialEndsAt > now
        const daysRemaining = trialEndsAt 
          ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0

        setTrialInfo({
          isOnTrial,
          trialEndsAt: subscription.trialEndsAt,
          daysRemaining,
          subscriptionTier: subscription.tier,
          status: subscription.status,
        })
      } else {
        setTrialInfo(null)
      }
    } catch (error) {
      console.error('Error fetching trial status:', error)
      setTrialInfo(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPaymentMethod = () => {
    // Redirect to billing management
    onUpgrade?.()
  }

  if (isLoading || !trialInfo || isDismissed) {
    return null
  }

  // Don't show banner if not on trial
  if (!trialInfo.isOnTrial) {
    return null
  }

  const { daysRemaining } = trialInfo
  const isExpiringNext3Days = daysRemaining <= 3
  const isExpiringToday = daysRemaining <= 0

  if (isExpiringToday) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold">Your trial has expired!</span>
              <span className="ml-2">Add a payment method to continue using premium features.</span>
            </div>
            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={handleAddPaymentMethod}>
              Add Payment Method
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className={`p-4 ${isExpiringNext3Days ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isExpiringNext3Days ? (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          ) : (
            <Crown className="h-5 w-5 text-blue-600" />
          )}
          
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900">
                {isExpiringNext3Days ? 'Trial ending soon!' : 'Premium Trial Active'}
              </span>
              <Badge variant="secondary" className="bg-white">
                <Clock className="w-3 h-3 mr-1" />
                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {isExpiringNext3Days 
                ? 'Add a payment method to continue using premium features after your trial ends.'
                : 'You have full access to all premium features during your trial period.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
          >
            Dismiss
          </Button>
          
          <Button
            size="sm"
            className={isExpiringNext3Days ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}
            onClick={handleAddPaymentMethod}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {isExpiringNext3Days ? 'Add Payment Method' : 'Manage Subscription'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default TrialBanner