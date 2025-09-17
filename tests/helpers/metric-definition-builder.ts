// MetricDefinition Builder Pattern
// CLAUDE.md準拠: DRY原則・Builder Pattern

import type { MetricDefinition, MetricDimension } from '../../src/types/metrics';

/**
 * MetricDefinitionビルダー
 * テスト用メトリック定義の段階的構築
 */
export class MetricDefinitionBuilder {
  private metricName = 'TestMetric';
  private namespace = 'AWS/Test';
  private unit = 'Count';
  private description = 'Test metric description';
  private statistic: 'Average' | 'Sum' | 'Maximum' | 'Minimum' = 'Average';
  private warningThreshold = 70;
  private criticalThreshold = 90;
  private evaluationPeriod: 60 | 300 | 900 | 3600 = 300;
  private category: 'Performance' | 'Error' | 'Saturation' | 'Latency' = 'Performance';
  private importance: 'High' | 'Low' = 'High';
  private readonly dimensions: MetricDimension[] = [];

  /**
   * メトリック名を設定
   */
  withName(name: string): this {
    this.metricName = name;
    return this;
  }

  /**
   * 名前空間を設定
   */
  withNamespace(namespace: string): this {
    this.namespace = namespace;
    return this;
  }

  /**
   * 単位を設定
   */
  withUnit(unit: string): this {
    this.unit = unit;
    return this;
  }

  /**
   * 説明を設定
   */
  withDescription(description: string): this {
    this.description = description;
    return this;
  }

  /**
   * 統計を設定
   */
  withStatistic(statistic: 'Average' | 'Sum' | 'Maximum' | 'Minimum'): this {
    this.statistic = statistic;
    return this;
  }

  /**
   * しきい値を設定
   */
  withThresholds(warning: number, critical: number): this {
    this.warningThreshold = warning;
    this.criticalThreshold = critical;
    return this;
  }

  /**
   * 評価期間を設定
   */
  withEvaluationPeriod(seconds: 60 | 300 | 900 | 3600): this {
    this.evaluationPeriod = seconds;
    return this;
  }

  /**
   * カテゴリを設定
   */
  withCategory(category: 'Performance' | 'Error' | 'Saturation' | 'Latency'): this {
    this.category = category;
    return this;
  }

  /**
   * 重要度を設定
   */
  withImportance(importance: 'High' | 'Low'): this {
    this.importance = importance;
    return this;
  }

  /**
   * ディメンションを追加
   */
  addDimension(name: string, value: string): this {
    this.dimensions.push({ name, value });
    return this;
  }


  /**
   * ビルド
   */
  build(): MetricDefinition {
    const metric: MetricDefinition = {
      metric_name: this.metricName,
      namespace: this.namespace,
      unit: this.unit,
      description: this.description,
      statistic: this.statistic,
      recommended_threshold: {
        warning: this.warningThreshold,
        critical: this.criticalThreshold
      },
      evaluation_period: this.evaluationPeriod,
      category: this.category,
      importance: this.importance
    };

    if (this.dimensions.length > 0) {
      metric.dimensions = this.dimensions;
    }


    return metric;
  }

  /**
   * RDS CPU使用率のプリセット
   */
  static rdsCpu(instanceId?: string): MetricDefinitionBuilder {
    const builder = new MetricDefinitionBuilder()
      .withName('CPUUtilization')
      .withNamespace('AWS/RDS')
      .withUnit('Percent')
      .withDescription('CPU utilization of RDS instance')
      .withStatistic('Average')
      .withThresholds(70, 90)
      .withEvaluationPeriod(300)
      .withCategory('Performance')
      .withImportance('High');

    if (instanceId) {
      builder.addDimension('DBInstanceIdentifier', instanceId);
    }

    return builder;
  }

