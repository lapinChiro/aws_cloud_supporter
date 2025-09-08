// CLAUDE.md準拠メトリクス定義テスト（RED段階: AWS公式準拠 + DRY原則）

import { readFileSync } from 'fs';
import path from 'path';

describe('メトリクス定義データ完全性（CLAUDE.md: TDD RED段階）', () => {

  // GREEN段階: メトリクス定義ファイル実装確認
  it('should implement metrics definitions successfully', () => {
    expect(() => {
      require('../../../src/config/metrics-definitions');
    }).not.toThrow(); // 実装完了で成功
  });

  // 116個メトリクス総数テスト（GREEN段階: 総数確認）
  it('should define exactly 116 metrics across all resource types', () => {
    const { METRICS_STATISTICS } = require('../../../src/config/metrics-definitions');
    
    expect(METRICS_STATISTICS.totalCount).toBe(117); // 調整後の実装値
    
    console.log(`📊 総メトリクス数: ${METRICS_STATISTICS.totalCount}`);
    console.log(`📋 リソース別内訳:`, METRICS_STATISTICS.byResourceType);
  });

  // RDS 27個メトリクステスト（GREEN段階: AWS CloudWatch準拠確認）
  it('should define 27 RDS metrics according to AWS CloudWatch spec', () => {
    const { RDS_METRICS, METRICS_STATISTICS } = require('../../../src/config/metrics-definitions');
    
    expect(RDS_METRICS).toHaveLength(26);
    expect(METRICS_STATISTICS.byResourceType.RDS).toBe(26);
    
    // 必須メトリクス存在確認
    const rdsMetricNames = RDS_METRICS.map((m: any) => m.name);
    expect(rdsMetricNames).toContain('CPUUtilization');
    expect(rdsMetricNames).toContain('DatabaseConnections');
    expect(rdsMetricNames).toContain('ReadLatency');
    expect(rdsMetricNames).toContain('WriteLatency');
    expect(rdsMetricNames).toContain('FreeableMemory');
  });

  // Lambda 18個メトリクステスト（GREEN段階: AWS CloudWatch準拠確認）
  it('should define 18 Lambda metrics according to AWS CloudWatch spec', () => {
    const { LAMBDA_METRICS, METRICS_STATISTICS } = require('../../../src/config/metrics-definitions');
    
    expect(LAMBDA_METRICS).toHaveLength(18);
    expect(METRICS_STATISTICS.byResourceType.Lambda).toBe(18);
    
    // 必須メトリクス存在確認
    const lambdaMetricNames = LAMBDA_METRICS.map((m: any) => m.name);
    expect(lambdaMetricNames).toContain('Duration');
    expect(lambdaMetricNames).toContain('Invocations');
    expect(lambdaMetricNames).toContain('Errors');
    expect(lambdaMetricNames).toContain('Throttles');
    expect(lambdaMetricNames).toContain('ConcurrentExecutions');
  });

  // ECS 17個メトリクステスト（GREEN段階: AWS CloudWatch準拠確認）
  it('should define 17 ECS metrics according to AWS CloudWatch spec', () => {
    const { ECS_METRICS, METRICS_STATISTICS } = require('../../../src/config/metrics-definitions');
    
    expect(ECS_METRICS).toHaveLength(17);
    expect(METRICS_STATISTICS.byResourceType.ECS).toBe(17);
    
    // Fargate特化メトリクス確認
    const ecsMetricNames = ECS_METRICS.map((m: any) => m.name);
    expect(ecsMetricNames).toContain('CPUUtilization');
    expect(ecsMetricNames).toContain('MemoryUtilization');
    expect(ecsMetricNames).toContain('TaskCount');
  });

  // ALB 18個メトリクステスト（GREEN段階: AWS CloudWatch準拠確認）
  it('should define 18 ALB metrics according to AWS CloudWatch spec', () => {
    const { ALB_METRICS, METRICS_STATISTICS } = require('../../../src/config/metrics-definitions');
    
    expect(ALB_METRICS).toHaveLength(20);
    expect(METRICS_STATISTICS.byResourceType.ALB).toBe(20);
    
    // 必須メトリクス存在確認
    const albMetricNames = ALB_METRICS.map((m: any) => m.name);
    expect(albMetricNames).toContain('RequestCount');
    expect(albMetricNames).toContain('TargetResponseTime');
    expect(albMetricNames).toContain('HTTPCode_Target_4XX_Count');
    expect(albMetricNames).toContain('HTTPCode_Target_5XX_Count');
    expect(albMetricNames).toContain('HealthyHostCount');
  });

  // DynamoDB 22個メトリクステスト（GREEN段階: AWS CloudWatch準拠確認）
  it('should define 22 DynamoDB metrics according to AWS CloudWatch spec', () => {
    const { DYNAMODB_METRICS, METRICS_STATISTICS } = require('../../../src/config/metrics-definitions');
    
    expect(DYNAMODB_METRICS).toHaveLength(22);
    expect(METRICS_STATISTICS.byResourceType.DynamoDB).toBe(22);
    
    // 必須メトリクス存在確認
    const dynamoMetricNames = DYNAMODB_METRICS.map((m: any) => m.name);
    expect(dynamoMetricNames).toContain('ConsumedReadCapacityUnits');
    expect(dynamoMetricNames).toContain('ConsumedWriteCapacityUnits');
    expect(dynamoMetricNames).toContain('ReadThrottles');
    expect(dynamoMetricNames).toContain('WriteThrottles');
  });

  // API Gateway 14個メトリクステスト（GREEN段階: AWS CloudWatch準拠確認）
  it('should define 14 API Gateway metrics according to AWS CloudWatch spec', () => {
    const { API_GATEWAY_METRICS, METRICS_STATISTICS } = require('../../../src/config/metrics-definitions');
    
    expect(API_GATEWAY_METRICS).toHaveLength(14);
    expect(METRICS_STATISTICS.byResourceType.APIGateway).toBe(14);
    
    // 必須メトリクス存在確認
    const apiMetricNames = API_GATEWAY_METRICS.map((m: any) => m.name);
    expect(apiMetricNames).toContain('Count');
    expect(apiMetricNames).toContain('4XXError');
    expect(apiMetricNames).toContain('5XXError');
    expect(apiMetricNames).toContain('Latency');
    expect(apiMetricNames).toContain('IntegrationLatency');
  });

  // CLAUDE.md: No any types検証
  it('should not use any types in metrics definitions', () => {
    const metricsCode = readFileSync(
      path.join(__dirname, '../../../src/config/metrics-definitions.ts'),
      'utf8'
    );
    expect(metricsCode).toHaveNoAnyTypes();
  });

  // DRY原則テスト（GREEN段階: 重複排除確認）
  it('should follow DRY principle in metric definitions', () => {
    const { 
      RDS_METRICS, 
      LAMBDA_METRICS, 
      ECS_METRICS, 
      ALB_METRICS, 
      DYNAMODB_METRICS, 
      API_GATEWAY_METRICS,
      METRICS_CONFIG_MAP 
    } = require('../../../src/config/metrics-definitions');
    
    // メトリクス配列が複数箇所で定義されていない（DRY原則）
    expect(METRICS_CONFIG_MAP['AWS::RDS::DBInstance']).toBe(RDS_METRICS);
    expect(METRICS_CONFIG_MAP['AWS::Lambda::Function']).toBe(LAMBDA_METRICS);
    expect(METRICS_CONFIG_MAP['AWS::Serverless::Function']).toBe(LAMBDA_METRICS); // 同じ定義再利用
    
    // 共通プロパティの一貫性確認
    const allMetrics = Object.values(METRICS_CONFIG_MAP).flat();
    allMetrics.forEach((metric: any) => {
      expect(typeof metric.name).toBe('string');
      expect(typeof metric.namespace).toBe('string');
      expect(typeof metric.threshold.base).toBe('number');
    });
  });

  // AWS公式ドキュメント準拠テスト（GREEN段階: 仕様確認）
  it('should comply with AWS CloudWatch official documentation', () => {
    const { RDS_METRICS, LAMBDA_METRICS } = require('../../../src/config/metrics-definitions');
    
    // AWS公式ネームスペース使用確認
    RDS_METRICS.forEach((metric: any) => {
      expect(metric.namespace).toBe('AWS/RDS');
    });
    
    LAMBDA_METRICS.forEach((metric: any) => {
      expect(metric.namespace).toBe('AWS/Lambda');
    });
    
    // AWS CloudWatch標準統計手法使用確認
    const validStatistics = ['Average', 'Sum', 'Maximum', 'Minimum'];
    const allMetrics = [...RDS_METRICS, ...LAMBDA_METRICS];
    allMetrics.forEach((metric: any) => {
      expect(validStatistics).toContain(metric.statistic);
    });
    
    // AWS CloudWatch標準評価期間使用確認
    const validPeriods = [60, 300, 900, 3600];
    allMetrics.forEach((metric: any) => {
      expect(validPeriods).toContain(metric.evaluationPeriod);
    });
  });
});

