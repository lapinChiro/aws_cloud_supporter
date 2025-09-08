// CLAUDE.md準拠エラーハンドリング（KISS原則、型安全性、シンプル設計）
import { ErrorDetails, StructuredError } from '../types/common';

// シンプルな色付き出力（CLAUDE.md: KISS、外部依存最小化）
const colors = {
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`
};

// シンプルなエラータイプ列挙（CLAUDE.md: KISS）
export enum ErrorType {
  FILE_ERROR = 'FILE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  RESOURCE_ERROR = 'RESOURCE_ERROR',
  OUTPUT_ERROR = 'OUTPUT_ERROR'
}

// CLAUDE.md準拠カスタムエラークラス（型安全、No any types）
export class CloudSupporterError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly details?: ErrorDetails,
    public readonly filePath?: string,
    public readonly lineNumber?: number
  ) {
    super(message);
    this.name = 'CloudSupporterError';
    
    // スタックトレース最適化（CLAUDE.md: clarity over cleverness）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CloudSupporterError);
    }
  }

  // 構造化エラー出力（型安全）
  toStructuredOutput(): StructuredError {
    return {
      error: this.type,
      message: this.message,
      details: this.details,
      filePath: this.filePath,
      lineNumber: this.lineNumber,
      timestamp: new Date().toISOString()
    };
  }

  // エラー詳細の型安全な取得
  getDetailsString(): string | undefined {
    if (!this.details) return undefined;
    
    try {
      return JSON.stringify(this.details, null, 2);
    } catch {
      return '[Error: Cannot stringify details]';
    }
  }
}

// CLAUDE.md準拠エラーハンドラ（KISS原則、単一責任）
export class ErrorHandler {
  
  // メインエラーハンドリング（UNIX Philosophy: do one thing well）
  static handle(error: Error): never {
    if (error instanceof CloudSupporterError) {
      this.handleCloudSupporterError(error);
    } else {
      this.handleUnexpectedError(error);
    }
    
    // 適切な終了コードで終了
    const exitCode = this.getExitCode(error);
    process.exit(exitCode);
  }

  // 構造化エラー処理（型安全性）
  private static handleCloudSupporterError(error: CloudSupporterError): void {
    // エラーメッセージ（視認性重視）
    console.error(colors.red(`❌ ${error.message}`));
    
    // ファイル情報（デバッグ支援）
    if (error.filePath) {
      const locationInfo = error.lineNumber 
        ? `${error.filePath}:${error.lineNumber}`
        : error.filePath;
      console.error(colors.gray(`   File: ${locationInfo}`));
    }
    
    // エラー詳細（開発者支援）
    const detailsString = error.getDetailsString();
    if (detailsString) {
      console.error(colors.gray(`   Details: ${detailsString}`));
    }

    // 解決提案（ユーザビリティ向上）
    const suggestion = this.getSuggestion(error.type);
    if (suggestion) {
      console.error(colors.blue(`💡 ${suggestion}`));
    }
  }

  // 予期せぬエラー処理（フォールバック）
  private static handleUnexpectedError(error: Error): void {
    console.error(colors.red(`❌ Unexpected error: ${error.message}`));
    
    // 開発時のデバッグ支援
    if (process.env.NODE_ENV === 'development' || process.env.VERBOSE === 'true') {
      console.error(colors.gray(`   Stack: ${error.stack}`));
    }
  }

  // ユーザーフレンドリーな提案（CLAUDE.md: ユーザビリティ）
  private static getSuggestion(type: ErrorType): string | undefined {
    const suggestions: Record<ErrorType, string> = {
      [ErrorType.FILE_ERROR]: "Check if file exists and has read permissions",
      [ErrorType.PARSE_ERROR]: "Validate CloudFormation template syntax using 'cfn-lint' or AWS CloudFormation Designer",
      [ErrorType.RESOURCE_ERROR]: "Verify resource properties match AWS CloudFormation specification",
      [ErrorType.OUTPUT_ERROR]: "Check output directory exists and has write permissions"
    };
    
    return suggestions[type];
  }

  // 適切な終了コード設定（UNIX Philosophy）
  private static getExitCode(error: Error): number {
    if (!(error instanceof CloudSupporterError)) {
      return 1; // 予期せぬエラー
    }
    
    // エラータイプ別終了コード（シェル連携）
    const exitCodes: Record<ErrorType, number> = {
      [ErrorType.FILE_ERROR]: 1,
      [ErrorType.PARSE_ERROR]: 2,
      [ErrorType.RESOURCE_ERROR]: 3,
      [ErrorType.OUTPUT_ERROR]: 4
    };
    
    return exitCodes[error.type] ?? 1;
  }

  // ログ出力エラーハンドラ（開発時用）
  static logError(error: Error, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}] ` : '';
    
    if (error instanceof CloudSupporterError) {
      const structured = error.toStructuredOutput();
      console.error(`${timestamp} ${contextStr}CloudSupporterError:`, structured);
    } else {
      console.error(`${timestamp} ${contextStr}Error:`, {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
  }
}

// エラータイプ判定ヘルパー（型安全性）
export function isFileError(error: unknown): error is CloudSupporterError {
  return error instanceof CloudSupporterError && error.type === ErrorType.FILE_ERROR;
}

export function isParseError(error: unknown): error is CloudSupporterError {
  return error instanceof CloudSupporterError && error.type === ErrorType.PARSE_ERROR;
}

export function isResourceError(error: unknown): error is CloudSupporterError {
  return error instanceof CloudSupporterError && error.type === ErrorType.RESOURCE_ERROR;
}

export function isOutputError(error: unknown): error is CloudSupporterError {
  return error instanceof CloudSupporterError && error.type === ErrorType.OUTPUT_ERROR;
}

// エラー作成ヘルパー関数（DRY原則）
export function createFileError(message: string, filePath?: string, details?: ErrorDetails): CloudSupporterError {
  return new CloudSupporterError(ErrorType.FILE_ERROR, message, details, filePath);
}

export function createParseError(message: string, filePath?: string, lineNumber?: number, details?: ErrorDetails): CloudSupporterError {
  return new CloudSupporterError(ErrorType.PARSE_ERROR, message, details, filePath, lineNumber);
}

export function createResourceError(message: string, details?: ErrorDetails): CloudSupporterError {
  return new CloudSupporterError(ErrorType.RESOURCE_ERROR, message, details);
}

export function createOutputError(message: string, details?: ErrorDetails): CloudSupporterError {
  return new CloudSupporterError(ErrorType.OUTPUT_ERROR, message, details);
}