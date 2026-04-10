export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import UserProfile from '../../../../models/UserProfile'
import { authenticateRequest, createUnauthorizedResponse } from '../../../../lib/auth'

// Get direct reportees for the authenticated user (manager)
export async function GET(request: NextRequest) {
  try {
    const authUser = await authenticateRequest(request)

    await connectDB()

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = Math.min(parseInt(limitParam || '200', 10) || 200, 500)

    const reportees = await UserProfile.find({ managerId: authUser.userId })
      .select('clerkUserId employeeId firstName lastName email department position joinDate isActive')
      .limit(limit)
      .lean()

    return NextResponse.json({
      success: true,
      data: reportees,
      meta: { total: reportees.length }
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return createUnauthorizedResponse('Please sign in to access this feature')
    }
    console.error('Error fetching reportees:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch reportees',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


