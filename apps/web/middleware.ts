/**
 * Next.js Middleware with Clerk Authentication and Tier-Based Routing
 * Simplified and optimized for Clerk integration
 */

import { authMiddleware } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { withSecurity } from '@/lib/security/middleware'
import { ClerkTierIntegration } from '@/lib/auth/clerk-tier-integration'
import type { SubscriptionTier } from '@/types/subscription'

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
    '/api/health',
    '/pricing',
    '/about',
    '/contact',
    '/privacy',
    '/terms'
  ],

  // Routes to ignore completely
  ignoredRoutes: [
    '/_next(.*)',
    '/favicon.ico',
    '/images(.*)',
    '/static(.*)'
  ],

  // Before auth hook for security middleware
  async beforeAuth(request: NextRequest) {
    // Apply security middleware to all requests
    const securityResponse = await withSecurity(request);
    if (securityResponse) {
      return securityResponse; // Return early if security middleware blocks the request
    }
    return undefined; // Continue with normal auth flow
  },

  // After auth hook for tier-based routing
  async afterAuth(auth, request: NextRequest) {
    const { userId, sessionClaims } = auth
    const pathname = request.nextUrl.pathname
    const startTime = Date.now()

    // Redirect to sign-in if not authenticated on protected route
    if (!userId && !isPublicRoute(pathname)) {
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('redirect_url', request.url)
      return NextResponse.redirect(signInUrl)
    }

    // Skip further processing if not authenticated
    if (!userId) {
      return NextResponse.next()
    }

    // Get enhanced user tier and permission context
    let userTier: string = 'free'
    let subscriptionStatus: string = 'active'
    let permissionContext = null
    let enrichedSession = null

    try {
      // Try to get enriched session data
      enrichedSession = await ClerkTierIntegration.getEnrichedSession(userId)
      permissionContext = await ClerkTierIntegration.getPermissionContext(userId)

      if (enrichedSession) {
        userTier = enrichedSession.tier.toLowerCase()
        subscriptionStatus = enrichedSession.status.toLowerCase()
      } else {
        // Fallback to legacy metadata reading for backward compatibility
        userTier = (sessionClaims?.publicMetadata as any)?.subscriptionTier || 'free'
        subscriptionStatus = (sessionClaims?.publicMetadata as any)?.subscriptionStatus || 'active'
      }
    } catch (error) {
      console.warn('Error getting enhanced session, falling back to legacy metadata:', error)
      // Fallback to legacy metadata reading
      userTier = (sessionClaims?.publicMetadata as any)?.subscriptionTier || 'free'
      subscriptionStatus = (sessionClaims?.publicMetadata as any)?.subscriptionStatus || 'active'
    }

    // Handle onboarding redirect for new users
    if (pathname !== '/onboarding' && !isOnboardingComplete(sessionClaims)) {
      const needsOnboarding = [
        '/dashboard',
        '/evaluation',
        '/reports'
      ].some(path => pathname.startsWith(path))

      if (needsOnboarding) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }

    // Tier-based routing for dashboard
    if (pathname === '/dashboard') {
      const dashboardUrl = getTierDashboardUrl(userTier, request.url)
      if (dashboardUrl) {
        return NextResponse.redirect(dashboardUrl)
      }
    }

    // Check access for professional features
    if (isProfessionalRoute(pathname) && userTier === 'free') {
      const upgradeUrl = new URL('/pricing', request.url)
      upgradeUrl.searchParams.set('upgrade', 'professional')
      upgradeUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(upgradeUrl)
    }

    // Check access for enterprise features
    if (isEnterpriseRoute(pathname) && !['enterprise'].includes(userTier)) {
      const upgradeUrl = new URL('/pricing', request.url)
      upgradeUrl.searchParams.set('upgrade', 'enterprise')
      upgradeUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(upgradeUrl)
    }

    // Add comprehensive tier and permission information to headers for downstream use
    const response = NextResponse.next()
    const executionTime = Date.now() - startTime

    // Basic authentication headers (backward compatibility)
    response.headers.set('x-user-id', userId)
    response.headers.set('x-user-tier', userTier)
    response.headers.set('x-subscription-status', subscriptionStatus)

    // Enhanced permission context headers
    if (permissionContext) {
      response.headers.set('x-permission-context', JSON.stringify({
        tier: permissionContext.tier,
        features: permissionContext.features,
        isAuthenticated: permissionContext.isAuthenticated,
        sessionId: permissionContext.sessionId
      }))
      response.headers.set('x-user-features', JSON.stringify(permissionContext.features))
      response.headers.set('x-tier-limits', JSON.stringify(permissionContext.limits))
    }

    // Performance and session metadata
    if (enrichedSession) {
      response.headers.set('x-session-enriched', 'true')
      response.headers.set('x-is-trialing', enrichedSession.isTrialing.toString())
      if (enrichedSession.trialEndsAt) {
        response.headers.set('x-trial-ends-at', enrichedSession.trialEndsAt.toISOString())
      }
      if (enrichedSession.subscriptionEndsAt) {
        response.headers.set('x-subscription-ends-at', enrichedSession.subscriptionEndsAt.toISOString())
      }
    }

    // Performance monitoring
    response.headers.set('x-middleware-execution-time', executionTime.toString())
    response.headers.set('x-middleware-version', '2.0-enhanced')

    // Enhanced API route validation with permission checking
    if (pathname.startsWith('/api/')) {
      const requiredTier = getApiRequiredTier(pathname)
      const requiredFeature = getApiRequiredFeature(pathname)

      // Check tier-based access
      if (requiredTier && !hasAccessToTier(userTier, requiredTier)) {
        return NextResponse.json(
          {
            error: 'Insufficient subscription tier',
            required: requiredTier,
            current: userTier,
            upgrade_url: `/pricing?upgrade=${requiredTier}`,
            code: 'TIER_ACCESS_DENIED',
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        )
      }

      // Check feature-based access
      if (requiredFeature && permissionContext) {
        const hasFeatureAccess = permissionContext.features.includes(requiredFeature)
        if (!hasFeatureAccess) {
          return NextResponse.json(
            {
              error: 'Feature access denied',
              required_feature: requiredFeature,
              available_features: permissionContext.features,
              current_tier: userTier,
              upgrade_url: `/pricing?feature=${requiredFeature}`,
              code: 'FEATURE_ACCESS_DENIED',
              timestamp: new Date().toISOString()
            },
            { status: 403 }
          )
        }
      }

      // Rate limiting check for API routes
      if (permissionContext) {
        const rateLimitResult = await checkApiRateLimit(userId, pathname, permissionContext.limits)
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            {
              error: 'Rate limit exceeded',
              limit: rateLimitResult.limit,
              remaining: rateLimitResult.remaining,
              reset_at: rateLimitResult.resetAt,
              code: 'RATE_LIMIT_EXCEEDED',
              timestamp: new Date().toISOString()
            },
            { status: 429 }
          )
        }
      }
    }

    return response
  }
})

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  const publicPaths = [
    '/',
    '/sign-in',
    '/sign-up',
    '/pricing',
    '/about',
    '/contact',
    '/privacy',
    '/terms'
  ]
  return publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))
}

