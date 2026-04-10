# Unified Voice Command State

## 🎯 **Objective**
Single unified state object that flows through the entire LangGraph system for voice command processing.

## 📁 **Current Implementation Location**
- **State Types**: `src/lib/langGraph/types/state.ts`
- **Session Types**: `src/lib/langGraph/types/session.ts`
- **Session Store**: `src/lib/session/sessionStore.ts`
- **Parameter Requirements** (Single Source of Truth): `src/lib/langGraph/config/parameterRequirements.ts`
- **Available Intents** (Derived from Parameter Requirements): `src/lib/langGraph/config/availableIntents.ts`

## 🏗️ **Unified State Architecture**

### **Single Voice Command State**
**Location**: `src/lib/langGraph/types/state.ts`

```typescript
export interface VoiceCommandState {
  // Session Management
  sessionId: string;
  userId: string;
  
  // Current Processing
  currentIntent: string;
  requiredData: Record<string, any>;
  missingParameters: string[];
  
  // Conversation Context
  messages: BaseMessage[];
  conversationHistory: ConversationMessage[];
  
  // Processing Status
  isComplete: boolean;
  requiresConfirmation: boolean;
  dataCollectionReply?: string;
  
  // Execution
  executionResult?: any;
  error?: string;
}
```

### **Base Message Schema**
**Location**: `src/lib/langGraph/types/state.ts`

```typescript
export interface BaseMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string; // ISO
}
```

### **Conversation Message Schema**
**Location**: `src/lib/langGraph/types/state.ts`

```typescript
export interface ConversationMessage {
  id: string;
  timestamp: Date;
  type: 'user' | 'assistant' | 'system';
  content: string;
  intent?: string;
  confidence?: number;
  parameters?: Record<string, any>;
  executionResult?: any;
  metadata?: Record<string, any>;
}
```

### **Node Input/Output Types**
**Location**: `src/lib/langGraph/types/state.ts`

```typescript
// Simplified node input/output types for passing state through nodes
export interface NodeInput<T = unknown> {
  value: T;
  state: VoiceCommandState;
}

export interface NodeOutput<T = unknown> {
  value: T;
  state: VoiceCommandState;
}
```

## 🔧 **State Processing**

### **State Flow Through LangGraph**
```typescript
const processVoiceCommand = async (state: VoiceCommandState): Promise<VoiceCommandState> => {
  // 1. Extract intent from user input
  const intent = await extractIntent(state.messages[state.messages.length - 1].content);
  
  // 2. Update state with intent
  state.currentIntent = intent.intent;
  state.requiredData = { ...state.requiredData, ...intent.parameters };
  
  // 3. Check for missing parameters
  const missing = computeMissingParameters(state.currentIntent, state.requiredData);
  
  if (missing.length > 0) {
    // Generate reply asking for missing data
    const reply = await generateDataCollectionReply(
      state.currentIntent,
      state.requiredData,
      missing,
      state.conversationHistory
    );
    
    return {
      ...state,
      missingParameters: missing,
      dataCollectionReply: reply,
      requiresConfirmation: true,
      isComplete: false
    };
  }
  
  // 4. Normalize subjective information (dates, months)
  const normalizedData = await normalizeSubjectiveInformation(
    state.requiredData,
    { currentDate, currentTime, timezone, intent: state.currentIntent }
  );
  
  // 5. Execute command via action registry
  const actionExecutor = getActionExecutor(state.currentIntent);
  const result = await actionExecutor({ userId, ...normalizedData });
  
  return {
    ...state,
    requiredData: normalizedData,
    isComplete: true,
    executionResult: result,
    requiresConfirmation: false
  };
};
```

### **Parameter Requirements (Single Source of Truth)**
**Location**: `src/lib/langGraph/config/parameterRequirements.ts`

⚠️ **CRITICAL**: This is the **single source of truth** for all intent definitions and parameter requirements. All other files derive from this config.

The current implementation uses a sophisticated parameter configuration system:

