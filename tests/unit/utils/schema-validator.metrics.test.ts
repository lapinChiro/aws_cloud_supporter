// JsonSchemaValidator テスト - メトリクスバリデーション
// CLAUDE.md準拠: No any types、TDD実践

import { JsonSchemaValidator } from '../../../src/utils/schema-validator';

import { 
  createResultWithInvalidCategory,
  createResultWithInvalidImportance,
  createResultWithInvalidThreshold,
  createResultWithInvalidDimensions
} from './schema-validator.test-helpers';

describe('JsonSchemaValidator - Metrics Validation', () => {
  let validator: JsonSchemaValidator;

  beforeEach(() => {
    validator = new JsonSchemaValidator();
  });

  it('should validate metric category values', () => {
    const invalidResult = createResultWithInvalidCategory();

    const result = validator.validateAnalysisResult(invalidResult);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    const categoryError = result.errors.find(err => 
      err.path?.includes('category')
    );
    expect(categoryError).toBeDefined();
  });

  it('should validate importance values', () => {
    const invalidResult = createResultWithInvalidImportance();

    const result = validator.validateAnalysisResult(invalidResult);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    const importanceError = result.errors.find(err => 
      err.path?.includes('importance')
    );
    expect(importanceError).toBeDefined();
  });

  it('should validate threshold structure', () => {
    const invalidResult = createResultWithInvalidThreshold();

    const result = validator.validateAnalysisResult(invalidResult);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    const thresholdError = result.errors.find(err => 
      err.path?.includes('recommended_threshold')
    );
    expect(thresholdError).toBeDefined();
  });

  it('should validate dimensions array', () => {
    const invalidResult = createResultWithInvalidDimensions();

    const result = validator.validateAnalysisResult(invalidResult);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    const dimensionError = result.errors.find(err => 
      err.path?.includes('dimensions')
    );
    expect(dimensionError).toBeDefined();
  });
});