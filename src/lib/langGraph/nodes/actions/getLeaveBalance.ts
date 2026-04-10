// Get Leave Balance Action: Navigates to leaves page to show balance

import { logger } from "../../utils/logger";

export interface GetLeaveBalanceParams {
  userId: string;
  leaveType?: string; // Optional: specific leave type to focus on
  dateRange?: string; // Optional: 'today', 'month', or month name like 'September'
}

export interface GetLeaveBalanceResult {
  success: boolean;
  message: string;
  data?: {
    destination: string;
    action: string;
    leaveType?: string;
    dateRange?: string;
    viewMode?: string;
    monthName?: string;
  };
  error?: string;
}

/**
 * Execute get leave balance action by navigating to the leaves page
 */
export async function executeGetLeaveBalance(params: GetLeaveBalanceParams): Promise<GetLeaveBalanceResult> {
  try {
    logger.info('Executing get leave balance navigation', { userId: params.userId }, { 
      leaveType: params.leaveType,
      dateRange: params.dateRange 
    });

    // Build query parameters for leaves page
    const queryParams = new URLSearchParams();
    
    // Determine viewMode and monthName from dateRange
    let viewMode = 'today';
    let monthName: string | undefined;
    
    if (params.dateRange) {
      const range = params.dateRange.toLowerCase();
      if (range === 'month' || /^(january|february|march|april|may|june|july|august|september|october|november|december)$/i.test(range)) {
        viewMode = 'month';
        // If specific month name provided, use it; otherwise it will default to current month
        if (range !== 'month') {
          monthName = params.dateRange; // Keep original casing (e.g., "September")
        }
      }
    }
    
    queryParams.set('view', viewMode);
    if (monthName) {
      queryParams.set('month', monthName);
    }
    if (params.leaveType) {
      queryParams.set('leaveType', params.leaveType);
    }
    
    const destination = `/portal/leaves?${queryParams.toString()}`;
    
    let message = 'Opening your leave balance page...';
    if (monthName) {
      message = `Opening your leave balance for ${monthName}...`;
    } else if (viewMode === 'month') {
      message = 'Opening your leave balance for this month...';
    }
    if (params.leaveType) {
      message = `${message.replace('...', '')} to show ${params.leaveType} leave details...`;
    }

    logger.info('Navigate to leave balance page', { userId: params.userId }, { 
      destination,
      leaveType: params.leaveType,
      viewMode,
      monthName
    });

    return {
      success: true,
      message,
      data: {
        destination,
        action: 'navigate',
        leaveType: params.leaveType,
        dateRange: params.dateRange,
        viewMode,
        monthName
      }
    };

  } catch (error) {
    logger.error('Get leave balance navigation error', { userId: params.userId }, error as Error);
    
    return {
      success: false,
      message: 'Failed to navigate to leave balance page. Please try again.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
}

export default executeGetLeaveBalance;

