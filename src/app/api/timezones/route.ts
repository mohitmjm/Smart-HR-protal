import { NextRequest, NextResponse } from 'next/server';
import { getAvailableTimezones, isValidTimezone } from '../../../lib/timezoneUtils';

export const dynamic = 'force-dynamic'

// Get available timezones
export async function GET() {
  try {
    const timezones = getAvailableTimezones();
    
    return NextResponse.json({
      success: true,
      data: timezones
    });
    
  } catch (error) {
    console.error('Error fetching timezones:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch timezones',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Validate a timezone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timezone } = body;
    
    if (!timezone) {
      return NextResponse.json(
        { success: false, message: 'Timezone is required' },
        { status: 400 }
      );
    }
    
    const isValid = isValidTimezone(timezone);
    
    return NextResponse.json({
      success: true,
      data: {
        timezone,
        isValid
      }
    });
    
  } catch (error) {
    console.error('Error validating timezone:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to validate timezone',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
