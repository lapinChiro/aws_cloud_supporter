import { METRICS_CONFIG_MAP } from './config-map';
import type { MetricConfig } from './types';

// 型安全なメトリクス取得関数（CLAUDE.md: Type-Driven Development）
export function getMetricsForResourceType(resourceType: string): MetricConfig[] {
  return METRICS_CONFIG_MAP[resourceType] ?? [];
}

// 条件付きメトリクス数カウント（統計用）
export function getConditionalMetricsCount(): number {
  const allMetrics = Object.values(METRICS_CONFIG_MAP).flat();
  return allMetrics.filter(metric => !!metric.applicableWhen).length;
}