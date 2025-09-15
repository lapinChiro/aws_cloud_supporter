// MetricsAnalyzer統合テスト - メインファイル
// CLAUDE.md準拠: No any types、TDD実践、Zero type errors

// 分割されたテストファイルをインポートして実行
import './metrics-analyzer.integration.application.test';
import './metrics-analyzer.integration.performance.test';
import './metrics-analyzer.integration.edge-cases.test';
import './metrics-analyzer.integration.resources.test';
import './metrics-analyzer.integration.formats.test';

// Custom matchers implementation
expect.extend({
  toContainMetric(received: Array<{ metric_name: string }>, metricName: string) {
    const pass = received.some(m => m.metric_name === metricName);
    return {
      message: () => `Expected metrics to${pass ? ' not' : ''} contain ${metricName}`,
      pass,
    };
  },
  toHaveValidThreshold(received: { warning: number; critical: number }) {
    const pass = received.warning < received.critical;
    return {
      message: () => `Expected threshold warning (${received.warning}) < critical (${received.critical})`,
      pass,
    };
  },
  toContainResourceType(received: Array<{ resource_type: string }>, resourceType: string) {
    const pass = received.some(r => r.resource_type === resourceType);
    return {
      message: () => `Expected resources to${pass ? ' not' : ''} contain type ${resourceType}`,
      pass,
    };
  },
  toHaveMetricsInRange(received: unknown[], min: number, max: number) {
    const count = received.length;
    const pass = count >= min && count <= max;
    return {
      message: () => `Expected ${count} metrics to be between ${min} and ${max}`,
      pass,
    };
  }
});

// カスタムマッチャー型定義
declare global {
  namespace jest {
    interface Matchers<R> {
      toContainMetric(metricName: string): R;
      toHaveValidThreshold(): R;
      toContainResourceType(resourceType: string): R;
      toHaveMetricsInRange(min: number, max: number): R;
    }
  }
}