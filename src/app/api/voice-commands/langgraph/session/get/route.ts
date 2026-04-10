import { NextRequest, NextResponse } from "next/server";
import { RedisSessionStore } from "../../../../../../lib/session/sessionStore";
import { logger } from "../../../../../../lib/langGraph/utils/logger";
import { generateCorsHeaders } from "../../../../../../lib/cors";

export async function GET(req: NextRequest) {
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
    
    // Retrieve session
    const session = await RedisSessionStore.get(sessionId);
    
    if (!session) {
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

    // Check if user is authorized to access this session
    if (userId && session.userId !== userId) {
      const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          details: 'You are not authorized to access this session',
          code: 'UNAUTHORIZED'
        },
        { 
          status: 403,
          headers: corsHeaders
        }
      );
    }

    // Check if session is still active
    const now = new Date();
    const lastActivity = new Date(session.lastActivity);
    const timeDiff = now.getTime() - lastActivity.getTime();
    const isExpired = timeDiff > 900000; // 15 minutes

    if (isExpired) {
      // Mark session as inactive
      await RedisSessionStore.update(sessionId, { isActive: false });
      
      const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
      return NextResponse.json(
        { 
          error: 'Session expired',
          details: 'Session has been inactive for too long',
          code: 'SESSION_EXPIRED',
          session: { ...session, isActive: false }
        },
        { 
          status: 410,
          headers: corsHeaders
        }
      );
    }

    const totalDuration = Date.now() - requestStart;
    logger.info('Session retrieved successfully', { 
      sessionId, 
      userId: session.userId
    });

    const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
    return NextResponse.json({ 
      success: true,
      session,
      duration: totalDuration
    }, {
      headers: corsHeaders
    });
    
  } catch (err) {
    const totalDuration = Date.now() - requestStart;
    const error = err as Error;
    
    logger.error('Session retrieval failed', { 
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
