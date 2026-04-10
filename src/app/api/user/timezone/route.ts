export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import UserProfile from '@/models/UserProfile'
import { authenticateRequest, createUnauthorizedResponse } from '@/lib/auth'
import { TimezoneService } from '@/lib/timezoneService'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    await connectDB()
    const profile = await UserProfile.findOne({ clerkUserId: user.userId }).select('timezone')
    return NextResponse.json({ success: true, timezone: profile?.timezone || 'UTC' })
  } catch {
    return createUnauthorizedResponse('Please sign in to access this feature')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    const body = await request.json()
    const { timezone } = body || {}
    if (!timezone || !TimezoneService.isValidTimezone(timezone)) {
      return NextResponse.json({ success: false, message: 'Invalid timezone' }, { status: 400 })
    }
    await connectDB()
    const profile = await UserProfile.findOneAndUpdate(
      { clerkUserId: user.userId },
      { $set: { timezone } },
      { new: true }
    ).select('timezone')
    return NextResponse.json({ success: true, timezone: profile?.timezone || timezone })
  } catch {
    return createUnauthorizedResponse('Please sign in to access this feature')
  }
}

// Note: legacy duplicate implementation removed to avoid redeclarations
