/**
 * Cache Statistics API
 * Provides cache performance metrics and management
 */

import { NextRequest, NextResponse } from 'next/server'
import { EnhancedCache } from '@/lib/enhancedCache'
import { RedisCache } from '@/lib/redisCache'

export async function GET() {
  try {
    const stats = EnhancedCache.getStats()
    const redisStats = await RedisCache.getStats()

    return NextResponse.json({
      success: true,
      data: {
        memory: stats.memory,
        redis: redisStats,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Cache stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get cache statistics' },
      { status: 500 }
    )
  }
}
