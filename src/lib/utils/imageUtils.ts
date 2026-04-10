/**
 * Global Image Utilities
 * 
 * Utility functions for image operations that can be used across the entire application.
 */

import { imageService } from '../services/imageService'

/**
 * Extract filename from image URL
 */
export function extractFilenameFromUrl(url: string): string | null {
  if (!url) return null
  
  // Handle API image URLs
  if (url.startsWith('/api/image/')) {
    return url.replace('/api/image/', '')
  }
  
  // Handle full URLs
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    return pathname.split('/').pop() || null
  } catch {
    // Handle relative paths
    return url.split('/').pop() || null
  }
}

/**
 * Generate optimized image URL
 */
export function getOptimizedImageUrl(filename: string, width?: number, quality?: number): string {
  return imageService.getOptimizedImageUrl(filename, width, quality)
}

/**
 * Validate image file
 */
export function validateImageFile(file: File, maxSizeInMB: number = 5): { isValid: boolean; error?: string } {
  return imageService.validateImageFile(file, { maxSizeInMB })
}

/**
 * Create preview URL for file
 */
export function createPreviewUrl(file: File): string {
  return imageService.createPreviewUrl(file)
}

/**
 * Revoke preview URL
 */
export function revokePreviewUrl(url: string): void {
  imageService.revokePreviewUrl(url)
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Check if file is an image
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
  const extension = getFileExtension(filename)
  return imageExtensions.includes(extension)
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string, prefix?: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = getFileExtension(originalName)
  const name = originalName.replace(/\.[^/.]+$/, '') // Remove extension
  
  return `${prefix ? `${prefix}-` : ''}${timestamp}-${randomString}.${extension}`
}

/**
 * Convert image to base64
 */
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Resize image file
 */
export function resizeImage(file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(resizedFile)
          } else {
            reject(new Error('Failed to resize image'))
          }
        },
        file.type,
        quality
      )
    }
    
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Get image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Check if image is landscape or portrait
 */
export function getImageOrientation(file: File): Promise<'landscape' | 'portrait' | 'square'> {
  return getImageDimensions(file).then(({ width, height }) => {
    if (width > height) return 'landscape'
    if (height > width) return 'portrait'
    return 'square'
  })
}

/**
 * Create thumbnail from image file
 */
export function createThumbnail(file: File, size: number = 150): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    canvas.width = size
    canvas.height = size
    
    img.onload = () => {
      // Calculate crop dimensions to maintain aspect ratio
      const aspectRatio = img.width / img.height
      let sourceX = 0
      let sourceY = 0
      let sourceWidth = img.width
      let sourceHeight = img.height
      
      if (aspectRatio > 1) {
        // Landscape - crop width
        sourceWidth = img.height
        sourceX = (img.width - sourceWidth) / 2
      } else {
        // Portrait - crop height
        sourceHeight = img.width
        sourceY = (img.height - sourceHeight) / 2
      }
      
      ctx?.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, size, size
      )
      
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Batch upload images
 */
export async function batchUploadImages(files: File[], config?: any): Promise<Array<{ success: boolean; result?: any; error?: string }>> {
  const results = []
  
  for (const file of files) {
    try {
      const result = await imageService.uploadImage(file, config)
      results.push({ success: result.success, result, error: result.error })
    } catch (error) {
      results.push({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      })
    }
  }
  
  return results
}

/**
 * Preload multiple images
 */
export async function preloadMultipleImages(filenames: string[]): Promise<void> {
  try {
    await imageService.preloadImages(filenames)
  } catch (error) {
    console.error('Error preloading images:', error)
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStatistics(): Promise<any> {
  try {
    return await imageService.getCacheStats()
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return { entries: 0, totalSize: '0MB', totalSizeBytes: 0 }
  }
}
