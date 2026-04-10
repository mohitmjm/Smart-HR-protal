// Simplified condition functions - removed redundant negations
// Instead of having both positive and negative versions, we use the NOT operator where needed

import type { VoiceCommandState } from "../../types/state";

// ===== Data Collection Status =====

export function isDataCollectionComplete(state: VoiceCommandState): boolean {
  return !!state.isComplete;
}

// ===== Message Relevance =====

export function isMessageIrrelevant(state: VoiceCommandState): boolean {
  return state.currentIntent === 'irrelevant_message';
}

// ===== Data Requirements =====

export function requiresDataCollection(state: VoiceCommandState): boolean {
  return state.missingParameters.length > 0;
}

// ===== Execution Readiness =====

export function isExecutionReady(state: VoiceCommandState): boolean {
  return (
    state.isComplete && 
    !state.requiresConfirmation && 
    state.currentIntent !== 'irrelevant_message'
  );
}

// ===== Confirmation =====

export function needsConfirmation(state: VoiceCommandState): boolean {
  return !!state.requiresConfirmation;
}

// ===== Execution Results =====

export function hasExecutionResult(state: VoiceCommandState): boolean {
  return !!state.executionResult;
}

// ===== Intent Continuity =====

export function isIntentContinuation(state: VoiceCommandState): boolean {
  return state.conversationHistory.length > 1 && state.currentIntent !== '';
}

export function isNewIntent(state: VoiceCommandState): boolean {
  const lastMessage = state.conversationHistory[state.conversationHistory.length - 1];
  return lastMessage?.metadata?.isNewIntent === true;
}


