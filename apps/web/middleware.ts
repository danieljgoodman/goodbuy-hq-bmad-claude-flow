/**
 * Next.js Middleware for subscription-based routing
 * Story 11.2: Subscription-Based Routing Middleware
 *
 * Features:
 * - Detects user subscription tier from Stripe via Clerk metadata
 * - Routes users to tier-appropriate dashboards
 * - Enforces feature access control
 * - Fail-safe defaults to Basic tier
 * - <100ms execution time requirement
 * - LRU caching with 85%+ hit rate
 * - Circuit breaker pattern for external services
 * - Performance monitoring and metrics collection
 */

import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@clerk/nextjs'
import { TierDetectionService } from '@/lib/subscription/tier-utils'
import { TierRoutingEngine } from '@/lib/routing/tier-routes'
import {
  SubscriptionTier,
  TierDetectionResult,
  RoutingDecision,
  DEFAULT_MIDDLEWARE_CONFIG
} from '@/types/subscription'
import {
  startPerformanceTimer,
  endPerformanceTimer,
  executeWithCircuitBreaker,
  MiddlewarePerformanceMonitor
} from '@/lib/performance/middleware-monitor'
import { tierCache } from '@/lib/cache/tier-cache'
import { tierLogger, TierLoggerUtils, TierLogLevel } from '@/lib/logging/tier-logger'
import { tierMetrics, MetricsUtils } from '@/lib/monitoring/tier-metrics'
import { tierAlerts } from '@/lib/monitoring/alerts'

/**
 * Performance monitoring for middleware execution
 */
interface MiddlewareMetrics {
  executionTime: number
  cacheHit: boolean
  routingDecision: string
  userTier: SubscriptionTier
  endpoint: string
  dbQueries: number
  apiCalls: number
}

/**
 * Main middleware function with tier-based routing
 */
