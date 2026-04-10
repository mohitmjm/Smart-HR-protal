// Action Node Registry: Central registry for all action executors

import { executeClockIn } from './clockIn';
import { executeClockOut } from './clockOut';
import { executeGetLeaveBalance } from './getLeaveBalance';
import { executeViewTeamAttendance } from './viewTeamAttendance';
import { executeApplyLeave } from './applyLeave';
import { executeViewAttendanceHistory } from './viewAttendanceHistory';
import { executeViewTeamLeaves } from './viewTeamLeaves';

export interface ActionExecutor {
  (params: any): Promise<any>;
}

/**
 * Registry of action executors by intent
 * Maps intent names to their corresponding execution functions
 */
export const ACTION_REGISTRY: Record<string, ActionExecutor> = {
  'clock_in': executeClockIn,
  'clock_out': executeClockOut,
  'get_leave_balance': executeGetLeaveBalance,
  'view_team_attendance': executeViewTeamAttendance,
  'apply_leave': executeApplyLeave,
  'view_attendance_history': executeViewAttendanceHistory,
  'view_team_leaves': executeViewTeamLeaves,
  // Add more action executors as needed:
  // 'approve_leave': executeApproveLeave,
  // etc.
};

/**
 * Get the appropriate action executor for an intent
 */
export function getActionExecutor(intent: string): ActionExecutor | undefined {
  return ACTION_REGISTRY[intent];
}

/**
 * Check if an intent has a registered action executor
 */
export function hasActionExecutor(intent: string): boolean {
  return intent in ACTION_REGISTRY;
}

export { executeClockIn } from './clockIn';
export { executeClockOut } from './clockOut';
export { executeGetLeaveBalance } from './getLeaveBalance';
export { executeViewTeamAttendance } from './viewTeamAttendance';
export { executeApplyLeave } from './applyLeave';
export { executeViewAttendanceHistory } from './viewAttendanceHistory';
export { executeViewTeamLeaves } from './viewTeamLeaves';

