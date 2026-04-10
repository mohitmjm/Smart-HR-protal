// Attendance Service: Direct business logic for attendance operations
// Used by both API routes and action nodes

import connectDB from '../mongodb';
import Attendance, { IAttendanceSession } from '../../models/Attendance';
import UserProfile from '../../models/UserProfile';
import { TimezoneService } from '../timezoneService';
import SettingsService from '../settingsService';
import { calculateAttendanceStatus } from '../attendanceUtils';
import mongoose from 'mongoose';

export interface AttendanceActionParams {
  userId: string;
  action: 'clock-in' | 'clock-out';
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface AttendanceActionResult {
  success: boolean;
  message: string;
  code?: string;
  data?: any;
}

/**
 * Process clock-in action
 */
export async function processClockIn(params: AttendanceActionParams): Promise<AttendanceActionResult> {
  const { userId, notes, location } = params;

  try {
    await connectDB();

    // Read attendance configuration to enforce geo policy
    const attendanceConfig = await SettingsService.getAttendanceConfig();

    // Enforce location if required by admin settings
    if (attendanceConfig?.geoLocationRequired) {
      const hasValidLocation = !!(location && location.latitude && location.longitude);
      if (!hasValidLocation) {
        return {
          success: false,
          code: 'LOCATION_REQUIRED',
          message: 'Location is required to clock in as per admin settings.'
        };
      }
    }

    // Get user profile to determine timezone
    const userProfile = await UserProfile.findOne({ clerkUserId: userId });
    if (!userProfile) {
      return {
        success: false,
        message: 'User profile not found'
      };
    }

    // Get current time in UTC for storage
    const currentTimeUTC = new Date();
    
    // Calculate date based on the actual event time in user's timezone
    const currentLocalDate = TimezoneService.formatInTimezone(currentTimeUTC, userProfile.timezone, 'yyyy-MM-dd');
    
    // Search for existing attendance record for this date
    let attendance = await Attendance.findOne({
      userId,
      date: currentLocalDate
    });
    
    if (!attendance) {
      // Create new attendance record
      attendance = new Attendance({
        userId,
        date: currentLocalDate,
        clockIn: currentTimeUTC,
        totalHours: 0,
        status: 'half-day',
        notes: notes || '',
        sessions: []
      });
    }
    
    // Check if there's an open session (clocked in but not clocked out)
    const hasOpenSession = attendance.sessions.some((session: IAttendanceSession) => !session.clockOut);
    
    if (hasOpenSession) {
      return {
        success: false,
        code: 'ALREADY_CLOCKED_IN',
        message: 'You are already clocked in. Please clock out before clocking in again.'
      };
    }
    
    // Add new session
    attendance.sessions.push({
      _id: new mongoose.Types.ObjectId().toString(),
      clockIn: currentTimeUTC,
      clockOut: null as any,
      totalHours: 0,
      notes: notes || '',
      clockInLocation: location ? {
        latitude: location.latitude,
        longitude: location.longitude
      } : undefined
    });
    
    // Calculate attendance status (e.g., late, on-time)
    const sessionDataForCalc = attendance.sessions.map((session: IAttendanceSession) => ({
      clockIn: session.clockIn,
      clockOut: session.clockOut,
      duration: session.duration
    }));
    
    const dateForCalculation = TimezoneService.parseDateStringInTimezone(attendance.date, userProfile.timezone);
    const attendanceResult = await calculateAttendanceStatus(
      sessionDataForCalc,
      dateForCalculation,
      userProfile.timezone
    );
    
    attendance.status = attendanceResult.status;
    attendance.totalHours = attendanceResult.totalHours;
    
    await attendance.save();
    
    return {
      success: true,
      message: 'Successfully clocked in',
      data: {
        date: currentLocalDate,
        clockIn: currentTimeUTC,
        timezone: userProfile.timezone
      }
    };

  } catch (error) {
    console.error('Clock-in processing error:', error);
    return {
      success: false,
      message: 'Failed to process clock-in',
      code: 'SERVER_ERROR'
    };
  }
}

/**
 * Process clock-out action
 */
export async function processClockOut(params: AttendanceActionParams): Promise<AttendanceActionResult> {
  const { userId, notes, location } = params;

  try {
    await connectDB();

    // Read attendance configuration
    const attendanceConfig = await SettingsService.getAttendanceConfig();

    // Enforce location if required
    if (attendanceConfig?.geoLocationRequired) {
      const hasValidLocation = !!(location && location.latitude && location.longitude);
      if (!hasValidLocation) {
        return {
          success: false,
          code: 'LOCATION_REQUIRED',
          message: 'Location is required to clock out as per admin settings.'
        };
      }
    }

    // Get user profile
    const userProfile = await UserProfile.findOne({ clerkUserId: userId });
    if (!userProfile) {
      return {
        success: false,
        message: 'User profile not found'
      };
    }

    const currentTimeUTC = new Date();
    const currentLocalDate = TimezoneService.formatInTimezone(currentTimeUTC, userProfile.timezone, 'yyyy-MM-dd');
    
    // Find attendance record
    const attendance = await Attendance.findOne({
      userId,
      date: currentLocalDate
    });
    
    if (!attendance) {
      return {
        success: false,
        code: 'NOT_CLOCKED_IN',
        message: 'No clock-in record found for today. Please clock in first.'
      };
    }
    
    // Find the last open session
    const openSession = attendance.sessions.find((session: IAttendanceSession) => !session.clockOut);
    
    if (!openSession) {
      return {
        success: false,
        code: 'NOT_CLOCKED_IN',
        message: 'You are not currently clocked in. Please clock in first.'
      };
    }
    
    // Clock out the open session
    openSession.clockOut = currentTimeUTC;
    // Calculate hours between clock-in and clock-out
    const milliseconds = currentTimeUTC.getTime() - openSession.clockIn.getTime();
    openSession.totalHours = Number((milliseconds / (1000 * 60 * 60)).toFixed(2));
    if (notes) {
      openSession.notes = openSession.notes ? `${openSession.notes}; ${notes}` : notes;
    }
    if (location) {
      openSession.clockOutLocation = {
        latitude: location.latitude,
        longitude: location.longitude
      };
    }
    
    // Update overall attendance record
    attendance.clockOut = currentTimeUTC;
    attendance.totalHours = attendance.sessions.reduce(
      (total: number, session: IAttendanceSession) => total + (session.duration || 0),
      0
    );
    
    // Calculate attendance status using the correct function signature
    const sessionDataForCalc = attendance.sessions.map((session: IAttendanceSession) => ({
      clockIn: session.clockIn,
      clockOut: session.clockOut,
      duration: session.duration
    }));
    
    const dateForCalculation = TimezoneService.parseDateStringInTimezone(attendance.date, userProfile.timezone);
    const attendanceResult = await calculateAttendanceStatus(
      sessionDataForCalc,
      dateForCalculation,
      userProfile.timezone
    );
    
    attendance.status = attendanceResult.status;
    attendance.totalHours = attendanceResult.totalHours;
    
    await attendance.save();
    
    return {
      success: true,
      message: 'Successfully clocked out',
      data: {
        date: currentLocalDate,
        clockOut: currentTimeUTC,
        totalHours: attendance.totalHours,
        status: attendance.status,
        timezone: userProfile.timezone
      }
    };

  } catch (error) {
    console.error('Clock-out processing error:', error);
    return {
      success: false,
      message: 'Failed to process clock-out',
      code: 'SERVER_ERROR'
    };
  }
}

/**
 * Main attendance action processor
 */
export async function processAttendanceAction(params: AttendanceActionParams): Promise<AttendanceActionResult> {
  if (params.action === 'clock-in') {
    return processClockIn(params);
  } else if (params.action === 'clock-out') {
    return processClockOut(params);
  } else {
    return {
      success: false,
      message: 'Invalid action. Use "clock-in" or "clock-out"'
    };
  }
}

