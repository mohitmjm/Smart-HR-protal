import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../../lib/auth';
import { VoiceSession } from '../../../models/VoiceSession';
import connectDB from '../../../lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();
    
    // Authenticate user
    const authenticatedUser = await authenticateRequest(request);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    // Build query
    const query: any = {
      userId: authenticatedUser.userId
    };
    
    if (!includeInactive) {
      query.isActive = true;
    }
    
    // Query voice sessions for the user
    const voiceSessions = await VoiceSession.find(query)
      .sort({ lastActivityAt: -1 })
      .skip(offset)
      .limit(limit)
      .select('-__v')
      .lean();
    
    // Get total count
    const total = await VoiceSession.countDocuments(query);
    
    // Flatten conversation messages for backward compatibility with old format
    const flattenedCommands = voiceSessions
      .flatMap(session => 
        session.conversationHistory
          .filter((msg: any) => msg.type === 'user' || msg.type === 'assistant')
          .reduce((acc: any[], msg: any, idx: number, arr: any[]) => {
            // For each user message, pair it with the next assistant message
            if (msg.type === 'user') {
              const assistantMsg = arr[idx + 1];
              acc.push({
                _id: msg.messageId,
                sessionId: session.sessionId,
                userId: session.userId,
                userRole: session.userRole,
                
                // User message (transcription)
                rawTranscribedText: msg.rawTranscribedText || msg.content,
                transcriptionLanguage: 'en',
                transcriptionConfidence: msg.transcriptionConfidence || 0.95,
                
                // Intent
                extractedIntent: msg.intent || '',
                intentConfidence: msg.intentConfidence || 0,
                intentParameters: msg.parameters || {},
                
                // Assistant response
                action: msg.intent || '',
                status: 'completed',
                message: assistantMsg?.content || '',
                executionResult: msg.executionResult || assistantMsg?.executionResult,
                
                // Timestamps
                recordedAt: msg.timestamp,
                processedAt: msg.timestamp,
                executedAt: assistantMsg?.timestamp,
                
                // Session metadata
                sessionStartedAt: session.sessionStartedAt,
                isActive: session.isActive
              });
            }
            return acc;
          }, [])
      )
      // Sort all commands by timestamp (newest first)
      // UI will reverse this to show newest at bottom
      .sort((a, b) => {
        const dateA = new Date(a.recordedAt).getTime();
        const dateB = new Date(b.recordedAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
    
    return NextResponse.json({
      success: true,
      data: {
        sessions: voiceSessions,
        voiceCommands: flattenedCommands, // For backward compatibility
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve voice sessions',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

