## 🚀 **Processing Flow**

### **Core Pipeline (6 Nodes)**
The workflow executes in a linear pipeline with conditional branching:

```
┌─────────────────────────┐
│ 1. Intent Extraction    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. Intent Continuity    │ ◄─── (loops back if new intent detected)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. Data Collection      │ ◄─── (loops back if parameters missing)
└───────────┬─────────────┘
            │
            ▼ (only if isComplete = true)
┌─────────────────────────┐
│ 4. Information          │
│    Completion           │ (normalize dates, months)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 5. Execution            │ (action-based via registry)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 6. Confirmation         │
└─────────────────────────┘
```

### **Node Descriptions**

#### **1. Intent Extraction Node**
- **Location**: `src/lib/langGraph/nodes/intentExtraction.ts`
- **Purpose**: Derives intent and entities from user input using OpenAI
- **Input**: Text input from user
- **Processing**:
  - Calls OpenAI to extract intent and parameters
  - Builds initial `requiredData` structure based on intent
  - Adds user message to conversation history
  - Sets initial confidence level
- **Output**: `VoiceCommandState` with `currentIntent`, `requiredData`, and conversation history

#### **2. Intent Continuity Node**
- **Location**: `src/lib/langGraph/nodes/intentContinuity.ts`
- **Purpose**: Checks if user's reply is a new intent or continuation of current intent
- **Input**: Current state with conversation history
- **Processing**:
  - Checks if this is first message (always new intent)
  - Uses OpenAI to analyze continuity with `checkIntentContinuity()`
  - **If new intent detected**:
    - Tags message metadata with `isNewIntent: true` and `route: 'intent_extraction'`
    - Resets state but preserves conversation history
  - **If continuation**:
    - Merges new extracted parameters into existing `requiredData`
    - Keeps current intent
- **Output**: Updated state with merged data or new-intent tag
- **Routing**: Implicitly signals router to restart extraction for new intents

#### **3. Data Collection Node**
- **Location**: `src/lib/langGraph/nodes/dataCollection.ts`
- **Purpose**: Universal parameter collection for all voice commands
- **Input**: Current state with intent and partial parameters
- **Processing**:
  - Extracts additional parameters from latest user message
  - Computes missing parameters using `computeMissingParameters()`
  - **If parameters missing**:
    - Calls OpenAI `generateDataCollectionReply()` for intelligent follow-up
    - Sets `isComplete: false`, `requiresConfirmation: true`
    - Adds assistant message to conversation history
  - **If all parameters collected**:
    - Sets `isComplete: true`, `requiresConfirmation: false`
- **Output**: Updated state with complete/incomplete flag
- **Routing Decision**: `isComplete` flag determines next step

#### **4. Information Completion Node** 🆕
- **Location**: `src/lib/langGraph/nodes/informationCompletion.ts`
- **Purpose**: Normalizes subjective information to concrete values
- **Input**: State with collected but potentially subjective data
- **Processing**:
  - Calls OpenAI to normalize subjective date/time references
  - Examples:
    - "tomorrow" → "2025-10-01"
    - "this month" → "September"
    - "last month" → "August"
  - Pre-calculates month names to ensure accuracy
  - Preserves non-date fields unchanged
- **Output**: State with normalized, actionable data
- **Critical for**: Date-dependent actions (leave applications, attendance queries)

#### **5. Execution Node**
- **Location**: `src/lib/langGraph/nodes/execution.ts`
- **Purpose**: Executes the voice command using action registry pattern
- **Input**: State with complete and normalized `requiredData`
- **Processing**:
  - Looks up action executor in `ACTION_REGISTRY` by intent
  - Dispatches to appropriate action (e.g., `executeApplyLeave`)
  - Actions may:
    - **Directly modify database** (apply_leave, clock_in)
    - **Return navigation destination** (view_team_attendance)
  - Sets `executionResult` with success/failure
  - Adds execution result to conversation history
