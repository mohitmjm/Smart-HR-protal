'use client'

import React from 'react'
import { IconWrapperProps } from '@/lib/utils/iconUtils'
import { iconSizes, getIconSize } from '@/lib/utils/iconUtils'

/**
 * Icon wrapper for consistent sizing
 */
export const IconWrapper: React.FC<IconWrapperProps> = ({ 
  size = 'md', 
  responsive = true, 
  context,
  className = '',
  children 
}) => {
  const sizeClass = context ? getIconSize(context) : iconSizes[size]
  const responsiveClass = responsive ? sizeClass : iconSizes[size]
  
  return (
    <span className={`inline-flex items-center justify-center ${responsiveClass} ${className}`}>
      {children}
    </span>
  )
}
