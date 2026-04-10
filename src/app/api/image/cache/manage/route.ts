import { NextRequest, NextResponse } from 'next/server'
import { clearCache, removeFromCache, preloadImages } from '@/lib/imageCache'

/**
 * POST /api/image/cache/manage
 * Manage image cache (clear, remove specific images, preload)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, filenames } = body

    switch (action) {
      case 'clear':
        clearCache()
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully',
        })

      case 'remove':
        if (!filenames || !Array.isArray(filenames)) {
          return NextResponse.json(
            { success: false, error: 'filenames array is required for remove action' },
            { status: 400 }
          )
        }
        
        const removed = filenames.map(filename => ({
          filename,
          removed: removeFromCache(filename),
        }))
        
        return NextResponse.json({
          success: true,
          message: 'Cache removal completed',
          data: { removed },
        })

      case 'preload':
        if (!filenames || !Array.isArray(filenames)) {
          return NextResponse.json(
            { success: false, error: 'filenames array is required for preload action' },
            { status: 400 }
          )
        }
        
        await preloadImages(filenames)
        
        return NextResponse.json({
          success: true,
          message: `Preloaded ${filenames.length} images`,
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: clear, remove, or preload' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error managing cache:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to manage cache' 
      },
      { status: 500 }
    )
  }
}
