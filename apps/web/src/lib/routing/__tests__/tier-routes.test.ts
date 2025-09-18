/**
 * Unit tests for tier-based routing logic
 * Tests routing decisions, access control, and navigation generation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  TierRoutingEngine,
  TIER_PROTECTED_ROUTES,
  PUBLIC_ROUTES,
  AUTHENTICATED_ROUTES
} from '../tier-routes'
import {
  SubscriptionTier,
  RoutingDecision,
  TIER_FEATURES,
  DASHBOARD_ROUTES
} from '@/types/subscription'

describe('TierRoutingEngine', () => {
  describe('makeRoutingDecision', () => {
    it('should allow access to public routes for all users', () => {
      const publicPaths = ['/', '/auth/login', '/pricing', '/about', '/api/health']
      const userTiers: SubscriptionTier[] = ['BASIC', 'PROFESSIONAL', 'ENTERPRISE']

      for (const path of publicPaths) {
        for (const tier of userTiers) {
          const decision = TierRoutingEngine.makeRoutingDecision(path, tier)

          expect(decision).toMatchObject({
            shouldRoute: false,
            allowAccess: true,
            reason: 'Public route',
            currentTier: tier,
            missingFeatures: []
          })
        }
      }
    })

    it('should allow access to authenticated routes without tier restrictions', () => {
      const authPaths = ['/dashboard', '/profile', '/settings', '/evaluations']
      const userTiers: SubscriptionTier[] = ['BASIC', 'PROFESSIONAL', 'ENTERPRISE']

      for (const path of authPaths) {
        for (const tier of userTiers) {
          const decision = TierRoutingEngine.makeRoutingDecision(path, tier)

          expect(decision).toMatchObject({
            shouldRoute: false,
            allowAccess: true,
            reason: 'Authenticated route, no tier restriction',
            currentTier: tier,
            missingFeatures: []
          })
        }
      }
    })

    it('should allow access when user has required tier', () => {
      const testCases = [
        { path: '/dashboard/professional', tier: 'PROFESSIONAL', shouldAllow: true },
        { path: '/dashboard/professional', tier: 'ENTERPRISE', shouldAllow: true },
        { path: '/dashboard/enterprise', tier: 'ENTERPRISE', shouldAllow: true },
        { path: '/evaluations/professional', tier: 'PROFESSIONAL', shouldAllow: true },
        { path: '/evaluations/professional', tier: 'ENTERPRISE', shouldAllow: true },
        { path: '/analytics/benchmarks', tier: 'ENTERPRISE', shouldAllow: true }
      ]

      for (const { path, tier, shouldAllow } of testCases) {
        const features = TIER_FEATURES[tier as SubscriptionTier]
        const decision = TierRoutingEngine.makeRoutingDecision(
          path,
          tier as SubscriptionTier,
          features
        )

        if (shouldAllow) {
          expect(decision).toMatchObject({
            shouldRoute: false,
            allowAccess: true,
            reason: 'Access granted',
            currentTier: tier,
            missingFeatures: []
          })
        }
      }
    })

    it('should deny access when user lacks required tier', () => {
      const testCases = [
        {
          path: '/dashboard/professional',
          tier: 'BASIC',
          expectedRedirect: '/dashboard/basic'
        },
        {
          path: '/dashboard/enterprise',
          tier: 'BASIC',
          expectedRedirect: '/dashboard/basic'
        },
        {
          path: '/dashboard/enterprise',
          tier: 'PROFESSIONAL',
          expectedRedirect: '/dashboard/professional'
        }
      ]

      for (const { path, tier, expectedRedirect } of testCases) {
        const features = TIER_FEATURES[tier as SubscriptionTier]
        const decision = TierRoutingEngine.makeRoutingDecision(
          path,
          tier as SubscriptionTier,
          features
        )

        expect(decision).toMatchObject({
          shouldRoute: true,
          targetRoute: expectedRedirect,
          allowAccess: false,
          reason: 'Redirecting to appropriate dashboard',
          currentTier: tier
        })
      }
    })

    it('should deny access when user lacks required features', () => {
      const testCases = [
        {
          path: '/evaluations/professional',
          tier: 'PROFESSIONAL',
          features: ['basic_evaluation'], // Missing 'professional_evaluation'
          expectedMissingFeatures: ['professional_evaluation']
        },
        {
          path: '/analytics/benchmarks',
          tier: 'ENTERPRISE',
          features: ['basic_analytics'], // Missing 'benchmarks'
          expectedMissingFeatures: ['benchmarks']
        },
        {
          path: '/reports/pdf',
          tier: 'PROFESSIONAL',
          features: ['basic_reports'], // Missing 'pdf_reports'
          expectedMissingFeatures: ['pdf_reports']
        }
      ]

      for (const { path, tier, features, expectedMissingFeatures } of testCases) {
        const decision = TierRoutingEngine.makeRoutingDecision(
          path,
          tier as SubscriptionTier,
          features
        )

        expect(decision).toMatchObject({
          shouldRoute: true,
          allowAccess: false,
          reason: 'Insufficient tier or missing features',
          currentTier: tier,
          missingFeatures: expectedMissingFeatures
        })
      }
    })

    it('should redirect to upgrade page for non-dashboard routes', () => {
      const testCases = [
        {
          path: '/evaluations/professional',
          tier: 'BASIC',
          expectedTarget: '/evaluations'
        },
        {
          path: '/analytics/benchmarks',
          tier: 'BASIC',
          expectedTarget: '/analytics/advanced'
        },
        {
          path: '/reports/pdf',
          tier: 'BASIC',
          expectedTarget: '/reports'
        }
      ]

      for (const { path, tier, expectedTarget } of testCases) {
        const decision = TierRoutingEngine.makeRoutingDecision(
          path,
          tier as SubscriptionTier,
          []
        )

        expect(decision.shouldRoute).toBe(true)
        expect(decision.targetRoute).toBe(expectedTarget)
        expect(decision.allowAccess).toBe(false)
      }
    })

    it('should handle API routes without fallback redirects', () => {
      const apiPaths = [
        '/api/evaluations/professional',
        '/api/evaluations/enterprise',
        '/api/reports/pdf',
        '/api/analytics/benchmarks'
      ]

      for (const path of apiPaths) {
        const decision = TierRoutingEngine.makeRoutingDecision(path, 'BASIC', [])

        expect(decision.shouldRoute).toBe(true)
        expect(decision.allowAccess).toBe(false)
        // API routes should redirect to upgrade pages
        expect(decision.targetRoute).toMatch(/\/pricing/)
      }
    })

    it('should handle exact match vs prefix matching', () => {
      // Exact match test
      const exactDecision = TierRoutingEngine.makeRoutingDecision(
        '/dashboard/professional',
        'BASIC',
        []
      )
      expect(exactDecision.shouldRoute).toBe(true)

      // Prefix match test
      const prefixDecision = TierRoutingEngine.makeRoutingDecision(
        '/evaluations/professional/advanced',
        'BASIC',
        []
      )
      expect(prefixDecision.shouldRoute).toBe(true)

      // Non-matching path
      const nonMatchingDecision = TierRoutingEngine.makeRoutingDecision(
        '/unprotected/path',
        'BASIC',
        []
      )
      expect(nonMatchingDecision.shouldRoute).toBe(false)
      expect(nonMatchingDecision.allowAccess).toBe(true)
    })
  })

  describe('getDashboardForTier', () => {
    it('should return correct dashboard routes for each tier', () => {
      expect(TierRoutingEngine.getDashboardForTier('BASIC')).toBe('/dashboard/basic')
      expect(TierRoutingEngine.getDashboardForTier('PROFESSIONAL')).toBe('/dashboard/professional')
      expect(TierRoutingEngine.getDashboardForTier('ENTERPRISE')).toBe('/dashboard/enterprise')
    })

    it('should fallback to basic dashboard for unknown tiers', () => {
      expect(TierRoutingEngine.getDashboardForTier('UNKNOWN' as any)).toBe('/dashboard/basic')
    })
  })

  describe('getFeaturesForTier', () => {
    it('should return correct features for each tier', () => {
      expect(TierRoutingEngine.getFeaturesForTier('BASIC')).toEqual(TIER_FEATURES.BASIC)
      expect(TierRoutingEngine.getFeaturesForTier('PROFESSIONAL')).toEqual(TIER_FEATURES.PROFESSIONAL)
      expect(TierRoutingEngine.getFeaturesForTier('ENTERPRISE')).toEqual(TIER_FEATURES.ENTERPRISE)
    })

    it('should include all lower tier features in higher tiers', () => {
      const basicFeatures = TierRoutingEngine.getFeaturesForTier('BASIC')
      const professionalFeatures = TierRoutingEngine.getFeaturesForTier('PROFESSIONAL')
      const enterpriseFeatures = TierRoutingEngine.getFeaturesForTier('ENTERPRISE')

      // Professional should include all basic features
      for (const feature of basicFeatures) {
        expect(professionalFeatures).toContain(feature)
      }

      // Enterprise should include all professional features
      for (const feature of professionalFeatures) {
        expect(enterpriseFeatures).toContain(feature)
      }
    })
  })

  describe('hasFeatureAccess', () => {
    it('should correctly identify feature access for each tier', () => {
      const testCases = [
        { tier: 'BASIC', feature: 'basic_evaluation', expected: true },
        { tier: 'BASIC', feature: 'professional_evaluation', expected: false },
        { tier: 'BASIC', feature: 'enterprise_evaluation', expected: false },
        { tier: 'PROFESSIONAL', feature: 'basic_evaluation', expected: true },
        { tier: 'PROFESSIONAL', feature: 'professional_evaluation', expected: true },
        { tier: 'PROFESSIONAL', feature: 'enterprise_evaluation', expected: false },
        { tier: 'ENTERPRISE', feature: 'basic_evaluation', expected: true },
        { tier: 'ENTERPRISE', feature: 'professional_evaluation', expected: true },
        { tier: 'ENTERPRISE', feature: 'enterprise_evaluation', expected: true }
      ]

      for (const { tier, feature, expected } of testCases) {
        const hasAccess = TierRoutingEngine.hasFeatureAccess(tier as SubscriptionTier, feature)
        expect(hasAccess).toBe(expected)
      }
    })
  })

  describe('getMinimumTierForFeature', () => {
    it('should return correct minimum tier for features', () => {
      const testCases = [
        { feature: 'basic_evaluation', expectedTier: 'BASIC' },
        { feature: 'professional_evaluation', expectedTier: 'PROFESSIONAL' },
        { feature: 'enterprise_evaluation', expectedTier: 'ENTERPRISE' },
        { feature: 'ai_guides', expectedTier: 'PROFESSIONAL' },
        { feature: 'benchmarks', expectedTier: 'ENTERPRISE' },
        { feature: 'nonexistent_feature', expectedTier: null }
      ]

      for (const { feature, expectedTier } of testCases) {
        const minimumTier = TierRoutingEngine.getMinimumTierForFeature(feature)
        expect(minimumTier).toBe(expectedTier)
      }
    })
  })

  describe('getNavigationForTier', () => {
    it('should generate navigation appropriate for each tier', () => {
      const basicNav = TierRoutingEngine.getNavigationForTier('BASIC')
      const professionalNav = TierRoutingEngine.getNavigationForTier('PROFESSIONAL')
      const enterpriseNav = TierRoutingEngine.getNavigationForTier('ENTERPRISE')

      // Basic tier should have base navigation
      expect(basicNav.some(item => item.label === 'Dashboard')).toBe(true)
      expect(basicNav.some(item => item.label === 'Evaluations')).toBe(true)

      // Professional tier should have additional features
      const professionalAnalysis = professionalNav.find(item => item.label === 'Professional Analysis')
      expect(professionalAnalysis).toBeDefined()
      expect(professionalAnalysis?.available).toBe(true)

      const aiGuides = professionalNav.find(item => item.label === 'AI Guides')
      expect(aiGuides).toBeDefined()
      expect(aiGuides?.available).toBe(true)

      // Enterprise tier should have all features
      const enterpriseAnalysis = enterpriseNav.find(item => item.label === 'Enterprise Analysis')
      expect(enterpriseAnalysis).toBeDefined()
      expect(enterpriseAnalysis?.available).toBe(true)

      const benchmarks = enterpriseNav.find(item => item.label === 'Benchmarks')
      expect(benchmarks).toBeDefined()
      expect(benchmarks?.available).toBe(true)
    })

    it('should mark unavailable features correctly', () => {
      const basicNav = TierRoutingEngine.getNavigationForTier('BASIC')

      const professionalFeatures = basicNav.filter(item =>
        item.requiresTier === 'PROFESSIONAL'
      )

      for (const feature of professionalFeatures) {
        expect(feature.available).toBe(false)
      }

      const enterpriseFeatures = basicNav.filter(item =>
        item.requiresTier === 'ENTERPRISE'
      )

      for (const feature of enterpriseFeatures) {
        expect(feature.available).toBe(false)
      }
    })
  })

  describe('getInitialRedirectForTier', () => {
    it('should redirect to appropriate dashboard for each tier', () => {
      expect(TierRoutingEngine.getInitialRedirectForTier('BASIC')).toBe('/dashboard/basic')
      expect(TierRoutingEngine.getInitialRedirectForTier('PROFESSIONAL')).toBe('/dashboard/professional')
      expect(TierRoutingEngine.getInitialRedirectForTier('ENTERPRISE')).toBe('/dashboard/enterprise')
    })
  })

  describe('validateRouteConfig', () => {
    it('should validate route configuration correctly', () => {
      const issues = TierRoutingEngine.validateRouteConfig()

      // Should not have any issues with the current configuration
      expect(Array.isArray(issues)).toBe(true)

      // Check that all non-API routes have fallback routes
      const nonApiRoutes = TIER_PROTECTED_ROUTES.filter(route =>
        !route.pattern.startsWith('/api')
      )

      for (const route of nonApiRoutes) {
        const routeIssues = issues.find(issue => issue.route === route.pattern)
        if (routeIssues) {
          expect(routeIssues.issues).not.toContain('Missing fallback route for non-API endpoint')
        }
      }
    })

    it('should detect missing fallback routes', () => {
      // Test with a mock configuration that has missing fallback
      const originalRoutes = [...TIER_PROTECTED_ROUTES]

      // Add a route without fallback
      TIER_PROTECTED_ROUTES.push({
        pattern: '/test/missing-fallback',
        requiredTier: 'PROFESSIONAL',
        exactMatch: true
        // No fallbackRoute
      })

      const issues = TierRoutingEngine.validateRouteConfig()
      const testRouteIssues = issues.find(issue => issue.route === '/test/missing-fallback')

      expect(testRouteIssues).toBeDefined()
      expect(testRouteIssues?.issues).toContain('Missing fallback route for non-API endpoint')

      // Restore original routes
      TIER_PROTECTED_ROUTES.length = originalRoutes.length
      TIER_PROTECTED_ROUTES.push(...originalRoutes.slice(TIER_PROTECTED_ROUTES.length))
    })

    it('should detect invalid required features', () => {
      const originalRoutes = [...TIER_PROTECTED_ROUTES]

      // Add a route with invalid feature
      TIER_PROTECTED_ROUTES.push({
        pattern: '/test/invalid-feature',
        requiredTier: 'PROFESSIONAL',
        requiredFeature: 'nonexistent_feature',
        fallbackRoute: '/test',
        exactMatch: true
      })

      const issues = TierRoutingEngine.validateRouteConfig()
      const testRouteIssues = issues.find(issue => issue.route === '/test/invalid-feature')

      expect(testRouteIssues).toBeDefined()
      expect(testRouteIssues?.issues).toContain("Required feature 'nonexistent_feature' not found in tier features")

      // Restore original routes
      TIER_PROTECTED_ROUTES.length = originalRoutes.length
      TIER_PROTECTED_ROUTES.push(...originalRoutes.slice(TIER_PROTECTED_ROUTES.length))
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle empty feature arrays', () => {
      const decision = TierRoutingEngine.makeRoutingDecision(
        '/evaluations/professional',
        'PROFESSIONAL',
        [] // Empty features array
      )

      expect(decision.shouldRoute).toBe(true)
      expect(decision.allowAccess).toBe(false)
      expect(decision.missingFeatures).toContain('professional_evaluation')
    })

    it('should handle undefined features', () => {
      const decision = TierRoutingEngine.makeRoutingDecision(
        '/evaluations/professional',
        'PROFESSIONAL'
        // No features parameter
      )

      expect(decision.shouldRoute).toBe(true)
      expect(decision.allowAccess).toBe(false)
    })

    it('should handle malformed paths', () => {
      const testPaths = [
        '',
        '/',
        '//',
        '///multiple//slashes',
        '/path/with/query?param=value',
        '/path/with/fragment#section'
      ]

      for (const path of testPaths) {
        const decision = TierRoutingEngine.makeRoutingDecision(
          path,
          'BASIC',
          TIER_FEATURES.BASIC
        )

        expect(decision).toBeDefined()
        expect(typeof decision.shouldRoute).toBe('boolean')
        expect(typeof decision.allowAccess).toBe('boolean')
      }
    })

    it('should handle case sensitivity', () => {
      const testCases = [
        '/Dashboard/Professional',
        '/EVALUATIONS/PROFESSIONAL',
        '/api/EVALUATIONS/professional'
      ]

      for (const path of testCases) {
        const decision = TierRoutingEngine.makeRoutingDecision(
          path,
          'BASIC',
          []
        )

        // Should not match protected routes due to case sensitivity
        expect(decision.shouldRoute).toBe(false)
        expect(decision.allowAccess).toBe(true)
        expect(decision.reason).toBe('No tier restriction found')
      }
    })
  })

  describe('Performance and scalability', () => {
    it('should handle large numbers of route checks efficiently', () => {
      const startTime = performance.now()

      // Test with many different paths
      for (let i = 0; i < 1000; i++) {
        TierRoutingEngine.makeRoutingDecision(
          `/test/path/${i}`,
          'PROFESSIONAL',
          TIER_FEATURES.PROFESSIONAL
        )
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should complete 1000 route checks in reasonable time
      expect(totalTime).toBeLessThan(100) // 100ms for 1000 checks
    })

    it('should maintain consistent performance across different tiers', () => {
      const testPath = '/evaluations/professional'
      const iterations = 100

      const tiers: SubscriptionTier[] = ['BASIC', 'PROFESSIONAL', 'ENTERPRISE']
      const times: number[] = []

      for (const tier of tiers) {
        const startTime = performance.now()

        for (let i = 0; i < iterations; i++) {
          TierRoutingEngine.makeRoutingDecision(
            testPath,
            tier,
            TIER_FEATURES[tier]
          )
        }

        const endTime = performance.now()
        times.push(endTime - startTime)
      }

      // Times should be relatively consistent across tiers
      const maxTime = Math.max(...times)
      const minTime = Math.min(...times)
      const ratio = maxTime / minTime

      expect(ratio).toBeLessThan(3) // Should not vary by more than 3x
    })
  })
})