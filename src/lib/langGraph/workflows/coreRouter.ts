// Core Router - Declarative workflow engine approach
// This router executes workflows defined as data structures with guard-based routing

import type { VoiceCommandState, NodeOutput } from "../types/state";
import { executeWorkflow, type WorkflowDefinition, type WorkflowEdge } from "./workflowEngine";
import { intentExtractionNode } from "../nodes/intentExtraction";
import { intentContinuityNode } from "../nodes/intentContinuity";
import { dataCollectionNode } from "../nodes/dataCollection";
import { informationCompletionNode } from "../nodes/informationCompletion";
import { executionNode } from "../nodes/execution";
import { confirmationNode } from "../nodes/confirmation";
import { logger } from "../utils/logger";

// Import condition functions
import {
  isDataCollectionComplete,
  isMessageIrrelevant,
  requiresDataCollection,
  isExecutionReady,
  hasExecutionResult
} from "./conditions/intent";

/**
 * Build the workflow definition with nodes and edges
 */
function buildCoreWorkflow(isFirstMessage: boolean): WorkflowDefinition {
  // Create node map
  const nodes = new Map();
  nodes.set('intent_extraction', intentExtractionNode);
  nodes.set('intent_continuity', intentContinuityNode);
  nodes.set('data_collection', dataCollectionNode);
  nodes.set('information_completion', informationCompletionNode);
  nodes.set('execution', executionNode);
  nodes.set('confirmation', confirmationNode);

  // Define edges with guard conditions
  const edges: WorkflowEdge[] = isFirstMessage ? [
    // First message flow (starts with intent extraction)
    {
      from: 'intent_extraction',
      to: 'confirmation',
      guard: (state) => isMessageIrrelevant(state),
      label: 'irrelevant message'
    },
    {
      from: 'intent_extraction',
      to: 'data_collection',
      guard: (state) => requiresDataCollection(state),
      label: 'needs data'
    },
    {
      from: 'intent_extraction',
      to: 'information_completion',
      label: 'has all data'
    },
    {
      from: 'data_collection',
      to: 'confirmation',
      guard: (state) => !isDataCollectionComplete(state),
      label: 'data incomplete, wait for user'
    },
    {
      from: 'data_collection',
      to: 'information_completion',
      guard: (state) => isDataCollectionComplete(state),
      label: 'data complete'
    },
    {
      from: 'information_completion',
      to: 'execution',
      guard: (state) => isExecutionReady(state),
      label: 'ready to execute'
    },
    {
      from: 'information_completion',
      to: 'confirmation',
      label: 'needs confirmation before execution'
    },
    {
      from: 'execution',
      to: 'confirmation',
      label: 'execution complete'
    }
  ] : [
    // Follow-up message flow (starts with intent continuity)
    {
      from: 'intent_continuity',
      to: 'confirmation',
      guard: (state) => isMessageIrrelevant(state),
      label: 'irrelevant message'
    },
    {
      from: 'intent_continuity',
      to: 'data_collection',
      guard: (state) => requiresDataCollection(state),
      label: 'needs data'
    },
    {
      from: 'intent_continuity',
      to: 'information_completion',
      label: 'has all data'
    },
    {
      from: 'data_collection',
      to: 'confirmation',
      guard: (state) => !isDataCollectionComplete(state),
      label: 'data incomplete, wait for user'
    },
    {
      from: 'data_collection',
      to: 'information_completion',
      guard: (state) => isDataCollectionComplete(state),
      label: 'data complete'
    },
    {
      from: 'information_completion',
      to: 'execution',
      guard: (state) => isExecutionReady(state),
      label: 'ready to execute'
    },
    {
      from: 'information_completion',
      to: 'confirmation',
      label: 'needs confirmation before execution'
    },
    {
      from: 'execution',
      to: 'confirmation',
      label: 'execution complete'
    }
  ];

  return {
    nodes,
    edges,
    startNode: isFirstMessage ? 'intent_extraction' : 'intent_continuity',
    endNodes: ['confirmation']
  };
}

/**
 * Prepares initial state for the workflow
 */
function prepareInitialState(
  text: string,
  initialState: VoiceCommandState,
  isFirstMessage: boolean
): VoiceCommandState {
  if (isFirstMessage) {
    // For first message, add text to state for intent extraction
    return {
      ...initialState,
      messages: [
        {
          role: 'user',
          content: text,
          timestamp: new Date().toISOString()
        }
      ]
    };
  } else {
    // For follow-up messages, add to conversation history
    const userMessage = {
      id: `msg_${Date.now()}`,
      timestamp: new Date(),
      type: 'user' as const,
      content: text,
      metadata: {}
    };
    
    return {
      ...initialState,
      conversationHistory: [...initialState.conversationHistory, userMessage]
    };
  }
}

/**
 * Main entry point - runs the core pipeline using declarative workflow engine
 */
export async function runCorePipeline(
  text: string,
  initialState: VoiceCommandState,
  isFirstMessage: boolean = false
): Promise<NodeOutput<VoiceCommandState>> {
  const sessionId = initialState.sessionId;

  try {
    logger.sessionStart(sessionId, undefined, 'core_pipeline');
    logger.textExtracted(sessionId, text);

    // Build workflow based on whether this is first message or follow-up
    const workflow = buildCoreWorkflow(isFirstMessage);

    // Prepare initial state
    const preparedState = prepareInitialState(text, initialState, isFirstMessage);

    // Execute the declarative workflow
    const result = await executeWorkflow(workflow, preparedState, 'core_pipeline');

    return result;

  } catch (error) {
    logger.workflowError(sessionId, 'core_pipeline', error as Error);
    
    // Return error state for graceful degradation
    const errorState: VoiceCommandState = {
      ...initialState,
      error: (error as Error).message,
      isComplete: false,
      nodeStatus: 'error',
      conversationHistory: [
        ...initialState.conversationHistory,
        {
          id: `msg_${Date.now()}`,
          timestamp: new Date(),
          type: 'assistant' as const,
          content: 'I encountered an error processing your request. Please try again.',
          metadata: { error: (error as Error).message }
        }
      ]
    };

    return {
      value: errorState,
      state: errorState
    };
  }
}

