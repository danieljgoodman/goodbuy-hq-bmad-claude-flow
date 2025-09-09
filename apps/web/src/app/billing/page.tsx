'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SubscriptionManager } from '@/components/premium/SubscriptionManager'
import { BillingHistory } from '@/components/premium/BillingHistory'
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Shield,
  AlertCircle,
  ExternalLink,
  Settings
} from 'lucide-react'

// Mock user data - in production this would come from auth context
const MOCK_USER = {
  id: 'user-123',
  email: 'user@example.com',
  businessName: 'Example Business',
}

interface BillingSummary {
  currentPeriod: {
    start: string
    end: string
    amount: number
    currency: string
  }
  nextBilling: {
    date: string
    amount: number
    currency: string
  }
  totalSpent: {
    thisYear: number
    allTime: number
    currency: string
  }
  upcomingCharges: {
    date: string
    amount: number
    description: string
  }[]
}

interface PaymentMethod {
  id: string
  type: 'card'
  card: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
}

export default function BillingPage() {
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // In a real app, these would be separate API calls
      // For now, using mock data
      setBillingSummary({
        currentPeriod: {
          start: '2024-01-01',
          end: '2024-01-31',
          amount: 2900, // $29.00
          currency: 'USD'
        },
        nextBilling: {
          date: '2024-02-01',
          amount: 2900,
          currency: 'USD'
        },
        totalSpent: {
          thisYear: 8700, // $87.00
          allTime: 17400, // $174.00
          currency: 'USD'
        },
        upcomingCharges: [
          {
            date: '2024-02-01',
            amount: 2900,
            description: 'Premium Plan - Monthly'
          }
        ]
      })
      
      setPaymentMethods([
        {
          id: 'pm_1234',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            expMonth: 12,
            expYear: 2025
          },
          isDefault: true
        }
      ])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load billing data'
      setError(errorMessage)
      console.error('Error fetching billing data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManagePaymentMethods = async () => {
    setActionLoading(true)
    
    try {
      const response = await fetch('/api/stripe/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: MOCK_USER.id,
          returnUrl: window.location.origin + '/billing'
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

  const formatAmount = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getCardBrandIcon = (brand: string) => {
    // In a real app, you'd have actual card brand icons
    return brand.toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Billing & Payments</h1>
            <p className="text-muted-foreground">
              Manage your subscription, payment methods, and billing history
            </p>
          </div>
          <Button 
            onClick={handleManagePaymentMethods}
            disabled={actionLoading}
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Manage Billing</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Billing Summary Cards */}
        {billingSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Period</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(billingSummary.currentPeriod.amount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(billingSummary.currentPeriod.start)} - {formatDate(billingSummary.currentPeriod.end)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(billingSummary.nextBilling.amount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Due {formatDate(billingSummary.nextBilling.date)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Year</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(billingSummary.totalSpent.thisYear)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total spent in 2024
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">All Time</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(billingSummary.totalSpent.allTime)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total lifetime value
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upcoming Charges */}
        {billingSummary && billingSummary.upcomingCharges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Charges</CardTitle>
              <CardDescription>
                Scheduled payments and renewals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {billingSummary.upcomingCharges.map((charge, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{charge.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(charge.date)}
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-semibold">
                      {formatAmount(charge.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Methods */}
        {paymentMethods.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Payment Methods</span>
              </CardTitle>
              <CardDescription>
                Your saved payment methods and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-mono">
                        {getCardBrandIcon(method.card.brand)}
                      </div>
                      <div>
                        <div className="font-medium">
                          **** **** **** {method.card.last4}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Expires {method.card.expMonth.toString().padStart(2, '0')}/{method.card.expYear}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {method.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={handleManagePaymentMethods}
                  disabled={actionLoading}
                  className="flex items-center space-x-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Manage Payment Methods</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="subscription" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="history">Billing History</TabsTrigger>
          </TabsList>

          <TabsContent value="subscription" className="space-y-6">
            <SubscriptionManager 
              userId={MOCK_USER.id} 
              onSubscriptionChange={fetchBillingData}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <BillingHistory userId={MOCK_USER.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}