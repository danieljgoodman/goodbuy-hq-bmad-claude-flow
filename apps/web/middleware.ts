/**
 * Next.js Middleware with Clerk Authentication and Tier-Based Routing
 * Simplified and optimized for Clerk integration
 */

import { authMiddleware } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  // After auth hook for tier-based routing
  async afterAuth(auth, request: NextRequest) {
    const { userId, sessionClaims } = auth
    const pathname = request.nextUrl.pathname

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

    // Get user tier from Clerk metadata
    const userTier = (sessionClaims?.publicMetadata as any)?.subscriptionTier || 'free'
    const subscriptionStatus = (sessionClaims?.publicMetadata as any)?.subscriptionStatus || 'active'

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

    // Add tier information to headers for downstream use
    const response = NextResponse.next()
    response.headers.set('x-user-id', userId)
    response.headers.set('x-user-tier', userTier)
    response.headers.set('x-subscription-status', subscriptionStatus)

    // For API routes, add tier validation
    if (pathname.startsWith('/api/')) {
      // Check API tier requirements
      const requiredTier = getApiRequiredTier(pathname)
      if (requiredTier && !hasAccessToTier(userTier, requiredTier)) {
        return NextResponse.json(
          {
            error: 'Insufficient subscription tier',
            required: requiredTier,
            current: userTier,
            upgrade_url: `/pricing?upgrade=${requiredTier}`
          },
          { status: 403 }
        )
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
 * Get dashboard URL based on tier
 */
function getTierDashboardUrl(tier: string, baseUrl: string): URL | null {
  const dashboardMap: Record<string, string> = {
    'free': '/dashboard/basic',
    'professional': '/dashboard/professional',
    'enterprise': '/dashboard/enterprise'
  }

  const path = dashboardMap[tier]
  if (path) {
    return new URL(path, baseUrl)
  }
  return null
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
  if (pathname.startsWith('/api/reports/professional')) return 'professional'
  if (pathname.startsWith('/api/analytics/enterprise')) return 'enterprise'
  return null
}

/**
 * Check if user has access to required tier
 */
function hasAccessToTier(userTier: string, requiredTier: string): boolean {
  const tierHierarchy: Record<string, number> = {
    'free': 0,
    'professional': 1,
    'premium': 1, // Alias for professional
    'enterprise': 2
  }

  const userLevel = tierHierarchy[userTier] ?? 0
  const requiredLevel = tierHierarchy[requiredTier] ?? 0

  return userLevel >= requiredLevel
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}