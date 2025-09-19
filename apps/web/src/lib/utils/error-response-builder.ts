/**
 * Error Response Builder for API Protection
 * Story 11.10: Comprehensive error handling with upgrade URLs and user guidance
 */

import { NextResponse } from 'next/server';
import { UserTier } from '@/lib/access-control/permission-matrix';

export interface ErrorResponseConfig {
  error: string;
  code: string;
  status: number;
  details?: Record<string, any>;
  upgradeUrl?: string;
  helpUrl?: string;
  contactUrl?: string;
  headers?: Record<string, string>;
  retryAfter?: number;
  timestamp?: string;
  requestId?: string;
}

export interface TierUpgradeInfo {
  currentTier: UserTier;
  requiredTier: UserTier;
  feature: string;
  action: string;
  benefits: string[];
  pricing?: {
    monthly: number;
    yearly: number;
  };
}

export interface ApiErrorResponse {
  error: string;
  code: string;
  timestamp: string;
  requestId?: string;
  details?: Record<string, any>;
  upgradeInfo?: TierUpgradeInfo;
  helpResources?: {
    documentation?: string;
    support?: string;
    community?: string;
    tutorials?: string;
  };
  retryAfter?: number;
  rateLimit?: {
    limit: number;
    remaining: number;
    resetTime: number;
  };
}

/**
 * Standard error codes for API protection
 */
export const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',

  // Authorization errors
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INSUFFICIENT_TIER: 'INSUFFICIENT_TIER',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
  ACTION_NOT_ALLOWED: 'ACTION_NOT_ALLOWED',

  // Rate limiting errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  BURST_LIMIT_EXCEEDED: 'BURST_LIMIT_EXCEEDED',
  IP_BLOCKED: 'IP_BLOCKED',

  // Usage limit errors
  USAGE_LIMIT_EXCEEDED: 'USAGE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  STORAGE_LIMIT_EXCEEDED: 'STORAGE_LIMIT_EXCEEDED',

  // System errors
  MIDDLEWARE_ERROR: 'MIDDLEWARE_ERROR',
  SUBSCRIPTION_ERROR: 'SUBSCRIPTION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

/**
 * Feature-specific upgrade benefits
 */
const FEATURE_BENEFITS: Record<string, Record<UserTier, string[]>> = {
  ai_analysis: {
    basic: [],
    professional: [
      'AI-powered business insights',
      'Automated data analysis',
      'Trend identification',
      '20 AI analyses per month'
    ],
    enterprise: [
      'Advanced AI analysis with custom models',
      'Unlimited AI analyses',
      'ML training capabilities',
      'Custom AI insights'
    ]
  },
  scenario_modeling: {
    basic: [],
    professional: [
      'Basic scenario planning',
      '8 scenarios per month',
      'Stress testing capabilities'
    ],
    enterprise: [
      'Advanced scenario modeling',
      'Unlimited scenarios',
      'Strategic simulation',
      'Optimization algorithms'
    ]
  },
  reports: {
    basic: [
      '5 basic reports per month',
      'Standard templates',
      'Basic export formats'
    ],
    professional: [
      '25 professional reports per month',
      'Advanced analytics',
      'Custom templates',
      'Enhanced export options'
    ],
    enterprise: [
      'Unlimited enterprise reports',
      'White-label reports',
      'Automated reporting',
      'Advanced customization'
    ]
  },
  admin: {
    basic: [],
    professional: [],
    enterprise: [
      'User management dashboard',
      'System administration',
      'Security controls',
      'Audit logs and compliance'
    ]
  }
};

/**
 * Tier pricing information
 */
const TIER_PRICING: Record<Exclude<UserTier, 'basic'>, { monthly: number; yearly: number }> = {
  professional: {
    monthly: 29,
    yearly: 290
  },
  enterprise: {
    monthly: 99,
    yearly: 990
  }
};

/**
 * Build comprehensive error response with upgrade guidance
 */