  /**
   * Lambda実行時間のプリセット
   */
  static lambdaDuration(functionName?: string): MetricDefinitionBuilder {
    const builder = new MetricDefinitionBuilder()
      .withName('Duration')
      .withNamespace('AWS/Lambda')
      .withUnit('Milliseconds')
      .withDescription('Lambda function execution duration')
      .withStatistic('Average')
      .withThresholds(3000, 5000)
      .withEvaluationPeriod(300)
      .withCategory('Performance')
      .withImportance('High');

    if (functionName) {
      builder.addDimension('FunctionName', functionName);
    }

    return builder;
  }

  /**
   * Lambda エラー率のプリセット
   */
  static lambdaErrors(functionName?: string): MetricDefinitionBuilder {
    const builder = new MetricDefinitionBuilder()
      .withName('Errors')
      .withNamespace('AWS/Lambda')
      .withUnit('Count')
      .withDescription('Lambda function invocation errors')
      .withStatistic('Sum')
      .withThresholds(1, 5)
      .withEvaluationPeriod(300)
      .withCategory('Error')
      .withImportance('High');

    if (functionName) {
      builder.addDimension('FunctionName', functionName);
    }

    return builder;
  }

  /**
   * DynamoDB 読み取りキャパシティのプリセット
   */
  static dynamoDbRead(tableName?: string): MetricDefinitionBuilder {
    const builder = new MetricDefinitionBuilder()
      .withName('ConsumedReadCapacityUnits')
      .withNamespace('AWS/DynamoDB')
      .withUnit('Count')
      .withDescription('DynamoDB read capacity consumed')
      .withStatistic('Sum')
      .withThresholds(80, 95)
      .withEvaluationPeriod(60)
      .withCategory('Performance')
      .withImportance('High');

    if (tableName) {
      builder.addDimension('TableName', tableName);
    }

    return builder;
  }

  /**
   * ALB ターゲット応答時間のプリセット
   */
  static albResponseTime(loadBalancerName?: string): MetricDefinitionBuilder {
    const builder = new MetricDefinitionBuilder()
      .withName('TargetResponseTime')
      .withNamespace('AWS/ApplicationELB')
      .withUnit('Seconds')
      .withDescription('Time taken by target to respond')
      .withStatistic('Average')
      .withThresholds(1, 3)
      .withEvaluationPeriod(300)
      .withCategory('Performance')
      .withImportance('High');

    if (loadBalancerName) {
      builder.addDimension('LoadBalancer', loadBalancerName);
    }

    return builder;
  }

  /**
   * ECS CPU使用率のプリセット
   */
  static ecsCpu(serviceName?: string, clusterName?: string): MetricDefinitionBuilder {
    const builder = new MetricDefinitionBuilder()
      .withName('CPUUtilization')
      .withNamespace('AWS/ECS')
      .withUnit('Percent')
      .withDescription('ECS service CPU utilization')
      .withStatistic('Average')
      .withThresholds(70, 90)
      .withEvaluationPeriod(300)
      .withCategory('Performance')
      .withImportance('High');

    if (serviceName) {
      builder.addDimension('ServiceName', serviceName);
    }
    if (clusterName) {
      builder.addDimension('ClusterName', clusterName);
    }

    return builder;
  }

  /**
   * API Gateway 4xxエラーのプリセット
   */
  static apiGateway4xx(apiName?: string): MetricDefinitionBuilder {
    const builder = new MetricDefinitionBuilder()
      .withName('4XXError')
      .withNamespace('AWS/ApiGateway')
      .withUnit('Count')
      .withDescription('Client error responses')
      .withStatistic('Sum')
      .withThresholds(10, 50)
      .withEvaluationPeriod(300)
      .withCategory('Error')
      .withImportance('High');

    if (apiName) {
      builder.addDimension('ApiName', apiName);
    }

    return builder;
  }
}

/**
 * ファクトリ関数
 */
export function metricDefinition(): MetricDefinitionBuilder {
  return new MetricDefinitionBuilder();
}