export default authMiddleware({

  // Public routes that don't require authentication
  publicRoutes: [
    '/',
    '/auth(.*)',
    '/api/webhooks(.*)',
    '/api/health',
    '/pricing',
    '/about',
    '/contact',
    '/privacy',
    '/terms'
  ],

  // Routes that require authentication but not specific tier
  ignoredRoutes: [
    '/api/auth(.*)',
    '/_next(.*)',
    '/favicon.ico',
    '/images(.*)',
    '/static(.*)'
  ],

  // Main middleware handler
  async beforeAuth(request: NextRequest) {
    const requestId = TierLoggerUtils.generateRequestId()
    const performanceTracker = MetricsUtils.createPerformanceTracker('middleware_execution')
    const childLogger = tierLogger.createChildLogger({ requestId })

    const operationId = `middleware-${Date.now()}-${Math.random()}`
    startPerformanceTimer(operationId)

    let cacheHit = false
    let dbQueries = 0
    let apiCalls = 0
    let userTier: SubscriptionTier = 'BASIC'

    try {
      // Log incoming request
      childLogger.logApiRequest('Middleware processing request', {
        requestId,
        route: request.nextUrl.pathname,
        method: request.method,
        ip: TierLoggerUtils.extractIP(request.headers),
        userAgent: request.headers.get('user-agent')?.substring(0, 100)
      })

      // Skip processing for static files and API auth routes
      if (shouldSkipMiddleware(request)) {
        childLogger.logDebug('Skipping middleware for static/auth route', {
          route: request.nextUrl.pathname
        })
        return NextResponse.next()
      }

      // For API routes, handle differently than pages
      if (request.nextUrl.pathname.startsWith('/api')) {
        const result = await handleApiRoute(request, {
          operationId,
          cacheHit,
          dbQueries,
          apiCalls,
          requestId,
          childLogger
        })
        cacheHit = result.cacheHit
        dbQueries = result.dbQueries
        apiCalls = result.apiCalls
        userTier = result.userTier || 'BASIC'

        // Record API metrics
        tierMetrics.recordBusiness({
          name: 'api_request',
          userTier,
          route: request.nextUrl.pathname
        })

        return result.response
      }

      // Handle page routes with tier-based routing
      const result = await handlePageRoute(request, {
        operationId,
        cacheHit,
        dbQueries,
        apiCalls,
        requestId,
        childLogger
      })
      cacheHit = result.cacheHit
      dbQueries = result.dbQueries
      apiCalls = result.apiCalls
      userTier = result.userTier || 'BASIC'

      // Record page metrics
      tierMetrics.recordBusiness({
        name: 'page_request',
        userTier,
        route: request.nextUrl.pathname
      })

      return result.response

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))

      // Log error with comprehensive context
      childLogger.logError('Middleware execution error', errorObj, {
        requestId,
        route: request.nextUrl.pathname,
        method: request.method,
        userTier,
        ip: TierLoggerUtils.extractIP(request.headers)
      })

      // Record error metrics
      tierMetrics.recordError({
        name: 'middleware_error',
        errorType: errorObj.name,
        errorCode: (errorObj as any).code || 'UNKNOWN',
        severity: 'high',
        route: request.nextUrl.pathname,
        userTier,
        message: errorObj.message
      })

      // Fail-safe: continue to next middleware/handler
      return NextResponse.next()
    } finally {
      const { executionTime, memoryUsage } = performanceTracker.finish({
        route: request.nextUrl.pathname,
        userTier,
        method: request.method
      })

      // Update performance tracking context
      if (cacheHit) performanceTracker.setCacheHit(true)
      for (let i = 0; i < dbQueries; i++) performanceTracker.addDbQuery()
      for (let i = 0; i < apiCalls; i++) performanceTracker.addApiCall()

      // Record comprehensive performance metrics
      tierMetrics.recordPerformance({
        name: 'middleware_execution',
        executionTime,
        memoryUsage,
        cacheHit,
        dbQueries,
        apiCalls,
        route: request.nextUrl.pathname,
        userTier,
        method: request.method
      })

      // End performance timer
      const finalExecutionTime = endPerformanceTimer(operationId, {
        endpoint: request.nextUrl.pathname,
        userTier,
        source: 'middleware',
        cacheHit,
        dbQueries,
        apiCalls
      })

      // Log performance metrics
      childLogger.logPerformance('Middleware execution completed', {
        executionTime: finalExecutionTime,
        memoryUsage,
        cacheHit,
        dbQueries,
        apiCalls
      }, {
        requestId,
        route: request.nextUrl.pathname,
        method: request.method
      })

      // Performance threshold monitoring
      if (finalExecutionTime > DEFAULT_MIDDLEWARE_CONFIG.maxExecutionTime) {
        // Log performance warning
        childLogger.logPerformance('Middleware execution exceeded threshold', {
          executionTime: finalExecutionTime,
          memoryUsage,
          cacheHit,
          dbQueries,
          apiCalls
        }, {
          requestId,
          route: request.nextUrl.pathname,
          method: request.method
        })

        // Record performance issue metric
        tierMetrics.recordError({
          name: 'performance_threshold_exceeded',
          errorType: 'PerformanceThresholdError',
          severity: 'medium',
          route: request.nextUrl.pathname,
          userTier,
          message: `Execution time ${finalExecutionTime}ms exceeded threshold ${DEFAULT_MIDDLEWARE_CONFIG.maxExecutionTime}ms`
        })
      }

      // Log successful completion
      childLogger.logApiRequest('Middleware processing completed', {
        requestId,
        route: request.nextUrl.pathname,
        method: request.method,
        statusCode: 200,
        executionTime: finalExecutionTime,
        userTier,
        ip: TierLoggerUtils.extractIP(request.headers),
        userAgent: request.headers.get('user-agent')?.substring(0, 100)
      })
    }
  },

  // After authentication processing
  async afterAuth(auth, request: NextRequest) {
    // If user is not authenticated and trying to access protected route
    if (!auth.userId && !isPublicRoute(request.nextUrl.pathname)) {
      const signInUrl = new URL('/auth/login', request.url)
      signInUrl.searchParams.set('redirect_url', request.url)
      return NextResponse.redirect(signInUrl)
    }

    return NextResponse.next()
  }
})

