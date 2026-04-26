/**
 * Global Image Service
 * 
 * This service provides a unified interface for image operations across the entire application.
 * It handles caching, uploading, and serving images with a consistent API.
 */

export interface ImageUploadResult {
  success: boolean
  imageUrl?: string
  filename?: string
  error?: string
}

export interface ImageCacheStats {
  entries: number
  totalSize: string
  totalSizeBytes: number
}

export interface ImageServiceConfig {
  maxSizeInMB?: number
  acceptedFormats?: string[]
  uploadType?: string
}

class ImageService {
  private static instance: ImageService
  private defaultConfig: ImageServiceConfig = {
    maxSizeInMB: 5,
    acceptedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    uploadType: 'profile'
  }

  private constructor() {}

  public static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService()
    }
    return ImageService.instance
  }

  /**
   * Upload an image file
   */
  async uploadImage(file: File, config: ImageServiceConfig = {}): Promise<ImageUploadResult> {
    const finalConfig = { ...this.defaultConfig, ...config }

    try {
      // Validate file size
      if (file.size > finalConfig.maxSizeInMB! * 1024 * 1024) {
        return {
          success: false,
          error: `File size must be less than ${finalConfig.maxSizeInMB}MB`
        }
      }

      // Validate file type
      if (!finalConfig.acceptedFormats!.includes(file.type)) {
        return {
          success: false,
          error: `File must be one of: ${finalConfig.acceptedFormats!.map(f => f.split('/')[1]).join(', ')}`
        }
      }

      // Create FormData for upload
      const formData = new FormData()
      formData.append('image', file)
      formData.append('type', finalConfig.uploadType!)

      // Upload to API
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.message || 'Upload failed'
        }
      }

      const result = await response.json()

      if (result.success && result.data?.imageUrl) {
        return {
          success: true,
          imageUrl: result.data.imageUrl,
          filename: result.data.filename
        }
      } else {
        return {
          success: false,
          error: 'Invalid response from server'
        }
      }
    } catch (error) {
      console.error('Image upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  /**
   * Get image URL with caching
   */
  getImageUrl(filename: string): string {
    return `/api/image/${filename}`
  }

  /**
   * Preload images into cache
   */
  async preloadImages(filenames: string[]): Promise<void> {
    try {
      await Promise.all(
        filenames.map(filename => 
          fetch(this.getImageUrl(filename)).catch(e => console.error(`Failed to preload ${filename}`, e))
        )
      )
    } catch (error) {
      console.error('Error preloading images:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<ImageCacheStats> {
    try {
      const response = await fetch('/api/image/cache/stats')
      if (response.ok) {
        const result = await response.json()
        return result.data
      }
    } catch (error) {
      console.error('Error getting cache stats:', error)
    }
    return { entries: 0, totalSize: '0MB', totalSizeBytes: 0 }
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<boolean> {
    try {
      const response = await fetch('/api/image/cache/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      })
      return response.ok
    } catch (error) {
      console.error('Error clearing cache:', error)
      return false
    }
  }

  /**
   * Remove specific images from cache
   */
  async removeFromCache(filenames: string[]): Promise<boolean> {
    try {
      const response = await fetch('/api/image/cache/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', filenames })
      })
      return response.ok
    } catch (error) {
      console.error('Error removing from cache:', error)
      return false
    }
  }

  /**
   * Create a preview URL for file uploads
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file)
  }

  /**
   * Revoke a preview URL to free memory
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url)
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File, config: ImageServiceConfig = {}): { isValid: boolean; error?: string } {
    const finalConfig = { ...this.defaultConfig, ...config }

    // Check file size
    if (file.size > finalConfig.maxSizeInMB! * 1024 * 1024) {
      return {
        isValid: false,
        error: `File size must be less than ${finalConfig.maxSizeInMB}MB`
      }
    }

    // Check file type
    if (!finalConfig.acceptedFormats!.includes(file.type)) {
      return {
        isValid: false,
        error: `File must be one of: ${finalConfig.acceptedFormats!.map(f => f.split('/')[1]).join(', ')}`
      }
    }

    return { isValid: true }
  }

  /**
   * Get optimized image URL with Next.js Image component
   */
  getOptimizedImageUrl(filename: string, width?: number, quality?: number): string {
    const params = new URLSearchParams()
    if (width) params.set('w', width.toString())
    if (quality) params.set('q', quality.toString())
    
    const queryString = params.toString()
    return `/api/image/${filename}${queryString ? `?${queryString}` : ''}`
  }
}

// Export singleton instance
export const imageService = ImageService.getInstance()
