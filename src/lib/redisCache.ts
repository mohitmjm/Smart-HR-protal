/**
 * Redis Cache Service for Upstash Redis
 * Provides persistent caching across serverless functions
 */

import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
}

export class RedisCache {
  private static defaultTTL = 3600 // 1 hour

  /**
   * Get value from Redis cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key)
      return value as T | null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  /**
   * Set value in Redis cache
   */
  static async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || this.defaultTTL
      await redis.setex(key, ttl, JSON.stringify(value))
      
      // Store tags for invalidation
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await redis.sadd(`tag:${tag}`, key)
          await redis.expire(`tag:${tag}`, ttl)
        }
      }
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }

  /**
   * Delete key from Redis cache
   */
  static async delete(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error('Redis delete error:', error)
    }
  }

  /**
   * Invalidate cache by pattern
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Redis invalidate pattern error:', error)
    }
  }

  /**
   * Invalidate cache by tags
   */
  static async invalidateByTags(tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const keys = await redis.smembers(`tag:${tag}`)
        if (keys.length > 0) {
          await redis.del(...keys)
          await redis.del(`tag:${tag}`)
        }
      }
    } catch (error) {
      console.error('Redis invalidate by tags error:', error)
    }
  }

  /**
   * Get or set with automatic fallback
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key)
      if (cached !== null) {
        return cached
      }

      // Fetch fresh data
      const data = await fetcher()
      
      // Cache the data
      await this.set(key, data, options)
      
      return data
    } catch (error) {
      console.error('Redis getOrSet error:', error)
      // Fallback to direct fetch
      return await fetcher()
    }
  }

  /**
   * Batch get multiple keys
   */
  static async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await redis.mget(...keys)
      return values.map(v => v ? JSON.parse(v as string) : null)
    } catch (error) {
      console.error('Redis mget error:', error)
      return new Array(keys.length).fill(null)
    }
  }

  /**
   * Batch set multiple key-value pairs
   */
  static async mset(
    keyValuePairs: Array<{ key: string; value: any; ttl?: number }>,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const pipeline = redis.pipeline()
      
      for (const { key, value, ttl } of keyValuePairs) {
        const cacheTTL = ttl || options.ttl || this.defaultTTL
        pipeline.setex(key, cacheTTL, JSON.stringify(value))
        
        // Add tags
        if (options.tags && options.tags.length > 0) {
          for (const tag of options.tags) {
            pipeline.sadd(`tag:${tag}`, key)
            pipeline.expire(`tag:${tag}`, cacheTTL)
          }
        }
      }
      
      await pipeline.exec()
    } catch (error) {
      console.error('Redis mset error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    memory: string
    keys: number
    hitRate: number
  }> {
    try {
      // Upstash Redis doesn't support info command, so we'll return basic stats
      const keys = await redis.dbsize()
      
      return {
        memory: 'Not available in Upstash Redis',
        keys,
        hitRate: 0 // Would need to track this separately
      }
    } catch (error) {
      console.error('Redis stats error:', error)
      return {
        memory: 'Unknown',
        keys: 0,
        hitRate: 0
      }
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  static async clearAll(): Promise<void> {
    try {
      await redis.flushdb()
    } catch (error) {
      console.error('Redis clear all error:', error)
    }
  }
}

export default RedisCache
