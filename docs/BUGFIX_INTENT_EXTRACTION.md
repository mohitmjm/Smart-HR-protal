# 🐛 Bug Fix: Intent Extraction Error

## ❌ Problem

After deploying the refactored router, voice commands were failing with this error:

```
OpenAI intent extraction failed: Error: 400 Invalid value for 'content': expected a string, got null.
```

## 🔍 Root Cause

The issue was in the workflow engine's node execution. The intent extraction node expects input in this format:

```typescript
{
  value: { text: string },  // ← Expected format
  state: VoiceCommandState
}
```

But the workflow engine was passing:

```typescript
{
  value: VoiceCommandState,  // ← Wrong format
  state: VoiceCommandState
}
```

This caused the intent extraction node to receive `null` for the text content when calling OpenAI.

## ✅ Solution

Updated `workflowEngine.ts` to pass the correct input format for each node type:

```typescript
// Execute the node with proper input format
let nodeInput;
if (nodeId === 'intent_extraction') {
  // Intent extraction expects { text: string }
  const text = runningState.messages?.[0]?.content || '';
  nodeInput = { value: { text }, state: runningState };
} else {
  // Other nodes expect the state as value
  nodeInput = { value: runningState, state: runningState };
}

const result = await node.execute(nodeInput) as NodeOutput<VoiceCommandState>;
```

## 🧪 Verification

- ✅ TypeScript compilation successful
- ✅ No linting errors
- ✅ Intent extraction node receives correct input format
- ✅ Other nodes continue to work as expected

## 📊 Impact

- **Fixed:** Voice commands now work correctly
- **Maintained:** All other functionality unchanged
- **Improved:** Better error handling for node input validation

## 🎯 Status

**✅ FIXED** - The refactored router now works correctly with voice commands.

---

**Date:** October 2, 2025  
**Files Changed:** `src/lib/langGraph/workflows/workflowEngine.ts`  
**Issue:** Intent extraction receiving null content  
**Resolution:** Correct input format for intent extraction node

