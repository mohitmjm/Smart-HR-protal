import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../../lib/auth';
import { VoiceCommand } from '../../../models/VoiceCommand';
import connectDB from '../../../lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();
    
    // Authenticate user
    const authenticatedUser = await authenticateRequest(request);
    
    // Parse request body
    const body = await request.json();
    
    // Create voice command record
    const voiceCommand = new VoiceCommand({
      userId: authenticatedUser.userId,
      clerkUserId: authenticatedUser.userId,
      userRole: 'employee', // Default role
      
      // Audio recording details
      audioDuration: body.audioDuration || 0,
      audioFormat: body.audioFormat || 'audio/webm',
      audioSize: body.audioSize || 0,
      
      // Transcription details
      rawTranscribedText: body.rawTranscribedText || '',
      transcriptionLanguage: body.transcriptionLanguage || 'en',
      transcriptionConfidence: body.transcriptionConfidence || 0,
      
      // Intent extraction details
      extractedIntent: body.extractedIntent || '',
      intentConfidence: body.intentConfidence || 0,
      intentParameters: body.intentParameters || {},
      
      // Command execution details
      action: body.action || '',
      apiEndpoint: body.apiEndpoint || '',
      method: body.method || 'GET',
      payload: body.payload || {},
      
      // Status
      status: 'pending',
      
      // Timestamps
      recordedAt: new Date(),
      processedAt: new Date(),
      
      // Additional metadata
      userAgent: request.headers.get('user-agent') || 'Unknown'
    });
    
    // Save to database
    const savedCommand = await voiceCommand.save();
    
    return NextResponse.json({
      success: true,
      message: 'Voice command stored successfully',
      data: {
        id: savedCommand._id,
        status: savedCommand.status
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to store voice command',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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
    
    
    // Query voice commands for the user - get more recent ones
    const voiceCommands = await VoiceCommand.find({
      userId: authenticatedUser.userId
    })
    .sort({ recordedAt: -1, createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .select('-__v')
    .lean();
    
    
    // Log the date range of commands
    if (voiceCommands.length > 0) {
      const dates = voiceCommands.map(cmd => new Date(cmd.recordedAt || cmd.createdAt));
      const oldest = new Date(Math.min(...dates.map(d => d.getTime())));
      const newest = new Date(Math.max(...dates.map(d => d.getTime())));
    }
    
    // Get total count
    const total = await VoiceCommand.countDocuments({
      userId: authenticatedUser.userId
    });
    
    
    return NextResponse.json({
      success: true,
      data: {
        voiceCommands,
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
        message: 'Failed to retrieve voice commands',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