/**
 * Handle page route with tier-based routing
 */
async function handlePageRoute(
  request: NextRequest,
  context: {
    operationId: string;
    cacheHit: boolean;
    dbQueries: number;
    apiCalls: number;
    requestId: string;
    childLogger: any;
  }
): Promise<{
  response: NextResponse;
  cacheHit: boolean;
  dbQueries: number;
  apiCalls: number;
  userTier?: SubscriptionTier;
}> {
  const pathname = request.nextUrl.pathname

  // Skip tier detection for public routes
  if (isPublicRoute(pathname)) {
    context.childLogger.logDebug('Skipping tier detection for public route', {
      route: pathname
    })
    return {
      response: NextResponse.next(),
      cacheHit: false,
      dbQueries: 0,
      apiCalls: 0,
      userTier: 'BASIC'
    }
  }

  try {
    // Log tier detection start
    context.childLogger.logDebug('Starting tier detection for page route', {
      route: pathname,
      method: request.method
    })

    // Detect user's subscription tier with optimized caching
    const tierResult = await executeWithCircuitBreaker(
      'tier-detection',
      async () => await detectTierWithCache(request),
      () => ({
        tier: 'BASIC' as SubscriptionTier,
        status: 'ACTIVE' as const,
        features: ['basic_evaluation', 'basic_reports', 'basic_analytics'],
        hasAccess: true,
        isTrialing: false,
        executionTime: 1,
        source: 'fallback' as const
      })
    )

    // Log tier detection result
    context.childLogger.logTierDetection('Tier detection completed for page route', tierResult, {
      requestId: context.requestId,
      route: pathname,
      method: request.method
    })

    const cacheHit = tierResult.source === 'cache'
    const dbQueries = tierResult.source === 'database' ? 1 : 0
    const apiCalls = ['clerk', 'stripe'].includes(tierResult.source) ? 1 : 0

    // Record tier detection metrics
    tierMetrics.recordPerformance({
      name: 'tier_detection',
      executionTime: tierResult.executionTime,
      memoryUsage: TierLoggerUtils.getMemoryUsage(),
      cacheHit,
      dbQueries,
      apiCalls,
      route: pathname,
      userTier: tierResult.tier,
      method: request.method
    })

    // Make routing decision
    const routingDecision = TierRoutingEngine.makeRoutingDecision(
      pathname,
      tierResult.tier,
      tierResult.features
    )

    // Log routing decision
    context.childLogger.logRoutingDecision('Routing decision made for page route', routingDecision, {
      requestId: context.requestId,
      originalPath: pathname,
      method: request.method
    })

    // Record routing metrics
    tierMetrics.recordRouting({
      name: 'page_routing_decision',
      originalRoute: pathname,
      targetRoute: routingDecision.targetRoute,
      redirected: routingDecision.shouldRoute,
      userTier: tierResult.tier,
      reason: routingDecision.reason,
      executionTime: tierResult.executionTime
    })

    // Handle routing decision
    if (routingDecision.shouldRoute && routingDecision.targetRoute) {
      // Log redirect decision
      context.childLogger.logRoutingDecision('Page redirect required', routingDecision, {
        requestId: context.requestId,
        originalPath: pathname,
        method: request.method
      })

      // Record access metrics
      tierMetrics.recordAccess({
        name: 'page_access_redirect',
        userTier: tierResult.tier,
        route: pathname,
        allowed: false,
        reason: routingDecision.reason,
        method: request.method,
        requiredTier: routingDecision.requiredTier
      })

      // Special handling for dashboard redirects
      if (pathname.startsWith('/dashboard') && routingDecision.targetRoute.startsWith('/dashboard')) {
        const redirectUrl = new URL(routingDecision.targetRoute, request.url)

        // Add query parameters to indicate redirect reason
        redirectUrl.searchParams.set('tier_redirect', 'true')
        redirectUrl.searchParams.set('from', tierResult.tier)

        if (routingDecision.requiredTier) {
          redirectUrl.searchParams.set('required', routingDecision.requiredTier)
        }

        context.childLogger.logDebug('Dashboard tier redirect', {
          from: pathname,
          to: routingDecision.targetRoute,
          userTier: tierResult.tier,
          requiredTier: routingDecision.requiredTier
        })

        return {
          response: NextResponse.redirect(redirectUrl),
          cacheHit,
          dbQueries,
          apiCalls,
          userTier: tierResult.tier
        }
      }

      // For other routes, redirect to target
      context.childLogger.logDebug('General page redirect', {
        from: pathname,
        to: routingDecision.targetRoute,
        reason: routingDecision.reason
      })

      return {
        response: NextResponse.redirect(new URL(routingDecision.targetRoute, request.url)),
        cacheHit,
        dbQueries,
        apiCalls,
        userTier: tierResult.tier
      }
    }

    // Access denied without redirect - show access denied page
    if (!routingDecision.allowAccess && !routingDecision.shouldRoute) {
      // Log access denial
      context.childLogger.logAccessDenied('Page access denied', {
        requestId: context.requestId,
        route: pathname,
        method: request.method,
        requiredTier: routingDecision.requiredTier || 'PROFESSIONAL',
        currentTier: tierResult.tier,
        missingFeatures: routingDecision.missingFeatures,
        ip: TierLoggerUtils.extractIP(request.headers),
        userAgent: request.headers.get('user-agent')?.substring(0, 100)
      })

      // Record access denial metrics
      tierMetrics.recordAccess({
        name: 'page_access_denied',
        userTier: tierResult.tier,
        route: pathname,
        allowed: false,
        reason: 'insufficient_tier',
        method: request.method,
        requiredTier: routingDecision.requiredTier
      })

      const accessDeniedUrl = new URL('/access-denied', request.url)
      accessDeniedUrl.searchParams.set('required_tier', routingDecision.requiredTier || 'PROFESSIONAL')
      accessDeniedUrl.searchParams.set('current_tier', tierResult.tier)
      accessDeniedUrl.searchParams.set('requested_path', pathname)

      if (routingDecision.missingFeatures.length > 0) {
        accessDeniedUrl.searchParams.set('missing_features', routingDecision.missingFeatures.join(','))
      }

      return {
        response: NextResponse.redirect(accessDeniedUrl),
        cacheHit,
        dbQueries,
        apiCalls,
        userTier: tierResult.tier
      }
    }

    // Allow access - add tier information to headers for downstream use
    context.childLogger.logDebug('Page access granted', {
      route: pathname,
      userTier: tierResult.tier,
      features: tierResult.features,
      cacheHit,
      executionTime: tierResult.executionTime
    })

    // Record successful access metrics
    tierMetrics.recordAccess({
      name: 'page_access_granted',
      userTier: tierResult.tier,
      route: pathname,
      allowed: true,
      reason: 'tier_sufficient',
      method: request.method
    })

    const response = NextResponse.next()
    response.headers.set('x-user-tier', tierResult.tier)
    response.headers.set('x-tier-features', tierResult.features.join(','))
    response.headers.set('x-tier-status', tierResult.status)
    response.headers.set('x-tier-source', tierResult.source)
    response.headers.set('x-cache-hit', cacheHit.toString())
    response.headers.set('x-execution-time', tierResult.executionTime.toString())
    response.headers.set('x-request-id', context.requestId)

    return {
      response,
      cacheHit,
      dbQueries,
      apiCalls,
      userTier: tierResult.tier
    }

  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))

    // Log error with comprehensive context
    context.childLogger.logError('Error in page route handler', errorObj, {
      requestId: context.requestId,
      route: pathname,
      method: request.method,
      userTier: 'BASIC'
    })

    // Record error metrics
    tierMetrics.recordError({
      name: 'page_route_error',
      errorType: errorObj.name,
      errorCode: (errorObj as any).code || 'UNKNOWN',
      severity: 'high',
      route: pathname,
      userTier: 'BASIC',
      message: errorObj.message
    })

    // Fail-safe: allow access with basic tier
    const response = NextResponse.next()
    response.headers.set('x-user-tier', 'BASIC')
    response.headers.set('x-tier-source', 'fallback')
    response.headers.set('x-request-id', context.requestId)

    return {
      response,
      cacheHit: false,
      dbQueries: 0,
      apiCalls: 0,
      userTier: 'BASIC'
    }
  }
}

