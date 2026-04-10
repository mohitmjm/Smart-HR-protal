import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/devAuthWrapper';
import connectDB from '@/lib/mongodb';
import RegularizationRequest from '@/models/RegularizationRequest';
import { checkHRManagerAccess } from '@/lib/adminAuth';

// Get all regularization requests (for HR managers)
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has HR Manager access
    const adminUser = await checkHRManagerAccess(req);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Access denied. HR Manager privileges required.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = {};
    
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
    console.error('Get admin regularization requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
