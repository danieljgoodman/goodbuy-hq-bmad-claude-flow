/**
 * Rate Limiting Utility for Enhanced Report Generation and Admin Controls
 *
 * Provides configurable rate limiting with tier-based limits
 * and in-memory storage for development/lightweight production use
 */

import { NextRequest } from 'next/server'

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Maximum unique tokens
}

interface TieredRateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: {
    free: number
    professional: number
    enterprise: number
  }
  skipFailedRequests?: boolean
  skipSuccessfulRequests?: boolean
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  tier: string
}

interface RateLimitEntry {
  requests: number
  resetTime: number
  tier: string
}

interface SimpleRateLimitEntry {
  count: number
  resetTime: number
}

// In-memory storage for rate limiting
// In production, consider using Redis or similar persistent store
const rateLimitStore = new Map<string, RateLimitEntry>()
const simpleRateLimitStore = new Map<string, SimpleRateLimitEntry>()

/**
 * Simple rate limiter for admin operations
 */
export function rateLimit(config: RateLimitConfig) {
  return {
    async check(request: NextRequest, limit: number, token: string): Promise<void> {
      const identifier = await getSimpleIdentifier(request, token)
      const now = Date.now()
      const resetTime = now + config.interval

      // Get or create rate limit entry
      let entry = simpleRateLimitStore.get(identifier)

      // Check if window has expired
      if (!entry || now > entry.resetTime) {
        entry = {
          count: 0,
          resetTime
        }
      }

      // Check if limit exceeded
      if (entry.count >= limit) {
        throw new Error('Rate limit exceeded')
      }

      // Increment counter
      entry.count++
      simpleRateLimitStore.set(identifier, entry)

      // Clean up expired entries periodically
      if (Math.random() < 0.01) { // 1% chance
        cleanupSimpleExpiredEntries()
      }
    }
  }
}

/**
 * Create a rate limiter with tier-based limits
 */
export function tieredRateLimit(config: TieredRateLimitConfig) {
  return {
    async check(request: NextRequest): Promise<RateLimitResult> {
      const identifier = await getIdentifier(request)
      const tier = await getUserTier(request)
      const maxRequests = getMaxRequests(config.maxRequests, tier)

      const now = Date.now()
      const resetTime = now + config.windowMs

      // Get or create rate limit entry
      let entry = rateLimitStore.get(identifier)

      // Check if window has expired
      if (!entry || now > entry.resetTime) {
        entry = {
          requests: 0,
          resetTime,
          tier
        }
      }

      // Check if limit exceeded
      if (entry.requests >= maxRequests) {
        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          resetTime: entry.resetTime,
          tier
        }
      }

      // Increment counter
      entry.requests++
      entry.tier = tier // Update tier in case it changed
      rateLimitStore.set(identifier, entry)

      // Clean up expired entries periodically
      if (Math.random() < 0.01) { // 1% chance
        cleanupExpiredEntries()
      }

      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - entry.requests,
        resetTime: entry.resetTime,
        tier
      }
    }
  }
}

/**
 * Get simple identifier for admin rate limiting
 */
async function getSimpleIdentifier(request: NextRequest, token: string): Promise<string> {
  // Get IP address for identifier
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip')

  let ip = 'unknown'
  if (forwarded) {
    ip = forwarded.split(',')[0].trim()
  } else if (realIP) {
    ip = realIP
  } else if (cfIP) {
    ip = cfIP
  } else if (request.ip) {
    ip = request.ip
  }

  return `${token}:${ip}`
}

/**
 * Get unique identifier for rate limiting
 * Uses IP address or user ID if available
 */
async function getIdentifier(request: NextRequest): Promise<string> {
  try {
    // Try to get user ID from request body
    const body = await request.clone().json().catch(() => ({}))
    if (body.userId) {
      return `user:${body.userId}`
    }
  } catch {
    // Ignore JSON parsing errors
  }

  // Try to get user ID from query params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (userId) {
    return `user:${userId}`
  }

  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
  return `ip:${ip}`
}

/**
 * Get user tier from request
 */
async function getUserTier(request: NextRequest): Promise<string> {
  // Try to get tier from headers (set by middleware)
  const tierFromHeader = request.headers.get('x-user-tier')
  if (tierFromHeader) {
    return tierFromHeader.toLowerCase()
  }

  try {
    // Try to get tier from request body
    const body = await request.clone().json().catch(() => ({}))
    if (body.tier) {
      return body.tier.toLowerCase()
    }
  } catch {
    // Ignore JSON parsing errors
  }

  // Default to free tier for unknown users
  return 'free'
}

/**
 * Get max requests based on tier
 */
function getMaxRequests(limits: RateLimitConfig['maxRequests'], tier: string): number {
  const normalizedTier = tier.toLowerCase()

  switch (normalizedTier) {
    case 'enterprise':
      return limits.enterprise
    case 'professional':
    case 'premium':
      return limits.professional
    case 'free':
    default:
      return limits.free
  }
}

/**
 * Clean up expired entries from simple rate limit store
 */
function cleanupSimpleExpiredEntries(): void {
  const now = Date.now()

  for (const [key, entry] of simpleRateLimitStore.entries()) {
    if (now > entry.resetTime) {
      simpleRateLimitStore.delete(key)
    }
  }
}

/**
 * Clean up expired entries from memory store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Get current rate limit status for a request
 */
export async function getRateLimitStatus(
  request: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const identifier = await getIdentifier(request)
  const tier = await getUserTier(request)
  const maxRequests = getMaxRequests(config.maxRequests, tier)

  const entry = rateLimitStore.get(identifier)

  if (!entry || Date.now() > entry.resetTime) {
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests,
      resetTime: Date.now() + config.windowMs,
      tier
    }
  }

  return {
    success: entry.requests < maxRequests,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - entry.requests),
    resetTime: entry.resetTime,
    tier
  }
}

/**
 * Reset rate limit for a specific identifier (admin function)
 */
export async function resetRateLimit(request: NextRequest): Promise<void> {
  const identifier = await getIdentifier(request)
  rateLimitStore.delete(identifier)
}

/**
 * Get rate limit statistics (admin function)
 */
export function getRateLimitStats(): {
  totalEntries: number
  entriesByTier: Record<string, number>
  oldestEntry: number | null
  newestEntry: number | null
} {
  const entries = Array.from(rateLimitStore.values())
  const entriesByTier: Record<string, number> = {}

  let oldestEntry: number | null = null
  let newestEntry: number | null = null

  for (const entry of entries) {
    const tier = entry.tier || 'unknown'
    entriesByTier[tier] = (entriesByTier[tier] || 0) + 1

    if (oldestEntry === null || entry.resetTime < oldestEntry) {
      oldestEntry = entry.resetTime
    }
    if (newestEntry === null || entry.resetTime > newestEntry) {
      newestEntry = entry.resetTime
    }
  }

  return {
    totalEntries: entries.length,
    entriesByTier,
    oldestEntry,
    newestEntry
  }
}

export type { RateLimitConfig, TieredRateLimitConfig, RateLimitResult }