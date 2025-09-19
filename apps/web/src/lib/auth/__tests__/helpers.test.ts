/**
 * Tests for Authentication Helpers - Story 11.10
 * Test suite for helper functions including tier access, permission checking,
 * and authentication edge cases
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import {
  getAuthState,
  checkTierAccess,
  checkFeatureAccess,
  checkPermissionWithUsage,
  getFeatureAccessStatus,
  handleAuthEdgeCase,
  refreshPermissionsAfterTierChange,
  getUpgradeRecommendations,
  cachedGetAuthState,
  cachedCheckTierAccess,
  cachedCheckFeatureAccess
} from '../helpers'
import type { SubscriptionTier, SubscriptionStatus } from '@/types/subscription'

// Mock dependencies
const mockAuth = jest.fn()
const mockCurrentUser = jest.fn()
const mockGetEnrichedSession = jest.fn()
const mockGetPermissionContext = jest.fn()
const mockGetCurrentUserTier = jest.fn()
const mockHasFeatureAccess = jest.fn()
const mockHasPermission = jest.fn()

jest.mock('@clerk/nextjs', () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser
}))

jest.mock('../clerk-tier-integration', () => ({
  ClerkTierIntegration: {
    getEnrichedSession: mockGetEnrichedSession,
    getPermissionContext: mockGetPermissionContext,
    handleAuthEdgeCase: jest.fn(),
    refreshUserSession: jest.fn()
  },
  getCurrentUserTier: mockGetCurrentUserTier,
  getEnrichedSession: mockGetEnrichedSession,
  getPermissionContext: mockGetPermissionContext,
  hasFeatureAccess: mockHasFeatureAccess,
  hasPermission: mockHasPermission
}))

jest.mock('@/lib/access-control/tier-access-control', () => ({
  tierAccessControl: {
    hasTierAccess: jest.fn(),
    getPermissionsForTier: jest.fn(),
    checkPermission: jest.fn(),
    getCurrentUsage: jest.fn(),
    trackUsage: jest.fn()
  }
}))

describe('Authentication Helpers', () => {
  const mockUserId = 'user_123456789'
  const mockSessionId = 'sess_123456789'

  const mockUser = {
    id: mockUserId,
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    firstName: 'John',
    lastName: 'Doe',
    imageUrl: 'https://example.com/avatar.jpg'
  }

  const mockEnrichedSession = {
    userId: mockUserId,
    tier: 'PROFESSIONAL' as SubscriptionTier,
    status: 'ACTIVE' as SubscriptionStatus,
    permissions: {
      features: {
        professional_evaluation: { read: 'read', write: 'write' },
        ai_guides: { read: 'read' }
      },
      limits: { monthlyEvaluations: 50, monthlyReports: 20, apiCalls: 1000 },
      resources: {}
    },
    features: ['professional_evaluation', 'ai_guides', 'pdf_reports'],
    limits: { monthlyEvaluations: 50, monthlyReports: 20, apiCalls: 1000 },
    isTrialing: false,
    trialEndsAt: undefined,
    subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    lastSyncAt: new Date()
  }

  const mockPermissionContext = {
    userId: mockUserId,
    tier: 'PROFESSIONAL' as SubscriptionTier,
    permissions: mockEnrichedSession.permissions,
    sessionId: mockSessionId,
    isAuthenticated: true,
    features: mockEnrichedSession.features,
    limits: mockEnrichedSession.limits,
    metadata: {
      isTrialing: false,
      subscriptionEndsAt: mockEnrichedSession.subscriptionEndsAt?.toISOString(),
      lastSyncAt: mockEnrichedSession.lastSyncAt.toISOString()
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock responses
    mockAuth.mockResolvedValue({
      userId: mockUserId,
      sessionId: mockSessionId
    })

    mockCurrentUser.mockResolvedValue(mockUser)
    mockGetEnrichedSession.mockResolvedValue(mockEnrichedSession)
    mockGetPermissionContext.mockResolvedValue(mockPermissionContext)
    mockGetCurrentUserTier.mockResolvedValue('PROFESSIONAL')
    mockHasFeatureAccess.mockResolvedValue(true)
    mockHasPermission.mockResolvedValue(true)
  })

  describe('getAuthState', () => {
    it('should return complete auth state for authenticated user', async () => {
      const authState = await getAuthState()

      expect(authState).toEqual({
        isAuthenticated: true,
        user: {
          id: mockUserId,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          imageUrl: 'https://example.com/avatar.jpg'
        },
        tier: 'PROFESSIONAL',
        status: 'ACTIVE',
        features: ['professional_evaluation', 'ai_guides', 'pdf_reports'],
        permissions: mockEnrichedSession.permissions,
        isTrialing: false,
        trialEndsAt: undefined,
        subscriptionEndsAt: mockEnrichedSession.subscriptionEndsAt,
        lastSyncAt: mockEnrichedSession.lastSyncAt
      })
    })

    it('should return unauthenticated state when no user', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const authState = await getAuthState()

      expect(authState).toEqual({
        isAuthenticated: false,
        user: null,
        tier: 'BASIC',
        status: 'ACTIVE',
        features: [],
        permissions: null,
        isTrialing: false
      })
    })

    it('should handle missing user data gracefully', async () => {
      mockCurrentUser.mockResolvedValue(null)

      const authState = await getAuthState()

      expect(authState.isAuthenticated).toBe(true)
      expect(authState.user).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      mockAuth.mockRejectedValue(new Error('Auth error'))

      const authState = await getAuthState()

      expect(authState.isAuthenticated).toBe(false)
      expect(authState.user).toBeNull()
    })
  })

  describe('checkTierAccess', () => {
    const { tierAccessControl } = require('@/lib/access-control/tier-access-control')

    it('should allow access for sufficient tier', async () => {
      tierAccessControl.hasTierAccess.mockReturnValue(true)

      const result = await checkTierAccess('PROFESSIONAL')

      expect(result).toEqual({
        allowed: true
      })
    })

    it('should deny access for insufficient tier', async () => {
      tierAccessControl.hasTierAccess.mockReturnValue(false)

      const result = await checkTierAccess('ENTERPRISE')

      expect(result).toEqual({
        allowed: false,
        reason: 'Requires ENTERPRISE tier',
        requiredTier: 'ENTERPRISE',
        upgradeUrl: '/pricing?upgrade=enterprise',
        blockedBy: 'tier'
      })
    })

    it('should handle missing user tier', async () => {
      mockGetCurrentUserTier.mockResolvedValue(null)

      const result = await checkTierAccess('PROFESSIONAL')

      expect(result).toEqual({
        allowed: false,
        reason: 'User tier not found',
        requiredTier: 'PROFESSIONAL',
        upgradeUrl: '/pricing?upgrade=professional',
        blockedBy: 'tier'
      })
    })
  })

  describe('checkFeatureAccess', () => {
    it('should allow access for available feature', async () => {
      const result = await checkFeatureAccess('professional_evaluation')

      expect(result).toEqual({
        allowed: true
      })
    })

    it('should deny access for unavailable feature', async () => {
      mockHasPermission.mockResolvedValue(false)

      const result = await checkFeatureAccess('enterprise_evaluation')

      expect(result).toEqual({
        allowed: false,
        reason: "Feature 'enterprise_evaluation' not available in current tier",
        upgradeUrl: '/pricing',
        blockedBy: 'feature'
      })
    })

    it('should handle missing permission context', async () => {
      mockGetPermissionContext.mockResolvedValue(null)

      const result = await checkFeatureAccess('professional_evaluation')

      expect(result).toEqual({
        allowed: false,
        reason: 'Permission context not found',
        upgradeUrl: '/pricing',
        blockedBy: 'feature'
      })
    })
  })

  describe('checkPermissionWithUsage', () => {
    const { tierAccessControl } = require('@/lib/access-control/tier-access-control')

    it('should allow access with valid permission and usage', async () => {
      tierAccessControl.checkPermission.mockReturnValue({
        allowed: true,
        permission: 'write'
      })
      tierAccessControl.getCurrentUsage.mockReturnValue(5)

      const result = await checkPermissionWithUsage(
        'professional_evaluation',
        'write',
        mockUserId,
        true
      )

      expect(result.allowed).toBe(true)
      expect(result.usageInfo).toEqual({
        hasAccess: true,
        usageCount: 5,
        usageLimit: 1000,
        remainingUsage: 995,
        resetDate: expect.any(Date)
      })

      expect(tierAccessControl.trackUsage).toHaveBeenCalled()
    })

    it('should deny access for expired trial', async () => {
      const expiredTrialSession = {
        ...mockEnrichedSession,
        isTrialing: true,
        trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      }
      mockGetEnrichedSession.mockResolvedValue(expiredTrialSession)

      const authState = await getAuthState()
      const result = await checkPermissionWithUsage('professional_evaluation', 'read')

      expect(result).toEqual({
        allowed: false,
        reason: 'Trial has expired',
        upgradeUrl: '/pricing?reason=trial_expired',
        blockedBy: 'trial_expired'
      })
    })

    it('should deny access for inactive subscription', async () => {
      const inactiveSession = {
        ...mockEnrichedSession,
        status: 'CANCELED' as SubscriptionStatus
      }
      mockGetEnrichedSession.mockResolvedValue(inactiveSession)

      const result = await checkPermissionWithUsage('professional_evaluation', 'read')

      expect(result).toEqual({
        allowed: false,
        reason: 'Subscription status is CANCELED',
        upgradeUrl: '/pricing',
        blockedBy: 'status'
      })
    })

    it('should deny access for usage limit exceeded', async () => {
      tierAccessControl.checkPermission.mockReturnValue({
        allowed: false,
        permission: 'none',
        reason: 'Usage limit exceeded',
        conditions: [{ type: 'usage_limit' }]
      })

      const result = await checkPermissionWithUsage('professional_evaluation', 'write')

      expect(result).toEqual({
        allowed: false,
        reason: 'Usage limit exceeded',
        upgradeUrl: '/pricing',
        blockedBy: 'usage_limit'
      })
    })
  })

  describe('getFeatureAccessStatus', () => {
    const features = ['professional_evaluation', 'ai_guides', 'enterprise_evaluation']

    it('should return status for all requested features', async () => {
      mockHasFeatureAccess
        .mockResolvedValueOnce(true)  // professional_evaluation
        .mockResolvedValueOnce(true)  // ai_guides
        .mockResolvedValueOnce(false) // enterprise_evaluation

      const { tierAccessControl } = require('@/lib/access-control/tier-access-control')
      tierAccessControl.getCurrentUsage.mockReturnValue(5)

      const status = await getFeatureAccessStatus(features)

      expect(status).toEqual({
        professional_evaluation: {
          hasAccess: true,
          usageCount: 5,
          usageLimit: 1000,
          remainingUsage: 995,
          resetDate: expect.any(Date)
        },
        ai_guides: {
          hasAccess: true,
          usageCount: 5,
          usageLimit: 1000,
          remainingUsage: 995,
          resetDate: expect.any(Date)
        },
        enterprise_evaluation: {
          hasAccess: false,
          usageCount: 5,
          usageLimit: 1000,
          remainingUsage: 995,
          resetDate: expect.any(Date),
          reason: 'Feature not available in PROFESSIONAL tier'
        }
      })
    })

    it('should handle unauthenticated user', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const status = await getFeatureAccessStatus(features)

      Object.values(status).forEach(featureStatus => {
        expect(featureStatus.hasAccess).toBe(false)
        expect(featureStatus.reason).toBe('User not authenticated')
      })
    })
  })

  describe('handleAuthEdgeCase', () => {
    const { ClerkTierIntegration } = require('../clerk-tier-integration')

    it('should handle session_expired scenario', async () => {
      const result = await handleAuthEdgeCase('session_expired')

      expect(result).toEqual({
        success: true,
        message: 'Session refreshed',
        redirectUrl: '/sign-in?reason=session_expired'
      })

      expect(ClerkTierIntegration.handleAuthEdgeCase).toHaveBeenCalledWith(
        'session_expired',
        mockUserId,
        undefined
      )
    })

    it('should handle tier_downgrade scenario', async () => {
      const context = { previousTier: 'ENTERPRISE', newTier: 'PROFESSIONAL' }
      const result = await handleAuthEdgeCase('tier_downgrade', undefined, context)

      expect(result).toEqual({
        success: true,
        message: 'Tier downgraded, access updated',
        redirectUrl: '/dashboard?notice=tier_downgraded'
      })
    })

    it('should handle subscription_cancelled scenario', async () => {
      const result = await handleAuthEdgeCase('subscription_cancelled')

      expect(result).toEqual({
        success: true,
        message: 'Subscription cancelled, moved to basic tier',
        redirectUrl: '/dashboard?notice=subscription_cancelled'
      })
    })

    it('should handle trial_expired scenario', async () => {
      const result = await handleAuthEdgeCase('trial_expired')

      expect(result).toEqual({
        success: true,
        message: 'Trial expired, please upgrade',
        redirectUrl: '/pricing?reason=trial_expired'
      })
    })

    it('should handle unauthenticated user', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const result = await handleAuthEdgeCase('session_expired')

      expect(result).toEqual({
        success: false,
        message: 'User not authenticated',
        redirectUrl: '/sign-in'
      })
    })
  })

  describe('refreshPermissionsAfterTierChange', () => {
    const { ClerkTierIntegration } = require('../clerk-tier-integration')

    it('should refresh permissions successfully', async () => {
      const newSession = {
        ...mockEnrichedSession,
        tier: 'ENTERPRISE' as SubscriptionTier
      }

      ClerkTierIntegration.refreshUserSession.mockResolvedValue(newSession)

      const result = await refreshPermissionsAfterTierChange()

      expect(result).toEqual({
        success: true,
        newTier: 'ENTERPRISE',
        message: 'Permissions refreshed successfully'
      })
    })

    it('should handle refresh failure', async () => {
      ClerkTierIntegration.refreshUserSession.mockResolvedValue(null)

      const result = await refreshPermissionsAfterTierChange()

      expect(result).toEqual({
        success: false,
        message: 'Failed to refresh permissions'
      })
    })
  })

  describe('getUpgradeRecommendations', () => {
    it('should recommend PROFESSIONAL tier for professional features', async () => {
      mockGetCurrentUserTier.mockResolvedValue('BASIC')

      const recommendations = await getUpgradeRecommendations(['professional_evaluation'])

      expect(recommendations).toEqual({
        recommendedTier: 'PROFESSIONAL',
        benefits: expect.arrayContaining([
          'Advanced AI-powered evaluations',
          'Professional PDF reports',
          'Progress tracking'
        ]),
        features: ['professional_evaluation'],
        estimatedPrice: '$29/month',
        upgradeUrl: '/pricing?upgrade=professional&features=professional_evaluation'
      })
    })

    it('should recommend ENTERPRISE tier for enterprise features', async () => {
      const recommendations = await getUpgradeRecommendations(['enterprise_evaluation', 'benchmarks'])

      expect(recommendations).toEqual({
        recommendedTier: 'ENTERPRISE',
        benefits: expect.arrayContaining([
          'Enterprise-grade evaluations',
          'Custom branding',
          'Multi-user support'
        ]),
        features: ['enterprise_evaluation', 'benchmarks'],
        estimatedPrice: '$99/month',
        upgradeUrl: '/pricing?upgrade=enterprise&features=enterprise_evaluation,benchmarks'
      })
    })
  })

  describe('Cached Functions', () => {
    it('should cache auth state results', async () => {
      const state1 = await cachedGetAuthState()
      const state2 = await cachedGetAuthState()

      expect(state1).toEqual(state2)
      expect(mockAuth).toHaveBeenCalledTimes(1)
    })

    it('should cache tier access results', async () => {
      const { tierAccessControl } = require('@/lib/access-control/tier-access-control')
      tierAccessControl.hasTierAccess.mockReturnValue(true)

      const result1 = await cachedCheckTierAccess('PROFESSIONAL')
      const result2 = await cachedCheckTierAccess('PROFESSIONAL')

      expect(result1).toEqual(result2)
    })

    it('should cache feature access results', async () => {
      const result1 = await cachedCheckFeatureAccess('professional_evaluation')
      const result2 = await cachedCheckFeatureAccess('professional_evaluation')

      expect(result1).toEqual(result2)
      expect(mockGetPermissionContext).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle errors in getAuthState gracefully', async () => {
      mockAuth.mockRejectedValue(new Error('Network error'))

      const authState = await getAuthState()

      expect(authState.isAuthenticated).toBe(false)
      expect(authState.user).toBeNull()
    })

    it('should handle errors in checkTierAccess gracefully', async () => {
      mockGetCurrentUserTier.mockRejectedValue(new Error('Database error'))

      const result = await checkTierAccess('PROFESSIONAL')

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Error checking tier access')
    })

    it('should handle errors in checkFeatureAccess gracefully', async () => {
      mockGetPermissionContext.mockRejectedValue(new Error('Permission error'))

      const result = await checkFeatureAccess('professional_evaluation')

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Error checking feature access')
    })
  })
})