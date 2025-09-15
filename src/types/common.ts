


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


