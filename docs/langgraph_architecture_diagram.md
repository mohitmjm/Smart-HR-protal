# LangGraph Architecture Diagrams

## 🏗️ Before: Imperative Architecture

```mermaid
graph TD
    A[User Input] --> B[Core Router<br/>238 lines]
    B --> C{if/else chains}
    C -->|First message?| D[Intent Extraction]
    C -->|Follow-up?| E[Intent Continuity]
    D --> F{More if/else}
    E --> F
    F -->|Needs data?| G[Data Collection]
    F -->|Ready?| H[Execution]
    G --> I{Check complete?}
    I -->|No| J[Return & wait]
    I -->|Yes| K{More if/else}
    K --> L[Information Completion]
    L --> M{Another check}
    M --> H
    H --> N{Check result}
    N --> O[Confirmation]
    
    style B fill:#ff6b6b
    style C fill:#ff6b6b
    style F fill:#ff6b6b
    style I fill:#ff6b6b
    style K fill:#ff6b6b
    style M fill:#ff6b6b
    style N fill:#ff6b6b
```

### Issues:
- 🔴 **Manual routing** - Every path hardcoded
- 🔴 **3 state variables** - Synchronization bugs
- 🔴 **Duplicate patterns** - Same code repeated 5+ times
- 🔴 **High complexity** - Cyclomatic complexity of 15
- 🔴 **Hard to test** - Tightly coupled logic

---

## ✨ After: Declarative Architecture

```mermaid
graph TB
    A[User Input] --> B[Router Selector<br/>Feature Flags]
    
    B --> C{Use Refactored?}
    C -->|Yes| D[Refactored Router<br/>~150 lines]
    C -->|No| E[Old Router<br/>238 lines]
    C -->|Comparison| F[Both + Compare]
    
    D --> G[Workflow Engine]
    G --> H[Load Workflow Definition]
    H --> I[Node Map + Edges]
    
    I --> J[Execute Workflow Loop]
    J --> K[Get Current Node]
    K --> L[Execute Node<br/>+ State Management]
    L --> M[Validate State]
    M --> N[Find Next Node<br/>Guard Conditions]
    N -->|Has next| J
    N -->|End node| O[Return Result]
    
    L -->|Error| P[Error Boundary]
    P --> Q[Preserve State]
    Q --> O
    
    style D fill:#51cf66
    style G fill:#51cf66
    style H fill:#51cf66
    style L fill:#51cf66
    style M fill:#51cf66
    style N fill:#51cf66
    style P fill:#51cf66
```

### Benefits:
- ✅ **Data-driven routing** - Workflows are data
- ✅ **Single state** - No synchronization issues
- ✅ **Reusable patterns** - DRY principles
- ✅ **Low complexity** - Cyclomatic complexity of ~6
- ✅ **Highly testable** - Isolated components

---

## 🔄 Workflow Engine Flow

```mermaid
sequenceDiagram
    participant R as Router
    participant E as Workflow Engine
    participant N as Nodes
    participant V as Validator
    participant G as Guards
    
    R->>E: Execute workflow<br/>(state, definition)
    E->>E: Load node map & edges
    E->>N: Execute node<br/>(update status: running)
    N->>N: Process logic
    N-->>E: Return result
    E->>E: Update status: completed
    E->>V: Validate state
    V-->>E: ✅ Valid
    E->>G: Check guard conditions
    G-->>E: Next node ID
    
    alt Has next node
        E->>N: Execute next node
    else End node reached
        E-->>R: Return final state
    end
    
    Note over E,V: Error Boundary
    alt Error occurs
        N--xE: Error thrown
        E->>E: Preserve state
        E-->>R: Return error state
    end
```

---

## 🎯 Node Execution Pattern

### Before (Repeated 5+ times):
```typescript
// ❌ Duplicate pattern everywhere
let currentState = updateNodeStatus(state, 'node_name', 'running');
const result = await node.execute({ value: state, state: currentState });
currentState = updateNodeStatus(result.state, 'node_name', 'completed');
result.state = currentState;
logger.nodeComplete(...);
```

### After (Single reusable function):
```typescript
// ✅ Extracted to executeNode()
async function executeNode(node, state, sessionId, workflowName, stepNumber) {
  logger.nodeStart(...);
  const runningState = updateNodeStatus(state, node.id, 'running');
  const result = await node.execute({ value: runningState, state: runningState });
  const completedState = updateNodeStatus(result.state, node.id, 'completed');
  logger.nodeComplete(...);
  return { value: result.value, state: completedState };
}
```

---

## 🌐 Workflow Definition Structure

```mermaid
graph LR
    subgraph "Workflow Definition (Data)"
        A[Nodes Map]
        B[Edges Array]
        C[Start Node]
        D[End Nodes]
        E[Guards]
    end
    
    subgraph "Runtime Execution"
        F[Current State]
        G[Current Node ID]
        H[Step Counter]
    end
    
    A --> I[Workflow Engine]
    B --> I
    C --> I
    D --> I
    E --> I
    
    I --> F
    I --> G
    I --> H
    
    I --> J[Executed Workflow]
    
    style A fill:#4dabf7
    style B fill:#4dabf7
    style C fill:#4dabf7
    style D fill:#4dabf7
    style E fill:#4dabf7
    style I fill:#51cf66
```

---

## 🔀 Routing Decision Tree

### Old: Imperative Routing
```mermaid
graph TD
    A[State] --> B{if first message?}
    B -->|Yes| C[Intent Extraction]
    B -->|No| D[Intent Continuity]
    C --> E{if irrelevant?}
    D --> E
    E -->|Yes| F[Confirmation]
    E -->|No| G{if needs data?}
    G -->|Yes| H[Data Collection]
    G -->|No| I{if complete?}
    H --> J{if complete?}
    J -->|No| K[Return]
    J -->|Yes| L[Info Completion]
    I --> L
    L --> M[Execution]
    M --> F
    
    style B fill:#ff6b6b
    style E fill:#ff6b6b
    style G fill:#ff6b6b
    style I fill:#ff6b6b
    style J fill:#ff6b6b
```

