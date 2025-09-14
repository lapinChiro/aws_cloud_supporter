// CLAUDE.md準拠メトリクス定義品質テスト
import { METRICS_CONFIG_MAP } from '../../../src/config/metrics';

import type { TestMetric } from './metrics-definitions.test-types';

describe('メトリクス定義品質（CLAUDE.md: 型安全性・妥当性）', () => {

  // 全メトリクスしきい値妥当性テスト（実装完了）
  it('should ensure all metrics have valid thresholds',  () => {
    const allMetrics = Object.values(METRICS_CONFIG_MAP).flat();
    
    allMetrics.forEach((metric: unknown) => {
      expect((metric as TestMetric).threshold).toBeDefined();
      expect((metric as TestMetric).threshold.base).toBeGreaterThanOrEqual(0);
      expect((metric as TestMetric).threshold.warningMultiplier).toBeGreaterThan(0);
      expect((metric as TestMetric).threshold.criticalMultiplier).toBeGreaterThan(0);
      // Allow for "lower is worse" metrics where critical < warning
      expect(Math.abs((metric as TestMetric).threshold.criticalMultiplier - (metric as TestMetric).threshold.warningMultiplier)).toBeGreaterThan(0);
    });
  });

  // 全メトリクス型安全性テスト（実装完了）
  it('should ensure all metrics are type-safe',  () => {
    const allMetrics = Object.values(METRICS_CONFIG_MAP).flat();
    
    allMetrics.forEach((metric: unknown) => {
      expect(typeof (metric as TestMetric).name).toBe('string');
      expect(typeof (metric as TestMetric).namespace).toBe('string');
      expect(typeof (metric as TestMetric).statistic).toBe('string');
      expect(typeof (metric as TestMetric).evaluationPeriod).toBe('number');
      expect(['High', 'Medium', 'Low'].includes((metric as TestMetric).importance)).toBe(true);
    });
  });

  // メトリクス重複チェックテスト（実装完了）
  it('should not have duplicate metric names within resource types',  () => {
    
    Object.entries(METRICS_CONFIG_MAP).forEach(([, metrics]) => {
      const metricArray = metrics as unknown[];
      const metricNames = metricArray.map((m: unknown) => (m as TestMetric).name);
      const uniqueNames = new Set(metricNames);
      
      expect(uniqueNames.size).toBe(metricNames.length);
    });
  });

  // メトリクス設定マップ完全性テスト（実装完了）
  it('should provide complete METRICS_CONFIG_MAP',  () => {
    
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
      const metrics = METRICS_CONFIG_MAP[resourceType];
      expect(metrics).toBeDefined();
      if (metrics) {
        expect(metrics.length).toBeGreaterThan(0);
      }
    });
  });

  // 条件付きメトリクス型安全性テスト（実装完了）
  it('should ensure applicableWhen functions are type-safe', () => {
    const allMetrics = Object.values(METRICS_CONFIG_MAP).flat();
    
    const conditionalMetrics = allMetrics.filter((metric: unknown) => (metric as TestMetric).applicableWhen);
    
    conditionalMetrics.forEach((metric: unknown) => {
      expect(typeof (metric as TestMetric).applicableWhen).toBe('function');
      
      // Test with sample resource properties
      const sampleProps = { DBInstanceClass: 'db.t3.micro', Engine: 'mysql' };
      const applicableWhen = (metric as TestMetric).applicableWhen;
      expect(applicableWhen).toBeDefined();
      if (applicableWhen) {
        const result = applicableWhen(sampleProps);
        expect(typeof result).toBe('boolean');
      }
    });
  });
});