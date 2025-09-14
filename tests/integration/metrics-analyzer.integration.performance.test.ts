// MetricsAnalyzer Integration Tests - Performance & Concurrency
// CLAUDE.md準拠: No any types、TDD実践、Zero type errors
import * as path from 'path';

import { MetricsAnalyzer } from '../../src/core/analyzer';
import { TemplateParser } from '../../src/core/parser';
import { Logger } from '../../src/utils/logger';

import { 
  measureAndAssertPerformance,
  assertLargeTemplate,
  assertConcurrentProcessing
} from './metrics-analyzer.integration.test-helpers';

// フィクスチャパス
const FIXTURES_PATH = path.join(__dirname, '..', 'fixtures', 'templates');

describe('MetricsAnalyzer Integration Tests - Performance & Concurrency', () => {
  let analyzer: MetricsAnalyzer;
  
  beforeAll(() => {
    const parser = new TemplateParser();
    const logger = new Logger('debug', false);
    analyzer = new MetricsAnalyzer(parser, logger);
  });

  describe('2. Large Scale & Performance', () => {
    test('2-1: Large template with 478 resources', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'large-template-500-resources.yaml');
      const result = await measureAndAssertPerformance(
        analyzer,
        templatePath,
        { outputFormat: 'json', concurrency: 10 },
        30000
      );
      assertLargeTemplate(result);
    });

    test('2-2: Memory limit enforcement', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'web-app-complete.yaml');
      // Test with extremely low memory limit
      await expect(analyzer.analyze(templatePath, {
        outputFormat: 'json',
        memoryLimit: 1024 * 1024 // 1MB - should fail
      })).rejects.toThrow(/Memory usage (already exceeds limit|exceeded)/);
    });
  });

  describe('7. Concurrent Processing', () => {
    test('7-1: Different concurrency levels', async () => {
      await assertConcurrentProcessing(analyzer, 'large-template-500-resources.yaml');
    });
  });
});