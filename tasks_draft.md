# Lint Error Fixing Tasks

**Project**: AWS Cloud Supporter  
**Total Target**: 572 problems (552 errors, 20 warnings)  
**Strategy**: 21 incremental, verifiable tasks

---

## Task Dependencies Overview

```
T001 → T002 → T003 → T004 → T005, T006, T007, T008 → T009, T010, T011 → T012, T013, T014, T015, T016, T017 → T018, T019, T020, T021
```

---

## Phase 1: Quick Wins & Auto-fixes

### T001: Auto-fix ESLint Errors
**Purpose**: Apply automatic fixes for syntax and formatting issues  
**Prerequisites**: Clean working directory  
**Dependencies**: None  

**Description**:
Execute ESLint auto-fix across the codebase to resolve simple formatting and syntax issues.

**Tasks**:
1. Run `npx eslint src tests --fix`
2. Review changed files for any breaking changes
3. Commit changes

**Success Criteria**:
- ESLint auto-fix completes without errors
- No test failures introduced
- Import/order violations reduced by 80%+

**Verification**:
```bash
npm run lint | grep "import/order" | wc -l  # Should be <5
npm test -- --bail  # All tests pass
```

**Estimated Time**: 30 minutes  
**Risk Level**: Low  
**Notes**: Safe operation, auto-fixes are conservative

---

### T002: Manual Import Order Fixes
**Purpose**: Fix remaining import ordering violations not handled by auto-fix  
**Prerequisites**: T001 completed  
**Dependencies**: T001  

**Description**:
Manually fix remaining import order violations in specific files.

**Target Files**:
- `src/cli/interfaces/handler.interface.ts` (lines 4-5)
- Any remaining files with import/order violations from T001 verification

**Tasks**:
1. Identify remaining import/order violations
2. Fix each violation by reordering imports according to ESLint rules
3. Verify fixes

**Success Criteria**:
- Zero import/order violations
- No compilation errors
- No test failures

**Verification**:
```bash
npm run lint | grep "import/order"  # Should return empty
npm run build  # Should succeed
```

**Estimated Time**: 1 hour  
**Risk Level**: Low  

---

## Phase 2: Type Foundation

### T003: DynamoDB Metrics Return Types
**Purpose**: Add explicit return types to DynamoDB metrics configuration functions  
**Prerequisites**: T002 completed  
**Dependencies**: T002  

**Description**:
Add explicit return types to functions missing them in DynamoDB metrics configuration.

**Target File**: `src/config/metrics/dynamodb.metrics.ts`  
**Target Lines**: 113, 133, 153, 173  

**Tasks**:
1. Open `src/config/metrics/dynamodb.metrics.ts`
2. Identify functions at lines 113, 133, 153, 173
3. Add appropriate return types based on function content
4. Verify TypeScript compilation

**Example Fix**:
```typescript
// Before
function getMetricsConfig() {
  return { /* ... */ };
}

// After  
function getMetricsConfig(): MetricsConfig {
  return { /* ... */ };
}
```

**Success Criteria**:
- All 4 functions have explicit return types
- No TypeScript compilation errors
- No explicit-module-boundary-types errors for this file

**Verification**:
```bash
npm run build
npm run lint src/config/metrics/dynamodb.metrics.ts | grep "explicit-module-boundary-types"  # Should be empty
```

**Estimated Time**: 45 minutes  
**Risk Level**: Low  

---

### T004: RDS Metrics Return Types
**Purpose**: Add explicit return types to RDS metrics configuration functions  
**Prerequisites**: T002 completed  
**Dependencies**: T002  

**Description**:
Add explicit return types to functions missing them in RDS metrics configuration.

**Target File**: `src/config/metrics/rds.metrics.ts`  
**Target Lines**: 113, 133, 153, 173  

**Tasks**:
1. Open `src/config/metrics/rds.metrics.ts`
2. Identify functions at lines 113, 133, 153, 173
3. Add appropriate return types based on function content
4. Follow same pattern as T003

**Success Criteria**:
- All 4 functions have explicit return types
- No TypeScript compilation errors
- No explicit-module-boundary-types errors for this file

