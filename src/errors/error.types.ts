// エラーコードの定義（拡張可能）
export const ERROR_CODES = Object.freeze({
  // Metrics
  METRICS_NOT_FOUND: 'METRICS_NOT_FOUND',

  // Resource
  RESOURCE_UNSUPPORTED_TYPE: 'RESOURCE_UNSUPPORTED_TYPE',
  RESOURCE_INVALID: 'RESOURCE_INVALID',

  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',

  // File
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',

  // Parse
  PARSE_ERROR: 'PARSE_ERROR',

  // Output
  OUTPUT_ERROR: 'OUTPUT_ERROR'
} as const);

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// エラータイプ（既存のutils/error.tsとの互換性維持）
export enum ErrorType {
  FILE_ERROR = 'FILE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  RESOURCE_ERROR = 'RESOURCE_ERROR',
  OUTPUT_ERROR = 'OUTPUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

// カタログエントリー
export interface ErrorCatalogEntry {
  code: ErrorCode;
  type: ErrorType;
  message: string;
}

// エラー詳細
export interface ErrorDetails {
  originalError?: string;
  filePath?: string;
  lineNumber?: number;
  resourceType?: string;
  [key: string]: unknown;
}

// 構造化エラー出力
export interface StructuredError {
  error: ErrorType;
  message: string;
  details?: ErrorDetails;
  filePath?: string;
  lineNumber?: number;
  timestamp: string;
}