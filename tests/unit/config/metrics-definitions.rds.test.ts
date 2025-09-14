// CLAUDE.md準拠RDSメトリクス定義テスト
import { RDS_METRICS } from '../../../src/config/metrics';

import type { TestMetric } from './metrics-definitions.test-types';

describe('RDSメトリクス定義（CLAUDE.md: AWS公式準拠）', () => {
  // RDS必須メトリクステスト（実装完了）
  it('should define essential RDS metrics', () => {
    const essentialMetrics = ['CPUUtilization', 'DatabaseConnections', 'ReadLatency', 'WriteLatency'];
    essentialMetrics.forEach(metricName => {
      const metric = RDS_METRICS.find((m: unknown) => (m as TestMetric).name === metricName);
      expect(metric).toBeDefined();
      expect((metric as TestMetric).importance).toBe('High');
    });
  });

  // RDSエンジン固有メトリクステスト（実装完了）
  it('should define engine-specific RDS metrics', () => {
    // MySQL specific metrics
    const binLogMetric = RDS_METRICS.find((m: unknown) => (m as TestMetric).name === 'BinLogDiskUsage');
    expect(binLogMetric).toBeDefined();
    expect(binLogMetric?.applicableWhen).toBeDefined();
    // Burstable instance metrics
    const creditMetrics = RDS_METRICS.filter((m: unknown) => (m as TestMetric).name.includes('Credit'));
    expect(creditMetrics.length).toBeGreaterThan(0);
  });

  // RDS条件付きメトリクステスト（実装完了）
  it('should define conditional RDS metrics with applicableWhen',  () => {
    const conditionalMetrics = RDS_METRICS.filter((m: unknown) => (m as TestMetric).applicableWhen);
    expect(conditionalMetrics.length).toBeGreaterThan(0);
    // Test applicableWhen functions are functions
    conditionalMetrics.forEach((metric: unknown) => {
      expect(typeof (metric as TestMetric).applicableWhen).toBe('function');
    });
  });

  // RDSしきい値妥当性テスト（実装完了）
  it('should define valid RDS thresholds',  () => {
    RDS_METRICS.forEach((metric: unknown) => {
      expect((metric as TestMetric).threshold).toBeDefined();
      expect((metric as TestMetric).threshold.base).toBeGreaterThanOrEqual(0);
      expect((metric as TestMetric).threshold.warningMultiplier).toBeGreaterThan(0);
      expect((metric as TestMetric).threshold.criticalMultiplier).toBeGreaterThan(0);
      // Allow for "lower is worse" metrics where critical < warning
      expect(Math.abs((metric as TestMetric).threshold.criticalMultiplier - (metric as TestMetric).threshold.warningMultiplier)).toBeGreaterThan(0);
    });
  });
});