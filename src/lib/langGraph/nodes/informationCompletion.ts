import type { LangGraphNode } from "../index";
import type { NodeInput, NodeOutput, VoiceCommandState } from "../types/state";
import { logger } from "../utils/logger";
import { OpenAIService } from "../../openaiService";

export type InformationCompletionInput = NodeInput<VoiceCommandState>;
export type InformationCompletionOutput = NodeOutput<VoiceCommandState>;

export const informationCompletionNode: LangGraphNode = {
  id: "information_completion",
  description: "Normalize subjective information (dates, times) to concrete values using current context",
  
  async execute(input: unknown, context?: Record<string, unknown>): Promise<unknown> {
    const { value: voiceState, state } = input as InformationCompletionInput;
    const sessionId = state.sessionId;

    try {
      logger.nodeStart(sessionId, 'information_completion', 'langgraph', 2.5, { 
        intent: voiceState.currentIntent,
        rawData: voiceState.requiredData
      });

      // Get current date/time information
      const now = new Date();
      const userTimezone = (context?.userTimezone as string) || 'UTC';
      
      // Check if there's any subjective information that needs normalization
      const needsNormalization = hasSubjectiveInformation(voiceState.requiredData);
      
      logger.info('Subjective information check', { sessionId }, {
        data: voiceState.requiredData,
        needsNormalization
      });
      
      if (!needsNormalization) {
        // No subjective info, pass through unchanged
        logger.info('No subjective information detected, skipping normalization', { sessionId });
        logger.nodeComplete(sessionId, 'information_completion', 'langgraph', 2.5, voiceState);
        
        return {
          value: voiceState,
          state: voiceState,
        };
      }

      // Normalize subjective information using OpenAI
      const openaiService = new OpenAIService();
      
      logger.info('Starting normalization with OpenAI', { sessionId }, {
        inputData: voiceState.requiredData,
        context: {
          currentDate: now.toISOString(),
          timezone: userTimezone,
          dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long', timeZone: userTimezone as string })
        }
      });
      
      const normalizedData = await openaiService.normalizeSubjectiveInformation(
        voiceState.requiredData,
        {
          currentDate: now.toISOString(),
          currentTime: now.toLocaleTimeString('en-US', { timeZone: userTimezone as string }),
          timezone: userTimezone,
          dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long', timeZone: userTimezone as string }),
          intent: voiceState.currentIntent
        }
      );

      const updatedState: VoiceCommandState = {
        ...voiceState,
        requiredData: normalizedData
      };

      logger.info('Information normalized', { sessionId }, { 
        before: voiceState.requiredData,
        after: normalizedData
      });

      logger.nodeComplete(sessionId, 'information_completion', 'langgraph', 2.5, updatedState);

      return {
        value: updatedState,
        state: updatedState,
      };

    } catch (error) {
      logger.nodeError(sessionId, 'information_completion', error as Error, 'langgraph', 2.5);
      
      // On error, pass through with original data
      logger.warn('Information completion failed, using original data', { sessionId }, {
        error: error instanceof Error ? error.message : 'Unknown error',
        originalData: voiceState.requiredData
      });
      return {
        value: voiceState,
        state: voiceState,
      };
    }
  },
};

/**
 * Check if the data contains subjective information that needs normalization
 */
function hasSubjectiveInformation(data: Record<string, any>): boolean {
  const subjectivePatterns = [
    /tomorrow/i,
    /yesterday/i,
    /today/i,
    /tonight/i,
    /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i,
    /next\s+(week|month|monday|tuesday|wednesday|thursday|friday)/i,
    /last\s+(week|month|monday|tuesday|wednesday|thursday|friday)/i,
    /this\s+(week|month|monday|tuesday|wednesday|thursday|friday)/i,
    /in\s+\d+\s+(days?|weeks?|months?)/i,
    /\d+\s+(days?|weeks?|months?)\s+ago/i,
    /now/i,
    /asap/i,
    /soon/i,
  ];

  const dataString = JSON.stringify(data).toLowerCase();
  return subjectivePatterns.some(pattern => pattern.test(dataString));
}

export default informationCompletionNode;