**Verification**:
```bash
npm run build
npm run lint src/config/metrics/rds.metrics.ts | grep "explicit-module-boundary-types"  # Should be empty
```

**Estimated Time**: 45 minutes  
**Risk Level**: Low  

---

### T005: EC2 Metrics Return Types
**Purpose**: Add explicit return types to EC2 metrics configuration functions  
**Prerequisites**: T002 completed  
**Dependencies**: T002  

**Description**:
Add explicit return types to functions missing them in EC2 metrics configuration.

**Target File**: `src/config/metrics/ec2.metrics.ts`  
**Target Lines**: Functions missing return types (4 expected)  

**Tasks**:
1. Run lint check to identify exact lines
2. Add appropriate return types based on function content
3. Follow same pattern as T003, T004

**Success Criteria**:
- All functions have explicit return types
- No TypeScript compilation errors
- No explicit-module-boundary-types errors for this file

**Verification**:
```bash
npm run build
npm run lint src/config/metrics/ec2.metrics.ts | grep "explicit-module-boundary-types"  # Should be empty
```

**Estimated Time**: 45 minutes  
**Risk Level**: Low  

---

### T006: Remaining Metrics Config Files
**Purpose**: Add return types to any remaining metrics configuration files  
**Prerequisites**: T002 completed  
**Dependencies**: T002  

**Description**:
Identify and fix any remaining metrics configuration files with missing return types.

**Tasks**:
1. Run: `npm run lint | grep "explicit-module-boundary-types" | grep "src/config/metrics"`
2. For each file identified, apply same pattern as T003-T005
3. Add explicit return types to functions

**Success Criteria**:
- Zero explicit-module-boundary-types errors in src/config/metrics/
- No TypeScript compilation errors

**Verification**:
```bash
npm run lint | grep "explicit-module-boundary-types" | grep "src/config/metrics"  # Should be empty
```

**Estimated Time**: 1 hour  
**Risk Level**: Low  

---

### T007: Template Expression Type Safety
**Purpose**: Fix template literal expressions with unsafe types  
**Prerequisites**: T002 completed  
**Dependencies**: T002  

**Description**:
Fix template literal expressions that use potentially undefined values.

**Target File**: `src/core/analyzer.ts`  
**Target Lines**: 214, 215  

**Tasks**:
1. Examine lines 214, 215 in `src/core/analyzer.ts`
2. Add null checks for `number | undefined` values
3. Use safe templating patterns

**Example Fix**:
```typescript
// Before
`Value: ${someNumber}`

// After
`Value: ${someNumber ?? 'N/A'}`
```

**Success Criteria**:
- Zero restrict-template-expressions warnings for target lines
- No runtime errors in template expressions

**Verification**:
```bash
npm run lint src/core/analyzer.ts | grep "restrict-template-expressions"  # Should be empty
npm run build
```

**Estimated Time**: 30 minutes  
**Risk Level**: Low  

---

## Phase 3: Core Application Type Safety

### T008: Switch Exhaustiveness Fixes
**Purpose**: Make all switch statements exhaustive  
**Prerequisites**: T007 completed  
**Dependencies**: T003, T004, T005, T006, T007  

**Description**:
Add missing cases to switch statements to make them exhaustive.

**Target Files**:
- `src/cli/commands.ts`: Add ErrorType.OUTPUT_ERROR | ErrorType.VALIDATION_ERROR cases
- `src/cli/utils/output-handlers.ts`: Add "yaml" cases (2 instances)

**Tasks**:
1. Open `src/cli/commands.ts`, locate switch statement
2. Add cases for ErrorType.OUTPUT_ERROR and ErrorType.VALIDATION_ERROR
3. Open `src/cli/utils/output-handlers.ts`, locate 2 switch statements
4. Add "yaml" cases to both switches

**Success Criteria**:
- Zero switch-exhaustiveness-check errors
- All switch statements handle all enum values
- No TypeScript compilation errors

**Verification**:
```bash
npm run lint | grep "switch-exhaustiveness-check"  # Should be empty
npm run build
npm test -- --testPathPattern="integration" --bail
```

**Estimated Time**: 1.5 hours  
**Risk Level**: Medium (affects control flow)  

---

