// DRY原則: 共通型定義を一箇所に集約
// 既存の型定義を再エクスポート
export type { MetricConfig, ResourceConditionFunction } from '../../types/metrics';

// METRICS_STATISTICSの型定義
export interface MetricStatistics {
  totalCount: number;
  byResourceType: {
    RDS: number;
    Lambda: number;
    ECS: number;
    ALB: number;
    DynamoDB: number;
    APIGateway: number;
  };
  byCategory: {
    Performance: number;
    Error: number;
    Saturation: number;
    Latency: number;
  };
  byImportance: {
    High: number;
    Medium: number;
    Low: number;
  };
}