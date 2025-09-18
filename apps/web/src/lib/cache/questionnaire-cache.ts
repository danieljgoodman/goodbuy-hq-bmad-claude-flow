/**
 * Questionnaire Caching Layer
 *
 * High-performance caching system for Professional tier questionnaire
 * Implements multi-level caching, state persistence, and efficient invalidation
 * Optimized for 45-field complex forms with real-time updates
 */

import { ProfessionalTierData } from '@/types/evaluation'

// Cache configuration
const CACHE_CONFIG = {
  maxSize: 100, // Maximum number of cached entries
  ttl: 30 * 60 * 1000, // 30 minutes TTL
  persistenceKey: 'questionnaire_cache_v1',
  compressionThreshold: 1024, // Compress data larger than 1KB
  autoSaveInterval: 5000, // Auto-save every 5 seconds
}

// Cache entry interface
interface CacheEntry<T> {
  data: T
  timestamp: number
  accessCount: number
  lastAccessed: number
  version: number
  compressed: boolean
  checksum: string
}

// Cache statistics
interface CacheStats {
  hits: number
  misses: number
  size: number
  memoryUsage: number
  hitRate: number
  evictions: number
}

// Data compression utilities
class CompressionUtils {
  static compress(data: any): string {
    try {
      const json = JSON.stringify(data)
      if (json.length < CACHE_CONFIG.compressionThreshold) {
        return json
      }

      // Simple LZ-like compression for large data
      return this.simpleLZCompress(json)
    } catch (error) {
      console.error('Compression failed:', error)
      return JSON.stringify(data)
    }
  }

  static decompress(data: string, compressed: boolean): any {
    try {
      if (!compressed) {
        return JSON.parse(data)
      }

      const decompressed = this.simpleLZDecompress(data)
      return JSON.parse(decompressed)
    } catch (error) {
      console.error('Decompression failed:', error)
      return null
    }
  }

  private static simpleLZCompress(input: string): string {
    const dict: Record<string, number> = {}
    const result: number[] = []
    let dictSize = 256
    let current = ''

    for (let i = 0; i < input.length; i++) {
      const char = input[i]
      const combined = current + char

      if (dict[combined] !== undefined) {
        current = combined
      } else {
        result.push(dict[current] !== undefined ? dict[current] : current.charCodeAt(0))
        dict[combined] = dictSize++
        current = char
      }
    }

    if (current) {
      result.push(dict[current] !== undefined ? dict[current] : current.charCodeAt(0))
    }

    return result.join(',')
  }

  private static simpleLZDecompress(input: string): string {
    const codes = input.split(',').map(Number)
    const dict: Record<number, string> = {}
    let dictSize = 256

    // Initialize dictionary with ASCII characters
    for (let i = 0; i < 256; i++) {
      dict[i] = String.fromCharCode(i)
    }

    let result = dict[codes[0]]
    let current = result

    for (let i = 1; i < codes.length; i++) {
      const code = codes[i]
      let entry = dict[code]

      if (entry === undefined) {
        entry = current + current[0]
      }

      result += entry
      dict[dictSize++] = current + entry[0]
      current = entry
    }

    return result
  }
}

// Checksum utilities for data integrity
class ChecksumUtils {
  static generate(data: any): string {
    const str = JSON.stringify(data)
    let hash = 0

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return hash.toString(36)
  }

  static verify(data: any, expectedChecksum: string): boolean {
    return this.generate(data) === expectedChecksum
  }
}

