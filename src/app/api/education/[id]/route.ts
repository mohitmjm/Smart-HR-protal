import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';
import { logger } from '@/lib/logger';

// PUT - Update an embedded education record
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { schoolOrUniversity, degree, fieldOfStudy, overallResult, startDate, endDate } = body;

    if (!schoolOrUniversity || !degree) {
      return NextResponse.json({ error: 'School/University and Degree are required' }, { status: 400 });
    }

    await connectDB();

    const profile = await UserProfile.findOne({ clerkUserId: userId });
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    if (!profile.education) profile.education = [] as any;

    const idx = profile.education.findIndex((e: any) => String(e._id) === id && e.isActive !== false);
    if (idx === -1) return NextResponse.json({ error: 'Education record not found' }, { status: 404 });

    profile.education[idx].schoolOrUniversity = schoolOrUniversity;
    profile.education[idx].degree = degree;
    profile.education[idx].fieldOfStudy = fieldOfStudy;
    profile.education[idx].overallResult = overallResult;
    profile.education[idx].startDate = startDate ? new Date(startDate) : undefined;
    profile.education[idx].endDate = endDate ? new Date(endDate) : undefined;
    profile.education[idx].updatedAt = new Date();

    await profile.save();

    return NextResponse.json({ success: true, data: profile.education[idx] });
  } catch (error) {
    logger.error('Error updating education record:', error as Error);
    return NextResponse.json({ error: 'Failed to update education record' }, { status: 500 });
  }
}

// DELETE - Soft delete an embedded education record
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const profile = await UserProfile.findOne({ clerkUserId: userId });
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    if (!profile.education) profile.education = [] as any;

    const idx = profile.education.findIndex((e: any) => String(e._id) === id && e.isActive !== false);
    if (idx === -1) return NextResponse.json({ error: 'Education record not found' }, { status: 404 });

    profile.education[idx].isActive = false;
    profile.education[idx].updatedAt = new Date();
    await profile.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting education record:', error as Error);
    return NextResponse.json({ error: 'Failed to delete education record' }, { status: 500 });
  }
}