/**
 * Handle API route with tier validation
 */
async function handleApiRoute(
  request: NextRequest,
  context: {
    operationId: string;
    cacheHit: boolean;
    dbQueries: number;
    apiCalls: number;
    requestId: string;
    childLogger: any;
  }
): Promise<{
  response: NextResponse;
  cacheHit: boolean;
  dbQueries: number;
  apiCalls: number;
  userTier?: SubscriptionTier;
}> {
  const pathname = request.nextUrl.pathname

  // Skip tier detection for public API routes
  if (isPublicApiRoute(pathname)) {
    context.childLogger.logDebug('Skipping tier detection for public API route', {
      route: pathname
    })
    return {
      response: NextResponse.next(),
      cacheHit: false,
      dbQueries: 0,
      apiCalls: 0,
      userTier: 'BASIC'
    }
  }

  try {
    // Log API tier detection start
    context.childLogger.logDebug('Starting tier detection for API route', {
      route: pathname,
      method: request.method
    })

    // Detect user's subscription tier with optimized caching and circuit breaker
    const tierResult = await executeWithCircuitBreaker(
      'tier-detection-api',
      async () => await detectTierWithCache(request),
      () => ({
        tier: 'BASIC' as SubscriptionTier,
        status: 'ACTIVE' as const,
        features: ['basic_evaluation', 'basic_reports', 'basic_analytics'],
        hasAccess: true,
        isTrialing: false,
        executionTime: 1,
        source: 'fallback' as const
      })
    )

    // Log API tier detection result
    context.childLogger.logTierDetection('Tier detection completed for API route', tierResult, {
      requestId: context.requestId,
      route: pathname,
      method: request.method
    })

    const cacheHit = tierResult.source === 'cache'
    const dbQueries = tierResult.source === 'database' ? 1 : 0
    const apiCalls = ['clerk', 'stripe'].includes(tierResult.source) ? 1 : 0

    // Record API tier detection metrics
    tierMetrics.recordPerformance({
      name: 'api_tier_detection',
      executionTime: tierResult.executionTime,
      memoryUsage: TierLoggerUtils.getMemoryUsage(),
      cacheHit,
      dbQueries,
      apiCalls,
      route: pathname,
      userTier: tierResult.tier,
      method: request.method
    })

    // Make routing decision
    const routingDecision = TierRoutingEngine.makeRoutingDecision(
      pathname,
      tierResult.tier,
      tierResult.features
    )

    // Log API routing decision
    context.childLogger.logRoutingDecision('API routing decision made', routingDecision, {
      requestId: context.requestId,
      originalPath: pathname,
      method: request.method
    })

    // For API routes, return 403 instead of redirecting
    if (!routingDecision.allowAccess) {
      // Log API access denial
      context.childLogger.logAccessDenied('API access denied', {
        requestId: context.requestId,
        route: pathname,
        method: request.method,
        requiredTier: routingDecision.requiredTier || 'PROFESSIONAL',
        currentTier: tierResult.tier,
        missingFeatures: routingDecision.missingFeatures,
        ip: TierLoggerUtils.extractIP(request.headers),
        userAgent: request.headers.get('user-agent')?.substring(0, 100)
      })

      // Record API access denial metrics
      tierMetrics.recordAccess({
        name: 'api_access_denied',
        userTier: tierResult.tier,
        route: pathname,
        allowed: false,
        reason: 'insufficient_tier',
        method: request.method,
        requiredTier: routingDecision.requiredTier
      })

      return {
        response: NextResponse.json({
          error: 'Access denied',
          code: 'TIER_ACCESS_DENIED',
          required_tier: routingDecision.requiredTier,
          current_tier: tierResult.tier,
          missing_features: routingDecision.missingFeatures,
          upgrade_url: `/pricing?upgrade=${routingDecision.requiredTier?.toLowerCase()}`,
          cache_hit: cacheHit,
          execution_time: tierResult.executionTime,
          request_id: context.requestId
        }, { status: 403 }),
        cacheHit,
        dbQueries,
        apiCalls,
        userTier: tierResult.tier
      }
    }

    // Log successful API access
    context.childLogger.logDebug('API access granted', {
      route: pathname,
      userTier: tierResult.tier,
      features: tierResult.features,
      cacheHit,
      executionTime: tierResult.executionTime
    })

    // Record successful API access metrics
    tierMetrics.recordAccess({
      name: 'api_access_granted',
      userTier: tierResult.tier,
      route: pathname,
      allowed: true,
      reason: 'tier_sufficient',
      method: request.method
    })

    // Add tier information to headers for API handlers
    const response = NextResponse.next()
    response.headers.set('x-user-tier', tierResult.tier)
    response.headers.set('x-tier-features', tierResult.features.join(','))
    response.headers.set('x-tier-status', tierResult.status)
    response.headers.set('x-tier-execution-time', tierResult.executionTime.toString())
    response.headers.set('x-cache-hit', cacheHit.toString())
    response.headers.set('x-tier-source', tierResult.source)
    response.headers.set('x-request-id', context.requestId)

    return {
      response,
      cacheHit,
      dbQueries,
      apiCalls,
      userTier: tierResult.tier
    }

  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))

    // Log API error with comprehensive context
    context.childLogger.logError('Error in API route handler', errorObj, {
      requestId: context.requestId,
      route: pathname,
      method: request.method,
      userTier: 'BASIC'
    })

    // Record API error metrics
    tierMetrics.recordError({
      name: 'api_route_error',
      errorType: errorObj.name,
      errorCode: (errorObj as any).code || 'UNKNOWN',
      severity: 'high',
      route: pathname,
      userTier: 'BASIC',
      message: errorObj.message
    })

    // Fail-safe: allow access with basic tier for non-critical APIs
    if (isNonCriticalApiRoute(pathname)) {
      context.childLogger.logDebug('Fallback to basic tier for non-critical API', {
        route: pathname
      })

      const response = NextResponse.next()
      response.headers.set('x-user-tier', 'BASIC')
      response.headers.set('x-tier-source', 'fallback')
      response.headers.set('x-request-id', context.requestId)

      return {
        response,
        cacheHit: false,
        dbQueries: 0,
        apiCalls: 0,
        userTier: 'BASIC'
      }
    }

    // For critical APIs, return error
    context.childLogger.logError('Critical API service error', errorObj, {
      requestId: context.requestId,
      route: pathname,
      method: request.method
    })

    return {
      response: NextResponse.json({
        error: 'Service temporarily unavailable',
        code: 'TIER_SERVICE_ERROR',
        retry_after: 30,
        request_id: context.requestId
      }, { status: 503 }),
      cacheHit: false,
      dbQueries: 0,
      apiCalls: 0,
      userTier: 'BASIC'
    }
  }
}