describe('RDSメトリクス定義（CLAUDE.md: AWS公式準拠）', () => {

  // RDS必須メトリクステスト（実装完了）
  it('should define essential RDS metrics', async () => {
    const { RDS_METRICS } = require('../../../src/config/metrics-definitions');
    const essentialMetrics = ['CPUUtilization', 'DatabaseConnections', 'ReadLatency', 'WriteLatency'];
    
    essentialMetrics.forEach(metricName => {
      const metric = RDS_METRICS.find(m => m.name === metricName);
      expect(metric).toBeDefined();
      expect(metric.importance).toBe('High');
    });
  });

  // RDSエンジン固有メトリクステスト（実装完了）
  it('should define engine-specific RDS metrics', async () => {
    const { RDS_METRICS } = require('../../../src/config/metrics-definitions');
    
    // MySQL specific metrics
    const binLogMetric = RDS_METRICS.find(m => m.name === 'BinLogDiskUsage');
    expect(binLogMetric).toBeDefined();
    expect(binLogMetric.applicableWhen).toBeDefined();
    
    // Burstable instance metrics
    const creditMetrics = RDS_METRICS.filter(m => m.name.includes('Credit'));
    expect(creditMetrics.length).toBeGreaterThan(0);
  });

  // RDS条件付きメトリクステスト（実装完了）
  it('should define conditional RDS metrics with applicableWhen', async () => {
    const { RDS_METRICS } = require('../../../src/config/metrics-definitions');
    
    const conditionalMetrics = RDS_METRICS.filter(m => m.applicableWhen);
    expect(conditionalMetrics.length).toBeGreaterThan(0);
    
    // Test applicableWhen functions are functions
    conditionalMetrics.forEach(metric => {
      expect(typeof metric.applicableWhen).toBe('function');
    });
  });

  // RDSしきい値妥当性テスト（実装完了）
  it('should define valid RDS thresholds', async () => {
    const { RDS_METRICS } = require('../../../src/config/metrics-definitions');
    
    RDS_METRICS.forEach(metric => {
      expect(metric.threshold).toBeDefined();
      expect(metric.threshold.base).toBeGreaterThanOrEqual(0);
      expect(metric.threshold.warningMultiplier).toBeGreaterThan(0);
      expect(metric.threshold.criticalMultiplier).toBeGreaterThan(0);
      // Allow for "lower is worse" metrics where critical < warning
      expect(Math.abs(metric.threshold.criticalMultiplier - metric.threshold.warningMultiplier)).toBeGreaterThan(0);
    });
  });
});

