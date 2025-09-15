// HTMLOutputFormatter テスト - 基本構造
// CLAUDE.md準拠: No any types、TDD実践

import { HTMLOutputFormatter } from '../../../src/core/formatters/html';

import { createMockAnalysisResult } from './html-formatter.test-helpers';

describe('HTMLOutputFormatter - Structure', () => {
  let formatter: HTMLOutputFormatter;

  beforeEach(() => {
    formatter = new HTMLOutputFormatter();
  });

  test('should generate valid HTML structure', () => {
    const mockResult = createMockAnalysisResult();
    const html = formatter.formatHTML(mockResult);

    // Basic HTML structure
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('<head>');
    expect(html).toContain('<body>');
    expect(html).toContain('</html>');

    // Meta tags
    expect(html).toContain('<meta charset="UTF-8">');
    expect(html).toContain('<meta name="viewport"');

    // Title
    expect(html).toContain('<title>CloudWatch Metrics Report</title>');
  });

  test('should include all CSS styles', () => {
    const mockResult = createMockAnalysisResult();
    const html = formatter.formatHTML(mockResult);

    // CSS styles should be present
    expect(html).toContain('<style>');
    expect(html).toContain('body {');
    expect(html).toContain('.container {');
    expect(html).toContain('.resource-card {');
    expect(html).toContain('.badge {');
    expect(html).toContain('.header {');
    expect(html).toContain('</style>');
  });

  test('should include JavaScript functionality', () => {
    const mockResult = createMockAnalysisResult();
    const html = formatter.formatHTML(mockResult);

    // JavaScript should be present
    expect(html).toContain('<script>');
    expect(html).toContain('function initializeEventListeners');
    expect(html).toContain('function applyFilters');
    expect(html).toContain('currentFilters');
    expect(html).toContain('</script>');
  });
});