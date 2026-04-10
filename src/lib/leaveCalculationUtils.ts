/**
 * Shared Leave Calculation Utilities
 * Ensures consistent working days calculation between client and server
 */

import { TimezoneService } from './timezoneService'

export interface WorkingDaysConfig {
  workingDays: string[]
  holidays: Map<string, Array<{ name: string; date: string }>>
  userTimezone: string
}

export interface WorkingDaysResult {
  totalDays: number
  invalidDates: string[]
  isSameDay: boolean
}

/**
 * Calculate working days for a leave request
 * This function is used by both client and server to ensure consistency
 */
export function calculateWorkingDays(
  startDate: string, // YYYY-MM-DD format
  endDate: string,   // YYYY-MM-DD format
  config: WorkingDaysConfig
): WorkingDaysResult {
  const { workingDays, holidays, userTimezone } = config
  const workingDaysSet = new Set(workingDays)
  
  // Parse dates in user timezone
  const startDateObj = TimezoneService.parseDateStringInTimezone(startDate, userTimezone)
  const endDateObj = TimezoneService.parseDateStringInTimezone(endDate, userTimezone)
  
  // Check if same day
  const isSameDay = startDateObj.toDateString() === endDateObj.toDateString()
  
  // Helper to format YYYY-MM-DD in user's timezone
  const formatLocalYMD = (d: Date) => {
    const local = new Date(d.toLocaleString('en-CA', { timeZone: userTimezone }))
    const y = local.getFullYear()
    const m = String(local.getMonth() + 1).padStart(2, '0')
    const da = String(local.getDate()).padStart(2, '0')
    return `${y}-${m}-${da}`
  }

  // Map JS getDay() -> weekday name
  const weekdayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  
  let totalDays = 0
  const invalidDates: string[] = []

  if (isSameDay) {
    // Same-day leave: check if the single day is a working day
    const weekdayName = weekdayNames[startDateObj.getDay()]
    const ymd = formatLocalYMD(startDateObj)
    const yearKey = String(startDateObj.getFullYear())

    // Check holiday for that year
    let isHoliday = false
    const yearHolidays = holidays instanceof Map ? holidays.get(yearKey) : holidays?.[yearKey]
    if (Array.isArray(yearHolidays)) {
      isHoliday = yearHolidays.some(h => h.date === ymd)
    }

    // Check if it's a working day
    if (!workingDaysSet.has(weekdayName) || isHoliday) {
      invalidDates.push(ymd)
      totalDays = 0
    } else {
      totalDays = 1
    }
  } else {
    // Multi-day leave: iterate through each day (inclusive of both start and end)
    const currentDate = new Date(startDateObj)
    
    while (currentDate <= endDateObj) {
      const weekdayName = weekdayNames[currentDate.getDay()]
      const ymd = formatLocalYMD(currentDate)
      const yearKey = String(currentDate.getFullYear())

      // Check holiday for that year
      let isHoliday = false
      const yearHolidays = holidays instanceof Map ? holidays.get(yearKey) : holidays?.[yearKey]
      if (Array.isArray(yearHolidays)) {
        isHoliday = yearHolidays.some(h => h.date === ymd)
      }

      // Check if it's a working day
      if (!workingDaysSet.has(weekdayName) || isHoliday) {
        invalidDates.push(ymd)
      } else {
        totalDays++
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  return {
    totalDays,
    invalidDates,
    isSameDay
  }
}

/**
 * Validate that client and server calculations match
 * Used to ensure consistency between preview and final calculations
 */
export function validateCalculationConsistency(
  clientResult: WorkingDaysResult,
  serverResult: WorkingDaysResult,
  tolerance: number = 0.1
): { isValid: boolean; message?: string } {
  if (Math.abs(clientResult.totalDays - serverResult.totalDays) > tolerance) {
    return {
      isValid: false,
      message: `Calculation mismatch: Client calculated ${clientResult.totalDays} days, Server calculated ${serverResult.totalDays} days`
    }
  }

  if (clientResult.isSameDay !== serverResult.isSameDay) {
    return {
      isValid: false,
      message: `Same-day detection mismatch: Client=${clientResult.isSameDay}, Server=${serverResult.isSameDay}`
    }
  }

  return { isValid: true }
}

/**
 * Create working days configuration from system settings
 * Used by server to create config for calculation
 */
export function createWorkingDaysConfig(
  systemSettings: any,
  userTimezone: string
): WorkingDaysConfig {
  const workingDays = systemSettings.general?.workingDays || ['Monday','Tuesday','Wednesday','Thursday','Friday']
  const holidays = systemSettings.holidays || new Map()
  
  return {
    workingDays,
    holidays,
    userTimezone
  }
}