```typescript
export interface ParameterRequirement {
  name: string;
  type: 'string' | 'date' | 'number' | 'boolean' | 'enum';
  required: boolean;
  description: string;
  examples?: string[];
  enumValues?: string[];
}

export interface IntentParameterConfig {
  intent: string;
  description: string;
  parameters: ParameterRequirement[];
  workflow: string;
}

// Centralized parameter requirements configuration
export const PARAMETER_REQUIREMENTS: Record<string, IntentParameterConfig> = {
  'apply_leave': {
    intent: 'apply_leave',
    description: 'Apply for leave request',
    workflow: 'leave',
    parameters: [
      { name: 'leaveType', type: 'enum', required: true, ... },
      { name: 'startDate', type: 'date', required: true, ... },
      { name: 'endDate', type: 'date', required: true, ... }
    ]
  },
  'clock_in': {
    intent: 'clock_in',
    description: 'Clock in for work',
    workflow: 'attendance',
    parameters: [
      { name: 'action', type: 'enum', required: true, ... },
      { name: 'timestamp', type: 'date', required: true, ... }
    ]
  },
  // ... more intents
};

// Helper functions
export function getRequiredParameters(intent: string): string[];
export function getAllParameters(intent: string): string[];
export function getParameterConfig(intent: string, parameterName: string): ParameterRequirement | undefined;
export function getWorkflowForIntent(intent: string): string;
export function getIntentDescription(intent: string): string;
```

**Supported Intents (from PARAMETER_REQUIREMENTS):**
- `apply_leave` - Apply for leave (leaveType, startDate, endDate, reason) 🆕 Direct DB action
- `clock_in` - Clock in for work () 🆕 Direct attendance service action
- `clock_out` - Clock out from work () 🆕 Direct attendance service action
- `view_attendance_history` - View attendance records (dateRange) 🆕 Navigation action
- `get_leave_balance` - Check leave balance (dateRange?, leaveType?) 🆕 Navigation action
- `view_team_attendance` - View team attendance (dateRange) 🆕 Navigation action
- `view_team_leaves` - View team leave requests (dateRange?) 🆕 Navigation action
- `approve_leave` - Approve/reject leave (for_whom, approval_status)

### **Available Intents Configuration**
**Location**: `src/lib/langGraph/config/availableIntents.ts`

This file **derives from** `parameterRequirements.ts` and should never be edited directly:

```typescript
import { PARAMETER_REQUIREMENTS, getAllParameters, getIntentDescription } from './parameterRequirements';

// Generate AVAILABLE_INTENTS from PARAMETER_REQUIREMENTS (single source of truth)
export const AVAILABLE_INTENTS: Record<string, IntentDefinition> = 
  Object.entries(PARAMETER_REQUIREMENTS).reduce(
    (acc, [key, config]) => {
      acc[key] = {
        name: config.intent,
        description: config.description,
        parameters: getAllParameters(config.intent)
      };
      return acc;
    },
    {} as Record<string, IntentDefinition>
  );
```

**Key Point**: All intent definitions automatically sync from `parameterRequirements.ts`.

## 🚀 **Multi-Turn Conversation Support**

### **Context-Aware Data Collection**
**Location**: `src/lib/langGraph/nodes/dataCollection.ts`

The current implementation uses OpenAI to generate intelligent, context-aware responses:

```typescript
export const dataCollectionNode: LangGraphNode = {
  id: "data_collection",
  description: "Universal data collection with OpenAI-powered intelligent replies",
  async execute(input: unknown): Promise<unknown> {
    const { value: voiceState, state } = input as DataCollectionInput;
    
    // Extract parameters from the latest user message
    const latestMessage = voiceState.conversationHistory[voiceState.conversationHistory.length - 1];
    let extractedParameters = {};
    
    if (latestMessage && latestMessage.type === 'user') {
      const openaiService = new OpenAIService();
      const intentResult = await openaiService.extractIntent(
        latestMessage.content,
        {
          userId: voiceState.userId,
          sessionId: state.sessionId,
          conversationHistory: state.conversationHistory,
          // ... more context
        }
      );
      extractedParameters = intentResult.parameters || {};
    }

    // Merge extracted parameters with existing data
    const updatedRequiredData = { ...voiceState.requiredData, ...extractedParameters };
    const missing = computeMissingParameters(voiceState.currentIntent, updatedRequiredData);

    if (missing.length > 0) {
      // Generate intelligent reply asking for missing information
      const parameterConfig = PARAMETER_REQUIREMENTS[voiceState.currentIntent];
      
      const dataCollectionReply = await openaiService.generateDataCollectionReply(
        voiceState.currentIntent,
        updatedRequiredData,
        missing,
        state.conversationHistory,
        parameterConfig
      );
      
      return {
        ...voiceState,
        requiredData: updatedRequiredData,
        missingParameters: missing,
        dataCollectionReply,
        requiresConfirmation: true,
        isComplete: false
      };
    }
    
    // All parameters collected, ready for execution
    return {
      ...voiceState,
      requiredData: updatedRequiredData,
      isComplete: true,
      requiresConfirmation: false
    };
  }
};

// Helper function
function computeMissingParameters(intent: string, requiredData: Record<string, unknown>): string[] {
  const requiredParams = getRequiredParameters(intent);
  return requiredParams.filter(param => 
    !requiredData[param] || 
    requiredData[param] === '' || 
    requiredData[param] === null ||
    requiredData[param] === undefined
  );
}
```

