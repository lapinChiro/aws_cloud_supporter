// CLAUDE.md準拠BaseMetricsGeneratorテスト（RED段階: SOLID抽象化原則 + Type-Driven）
import { readFileSync } from 'fs';
import path from 'path';

import { BaseMetricsGenerator } from '../../../src/generators/base.generator';
import type { IMetricsGenerator } from '../../../src/interfaces/generator';
import { createLogger } from '../../../src/utils/logger';
import { measureGeneratorPerformance } from '../../helpers';

describe('BaseMetricsGenerator抽象クラス（CLAUDE.md: TDD RED段階）', () => {
  // GREEN段階: BaseMetricsGenerator実装確認
  it('should implement BaseMetricsGenerator successfully', () => {
    expect(() => {
      // Import already done at top level - test the exported class
      expect(BaseMetricsGenerator).toBeDefined();
    }).not.toThrow(); // 実装完了で成功
  });
  // 抽象クラス設計テスト（GREEN段階: 実装確認）
  it('should define proper abstract base class', () => {
    // 抽象クラスが定義されている確認
    expect(BaseMetricsGenerator).toBeDefined();
    expect(typeof BaseMetricsGenerator).toBe('function');
    // 抽象クラスの特性確認（TypeScriptでは実行時チェックなし）
    // 代わりに抽象メソッドの存在を確認
    expect(typeof BaseMetricsGenerator).toBe('function');
  });

  // IMetricsGeneratorインターフェース実装テスト（GREEN段階: インターフェース確認）
  it('should implement IMetricsGenerator interface', () => {
    
    // プロトタイプにgenerateメソッドがあることを確認
    expect(BaseMetricsGenerator.prototype.generate).toBeDefined();
    expect(typeof BaseMetricsGenerator.prototype.generate).toBe('function');
    
    // 抽象メソッドが定義されている確認（実装は子クラスで）
    const prototype = BaseMetricsGenerator.prototype;
    expect(typeof prototype.getSupportedTypes).toBe('undefined'); // 抽象メソッド
  });

  // テスト用具象クラス作成（動作確認用）
  class TestMetricsGenerator extends BaseMetricsGenerator {
    constructor() {
      super(createLogger('error'));
    }

    getSupportedTypes(): string[] {
      return ['AWS::Test::Resource'];
    }

    protected getMetricsConfig() {
      return [
        {
          name: 'TestMetric',
          namespace: 'AWS/Test',
          unit: 'Count',
          description: 'Test metric',
          statistic: 'Average' as const,
          evaluationPeriod: 300 as const,
          category: 'Performance' as const,
          importance: 'High' as const,
          threshold: {
            base: 100,
            warningMultiplier: 1.0,
            criticalMultiplier: 1.5
          }
        }
      ];
    }

    protected getResourceScale() {
      return 1.0;
    }
  }

  // 動的しきい値計算テスト（GREEN段階: 計算確認）
  it('should calculate dynamic thresholds correctly', async () => {
    const testGenerator = new TestMetricsGenerator();
    const testResource = {
      Type: 'AWS::Test::Resource',
      Properties: {},
      LogicalId: 'TestResource'
    };

    const metrics = await testGenerator.generate(testResource);
    
    expect(metrics).toHaveLength(1);
    const metric = metrics[0];
    
    // しきい値計算確認
    expect(metric?.recommended_threshold).toHaveValidThreshold();
    expect(metric?.recommended_threshold.warning).toBe(100); // 100 * 1.0 * 1.0
    expect(metric?.recommended_threshold.critical).toBe(150); // 100 * 1.0 * 1.5
  });

  // リソーススケール係数計算テスト（GREEN段階: スケール反映確認）
  it('should compute resource scale factors', async () => {
    // スケール係数2.0のテストジェネレータ
    class ScaledTestGenerator extends TestMetricsGenerator {
      protected override getResourceScale() {
        return 2.0; // 2倍スケール
      }
    }

    const scaledGenerator = new ScaledTestGenerator();
    const testResource = {
      Type: 'AWS::Test::Resource',
      Properties: {},
      LogicalId: 'ScaledTestResource'
    };

    const metrics = await scaledGenerator.generate(testResource);
    const metric = metrics[0];
    
    // スケール係数が反映されている確認
    expect(metric?.recommended_threshold.warning).toBe(200); // 100 * 2.0 * 1.0
    expect(metric?.recommended_threshold.critical).toBe(300); // 100 * 2.0 * 1.5
  });

  // メトリクス生成パフォーマンステスト（GREEN段階: 性能確認）
  it('should generate metrics within 1 second', async () => {
    const testGenerator = new TestMetricsGenerator();
    const testResource = {
      Type: 'AWS::Test::Resource',
      Properties: {},
      LogicalId: 'PerformanceTestResource'
    };

    const { metrics } = await measureGeneratorPerformance(testGenerator as unknown as IMetricsGenerator, testResource);
    
    expect(metrics).toHaveLength(1);
  });

  // 適用可能メトリクス判定テスト（GREEN段階: フィルタリング確認）
  it('should filter applicable metrics correctly', async () => {
    // 条件付きメトリクス用テストジェネレータ
    class ConditionalTestGenerator extends TestMetricsGenerator {
      protected override getMetricsConfig() {
        return [
          {
            name: 'AlwaysApplicable',
            namespace: 'AWS/Test',
            unit: 'Count',
            description: 'Always applicable metric',
            statistic: 'Average' as const,
            evaluationPeriod: 300 as const,
            category: 'Performance' as const,
            importance: 'High' as const,
            threshold: { base: 50, warningMultiplier: 1.0, criticalMultiplier: 2.0 }
          },
          {
            name: 'ConditionalMetric',
            namespace: 'AWS/Test',
            unit: 'Count',
            description: 'Conditional metric',
            statistic: 'Average' as const,
            evaluationPeriod: 300 as const,
            category: 'Performance' as const,
            importance: 'High' as const,
            threshold: { base: 75, warningMultiplier: 1.0, criticalMultiplier: 2.0 },
            applicableWhen: (resource: unknown) => {
              return (resource as { LogicalId?: string }).LogicalId === 'ConditionalTestResource';
            }
          }
        ];
      }
    }

    const conditionalGenerator = new ConditionalTestGenerator();
    
    // 条件に合致するリソース
    const matchingResource = {
      Type: 'AWS::Test::Resource',
      Properties: {},
      LogicalId: 'ConditionalTestResource'
    };

    const matchingMetrics = await conditionalGenerator.generate(matchingResource);
    expect(matchingMetrics).toHaveLength(2); // 両方適用
    
    // 条件に合致しないリソース
    const nonMatchingResource = {
      Type: 'AWS::Test::Resource',
      Properties: {},
      LogicalId: 'NonMatchingResource'
    };

    const nonMatchingMetrics = await conditionalGenerator.generate(nonMatchingResource);
    expect(nonMatchingMetrics).toHaveLength(1); // 条件なしのみ適用
  });

  // CloudWatchディメンション構築テスト（GREEN段階: AWS仕様準拠確認）
  it('should build CloudWatch dimensions properly', async () => {
    const testGenerator = new TestMetricsGenerator();
    const testResource = {
      Type: 'AWS::Test::Resource',
      Properties: {},
      LogicalId: 'DimensionTestResource'
    };

    const metrics = await testGenerator.generate(testResource);
    const metric = metrics[0];
    
    // ディメンション構築確認
    expect(metric?.dimensions).toBeDefined();
    expect(metric?.dimensions).toHaveLength(1);

    if (metric?.dimensions && metric.dimensions.length > 0) {
      const dimension = metric.dimensions[0];
      expect(dimension?.name).toBe('ResourceId'); // Test::Resourceはマップにないのでデフォルト
      expect(dimension?.value).toBe('DimensionTestResource');
    }
  });

  // CLAUDE.md: No any types検証
  it('should not use any types in base generator implementation', () => {
    const baseGeneratorCode = readFileSync(
      path.join(__dirname, '../../../src/generators/base.generator.ts'),
      'utf8'
    );
    expect(baseGeneratorCode).toHaveNoAnyTypes();
  });

  // 抽象メソッド定義テスト（GREEN段階: 必須メソッド確認）
  it('should define required abstract methods', () => {
    
    // 抽象クラス自体にはない（子クラスで実装）
    expect(BaseMetricsGenerator.prototype.getSupportedTypes).toBeUndefined();
    expect((BaseMetricsGenerator.prototype as unknown as Record<string, unknown>).getMetricsConfig).toBeUndefined();
    expect((BaseMetricsGenerator.prototype as unknown as Record<string, unknown>).getResourceScale).toBeUndefined();
    
    // 具象実装を持つメソッド
    expect(BaseMetricsGenerator.prototype.generate).toBeDefined();
  });

  // エラーハンドリング統合テスト（GREEN段階: CloudSupporterError統合確認）
  it('should integrate with CloudSupporterError system', async () => {
    const testGenerator = new TestMetricsGenerator();
    const invalidResource = {
      Type: 'AWS::Invalid::Resource', // サポート対象外
      Properties: {},
      LogicalId: 'InvalidResource'
    };

    // サポート対象外リソースでエラー
    try {
      await testGenerator.generate(invalidResource);
      fail('Should have thrown an error');
    } catch (error) {
      const err = error as { type: string; message: string };
      expect(err.type).toBe('RESOURCE_ERROR');
      expect(err.message).toContain('Unsupported resource type');
    }
  });
});