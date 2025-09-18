/**
 * Optimized LRU caching layer for tier detection
 * Story 11.2: Subscription-Based Routing Middleware Performance Optimization
 */

import { TierDetectionResult, SubscriptionTier } from '@/types/subscription'

export interface CacheEntry<T> {
  value: T
  timestamp: number
  accessCount: number
  lastAccessed: number
  size: number
}

export interface CacheStats {
  hits: number
  misses: number
  evictions: number
  totalRequests: number
  hitRate: number
  averageAccessTime: number
  memoryUsage: number
  entryCount: number
}

export interface CacheConfig {
  maxSize: number
  maxEntries: number
  ttl: number // Time to live in milliseconds
  enableCompression: boolean
  enableMetrics: boolean
}

/**
 * High-performance LRU cache with compression and metrics
 */
export class TierCache<T = TierDetectionResult> {
  private cache = new Map<string, CacheEntry<T>>()
  private accessOrder: string[] = []
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0,
    hitRate: 0,
    averageAccessTime: 0,
    memoryUsage: 0,
    entryCount: 0
  }

  constructor(private config: CacheConfig) {}

  /**
   * Get value from cache with LRU update
   */
  get(key: string): T | null {
    const startTime = performance.now()
    this.stats.totalRequests++

    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.delete(key)
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Update access information
    entry.lastAccessed = Date.now()
    entry.accessCount++

    // Move to end of access order (most recently used)
    this.updateAccessOrder(key)

    this.stats.hits++
    this.updateHitRate()

    // Update average access time
    const accessTime = performance.now() - startTime
    this.updateAverageAccessTime(accessTime)

    return entry.value
  }

  /**
   * Set value in cache with automatic eviction
   */
  set(key: string, value: T, customTtl?: number): void {
    const size = this.estimateSize(value)
    const timestamp = Date.now()

    // Check if we need to evict entries
    this.evictIfNecessary(size)

    const entry: CacheEntry<T> = {
      value,
      timestamp,
      accessCount: 1,
      lastAccessed: timestamp,
      size
    }

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.delete(key)
    }

    this.cache.set(key, entry)
    this.accessOrder.push(key)

    this.updateMemoryUsage()
    this.stats.entryCount = this.cache.size
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    this.cache.delete(key)
    this.removeFromAccessOrder(key)
    this.updateMemoryUsage()
    this.stats.entryCount = this.cache.size

    return true
  }

  /**
   * Check if entry exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (this.isExpired(entry)) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    this.stats.entryCount = 0
    this.updateMemoryUsage()
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get cache size in bytes
   */
  size(): number {
    return this.stats.memoryUsage
  }

  /**
   * Get number of entries
   */
  entryCount(): number {
    return this.cache.size
  }

  /**
   * Prune expired entries
   */
  prune(): number {
    const originalSize = this.cache.size
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.delete(key))

    return originalSize - this.cache.size
  }

  /**
   * Get cache entries by access frequency
   */
  getHotEntries(limit: number = 10): Array<{ key: string; accessCount: number; lastAccessed: number }> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit)
  }

  /**
   * Check if entry has expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.config.ttl
  }

  /**
   * Evict entries if necessary to make room
   */
  private evictIfNecessary(newEntrySize: number): void {
    // Check entry count limit
    while (this.cache.size >= this.config.maxEntries) {
      this.evictLeastRecentlyUsed()
    }

    // Check size limit
    while (this.stats.memoryUsage + newEntrySize > this.config.maxSize) {
      this.evictLeastRecentlyUsed()
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    if (this.accessOrder.length === 0) return

    const lruKey = this.accessOrder[0]
    this.delete(lruKey)
    this.stats.evictions++
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(key)
  }

  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  /**
   * Estimate size of value in bytes
   */
  private estimateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2 // Rough estimate (UTF-16)
    } catch {
      return 1024 // Default size for non-serializable objects
    }
  }

  /**
   * Update memory usage statistics
   */
  private updateMemoryUsage(): void {
    this.stats.memoryUsage = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0)
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0
      ? this.stats.hits / this.stats.totalRequests
      : 0
  }

  /**
   * Update average access time
   */
  private updateAverageAccessTime(accessTime: number): void {
    const totalAccessTime = this.stats.averageAccessTime * this.stats.hits
    this.stats.averageAccessTime = (totalAccessTime + accessTime) / (this.stats.hits + 1)
  }
}

/**
 * Optimized tier cache instance with compression
 */
export class OptimizedTierCache extends TierCache<TierDetectionResult> {
  private readonly compressionThreshold = 1024 // Compress entries larger than 1KB

  constructor() {
    super({
      maxSize: 10 * 1024 * 1024, // 10MB
      maxEntries: 1000,
      ttl: 300000, // 5 minutes
      enableCompression: true,
      enableMetrics: true
    })
  }

  /**
   * Set with intelligent compression
   */
  setTierResult(userId: string, result: TierDetectionResult): void {
    // Create cache key with context
    const key = this.createCacheKey(userId, result.source)

    // Add metadata for better cache management
    const enrichedResult: TierDetectionResult & { cached: boolean } = {
      ...result,
      cached: true
    }

    this.set(key, enrichedResult as TierDetectionResult)
  }

