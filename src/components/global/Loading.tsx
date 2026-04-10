'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { 
  loadingStates, 
  loadingAnimations, 
  loadingColors, 
  loadingPatterns,
  loadingComponents,
  loadingMessages,
  loadingUtils,
  getLoadingComponent,
  getLoadingPattern,
  getLoadingMessage
} from '@/lib/utils/loadingUtils'

interface LoadingProps {
  size?: keyof typeof loadingStates
  color?: keyof typeof loadingColors
  animation?: keyof typeof loadingAnimations
  pattern?: keyof typeof loadingPatterns
  message?: string
  showMessage?: boolean
  className?: string
  overlay?: boolean
  fullscreen?: boolean
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  color = 'primary',
  animation = 'spin',
  pattern = 'spinner',
  message,
  showMessage = false,
  className,
  overlay = false,
  fullscreen = false
}) => {
  const spinnerClass = cn(
    loadingStates[size],
    loadingColors[color],
    loadingAnimations[animation],
    className
  )
  
  const patternClass = getLoadingPattern(pattern, 'base')
  const displayMessage = message || getLoadingMessage('generic')
  
  if (overlay) {
    return (
      <div className={cn(
        'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
        fullscreen && 'bg-white bg-opacity-90'
      )}>
        <div className="flex flex-col items-center space-y-4">
          <div className={cn(spinnerClass, patternClass)} />
          {showMessage && (
            <p className="text-white text-sm font-medium">
              {displayMessage}
            </p>
          )}
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className={cn(spinnerClass, patternClass)} />
      {showMessage && (
        <p className="text-gray-600 text-sm font-medium">
          {displayMessage}
        </p>
      )}
    </div>
  )
}

interface LoadingButtonProps {
  loading?: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
  disabled?: boolean
  onClick?: () => void
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  children,
  loadingText = 'Loading...',
  className,
  disabled = false,
  onClick
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200',
        loading && 'opacity-50 pointer-events-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {loading ? loadingText : children}
    </button>
  )
}

interface LoadingCardProps {
  loading?: boolean
  children: React.ReactNode
  className?: string
  skeleton?: boolean
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  loading = false,
  children,
  className,
  skeleton = false
}) => {
  if (loading && skeleton) {
    return (
      <div className={cn(
        'animate-pulse bg-white rounded-lg border border-gray-200 p-6',
        className
      )}>
        <div className="animate-pulse bg-gray-200 rounded h-6 mb-4" />
        <div className="animate-pulse bg-gray-200 rounded h-4 mb-2" />
        <div className="animate-pulse bg-gray-200 rounded h-4 mb-2" />
        <div className="animate-pulse bg-gray-200 rounded h-4" />
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className={cn(
        'flex items-center justify-center p-6',
        className
      )}>
        <Loading size="md" showMessage={true} message="Loading..." />
      </div>
    )
  }
  
  return <div className={className}>{children}</div>
}

interface LoadingTableProps {
  loading?: boolean
  children: React.ReactNode
  className?: string
  rows?: number
}

export const LoadingTable: React.FC<LoadingTableProps> = ({
  loading = false,
  children,
  className,
  rows = 5
}) => {
  if (loading) {
    return (
      <div className={cn(
        'animate-pulse bg-white rounded-lg border border-gray-200 overflow-hidden',
        className
      )}>
        <div className="animate-pulse bg-gray-200 rounded h-8 mb-4" />
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="animate-pulse bg-gray-200 rounded h-6 mb-2" />
        ))}
      </div>
    )
  }
  
  return <div className={className}>{children}</div>
}

interface LoadingListProps {
  loading?: boolean
  children: React.ReactNode
  className?: string
  items?: number
}

export const LoadingList: React.FC<LoadingListProps> = ({
  loading = false,
  children,
  className,
  items = 5
}) => {
  if (loading) {
    return (
      <div className={cn(
        'animate-pulse bg-white rounded-lg border border-gray-200 p-4',
        className
      )}>
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3 mb-3">
            <div className="animate-pulse bg-gray-200 rounded-full h-8 w-8" />
            <div className="animate-pulse bg-gray-200 rounded h-4 flex-1" />
          </div>
        ))}
      </div>
    )
  }
  
  return <div className={className}>{children}</div>
}

interface LoadingFormProps {
  loading?: boolean
  children: React.ReactNode
  className?: string
  fields?: number
}

export const LoadingForm: React.FC<LoadingFormProps> = ({
  loading = false,
  children,
  className,
  fields = 3
}) => {
  if (loading) {
    return (
      <div className={cn(
        'animate-pulse bg-white rounded-lg border border-gray-200 p-6',
        className
      )}>
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="mb-4">
            <div className="animate-pulse bg-gray-200 rounded h-4 mb-2" />
            <div className="animate-pulse bg-gray-200 rounded h-10" />
          </div>
        ))}
        <div className="animate-pulse bg-gray-200 rounded h-10" />
      </div>
    )
  }
  
  return <div className={className}>{children}</div>
}

interface LoadingOverlayProps {
  loading?: boolean
  children: React.ReactNode
  message?: string
  className?: string
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading = false,
  children,
  message = 'Loading...',
  className
}) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <Loading size="lg" showMessage={true} message={message} />
        </div>
      )}
    </div>
  )
}

interface LoadingSkeletonProps {
  className?: string
  lines?: number
  avatar?: boolean
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  lines = 3,
  avatar = false
}) => {
  return (
    <div className={cn('animate-pulse', className)}>
      {avatar && (
        <div className="animate-pulse bg-gray-200 rounded-full h-8 w-8 mb-4" />
      )}
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="animate-pulse bg-gray-200 rounded h-4 mb-2" />
      ))}
    </div>
  )
}

export default Loading
