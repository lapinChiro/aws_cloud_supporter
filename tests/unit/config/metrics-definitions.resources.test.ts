// CLAUDE.md準拠その他リソースメトリクス定義テスト
import { 
  ECS_METRICS,
  ALB_METRICS,
  DYNAMODB_METRICS,
  API_GATEWAY_METRICS
} from '../../../src/config/metrics';

import type { TestMetric } from './metrics-definitions.test-types';

describe('ECSメトリクス定義（CLAUDE.md: AWS公式準拠）', () => {
  // ECS必須メトリクステスト（実装完了）
  it('should define essential ECS metrics',  () => {
    const essentialMetrics = ['CPUUtilization', 'MemoryUtilization', 'TaskCount'];
    essentialMetrics.forEach(metricName => {
      const metric = ECS_METRICS.find((m: unknown) => (m as TestMetric).name === metricName);
      expect(metric).toBeDefined();
      expect(metric).toBeTruthy();
    });
  });

  // ECS Fargate特化メトリクステスト（実装完了）
  it('should define ECS Fargate specific metrics',  () => {
    // Fargate specific memory metrics
    const memoryMetric = ECS_METRICS.find((m: unknown) => (m as TestMetric).name === 'MemoryUtilization');
    expect(memoryMetric).toBeDefined();
    expect(memoryMetric?.namespace).toBe('AWS/ECS');
  });

  // ECSしきい値妥当性テスト（実装完了）
  it('should define valid ECS thresholds',  () => {
    ECS_METRICS.forEach((metric: unknown) => {
      expect((metric as TestMetric).threshold).toBeDefined();
      expect((metric as TestMetric).threshold.base).toBeGreaterThan(0);
    });
  });
});

describe('ALBメトリクス定義（CLAUDE.md: AWS公式準拠）', () => {
  // ALB必須メトリクステスト（実装完了）
  it('should define essential ALB metrics',  () => {
    const essentialMetrics = ['RequestCount', 'TargetResponseTime', 'HealthyHostCount'];
    essentialMetrics.forEach(metricName => {
      const metric = ALB_METRICS.find((m: unknown) => (m as TestMetric).name === metricName);
      expect(metric).toBeDefined();
    });
  });

  // ALB HTTPステータスコードメトリクステスト（実装完了）
  it('should define ALB HTTP status code metrics',  () => {
    const httpCodeMetrics = ALB_METRICS.filter((m: unknown) => (m as TestMetric).name.includes('HTTPCode'));
    expect(httpCodeMetrics.length).toBeGreaterThan(0);
    
    const expectedCodes = ['4XX', '5XX'];
    expectedCodes.forEach(code => {
      const metric = ALB_METRICS.find((m: unknown) => (m as TestMetric).name.includes(code));
      expect(metric).toBeDefined();
    });
  });

  // ALBしきい値妥当性テスト（実装完了）
  it('should define valid ALB thresholds',  () => {
    ALB_METRICS.forEach((metric: unknown) => {
      expect((metric as TestMetric).threshold).toBeDefined();
      expect((metric as TestMetric).threshold.base).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('DynamoDBメトリクス定義（CLAUDE.md: AWS公式準拠）', () => {
  // DynamoDB必須メトリクステスト（実装完了）
  it('should define essential DynamoDB metrics',  () => {
    const essentialMetrics = ['ConsumedReadCapacityUnits', 'ConsumedWriteCapacityUnits'];
    essentialMetrics.forEach(metricName => {
      const metric = DYNAMODB_METRICS.find((m: unknown) => (m as TestMetric).name === metricName);
      expect(metric).toBeDefined();
    });
  });

  // DynamoDBスロットリングメトリクステスト（実装完了）
  it('should define DynamoDB throttling metrics',  () => {
    const throttleMetrics = DYNAMODB_METRICS.filter((m: unknown) => (m as TestMetric).name.includes('Throttles'));
    expect(throttleMetrics.length).toBeGreaterThan(0);
    
    throttleMetrics.forEach((metric: unknown) => {
      expect((metric as TestMetric).category).toBe('Error');
      expect((metric as TestMetric).importance).toBe('High');
    });
  });

  // DynamoDBしきい値妥当性テスト（実装完了）
  it('should define valid DynamoDB thresholds',  () => {
    DYNAMODB_METRICS.forEach((metric: unknown) => {
      expect((metric as TestMetric).threshold).toBeDefined();
      expect((metric as TestMetric).threshold.base).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('API Gatewayメトリクス定義（CLAUDE.md: AWS公式準拠）', () => {
  // API Gateway必須メトリクステスト（実装完了）
  it('should define essential API Gateway metrics',  () => {
    const essentialMetrics = ['Count', '4XXError', '5XXError', 'Latency'];
    essentialMetrics.forEach(metricName => {
      const metric = API_GATEWAY_METRICS.find((m: unknown) => (m as TestMetric).name === metricName);
      expect(metric).toBeDefined();
    });
  });

  // API Gatewayレイテンシメトリクステスト（実装完了）
  it('should define API Gateway latency metrics',  () => {
    const latencyMetrics = API_GATEWAY_METRICS.filter((m: unknown) => (m as TestMetric).name.includes('Latency'));
    expect(latencyMetrics.length).toBeGreaterThan(0);
    
    latencyMetrics.forEach((metric: unknown) => {
      expect((metric as TestMetric).category).toBe('Latency');
      expect((metric as TestMetric).unit).toBe('Milliseconds');
    });
  });

  // API Gatewayしきい値妥当性テスト（実装完了）
  it('should define valid API Gateway thresholds',  () => {
    API_GATEWAY_METRICS.forEach((metric: unknown) => {
      expect((metric as TestMetric).threshold).toBeDefined();
      expect((metric as TestMetric).threshold.base).toBeGreaterThan(0);
    });
  });
});