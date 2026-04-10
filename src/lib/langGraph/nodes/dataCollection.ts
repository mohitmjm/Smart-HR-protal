// Universal Data Collection: OpenAI-powered parameter collection for all voice commands

import type { LangGraphNode } from "../index";
import type { NodeInput, NodeOutput, VoiceCommandState } from "../types/state";
import { getRequiredParameters, getParameterConfig, getIntentDescription, PARAMETER_REQUIREMENTS, validateAllParameters } from "../config/parameterRequirements";
import { OpenAIService } from "../../openaiService";
import { logger } from "../utils/logger";

export type DataCollectionInput = NodeInput<VoiceCommandState>;
export type DataCollectionOutput = NodeOutput<VoiceCommandState>;

function computeMissingParameters(intent: string, requiredData: Record<string, unknown>): string[] {
  const requiredParams = getRequiredParameters(intent);
  return requiredParams.filter(param => 
    !requiredData[param] || 
    requiredData[param] === '' || 
    requiredData[param] === null ||
    requiredData[param] === undefined
  );
}

export const dataCollectionNode: LangGraphNode = {
  id: "data_collection",
  description: "Universal data collection with OpenAI-powered intelligent replies for all voice commands",
  async execute(input: unknown, context?: Record<string, unknown>): Promise<unknown> {
    const { value: voiceState, state } = input as DataCollectionInput;
    const sessionId = state.sessionId;

    try {
      logger.nodeStart(sessionId, 'data_collection', 'langgraph', 2, { intent: voiceState.currentIntent });

      // DON'T re-extract parameters here - they should already be in requiredData
      // from either intent extraction (new session) or intent continuity (existing session)
      // Just check what's missing based on what we already have
      
      const missing = computeMissingParameters(voiceState.currentIntent, voiceState.requiredData);
      
      logger.info('Data collection check', { sessionId }, { 
        currentData: voiceState.requiredData,
        missingFields: missing,
        hasExistingReply: !!voiceState.dataCollectionReply
      });

      let dataCollectionReply = "";
      let isComplete = false;
      let requiresConfirmation = false;

      // Check if we already have a contextual reply (e.g., from irrelevant message handler)
      if (voiceState.dataCollectionReply) {
        // Use existing contextual reply, don't generate a new one
        dataCollectionReply = voiceState.dataCollectionReply;
        requiresConfirmation = true;
        logger.info('Using existing contextual reply from previous node', { sessionId });
      } else if (missing.length > 0) {
        // Generate intelligent reply asking for missing information
        try {
          const openaiService = new OpenAIService();
          const parameterConfig = PARAMETER_REQUIREMENTS[voiceState.currentIntent];
          
          dataCollectionReply = await openaiService.generateDataCollectionReply(
            voiceState.currentIntent,
            voiceState.requiredData, // Use current collected data
            missing,
            state.conversationHistory,
            parameterConfig
          );
          requiresConfirmation = true;
        } catch (error) {
          console.error('Error in data collection:', error);
          dataCollectionReply = "I need some additional information to process your request. Please provide the missing details.";
          requiresConfirmation = true;
        }
      } else {
        // All required parameters collected, now validate them
        const validationResult = validateAllParameters(voiceState.currentIntent, voiceState.requiredData);
        
        if (!validationResult.valid) {
          // Validation failed - ask user to fix the issues
          const errorMessages = Object.entries(validationResult.errors)
            .map(([param, error]) => error)
            .join('. ');
          
          dataCollectionReply = `I have all the information, but there's an issue: ${errorMessages}. Please provide the correct information.`;
          requiresConfirmation = true;
          isComplete = false;
          
          logger.warn('Parameter validation failed', { sessionId }, { 
            errors: validationResult.errors 
          });
        } else {
          // All parameters collected and validated, ready for execution
          isComplete = true;
          requiresConfirmation = false;
        }
      }

      const updatedState: VoiceCommandState = {
        ...voiceState,
        requiredData: voiceState.requiredData, // Keep existing data, don't overwrite
        missingParameters: missing,
        dataCollectionReply: dataCollectionReply,
        isComplete: isComplete,
        requiresConfirmation: requiresConfirmation
      };

      // Add assistant message to conversation history if we're asking for more data
      // BUT only if we generated a new reply (not reusing an existing contextual one)
      if (dataCollectionReply && !voiceState.dataCollectionReply) {
        const assistantMessage = {
          id: `msg_${Date.now()}`,
          timestamp: new Date(),
          type: 'assistant' as const,
          content: dataCollectionReply,
          metadata: { missingParameters: missing }
        };

        updatedState.conversationHistory = [...state.conversationHistory, assistantMessage];
      } else if (voiceState.dataCollectionReply) {
        // Contextual reply already in history, just keep it
        updatedState.conversationHistory = state.conversationHistory;
      }

      logger.nodeComplete(sessionId, 'data_collection', 'langgraph', 2, updatedState);

      return {
        value: updatedState,
        state: updatedState,
      };

    } catch (error) {
      logger.nodeError(sessionId, 'data_collection', error as Error, 'langgraph', 2);
      
      // Re-throw error to let the system handle it properly
      throw new Error(`Data collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

export default dataCollectionNode;
