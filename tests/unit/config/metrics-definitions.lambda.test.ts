// CLAUDE.md準拠Lambdaメトリクス定義テスト
import { LAMBDA_METRICS } from '../../../src/config/metrics';

import type { TestMetric } from './metrics-definitions.test-types';

describe('Lambdaメトリクス定義（CLAUDE.md: AWS公式準拠）', () => {
  // Lambda必須メトリクステスト（実装完了）
  it('should define essential Lambda metrics',  () => {
    const essentialMetrics = ['Duration', 'Errors', 'Invocations', 'Throttles'];
    essentialMetrics.forEach(metricName => {
      const metric = LAMBDA_METRICS.find((m: unknown) => (m as TestMetric).name === metricName);
      expect(metric).toBeDefined();
      expect(['High', 'Medium'].includes((metric as TestMetric).importance)).toBe(true);
    });
  });

  // Lambdaパフォーマンスメトリクステスト（実装完了）
  it('should define Lambda performance metrics',  () => {
    const performanceMetrics = LAMBDA_METRICS.filter((m: unknown) => (m as TestMetric).category === 'Performance');
    expect(performanceMetrics.length).toBeGreaterThan(0);
    const durationMetric = LAMBDA_METRICS.find((m: unknown) => (m as TestMetric).name === 'Duration');
    expect(durationMetric).toBeDefined();
    expect(durationMetric?.category).toBe('Performance');
  });

  // Lambdaエラーメトリクステスト（実装完了）
  it('should define Lambda error metrics',  () => {
    const errorMetrics = LAMBDA_METRICS.filter((m: unknown) => (m as TestMetric).category === 'Error');
    
    expect(errorMetrics.length).toBeGreaterThan(0);
    
    const errorMetric = LAMBDA_METRICS.find((m: unknown) => (m as TestMetric).name === 'Errors');
    expect(errorMetric).toBeDefined();
    expect(errorMetric?.category).toBe('Error');
    expect(errorMetric?.importance).toBe('High');
  });

  // Lambdaしきい値妥当性テスト（実装完了）
  it('should define valid Lambda thresholds',  () => {
    
    LAMBDA_METRICS.forEach((metric: unknown) => {
      expect((metric as TestMetric).threshold).toBeDefined();
      expect((metric as TestMetric).threshold.base).toBeGreaterThan(0);
      expect((metric as TestMetric).threshold.warningMultiplier).toBeGreaterThan(0);
      expect((metric as TestMetric).threshold.criticalMultiplier).toBeGreaterThan(0);
    });
  });
});