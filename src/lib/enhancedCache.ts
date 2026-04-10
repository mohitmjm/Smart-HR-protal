/**
 * Enhanced Caching Service
 * Multi-layer caching with in-memory, Redis, and fallback strategies
 */

import { RedisCache } from './redisCache'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  tags?: string[]
}

interface CacheConfig {
  memoryTTL: number // In-memory cache TTL in seconds
  redisTTL: number // Redis cache TTL in seconds
  tags?: string[] // Cache tags for invalidation
  fallbackToSource?: boolean // Whether to fallback to source on cache miss
}

export class EnhancedCache {
  private static memoryCache = new Map<string, CacheEntry<any>>()
  private static maxMemorySize = 50 * 1024 * 1024 // 50MB
  private static currentMemorySize = 0
  private static hitCount = 0
  private static missCount = 0

  /**
   * Get data with multi-layer caching
   */
  static async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = {
      memoryTTL: 300, // 5 minutes
      redisTTL: 3600, // 1 hour
      fallbackToSource: true
    }
  ): Promise<T> {
    try {
      // Layer 1: In-memory cache
      const memoryData = this.getFromMemory<T>(key)
      if (memoryData !== null) {
        this.hitCount++
        return memoryData
      }

      // Layer 2: Redis cache
      const redisData = await RedisCache.get<T>(key)
      if (redisData !== null) {
        this.hitCount++
        // Store in memory for faster access
        this.setInMemory(key, redisData, config.memoryTTL, config.tags)
        return redisData
      }

      // Layer 3: Source fetch
      if (config.fallbackToSource) {
        this.missCount++
        const data = await fetcher()
        
        // Store in both caches
        this.setInMemory(key, data, config.memoryTTL, config.tags)
        await RedisCache.set(key, data, {
          ttl: config.redisTTL,
          tags: config.tags
        })
        
        return data
      }

      throw new Error('Cache miss and fallback disabled')
    } catch (error) {
      console.error('Enhanced cache get error:', error)
      if (config.fallbackToSource) {
        return await fetcher()
      }
      throw error
    }
  }

  /**
   * Set data in memory cache
   */
  private static setInMemory<T>(
    key: string,
    data: T,
    ttl: number,
    tags?: string[]
  ): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000,
      tags
    }

    // Check if we need to clean up memory
    this.cleanupMemoryIfNeeded()

    this.memoryCache.set(key, entry)
    this.currentMemorySize += this.estimateSize(entry)
  }

  /**
   * Get data from memory cache
   */
  private static getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key)
      this.currentMemorySize -= this.estimateSize(entry)
      return null
    }

    return entry.data
  }

  /**
   * Clean up memory cache if needed
   */
  private static cleanupMemoryIfNeeded(): void {
    if (this.currentMemorySize < this.maxMemorySize) {
      return
    }

    // Remove expired entries first
    const now = Date.now()
    const expiredKeys: string[] = []
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => {
      const entry = this.memoryCache.get(key)
      if (entry) {
        this.currentMemorySize -= this.estimateSize(entry)
        this.memoryCache.delete(key)
      }
    })

    // If still over limit, remove oldest entries
    if (this.currentMemorySize >= this.maxMemorySize) {
      const sortedEntries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const entriesToRemove = Math.ceil(sortedEntries.length * 0.2) // Remove 20%
      
      for (let i = 0; i < entriesToRemove; i++) {
        const [key, entry] = sortedEntries[i]
        this.currentMemorySize -= this.estimateSize(entry)
        this.memoryCache.delete(key)
      }
    }
  }

  /**
   * Estimate size of cache entry
   */
  private static estimateSize(entry: CacheEntry<any>): number {
    return JSON.stringify(entry).length * 2 // Rough estimate
  }

  /**
   * Invalidate cache by key
   */
  static async invalidate(key: string): Promise<void> {
    // Remove from memory
    const entry = this.memoryCache.get(key)
    if (entry) {
      this.currentMemorySize -= this.estimateSize(entry)
      this.memoryCache.delete(key)
    }

    // Remove from Redis
    await RedisCache.delete(key)
  }

  /**
   * Invalidate cache by tags
   */
  static async invalidateByTags(tags: string[]): Promise<void> {
    // Remove from memory by tags
    const keysToRemove: string[] = []
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => {
      const entry = this.memoryCache.get(key)
      if (entry) {
        this.currentMemorySize -= this.estimateSize(entry)
        this.memoryCache.delete(key)
      }
    })

    // Remove from Redis by tags
    await RedisCache.invalidateByTags(tags)
  }

  /**
   * Clear all caches
   */
  static async clearAll(): Promise<void> {
    this.memoryCache.clear()
    this.currentMemorySize = 0
    await RedisCache.clearAll()
  }

  /**
   * Get cache statistics
   */
  static getStats(): {
    memory: {
      entries: number
      size: string
      hitRate: number
    }
    redis: Promise<any>
  } {
    const totalRequests = this.hitCount + this.missCount
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0

    return {
      memory: {
        entries: this.memoryCache.size,
        size: `${(this.currentMemorySize / 1024 / 1024).toFixed(2)}MB`,
        hitRate: Math.round(hitRate * 100) / 100
      },
      redis: RedisCache.getStats()
    }
  }

  /**
   * Preload data into cache
   */
  static async preload<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = {
      memoryTTL: 300,
      redisTTL: 3600
    }
  ): Promise<void> {
    try {
      const data = await fetcher()
      this.setInMemory(key, data, config.memoryTTL, config.tags)
      await RedisCache.set(key, data, {
        ttl: config.redisTTL,
        tags: config.tags
      })
    } catch (error) {
      console.error('Preload error:', error)
    }
  }
}

export default EnhancedCache