### **State Persistence**
**Location**: `src/lib/session/sessionStore.ts`

The current implementation uses **Upstash Redis** for persistent session storage:

```typescript
export interface SessionData {
  id: SessionId;
  userId: string;
  createdAt: string; // ISO
  lastActivity: string; // ISO
  isActive: boolean;

  // Conversation Context
  conversationHistory: ConversationMessage[];
  currentWorkflow: string | null;
  workflowStep: string | null;

  // User Context
  userTimezone: string;
  userRole: "employee" | "manager" | "hr";
  userPreferences: Record<string, Serializable>;

  // Session State
  pendingActions: string[];
  completedActions: string[];
  contextData: Record<string, Serializable>;

  // Metadata / Analytics
  totalInteractions: number;
  averageResponseTime: number;
  errorCount: number;

  // Expiry
  expiresAt?: string; // ISO timestamp
  metadata?: SessionMetadata;
}

export interface SessionStore {
  get: (id: SessionId) => Promise<SessionData | null>;
  set: (session: SessionData) => Promise<void>;
  update: (id: SessionId, updates: Partial<Omit<SessionData, "id">>) => Promise<SessionData | null>;
  delete: (id: SessionId) => Promise<void>;
}

// Upstash Redis implementation
export const RedisSessionStore: SessionStore = {
  async get(id: SessionId): Promise<SessionData | null> {
    const result = await redisRequest("GET", [`session:${id}`]);
    return result.result ? JSON.parse(result.result) : null;
  },

  async set(session: SessionData): Promise<void> {
    const ttl = session.expiresAt 
      ? Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
      : 3600; // Default 1 hour TTL
    
    await redisRequest("SETEX", [`session:${session.id}`, ttl.toString(), JSON.stringify(session)]);
  },

  async update(id: SessionId, updates: Partial<Omit<SessionData, "id">>): Promise<SessionData | null> {
    const current = await this.get(id);
    if (!current) return null;
    
    const updated: SessionData = { ...current, ...updates } as SessionData;
    await this.set(updated);
    return updated;
  },

  async delete(id: SessionId): Promise<void> {
    await redisRequest("DEL", [`session:${id}`]);
  }
};
```

**Key Features:**
- **Upstash REST API** for serverless Redis access
- **Automatic TTL management** (default **15 minutes**, auto-extends on each interaction)
- **Rich session metadata** including user context, workflow state, and analytics
- **Conversation history persistence** across multiple interactions
- **Session reuse** - Same session maintained for 15 minutes of activity

## 🎯 **Key Benefits**

### **Simplified Architecture**
- **Single State**: One unified state object flows through the entire system
- **Universal Data Collection**: One node handles all parameter collection
- **Context Awareness**: Conversation history maintained in the state
- **Multi-turn Support**: Natural conversation flow with parameter collection

### **Processing Benefits**
- **Stateful Conversations**: Maintain context across interactions
- **Intelligent Parameter Collection**: OpenAI-powered responses for missing data
- **Error Recovery**: Built-in error handling mechanisms
- **Extensibility**: Easy to add new command types with just parameter requirements

## 🔧 **Technical Implementation**

### **State Management**
- **Redis-based Session Store**: Persistent session state
- **Context Preservation**: Full conversation history available
- **Parameter Accumulation**: Missing parameters collected over multiple turns
- **Error Handling**: Graceful error recovery with user-friendly messages

### **Performance Considerations**
- **Session Caching**: Fast access to session state
- **Async Processing**: Non-blocking voice command processing
- **Memory Optimization**: Efficient state storage and retrieval

