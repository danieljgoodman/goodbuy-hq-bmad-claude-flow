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
  const { userId } = await auth()

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

  // Handle tier-based routing (simplified for now)
  if (pathname === '/dashboard') {
    // Default to basic dashboard for all users
    return NextResponse.redirect(new URL('/dashboard/basic', req.url))
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