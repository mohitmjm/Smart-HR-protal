export interface LeavePolicyRule {
  userLevel: 'employee' | 'manager' | 'director';
  shortLeaveThreshold: number; // Days threshold for short leaves
  shortLeaveNotification: 'manager' | 'manager_andTeamLeader';
  longLeaveNotification: 'manager' | 'managerAndTeamLeader';
  approvalRequired: boolean;
  canApproveOthers: boolean;
}

export interface LeavePolicyConfig {
  rules: LeavePolicyRule[];
  urgentNotificationThreshold: number; // Days before leave for urgent notifications
  defaultApprover: 'manager' | 'hr';
}

export const leavePolicy: LeavePolicyConfig = {
  urgentNotificationThreshold: 4, // Notify managers for leaves in next 4 days
  defaultApprover: 'manager',
  rules: [
    {
      userLevel: 'employee',
      shortLeaveThreshold: 2,
      shortLeaveNotification: 'manager',
      longLeaveNotification: 'manager',
      approvalRequired: true,
      canApproveOthers: false
    },
    {
      userLevel: 'manager',
      shortLeaveThreshold: 4,
      shortLeaveNotification: 'manager',
      longLeaveNotification: 'manager',
      approvalRequired: true,
      canApproveOthers: true
    },
    {
      userLevel: 'director',
      shortLeaveThreshold: 5,
      shortLeaveNotification: 'manager',
      longLeaveNotification: 'manager',
      approvalRequired: true,
      canApproveOthers: true
    }
  ]
};

export const getUserLevel = (position: string): 'employee' | 'manager' | 'director' => {
  const lowerPosition = position.toLowerCase();
  
  if (lowerPosition.includes('director') || lowerPosition.includes('ceo') || lowerPosition.includes('cto') || lowerPosition.includes('cfo')) {
    return 'director';
  }
  
  if (lowerPosition.includes('manager') || lowerPosition.includes('lead') || lowerPosition.includes('supervisor')) {
    return 'manager';
  }
  
  return 'employee';
};

export const getNotificationRecipients = (
  userLevel: 'employee' | 'manager' | 'director',
  leaveDays: number,
  isUrgent: boolean = false
): { notifyManager: boolean; notifyTeamLeaders: boolean } => {
  const rule = leavePolicy.rules.find(r => r.userLevel === userLevel);
  if (!rule) {
    return { notifyManager: true, notifyTeamLeaders: false };
  }

  // For urgent leaves (within 4 days), notify manager only
  if (isUrgent) {
    return { notifyManager: true, notifyTeamLeaders: false };
  }

  return {
    notifyManager: true,
    notifyTeamLeaders: false // Always false - only notify managers
  };
};

export const isUrgentLeave = (startDate: Date): boolean => {
  const today = new Date();
  const diffTime = startDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= leavePolicy.urgentNotificationThreshold && diffDays >= 0;
};