## 🔄 **Actual State Flow in Pipeline**
**Location**: `src/lib/langGraph/workflows/coreRouter.ts`

The current implementation uses **conditional routing** based on `isFirstMessage` flag:

```typescript
export async function runCorePipeline(
  text: string,
  initialState: VoiceCommandState,
  isFirstMessage: boolean = false
): Promise<NodeOutput<VoiceCommandState>> {
  
  let processedState: NodeOutput<VoiceCommandState>;

  // ROUTING LOGIC: New session vs Existing session
  if (isFirstMessage) {
    // NEW SESSION: First message → Intent Extraction only
    processedState = await intentExtractionNode.execute({ 
      value: { text }, 
      state: initialState 
    });
    // Updates: currentIntent, requiredData (initial parameters)
    
  } else {
    // EXISTING SESSION: Follow-up message → Intent Continuity first
    processedState = await intentContinuityNode.execute({ 
      value: initialState, 
      state: initialState 
    });
    // Updates: currentIntent (may restore previous), requiredData (may merge)
    // Note: Intent Continuity may trigger Intent Extraction internally if new intent detected
  }

  // 2. Data Collection (Universal)
  // Collects missing parameters using OpenAI-powered responses
  const collected = await dataCollectionNode.execute({ 
    value: processedState.value, 
    state: processedState.state 
  });
  // Updates: requiredData, missingParameters, dataCollectionReply, 
  //          isComplete, requiresConfirmation, conversationHistory

  // If data collection incomplete, return for more user input
  if (!collected.value.isComplete) {
    return collected;
  }

  // 3. Execution
  // Executes the command with all collected parameters
  const executed = await executionNode.execute({ 
    value: collected.value, 
    state: collected.state 
  });
  // Updates: executionResult, isComplete=true, conversationHistory

  // 4. Confirmation
  // Generates confirmation response for the user
  const confirmed = await confirmationNode.execute({ 
    value: executed.value, 
    state: executed.state 
  });
  // Updates: dataCollectionReply (with confirmation message)

  return confirmed;
}
```

### **State Transitions**

#### **New Session (isFirstMessage = true)**
```
Initial State
    ↓
[Intent Extraction] → currentIntent, initial requiredData
    ↓
[Data Collection] → collects missing parameters
    ↓
    ├─→ incomplete? → return state with dataCollectionReply
    └─→ complete → continue
         ↓
    [Execution] → executes command, stores result
         ↓
    [Confirmation] → generates user-friendly response
         ↓
    Final State
```

#### **Existing Session (isFirstMessage = false)**
```
Initial State (with existing context)
    ↓
[Intent Continuity] → checks if continuing or new intent
    ↓
    ├─→ new intent? → [Intent Extraction] internally
    └─→ continuing? → use existing intent
    ↓
[Data Collection] → collects missing parameters
    ↓
    ├─→ incomplete? → return state with dataCollectionReply
    └─→ complete → continue
         ↓
    [Execution] → executes command, stores result
         ↓
    [Confirmation] → generates user-friendly response
         ↓
    Final State
```

### **Key State Fields Through Pipeline**

| Node | When Run | Updates | Reads |
|------|----------|---------|-------|
| Intent Extraction | **New sessions only** OR when Intent Continuity detects new intent | `currentIntent`, `requiredData` | `messages`, `conversationHistory` |
| Intent Continuity | **Existing sessions only** | `currentIntent`, `requiredData` | `conversationHistory`, `currentIntent` |
| Data Collection | **Always** | `requiredData`, `missingParameters`, `dataCollectionReply`, `isComplete`, `requiresConfirmation` | `currentIntent`, `requiredData`, `conversationHistory` |
| Execution | **Always** (if data complete) | `executionResult`, `isComplete`, `error` | `currentIntent`, `requiredData` |
| Confirmation | **Always** (if execution complete) | `dataCollectionReply` | `executionResult`, `currentIntent` |

## 📊 **Success Metrics**

- **Session Persistence**: 95%+ session retention rate via Upstash Redis
- **Response Time**: <500ms for session-aware processing
- **User Satisfaction**: Improved conversation flow with context awareness
- **Error Reduction**: Fewer failed commands due to persistent context
- **Multi-turn Support**: Seamless parameter collection across multiple interactions

