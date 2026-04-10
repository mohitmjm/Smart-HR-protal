Here's the current file organization for the LangGraph voice agent implementation:

## 📁 **File Structure (Current State)**

### **1. Core LangGraph Files**
```
src/lib/langGraph/
├── index.ts                    # Main LangGraph exports ✅
├── types/
│   ├── state.ts               # VoiceCommandState, BaseMessage, ConversationMessage ✅
│   ├── session.ts             # SessionData, SessionStore interfaces ✅
│   └── workflow.ts            # Workflow type definitions ✅
├── config/                     # 🆕 SINGLE SOURCE OF TRUTH
│   ├── parameterRequirements.ts  # Intent parameters, metadata, helper functions ✅
│   └── availableIntents.ts       # Auto-generated from parameterRequirements ✅
├── nodes/
│   ├── intentExtraction.ts    # Intent processing node (config-driven) ✅
│   ├── intentContinuity.ts    # Intent continuity checking node ✅
│   ├── dataCollection.ts      # Universal data collection with OpenAI ✅
│   ├── informationCompletion.ts # Normalize subjective data (dates, months) ✅
│   ├── execution.ts           # Command execution node (action-based) ✅
│   ├── confirmation.ts        # Response generation with templates ✅
│   └── actions/               # 🆕 ACTION EXECUTORS
│       ├── index.ts           # Action registry (central dispatcher) ✅
│       ├── clockIn.ts         # Clock-in action ✅
│       ├── clockOut.ts        # Clock-out action ✅
│       ├── applyLeave.ts      # Leave application action ✅
│       ├── getLeaveBalance.ts # Leave balance navigation ✅
│       ├── viewAttendanceHistory.ts # Attendance history navigation ✅
│       ├── viewTeamAttendance.ts    # Team attendance navigation ✅
│       └── viewTeamLeaves.ts        # Team leaves navigation ✅
├── workflows/
│   ├── coreRouter.ts          # Main workflow pipeline ✅
│   ├── definitions/
│   │   └── core.ts            # Declarative workflow definition ✅
│   └── conditions/
│       └── intent.ts          # Guard/condition functions ✅
└── utils/
    └── logger.ts              # Structured logging utilities ✅
```

### **2. Session Management**
```
src/lib/session/
└── sessionStore.ts            # Upstash Redis session store ✅
                               # Implements SessionStore interface
                               # Handles session CRUD operations
```

### **3. API Integration**
```
src/app/api/voice-commands/
└── langgraph/
    └── process/route.ts       # Main LangGraph processing endpoint ✅
                               # Handles voice command requests
                               # Manages session state
                               # Returns workflow results
```

### **4. Documentation**
```
docs/
├── agent_file_strucure.md         # This file - current structure ✅
├── agent_langgraph.md             # LangGraph architecture overview ✅
├── agent_state.md                 # State management & single source of truth ✅
├── agent_workflow.md              # Complete workflow documentation ✅
└── REFACTORING_SUMMARY.md         # Recent refactoring details ✅
```

---

## 🎯 **Key Architecture Decisions**

### **Single Source of Truth**
All intent definitions, parameters, metadata, and configuration live in:
```
src/lib/langGraph/config/parameterRequirements.ts
```

**What it contains:**
- Intent definitions with descriptions
- Parameter requirements (name, type, required/optional)
- Workflow mappings
- Metadata (permissions, context requirements, success messages)
- Helper functions for accessing config

### **No Hardcoded Values**
All nodes dynamically read from central config:
- ✅ `intentExtraction.ts` - Uses `getAllParameters()`, `requiresLocationPermission()`, etc.
- ✅ `informationCompletion.ts` - Normalizes subjective dates/months using OpenAI
- ✅ `execution.ts` - Uses action registry pattern for dynamic execution
- ✅ `confirmation.ts` - Uses `getSuccessMessage()` with template substitution
- ✅ `availableIntents.ts` - Auto-generates from `parameterRequirements.ts`
- ✅ `actions/index.ts` - Central ACTION_REGISTRY maps intents to executors

### **State Flow**
```
NodeInput<T> → VoiceCommandState → NodeOutput<T>
```

Each node:
1. Receives state via `NodeInput<T>`
2. Processes and updates state
3. Returns updated state via `NodeOutput<T>`

### **Session Persistence**
- Uses **Upstash Redis** REST API for serverless compatibility
- Stores full session state including conversation history
- TTL-based expiration (default 1 hour)
- Rich metadata tracking (user context, analytics, workflow state)

---

## 📊 **Adding New Features**

### **To Add a New Intent:**
1. Edit `src/lib/langGraph/config/parameterRequirements.ts`
2. Add new intent object with parameters and metadata
3. **Done!** All nodes automatically support it

### **To Add a New Node:**
1. Create node file in `src/lib/langGraph/nodes/`
2. Implement `LangGraphNode` interface
3. Export node from `index.ts`
4. Add to workflow in `workflows/coreRouter.ts`

### **To Modify State:**
1. Update interface in `src/lib/langGraph/types/state.ts`
2. Nodes automatically receive updated type
3. No other changes needed (TypeScript ensures correctness)

---

## 🔍 **File Responsibilities**

### **Config Layer**
- `config/parameterRequirements.ts` - Single source of truth for all intents
- `config/availableIntents.ts` - Derived helper for intent listing

### **Type Layer**
- `types/state.ts` - Runtime state that flows through nodes
- `types/session.ts` - Persistent state stored in Redis
- `types/workflow.ts` - Workflow and node type definitions

### **Node Layer**
- `nodes/intentExtraction.ts` - Extracts intent and initial parameters
- `nodes/intentContinuity.ts` - Checks if user is continuing or switching intents
- `nodes/dataCollection.ts` - Collects missing parameters with AI responses
- `nodes/informationCompletion.ts` - Normalizes subjective information (dates, months)
- `nodes/execution.ts` - Dispatches to action executors via registry
- `nodes/confirmation.ts` - Generates user-facing response

### **Action Layer** 🆕
- `nodes/actions/index.ts` - Central ACTION_REGISTRY for intent-to-executor mapping
- `nodes/actions/clockIn.ts` - Direct attendance service integration for clock-in
- `nodes/actions/clockOut.ts` - Direct attendance service integration for clock-out
- `nodes/actions/applyLeave.ts` - Direct database integration for leave applications
- `nodes/actions/getLeaveBalance.ts` - Navigation to leaves page with filters
- `nodes/actions/viewAttendanceHistory.ts` - Navigation to attendance with month
- `nodes/actions/viewTeamAttendance.ts` - Navigation to team attendance view
- `nodes/actions/viewTeamLeaves.ts` - Navigation to team leaves tab

### **Workflow Layer**
- `workflows/coreRouter.ts` - Orchestrates node execution
- `workflows/definitions/core.ts` - Declarative workflow definition
- `workflows/conditions/intent.ts` - Conditional logic for routing

### **Session Layer**
- `session/sessionStore.ts` - Redis-based session persistence

### **API Layer**
- `api/voice-commands/langgraph/process/route.ts` - HTTP endpoint

---
