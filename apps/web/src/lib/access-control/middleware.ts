/**
 * Access Control Middleware
 * Story 11.10: Middleware for protecting routes and API endpoints based on tier permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  UserTier,
  TierPermissions,
  checkPermission,
  hasTierAccess,
  checkTierLimits,
  trackUsage,
  UsageContext,
  AccessResult
} from './tier-access-control';

/**
 * Configuration for protected routes
 */
export interface RouteProtectionConfig {
  requiredTier?: UserTier;
  feature?: keyof TierPermissions['features'];
  action?: string;
  requireAuth?: boolean;
  customCheck?: (userTier: UserTier, userId: string) => Promise<boolean>;
}

/**
 * Configuration for API endpoint protection
 */
export interface APIProtectionConfig extends RouteProtectionConfig {
  rateLimitKey?: string;
  trackUsage?: boolean;
  usageMetadata?: Record<string, any>;
}

/**
 * Middleware for protecting routes based on tier access
 */
export function withTierProtection(config: RouteProtectionConfig) {
  return async function middleware(request: NextRequest) {
    try {
      // Check authentication if required
      if (config.requireAuth !== false) {
        const { userId } = auth();
        if (!userId) {
          return NextResponse.redirect(new URL('/sign-in', request.url));
        }
      }

      // Get user tier from database or session
      const userTier = await getUserTier(request);
      if (!userTier) {
        return NextResponse.redirect(new URL('/subscription', request.url));
      }

      // Check tier access if specified
      if (config.requiredTier && !hasTierAccess(userTier, config.requiredTier)) {
        return NextResponse.redirect(
          new URL(`/upgrade?required=${config.requiredTier}`, request.url)
        );
      }

      // Check feature permission if specified
      if (config.feature && config.action) {
        const { userId } = auth();
        const accessResult = checkPermission(userTier, config.feature, config.action, {
          userId: userId || '',
          feature: config.feature,
          action: config.action,
          timestamp: new Date(),
          metadata: { ip: request.ip, userAgent: request.headers.get('user-agent') }
        });

        if (!accessResult.allowed) {
          const searchParams = new URLSearchParams({
            feature: config.feature,
            action: config.action,
            reason: accessResult.reason || 'Access denied',
            ...(accessResult.upgradeRequired && { upgrade: accessResult.upgradeRequired })
          });

          return NextResponse.redirect(
            new URL(`/access-denied?${searchParams.toString()}`, request.url)
          );
        }
      }

      // Custom check if provided
      if (config.customCheck) {
        const { userId } = auth();
        const isAllowed = await config.customCheck(userTier, userId || '');
        if (!isAllowed) {
          return NextResponse.redirect(new URL('/access-denied', request.url));
        }
      }

      return NextResponse.next();

    } catch (error) {
      console.error('Tier protection middleware error:', error);
      return NextResponse.redirect(new URL('/error', request.url));
    }
  };
}

/**
 * API middleware for protecting endpoints
 */
