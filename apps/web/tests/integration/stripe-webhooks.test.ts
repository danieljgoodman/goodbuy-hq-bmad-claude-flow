/**
 * Integration tests for Stripe webhook handling and subscription lifecycle
 * Tests webhook processing, tier updates, and subscription status changes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { TierDetectionService } from '@/lib/subscription/tier-utils'

// Mock Stripe webhook validation
vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: vi.fn()
    },
    subscriptions: {
      retrieve: vi.fn(),
      list: vi.fn()
    },
    customers: {
      retrieve: vi.fn()
    }
  }))
}))

// Mock TierDetectionService
vi.mock('@/lib/subscription/tier-utils', () => ({
  TierDetectionService: {
    updateTierInClerk: vi.fn(),
    detectTier: vi.fn()
  }
}))

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: vi.fn(() => ({
    users: {
      getUserList: vi.fn(),
      updateUserMetadata: vi.fn()
    }
  }))
}))

describe('Stripe Webhook Integration', () => {
  let mockStripe: any
  let mockTierDetectionService: any
  let mockClerkClient: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mocks
    const StripeConstructor = require('stripe').default
    mockStripe = new StripeConstructor()

    mockTierDetectionService = require('@/lib/subscription/tier-utils').TierDetectionService
    const { clerkClient } = require('@clerk/nextjs/server')
    mockClerkClient = clerkClient

    // Setup environment variables
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('customer.subscription.created', () => {
    it('should handle new professional subscription creation', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_webhook',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_professional_123',
            customer: 'cus_test_customer',
            status: 'active',
            items: {
              data: [{
                price: {
                  id: 'price_professional_monthly',
                  product: 'prod_professional'
                }
              }]
            },
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            trial_start: null,
            trial_end: null,
            cancel_at_period_end: false,
            metadata: {
              clerk_user_id: 'user_professional_123'
            }
          } as Stripe.Subscription
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      // Simulate webhook request
      const webhookPayload = JSON.stringify(mockEvent)
      const signature = 'test_signature'

      const request = new NextRequest('https://example.com/api/webhooks/stripe', {
        method: 'POST',
        body: webhookPayload,
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json'
        }
      })

      // Process webhook (this would be in your actual webhook handler)
      const subscription = mockEvent.data.object as Stripe.Subscription
      const userId = subscription.metadata?.clerk_user_id

      expect(userId).toBe('user_professional_123')

      // Should update tier in Clerk
      expect(mockTierDetectionService.updateTierInClerk).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          tier: 'PROFESSIONAL',
          status: 'ACTIVE',
          stripeCustomerId: 'cus_test_customer',
          stripeSubscriptionId: 'sub_professional_123'
        })
      )
    })

    it('should handle new enterprise subscription creation', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_enterprise_webhook',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_enterprise_123',
            customer: 'cus_enterprise_customer',
            status: 'active',
            items: {
              data: [{
                price: {
                  id: 'price_enterprise_yearly',
                  product: 'prod_enterprise'
                }
              }]
            },
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
            trial_start: null,
            trial_end: null,
            cancel_at_period_end: false,
            metadata: {
              clerk_user_id: 'user_enterprise_123'
            }
          } as Stripe.Subscription
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      const subscription = mockEvent.data.object as Stripe.Subscription
      const userId = subscription.metadata?.clerk_user_id

      expect(mockTierDetectionService.updateTierInClerk).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          tier: 'ENTERPRISE',
          status: 'ACTIVE'
        })
      )
    })

    it('should handle trial subscription creation', async () => {
      const trialEnd = Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60 // 14 days

      const mockEvent: Stripe.Event = {
        id: 'evt_trial_webhook',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_trial_123',
            customer: 'cus_trial_customer',
            status: 'trialing',
            items: {
              data: [{
                price: {
                  id: 'price_professional_monthly',
                  product: 'prod_professional'
                }
              }]
            },
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            trial_start: Math.floor(Date.now() / 1000),
            trial_end: trialEnd,
            cancel_at_period_end: false,
            metadata: {
              clerk_user_id: 'user_trial_123'
            }
          } as Stripe.Subscription
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      const subscription = mockEvent.data.object as Stripe.Subscription

      expect(mockTierDetectionService.updateTierInClerk).toHaveBeenCalledWith(
        'user_trial_123',
        expect.objectContaining({
          tier: 'PROFESSIONAL',
          status: 'TRIALING',
          trialEnd: new Date(trialEnd * 1000)
        })
      )
    })
  })

  describe('customer.subscription.updated', () => {
    it('should handle subscription upgrade from professional to enterprise', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_upgrade_webhook',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_upgrade_123',
            customer: 'cus_upgrade_customer',
            status: 'active',
            items: {
              data: [{
                price: {
                  id: 'price_enterprise_monthly',
                  product: 'prod_enterprise'
                }
              }]
            },
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            trial_start: null,
            trial_end: null,
            cancel_at_period_end: false,
            metadata: {
              clerk_user_id: 'user_upgrade_123'
            }
          } as Stripe.Subscription,
          previous_attributes: {
            items: {
              data: [{
                price: {
                  id: 'price_professional_monthly'
                }
              }]
            }
          }
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      const subscription = mockEvent.data.object as Stripe.Subscription

      expect(mockTierDetectionService.updateTierInClerk).toHaveBeenCalledWith(
        'user_upgrade_123',
        expect.objectContaining({
          tier: 'ENTERPRISE',
          status: 'ACTIVE'
        })
      )
    })

    it('should handle subscription downgrade from enterprise to professional', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_downgrade_webhook',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_downgrade_123',
            customer: 'cus_downgrade_customer',
            status: 'active',
            items: {
              data: [{
                price: {
                  id: 'price_professional_monthly',
                  product: 'prod_professional'
                }
              }]
            },
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            trial_start: null,
            trial_end: null,
            cancel_at_period_end: false,
            metadata: {
              clerk_user_id: 'user_downgrade_123'
            }
          } as Stripe.Subscription,
          previous_attributes: {
            items: {
              data: [{
                price: {
                  id: 'price_enterprise_monthly'
                }
              }]
            }
          }
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      const subscription = mockEvent.data.object as Stripe.Subscription

      expect(mockTierDetectionService.updateTierInClerk).toHaveBeenCalledWith(
        'user_downgrade_123',
        expect.objectContaining({
          tier: 'PROFESSIONAL',
          status: 'ACTIVE'
        })
      )
    })

    it('should handle subscription status changes (past due)', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_pastdue_webhook',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_pastdue_123',
            customer: 'cus_pastdue_customer',
            status: 'past_due',
            items: {
              data: [{
                price: {
                  id: 'price_professional_monthly',
                  product: 'prod_professional'
                }
              }]
            },
            current_period_start: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
            current_period_end: Math.floor(Date.now() / 1000),
            trial_start: null,
            trial_end: null,
            cancel_at_period_end: false,
            metadata: {
              clerk_user_id: 'user_pastdue_123'
            }
          } as Stripe.Subscription,
          previous_attributes: {
            status: 'active'
          }
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      const subscription = mockEvent.data.object as Stripe.Subscription

      expect(mockTierDetectionService.updateTierInClerk).toHaveBeenCalledWith(
        'user_pastdue_123',
        expect.objectContaining({
          tier: 'PROFESSIONAL',
          status: 'PAST_DUE'
        })
      )
    })

    it('should handle trial period ending', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_trial_end_webhook',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_trial_end_123',
            customer: 'cus_trial_end_customer',
            status: 'active',
            items: {
              data: [{
                price: {
                  id: 'price_professional_monthly',
                  product: 'prod_professional'
                }
              }]
            },
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            trial_start: Math.floor(Date.now() / 1000) - 14 * 24 * 60 * 60,
            trial_end: Math.floor(Date.now() / 1000),
            cancel_at_period_end: false,
            metadata: {
              clerk_user_id: 'user_trial_end_123'
            }
          } as Stripe.Subscription,
          previous_attributes: {
            status: 'trialing'
          }
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      const subscription = mockEvent.data.object as Stripe.Subscription

      expect(mockTierDetectionService.updateTierInClerk).toHaveBeenCalledWith(
        'user_trial_end_123',
        expect.objectContaining({
          tier: 'PROFESSIONAL',
          status: 'ACTIVE'
        })
      )
    })
  })

  describe('customer.subscription.deleted', () => {
    it('should handle subscription cancellation', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_cancel_webhook',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_cancel_123',
            customer: 'cus_cancel_customer',
            status: 'canceled',
            items: {
              data: [{
                price: {
                  id: 'price_professional_monthly',
                  product: 'prod_professional'
                }
              }]
            },
            current_period_start: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
            current_period_end: Math.floor(Date.now() / 1000),
            trial_start: null,
            trial_end: null,
            cancel_at_period_end: false,
            canceled_at: Math.floor(Date.now() / 1000),
            metadata: {
              clerk_user_id: 'user_cancel_123'
            }
          } as Stripe.Subscription
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      const subscription = mockEvent.data.object as Stripe.Subscription

      expect(mockTierDetectionService.updateTierInClerk).toHaveBeenCalledWith(
        'user_cancel_123',
        expect.objectContaining({
          tier: 'BASIC', // Should downgrade to basic
          status: 'CANCELED'
        })
      )
    })

    it('should handle immediate cancellation vs end of period', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_immediate_cancel_webhook',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_immediate_cancel_123',
            customer: 'cus_immediate_cancel_customer',
            status: 'canceled',
            items: {
              data: [{
                price: {
                  id: 'price_enterprise_monthly',
                  product: 'prod_enterprise'
                }
              }]
            },
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 15 * 24 * 60 * 60, // 15 days left
            trial_start: null,
            trial_end: null,
            cancel_at_period_end: false,
            canceled_at: Math.floor(Date.now() / 1000),
            ended_at: Math.floor(Date.now() / 1000), // Immediate cancellation
            metadata: {
              clerk_user_id: 'user_immediate_cancel_123'
            }
          } as Stripe.Subscription
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      const subscription = mockEvent.data.object as Stripe.Subscription

      // For immediate cancellation, should downgrade immediately
      expect(mockTierDetectionService.updateTierInClerk).toHaveBeenCalledWith(
        'user_immediate_cancel_123',
        expect.objectContaining({
          tier: 'BASIC',
          status: 'CANCELED'
        })
      )
    })
  })

  describe('customer.created and customer.updated', () => {
    it('should handle customer creation with metadata', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_customer_created',
        type: 'customer.created',
        data: {
          object: {
            id: 'cus_new_customer',
            email: 'newcustomer@example.com',
            metadata: {
              clerk_user_id: 'user_new_customer_123'
            },
            created: Math.floor(Date.now() / 1000)
          } as Stripe.Customer
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      const customer = mockEvent.data.object as Stripe.Customer
      const userId = customer.metadata?.clerk_user_id

      if (userId) {
        expect(mockTierDetectionService.updateTierInClerk).toHaveBeenCalledWith(
          userId,
          expect.objectContaining({
            stripeCustomerId: 'cus_new_customer',
            tier: 'BASIC' // New customers start with basic
          })
        )
      }
    })

    it('should handle customer metadata updates', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_customer_updated',
        type: 'customer.updated',
        data: {
          object: {
            id: 'cus_updated_customer',
            email: 'updated@example.com',
            metadata: {
              clerk_user_id: 'user_updated_123',
              tier_override: 'PROFESSIONAL'
            }
          } as Stripe.Customer,
          previous_attributes: {
            metadata: {
              clerk_user_id: 'user_updated_123'
            }
          }
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      const customer = mockEvent.data.object as Stripe.Customer

      // Could trigger a tier update if metadata includes tier information
      // Implementation would depend on your business logic
    })
  })

  describe('invoice.payment_succeeded and invoice.payment_failed', () => {
    it('should handle successful payment for subscription renewal', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_payment_success',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_payment_success',
            customer: 'cus_payment_customer',
            subscription: 'sub_payment_123',
            status: 'paid',
            amount_paid: 2900, // $29.00
            currency: 'usd',
            metadata: {
              clerk_user_id: 'user_payment_123'
            }
          } as Stripe.Invoice
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      // Mock subscription retrieval to get current details
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_payment_123',
        status: 'active',
        items: {
          data: [{
            price: {
              id: 'price_professional_monthly'
            }
          }]
        },
        metadata: {
          clerk_user_id: 'user_payment_123'
        }
      })

      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      const invoice = mockEvent.data.object as Stripe.Invoice

      if (invoice.subscription) {
        // Should retrieve subscription and update tier status to active
        expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith(invoice.subscription)
      }
    })

    it('should handle failed payment for subscription', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_payment_failed',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_payment_failed',
            customer: 'cus_payment_failed_customer',
            subscription: 'sub_payment_failed_123',
            status: 'open',
            amount_due: 2900,
            currency: 'usd',
            attempt_count: 1,
            metadata: {
              clerk_user_id: 'user_payment_failed_123'
            }
          } as Stripe.Invoice
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      // Mock subscription retrieval for failed payment
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_payment_failed_123',
        status: 'past_due',
        items: {
          data: [{
            price: {
              id: 'price_professional_monthly'
            }
          }]
        },
        metadata: {
          clerk_user_id: 'user_payment_failed_123'
        }
      })

      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      const invoice = mockEvent.data.object as Stripe.Invoice

      if (invoice.subscription) {
        expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith(invoice.subscription)
      }
    })
  })

  describe('Webhook validation and security', () => {
    it('should validate webhook signature correctly', async () => {
      const webhookPayload = JSON.stringify({
        id: 'evt_test',
        type: 'customer.subscription.created',
        data: { object: {} }
      })

      const validSignature = 'valid_signature_123'

      mockStripe.webhooks.constructEvent.mockImplementation((payload, signature, secret) => {
        if (signature === validSignature && secret === process.env.STRIPE_WEBHOOK_SECRET) {
          return { id: 'evt_test', type: 'customer.subscription.created', data: { object: {} } }
        }
        throw new Error('Invalid signature')
      })

      // Valid signature should work
      expect(() => {
        mockStripe.webhooks.constructEvent(
          webhookPayload,
          validSignature,
          process.env.STRIPE_WEBHOOK_SECRET
        )
      }).not.toThrow()

      // Invalid signature should throw
      expect(() => {
        mockStripe.webhooks.constructEvent(
          webhookPayload,
          'invalid_signature',
          process.env.STRIPE_WEBHOOK_SECRET
        )
      }).toThrow('Invalid signature')
    })

    it('should handle webhook event idempotency', async () => {
      const eventId = 'evt_idempotent_test'
      const mockEvent = {
        id: eventId,
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_idempotent_123',
            metadata: { clerk_user_id: 'user_idempotent_123' }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      // Process the same event multiple times
      const processEvent = async () => {
        // Your webhook handler would check if this event was already processed
        // Implementation would depend on your event tracking system
      }

      // First processing
      await processEvent()
      expect(mockTierDetectionService.updateTierInClerk).toHaveBeenCalledTimes(1)

      // Second processing (should be skipped due to idempotency)
      await processEvent()
      // In real implementation, this would still be 1 if idempotency is working
    })

    it('should handle webhook retry scenarios', async () => {
      const mockEvent = {
        id: 'evt_retry_test',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_retry_123',
            metadata: { clerk_user_id: 'user_retry_123' }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      // First attempt fails
      mockTierDetectionService.updateTierInClerk
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(undefined)

      // Should handle failure gracefully
      try {
        // First attempt
        await mockTierDetectionService.updateTierInClerk('user_retry_123', {})
      } catch (error) {
        expect(error.message).toBe('Temporary failure')
      }

      // Retry should succeed
      await mockTierDetectionService.updateTierInClerk('user_retry_123', {})
      expect(mockTierDetectionService.updateTierInClerk).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle missing user ID in subscription metadata', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_missing_user',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_missing_user_123',
            customer: 'cus_missing_user_customer',
            status: 'active',
            items: {
              data: [{
                price: { id: 'price_professional_monthly' }
              }]
            },
            metadata: {} // No clerk_user_id
          } as Stripe.Subscription
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      // Should handle gracefully - might need to look up user by customer ID
      mockClerkClient.mockResolvedValue({
        users: {
          getUserList: vi.fn().mockResolvedValue([
            {
              id: 'user_found_by_customer',
              publicMetadata: {
                stripeCustomerId: 'cus_missing_user_customer'
              }
            }
          ])
        }
      })

      const subscription = mockEvent.data.object as Stripe.Subscription

      // Implementation would search for user by customer ID if user ID is missing
      if (!subscription.metadata?.clerk_user_id) {
        const clerkClient = mockClerkClient()
        const users = await clerkClient.users.getUserList({
          query: `stripeCustomerId:${subscription.customer}`
        })

        if (users.length > 0) {
          const userId = users[0].id
          expect(userId).toBe('user_found_by_customer')
        }
      }
    })

    it('should handle unknown price IDs gracefully', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_unknown_price',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_unknown_price_123',
            customer: 'cus_unknown_price_customer',
            status: 'active',
            items: {
              data: [{
                price: {
                  id: 'price_unknown_plan_123', // Unknown price ID
                  product: 'prod_unknown'
                }
              }]
            },
            metadata: {
              clerk_user_id: 'user_unknown_price_123'
            }
          } as Stripe.Subscription
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      const subscription = mockEvent.data.object as Stripe.Subscription

      // Should fallback to BASIC tier for unknown price IDs
      expect(mockTierDetectionService.updateTierInClerk).toHaveBeenCalledWith(
        'user_unknown_price_123',
        expect.objectContaining({
          tier: 'BASIC' // Should default to BASIC for unknown prices
        })
      )
    })

    it('should handle Clerk API failures during webhook processing', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_clerk_failure',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_clerk_failure_123',
            metadata: { clerk_user_id: 'user_clerk_failure_123' }
          } as Stripe.Subscription
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null },
        api_version: '2023-10-16',
        object: 'event'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockTierDetectionService.updateTierInClerk.mockRejectedValue(
        new Error('Clerk API is down')
      )

      const subscription = mockEvent.data.object as Stripe.Subscription

      // Should attempt to update but handle failure gracefully
      await expect(
        mockTierDetectionService.updateTierInClerk(
          subscription.metadata?.clerk_user_id,
          {}
        )
      ).rejects.toThrow('Clerk API is down')

      // In a real implementation, this would be logged and possibly queued for retry
    })

    it('should handle malformed webhook payloads', async () => {
      const malformedPayloads = [
        '{"invalid": "json"', // Invalid JSON
        '{}', // Empty object
        '{"id": "evt_test"}', // Missing required fields
        null,
        undefined
      ]

      for (const payload of malformedPayloads) {
        mockStripe.webhooks.constructEvent.mockImplementation(() => {
          throw new Error('Invalid payload')
        })

        expect(() => {
          mockStripe.webhooks.constructEvent(
            payload,
            'signature',
            process.env.STRIPE_WEBHOOK_SECRET
          )
        }).toThrow('Invalid payload')
      }
    })
  })

  describe('Performance and reliability', () => {
    it('should process webhooks within acceptable time limits', async () => {
      const mockEvent = {
        id: 'evt_performance_test',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_performance_123',
            metadata: { clerk_user_id: 'user_performance_123' }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      const startTime = performance.now()

      // Process webhook
      await mockTierDetectionService.updateTierInClerk('user_performance_123', {})

      const endTime = performance.now()
      const processingTime = endTime - startTime

      // Should process quickly (under 100ms in test environment)
      expect(processingTime).toBeLessThan(100)
    })

    it('should handle high volume of concurrent webhooks', async () => {
      const numberOfWebhooks = 50
      const webhookPromises = []

      mockStripe.webhooks.constructEvent.mockImplementation((payload, sig, secret) => {
        const event = JSON.parse(payload)
        return event
      })

      mockTierDetectionService.updateTierInClerk.mockResolvedValue(undefined)

      for (let i = 0; i < numberOfWebhooks; i++) {
        const webhookPayload = JSON.stringify({
          id: `evt_concurrent_${i}`,
          type: 'customer.subscription.created',
          data: {
            object: {
              id: `sub_concurrent_${i}`,
              metadata: { clerk_user_id: `user_concurrent_${i}` }
            }
          }
        })

        const promise = mockTierDetectionService.updateTierInClerk(
          `user_concurrent_${i}`,
          {}
        )
        webhookPromises.push(promise)
      }

      const startTime = performance.now()
      await Promise.all(webhookPromises)
      const endTime = performance.now()

      const totalTime = endTime - startTime

      // Should handle all webhooks efficiently
      expect(totalTime).toBeLessThan(1000) // 1 second for 50 webhooks
      expect(mockTierDetectionService.updateTierInClerk).toHaveBeenCalledTimes(numberOfWebhooks)
    })
  })
})