### T009: Nullish Coalescing in CDK Handler
**Purpose**: Replace logical OR with nullish coalescing for safer defaults  
**Prerequisites**: T008 completed  
**Dependencies**: T008  

**Description**:
Replace `||` with `??` where appropriate for safer default value handling.

**Target File**: `src/cli/handlers/cdk-handler.ts`  
**Target Lines**: 67, 105, 252  

**Tasks**:
1. Examine each line and determine if nullish coalescing is appropriate
2. Replace `||` with `??` where it improves type safety
3. Ensure behavior remains equivalent

**Example Fix**:
```typescript
// Before
const value = config.setting || defaultValue;

// After (if config.setting can be 0, false, or '')
const value = config.setting ?? defaultValue;
```

**Success Criteria**:
- Zero prefer-nullish-coalescing errors for target file
- No behavior changes in functionality
- No test failures

**Verification**:
```bash
npm run lint src/cli/handlers/cdk-handler.ts | grep "prefer-nullish-coalescing"  # Should be empty
npm test -- --testPathPattern="cdk" --bail
```

**Estimated Time**: 1 hour  
**Risk Level**: Medium (logic change)  

---

### T010: Nullish Coalescing in Core Analyzer
**Purpose**: Replace logical OR with nullish coalescing in core analyzer  
**Prerequisites**: T008 completed  
**Dependencies**: T008  

**Description**:
Replace `||` with `??` where appropriate in core analyzer file.

**Target File**: `src/core/analyzer.ts`  
**Target Lines**: 194, 296, 329, 391  

**Tasks**:
1. Examine each line and determine if nullish coalescing is appropriate
2. Replace `||` with `??` where it improves type safety
3. Ensure behavior remains equivalent

**Success Criteria**:
- Zero prefer-nullish-coalescing errors for target file
- No behavior changes in functionality
- No test failures

**Verification**:
```bash
npm run lint src/core/analyzer.ts | grep "prefer-nullish-coalescing"  # Should be empty
npm test -- --testPathPattern="analyzer" --bail
```

**Estimated Time**: 1 hour  
**Risk Level**: Medium (logic change)  

---

### T011: Use-Before-Define Fixes
**Purpose**: Move function definitions before their usage  
**Prerequisites**: T008 completed  
**Dependencies**: T008  

**Description**:
Reorganize function definitions to eliminate use-before-define errors.

**Target Files**:
- `src/cli/commands.ts` (5 functions at lines 32, 51, 61, 64, 67)
- `src/cli/builders/command-builder.ts` (1 function at line 16)
- `src/cli/handlers/cdk-handler.ts` (1 function at line 37)

**Tasks**:
1. For each file, identify functions used before definition
2. Move function definitions above their first usage
3. Maintain logical code organization

**Success Criteria**:
- Zero no-use-before-define errors in src/ directory
- No TypeScript compilation errors
- No test failures

**Verification**:
```bash
npm run lint src/ | grep "no-use-before-define"  # Should be empty
npm run build
npm test -- --testPathPattern="integration" --bail
```

**Estimated Time**: 2 hours  
**Risk Level**: Low (code reorganization)  

---

## Phase 4: Test Files - Tier 1 (Critical)

### T012: Extractor Test Type Safety
**Purpose**: Fix unsafe operations in extractor test file  
**Prerequisites**: T011 completed  
**Dependencies**: T008, T009, T010, T011  

**Description**:
Replace `any` types and unsafe operations with proper test types in extractor tests.

**Target File**: `tests/unit/core/extractor.test.ts`  
**Target Errors**: ~50 unsafe operation errors  

**Tasks**:
1. Identify all `any` type usages
2. Replace with proper mock types
3. Fix unsafe assignments, calls, and member access
4. Use jest.Mocked<T> for type-safe mocking

**Example Pattern**:
```typescript
// Before
const mockConfig: any = { someMethod: jest.fn() };

// After
const mockConfig: jest.Mocked<ConfigType> = {
  someMethod: jest.fn(),
  // ... other required properties
};
```

**Success Criteria**:
- Zero no-unsafe-* errors for target file
- All tests pass
- No explicit any types in test file

