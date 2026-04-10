import mongoose, { Document, Schema } from 'mongoose';

// Individual message in conversation (user or assistant)
export interface IConversationMessage {
  messageId: string;
  type: 'user' | 'assistant' | 'system';
  timestamp: Date;
  
  // User message fields
  rawTranscribedText?: string;
  transcriptionConfidence?: number;
  
  // Assistant/System message fields
  content: string;
  
  // Intent & execution (when applicable)
  intent?: string;
  intentConfidence?: number;
  parameters?: Record<string, any>;
  executionResult?: any;
  
  // Metadata
  metadata?: Record<string, any>;
}

// Conversation session document
export interface IVoiceSession extends Document {
  sessionId: string;
  userId: string;
  clerkUserId: string;
  userRole: 'employee' | 'manager' | 'hr';
  
  // Conversation messages (chronological order)
  conversationHistory: IConversationMessage[];
  
  // Current conversation context
  currentIntent?: string;
  currentIntentConfidence?: number;
  awaitingResponse: boolean;
  requiresConfirmation: boolean;
  
  // Session statistics
  totalMessages: number;
  totalUserMessages: number;
  totalAssistantMessages: number;
  completedIntents: string[]; // Track what intents were completed
  
  // Timestamps
  sessionStartedAt: Date;
  lastActivityAt: Date;
  sessionEndedAt?: Date;
  
  // Session info
  isActive: boolean;
  userAgent: string;
  ipAddress?: string;
  
  // Analytics
  averageResponseTime: number;
  totalDuration: number;
}

const ConversationMessageSchema = new Schema<IConversationMessage>({
  messageId: {
    type: String,
    required: true
  },
  
  type: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // User message fields
  rawTranscribedText: {
    type: String
  },
  
  transcriptionConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  
  // Assistant/System message fields
  content: {
    type: String,
    required: true
  },
  
  // Intent & execution
  intent: {
    type: String,
    index: true
  },
  
  intentConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  
  parameters: {
    type: Schema.Types.Mixed
  },
  
  executionResult: {
    type: Schema.Types.Mixed
  },
  
  // Metadata
  metadata: {
    type: Schema.Types.Mixed
  }
}, { _id: false }); // Don't create _id for subdocuments

const VoiceSessionSchema = new Schema<IVoiceSession>({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  userId: {
    type: String,
    required: true,
    index: true
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
  
  conversationHistory: [ConversationMessageSchema],
  
  currentIntent: {
    type: String
  },
  
  currentIntentConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  
  awaitingResponse: {
    type: Boolean,
    default: false
  },
  
  requiresConfirmation: {
    type: Boolean,
    default: false
  },
  
  totalMessages: {
    type: Number,
    default: 0
  },
  
  totalUserMessages: {
    type: Number,
    default: 0
  },
  
  totalAssistantMessages: {
    type: Number,
    default: 0
  },
  
  completedIntents: [{
    type: String
  }],
  
  sessionStartedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  lastActivityAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  
  sessionEndedAt: {
    type: Date
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  
  ipAddress: {
    type: String
  },
  
  averageResponseTime: {
    type: Number,
    default: 0
  },
  
  totalDuration: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'voiceSessions'
});

// Indexes for efficient querying
VoiceSessionSchema.index({ userId: 1, lastActivityAt: -1 });
VoiceSessionSchema.index({ sessionId: 1, userId: 1 });
VoiceSessionSchema.index({ isActive: 1, lastActivityAt: -1 });
VoiceSessionSchema.index({ currentIntent: 1 });
VoiceSessionSchema.index({ completedIntents: 1 });

// Text search index for conversation content
VoiceSessionSchema.index({ 
  'conversationHistory.rawTranscribedText': 'text',
  'conversationHistory.content': 'text'
});

export const VoiceSession = mongoose.models.VoiceSession || 
  mongoose.model<IVoiceSession>('VoiceSession', VoiceSessionSchema);

export default VoiceSession;

