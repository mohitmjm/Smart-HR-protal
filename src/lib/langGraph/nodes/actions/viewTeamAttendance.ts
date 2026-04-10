// View Team Attendance Action: Navigates to attendance page with team view

import { logger } from "../../utils/logger";

export interface ViewTeamAttendanceParams {
  userId: string;
  dateRange?: string; // 'today' or 'month'
}

export interface ViewTeamAttendanceResult {
  success: boolean;
  message: string;
  data?: {
    destination: string;
    action: string;
    view: string;
    dateRange: string;
    monthName?: string;
    autoSwitchToTeam: boolean;
  };
  error?: string;
}

/**
 * Execute view team attendance action by navigating to attendance page
 * with team view and appropriate date range
 */
export async function executeViewTeamAttendance(params: ViewTeamAttendanceParams): Promise<ViewTeamAttendanceResult> {
  try {
    logger.info('Executing view team attendance navigation', { userId: params.userId }, { 
      dateRange: params.dateRange 
    });

    // Determine date range and extract month name if provided
    let dateRange: 'today' | 'month' = 'today';
    let monthName: string | undefined;
    
    if (params.dateRange) {
      const rangeStr = params.dateRange.trim();
      const rangeStrLower = rangeStr.toLowerCase();
      
      // Check if it's a specific month name
      const monthRegex = /^(january|february|march|april|may|june|july|august|september|october|november|december)$/i;
      if (monthRegex.test(rangeStr)) {
        dateRange = 'month';
        // Capitalize first letter for proper month name
        monthName = rangeStr.charAt(0).toUpperCase() + rangeStr.slice(1).toLowerCase();
      }
      // Check if it contains "month" keyword
      else if (rangeStrLower.includes('month') || rangeStrLower === 'month') {
        dateRange = 'month';
        // Don't set monthName - will default to current month in component
      }
      // Check if it's today
      else if (rangeStrLower === 'today') {
        dateRange = 'today';
      }
    }
    
    // Build destination with query parameters
    const queryParams = new URLSearchParams();
    queryParams.set('view', 'team');
    queryParams.set('range', dateRange);
    if (monthName) {
      queryParams.set('month', monthName);
    }
    
    const destination = `/portal/attendance?${queryParams.toString()}`;
    
    let message = `Opening team attendance for ${monthName || dateRange}...`;

    logger.info('Navigate to team attendance page', { userId: params.userId }, { 
      destination,
      dateRange,
      monthName,
      view: 'team'
    });

    return {
      success: true,
      message,
      data: {
        destination,
        action: 'navigate',
        view: 'team',
        dateRange,
        monthName,
        autoSwitchToTeam: true
      }
    };

  } catch (error) {
    logger.error('View team attendance navigation error', { userId: params.userId }, error as Error);
    
    return {
      success: false,
      message: 'Failed to navigate to team attendance page. Please try again.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
}

export default executeViewTeamAttendance;