// Main cache class
export class QuestionnaireCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    memoryUsage: 0,
    hitRate: 0,
    evictions: 0
  }
  private autoSaveTimer: NodeJS.Timeout | null = null

  constructor() {
    this.loadFromPersistence()
    this.startAutoSave()

    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.saveToPersistence())
    }
  }

  // Get data from cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Check TTL expiration
    if (Date.now() - entry.timestamp > CACHE_CONFIG.ttl) {
      this.delete(key)
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = Date.now()

    this.stats.hits++
    this.updateHitRate()

    // Decompress and verify integrity
    const data = CompressionUtils.decompress(entry.data, entry.compressed)

    if (!ChecksumUtils.verify(data, entry.checksum)) {
      console.warn(`Cache integrity check failed for key: ${key}`)
      this.delete(key)
      return null
    }

    return data
  }

  // Set data in cache
  set<T>(key: string, data: T, version: number = 1): void {
    // Ensure cache size limit
    if (this.cache.size >= CACHE_CONFIG.maxSize) {
      this.evictLeastUsed()
    }

    const checksum = ChecksumUtils.generate(data)
    const compressed = JSON.stringify(data).length >= CACHE_CONFIG.compressionThreshold
    const compressedData = CompressionUtils.compress(data)

    const entry: CacheEntry<string> = {
      data: compressedData,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      version,
      compressed,
      checksum
    }

    this.cache.set(key, entry)
    this.updateStats()
  }

  // Update existing cache entry
  update<T>(key: string, data: T, version?: number): boolean {
    const existingEntry = this.cache.get(key)

    if (!existingEntry) {
      return false
    }

    const newVersion = version || existingEntry.version + 1
    this.set(key, data, newVersion)
    return true
  }

  // Delete from cache
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    this.updateStats()
    return deleted
  }

  // Clear entire cache
  clear(): void {
    this.cache.clear()
    this.updateStats()
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats }
  }

  // Get all cached keys
  getKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  // Check if key exists
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // Check TTL
    if (Date.now() - entry.timestamp > CACHE_CONFIG.ttl) {
      this.delete(key)
      return false
    }

    return true
  }

  // Get cache size in bytes (estimated)
  getMemoryUsage(): number {
    let totalSize = 0

    this.cache.forEach((entry, key) => {
      totalSize += key.length * 2 // UTF-16 encoding
      totalSize += entry.data.length * 2
      totalSize += 64 // Estimated overhead for entry metadata
    })

    return totalSize
  }

  // Evict least recently used entries
  private evictLeastUsed(): void {
    let oldestEntry: { key: string; lastAccessed: number } | null = null

    this.cache.forEach((entry, key) => {
      if (!oldestEntry || entry.lastAccessed < oldestEntry.lastAccessed) {
        oldestEntry = { key, lastAccessed: entry.lastAccessed }
      }
    })

    if (oldestEntry) {
      this.cache.delete(oldestEntry.key)
      this.stats.evictions++
    }
  }

  // Update cache statistics
  private updateStats(): void {
    this.stats.size = this.cache.size
    this.stats.memoryUsage = this.getMemoryUsage()
  }

  // Update hit rate
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
  }

  // Load cache from persistence
  private loadFromPersistence(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return

      const stored = localStorage.getItem(CACHE_CONFIG.persistenceKey)
      if (!stored) return

      const parsedData = JSON.parse(stored)

      // Validate and restore cache entries
      Object.entries(parsedData.cache || {}).forEach(([key, entry]: [string, any]) => {
        if (this.isValidCacheEntry(entry)) {
          this.cache.set(key, entry)
        }
      })

      // Restore statistics
      if (parsedData.stats) {
        this.stats = { ...this.stats, ...parsedData.stats }
      }

      console.log(`Restored ${this.cache.size} cache entries from persistence`)
    } catch (error) {
      console.error('Failed to load cache from persistence:', error)
    }
  }

  // Save cache to persistence
  private saveToPersistence(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return

      const cacheData = Object.fromEntries(this.cache)
      const dataToSave = {
        cache: cacheData,
        stats: this.stats,
        timestamp: Date.now()
      }

      localStorage.setItem(CACHE_CONFIG.persistenceKey, JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Failed to save cache to persistence:', error)
    }
  }

  // Validate cache entry structure
  private isValidCacheEntry(entry: any): entry is CacheEntry<any> {
    return (
      entry &&
      typeof entry === 'object' &&
      'data' in entry &&
      'timestamp' in entry &&
      'accessCount' in entry &&
      'lastAccessed' in entry &&
      'version' in entry &&
      'compressed' in entry &&
      'checksum' in entry
    )
  }

  // Start auto-save timer
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }

    this.autoSaveTimer = setInterval(() => {
      this.saveToPersistence()
    }, CACHE_CONFIG.autoSaveInterval)
  }

  // Stop auto-save timer
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }
}

