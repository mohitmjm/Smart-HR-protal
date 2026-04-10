// Clock In Action: Handles attendance clock-in operations

import { logger } from "../../utils/logger";
import { processClockIn } from "../../../services/attendanceService";

export interface ClockInParams {
  userId: string;
  timestamp?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface ClockInResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Execute clock-in action by calling the attendance service directly
 */
export async function executeClockIn(params: ClockInParams): Promise<ClockInResult> {
  try {
    logger.info('Executing clock-in', { userId: params.userId }, { 
      hasLocation: !!params.location 
    });

    // Call the attendance service directly (server-side)
    const result = await processClockIn({
      userId: params.userId,
      action: 'clock-in',
      notes: params.notes || '',
      location: params.location
    });

    if (!result.success) {
      logger.error('Clock-in failed', { userId: params.userId }, new Error(result.message));
      
      // If location is required, return a specific error that the client can handle
      if (result.code === 'LOCATION_REQUIRED') {
        return {
          success: false,
          message: 'Location permission is required to clock in. Please allow location access when prompted.',
          error: 'LOCATION_REQUIRED',
          data: {
            requiresLocation: true,
            locationError: result.message
          }
        };
      }
      
      return {
        success: false,
        message: result.message,
        error: result.code || 'UNKNOWN_ERROR'
      };
    }

    logger.info('Clock-in successful', { userId: params.userId });

    return {
      success: true,
      message: result.message,
      data: result.data
    };

  } catch (error) {
    logger.error('Clock-in error', { userId: params.userId }, error as Error);
    
    return {
      success: false,
      message: 'Failed to clock in. Please try again.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
}

export default executeClockIn;

