'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useDevSafeUser } from '../hooks/useDevSafeClerk'
import { TimezoneService } from '../timezoneService'
import { logger } from '../logger'

interface TimezoneContextType {
  // State
  timezone: string
  isLoading: boolean
  timezoneReady: boolean
  error: string | null
  
  // Actions
  setTimezone: (timezone: string) => void
  refreshTimezone: () => Promise<void>
  
  // Utilities
  formatDate: (date: Date, format?: string) => string
  formatTime: (date: Date, format?: string) => string
  getToday: () => Date
  isToday: (date: Date) => boolean
  formatDateString: (dateString: string, format?: string) => string
  getTodayDateString: () => string
  isSameDay: (date1: Date, date2: Date) => boolean
  getDayBoundaries: (date: Date) => { start: Date, end: Date }
  formatTimeWithOffset: (date: Date, format?: string) => string
  parseDateString: (dateString: string) => Date
  safeFormatDate: (dateString: string, format?: string) => string
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined)

interface TimezoneProviderProps {
  children: ReactNode
}

export function TimezoneProvider({ children }: TimezoneProviderProps) {
  const { user, isLoaded } = useDevSafeUser()
  const [timezone, setTimezoneState] = useState<string>('Asia/Kolkata')
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [timezoneReady, setTimezoneReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPortalSubdomain, setIsPortalSubdomain] = useState(false)

  // Check if we're on portal subdomain
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const isPortal = hostname === 'portal.inovatrix.io' || hostname.includes('portal.inovatrix')
      setIsPortalSubdomain(isPortal)
    }
  }, [])

  // Initialize client-side
  useEffect(() => {
    setIsClient(true)
    // Don't set browser timezone immediately - wait for profile timezone first
  }, [])

  // Fetch user timezone from API - Profile-first approach
  const fetchUserTimezone = useCallback(async () => {
    if (!user || !isLoaded) {
      return
    }
    
    try {
      setIsLoading(true)
      setTimezoneReady(false)
      setError(null)
      
      // Fetch user timezone from API
      const response = await fetch('/api/user/timezone')
      if (response.ok) {
        const data = await response.json()
        const userTimezone = data.timezone
        
        // Use profile timezone (UTC is valid and correct)
        if (userTimezone && TimezoneService.isValidTimezone(userTimezone)) {
          setTimezoneState(userTimezone)
        } else {
          // No valid timezone in profile - default to IST
          setTimezoneState('Asia/Kolkata')
        }
      } else {
        throw new Error('Failed to fetch timezone')
      }
    } catch (error) {
      logger.error('Error fetching user timezone', { error: error instanceof Error ? error.message : String(error) })
      setError(error instanceof Error ? error.message : 'Failed to fetch timezone')
      // Fallback to IST if there's an error
      setTimezoneState('Asia/Kolkata')
    } finally {
      setIsLoading(false)
      // Set timezoneReady to true only after the complete fetch/PUT flow finishes
      setTimezoneReady(true)
    }
  }, [user, isLoaded, isPortalSubdomain, timezone])

  // Initialize timezone on mount and when user changes
  useEffect(() => {
    if (isLoaded && isClient && user) {
      fetchUserTimezone()
    } else if (isLoaded && isClient && !user) {
      // Not authenticated - use IST as default
      setTimezoneState('Asia/Kolkata')
      setTimezoneReady(true)
      setIsLoading(false)
    }
  }, [isLoaded, isClient, isPortalSubdomain, user, fetchUserTimezone])

  // Set timezone and update profile via API
  const setTimezone = useCallback(async (newTimezone: string) => {
    if (!isPortalSubdomain) {
      // Don't allow timezone changes on non-portal subdomains
      return
    }
    
    if (!TimezoneService.isValidTimezone(newTimezone)) {
      setError('Invalid timezone')
      return
    }

    setTimezoneState(newTimezone)
    setError(null)
    setTimezoneReady(false)

    // Update timezone via API
    if (user) {
      try {
        const response = await fetch('/api/user/timezone', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timezone: newTimezone })
        })
        
        if (!response.ok) {
          throw new Error('Failed to update timezone')
        }
        
        // Set timezoneReady to true after successful API update
        setTimezoneReady(true)
      } catch (error) {
        console.error('Error updating timezone:', error)
        setError('Failed to save timezone preference. Please try again.')
        // Revert timezone change on API failure
        setTimezoneState(timezone)
        setTimezoneReady(true) // Still ready even if update failed
      }
    } else {
      setTimezoneReady(true) // Ready if no user (shouldn't happen)
    }
  }, [user, timezone, isPortalSubdomain])

  // Refresh timezone from profile
  const refreshTimezone = useCallback(async () => {
    if (isPortalSubdomain) {
      await fetchUserTimezone()
    }
  }, [fetchUserTimezone, isPortalSubdomain])

  // Utility functions using the current timezone
  const formatDate = useCallback((date: Date, format: string = 'PPP') => {
    return TimezoneService.formatInTimezone(date, timezone, format)
  }, [timezone])

  const formatTime = useCallback((date: Date, format: string = 'HH:mm:ss') => {
    return TimezoneService.formatInTimezone(date, timezone, format)
  }, [timezone])

  const getToday = useCallback(() => {
    return TimezoneService.getTodayInTimezone(timezone)
  }, [timezone])

  const isToday = useCallback((date: Date) => {
    return TimezoneService.isTodayInTimezone(date, timezone)
  }, [timezone])

  const formatDateString = useCallback((dateString: string, format: string = 'PPP') => {
    return TimezoneService.formatDateStringInTimezone(dateString, timezone, format)
  }, [timezone])

  const getTodayDateString = useCallback(() => {
    const dateString = TimezoneService.getTodayDateStringInTimezone(timezone)
    return dateString
  }, [timezone])

  const isSameDay = useCallback((date1: Date, date2: Date) => {
    return TimezoneService.isSameDayInTimezone(date1, date2, timezone)
  }, [timezone])

  const getDayBoundaries = useCallback((date: Date) => {
    return TimezoneService.getDayBoundariesInTimezone(date, timezone)
  }, [timezone])

  const formatTimeWithOffset = useCallback((date: Date, format: string = 'yyyy-MM-dd HH:mm:ss') => {
    return TimezoneService.formatTimeWithOffset(date, timezone, format)
  }, [timezone])

  const parseDateString = useCallback((dateString: string) => {
    return TimezoneService.parseDateStringInTimezone(dateString, timezone)
  }, [timezone])

  const safeFormatDate = useCallback((dateString: string, format: string = 'PPP') => {
    try {
      if (!dateString || dateString === 'Invalid Date' || dateString === 'null' || dateString === 'undefined') {
        return 'Invalid Date'
      }
      
      const date = TimezoneService.parseDateStringInTimezone(dateString, timezone)
      return TimezoneService.formatInTimezone(date, timezone, format)
    } catch (error) {
      console.error('Error in safeFormatDate:', { dateString, error })
      return 'Invalid Date'
    }
  }, [timezone])

  const value: TimezoneContextType = {
    timezone,
    isLoading,
    timezoneReady,
    error,
    setTimezone,
    refreshTimezone,
    formatDate,
    formatTime,
    getToday,
    isToday,
    formatDateString,
    getTodayDateString,
    isSameDay,
    getDayBoundaries,
    formatTimeWithOffset,
    parseDateString,
    safeFormatDate,
  }

  return (
    <TimezoneContext.Provider value={value}>
      {!timezoneReady ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Setting up your timezone...</h2>
            <p className="text-gray-600">Please wait while we configure your timezone settings</p>
          </div>
        </div>
      ) : (
        children
      )}
    </TimezoneContext.Provider>
  )
}

export function useTimezone() {
  const context = useContext(TimezoneContext)
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider')
  }
  return context
}
