/**
 * Route configuration for subscription tier-based routing
 * For Story 11.2: Subscription-Based Routing Middleware
 */

import {
  SubscriptionTier,
  TierRouteConfig,
  RoutingDecision,
  TIER_HIERARCHY,
  TIER_FEATURES,
  DASHBOARD_ROUTES
} from '@/types/subscription'
import { tierLogger, TierLoggerUtils } from '@/lib/logging/tier-logger'
import { tierMetrics } from '@/lib/monitoring/tier-metrics'

/**
 * Protected routes that require specific tiers
 */
export const TIER_PROTECTED_ROUTES: TierRouteConfig[] = [
  // Dashboard routes
  {
    pattern: '/dashboard/professional',
    requiredTier: 'PROFESSIONAL',
    fallbackRoute: '/dashboard/basic',
    exactMatch: true
  },
  {
    pattern: '/dashboard/enterprise',
    requiredTier: 'ENTERPRISE',
    fallbackRoute: '/dashboard/professional',
    exactMatch: true
  },

  // Feature-specific routes
  {
    pattern: '/evaluations/professional',
    requiredTier: 'PROFESSIONAL',
    requiredFeature: 'professional_evaluation',
    fallbackRoute: '/evaluations',
    exactMatch: false
  },
  {
    pattern: '/evaluations/enterprise',
    requiredTier: 'ENTERPRISE',
    requiredFeature: 'enterprise_evaluation',
    fallbackRoute: '/evaluations/professional',
    exactMatch: false
  },
  {
    pattern: '/analytics/advanced',
    requiredTier: 'PROFESSIONAL',
    requiredFeature: 'advanced_analytics',
    fallbackRoute: '/analytics',
    exactMatch: false
  },
  {
    pattern: '/analytics/benchmarks',
    requiredTier: 'ENTERPRISE',
    requiredFeature: 'benchmarks',
    fallbackRoute: '/analytics/advanced',
    exactMatch: false
  },
  {
    pattern: '/reports/pdf',
    requiredTier: 'PROFESSIONAL',
    requiredFeature: 'pdf_reports',
    fallbackRoute: '/reports',
    exactMatch: false
  },
  {
    pattern: '/guides/ai',
    requiredTier: 'PROFESSIONAL',
    requiredFeature: 'ai_guides',
    fallbackRoute: '/guides',
    exactMatch: false
  },
  {
    pattern: '/api/evaluations/professional',
    requiredTier: 'PROFESSIONAL',
    requiredFeature: 'professional_evaluation',
    exactMatch: false
  },
  {
    pattern: '/api/evaluations/enterprise',
    requiredTier: 'ENTERPRISE',
    requiredFeature: 'enterprise_evaluation',
    exactMatch: false
  },
  {
    pattern: '/api/reports/pdf',
    requiredTier: 'PROFESSIONAL',
    requiredFeature: 'pdf_reports',
    exactMatch: false
  },
  {
    pattern: '/api/analytics/benchmarks',
    requiredTier: 'ENTERPRISE',
    requiredFeature: 'benchmarks',
    exactMatch: false
  }
]

/**
 * Routes that should always be accessible (bypass tier checking)
 */
export const PUBLIC_ROUTES: string[] = [
  '/',
  '/auth',
  '/auth/login',
  '/auth/register',
  '/auth/callback',
  '/sign-in',
  '/sign-up',
  '/pricing',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/api/webhooks',
  '/api/health',
  '/api/auth'
]

/**
 * Routes that require authentication but no specific tier
 */
export const AUTHENTICATED_ROUTES: string[] = [
  '/dashboard',
  '/dashboard/basic',
  '/profile',
  '/settings',
  '/evaluations',
  '/reports',
  '/analytics',
  '/guides',
  '/api/evaluations',
  '/api/user'
]

/**
 * Main routing decision engine
 */
export class TierRoutingEngine {

