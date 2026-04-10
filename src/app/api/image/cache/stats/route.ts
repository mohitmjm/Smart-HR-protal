import { NextResponse } from 'next/server'
import { getCacheStats } from '@/lib/imageCache'

/**
 * GET /api/image/cache/stats
 * Returns cache statistics for monitoring
 */
export async function GET() {
  try {
    const stats = getCacheStats()
    
    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get cache statistics' 
      },
      { status: 500 }
    )
  }
}
