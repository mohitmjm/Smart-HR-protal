// Context data management for LangGraph voice commands

import { sessionManager } from "./sessionManager";
import { logger } from "../langGraph/utils/logger";
import type { SessionId, Serializable } from "../langGraph/types/session";

export interface ContextData {
  // User preferences and settings
  userPreferences: Record<string, Serializable>;
  
  // Workflow-specific context
  workflowContext: Record<string, Serializable>;
  
  // Conversation context
  conversationContext: {
    lastIntent?: string;
    lastAction?: string;
    pendingConfirmation?: boolean;
    clarificationNeeded?: boolean;
    retryCount?: number;
  };
  
  // System context
  systemContext: {
    timezone: string;
    userRole: string;
    sessionStartTime: string;
    lastActivityTime: string;
  };
  
  // Temporary data (cleared on session end)
  temporaryData: Record<string, Serializable>;
}

export class ContextManager {
  private static instance: ContextManager;
  private readonly MAX_CONTEXT_SIZE = 10000; // 10KB max context data
  private readonly CONTEXT_TTL = 900000; // 15 minutes

  private constructor() {}

  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  /**
   * Initialize context for a new session
   */
  async initializeContext(
    sessionId: SessionId,
    initialData: {
      userTimezone: string;
      userRole: string;
      userPreferences?: Record<string, Serializable>;
    }
  ): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const contextData: ContextData = {
        userPreferences: initialData.userPreferences || {},
        workflowContext: {},
        conversationContext: {
          retryCount: 0
        },
        systemContext: {
          timezone: initialData.userTimezone,
          userRole: initialData.userRole,
          sessionStartTime: now,
          lastActivityTime: now
        },
        temporaryData: {}
      };

      const success = await sessionManager.setContextData(sessionId, 'contextData', contextData);
      
      if (success) {
        logger.info('Context initialized', { 
          sessionId
        });
      }

