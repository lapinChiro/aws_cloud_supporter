// HTMLOutputFormatter テスト - 基本構造
// CLAUDE.md準拠: No any types、TDD実践

import {
  createHTMLFormatterTestSuite,
  expectBasicHTMLStructure,
  expectCSSStyles,
  expectHTMLToContain
} from '../../helpers/html-formatter-test-template';

import { createMockAnalysisResult } from './html-formatter.test-helpers';

createHTMLFormatterTestSuite('Structure', [
  {
    name: 'should generate valid HTML structure',
    test: (formatter, mockResult) => {
      const html = formatter.formatHTML(mockResult);

      // Basic HTML structure
      expectBasicHTMLStructure(html);

      // Title
      expectHTMLToContain(html, ['<title>CloudWatch Metrics Report</title>']);
    }
  },
  {
    name: 'should include all CSS styles',
    test: (formatter, mockResult) => {
      const html = formatter.formatHTML(mockResult);

      // CSS styles should be present
      expectCSSStyles(html, ['container', 'resource-card', 'badge', 'header']);
      expect(html).toContain('body {');
    }
  },
  {
    name: 'should include JavaScript functionality',
    test: (formatter, mockResult) => {
      const html = formatter.formatHTML(mockResult);

      // JavaScript should be present
      expectHTMLToContain(html, [
        '<script>',
        'function initializeEventListeners',
        'function applyFilters',
        'currentFilters',
        '</script>'
      ]);
    }
  },
  {
    name: 'should accept logger in constructor',
    test: () => {
      // Dynamic import to avoid circular dependency
      const { HTMLOutputFormatter } = require('../../../src/core/formatters/html') as typeof import('../../../src/core/formatters/html');
      const { createLogger } = require('../../../src/utils/logger') as typeof import('../../../src/utils/logger');

      // LoggerのモックをcreateLoggerで作成
      const mockLogger = createLogger('info', false);

      // infoメソッドをspyで監視
      const infoSpy = jest.spyOn(mockLogger, 'info');

      const formatterWithLogger = new HTMLOutputFormatter(mockLogger as unknown as import('../../../src/utils/logger').Logger);
      const mockResult = createMockAnalysisResult();

      formatterWithLogger.formatHTML(mockResult);

      // Logger should be called during formatting
      expect(infoSpy).toHaveBeenCalledWith('📄 Formatting output as HTML');
    }
  },
  {
    name: 'should provide static CSS and JS methods',
    test: () => {
      // Dynamic import to avoid circular dependency
      const { HTMLOutputFormatter } = require('../../../src/core/formatters/html') as typeof import('../../../src/core/formatters/html');

      // Test getEmbeddedCSS static method
      const css = HTMLOutputFormatter.getEmbeddedCSS();
      expect(typeof css).toBe('string');
      expect(css.length).toBeGreaterThan(0);
      expect(css).toContain('body {');
      expect(css).toContain('.container {');

      // Test getEmbeddedJS static method
      const js = HTMLOutputFormatter.getEmbeddedJS();
      expect(typeof js).toBe('string');
      expect(js.length).toBeGreaterThan(0);
      expect(js).toContain('function');
    }
  }
], createMockAnalysisResult);