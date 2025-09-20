/**
 * Redis Client Configuration
 * Handles Redis connection with graceful fallback for development environments
 */

import Redis from 'ioredis';

let redis: Redis | null = null;
let isRedisAvailable = false;

// Create Redis client with connection error handling
function createRedisClient(): Redis | null {
  if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    console.warn('REDIS_URL not configured in production environment');
    return null;
  }

  try {
    const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          // Stop retrying after 3 attempts
          console.warn('Redis connection failed after 3 attempts. Running without Redis.');
          isRedisAvailable = false;
          return null;
        }
        // Retry after 1 second, 2 seconds, 3 seconds
        return Math.min(times * 1000, 3000);
      },
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    // Handle connection events
    client.on('connect', () => {
      console.log('Redis connected successfully');
      isRedisAvailable = true;
    });

    client.on('error', (err) => {
      console.warn('Redis connection error:', err.message);
      isRedisAvailable = false;
    });

    client.on('close', () => {
      isRedisAvailable = false;
    });

    // Attempt to connect
    client.connect().catch((err) => {
      console.warn('Failed to connect to Redis:', err.message);
      isRedisAvailable = false;
    });

    return client;
  } catch (error) {
    console.warn('Failed to create Redis client:', error);
    return null;
  }
}

// Initialize Redis client
redis = createRedisClient();

/**
 * Get Redis client instance
 * Returns null if Redis is not available
 */
export function getRedisClient(): Redis | null {
  return isRedisAvailable ? redis : null;
}

/**
 * Check if Redis is available
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable;
}

/**
 * Safely execute Redis operation with fallback
 */
export async function safeRedisOperation<T>(
  operation: (client: Redis) => Promise<T>,
  fallback: T
): Promise<T> {
  const client = getRedisClient();
  if (!client) {
    return fallback;
  }

  try {
    return await operation(client);
  } catch (error) {
    console.warn('Redis operation failed:', error);
    return fallback;
  }
}

/**
 * In-memory cache fallback for when Redis is not available
 */
class MemoryCache {
  private cache: Map<string, { value: any; expires: number }> = new Map();

  set(key: string, value: any, ttl: number = 3600): void {
    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expires });
  }

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const memoryCache = new MemoryCache();

/**
 * Unified cache operations that work with Redis or fallback to memory
 */
export const cache = {
  async get(key: string): Promise<string | null> {
    return safeRedisOperation(
      async (client) => client.get(key),
      memoryCache.get(key)
    );
  },

  async set(key: string, value: string, ttl?: number): Promise<void> {
    await safeRedisOperation(
      async (client) => {
        if (ttl) {
          await client.setex(key, ttl, value);
        } else {
          await client.set(key, value);
        }
      },
      memoryCache.set(key, value, ttl)
    );
  },

  async delete(key: string): Promise<void> {
    await safeRedisOperation(
      async (client) => {
        await client.del(key);
      },
      memoryCache.delete(key)
    );
  },
};

export default redis;