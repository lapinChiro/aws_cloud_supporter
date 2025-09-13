# Lint Error Report

**Generated**: 2025-09-13  
**Total Problems**: 572 (552 errors, 20 warnings)

## Error Categories Summary

| Category | Count | Description |
|----------|-------|-------------|
| Unsafe Operations | ~200 | Various `@typescript-eslint/no-unsafe-*` rules |
| Type Safety | ~150 | Missing types, explicit any, type assertions |
| Code Organization | ~100 | Use before define, import order |
| Code Quality | ~50 | Switch exhaustiveness, nullish coalescing |
| Function/File Size | ~30 | max-lines-per-function, max-lines |
| Misc | ~42 | Non-null assertions, unused vars, etc. |

## Detailed Error Breakdown

### 1. Unsafe Operations (~200 errors)
Most critical category affecting type safety:

#### @typescript-eslint/no-unsafe-* (Most frequent)
- **no-unsafe-assignment**: Assigning `any` values without type checking
- **no-unsafe-call**: Calling functions on `any` typed values  
- **no-unsafe-member-access**: Accessing properties on `any` values
- **no-unsafe-argument**: Passing `any` as function arguments
- **no-unsafe-return**: Returning `any` from typed functions

**Major affected files:**
- `tests/unit/core/extractor.test.ts` (35+ errors)
- `tests/unit/config/metrics-definitions.test.ts` (30+ errors)
- `tests/unit/core/parser.test.ts` (20+ errors)
- `tests/unit/generators/base.generator.test.ts` (15+ errors)

### 2. Type Safety Issues (~150 errors)

#### @typescript-eslint/no-explicit-any (50+ errors)
Files with explicit `any` usage:
- `tests/unit/generators/base.generator.test.ts`: 4 errors
- `tests/unit/core/extractor.test.ts`: 20+ errors
- Multiple test files with scattered usage

#### @typescript-eslint/explicit-module-boundary-types (20+ errors)
Missing return types on functions:
- `src/config/metrics/dynamodb.metrics.ts`: 4 errors (lines 113, 133, 153, 173)
- `src/config/metrics/rds.metrics.ts`: 4 errors (lines 113, 133, 153, 173)
- `src/config/metrics/ec2.metrics.ts`: 4 errors
- Multiple other metric config files

#### @typescript-eslint/restrict-template-expressions (20 warnings)
Invalid types in template literals:
- `src/core/analyzer.ts`: 2 warnings (lines 214, 215)
- Multiple files with `number | undefined` in templates

### 3. Code Organization (~100 errors)

#### @typescript-eslint/no-use-before-define (50+ errors)
Functions used before definition:
- `src/cli/commands.ts`: 5 errors (lines 32, 51, 61, 64, 67)
- `src/cli/builders/command-builder.ts`: 1 error (line 16)
- `src/cli/handlers/cdk-handler.ts`: 1 error (line 37)
- Multiple test files

#### import/order (10+ errors)
Import ordering issues:
- `src/cli/interfaces/handler.interface.ts`: 2 errors (lines 4, 5)
- Various files with import group violations

### 4. Code Quality (~50 errors)

#### @typescript-eslint/switch-exhaustiveness-check (10+ errors)
Non-exhaustive switch statements:
- `src/cli/commands.ts`: Missing ErrorType.OUTPUT_ERROR | ErrorType.VALIDATION_ERROR
- `src/cli/utils/output-handlers.ts`: Missing "yaml" cases (2 instances)

#### @typescript-eslint/prefer-nullish-coalescing (30+ errors)
Should use `??` instead of `||`:
- `src/cli/handlers/cdk-handler.ts`: 3 errors (lines 67, 105, 252)
- `src/core/analyzer.ts`: 4 errors (lines 194, 296, 329, 391)
- Multiple other files

### 5. Function/File Size (~30 errors)

#### max-lines-per-function (15+ errors)
Functions exceeding 150-300 line limits:
- `src/core/formatters/html/assets/scripts.ts`: 226 lines (line 8)
- `tests/unit/generators/base-optimization.test.ts`: 484 lines (line 52)
- `tests/unit/utils/schema-validator.test.ts`: 376 lines (line 4)

#### max-lines (10+ errors)
Files exceeding 500 line limit:
- `tests/unit/generators/base.generator.test.ts`: 950 lines
- `tests/unit/generators/base-optimization.test.ts`: 535 lines

### 6. Miscellaneous (~42 errors)

#### @typescript-eslint/no-non-null-assertion (20+ errors)
Forbidden `!` operator usage:
- `tests/unit/generators/base.generator.test.ts`: 6 errors (lines 578, 656, 669, 688, 707, 776)
- Multiple test files

#### @typescript-eslint/no-unused-vars (5+ errors)
Unused variables not prefixed with `_`:
- `tests/unit/generators/base-optimization.test.ts`: 'OptimizedTestGenerator' (line 56)

#### @typescript-eslint/no-shadow (5+ errors)
Variable shadowing issues:
- `tests/unit/core/parser.test.ts`: 'CloudSupporterError' redeclared (line 390)

#### @typescript-eslint/no-unsafe-enum-comparison (5+ errors)
Unsafe enum comparisons:
- `tests/unit/core/parser.test.ts`: 2 errors (line 243)

## Files with Highest Error Counts

1. **tests/unit/core/extractor.test.ts**: ~50 errors (mostly unsafe operations)
2. **tests/unit/config/metrics-definitions.test.ts**: ~40 errors (mostly unsafe operations)  
3. **tests/unit/generators/base.generator.test.ts**: ~25 errors (mixed types)
4. **tests/unit/core/parser.test.ts**: ~20 errors (unsafe operations, enum issues)
5. **src/config/metrics/*.metrics.ts**: ~20 errors total (missing return types)

## Recommended Fix Priority

### High Priority (Type Safety)
1. Fix all `@typescript-eslint/no-unsafe-*` errors
2. Replace `any` types with proper typing
3. Add missing function return types

### Medium Priority (Code Quality)  
1. Fix switch exhaustiveness issues
2. Replace `||` with `??` where appropriate
3. Fix import ordering

### Low Priority (Organization)
1. Move function definitions before usage
2. Split large functions/files
3. Fix unused variables and shadowing

## Notes
- Most errors are in test files, indicating test setup issues
- Metrics configuration files have consistent missing return type patterns
- Core application files have fewer but more critical type safety issues