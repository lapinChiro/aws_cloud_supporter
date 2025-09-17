// JsonSchemaValidator テスト - メトリクスバリデーション
// CLAUDE.md準拠: No any types、TDD実践

import {
  createSchemaValidatorTestSuite,
  assertInvalid
} from '../../helpers/schema-validator-test-template';

import {
  createResultWithInvalidCategory,
  createResultWithInvalidImportance,
  createResultWithInvalidThreshold,
  createResultWithInvalidDimensions
} from './schema-validator.test-helpers';

createSchemaValidatorTestSuite('Metrics Validation', [
  {
    name: 'should validate metric category values',
    test: (validator) => {
      const invalidResult = createResultWithInvalidCategory();
      const result = validator.validateAnalysisResult(invalidResult);

      assertInvalid(validator, invalidResult);

      const categoryError = result.errors.find(err =>
        err.path?.includes('category')
      );
      expect(categoryError).toBeDefined();
    }
  },
  {
    name: 'should validate importance values',
    test: (validator) => {
      const invalidResult = createResultWithInvalidImportance();
      const result = validator.validateAnalysisResult(invalidResult);

      assertInvalid(validator, invalidResult);

      const importanceError = result.errors.find(err =>
        err.path?.includes('importance')
      );
      expect(importanceError).toBeDefined();
    }
  },
  {
    name: 'should validate threshold structure',
    test: (validator) => {
      const invalidResult = createResultWithInvalidThreshold();
      const result = validator.validateAnalysisResult(invalidResult);

      assertInvalid(validator, invalidResult);

      const thresholdError = result.errors.find(err =>
        err.path?.includes('recommended_threshold')
      );
      expect(thresholdError).toBeDefined();
    }
  },
  {
    name: 'should validate dimensions array',
    test: (validator) => {
      const invalidResult = createResultWithInvalidDimensions();
      const result = validator.validateAnalysisResult(invalidResult);

      assertInvalid(validator, invalidResult);

      const dimensionError = result.errors.find(err =>
        err.path?.includes('dimensions')
      );
      expect(dimensionError).toBeDefined();
    }
  }
]);