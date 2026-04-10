export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '../../../lib/notificationService';
import { authenticateRequest, verifyUserAccess, createUnauthorizedResponse } from '../../../lib/auth';

// Get user's notifications
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    try {
      await authenticateRequest(request);
    } catch {
      return createUnauthorizedResponse('Please sign in to access this feature');
    }
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type') || undefined;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Verify user can only access their own notifications
    if (!(await verifyUserAccess(request, userId))) {
      return NextResponse.json(
        { success: false, message: 'You can only access your own notifications' },
        { status: 403 }
      );
    }
    
    const result = await NotificationService.getUserNotifications(userId, {
      limit,
      offset,
      unreadOnly,
      type
    });
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate the request
    try {
      await authenticateRequest(request);
    } catch {
      return createUnauthorizedResponse('Please sign in to access this feature');
    }
    
    const body = await request.json();
    const { notificationId, userId, markAllAsRead } = body;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Verify user can only modify their own notifications
    if (!(await verifyUserAccess(request, userId))) {
      return NextResponse.json(
        { success: false, message: 'You can only modify your own notifications' },
        { status: 403 }
      );
    }
    
    if (markAllAsRead) {
      // Mark all notifications as read
      await NotificationService.markAllAsRead(userId);
      
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } else {
      // Mark single notification as read
      if (!notificationId) {
        return NextResponse.json(
          { success: false, message: 'Notification ID is required' },
          { status: 400 }
        );
      }
      
      const updatedNotification = await NotificationService.markAsRead(notificationId, userId);
      
      if (!updatedNotification) {
        return NextResponse.json(
          { success: false, message: 'Notification not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
        data: updatedNotification
      });
    }
    
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get unread notification count
export async function HEAD(request: NextRequest) {
  try {
    // Authenticate the request
    try {
      await authenticateRequest(request);
    } catch {
      return createUnauthorizedResponse('Please sign in to access this feature');
    }
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Verify user can only access their own notification count
    if (!(await verifyUserAccess(request, userId))) {
      return NextResponse.json(
        { success: false, message: 'You can only access your own notification count' },
        { status: 403 }
      );
    }
    
    const unreadCount = await NotificationService.getUnreadCount(userId);
    
    return NextResponse.json({
      success: true,
      data: { unreadCount }
    });
    
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch notification count',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