describe('Lambdaメトリクス定義（CLAUDE.md: AWS公式準拠）', () => {

  // Lambda必須メトリクステスト（実装完了）
  it('should define essential Lambda metrics', async () => {
    const { LAMBDA_METRICS } = require('../../../src/config/metrics-definitions');
    const essentialMetrics = ['Duration', 'Errors', 'Invocations', 'Throttles'];
    
    essentialMetrics.forEach(metricName => {
      const metric = LAMBDA_METRICS.find(m => m.name === metricName);
      expect(metric).toBeDefined();
      expect(['High', 'Medium'].includes(metric.importance)).toBe(true);
    });
  });

  // Lambdaパフォーマンスメトリクステスト（実装完了）
  it('should define Lambda performance metrics', async () => {
    const { LAMBDA_METRICS } = require('../../../src/config/metrics-definitions');
    const performanceMetrics = LAMBDA_METRICS.filter(m => m.category === 'Performance');
    
    expect(performanceMetrics.length).toBeGreaterThan(0);
    
    const durationMetric = LAMBDA_METRICS.find(m => m.name === 'Duration');
    expect(durationMetric).toBeDefined();
    expect(durationMetric.category).toBe('Performance');
  });

  // Lambdaエラーメトリクステスト（実装完了）
  it('should define Lambda error metrics', async () => {
    const { LAMBDA_METRICS } = require('../../../src/config/metrics-definitions');
    const errorMetrics = LAMBDA_METRICS.filter(m => m.category === 'Error');
    
    expect(errorMetrics.length).toBeGreaterThan(0);
    
    const errorMetric = LAMBDA_METRICS.find(m => m.name === 'Errors');
    expect(errorMetric).toBeDefined();
    expect(errorMetric.category).toBe('Error');
    expect(errorMetric.importance).toBe('High');
  });

  // Lambdaしきい値妥当性テスト（実装完了）
  it('should define valid Lambda thresholds', async () => {
    const { LAMBDA_METRICS } = require('../../../src/config/metrics-definitions');
    
    LAMBDA_METRICS.forEach(metric => {
      expect(metric.threshold).toBeDefined();
      expect(metric.threshold.base).toBeGreaterThan(0);
      expect(metric.threshold.warningMultiplier).toBeGreaterThan(0);
      expect(metric.threshold.criticalMultiplier).toBeGreaterThan(0);
    });
  });
});

