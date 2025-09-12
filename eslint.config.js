/**
 * Ultimate Type Safety ESLint Configuration (v9.x)
 * Optimized for Claude Code generation
 *
 * Enhanced 7-Layer Type Safety Architecture + AI-Specific Tier System:
 * 
 * === Core 7-Layer Architecture ===
 * Layer 1: Complete `any` Elimination
 * Layer 2: Function Boundary Safety (型推論を活用)
 * Layer 3: Null/Undefined Complete Safety
 * Layer 4: Promise/Async Complete Safety
 * Layer 5: Code Quality Gates (実用的な制限)
 * Layer 6: Exhaustiveness (Claude特有の強み)
 * Layer 7: Dependency Management
 * 
 * === AI-Specific Enhancement Tiers ===
 * Tier 1 (Immediate): Enum Safety, Void Expressions, Object Consistency, 
 *                     Generic Types, Modern Naming Conventions
 * Tier 2 (Gradual):   Template Literals, Type Assertions, Advanced Safety
 * 
 * This configuration provides machine-verifiable type safety guarantees
 * specifically optimized for Claude Code generation patterns.
 */

const js = require( '@eslint/js' );
const tseslint = require( '@typescript-eslint/eslint-plugin' );
const tsParser = require( '@typescript-eslint/parser' );
const importPlugin = require( 'eslint-plugin-import' );
const prettierConfig = require( 'eslint-config-prettier' );

module.exports = [
  // Base configuration for all TypeScript files
  {
    files: [ '**/*.ts', '**/*.tsx' ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },
    rules: {
      // ===== Layer 1: Complete `any` Elimination =====
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // ===== Layer 2: Function Boundary Safety =====
      // explicit-function-return-typeを削除 - TypeScriptの型推論を信頼
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // ===== Layer 3: Null/Undefined Complete Safety =====
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // ===== Layer 4: Promise/Async Complete Safety =====
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',

      // ===== Layer 5: Code Quality Gates =====
      complexity: [ 'error', 20 ],
      'max-lines-per-function': [ 'error', { max: 150, skipBlankLines: true, skipComments: true, IIFEs: true } ],
      'max-lines': [ 'error', { max: 500, skipBlankLines: true, skipComments: true } ],
      'no-console': 'error',

      // ===== Layer 6: Exhaustiveness (Claude特有の強み) =====
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // ===== Layer 7: Dependency Management =====
      'import/order': [
        'error',
        {
          groups: [ 'builtin', 'external', 'internal', 'parent', 'sibling', 'index' ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',

      // ===== Additional TypeScript Best Practices =====
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-function-type': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/prefer-ts-expect-error': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',

      // ===== Tier 1: Enum Safety (Critical for AI-generated code) =====
      '@typescript-eslint/no-mixed-enums': 'error',
      '@typescript-eslint/prefer-enum-initializers': 'error',
      '@typescript-eslint/no-unsafe-enum-comparison': 'error',

      // ===== Tier 1: Void Expression Safety =====
      '@typescript-eslint/no-confusing-void-expression': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',

      // ===== Tier 1: Generic Type Safety =====
      '@typescript-eslint/no-unnecessary-type-parameters': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',

      // ===== Code Style Consistency =====
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', disallowTypeAnnotations: false },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/array-type': [ 'error', { default: 'array-simple' } ],

      // ===== Tier 1: Object/Array Type Consistency =====
      '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-array-constructor': 'error',

      // ===== Tier 1: Modern Naming Convention (No I-prefix) =====
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase']
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase']
        },
        {
          selector: 'enum',
          format: ['PascalCase']
        }
      ],

      // ===== Security Best Practices =====
      '@typescript-eslint/no-implied-eval': 'error',
      'no-eval': 'error',
      'no-new-func': 'error',

      // ===== Performance Optimizations =====
      '@typescript-eslint/prefer-for-of': 'error',

      // ===== Tier 2: Gradual Introduction (Warn Mode) =====
      // Template Literal Safety
      '@typescript-eslint/restrict-template-expressions': [
        'warn',
        {
          allowNumber: true,
          allowBoolean: true,
          allowAny: false,
          allowNullish: false
        }
      ],
      // Type Assertion Safety
      '@typescript-eslint/consistent-type-assertions': [
        'warn',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' }
      ],
      // Advanced Type Safety
      '@typescript-eslint/non-nullable-type-assertion-style': 'warn',
      '@typescript-eslint/prefer-literal-enum-member': 'warn',
      '@typescript-eslint/unified-signatures': 'warn',

      // ===== Disable Base Rules in Favor of TypeScript Equivalents =====
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },

  // Test files configuration - same quality standards as production code
  {
    files: [ '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx' ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: {
      // Test code is specification - apply same quality standards as production
      'no-console': 'off', // Allow console.log for debugging during test development
      'max-lines-per-function': [ 'error', { max: 300 } ],
      'max-lines': [ 'error', { max: 500 } ],
      complexity: [ 'error', 20 ],
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'dist/**',
      'coverage/**',
      '.next/**',
      'out/**',
      '*.config.js',
      '*.config.ts',
      'jest.config.js',
      'jest.config.base.js',
      'jest.setup.ts',
      '**/jest.setup.ts',
      '**/vitest.config.ts',
      'cypress.config.ts',
      '.eslintrc.js',
      'eslint.config.js',
      '**/*.d.ts',
      'cdk.out/**',
      '.serverless/**',
      'tmp/**',
      'temp/**',
    ],
  },

  // Prettier integration - disable conflicting rules (must be last)
  prettierConfig,
];