  /**
   * Determine routing decision for a given path and user tier
   */
  static makeRoutingDecision(
    pathname: string,
    userTier: SubscriptionTier,
    userFeatures: string[] = []
  ): RoutingDecision {
    const startTime = performance.now()
    const requestId = TierLoggerUtils.generateRequestId()
    const logger = tierLogger.createChildLogger({ requestId })

    try {
      logger.logDebug('Starting routing decision process', {
        pathname,
        userTier,
        featuresCount: userFeatures.length
      })

      // Check if it's a public route
      if (this.isPublicRoute(pathname)) {
        const decision = {
          shouldRoute: false,
          allowAccess: true,
          reason: 'Public route',
          currentTier: userTier,
          missingFeatures: []
        }

        logger.logDebug('Public route access granted', { pathname, decision })
        this.recordRoutingMetrics(startTime, pathname, userTier, decision, logger)
        return decision
      }

      // Check if it's an authenticated route that doesn't need tier checking
      if (this.isAuthenticatedRoute(pathname) && !this.isProtectedRoute(pathname)) {
        const decision = {
          shouldRoute: false,
          allowAccess: true,
          reason: 'Authenticated route, no tier restriction',
          currentTier: userTier,
          missingFeatures: []
        }

        logger.logDebug('Authenticated route access granted', { pathname, decision })
        this.recordRoutingMetrics(startTime, pathname, userTier, decision, logger)
        return decision
      }

      // Find matching protected route configuration
      const routeConfig = this.findMatchingRoute(pathname)
      if (!routeConfig) {
        const decision = {
          shouldRoute: false,
          allowAccess: true,
          reason: 'No tier restriction found',
          currentTier: userTier,
          missingFeatures: []
        }

        logger.logDebug('No tier restriction found for route', { pathname, decision })
        this.recordRoutingMetrics(startTime, pathname, userTier, decision, logger)
        return decision
      }

      logger.logDebug('Found route configuration', {
        pathname,
        requiredTier: routeConfig.requiredTier,
        requiredFeature: routeConfig.requiredFeature,
        fallbackRoute: routeConfig.fallbackRoute
      })

      // Check tier access
      const hasRequiredTier = this.hasTierAccess(userTier, routeConfig.requiredTier)
      const hasRequiredFeature = !routeConfig.requiredFeature ||
        userFeatures.includes(routeConfig.requiredFeature)

      if (hasRequiredTier && hasRequiredFeature) {
        const decision = {
          shouldRoute: false,
          allowAccess: true,
          reason: 'Access granted',
          currentTier: userTier,
          missingFeatures: []
        }

        logger.logDebug('Route access granted', {
          pathname,
          userTier,
          requiredTier: routeConfig.requiredTier,
          hasRequiredTier,
          hasRequiredFeature
        })

        this.recordRoutingMetrics(startTime, pathname, userTier, decision, logger)
        return decision
      }

      // Access denied - determine redirect
      const missingFeatures = routeConfig.requiredFeature && !hasRequiredFeature
        ? [routeConfig.requiredFeature]
        : []

      logger.logDebug('Route access denied', {
        pathname,
        userTier,
        requiredTier: routeConfig.requiredTier,
        hasRequiredTier,
        hasRequiredFeature,
        missingFeatures
      })

      // For dashboard routes, redirect to appropriate tier dashboard
      if (pathname.startsWith('/dashboard/')) {
        const targetDashboard = this.getDashboardForTier(userTier)
        const decision = {
          shouldRoute: true,
          targetRoute: targetDashboard,
          allowAccess: false,
          reason: 'Redirecting to appropriate dashboard',
          requiredTier: routeConfig.requiredTier,
          currentTier: userTier,
          missingFeatures
        }

        logger.logDebug('Dashboard redirect required', {
          from: pathname,
          to: targetDashboard,
          userTier,
          requiredTier: routeConfig.requiredTier
        })

        this.recordRoutingMetrics(startTime, pathname, userTier, decision, logger)
        return decision
      }

      // For other routes, use configured fallback or upgrade page
      const targetRoute = routeConfig.fallbackRoute || this.getUpgradeRoute(routeConfig.requiredTier)
      const decision = {
        shouldRoute: true,
        targetRoute,
        allowAccess: false,
        reason: 'Insufficient tier or missing features',
        requiredTier: routeConfig.requiredTier,
        currentTier: userTier,
        missingFeatures
      }

      logger.logDebug('Route redirect required', {
        from: pathname,
        to: targetRoute,
        reason: decision.reason,
        missingFeatures
      })

      this.recordRoutingMetrics(startTime, pathname, userTier, decision, logger)
      return decision

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))

      logger.logError('Error in routing decision process', errorObj, {
        pathname,
        userTier
      })

      // Record error metrics
      tierMetrics.recordError({
        name: 'routing_decision_error',
        errorType: errorObj.name,
        errorCode: (errorObj as any).code || 'ROUTING_ERROR',
        severity: 'medium',
        route: pathname,
        userTier,
        message: errorObj.message
      })