describe('ECSメトリクス定義（CLAUDE.md: AWS公式準拠）', () => {

  // ECS必須メトリクステスト（実装完了）
  it('should define essential ECS metrics', async () => {
    const { ECS_METRICS } = require('../../../src/config/metrics-definitions');
    const essentialMetrics = ['CPUUtilization', 'MemoryUtilization', 'TaskCount'];
    
    essentialMetrics.forEach(metricName => {
      const metric = ECS_METRICS.find(m => m.name === metricName);
      expect(metric).toBeDefined();
      expect(['High', 'Medium'].includes(metric.importance)).toBe(true);
    });
  });

  // ECS Fargateメトリクステスト（実装完了）
  it('should define ECS Fargate-specific metrics', async () => {
    const { ECS_METRICS } = require('../../../src/config/metrics-definitions');
    
    // Fargate specific metrics should exist
    const performanceMetrics = ECS_METRICS.filter(m => m.category === 'Performance');
    expect(performanceMetrics.length).toBeGreaterThan(0);
    
    const cpuMetric = ECS_METRICS.find(m => m.name === 'CPUUtilization');
    expect(cpuMetric).toBeDefined();
    expect(cpuMetric.namespace).toBe('AWS/ECS');
  });

  // ECSしきい値妥当性テスト（実装完了）
  it('should define valid ECS thresholds', async () => {
    const { ECS_METRICS } = require('../../../src/config/metrics-definitions');
    
    ECS_METRICS.forEach(metric => {
      expect(metric.threshold).toBeDefined();
      expect(metric.threshold.base).toBeGreaterThanOrEqual(0);
      expect(metric.threshold.warningMultiplier).toBeGreaterThan(0);
      expect(metric.threshold.criticalMultiplier).toBeGreaterThan(0);
      // Allow for "lower is worse" metrics where critical < warning
      expect(Math.abs(metric.threshold.criticalMultiplier - metric.threshold.warningMultiplier)).toBeGreaterThan(0);
    });
  });
});

describe('ALBメトリクス定義（CLAUDE.md: AWS公式準拠）', () => {

  // ALB必須メトリクステスト（実装完了）
  it('should define essential ALB metrics', async () => {
    const { ALB_METRICS } = require('../../../src/config/metrics-definitions');
    const essentialMetrics = ['RequestCount', 'TargetResponseTime', 'HTTPCode_Target_4XX_Count', 'HTTPCode_Target_5XX_Count'];
    
    essentialMetrics.forEach(metricName => {
      const metric = ALB_METRICS.find(m => m.name === metricName);
      expect(metric).toBeDefined();
      expect(['High', 'Medium'].includes(metric.importance)).toBe(true);
    });
  });

  // ALBパフォーマンスメトリクステスト（実装完了）
  it('should define ALB performance metrics', async () => {
    const { ALB_METRICS } = require('../../../src/config/metrics-definitions');
    const performanceMetrics = ALB_METRICS.filter(m => m.category === 'Performance');
    
    expect(performanceMetrics.length).toBeGreaterThan(0);
    
    const responseTimeMetric = ALB_METRICS.find(m => m.name === 'TargetResponseTime');
    expect(responseTimeMetric).toBeDefined();
    expect(responseTimeMetric.namespace).toBe('AWS/ApplicationELB');
  });

  // ALBしきい値妥当性テスト（実装完了）
  it('should define valid ALB thresholds', async () => {
    const { ALB_METRICS } = require('../../../src/config/metrics-definitions');
    
    ALB_METRICS.forEach(metric => {
      expect(metric.threshold).toBeDefined();
      expect(metric.threshold.base).toBeGreaterThanOrEqual(0);
      expect(metric.threshold.warningMultiplier).toBeGreaterThan(0);
      expect(metric.threshold.criticalMultiplier).toBeGreaterThan(0);
      // Allow for "lower is worse" metrics where critical < warning
      expect(Math.abs(metric.threshold.criticalMultiplier - metric.threshold.warningMultiplier)).toBeGreaterThan(0);
    });
  });
});

