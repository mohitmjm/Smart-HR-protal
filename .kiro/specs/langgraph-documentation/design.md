# LangGraph Agent Documentation Design

## Overview

The LangGraph agent documentation will be a comprehensive technical guide that explains the voice command processing system in the Tielo HR application. The documentation will be structured as a single, detailed markdown file that covers the complete architecture, node system, workflow engine, and action execution layer.

Based on the code analysis, the LangGraph system is a sophisticated declarative workflow engine that processes voice commands through a series of interconnected nodes, each with specific responsibilities and activation conditions.

## Architecture

### Document Structure

The documentation will be organized into the following main sections:

1. **System Overview** - High-level architecture and core concepts
2. **Workflow Engine** - Declarative workflow execution system
3. **Node System** - Detailed breakdown of all processing nodes
4. **Intent Configuration** - Available intents and parameter requirements
5. **Action Execution** - Action executors and their implementations
6. **State Management** - VoiceCommandState structure and evolution
7. **Routing Conditions** - Condition functions and decision logic
8. **Data Flow Diagrams** - Visual representation of processing flows
9. **Integration Points** - How the system integrates with other components
10. **Extension Guide** - How to add new functionality

### Documentation Format

- **Primary Format**: Single comprehensive markdown file
- **Location**: `docs/langgraph-agent-documentation.md`
- **Diagrams**: Mermaid diagrams embedded in markdown
- **Code Examples**: TypeScript code snippets with explanations
- **Cross-references**: Internal links between sections

## Components and Interfaces

### Core Components to Document

#### 1. Workflow Engine (`workflowEngine.ts`)
- **Purpose**: Executes declarative workflow definitions
- **Key Functions**: `executeWorkflow()`, `executeNode()`, `findNextNode()`
- **Interfaces**: `WorkflowDefinition`, `WorkflowEdge`, `NodeExecutionResult`

#### 2. Core Router (`coreRouter.ts`)
- **Purpose**: Main entry point that builds and executes workflows
- **Key Functions**: `runCorePipeline()`, `buildCoreWorkflow()`
- **Routing Logic**: Different flows for first messages vs. follow-up messages

#### 3. Processing Nodes
- **Intent Extraction Node**: Derives intent and entities from user input
- **Intent Continuity Node**: Checks if messages are new intents or continuations
- **Data Collection Node**: Collects missing parameters with intelligent replies
- **Information Completion Node**: Normalizes subjective information (dates, times)
- **Execution Node**: Executes commands using registered action executors
- **Confirmation Node**: Generates final responses and concludes processing

#### 4. Configuration System
- **Available Intents**: Central registry of supported voice commands
- **Parameter Requirements**: Validation rules and metadata for each intent
- **Action Registry**: Maps intents to their execution functions

#### 5. Condition Functions
- **Data Collection Conditions**: `isDataCollectionComplete()`, `requiresDataCollection()`
- **Execution Conditions**: `isExecutionReady()`, `hasExecutionResult()`
- **Message Conditions**: `isMessageIrrelevant()`, `isNewIntent()`

### State Management Design

#### VoiceCommandState Structure
```typescript
interface VoiceCommandState {
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
  
  // Node Execution Tracking
  nodeStatus: NodeStatus;
  nodeProgress: NodeExecutionRecord[];
  
  // Results
  executionResult?: any;
  error?: string;
}
```

## Data Models

### Intent Categories
- **Query**: Read-only operations (view_attendance_history, get_leave_balance)
- **Mutation**: Create new records (apply_leave)
- **Action**: Modify existing records (approve_leave)
- **Tracking**: Time-based state changes (clock_in, clock_out)

### Parameter Types
- **String**: Text-based parameters with optional validation
- **Date**: Date parameters that support subjective input (tomorrow, next Monday)
- **Enum**: Predefined list of valid values
- **Number**: Numeric parameters with range validation
- **Boolean**: True/false parameters

### Workflow Edges
```typescript
interface WorkflowEdge {
  from: string;        // Source node ID
  to: string;          // Destination node ID
  guard?: ConditionFunction;  // Optional condition
  label?: string;      // Description for debugging
}
```

## Error Handling

### Node-Level Error Handling
- Each node implements try-catch blocks with specific error logging
- Errors are propagated through the state object
- Failed nodes can return partial results for graceful degradation

### Workflow-Level Error Handling
- Workflow engine catches and logs execution errors
- Safety mechanisms prevent infinite loops (20-step maximum)
- Error states are returned with diagnostic information

### Action Executor Error Handling
- Standardized error codes and messages
- Location permission errors handled specifically
- Database and service integration errors are caught and logged

## Testing Strategy

### Documentation Testing Approach
1. **Code Accuracy Verification**: Ensure all documented interfaces match actual code
2. **Example Validation**: Test all code examples and snippets
3. **Link Verification**: Validate all internal cross-references
4. **Diagram Accuracy**: Verify Mermaid diagrams render correctly and represent actual flows

### Documentation Maintenance
- Regular reviews when code changes
- Version tracking aligned with system updates
- Automated checks for broken references

## Visual Representations

### Workflow Diagrams
- **High-Level Flow**: Overall system architecture
- **Node Execution Flow**: Detailed node-by-node processing
- **Condition Decision Trees**: How routing decisions are made
- **State Evolution**: How VoiceCommandState changes through processing

### Integration Diagrams
- **API Integration**: How the system connects to REST endpoints
- **Database Integration**: Direct database operations in action executors
- **Service Integration**: Connections to email, notification, and other services

## Documentation Sections Detail

### 1. System Overview
- Architecture principles (declarative workflows, node-based processing)
- Key concepts (intents, parameters, actions, state)
- Processing pipeline overview

### 2. Node System Deep Dive
- Each node's purpose and responsibilities
- Input/output specifications
- Activation conditions and routing logic
- Error handling and edge cases

### 3. Intent and Parameter System
- Complete intent catalog with examples
- Parameter validation rules and constraints
- Category-based organization
- Extension patterns for new intents

### 4. Action Execution Layer
- Action executor registry and mapping
- Implementation patterns and best practices
- Integration with external systems
- Error handling and recovery strategies

### 5. Workflow Engine Mechanics
- Declarative workflow definition format
- Edge-based routing system
- Condition evaluation and decision making
- Execution lifecycle and state management

This design provides a comprehensive framework for documenting the LangGraph agent system, ensuring developers can understand, maintain, and extend the voice command processing capabilities effectively.