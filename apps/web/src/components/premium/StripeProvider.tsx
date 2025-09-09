'use client'

import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe/client'

interface StripeProviderProps {
  children: React.ReactNode
  clientSecret?: string
}

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const stripePromise = getStripe()

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  }

  if (!stripePromise) {
    return (
      <div className="p-4 text-center text-red-600">
        Stripe configuration error. Please check your environment variables.
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={clientSecret ? options : undefined}>
      {children}
    </Elements>
  )
}