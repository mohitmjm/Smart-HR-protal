// Session-related types for LangGraph

import type { Serializable } from "./state";

// Re-export Serializable for convenience
export type { Serializable } from "./state";

export type ConversationMessageType = "user" | "assistant" | "system";

export interface ConversationMessage {
  id: string;
  timestamp: string; // ISO
  type: ConversationMessageType;
  content: string;
  intent?: string;
  confidence?: number;
  parameters?: Record<string, Serializable>;
  executionResult?: Serializable;
  metadata?: Record<string, Serializable>;
}

export type SessionId = string;

export interface SessionMetadata {
  userId?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionData {
  id: SessionId;
  userId: string;
  createdAt: string; // ISO
  lastActivity: string; // ISO
  isActive: boolean;

  // Conversation Context
  conversationHistory: ConversationMessage[];
  currentWorkflow: string | null;
  workflowStep: string | null;

  // User Context
  userTimezone: string;
  userRole: "employee" | "manager" | "hr";
  userPreferences: Record<string, Serializable>;

  // Session State
  pendingActions: string[];
  completedActions: string[];
  contextData: Record<string, Serializable>;

  // Metadata / Analytics
  totalInteractions: number;
  averageResponseTime: number;
  errorCount: number;

  // Expiry
  context: Record<string, Serializable>; // kept for backward-compat
  expiresAt?: string; // ISO timestamp
  metadata?: SessionMetadata;
}

export interface SessionStore {
  get: (id: SessionId) => Promise<SessionData | null>;
  set: (session: SessionData) => Promise<void>;
  update: (
    id: SessionId,
    updates: Partial<Omit<SessionData, "id">>
  ) => Promise<SessionData | null>;
  delete: (id: SessionId) => Promise<void>;
}


