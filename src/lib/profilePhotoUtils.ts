/**
 * Image Utilities
 * 
 * This module provides utilities for managing user profile photos and company logos
 * with a single-image-per-type approach using consistent filenames.
 */

/**
 * Get the profile photo URL for a user
 * @param extension - File extension (defaults to 'jpg')
 * @returns The profile photo URL
 */
export function getProfilePhotoUrl(extension: string = 'jpg'): string {
  const filename = `profile.${extension}`
  return `/api/image/${filename}`
}

/**
 * Get all possible profile photo URLs
 * This is useful for fallback scenarios where the exact extension is unknown
 * @returns Array of possible profile photo URLs
 */
export function getProfilePhotoUrls(): string[] {
  const extensions = ['jpg', 'jpeg', 'png', 'webp']
  return extensions.map(ext => getProfilePhotoUrl(ext))
}

/**
 * Check if a URL is a profile photo URL
 * @param url - The URL to check
 * @returns True if it's a profile photo URL
 */
export function isProfilePhotoUrl(url: string): boolean {
  return url.includes('/api/image/profile.')
}

/**
 * Get the default profile photo URL
 * @returns The default profile photo URL
 */
export function getDefaultProfilePhotoUrl(): string {
  return '/api/image/default-profile.jpg'
}

/**
 * Get the company logo URL
 * @param extension - File extension (defaults to 'jpg')
 * @returns The company logo URL
 */
export function getCompanyLogoUrl(extension: string = 'jpg'): string {
  const filename = `logo.${extension}`
  return `/api/image/${filename}`
}

/**
 * Get all possible company logo URLs
 * This is useful for fallback scenarios where the exact extension is unknown
 * @returns Array of possible company logo URLs
 */
export function getCompanyLogoUrls(): string[] {
  const extensions = ['jpg', 'jpeg', 'png', 'webp']
  return extensions.map(ext => getCompanyLogoUrl(ext))
}

/**
 * Check if a URL is a company logo URL
 * @param url - The URL to check
 * @returns True if it's a company logo URL
 */
export function isCompanyLogoUrl(url: string): boolean {
  return url.includes('/api/image/logo.')
}

/**
 * Get the default company logo URL
 * @returns The default company logo URL
 */
export function getDefaultCompanyLogoUrl(): string {
  return '/api/image/default-logo.jpg'
}
