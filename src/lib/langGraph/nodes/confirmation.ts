// Confirmation Node: generates final response and concludes the voice command processing

import type { LangGraphNode } from "../index";
import type { NodeInput, NodeOutput, VoiceCommandState } from "../types/state";
import { logger } from "../utils/logger";
import { getIntentDescription, getSuccessMessage } from "../config/parameterRequirements";

export type ConfirmationInput = NodeInput<VoiceCommandState>;
export type ConfirmationOutput = NodeOutput<VoiceCommandState>;

export const confirmationNode: LangGraphNode = {
  id: "confirmation",
  description: "Generate final response and conclude voice command processing",
  async execute(input: unknown, context?: Record<string, unknown>): Promise<unknown> {
    const { value: voiceState, state } = input as ConfirmationInput;
    const sessionId = state.sessionId;

    try {
      logger.nodeStart(sessionId, 'confirmation', 'langgraph', 4, { intent: voiceState.currentIntent });

      // Generate final confirmation response
      const confirmationResponse = generateConfirmationResponse(voiceState);

      // Determine if this is a completion or a request for more info
      const isTaskCompleted = voiceState.isComplete && voiceState.missingParameters.length === 0;
      
      const updatedState: VoiceCommandState = {
        ...voiceState,
        // Only clear intent if task is actually completed (not just asking for more info)
        currentIntent: isTaskCompleted ? '' : voiceState.currentIntent,
        // Only clear data if task is completed
        requiredData: isTaskCompleted ? {} : voiceState.requiredData,
        // Only clear missing params if task is completed
        missingParameters: isTaskCompleted ? [] : voiceState.missingParameters,
        isComplete: true, // Always true for confirmation node
        requiresConfirmation: false,
        dataCollectionReply: confirmationResponse
      };

      // Add confirmation message to conversation history
      const confirmationMessage = {
        id: `msg_${Date.now()}`,
        timestamp: new Date(),
        type: 'assistant' as const,
        content: confirmationResponse,
        metadata: { 
          intent: voiceState.currentIntent, // Store original intent in metadata
          executionResult: voiceState.executionResult 
        }
      };

      updatedState.conversationHistory = [...state.conversationHistory, confirmationMessage];

      logger.nodeComplete(sessionId, 'confirmation', 'langgraph', 4, updatedState);

      return {
        value: updatedState,
        state: updatedState,
      };

    } catch (error) {
      logger.nodeError(sessionId, 'confirmation', error as Error, 'langgraph', 4);
      
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

/**
 * Generate confirmation response dynamically based on state and config
 * Uses successMessage templates from central config - NO hardcoded cases
 */
function generateConfirmationResponse(state: VoiceCommandState): string {
  if (state.error) {
    return `I encountered an error processing your request: ${state.error}. Please try again.`;
  }

  if (state.executionResult?.success === false) {
    // Use message field for error details, fallback to reason or generic message
    const errorDetails = state.executionResult.message || state.executionResult.reason || 'Please try again.';
    return `I couldn't process your request. ${errorDetails}`;
  }

  // Check if there's a data collection reply (missing parameters)
  if (state.dataCollectionReply) {
    return state.dataCollectionReply;
  }

  // Check if there are missing parameters that need to be collected
  if (state.missingParameters && state.missingParameters.length > 0) {
    const missingList = state.missingParameters.join(', ');
    return `I need some additional information to process your request. Please provide: ${missingList}.`;
  }

  const intent = state.currentIntent;
  const data = state.requiredData;

  // Try to get success message from config with template variable substitution
  const successMessage = getSuccessMessage(intent, data);
  if (successMessage) {
    return successMessage;
  }

  // Fallback: generic success message using intent description
  const intentDescription = getIntentDescription(intent);
  return `${intentDescription} completed successfully.`;
}

export default confirmationNode;


