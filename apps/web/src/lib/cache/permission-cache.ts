/**
 * Permission Cache System
 * Story 11.10: Performance optimizations with caching for permission checks
 */

import { UserTier, TierPermissions } from '@/lib/access-control/permission-matrix';
import { AccessResult, UsageContext } from '@/lib/access-control/tier-access-control';
import { UserSubscriptionDetails } from '@/lib/subscription/user-subscription';

export interface CacheKey {
  userId: string;
  feature: keyof TierPermissions['features'];
  action: string;
  tier: UserTier;
  resourceContext?: string;
}

export interface CachedPermission {
  key: string;
  result: AccessResult;
  timestamp: number;
  ttl: number;
  metadata: {
    tier: UserTier;
    feature: string;
    action: string;
    userId: string;
  };
}

export interface CacheStats {
  hitCount: number;
  missCount: number;
  evictionCount: number;
  totalEntries: number;
  hitRate: number;
  averageAccessTime: number;
  memoryUsage: number;
}

export interface CacheConfig {
  defaultTTL: number;        // Default TTL in milliseconds
  maxEntries: number;        // Maximum cache entries
  tierSpecificTTL: Record<UserTier, number>; // Different TTL per tier
  cleanupInterval: number;   // Cleanup interval in milliseconds
  enableMetrics: boolean;    // Enable performance metrics
  enableCompression: boolean; // Enable cache value compression
}

/**
 * High-performance permission cache with LRU eviction
 */
