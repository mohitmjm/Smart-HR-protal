export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Leave from '../../../../models/Leave';
import UserProfile from '../../../../models/UserProfile';
import SystemSettings from '../../../../models/SystemSettings';
import { authenticateRequest, verifyUserAccess, createUnauthorizedResponse, createForbiddenResponse } from '../../../../lib/auth';

// Get detailed leave balance data for donut charts
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    try {
      await authenticateRequest(request);
    } catch {
      return createUnauthorizedResponse('Please sign in to access this feature');
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user can only access their own data (or managers/HR can access all)
    if (!(await verifyUserAccess(request, userId))) {
      return createForbiddenResponse('You can only access your own leave balance');
    }

    // Load user profile for current balances
    const profile = await UserProfile.findOne({ clerkUserId: userId });
    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get system settings to determine available leave types
    const systemSettings = await SystemSettings.findOne();
    const availableLeaveTypes = systemSettings?.leave?.defaultLeaveTypes || [
      'Annual Leave',
      'Sick Leave', 
      'Personal Leave',
      'Maternity Leave',
      'Paternity Leave'
    ];

    // Map system leave types to database field names
    const leaveTypeMapping: Record<string, string> = {
      'Annual Leave': 'annual',
      'Sick Leave': 'sick',
      'Personal Leave': 'casual',
      'Maternity Leave': 'maternity',
      'Paternity Leave': 'paternity'
    };

    // Build leave balance data using stored balance directly
    const leaveBalanceData = availableLeaveTypes.map((leaveType: string) => {
      const dbField = leaveTypeMapping[leaveType] || leaveType.toLowerCase();
      
      // Get current remaining balance from stored data
      const remainingDays = (profile.leaveBalance as Record<string, unknown>)?.[dbField] as number || 0;
      
      // Get allocated days (if available, otherwise use remaining as total)
      const allotedField = `${dbField}_alloted`;
      const allocatedDays = (profile.leaveBalance as Record<string, unknown>)?.[allotedField] as number || remainingDays;
      
      // Calculate taken days as: allocated - remaining
      const takenDays = Math.max(0, allocatedDays - remainingDays);

      return {
        type: leaveType,
        total: allocatedDays,
        taken: takenDays,
        remaining: remainingDays,
        percentage: allocatedDays > 0 ? Math.round((takenDays / allocatedDays) * 100) : 0
      };
    });

    // Calculate overall totals
    const totalLeaveBalance = leaveBalanceData.reduce((sum: number, item: { total: number }) => sum + item.total, 0);
    const totalTaken = leaveBalanceData.reduce((sum: number, item: { taken: number }) => sum + item.taken, 0);
    const totalRemaining = totalLeaveBalance - totalTaken;

    return NextResponse.json({
      success: true,
      data: {
        leaveTypes: leaveBalanceData,
        summary: {
          totalBalance: totalLeaveBalance,
          totalTaken: totalTaken,
          totalRemaining: totalRemaining,
          overallPercentage: totalLeaveBalance > 0 ? Math.round((totalTaken / totalLeaveBalance) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching leave balance data:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch leave balance data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
