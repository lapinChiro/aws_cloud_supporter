// MetricsAnalyzer追加カバレッジテスト - メモリ監視
// CLAUDE.md準拠: No any types、TDD実践

import {
  createTestCloudFormationTemplate,
  createLambdaResource
} from '../../helpers/cloudformation-test-helpers';

import { setupMocks } from './analyzer-coverage.test-helpers';

describe('Memory Monitoring Coverage', () => {
  let originalMemoryUsage: typeof process.memoryUsage;
  
  beforeEach(() => {
    // process.memoryUsage をモック
    originalMemoryUsage = process.memoryUsage;
    process.memoryUsage = jest.fn(() => ({
      rss: 100 * 1024 * 1024,
      heapTotal: 100 * 1024 * 1024,
      heapUsed: 100 * 1024 * 1024, // 100MB
      external: 0,
      arrayBuffers: 0
    })) as unknown as typeof process.memoryUsage;
  });
  
  afterEach(() => {
    // モックを復元
    process.memoryUsage = originalMemoryUsage;
  });
  
  test('should clear interval on successful completion', async () => {
    const { analyzer, mockParser } = setupMocks();
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    const template = createTestCloudFormationTemplate({
      Lambda: createLambdaResource('Lambda')
    });

    mockParser.parse.mockResolvedValue(template);
    
    // 現在のメモリ使用量より大きい制限を設定（モックは100MBを返す）
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