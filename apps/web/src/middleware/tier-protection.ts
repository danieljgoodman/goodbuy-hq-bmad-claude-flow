/**
 * Comprehensive Tier Protection Middleware
 * Story 11.10: API endpoint protection with authentication, authorization, audit logging, and rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserSubscriptionDetails, UserSubscriptionDetails } from '@/lib/subscription/user-subscription';
import { checkPermission, trackUsage, UsageContext } from '@/lib/access-control/tier-access-control';
import { TierPermissions, UserTier } from '@/lib/access-control/permission-matrix';
import { createAuditLog, AuditContext } from '@/lib/audit/enterprise-audit-log';
import { rateLimit, RateLimitConfig } from '@/lib/utils/rate-limit';

export interface TierProtectionConfig {
  requiredTier: UserTier;
  feature: keyof TierPermissions['features'];
  action: string;
  resource?: string;
  enableRateLimit?: boolean;
  enableAuditLog?: boolean;
  customPermissionCheck?: (context: PermissionContext) => Promise<PermissionResult>;
}

export interface PermissionContext {
  userId: string;
  userTier: UserTier;
  subscription: UserSubscriptionDetails;
  request: NextRequest;
  feature: keyof TierPermissions['features'];
  action: string;
  resource?: string;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: UserTier;
  limitation?: string;
  context?: Record<string, any>;
}

export interface AccessAttemptLog {
  userId: string;
  feature: string;
  action: string;
  resource?: string;
  requestedTier: UserTier;
  userTier: UserTier;
  status: 'allowed' | 'denied';
  reason?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  rateLimited?: boolean;
  additionalContext?: Record<string, any>;
}

// Rate limiting configuration for denied requests
const DENIED_REQUEST_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: {
    free: 5,      // 5 denied requests per 15 minutes for basic
    professional: 10,  // 10 denied requests per 15 minutes for professional
    enterprise: 20     // 20 denied requests per 15 minutes for enterprise
  },
  skipFailedRequests: false,
  skipSuccessfulRequests: true
};

// Cache for subscription details (5 minute TTL)
const subscriptionCache = new Map<string, { data: UserSubscriptionDetails; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Create comprehensive tier protection middleware
 */
export function createTierProtectionMiddleware(config: TierProtectionConfig) {
  const rateLimiter = config.enableRateLimit !== false ? rateLimit(DENIED_REQUEST_RATE_LIMIT) : null;

  return async function tierProtectionMiddleware(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();

    try {
      // 1. Authentication Check
      const { userId } = auth();
      if (!userId) {
        return createErrorResponse({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          status: 401,
          upgradeUrl: '/auth/signin'
        });
      }

      // 2. Get User Subscription Details (with caching)
      const userSubscription = await getUserSubscriptionDetailsWithCache(userId);
      if (!userSubscription) {
        return createErrorResponse({
          error: 'Unable to verify subscription',
          code: 'SUBSCRIPTION_ERROR',
          status: 403,
          upgradeUrl: '/subscription'
        });
      }

      // 3. Create permission context
      const permissionContext: PermissionContext = {
        userId,
        userTier: userSubscription.tier,
        subscription: userSubscription,
        request,
        feature: config.feature,
        action: config.action,
        resource: config.resource || 'default'
      };

      // 4. Check tier-based permission
      let permissionResult: PermissionResult;

      if (config.customPermissionCheck) {
        permissionResult = await config.customPermissionCheck(permissionContext);
      } else {
        const usageContext: UsageContext = {
          userId,
          feature: config.feature,
          action: config.action,
          timestamp: new Date(),
          metadata: {
            endpoint: request.url,
            method: request.method
          }
        };

        const accessResult = checkPermission(
          userSubscription.tier,
          config.feature,
          config.action,
          usageContext
        );

        permissionResult = {
          allowed: accessResult.allowed,
          reason: accessResult.reason,
          upgradeRequired: accessResult.upgradeRequired,
          limitation: accessResult.conditions?.map(c => c.message).join('; '),
          context: accessResult.conditions
        };
      }

      // 5. Handle denied access
      if (!permissionResult.allowed) {
        // Rate limiting for denied requests
        if (rateLimiter) {
          const rateLimitResult = await rateLimiter.check(request);
          if (!rateLimitResult.success) {
            // Log rate limit exceeded
            await logAccessAttemptSafe({
              userId,
              feature: config.feature,
              action: config.action,
              resource: config.resource,
              requestedTier: config.requiredTier,
              userTier: userSubscription.tier,
              status: 'denied',
              reason: 'rate_limit_exceeded',
              timestamp: new Date(),
              ipAddress: getClientIP(request),
              userAgent: request.headers.get('user-agent') || undefined,
              rateLimited: true,
              additionalContext: {
                limit: rateLimitResult.limit,
                resetTime: rateLimitResult.resetTime,
                performanceMs: Date.now() - startTime
              }
            });

            return createErrorResponse({
              error: 'Rate limit exceeded',
              code: 'RATE_LIMIT_EXCEEDED',
              status: 429,
              headers: {
                'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
              },
              retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
            });
          }
        }

        // Log access denial
        await logAccessAttemptSafe({
          userId,
          feature: config.feature,
          action: config.action,
          resource: config.resource,
          requestedTier: config.requiredTier,
          userTier: userSubscription.tier,
          status: 'denied',
          reason: permissionResult.reason || 'insufficient_permission',
          timestamp: new Date(),
          ipAddress: getClientIP(request),
          userAgent: request.headers.get('user-agent') || undefined,
          additionalContext: {
            limitation: permissionResult.limitation,
            performanceMs: Date.now() - startTime
          }
        });

        return createErrorResponse({
          error: 'Insufficient permissions',
          code: 'PERMISSION_DENIED',
          status: 403,
          details: {
            feature: config.feature,
            action: config.action,
            requiredTier: permissionResult.upgradeRequired || config.requiredTier,
            currentTier: userSubscription.tier,
            limitation: permissionResult.limitation,
            reason: permissionResult.reason
          },
          upgradeUrl: `/upgrade?tier=${permissionResult.upgradeRequired || config.requiredTier}&feature=${config.feature}`
        });
      }

      // 6. Track usage for allowed access
      if (permissionResult.allowed) {
        const usageContext: UsageContext = {
          userId,
          feature: config.feature,
          action: config.action,
          timestamp: new Date(),
          metadata: {
            endpoint: request.url,
            method: request.method,
            tier: userSubscription.tier
          }
        };

        try {
          trackUsage(usageContext);
        } catch (error) {
          console.warn('Failed to track usage:', error);
        }
      }

      // 7. Log successful access
      await logAccessAttemptSafe({
        userId,
        feature: config.feature,
        action: config.action,
        resource: config.resource,
        requestedTier: config.requiredTier,
        userTier: userSubscription.tier,
        status: 'allowed',
        timestamp: new Date(),
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
        additionalContext: {
          permissionContext: permissionResult.context,
          performanceMs: Date.now() - startTime
        }
      });

      // 8. Enrich request headers with permission context
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-tier', userSubscription.tier);
      requestHeaders.set('x-user-id', userId);
      requestHeaders.set('x-permission-context', JSON.stringify({
        feature: config.feature,
        action: config.action,
        resource: config.resource,
        allowed: true,
        context: permissionResult.context
      }));
      requestHeaders.set('x-subscription-status', userSubscription.status);
      requestHeaders.set('x-performance-ms', (Date.now() - startTime).toString());

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

    } catch (error) {
      console.error('Tier protection middleware error:', error);

      // Log the error for monitoring
      if (userId) {
        await logAccessAttemptSafe({
          userId,
          feature: config.feature,
          action: config.action,
          resource: config.resource,
          requestedTier: config.requiredTier,
          userTier: 'basic', // fallback
          status: 'denied',
          reason: 'middleware_error',
          timestamp: new Date(),
          ipAddress: getClientIP(request),
          userAgent: request.headers.get('user-agent') || undefined,
          additionalContext: {
            error: error instanceof Error ? error.message : 'Unknown error',
            performanceMs: Date.now() - startTime
          }
        });
      }

      return createErrorResponse({
        error: 'Access control system error',
        code: 'MIDDLEWARE_ERROR',
        status: 500,
        details: {
          message: 'Please try again later or contact support'
        }
      });
    }
  };
}

