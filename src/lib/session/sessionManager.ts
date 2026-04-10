// Session lifecycle management for LangGraph voice commands

import { RedisSessionStore } from "./sessionStore";
import { logger } from "../langGraph/utils/logger";
import type { SessionData, SessionId, ConversationMessage } from "../langGraph/types/session";

export class SessionManager {
  private static instance: SessionManager;
  private sessionStore: typeof RedisSessionStore;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_TTL = 900000; // 15 minutes in milliseconds
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes

  private constructor() {
    this.sessionStore = RedisSessionStore;
    this.startCleanupScheduler();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Create a new session for a user
   */
  async createSession(
    userId: string,
    options: {
      userTimezone?: string;
      userRole?: 'employee' | 'manager' | 'hr';
      userPreferences?: Record<string, any>;
      contextData?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<SessionData> {
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const sessionData: SessionData = {
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
      userTimezone: options.userTimezone || 'UTC',
      userRole: options.userRole || 'employee',
      userPreferences: options.userPreferences || {},
      
      // Session State
      pendingActions: [],
      completedActions: [],
      contextData: options.contextData || {},
      
      // Metadata / Analytics
      totalInteractions: 0,
      averageResponseTime: 0,
      errorCount: 0,
      
      // Expiry
      context: {}, // kept for backward-compat
      expiresAt: new Date(Date.now() + this.SESSION_TTL).toISOString(),
      metadata: {
        userId,
        createdAt: now,
        updatedAt: now,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent
      }
    };

    await this.sessionStore.set(sessionData);
    
    logger.info('Session created', { 
      sessionId, 
      userId
    });

    return sessionData;
  }

  /**
   * Get an existing session
   */
  async getSession(sessionId: SessionId): Promise<SessionData | null> {
    try {
      const session = await this.sessionStore.get(sessionId);
      
      if (!session) {
        return null;
      }

      // Check if session is expired
      if (this.isSessionExpired(session)) {
        await this.deactivateSession(sessionId);
        return null;
      }

      return session;
    } catch (error) {
      logger.error('Failed to get session', { sessionId }, error as Error);
      return null;
    }
  }

  /**
   * Update session data
   */
  async updateSession(
    sessionId: SessionId, 
    updates: Partial<Omit<SessionData, 'id'>>
  ): Promise<SessionData | null> {
    try {
      // Always update lastActivity and metadata.updatedAt
      const now = new Date().toISOString();
      const finalUpdates = {
        ...updates,
        lastActivity: now,
        metadata: {
          ...updates.metadata,
          updatedAt: now,
          createdAt: updates.metadata?.createdAt || new Date().toISOString()
        }
      };

      const updatedSession = await this.sessionStore.update(sessionId, finalUpdates);
      
      if (updatedSession) {
        logger.info('Session updated', { 
          sessionId, 
          userId: updatedSession.userId
        });
      }

      return updatedSession;
    } catch (error) {
      logger.error('Failed to update session', { sessionId }, error as Error);
      return null;
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: SessionId): Promise<boolean> {
    try {
      await this.sessionStore.delete(sessionId);
      logger.info('Session deleted', { sessionId });
      return true;
    } catch (error) {
      logger.error('Failed to delete session', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Add a message to conversation history
   */
  async addMessage(
    sessionId: SessionId, 
    message: Omit<ConversationMessage, 'id' | 'timestamp'>
  ): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }

      const newMessage: ConversationMessage = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      };

      const updatedHistory = [...session.conversationHistory, newMessage];
      
      await this.updateSession(sessionId, {
        conversationHistory: updatedHistory,
        totalInteractions: session.totalInteractions + 1
      });

      return true;
    } catch (error) {
      logger.error('Failed to add message to session', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Update workflow state
   */
  async updateWorkflowState(
    sessionId: SessionId, 
    workflow: string | null, 
    step: string | null
  ): Promise<boolean> {
    try {
      const result = await this.updateSession(sessionId, {
        currentWorkflow: workflow,
        workflowStep: step
      });

      return result !== null;
    } catch (error) {
      logger.error('Failed to update workflow state', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Set context data
   */
  async setContextData(
    sessionId: SessionId, 
    key: string, 
    value: any
  ): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }

      const updatedContextData = {
        ...session.contextData,
        [key]: value
      };

      const result = await this.updateSession(sessionId, {
        contextData: updatedContextData
      });

      return result !== null;
    } catch (error) {
      logger.error('Failed to set context data', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Get context data
   */
  async getContextData(sessionId: SessionId, key: string): Promise<any> {
    try {
      const session = await this.getSession(sessionId);
      return session?.contextData[key];
    } catch (error) {
      logger.error('Failed to get context data', { sessionId }, error as Error);
      return undefined;
    }
  }

  /**
   * Extend session TTL
   */
  async extendSession(sessionId: SessionId): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }

      const newExpiry = new Date(Date.now() + this.SESSION_TTL).toISOString();
      const result = await this.updateSession(sessionId, {
        expiresAt: newExpiry,
        isActive: true
      });

      return result !== null;
    } catch (error) {
      logger.error('Failed to extend session', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<SessionData[]> {
    // Note: This is a simplified implementation
    // In a real Redis setup, you'd need to maintain an index of user sessions
    // For now, we'll return an empty array as Redis doesn't support complex queries
    logger.warn('getActiveSessions not fully implemented for Redis', { userId });
    return [];
  }

  /**
   * Check if session is expired
   */
  private isSessionExpired(session: SessionData): boolean {
    if (!session.expiresAt) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    return now > expiresAt;
  }

  /**
   * Deactivate a session
   */
  private async deactivateSession(sessionId: SessionId): Promise<void> {
    try {
      await this.updateSession(sessionId, { isActive: false });
      logger.info('Session deactivated due to expiry', { sessionId });
    } catch (error) {
      logger.error('Failed to deactivate session', { sessionId }, error as Error);
    }
  }

  /**
   * Start cleanup scheduler for expired sessions
   */
  private startCleanupScheduler(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, this.CLEANUP_INTERVAL);

    logger.info('Session cleanup scheduler started', { 
      sessionId: 'system' 
    });
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    // Note: This is a simplified implementation
    // In a real Redis setup, you'd scan for expired sessions
    logger.info('Session cleanup completed (simplified implementation)', { sessionId: 'system' });
  }

  /**
   * Stop cleanup scheduler
   */
  public stopCleanupScheduler(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Session cleanup scheduler stopped', { sessionId: 'system' });
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: SessionId): Promise<{
    totalInteractions: number;
    averageResponseTime: number;
    errorCount: number;
    conversationLength: number;
    isActive: boolean;
  } | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return null;
      }

      return {
        totalInteractions: session.totalInteractions,
        averageResponseTime: session.averageResponseTime,
        errorCount: session.errorCount,
        conversationLength: session.conversationHistory.length,
        isActive: session.isActive
      };
    } catch (error) {
      logger.error('Failed to get session stats', { sessionId }, error as Error);
      return null;
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
