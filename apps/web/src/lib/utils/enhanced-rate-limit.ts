/**
 * Enhanced Rate Limiting for Access Control
 * Story 11.10: Advanced rate limiting with tier-based limits and security features
 */

import { NextRequest } from 'next/server';
import { UserTier } from '@/lib/access-control/permission-matrix';

export interface EnhancedRateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: {
    basic: number;
    professional: number;
    enterprise: number;
  };
  deniedRequestPenalty?: {
    basic: number;     // Penalty multiplier for denied requests
    professional: number;
    enterprise: number;
  };
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  enableSlidingWindow?: boolean;
  enableBurstProtection?: boolean;
  burstThreshold?: number; // Rapid requests within short time
  burstWindowMs?: number;  // Time window for burst detection
  enableAdaptiveLimit?: boolean; // Adjust limits based on behavior
  whitelistIPs?: string[];
  blacklistIPs?: string[];
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  tier: UserTier;
  penaltyApplied?: boolean;
  burstDetected?: boolean;
  adaptiveLimit?: number;
  blacklisted?: boolean;
  whitelisted?: boolean;
}

export interface RateLimitEntry {
  requests: number;
  deniedRequests: number;
  resetTime: number;
  tier: UserTier;
  burstCount: number;
  lastBurstTime: number;
  adaptiveMultiplier: number;
  suspicious: boolean;
  recentTimestamps: number[]; // For sliding window
}

export interface RateLimitStats {
  totalRequests: number;
  totalBlocked: number;
  totalBurstBlocked: number;
  byTier: Record<UserTier, {
    requests: number;
    blocked: number;
    adaptiveAdjustments: number;
  }>;
  topBlockedIPs: Array<{ ip: string; count: number }>;
  topBlockedUsers: Array<{ userId: string; count: number }>;
}

// Enhanced in-memory storage with additional tracking
const rateLimitStore = new Map<string, RateLimitEntry>();
const ipBlockStore = new Map<string, { blockedUntil: number; reason: string }>();
const globalStats: RateLimitStats = {
  totalRequests: 0,
  totalBlocked: 0,
  totalBurstBlocked: 0,
  byTier: {
    basic: { requests: 0, blocked: 0, adaptiveAdjustments: 0 },
    professional: { requests: 0, blocked: 0, adaptiveAdjustments: 0 },
    enterprise: { requests: 0, blocked: 0, adaptiveAdjustments: 0 }
  },
  topBlockedIPs: [],
  topBlockedUsers: []
};

/**
 * Create enhanced rate limiter with advanced security features
 */
