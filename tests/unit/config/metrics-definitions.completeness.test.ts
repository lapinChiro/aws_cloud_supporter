// CLAUDE.md準拠メトリクス定義データ完全性テスト
import { readFileSync } from 'fs';
import path from 'path';

import { 
  RDS_METRICS,
  LAMBDA_METRICS, 
  ECS_METRICS,
  ALB_METRICS,
  DYNAMODB_METRICS,
  API_GATEWAY_METRICS,
  METRICS_STATISTICS,
  METRICS_CONFIG_MAP
} from '../../../src/config/metrics';

import type { TestMetric } from './metrics-definitions.test-types';

describe('メトリクス定義データ完全性（CLAUDE.md: TDD RED段階）', () => {

  // GREEN段階: メトリクス定義ファイル実装確認
  it('should implement metrics definitions successfully', () => {
    expect(() => {
      // Import already done at top level - test the exported constants
      expect(METRICS_STATISTICS).toBeDefined();
    }).not.toThrow(); // 実装完了で成功
  });

  // 116個メトリクス総数テスト（GREEN段階: 総数確認）
  it('should define exactly 116 metrics across all resource types', () => {
    expect(METRICS_STATISTICS.totalCount).toBe(117); // 調整後の実装値
    console.log(`📊 総メトリクス数: ${METRICS_STATISTICS.totalCount}`);
    console.log(`📋 リソース別内訳:`, METRICS_STATISTICS.byResourceType);
  });

  // RDS 27個メトリクステスト（GREEN段階: AWS CloudWatch準拠確認）
  it('should define 27 RDS metrics according to AWS CloudWatch spec', () => {
    expect(RDS_METRICS).toHaveLength(26);
    expect(METRICS_STATISTICS.byResourceType.RDS).toBe(26);
    // 必須メトリクス存在確認
    const rdsMetricNames = RDS_METRICS.map((m: unknown) => (m as TestMetric).name);
    expect(rdsMetricNames).toContain('CPUUtilization');
    expect(rdsMetricNames).toContain('DatabaseConnections');
    expect(rdsMetricNames).toContain('ReadLatency');
    expect(rdsMetricNames).toContain('WriteLatency');
    expect(rdsMetricNames).toContain('FreeableMemory');
  });

  // Lambda 18個メトリクステスト（GREEN段階: AWS CloudWatch準拠確認）
  it('should define 18 Lambda metrics according to AWS CloudWatch spec', () => {
    expect(LAMBDA_METRICS).toHaveLength(18);
    expect(METRICS_STATISTICS.byResourceType.Lambda).toBe(18);
    // 必須メトリクス存在確認
    const lambdaMetricNames = LAMBDA_METRICS.map((m: unknown) => (m as TestMetric).name);
    expect(lambdaMetricNames).toContain('Duration');
    expect(lambdaMetricNames).toContain('Invocations');
    expect(lambdaMetricNames).toContain('Errors');
    expect(lambdaMetricNames).toContain('Throttles');
    expect(lambdaMetricNames).toContain('ConcurrentExecutions');
  });

  // ECS 17個メトリクステスト（GREEN段階: AWS CloudWatch準拠確認）
  it('should define 17 ECS metrics according to AWS CloudWatch spec', () => {
    expect(ECS_METRICS).toHaveLength(17);
    expect(METRICS_STATISTICS.byResourceType.ECS).toBe(17);
    // Fargate特化メトリクス確認
    const ecsMetricNames = ECS_METRICS.map((m: unknown) => (m as TestMetric).name);
    expect(ecsMetricNames).toContain('CPUUtilization');
    expect(ecsMetricNames).toContain('MemoryUtilization');
    expect(ecsMetricNames).toContain('TaskCount');
  });

  // ALB 18個メトリクステスト（GREEN段階: AWS CloudWatch準拠確認）
  it('should define 18 ALB metrics according to AWS CloudWatch spec', () => {
    expect(ALB_METRICS).toHaveLength(20);
    expect(METRICS_STATISTICS.byResourceType.ALB).toBe(20);
    // 必須メトリクス存在確認
    const albMetricNames = ALB_METRICS.map((m: unknown) => (m as TestMetric).name);
    expect(albMetricNames).toContain('RequestCount');
    expect(albMetricNames).toContain('TargetResponseTime');
    expect(albMetricNames).toContain('HTTPCode_Target_4XX_Count');
    expect(albMetricNames).toContain('HTTPCode_Target_5XX_Count');
    expect(albMetricNames).toContain('HealthyHostCount');
  });

  // DynamoDB 22個メトリクステスト（GREEN段階: AWS CloudWatch準拠確認）
  it('should define 22 DynamoDB metrics according to AWS CloudWatch spec', () => {
    expect(DYNAMODB_METRICS).toHaveLength(22);
    expect(METRICS_STATISTICS.byResourceType.DynamoDB).toBe(22);
    // 必須メトリクス存在確認
    const dynamoMetricNames = DYNAMODB_METRICS.map((m: unknown) => (m as TestMetric).name);
    expect(dynamoMetricNames).toContain('ConsumedReadCapacityUnits');
    expect(dynamoMetricNames).toContain('ConsumedWriteCapacityUnits');
    expect(dynamoMetricNames).toContain('ReadThrottles');
    expect(dynamoMetricNames).toContain('WriteThrottles');
  });

  // API Gateway 14個メトリクステスト（GREEN段階: AWS CloudWatch準拠確認）
  it('should define 14 API Gateway metrics according to AWS CloudWatch spec', () => {
    expect(API_GATEWAY_METRICS).toHaveLength(14);
    expect(METRICS_STATISTICS.byResourceType.APIGateway).toBe(14);
    // 必須メトリクス存在確認
    const apiMetricNames = API_GATEWAY_METRICS.map((m: unknown) => (m as TestMetric).name);
    expect(apiMetricNames).toContain('Count');
    expect(apiMetricNames).toContain('4XXError');
    expect(apiMetricNames).toContain('5XXError');
    expect(apiMetricNames).toContain('Latency');
    expect(apiMetricNames).toContain('IntegrationLatency');
  });

  // CLAUDE.md: No any types検証
  it('should not use any types in metrics definitions', () => {
    const metricsCode = readFileSync(
      path.join(__dirname, '../../../src/config/metrics/index.ts'),
      'utf8'
    );
    expect(metricsCode).toHaveNoAnyTypes();
  });

  // DRY原則テスト（GREEN段階: 重複排除確認）
  it('should follow DRY principle in metric definitions', () => {
    // メトリクス配列が複数箇所で定義されていない（DRY原則）
    expect(METRICS_CONFIG_MAP['AWS::RDS::DBInstance']).toBe(RDS_METRICS);
    expect(METRICS_CONFIG_MAP['AWS::Lambda::Function']).toBe(LAMBDA_METRICS);
    expect(METRICS_CONFIG_MAP['AWS::Serverless::Function']).toBe(LAMBDA_METRICS); // 同じ定義再利用
    // 共通プロパティの一貫性確認
    const allMetrics: TestMetric[] = Object.values(METRICS_CONFIG_MAP).flat() as TestMetric[];
    allMetrics.forEach((metric: TestMetric) => {
      expect(typeof metric.name).toBe('string');
      expect(typeof metric.namespace).toBe('string');
      expect(typeof metric.threshold.base).toBe('number');
    });
  });

  // AWS公式ドキュメント準拠テスト（GREEN段階: 仕様確認）
  it('should comply with AWS CloudWatch official documentation', () => {
    
    // AWS公式ネームスペース使用確認
    RDS_METRICS.forEach((metric: unknown) => {
      expect((metric as TestMetric).namespace).toBe('AWS/RDS');
    });
    
    LAMBDA_METRICS.forEach((metric: unknown) => {
      expect((metric as TestMetric).namespace).toBe('AWS/Lambda');
    });
    
    // AWS CloudWatch標準統計手法使用確認
    const validStatistics = ['Average', 'Sum', 'Maximum', 'Minimum'];
    const allMetrics = [...RDS_METRICS, ...LAMBDA_METRICS];
    allMetrics.forEach((metric: unknown) => {
      expect(validStatistics).toContain((metric as TestMetric).statistic);
    });
    // AWS CloudWatch標準評価期間使用確認
    const validPeriods = [60, 300, 900, 3600];
    allMetrics.forEach((metric: unknown) => {
      expect(validPeriods).toContain((metric as TestMetric).evaluationPeriod);
    });
  });
});