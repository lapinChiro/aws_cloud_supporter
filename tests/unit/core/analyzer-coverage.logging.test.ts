// MetricsAnalyzer追加カバレッジテスト - ログ出力
// CLAUDE.md準拠: No any types、TDD実践

import type { CloudFormationTemplate } from '../../../src/types/cloudformation';

import { setupMocks } from './analyzer-coverage.test-helpers';

describe('Logging Coverage', () => {
  test('should log warning for slow processing', async () => {
    const { analyzer, mockParser, mockLogger } = setupMocks();
    const template: CloudFormationTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        Lambda: { Type: 'AWS::Lambda::Function', Properties: {} }
      }
    };

    mockParser.parse.mockResolvedValue(template);
    
    // Mock performance.now to simulate slow processing
    const originalNow = performance.now;
    let callCount = 0;
    performance.now = jest.fn(() => {
      // First call: start time
      // Subsequent calls: add 31 seconds to simulate slow processing
      return callCount++ === 0 ? 0 : 31000;
    });
    
    await analyzer.analyze('template.yaml', {
      outputFormat: 'json'
    });
    
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Processing time exceeded')
    );
    
    performance.now = originalNow;
  });

  test('should log completion with memory info', async () => {
    const { analyzer, mockParser, mockLogger } = setupMocks();
    const template: CloudFormationTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        Lambda: { Type: 'AWS::Lambda::Function', Properties: {} }
      }
    };

    mockParser.parse.mockResolvedValue(template);
    
    await analyzer.analyze('template.yaml', {
      outputFormat: 'json'
    });
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Analysis completed')
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('peak memory')
    );
  });
});