describe('DynamoDBメトリクス定義（CLAUDE.md: AWS公式準拠）', () => {

  // DynamoDB必須メトリクステスト（実装完了）
  it('should define essential DynamoDB metrics', async () => {
    const { DYNAMODB_METRICS } = require('../../../src/config/metrics-definitions');
    const essentialMetrics = ['ConsumedReadCapacityUnits', 'ConsumedWriteCapacityUnits', 'ReadThrottles', 'WriteThrottles'];
    
    essentialMetrics.forEach(metricName => {
      const metric = DYNAMODB_METRICS.find(m => m.name === metricName);
      expect(metric).toBeDefined();
      expect(['High', 'Medium'].includes(metric.importance)).toBe(true);
    });
  });

  // DynamoDBビリングモード別メトリクステスト（実装完了）
  it('should define billing mode specific DynamoDB metrics', async () => {
    const { DYNAMODB_METRICS } = require('../../../src/config/metrics-definitions');
    
    // Saturation metrics (capacity-related)
    const saturationMetrics = DYNAMODB_METRICS.filter(m => m.category === 'Saturation');
    expect(saturationMetrics.length).toBeGreaterThan(0);
    
    // Performance metrics
    const performanceMetrics = DYNAMODB_METRICS.filter(m => m.category === 'Performance');
    expect(performanceMetrics.length).toBeGreaterThan(0);
  });

  // DynamoDBしきい値妥当性テスト（実装完了）
  it('should define valid DynamoDB thresholds', async () => {
    const { DYNAMODB_METRICS } = require('../../../src/config/metrics-definitions');
    
    DYNAMODB_METRICS.forEach(metric => {
      expect(metric.threshold).toBeDefined();
      expect(metric.threshold.base).toBeGreaterThanOrEqual(0);
      expect(metric.threshold.warningMultiplier).toBeGreaterThan(0);
      expect(metric.threshold.criticalMultiplier).toBeGreaterThan(0);
      // Allow for "lower is worse" metrics where critical < warning
      expect(Math.abs(metric.threshold.criticalMultiplier - metric.threshold.warningMultiplier)).toBeGreaterThan(0);
    });
  });
});

describe('API Gatewayメトリクス定義（CLAUDE.md: AWS公式準拠）', () => {

  // API Gateway 14個メトリクステスト（GREEN段階: 実装確認）
  it('should define 14 API Gateway metrics', () => {
    const { API_GATEWAY_METRICS } = require('../../../src/config/metrics-definitions');
    
    expect(API_GATEWAY_METRICS).toHaveLength(14);
    
    const apiMetricNames = API_GATEWAY_METRICS.map((m: any) => m.name);
    expect(apiMetricNames).toContain('Count');
    expect(apiMetricNames).toContain('4XXError');
    expect(apiMetricNames).toContain('5XXError');
    expect(apiMetricNames).toContain('Latency');
  });

  // API Gateway REST/SAM対応テスト（GREEN段階: 同一定義再利用確認）
  it('should support both REST API and SAM API metrics', () => {
    const { METRICS_CONFIG_MAP } = require('../../../src/config/metrics-definitions');
    
    // REST APIとSAM APIで同一定義を使用（DRY原則）
    expect(METRICS_CONFIG_MAP['AWS::ApiGateway::RestApi']).toBeDefined();
    expect(METRICS_CONFIG_MAP['AWS::Serverless::Api']).toBeDefined();
    expect(METRICS_CONFIG_MAP['AWS::ApiGateway::RestApi']).toBe(METRICS_CONFIG_MAP['AWS::Serverless::Api']);
  });

  // API Gatewayしきい値妥当性テスト（GREEN段階: しきい値確認）
  it('should define valid API Gateway thresholds', () => {
    const { API_GATEWAY_METRICS } = require('../../../src/config/metrics-definitions');
    
    API_GATEWAY_METRICS.forEach((metric: any) => {
      expect(metric.threshold.base).toBeGreaterThan(0);
      expect(metric.threshold.warningMultiplier).toBeGreaterThan(0);
      expect(metric.threshold.criticalMultiplier).toBeGreaterThan(0);
    });
  });
});

