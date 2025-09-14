// CLAUDE.md準拠BaseMetricsGeneratorパフォーマンステスト
import { BaseMetricsGenerator, MetricsGenerationMonitor } from '../../../src/generators/base.generator';
import { createLogger } from '../../../src/utils/logger';

describe('BaseMetricsGeneratorパフォーマンス（CLAUDE.md: 性能要件）', () => {
  
  // テスト用高速ジェネレータ
  class PerformanceTestGenerator extends BaseMetricsGenerator {
    constructor() {
      super(createLogger('error'));
    }

    getSupportedTypes(): string[] {
      return ['AWS::Test::Performance'];
    }

    protected getMetricsConfig() {
      return [
        {
          name: 'FastMetric',
          namespace: 'AWS/Test',
          unit: 'Count',
          description: 'Fast generation test',
          statistic: 'Average' as const,
          evaluationPeriod: 300 as const,
          category: 'Performance' as const,
          importance: 'High' as const,
          threshold: { base: 100, warningMultiplier: 1.0, criticalMultiplier: 2.0 }
        }
      ];
    }

    protected getResourceScale() {
      return 1.0;
    }
  }

  // 1秒以内生成要件テスト（GREEN段階: 実パフォーマンス確認）
  it('should generate metrics within performance limits', async () => {
    const performanceGenerator = new PerformanceTestGenerator();
    
    const testResource = {
      Type: 'AWS::Test::Performance',
      Properties: {},
      LogicalId: 'PerformanceTestResource'
    };

    const result = await MetricsGenerationMonitor.measureGenerationPerformance(performanceGenerator, testResource);
    
    expect(result.metrics).toHaveLength(1);
    expect(result.stats.generationTimeMs).toBeLessThan(1000); // 1秒以内
    expect(result.performanceGrade).not.toBe('F'); // 要件達成
  });

  // メモリ効率テスト（GREEN段階: リークなし確認）
  it('should generate metrics without memory leaks', async () => {
    const performanceGenerator = new PerformanceTestGenerator();
    const testResource = {
      Type: 'AWS::Test::Performance',
      Properties: {},
      LogicalId: 'MemoryTestResource'
    };

    const memoryBefore = process.memoryUsage().heapUsed;
    
    // 100回生成
    for (let i = 0; i < 100; i++) {
      await performanceGenerator.generate(testResource);
    }
    
    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryDelta = (memoryAfter - memoryBefore) / 1024 / 1024;
    
    expect(memoryDelta).toBeLessThan(5); // メモリ増加5MB以下
  });

  // 並行生成テスト（GREEN段階: 同期安全性確認）
  it('should support concurrent metric generation', async () => {
    const performanceGenerator = new PerformanceTestGenerator();
    const testResources = Array.from({ length: 10 }, (_, i) => ({
      Type: 'AWS::Test::Performance',
      Properties: {},
      LogicalId: `ConcurrentTestResource${i}`
    }));

    // 並行生成
    const promises = testResources.map(resource => 
      performanceGenerator.generate(resource)
    );

    const results = await Promise.all(promises);
    
    // 全て成功し、一貫した結果
    expect(results).toHaveLength(10);
    results.forEach(metrics => {
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toBeDefined();
      if (metrics[0]) {
        expect(metrics[0].metric_name).toBe('FastMetric');
      }
    });
  });

  // パフォーマンス監視テスト（GREEN段階: 監視機能確認）
  it('should provide performance monitoring', async () => {
    const performanceGenerator = new PerformanceTestGenerator();
    
    const testResource = {
      Type: 'AWS::Test::Performance',
      Properties: {},
      LogicalId: 'MonitoringTestResource'
    };

    const result = await MetricsGenerationMonitor.measureGenerationPerformance(performanceGenerator, testResource);
    
    // 統計情報確認
    expect(result.stats.resourceType).toBe('AWS::Test::Performance');
    expect(result.stats.metricsGenerated).toBe(1);
    expect(result.stats.generationTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.stats.averageThresholdWarning).toBeGreaterThan(0);
    expect(result.stats.averageThresholdCritical).toBeGreaterThan(0);
    
    // パフォーマンス評価
    expect(['A', 'B', 'C', 'F']).toContain(result.performanceGrade);
  });
});