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
      // Get subscription tier from session claims or unsafe metadata
      // Try multiple sources as Clerk might store it differently
      const publicMetadata = sessionClaims?.publicMetadata as any
      const unsafeMetadata = sessionClaims?.unsafeMetadata as any
      const metadata = sessionClaims?.metadata as any

      // Check multiple possible locations for the subscription tier
      const subscriptionTier =
        publicMetadata?.subscriptionTier ||
        unsafeMetadata?.subscriptionTier ||
        metadata?.subscriptionTier ||
        sessionClaims?.subscriptionTier as string ||
        'free'

      console.log('🔍 Middleware - User ID:', userId)
      console.log('🔍 Middleware - Session Claims:', sessionClaims)
      console.log('🔍 Middleware - Public Metadata:', publicMetadata)
      console.log('🔍 Middleware - Unsafe Metadata:', unsafeMetadata)
      console.log('🔍 Middleware - Detected Tier:', subscriptionTier)

      // Redirect based on tier (matching the values from Stripe webhook)
      if (subscriptionTier === 'enterprise' || subscriptionTier === 'ENTERPRISE') {
        console.log('🚀 Redirecting to Enterprise Dashboard')
        return NextResponse.redirect(new URL('/dashboard/enterprise', req.url))
      } else if (subscriptionTier === 'premium' || subscriptionTier === 'professional' || subscriptionTier === 'PROFESSIONAL') {
        console.log('🚀 Redirecting to Professional Dashboard')
        return NextResponse.redirect(new URL('/dashboard/professional', req.url))
      }
      // For free/basic tier or unknown, keep them on /dashboard which shows the basic dashboard
      console.log('ℹ️ Staying on Basic Dashboard (tier:', subscriptionTier, ')')
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