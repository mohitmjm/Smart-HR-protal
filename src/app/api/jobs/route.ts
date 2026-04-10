export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { getCareersJobModel } from '../../../models/careers/Job';

export async function GET() {
  try {
    // Use careers database
    const Job = await getCareersJobModel();
    
    // Get all active jobs, sorted by posted date (newest first)
    const jobs = await Job.find({ isActive: true })
      .select('title department location type experience description requirements responsibilities benefits salary tags company postedDate applicationCount')
      .sort({ postedDate: -1 });
    
    return NextResponse.json({
      success: true,
      data: jobs
    });
    
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch jobs',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