/**
 * Get user subscription details with caching
 */
async function getUserSubscriptionDetailsWithCache(userId: string): Promise<UserSubscriptionDetails | null> {
  const now = Date.now();
  const cached = subscriptionCache.get(userId);

  if (cached && cached.expiry > now) {
    return cached.data;
  }

  try {
    const subscription = await getUserSubscriptionDetails(userId);
    if (subscription) {
      subscriptionCache.set(userId, {
        data: subscription,
        expiry: now + CACHE_TTL
      });
    }
    return subscription;
  } catch (error) {
    console.error('Failed to get subscription details:', error);
    return null;
  }
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIP || 'unknown';
  return ip;
}

/**
 * Safely log access attempts (fail silently)
 */
async function logAccessAttemptSafe(logEntry: AccessAttemptLog): Promise<void> {
  try {
    // Use existing audit logging system
    const auditContext: AuditContext = {
      userId: logEntry.userId,
      userTier: logEntry.userTier,
      ipAddress: logEntry.ipAddress,
      userAgent: logEntry.userAgent,
      sessionId: `${logEntry.userId}-${Date.now()}`
    };

    await createAuditLog(
      `api-access-${logEntry.feature}`,
      logEntry.status === 'allowed' ? 'read' : 'access_denied',
      auditContext,
      {
        reason: logEntry.reason,
        fieldName: `${logEntry.feature}.${logEntry.action}`,
        oldValue: logEntry.requestedTier,
        newValue: logEntry.status
      }
    );
  } catch (error) {
    // Fail silently - audit logging should not break the application
    console.warn('Failed to log access attempt:', error);
  }
}

/**
 * Create standardized error responses
 */
function createErrorResponse({
  error,
  code,
  status,
  details,
  upgradeUrl,
  headers,
  retryAfter
}: {
  error: string;
  code: string;
  status: number;
  details?: Record<string, any>;
  upgradeUrl?: string;
  headers?: Record<string, string>;
  retryAfter?: number;
}): NextResponse {
  const responseBody = {
    error,
    code,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
    ...(upgradeUrl && { upgradeUrl }),
    ...(retryAfter && { retryAfter })
  };

  const responseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (retryAfter) {
    responseHeaders['Retry-After'] = retryAfter.toString();
  }

  return NextResponse.json(responseBody, {
    status,
    headers: responseHeaders
  });
}

/**
 * Clear subscription cache for a user (useful for real-time updates)
 */
export function clearSubscriptionCache(userId: string): void {
  subscriptionCache.delete(userId);
}

/**
 * Clear entire subscription cache
 */
export function clearAllSubscriptionCache(): void {
  subscriptionCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: subscriptionCache.size,
    entries: Array.from(subscriptionCache.keys())
  };
}

export default createTierProtectionMiddleware;