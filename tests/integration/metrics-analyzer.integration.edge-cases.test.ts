// MetricsAnalyzer Integration Tests - Edge Cases & Error Handling
// CLAUDE.md準拠: No any types、TDD実践、Zero type errors
import * as path from 'path';

import { MetricsAnalyzer } from '../../src/core/analyzer';
import { TemplateParser } from '../../src/core/parser';
import { Logger } from '../../src/utils/logger';

import { 
  expectAnalysisError,
  withTempTemplate,
  createMixedResourcesTemplate,
  assertMixedResources
} from './metrics-analyzer.integration.test-helpers';

// フィクスチャパス
const FIXTURES_PATH = path.join(__dirname, '..', 'fixtures', 'templates');

describe('MetricsAnalyzer Integration Tests - Edge Cases & Error Handling', () => {
  let analyzer: MetricsAnalyzer;
  
  beforeAll(() => {
    const parser = new TemplateParser();
    const logger = new Logger('debug', false);
    analyzer = new MetricsAnalyzer(parser, logger);
  });

  describe('3. Edge Cases & Error Handling', () => {
    test('3-1: Empty resources template', async () => {
      await expectAnalysisError(
        analyzer,
        path.join(FIXTURES_PATH, 'empty-resources.yaml'),
        /Template Resources section is empty/
      );
    });

    test('3-2: Invalid YAML syntax', async () => {
      await expectAnalysisError(
        analyzer,
        path.join(FIXTURES_PATH, 'invalid-yaml.yaml'),
        ''
      );
    });

    test('3-3: Non-existent file path', async () => {
      await expectAnalysisError(
        analyzer,
        path.join(FIXTURES_PATH, 'non-existent-file.yaml'),
        ''
      );
    });

    test('3-4: Mixed supported and unsupported resources', async () => {
      const template = createMixedResourcesTemplate();
      await withTempTemplate(template, 'mixed-resources.yaml', async (tempPath) => {
        const result = await analyzer.analyze(tempPath, { outputFormat: 'json' });
        assertMixedResources(result);
      });
    });
  });
});