      return success;
    } catch (error) {
      logger.error('Failed to initialize context', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Get context data for a session
   */
  async getContext(sessionId: SessionId): Promise<ContextData | null> {
    try {
      const contextData = await sessionManager.getContextData(sessionId, 'contextData');
      return contextData || null;
    } catch (error) {
      logger.error('Failed to get context', { sessionId }, error as Error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    sessionId: SessionId,
    preferences: Record<string, Serializable>
  ): Promise<boolean> {
    try {
      const context = await this.getContext(sessionId);
      if (!context) {
        return false;
      }

      const updatedContext = {
        ...context,
        userPreferences: {
          ...context.userPreferences,
          ...preferences
        }
      };

      return await this.saveContext(sessionId, updatedContext);
    } catch (error) {
      logger.error('Failed to update user preferences', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Set workflow context
   */
  async setWorkflowContext(
    sessionId: SessionId,
    workflowName: string,
    data: Record<string, Serializable>
  ): Promise<boolean> {
    try {
      const context = await this.getContext(sessionId);
      if (!context) {
        return false;
      }

      const updatedContext = {
        ...context,
        workflowContext: {
          ...context.workflowContext,
          [workflowName]: data
        }
      };

      return await this.saveContext(sessionId, updatedContext);
    } catch (error) {
      logger.error('Failed to set workflow context', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Get workflow context
   */
  async getWorkflowContext(
    sessionId: SessionId,
    workflowName: string
  ): Promise<Record<string, Serializable> | null> {
    try {
      const context = await this.getContext(sessionId);
      const workflowData = context?.workflowContext[workflowName];
      if (workflowData && typeof workflowData === 'object' && !Array.isArray(workflowData) && !(workflowData instanceof Date)) {
        return workflowData as Record<string, Serializable>;
      }
      return null;
    } catch (error) {
      logger.error('Failed to get workflow context', { sessionId }, error as Error);
      return null;
    }
  }

  /**
   * Clear workflow context
   */
  async clearWorkflowContext(
    sessionId: SessionId,
    workflowName: string
  ): Promise<boolean> {
    try {
      const context = await this.getContext(sessionId);
      if (!context) {
        return false;
      }

      const updatedContext = {
        ...context,
        workflowContext: {
          ...context.workflowContext
        }
      };

      delete updatedContext.workflowContext[workflowName];

      return await this.saveContext(sessionId, updatedContext);
    } catch (error) {
      logger.error('Failed to clear workflow context', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Update conversation context
   */
  async updateConversationContext(
    sessionId: SessionId,
    updates: Partial<ContextData['conversationContext']>
  ): Promise<boolean> {
    try {
      const context = await this.getContext(sessionId);
      if (!context) {
        return false;
      }

      const updatedContext = {
        ...context,
        conversationContext: {
          ...context.conversationContext,
          ...updates
        }
      };

      return await this.saveContext(sessionId, updatedContext);
    } catch (error) {
      logger.error('Failed to update conversation context', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Set temporary data
   */
  async setTemporaryData(
    sessionId: SessionId,
    key: string,
    value: Serializable
  ): Promise<boolean> {
    try {
      const context = await this.getContext(sessionId);
      if (!context) {
        return false;
      }

      const updatedContext = {
        ...context,
        temporaryData: {
          ...context.temporaryData,
          [key]: value
        }
      };

      return await this.saveContext(sessionId, updatedContext);
    } catch (error) {
      logger.error('Failed to set temporary data', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Get temporary data
   */
  async getTemporaryData(
    sessionId: SessionId,
    key: string
  ): Promise<Serializable | null> {
    try {
      const context = await this.getContext(sessionId);
      return context?.temporaryData[key] || null;
    } catch (error) {
      logger.error('Failed to get temporary data', { sessionId }, error as Error);
      return null;
    }
  }

  /**
   * Clear temporary data
   */
  async clearTemporaryData(sessionId: SessionId): Promise<boolean> {
    try {
      const context = await this.getContext(sessionId);
      if (!context) {
        return false;
      }

      const updatedContext = {
        ...context,
        temporaryData: {}
      };

      return await this.saveContext(sessionId, updatedContext);
    } catch (error) {
      logger.error('Failed to clear temporary data', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Update system context
   */
  async updateSystemContext(
    sessionId: SessionId,
    updates: Partial<ContextData['systemContext']>
  ): Promise<boolean> {
    try {
      const context = await this.getContext(sessionId);
      if (!context) {
        return false;
      }

      const updatedContext = {
        ...context,
        systemContext: {
          ...context.systemContext,
          ...updates,
          lastActivityTime: new Date().toISOString()
        }
      };

      return await this.saveContext(sessionId, updatedContext);
    } catch (error) {
      logger.error('Failed to update system context', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Get conversation summary for context-aware processing
   */
  async getConversationSummary(sessionId: SessionId): Promise<{
    lastIntent?: string;
    lastAction?: string;
    pendingConfirmation?: boolean;
    clarificationNeeded?: boolean;
    retryCount?: number;
  } | null> {
    try {
      const context = await this.getContext(sessionId);
      return context?.conversationContext || null;
    } catch (error) {
      logger.error('Failed to get conversation summary', { sessionId }, error as Error);
      return null;
    }
  }

  /**
   * Check if context is valid and not expired
   */
  async isContextValid(sessionId: SessionId): Promise<boolean> {
    try {
      const context = await this.getContext(sessionId);
      if (!context) {
        return false;
      }

      const now = new Date();
      const lastActivity = new Date(context.systemContext.lastActivityTime);
      const timeDiff = now.getTime() - lastActivity.getTime();

      return timeDiff < this.CONTEXT_TTL;
    } catch (error) {
      logger.error('Failed to validate context', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Get context size in bytes (approximate)
   */
  async getContextSize(sessionId: SessionId): Promise<number> {
    try {
      const context = await this.getContext(sessionId);
      if (!context) {
        return 0;
      }

      const contextString = JSON.stringify(context);
      return new Blob([contextString]).size;
    } catch (error) {
      logger.error('Failed to get context size', { sessionId }, error as Error);
      return 0;
    }
  }

  /**
   * Clean up context data to reduce size
   */
  async cleanupContext(sessionId: SessionId): Promise<boolean> {
    try {
      const context = await this.getContext(sessionId);
      if (!context) {
        return false;
      }

      // Clear temporary data
      const cleanedContext = {
        ...context,
        temporaryData: {}
      };

      return await this.saveContext(sessionId, cleanedContext);
    } catch (error) {
      logger.error('Failed to cleanup context', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Save context data with size validation
   */
  private async saveContext(sessionId: SessionId, context: ContextData): Promise<boolean> {
    try {
      // Check context size
      const contextSize = new Blob([JSON.stringify(context)]).size;
      if (contextSize > this.MAX_CONTEXT_SIZE) {
        logger.warn('Context size exceeds limit, cleaning up', { 
          sessionId
        });
        
        // Clean up context
        const cleanedContext = {
          ...context,
          temporaryData: {}
        };
        
        const cleanedSize = new Blob([JSON.stringify(cleanedContext)]).size;
        if (cleanedSize > this.MAX_CONTEXT_SIZE) {
          logger.error('Context still too large after cleanup', { 
            sessionId
          });
          return false;
        }
        
        return await sessionManager.setContextData(sessionId, 'contextData', cleanedContext);
      }

      return await sessionManager.setContextData(sessionId, 'contextData', context);
    } catch (error) {
      logger.error('Failed to save context', { sessionId }, error as Error);
      return false;
    }
  }

  /**
   * Reset context for a session
   */
  async resetContext(sessionId: SessionId): Promise<boolean> {
    try {
      const context = await this.getContext(sessionId);
      if (!context) {
        return false;
      }

      const resetContext: ContextData = {
        userPreferences: context.userPreferences, // Keep user preferences
        workflowContext: {},
        conversationContext: {
          retryCount: 0
        },
        systemContext: {
          ...context.systemContext,
          lastActivityTime: new Date().toISOString()
        },
        temporaryData: {}
      };

      return await this.saveContext(sessionId, resetContext);
    } catch (error) {
      logger.error('Failed to reset context', { sessionId }, error as Error);
      return false;
    }
  }
}

// Export singleton instance
export const contextManager = ContextManager.getInstance();
