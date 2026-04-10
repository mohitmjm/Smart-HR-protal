/**
 * Date Query Utilities
 * Provides consistent date query handling for different field types
 */

import { TimezoneService } from './timezoneService'
import { fromZonedTime } from 'date-fns-tz'

export interface DateQueryOptions {
  timezone?: string
  includeTime?: boolean
}

/**
 * Convert a Date object to YYYY-MM-DD string format
 */
export function dateToDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Convert a Date object to YYYY-MM-DD string format in a specific timezone
 */
export function dateToDateStringInTimezone(date: Date, timezone: string): string {
  return TimezoneService.formatInTimezone(date, timezone, 'yyyy-MM-dd')
}

/**
 * Get today's date as YYYY-MM-DD string in a specific timezone
 */
export function getTodayDateString(timezone: string): string {
  return TimezoneService.getTodayDateStringInTimezone(timezone)
}

/**
 * Get a date N days ago as YYYY-MM-DD string in a specific timezone
 */
export function getDaysAgoDateString(days: number, timezone: string): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return dateToDateStringInTimezone(date, timezone)
}

/**
 * Create a date range query for string date fields (like Attendance.date)
 */
export function createStringDateRangeQuery(
  startDate: Date | string,
  endDate: Date | string | undefined,
  timezone: string
): { $gte: string; $lte?: string } | string {
  const startStr = typeof startDate === 'string' 
    ? startDate 
    : dateToDateStringInTimezone(startDate, timezone)
  
  if (!endDate) {
    return startStr
  }
  
  const endStr = typeof endDate === 'string' 
    ? endDate 
    : dateToDateStringInTimezone(endDate, timezone)
  
  return {
    $gte: startStr,
    $lte: endStr
  }
}

/**
 * Create a date range query for Date fields (like Leave.startDate, Leave.endDate)
 */
export function createDateRangeQuery(
  startDate: Date | string,
  endDate?: Date | string
): { $gte: Date; $lte?: Date } | Date {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  
  if (!endDate) {
    return start
  }
  
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  
  return {
    $gte: start,
    $lte: end
  }
}

/**
 * Create a "today" query for string date fields
 */
export function createTodayStringQuery(timezone: string): string {
  return getTodayDateString(timezone)
}

/**
 * Create a "today" query for Date fields
 */
export function createTodayDateQuery(timezone: string): { $gte: Date; $lt: Date } {
  const today = TimezoneService.getTodayInTimezone(timezone)
  const year = today.getFullYear()
  const month = today.getMonth()
  const day = today.getDate()
  
  // Create start and end of day in the target timezone using fromZonedTime
  const startOfDay = fromZonedTime(new Date(year, month, day, 0, 0, 0, 0), timezone)
  const endOfDay = fromZonedTime(new Date(year, month, day, 23, 59, 59, 999), timezone)
  
  return {
    $gte: startOfDay,
    $lt: endOfDay
  }
}

/**
 * Create a "last N days" query for string date fields
 */
export function createLastDaysStringQuery(days: number, timezone: string): { $gte: string } {
  return {
    $gte: getDaysAgoDateString(days, timezone)
  }
}

/**
 * Create a "last N days" query for Date fields
 */
export function createLastDaysDateQuery(days: number, timezone: string): { $gte: Date } {
  const daysAgo = new Date()
  daysAgo.setDate(daysAgo.getDate() - days)
  return {
    $gte: daysAgo
  }
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString
}

/**
 * Get month boundaries as date strings for a given date
 */
export function getMonthBoundaries(date: Date, timezone: string): { start: string; end: string } {
  const localDate = TimezoneService.fromUTCToTimezone(date, timezone)
  const year = localDate.getFullYear()
  const month = localDate.getMonth()
  
  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 0)
  
  return {
    start: dateToDateStringInTimezone(startOfMonth, timezone),
    end: dateToDateStringInTimezone(endOfMonth, timezone)
  }
}

/**
 * Get week boundaries as date strings for a given date
 */
export function getWeekBoundaries(date: Date, timezone: string): { start: string; end: string } {
  const localDate = TimezoneService.fromUTCToTimezone(date, timezone)
  const dayOfWeek = localDate.getDay()
  const startOfWeek = new Date(localDate)
  startOfWeek.setDate(localDate.getDate() - dayOfWeek)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  
  return {
    start: dateToDateStringInTimezone(startOfWeek, timezone),
    end: dateToDateStringInTimezone(endOfWeek, timezone)
  }
}
