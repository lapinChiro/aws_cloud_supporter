// TASK-005: アラーム生成数制限機能のテスト
import { BaseMetricsGenerator } from '../../../src/generators/base.generator';
import type { ILogger } from '../../../src/interfaces/logger';
import { getMaxAlarmsPerResource, DEFAULT_MAX_ALARMS_PER_RESOURCE } from '../../../src/types';
import type { CloudFormationResource } from '../../../src/types/cloudformation';
import type { MetricConfig } from '../../../src/types/metrics';

// テスト用のジェネレータ実装
class TestLimitedGenerator extends BaseMetricsGenerator {
  getSupportedTypes(): string[] {
    return ['AWS::Test::Resource'];
  }

  protected getMetricsConfig(_resource: CloudFormationResource): MetricConfig[] {
    // 30個のメトリクスを生成（制限をテストするため）
    const configs: MetricConfig[] = [];
    
    // High: 10個
    for (let i = 0; i < 10; i++) {
      configs.push({
        name: `HighMetric${i}`,
        namespace: 'AWS/Test',
        unit: 'Count',
        description: `High priority metric ${i}`,
        statistic: 'Average',
        evaluationPeriod: 300,
        category: 'Performance',
        importance: 'High',
        threshold: {
          base: 100,
          warningMultiplier: 0.8,
          criticalMultiplier: i % 2 === 0 ? 0.9 : 0.95 // 異なるcritical値を設定
        }
      });
    }
    
    // Medium: 10個
    for (let i = 0; i < 10; i++) {
      configs.push({
        name: `MediumMetric${i}`,
        namespace: 'AWS/Test',
        unit: 'Count',
        description: `Medium priority metric ${i}`,
        statistic: 'Average',
        evaluationPeriod: 300,
        category: 'Performance',
        importance: 'Medium',
        threshold: {
          base: 100,
          warningMultiplier: 0.8,
          criticalMultiplier: i % 2 === 0 ? 0.9 : 0.95
        }
      });
    }
    
    // Low: 10個
    for (let i = 0; i < 10; i++) {
      configs.push({
        name: `LowMetric${i}`,
        namespace: 'AWS/Test',
        unit: 'Count',
        description: `Low priority metric ${i}`,
        statistic: 'Average',
        evaluationPeriod: 300,
        category: 'Performance',
        importance: 'Low',
        threshold: {
          base: 100,
          warningMultiplier: 0.8,
          criticalMultiplier: i % 2 === 0 ? 0.9 : 0.95
        }
      });
    }
    
    return configs;
  }

  protected getResourceScale(_resource: CloudFormationResource): number {
    return 1;
  }
}

