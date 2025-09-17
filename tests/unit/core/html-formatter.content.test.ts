// HTMLOutputFormatter テスト - コンテンツレンダリング
// CLAUDE.md準拠: No any types、TDD実践

import {
  createHTMLFormatterTestSuite,
  expectHTMLToContain,
  expectResourceCard
} from '../../helpers/html-formatter-test-template';

import { createMockAnalysisResult } from './html-formatter.test-helpers';

createHTMLFormatterTestSuite('Content', [
  {
    name: 'should display metadata correctly',
    test: (formatter, mockResult) => {
      const html = formatter.formatHTML(mockResult);

      expectHTMLToContain(html, [
        'Resources: 2/2',
        'Generated: 2024年1月1日',
        'Processing: 1234ms'
      ]);
    }
  },
  {
    name: 'should render resource cards with metrics',
    test: (formatter, mockResult) => {
      const html = formatter.formatHTML(mockResult);

      // Resource cards
      expectResourceCard(html, 'MyDatabase', 'AWS::RDS::DBInstance');
      expectResourceCard(html, 'MyFunction', 'AWS::Lambda::Function');

      // Metrics
      expectHTMLToContain(html, [
        'CPUUtilization',
        'DatabaseConnections',
        'Duration',
        'Warning: 70%'
      ]);
      expect(html).toContain('Critical: 90%');
    }
  },
  {
    name: 'should include search and filter controls',
    test: (formatter, mockResult) => {
      const html = formatter.formatHTML(mockResult);

      expectHTMLToContain(html, [
        'id="searchInput"',
        'id="importanceFilter"',
        'id="categoryFilter"',
        'placeholder="🔍 Search metrics..."'
      ]);
    }
  },
  {
    name: 'should handle metrics without dimensions',
    test: (formatter, mockResult) => {
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
    }
  }
], createMockAnalysisResult);