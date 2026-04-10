import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Team from '@/models/Team'
import { authenticateRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await authenticateRequest(request)
    await connectDB()

    // Check if user is a member of any active teams
    const userTeams = await Team.find({
      members: authUser.userId,
      isActive: true
    }).lean()

    const isTeamMember = userTeams.length > 0

    return NextResponse.json({
      success: true,
      data: {
        isTeamMember,
        teamCount: userTeams.length,
        teams: userTeams.map(team => ({
          id: team._id,
          name: team.name,
          memberCount: team.members.length
        }))
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json(
        { success: false, message: 'Please sign in to access this feature' },
        { status: 401 }
      )
    }
    
    console.error('Error checking team membership:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check team membership',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
