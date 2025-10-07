'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  ExternalLink
} from 'lucide-react'

interface Subscription {
  id: string
  status: string
  tier: string
  billingCycle: string
  trialEndsAt?: string | null
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  cancelledAt?: string | null
}

interface SubscriptionManagerProps {
  userId: string
  onSubscriptionChange?: (subscription: Subscription | null) => void
}

export function SubscriptionManager({ userId, onSubscriptionChange }: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscription()
  }, [userId])

  const fetchSubscription = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/stripe/subscriptions/status?userId=${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subscription')
      }

      setSubscription(data.subscription)
      onSubscriptionChange?.(data.subscription)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load subscription'
      setError(errorMessage)
      console.error('Error fetching subscription:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription || !window.confirm('Are you sure you want to cancel your subscription?')) {
      return
    }

    try {
      setActionLoading(true)
      setError(null)

      const response = await fetch('/api/stripe/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      await fetchSubscription()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription'
      setError(errorMessage)
      console.error('Error cancelling subscription:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivateSubscription = async () => {
    if (!subscription) return

    try {
      setActionLoading(true)
      setError(null)

      const response = await fetch('/api/stripe/subscriptions/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate subscription')
      }

      await fetchSubscription()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reactivate subscription'
      setError(errorMessage)
      console.error('Error reactivating subscription:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      setActionLoading(true)
      setError(null)

      const response = await fetch('/api/stripe/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          returnUrl: window.location.origin + '/dashboard/subscription'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create billing portal session')
      }

      window.location.href = data.url
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open billing portal'
      setError(errorMessage)
      console.error('Error opening billing portal:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'TRIALING':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Trial</Badge>
      case 'PAST_DUE':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Past Due</Badge>
      case 'CANCELED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Canceled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">No active subscription found</p>
            <Button onClick={() => window.location.href = '/pricing'}>
              View Pricing Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isTrialing = subscription.status === 'TRIALING'
  const isCancelled = subscription.cancelAtPeriodEnd || subscription.status === 'CANCELED'
  const trialEndsAt = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : null
  const currentPeriodEnd = new Date(subscription.currentPeriodEnd)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Subscription Details</span>
          {getStatusBadge(subscription.status)}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{subscription.tier} Plan</p>
              <p className="text-sm text-muted-foreground">
                Billed {subscription.billingCycle.toLowerCase()}
              </p>
            </div>
          </div>

          {isTrialing && trialEndsAt && (
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Trial ends on {formatDate(subscription.trialEndsAt!)}</p>
                <p className="text-sm text-muted-foreground">
                  {Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {isCancelled ? 'Expires' : 'Renews'} on {formatDate(subscription.currentPeriodEnd)}
              </p>
              <p className="text-sm text-muted-foreground">
                Current billing period
              </p>
            </div>
          </div>
        </div>

        {isCancelled && !isTrialing && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your subscription will end on {formatDate(subscription.currentPeriodEnd)}. 
              You'll still have access until then.
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
          <Button
            variant="outline"
            onClick={handleManageBilling}
            disabled={actionLoading}
            className="flex items-center"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Manage Billing
          </Button>

          {subscription.status === 'ACTIVE' && !isCancelled && (
            <Button
              variant="outline"
              onClick={handleCancelSubscription}
              disabled={actionLoading}
            >
              Cancel Subscription
            </Button>
          )}

          {isCancelled && subscription.status !== 'CANCELED' && (
            <Button
              onClick={handleReactivateSubscription}
              disabled={actionLoading}
            >
              Reactivate Subscription
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}