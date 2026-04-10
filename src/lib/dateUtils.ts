/**
 * Date utility functions to handle timezone-safe date operations
 */

import { TimezoneService } from './timezoneService'

/**
 * Get date-only string in YYYY-MM-DD format from a Date object
 * This ensures we're working with date parts only, avoiding timezone issues
 */
export function getDateOnlyString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  return getDateOnlyString(new Date())
}

/**
 * Create a Date object from a date string (YYYY-MM-DD) at midnight UTC
 * This ensures consistent date handling without timezone issues
 */
export function createDateFromString(dateString: string): Date {
  // This function should be deprecated in favor of TimezoneService.parseDateStringInTimezone
  // For now, parse as UTC to maintain existing behavior
  return new Date(dateString + 'T00:00:00.000Z')
}

/**
 * Calculate the difference in days between two dates (date parts only)
 * Returns positive number if date1 is after date2
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  const date1Only = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const date2Only = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
  return Math.floor((date1Only.getTime() - date2Only.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Check if a date string is within the cutoff period from today
 */
export function isWithinCutoffPeriod(dateString: string, cutoffDays: number): boolean {
  const today = new Date()
  const targetDate = createDateFromString(dateString)
  const daysDifference = getDaysDifference(today, targetDate)
  return daysDifference <= cutoffDays
}

/**
 * Check if a date string is within the cutoff period from today (timezone-aware)
 */
export function isWithinCutoffPeriodInTimezone(dateString: string, cutoffDays: number, userTimezone: string): boolean {
  const today = TimezoneService.getTodayInTimezone(userTimezone)
  const targetDate = createDateFromString(dateString)
  const daysDifference = getDaysDifference(today, targetDate)
  return daysDifference <= cutoffDays
}
