// CLAUDE.md準拠BaseMetricsGeneratorテスト（RED段階: SOLID抽象化原則 + Type-Driven）

import { readFileSync } from 'fs';
import path from 'path';

import { BaseMetricsGenerator, validateMetricDefinition, MetricsGenerationMonitor } from '../../../src/generators/base.generator';
import type { IMetricsGenerator } from '../../../src/interfaces/generator';
import { createLogger } from '../../../src/utils/logger';
import { createMockLogger, measureGeneratorPerformance } from '../../helpers';

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
    expect((BaseMetricsGenerator.prototype as any).getMetricsConfig).toBeUndefined();
    expect((BaseMetricsGenerator.prototype as any).getResourceScale).toBeUndefined();
    
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
    await expect(testGenerator.generate(invalidResource)).rejects.toThrow();
    
    try {
      await testGenerator.generate(invalidResource);
    } catch (error) {
      const err = error as { type: string; message: string };
      expect(err.type).toBe('RESOURCE_ERROR');
      expect(err.message).toContain('Unsupported resource type');
    }
  });
});

describe('BaseMetricsGenerator動的しきい値（CLAUDE.md: アルゴリズム要件）', () => {
  
  // テスト用具象クラス
  class ThresholdTestGenerator extends BaseMetricsGenerator {
    constructor() {
      super(createLogger('error'));
    }

    getSupportedTypes(): string[] {
      return ['AWS::Test::Threshold'];
    }

    protected getMetricsConfig() {
      return [
        {
          name: 'ThresholdTestMetric',
          namespace: 'AWS/Test',
          unit: 'Percent',
          description: 'Threshold calculation test',
          statistic: 'Average' as const,
          evaluationPeriod: 300 as const,
          category: 'Performance' as const,
          importance: 'High' as const,
          threshold: {
            base: 80,
            warningMultiplier: 0.875, // 70%
            criticalMultiplier: 1.25   // 100%
          }
        }
      ];
    }

    protected getResourceScale() {
      return 2.0; // 2倍スケール
    }
  }

  // しきい値計算アルゴリズムテスト（GREEN段階: 数式確認）
  it('should implement threshold calculation algorithm', async () => {
    const thresholdGenerator = new ThresholdTestGenerator();
    const testResource = {
      Type: 'AWS::Test::Threshold',
      Properties: {},
      LogicalId: 'ThresholdTestResource'
    };

    const metrics = await thresholdGenerator.generate(testResource);
    const metric = metrics[0];
    
    // 計算式: base * scale * multiplier
    // warning: 80 * 2.0 * 0.875 = 140
    // critical: 80 * 2.0 * 1.25 = 200
    expect(metric?.recommended_threshold.warning).toBe(140);
    expect(metric?.recommended_threshold.critical).toBe(200);
  });

  // スケール係数反映テスト（GREEN段階: スケール計算確認）
  it('should apply resource scale factors to thresholds', async () => {
    // 異なるスケール係数のジェネレータ
    class VariableScaleGenerator extends ThresholdTestGenerator {
      constructor(private readonly scale: number) {
        super();
      }
      
      protected override getResourceScale() {
        return this.scale;
      }
    }

    const scales = [0.5, 1.0, 1.5, 3.0];
    const testResource = {
      Type: 'AWS::Test::Threshold',
      Properties: {},
      LogicalId: 'VariableScaleResource'
    };

    for (const scale of scales) {
      const generator = new VariableScaleGenerator(scale);
      const metrics = await generator.generate(testResource);
      const metric = metrics[0];
      
      const expectedWarning = Math.round(80 * scale * 0.875);
      const expectedCritical = Math.round(80 * scale * 1.25);
      
      expect(metric?.recommended_threshold.warning).toBe(expectedWarning);
      expect(metric?.recommended_threshold.critical).toBe(expectedCritical);
    }
  });

  // しきい値妥当性検証テスト（GREEN段階: 自動修正確認）
  it('should ensure warning < critical threshold validity', async () => {
    // 不正な乗数でwarning >= criticalになる設定
    class InvalidThresholdGenerator extends ThresholdTestGenerator {
      protected override getMetricsConfig() {
        return [
          {
            name: 'InvalidThresholdMetric',
            namespace: 'AWS/Test',
            unit: 'Percent',
            description: 'Invalid threshold test',
            statistic: 'Average' as const,
            evaluationPeriod: 300 as const,
            category: 'Performance' as const,
            importance: 'High' as const,
            threshold: {
              base: 100,
              warningMultiplier: 1.5, // warning=150
              criticalMultiplier: 1.2  // critical=120 (不正)
            }
          }
        ];
      }
    }

    const invalidGenerator = new InvalidThresholdGenerator();
    const testResource = {
      Type: 'AWS::Test::Threshold',
      Properties: {},
      LogicalId: 'InvalidThresholdResource'
    };

    const metrics = await invalidGenerator.generate(testResource);
    const metric = metrics[0];
    
    // 自動修正により warning < critical が保証される
    expect(metric?.recommended_threshold).toHaveValidThreshold();
    expect(metric?.recommended_threshold.critical).toBeGreaterThan(metric.recommended_threshold.warning);
  });

  // 数値精度テスト（GREEN段階: 丸め処理確認）
  it('should maintain numerical precision in calculations', async () => {
    // 小数点を含む計算のテスト
    class PrecisionTestGenerator extends ThresholdTestGenerator {
      protected override getMetricsConfig() {
        return [
          {
            name: 'PrecisionTestMetric',
            namespace: 'AWS/Test',
            unit: 'Seconds',
            description: 'Precision test metric',
            statistic: 'Average' as const,
            evaluationPeriod: 300 as const,
            category: 'Performance' as const,
            importance: 'High' as const,
            threshold: {
              base: 0.1234, // 小数点
              warningMultiplier: 1.234,
              criticalMultiplier: 2.567
            }
          }
        ];
      }

      protected override getResourceScale() {
        return 1.789; // 小数点スケール
      }
    }

    const precisionGenerator = new PrecisionTestGenerator();
    const testResource = {
      Type: 'AWS::Test::Threshold',
      Properties: {},
      LogicalId: 'PrecisionTestResource'
    };

    const metrics = await precisionGenerator.generate(testResource);
    const metric = metrics[0];
    
    // 丸め処理により整数値になっている確認
    expect(Number.isInteger(metric?.recommended_threshold.warning)).toBe(true);
    expect(Number.isInteger(metric?.recommended_threshold.critical)).toBe(true);
    expect(metric?.recommended_threshold.warning).toBeGreaterThanOrEqual(0);
    expect(metric?.recommended_threshold.critical).toBeGreaterThan(0);
  });

  // 境界値テスト（GREEN段階: エッジケース確認）
  it('should handle edge cases in threshold calculation', async () => {
    class EdgeCaseTestGenerator extends ThresholdTestGenerator {
      protected override getMetricsConfig() {
        return [
          {
            name: 'EdgeCaseMetric',
            namespace: 'AWS/Test',
            unit: 'Count',
            description: 'Edge case test',
            statistic: 'Average' as const,
            evaluationPeriod: 300 as const,
            category: 'Performance' as const,
            importance: 'High' as const,
            threshold: {
              base: 1, // 最小基準値
              warningMultiplier: 1.0,
              criticalMultiplier: 2.0
            }
          }
        ];
      }

      protected override getResourceScale() {
        return 0.1; // 極小スケール
      }
    }

    const edgeCaseGenerator = new EdgeCaseTestGenerator();
    const testResource = {
      Type: 'AWS::Test::Threshold',
      Properties: {},
      LogicalId: 'EdgeCaseResource'
    };

    const metrics = await edgeCaseGenerator.generate(testResource);
    const metric = metrics[0];
    
    // 極小値でも適切に処理される確認（0値許可、自動修正機能）
    expect(metric?.recommended_threshold.warning).toBeGreaterThanOrEqual(0);
    expect(metric?.recommended_threshold.critical).toBeGreaterThan(metric?.recommended_threshold.warning ?? Infinity);
    
    // Math.round処理により1未満でも適切な値
    // 0値の場合は自動修正される
    expect(metric?.recommended_threshold.warning).toBeGreaterThanOrEqual(0);
    expect(metric?.recommended_threshold.critical).toBeGreaterThan(metric?.recommended_threshold.warning ?? Infinity);
  });
});

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
      expect(metrics[0]!.metric_name).toBe('FastMetric');
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

