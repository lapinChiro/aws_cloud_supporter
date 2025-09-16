// HTMLOutputFormatter テスト - データフォーマット
// CLAUDE.md準拠: No any types、TDD実践

import {
  createHTMLFormatterTestSuite,
  expectHTMLToContain,
  expectHTMLNotToContain
} from '../../helpers/html-formatter-test-template';

import { createMockAnalysisResult } from './html-formatter.test-helpers';

createHTMLFormatterTestSuite('Formatting', [
  {
    name: 'should apply importance styles',
    test: (formatter, mockResult) => {
      const html = formatter.formatHTML(mockResult);
      expectHTMLToContain(html, ['importance-high', 'importance-medium']);
    }
  },
  {
    name: 'should apply category badges',
    test: (formatter, mockResult) => {
      const html = formatter.formatHTML(mockResult);
      expectHTMLToContain(html, ['category-performance', 'Performance']);
    }
  },
  {
    name: 'should format numbers correctly',
    test: (formatter, mockResult) => {
      const html = formatter.formatHTML(mockResult);
      // Processing time should be formatted
      expectHTMLToContain(html, ['Processing: 1234ms', 'Memory: 100MB']);
    }
  },
  {
    name: 'should escape HTML in resource names',
    test: (formatter, mockResult) => {
      // Add resource with HTML characters
      const firstResource = mockResult.resources[0];
      if (firstResource) {
        firstResource.logical_id = '<script>alert("test")</script>';
      }

      const html = formatter.formatHTML(mockResult);

      // Should be escaped
      expectHTMLNotToContain(html, ['<script>alert("test")</script>']);
      expectHTMLToContain(html, ['&lt;script&gt;']);
    }
  }
], createMockAnalysisResult);