// HTMLOutputFormatter テスト - パフォーマンス
// CLAUDE.md準拠: No any types、TDD実践

import { HTMLOutputFormatter } from '../../../src/core/formatters/html';

import { createLargeAnalysisResult } from './html-formatter.test-helpers';

describe('HTMLOutputFormatter - Performance', () => {
  let formatter: HTMLOutputFormatter;

  beforeEach(() => {
    formatter = new HTMLOutputFormatter();
  });

  test('should complete within performance limits', () => {
    const largeResult = createLargeAnalysisResult(100);

    const startTime = Date.now();
    formatter.formatHTML(largeResult);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(3000); // 3 seconds max
  });
});