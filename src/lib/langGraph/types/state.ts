// Unified state types for LangGraph

export type Primitive = string | number | boolean | null | undefined;

export type Serializable =
  | Primitive
  | Date
  | Serializable[]
  | { [key: string]: Serializable };

// Base message schema
export interface BaseMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string; // ISO
}

// Conversation message schema
export interface ConversationMessage {
  id: string;
  timestamp: Date;
  type: 'user' | 'assistant' | 'system';
  content: string;
  intent?: string;
  confidence?: number;
  parameters?: Record<string, any>;
  executionResult?: any;
  metadata?: Record<string, any>;
}

// Node execution status
export type NodeStatus = 'idle' | 'running' | 'completed' | 'error' | 'skipped';

export interface NodeExecutionRecord {
  nodeId: string;
  status: NodeStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

// Single unified state that flows through the entire LangGraph system
export interface VoiceCommandState {
  // Session Management
  sessionId: string;
  userId: string;

  // Current Processing
  currentIntent: string;
  requiredData: Record<string, any>;
  missingParameters: string[];

  // Conversation Context
  messages: BaseMessage[];
  conversationHistory: ConversationMessage[];

  // Processing Status
  isComplete: boolean;
  requiresConfirmation: boolean;
  dataCollectionReply?: string;

  // Node-level Status Tracking
  currentNode?: string;
  nodeStatus: NodeStatus;
  nodeStartTime?: string;
  nodeEndTime?: string;
  nodeProgress: NodeExecutionRecord[];

  // Execution
  executionResult?: any;
  error?: string;
}

// Simplified node input/output types
export interface NodeInput<T = unknown> {
  value: T;
  state: VoiceCommandState;
}

export interface NodeOutput<T = unknown> {
  value: T;
  state: VoiceCommandState;
}

// Helper function to create initial state with proper defaults
export function createInitialVoiceCommandState(sessionId: string, userId: string): VoiceCommandState {
  return {
    sessionId,
    userId,
    currentIntent: '',
    requiredData: {},
    missingParameters: [],
    messages: [],
    conversationHistory: [],
    isComplete: false,
    requiresConfirmation: false,
    nodeStatus: 'idle',
    nodeProgress: []
  };
}

// Helper function to update node status in state
export function updateNodeStatus(
  state: VoiceCommandState,
  nodeId: string,
  status: NodeStatus,
  error?: string,
  metadata?: Record<string, any>
): VoiceCommandState {
  const now = new Date().toISOString();

  return {
    ...state,
    currentNode: nodeId,
    nodeStatus: status,
    nodeStartTime: status === 'running' ? now : state.nodeStartTime,
    nodeEndTime: (status === 'completed' || status === 'error' || status === 'skipped') ? now : state.nodeEndTime,
    nodeProgress: [
      ...state.nodeProgress,
      {
        nodeId,
        status,
        startTime: status === 'running' ? now : state.nodeStartTime || now,
        endTime: (status === 'completed' || status === 'error' || status === 'skipped') ? now : undefined,
        duration: (status === 'completed' || status === 'error' || status === 'skipped')
          ? state.nodeStartTime ? (new Date(now).getTime() - new Date(state.nodeStartTime).getTime()) : undefined
          : undefined,
        error: status === 'error' ? error : undefined,
        metadata
      }
    ]
  };
}