export function withAPITierProtection(config: APIProtectionConfig) {
  return async function apiMiddleware(request: NextRequest) {
    try {
      const { userId } = auth();

      // Check authentication
      if (config.requireAuth !== false && !userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Get user tier
      const userTier = await getUserTier(request);
      if (!userTier) {
        return NextResponse.json(
          {
            error: 'Subscription required',
            upgradeUrl: '/subscription'
          },
          { status: 402 }
        );
      }

      // Check tier access
      if (config.requiredTier && !hasTierAccess(userTier, config.requiredTier)) {
        return NextResponse.json(
          {
            error: 'Insufficient tier',
            currentTier: userTier,
            requiredTier: config.requiredTier,
            upgradeUrl: `/upgrade?required=${config.requiredTier}`
          },
          { status: 403 }
        );
      }

      // Check feature permission
      let accessResult: AccessResult | null = null;
      if (config.feature && config.action) {
        const context: UsageContext = {
          userId: userId || '',
          feature: config.feature,
          action: config.action,
          timestamp: new Date(),
          metadata: {
            ip: request.ip,
            userAgent: request.headers.get('user-agent'),
            endpoint: request.url,
            method: request.method,
            ...config.usageMetadata
          }
        };

        accessResult = checkPermission(userTier, config.feature, config.action, context);

        if (!accessResult.allowed) {
          return NextResponse.json(
            {
              error: 'Permission denied',
              feature: config.feature,
              action: config.action,
              reason: accessResult.reason,
              currentTier: userTier,
              upgradeRequired: accessResult.upgradeRequired,
              conditions: accessResult.conditions
            },
            { status: 403 }
          );
        }

        // Track usage if enabled
        if (config.trackUsage && accessResult.allowed) {
          trackUsage(context);
        }
      }

      // Custom check
      if (config.customCheck) {
        const isAllowed = await config.customCheck(userTier, userId || '');
        if (!isAllowed) {
          return NextResponse.json(
            { error: 'Custom access check failed' },
            { status: 403 }
          );
        }
      }

      // Add headers with access information
      const response = NextResponse.next();
      response.headers.set('X-User-Tier', userTier);
      if (accessResult) {
        response.headers.set('X-Permission-Level', accessResult.permission);
        if (accessResult.conditions) {
          response.headers.set('X-Access-Conditions', JSON.stringify(accessResult.conditions));
        }
      }

      return response;

    } catch (error) {
      console.error('API tier protection middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * React component wrapper for tier-based rendering
 */
export interface TierGateProps {
  requiredTier?: UserTier;
  feature?: keyof TierPermissions['features'];
  action?: string;
  userTier: UserTier;
  fallback?: React.ReactNode;
  upgradePrompt?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Component for conditionally rendering based on tier permissions
 */
export function TierGate({
  requiredTier,
  feature,
  action,
  userTier,
  fallback,
  upgradePrompt,
  children
}: TierGateProps): JSX.Element | null {
  // Check tier access
  if (requiredTier && !hasTierAccess(userTier, requiredTier)) {
    return (upgradePrompt || fallback || null) as JSX.Element | null;
  }

  // Check feature permission
  if (feature && action) {
    const accessResult = checkPermission(userTier, feature, action);
    if (!accessResult.allowed) {
      return (upgradePrompt || fallback || null) as JSX.Element | null;
    }
  }

  return children as JSX.Element;
}

/**
 * Hook for checking permissions in React components
 */
export interface UsePermissionCheckResult {
  hasAccess: boolean;
  permission: string;
  conditions?: any[];
  reason?: string;
  upgradeRequired?: UserTier;
  isLoading: boolean;
  error?: string;
}

/**
 * React hook for permission checking
 */
export function usePermissionCheck(
  userTier: UserTier,
  feature?: keyof TierPermissions['features'],
  action?: string,
  context?: Partial<UsageContext>
): UsePermissionCheckResult {
  const [result, setResult] = React.useState<UsePermissionCheckResult>({
    hasAccess: false,
    permission: 'none',
    isLoading: true
  });

  React.useEffect(() => {
    async function checkAccess() {
      try {
        if (!feature || !action) {
          setResult({
            hasAccess: true,
            permission: 'read',
            isLoading: false
          });
          return;
        }

        const accessResult = checkPermission(userTier, feature, action, context as UsageContext);

        setResult({
          hasAccess: accessResult.allowed,
          permission: accessResult.permission,
          conditions: accessResult.conditions,
          reason: accessResult.reason,
          upgradeRequired: accessResult.upgradeRequired,
          isLoading: false
        });
      } catch (error) {
        setResult({
          hasAccess: false,
          permission: 'none',
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    checkAccess();
  }, [userTier, feature, action, context]);

  return result;
}

/**
 * Utility for enforcing tier limits in API handlers
 */
export async function enforceTierLimits(
  userTier: UserTier,
  limitType: keyof TierPermissions['limits'],
  currentValue: number
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const limitResult = checkTierLimits(userTier, limitType, currentValue);

  if (!limitResult.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Tier limit exceeded',
          limitType,
          currentValue,
          reason: limitResult.reason,
          upgradeRequired: limitResult.upgradeRequired
        },
        { status: 429 }
      )
    };
  }

  return { allowed: true };
}

/**
 * Helper function to get user tier from request
 * This should be implemented based on your user/subscription system
 */
async function getUserTier(request: NextRequest): Promise<UserTier | null> {
  try {
    const { userId } = auth();
    if (!userId) return null;

    // In a real implementation, you would:
    // 1. Query your database for the user's subscription
    // 2. Map subscription to tier
    // 3. Handle edge cases (expired subscriptions, etc.)

    // For now, return a default tier or implement your logic here
    // This is a placeholder that should be replaced with actual implementation

    // Example implementation:
    // const user = await db.user.findUnique({
    //   where: { clerkId: userId },
    //   include: { subscription: true }
    // });
    //
    // if (!user?.subscription || !user.subscription.active) {
    //   return 'basic';
    // }
    //
    // return user.subscription.tier as UserTier;

    // Temporary fallback - replace with actual implementation
    return 'basic';

  } catch (error) {
    console.error('Error getting user tier:', error);
    return null;
  }
}

/**
 * Utility for creating permission-aware API responses
 */
export function createPermissionResponse(
  data: any,
  userTier: UserTier,
  feature?: keyof TierPermissions['features'],
  action?: string
) {
  const response = {
    data,
    userTier,
    permissions: feature && action ? {
      feature,
      action,
      access: checkPermission(userTier, feature, action)
    } : undefined
  };

  return NextResponse.json(response);
}

/**
 * Decorator for protecting class methods with tier checks
 */
export function RequiresTier(tier: UserTier) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Extract user tier from context (implementation dependent)
      const userTier = this.userTier || args[0]?.userTier;

      if (!userTier || !hasTierAccess(userTier, tier)) {
        throw new Error(`Requires ${tier} tier or higher`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Decorator for protecting class methods with feature permissions
 */
export function RequiresPermission(
  feature: keyof TierPermissions['features'],
  action: string
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Extract user context (implementation dependent)
      const userTier = this.userTier || args[0]?.userTier;
      const userId = this.userId || args[0]?.userId;

      if (!userTier || !userId) {
        throw new Error('User context required');
      }

      const accessResult = checkPermission(userTier, feature, action, {
        userId,
        feature,
        action,
        timestamp: new Date()
      });

      if (!accessResult.allowed) {
        throw new Error(`Permission denied: ${accessResult.reason}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Import React for the hooks and components
import React from 'react';

export default {
  withTierProtection,
  withAPITierProtection,
  TierGate,
  usePermissionCheck,
  enforceTierLimits,
  createPermissionResponse,
  RequiresTier,
  RequiresPermission
};