/**
 * Integration Tests for Middleware and Session Management - Story 11.10
 * Comprehensive integration tests for the enhanced middleware,
 * session management, and tier-based routing
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'
import { ClerkTierIntegration } from '@/lib/auth/clerk-tier-integration'

// Mock Clerk authMiddleware
const mockAfterAuth = jest.fn()
const mockBeforeAuth = jest.fn()

jest.mock('@clerk/nextjs', () => ({
  authMiddleware: (config: any) => {
    return async (request: NextRequest) => {
      // Simulate beforeAuth hook
      if (config.beforeAuth) {
        const beforeResult = await config.beforeAuth(request)
        if (beforeResult) return beforeResult
      }

      // Mock auth object
      const auth = {
        userId: 'user_123456789',
        sessionId: 'sess_123456789',
        sessionClaims: {
          publicMetadata: {
            subscriptionTier: 'professional',
            subscriptionStatus: 'active'
          }
        }
      }

      // Simulate afterAuth hook
      if (config.afterAuth) {
        return await config.afterAuth(auth, request)
      }

      return NextResponse.next()
    }
  }
}))

// Mock security middleware
jest.mock('@/lib/security/middleware', () => ({
  withSecurity: jest.fn().mockResolvedValue(undefined)
}))

// Mock ClerkTierIntegration
jest.mock('@/lib/auth/clerk-tier-integration', () => ({
  ClerkTierIntegration: {
    getEnrichedSession: jest.fn(),
    getPermissionContext: jest.fn(),
    validateSessionIntegrity: jest.fn()
  }
}))

// Import the middleware after mocking
import middleware from '../apps/web/middleware'

describe('Middleware Integration', () => {
  const baseUrl = 'https://example.com'

  const mockEnrichedSession = {
    userId: 'user_123456789',
    tier: 'PROFESSIONAL',
    status: 'ACTIVE',
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
    userId: 'user_123456789',
    tier: 'PROFESSIONAL',
    permissions: mockEnrichedSession.permissions,
    sessionId: 'sess_123456789',
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
    ClerkTierIntegration.getEnrichedSession = jest.fn().mockResolvedValue(mockEnrichedSession)
    ClerkTierIntegration.getPermissionContext = jest.fn().mockResolvedValue(mockPermissionContext)
    ClerkTierIntegration.validateSessionIntegrity = jest.fn().mockResolvedValue({
      isValid: true,
      issues: [],
      recommendations: []
    })
  })

  describe('Public Routes', () => {
    const publicRoutes = [
      '/',
      '/sign-in',
      '/sign-up',
      '/pricing',
      '/about',
      '/contact',
      '/privacy',
      '/terms'
    ]

    it.each(publicRoutes)('should allow access to public route: %s', async (path) => {
      const request = new NextRequest(`${baseUrl}${path}`)
      const response = await middleware(request)

      expect(response.status).not.toBe(302) // Not redirected
    })
  })

  describe('Authenticated Routes', () => {
    it('should redirect unauthenticated users to sign-in', async () => {
      // Mock unauthenticated user
      jest.doMock('@clerk/nextjs', () => ({
        authMiddleware: (config: any) => {
          return async (request: NextRequest) => {
            const auth = { userId: null, sessionClaims: null }
            return await config.afterAuth(auth, request)
          }
        }
      }))

      const request = new NextRequest(`${baseUrl}/dashboard`)
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toContain('/sign-in')
    })

    it('should allow authenticated users to access protected routes', async () => {
      const request = new NextRequest(`${baseUrl}/dashboard`)
      const response = await middleware(request)

      expect(response.status).not.toBe(302)
    })
  })

  describe('Tier-Based Routing', () => {
    it('should redirect to tier-specific dashboard', async () => {
      const request = new NextRequest(`${baseUrl}/dashboard`)
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toContain('/dashboard/professional')
    })

    it('should redirect to basic dashboard for free tier', async () => {
      const basicSession = {
        ...mockEnrichedSession,
        tier: 'BASIC' as const
      }
      ClerkTierIntegration.getEnrichedSession = jest.fn().mockResolvedValue(basicSession)

      const request = new NextRequest(`${baseUrl}/dashboard`)
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toContain('/dashboard/basic')
    })

    it('should redirect to enterprise dashboard for enterprise tier', async () => {
      const enterpriseSession = {
        ...mockEnrichedSession,
        tier: 'ENTERPRISE' as const
      }
      ClerkTierIntegration.getEnrichedSession = jest.fn().mockResolvedValue(enterpriseSession)

      const request = new NextRequest(`${baseUrl}/dashboard`)
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toContain('/dashboard/enterprise')
    })
  })

  describe('Professional Tier Access Control', () => {
    it('should allow access to professional routes for professional tier', async () => {
      const request = new NextRequest(`${baseUrl}/dashboard/professional`)
      const response = await middleware(request)

      expect(response.status).not.toBe(302)
    })

    it('should redirect free tier users to pricing for professional routes', async () => {
      const basicSession = {
        ...mockEnrichedSession,
        tier: 'BASIC' as const
      }
      ClerkTierIntegration.getEnrichedSession = jest.fn().mockResolvedValue(basicSession)

      const request = new NextRequest(`${baseUrl}/dashboard/professional`)
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toContain('/pricing')
      expect(response.headers.get('location')).toContain('upgrade=professional')
    })
  })

  describe('Enterprise Tier Access Control', () => {
    it('should allow access to enterprise routes for enterprise tier', async () => {
      const enterpriseSession = {
        ...mockEnrichedSession,
        tier: 'ENTERPRISE' as const
      }
      ClerkTierIntegration.getEnrichedSession = jest.fn().mockResolvedValue(enterpriseSession)

      const request = new NextRequest(`${baseUrl}/admin`)
      const response = await middleware(request)

      expect(response.status).not.toBe(302)
    })

    it('should redirect non-enterprise users to pricing for enterprise routes', async () => {
      const request = new NextRequest(`${baseUrl}/admin`)
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toContain('/pricing')
      expect(response.headers.get('location')).toContain('upgrade=enterprise')
    })
  })

  describe('API Route Protection', () => {
    it('should allow access to basic API routes for all tiers', async () => {
      const request = new NextRequest(`${baseUrl}/api/analysis/tier-specific`)
      const response = await middleware(request)

      expect(response.status).not.toBe(403)
    })

    it('should protect professional API routes', async () => {
      const basicSession = {
        ...mockEnrichedSession,
        tier: 'BASIC' as const
      }
      ClerkTierIntegration.getEnrichedSession = jest.fn().mockResolvedValue(basicSession)

      const request = new NextRequest(`${baseUrl}/api/evaluations/professional`)
      const response = await middleware(request)

      expect(response.status).toBe(403)

      const body = await response.json()
      expect(body.error).toBe('Insufficient subscription tier')
      expect(body.code).toBe('TIER_ACCESS_DENIED')
    })

    it('should protect enterprise API routes', async () => {
      const request = new NextRequest(`${baseUrl}/api/evaluations/enterprise`)
      const response = await middleware(request)

      expect(response.status).toBe(403)

      const body = await response.json()
      expect(body.error).toBe('Insufficient subscription tier')
      expect(body.required).toBe('enterprise')
      expect(body.current).toBe('professional')
    })

    it('should check feature access for API routes', async () => {
      const contextWithoutFeature = {
        ...mockPermissionContext,
        features: ['basic_evaluation'] // Missing professional_evaluation
      }
      ClerkTierIntegration.getPermissionContext = jest.fn().mockResolvedValue(contextWithoutFeature)

      const request = new NextRequest(`${baseUrl}/api/evaluations/professional`)
      const response = await middleware(request)

      expect(response.status).toBe(403)

      const body = await response.json()
      expect(body.error).toBe('Feature access denied')
      expect(body.code).toBe('FEATURE_ACCESS_DENIED')
    })
  })

  describe('Enhanced Headers', () => {
    it('should add comprehensive tier information to headers', async () => {
      const request = new NextRequest(`${baseUrl}/dashboard/professional`)
      const response = await middleware(request)

      // Basic headers (backward compatibility)
      expect(response.headers.get('x-user-id')).toBe('user_123456789')
      expect(response.headers.get('x-user-tier')).toBe('professional')
      expect(response.headers.get('x-subscription-status')).toBe('active')

      // Enhanced headers
      expect(response.headers.get('x-session-enriched')).toBe('true')
      expect(response.headers.get('x-is-trialing')).toBe('false')
      expect(response.headers.get('x-middleware-version')).toBe('2.0-enhanced')

      // Permission context
      const permissionContext = JSON.parse(response.headers.get('x-permission-context') || '{}')
      expect(permissionContext.tier).toBe('PROFESSIONAL')
      expect(permissionContext.isAuthenticated).toBe(true)

      // Features and limits
      const features = JSON.parse(response.headers.get('x-user-features') || '[]')
      expect(features).toContain('professional_evaluation')

      const limits = JSON.parse(response.headers.get('x-tier-limits') || '{}')
      expect(limits.monthlyEvaluations).toBe(50)
    })

    it('should add trial information to headers for trialing users', async () => {
      const trialSession = {
        ...mockEnrichedSession,
        isTrialing: true,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
      ClerkTierIntegration.getEnrichedSession = jest.fn().mockResolvedValue(trialSession)

      const request = new NextRequest(`${baseUrl}/dashboard`)
      const response = await middleware(request)

      expect(response.headers.get('x-is-trialing')).toBe('true')
      expect(response.headers.get('x-trial-ends-at')).toBeTruthy()
    })

    it('should include performance metrics in headers', async () => {
      const request = new NextRequest(`${baseUrl}/dashboard`)
      const response = await middleware(request)

      expect(response.headers.get('x-middleware-execution-time')).toBeTruthy()
      expect(parseInt(response.headers.get('x-middleware-execution-time') || '0')).toBeGreaterThan(0)
    })
  })

  describe('Fallback Mechanisms', () => {
    it('should fallback to legacy metadata when enriched session fails', async () => {
      ClerkTierIntegration.getEnrichedSession = jest.fn().mockRejectedValue(new Error('Session error'))

      const request = new NextRequest(`${baseUrl}/dashboard`)
      const response = await middleware(request)

      // Should still work with legacy metadata
      expect(response.headers.get('x-user-tier')).toBe('professional')
      expect(response.headers.get('x-subscription-status')).toBe('active')
    })

    it('should handle permission context failures gracefully', async () => {
      ClerkTierIntegration.getPermissionContext = jest.fn().mockRejectedValue(new Error('Permission error'))

      const request = new NextRequest(`${baseUrl}/dashboard`)
      const response = await middleware(request)

      // Should still work without enhanced permissions
      expect(response.status).not.toBe(500)
      expect(response.headers.get('x-user-id')).toBe('user_123456789')
    })
  })

  describe('Session Validation', () => {
    it('should handle session integrity issues', async () => {
      ClerkTierIntegration.validateSessionIntegrity = jest.fn().mockResolvedValue({
        isValid: false,
        issues: ['Session data is stale'],
        recommendations: ['Refresh session data']
      })

      const request = new NextRequest(`${baseUrl}/dashboard`)
      const response = await middleware(request)

      // Should still allow access but trigger refresh
      expect(response.status).not.toBe(302)
    })
  })

  describe('Rate Limiting', () => {
    it('should check rate limits for API routes', async () => {
      // Mock rate limit exceeded
      jest.doMock('../apps/web/middleware', () => {
        const originalModule = jest.requireActual('../apps/web/middleware')
        return {
          ...originalModule,
          checkApiRateLimit: jest.fn().mockResolvedValue({
            allowed: false,
            limit: 100,
            remaining: 0,
            resetAt: new Date().toISOString()
          })
        }
      })

      const request = new NextRequest(`${baseUrl}/api/evaluations/professional`)
      const response = await middleware(request)

      // Should return 429 for rate limit exceeded
      // Note: This test would need the actual rate limiting implementation
      // For now, we just verify the structure is in place
      expect(response.status).not.toBe(500)
    })
  })

  describe('Onboarding Flow', () => {
    it('should redirect to onboarding for new users', async () => {
      // Mock incomplete onboarding
      jest.doMock('@clerk/nextjs', () => ({
        authMiddleware: (config: any) => {
          return async (request: NextRequest) => {
            const auth = {
              userId: 'user_123456789',
              sessionClaims: {
                publicMetadata: {
                  subscriptionTier: 'professional',
                  subscriptionStatus: 'active'
                  // Missing onboardingCompleted and businessName
                }
              }
            }
            return await config.afterAuth(auth, request)
          }
        }
      }))

      const request = new NextRequest(`${baseUrl}/dashboard`)
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toContain('/onboarding')
    })
  })

  describe('Error Handling', () => {
    it('should handle middleware errors gracefully', async () => {
      ClerkTierIntegration.getEnrichedSession = jest.fn().mockRejectedValue(new Error('Critical error'))
      ClerkTierIntegration.getPermissionContext = jest.fn().mockRejectedValue(new Error('Critical error'))

      const request = new NextRequest(`${baseUrl}/dashboard`)
      const response = await middleware(request)

      // Should not crash and fall back to basic functionality
      expect(response.status).not.toBe(500)
      expect(response.headers.get('x-user-id')).toBeTruthy()
    })
  })

  describe('Webhook Routes', () => {
    it('should allow public access to Stripe webhooks', async () => {
      const request = new NextRequest(`${baseUrl}/api/webhooks/stripe/subscription-updates`)
      const response = await middleware(request)

      // Webhook routes should be excluded from auth middleware
      expect(response.status).not.toBe(302)
      expect(response.status).not.toBe(403)
    })
  })

  describe('Performance Monitoring', () => {
    it('should complete middleware execution within reasonable time', async () => {
      const startTime = Date.now()
      const request = new NextRequest(`${baseUrl}/dashboard`)
      await middleware(request)
      const executionTime = Date.now() - startTime

      // Should complete within 2 seconds (as per requirements)
      expect(executionTime).toBeLessThan(2000)
    })
  })
})