/**
 * Cache Management API
 * Provides cache invalidation and management capabilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { EnhancedCache } from '@/lib/enhancedCache'
import { RedisCache } from '@/lib/redisCache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, key, tags, pattern } = body

    switch (action) {
      case 'invalidate':
        if (key) {
          await EnhancedCache.invalidate(key)
        } else if (tags) {
          await EnhancedCache.invalidateByTags(tags)
        } else {
          return NextResponse.json(
            { success: false, error: 'Key or tags required for invalidate action' },
            { status: 400 }
          )
        }
        break

      case 'invalidate-pattern':
        if (!pattern) {
          return NextResponse.json(
            { success: false, error: 'Pattern required for invalidate-pattern action' },
            { status: 400 }
          )
        }
        await RedisCache.invalidatePattern(pattern)
        break

      case 'clear-all':
        await EnhancedCache.clearAll()
        break

      case 'clear-memory':
        // Clear only memory cache
        await EnhancedCache.clearAll()
        break

      case 'clear-redis':
        // Clear only Redis cache
        await RedisCache.clearAll()
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Cache ${action} completed successfully`
    })
  } catch (error) {
    console.error('Cache management error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to manage cache' },
      { status: 500 }
    )
  }
}
