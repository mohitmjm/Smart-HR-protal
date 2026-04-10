'use client'

import { useState, useEffect } from 'react'
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';
import { getProfilePhotoUrls } from '../profilePhotoUtils'

interface UseProfilePhotoReturn {
  profilePhotoUrl: string | null
  isLoading: boolean
  error: string | null
  hasProfilePhoto: boolean
  refreshProfilePhoto: () => void
}

/**
 * Hook for managing user profile photos
 * Automatically handles loading and fallback for profile photos
 */
export function useProfilePhoto(): UseProfilePhotoReturn {
  const { user } = useUser()
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkProfilePhoto = async () => {
    if (!user?.id) {
      setProfilePhotoUrl(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Try different extensions to find the user's profile photo
      const possibleUrls = getProfilePhotoUrls()
      
      for (const url of possibleUrls) {
        try {
          const response = await fetch(url, { method: 'HEAD' })
          if (response.ok) {
            setProfilePhotoUrl(url)
            setIsLoading(false)
            return
          }
        } catch (err) {
          // Continue to next URL
        }
      }

      // No profile photo found
      setProfilePhotoUrl(null)
      setIsLoading(false)
    } catch (err) {
      setError('Failed to load profile photo')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkProfilePhoto()
  }, [user?.id, checkProfilePhoto])

  const refreshProfilePhoto = () => {
    checkProfilePhoto()
  }

  return {
    profilePhotoUrl,
    isLoading,
    error,
    hasProfilePhoto: !!profilePhotoUrl,
    refreshProfilePhoto
  }
}
