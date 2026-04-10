'use client'

import { useState, useCallback } from 'react'
import { useImage } from '../contexts/ImageContext'

interface UseImageCacheReturn {
  // State
  cacheStats: any | null
  isLoadingStats: boolean
  isManaging: boolean
  
  // Actions
  refreshStats: () => Promise<void>
  clearCache: () => Promise<boolean>
  removeFromCache: (filenames: string[]) => Promise<boolean>
  preloadImages: (filenames: string[]) => Promise<void>
  
  // Utility
  getImageUrl: (filename: string) => string
  getOptimizedImageUrl: (filename: string, width?: number, quality?: number) => string
}

export const useImageCache = (): UseImageCacheReturn => {
  const {
    cacheStats,
    isLoadingStats,
    preloadImages: preloadImagesService,
    clearCache: clearCacheService,
    removeFromCache: removeFromCacheService,
    refreshCacheStats,
    getImageUrl,
    getOptimizedImageUrl,
  } = useImage()
  
  const [isManaging, setIsManaging] = useState(false)

  const refreshStats = useCallback(async () => {
    await refreshCacheStats()
  }, [refreshCacheStats])

  const clearCache = useCallback(async (): Promise<boolean> => {
    setIsManaging(true)
    try {
      const success = await clearCacheService()
      return success
    } finally {
      setIsManaging(false)
    }
  }, [clearCacheService])

  const removeFromCache = useCallback(async (filenames: string[]): Promise<boolean> => {
    setIsManaging(true)
    try {
      const success = await removeFromCacheService(filenames)
      return success
    } finally {
      setIsManaging(false)
    }
  }, [removeFromCacheService])

  const preloadImages = useCallback(async (filenames: string[]): Promise<void> => {
    setIsManaging(true)
    try {
      await preloadImagesService(filenames)
    } finally {
      setIsManaging(false)
    }
  }, [preloadImagesService])

  return {
    cacheStats,
    isLoadingStats,
    isManaging,
    refreshStats,
    clearCache,
    removeFromCache,
    preloadImages,
    getImageUrl,
    getOptimizedImageUrl,
  }
}
