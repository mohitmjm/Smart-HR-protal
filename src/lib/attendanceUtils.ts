/**
 * Attendance Calculation Utilities
 * Handles attendance status calculations based on system settings
 */

import { SettingsService } from './settingsService';
import { TimezoneService } from './timezoneService';

export interface AttendanceCalculationResult {
  status: 'absent' | 'half-day' | 'full-day' | 'late' | 'early-leave' | 'holiday' | 'weekly-off' | 'clock-out-missing' | 'present';
  totalHours: number;
  isLate: boolean;
  isEarlyLeave: boolean;
  isWorkingDay: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  lateThreshold: number;
  earlyLeaveThreshold: number;
}

export interface SessionData {
  clockIn: Date;
  clockOut?: Date;
  duration?: number;
}

/**
 * Check if a given date is a working day in a specific timezone
 */
export function isWorkingDay(date: Date, workingDays: string[], timezone: string): boolean {
  // Convert the date to the specified timezone to get the correct day
  const localDate = TimezoneService.fromUTCToTimezone(date, timezone);
  const dayName = localDate.toLocaleDateString('en-US', { weekday: 'long' });
  return workingDays.includes(dayName);
}

/**
 * Create a Date object from a date string (YYYY-MM-DD) in the user's timezone
 * This ensures the date is interpreted correctly regardless of timezone
 */
export function createDateInUserTimezone(dateString: string, userTimezone: string): Date {
  // Parse the date string components
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create a date at noon in the user's timezone to avoid boundary issues
  // This ensures the date is always interpreted as the correct day
  // We create the date in the user's timezone using fromZonedTime
  const userDate = new Date(year, month - 1, day, 12, 0, 0, 0);
  
  // Convert from user timezone to UTC for consistent storage
  // fromZonedTime treats userDate as being in userTimezone and converts to UTC
  return TimezoneService.fromTimezoneToUTC(userDate, userTimezone);
}

/**
 * Check if a given date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date, timezone: string): boolean {
  // Convert the date to the specified timezone to get the correct day
  const localDate = TimezoneService.fromUTCToTimezone(date, timezone);
  const dayOfWeek = localDate.getDay(); // 0 = Sunday, 6 = Saturday
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Check if a given date is today in the specified timezone
 */
export function isToday(date: Date, timezone: string): boolean {
  const localDate = TimezoneService.fromUTCToTimezone(date, timezone);
  const today = TimezoneService.fromUTCToTimezone(new Date(), timezone);
  
  return localDate.getFullYear() === today.getFullYear() &&
         localDate.getMonth() === today.getMonth() &&
         localDate.getDate() === today.getDate();
}

/**
 * Check if a given date is a holiday (timezone-aware)
 */
