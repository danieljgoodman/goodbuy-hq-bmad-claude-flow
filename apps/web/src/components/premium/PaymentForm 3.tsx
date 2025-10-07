'use client'

import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard } from 'lucide-react'

interface PaymentFormProps {
  onSuccess?: (paymentIntent: any) => void
  onError?: (error: string) => void
  planName?: string
  amount?: number
  currency?: string
  trialDays?: number
}

export function PaymentForm({
  onSuccess,
  onError,
  planName = 'Premium Plan',
  amount,
  currency = 'USD',
  trialDays = 14
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      
      if (submitError) {
        throw new Error(submitError.message)
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setIsComplete(true)
        onSuccess?.(paymentIntent)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isComplete) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-green-600 rounded-full"></div>
            </div>
            <h3 className="text-lg font-semibold text-green-800">Payment Successful!</h3>
            <p className="text-sm text-gray-600">
              Your subscription to {planName} has been activated.
              {trialDays > 0 && ` Your ${trialDays}-day trial starts now.`}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Payment Details</span>
        </CardTitle>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Subscribe to {planName}
          </p>
          {trialDays > 0 && (
            <p className="text-sm text-green-600 font-medium">
              {trialDays}-day free trial included
            </p>
          )}
          {amount && (
            <p className="text-sm text-muted-foreground">
              {amount > 0 ? `${currency} ${(amount / 100).toFixed(2)}` : 'Free trial'}
            </p>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <PaymentElement
              options={{
                layout: 'tabs',
              }}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={!stripe || !elements || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : trialDays > 0 ? (
                `Start ${trialDays}-Day Trial`
              ) : (
                'Subscribe Now'
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              {trialDays > 0 ? (
                `You won't be charged until your ${trialDays}-day trial ends. Cancel anytime.`
              ) : (
                'You can cancel your subscription at any time.'
              )}
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default PaymentForm