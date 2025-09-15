// JsonSchemaValidator テスト - バリデーション基本機能
// CLAUDE.md準拠: No any types、TDD実践

import { JsonSchemaValidator } from '../../../src/utils/schema-validator';

import { 
  createValidAnalysisResult,
  createResultWithMissingMetadata,
  createResultWithInvalidTypes
} from './schema-validator.test-helpers';

describe('JsonSchemaValidator - Basic Validation', () => {
  let validator: JsonSchemaValidator;

  beforeEach(() => {
    validator = new JsonSchemaValidator();
  });

  it('should validate a correct analysis result', () => {
    const validResult = createValidAnalysisResult();

    const result = validator.validateAnalysisResult(validResult);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing metadata fields', () => {
    const invalidResult = createResultWithMissingMetadata();

    const result = validator.validateAnalysisResult(invalidResult);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    const versionError = result.errors.find(err => err.message.includes('version'));
    expect(versionError).toBeDefined();
    expect(versionError?.path).toBe('metadata.version');
  });

  it('should detect invalid metadata types', () => {
    const invalidResult = createResultWithInvalidTypes();

    const result = validator.validateAnalysisResult(invalidResult);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    const typeError = result.errors.find(err => 
      err.path === 'metadata.total_resources' && (err.message.includes('number') || err.message.includes('integer'))
    );
    expect(typeError).toBeDefined();
  });

  it('should handle non-object input', () => {
    const result = validator.validateAnalysisResult('not-an-object' as unknown as Record<string, unknown>);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle null input', () => {
    const result = validator.validateAnalysisResult(null as unknown as Record<string, unknown>);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});