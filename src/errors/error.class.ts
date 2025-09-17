import type { ErrorCode, ErrorType, ErrorDetails, StructuredError } from './error.types';

export class CloudSupporterError extends Error {
  public readonly code: ErrorCode;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    public readonly type: ErrorType,
    message: string,
    public readonly details?: ErrorDetails,
    public readonly filePath?: string,
    public readonly lineNumber?: number
  ) {
    super(message);
    this.name = 'CloudSupporterError';
    this.code = code;
    this.timestamp = new Date().toISOString();

    // スタックトレース最適化
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CloudSupporterError);
    }
  }

  // JSON出力
  toJSON(): {
    code: ErrorCode;
    type: ErrorType;
    message: string;
    details?: ErrorDetails;
    timestamp: string;
  } {
    const result: {
      code: ErrorCode;
      type: ErrorType;
      message: string;
      details?: ErrorDetails;
      timestamp: string;
    } = {
      code: this.code,
      type: this.type,
      message: this.message,
      timestamp: this.timestamp
    };

    if (this.details !== undefined) {
      result.details = this.details;
    }

    return result;
  }

  // 構造化エラー出力（旧システムとの互換性）
  toStructuredOutput(): StructuredError {
    const result: StructuredError = {
      error: this.type,
      message: this.message,
      timestamp: this.timestamp
    };

    if (this.details !== undefined) {
      result.details = this.details;
    }
    if (this.filePath !== undefined) {
      result.filePath = this.filePath;
    }
    if (this.lineNumber !== undefined) {
      result.lineNumber = this.lineNumber;
    }

    return result;
  }
}