// MetricsAnalyzer追加カバレッジテスト（分割版）
// CLAUDE.md準拠: No any types、TDD実践

// Import split test files
import './analyzer-coverage.error-handling.test';
import './analyzer-coverage.performance.test';
import './analyzer-coverage.resource-filtering.test';
import './analyzer-coverage.memory.test';
import './analyzer-coverage.logging.test';

describe('MetricsAnalyzer Coverage Tests', () => {
  it('should load all split test files', () => {
    // This test ensures all split files are imported
    expect(true).toBe(true);
  });
});