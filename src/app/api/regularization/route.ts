import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/devAuthWrapper';
import connectDB from '@/lib/mongodb';
import RegularizationRequest from '@/models/RegularizationRequest';
import SystemSettings from '@/models/SystemSettings';
import { isWithinCutoffPeriod } from '@/lib/dateUtils';

// Submit a regularization request
export async function POST(req: NextRequest) {
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
    const { attendanceDate, reason } = body;

    if (!attendanceDate || !reason) {
      return NextResponse.json(
        { error: 'Attendance date and reason are required' },
        { status: 400 }
      );
    }

    // Check if regularization is within the allowed cutoff period
    const settings = await SystemSettings.findOne();
    const cutoffDays = settings?.attendance?.regularizationCutoffDays || 7;
    
    if (!isWithinCutoffPeriod(attendanceDate, cutoffDays)) {
      return NextResponse.json(
        { 
          error: `Regularization requests are only allowed within ${cutoffDays} days of the attendance date`,
          cutoffDays 
        },
        { status: 400 }
      );
    }

    // Check if a request already exists for this date
    const existingRequest = await RegularizationRequest.findOne({
      userId,
      attendanceDate
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A regularization request already exists for this date' },
        { status: 400 }
      );
    }

    // Create new regularization request
    const regularizationRequest = new RegularizationRequest({
      userId,
      attendanceDate,
      reason: reason.trim(),
      requestDate: new Date()
    });

    await regularizationRequest.save();

    return NextResponse.json({
      success: true,
      message: 'Regularization request submitted successfully',
      data: regularizationRequest
    });

  } catch (error) {
    console.error('Regularization request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// This endpoint now only handles POST requests for creating regularization requests
// GET requests are handled by specific endpoints: /my, /team, /admin
