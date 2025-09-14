// HTMLOutputFormatter テスト - データフォーマット
// CLAUDE.md準拠: No any types、TDD実践

import { HTMLOutputFormatter } from '../../../src/core/formatters/html';

import { createMockAnalysisResult } from './html-formatter.test-helpers';

describe('HTMLOutputFormatter - Formatting', () => {
  let formatter: HTMLOutputFormatter;

  beforeEach(() => {
    formatter = new HTMLOutputFormatter();
  });

  test('should apply importance styles', () => {
    const mockResult = createMockAnalysisResult();
    const html = formatter.formatHTML(mockResult);

    expect(html).toContain('importance-high');
    expect(html).toContain('importance-medium');
  });

  test('should apply category badges', () => {
    const mockResult = createMockAnalysisResult();
    const html = formatter.formatHTML(mockResult);

    expect(html).toContain('category-performance');
    expect(html).toContain('Performance');
  });

  test('should format numbers correctly', () => {
    const mockResult = createMockAnalysisResult();
    const html = formatter.formatHTML(mockResult);

    // Processing time should be formatted
    expect(html).toContain('1.234s'); // 1234ms formatted
    expect(html).toContain('100MB'); // Memory formatted
  });

  test('should escape HTML in resource names', () => {
    const mockResult = createMockAnalysisResult();
    // Add resource with HTML characters
    const firstResource = mockResult.resources[0];
    if (firstResource) {
      firstResource.logical_id = '<script>alert("test")</script>';
    }
    
    const html = formatter.formatHTML(mockResult);

    // Should be escaped
    expect(html).not.toContain('<script>alert("test")</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});