**Verification**:
```bash
npm test -- --testPathPattern="extractor" --bail
npm run lint tests/unit/core/extractor.test.ts | grep "no-unsafe"  # Should be empty
```

**Estimated Time**: 4 hours  
**Risk Level**: High (test behavior changes)  

---

### T013: Metrics Definitions Test Type Safety
**Purpose**: Fix unsafe operations in metrics definitions test file  
**Prerequisites**: T011 completed  
**Dependencies**: T008, T009, T010, T011  

**Description**:
Replace `any` types and unsafe operations with proper test types in metrics definitions tests.

**Target File**: `tests/unit/config/metrics-definitions.test.ts`  
**Target Errors**: ~40 unsafe operation errors  

**Tasks**:
1. Apply same patterns as T012
2. Replace `any` with proper mock types
3. Fix unsafe operations
4. Ensure tests maintain their behavior

**Success Criteria**:
- Zero no-unsafe-* errors for target file
- All tests pass
- No explicit any types in test file

**Verification**:
```bash
npm test -- --testPathPattern="metrics-definitions" --bail
npm run lint tests/unit/config/metrics-definitions.test.ts | grep "no-unsafe"  # Should be empty
```

**Estimated Time**: 3 hours  
**Risk Level**: High (test behavior changes)  

---

## Phase 5: Test Files - Tier 2 (Medium Impact)

### T014: Base Generator Test Fixes
**Purpose**: Fix mixed type safety issues in base generator tests  
**Prerequisites**: T013 completed  
**Dependencies**: T012, T013  

**Description**:
Fix type safety issues including non-null assertions and explicit any usage.

**Target File**: `tests/unit/generators/base.generator.test.ts`  
**Target Errors**: ~25 mixed type errors  

**Tasks**:
1. Replace non-null assertions (!) with proper null checks
2. Replace explicit any types with proper types
3. Fix variable shadowing issues

**Example Pattern**:
```typescript
// Before
const result = someValue!.property;

// After
const result = someValue?.property ?? defaultValue;
```

**Success Criteria**:
- Zero no-non-null-assertion errors
- Zero no-explicit-any errors
- All tests pass

**Verification**:
```bash
npm test -- --testPathPattern="base.generator" --bail
npm run lint tests/unit/generators/base.generator.test.ts | grep "no-non-null-assertion\|no-explicit-any"  # Should be empty
```

**Estimated Time**: 3 hours  
**Risk Level**: Medium  

---

### T015: Parser Test Type Safety
**Purpose**: Fix unsafe enum comparisons and variable shadowing in parser tests  
**Prerequisites**: T013 completed  
**Dependencies**: T012, T013  

**Description**:
Fix enum comparison safety and variable shadowing issues.

**Target File**: `tests/unit/core/parser.test.ts`  
**Target Errors**: ~20 errors (enum comparisons, shadowing, unsafe operations)  

**Tasks**:
1. Fix unsafe enum comparisons (line 243)
2. Resolve variable shadowing (line 390)
3. Fix remaining unsafe operations

**Success Criteria**:
- Zero no-unsafe-enum-comparison errors
- Zero no-shadow errors
- All tests pass

**Verification**:
```bash
npm test -- --testPathPattern="parser" --bail
npm run lint tests/unit/core/parser.test.ts | grep "no-unsafe-enum-comparison\|no-shadow"  # Should be empty
```

**Estimated Time**: 2 hours  
**Risk Level**: Medium  

---

### T016: Remaining Medium-Impact Test Files
**Purpose**: Fix type safety issues in other medium-impact test files  
**Prerequisites**: T013 completed  
**Dependencies**: T012, T013  

**Description**:
Apply consistent patterns to remaining test files with moderate error counts.

**Tasks**:
1. Identify remaining test files with 10-20 errors each
2. Apply patterns established in T012-T015
3. Focus on unsafe operations and type safety

**Success Criteria**:
- Significant reduction in test file errors
- All tests pass
- Consistent type safety patterns

**Verification**:
```bash
npm test
npm run lint tests/ | grep "no-unsafe" | wc -l  # Should be <50
```

**Estimated Time**: 2 hours  
**Risk Level**: Medium  

---