/**
 * Check if user has completed onboarding
 */
function isOnboardingComplete(sessionClaims: any): boolean {
  const metadata = sessionClaims?.publicMetadata as any
  return metadata?.onboardingCompleted === true || metadata?.businessName !== undefined
}

/**
 * Get dashboard URL based on tier (backward compatible)
 */
function getTierDashboardUrl(tier: string, baseUrl: string): URL | null {
  return getTierDashboardUrlEnhanced(tier, baseUrl)
}

/**
 * Check if route requires professional tier
 */
function isProfessionalRoute(pathname: string): boolean {
  const professionalRoutes = [
    '/dashboard/professional',
    '/questionnaire/professional',
    '/reports/professional',
    '/api/evaluations/professional',
    '/api/reports/professional'
  ]
  return professionalRoutes.some(route => pathname.startsWith(route))
}

/**
 * Check if route requires enterprise tier
 */
function isEnterpriseRoute(pathname: string): boolean {
  const enterpriseRoutes = [
    '/dashboard/enterprise',
    '/admin',
    '/analytics/enterprise',
    '/api/evaluations/enterprise',
    '/api/analytics/enterprise'
  ]
  return enterpriseRoutes.some(route => pathname.startsWith(route))
}

/**
 * Get required tier for API route
 */
function getApiRequiredTier(pathname: string): string | null {
  if (pathname.startsWith('/api/evaluations/enterprise')) return 'enterprise'
  if (pathname.startsWith('/api/evaluations/professional')) return 'professional'
  if (pathname.startsWith('/api/reports/enhanced')) return 'professional'
  if (pathname.startsWith('/api/reports/professional')) return 'professional'
  if (pathname.startsWith('/api/reports/enterprise')) return 'enterprise'
  if (pathname.startsWith('/api/analytics/enterprise')) return 'enterprise'
  if (pathname.startsWith('/api/analysis/tier-specific')) return 'free' // Tier-specific analysis available to all tiers
  if (pathname.startsWith('/api/enterprise/')) return 'enterprise'
  if (pathname.startsWith('/api/admin/')) return 'enterprise'
  if (pathname.startsWith('/api/webhooks/stripe')) return null // Public webhook
  return null
}