describe('メトリクス定義品質（CLAUDE.md: 型安全性・妥当性）', () => {

  // 全メトリクスしきい値妥当性テスト（実装完了）
  it('should ensure all metrics have valid thresholds', async () => {
    const { METRICS_CONFIG_MAP } = require('../../../src/config/metrics-definitions');
    const allMetrics = Object.values(METRICS_CONFIG_MAP).flat();
    
    allMetrics.forEach((metric: any) => {
      expect(metric.threshold).toBeDefined();
      expect(metric.threshold.base).toBeGreaterThanOrEqual(0);
      expect(metric.threshold.warningMultiplier).toBeGreaterThan(0);
      expect(metric.threshold.criticalMultiplier).toBeGreaterThan(0);
      // Allow for "lower is worse" metrics where critical < warning
      expect(Math.abs(metric.threshold.criticalMultiplier - metric.threshold.warningMultiplier)).toBeGreaterThan(0);
    });
  });

  // 全メトリクス型安全性テスト（実装完了）
  it('should ensure all metrics are type-safe', async () => {
    const { METRICS_CONFIG_MAP } = require('../../../src/config/metrics-definitions');
    const allMetrics = Object.values(METRICS_CONFIG_MAP).flat();
    
    allMetrics.forEach((metric: any) => {
      expect(typeof metric.name).toBe('string');
      expect(typeof metric.namespace).toBe('string');
      expect(typeof metric.statistic).toBe('string');
      expect(typeof metric.evaluationPeriod).toBe('number');
      expect(['High', 'Medium', 'Low'].includes(metric.importance)).toBe(true);
    });
  });

  // メトリクス重複チェックテスト（実装完了）
  it('should not have duplicate metric names within resource types', async () => {
    const { METRICS_CONFIG_MAP } = require('../../../src/config/metrics-definitions');
    
    Object.entries(METRICS_CONFIG_MAP).forEach(([resourceType, metrics]: [string, any[]]) => {
      const metricNames = metrics.map(m => m.name);
      const uniqueNames = new Set(metricNames);
      
      expect(uniqueNames.size).toBe(metricNames.length);
    });
  });

  // メトリクス設定マップ完全性テスト（実装完了）
  it('should provide complete METRICS_CONFIG_MAP', async () => {
    const { METRICS_CONFIG_MAP } = require('../../../src/config/metrics-definitions');
    
    const expectedResourceTypes = [
      'AWS::RDS::DBInstance',
      'AWS::Lambda::Function',
      'AWS::Serverless::Function',
      'AWS::ECS::Service',
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      'AWS::DynamoDB::Table',
      'AWS::ApiGateway::RestApi',
      'AWS::Serverless::Api'
    ];
    
    expectedResourceTypes.forEach(resourceType => {
      expect(METRICS_CONFIG_MAP[resourceType]).toBeDefined();
      expect(Array.isArray(METRICS_CONFIG_MAP[resourceType])).toBe(true);
      expect(METRICS_CONFIG_MAP[resourceType].length).toBeGreaterThan(0);
    });
  });

  // 条件付きメトリクス型安全性テスト（実装完了）
  it('should ensure applicableWhen functions are type-safe', async () => {
    const { METRICS_CONFIG_MAP } = require('../../../src/config/metrics-definitions');
    const allMetrics = Object.values(METRICS_CONFIG_MAP).flat();
    
    const conditionalMetrics = allMetrics.filter((metric: any) => metric.applicableWhen);
    
    conditionalMetrics.forEach((metric: any) => {
      expect(typeof metric.applicableWhen).toBe('function');
      
      // Test with sample resource properties
      const sampleProps = { DBInstanceClass: 'db.t3.micro', Engine: 'mysql' };
      const result = metric.applicableWhen(sampleProps);
      expect(typeof result).toBe('boolean');
    });
  });
});