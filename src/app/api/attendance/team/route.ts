export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Attendance from '../../../../models/Attendance'
import UserProfile from '../../../../models/UserProfile'
import { authenticateRequest, createUnauthorizedResponse } from '../../../../lib/auth'
import { createStringDateRangeQuery, getTodayDateString } from '../../../../lib/dateQueryUtils'

// Get team attendance (direct reportees of the authenticated manager)
export async function GET(request: NextRequest) {
  try {
    // Authenticate caller
    const authUser = await authenticateRequest(request)

    await connectDB()

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') // YYYY-MM-DD
    const startDateParam = searchParams.get('startDate') // YYYY-MM-DD
    const endDateParam = searchParams.get('endDate') // YYYY-MM-DD
    const limitParam = searchParams.get('limit')
    const limit = Math.min(parseInt(limitParam || '200', 10) || 200, 500)

    // Find direct reports for the authenticated user
    const directReports = await UserProfile.find({ managerId: authUser.userId })
      .select('clerkUserId firstName lastName email department position')
      .lean()

    const reportIds = directReports.map(r => r.clerkUserId)

    if (reportIds.length === 0) {
      return NextResponse.json({ success: true, data: [], meta: { total: 0 } })
    }

    const query: { userId: { $in: string[] }, date?: string | { $gte?: string, $lt?: string } | { $gte?: string, $lte?: string } } = { userId: { $in: reportIds } }

    // Build date range (dates are stored as strings in YYYY-MM-DD format)
    if (dateParam) {
      // For single date, query exact date string
      query.date = dateParam
    } else if (startDateParam || endDateParam) {
      // Get manager's timezone for consistent team view
      const managerProfile = await UserProfile.findOne({ clerkUserId: authUser.userId });
      const managerTimezone = managerProfile?.timezone || 'UTC';
      const rangeStart = startDateParam || '1970-01-01'
      const rangeEnd = endDateParam || '2999-12-31'
      query.date = createStringDateRangeQuery(rangeStart, rangeEnd, managerTimezone)
    } else {
      // Default to today - use manager's timezone for consistent team view
      const managerProfile = await UserProfile.findOne({ clerkUserId: authUser.userId });
      const managerTimezone = managerProfile?.timezone || 'UTC';
      const todayString = getTodayDateString(managerTimezone);
      query.date = todayString;
    }

    const records = await Attendance.find(query)
      .sort({ date: -1, clockIn: 1 })
      .limit(limit)
      .lean()

    // Attach minimal user info for display
    const userMap = new Map(directReports.map(r => [r.clerkUserId, r]))
    const enriched = records.map(r => ({
      ...r,
      user: userMap.get(r.userId) || null
    }))

    return NextResponse.json({
      success: true,
      data: enriched,
      meta: { total: enriched.length }
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return createUnauthorizedResponse('Please sign in to access this feature')
    }
    console.error('Error fetching team attendance:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch team attendance',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


