// MetricsAnalyzer追加カバレッジテスト - パフォーマンス測定
// CLAUDE.md準拠: No any types、TDD実践

import type { CloudFormationTemplate } from '../../../src/types/cloudformation';

import { setupMocks } from './analyzer-coverage.test-helpers';

describe('Performance Timing Coverage', () => {
  test('should track all timing metrics', async () => {
    const { analyzer, mockParser } = setupMocks();
    const template: CloudFormationTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        Lambda: { Type: 'AWS::Lambda::Function', Properties: {} }
      }
    };

    mockParser.parse.mockResolvedValue(template);
    
    const result = await analyzer.analyze('template.yaml', {
      outputFormat: 'json'
    });
    
    // All timing metrics should be present
    expect(result.metadata.parse_time_ms).toBeGreaterThanOrEqual(0);
    expect(result.metadata.extract_time_ms).toBeGreaterThanOrEqual(0);
    expect(result.metadata.generator_time_ms).toBeGreaterThanOrEqual(0);
    expect(result.metadata.total_time_ms).toBeGreaterThanOrEqual(0);
    expect(result.metadata.processing_time_ms).toBeGreaterThanOrEqual(0);
  });
});