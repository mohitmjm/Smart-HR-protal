// Clock Out Action: Handles attendance clock-out operations

import { logger } from "../../utils/logger";
import { processClockOut } from "../../../services/attendanceService";

export interface ClockOutParams {
  userId: string;
  timestamp?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface ClockOutResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Execute clock-out action by calling the attendance service directly
 */
export async function executeClockOut(params: ClockOutParams): Promise<ClockOutResult> {
  try {
    logger.info('Executing clock-out', { userId: params.userId }, { 
      hasLocation: !!params.location 
    });

    // Call the attendance service directly (server-side)
    const result = await processClockOut({
      userId: params.userId,
      action: 'clock-out',
      notes: params.notes || '',
      location: params.location
    });

    if (!result.success) {
      logger.error('Clock-out failed', { userId: params.userId }, new Error(result.message));
      
      // If location is required, return a specific error that the client can handle
      if (result.code === 'LOCATION_REQUIRED') {
        return {
          success: false,
          message: 'Location permission is required to clock out. Please allow location access when prompted.',
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

    logger.info('Clock-out successful', { userId: params.userId });

    return {
      success: true,
      message: result.message,
      data: result.data
    };

  } catch (error) {
    logger.error('Clock-out error', { userId: params.userId }, error as Error);
    
    return {
      success: false,
      message: 'Failed to clock out. Please try again.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
}

export default executeClockOut;

