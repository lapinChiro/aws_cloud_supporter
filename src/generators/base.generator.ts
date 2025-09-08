// CLAUDE.md準拠BaseMetricsGenerator（SOLID抽象化原則 + Type-Driven Development）

import { CloudFormationResource } from '../types/cloudformation';
import { MetricDefinition, MetricConfig, IMetricsGenerator } from '../types/metrics';
import { ILogger } from '../utils/logger';
import { createResourceError } from '../utils/error';

// SOLID原則: 抽象化による拡張性確保（Open/Closed Principle）
export abstract class BaseMetricsGenerator implements IMetricsGenerator {
  
  constructor(protected logger: ILogger) {}

  // 抽象メソッド群（SOLID: Interface Segregation）
  abstract getSupportedTypes(): string[];
  protected abstract getMetricsConfig(resource: CloudFormationResource): MetricConfig[];
  protected abstract getResourceScale(resource: CloudFormationResource): number;

  // メイン生成メソッド（CLAUDE.md: Type-Driven Development）
  async generate(resource: CloudFormationResource): Promise<MetricDefinition[]> {
    const startTime = performance.now();
    
    try {
      // 型安全なリソース検証
      this.validateResource(resource);
      
      // 適用可能メトリクス決定
      const applicableConfigs = this.getApplicableMetrics(resource);
      
      // メトリクス定義生成（型安全性重視）
      const metrics = applicableConfigs.map(config => 
        this.buildMetricDefinition(resource, config)
      );

      const duration = performance.now() - startTime;
      
      // パフォーマンス監視（CLAUDE.md: 性能要件）
      if (duration > 1000) {
        this.logger.warn(`Metrics generation slow: ${duration.toFixed(0)}ms for ${this.getResourceId(resource)}`);
      } else {
        this.logger.debug(`Generated ${metrics.length} metrics for ${this.getResourceId(resource)} in ${duration.toFixed(1)}ms`);
      }

      return metrics;
    } catch (error) {
      const resourceId = this.getResourceId(resource);
      this.logger.error(`Failed to generate metrics for ${resourceId}`, error as Error);
      throw createResourceError(
        `Metrics generation failed for ${resourceId}: ${(error as Error).message}`,
        { resourceType: resource.Type, originalError: (error as Error).message }
      );
    }
  }

  // 適用可能メトリクス判定（Type-Driven Development）
  private getApplicableMetrics(resource: CloudFormationResource): MetricConfig[] {
    const allConfigs = this.getMetricsConfig(resource);
    
    return allConfigs.filter(config => {
      if (!config.applicableWhen) {
        return true; // 条件なしは全て適用
      }
      
      try {
        return config.applicableWhen(resource);
      } catch (error) {
        this.logger.warn(`Failed to evaluate metric condition: ${config.name}`, error as Error);
        return false; // 評価失敗時は適用しない
      }
    });
  }

  // メトリクス定義構築（型安全性重視）
  private buildMetricDefinition(
    resource: CloudFormationResource,
    config: MetricConfig
  ): MetricDefinition {
    const threshold = this.calculateThreshold(resource, config);
    
    return {
      metric_name: config.name,
      namespace: config.namespace,
      unit: config.unit,
      description: config.description,
      statistic: config.statistic,
      recommended_threshold: threshold,
      evaluation_period: config.evaluationPeriod,
      category: config.category,
      importance: config.importance,
      dimensions: this.buildDimensions(resource, config)
    };
  }

  // 動的しきい値計算（CLAUDE.md: アルゴリズム実装）
  private calculateThreshold(
    resource: CloudFormationResource,
    config: MetricConfig
  ): { warning: number; critical: number } {
    // リソーススケール係数取得
    const scale = this.getResourceScale(resource);
    const base = config.threshold.base;
    
    // 動的計算（CLAUDE.md: Type-Driven Development）
    const warning = Math.round(base * scale * config.threshold.warningMultiplier);
    const critical = Math.round(base * scale * config.threshold.criticalMultiplier);
    
    // しきい値妥当性検証（warning < critical、最小値保証）
    if (warning >= critical || warning === 0) {
      this.logger.warn(`Invalid threshold calculation: warning=${warning} >= critical=${critical} for ${config.name}`);
      
      // 最小値保証（CLAUDE.md: 実用性重視）
      const correctedWarning = Math.max(warning, 1);
      const correctedCritical = Math.max(critical, correctedWarning + 1);
      
      this.logger.info(`Auto-corrected thresholds: warning=${warning}→${correctedWarning}, critical=${critical}→${correctedCritical}`);
      
      return {
        warning: correctedWarning,
        critical: correctedCritical
      };
    }
    
    return { warning, critical };
  }

  // CloudWatchディメンション構築（AWS仕様準拠）
  private buildDimensions(
    resource: CloudFormationResource,
    _config: MetricConfig // 将来拡張用（現在未使用）
  ): Array<{ name: string; value: string }> {
    const resourceId = this.getResourceId(resource);
    const primaryDimension = this.getPrimaryDimensionName(resource.Type);
    
    return [
      {
        name: primaryDimension,
        value: resourceId
      }
    ];
  }