/**
 * Check if middleware should be skipped for this request
 */
function shouldSkipMiddleware(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname

  // Skip for static files
  if (pathname.startsWith('/_next/') ||
      pathname.startsWith('/static/') ||
      pathname.includes('.') && !pathname.endsWith('.html')) {
    return true
  }

  // Skip for health checks
  if (pathname === '/api/health' || pathname === '/health') {
    return true
  }

  return false
}

/**
 * Check if route is public (no authentication required)
 */
function isPublicRoute(pathname: string): boolean {
  const publicPaths = [
    '/',
    '/auth',
    '/pricing',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/access-denied'
  ]

  return publicPaths.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  )
}

/**
 * Check if API route is public
 */
function isPublicApiRoute(pathname: string): boolean {
  const publicApiPaths = [
    '/api/auth',
    '/api/webhooks',
    '/api/health',
    '/api/public'
  ]

  return publicApiPaths.some(path => pathname.startsWith(path))
}

/**
 * Check if API route is non-critical (can fallback to basic tier)
 */
function isNonCriticalApiRoute(pathname: string): boolean {
  const nonCriticalPaths = [
    '/api/user/profile',
    '/api/evaluations/basic',
    '/api/reports/basic'
  ]

  return nonCriticalPaths.some(path => pathname.startsWith(path))
}

