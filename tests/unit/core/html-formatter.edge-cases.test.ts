// HTMLOutputFormatter テスト - エッジケース
// CLAUDE.md準拠: No any types、TDD実践

import {
  createHTMLFormatterTestSuiteWithoutMock,
  expectHTMLToContain,
  expectBasicHTMLStructure
} from '../../helpers/html-formatter-test-template';

import {
  createEmptyAnalysisResult,
  createResultWithUnsupportedResources
} from './html-formatter.test-helpers';

createHTMLFormatterTestSuiteWithoutMock('Edge Cases', [
  {
    name: 'should handle unsupported resources',
    test: (formatter) => {
      const mockResult = createResultWithUnsupportedResources();
      const html = formatter.formatHTML(mockResult);

      expectHTMLToContain(html, [
        'Unsupported Resources',
        'UnsupportedVPC',
        'UnsupportedBucket'
      ]);
    }
  },
  {
    name: 'should handle empty results',
    test: (formatter) => {
      const emptyResult = createEmptyAnalysisResult();
      const html = formatter.formatHTML(emptyResult);

      expectHTMLToContain(html, [
        'Resources: 0/0',
        'No supported resources found'
      ]);
      expectBasicHTMLStructure(html);
    }
  }
]);