export function createEnhancedRateLimit(config: EnhancedRateLimitConfig) {
  const defaultDeniedPenalty = { basic: 2, professional: 1.5, enterprise: 1.2 };
  const deniedPenalty = config.deniedRequestPenalty || defaultDeniedPenalty;

  return {
    async check(
      request: NextRequest,
      options?: {
        userId?: string;
        tier?: UserTier;
        requestType?: 'allowed' | 'denied';
        feature?: string;
      }
    ): Promise<RateLimitResult> {
      const identifier = await getIdentifier(request, options?.userId);
      const tier = options?.tier || await getUserTier(request);
      const clientIP = getClientIP(request);

      globalStats.totalRequests++;
      globalStats.byTier[tier].requests++;

      // Check IP whitelist/blacklist
      if (config.whitelistIPs?.includes(clientIP)) {
        return {
          success: true,
          limit: -1,
          remaining: -1,
          resetTime: 0,
          tier,
          whitelisted: true
        };
      }

      // Check temporary IP blocks
      const ipBlock = ipBlockStore.get(clientIP);
      if (ipBlock && Date.now() < ipBlock.blockedUntil) {
        return {
          success: false,
          limit: 0,
          remaining: 0,
          resetTime: ipBlock.blockedUntil,
          tier,
          blacklisted: true
        };
      }

      if (config.blacklistIPs?.includes(clientIP)) {
        return {
          success: false,
          limit: 0,
          remaining: 0,
          resetTime: Date.now() + config.windowMs,
          tier,
          blacklisted: true
        };
      }

      const now = Date.now();
      const resetTime = now + config.windowMs;

      // Get or create rate limit entry
      let entry = rateLimitStore.get(identifier);

      // Check if window has expired
      if (!entry || now > entry.resetTime) {
        entry = {
          requests: 0,
          deniedRequests: 0,
          resetTime,
          tier,
          burstCount: 0,
          lastBurstTime: 0,
          adaptiveMultiplier: 1.0,
          suspicious: false,
          recentTimestamps: []
        };
      }

      // Update tier if changed
      entry.tier = tier;

      // Get base limit for tier
      let maxRequests = getMaxRequests(config.maxRequests, tier);

      // Apply adaptive limiting based on behavior
      if (config.enableAdaptiveLimit && entry.suspicious) {
        entry.adaptiveMultiplier = Math.max(0.1, entry.adaptiveMultiplier * 0.8);
        globalStats.byTier[tier].adaptiveAdjustments++;
      } else if (config.enableAdaptiveLimit && !entry.suspicious) {
        entry.adaptiveMultiplier = Math.min(1.0, entry.adaptiveMultiplier * 1.1);
      }

      if (config.enableAdaptiveLimit) {
        maxRequests = Math.floor(maxRequests * entry.adaptiveMultiplier);
      }

      // Apply penalty for denied requests
      if (options?.requestType === 'denied') {
        entry.deniedRequests++;
        const penalty = deniedPenalty[tier];
        const adjustedCount = entry.requests + (penalty - 1);
        entry.requests = adjustedCount;
      } else {
        entry.requests++;
      }

      // Burst detection
      let burstDetected = false;
      if (config.enableBurstProtection) {
        entry.recentTimestamps.push(now);
        // Keep only recent timestamps
        const burstWindow = config.burstWindowMs || 5000; // 5 seconds default
        entry.recentTimestamps = entry.recentTimestamps.filter(
          timestamp => now - timestamp < burstWindow
        );

        const burstThreshold = config.burstThreshold || 10;
        if (entry.recentTimestamps.length > burstThreshold) {
          burstDetected = true;
          entry.burstCount++;
          entry.lastBurstTime = now;
          entry.suspicious = true;
          globalStats.totalBurstBlocked++;

          // Temporarily block IP for repeated burst behavior
          if (entry.burstCount >= 3) {
            ipBlockStore.set(clientIP, {
              blockedUntil: now + (15 * 60 * 1000), // 15 minutes
              reason: 'Repeated burst behavior detected'
            });
          }
        }
      }

      // Sliding window rate limiting
      if (config.enableSlidingWindow) {
        const windowStart = now - config.windowMs;
        const recentRequests = entry.recentTimestamps.filter(
          timestamp => timestamp > windowStart
        ).length;

        if (recentRequests >= maxRequests) {
          globalStats.totalBlocked++;
          globalStats.byTier[tier].blocked++;
          updateBlockedStats(identifier, clientIP);

          return {
            success: false,
            limit: maxRequests,
            remaining: 0,
            resetTime: entry.resetTime,
            tier,
            penaltyApplied: options?.requestType === 'denied',
            burstDetected,
            adaptiveLimit: config.enableAdaptiveLimit ? Math.floor(maxRequests / entry.adaptiveMultiplier) : undefined
          };
        }
      } else {
        // Standard fixed window
        if (entry.requests >= maxRequests || burstDetected) {
          globalStats.totalBlocked++;
          globalStats.byTier[tier].blocked++;
          updateBlockedStats(identifier, clientIP);

          return {
            success: false,
            limit: maxRequests,
            remaining: 0,
            resetTime: entry.resetTime,
            tier,
            penaltyApplied: options?.requestType === 'denied',
            burstDetected,
            adaptiveLimit: config.enableAdaptiveLimit ? Math.floor(maxRequests / entry.adaptiveMultiplier) : undefined
          };
        }
      }

      // Store updated entry
      rateLimitStore.set(identifier, entry);

      // Periodic cleanup
      if (Math.random() < 0.01) { // 1% chance
        cleanupExpiredEntries();
        cleanupExpiredBlocks();
      }

      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - entry.requests,
        resetTime: entry.resetTime,
        tier,
        penaltyApplied: options?.requestType === 'denied',
        burstDetected: false,
        adaptiveLimit: config.enableAdaptiveLimit ? Math.floor(maxRequests / entry.adaptiveMultiplier) : undefined
      };
    },

    /**
     * Reset rate limit for specific identifier
     */
    async reset(identifier: string): Promise<void> {
      rateLimitStore.delete(identifier);
    },

    /**
     * Block IP temporarily
     */
    async blockIP(ip: string, durationMs: number, reason: string): Promise<void> {
      ipBlockStore.set(ip, {
        blockedUntil: Date.now() + durationMs,
        reason
      });
    },

    /**
     * Unblock IP
     */
    async unblockIP(ip: string): Promise<void> {
      ipBlockStore.delete(ip);
    },

    /**
     * Get current rate limit status
     */
    async getStatus(identifier: string): Promise<RateLimitEntry | null> {
      return rateLimitStore.get(identifier) || null;
    },

    /**
     * Get global statistics
     */
    getStats(): RateLimitStats {
      return { ...globalStats };
    },

    /**
     * Clear all rate limit data
     */
    clear(): void {
      rateLimitStore.clear();
      ipBlockStore.clear();
    }
  };
}

