import { VoiceCommand, IVoiceCommand } from '../models/VoiceCommand';
import { VoiceRecordingResult } from './voiceRecorder';
import { WhisperTranscriptionResult } from './openaiService';
import { VoiceCommandIntent } from './openaiService';
import { NextRequest } from 'next/server';

// Local type definition for parsed command (previously imported from voiceCommandParser)
export interface ParsedVoiceCommand {
  intent: VoiceCommandIntent;
  action: string;
  apiEndpoint: string;
  method: 'GET' | 'POST';
  payload?: any;
  requiresAuth: boolean;
  userRole: 'employee' | 'manager' | 'hr';
}

export interface VoiceCommandStorageData {
  // User information
  userId: string;
  clerkUserId: string;
  userRole: 'employee' | 'manager' | 'hr';
  
  // Audio recording data
  audioRecording: VoiceRecordingResult;
  
  // Transcription data
  transcription: WhisperTranscriptionResult;
  
  // Intent extraction data
  intent: VoiceCommandIntent;
  
  // Parsed command data
  parsedCommand: ParsedVoiceCommand;
  
  // Request metadata
  request: NextRequest;
  
  // Additional context
  sessionId?: string;
  ipAddress?: string;
}

export interface VoiceCommandQueryFilters {
  userId?: string;
  clerkUserId?: string;
  userRole?: 'employee' | 'manager' | 'hr';
  extractedIntent?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class VoiceCommandStorage {
  
  /**
   * Create a voice command record from raw data
   */
  async createVoiceCommand(data: any): Promise<IVoiceCommand> {
    try {
      // Normalize confidence values to ensure they're within 0-1 range
      if (data.transcriptionConfidence !== undefined) {
        data.transcriptionConfidence = Math.min(Math.max(data.transcriptionConfidence, 0), 1);
      }
      if (data.intentConfidence !== undefined) {
        data.intentConfidence = Math.min(Math.max(data.intentConfidence, 0), 1);
      }
      
      const voiceCommand = new VoiceCommand(data);
      
      // Use save with timeout and retry logic
      const savedCommand = await Promise.race([
        voiceCommand.save(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Voice command save timeout')), 30000)
        )
      ]) as IVoiceCommand;
      
      return savedCommand;
      
    } catch (error) {
      
      // If it's a timeout error, try to save with a simpler approach
      if (error instanceof Error && error.message.includes('timeout')) {
        try {
          const voiceCommand = new VoiceCommand(data);
          const savedCommand = await voiceCommand.save({ timeout: 60000 });
          return savedCommand;
        } catch (retryError) {
          // Don't throw error, just continue
          return null as any; // Return null to indicate storage failed but processing can continue
        }
      }
      
      // For other errors, also don't throw to prevent breaking the voice command flow
      return null as any;
    }
  }
  
  /**
   * Store a complete voice command record in MongoDB
   */
  async storeVoiceCommand(data: VoiceCommandStorageData): Promise<IVoiceCommand> {
    try {
      const voiceCommandData = {
        // User information
        userId: data.userId,
        clerkUserId: data.clerkUserId,
        userRole: data.userRole,
        
        // Audio recording details
        audioDuration: data.audioRecording.duration,
        audioFormat: data.audioRecording.format,
        audioSize: data.audioRecording.size,
        
        // Transcription details
        rawTranscribedText: data.transcription.text,
        transcriptionLanguage: data.transcription.language,
        transcriptionConfidence: Math.min(Math.max(data.transcription.confidence, 0), 1), // Normalize to 0-1 range
        
        // Intent extraction details
        extractedIntent: data.intent.intent,
        intentConfidence: Math.min(Math.max(data.intent.confidence, 0), 1), // Normalize to 0-1 range
        intentParameters: data.intent.parameters,
        
        // Command execution details
        action: data.parsedCommand.action,
        apiEndpoint: data.parsedCommand.apiEndpoint,
        method: data.parsedCommand.method,
        payload: data.parsedCommand.payload,
        
        // Status
        status: 'pending' as const,
        
        // Timestamps
        recordedAt: new Date(),
        processedAt: new Date(),
        
        // Additional metadata
        userAgent: data.request.headers.get('user-agent') || 'Unknown',
        ipAddress: data.ipAddress || this.extractIPAddress(data.request),
        sessionId: data.sessionId
      };
      
      const voiceCommand = new VoiceCommand(voiceCommandData);
      const savedCommand = await voiceCommand.save();
      
      return savedCommand;
      
    } catch (error) {
      throw new Error(`Voice command storage failed: ${error}`);
    }
  }
  
  /**
   * Update voice command status and execution result
   */
  async updateVoiceCommandStatus(
    commandId: string, 
    status: 'processing' | 'completed' | 'failed',
    executionResult?: any,
    errorMessage?: string
  ): Promise<IVoiceCommand> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };
      
      if (status === 'completed') {
        updateData.executedAt = new Date();
        updateData.executionResult = executionResult;
      } else if (status === 'failed') {
        updateData.errorMessage = errorMessage;
      }
      
      const updatedCommand = await VoiceCommand.findByIdAndUpdate(
        commandId,
        updateData,
        { new: true }
      );
      
      if (!updatedCommand) {
        throw new Error(`Voice command not found: ${commandId}`);
      }
      
