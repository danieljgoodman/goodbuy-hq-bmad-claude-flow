/**
 * Tests for Clerk Tier Integration - Story 11.10
 * Comprehensive test suite for authentication flows, tier synchronization,
 * and session management
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { ClerkTierIntegration } from '../clerk-tier-integration'
import type {
  SubscriptionTier,
  SubscriptionStatus,
  ClerkUserMetadata
} from '@/types/subscription'
import type { WebhookEventData } from '@/types/auth-integration'

// Mock Clerk client
const mockClerkClient = {
  users: {
    getUser: jest.fn(),
    updateUserMetadata: jest.fn()
  }
}

// Mock auth function
const mockAuth = jest.fn()

jest.mock('@clerk/nextjs/server', () => ({
  clerkClient: mockClerkClient
}))

jest.mock('@clerk/nextjs', () => ({
  auth: mockAuth
}))

describe('ClerkTierIntegration', () => {
  const mockUserId = 'user_123456789'
  const mockSessionId = 'sess_123456789'

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock responses
    mockAuth.mockResolvedValue({
      userId: mockUserId,
      sessionId: mockSessionId
    })

    mockClerkClient.users.getUser.mockResolvedValue({
      id: mockUserId,
      privateMetadata: {
        subscriptionData: {
          subscriptionTier: 'PROFESSIONAL',
          subscriptionStatus: 'ACTIVE',
          features: ['professional_evaluation', 'ai_guides', 'pdf_reports'],
          stripeCustomerId: 'cus_123456789',
          subscriptionId: 'sub_123456789'
        }
      }
    })

    mockClerkClient.users.updateUserMetadata.mockResolvedValue({})
  })

  afterEach(() => {
    // Clear cache after each test
    ClerkTierIntegration['sessionCache'].clear()
    ClerkTierIntegration['permissionCache'].clear()
  })

  describe('getUserTierMetadata', () => {
    it('should retrieve valid tier metadata for a user', async () => {
      const metadata = await ClerkTierIntegration.getUserTierMetadata(mockUserId)

      expect(metadata).toEqual({
        subscriptionTier: 'PROFESSIONAL',
        subscriptionStatus: 'ACTIVE',
        features: ['professional_evaluation', 'ai_guides', 'pdf_reports'],
        stripeCustomerId: 'cus_123456789',
        subscriptionId: 'sub_123456789'
      })

      expect(mockClerkClient.users.getUser).toHaveBeenCalledWith(mockUserId)
    })

    it('should return null for user without metadata', async () => {
      mockClerkClient.users.getUser.mockResolvedValue({
        id: mockUserId,
        privateMetadata: {}
      })

      const metadata = await ClerkTierIntegration.getUserTierMetadata(mockUserId)

      expect(metadata).toBeNull()
    })

    it('should return null for invalid metadata structure', async () => {
      mockClerkClient.users.getUser.mockResolvedValue({
        id: mockUserId,
        privateMetadata: {
          subscriptionData: {
            subscriptionTier: 'INVALID_TIER',
            subscriptionStatus: 'ACTIVE',
            features: 'not_an_array'
          }
        }
      })

      const metadata = await ClerkTierIntegration.getUserTierMetadata(mockUserId)

      expect(metadata).toBeNull()
    })

    it('should handle Clerk API errors gracefully', async () => {
      mockClerkClient.users.getUser.mockRejectedValue(new Error('Clerk API error'))

      const metadata = await ClerkTierIntegration.getUserTierMetadata(mockUserId)

      expect(metadata).toBeNull()
    })
  })

  describe('updateUserTierMetadata', () => {
    const tierUpdateData = {
      tier: 'ENTERPRISE' as SubscriptionTier,
      status: 'ACTIVE' as SubscriptionStatus,
      stripeCustomerId: 'cus_987654321',
      subscriptionId: 'sub_987654321'
    }

    it('should update user tier metadata successfully', async () => {
      await ClerkTierIntegration.updateUserTierMetadata(mockUserId, tierUpdateData)

      expect(mockClerkClient.users.updateUserMetadata).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          privateMetadata: expect.objectContaining({
            subscriptionData: expect.objectContaining({
              subscriptionTier: 'ENTERPRISE',
              subscriptionStatus: 'ACTIVE',
              stripeCustomerId: 'cus_987654321',
              subscriptionId: 'sub_987654321',
              features: expect.arrayContaining(['enterprise_evaluation', 'benchmarks', 'multi_user'])
            })
          })
        })
      )
    })

    it('should handle update failures', async () => {
      mockClerkClient.users.updateUserMetadata.mockRejectedValue(new Error('Update failed'))

      await expect(
        ClerkTierIntegration.updateUserTierMetadata(mockUserId, tierUpdateData)
      ).rejects.toThrow('Failed to update Clerk metadata: Update failed')
    })
  })

  describe('getEnrichedSession', () => {
    it('should return enriched session data', async () => {
      const enrichedSession = await ClerkTierIntegration.getEnrichedSession(mockUserId)

      expect(enrichedSession).toEqual(
        expect.objectContaining({
          userId: mockUserId,
          tier: 'PROFESSIONAL',
          status: 'ACTIVE',
          features: expect.arrayContaining(['professional_evaluation', 'ai_guides', 'pdf_reports']),
          isTrialing: false,
          lastSyncAt: expect.any(Date)
        })
      )
    })

    it('should use cached session data when available', async () => {
      // First call should fetch from Clerk
      const session1 = await ClerkTierIntegration.getEnrichedSession(mockUserId)

      // Second call should use cache
      const session2 = await ClerkTierIntegration.getEnrichedSession(mockUserId)

      expect(session1).toEqual(session2)
      expect(mockClerkClient.users.getUser).toHaveBeenCalledTimes(1)
    })

    it('should handle trial users correctly', async () => {
      mockClerkClient.users.getUser.mockResolvedValue({
        id: mockUserId,
        privateMetadata: {
          subscriptionData: {
            subscriptionTier: 'PROFESSIONAL',
            subscriptionStatus: 'TRIALING',
            features: ['professional_evaluation'],
            trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      })

      const enrichedSession = await ClerkTierIntegration.getEnrichedSession(mockUserId)

      expect(enrichedSession?.isTrialing).toBe(true)
      expect(enrichedSession?.trialEndsAt).toBeInstanceOf(Date)
    })
  })

  describe('getPermissionContext', () => {
    it('should return permission context with correct structure', async () => {
      const permissionContext = await ClerkTierIntegration.getPermissionContext(mockUserId)

      expect(permissionContext).toEqual(
        expect.objectContaining({
          userId: mockUserId,
          tier: 'PROFESSIONAL',
          sessionId: mockSessionId,
          isAuthenticated: true,
          features: expect.arrayContaining(['professional_evaluation', 'ai_guides', 'pdf_reports']),
          permissions: expect.objectContaining({
            features: expect.any(Object),
            limits: expect.any(Object),
            resources: expect.any(Object)
          })
        })
      )
    })

    it('should cache permission context', async () => {
      const context1 = await ClerkTierIntegration.getPermissionContext(mockUserId)
      const context2 = await ClerkTierIntegration.getPermissionContext(mockUserId)

      expect(context1).toEqual(context2)
    })
  })

  describe('handleWebhookUpdate', () => {
    const webhookData: WebhookEventData = {
      type: 'subscription.updated',
      userId: mockUserId,
      stripeCustomerId: 'cus_123456789',
      subscriptionId: 'sub_123456789',
      tier: 'ENTERPRISE',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      processedAt: new Date(),
      processingStatus: 'completed'
    }

    it('should process webhook updates successfully', async () => {
      await ClerkTierIntegration.handleWebhookUpdate(webhookData)

      expect(mockClerkClient.users.updateUserMetadata).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          privateMetadata: expect.objectContaining({
            subscriptionData: expect.objectContaining({
              subscriptionTier: 'ENTERPRISE',
              subscriptionStatus: 'ACTIVE'
            })
          })
        })
      )
    })

    it('should handle webhook update without userId', async () => {
      const webhookDataWithoutUserId = {
        ...webhookData,
        userId: undefined,
        stripeCustomerId: 'cus_123456789'
      }

      // Mock getUserIdByStripeCustomerId to return null
      jest.spyOn(ClerkTierIntegration as any, 'getUserIdByStripeCustomerId')
        .mockResolvedValue(null)

      // Should not throw, but should log warning
      await expect(
        ClerkTierIntegration.handleWebhookUpdate(webhookDataWithoutUserId)
      ).resolves.toBeUndefined()
    })
  })

  describe('validateSessionTierAccess', () => {
    it('should validate tier access correctly', async () => {
      const hasAccess = await ClerkTierIntegration.validateSessionTierAccess(
        mockUserId,
        'PROFESSIONAL'
      )

      expect(hasAccess).toBe(true)
    })

    it('should deny access for insufficient tier', async () => {
      mockClerkClient.users.getUser.mockResolvedValue({
        id: mockUserId,
        privateMetadata: {
          subscriptionData: {
            subscriptionTier: 'BASIC',
            subscriptionStatus: 'ACTIVE',
            features: ['basic_evaluation']
          }
        }
      })

      const hasAccess = await ClerkTierIntegration.validateSessionTierAccess(
        mockUserId,
        'ENTERPRISE'
      )

      expect(hasAccess).toBe(false)
    })

    it('should deny access for inactive subscription', async () => {
      mockClerkClient.users.getUser.mockResolvedValue({
        id: mockUserId,
        privateMetadata: {
          subscriptionData: {
            subscriptionTier: 'PROFESSIONAL',
            subscriptionStatus: 'CANCELED',
            features: ['professional_evaluation']
          }
        }
      })

      const hasAccess = await ClerkTierIntegration.validateSessionTierAccess(
        mockUserId,
        'PROFESSIONAL'
      )

      expect(hasAccess).toBe(false)
    })
  })

  describe('isTrialEndingSoon', () => {
    it('should detect trial ending soon', async () => {
      const trialEndDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now

      mockClerkClient.users.getUser.mockResolvedValue({
        id: mockUserId,
        privateMetadata: {
          subscriptionData: {
            subscriptionTier: 'PROFESSIONAL',
            subscriptionStatus: 'TRIALING',
            features: ['professional_evaluation'],
            trialEndsAt: trialEndDate.toISOString()
          }
        }
      })

      const isEndingSoon = await ClerkTierIntegration.isTrialEndingSoon(mockUserId, 3)

      expect(isEndingSoon).toBe(true)
    })

    it('should not detect trial ending when far away', async () => {
      const trialEndDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now

      mockClerkClient.users.getUser.mockResolvedValue({
        id: mockUserId,
        privateMetadata: {
          subscriptionData: {
            subscriptionTier: 'PROFESSIONAL',
            subscriptionStatus: 'TRIALING',
            features: ['professional_evaluation'],
            trialEndsAt: trialEndDate.toISOString()
          }
        }
      })

      const isEndingSoon = await ClerkTierIntegration.isTrialEndingSoon(mockUserId, 3)

      expect(isEndingSoon).toBe(false)
    })
  })

  describe('refreshUserSession', () => {
    it('should refresh user session and clear cache', async () => {
      // First, get session to populate cache
      await ClerkTierIntegration.getEnrichedSession(mockUserId)

      // Update the mock to return different data
      mockClerkClient.users.getUser.mockResolvedValue({
        id: mockUserId,
        privateMetadata: {
          subscriptionData: {
            subscriptionTier: 'ENTERPRISE',
            subscriptionStatus: 'ACTIVE',
            features: ['enterprise_evaluation', 'benchmarks']
          }
        }
      })

      const refreshedSession = await ClerkTierIntegration.refreshUserSession(mockUserId)

      expect(refreshedSession?.tier).toBe('ENTERPRISE')
      expect(refreshedSession?.features).toContain('enterprise_evaluation')
    })
  })

  describe('validateSessionIntegrity', () => {
    it('should validate healthy session', async () => {
      const validation = await ClerkTierIntegration.validateSessionIntegrity(mockUserId)

      expect(validation.isValid).toBe(true)
      expect(validation.issues).toHaveLength(0)
    })

    it('should detect stale session', async () => {
      // Mock old session data
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      ClerkTierIntegration['sessionCache'].set(mockUserId, {
        data: {
          userId: mockUserId,
          tier: 'PROFESSIONAL',
          status: 'ACTIVE',
          permissions: {} as any,
          features: [],
          limits: {},
          isTrialing: false,
          lastSyncAt: oldDate
        },
        expiresAt: Date.now() + 5 * 60 * 1000
      })

      const validation = await ClerkTierIntegration.validateSessionIntegrity(mockUserId)

      expect(validation.isValid).toBe(false)
      expect(validation.issues).toContain('Session data is stale')
      expect(validation.recommendations).toContain('Refresh session data')
    })

    it('should detect expired trial', async () => {
      mockClerkClient.users.getUser.mockResolvedValue({
        id: mockUserId,
        privateMetadata: {
          subscriptionData: {
            subscriptionTier: 'PROFESSIONAL',
            subscriptionStatus: 'TRIALING',
            features: ['professional_evaluation'],
            trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
          }
        }
      })

      const validation = await ClerkTierIntegration.validateSessionIntegrity(mockUserId)

      expect(validation.isValid).toBe(false)
      expect(validation.issues).toContain('Trial has expired')
    })
  })

  describe('Edge Case Handling', () => {
    it('should handle session_expired edge case', async () => {
      await ClerkTierIntegration.handleAuthEdgeCase('session_expired', mockUserId)

      expect(mockClerkClient.users.updateUserMetadata).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          privateMetadata: expect.objectContaining({
            subscriptionData: null
          })
        })
      )
    })

    it('should handle tier_downgrade edge case', async () => {
      await ClerkTierIntegration.handleAuthEdgeCase(
        'tier_downgrade',
        mockUserId,
        { previousTier: 'ENTERPRISE', newTier: 'PROFESSIONAL' }
      )

      expect(mockClerkClient.users.updateUserMetadata).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          privateMetadata: expect.objectContaining({
            subscriptionData: expect.objectContaining({
              subscriptionTier: 'PROFESSIONAL',
              subscriptionStatus: 'ACTIVE'
            })
          })
        })
      )
    })

    it('should handle subscription_cancelled edge case', async () => {
      await ClerkTierIntegration.handleAuthEdgeCase('subscription_cancelled', mockUserId)

      expect(mockClerkClient.users.updateUserMetadata).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          privateMetadata: expect.objectContaining({
            subscriptionData: expect.objectContaining({
              subscriptionTier: 'BASIC',
              subscriptionStatus: 'CANCELED'
            })
          })
        })
      )
    })

    it('should handle trial_expired edge case', async () => {
      await ClerkTierIntegration.handleAuthEdgeCase('trial_expired', mockUserId)

      expect(mockClerkClient.users.updateUserMetadata).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          privateMetadata: expect.objectContaining({
            subscriptionData: expect.objectContaining({
              subscriptionTier: 'BASIC',
              subscriptionStatus: 'ACTIVE'
            })
          })
        })
      )
    })
  })

  describe('Permission Checking', () => {
    it('should check permissions correctly', async () => {
      const hasPermission = await ClerkTierIntegration.hasPermission(
        'professional_evaluation',
        'read',
        mockUserId
      )

      expect(hasPermission).toBe(true)
    })

    it('should deny permission for unavailable features', async () => {
      const hasPermission = await ClerkTierIntegration.hasPermission(
        'enterprise_evaluation',
        'read',
        mockUserId
      )

      expect(hasPermission).toBe(false)
    })
  })

  describe('Cache Management', () => {
    it('should properly expire cached data', async () => {
      // Get session to populate cache
      await ClerkTierIntegration.getEnrichedSession(mockUserId)

      // Manually expire cache entry
      const cacheEntry = ClerkTierIntegration['sessionCache'].get(mockUserId)
      if (cacheEntry) {
        cacheEntry.expiresAt = Date.now() - 1000 // Expired 1 second ago
      }

      // Next call should fetch fresh data
      await ClerkTierIntegration.getEnrichedSession(mockUserId)

      expect(mockClerkClient.users.getUser).toHaveBeenCalledTimes(2)
    })

    it('should clear user cache on demand', async () => {
      // Populate cache
      await ClerkTierIntegration.getEnrichedSession(mockUserId)
      await ClerkTierIntegration.getPermissionContext(mockUserId)

      // Clear cache
      ClerkTierIntegration['clearUserCache'](mockUserId)

      // Verify cache is empty
      expect(ClerkTierIntegration['sessionCache'].has(mockUserId)).toBe(false)
      expect(ClerkTierIntegration['permissionCache'].has(mockUserId)).toBe(false)
    })
  })
})