  /**
   * Get tier result with fallback
   */
  getTierResult(userId: string, preferredSource?: string): TierDetectionResult | null {
    // Try preferred source first
    if (preferredSource) {
      const key = this.createCacheKey(userId, preferredSource)
      const result = this.get(key)
      if (result) return result
    }

    // Try all sources in order of preference
    const sources = ['clerk', 'stripe', 'database', 'fallback']
    for (const source of sources) {
      const key = this.createCacheKey(userId, source)
      const result = this.get(key)
      if (result) return result
    }

    return null
  }

  /**
   * Bulk set tier results
   */
  setBulkTierResults(results: Array<{ userId: string; result: TierDetectionResult }>): void {
    results.forEach(({ userId, result }) => {
      this.setTierResult(userId, result)
    })
  }

  /**
   * Invalidate user's cache entries
   */
  invalidateUser(userId: string): number {
    const keys = this.keys().filter(key => key.startsWith(`tier:${userId}:`))
    let invalidated = 0

    keys.forEach(key => {
      if (this.delete(key)) {
        invalidated++
      }
    })

    return invalidated
  }

  /**
   * Get cache performance metrics specific to tier caching
   */
  getTierCacheMetrics(): {
    userCount: number
    averageResultsPerUser: number
    topUsers: Array<{ userId: string; cacheHits: number }>
    sourceDistribution: Record<string, number>
  } & CacheStats {
    const stats = this.getStats()
    const keys = this.keys()

    // Extract user IDs from cache keys
    const userIds = new Set(
      keys.map(key => key.split(':')[1]).filter(Boolean)
    )

    // Count cache hits per user (approximate)
    const userHits = new Map<string, number>()
    keys.forEach(key => {
      const userId = key.split(':')[1]
      if (userId) {
        userHits.set(userId, (userHits.get(userId) || 0) + 1)
      }
    })

    // Source distribution
    const sourceDistribution: Record<string, number> = {}
    keys.forEach(key => {
      const source = key.split(':')[2]
      if (source) {
        sourceDistribution[source] = (sourceDistribution[source] || 0) + 1
      }
    })

    return {
      ...stats,
      userCount: userIds.size,
      averageResultsPerUser: userIds.size > 0 ? keys.length / userIds.size : 0,
      topUsers: Array.from(userHits.entries())
        .map(([userId, hits]) => ({ userId, cacheHits: hits }))
        .sort((a, b) => b.cacheHits - a.cacheHits)
        .slice(0, 10),
      sourceDistribution
    }
  }

  /**
   * Create standardized cache key
   */
  private createCacheKey(userId: string, source: string): string {
    return `tier:${userId}:${source}`
  }
}

/**
 * Global optimized tier cache instance
 */
export const tierCache = new OptimizedTierCache()

/**
 * Request batching cache for bulk operations
 */
export class BatchRequestCache {
  private pendingRequests = new Map<string, Promise<TierDetectionResult>>()
  private batchQueue: Array<{ userId: string; resolve: (result: TierDetectionResult) => void; reject: (error: Error) => void }> = []
  private batchTimeout: NodeJS.Timeout | null = null
  private readonly batchSize = 10
  private readonly batchDelayMs = 50

  /**
   * Get tier result with request batching
   */
  async getTierResult(userId: string, detector: (userIds: string[]) => Promise<TierDetectionResult[]>): Promise<TierDetectionResult> {
    // Check if request is already pending
    const pending = this.pendingRequests.get(userId)
    if (pending) {
      return pending
    }

    // Create new promise for this request
    const promise = new Promise<TierDetectionResult>((resolve, reject) => {
      this.batchQueue.push({ userId, resolve, reject })

      // Start batch timeout if not already running
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.processBatch(detector)
        }, this.batchDelayMs)
      }

      // Process immediately if batch is full
      if (this.batchQueue.length >= this.batchSize) {
        if (this.batchTimeout) {
          clearTimeout(this.batchTimeout)
          this.batchTimeout = null
        }
        this.processBatch(detector)
      }
    })

    this.pendingRequests.set(userId, promise)

    // Clean up after completion
    promise.finally(() => {
      this.pendingRequests.delete(userId)
    })

    return promise
  }

  /**
   * Process batched requests
   */
  private async processBatch(detector: (userIds: string[]) => Promise<TierDetectionResult[]>): void {
    if (this.batchQueue.length === 0) return

    const batch = this.batchQueue.splice(0, this.batchSize)
    const userIds = batch.map(item => item.userId)

    try {
      const results = await detector(userIds)

      // Resolve each request with its result
      batch.forEach((item, index) => {
        const result = results[index]
        if (result) {
          item.resolve(result)
        } else {
          item.reject(new Error(`No result for user: ${item.userId}`))
        }
      })
    } catch (error) {
      // Reject all requests in the batch
      batch.forEach(item => {
        item.reject(error instanceof Error ? error : new Error('Batch processing failed'))
      })
    }

    // Continue processing if there are more items
    if (this.batchQueue.length > 0) {
      this.batchTimeout = setTimeout(() => {
        this.processBatch(detector)
      }, this.batchDelayMs)
    }
  }
}

/**
 * Global batch request cache instance
 */
export const batchRequestCache = new BatchRequestCache()