describe('Alarm Generation Limit Feature (TASK-005)', () => {
  let mockLogger: jest.Mocked<ILogger>;
  let generator: TestLimitedGenerator;
  
  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      success: jest.fn(),
      setLevel: jest.fn()
    } satisfies jest.Mocked<ILogger>;
    
    generator = new TestLimitedGenerator(mockLogger);
    
    // 環境変数をクリア
    delete process.env.MAX_ALARMS_PER_RESOURCE;
  });
  
  afterEach(() => {
    delete process.env.MAX_ALARMS_PER_RESOURCE;
  });

  it('should respect default limit of 20 alarms per resource', async () => {
    const resource: CloudFormationResource = {
      Type: 'AWS::Test::Resource',
      Properties: {}
    };
    
    const metrics = await generator.generate(resource);
    
    expect(metrics.length).toBe(20);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Limited metrics from 30 to 20 (dropped 10 lower priority metrics)'
    );
  });

  it('should prioritize High > Medium > Low importance', async () => {
    const resource: CloudFormationResource = {
      Type: 'AWS::Test::Resource',
      Properties: {}
    };
    
    const metrics = await generator.generate(resource);
    
    // 最初の10個はHigh、次の10個はMedium
    const highMetrics = metrics.filter(m => m.importance === 'High');
    const mediumMetrics = metrics.filter(m => m.importance === 'Medium');
    const lowMetrics = metrics.filter(m => m.importance === 'Low');
    
    expect(highMetrics.length).toBe(10); // 全てのHighメトリクスが含まれる
    expect(mediumMetrics.length).toBe(10); // 全てのMediumメトリクスが含まれる
    expect(lowMetrics.length).toBe(0); // Lowメトリクスは除外される
  });

  it('should sort by critical threshold within same importance', async () => {
    const resource: CloudFormationResource = {
      Type: 'AWS::Test::Resource',
      Properties: {}
    };
    
    const metrics = await generator.generate(resource);
    
    // High importanceメトリクスの中でcritical値でソートされているか確認
    const highMetrics = metrics.filter(m => m.importance === 'High');
    for (let i = 1; i < highMetrics.length; i++) {
      expect(highMetrics[i-1]?.recommended_threshold.critical)
        .toBeGreaterThanOrEqual(highMetrics[i]?.recommended_threshold.critical ?? Infinity);
    }
  });

  it('should respect custom limit from environment variable', async () => {
    process.env.MAX_ALARMS_PER_RESOURCE = '5';
    
    const resource: CloudFormationResource = {
      Type: 'AWS::Test::Resource',
      Properties: {}
    };
    
    const metrics = await generator.generate(resource);
    
    expect(metrics.length).toBe(5);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Limited metrics from 30 to 5 (dropped 25 lower priority metrics)'
    );
    
    // 上位5個のメトリクスのみが含まれる
    expect(metrics.every(m => m.importance === 'High')).toBe(true);
  });

  it('should return all metrics when below limit', async () => {
    // 少ないメトリクスを生成するジェネレータ
    class SmallGenerator extends BaseMetricsGenerator {
      getSupportedTypes(): string[] {
        return ['AWS::Test::Small'];
      }
      
      protected getMetricsConfig(_resource: CloudFormationResource): MetricConfig[] {
        return Array.from({ length: 5 }, (_, i) => ({
          name: `Metric${i}`,
          namespace: 'AWS/Test',
          unit: 'Count',
          description: `Test metric ${i}`,
          statistic: 'Average' as const,
          evaluationPeriod: 300 as const,
          category: 'Performance' as const,
          importance: 'High' as const,
          threshold: {
            base: 100,
            warningMultiplier: 0.8,
            criticalMultiplier: 0.9
          }
        }));
      }
      
      protected getResourceScale(): number {
        return 1;
      }
    }
    
    const smallGenerator = new SmallGenerator(mockLogger);
    const resource: CloudFormationResource = {
      Type: 'AWS::Test::Small',
      Properties: {}
    };
    
    const metrics = await smallGenerator.generate(resource);
    
    expect(metrics.length).toBe(5);
    // 制限メッセージは出力されない
    expect(mockLogger.info).not.toHaveBeenCalledWith(
      expect.stringContaining('Limited metrics')
    );
  });

  it('should handle invalid environment variable gracefully', async () => {
    process.env.MAX_ALARMS_PER_RESOURCE = 'invalid';
    
    const resource: CloudFormationResource = {
      Type: 'AWS::Test::Resource',
      Properties: {}
    };
    
    const metrics = await generator.generate(resource);
    
    // デフォルト値にフォールバック
    expect(metrics.length).toBe(DEFAULT_MAX_ALARMS_PER_RESOURCE);
  });

  it('should handle zero or negative environment variable', () => {
    process.env.MAX_ALARMS_PER_RESOURCE = '0';
    
    expect(getMaxAlarmsPerResource()).toBe(DEFAULT_MAX_ALARMS_PER_RESOURCE);
    
    process.env.MAX_ALARMS_PER_RESOURCE = '-10';
    
    expect(getMaxAlarmsPerResource()).toBe(DEFAULT_MAX_ALARMS_PER_RESOURCE);
  });
});