/**
 * Get required feature for API route
 */
function getApiRequiredFeature(pathname: string): string | null {
  if (pathname.startsWith('/api/evaluations/professional')) return 'professional_evaluation'
  if (pathname.startsWith('/api/evaluations/enterprise')) return 'enterprise_evaluation'
  if (pathname.startsWith('/api/reports/enhanced')) return 'pdf_reports'
  if (pathname.startsWith('/api/reports/professional')) return 'pdf_reports'
  if (pathname.startsWith('/api/reports/enterprise')) return 'enterprise_evaluation'
  if (pathname.startsWith('/api/analytics/advanced')) return 'advanced_analytics'
  if (pathname.startsWith('/api/analytics/enterprise')) return 'enterprise_evaluation'
  if (pathname.startsWith('/api/ai/guides')) return 'ai_guides'
  if (pathname.startsWith('/api/progress/tracking')) return 'progress_tracking'
  if (pathname.startsWith('/api/export/')) return 'export_data'
  if (pathname.startsWith('/api/benchmarks/')) return 'benchmarks'
  if (pathname.startsWith('/api/multi-user/')) return 'multi_user'
  if (pathname.startsWith('/api/enterprise/branding')) return 'custom_branding'
  return null
}

/**
 * Check API rate limits based on user tier
 */
async function checkApiRateLimit(
  userId: string,
  pathname: string,
  limits: Record<string, number>
): Promise<{ allowed: boolean; limit: number; remaining: number; resetAt: string }> {
  // Implement rate limiting logic based on tier limits
  // This is a simplified implementation - enhance based on specific needs

  const defaultLimits = {
    '/api/evaluations': limits.monthlyEvaluations || 10,
    '/api/reports': limits.monthlyReports || 5,
    '/api/analytics': limits.apiCalls || 100
  }

  // Find matching limit
  let limit = 1000 // Default high limit
  for (const [path, pathLimit] of Object.entries(defaultLimits)) {
    if (pathname.startsWith(path)) {
      limit = pathLimit
      break
    }
  }

  // For now, always allow (implement actual rate limiting as needed)
  return {
    allowed: true,
    limit,
    remaining: limit - 1,
    resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
  }
}

/**
 * Check if user has access to required tier (enhanced with better mapping)
 */
function hasAccessToTier(userTier: string, requiredTier: string): boolean {
  const tierHierarchy: Record<string, number> = {
    'free': 0,
    'basic': 0,
    'professional': 1,
    'premium': 1, // Alias for professional
    'enterprise': 2
  }

  const userLevel = tierHierarchy[userTier.toLowerCase()] ?? 0
  const requiredLevel = tierHierarchy[requiredTier.toLowerCase()] ?? 0

  return userLevel >= requiredLevel
}

/**
 * Check if user's subscription is in good standing
 */
function isSubscriptionActive(status: string): boolean {
  const activeStatuses = ['active', 'trialing']
  return activeStatuses.includes(status.toLowerCase())
}

/**
 * Get dashboard route based on tier with fallback handling
 */
function getTierDashboardUrlEnhanced(tier: string, baseUrl: string): URL | null {
  const dashboardMap: Record<string, string> = {
    'free': '/dashboard/basic',
    'basic': '/dashboard/basic',
    'professional': '/dashboard/professional',
    'enterprise': '/dashboard/enterprise'
  }

  const path = dashboardMap[tier.toLowerCase()] || '/dashboard/basic'
  return new URL(path, baseUrl)
}

/**
 * Session validation and integrity checking
 */
async function validateSessionIntegrity(userId: string): Promise<boolean> {
  try {
    const validation = await ClerkTierIntegration.validateSessionIntegrity(userId)
    if (!validation.isValid) {
      console.warn(`Session integrity issues for user ${userId}:`, validation.issues)
      // Handle recommendations automatically where possible
      for (const recommendation of validation.recommendations) {
        if (recommendation.includes('Refresh session')) {
          await ClerkTierIntegration.refreshUserSession(userId)
        }
      }
    }
    return validation.isValid
  } catch (error) {
    console.error('Session validation error:', error)
    return false
  }
}

/**
 * Enhanced middleware configuration with performance optimizations
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/webhooks/stripe (public webhooks)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/webhooks/stripe).*)',
  ],
  // Enable edge runtime for better performance
  runtime: 'nodejs'
}