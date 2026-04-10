import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/devAuthWrapper';
import connectDB from '@/lib/mongodb';
import RegularizationRequest from '@/models/RegularizationRequest';
import Attendance from '@/models/Attendance';
import UserProfile from '@/models/UserProfile';

// Get team members' regularization requests (for managers)
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Check if user is a manager (has direct reports)
    const directReports = await UserProfile.find({ managerId: userId })
      .select('clerkUserId')
      .lean();
    
    const reportIds = directReports.map(r => r.clerkUserId);
    
    if (reportIds.length === 0) {
      // User is not a manager, return empty results
      return NextResponse.json({
        success: true,
        data: {
          requests: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          }
        }
      });
    }

    const query: Record<string, unknown> = {
      userId: { $in: reportIds }
    };
    
    if (status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const requests = await RegularizationRequest.find(query)
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName email')
      .lean();

    const total = await RegularizationRequest.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        requests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get team regularization requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Approve/reject team member's regularization request (for managers)
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { requestId, status, reviewNotes } = body;

    if (!requestId || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Request ID and status (approved/rejected) are required' },
        { status: 400 }
      );
    }

    // Find the regularization request
    const regularizationRequest = await RegularizationRequest.findById(requestId);
    if (!regularizationRequest) {
      return NextResponse.json(
        { error: 'Regularization request not found' },
        { status: 404 }
      );
    }

    if (regularizationRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'This request has already been reviewed' },
        { status: 400 }
      );
    }

    // Verify that the current user is the manager of the request owner
    const requestOwnerProfile = await UserProfile.findOne({ 
      clerkUserId: regularizationRequest.userId 
    }).select('managerId firstName lastName email');

    if (!requestOwnerProfile) {
      return NextResponse.json(
        { error: 'Request owner profile not found' },
        { status: 404 }
      );
    }

    if (requestOwnerProfile.managerId !== userId) {
      return NextResponse.json(
        { 
          error: 'Access denied. You can only approve requests from your direct reports.',
          details: `You are not the manager of ${requestOwnerProfile.firstName} ${requestOwnerProfile.lastName}`
        },
        { status: 403 }
      );
    }

    // Get manager profile for review tracking
    const managerProfile = await UserProfile.findOne({ clerkUserId: userId })
      .select('firstName lastName email');

    // Update the regularization request
    regularizationRequest.status = status;
    regularizationRequest.reviewedBy = managerProfile?.email || 'Unknown Manager';
    regularizationRequest.reviewedAt = new Date();
    if (reviewNotes) {
      regularizationRequest.reviewNotes = reviewNotes.trim();
    }

    await regularizationRequest.save();

    // If approved, update the attendance record status
    if (status === 'approved') {
      console.log('Updating attendance record:', {
        userId: regularizationRequest.userId,
        date: regularizationRequest.attendanceDate,
        status: 'regularized',
        reason: regularizationRequest.reason,
        approvedBy: managerProfile?.email
      });

      const updateResult = await Attendance.findOneAndUpdate(
        {
          userId: regularizationRequest.userId,
          date: regularizationRequest.attendanceDate
        },
        {
          status: 'regularized',
          notes: regularizationRequest.reason
        },
        { 
          upsert: false,
          new: true,
          runValidators: true
        }
      );

      console.log('Attendance update result:', updateResult);

      if (!updateResult) {
        console.warn('No attendance record found to update for:', {
          userId: regularizationRequest.userId,
          date: regularizationRequest.attendanceDate
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Regularization request ${status} successfully by manager`,
      data: {
        ...regularizationRequest.toObject(),
        requestOwner: {
          name: `${requestOwnerProfile.firstName} ${requestOwnerProfile.lastName}`,
          email: requestOwnerProfile.email
        },
        reviewedBy: {
          name: managerProfile ? `${managerProfile.firstName} ${managerProfile.lastName}` : 'Unknown Manager',
          email: managerProfile?.email || 'Unknown Manager'
        }
      }
    });

  } catch (error) {
    console.error('Manager review regularization request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