  // リソースタイプ別プライマリディメンション（AWS CloudWatch仕様）
  private getPrimaryDimensionName(resourceType: string): string {
    const dimensionMap: Record<string, string> = {
      'AWS::RDS::DBInstance': 'DBInstanceIdentifier',
      'AWS::Lambda::Function': 'FunctionName',
      'AWS::Serverless::Function': 'FunctionName',
      'AWS::ECS::Service': 'ServiceName',
      'AWS::ElasticLoadBalancingV2::LoadBalancer': 'LoadBalancer',
      'AWS::DynamoDB::Table': 'TableName',
      'AWS::ApiGateway::RestApi': 'ApiName',
      'AWS::Serverless::Api': 'ApiName'
    };
    
    return dimensionMap[resourceType] ?? 'ResourceId';
  }

  // 型安全なリソースID取得
  private getResourceId(resource: CloudFormationResource): string {
    // LogicalIdプロパティの型安全取得
    const resourceWithId = resource as CloudFormationResource & { LogicalId?: string };
    return resourceWithId.LogicalId ?? 'UnknownResource';
  }

  // リソース基本検証（型安全性）
  private validateResource(resource: CloudFormationResource): void {
    if (!resource.Type || typeof resource.Type !== 'string') {
      throw createResourceError(
        'Resource must have a valid Type property',
        { resourceData: JSON.stringify(resource) }
      );
    }

    if (!this.getSupportedTypes().includes(resource.Type)) {
      throw createResourceError(
        `Unsupported resource type: ${resource.Type}`,
        { 
          resourceType: resource.Type,
          supportedTypes: this.getSupportedTypes()
        }
      );
    }
  }
}

// メトリクス生成統計情報（CLAUDE.md: 監視・デバッグ支援）
export interface GenerationStats {
  resourceType: string;
  metricsGenerated: number;
  generationTimeMs: number;
  averageThresholdWarning: number;
  averageThresholdCritical: number;
}

// パフォーマンス測定ヘルパー（CLAUDE.md: 単一責任分離）
export class MetricsGenerationMonitor {
  
  static async measureGenerationPerformance<T extends BaseMetricsGenerator>(
    generator: T,
    resource: CloudFormationResource
  ): Promise<{
    metrics: MetricDefinition[];
    stats: GenerationStats;
    performanceGrade: 'A' | 'B' | 'C' | 'F';
  }> {
    const startTime = performance.now();
    const memoryBefore = process.memoryUsage().heapUsed;
    
    const metrics = await generator.generate(resource);
    
    const duration = performance.now() - startTime;
    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryDelta = (memoryAfter - memoryBefore) / 1024 / 1024;

    // 統計情報計算
    const stats: GenerationStats = {
      resourceType: resource.Type,
      metricsGenerated: metrics.length,
      generationTimeMs: Math.round(duration),
      averageThresholdWarning: metrics.reduce((sum, m) => sum + m.recommended_threshold.warning, 0) / metrics.length,
      averageThresholdCritical: metrics.reduce((sum, m) => sum + m.recommended_threshold.critical, 0) / metrics.length
    };

    // パフォーマンス評価
    let performanceGrade: 'A' | 'B' | 'C' | 'F';
    if (duration < 100 && memoryDelta < 1) {
      performanceGrade = 'A'; // 100ms以下、メモリ1MB以下
    } else if (duration < 500 && memoryDelta < 5) {
      performanceGrade = 'B'; // 500ms以下、メモリ5MB以下
    } else if (duration < 1000 && memoryDelta < 10) {
      performanceGrade = 'C'; // 1秒以下、メモリ10MB以下
    } else {
      performanceGrade = 'F'; // 要件超過
    }

    return {
      metrics,
      stats,
      performanceGrade
    };
  }
}

// 型安全なメトリクス検証（CLAUDE.md: Type-Driven Development）
export function validateMetricDefinition(metric: MetricDefinition): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 必須フィールド検証
  if (!metric.metric_name || typeof metric.metric_name !== 'string') {
    errors.push('metric_name must be a non-empty string');
  }
  
  if (!metric.namespace || typeof metric.namespace !== 'string') {
    errors.push('namespace must be a non-empty string');
  }

  // しきい値妥当性検証（カスタムマッチャーと同じロジック）
  const threshold = metric.recommended_threshold;
  if (threshold.warning >= threshold.critical) {
    errors.push(`Invalid threshold: warning(${threshold.warning}) >= critical(${threshold.critical})`);
  }

  if (threshold.warning <= 0 || threshold.critical <= 0) {
    errors.push('Thresholds must be positive numbers');
  }

  // 評価期間検証
  const validPeriods = [60, 300, 900, 3600]; // CloudWatch標準期間
  if (!validPeriods.includes(metric.evaluation_period)) {
    errors.push(`Invalid evaluation_period: ${metric.evaluation_period}. Valid: ${validPeriods.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}