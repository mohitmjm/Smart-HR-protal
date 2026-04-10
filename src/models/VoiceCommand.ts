import mongoose, { Document, Schema } from 'mongoose';

export interface IVoiceCommand extends Document {
  userId: string;
  clerkUserId: string;
  userRole: 'employee' | 'manager' | 'hr';
  
  // Audio recording details
  audioDuration: number;
  audioFormat: string;
  audioSize: number;
  
  // Transcription details
  rawTranscribedText: string;
  transcriptionLanguage: string;
  transcriptionConfidence: number;
  
  // Intent extraction details
  extractedIntent: string;
  intentConfidence: number;
  intentParameters: Record<string, any>;
  
  // Command execution details
  action: string;
  apiEndpoint: string;
  method: 'GET' | 'POST';
  payload: any;
  
  // Status and metadata
  status: 'pending' | 'processing' | 'completed' | 'failed';
  executionResult?: any;
  errorMessage?: string;
  
  // Timestamps
  recordedAt: Date;
  processedAt: Date;
  executedAt?: Date;
  
  // Additional metadata
  userAgent: string;
  ipAddress?: string;
  sessionId?: string;
}

const VoiceCommandSchema = new Schema<IVoiceCommand>({
  userId: {
    type: String,
    required: true
  },
  
  clerkUserId: {
    type: String,
    required: true,
    index: true
  },
  
  userRole: {
    type: String,
    enum: ['employee', 'manager', 'hr'],
    required: true
  },
  
  // Audio recording details
  audioDuration: {
    type: Number,
    required: true,
    min: 0
  },
  
  audioFormat: {
    type: String,
    required: true
  },
  
  audioSize: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Transcription details
  rawTranscribedText: {
    type: String,
    required: true
  },
  
  transcriptionLanguage: {
    type: String,
    required: true,
    default: 'en'
  },
  
  transcriptionConfidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    validate: {
      validator: function(value: number) {
        return value >= 0 && value <= 1;
      },
      message: 'transcriptionConfidence must be between 0 and 1'
    }
  },
  
  // Intent extraction details
  extractedIntent: {
    type: String,
    required: true
  },
  
  intentConfidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    validate: {
      validator: function(value: number) {
        return value >= 0 && value <= 1;
      },
      message: 'intentConfidence must be between 0 and 1'
    }
  },
  
  intentParameters: {
    type: Schema.Types.Mixed,
    required: false
  },
  
  
  // Command execution details
  action: {
    type: String,
    required: true,
    index: true
  },
  
  apiEndpoint: {
    type: String,
    required: true
  },
  
  method: {
    type: String,
    enum: ['GET', 'POST'],
    required: true
  },
  
  payload: {
    type: Schema.Types.Mixed,
    required: false
  },
  
  // Status and metadata
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    required: true,
    default: 'pending'
  },
  
  executionResult: {
    type: Schema.Types.Mixed,
    required: false
  },
  
  errorMessage: {
    type: String,
    required: false
  },
  
  // Timestamps
  recordedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  processedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  executedAt: {
    type: Date,
    required: false
  },
  
  // Additional metadata
  userAgent: {
    type: String,
    required: true
  },
  
  ipAddress: {
    type: String,
    required: false
  },
  
  sessionId: {
    type: String,
    required: false,
    index: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'voiceCommands'
});

// Indexes for efficient querying
VoiceCommandSchema.index({ userId: 1, recordedAt: -1 });
VoiceCommandSchema.index({ extractedIntent: 1, status: 1 });
VoiceCommandSchema.index({ status: 1, recordedAt: -1 });
VoiceCommandSchema.index({ userRole: 1, recordedAt: -1 });

// Text search index for transcribed text
VoiceCommandSchema.index({ rawTranscribedText: 'text' });

// Compound index for analytics
VoiceCommandSchema.index({ 
  extractedIntent: 1, 
  userRole: 1, 
  recordedAt: 1 
});

export const VoiceCommand = mongoose.models.VoiceCommand || 
  mongoose.model<IVoiceCommand>('VoiceCommand', VoiceCommandSchema);

export default VoiceCommand;
