import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/devAuthWrapper';
import { checkHRManagerAccess } from '@/lib/adminAuth';
import connectDB from '@/lib/mongodb';
import RegularizationRequest from '@/models/RegularizationRequest';
import Attendance from '@/models/Attendance';
import UserProfile from '@/models/UserProfile';

// Review a regularization request (approve/reject) - supports both HR and Manager approval
export async function PUT(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { requestId } = await params;
    const body = await req.json();
    const { status, reviewNotes } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either approved or rejected' },
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

    // Check authorization: Either HR Manager or direct manager
    const isHRManager = await checkHRManagerAccess(req);
    let isAuthorized = false;
    let reviewerInfo = null;

    if (isHRManager) {
      // HR Manager can approve any request
      isAuthorized = true;
      reviewerInfo = {
        type: 'HR Manager',
        name: `${isHRManager.firstName} ${isHRManager.lastName}`,
        email: isHRManager.email
      };
    } else {
      // Check if user is the direct manager of the request owner
      const requestOwnerProfile = await UserProfile.findOne({ 
        clerkUserId: regularizationRequest.userId 
      }).select('managerId firstName lastName email');

      if (requestOwnerProfile && requestOwnerProfile.managerId === userId) {
        isAuthorized = true;
        const managerProfile = await UserProfile.findOne({ clerkUserId: userId })
          .select('firstName lastName email');
        
        reviewerInfo = {
          type: 'Manager',
          name: managerProfile ? `${managerProfile.firstName} ${managerProfile.lastName}` : 'Unknown Manager',
          email: managerProfile?.email || 'Unknown Manager'
        };
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { 
          error: 'Access denied. Only HR Managers or direct managers can approve regularization requests.',
          details: 'You must be either an HR Manager or the direct manager of the request owner.'
        },
        { status: 403 }
      );
    }

    // Update the regularization request
    regularizationRequest.status = status;
    regularizationRequest.reviewedBy = reviewerInfo!.email;
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
        reason: regularizationRequest.reason
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
      message: `Regularization request ${status} successfully by ${reviewerInfo!.type}`,
      data: {
        ...regularizationRequest.toObject(),
        reviewer: reviewerInfo
      }
    });

  } catch (error) {
    console.error('Review regularization request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get a specific regularization request
export async function GET(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { requestId } = await params;

    const regularizationRequest = await RegularizationRequest.findById(requestId).lean();

    if (!regularizationRequest) {
      return NextResponse.json(
        { error: 'Regularization request not found' },
        { status: 404 }
      );
    }

    // Check if user can access this request
    const isHRManager = await checkHRManagerAccess(req);
    if (!isHRManager && (regularizationRequest as any).userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: regularizationRequest
    });

  } catch (error) {
    console.error('Get regularization request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
