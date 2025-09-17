// HTMLOutputFormatter テスト - パフォーマンス
// CLAUDE.md準拠: No any types、TDD実践

import {
  createHTMLFormatterTestSuiteWithoutMock,
  runHTMLPerformanceTest
} from '../../helpers/html-formatter-test-template';

import { createLargeAnalysisResult } from './html-formatter.test-helpers';

createHTMLFormatterTestSuiteWithoutMock('Performance', [
  {
    name: 'should complete within performance limits',
    test: (formatter) => {
      const largeResult = createLargeAnalysisResult(100);
      runHTMLPerformanceTest(formatter, largeResult, 3000);
    }
  }
]);