export class PermissionCache {
  private cache = new Map<string, CachedPermission>();
  private accessTimes = new Map<string, number>();
  private stats: CacheStats = {
    hitCount: 0,
    missCount: 0,
    evictionCount: 0,
    totalEntries: 0,
    hitRate: 0,
    averageAccessTime: 0,
    memoryUsage: 0
  };

  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxEntries: 10000,
      tierSpecificTTL: {
        basic: 10 * 60 * 1000,     // 10 minutes for basic (longer cache)
        professional: 5 * 60 * 1000, // 5 minutes for professional
        enterprise: 2 * 60 * 1000    // 2 minutes for enterprise (faster changes)
      },
      cleanupInterval: 60 * 1000, // 1 minute
      enableMetrics: true,
      enableCompression: false,
      ...config
    };

    // Start periodic cleanup
    if (this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.config.cleanupInterval);
    }
  }

  /**
   * Generate cache key from permission context
   */
  private generateKey(cacheKey: CacheKey): string {
    const { userId, feature, action, tier, resourceContext } = cacheKey;
    return `${userId}:${tier}:${feature}:${action}:${resourceContext || 'default'}`;
  }

  /**
   * Get TTL for specific tier
   */
  private getTTL(tier: UserTier): number {
    return this.config.tierSpecificTTL[tier] || this.config.defaultTTL;
  }

  /**
   * Get cached permission result
   */
  get(cacheKey: CacheKey): AccessResult | null {
    const startTime = performance.now();
    const key = this.generateKey(cacheKey);
    const cached = this.cache.get(key);

    if (!cached) {
      this.recordMiss();
      return null;
    }

    const now = Date.now();

    // Check if expired
    if (now > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      this.recordMiss();
      return null;
    }

    // Update access time for LRU
    this.accessTimes.set(key, now);

    // Record hit
    this.recordHit(performance.now() - startTime);

    return cached.result;
  }

  /**
   * Set permission result in cache
   */
  set(cacheKey: CacheKey, result: AccessResult): void {
    const key = this.generateKey(cacheKey);
    const now = Date.now();
    const ttl = this.getTTL(cacheKey.tier);

    const cachedPermission: CachedPermission = {
      key,
      result: this.cloneResult(result),
      timestamp: now,
      ttl,
      metadata: {
        tier: cacheKey.tier,
        feature: cacheKey.feature,
        action: cacheKey.action,
        userId: cacheKey.userId
      }
    };

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    this.cache.set(key, cachedPermission);
    this.accessTimes.set(key, now);
    this.updateStats();
  }

  /**
   * Check if result should be cached
   */
  shouldCache(result: AccessResult, context?: UsageContext): boolean {
    // Don't cache error states
    if (!result.allowed && result.reason?.includes('error')) {
      return false;
    }

    // Don't cache time-sensitive conditions
    if (result.conditions?.some(c => c.type === 'time_restriction')) {
      return false;
    }

    // Don't cache usage-dependent results if close to limits
    if (result.conditions?.some(c => c.type === 'usage_limit')) {
      return false;
    }

    return true;
  }

  /**
   * Get permission with automatic caching
   */
  async getOrCompute(
    cacheKey: CacheKey,
    computeFn: () => Promise<AccessResult>,
    context?: UsageContext
  ): Promise<AccessResult> {
    // Try cache first
    const cached = this.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Compute result
    const result = await computeFn();

    // Cache if appropriate
    if (this.shouldCache(result, context)) {
      this.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Invalidate cache entries for a user
   */
  invalidateUser(userId: string): number {
    let invalidated = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (cached.metadata.userId === userId) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
        invalidated++;
      }
    }

    this.updateStats();
    return invalidated;
  }

  /**
   * Invalidate cache entries for a specific feature
   */
  invalidateFeature(feature: keyof TierPermissions['features']): number {
    let invalidated = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (cached.metadata.feature === feature) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
        invalidated++;
      }
    }

    this.updateStats();
    return invalidated;
  }

  /**
   * Invalidate cache entries for a tier
   */
  invalidateTier(tier: UserTier): number {
    let invalidated = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (cached.metadata.tier === tier) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
        invalidated++;
      }
    }

    this.updateStats();
    return invalidated;
  }

  /**
   * Preload permissions for a user
   */
  async preloadUser(
    userId: string,
    subscription: UserSubscriptionDetails,
    computeFn: (cacheKey: CacheKey) => Promise<AccessResult>
  ): Promise<void> {
    const commonFeatures: Array<keyof TierPermissions['features']> = [
      'questionnaire',
      'dashboard',
      'reports',
      'evaluations',
      'roi_calculator'
    ];

    const commonActions = ['read', 'create', 'edit', 'delete'];

    const preloadTasks = commonFeatures.flatMap(feature =>
      commonActions.map(async action => {
        const cacheKey: CacheKey = {
          userId,
          feature,
          action,
          tier: subscription.tier
        };

        // Skip if already cached
        if (this.get(cacheKey) !== null) {
          return;
        }

        try {
          const result = await computeFn(cacheKey);
          if (this.shouldCache(result)) {
            this.set(cacheKey, result);
          }
        } catch (error) {
          console.warn(`Failed to preload permission for ${feature}.${action}:`, error);
        }
      })
    );

    await Promise.allSettled(preloadTasks);
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.timestamp + cached.ttl) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.updateStats();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
      this.stats.evictionCount++;
    }
  }

  /**
   * Clone result to prevent cache pollution
   */
  private cloneResult(result: AccessResult): AccessResult {
    return JSON.parse(JSON.stringify(result));
  }

  /**
   * Record cache hit
   */
  private recordHit(accessTime: number): void {
    if (!this.config.enableMetrics) return;

    this.stats.hitCount++;
    this.updateHitRate();
    this.updateAverageAccessTime(accessTime);
  }

  /**
   * Record cache miss
   */
  private recordMiss(): void {
    if (!this.config.enableMetrics) return;

    this.stats.missCount++;
    this.updateHitRate();
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = total > 0 ? (this.stats.hitCount / total) * 100 : 0;
  }

  /**
   * Update average access time
   */
  private updateAverageAccessTime(newTime: number): void {
    const totalAccess = this.stats.hitCount;
    if (totalAccess <= 1) {
      this.stats.averageAccessTime = newTime;
    } else {
      this.stats.averageAccessTime =
        (this.stats.averageAccessTime * (totalAccess - 1) + newTime) / totalAccess;
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    if (!this.config.enableMetrics) return;

    this.stats.totalEntries = this.cache.size;

    // Estimate memory usage (rough calculation)
    this.stats.memoryUsage = this.cache.size * 500; // ~500 bytes per entry estimate
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessTimes.clear();
    this.stats = {
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
      totalEntries: 0,
      hitRate: 0,
      averageAccessTime: 0,
      memoryUsage: 0
    };
  }

  /**
   * Get cache entries for debugging
   */
  getEntries(): Array<{ key: string; metadata: CachedPermission['metadata']; age: number }> {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([key, cached]) => ({
      key,
      metadata: cached.metadata,
      age: now - cached.timestamp
    }));
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }
}

/**
 * Subscription cache for user subscription details
 */
export class SubscriptionCache {
  private cache = new Map<string, { data: UserSubscriptionDetails; expiry: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(userId: string): UserSubscriptionDetails | null {
    const cached = this.cache.get(userId);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(userId);
      return null;
    }

    return cached.data;
  }

  set(userId: string, subscription: UserSubscriptionDetails): void {
    this.cache.set(userId, {
      data: subscription,
      expiry: Date.now() + this.TTL
    });
  }

  invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [userId, cached] of this.cache.entries()) {
      if (now > cached.expiry) {
        this.cache.delete(userId);
      }
    }
  }
}

// Global cache instances
export const permissionCache = new PermissionCache({
  defaultTTL: 5 * 60 * 1000,
  maxEntries: 5000,
  enableMetrics: true
});

export const subscriptionCache = new SubscriptionCache();

// Auto-cleanup interval
setInterval(() => {
  permissionCache.cleanup();
  subscriptionCache.cleanup();
}, 60 * 1000); // Every minute

export default {
  PermissionCache,
  SubscriptionCache,
  permissionCache,
  subscriptionCache
};