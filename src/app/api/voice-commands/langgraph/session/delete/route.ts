import { NextRequest, NextResponse } from "next/server";
import { RedisSessionStore } from "../../../../../../lib/session/sessionStore";
import { logger } from "../../../../../../lib/langGraph/utils/logger";
import { generateCorsHeaders } from "../../../../../../lib/cors";

export async function DELETE(req: NextRequest) {
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
    
    // Check if session exists and user is authorized
    const existingSession = await RedisSessionStore.get(sessionId);
    
    if (!existingSession) {
      const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
      return NextResponse.json(
        { 
          error: 'Session not found',
          details: 'Session may have already been deleted or does not exist',
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
          details: 'You are not authorized to delete this session',
          code: 'UNAUTHORIZED'
        },
        { 
          status: 403,
          headers: corsHeaders
        }
      );
    }

    // Delete session
    await RedisSessionStore.delete(sessionId);

    const totalDuration = Date.now() - requestStart;
    logger.info('Session deleted successfully', { 
      sessionId, 
      userId: existingSession.userId
    });

    const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
    return NextResponse.json({ 
      success: true,
      message: 'Session deleted successfully',
      sessionId,
      duration: totalDuration
    }, {
      headers: corsHeaders
    });
    
  } catch (err) {
    const totalDuration = Date.now() - requestStart;
    const error = err as Error;
    
    logger.error('Session deletion failed', { 
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

export async function OPTIONS(req: NextRequest) {
  const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
  return new NextResponse(null, { 
    status: 200,
    headers: corsHeaders
  });
}
