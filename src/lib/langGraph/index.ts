// LangGraph public API entry point
// This file intentionally keeps definitions minimal to avoid cross-file dependencies.

export type LangGraphNode = {
  id: string;
  description?: string;
  execute: (
    input: unknown,
    context?: Record<string, unknown>
  ) => Promise<unknown>;
};

export type LangGraphWorkflow = {
  name: string;
  run: (
    input: unknown,
    context?: Record<string, unknown>
  ) => Promise<unknown>;
};

export type LangGraphContext = Record<string, unknown>;

export const createWorkflow = (name: string, run: LangGraphWorkflow["run"]): LangGraphWorkflow => ({
  name,
  run,
});

export const version = "0.1.0";

export { runCorePipeline } from "./workflows/coreRouter";
export { logger } from "./utils/logger";

// Configuration exports
export {
  AVAILABLE_INTENTS,
  getAvailableIntentsList,
  getIntentDescription,
  getIntentParameters,
  formatIntentsForPrompt,
  formatDetailedIntentsForPrompt
} from "./config/availableIntents";

// Re-exports for public API
export type {
  Primitive,
  Serializable,
  BaseMessage,
  ConversationMessage,
  VoiceCommandState,
  NodeInput,
  NodeOutput,
} from "./types/state";

// Helper functions
export {
  createInitialVoiceCommandState,
  updateNodeStatus
} from "./types/state";

// Type alias for backward compatibility
export type { VoiceCommandState as AgentState } from "./types/state";


