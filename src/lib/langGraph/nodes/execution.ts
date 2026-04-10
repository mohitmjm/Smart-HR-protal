// Execution Node: executes voice command based on intent and collected data

import type { LangGraphNode } from "../index";
import type { NodeInput, NodeOutput, VoiceCommandState } from "../types/state";
import { logger } from "../utils/logger";
import { PARAMETER_REQUIREMENTS, getWorkflowForIntent } from "../config/parameterRequirements";
import { getActionExecutor, hasActionExecutor } from "./actions";

export type ExecutionInput = NodeInput<VoiceCommandState>;
export type ExecutionOutput = NodeOutput<VoiceCommandState>;

/**
 * Execute command dynamically based on intent and workflow
 * Uses registered action executors when available
 */
async function executeCommand(
  intent: string,
  requiredData: Record<string, any>,
  userId: string,
  sessionId: string
): Promise<unknown> {
  // Verify intent exists in config
  if (!PARAMETER_REQUIREMENTS[intent]) {
    return { success: false, reason: "unknown_intent", intent };
  }

  // Get workflow type from config
  const workflow = getWorkflowForIntent(intent);
  
  // Check if there's a registered action executor for this intent
  if (hasActionExecutor(intent)) {
    const actionExecutor = getActionExecutor(intent);
    
    try {
      // Prepare parameters for action executor
      const actionParams = {
        userId,
        ...requiredData
      };
      
      logger.info('Executing action', { sessionId, userId }, { 
        intent, 
        workflow,
        hasLocation: !!requiredData.location,
        requiredDataKeys: Object.keys(requiredData)
      });
      const result = await actionExecutor!(actionParams);
      
      return {
        success: result.success,
        intent,
        workflow,
        data: result.data,
        message: result.message,
        error: result.error, // Pass through error code
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Action execution failed', { sessionId, userId }, error as Error);
      return {
        success: false,
        intent,
        workflow,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // Fallback: Placeholder for intents without action executors
  logger.warn('No action executor found, using placeholder', { sessionId, userId }, { intent });
  
  return {
    success: true,
    intent,
    workflow,
    data: requiredData,
    timestamp: new Date().toISOString(),
    message: `Command '${intent}' processed (placeholder)`
  };
}

export const executionNode: LangGraphNode = {
  id: "execution",
  description: "Execute the voice command with collected parameters",
  async execute(input: unknown): Promise<unknown> {
    const { value: voiceState, state } = input as ExecutionInput;
    const sessionId = state.sessionId;

    try {
      logger.nodeStart(sessionId, 'execution', 'langgraph', 3, { intent: voiceState.currentIntent });

      // Safety check: Ensure all required parameters are present before execution
      const { getRequiredParameters } = await import('../config/parameterRequirements');
      const requiredParams = getRequiredParameters(voiceState.currentIntent);
      const missingParams = requiredParams.filter(param => 
        !voiceState.requiredData[param] || 
        voiceState.requiredData[param] === '' ||
        voiceState.requiredData[param] === null ||
        voiceState.requiredData[param] === undefined
      );

      if (missingParams.length > 0) {
        logger.warn('Execution attempted with missing parameters', { sessionId }, { 
          intent: voiceState.currentIntent,
          missingParams 
        });
        
        return {
          value: {
            ...voiceState,
            error: `Cannot execute: missing required parameters: ${missingParams.join(', ')}`,
            isComplete: false,
            requiresConfirmation: true
          },
          state: {
            ...voiceState,
            error: `Cannot execute: missing required parameters: ${missingParams.join(', ')}`,
            isComplete: false,
            requiresConfirmation: true
          }
        };
      }

      const result = await executeCommand(
        voiceState.currentIntent, 
        voiceState.requiredData,
        voiceState.userId,
        sessionId
      );

      // Only mark as complete if the execution was successful
      // If action failed (e.g., location required), keep incomplete for retry
      const isSuccessful = (result as any).success !== false;
      
      if (!isSuccessful) {
        logger.warn('Action execution failed', { sessionId }, {
          intent: voiceState.currentIntent,
          error: (result as any).error,
          message: (result as any).message
        });
      }

      const updatedState: VoiceCommandState = {
        ...voiceState,
        executionResult: result,
        isComplete: isSuccessful,
        requiresConfirmation: false
      };

      // Add execution result to conversation history
      const executionMessage = {
        id: `msg_${Date.now()}`,
        timestamp: new Date(),
        type: 'system' as const,
        content: `Command executed: ${voiceState.currentIntent}`,
        executionResult: result,
        metadata: { intent: voiceState.currentIntent, parameters: voiceState.requiredData }
      };

      updatedState.conversationHistory = [...state.conversationHistory, executionMessage];

      logger.nodeComplete(sessionId, 'execution', 'langgraph', 3, updatedState);

      return {
        value: updatedState,
        state: updatedState,
      };

    } catch (error) {
      logger.nodeError(sessionId, 'execution', error as Error, 'langgraph', 3);
      
      const errorState: VoiceCommandState = {
        ...voiceState,
        error: error instanceof Error ? error.message : 'Unknown error',
        isComplete: false,
        requiresConfirmation: true
      };

      return {
        value: errorState,
        state: errorState,
      };
    }
  },
};

export default executionNode;