      return updatedCommand;
      
    } catch (error) {
      throw new Error(`Voice command status update failed: ${error}`);
    }
  }
  
  /**
   * Query voice commands with filters
   */
  async queryVoiceCommands(filters: VoiceCommandQueryFilters): Promise<IVoiceCommand[]> {
    try {
      const query: any = {};
      
      // Apply filters
      if (filters.userId) query.userId = filters.userId;
      if (filters.clerkUserId) query.clerkUserId = filters.clerkUserId;
      if (filters.userRole) query.userRole = filters.userRole;
      if (filters.extractedIntent) query.extractedIntent = filters.extractedIntent;
      if (filters.status) query.status = filters.status;
      
      // Date range filter
      if (filters.startDate || filters.endDate) {
        query.recordedAt = {};
        if (filters.startDate) query.recordedAt.$gte = filters.startDate;
        if (filters.endDate) query.recordedAt.$lte = filters.endDate;
      }
      
      // Build query with pagination
      let voiceCommandsQuery = VoiceCommand.find(query)
        .sort({ recordedAt: -1 }); // Most recent first
      
      if (filters.offset) {
        voiceCommandsQuery = voiceCommandsQuery.skip(filters.offset);
      }
      
      if (filters.limit) {
        voiceCommandsQuery = voiceCommandsQuery.limit(filters.limit);
      }
      
      const voiceCommands = await voiceCommandsQuery.exec();
      return voiceCommands;
      
    } catch (error) {
      throw new Error(`Voice command query failed: ${error}`);
    }
  }
  
  /**
   * Get voice command by ID
   */
  async getVoiceCommandById(commandId: string): Promise<IVoiceCommand | null> {
    try {
      const voiceCommand = await VoiceCommand.findById(commandId);
      return voiceCommand;
    } catch (error) {
      throw new Error(`Voice command retrieval failed: ${error}`);
    }
  }
  
  /**
   * Get voice command statistics
   */
  async getVoiceCommandStats(userId?: string): Promise<{
    total: number;
    byIntent: Record<string, number>;
    byStatus: Record<string, number>;
    byRole: Record<string, number>;
    averageConfidence: number;
  }> {
    try {
      const matchStage: any = {};
      if (userId) matchStage.userId = userId;
      
      const stats = await VoiceCommand.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            averageConfidence: { $avg: '$intentConfidence' },
            byIntent: {
              $push: {
                intent: '$extractedIntent',
                count: 1
              }
            },
            byStatus: {
              $push: {
                status: '$status',
                count: 1
              }
            },
            byRole: {
              $push: {
                role: '$userRole',
                count: 1
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            averageConfidence: 1,
            byIntent: {
              $arrayToObject: {
                $map: {
                  input: '$byIntent',
                  as: 'item',
                  in: {
                    k: '$$item.intent',
                    v: '$$item.count'
                  }
                }
              }
            },
            byStatus: {
              $arrayToObject: {
                $map: {
                  input: '$byStatus',
                  as: 'item',
                  in: {
                    k: '$$item.status',
                    v: '$$item.count'
                  }
                }
              }
            },
            byRole: {
              $arrayToObject: {
                $map: {
                  input: '$byRole',
                  as: 'item',
                  in: {
                    k: '$$item.role',
                    v: '$$item.count'
                  }
                }
              }
            }
          }
        }
      ]);
      
      return stats[0] || {
        total: 0,
        byIntent: {},
        byStatus: {},
        byRole: {},
        averageConfidence: 0
      };
      
    } catch (error) {
      throw new Error(`Voice command stats retrieval failed: ${error}`);
    }
  }
  
  /**
   * Search voice commands by transcribed text
   */
  async searchVoiceCommands(searchTerm: string, filters?: VoiceCommandQueryFilters): Promise<IVoiceCommand[]> {
    try {
      const query: any = {
        $text: { $search: searchTerm }
      };
      
      // Apply additional filters
      if (filters?.userId) query.userId = filters.userId;
      if (filters?.userRole) query.userRole = filters.userRole;
      if (filters?.status) query.status = filters.status;
      
      const voiceCommands = await VoiceCommand.find(query)
        .sort({ score: { $meta: 'textScore' } })
        .limit(filters?.limit || 50)
        .exec();
      
      return voiceCommands;
      
    } catch (error) {
      throw new Error(`Voice command search failed: ${error}`);
    }
  }
  
  /**
   * Delete voice commands older than specified date
   */
  async deleteOldVoiceCommands(olderThan: Date): Promise<number> {
    try {
      const result = await VoiceCommand.deleteMany({
        recordedAt: { $lt: olderThan }
      });
      
      return result.deletedCount || 0;
      
    } catch (error) {
      throw new Error(`Voice command cleanup failed: ${error}`);
    }
  }
  
  /**
   * Extract IP address from request
   */
  private extractIPAddress(request: NextRequest): string | undefined {
    try {
      // Try to get IP from various headers
      const forwarded = request.headers.get('x-forwarded-for');
      const realIP = request.headers.get('x-real-ip');
      const cfConnectingIP = request.headers.get('cf-connecting-ip');
      
      if (forwarded) {
        return forwarded.split(',')[0].trim();
      }
      
      if (realIP) {
        return realIP;
      }
      
      if (cfConnectingIP) {
        return cfConnectingIP;
      }
      
      return undefined;
    } catch (error) {
      return undefined;
    }
  }
}
