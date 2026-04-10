export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Leave from '../../../../models/Leave';
import UserProfile from '../../../../models/UserProfile';
import { authenticateRequest, createUnauthorizedResponse } from '../../../../lib/auth';

// Get leave applications from direct reports only
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authUser = await authenticateRequest(request);

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limitParam = searchParams.get('limit');
    const limit = Math.min(parseInt(limitParam || '200', 10) || 200, 500);

    // Find all users where the current user is their manager
    const directReports = await UserProfile.find({
      managerId: authUser.userId,
      isActive: true
    }).select('clerkUserId firstName lastName email department position').lean();

    if (directReports.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [], 
        meta: { total: 0 },
        message: 'No direct reports found'
      });
    }

    // Get clerk user IDs of direct reports
    const directReportIds = directReports.map(user => user.clerkUserId);

    // Build query for leaves from direct reports only
    const query: Record<string, unknown> = { userId: { $in: directReportIds } };
    
    if (status) {
      query.status = status;
    }

    // Overlap with requested range: (leave.startDate <= rangeEnd) AND (leave.endDate >= rangeStart)
    if (startDate || endDate) {
      const rangeStart = startDate ? new Date(startDate) : new Date('1970-01-01');
      const rangeEnd = endDate ? new Date(endDate) : new Date('2999-12-31');
      // Normalize to cover full days
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(23, 59, 59, 999);
      query.$and = [
        { startDate: { $lte: rangeEnd } },
        { endDate: { $gte: rangeStart } }
      ];
    }

    const leaves = await Leave.find(query)
      .sort({ appliedDate: -1 })
      .limit(limit)
      .lean();

    // Attach user info for each leave
    const userMap = new Map(directReports.map(r => [r.clerkUserId, r]));
    const enriched = leaves.map(l => ({
      ...l,
      user: userMap.get(l.userId) || null
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
      meta: { 
        total: enriched.length,
        directReportsCount: directReports.length
      }
    });
  } catch (error) {
    // If authentication failed earlier, return 401
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return createUnauthorizedResponse('Please sign in to access this feature');
    }
    console.error('Error fetching direct reports leaves:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch direct reports leaves',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
