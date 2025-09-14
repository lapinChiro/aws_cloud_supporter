// MetricsAnalyzer統合テスト（実際のGeneratorとの結合）
// CLAUDE.md準拠: No any types、TDD実践

// Import split test files
import './analyzer-integration.generator.test';
import './analyzer-integration.format-errors.test';

describe('MetricsAnalyzer Integration Tests', () => {
  it('should load all split test files', () => {
    // This test ensures all split files are imported
    expect(true).toBe(true);
  });
});