export async function isHoliday(date: Date, timezone: string): Promise<boolean> {
  try {
    const settings = await SettingsService.getSystemSettings();
    const holidays = settings.holidays;
    
    if (!holidays) {
      return false;
    }
    
    // Convert Mongoose Map to plain object if needed
    let holidaysObj = holidays;
    if (holidays instanceof Map) {
      holidaysObj = Object.fromEntries(holidays);
    }
    
    // Check if holidays object is empty
    if (Object.keys(holidaysObj).length === 0) {
      return false;
    }
    
    // Convert the date to the specified timezone to get the correct date
    const localDate = TimezoneService.fromUTCToTimezone(date, timezone);
    const year = localDate.getFullYear().toString();
    const dateString = TimezoneService.formatInTimezone(localDate, timezone, 'yyyy-MM-dd');
    
    // Check if the year has holidays defined
    const yearHolidays = holidaysObj[year];
    if (!yearHolidays || !Array.isArray(yearHolidays)) {
      return false;
    }
    
    // Check if the date matches any holiday
    return yearHolidays.some(holiday => holiday.date === dateString);
  } catch (error) {
    console.error('Error checking holiday:', error);
    return false;
  }
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if clock-in time is late (timezone-aware)
 */
export function isLateClockIn(clockInTime: Date, workingStartTime: string, lateThresholdMinutes: number, timezone: string): boolean {
  // Convert clock-in time to the specified timezone
  const localClockInTime = TimezoneService.fromUTCToTimezone(clockInTime, timezone);
  const clockInMinutes = localClockInTime.getHours() * 60 + localClockInTime.getMinutes();
  const startMinutes = timeToMinutes(workingStartTime);
  const thresholdMinutes = startMinutes + lateThresholdMinutes;
  
  return clockInMinutes > thresholdMinutes;
}

/**
 * Check if clock-out time is early (timezone-aware)
 */
export function isEarlyClockOut(clockOutTime: Date, workingEndTime: string, earlyLeaveThresholdMinutes: number, timezone: string): boolean {
  // Convert clock-out time to the specified timezone
  const localClockOutTime = TimezoneService.fromUTCToTimezone(clockOutTime, timezone);
  const clockOutMinutes = localClockOutTime.getHours() * 60 + localClockOutTime.getMinutes();
  const endMinutes = timeToMinutes(workingEndTime);
  const thresholdMinutes = endMinutes - earlyLeaveThresholdMinutes;
  
  return clockOutMinutes < thresholdMinutes;
}

/**
 * Calculate total hours from first clock-in to last clock-out
 * (ignoring break times and multiple sessions)
 * If user is still clocked in, calculate up to current time
 */
export function calculateTotalHours(sessions: SessionData[]): number {
  if (sessions.length === 0) return 0;
  
  // Find first clock-in
  const firstClockIn = new Date(Math.min(...sessions.map(s => new Date(s.clockIn).getTime())));
  
  // Find all sessions with clock-out times
  const sessionsWithClockOut = sessions.filter(s => s.clockOut);
  
  // If no clock-outs at all, return 0 hours (user hasn't clocked out)
  if (sessionsWithClockOut.length === 0) {
    return 0;
  }
  
  // Use the last (most recent) clock-out time
  const lastClockOut = sessionsWithClockOut.reduce((latest, current) => 
    new Date(current.clockOut!) > new Date(latest.clockOut!) ? current : latest
  ).clockOut;
  const endTime = new Date(lastClockOut!);
  
  const totalMs = endTime.getTime() - firstClockIn.getTime();
  const totalHours = totalMs / (1000 * 60 * 60);
  
  return Math.round(totalHours * 100) / 100; // Round to 2 decimal places
}

/**
 * Main attendance calculation function (timezone-aware)
 * NEW LOGIC:
 * - If today: Show present/late/clock-out-missing based on real-time status
 * - If historical day: Calculate based on hours worked (absent/half-day/full-day/early-leave)
 */
export async function calculateAttendanceStatus(
  sessions: SessionData[],
  date: Date,
  userTimezone: string
): Promise<AttendanceCalculationResult> {
  try {
    // Get system settings
    const settings = await SettingsService.getSystemSettings();
    const { workingDays, workingHours } = settings.general;
    const attendanceSettings = settings.attendance;

    // Check if it's a working day in the user's timezone
    const isWorking = isWorkingDay(date, workingDays, userTimezone);
    
    // Check if it's a holiday first (holidays take precedence over working days)
    const isHolidayDay = await isHoliday(date, userTimezone);
    
    // If it's a holiday, return holiday status regardless of working day status
    if (isHolidayDay) {
      return {
        status: 'holiday',
        totalHours: 0,
        isLate: false,
        isEarlyLeave: false,
        isWorkingDay: false,
        workingHours,
        lateThreshold: attendanceSettings.lateThreshold,
        earlyLeaveThreshold: attendanceSettings.earlyLeaveThreshold
      };
    }
    
    // If not a working day and not a holiday, check if it's a weekend
    if (!isWorking) {
      const isWeekendDay = isWeekend(date, userTimezone);
      return {
        status: isWeekendDay ? 'weekly-off' : 'holiday',
        totalHours: 0,
        isLate: false,
        isEarlyLeave: false,
        isWorkingDay: false,
        workingHours,
        lateThreshold: attendanceSettings.lateThreshold,
        earlyLeaveThreshold: attendanceSettings.earlyLeaveThreshold
      };
    }

    // If no sessions, return absent
    if (sessions.length === 0) {
      return {
        status: 'absent',
        totalHours: 0,
        isLate: false,
        isEarlyLeave: false,
        isWorkingDay: true,
        workingHours,
        lateThreshold: attendanceSettings.lateThreshold,
        earlyLeaveThreshold: attendanceSettings.earlyLeaveThreshold
      };
    }

    // Check if this is today
    const isTodayDate = isToday(date, userTimezone);
    
    if (isTodayDate) {
      // TODAY'S LOGIC: Real-time status based on clock-in/out
      const firstClockIn = new Date(Math.min(...sessions.map(s => new Date(s.clockIn).getTime())));
      const hasClockOut = sessions.some(s => s.clockOut);
      
      // Check if clocked in late
      const isLate = isLateClockIn(firstClockIn, workingHours.start, attendanceSettings.lateThreshold, userTimezone);
      
      if (!hasClockOut) {
        // Only clocked in, no clock out yet
        return {
          status: 'clock-out-missing',
          totalHours: 0,
          isLate,
          isEarlyLeave: false,
          isWorkingDay: true,
          workingHours,
          lateThreshold: attendanceSettings.lateThreshold,
          earlyLeaveThreshold: attendanceSettings.earlyLeaveThreshold
        };
      } else {
        // Clocked in and out - show as present or late
        return {
          status: isLate ? 'late' : 'present',
          totalHours: calculateTotalHours(sessions),
          isLate,
          isEarlyLeave: false,
          isWorkingDay: true,
          workingHours,
          lateThreshold: attendanceSettings.lateThreshold,
          earlyLeaveThreshold: attendanceSettings.earlyLeaveThreshold
        };
      }
    } else {
      // HISTORICAL DAY LOGIC: Calculate based on hours worked
      const totalHours = calculateTotalHours(sessions);
      
      // Check if user has any clock-outs
      const hasClockOut = sessions.some(s => s.clockOut);
      
      // If no clock-outs at all, return clock-out-missing status
      if (!hasClockOut) {
        return {
          status: 'clock-out-missing',
          totalHours: 0,
          isLate: false,
          isEarlyLeave: false,
          isWorkingDay: true,
          workingHours,
          lateThreshold: attendanceSettings.lateThreshold,
          earlyLeaveThreshold: attendanceSettings.earlyLeaveThreshold
        };
      }
      
      // Check for late clock-in and early clock-out using user timezone
      const firstClockIn = new Date(Math.min(...sessions.map(s => new Date(s.clockIn).getTime())));
      const lastClockOut = sessions.find(s => s.clockOut)?.clockOut;
      
      const isLate = isLateClockIn(firstClockIn, workingHours.start, attendanceSettings.lateThreshold, userTimezone);
      const isEarlyLeave = lastClockOut ? isEarlyClockOut(new Date(lastClockOut), workingHours.end, attendanceSettings.earlyLeaveThreshold, userTimezone) : false;

      // Determine status based on total hours for historical days
      let status: 'absent' | 'half-day' | 'full-day' | 'late' | 'early-leave' | 'clock-out-missing';
      
      if (totalHours < 4) {
        status = 'absent'; // Less than 4 hours = not present
      } else if (totalHours < 8) {
        status = 'half-day'; // Less than 8 hours = half day
      } else {
        status = 'full-day'; // 8+ hours = full day
      }

      // Override status for late/early cases if needed
      if (isLate && status !== 'absent') {
        status = 'late';
      }
      // Only apply early-leave status if they worked less than 8 hours
      // If they worked 8+ hours, they should be full-day regardless of clock-out time
      if (isEarlyLeave && status !== 'absent' && totalHours < 8) {
        status = 'early-leave';
      }

      return {
        status,
        totalHours,
        isLate,
        isEarlyLeave,
        isWorkingDay: true,
        workingHours,
        lateThreshold: attendanceSettings.lateThreshold,
        earlyLeaveThreshold: attendanceSettings.earlyLeaveThreshold
      };
    }

  } catch (error) {
    console.error('Error calculating attendance status:', error);
    // Fallback to basic calculation
    const totalHours = calculateTotalHours(sessions);
    let status: 'absent' | 'half-day' | 'full-day' | 'late' | 'early-leave' | 'holiday' | 'present';
    
    if (totalHours < 4) {
      status = 'absent';
    } else if (totalHours < 8) {
      status = 'half-day';
    } else {
      status = 'full-day';
    }

    return {
      status,
      totalHours,
      isLate: false,
      isEarlyLeave: false,
      isWorkingDay: true,
      workingHours: { start: '09:00', end: '17:00' },
      lateThreshold: 15,
      earlyLeaveThreshold: 15
    };
  }
}

/**
 * Get attendance status text for display
 */
export function getAttendanceStatusText(status: string): string {
  switch (status) {
    case 'absent':
      return 'Absent';
    case 'half-day':
      return 'Half Day';
    case 'full-day':
      return 'Full Day';
    case 'present':
      return 'Present';
    case 'late':
      return 'Late';
    case 'early-leave':
      return 'Early Leave';
    case 'holiday':
      return 'Holiday';
    case 'weekly-off':
      return 'Weekly Off';
    case 'clock-out-missing':
      return 'Clock-out Missing';
    default:
      return 'Unknown';
  }
}

/**
 * Get attendance status color for UI
 */
export function getAttendanceStatusColor(status: string): string {
  switch (status) {
    case 'absent':
      return 'text-red-600';
    case 'half-day':
      return 'text-yellow-600';
    case 'full-day':
      return 'text-green-600';
    case 'present':
      return 'text-green-600';
    case 'late':
      return 'text-orange-600';
    case 'early-leave':
      return 'text-blue-600';
    case 'holiday':
      return 'text-purple-600';
    case 'weekly-off':
      return 'text-indigo-600';
    case 'clock-out-missing':
      return 'text-amber-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Calculate monthly attendance statistics including all dates (holidays, weekends, leaves)
 * This function ensures that holidays, weekends, and leaves are counted for all dates in the month,
 * not just those with attendance records
 */
export async function calculateMonthlyAttendanceStats(
  year: number,
  month: number,
  userTimezone: string,
  attendanceRecords: any[] = []
): Promise<{
  totalDays: number;
  daysElapsed: number;
  fullDays: number;
  halfDays: number;
  presentDays: number;
  regularizedDays: number;
  holidayDays: number;
  weeklyOffDays: number;
  successfulDays: number;
  absentDays: number;
  totalHours: number;
}> {
  try {
    // Get system settings
    const settings = await SettingsService.getSystemSettings();
    const { workingDays } = settings.general;
    
    // Get the number of days in the month
    const totalDays = new Date(year, month, 0).getDate();
    
    // Calculate days elapsed so far in the current month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
    const currentDay = now.getDate();
    
    // If we're looking at the current month, use days elapsed so far
    // Otherwise, use total days in the month
    const daysElapsed = (year === currentYear && month === currentMonth) 
      ? currentDay 
      : totalDays;
    
    // Initialize counters
    let fullDays = 0;
    let halfDays = 0;
    let presentDays = 0;
    let regularizedDays = 0;
    let holidayDays = 0;
    let weeklyOffDays = 0;
    let totalHours = 0;
    
    // Create a map of attendance records by date for quick lookup
    const attendanceMap = new Map();
    attendanceRecords.forEach(record => {
      attendanceMap.set(record.date, record);
    });
    
    // Iterate through each day of the month up to daysElapsed only
    for (let day = 1; day <= daysElapsed; day++) {
      const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const date = createDateInUserTimezone(dateString, userTimezone);
      
      // Check if it's a holiday first (holidays take precedence)
      const isHolidayDay = await isHoliday(date, userTimezone);
      if (isHolidayDay) {
        holidayDays++;
        totalHours += 8; // 8 hours for holiday
        continue;
      }
      
      // Check if it's a weekend
      const isWeekendDay = isWeekend(date, userTimezone);
      if (isWeekendDay) {
        weeklyOffDays++;
        totalHours += 8; // 8 hours for weekend
        continue;
      }
      
      // Check if it's a working day
      const isWorkingDayDate = isWorkingDay(date, workingDays, userTimezone);
      if (!isWorkingDayDate) {
        // Non-working day that's not a holiday or weekend
        holidayDays++;
        totalHours += 8; // 8 hours for non-working day
        continue;
      }
      
      // It's a working day - check if there's an attendance record
      const attendanceRecord = attendanceMap.get(dateString);
      if (attendanceRecord) {
        // Count based on attendance record status
        switch (attendanceRecord.status) {
          case 'full-day':
            fullDays++;
            break;
          case 'half-day':
            halfDays++;
            break;
          case 'present':
            presentDays++;
            break;
          case 'regularized':
            regularizedDays++;
            break;
          // Note: We don't handle 'holiday' or 'weekly-off' status from attendance records
          // because holidays and weekends are already calculated above based on calendar
        }
        
        // Add actual hours worked (for working days with attendance)
        totalHours += attendanceRecord.totalHours || 0;
      }
      // If no attendance record for a working day, it's considered absent
      // (this will be counted in absentDays calculation below)
    }
    
    // Calculate successful days (all non-absent days)
    const successfulDays = fullDays + halfDays + presentDays + regularizedDays + holidayDays + weeklyOffDays;
    const absentDays = totalDays - successfulDays;
    
    return {
      totalDays,
      daysElapsed,
      fullDays,
      halfDays,
      presentDays,
      regularizedDays,
      holidayDays,
      weeklyOffDays,
      successfulDays,
      absentDays,
      totalHours: Math.round(totalHours * 100) / 100
    };
  } catch (error) {
    console.error('Error calculating monthly attendance stats:', error);
    // Return fallback data
    return {
      totalDays: 0,
      daysElapsed: 0,
      fullDays: 0,
      halfDays: 0,
      presentDays: 0,
      regularizedDays: 0,
      holidayDays: 0,
      weeklyOffDays: 0,
      successfulDays: 0,
      absentDays: 0,
      totalHours: 0
    };
  }
}
