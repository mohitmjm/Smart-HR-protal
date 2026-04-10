export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { getCareersApplicationModel } from '@/models/careers/Application';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    // Check for admin authentication
    const { checkHRManagerAccess } = await import('@/lib/adminAuth');
    const adminUser = await checkHRManagerAccess(request);
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const Application = await getCareersApplicationModel();

    const { applicationId } = await params;
    const { status } = await request.json();

    // Validate status
    const validStatuses = ['pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update application status
    const updatedApplication = await Application.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true }
    );

    if (!updatedApplication) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Application status updated successfully',
      data: updatedApplication
    });

  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    // Check for admin authentication
    const { checkHRManagerAccess } = await import('@/lib/adminAuth');
    const adminUser = await checkHRManagerAccess(request);
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const Application = await getCareersApplicationModel();

    const { applicationId } = await params;

    const application = await Application.findById(applicationId)
      .populate('jobId', 'title department')
      .select('-__v');

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Get application error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
