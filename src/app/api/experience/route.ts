import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';
import mongoose from 'mongoose';

// GET embedded experience
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const profile = await UserProfile.findOne({ clerkUserId: userId }, { experience: 1 });
  const items = (profile?.experience || []).filter((x: any) => x.isActive !== false)
    .sort((a: any, b: any) => (new Date(b?.endDate || b?.startDate || 0).getTime()) - (new Date(a?.endDate || a?.startDate || 0).getTime()));
  return NextResponse.json({ success: true, data: items });
}

// POST create embedded experience
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const { company, title, employmentType, location, startDate, endDate, description } = body;
  if (!company || !title) return NextResponse.json({ error: 'Company and Title are required' }, { status: 400 });
  await connectDB();

  const now = new Date();
  const entry: any = {
    _id: new mongoose.Types.ObjectId(),
    company: String(company).trim(),
    title: String(title).trim(),
    employmentType: employmentType ? String(employmentType).trim() : undefined,
    location: location ? String(location).trim() : undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    description: description ? String(description).trim() : undefined,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };

  const updated = await UserProfile.findOneAndUpdate(
    { clerkUserId: userId },
    {
      $push: { experience: { $each: [entry], $position: 0 } },
      $set: { updatedAt: now }
    },
    { new: true, projection: { experience: { $slice: 1 } } }
  );

  if (!updated) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const created = (updated.experience || [])[0];
  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
