import { NextRequest, NextResponse } from "next/server";
import { RedisSessionStore } from "../../../../../../lib/session/sessionStore";
import { logger } from "../../../../../../lib/langGraph/utils/logger";
import { generateCorsHeaders } from "../../../../../../lib/cors";

export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  const sessionId = crypto.randomUUID();

  try {
    // Get user ID from headers or body
    const userId = req.headers.get('x-user-id') || req.headers.get('x-clerk-user-id');
    
    if (!userId) {
      const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
      return NextResponse.json(
        { 
          error: 'User ID required',
          details: 'Please provide user ID in headers or body',
          code: 'USER_ID_REQUIRED'
        },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Parse request body for additional session data
    const body = await req.json().catch(() => ({}));
    const {
      userTimezone = 'UTC',
      userRole = 'employee',
      userPreferences = {},
      contextData = {},
      ipAddress,
      userAgent
    } = body;

    // Create new session
    const now = new Date().toISOString();
    const sessionData = {
      id: sessionId,
      userId,
      createdAt: now,
      lastActivity: now,
      isActive: true,
      
      // Conversation Context
      conversationHistory: [],
      currentWorkflow: null,
      workflowStep: null,
      
      // User Context
      userTimezone,
      userRole: userRole as 'employee' | 'manager' | 'hr',
      userPreferences,
      
      // Session State
      pendingActions: [],
      completedActions: [],
      contextData,
      
      // Metadata / Analytics
      totalInteractions: 0,
      averageResponseTime: 0,
      errorCount: 0,
      
      // Expiry (15 minutes from now)
      context: {}, // kept for backward-compat
      expiresAt: new Date(Date.now() + 900000).toISOString(), // 15 minutes
      metadata: {
        userId,
        createdAt: now,
        updatedAt: now,
        ipAddress: ipAddress || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        userAgent: userAgent || req.headers.get('user-agent')
      }
    };

    // Store session
    await RedisSessionStore.set(sessionData);

    const totalDuration = Date.now() - requestStart;
    logger.info('Session created successfully', { 
      sessionId, 
      userId
    });

    const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
    return NextResponse.json({ 
      success: true,
      sessionId,
      session: sessionData,
      duration: totalDuration
    }, {
      headers: corsHeaders
    });
    
  } catch (err) {
    const totalDuration = Date.now() - requestStart;
    const error = err as Error;
    
    logger.error('Session creation failed', { 
      sessionId, 
      userId: req.headers.get('x-user-id') || 'unknown'
    }, error, { 
      totalDuration,
      errorMessage: error.message 
    });

    const corsHeaders = generateCorsHeaders(req.headers.get('origin') || undefined);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      sessionId,
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
