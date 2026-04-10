// Intent Extraction Node: derives raw intent and entities from input text/audio using OpenAI

import type { LangGraphNode } from "../index";
import type { NodeInput, NodeOutput, VoiceCommandState } from "../types/state";
import { OpenAIService } from "../../openaiService";
import { logger } from "../utils/logger";
import {
  getAllParameters,
  getRequiredParameters,
  requiresLocationPermission,
  requiresUserContext,
  requiresTeamContext
} from "../config/parameterRequirements";
import { getAvailableIntentsList } from "../config/availableIntents";

export type IntentExtractionInput = NodeInput<{ text: string }>;
export type IntentExtractionOutput = NodeOutput<VoiceCommandState>;

export const intentExtractionNode: LangGraphNode = {
  id: "intent_extraction",
  description: "Derive raw intent and entities from user input using OpenAI",
  async execute(input: unknown, context?: Record<string, unknown>): Promise<unknown> {
    const { value, state } = input as IntentExtractionInput;
    const sessionId = state.sessionId;

    try {
      logger.nodeStart(sessionId, 'intent_extraction', 'langgraph', 1, { text: value.text });

      // Initialize OpenAI service
      const openaiService = new OpenAIService();
      
      // Extract intent using OpenAI with conversation context
      const intentResult = await openaiService.extractIntent(
        value.text,
        { 
          userId: state.userId,
          sessionId: sessionId,
          userRole: context?.userRole || 'employee',
          userTimezone: context?.userTimezone || 'UTC',
          currentDate: new Date().toISOString(),
          conversationHistory: state.conversationHistory
        }
      );

      // Check if the result includes relevance information
      if ('isRelevant' in intentResult && intentResult.isRelevant === false) {
        // Non-HR query - generate response and return

        // Create user message for conversation history
        const userMessage = {
          id: `msg_${Date.now() - 1}`,
          timestamp: new Date(Date.now() - 1000), // Slightly before assistant message
          type: 'user' as const,
          content: value.text,
          intent: 'irrelevant_message',
          confidence: 0.95
        };

        // Create assistant message for conversation history
        const assistantMessage = {
          id: `msg_${Date.now()}`,
          timestamp: new Date(),
          type: 'assistant' as const,
          content: intentResult.response,
          intent: 'irrelevant_message',
          confidence: 0.95,
          executionResult: {
            success: true,
            message: intentResult.response,
            data: { responseType: 'irrelevant_introduction' }
          }
        };

        const updatedConversationHistory = [...state.conversationHistory, userMessage, assistantMessage];

        return {
          value: {
            ...state, // Include all fields from the original state
            conversationHistory: updatedConversationHistory,
            dataCollectionReply: intentResult.response,
            isComplete: true,
            requiresConfirmation: false,
            currentIntent: 'irrelevant_message',
            executionResult: {
              success: true,
              message: intentResult.response,
              data: { responseType: 'irrelevant_introduction' }
            }
          },
          state: {
            ...state, // Include all fields from the original state
            conversationHistory: updatedConversationHistory,
            currentIntent: 'irrelevant_message',
            isComplete: true,
            requiresConfirmation: false,
            dataCollectionReply: intentResult.response,
            executionResult: {
              success: true,
              message: intentResult.response,
              data: { responseType: 'irrelevant_introduction' }
            }
          }
        };
      }

      // HR-related query - extract parameters and continue with normal processing
      const extractedParameters = intentResult.parameters || {};

      // Build required data based on intent
      const requiredData = buildRequiredData(intentResult.intent, extractedParameters);

      // Check if first message is complete (has all required parameters)
      const requiredParams = getRequiredParameters(intentResult.intent);
      const missingParams = requiredParams.filter(param =>
        !extractedParameters[param] ||
        extractedParameters[param] === '' ||
        extractedParameters[param] === null ||
        extractedParameters[param] === undefined
      );
      const isFirstMessageComplete = missingParams.length === 0;
      const isLowConfidence = intentResult.confidence < 0.7;

      // Add user message to conversation history
      const userMessage = {
        id: `msg_${Date.now()}`,
        timestamp: new Date(),
        type: 'user' as const,
        content: value.text,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        parameters: extractedParameters
      };

      const updatedState: VoiceCommandState = {
        ...state,
        currentIntent: intentResult.intent,
        requiredData: {
          ...state.requiredData, // Preserve existing data (e.g., location from initial state)
          ...requiredData         // Add new extracted parameters
        },
        missingParameters: missingParams,
        messages: [
          ...state.messages,
          {
            role: "user",
            content: value.text,
            timestamp: new Date().toISOString(),
          },
        ],
        conversationHistory: [...state.conversationHistory, userMessage],
        // If confidence is low, don't mark as complete even if all params present
        // Let data collection verify and ask for confirmation
        isComplete: isFirstMessageComplete && !isLowConfidence,
        requiresConfirmation: isLowConfidence,
      };

      logger.nodeComplete(sessionId, 'intent_extraction', 'langgraph', 1, updatedState);
      logger.intentExtracted(sessionId, intentResult.intent, intentResult.confidence);

      return {
        value: updatedState,
        state: updatedState,
      };

    } catch (error) {
      logger.nodeError(sessionId, 'intent_extraction', error as Error, 'langgraph', 1);
      
      // Re-throw error to let the system handle it properly
      throw new Error(`Intent extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

/**
 * Build required data based on intent type
 * Dynamically maps parameters from central config instead of hardcoded switch
 */
function buildRequiredData(intent: string, parameters: Record<string, any>): Record<string, any> {
  // Get all parameters for this intent from central config
  const intentParams = getAllParameters(intent);
  
  // Build required data object with only the parameters defined for this intent
  const requiredData: Record<string, any> = {};
  
  for (const param of intentParams) {
    if (parameters[param] !== undefined) {
      requiredData[param] = parameters[param];
    }
  }
  
  // Add metadata-driven special handling based on config
  if (requiresLocationPermission(intent)) {
    requiredData.timestamp = requiredData.timestamp || new Date().toISOString();
    requiredData.requires_location_permission = true;
  }
  
  if (requiresUserContext(intent)) {
    requiredData.requires_user_context = true;
  }
  
  if (requiresTeamContext(intent)) {
    requiredData.requires_team_context = true;
  }
  
  // If no parameters were mapped but we have some, return them as-is
  if (Object.keys(requiredData).length === 0 && Object.keys(parameters).length > 0) {
    return parameters;
  }
  
  return requiredData;
}


export default intentExtractionNode;


