'use client'

import React from 'react'
import Image from 'next/image'
import { useProfilePhoto } from '@/lib/hooks/useProfilePhoto'
import { UserIcon } from '@heroicons/react/24/outline'

interface ProfilePhotoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showFallback?: boolean
  fallbackIcon?: React.ReactNode
}

const sizeConfig = {
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4' },
  md: { container: 'w-12 h-12', icon: 'w-6 h-6' },
  lg: { container: 'w-16 h-16', icon: 'w-8 h-8' },
  xl: { container: 'w-24 h-24', icon: 'w-12 h-12' }
}

export default function ProfilePhoto({ 
  size = 'md', 
  className = '',
  showFallback = true,
  fallbackIcon
}: ProfilePhotoProps) {
  const { profilePhotoUrl, isLoading, error, hasProfilePhoto } = useProfilePhoto()

  if (isLoading) {
    return (
      <div className={`${sizeConfig[size].container} ${className} rounded-full bg-gray-200 animate-pulse flex items-center justify-center`}>
        <div className="w-1/2 h-1/2 bg-gray-300 rounded-full"></div>
      </div>
    )
  }

  if (error || !hasProfilePhoto) {
    if (!showFallback) return null
    
    return (
      <div className={`${sizeConfig[size].container} ${className} rounded-full bg-gray-200 flex items-center justify-center`}>
        {fallbackIcon || <UserIcon className={`${sizeConfig[size].icon} text-gray-500`} />}
      </div>
    )
  }

  return (
    <div className={`${sizeConfig[size].container} ${className} rounded-full overflow-hidden`}>
      <Image
        src={profilePhotoUrl!}
        alt="Profile Photo"
        width={sizeConfig[size].container.includes('w-8') ? 32 : 
               sizeConfig[size].container.includes('w-12') ? 48 :
               sizeConfig[size].container.includes('w-16') ? 64 : 96}
        height={sizeConfig[size].container.includes('w-8') ? 32 : 
                sizeConfig[size].container.includes('w-12') ? 48 :
                sizeConfig[size].container.includes('w-16') ? 64 : 96}
        className="w-full h-full object-cover"
        onError={(e) => {
          console.error('Profile photo failed to load:', e)
        }}
      />
    </div>
  )
}
