'use client'

import React, { useState } from 'react'
import { useImageCache } from '@/lib/hooks/useImageCache'
import { 
  TrashIcon, 
  ArrowPathIcon, 
  CloudArrowDownIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ImageCacheManagerProps {
  className?: string
  showStats?: boolean
  showActions?: boolean
  compact?: boolean
}

const ImageCacheManager: React.FC<ImageCacheManagerProps> = ({
  className = '',
  showStats = true,
  showActions = true,
  compact = false,
}) => {
  const {
    cacheStats,
    isLoadingStats,
    isManaging,
    refreshStats,
    clearCache,
    preloadImages,
  } = useImageCache()

  const [isClearing, setIsClearing] = useState(false)
  const [isPreloading, setIsPreloading] = useState(false)
  const [preloadFilenames, setPreloadFilenames] = useState('')

  const handleClearCache = async () => {
    if (window.confirm('Are you sure you want to clear the image cache? This will remove all cached images.')) {
      setIsClearing(true)
      try {
        const success = await clearCache()
        if (success) {
          alert('Cache cleared successfully!')
        } else {
          alert('Failed to clear cache')
        }
      } catch (error) {
        alert('Error clearing cache')
      } finally {
        setIsClearing(false)
      }
    }
  }

  const handlePreloadImages = async () => {
    if (!preloadFilenames.trim()) {
      alert('Please enter image filenames to preload')
      return
    }

    const filenames = preloadFilenames.split(',').map(f => f.trim()).filter(f => f)
    if (filenames.length === 0) {
      alert('Please enter valid image filenames')
      return
    }

    setIsPreloading(true)
    try {
      await preloadImages(filenames)
      alert(`Preloaded ${filenames.length} images successfully!`)
      setPreloadFilenames('')
    } catch (error) {
      alert('Error preloading images')
    } finally {
      setIsPreloading(false)
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showStats && cacheStats && (
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <ChartBarIcon className="w-4 h-4" />
            <span>{cacheStats.entries} images</span>
            <span className="text-gray-400">({cacheStats.totalSize})</span>
          </div>
        )}
        
        {showActions && (
          <div className="flex items-center space-x-1">
            <button
              onClick={refreshStats}
              disabled={isLoadingStats}
              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              title="Refresh stats"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={handleClearCache}
              disabled={isClearing || isManaging}
              className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
              title="Clear cache"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Image Cache Manager</h3>
        <button
          onClick={refreshStats}
          disabled={isLoadingStats}
          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          title="Refresh stats"
        >
          <ArrowPathIcon className={`w-5 h-5 ${isLoadingStats ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {showStats && (
        <div className="mb-4">
          {isLoadingStats ? (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loading cache statistics...</span>
            </div>
          ) : cacheStats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Cached Images</div>
                <div className="text-2xl font-bold text-blue-900">{cacheStats.entries}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Cache Size</div>
                <div className="text-2xl font-bold text-green-900">{cacheStats.totalSize}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Memory Usage</div>
                <div className="text-2xl font-bold text-purple-900">
                  {(cacheStats.totalSizeBytes / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-500">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span>Failed to load cache statistics</span>
            </div>
          )}
        </div>
      )}

      {showActions && (
        <div className="space-y-4">
          {/* Clear Cache */}
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div>
              <div className="font-medium text-red-900">Clear Cache</div>
              <div className="text-sm text-red-700">Remove all cached images from memory</div>
            </div>
            <button
              onClick={handleClearCache}
              disabled={isClearing || isManaging}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <TrashIcon className="w-4 h-4" />
              <span>{isClearing ? 'Clearing...' : 'Clear Cache'}</span>
            </button>
          </div>

          {/* Preload Images */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="font-medium text-blue-900 mb-2">Preload Images</div>
            <div className="text-sm text-blue-700 mb-3">
              Enter image filenames separated by commas to preload them into cache
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={preloadFilenames}
                onChange={(e) => setPreloadFilenames(e.target.value)}
                placeholder="image1.png, image2.jpg, image3.webp"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handlePreloadImages}
                disabled={isPreloading || isManaging}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <CloudArrowDownIcon className="w-4 h-4" />
                <span>{isPreloading ? 'Preloading...' : 'Preload'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageCacheManager
