// MetricsAnalyzer追加カバレッジテスト - メモリ監視
// CLAUDE.md準拠: No any types、TDD実践

import type { CloudFormationTemplate } from '../../../src/types/cloudformation';

import { setupMocks } from './analyzer-coverage.test-helpers';

describe('Memory Monitoring Coverage', () => {
  test('should clear interval on successful completion', async () => {
    const { analyzer, mockParser } = setupMocks();
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    const template: CloudFormationTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        Lambda: { Type: 'AWS::Lambda::Function', Properties: {} }
      }
    };

    mockParser.parse.mockResolvedValue(template);
    
    await analyzer.analyze('template.yaml', {
      memoryLimit: 100 * 1024 * 1024,
      outputFormat: 'json'
    });
    
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    clearIntervalSpy.mockRestore();
  });

  test('should clear interval on error', async () => {
    const { analyzer, mockParser } = setupMocks();
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    mockParser.parse.mockRejectedValue(new Error('Parse failed'));
    
    await expect(analyzer.analyze('template.yaml', {
      memoryLimit: 100 * 1024 * 1024,
      outputFormat: 'json'
    }))
      .rejects.toThrow();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    clearIntervalSpy.mockRestore();
  });
});