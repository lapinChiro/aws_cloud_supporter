// JsonSchemaValidator単体テスト（分割版）
// CLAUDE.md準拠: No any types、TDD実践

// Import split test files
import './schema-validator.validation.test';
import './schema-validator.metrics.test';
import './schema-validator.resources.test';
import './schema-validator.utilities.test';

describe('JsonSchemaValidator', () => {
  it('should load all split test files', () => {
    // This test ensures all split files are imported
    expect(true).toBe(true);
  });
});