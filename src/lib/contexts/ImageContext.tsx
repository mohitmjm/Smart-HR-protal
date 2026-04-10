'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { imageService, ImageServiceConfig, ImageUploadResult, ImageCacheStats } from '../services/imageService'

interface ImageContextType {
  // Upload state
  isUploading: boolean
  uploadProgress: number
  
  // Cache state
  cacheStats: ImageCacheStats | null
  isLoadingStats: boolean
  
  // Upload functions
  uploadImage: (file: File, config?: ImageServiceConfig) => Promise<ImageUploadResult>
  validateImageFile: (file: File, config?: ImageServiceConfig) => { isValid: boolean; error?: string }
  
  // Cache management
  preloadImages: (filenames: string[]) => Promise<void>
  clearCache: () => Promise<boolean>
  removeFromCache: (filenames: string[]) => Promise<boolean>
  refreshCacheStats: () => Promise<void>
  
  // Utility functions
  getImageUrl: (filename: string) => string
  getOptimizedImageUrl: (filename: string, width?: number, quality?: number) => string
  createPreviewUrl: (file: File) => string
  revokePreviewUrl: (url: string) => void
}

const ImageContext = createContext<ImageContextType | undefined>(undefined)

interface ImageProviderProps {
  children: ReactNode
  autoRefreshStats?: boolean
  refreshInterval?: number
}

export const ImageProvider: React.FC<ImageProviderProps> = ({ 
  children, 
  autoRefreshStats = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [cacheStats, setCacheStats] = useState<ImageCacheStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // Upload image with progress tracking
  const uploadImage = useCallback(async (file: File, config?: ImageServiceConfig): Promise<ImageUploadResult> => {
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Simulate progress (since we can't track actual upload progress easily)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)
      
      const result = await imageService.uploadImage(file, config)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Refresh cache stats after upload
      if (result.success) {
        await refreshCacheStats()
      }
      
      return result
    } catch (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000) // Reset progress after 1 second
    }
  }, [])


  // Refresh cache stats
  const refreshCacheStats = useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const stats = await imageService.getCacheStats()
      setCacheStats(stats)
    } catch (error) {
      console.error('Error refreshing cache stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  // Validate image file
  const validateImageFile = useCallback((file: File, config?: ImageServiceConfig) => {
    return imageService.validateImageFile(file, config)
  }, [refreshCacheStats])

  // Preload images
  const preloadImages = useCallback(async (filenames: string[]) => {
    try {
      await imageService.preloadImages(filenames)
      await refreshCacheStats()
    } catch (error) {
      console.error('Error preloading images:', error)
    }
  }, [refreshCacheStats])

  // Clear cache
  const clearCache = useCallback(async (): Promise<boolean> => {
    try {
      const success = await imageService.clearCache()
      if (success) {
        await refreshCacheStats()
      }
      return success
    } catch (error) {
      console.error('Error clearing cache:', error)
      return false
    }
  }, [refreshCacheStats])

  // Remove from cache
  const removeFromCache = useCallback(async (filenames: string[]): Promise<boolean> => {
    try {
      const success = await imageService.removeFromCache(filenames)
      if (success) {
        await refreshCacheStats()
      }
      return success
    } catch (error) {
      console.error('Error removing from cache:', error)
      return false
    }
  }, [refreshCacheStats])

  // Get image URL
  const getImageUrl = useCallback((filename: string) => {
    return imageService.getImageUrl(filename)
  }, [])

  // Get optimized image URL
  const getOptimizedImageUrl = useCallback((filename: string, width?: number, quality?: number) => {
    return imageService.getOptimizedImageUrl(filename, width, quality)
  }, [])

  // Create preview URL
  const createPreviewUrl = useCallback((file: File) => {
    return imageService.createPreviewUrl(file)
  }, [])

  // Revoke preview URL
  const revokePreviewUrl = useCallback((url: string) => {
    imageService.revokePreviewUrl(url)
  }, [])

  // Auto-refresh cache stats
  useEffect(() => {
    if (autoRefreshStats) {
      refreshCacheStats()
      const interval = setInterval(refreshCacheStats, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefreshStats, refreshInterval, refreshCacheStats])

  // Refresh cache stats on session start (when component mounts)
  useEffect(() => {
    refreshCacheStats()
  }, [refreshCacheStats])

  const contextValue: ImageContextType = {
    isUploading,
    uploadProgress,
    cacheStats,
    isLoadingStats,
    uploadImage,
    validateImageFile,
    preloadImages,
    clearCache,
    removeFromCache,
    refreshCacheStats,
    getImageUrl,
    getOptimizedImageUrl,
    createPreviewUrl,
    revokePreviewUrl,
  }

  return (
    <ImageContext.Provider value={contextValue}>
      {children}
    </ImageContext.Provider>
  )
}

// Custom hook to use the image context
export const useImage = (): ImageContextType => {
  const context = useContext(ImageContext)
  if (context === undefined) {
    throw new Error('useImage must be used within an ImageProvider')
  }
  return context
}

// Export the context for advanced usage
export { ImageContext }
