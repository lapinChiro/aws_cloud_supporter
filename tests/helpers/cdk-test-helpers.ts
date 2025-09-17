// tests/helpers/cdk-test-helpers.ts
// CDKテスト用の共通ヘルパー関数

import type { ExtendedAnalysisResult } from '../../src/interfaces/analyzer';
import type { MetricDefinition, ResourceWithMetrics } from '../../src/types/metrics';

import { AnalysisResultBuilder } from './analysis-result-builder';

/**
 * テスト用のMetricDefinitionを作成
 * @param metricName メトリクス名
 * @param namespace 名前空間
 * @param importance 重要度（デフォルト: 'High'）
 * @returns MetricDefinition
 */
export function createTestMetricDefinition(
  metricName: string,
  namespace: string,
  importance: 'High' | 'Low' = 'High'
): MetricDefinition {
  return {
    metric_name: metricName,
    namespace: namespace,
    statistic: 'Average',
    unit: 'Percent',
    evaluation_period: 300,
    recommended_threshold: {
      warning: 70,
      critical: 90
    },
    description: `${metricName} monitoring for ${namespace}`,
    category: 'Performance',
    importance: importance
  };
}

/**
 * テスト用のResourceWithMetricsを作成
 * @param resourceType リソースタイプ
 * @param logicalId ロジカルID
 * @param metrics メトリクス配列（オプション）
 * @returns ResourceWithMetrics
 */
export function createTestResourceWithMetrics(
  resourceType: string,
  logicalId: string,
  metrics?: MetricDefinition[]
): ResourceWithMetrics {
  // メトリクスが指定されていない場合、リソースタイプに応じたデフォルトメトリクスを生成
  const defaultMetrics = metrics ?? (() => {
    if (resourceType.includes('RDS')) {
      return [
        createTestMetricDefinition('CPUUtilization', 'AWS/RDS'),
        createTestMetricDefinition('DatabaseConnections', 'AWS/RDS'),
        createTestMetricDefinition('ReadLatency', 'AWS/RDS')
      ];
    } else if (resourceType.includes('Lambda')) {
      return [
        createTestMetricDefinition('Duration', 'AWS/Lambda'),
        createTestMetricDefinition('Invocations', 'AWS/Lambda'),
        createTestMetricDefinition('Errors', 'AWS/Lambda')
      ];
    } else if (resourceType.includes('DynamoDB')) {
      return [
        createTestMetricDefinition('ConsumedReadCapacityUnits', 'AWS/DynamoDB'),
        createTestMetricDefinition('ConsumedWriteCapacityUnits', 'AWS/DynamoDB')
      ];
    } else if (resourceType.includes('ECS')) {
      return [
        createTestMetricDefinition('CPUUtilization', 'AWS/ECS'),
        createTestMetricDefinition('MemoryUtilization', 'AWS/ECS')
      ];
    } else if (resourceType.includes('ElasticLoadBalancing')) {
      return [
        createTestMetricDefinition('TargetResponseTime', 'AWS/ApplicationELB'),
        createTestMetricDefinition('RequestCount', 'AWS/ApplicationELB')
      ];
    } else if (resourceType.includes('ApiGateway')) {
      return [
        createTestMetricDefinition('Count', 'AWS/ApiGateway'),
        createTestMetricDefinition('4XXError', 'AWS/ApiGateway'),
        createTestMetricDefinition('5XXError', 'AWS/ApiGateway')
      ];
    } else if (resourceType.includes('Serverless')) {
      return [
        createTestMetricDefinition('Duration', 'AWS/Lambda'),
        createTestMetricDefinition('Errors', 'AWS/Lambda')
      ];
    } else {
      // デフォルト
      return [createTestMetricDefinition('CPUUtilization', 'AWS/EC2')];
    }
  })();

  return {
    logical_id: logicalId,
    resource_type: resourceType,
    resource_properties: {},
    metrics: defaultMetrics
  };
}

/**
 * テスト用のExtendedAnalysisResultを作成（AnalysisResultBuilderを使用）
 * @param resources リソース配列（オプション）
 * @returns ExtendedAnalysisResult
 */
export function createTestAnalysisResult(
  resources?: ResourceWithMetrics[]
): ExtendedAnalysisResult {
  const builder = new AnalysisResultBuilder()
    .withMetadata({
      template_path: 'test-template.yaml'
    });

  if (resources) {
    resources.forEach(resource => builder.addResource(resource));
  } else {
    // デフォルトリソース
    builder.addResource(createTestResourceWithMetrics('AWS::RDS::DBInstance', 'TestDBInstance'))
           .addResource(createTestResourceWithMetrics('AWS::Lambda::Function', 'TestLambdaFunction'));
  }

  return builder.buildExtended();
}

/**
 * センシティブデータを含むテスト用のExtendedAnalysisResultを作成（AnalysisResultBuilderを使用）
 * @returns ExtendedAnalysisResult
 */
export function createTestAnalysisResultWithSensitiveData(): ExtendedAnalysisResult {
  const sensitiveResource: ResourceWithMetrics = {
    logical_id: 'TestDBInstanceWithPassword',
    resource_type: 'AWS::RDS::DBInstance',
    resource_properties: {
      MasterUserPassword: 'SuperSecretPassword123!',
      DBName: 'TestDatabase'
    },
    metrics: [
      createTestMetricDefinition('CPUUtilization', 'AWS/RDS'),
      createTestMetricDefinition('DatabaseConnections', 'AWS/RDS')
    ]
  };

  return new AnalysisResultBuilder()
    .withMetadata({
      template_path: 'test-template-sensitive.yaml'
    })
    .addResource(sensitiveResource)
    .buildExtended();
}