export function buildErrorResponse(config: ErrorResponseConfig): NextResponse {
  const responseBody: ApiErrorResponse = {
    error: config.error,
    code: config.code,
    timestamp: config.timestamp || new Date().toISOString(),
    requestId: config.requestId || generateRequestId(),
    ...(config.details && { details: config.details }),
    ...(config.retryAfter && { retryAfter: config.retryAfter })
  };

  // Add help resources
  responseBody.helpResources = {
    documentation: config.helpUrl || 'https://goodbuyhq.com/docs',
    support: config.contactUrl || 'https://goodbuyhq.com/support',
    community: 'https://goodbuyhq.com/community',
    tutorials: 'https://goodbuyhq.com/tutorials'
  };

  const responseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': responseBody.requestId,
    ...config.headers
  };

  if (config.retryAfter) {
    responseHeaders['Retry-After'] = config.retryAfter.toString();
  }

  return NextResponse.json(responseBody, {
    status: config.status,
    headers: responseHeaders
  });
}

/**
 * Build tier upgrade error response with detailed upgrade information
 */
export function buildTierUpgradeError({
  currentTier,
  requiredTier,
  feature,
  action,
  requestId
}: {
  currentTier: UserTier;
  requiredTier: UserTier;
  feature: string;
  action: string;
  requestId?: string;
}): NextResponse {
  const benefits = FEATURE_BENEFITS[feature]?.[requiredTier] || [];
  const pricing = requiredTier !== 'basic' ? TIER_PRICING[requiredTier] : undefined;

  const upgradeInfo: TierUpgradeInfo = {
    currentTier,
    requiredTier,
    feature,
    action,
    benefits,
    pricing
  };

  const upgradeUrl = `/upgrade?tier=${requiredTier}&feature=${feature}&action=${action}`;

  return buildErrorResponse({
    error: `${feature} ${action} requires ${requiredTier} tier`,
    code: ERROR_CODES.INSUFFICIENT_TIER,
    status: 403,
    upgradeUrl,
    requestId,
    details: {
      upgradeInfo,
      currentCapabilities: FEATURE_BENEFITS[feature]?.[currentTier] || [],
      missingCapabilities: benefits
    }
  });
}

/**
 * Build rate limit error response
 */
export function buildRateLimitError({
  limit,
  remaining,
  resetTime,
  tier,
  requestId
}: {
  limit: number;
  remaining: number;
  resetTime: number;
  tier: UserTier;
  requestId?: string;
}): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  const upgradeInfo = tier === 'basic' ? {
    message: 'Professional and Enterprise tiers have higher rate limits',
    upgradeUrl: '/upgrade?reason=rate-limit',
    benefits: [
      'Higher rate limits',
      'Priority processing',
      'Burst protection'
    ]
  } : undefined;

  return buildErrorResponse({
    error: 'Rate limit exceeded',
    code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    status: 429,
    retryAfter,
    requestId,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetTime.toString()
    },
    details: {
      limit,
      remaining,
      resetTime,
      tier,
      upgradeInfo
    }
  });
}

/**
 * Build usage limit error response
 */
export function buildUsageLimitError({
  limitType,
  currentUsage,
  maxUsage,
  tier,
  resetDate,
  requestId
}: {
  limitType: string;
  currentUsage: number;
  maxUsage: number;
  tier: UserTier;
  resetDate: Date;
  requestId?: string;
}): NextResponse {
  const nextTier = getNextTier(tier);
  const upgradeUrl = nextTier ? `/upgrade?tier=${nextTier}&reason=usage-limit` : undefined;

  return buildErrorResponse({
    error: `${limitType} usage limit exceeded`,
    code: ERROR_CODES.USAGE_LIMIT_EXCEEDED,
    status: 403,
    upgradeUrl,
    requestId,
    details: {
      limitType,
      currentUsage,
      maxUsage,
      tier,
      resetDate: resetDate.toISOString(),
      upgradeInfo: nextTier ? {
        nextTier,
        benefits: getUpgradeBenefits(tier, nextTier, limitType)
      } : undefined
    }
  });
}

/**
 * Build authentication error response
 */