      // Fallback decision - deny access and redirect to appropriate dashboard
      const fallbackDecision = {
        shouldRoute: true,
        targetRoute: this.getDashboardForTier(userTier),
        allowAccess: false,
        reason: 'Routing error fallback',
        currentTier: userTier,
        missingFeatures: []
      }

      this.recordRoutingMetrics(startTime, pathname, userTier, fallbackDecision, logger)
      return fallbackDecision
    }
  }

  /**
   * Get the appropriate dashboard route for a user's tier
   */
  static getDashboardForTier(tier: SubscriptionTier): string {
    return DASHBOARD_ROUTES[tier] || DASHBOARD_ROUTES.BASIC
  }

  /**
   * Check if user has access to required tier
   */
  private static hasTierAccess(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
    return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier]
  }

  /**
   * Check if path is a public route
   */
  private static isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(route => {
      if (route.endsWith('*')) {
        return pathname.startsWith(route.slice(0, -1))
      }
      return pathname === route || pathname.startsWith(route + '/')
    })
  }

  /**
   * Check if path is an authenticated route
   */
  private static isAuthenticatedRoute(pathname: string): boolean {
    return AUTHENTICATED_ROUTES.some(route => {
      return pathname === route || pathname.startsWith(route + '/')
    })
  }

  /**
   * Check if path is a protected route
   */
  private static isProtectedRoute(pathname: string): boolean {
    return TIER_PROTECTED_ROUTES.some(config =>
      this.matchesRoutePattern(pathname, config)
    )
  }

  /**
   * Find matching route configuration
   */
  private static findMatchingRoute(pathname: string): TierRouteConfig | null {
    return TIER_PROTECTED_ROUTES.find(config =>
      this.matchesRoutePattern(pathname, config)
    ) || null
  }

  /**
   * Check if pathname matches route pattern
   */
  private static matchesRoutePattern(pathname: string, config: TierRouteConfig): boolean {
    if (config.exactMatch) {
      return pathname === config.pattern
    }
    return pathname.startsWith(config.pattern)
  }

  /**
   * Get upgrade route for required tier
   */
  private static getUpgradeRoute(requiredTier: SubscriptionTier): string {
    const upgradeRoutes = {
      PROFESSIONAL: '/pricing?upgrade=professional',
      ENTERPRISE: '/pricing?upgrade=enterprise'
    }
    return upgradeRoutes[requiredTier] || '/pricing'
  }

  /**
   * Get available features for a tier
   */
  static getFeaturesForTier(tier: SubscriptionTier): string[] {
    return TIER_FEATURES[tier] || []
  }

  /**
   * Check if a feature is available for a tier
   */
  static hasFeatureAccess(tier: SubscriptionTier, feature: string): boolean {
    return this.getFeaturesForTier(tier).includes(feature)
  }

  /**
   * Get the minimum tier required for a feature
   */
  static getMinimumTierForFeature(feature: string): SubscriptionTier | null {
    for (const [tier, features] of Object.entries(TIER_FEATURES)) {
      if (features.includes(feature)) {
        return tier as SubscriptionTier
      }
    }
    return null
  }

  /**
   * Generate navigation menu based on user tier
   */
  static getNavigationForTier(tier: SubscriptionTier): Array<{
    label: string
    href: string
    requiresTier?: SubscriptionTier
    requiredFeature?: string
    available: boolean
  }> {
    const baseNavigation = [
      { label: 'Dashboard', href: '/dashboard', available: true },
      { label: 'Evaluations', href: '/evaluations', available: true },
      { label: 'Reports', href: '/reports', available: true },
      { label: 'Analytics', href: '/analytics', available: true },
      { label: 'Guides', href: '/guides', available: true }
    ]

    const tierSpecificNavigation = [
      {
        label: 'Professional Analysis',
        href: '/evaluations/professional',
        requiresTier: 'PROFESSIONAL' as SubscriptionTier,
        requiredFeature: 'professional_evaluation',
        available: this.hasTierAccess(tier, 'PROFESSIONAL')
      },
      {
        label: 'AI Guides',
        href: '/guides/ai',
        requiresTier: 'PROFESSIONAL' as SubscriptionTier,
        requiredFeature: 'ai_guides',
        available: this.hasTierAccess(tier, 'PROFESSIONAL')
      },
      {
        label: 'PDF Reports',
        href: '/reports/pdf',
        requiresTier: 'PROFESSIONAL' as SubscriptionTier,
        requiredFeature: 'pdf_reports',
        available: this.hasTierAccess(tier, 'PROFESSIONAL')
      },
      {
        label: 'Advanced Analytics',
        href: '/analytics/advanced',
        requiresTier: 'PROFESSIONAL' as SubscriptionTier,
        requiredFeature: 'advanced_analytics',
        available: this.hasTierAccess(tier, 'PROFESSIONAL')
      },
      {
        label: 'Enterprise Analysis',
        href: '/evaluations/enterprise',
        requiresTier: 'ENTERPRISE' as SubscriptionTier,
        requiredFeature: 'enterprise_evaluation',
        available: this.hasTierAccess(tier, 'ENTERPRISE')
      },
      {
        label: 'Benchmarks',
        href: '/analytics/benchmarks',
        requiresTier: 'ENTERPRISE' as SubscriptionTier,
        requiredFeature: 'benchmarks',
        available: this.hasTierAccess(tier, 'ENTERPRISE')
      }
    ]

    return [...baseNavigation, ...tierSpecificNavigation]
  }

  /**
   * Get redirect URL for first-time login based on tier
   */
  static getInitialRedirectForTier(tier: SubscriptionTier): string {
    // Redirect new users to their appropriate dashboard
    return this.getDashboardForTier(tier)
  }

  /**
   * Validate route configuration (for testing/debugging)
   */
  static validateRouteConfig(): Array<{ route: string; issues: string[] }> {
    const issues: Array<{ route: string; issues: string[] }> = []

    TIER_PROTECTED_ROUTES.forEach(config => {
      const routeIssues: string[] = []

      // Check if fallback route exists for non-API routes
      if (!config.pattern.startsWith('/api') && !config.fallbackRoute) {
        routeIssues.push('Missing fallback route for non-API endpoint')
      }

      // Check if required feature exists in tier features
      if (config.requiredFeature) {
        const hasFeature = Object.values(TIER_FEATURES).some(features =>
          features.includes(config.requiredFeature!)
        )
        if (!hasFeature) {
          routeIssues.push(`Required feature '${config.requiredFeature}' not found in tier features`)
        }
      }

      if (routeIssues.length > 0) {
        issues.push({ route: config.pattern, issues: routeIssues })
      }
    })

    return issues
  }

  /**
   * Record routing metrics for monitoring and analytics
   */
  private static recordRoutingMetrics(
    startTime: number,
    pathname: string,
    userTier: SubscriptionTier,
    decision: RoutingDecision,
    logger?: any
  ): void {
    const executionTime = performance.now() - startTime

    // Record performance metrics
    tierMetrics.recordPerformance({
      name: 'routing_decision',
      executionTime,
      memoryUsage: TierLoggerUtils.getMemoryUsage(),
      cacheHit: false, // Routing decisions are not cached
      route: pathname,
      userTier,
      method: 'routing'
    })

    // Record routing decision metrics
    tierMetrics.recordRouting({
      name: 'routing_decision_made',
      originalRoute: pathname,
      targetRoute: decision.targetRoute,
      redirected: decision.shouldRoute,
      userTier,
      reason: decision.reason,
      executionTime
    })

    // Record access metrics
    tierMetrics.recordAccess({
      name: 'route_access_check',
      userTier,
      route: pathname,
      allowed: decision.allowAccess,
      reason: decision.reason,
      requiredTier: decision.requiredTier
    })

    // Log performance warning if routing decision takes too long
    if (executionTime > 10) { // 10ms threshold for routing decisions
      logger?.logPerformance('Slow routing decision detected', {
        executionTime,
        memoryUsage: TierLoggerUtils.getMemoryUsage(),
        cacheHit: false
      }, {
        route: pathname,
        userTier,
        reason: decision.reason
      })

      // Record performance issue
      tierMetrics.recordError({
        name: 'slow_routing_decision',
        errorType: 'PerformanceWarning',
        severity: 'low',
        route: pathname,
        userTier,
        message: `Routing decision took ${executionTime}ms (threshold: 10ms)`
      })
    }

    // Log routing decision completion
    logger?.logDebug('Routing decision completed', {
      pathname,
      userTier,
      decision: {
        shouldRoute: decision.shouldRoute,
        allowAccess: decision.allowAccess,
        reason: decision.reason,
        targetRoute: decision.targetRoute
      },
      executionTime,
      memoryUsage: TierLoggerUtils.getMemoryUsage()
    })
  }
}