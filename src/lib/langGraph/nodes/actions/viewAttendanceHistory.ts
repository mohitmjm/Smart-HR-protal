// View Attendance History Action: Handles navigation to attendance history page

import { logger } from "../../utils/logger";

export interface ViewAttendanceHistoryParams {
  userId: string;
  dateRange: string; // e.g., "this month", "last month", "September", "August 2024"
}

export interface ViewAttendanceHistoryResult {
  success: boolean;
  message: string;
  data?: {
    destination: string;
    month?: string; // YYYY-MM format
  };
  error?: string;
}

/**
 * Parse dateRange to extract month in YYYY-MM format
 */
function parseDateRangeToMonth(dateRange: string): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Normalize input
  const normalized = dateRange.toLowerCase().trim();

  // Handle "this month" or "current month"
  if (normalized.includes('this month') || normalized === 'current month') {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  }

  // Handle "last month" or "previous month"
  if (normalized.includes('last month') || normalized.includes('previous month')) {
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    return `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  }

  // Handle "next month"
  if (normalized.includes('next month')) {
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
    return `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
  }

  // Handle specific month names (e.g., "September", "January")
  for (let i = 0; i < monthNames.length; i++) {
    if (normalized === monthNames[i].toLowerCase()) {
      // If month name only, assume current year
      return `${currentYear}-${String(i + 1).padStart(2, '0')}`;
    }
  }

  // Handle "Month Year" format (e.g., "September 2024", "January 2025")
  for (let i = 0; i < monthNames.length; i++) {
    const monthName = monthNames[i].toLowerCase();
    if (normalized.startsWith(monthName)) {
      // Extract year if present
      const yearMatch = dateRange.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : currentYear;
      return `${year}-${String(i + 1).padStart(2, '0')}`;
    }
  }

  // Default: return current month
  return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
}

/**
 * Execute view attendance history action by navigating to attendance page
 */
export async function executeViewAttendanceHistory(params: ViewAttendanceHistoryParams): Promise<ViewAttendanceHistoryResult> {
  try {
    logger.info('Executing view attendance history navigation', { userId: params.userId }, { 
      dateRange: params.dateRange
    });

    // Parse the dateRange to get month in YYYY-MM format
    const month = parseDateRangeToMonth(params.dateRange);

    // Construct navigation URL
    const destination = `/portal/attendance?view=my&month=${month}`;

    logger.info('Navigate to attendance history page', { userId: params.userId }, {
      destination,
      month,
      dateRange: params.dateRange
    });

    return {
      success: true,
      message: `Showing your attendance history for ${params.dateRange}`,
      data: {
        destination,
        month
      }
    };

  } catch (error) {
    logger.error('View attendance history error', { userId: params.userId }, error as Error);
    
    return {
      success: false,
      message: 'Failed to navigate to attendance history. Please try again.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
}

export default executeViewAttendanceHistory;

