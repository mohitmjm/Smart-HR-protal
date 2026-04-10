/**
 * useTimezone Hook
 * Provides easy access to timezone functions and state
 */

import { useTimezone as useTimezoneContext } from '../contexts/TimezoneContext'

/**
 * Hook to access timezone context
 * This is a re-export for convenience and can be extended with additional logic
 */
export function useTimezone() {
  return useTimezoneContext()
}

/**
 * Hook for timezone-aware date formatting
 * Returns formatting functions that use the current user timezone
 */
export function useTimezoneFormatting() {
  const { timezone, formatDate, formatTime, formatDateString, formatTimeWithOffset } = useTimezoneContext()
  
  return {
    timezone,
    formatDate,
    formatTime,
    formatDateString,
    formatTimeWithOffset,
  }
}

/**
 * Hook for timezone-aware date operations
 * Returns date operation functions that use the current user timezone
 */
export function useTimezoneDateOperations() {
  const { timezone, getToday, isToday, isSameDay, getDayBoundaries } = useTimezoneContext()
  
  return {
    timezone,
    getToday,
    isToday,
    isSameDay,
    getDayBoundaries,
  }
}

/**
 * Hook for timezone state management
 * Returns timezone state and control functions
 */
export function useTimezoneState() {
  const { timezone, isLoading, error, setTimezone, refreshTimezone } = useTimezoneContext()
  
  return {
    timezone,
    isLoading,
    error,
    setTimezone,
    refreshTimezone,
  }
}
