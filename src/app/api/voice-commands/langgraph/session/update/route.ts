import { NextRequest, NextResponse } from "next/server";
import { RedisSessionStore } from "../../../../../../lib/session/sessionStore";
import { logger } from "../../../../../../lib/langGraph/utils/logger";
import { generateCorsHeaders } from "../../../../../../lib/cors";
import type { SessionData } from "../../../../../../lib/langGraph/types/session";

export async function PUT(req: NextRequest) {
  const requestStart = Date.now();

  try {
    // Get session ID from query parameters
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
      return NextResponse.json(
        { 
          error: 'Session ID required',
          details: 'Please provide sessionId as query parameter',
          code: 'SESSION_ID_REQUIRED'
        },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Get user ID for authorization
    const userId = req.headers.get('x-user-id') || req.headers.get('x-clerk-user-id');
    
    // Parse update data from request body
    const updateData = await req.json();
    
    // Validate update data
    const allowedFields = [
      'conversationHistory',
      'currentWorkflow',
      'workflowStep',
      'userTimezone',
      'userRole',
      'userPreferences',
      'pendingActions',
      'completedActions',
      'contextData',
      'totalInteractions',
      'averageResponseTime',
      'errorCount',
      'isActive',
      'lastActivity'
    ];

    const filteredUpdates: Partial<Omit<SessionData, 'id'>> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key as keyof Omit<SessionData, 'id'>] = value as any;
      }
    }

    // Always update lastActivity and metadata.updatedAt
    filteredUpdates.lastActivity = new Date().toISOString();
    if (filteredUpdates.metadata) {
      filteredUpdates.metadata.updatedAt = new Date().toISOString();
    } else {
      filteredUpdates.metadata = {
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
    }

    // Check if session exists and user is authorized
    const existingSession = await RedisSessionStore.get(sessionId);
    
    if (!existingSession) {
      const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
      return NextResponse.json(
        { 
          error: 'Session not found',
          details: 'Session may have expired or does not exist',
          code: 'SESSION_NOT_FOUND'
        },
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }

    if (userId && existingSession.userId !== userId) {
      const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          details: 'You are not authorized to update this session',
          code: 'UNAUTHORIZED'
        },
        { 
          status: 403,
          headers: corsHeaders
        }
      );
    }

    // Update session
    const updatedSession = await RedisSessionStore.update(sessionId, filteredUpdates);
    
    if (!updatedSession) {
      const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
      return NextResponse.json(
        { 
          error: 'Update failed',
          details: 'Failed to update session data',
          code: 'UPDATE_FAILED'
        },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

    const totalDuration = Date.now() - requestStart;
    logger.info('Session updated successfully', { 
      sessionId, 
      userId: updatedSession.userId
    });

    const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
    return NextResponse.json({ 
      success: true,
      session: updatedSession,
      updatedFields: Object.keys(filteredUpdates),
      duration: totalDuration
    }, {
      headers: corsHeaders
    });
    
  } catch (err) {
    const totalDuration = Date.now() - requestStart;
    const error = err as Error;
    
    logger.error('Session update failed', { 
      sessionId: req.url.split('sessionId=')[1]?.split('&')[0] || 'unknown'
    }, error, { 
      totalDuration,
      errorMessage: error.message 
    });

    const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      duration: totalDuration
    }, { 
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function PATCH(req: NextRequest) {
  // PATCH is an alias for PUT
  return PUT(req);
}

export async function OPTIONS(req: NextRequest) {
  const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
  return new NextResponse(null, { 
    status: 200,
    headers: corsHeaders
  });
}
