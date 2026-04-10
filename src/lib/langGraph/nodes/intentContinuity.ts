// Intent Continuity Node: checks if each reply is related to the previous intent or a new intent
// This node runs after every user reply to determine intent continuity

import type { LangGraphNode } from "../index";
import type { NodeInput, NodeOutput, VoiceCommandState } from "../types/state";
import { OpenAIService } from "../../openaiService";
import { logger } from "../utils/logger";
import { getAvailableIntentsList } from "../config/availableIntents";

export type IntentContinuityInput = NodeInput<VoiceCommandState>;
export type IntentContinuityOutput = NodeOutput<VoiceCommandState>;

export const intentContinuityNode: LangGraphNode = {
  id: "intent_continuity",
  description: "Check if the current message is a new intent or continuation of previous intent",
  async execute(input: unknown, context?: Record<string, unknown>): Promise<unknown> {
    const { value: voiceState, state } = input as IntentContinuityInput;
    const sessionId = state.sessionId;

    try {
      logger.nodeStart(sessionId, 'intent_continuity', 'langgraph', 1, { 
        intent: voiceState.currentIntent,
        messageCount: voiceState.conversationHistory.length 
      });

      // Get the latest user message
      const latestMessage = voiceState.conversationHistory[voiceState.conversationHistory.length - 1];
      if (!latestMessage || latestMessage.type !== 'user') {
        // No user message to check, return as is
        return {
          value: voiceState,
          state: voiceState,
        };
      }

      // Check intent continuity (isSame + newData only)
      const continuityResult = await checkIntentContinuity(latestMessage.content, voiceState);

      let updatedState: VoiceCommandState = { ...voiceState };

      if (!continuityResult.isSame) {
        // Check if the new intent is relevant to HR functionality
        if (continuityResult.isRelevant === false && continuityResult.response) {
          // Non-HR query detected - generate contextual response and keep original intent
          logger.info('Non-HR message detected in continuity check', { sessionId }, {
            originalIntent: voiceState.currentIntent,
            preservingContext: true
          });

          updatedState = {
            ...voiceState,
            // IMPORTANT: Preserve the original intent to maintain conversation context
            currentIntent: voiceState.currentIntent,
            // Don't mark as complete - we're still waiting for the required info
            isComplete: false,
            requiresConfirmation: false,
            dataCollectionReply: continuityResult.response,
            // Mark this as an irrelevant response but don't execute anything
            executionResult: undefined,
            error: undefined
          };

          // Add assistant response to conversation history
          const assistantMessage = {
            id: `msg_${Date.now()}`,
            timestamp: new Date(),
            type: 'assistant' as const,
            content: continuityResult.response,
            metadata: {
              isIrrelevantResponse: true,
              handledBy: 'intent_continuity',
              originalIntent: voiceState.currentIntent,
              preservedContext: true
            }
          };

          updatedState.conversationHistory = [
            ...voiceState.conversationHistory,
            assistantMessage
          ];

        } else {
          // New HR intent detected - delegate to intent extraction via router
          logger.info('New HR intent detected, delegate to intent extraction via router', { sessionId });

          // Tag the message so the workflow router can branch to intent extraction
          const updatedMessage = {
            ...latestMessage,
            metadata: {
              ...latestMessage.metadata,
              isNewIntent: true,
              route: 'intent_extraction'
            }
          };

          updatedState = {
            ...voiceState,
            // do not change currentIntent or requiredData here
            isComplete: false,
            requiresConfirmation: false,
            dataCollectionReply: undefined,
            executionResult: undefined,
            error: undefined,
            conversationHistory: [
              ...voiceState.conversationHistory.slice(0, -1),
              updatedMessage
            ]
          };
        }

      } else {
        // Continuation of previous intent - merge newData into requiredData
        logger.info('Intent continuation detected', { sessionId }, { currentIntent: voiceState.currentIntent });

        const mergedData = {
          ...voiceState.requiredData,
          ...(continuityResult.newData || {})
        };

        // Check if all required parameters are now present
        const { getRequiredParameters } = await import('../config/parameterRequirements');
        const requiredParams = getRequiredParameters(voiceState.currentIntent);
        const missingParams = requiredParams.filter(param =>
          !mergedData[param] ||
          mergedData[param] === '' ||
          mergedData[param] === null ||
          mergedData[param] === undefined
        );

        updatedState = {
          ...voiceState,
          requiredData: mergedData,
          missingParameters: missingParams,
          // Mark as complete if all required parameters are present
          isComplete: missingParams.length === 0,
          requiresConfirmation: false,
          dataCollectionReply: undefined,
          executionResult: undefined,
          error: undefined
        };

        const updatedMessage = {
          ...latestMessage,
          metadata: {
            ...latestMessage.metadata,
            isNewIntent: false,
            extractedParameters: continuityResult.newData || {}
          }
        };

        updatedState.conversationHistory = [
          ...voiceState.conversationHistory.slice(0, -1),
          updatedMessage
        ];
      }

      logger.nodeComplete(sessionId, 'intent_continuity', 'langgraph', 1, updatedState);

      return {
        value: updatedState,
        state: updatedState,
      };

    } catch (error) {
      logger.nodeError(sessionId, 'intent_continuity', error as Error, 'langgraph', 1);
      
      // If continuity check fails, assume continuation
      logger.info('Intent continuity check failed, assuming continuation', { sessionId });
      
      return {
        value: voiceState,
        state: voiceState,
      };
    }
  },
};

/**
 * Check if the current message is a new intent or continuation of previous intent
 * Uses OpenAI to analyze intent continuity and extract new data
 */
async function checkIntentContinuity(
  currentText: string,
  state: VoiceCommandState
): Promise<{
  isSame: boolean;
  newData?: Record<string, any>;
  isRelevant?: boolean;
  response?: string;
}> {
  // If this is the first message, it's always a new intent
  if (state.conversationHistory.length <= 1) {
    // First message always triggers intent extraction upstream
    return { isSame: false, newData: {} };
  }

  // If there's no current intent, it's a new intent
  if (!state.currentIntent || state.currentIntent === '') {
    return { isSame: false, newData: {} };
  }

  // Use OpenAI to check intent continuity
  const openaiService = new OpenAIService();

  try {
    // First check if this message is relevant to HR functionality
    const relevanceResult = await openaiService.checkRelevance(currentText, {
      currentIntent: state.currentIntent,
      missingParameters: state.missingParameters || [],
      conversationContext: state.conversationHistory.slice(-3), // Last 3 messages for context
      requiredData: state.requiredData // Add current collected data for better context
    });

    if (!relevanceResult.isRelevant) {
      // Message is not HR-related - generate response
      return {
        isSame: false,
        newData: {},
        isRelevant: false,
        response: relevanceResult.response
      };
    }

    // Message is HR-related - check intent continuity
    const continuityResult = await openaiService.checkIntentContinuity(
      currentText,
      state.currentIntent,
      state.conversationHistory,
      state.requiredData
    );

    return {
      ...continuityResult,
      isRelevant: true // Since we already checked relevance above
    };

  } catch (error) {
    // If checks fail, assume continuation and relevant
    return { isSame: true, newData: {}, isRelevant: true };
  }
}


export default intentContinuityNode;