### New: Guard-based Routing
```mermaid
graph TD
    A[Current Node] --> B[Get Edges]
    B --> C{For each edge}
    C --> D{Has guard?}
    D -->|No| E[Take this edge]
    D -->|Yes| F{Guard passes?}
    F -->|Yes| E
    F -->|No| G[Try next edge]
    G --> C
    C -->|No more edges| H[Workflow complete]
    E --> I[Next node ID]
    
    style B fill:#51cf66
    style D fill:#51cf66
    style F fill:#51cf66
    style E fill:#51cf66
```

---

## 📊 State Flow Comparison

### Before: Multiple State Variables
```mermaid
graph LR
    A[Initial State] --> B[processedState]
    A --> C[currentState]
    A --> D[collected]
    
    B --> E{Update 1}
    C --> F{Update 2}
    D --> G{Update 3}
    
    E --> H[Which is truth?]
    F --> H
    G --> H
    
    H --> I[Synchronization<br/>BUGS]
    
    style I fill:#ff6b6b
```

### After: Single State Flow
```mermaid
graph LR
    A[Initial State] --> B[State]
    
    B --> C[Node 1]
    C --> D[Updated State]
    
    D --> E[Node 2]
    E --> F[Updated State]
    
    F --> G[Node 3]
    G --> H[Final State]
    
    style B fill:#51cf66
    style D fill:#51cf66
    style F fill:#51cf66
    style H fill:#51cf66
```

---

## 🧪 Testing Architecture

```mermaid
graph TB
    subgraph "Testing Infrastructure"
        A[Router Selector]
        B[Old Router]
        C[Refactored Router]
        D[Comparison Utility]
    end
    
    A --> E{Mode?}
    E -->|Old| B
    E -->|New| C
    E -->|Comparison| F[Run Both]
    
    F --> B
    F --> C
    
    B --> G[Result 1]
    C --> H[Result 2]
    
    G --> D
    H --> D
    
    D --> I[Compare States]
    I --> J[Log Differences]
    J --> K{Equivalent?}
    
    K -->|Yes| L[✅ Safe to deploy]
    K -->|No| M[⚠️ Investigate]
    
    style L fill:#51cf66
    style M fill:#ffd43b
```

---

## 🚀 Deployment Strategy

```mermaid
graph TD
    A[Refactoring Complete] --> B[Week 1: Comparison Mode]
    B --> C[Monitor Logs]
    C --> D{Issues Found?}
    D -->|Yes| E[Fix & Retry]
    D -->|No| F[Week 2: Controlled Rollout]
    E --> B
    
    F --> G[Enable New Router<br/>+ Fallback]
    G --> H[Monitor Metrics]
    H --> I{Issues?}
    I -->|Yes| J[Auto Fallback]
    I -->|No| K[Week 3: Full Adoption]
    J --> E
    
    K --> L[Disable Fallback]
    L --> M[Week 4+: Stable]
    M --> N[Remove Old Router]
    N --> O[🎉 Complete]
    
    style O fill:#51cf66
```

---

## 📈 Complexity Reduction

### Before: Cyclomatic Complexity = 15
```mermaid
graph LR
    A[Start] --> B{Condition 1}
    B --> C{Condition 2}
    C --> D{Condition 3}
    D --> E{Condition 4}
    E --> F{Condition 5}
    F --> G{Condition 6}
    G --> H{Condition 7}
    H --> I{Condition 8}
    I --> J{Condition 9}
    J --> K{Condition 10}
    K --> L{Condition 11}
    L --> M{Condition 12}
    M --> N[End]
    
    style A fill:#ff6b6b
```

### After: Cyclomatic Complexity = ~6
```mermaid
graph LR
    A[Start] --> B[Get Node]
    B --> C[Execute]
    C --> D[Validate]
    D --> E{Has Next?}
    E -->|Yes| B
    E -->|No| F[End]
    
    style A fill:#51cf66
    style F fill:#51cf66
```

---

## 🏗️ Layer Architecture

```mermaid
graph TB
    subgraph "Application Layer"
        A[API Routes]
        B[Voice Command Chat]
    end
    
    subgraph "Orchestration Layer"
        C[Router Selector]
        D[Refactored Router]
    end
    
    subgraph "Execution Layer"
        E[Workflow Engine]
        F[Node Executor]
        G[State Validator]
        H[Guard Evaluator]
    end
    
    subgraph "Business Logic Layer"
        I[Intent Extraction]
        J[Data Collection]
        K[Execution]
        L[Confirmation]
    end
    
    subgraph "Data Layer"
        M[Workflow Definitions]
        N[Condition Functions]
        O[State Types]
    end
    
    A --> C
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H
    F --> I
    F --> J
    F --> K
    F --> L
    E --> M
    E --> N
    E --> O
    
    style E fill:#51cf66
    style F fill:#51cf66
```

---

## 🎯 Summary

The refactored architecture achieves:

1. **Separation of Concerns** ✅
   - Workflow definition (data)
   - Workflow engine (execution)
   - Business logic (nodes)

2. **Testability** ✅
   - Isolated components
   - Comparison utilities
   - Feature flags

3. **Maintainability** ✅
   - Reduced complexity
   - No duplication
   - Clear structure

4. **Extensibility** ✅
   - Easy to add nodes
   - Easy to modify flow
   - Reusable engine

5. **Reliability** ✅
   - Error boundaries
   - State validation
   - Graceful degradation

