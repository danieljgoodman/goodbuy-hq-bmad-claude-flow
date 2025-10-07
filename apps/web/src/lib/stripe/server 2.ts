import Stripe from 'stripe'

// Initialize Stripe only if API key is available
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    })
  : null

// Helper function to check if Stripe is configured
export const isStripeConfigured = (): boolean => {
  return !!process.env.STRIPE_SECRET_KEY
}

// Subscription product IDs and price IDs - only load if configured
export const STRIPE_CONFIG = process.env.STRIPE_SECRET_KEY ? {
  products: {
    premium: process.env.STRIPE_PREMIUM_PRODUCT_ID || 'prod_test_premium',
    enterprise: process.env.STRIPE_ENTERPRISE_PRODUCT_ID || 'prod_test_enterprise',
  },
  prices: {
    premium: {
      monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_test_premium_monthly',
      annual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID || 'price_test_premium_annual',
    },
    enterprise: {
      monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_test_enterprise_monthly',
      annual: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || 'price_test_enterprise_annual',
    },
  },
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_webhook_secret',
} : null

// Tier mapping - only available if Stripe is configured
export const TIER_TO_PRICE_MAP = STRIPE_CONFIG ? {
  PREMIUM: {
    MONTHLY: STRIPE_CONFIG.prices.premium.monthly,
    ANNUAL: STRIPE_CONFIG.prices.premium.annual,
  },
  ENTERPRISE: {
    MONTHLY: STRIPE_CONFIG.prices.enterprise.monthly,
    ANNUAL: STRIPE_CONFIG.prices.enterprise.annual,
  },
} : null

// Price to tier mapping
export function getPriceIdToTierMapping() {
  if (!TIER_TO_PRICE_MAP) return {}
  
  const priceMap: Record<string, { tier: string; billingCycle: string }> = {}
  
  Object.entries(TIER_TO_PRICE_MAP).forEach(([tier, prices]) => {
    Object.entries(prices).forEach(([cycle, priceId]) => {
      priceMap[priceId] = { tier, billingCycle: cycle }
    })
  })
  
  return priceMap
}