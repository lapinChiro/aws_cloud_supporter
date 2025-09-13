# Lint Error Fixing Plan

**Total Target**: 572 problems (552 errors, 20 warnings)  
**Strategy**: Incremental, verifiable approach with parallel work opportunities

## Plan Overview

### Execution Principles
1. **Incremental Progress**: Each phase reduces errors by 50-100
2. **Continuous Verification**: `npm run lint` after each phase
3. **Risk Management**: Critical files first, test files with validation
4. **Parallel Opportunities**: Independent files can be fixed simultaneously

---

## Phase 1: Quick Wins & Auto-fixes
**Target**: 50-80 errors  
**Duration**: 1-2 hours

### Tasks
1. **Auto-fix application**
   ```bash
   npx eslint src tests --fix
   ```
   - Fix import/order violations
   - Simple syntax corrections
   - Consistent formatting

2. **Manual import order fixes**
   - `src/cli/interfaces/handler.interface.ts` (2 errors)
   - Other import group violations

### Verification
```bash
npm run lint | grep "import/order\|consistent-type-assertions"
```

### Expected Reduction: ~60 errors

---

## Phase 2: Type Foundation 
**Target**: 40-60 errors  
**Duration**: 2-3 hours

### Tasks
1. **Metrics config return types** (Pattern-based fix)
   - `src/config/metrics/dynamodb.metrics.ts` (4 functions)
   - `src/config/metrics/rds.metrics.ts` (4 functions) 
   - `src/config/metrics/ec2.metrics.ts` (4 functions)
   - Other metrics config files
   
   **Method**: Add explicit return types to functions at lines 113, 133, 153, 173

2. **Template expression types**
   - `src/core/analyzer.ts` lines 214, 215
   - Add null checks for `number | undefined`

### Verification
```bash
npm run lint | grep "explicit-module-boundary-types\|restrict-template-expressions"
npm run build
```

### Expected Reduction: ~50 errors

---

## Phase 3: Core Application Type Safety
**Target**: 60-80 errors  
**Duration**: 3-4 hours

### Tasks
1. **Switch exhaustiveness** (High Impact)
   - `src/cli/commands.ts`: Add ErrorType.OUTPUT_ERROR | ErrorType.VALIDATION_ERROR cases
   - `src/cli/utils/output-handlers.ts`: Add "yaml" cases (2 instances)

2. **Nullish coalescing** (Pattern replacement)
   - `src/cli/handlers/cdk-handler.ts` (3 locations)
   - `src/core/analyzer.ts` (4 locations)
   - Replace `||` with `??` where appropriate

3. **Use-before-define** (src directory only)
   - `src/cli/commands.ts` (5 functions)
   - `src/cli/builders/command-builder.ts` (1 function)
   - `src/cli/handlers/cdk-handler.ts` (1 function)

### Verification
```bash
npm run lint | grep "switch-exhaustiveness\|prefer-nullish-coalescing\|no-use-before-define"
npm run build
npm test -- --testPathPattern="integration" --bail
```

### Expected Reduction: ~70 errors

---

## Phase 4: Test Files - Tier 1 (Critical)
**Target**: 80-100 errors  
**Duration**: 4-6 hours

### Priority Files
1. **tests/unit/core/extractor.test.ts** (~50 errors)
   - Focus on unsafe operations pattern
   - Replace `any` with proper test types
   - Fix unsafe assignments, calls, member access

2. **tests/unit/config/metrics-definitions.test.ts** (~40 errors)
   - Similar unsafe operations pattern
   - Mock proper types instead of `any`

### Approach for Unsafe Operations
```typescript
// Before (unsafe)
const mockConfig: any = { /* ... */ };
mockConfig.someMethod();

// After (safe)
const mockConfig = {
  someMethod: jest.fn(),
  // ... properly typed mock
} as jest.Mocked<ConfigType>;
```