## Phase 6: Test Files - Tier 3 (Remaining)

### T017: Remaining Test File Cleanup
**Purpose**: Fix remaining scattered errors in small test files  
**Prerequisites**: T016 completed  
**Dependencies**: T014, T015, T016  

**Description**:
Clean up remaining unsafe operations and type issues in smaller test files.

**Tasks**:
1. Group similar errors across files
2. Apply consistent patterns from previous tasks
3. Focus on remaining no-unsafe-* rules

**Success Criteria**:
- All unsafe operation errors in tests eliminated
- All tests pass
- Consistent type safety across test suite

**Verification**:
```bash
npm test
npm run lint tests/ | grep "no-unsafe"  # Should be empty
```

**Estimated Time**: 3 hours  
**Risk Level**: Medium  

---

## Phase 7: Code Organization & Quality

### T018: Function Size Violations
**Purpose**: Break down oversized functions  
**Prerequisites**: T017 completed  
**Dependencies**: T017  

**Description**:
Extract smaller, focused functions from oversized functions.

**Target Files**:
- `src/core/formatters/html/assets/scripts.ts` (226 lines, line 8)
- `tests/unit/generators/base-optimization.test.ts` (484 lines, line 52)
- `tests/unit/utils/schema-validator.test.ts` (376 lines, line 4)

**Tasks**:
1. Identify logical breakpoints in large functions
2. Extract smaller, focused functions
3. Maintain functionality and readability

**Success Criteria**:
- Zero max-lines-per-function errors
- All functions under 300 lines (150 preferred)
- No functionality changes

**Verification**:
```bash
npm run lint | grep "max-lines-per-function"  # Should be empty
npm test
```

**Estimated Time**: 3 hours  
**Risk Level**: Medium (refactoring risk)  

---

### T019: File Size Violations
**Purpose**: Split oversized files  
**Prerequisites**: T017 completed  
**Dependencies**: T017  

**Description**:
Split large test files into multiple files or extract utilities.

**Target Files**:
- `tests/unit/generators/base.generator.test.ts` (950 lines)
- `tests/unit/generators/base-optimization.test.ts` (535 lines)

**Tasks**:
1. Group related tests
2. Split into multiple test files
3. Extract common utilities

**Success Criteria**:
- Zero max-lines errors
- All files under 500 lines
- All tests still discoverable and runnable

**Verification**:
```bash
npm run lint | grep "max-lines"  # Should be empty
npm test
```

**Estimated Time**: 2 hours  
**Risk Level**: Medium (test organization)  

---

### T020: Miscellaneous Fixes
**Purpose**: Fix remaining miscellaneous lint errors  
**Prerequisites**: T017 completed  
**Dependencies**: T017  

**Description**:
Clean up remaining scattered issues.

**Tasks**:
1. Fix unused variables (prefix with _)
2. Resolve remaining shadowing issues
3. Fix promise misuse issues

**Success Criteria**:
- Zero no-unused-vars errors
- Zero remaining shadowing errors
- Zero promise misuse errors

**Verification**:
```bash
npm run lint | grep "no-unused-vars\|no-shadow\|no-misused-promises"  # Should be empty
```

**Estimated Time**: 1 hour  
**Risk Level**: Low  

---

### T021: Final Verification
**Purpose**: Ensure complete error elimination and system health  
**Prerequisites**: T020 completed  
**Dependencies**: T018, T019, T020  

**Description**:
Comprehensive verification of the entire codebase.

**Tasks**:
1. Run complete lint check
2. Run full test suite
3. Verify build success
4. Document any remaining issues

**Success Criteria**:
- 0 ESLint errors
- 0 TypeScript compilation errors
- All tests passing
- Clean build output

**Verification**:
```bash
npm run lint  # Should show 0 problems
npm run build  # Should succeed
npm test  # All tests pass
```

**Estimated Time**: 30 minutes  
**Risk Level**: Low  

---

## Summary

**Total Tasks**: 21  
**Total Estimated Time**: 35-45 hours  
**Parallel Opportunities**: T003-T006, T012-T016, T018-T020  
**Critical Path**: T001 → T002 → T003-T007 → T008 → T009-T011 → T012-T017 → T018-T021