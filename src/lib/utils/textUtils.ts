/**
 * Text truncation utilities for consistent text handling
 */

export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export const truncateWords = (text: string, maxWords: number = 20): string => {
  if (!text) return ''
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(' ') + '...'
}

export const truncateLines = (text: string, maxLines: number = 2): string => {
  if (!text) return ''
  const lines = text.split('\n')
  if (lines.length <= maxLines) return text
  return lines.slice(0, maxLines).join('\n') + '...'
}

/**
 * CSS classes for consistent text truncation
 */
export const textTruncationClasses = {
  single: 'truncate',
  multi: 'line-clamp-2',
  multi3: 'line-clamp-3',
  multi4: 'line-clamp-4'
} as const

/**
 * Responsive text truncation classes
 */
export const responsiveTextClasses = {
  title: 'text-sm sm:text-base font-semibold text-gray-900 truncate',
  subtitle: 'text-xs sm:text-sm text-gray-600 truncate',
  body: 'text-sm text-gray-700 line-clamp-2',
  caption: 'text-xs text-gray-500 truncate'
} as const