/**
 * Optimized tier detection with caching
 */
async function detectTierWithCache(request: NextRequest): Promise<TierDetectionResult> {
  // Extract user ID from request (this would depend on your auth setup)
  const userId = await getUserIdFromRequest(request)

  if (!userId) {
    return {
      tier: 'BASIC',
      status: 'ACTIVE',
      features: ['basic_evaluation', 'basic_reports', 'basic_analytics'],
      hasAccess: true,
      isTrialing: false,
      executionTime: 1,
      source: 'fallback'
    }
  }

  // Try cache first for maximum performance
  const cachedResult = tierCache.getTierResult(userId)
  if (cachedResult) {
    return {
      ...cachedResult,
      source: 'cache',
      executionTime: 1 // Cache access is near-instantaneous
    }
  }

  // Fallback to original tier detection service
  const result = await TierDetectionService.detectTier(request)

  // Cache the result for future requests
  tierCache.setTierResult(userId, result)

  return result
}

/**
 * Extract user ID from request headers or auth context
 */
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Try to get from auth header or cookie
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      // Extract user ID from JWT or similar
      // This is a simplified version - implement based on your auth system
      return authHeader.split('-')[1] || null
    }

    // Fallback to trying Clerk auth
    const { auth } = await import('@clerk/nextjs/server')
    const authResult = await auth()
    return authResult?.userId || null
  } catch {
    return null
  }
}

/**
 * Log middleware performance metrics
 */
function logMiddlewareMetrics(metrics: MiddlewareMetrics): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Middleware Metrics:', {
      ...metrics,
      timestamp: new Date().toISOString(),
      cacheEfficiency: metrics.cacheHit ? '✅ CACHE HIT' : '❌ CACHE MISS',
      performanceStatus: metrics.executionTime < 50 ? '🚀 FAST' : metrics.executionTime < 100 ? '⚡ OK' : '🐌 SLOW'
    })
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to analytics or monitoring service
    // analytics.track('middleware_execution', metrics)

    // Log performance issues for alerting
    if (metrics.executionTime > DEFAULT_MIDDLEWARE_CONFIG.maxExecutionTime) {
      console.warn('🚨 Performance Alert:', {
        type: 'slow_middleware',
        executionTime: metrics.executionTime,
        threshold: DEFAULT_MIDDLEWARE_CONFIG.maxExecutionTime,
        endpoint: metrics.endpoint,
        userTier: metrics.userTier,
        cacheHit: metrics.cacheHit,
        timestamp: new Date().toISOString()
      })
    }
  }
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Clerk auth endpoints)
     * - api/webhooks (webhook endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico).*)',
  ],
}