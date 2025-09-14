// メトリクス定義テスト用共通型定義

// Test type definitions for unknown metrics
export interface TestMetric {
  name: string;
  namespace: string;
  unit: string;
  description: string;
  statistic: string;
  evaluationPeriod: number;
  category: string;
  importance: string;
  threshold: {
    base: number;
    warningMultiplier: number;
    criticalMultiplier: number;
  };
  applicableWhen?: (resource: unknown) => boolean;
}