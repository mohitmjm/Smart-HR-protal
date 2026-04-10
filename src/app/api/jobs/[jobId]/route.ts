export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { getCareersJobModel } from '@/models/careers/Job';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid job ID format' },
        { status: 400 }
      );
    }

    const Job = await getCareersJobModel();
    
    // Fetch job by ID, only return active jobs
    const job = await Job.findOne({
      _id: jobId,
      isActive: true
    })
      .select('title department location type experience description requirements responsibilities benefits salary tags company postedDate deadline contactEmail')
      .lean();

    if (!job) {
      return NextResponse.json(
        { success: false, message: 'Job not found or not available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...job,
        _id: String((job as unknown as { _id: unknown })._id),
        postedDate: (job as any).postedDate ? String((job as any).postedDate) : undefined,
        deadline: (job as any).deadline ? String((job as any).deadline) : undefined,
      }
    });

  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch job',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}



