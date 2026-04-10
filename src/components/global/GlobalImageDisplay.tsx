'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useImageDisplay } from '@/lib/hooks/useImageDisplay'

interface GlobalImageDisplayProps {
  filename?: string
  fallbackSrc?: string
  alt?: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  sizes?: string
  fill?: boolean
  onLoad?: () => void
  onError?: (error: string) => void
  showLoadingSpinner?: boolean
  showErrorState?: boolean
  retryOnError?: boolean
}

const GlobalImageDisplay: React.FC<GlobalImageDisplayProps> = ({
  filename,
  fallbackSrc,
  alt = 'Image',
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  sizes,
  fill = false,
  onLoad,
  onError,
  showLoadingSpinner = true,
  showErrorState = true,
  retryOnError = true,
}) => {
  const {
    imageUrl,
    isLoading,
    hasError,
    retry,
    preload,
  } = useImageDisplay({
    filename,
    fallbackSrc,
    onLoad,
    onError,
  })

  const [imageLoadError, setImageLoadError] = useState(false)

  // Preload image when component mounts
  useEffect(() => {
    if (filename) {
      preload()
    }
  }, [filename, preload])

  const handleImageLoad = () => {
    setImageLoadError(false)
    onLoad?.()
  }

  const handleImageError = () => {
    setImageLoadError(true)
    const errorMsg = `Failed to load image: ${filename || 'unknown'}`
    onError?.(errorMsg)
  }

  const handleRetry = () => {
    setImageLoadError(false)
    retry()
  }

  // Show loading state
  if (isLoading && showLoadingSpinner) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show error state
  if ((hasError || imageLoadError) && showErrorState) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-500 ${className}`}>
        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs text-center">Failed to load</span>
        {retryOnError && (
          <button
            onClick={handleRetry}
            className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  // Show fallback if no image URL
  if (!imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  // Render image
  if (fill) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover"
          priority={priority}
          quality={quality}
          sizes={sizes}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width || 200}
      height={height || 200}
      className={className}
      priority={priority}
      quality={quality}
      sizes={sizes}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  )
}

export default GlobalImageDisplay
