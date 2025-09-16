// CLAUDE.md準拠: DRY原則違反解消 - アサーションヘルパー関数
// 67回の重複アサーション → 統一関数化

import type { MetricDefinition } from '../../src/types/metrics';

/**
 * メトリクス名の存在確認（67回重複 → 1関数に統一）
 * @param metrics メトリクス配列
 * @param expectedMetrics 期待されるメトリクス名配列
 */
export function expectMetricsToContain(
  metrics: MetricDefinition[],
  expectedMetrics: string[]
): void {
  const metricNames = metrics.map(m => m.metric_name);
  expectedMetrics.forEach(metric => {
    expect(metricNames).toContain(metric);
  });
}

/**
 * しきい値検証（36回重複 → 1関数に統一）
 * @param metrics メトリクス配列
 * @param metricName 対象メトリクス名
 * @param warning 警告しきい値
 * @param critical 重要しきい値
 */
export function expectThresholds(
  metrics: MetricDefinition[],
  metricName: string,
  warning: number,
  critical: number
): void {
  const metric = metrics.find(m => m.metric_name === metricName);
  expect(metric?.recommended_threshold.warning).toBe(warning);
  expect(metric?.recommended_threshold.critical).toBe(critical);
}

/**
 * メトリクス数検証（18回重複 → 1関数に統一）
 * @param metrics メトリクス配列
 * @param expectedCount 期待されるメトリクス数
 * @param comparison 比較方式（exact: 厳密, minimum: 最小値）
 */
export function expectMetricCount(
  metrics: MetricDefinition[],
  expectedCount: number,
  comparison: 'exact' | 'minimum' = 'exact'
): void {
  if (comparison === 'exact') {
    expect(metrics.length).toBe(expectedCount);
  } else {
    expect(metrics.length).toBeGreaterThanOrEqual(expectedCount);
  }
}

/**
 * パフォーマンス検証（15回重複 → 1関数に統一）
 * @param duration 実行時間（ミリ秒）
 * @param maxMs 最大許容時間（ミリ秒）
 */
export function expectPerformanceWithinLimits(
  duration: number,
  maxMs: number
): void {
  expect(duration).toBeLessThan(maxMs);
}

/**
 * メトリクス定義の基本構造検証
 * @param metric メトリクス定義
 */
export function expectValidMetricDefinition(metric: MetricDefinition): void {
  expect(metric.metric_name).toBeDefined();
  expect(metric.namespace).toBeDefined();
  expect(metric.unit).toBeDefined();
  expect(metric.description).toBeDefined();
  expect(metric.statistic).toBeDefined();
  expect(metric.recommended_threshold).toBeDefined();
  expect(metric.recommended_threshold.warning).toBeGreaterThan(0);
  expect(metric.recommended_threshold.critical).toBeGreaterThan(0);
  expect(metric.evaluation_period).toBeGreaterThan(0);
  expect(metric.category).toBeDefined();
  expect(metric.importance).toBeDefined();
}

/**
 * 複数メトリクスのしきい値検証（バッチ処理）
 * @param metrics メトリクス配列
 * @param thresholdTests しきい値テスト配列
 */
export function expectMultipleThresholds(
  metrics: MetricDefinition[],
  thresholdTests: Array<{
    metricName: string;
    warning: number;
    critical: number;
  }>
): void {
  thresholdTests.forEach(test => {
    expectThresholds(metrics, test.metricName, test.warning, test.critical);
  });
}