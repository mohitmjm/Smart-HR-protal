// Declarative definition for the core workflow

export type WorkflowStepId =
  | 'intent_extraction'
  | 'intent_continuity'
  | 'data_collection'
  | 'information_completion'
  | 'execution'
  | 'confirmation';

export type EdgeCondition = {
  from: WorkflowStepId;
  to: WorkflowStepId;
  guard?: string; // symbolic guard name, resolved elsewhere
  label?: string; // description for debugging
};

/**
 * Core workflow definition
 * 
 * Flow:
 * 1. Intent Extraction (first message) OR Intent Continuity (follow-up)
 * 2. Data Collection (if needed) - loops until complete
 * 3. Information Completion (normalize dates/times)
 * 4. Execution (if ready)
 * 5. Confirmation (show results)
 */
export const coreWorkflowDefinition: {
  steps: WorkflowStepId[];
  edges: EdgeCondition[];
  startNode: WorkflowStepId;
  endNodes: WorkflowStepId[];
} = {
  steps: [
    'intent_extraction',
    'intent_continuity',
    'data_collection',
    'information_completion',
    'execution',
    'confirmation',
  ],
  edges: [
    // Intent Extraction flow (first message)
    { 
      from: 'intent_extraction', 
      to: 'data_collection',
      guard: 'requiresDataCollection',
      label: 'needs data'
    },
    { 
      from: 'intent_extraction', 
      to: 'confirmation',
      guard: 'isMessageIrrelevant',
      label: 'irrelevant message'
    },
    { 
      from: 'intent_extraction', 
      to: 'execution',
      label: 'has all data, ready to execute'
    },
    
    // Intent Continuity flow (follow-up messages)
    { 
      from: 'intent_continuity', 
      to: 'data_collection',
      guard: 'requiresDataCollection',
      label: 'needs data'
    },
    { 
      from: 'intent_continuity', 
      to: 'confirmation',
      guard: 'isMessageIrrelevant',
      label: 'irrelevant message'
    },
    { 
      from: 'intent_continuity', 
      to: 'information_completion',
      label: 'has all data'
    },
    
    // Data Collection flow
    { 
      from: 'data_collection', 
      to: 'information_completion',
      guard: 'isDataCollectionComplete',
      label: 'data complete'
    },
    { 
      from: 'data_collection', 
      to: 'confirmation',
      label: 'incomplete, waiting for user'
    },
    
    // Information Completion flow
    { 
      from: 'information_completion', 
      to: 'execution',
      label: 'data normalized'
    },
    
    // Execution flow
    { 
      from: 'execution', 
      to: 'confirmation',
      label: 'execution complete'
    },
  ],
  startNode: 'intent_extraction', // Default, can be overridden
  endNodes: ['confirmation']
};


