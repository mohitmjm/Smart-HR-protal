'use client'

import { useState, useCallback, useEffect } from 'react'
import { useImage } from '../contexts/ImageContext'

interface UseImageDisplayOptions {
  filename?: string
  fallbackSrc?: string
  onLoad?: () => void
  onError?: (error: string) => void
}

interface UseImageDisplayReturn {
  // State
  imageUrl: string | null
  isLoading: boolean
  hasError: boolean
  error: string | null
  
  // Actions
  setFilename: (filename: string) => void
  retry: () => void
  preload: () => Promise<void>
}

export const useImageDisplay = (options: UseImageDisplayOptions = {}): UseImageDisplayReturn => {
  const { getImageUrl, preloadImages } = useImage()
  const { filename, fallbackSrc, onLoad, onError } = options
  
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setFilename = useCallback((newFilename: string) => {
    if (newFilename) {
      const url = getImageUrl(newFilename)
      setImageUrl(url)
      setHasError(false)
      setError(null)
      setIsLoading(true)
    } else {
      setImageUrl(fallbackSrc || null)
      setHasError(false)
      setError(null)
      setIsLoading(false)
    }
  }, [getImageUrl, fallbackSrc])

  const retry = useCallback(() => {
    if (filename) {
      setFilename(filename)
    }
  }, [filename, setFilename])

  const preload = useCallback(async () => {
    if (filename) {
      try {
        await preloadImages([filename])
      } catch (err) {
        console.error('Error preloading image:', err)
      }
    }
  }, [filename, preloadImages])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
    setError(null)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback((errorMessage: string) => {
    setIsLoading(false)
    setHasError(true)
    setError(errorMessage)
    onError?.(errorMessage)
  }, [onError])

  // Update image URL when filename changes
  useEffect(() => {
    if (filename) {
      setFilename(filename)
    } else {
      setImageUrl(fallbackSrc || null)
      setIsLoading(false)
      setHasError(false)
      setError(null)
    }
  }, [filename, setFilename, fallbackSrc])

  return {
    imageUrl,
    isLoading,
    hasError,
    error,
    setFilename,
    retry,
    preload,
  }
}
