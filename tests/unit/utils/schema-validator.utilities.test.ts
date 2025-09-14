// JsonSchemaValidator テスト - ユーティリティ機能
// CLAUDE.md準拠: No any types、TDD実践

import type { ValidationError } from '../../../src/utils/schema-validator';
import { JsonSchemaValidator, validateJsonSchema } from '../../../src/utils/schema-validator';

import { createValidAnalysisResult, createResultWithMissingMetadata } from './schema-validator.test-helpers';

describe('JsonSchemaValidator - Utilities', () => {
  let validator: JsonSchemaValidator;

  beforeEach(() => {
    validator = new JsonSchemaValidator();
  });

  describe('formatValidationErrors', () => {
    it('should format errors correctly', () => {
      const errors: ValidationError[] = [
        { path: 'metadata.version', message: 'Required field missing', value: undefined },
        { path: 'resources.0.metrics.0.category', message: 'Invalid enum value', value: 'invalid' }
      ];

      const formatted = validator.formatValidationErrors(errors);

      expect(formatted).toContain('metadata.version: Required field missing');
      expect(formatted).toContain('resources.0.metrics.0.category: Invalid enum value');
    });

    it('should handle empty errors array', () => {
      const formatted = validator.formatValidationErrors([]);
      expect(formatted).toBe('No validation errors');
    });
  });

  describe('getValidationSummary', () => {
    it('should categorize errors correctly', () => {
      const invalidResult = createResultWithMissingMetadata();
      const result = validator.validateAnalysisResult(invalidResult);

      const summary = validator.getValidationSummary(result.errors);

      expect(summary.isValid).toBe(false);
      expect(summary.errorCount).toBeGreaterThan(0);
      expect(summary.categories).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle valid case', () => {
      const validResult = createValidAnalysisResult();
      const result = validator.validateAnalysisResult(validResult);

      const summary = validator.getValidationSummary(result.errors);

      expect(summary.isValid).toBe(true);
      expect(summary.errorCount).toBe(0);
      expect(Object.keys(summary.categories)).toHaveLength(0);
    });
  });

  describe('validateJsonSchema helper', () => {
    it('should return validation result', () => {
      const validResult = createValidAnalysisResult();

      const result = validateJsonSchema(validResult);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors', () => {
      const invalidResult = createResultWithMissingMetadata();

      const result = validateJsonSchema(invalidResult);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});