- **Output**: State with execution result
- **Error Handling**: Catches errors and sets error state with `isComplete: false`
- **Action Types**:
  - **Mutation Actions**: Direct database operations (applyLeave, clockIn)
  - **Navigation Actions**: Return `destination` URL (viewTeamAttendance)
  - **Query Actions**: Fetch and return data (future enhancement)

#### **6. Confirmation Node**
- **Location**: `src/lib/langGraph/nodes/confirmation.ts`
- **Purpose**: Generates final user-facing response
- **Input**: State with execution result
- **Processing**:
  - Calls `generateConfirmationResponse()` based on intent
  - Creates intent-specific success messages
  - Handles error cases with user-friendly messages
  - Adds confirmation message to conversation history
- **Output**: Final state with confirmation message
- **Finalizes**: Sets `isComplete: true`, `requiresConfirmation: false`

### **Routing Logic**

#### **Workflow Router**
- **Location**: `src/lib/langGraph/workflows/coreRouter.ts`
- **Function**: `runCorePipeline(text, initialState)`
- **Execution Order**:
  1. Intent Extraction (always)
  2. Intent Continuity Check (always)
  3. Data Collection (always)
  4. **Conditional Branch**: If `!collected.value.isComplete`, return to user for more input
  5. Information Completion (only if complete) 🆕
  6. Execution via Action Registry (only if complete)
  7. Confirmation (only if execution succeeded)

#### **Routing Conditions**
- **Location**: `src/lib/langGraph/workflows/conditions/intent.ts`

**Available Guards:**
```typescript
// Guard: isDataCollectionComplete
export function isDataCollectionComplete(state: VoiceCommandState): boolean {
  return !!state.isComplete;
}

// Guard: isDataCollectionIncomplete  
export function isDataCollectionIncomplete(state: VoiceCommandState): boolean {
  return !state.isComplete;
}
```

**Implicit Routing Conditions in Router:**
- Line 42-49: `if (!collected.value.isComplete)` → Exit pipeline, wait for user input
- Intent Continuity tags messages with routing hints (not yet fully wired to declarative router)

#### **Workflow Definition (Declarative)**
- **Location**: `src/lib/langGraph/workflows/definitions/core.ts`
- **Status**: Scaffold created, not yet wired to runtime router

**Defined Edges:**
```typescript
edges: [
  { from: 'intent_extraction', to: 'intent_continuity' },
  { from: 'intent_continuity', to: 'data_collection' },
  { from: 'data_collection', to: 'execution', guard: 'isDataCollectionComplete' },
  { from: 'data_collection', to: 'data_collection', guard: 'isDataCollectionIncomplete' },
  { from: 'execution', to: 'confirmation' }
]
```

### **Multi-Turn Conversation Flow**

**Turn 1: Initial Request**
```
User: "Apply for leave"
→ Intent Extraction: intent = "apply_leave"
→ Intent Continuity: (first message, passes through)
→ Data Collection: Missing [date_range, leave_type, reason]
→ Returns: "When would you like to take leave?"
```

**Turn 2: User Provides Date**
```
User: "Next Monday to Friday"
→ Intent Extraction: Extracts date_range
→ Intent Continuity: isSame=true, merges date_range
→ Data Collection: Missing [leave_type, reason]
→ Returns: "What type of leave?"
```

**Turn 3: User Provides Type**
```
User: "Sick leave for medical appointment"
→ Intent Extraction: Extracts leave_type + reason
→ Intent Continuity: isSame=true, merges both
→ Data Collection: All parameters complete
→ Information Completion: Normalizes "tomorrow" → "2025-10-01"
→ Execution: ACTION_REGISTRY['apply_leave'] → executeApplyLeave()
   └─ Direct database: Creates leave record, sends notifications
→ Confirmation: "Your leave request has been submitted..."
```

**Turn 4: New Intent**
```
User: "Show my attendance"
→ Intent Extraction: Extracts new intent
→ Intent Continuity: isSame=false, tags as new intent
→ (Router would restart with new intent - currently handled inline)
```
