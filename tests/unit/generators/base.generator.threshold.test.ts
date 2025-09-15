// CLAUDE.md準拠BaseMetricsGenerator動的しきい値テスト
import { BaseMetricsGenerator } from '../../../src/generators/base.generator';
import { createLogger } from '../../../src/utils/logger';

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
    expect(metric?.recommended_threshold.critical).toBeGreaterThan(metric?.recommended_threshold.warning ?? Infinity);
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