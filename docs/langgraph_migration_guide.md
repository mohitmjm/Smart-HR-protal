# LangGraph Migration Guide

## 🚀 Quick Start: How to Use the Refactored Router

### Option 1: Environment Variable (Recommended for Testing)

Add to your `.env` file:
```bash
# Enable refactored router
USE_REFACTORED_ROUTER=true

# Optional: Enable comparison mode (runs both implementations)
ENABLE_ROUTER_COMPARISON=true

# Optional: Enable fallback to old router on error
ENABLE_ROUTER_FALLBACK=true
```

Then update your imports to use the selector:
```typescript
// In src/lib/langGraph/index.ts
export { runCorePipeline } from "./workflows/routerSelector"; // Uses feature flags
```

### Option 2: Direct Import (For Committed Switch)

```typescript
// In src/lib/langGraph/index.ts
export { runCorePipeline } from "./workflows/coreRouter.refactored";
```

### Option 3: Programmatic Control

```typescript
import { setRouterConfig } from "./lib/langGraph/workflows/routerSelector";

// Enable refactored router
setRouterConfig({
  useRefactoredRouter: true,
  enableComparison: false,
  enableFallback: true
});
```

---

## 🧪 Testing the Refactored Router

### Step 1: Enable Comparison Mode

```bash
# .env
USE_REFACTORED_ROUTER=false  # Use old router as primary
ENABLE_ROUTER_COMPARISON=true # But run both and compare
```

This will:
- Run both implementations in parallel
- Log any differences
- Return results from the old (stable) implementation
- Allow you to verify equivalence without risk

### Step 2: Monitor Logs

Check for warnings like:
```
⚠️ Router results differ
  oldIntent: "clock_in"
  newIntent: "clock_in"
  differences: [...]
```

### Step 3: Gradual Rollout

Once comparison shows equivalence:

1. **Week 1:** Enable for internal testing
   ```bash
   USE_REFACTORED_ROUTER=true
   ENABLE_ROUTER_FALLBACK=true
   ```

2. **Week 2:** Enable for 10% of users (implement user-based flag)

3. **Week 3:** Enable for 50% of users

4. **Week 4:** Enable for 100% of users

5. **Week 5+:** Remove old implementation if stable

---

## 📊 Comparison Testing

### Using the Comparison Utility

```typescript
import { compareRouters, runComparisonTests } from "./lib/langGraph/workflows/routerComparison";
import { createInitialVoiceCommandState } from "./lib/langGraph/types/state";

// Single comparison
const initialState = createInitialVoiceCommandState('session-123', 'user-456');
const result = await compareRouters('clock me in', initialState, true);

console.log('Equivalent:', result.isEquivalent);
console.log('Differences:', result.differences);

// Batch testing
const testCases = [
  {
    name: 'Clock In',
    text: 'clock me in',
    initialState: createInitialVoiceCommandState('s1', 'u1'),
    isFirstMessage: true
  },
  {
    name: 'Apply Leave',
    text: 'I need leave tomorrow',
    initialState: createInitialVoiceCommandState('s2', 'u2'),
    isFirstMessage: true
  }
];

const results = await runComparisonTests(testCases);
console.log(`Passed: ${results.passed}, Failed: ${results.failed}`);
```

---

## 🔄 Rollback Plan

### If Issues Arise

1. **Immediate Rollback** (< 5 minutes)
   ```bash
   # .env
   USE_REFACTORED_ROUTER=false
   ```

2. **Code Rollback** (if env var not available)
   ```typescript
   // In src/lib/langGraph/index.ts
   export { runCorePipeline } from "./workflows/coreRouter"; // Old implementation
   ```

3. **Investigate**
   - Check logs for errors
   - Review comparison results
   - Identify specific test cases that fail

4. **Fix and Retry**
   - Fix issues in refactored router
   - Re-run comparison tests
   - Gradually re-enable

---

## ✅ Verification Checklist

Before going live with refactored router:

### Functional Testing
- [ ] Test all intent types (clock in/out, leave, team, etc.)
- [ ] Test data collection flow (missing parameters)
- [ ] Test information completion (date normalization)
- [ ] Test execution (successful and failed)
- [ ] Test confirmation messages
- [ ] Test irrelevant messages
- [ ] Test error scenarios
- [ ] Test conversation continuity

### Performance Testing
- [ ] Compare response times (old vs new)
- [ ] Check memory usage
- [ ] Monitor OpenAI API calls (should be same)
- [ ] Verify no regressions

### Edge Cases
- [ ] Empty/invalid input
- [ ] Very long conversation history
- [ ] Network errors
- [ ] Timeout scenarios
- [ ] Concurrent requests

### Monitoring
- [ ] Set up error tracking
- [ ] Monitor success rates
- [ ] Track user feedback
- [ ] Watch for anomalies

---

## 🐛 Known Differences

### Expected Differences (Safe)
1. **Node execution order logging** - May differ slightly due to async execution
2. **Timestamp precision** - Microsecond differences in logs
3. **State metadata** - New router adds more detailed metadata

### Concerning Differences (Investigate)
1. **Different intent extracted** - Should never happen
2. **Different parameters collected** - Red flag
3. **Different execution results** - Critical issue
4. **Different confirmation messages** - May indicate logic error

---

## 📈 Success Metrics

Track these metrics to validate the refactoring:

### Quality Metrics
- **Intent accuracy** - Should be identical
- **Parameter collection rate** - Should be identical
- **Execution success rate** - Should be identical or better
- **Error rate** - Should be same or lower

### Performance Metrics
- **Average response time** - Should be similar or faster
- **P95 response time** - Should not regress
- **Memory usage** - Should be similar or lower
- **CPU usage** - Should be similar or lower

### Code Quality Metrics
- **Cyclomatic complexity** - Reduced from 15 to ~6
- **Lines of code** - Reduced by ~37%
- **Code duplication** - Eliminated
- **Maintainability index** - Improved

---

## 🔧 Configuration Reference

### Environment Variables

```bash
# Primary feature flag
USE_REFACTORED_ROUTER=true|false

# Testing and safety
ENABLE_ROUTER_COMPARISON=true|false  # Run both, compare results
ENABLE_ROUTER_FALLBACK=true|false    # Fallback to old on error

# Logging
LOG_ROUTER_SELECTION=true|false      # Log which router is used
LOG_ROUTER_DIFFERENCES=true|false    # Log state differences
```

### Programmatic API

```typescript
import { setRouterConfig, getRouterConfig } from "./lib/langGraph/workflows/routerSelector";

// Set configuration
setRouterConfig({
  useRefactoredRouter: true,
  enableComparison: true,
  enableFallback: true
});

// Get current config
const config = getRouterConfig();
console.log(config);
```

---

## 📚 Additional Resources

- **Analysis Document:** `docs/agent_improve.md`
- **Refactoring Summary:** `docs/langgraph_refactoring_summary.md`
- **Original Router:** `src/lib/langGraph/workflows/coreRouter.ts`
- **Refactored Router:** `src/lib/langGraph/workflows/coreRouter.refactored.ts`
- **Workflow Engine:** `src/lib/langGraph/workflows/workflowEngine.ts`
- **Router Selector:** `src/lib/langGraph/workflows/routerSelector.ts`
- **Comparison Utility:** `src/lib/langGraph/workflows/routerComparison.ts`

---

## 🎯 Next Steps

1. ✅ Review this migration guide
2. ✅ Set up environment variables for testing
3. ⏳ Run comparison tests
4. ⏳ Monitor logs for differences
5. ⏳ Gradually enable for users
6. ⏳ Collect feedback and metrics
7. ⏳ Remove old implementation when confident
8. ⏳ Celebrate improved code quality! 🎉

---

## 💡 Tips

- **Start small** - Enable comparison mode first, don't switch immediately
- **Monitor closely** - Watch logs and metrics during rollout
- **Have rollback ready** - Know how to quickly revert if needed
- **Document issues** - Keep track of any problems for future reference
- **Communicate** - Let team know about the changes and rollout plan