// Specialized questionnaire cache manager
export class QuestionnaireStateManager {
  private cache: QuestionnaireCache
  private currentSessionId: string
  private formVersions: Map<string, number> = new Map()

  constructor() {
    this.cache = new QuestionnaireCache()
    this.currentSessionId = this.generateSessionId()
  }

  // Save questionnaire section data
  saveSection(
    sectionName: string,
    data: Partial<ProfessionalTierData>,
    userId: string
  ): void {
    const key = this.getSectionKey(sectionName, userId)
    const version = (this.formVersions.get(key) || 0) + 1

    this.cache.set(key, data, version)
    this.formVersions.set(key, version)
  }

  // Load questionnaire section data
  loadSection(
    sectionName: string,
    userId: string
  ): Partial<ProfessionalTierData> | null {
    const key = this.getSectionKey(sectionName, userId)
    return this.cache.get(key)
  }

  // Save complete questionnaire data
  saveComplete(data: ProfessionalTierData, userId: string): void {
    const key = this.getCompleteKey(userId)
    const version = (this.formVersions.get(key) || 0) + 1

    this.cache.set(key, data, version)
    this.formVersions.set(key, version)
  }

  // Load complete questionnaire data
  loadComplete(userId: string): ProfessionalTierData | null {
    const key = this.getCompleteKey(userId)
    return this.cache.get(key)
  }

  // Check if user has cached data
  hasUserData(userId: string): boolean {
    const completeKey = this.getCompleteKey(userId)
    const sectionKeys = [
      'financialMetrics',
      'customerAnalytics',
      'operationalEfficiency',
      'marketIntelligence',
      'financialPlanning',
      'compliance'
    ].map(section => this.getSectionKey(section, userId))

    return this.cache.has(completeKey) || sectionKeys.some(key => this.cache.has(key))
  }

  // Clear user data
  clearUserData(userId: string): void {
    const keys = this.cache.getKeys().filter(key => key.includes(userId))
    keys.forEach(key => this.cache.delete(key))
  }

  // Get cache statistics
  getCacheStats(): CacheStats {
    return this.cache.getStats()
  }

  // Generate cache keys
  private getSectionKey(sectionName: string, userId: string): string {
    return `questionnaire:${userId}:${sectionName}:${this.currentSessionId}`
  }

  private getCompleteKey(userId: string): string {
    return `questionnaire:${userId}:complete:${this.currentSessionId}`
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Singleton instance
export const questionnaireStateManager = new QuestionnaireStateManager()

// React hook for using the cache
export const useQuestionnaireCache = (userId: string) => {
  const saveSection = useCallback((sectionName: string, data: Partial<ProfessionalTierData>) => {
    questionnaireStateManager.saveSection(sectionName, data, userId)
  }, [userId])

  const loadSection = useCallback((sectionName: string) => {
    return questionnaireStateManager.loadSection(sectionName, userId)
  }, [userId])

  const saveComplete = useCallback((data: ProfessionalTierData) => {
    questionnaireStateManager.saveComplete(data, userId)
  }, [userId])

  const loadComplete = useCallback(() => {
    return questionnaireStateManager.loadComplete(userId)
  }, [userId])

  const hasData = useCallback(() => {
    return questionnaireStateManager.hasUserData(userId)
  }, [userId])

  const clearData = useCallback(() => {
    questionnaireStateManager.clearUserData(userId)
  }, [userId])

  return {
    saveSection,
    loadSection,
    saveComplete,
    loadComplete,
    hasData,
    clearData,
    stats: questionnaireStateManager.getCacheStats()
  }
}

export default QuestionnaireCache