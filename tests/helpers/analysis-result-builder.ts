// AnalysisResult Builder Pattern for Tests
// CLAUDE.md準拠: DRY原則・Builder Pattern

import type { ExtendedAnalysisResult, PerformanceMetrics, AnalysisError } from '../../src/interfaces/analyzer';
import type {
  AnalysisResult,
  AnalysisMetadata,
  ResourceWithMetrics,
  MetricDefinition,
  MetricDimension
} from '../../src/types/metrics';

/**
 * AnalysisResult Builder
 * ビルダーパターンによるテスト用AnalysisResult生成
 */
export class AnalysisResultBuilder {
  private metadata: AnalysisMetadata;
  private readonly resources: ResourceWithMetrics[] = [];
  private readonly unsupportedResources: string[] = [];
  private performanceMetrics?: PerformanceMetrics;
  private errors?: AnalysisError[];

  constructor() {
    // デフォルトのメタデータ
    this.metadata = {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: '/test/template.yaml',
      total_resources: 0,
      supported_resources: 0,
      processing_time_ms: 100
    };
  }

  /**
   * メタデータを設定
   */
  withMetadata(partial: Partial<AnalysisMetadata>): this {
    this.metadata = { ...this.metadata, ...partial };
    return this;
  }

  /**
   * リソースを追加
   */
  addResource(resource: ResourceWithMetrics): this {
    this.resources.push(resource);
    this.metadata.total_resources = this.resources.length + this.unsupportedResources.length;
    this.metadata.supported_resources = this.resources.length;
    return this;
  }

  /**
   * 簡単なリソースを追加（デフォルト値付き）
   */
  addSimpleResource(
    logicalId: string,
    resourceType: string,
    metrics?: Array<Partial<MetricDefinition>>
  ): this {
    const defaultMetric: MetricDefinition = {
      metric_name: 'CPUUtilization',
      namespace: 'AWS/RDS',
      unit: 'Percent',
      description: 'CPU utilization',
      statistic: 'Average',
      recommended_threshold: { warning: 70, critical: 90 },
      evaluation_period: 300,
      category: 'Performance',
      importance: 'High',
      dimensions: []
    };

    const resourceMetrics: MetricDefinition[] = metrics
      ? metrics.map(m => ({ ...defaultMetric, ...m }))
      : [defaultMetric];

    return this.addResource({
      logical_id: logicalId,
      resource_type: resourceType,
      resource_properties: {},
      metrics: resourceMetrics
    });
  }

  /**
   * RDS リソースを追加
   */
  addRDSResource(logicalId: string, engineType: string = 'mysql'): this {
    return this.addResource({
      logical_id: logicalId,
      resource_type: 'AWS::RDS::DBInstance',
      resource_properties: { Engine: engineType },
      metrics: [
        this.createMetric('CPUUtilization', 'AWS/RDS', 'Percent'),
        this.createMetric('DatabaseConnections', 'AWS/RDS', 'Count')
      ]
    });
  }

  /**
   * Lambda リソースを追加
   */
  addLambdaResource(logicalId: string, runtime: string = 'nodejs18.x'): this {
    return this.addResource({
      logical_id: logicalId,
      resource_type: 'AWS::Lambda::Function',
      resource_properties: { Runtime: runtime },
      metrics: [
        this.createMetric('Duration', 'AWS/Lambda', 'Milliseconds'),
        this.createMetric('Errors', 'AWS/Lambda', 'Count'),
        this.createMetric('Throttles', 'AWS/Lambda', 'Count')
      ]
    });
  }

  /**
   * サポートされていないリソースを追加
   */
  addUnsupportedResource(logicalId: string): this {
    this.unsupportedResources.push(logicalId);
    this.metadata.total_resources = this.resources.length + this.unsupportedResources.length;
    return this;
  }

  /**
   * メモリピーク値を設定
   */
  withMemoryPeak(memoryMb: number): this {
    this.metadata.memory_peak_mb = memoryMb;
    return this;
  }

  /**
   * 処理時間を設定
   */
  withProcessingTime(timeMs: number): this {
    this.metadata.processing_time_ms = timeMs;
    return this;
  }

  /**
   * パフォーマンスメトリクスを設定
   */
  withPerformanceMetrics(metrics: PerformanceMetrics): this {
    this.performanceMetrics = metrics;
    return this;
  }

  /**
   * エラーを追加
   */
  addError(error: AnalysisError): this {
    this.errors ??= [];
    this.errors.push(error);
    return this;
  }

  /**
   * ビルド（AnalysisResult）
   */
  build(): AnalysisResult {
    return {
      metadata: this.metadata,
      resources: this.resources,
      unsupported_resources: this.unsupportedResources
    };
  }

  /**
   * ビルド（ExtendedAnalysisResult）
   */
  buildExtended(): ExtendedAnalysisResult {
    const result: ExtendedAnalysisResult = {
      ...this.build()
    };

    if (this.performanceMetrics) {
      result.performanceMetrics = this.performanceMetrics;
    }

    if (this.errors) {
      result.errors = this.errors;
    }

    return result;
  }

  /**
   * 空のAnalysisResultを生成
   */
  static empty(): AnalysisResult {
    return new AnalysisResultBuilder().build();
  }

  /**
   * 最小限のAnalysisResultを生成
   */
  static minimal(): AnalysisResult {
    return new AnalysisResultBuilder()
      .addSimpleResource('TestResource', 'AWS::S3::Bucket')
      .build();
  }

  /**
   * 典型的なAnalysisResultを生成
   */
  static typical(): AnalysisResult {
    return new AnalysisResultBuilder()
      .addRDSResource('TestDB')
      .addLambdaResource('TestFunction')
      .addUnsupportedResource('CustomResource')
      .build();
  }

  /**
   * メトリック作成ヘルパー
   */
  private createMetric(
    name: string,
    namespace: string,
    unit: string,
    dimensions: MetricDimension[] = []
  ): MetricDefinition {
    return {
      metric_name: name,
      namespace,
      unit,
      description: `${name} metric`,
      statistic: 'Average',
      recommended_threshold: { warning: 70, critical: 90 },
      evaluation_period: 300,
      category: 'Performance',
      importance: 'High',
      dimensions
    };
  }
}

/**
 * シンプルなファクトリ関数
 */
export function createAnalysisResult(
  customizer?: (builder: AnalysisResultBuilder) => void
): AnalysisResult {
  const builder = new AnalysisResultBuilder();
  if (customizer) {
    customizer(builder);
  }
  return builder.build();
}