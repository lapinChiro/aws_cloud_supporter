// JSONOutputFormatterパフォーマンステスト
// CLAUDE.md準拠: No any types、TDD実践

import {
  createJSONFormatterTestSuite,
  createLargeAnalysisResult,
  runPerformanceTest
} from '../../helpers/json-formatter-test-template';

import { createMockAnalysisResult } from './json-formatter.test-helpers';

createJSONFormatterTestSuite('Performance', [
  {
    name: 'should handle large outputs efficiently',
    test: (formatter) => {
      const largeResult = createLargeAnalysisResult(500, 20);
      runPerformanceTest(formatter, largeResult, 2000, 1000000);
    }
  }
], createMockAnalysisResult);