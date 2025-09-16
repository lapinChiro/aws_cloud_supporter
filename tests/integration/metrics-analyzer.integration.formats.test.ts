// MetricsAnalyzer Integration Tests - Formats & Integration
// CLAUDE.md準拠: No any types、TDD実践、Zero type errors
import { MetricsAnalyzer } from '../../src/core/analyzer';
import { HTMLOutputFormatter } from '../../src/core/formatters/html';
import { JSONOutputFormatter } from '../../src/core/json-formatter';
import { TemplateParser } from '../../src/core/parser';
import { Logger } from '../../src/utils/logger';
import { createTestCloudFormationTemplate } from '../helpers/cloudformation-test-helpers';

import type {
  ParsedOutput
} from './metrics-analyzer.integration.test-helpers';
import { 
  assertOutputFormat,
  assertJSONSchemaCompliance,
  assertHTMLOutputFormat,
  assertLowImportanceMetrics,
  assertResourceTypeFiltering,
  assertVerboseMode,
  assertFullPipeline
} from './metrics-analyzer.integration.test-helpers';

describe('MetricsAnalyzer Integration Tests - Formats & Integration', () => {
  let analyzer: MetricsAnalyzer;
  
  beforeAll(() => {
    const parser = new TemplateParser();
    const logger = new Logger('debug', false);
    analyzer = new MetricsAnalyzer(parser, logger);
  });

  describe('5. Output Format Tests', () => {
    test('5-1: JSON output format validation', async () => {
      await assertOutputFormat(
        analyzer,
        'web-app-complete.yaml',
        'json',
        new JSONOutputFormatter(),
        (output) => {
          const parsed = JSON.parse(output) as ParsedOutput;
          assertJSONSchemaCompliance(parsed);
        }
      );
    });

    test('5-2: HTML output format validation', async () => {
      await assertOutputFormat(
        analyzer,
        'minimal-lambda.yaml',
        'html',
        new HTMLOutputFormatter(),
        (output) => {
          assertHTMLOutputFormat(output);
          expect(output).toMatch(/id="categoryFilter"/);
          expect(output).toMatch(/<style>/);
          expect(output).toMatch(/\.resource-card/);
          expect(output).toMatch(/\.importance-high/);
          expect(output).toMatch(/<script>/);
          expect(output).toMatch(/applyFilters/);
        }
      );
    });
  });

  describe('6. Options & Filtering', () => {
    test('6-1: Include low importance metrics option', async () => {
      await assertLowImportanceMetrics(analyzer, 'minimal-lambda.yaml');
    });

    test('6-2: Resource type filtering', async () => {
      await assertResourceTypeFiltering(analyzer, 'web-app-complete.yaml');
    });

    test('6-3: Verbose mode logging', async () => {
      await assertVerboseMode('minimal-lambda.yaml');
    });
  });

  describe('8. Integration with All Components', () => {
    test('8-1: Full pipeline - Parse, Extract, Generate, Format', async () => {
      await assertFullPipeline(analyzer, 'web-app-complete.yaml');
    });

    test('8-2: Error recovery with continueOnError option', async () => {
      const template = createTestCloudFormationTemplate({
        ValidLambda: {
          Type: 'AWS::Lambda::Function',
          Properties: { Runtime: 'nodejs20.x' }
        },
        // This could cause generator errors if properties are malformed
        InvalidRDS: {
          Type: 'AWS::RDS::DBInstance',
          Properties: null
        }
      });

      const { withTempTemplate } = await import('./metrics-analyzer.integration.test-helpers');
      await withTempTemplate(template, 'error-recovery.yaml', async (tempPath) => {
        const result = await analyzer.analyze(tempPath, {
          outputFormat: 'json',
          continueOnError: true
        });
        
        // Should process valid resources even if some fail
        expect(result.resources.length).toBeGreaterThan(0);
        expect(result.resources.find(r => r.logical_id === 'ValidLambda')).toBeDefined();
      });
    });
  });
});