/**
 * Get unique identifier for rate limiting
 */
async function getIdentifier(request: NextRequest, userId?: string): Promise<string> {
  if (userId) {
    return `user:${userId}`;
  }

  try {
    // Try to get user ID from request body
    const body = await request.clone().json().catch(() => ({}));
    if (body.userId) {
      return `user:${body.userId}`;
    }
  } catch {
    // Ignore JSON parsing errors
  }

  // Try to get user ID from query params
  const { searchParams } = new URL(request.url);
  const userIdFromQuery = searchParams.get('userId');
  if (userIdFromQuery) {
    return `user:${userIdFromQuery}`;
  }

  // Fallback to IP address
  const ip = getClientIP(request);
  return `ip:${ip}`;
}

/**
 * Get user tier from request
 */
async function getUserTier(request: NextRequest): Promise<UserTier> {
  // Try to get tier from headers (set by middleware)
  const tierFromHeader = request.headers.get('x-user-tier');
  if (tierFromHeader && ['basic', 'professional', 'enterprise'].includes(tierFromHeader)) {
    return tierFromHeader as UserTier;
  }

  try {
    // Try to get tier from request body
    const body = await request.clone().json().catch(() => ({}));
    if (body.tier && ['basic', 'professional', 'enterprise'].includes(body.tier)) {
      return body.tier as UserTier;
    }
  } catch {
    // Ignore JSON parsing errors
  }

  // Default to basic tier for unknown users
  return 'basic';
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const connectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  const ip = forwarded?.split(',')[0]?.trim() || realIP || connectingIP || 'unknown';
  return ip;
}

/**
 * Get max requests based on tier
 */
function getMaxRequests(limits: EnhancedRateLimitConfig['maxRequests'], tier: UserTier): number {
  return limits[tier];
}

/**
 * Update blocked statistics
 */
function updateBlockedStats(identifier: string, ip: string): void {
  // Update top blocked IPs
  const ipEntry = globalStats.topBlockedIPs.find(entry => entry.ip === ip);
  if (ipEntry) {
    ipEntry.count++;
  } else {
    globalStats.topBlockedIPs.push({ ip, count: 1 });
  }

  // Keep only top 10 IPs
  globalStats.topBlockedIPs.sort((a, b) => b.count - a.count);
  globalStats.topBlockedIPs = globalStats.topBlockedIPs.slice(0, 10);

  // Update top blocked users (if identifier is a user)
  if (identifier.startsWith('user:')) {
    const userId = identifier.substring(5);
    const userEntry = globalStats.topBlockedUsers.find(entry => entry.userId === userId);
    if (userEntry) {
      userEntry.count++;
    } else {
      globalStats.topBlockedUsers.push({ userId, count: 1 });
    }

    // Keep only top 10 users
    globalStats.topBlockedUsers.sort((a, b) => b.count - a.count);
    globalStats.topBlockedUsers = globalStats.topBlockedUsers.slice(0, 10);
  }
}

/**
 * Clean up expired entries from memory store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Clean up expired IP blocks
 */
function cleanupExpiredBlocks(): void {
  const now = Date.now();

  for (const [ip, block] of ipBlockStore.entries()) {
    if (now > block.blockedUntil) {
      ipBlockStore.delete(ip);
    }
  }
}

/**
 * Default configuration for denied requests rate limiting
 */
export const DENIED_REQUESTS_RATE_LIMIT_CONFIG: EnhancedRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: {
    basic: 5,      // 5 denied requests per 15 minutes
    professional: 10,  // 10 denied requests per 15 minutes
    enterprise: 20     // 20 denied requests per 15 minutes
  },
  deniedRequestPenalty: {
    basic: 3.0,        // Heavy penalty for basic users
    professional: 2.0, // Medium penalty for professional users
    enterprise: 1.5    // Light penalty for enterprise users
  },
  enableBurstProtection: true,
  burstThreshold: 8,
  burstWindowMs: 5000,
  enableAdaptiveLimit: true,
  enableSlidingWindow: true
};

/**
 * Export default enhanced rate limiter for denied requests
 */
export const deniedRequestsRateLimit = createEnhancedRateLimit(DENIED_REQUESTS_RATE_LIMIT_CONFIG);

export type { EnhancedRateLimitConfig, RateLimitResult, RateLimitEntry, RateLimitStats };