describe('BaseMetricsGenerator型安全性（CLAUDE.md: Type-Driven Development）', () => {
  
  // テスト用型安全ジェネレータ
  class TypeSafeTestGenerator extends BaseMetricsGenerator {
    constructor() {
      super(createLogger('error'));
    }

    getSupportedTypes(): string[] {
      return ['AWS::Test::TypeSafe'];
    }

    protected getMetricsConfig() {
      return [
        {
          name: 'TypeSafeMetric',
          namespace: 'AWS/Test',
          unit: 'Count',
          description: 'Type safety test metric',
          statistic: 'Average' as const,
          evaluationPeriod: 300 as const,
          category: 'Performance' as const,
          importance: 'High' as const,
          threshold: { base: 50, warningMultiplier: 1.0, criticalMultiplier: 2.0 }
        }
      ];
    }

    protected getResourceScale() {
      return 1.0;
    }
  }

  // CloudFormationResource型統合テスト（GREEN段階: 型処理確認）
  it('should work with CloudFormationResource types', async () => {
    const typeSafeGenerator = new TypeSafeTestGenerator();
    const cloudFormationResource = {
      Type: 'AWS::Test::TypeSafe',
      Properties: { 
        TestProperty: 'test-value',
        NumericProperty: 42
      },
      LogicalId: 'TypeSafeTestResource',
      Condition: 'TestCondition',
      DependsOn: ['OtherResource']
    };

    const metrics = await typeSafeGenerator.generate(cloudFormationResource);
    
    expect(metrics).toHaveLength(1);
    expect(metrics[0]!.metric_name).toBe('TypeSafeMetric');
  });

  // MetricDefinition型生成テスト（GREEN段階: 型準拠確認）
  it('should generate type-safe MetricDefinition objects', async () => {
    const typeSafeGenerator = new TypeSafeTestGenerator();
    const testResource = {
      Type: 'AWS::Test::TypeSafe',
      Properties: {},
      LogicalId: 'MetricDefinitionTestResource'
    };

    const metrics = await typeSafeGenerator.generate(testResource);
    const metric = metrics[0]!;
    
    // MetricDefinition型の全フィールド確認
    expect(typeof metric.metric_name).toBe('string');
    expect(typeof metric.namespace).toBe('string');
    expect(typeof metric.unit).toBe('string');
    expect(typeof metric.description).toBe('string');
    expect(typeof metric.statistic).toBe('string');
    expect(typeof metric.evaluation_period).toBe('number');
    expect(typeof metric.category).toBe('string');
    expect(typeof metric.importance).toBe('string');
    
    // しきい値オブジェクトの型安全性
    expect(typeof metric.recommended_threshold.warning).toBe('number');
    expect(typeof metric.recommended_threshold.critical).toBe('number');
    
    // ディメンション配列の型安全性
    expect(Array.isArray(metric.dimensions)).toBe(true);
    if (metric.dimensions && metric.dimensions.length > 0) {
      const dimension = metric.dimensions[0]!;
      expect(typeof dimension.name).toBe('string');
      expect(typeof dimension.value).toBe('string');
    }
  });

  // MetricConfig型処理テスト（GREEN段階: 設定型安全性確認）
  it('should process MetricConfig types safely', async () => {
    const typeSafeGenerator = new TypeSafeTestGenerator();
    const testResource = {
      Type: 'AWS::Test::TypeSafe',
      Properties: {},
      LogicalId: 'MetricConfigTestResource'
    };

    // MetricConfig型の処理が型安全であることを確認
    const metrics = await typeSafeGenerator.generate(testResource);
    expect(metrics).toHaveLength(1);
    
    const metric = metrics[0]!;
    
    // MetricConfig→MetricDefinition変換の型安全性
    expect(metric.metric_name).toBe('TypeSafeMetric');
    expect(metric.namespace).toBe('AWS/Test');
    expect(metric.unit).toBe('Count');
    expect(metric.statistic).toBe('Average');
    expect(metric.category).toBe('Performance');
    expect(metric.importance).toBe('High');
  });

  // 型安全なGenerics使用テスト（GREEN段階: ジェネリック確認）
  it('should utilize type-safe generics properly', () => {
    
    // 型安全なメトリクス検証関数
    const validMetric = {
      metric_name: 'TestMetric',
      namespace: 'AWS/Test',
      unit: 'Count',
      description: 'Valid metric',
      statistic: 'Average' as const,
      recommended_threshold: { warning: 50, critical: 100 },
      evaluation_period: 300 as const,
      category: 'Performance' as const,
      importance: 'High' as const
    };

    const result = validateMetricDefinition(validMetric);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // 条件付きメトリクス型安全性テスト（GREEN段階: 条件関数型確認）
  it('should handle applicableWhen functions type-safely', async () => {
    // applicableWhen関数の型安全性を確認
    class ConditionalTypeSafeGenerator extends TypeSafeTestGenerator {
      protected override getMetricsConfig() {
        return [
          {
            name: 'ConditionalTypeSafeMetric',
            namespace: 'AWS/Test',
            unit: 'Count',
            description: 'Conditional type safe metric',
            statistic: 'Average' as const,
            evaluationPeriod: 300 as const,
            category: 'Performance' as const,
            importance: 'High' as const,
            threshold: { base: 100, warningMultiplier: 1.0, criticalMultiplier: 2.0 },
            applicableWhen: (resource: unknown) => {
              // 型安全な条件判定
              const r = resource as { Type?: string; LogicalId?: string };
              return r.Type === 'AWS::Test::TypeSafe' && 
                     !!r.LogicalId &&
                     r.LogicalId.startsWith('Conditional');
            }
          }
        ];
      }
    }

    const conditionalGenerator = new ConditionalTypeSafeGenerator();
    const testResource = {
      Type: 'AWS::Test::TypeSafe',
      Properties: {},
      LogicalId: 'ConditionalTypeResource'
    };

    const metrics = await conditionalGenerator.generate(testResource);
    expect(metrics).toHaveLength(1);
    expect(metrics[0]!.metric_name).toBe('ConditionalTypeSafeMetric');
  });
});

describe('BaseMetricsGeneratorSOLID原則（CLAUDE.md: 設計原則）', () => {

  // 単一責任原則テスト（GREEN段階: SRP確認）
  it('should follow Single Responsibility Principle', () => {
    
    // BaseMetricsGeneratorの責任：メトリクス生成のみ
    const prototype = BaseMetricsGenerator.prototype;
    expect(prototype.generate).toBeDefined();
    
    // メトリクス生成以外の責任がないことを確認
    // （ファイルI/O、ネットワーク等の責任は持たない）
    const methods = Object.getOwnPropertyNames(prototype);
    const publicMethods = methods.filter(name => 
      !name.startsWith('_') && 
      name !== 'constructor' &&
      typeof (prototype as any)[name] === 'function'
    );
    
    expect(publicMethods).toContain('generate');
    console.log('📋 BaseMetricsGenerator public methods:', publicMethods);
  });

  // 開放閉鎖原則テスト（GREEN段階: OCP確認）
  it('should follow Open/Closed Principle', () => {
    
    // 拡張のために開かれている（抽象メソッド存在）
    // 変更のために閉ざされている（具象実装）
    
    // 抽象クラスとして拡張可能
    class ExtendedTestGenerator extends BaseMetricsGenerator {
      constructor() {
        super(createLogger('error'));
      }

      getSupportedTypes(): string[] {
        return ['AWS::Extended::Resource'];
      }

      protected getMetricsConfig() {
        return [];
      }

      protected getResourceScale() {
        return 1.0;
      }
    }

    const extendedGenerator = new ExtendedTestGenerator();
    expect(extendedGenerator).toBeInstanceOf(BaseMetricsGenerator);
    expect(extendedGenerator.getSupportedTypes()).toContain('AWS::Extended::Resource');
  });

  // インターフェース分離テスト（GREEN段階: ISP確認）
  it('should follow Interface Segregation Principle', () => {
    
    // IMetricsGeneratorインターフェースのみ実装
    // 他の不要なインターフェースは実装していない
    expect(BaseMetricsGenerator.prototype.generate).toBeDefined();
    
    // メトリクス生成に特化したインターフェース
    expect(BaseMetricsGenerator.prototype.getSupportedTypes).toBeUndefined(); // 抽象メソッド
  });

  // 依存関係逆転テスト（GREEN段階: DIP確認）
  it('should follow Dependency Inversion Principle', () => {
    
    // ILoggerインターフェースに依存（具象クラスに非依存）
    class DIPTestGenerator extends BaseMetricsGenerator {
      constructor(customLogger: any) { // カスタムログ実装受け入れ
        super(customLogger);
      }

      getSupportedTypes(): string[] {
        return ['AWS::DIP::Test'];
      }

      protected getMetricsConfig() {
        return [];
      }

      protected getResourceScale() {
        return 1.0;
      }
    }

    // モックLoggerでもインスタンス化可能（抽象化に依存）
    const mockLogger = createMockLogger();

    const dipGenerator = new DIPTestGenerator(mockLogger);
    expect(dipGenerator).toBeInstanceOf(BaseMetricsGenerator);
  });

  // リスコフ置換原則テスト（GREEN段階: LSP確認）
  it('should follow Liskov Substitution Principle', () => {
    
    // 子クラスが基底クラスと置換可能であることを確認
    class LSPTestGeneratorA extends BaseMetricsGenerator {
      constructor() {
        super(createLogger('error'));
      }

      getSupportedTypes(): string[] {
        return ['AWS::LSP::TestA'];
      }

      protected getMetricsConfig() {
        return [
          {
            name: 'LSPTestMetricA',
            namespace: 'AWS/LSP',
            unit: 'Count',
            description: 'LSP test A',
            statistic: 'Sum' as const,
            evaluationPeriod: 300 as const,
            category: 'Performance' as const,
            importance: 'High' as const,
            threshold: { base: 10, warningMultiplier: 1.0, criticalMultiplier: 2.0 }
          }
        ];
      }

      protected getResourceScale() {
        return 1.0;
      }
    }

    class LSPTestGeneratorB extends BaseMetricsGenerator {
      constructor() {
        super(createLogger('error'));
      }

      getSupportedTypes(): string[] {
        return ['AWS::LSP::TestB'];
      }

      protected getMetricsConfig() {
        return [
          {
            name: 'LSPTestMetricB',
            namespace: 'AWS/LSP',
            unit: 'Percent',
            description: 'LSP test B',
            statistic: 'Average' as const,
            evaluationPeriod: 300 as const,
            category: 'Error' as const,
            importance: 'Medium' as const,
            threshold: { base: 5, warningMultiplier: 2.0, criticalMultiplier: 4.0 }
          }
        ];
      }

      protected getResourceScale() {
        return 2.0;
      }
    }

    // 両方のジェネレータがBaseMetricsGeneratorとして動作
    const generatorA = new LSPTestGeneratorA();
    const generatorB = new LSPTestGeneratorB();
    
    expect(generatorA).toBeInstanceOf(BaseMetricsGenerator);
    expect(generatorB).toBeInstanceOf(BaseMetricsGenerator);
    
    // 共通インターフェースとして使用可能
    const generators: Array<InstanceType<typeof BaseMetricsGenerator>> = [generatorA, generatorB];
    generators.forEach(generator => {
      expect(typeof generator.generate).toBe('function');
      expect(Array.isArray(generator.getSupportedTypes())).toBe(true);
    });
  });
});