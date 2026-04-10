/**
 * Global Image System Export
 * 
 * This file exports all image-related functionality for easy importing across the application.
 */

// Services
export { imageService } from '../services/imageService'
export type { ImageServiceConfig, ImageUploadResult, ImageCacheStats } from '../services/imageService'

// Context
export { ImageProvider, useImage, ImageContext } from '../contexts/ImageContext'

// Hooks
export { useImageUpload } from '../hooks/useImageUpload'
export { useImageCache } from '../hooks/useImageCache'
export { useImageDisplay } from '../hooks/useImageDisplay'

// Components
export * from '../../components/global'

// Utils
export * from '../utils/imageUtils'

// Core cache functionality
export { getCachedImage, getCacheStats, clearCache, preloadImages, removeFromCache } from '../imageCache'
