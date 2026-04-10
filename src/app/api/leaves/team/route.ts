export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Leave from '../../../../models/Leave';
import UserProfile from '../../../../models/UserProfile';
import Team from '../../../../models/Team';
import { authenticateRequest, createUnauthorizedResponse } from '../../../../lib/auth';

// Get team leaves for all team members based on Team model
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authUser = await authenticateRequest(request);

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const teamId = searchParams.get('teamId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limitParam = searchParams.get('limit');
    const limit = Math.min(parseInt(limitParam || '200', 10) || 200, 500);

    // Find teams where the authenticated user is a member
    let userTeams = await Team.find({
      members: authUser.userId,
      isActive: true
    }).lean();

    if (userTeams.length === 0) {
      return NextResponse.json({ success: true, data: [], meta: { total: 0 } });
    }

    // If specific teamId is provided, filter to only that team
    if (teamId && teamId !== 'all') {
      userTeams = userTeams.filter(team => String(team._id) === teamId);
      if (userTeams.length === 0) {
        return NextResponse.json({ success: true, data: [], meta: { total: 0 } });
      }
    }

    // Get all team members from the filtered teams
    const allTeamMembers = new Set<string>();
    userTeams.forEach(team => {
      team.members.forEach((memberId: string) => allTeamMembers.add(memberId));
    });

    const teamMemberIds = Array.from(allTeamMembers);

    // Get user profiles for all team members
    const teamMemberProfiles = await UserProfile.find({ 
      clerkUserId: { $in: teamMemberIds } 
    })
      .select('clerkUserId firstName lastName email department position')
      .lean();

    const query: Record<string, unknown> = { userId: { $in: teamMemberIds } };
    if (status) query.status = status;

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

    // Attach minimal user info
    const userMap = new Map(teamMemberProfiles.map(r => [r.clerkUserId, r]));
    const enriched = leaves.map(l => ({
      ...l,
      user: userMap.get(l.userId) || null
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
      meta: { total: enriched.length }
    });
  } catch (error) {
    // If authentication failed earlier, return 401
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return createUnauthorizedResponse('Please sign in to access this feature');
    }
    console.error('Error fetching team leaves:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch team leaves',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


