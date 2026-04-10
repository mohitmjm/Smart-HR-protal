import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/devAuthWrapper';
import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const { company, title, employmentType, location, startDate, endDate, description } = body;
  if (!company || !title) return NextResponse.json({ error: 'Company and Title are required' }, { status: 400 });
  await connectDB();
  const update: any = {
    'experience.$.company': company,
    'experience.$.title': title,
    'experience.$.employmentType': employmentType,
    'experience.$.location': location,
    'experience.$.startDate': startDate ? new Date(startDate) : undefined,
    'experience.$.endDate': endDate ? new Date(endDate) : undefined,
    'experience.$.description': description,
    'experience.$.updatedAt': new Date()
  };
  const updated = await UserProfile.findOneAndUpdate(
    { clerkUserId: userId, 'experience._id': id, 'experience.isActive': { $ne: false } },
    { $set: update },
    { new: true, projection: { experience: { $elemMatch: { _id: id } } } }
  );
  if (!updated || !updated.experience?.length) return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: updated.experience[0] });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const updated = await UserProfile.findOneAndUpdate(
    { clerkUserId: userId, 'experience._id': id, 'experience.isActive': { $ne: false } },
    { $set: { 'experience.$.isActive': false, 'experience.$.updatedAt': new Date() } },
    { new: true, projection: { _id: 1 } }
  );
  if (!updated) return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
