// JsonSchemaValidator テスト - リソースバリデーション
// CLAUDE.md準拠: No any types、TDD実践

import { JsonSchemaValidator } from '../../../src/utils/schema-validator';

import { createResultWithInvalidUnsupportedResources } from './schema-validator.test-helpers';

describe('JsonSchemaValidator - Resources Validation', () => {
  let validator: JsonSchemaValidator;

  beforeEach(() => {
    validator = new JsonSchemaValidator();
  });

  it('should validate unsupported_resources as string array', () => {
    const invalidResult = createResultWithInvalidUnsupportedResources();

    const result = validator.validateAnalysisResult(invalidResult);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    const unsupportedError = result.errors.find(err => 
      err.path?.includes('unsupported_resources')
    );
    expect(unsupportedError).toBeDefined();
  });
});