### Verification
```bash
npm test -- --testPathPattern="extractor|metrics-definitions" --bail
npm run lint | grep "no-unsafe"
```

### Expected Reduction: ~90 errors

---

## Phase 5: Test Files - Tier 2 (Medium Impact)
**Target**: 60-80 errors  
**Duration**: 3-4 hours

### Priority Files
1. **tests/unit/generators/base.generator.test.ts** (~25 errors)
   - Mixed type safety issues
   - Non-null assertions to proper null checks
   - Explicit any replacement

2. **tests/unit/core/parser.test.ts** (~20 errors)
   - Unsafe enum comparisons
   - Variable shadowing fixes
   - Unsafe operations

3. **Other medium-impact test files**

### Specific Fixes
- **Non-null assertions**: Replace `!` with proper null checks
- **Enum comparisons**: Ensure type safety in enum comparisons
- **Variable shadowing**: Rename conflicting variables

### Verification
```bash
npm test -- --testPathPattern="base.generator|parser" --bail
npm run lint | grep "no-non-null-assertion\|no-unsafe-enum-comparison\|no-shadow"
```

### Expected Reduction: ~70 errors

---

## Phase 6: Test Files - Tier 3 (Remaining)
**Target**: 50-80 errors  
**Duration**: 2-4 hours

### Tasks
1. **Small test files with scattered errors**
2. **Pattern-based fixes for remaining unsafe operations**
3. **Cleanup of remaining test-specific issues**

### Approach
- Group similar errors across files
- Apply consistent patterns established in Phases 4-5
- Focus on remaining `@typescript-eslint/no-unsafe-*` rules

### Verification
```bash
npm test
npm run lint | grep "no-unsafe"
```

### Expected Reduction: ~60 errors

---

## Phase 7: Code Organization & Quality
**Target**: 30-50 errors  
**Duration**: 3-5 hours

### Tasks
1. **Function size violations** (max-lines-per-function)
   - `src/core/formatters/html/assets/scripts.ts` (226 lines)
   - `tests/unit/generators/base-optimization.test.ts` (484 lines)
   - `tests/unit/utils/schema-validator.test.ts` (376 lines)
   
   **Strategy**: Extract smaller, focused functions

2. **File size violations** (max-lines)
   - `tests/unit/generators/base.generator.test.ts` (950 lines)
   - `tests/unit/generators/base-optimization.test.ts` (535 lines)
   
   **Strategy**: Split into multiple test files or extract utilities

3. **Miscellaneous fixes**
   - Unused variables (prefix with `_`)
   - Remaining shadowing issues
   - Promise misuse fixes

### Verification
```bash
npm run lint
npm test
npm run build
```

### Expected Reduction: ~40 errors

---

## Final Verification & Cleanup

### Complete Test Suite
```bash
npm test
npm run build
npm run lint
```

### Success Criteria
- ✅ 0 ESLint errors
- ✅ 0 TypeScript compilation errors  
- ✅ All tests passing
- ✅ Clean build output

---

## Parallel Work Opportunities

### Independent Files (Can work simultaneously)
- Phase 2: Different metrics config files
- Phase 4-6: Different test files
- Phase 7: Different oversized files

### Sequential Dependencies
- Phase 1 → Phase 2 (import fixes before type fixes)
- Phase 2 → Phase 3 (type foundation before core logic)
- Phases 4-6 → Phase 7 (functional fixes before organizational)

---

## Risk Mitigation

### After Each Phase
1. **Lint check**: Ensure error count decreases
2. **Build check**: Ensure no compilation issues
3. **Test check**: Ensure no functionality breaks

### Rollback Strategy
- Git commit after each successful phase
- If phase fails, analyze impact and adjust approach
- Use `git checkout -- .` if needed for clean restart

### Critical Success Factors
1. **Type safety first**: Establish solid type foundation early
2. **Test validation**: Ensure tests still pass after modifications
3. **Incremental progress**: Never let error count increase between phases