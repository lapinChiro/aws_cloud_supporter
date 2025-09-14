// CLAUDE.md準拠BaseMetricsGenerator型安全性テスト
import { BaseMetricsGenerator, validateMetricDefinition } from '../../../src/generators/base.generator';
import { createLogger } from '../../../src/utils/logger';

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
    expect(metrics[0]).toBeDefined();
    if (metrics[0]) {
      expect(metrics[0].metric_name).toBe('TypeSafeMetric');
    }
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
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toBeDefined();
    
    const metric = metrics[0];
    
    if (metric) {
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
        const dimension = metric.dimensions[0];
        expect(dimension).toBeDefined();
        if (dimension) {
          expect(typeof dimension.name).toBe('string');
          expect(typeof dimension.value).toBe('string');
        }
      }
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
    expect(metrics[0]).toBeDefined();
    
    const metric = metrics[0];
    
    if (metric) {
      // MetricConfig→MetricDefinition変換の型安全性
      expect(metric.metric_name).toBe('TypeSafeMetric');
      expect(metric.namespace).toBe('AWS/Test');
      expect(metric.unit).toBe('Count');
      expect(metric.statistic).toBe('Average');
      expect(metric.category).toBe('Performance');
      expect(metric.importance).toBe('High');
    }
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
    expect(metrics[0]).toBeDefined();
    if (metrics[0]) {
      expect(metrics[0].metric_name).toBe('ConditionalTypeSafeMetric');
    }
  });
});