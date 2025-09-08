// CLAUDE.md準拠共通型定義（DRY原則、any型完全排除）

// 基本的な値型（型安全性確保）
export type Primitive = string | number | boolean | null | undefined;

// CloudFormation基本型
export type AWSRegion = 
  | 'us-east-1' | 'us-east-2' | 'us-west-1' | 'us-west-2'
  | 'eu-west-1' | 'eu-west-2' | 'eu-west-3' | 'eu-central-1'
  | 'ap-southeast-1' | 'ap-southeast-2' | 'ap-northeast-1' | 'ap-northeast-2'
  | string; // 新リージョン対応

export type AWSAccountId = string; // 12桁数字だが文字列として扱う

// メトリクス関連共通型（DRY原則）
export type MetricStatistic = 'Average' | 'Sum' | 'Maximum' | 'Minimum';
export type MetricCategory = 'Performance' | 'Error' | 'Saturation' | 'Latency';
export type ImportanceLevel = 'High' | 'Medium' | 'Low';

// 時間関連型
export type EvaluationPeriod = 60 | 300 | 900 | 3600; // CloudWatch標準期間
export type TimestampISO = string; // ISO-8601形式

// エラー処理型（CLAUDE.md: No any types）
export interface ErrorDetails {
  originalError?: string;
  fileSize?: number;
  lineNumber?: number;
  columnNumber?: number;
  filePath?: string;
  duration?: number;
  error?: string;
  nearText?: string;
  [key: string]: unknown; // any型ではなくunknown型使用
}

export interface StructuredError {
  error: string;
  message: string;
  details?: ErrorDetails | undefined;
  filePath?: string | undefined;
  lineNumber?: number | undefined;
  timestamp: TimestampISO;
}

// パフォーマンス監視型
export interface PerformanceMetrics {
  processingTimeMs: number;
  memoryUsageMB: number;
  resourceCount: number;
  metricsGenerated: number;
}

// オプション型（CLI用）
export interface AnalysisOptions {
  resourceTypes?: string[];
  includeLowImportance?: boolean;
  verbose?: boolean;
}