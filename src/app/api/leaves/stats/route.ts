export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Leave from '../../../../models/Leave';
import UserProfile from '../../../../models/UserProfile';
import { authenticateRequest, verifyUserAccess, createUnauthorizedResponse, createForbiddenResponse } from '../../../../lib/auth';

// Get aggregated leave stats for the current year
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
      return createForbiddenResponse('You can only access your own leave stats');
    }

    // Load profile for remaining balances
    const profile = await UserProfile.findOne({ clerkUserId: userId });
    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Consider standard leave types for yearly entitlement math
    const consideredTypes: string[] = ['sick', 'casual', 'annual'];

    const daysRemaining = consideredTypes.reduce((sum, key) => {
      const value = (profile.leaveBalance as Record<string, unknown>)?.[key] as number ?? 0;
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);

    // Current calendar year range
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // Sum approved days this year for considered types
    const approvedLeaves = await Leave.find({
      userId,
      status: 'approved',
      leaveType: { $in: consideredTypes },
      startDate: { $gte: startOfYear },
      endDate: { $lte: endOfYear }
    }).select('totalDays');

    const approvedThisYear = approvedLeaves.reduce((sum, doc) => sum + (doc.totalDays || 0), 0);

    // Count pending requests
    const pendingRequests = await Leave.countDocuments({ userId, status: 'pending' });

    // Total yearly entitlement inferred as remaining + approved this year
    const totalLeaveBalance = daysRemaining + approvedThisYear;

    return NextResponse.json({
      success: true,
      data: {
        totalLeaveBalance,
        pendingRequests,
        approvedThisYear,
        daysRemaining
      }
    });
  } catch (error) {
    console.error('Error fetching leave stats:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch leave stats',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


