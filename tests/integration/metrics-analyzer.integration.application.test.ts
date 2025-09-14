// MetricsAnalyzer Integration Tests - Application Templates
// CLAUDE.md準拠: No any types、TDD実践、Zero type errors
import { MetricsAnalyzer } from '../../src/core/analyzer';
import { TemplateParser } from '../../src/core/parser';
import { Logger } from '../../src/utils/logger';

import { 
  assertCompleteWebAppTemplate,
  assertServerlessTemplate,
  assertMinimalLambdaTemplate,
  testTemplateFromFixture
} from './metrics-analyzer.integration.test-helpers';

describe('MetricsAnalyzer Integration Tests - Application Templates', () => {
  let analyzer: MetricsAnalyzer;
  
  beforeAll(() => {
    const parser = new TemplateParser();
    const logger = new Logger('debug', false);
    analyzer = new MetricsAnalyzer(parser, logger);
  });

  describe('1. Complete Application Templates', () => {
    test('1-1: Web application complete template with all 6 resource types', async () => {
      await assertCompleteWebAppTemplate(analyzer, 'web-app-complete.yaml');
      
      // Additional test for password redaction
      const result = await testTemplateFromFixture(analyzer, 'web-app-complete.yaml');
      const rdsResource = result.resources.find((r) => r.resource_type === 'AWS::RDS::DBInstance');
      expect(rdsResource?.resource_properties?.MasterUserPassword).toBe('[REDACTED]');
    });

    test('1-2: Serverless application template with SAM transform', async () => {
      await assertServerlessTemplate(analyzer, 'serverless-application.yaml');
    });

    test('1-3: Minimal Lambda template', async () => {
      await assertMinimalLambdaTemplate(analyzer, 'minimal-lambda.yaml');
    });
  });
});