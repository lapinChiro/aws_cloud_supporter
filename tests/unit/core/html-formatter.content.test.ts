// HTMLOutputFormatter テスト - コンテンツレンダリング
// CLAUDE.md準拠: No any types、TDD実践

import { HTMLOutputFormatter } from '../../../src/core/formatters/html';

import { createMockAnalysisResult } from './html-formatter.test-helpers';

describe('HTMLOutputFormatter - Content', () => {
  let formatter: HTMLOutputFormatter;

  beforeEach(() => {
    formatter = new HTMLOutputFormatter();
  });

  test('should display metadata correctly', () => {
    const mockResult = createMockAnalysisResult();
    const html = formatter.formatHTML(mockResult);

    expect(html).toContain('Total Resources: 2');
    expect(html).toContain('Supported: 2');
    expect(html).toContain('Generated: 2024-01-01T00:00:00Z');
  });

  test('should render resource cards with metrics', () => {
    const mockResult = createMockAnalysisResult();
    const html = formatter.formatHTML(mockResult);

    // Resource cards
    expect(html).toContain('MyDatabase');
    expect(html).toContain('AWS::RDS::DBInstance');
    expect(html).toContain('MyFunction');
    expect(html).toContain('AWS::Lambda::Function');

    // Metrics
    expect(html).toContain('CPUUtilization');
    expect(html).toContain('DatabaseConnections');
    expect(html).toContain('Duration');

    // Thresholds
    expect(html).toContain('Warning: 70%');
    expect(html).toContain('Critical: 90%');
  });

  test('should include search and filter controls', () => {
    const mockResult = createMockAnalysisResult();
    const html = formatter.formatHTML(mockResult);

    expect(html).toContain('id="searchInput"');
    expect(html).toContain('id="importanceFilter"');
    expect(html).toContain('id="categoryFilter"');
    expect(html).toContain('placeholder="Search metrics..."');
  });

  test('should handle metrics without dimensions', () => {
    const mockResult = createMockAnalysisResult();
    // Modify a metric to have no dimensions
    const firstResource = mockResult.resources[0];
    const firstMetric = firstResource?.metrics[0];
    if (firstMetric) {
      firstMetric.dimensions = [];
    }
    
    const html = formatter.formatHTML(mockResult);

    // Should still render the metric correctly
    expect(html).toContain('CPUUtilization');
    expect(html).not.toContain('undefined');
  });
});