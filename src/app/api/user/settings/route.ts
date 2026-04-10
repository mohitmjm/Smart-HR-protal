import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/devAuthWrapper';
import connectDB from '@/lib/mongodb';
import UserSettings from '@/models/UserSettings';
import { TimezoneSyncService } from '@/lib/timezoneSyncService';

export async function GET() {
  try {
    // Get user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Get or create user settings
    let userSettings = await UserSettings.findOne({ userId });
    
    if (!userSettings) {
      // Create default settings if none exist
      userSettings = new UserSettings({
        userId
      });
      await userSettings.save();
    }

    // Sync timezone from UserProfile to UserSettings if needed
    const userTimezone = await TimezoneSyncService.getUserTimezone(userId);
    if (userTimezone && userSettings.appearance.timezone !== userTimezone) {
      userSettings.appearance.timezone = userTimezone;
      await userSettings.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        notifications: userSettings.notifications,
        security: userSettings.security,
        appearance: userSettings.appearance,
        preferences: userSettings.preferences
      }
    });
  } catch (error) {
    console.error('User settings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Get user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    const body = await req.json();

    // Validate settings structure
    if (!body.notifications || !body.security || !body.appearance || !body.preferences) {
      return NextResponse.json(
        { error: 'Invalid settings structure' },
        { status: 400 }
      );
    }

    // Update or create user settings
    const userSettings = await UserSettings.findOneAndUpdate(
      { userId },
      {
        notifications: body.notifications,
        security: body.security,
        appearance: body.appearance,
        preferences: body.preferences,
        updatedAt: new Date()
      },
      {
        new: true,
        upsert: true, // Create if doesn't exist
        runValidators: true
      }
    );

    // If timezone was updated in appearance settings, sync to UserProfile
    if (body.appearance?.timezone) {
      try {
        await TimezoneSyncService.setUserTimezone(userId, body.appearance.timezone);
      } catch (error) {
        console.warn('Failed to sync timezone to UserProfile:', error);
        // Don't fail the request if timezone sync fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User settings updated successfully',
      data: {
        notifications: userSettings.notifications,
        security: userSettings.security,
        appearance: userSettings.appearance,
        preferences: userSettings.preferences
      }
    });
  } catch (error) {
    console.error('User settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
