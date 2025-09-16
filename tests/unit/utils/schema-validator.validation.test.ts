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

  // 新しいエッジケーステスト（未カバーのラインをテスト）
  it('should detect invalid metadata object types (lines 69-74)', () => {
    const invalidResultWithNullMetadata = {
      metadata: null, // null metadata
      resources: [],
      metrics: []
    };

    const result = validator.validateAnalysisResult(invalidResultWithNullMetadata);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(err => err.message.includes('metadata must be an object'))).toBe(true);
  });

  it('should detect invalid generated_at format (line 101)', () => {
    const invalidResult = {
      metadata: {
        version: '1.0.0',
        generated_at: 'invalid-date-format', // 無効な日付形式
        template_path: '/path/to/template.yaml',
        total_resources: 5,
        supported_resources: 3
      },
      resources: [],
      metrics: []
    };

    const result = validator.validateAnalysisResult(invalidResult);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(err => 
      err.path === 'metadata.generated_at' && 
      err.message.includes('valid ISO-8601 date string')
    )).toBe(true);
  });

  it('should detect invalid template_path type (line 109)', () => {
    const invalidResult = {
      metadata: {
        version: '1.0.0',
        generated_at: new Date().toISOString(),
        template_path: 123, // 数値（文字列ではない）
        total_resources: 5,
        supported_resources: 3
      },
      resources: [],
      metrics: []
    };

    const result = validator.validateAnalysisResult(invalidResult);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(err => 
      err.path === 'metadata.template_path' && 
      err.message.includes('template_path must be a string')
    )).toBe(true);
  });

  it('should detect invalid total_resources type (line 125)', () => {
    const invalidResult = {
      metadata: {
        version: '1.0.0',
        generated_at: new Date().toISOString(),
        template_path: '/path/to/template.yaml',
        total_resources: -5, // 負の数
        supported_resources: 3
      },
      resources: [],
      metrics: []
    };

    const result = validator.validateAnalysisResult(invalidResult);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(err => 
      err.path === 'metadata.total_resources' && 
      err.message.includes('non-negative integer')
    )).toBe(true);
  });

  it('should detect invalid supported_resources type (line 134)', () => {
    const invalidResult = {
      metadata: {
        version: '1.0.0',
        generated_at: new Date().toISOString(),
        template_path: '/path/to/template.yaml',
        total_resources: 5,
        supported_resources: 'not-a-number' // 文字列（数値ではない）
      },
      resources: [],
      metrics: []
    };

    const result = validator.validateAnalysisResult(invalidResult);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(err => 
      err.path === 'metadata.supported_resources' && 
      err.message.includes('non-negative integer')
    )).toBe(true);
  });
});