export function buildAuthError({
  reason,
  requestId
}: {
  reason: 'required' | 'invalid' | 'expired';
  requestId?: string;
}): NextResponse {
  const errorMap = {
    required: {
      error: 'Authentication required',
      code: ERROR_CODES.AUTH_REQUIRED,
      status: 401
    },
    invalid: {
      error: 'Invalid authentication credentials',
      code: ERROR_CODES.AUTH_INVALID,
      status: 401
    },
    expired: {
      error: 'Authentication token expired',
      code: ERROR_CODES.AUTH_EXPIRED,
      status: 401
    }
  };

  const errorConfig = errorMap[reason];

  return buildErrorResponse({
    ...errorConfig,
    requestId,
    upgradeUrl: '/auth/signin',
    details: {
      reason,
      authRequired: true
    }
  });
}

/**
 * Build IP blocked error response
 */
export function buildIPBlockedError({
  ip,
  reason,
  blockedUntil,
  requestId
}: {
  ip: string;
  reason: string;
  blockedUntil: number;
  requestId?: string;
}): NextResponse {
  const retryAfter = Math.ceil((blockedUntil - Date.now()) / 1000);

  return buildErrorResponse({
    error: 'IP address temporarily blocked',
    code: ERROR_CODES.IP_BLOCKED,
    status: 429,
    retryAfter,
    requestId,
    contactUrl: '/support?reason=ip-blocked',
    details: {
      ip: ip.replace(/\d+$/, 'xxx'), // Mask last octet for privacy
      reason,
      blockedUntil: new Date(blockedUntil).toISOString()
    }
  });
}

/**
 * Build system error response
 */
export function buildSystemError({
  error,
  code,
  requestId
}: {
  error: string;
  code: keyof typeof ERROR_CODES;
  requestId?: string;
}): NextResponse {
  return buildErrorResponse({
    error,
    code: ERROR_CODES[code],
    status: 500,
    requestId,
    details: {
      temporary: true,
      suggestion: 'Please try again later or contact support if the issue persists'
    }
  });
}

/**
 * Build feature not available error response
 */
export function buildFeatureNotAvailableError({
  feature,
  currentTier,
  requestId
}: {
  feature: string;
  currentTier: UserTier;
  requestId?: string;
}): NextResponse {
  const requiredTier = getMinimumTierForFeature(feature);
  const upgradeUrl = requiredTier ? `/upgrade?tier=${requiredTier}&feature=${feature}` : undefined;

  return buildErrorResponse({
    error: `${feature} is not available in your current plan`,
    code: ERROR_CODES.FEATURE_NOT_AVAILABLE,
    status: 403,
    upgradeUrl,
    requestId,
    details: {
      feature,
      currentTier,
      requiredTier,
      availableIn: requiredTier ? [requiredTier] : ['professional', 'enterprise']
    }
  });
}

/**
 * Helper functions
 */

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getNextTier(currentTier: UserTier): UserTier | null {
  switch (currentTier) {
    case 'basic':
      return 'professional';
    case 'professional':
      return 'enterprise';
    case 'enterprise':
      return null;
    default:
      return 'professional';
  }
}

function getUpgradeBenefits(fromTier: UserTier, toTier: UserTier, limitType: string): string[] {
  const benefitMap: Record<string, string[]> = {
    reports: [
      'Higher monthly report limits',
      'Advanced report templates',
      'Priority processing'
    ],
    evaluations: [
      'More evaluations per month',
      'Advanced evaluation features',
      'Custom metrics'
    ],
    storage: [
      'Increased storage capacity',
      'Better file management',
      'Backup and recovery'
    ],
    api: [
      'Higher API call limits',
      'Webhooks support',
      'Priority API access'
    ]
  };

  return benefitMap[limitType] || ['Enhanced capabilities', 'Higher limits', 'Priority support'];
}

function getMinimumTierForFeature(feature: string): UserTier | null {
  const featureTierMap: Record<string, UserTier> = {
    ai_analysis: 'professional',
    scenario_modeling: 'enterprise',
    admin: 'enterprise',
    compliance: 'enterprise',
    integrations: 'professional',
    advanced_reports: 'professional'
  };

  return featureTierMap[feature] || null;
}

/**
 * Export all error builders
 */
export default {
  buildErrorResponse,
  buildTierUpgradeError,
  buildRateLimitError,
  buildUsageLimitError,
  buildAuthError,
  buildIPBlockedError,
  buildSystemError,
  buildFeatureNotAvailableError,
  ERROR_CODES
};