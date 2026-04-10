/**
 * Cache-Aware Services
 * Services that use enhanced caching for better performance
 */

import { EnhancedCache } from './enhancedCache'
import { TimezoneSyncService } from './timezoneSyncService'
import UserProfile from '@/models/UserProfile'
import SystemSettings from '@/models/SystemSettings'
import connectDB from './mongodb'

export class CachedUserService {
  /**
   * Get user profile with caching
   */
  static async getUserProfile(userId: string) {
    return await EnhancedCache.get(
      `user:profile:${userId}`,
      async () => {
        await connectDB()
        return await UserProfile.findOne({ clerkUserId: userId })
      },
      {
        memoryTTL: 300, // 5 minutes
        redisTTL: 1800, // 30 minutes
        tags: ['user', 'profile']
      }
    )
  }

  /**
   * Get user timezone with caching
   */
  static async getUserTimezone(userId: string) {
    return await EnhancedCache.get(
      `user:timezone:${userId}`,
      async () => {
        return await TimezoneSyncService.getTimezoneWithFallback(userId)
      },
      {
        memoryTTL: 600, // 10 minutes
        redisTTL: 3600, // 1 hour
        tags: ['user', 'timezone']
      }
    )
  }

  /**
   * Invalidate user cache
   */
  static async invalidateUser(userId: string) {
    await EnhancedCache.invalidateByTags(['user'])
    await EnhancedCache.invalidate(`user:profile:${userId}`)
    await EnhancedCache.invalidate(`user:timezone:${userId}`)
  }
}

export class CachedSettingsService {
  /**
   * Get system settings with caching
   */
  static async getSystemSettings() {
    return await EnhancedCache.get(
      'system:settings',
      async () => {
        await connectDB()
        return await SystemSettings.findOne()
      },
      {
        memoryTTL: 300, // 5 minutes
        redisTTL: 1800, // 30 minutes
        tags: ['system', 'settings']
      }
    )
  }

  /**
   * Invalidate settings cache
   */
  static async invalidateSettings() {
    await EnhancedCache.invalidateByTags(['system', 'settings'])
  }
}

export class CachedAttendanceService {
  /**
   * Get attendance data with caching
   */
  static async getAttendanceData(userId: string, date?: string) {
    const cacheKey = `attendance:${userId}:${date || 'today'}`
    
    return await EnhancedCache.get(
      cacheKey,
      async () => {
        // This would call your actual attendance API logic
        // For now, return a placeholder
        return { userId, date, data: [] }
      },
      {
        memoryTTL: 60, // 1 minute
        redisTTL: 300, // 5 minutes
        tags: ['attendance', 'user']
      }
    )
  }

  /**
   * Invalidate attendance cache for user
   */
  static async invalidateUserAttendance(userId: string) {
    await EnhancedCache.invalidateByTags(['attendance', 'user'])
  }
}

export class CachedLeaveService {
  /**
   * Get leave data with caching
   */
  static async getLeaveData(userId: string, filters?: any) {
    const cacheKey = `leaves:${userId}:${JSON.stringify(filters || {})}`
    
    return await EnhancedCache.get(
      cacheKey,
      async () => {
        // This would call your actual leave API logic
        return { userId, filters, data: [] }
      },
      {
        memoryTTL: 300, // 5 minutes
        redisTTL: 1800, // 30 minutes
        tags: ['leaves', 'user']
      }
    )
  }

  /**
   * Invalidate leave cache for user
   */
  static async invalidateUserLeaves(userId: string) {
    await EnhancedCache.invalidateByTags(['leaves', 'user'])
  }
}

export class CachedAnalyticsService {
  /**
   * Get analytics data with caching
   */
  static async getAnalyticsData(period: string, department?: string) {
    const cacheKey = `analytics:${period}:${department || 'all'}`
    
    return await EnhancedCache.get(
      cacheKey,
      async () => {
        // This would call your actual analytics logic
        return { period, department, data: {} }
      },
      {
        memoryTTL: 600, // 10 minutes
        redisTTL: 3600, // 1 hour
        tags: ['analytics']
      }
    )
  }

  /**
   * Invalidate analytics cache
   */
  static async invalidateAnalytics() {
    await EnhancedCache.invalidateByTags(['analytics'])
  }
}

// All services are already exported inline above
