// JsonSchemaValidator テスト - バリデーション基本機能
// CLAUDE.md準拠: No any types、TDD実践

import {
  createSchemaValidatorTestSuite,
  assertValid,
  assertInvalid,
  validateAndAssert
} from '../../helpers/schema-validator-test-template';

import {
  createValidAnalysisResult,
  createResultWithMissingMetadata,
  createResultWithInvalidTypes
} from './schema-validator.test-helpers';

createSchemaValidatorTestSuite('Basic Validation', [
  {
    name: 'should validate a correct analysis result',
    test: (validator) => {
      const validResult = createValidAnalysisResult();
      assertValid(validator, validResult);
    }
  },
  {
    name: 'should detect missing metadata fields',
    test: (validator) => {
      const invalidResult = createResultWithMissingMetadata();
      validateAndAssert(validator, invalidResult, false, [
        { path: 'metadata.version', message: 'version' }
      ]);
    }
  },
  {
    name: 'should detect invalid metadata types',
    test: (validator) => {
      const invalidResult = createResultWithInvalidTypes();
      const result = validator.validateAnalysisResult(invalidResult);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const typeError = result.errors.find(err =>
        err.path === 'metadata.total_resources' && (err.message.includes('number') || err.message.includes('integer'))
      );
      expect(typeError).toBeDefined();
    }
  },
  {
    name: 'should handle non-object input',
    test: (validator) => {
      assertInvalid(validator, 'not-an-object' as unknown as Record<string, unknown>);
    }
  },
  {
    name: 'should handle null input',
    test: (validator) => {
      assertInvalid(validator, null as unknown as Record<string, unknown>);
    }
  },
  {
    name: 'should detect invalid metadata object types (lines 69-74)',
    test: (validator) => {
      const invalidResultWithNullMetadata = {
        metadata: null,
        resources: [],
        metrics: []
      };

      const result = validator.validateAnalysisResult(invalidResultWithNullMetadata);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.message.includes('metadata must be an object'))).toBe(true);
    }
  },
  {
    name: 'should detect invalid generated_at format (line 101)',
    test: (validator) => {
      const invalidResult = {
        metadata: {
          version: '1.0.0',
          generated_at: 'invalid-date-format',
          template_path: '/path/to/template.yaml',
          total_resources: 5,
          supported_resources: 3
        },
        resources: [],
        metrics: []
      };

      validateAndAssert(validator, invalidResult, false, [
        { path: 'metadata.generated_at', message: 'valid ISO-8601 date string' }
      ]);
    }
  },
  {
    name: 'should detect invalid template_path type (line 109)',
    test: (validator) => {
      const invalidResult = {
        metadata: {
          version: '1.0.0',
          generated_at: new Date().toISOString(),
          template_path: 123,
          total_resources: 5,
          supported_resources: 3
        },
        resources: [],
        metrics: []
      };

      validateAndAssert(validator, invalidResult, false, [
        { path: 'metadata.template_path', message: 'template_path must be a string' }
      ]);
    }
  },
  {
    name: 'should detect invalid total_resources type (line 125)',
    test: (validator) => {
      const invalidResult = {
        metadata: {
          version: '1.0.0',
          generated_at: new Date().toISOString(),
          template_path: '/path/to/template.yaml',
          total_resources: -5,
          supported_resources: 3
        },
        resources: [],
        metrics: []
      };

      validateAndAssert(validator, invalidResult, false, [
        { path: 'metadata.total_resources', message: 'non-negative integer' }
      ]);
    }
  },
  {
    name: 'should detect invalid supported_resources type (line 134)',
    test: (validator) => {
      const invalidResult = {
        metadata: {
          version: '1.0.0',
          generated_at: new Date().toISOString(),
          template_path: '/path/to/template.yaml',
          total_resources: 5,
          supported_resources: 'not-a-number'
        },
        resources: [],
        metrics: []
      };

      validateAndAssert(validator, invalidResult, false, [
        { path: 'metadata.supported_resources', message: 'non-negative integer' }
      ]);
    }
  }
]);