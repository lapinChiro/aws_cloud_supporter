// JsonSchemaValidator テスト - ユーティリティ機能
// CLAUDE.md準拠: No any types、TDD実践

import type { ValidationError } from '../../../src/utils/schema-validator';
import { validateJsonSchema } from '../../../src/utils/schema-validator';
import {
  createSchemaValidatorTestSuite
} from '../../helpers/schema-validator-test-template';

import { createValidAnalysisResult, createResultWithMissingMetadata } from './schema-validator.test-helpers';

// formatValidationErrors tests
createSchemaValidatorTestSuite('Utilities - formatValidationErrors', [
  {
    name: 'should format errors correctly',
    test: (validator) => {
      const errors: ValidationError[] = [
        { path: 'metadata.version', message: 'Required field missing', value: undefined },
        { path: 'resources.0.metrics.0.category', message: 'Invalid enum value', value: 'invalid' }
      ];

      const formatted = validator.formatValidationErrors(errors);

      expect(formatted).toContain('metadata.version: Required field missing');
      expect(formatted).toContain('resources.0.metrics.0.category: Invalid enum value');
    }
  },
  {
    name: 'should handle empty errors array',
    test: (validator) => {
      const formatted = validator.formatValidationErrors([]);
      expect(formatted).toBe('No validation errors');
    }
  }
]);

// getValidationSummary tests
createSchemaValidatorTestSuite('Utilities - getValidationSummary', [
  {
    name: 'should categorize errors correctly',
    test: (validator) => {
      const invalidResult = createResultWithMissingMetadata();
      const result = validator.validateAnalysisResult(invalidResult);

      const summary = validator.getValidationSummary(result.errors);

      expect(summary.isValid).toBe(false);
      expect(summary.errorCount).toBeGreaterThan(0);
      expect(summary.categories).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    }
  },
  {
    name: 'should handle valid case',
    test: (validator) => {
      const validResult = createValidAnalysisResult();
      const result = validator.validateAnalysisResult(validResult);

      const summary = validator.getValidationSummary(result.errors);

      expect(summary.isValid).toBe(true);
      expect(summary.errorCount).toBe(0);
      expect(Object.keys(summary.categories)).toHaveLength(0);
    }
  }
]);

// validateJsonSchema helper tests
createSchemaValidatorTestSuite('Utilities - validateJsonSchema helper', [
  {
    name: 'should return validation result',
    test: () => {
      const validResult = createValidAnalysisResult();

      const result = validateJsonSchema(validResult);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  },
  {
    name: 'should return validation errors',
    test: () => {
      const invalidResult = createResultWithMissingMetadata();

      const result = validateJsonSchema(invalidResult);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }
  }
]);