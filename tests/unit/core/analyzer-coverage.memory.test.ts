// MetricsAnalyzer追加カバレッジテスト - メモリ監視
// CLAUDE.md準拠: No any types、TDD実践

import {
  createTestCloudFormationTemplate,
  createLambdaResource
} from '../../helpers/cloudformation-test-helpers';

import { setupMocks } from './analyzer-coverage.test-helpers';

describe('Memory Monitoring Coverage', () => {
  test('should clear interval on successful completion', async () => {
    const { analyzer, mockParser } = setupMocks();
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    const template = createTestCloudFormationTemplate({
      Lambda: createLambdaResource('Lambda')
    });

    mockParser.parse.mockResolvedValue(template);
    
    // 現在のメモリ使用量より大きい制限を設定（テスト環境では200MB+を使用）
    await analyzer.analyze('template.yaml', {
      memoryLimit: 500 * 1024 * 1024, // 500MB
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
      memoryLimit: 500 * 1024 * 1024, // 500MB
      outputFormat: 'json'
    }))
      .rejects.toThrow();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    clearIntervalSpy.mockRestore();
  });
});