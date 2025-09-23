/**
 * Next.js Middleware with Clerk Authentication and Tier-Based Routing
 * Updated for @clerk/nextjs v6+ with clerkMiddleware
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/claude',
  '/api/health',
  '/pricing',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/_next(.*)',
  '/favicon.ico',
  '/images(.*)',
  '/static(.*)'
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const pathname = req.nextUrl.pathname

  // Skip processing for public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Protect private routes
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    // Redirect to sign-in if not authenticated on protected route
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Continue with authenticated request
  const response = NextResponse.next()

  // Add user ID header for downstream use
  response.headers.set('x-user-id', userId)

  // Handle tier-based routing for dashboard
  if (pathname === '/dashboard') {
    try {
      // Get subscription tier from session claims (this is where Clerk stores public metadata)
      // The webhook stores these as 'premium' or 'enterprise' (lowercase)
      const subscriptionTier = (sessionClaims?.publicMetadata as any)?.subscriptionTier as string || 'free'

      // Redirect based on tier (matching the values from Stripe webhook)
      if (subscriptionTier === 'enterprise' || subscriptionTier === 'ENTERPRISE') {
        return NextResponse.redirect(new URL('/dashboard/enterprise', req.url))
      } else if (subscriptionTier === 'premium' || subscriptionTier === 'professional' || subscriptionTier === 'PROFESSIONAL') {
        return NextResponse.redirect(new URL('/dashboard/professional', req.url))
      }
      // For free/basic tier or unknown, keep them on /dashboard which shows the basic dashboard
    } catch (error) {
      console.error('Error determining user tier:', error)
      // On error, continue to regular dashboard
    }
  }

  return response
})

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