## 🔍 **Differences from Initial Design**

### **Enhanced Features:**
1. **SessionData**: Richer than VoiceCommandState with analytics, preferences, and workflow tracking
2. **Parameter Configuration**: Detailed type system with examples, descriptions, and enum values
3. **Upstash Redis**: REST API-based Redis for serverless compatibility
4. **Intent Continuity**: Dedicated node to handle context switching
5. **OpenAI Integration**: Full integration for both intent extraction and data collection replies

### **Implementation Notes:**
- `VoiceCommandState` flows through nodes via `NodeInput<T>` / `NodeOutput<T>` wrapper
- `SessionData` persists in Redis, while `VoiceCommandState` is runtime state
- Conversation history maintained in both structures for full context
- Each node is stateless; state is explicitly passed and returned

### **Action Registry Pattern:** 🆕
All execution now uses a registry pattern for dynamic dispatch:

**Action Registry** (`nodes/actions/index.ts`):
```typescript
// Central registry maps intents to action executors
export const ACTION_REGISTRY: Record<string, ActionExecutor> = {
  'clock_in': executeClockIn,
  'clock_out': executeClockOut,
  'apply_leave': executeApplyLeave,
  'get_leave_balance': executeGetLeaveBalance,
  'view_attendance_history': executeViewAttendanceHistory,
  'view_team_attendance': executeViewTeamAttendance,
  'view_team_leaves': executeViewTeamLeaves,
};

export function getActionExecutor(intent: string): ActionExecutor | undefined {
  return ACTION_REGISTRY[intent];
}
```

**Execution Node** (`execution.ts`):
```typescript
// ✅ Uses action registry for dynamic dispatch
async function executeCommand(intent: string, requiredData: Record<string, any>, userId: string) {
  if (!PARAMETER_REQUIREMENTS[intent]) {
    return { success: false, reason: "unknown_intent" };
  }
  
  // Get action executor from registry
  const actionExecutor = getActionExecutor(intent);
  if (!actionExecutor) {
    return { success: false, reason: "no_executor" };
  }
  
  // Execute action with normalized data
  const result = await actionExecutor({ userId, ...requiredData });
  return result;
}
```

**Action Types:**
- **Mutation Actions**: Direct database operations (e.g., `applyLeave`)
- **Navigation Actions**: Return `destination` URL (e.g., `viewTeamAttendance`)
- **Service Actions**: Call existing services (e.g., `clockIn`)

**Confirmation Node** (`confirmation.ts`):
```typescript
// ✅ Uses getIntentDescription() from config
function generateConfirmationResponse(state: VoiceCommandState): string {
  const intentDescription = getIntentDescription(state.currentIntent);
  // Pattern-based message generation instead of hardcoded cases
}
```

**Benefits:**
- ✅ Add new intents by only updating `parameterRequirements.ts` and creating action executor
- ✅ No need to modify node code for new intents
- ✅ Single source of truth prevents inconsistencies
- ✅ Action executors are independently testable
- ✅ Clear separation: database actions vs navigation actions
- ✅ Easier to maintain and extend

### **Information Completion:** 🆕
Before execution, subjective data is normalized to concrete values:

**Information Completion Node** (`informationCompletion.ts`):
```typescript
// Normalizes subjective date/time references
const normalized = await openaiService.normalizeSubjectiveInformation(
  collectedData,
  {
    currentDate: '2025-09-30',
    currentTime: '14:30',
    timezone: 'America/New_York',
    intent: 'apply_leave'
  }
);

// Examples:
// "tomorrow" → "2025-10-01"
// "this month" → "September"
// "last month" → "August"
// "next Monday" → "2025-10-06"
```

**Pre-calculated Month Names:**
To ensure accuracy, month names are pre-calculated in JavaScript and injected into the AI prompt:
```typescript
const currentMonthName = "September";  // Calculated from current date
const nextMonthName = "October";       // currentMonth + 1
const lastMonthName = "August";        // currentMonth - 1

// Prompt includes:
// CRITICAL - EXACT CONVERSIONS FOR MONTHS:
// - "last month" → you MUST use "August"
// - "this month" → you MUST use "September"
// - "next month" → you MUST use "October"
```

This ensures 100% accuracy for month normalization without relying on AI calculations.
