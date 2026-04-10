import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';
import { logger } from '@/lib/logger';

// GET - Fetch user's education records (embedded)
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const profile = await UserProfile.findOne({ clerkUserId: userId }, { education: 1 });
    const educationRecords = (profile?.education || []).filter((e: any) => e.isActive !== false)
      .sort((a: any, b: any) => (new Date(b?.endDate || b?.startDate || 0).getTime()) - (new Date(a?.endDate || a?.startDate || 0).getTime()));

    return NextResponse.json({ success: true, data: educationRecords });
  } catch (error) {
    logger.error('Error fetching education records:', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch education records' },
      { status: 500 }
    );
  }
}

// POST - Create new embedded education record
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { schoolOrUniversity, degree, fieldOfStudy, overallResult, startDate, endDate } = body;

    if (!schoolOrUniversity || !degree) {
      return NextResponse.json(
        { error: 'School/University and Degree are required' },
        { status: 400 }
      );
    }

    if (!['Bachelors', 'Masters', 'Other'].includes(degree)) {
      return NextResponse.json(
        { error: 'Invalid degree type' },
        { status: 400 }
      );
    }

    await connectDB();

    const profile = await UserProfile.findOne({ clerkUserId: userId });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const newEntry = {
      schoolOrUniversity: schoolOrUniversity.trim(),
      degree,
      fieldOfStudy: fieldOfStudy?.trim(),
      overallResult: overallResult?.trim(),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _id: undefined as any,
    } as any;

    profile.education = profile.education || [];
    // unshift for most recent first
    profile.education.unshift(newEntry);
    await profile.save();

    const created = profile.education[0];
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    logger.error('Error creating education record:', error as Error);
    return NextResponse.json(
      { error: 'Failed to create education record' },
      { status: 500 }
    );
  }
}
