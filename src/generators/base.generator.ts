// CLAUDE.md準拠BaseMetricsGenerator（SOLID抽象化原則 + Type-Driven Development）

import type { ILogger } from '../interfaces/logger';
import type { CloudFormationResource } from '../types/cloudformation';
import type { MetricDefinition, MetricConfig, IMetricsGenerator } from '../types/metrics';
import { createResourceError } from '../utils/error';

// Validation result interface
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Performance monitoring interfaces
interface GenerationStats {
  resourceType: string;
  metricsGenerated: number;
  generationTimeMs: number;
  averageThresholdWarning: number;
  averageThresholdCritical: number;
}

interface GenerationResult {
  metrics: MetricDefinition[];
  performanceGrade: 'A' | 'B' | 'C' | 'F';
  stats: GenerationStats;
}

// SOLID原則: 抽象化による拡張性確保（Open/Closed Principle）
export abstract class BaseMetricsGenerator implements IMetricsGenerator {
  
  constructor(protected logger: ILogger) {}

  // 抽象メソッド群（SOLID: Interface Segregation）
  abstract getSupportedTypes(): string[];
  protected abstract getMetricsConfig(resource: CloudFormationResource): MetricConfig[];
  protected abstract getResourceScale(resource: CloudFormationResource): number;

  // メイン生成メソッド（CLAUDE.md: Type-Driven Development）
  generate(resource: CloudFormationResource): Promise<MetricDefinition[]> {
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

      return Promise.resolve(metrics);
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
    
    // メトリクスの方向性チェック（低い値が悪いメトリクス）
    const isLowerWorse = this.isLowerWorse(config.name);
    
    // しきい値妥当性検証
    const isInvalid = isLowerWorse ? (warning <= critical) : (warning >= critical);
    
    if (isInvalid || warning === 0 || critical === 0) {
      // 自動修正ロジック（メトリクス方向性を考慮）
      if (isLowerWorse) {
        // 低い値が悪い場合: critical < warning
        const correctedCritical = Math.max(Math.min(warning, critical), 1);
        const correctedWarning = Math.max(correctedCritical + 1, warning);
        
        this.logger.debug(`Auto-corrected lower-worse thresholds for ${config.name}: warning=${warning}→${correctedWarning}, critical=${critical}→${correctedCritical}`);
        
        return {
          warning: correctedWarning,
          critical: correctedCritical
        };
      } else {
        // 高い値が悪い場合: warning < critical
        const correctedWarning = Math.max(Math.min(warning, critical), 1);
        const correctedCritical = Math.max(correctedWarning + 1, critical);
        
        this.logger.debug(`Auto-corrected higher-worse thresholds for ${config.name}: warning=${warning}→${correctedWarning}, critical=${critical}→${correctedCritical}`);
        
        return {
          warning: correctedWarning,
          critical: correctedCritical
        };
      }
    }
    
    return { warning, critical };
  }

  // メトリクスの方向性判定（低い値が悪いメトリクス）
  private isLowerWorse(metricName: string): boolean {
    const lowerWorsePatterns = [
      'CreditBalance', 'HitRatio', 'HealthyHost', 'FreeableMemory', 'FreeStorageSpace',
      'AvailabilityZone', 'Available', 'Healthy', 'Buffer', 'Cache', 'Free'
    ];
    
    return lowerWorsePatterns.some(pattern => metricName.includes(pattern));
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

/**
 * Validate MetricDefinition object for correctness
 * Used by tests to ensure metric definitions meet standards
 */
export function validateMetricDefinition(metric: Partial<MetricDefinition>): ValidationResult {
  const errors: string[] = [];

  // Required string fields
  const requiredStringFields: Array<keyof MetricDefinition> = [
    'metric_name', 'namespace', 'unit', 'description', 'statistic', 'category', 'importance'
  ];

  for (const field of requiredStringFields) {
    if (!metric[field] || typeof metric[field] !== 'string') {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  // evaluation_period validation
  if (typeof metric.evaluation_period !== 'number' || metric.evaluation_period <= 0) {
    errors.push('evaluation_period must be a positive number');
  }

  // Valid evaluation periods (CloudWatch standard periods)
  const validPeriods = [60, 300, 900, 3600, 21600, 86400];
  if (metric.evaluation_period && !validPeriods.includes(metric.evaluation_period)) {
    errors.push(`evaluation_period must be one of: ${validPeriods.join(', ')}`);
  }

  // recommended_threshold validation
  if (!metric.recommended_threshold || typeof metric.recommended_threshold !== 'object') {
    errors.push('recommended_threshold must be an object');
  } else {
    const threshold = metric.recommended_threshold;
    if (typeof threshold.warning !== 'number') {
      errors.push('recommended_threshold.warning must be a number');
    }
    if (typeof threshold.critical !== 'number') {
      errors.push('recommended_threshold.critical must be a number');
    }
    if (threshold.warning && threshold.critical && threshold.warning >= threshold.critical) {
      errors.push('recommended_threshold.warning must be less than critical');
    }
  }

  // Category validation
  const validCategories = ['Performance', 'Error', 'Saturation', 'Latency'];
  if (metric.category && !validCategories.includes(metric.category)) {
    errors.push(`category must be one of: ${validCategories.join(', ')}`);
  }

  // Importance validation
  const validImportance = ['High', 'Medium', 'Low'];
  if (metric.importance && !validImportance.includes(metric.importance)) {
    errors.push(`importance must be one of: ${validImportance.join(', ')}`);
  }

  // Dimensions validation (if present)
  if (metric.dimensions && Array.isArray(metric.dimensions)) {
    metric.dimensions.forEach((dim, index) => {
      if (!dim.name || typeof dim.name !== 'string') {
        errors.push(`dimensions[${index}].name must be a non-empty string`);
      }
      if (!dim.value || typeof dim.value !== 'string') {
        errors.push(`dimensions[${index}].value must be a non-empty string`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Performance monitoring utility for metric generation
 * Used by tests to measure and evaluate generator performance
 */
export class MetricsGenerationMonitor {
  static async measureGenerationPerformance(
    generator: IMetricsGenerator, 
    resource: CloudFormationResource
  ): Promise<GenerationResult> {
    const startTime = performance.now();
    
    // Generate metrics
    const metrics = await generator.generate(resource);
    
    const endTime = performance.now();
    const generationTimeMs = endTime - startTime;

    // Calculate statistics
    const stats: GenerationStats = {
      resourceType: resource.Type,
      metricsGenerated: metrics.length,
      generationTimeMs: Math.round(generationTimeMs),
      averageThresholdWarning: metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + m.recommended_threshold.warning, 0) / metrics.length
        : 0,
      averageThresholdCritical: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.recommended_threshold.critical, 0) / metrics.length
        : 0
    };

    // Determine performance grade
    let performanceGrade: 'A' | 'B' | 'C' | 'F' = 'F';
    if (generationTimeMs < 100) {
      performanceGrade = 'A';
    } else if (generationTimeMs < 500) {
      performanceGrade = 'B';
    } else if (generationTimeMs < 1000) {
      performanceGrade = 'C';
    }

    return {
      metrics,
      performanceGrade,
      stats
    };
  }
}