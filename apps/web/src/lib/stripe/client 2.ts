import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

export function getStripe() {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    
    if (!publishableKey) {
      console.warn('Missing Stripe publishable key')
      return null
    }
    
    stripePromise = loadStripe(publishableKey)
  }
  
  return stripePromise
}

export function getStripePublicKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
}