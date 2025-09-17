// CloudSupporterError Builder Pattern
// CLAUDE.md準拠: DRY原則・Builder Pattern

import { CloudSupporterError, ErrorType, ERROR_CODES } from '../../src/errors';

/**
 * CloudSupporterErrorビルダー
 * テスト用エラーオブジェクトの段階的構築
 */
export class CloudSupporterErrorBuilder {
  private type: ErrorType;
  private message: string;
  private details?: Record<string, unknown>;
  private cause?: Error;
  private suggestions?: string[];

  constructor(type: ErrorType = ErrorType.VALIDATION_ERROR) {
    this.type = type;
    this.message = 'Test error';
  }

  /**
   * エラータイプを設定
   */
  withType(type: ErrorType): this {
    this.type = type;
    return this;
  }

  /**
   * エラーメッセージを設定
   */
  withMessage(message: string): this {
    this.message = message;
    return this;
  }

  /**
   * エラー詳細を設定
   */
  withDetails(details: Record<string, unknown>): this {
    this.details = details;
    return this;
  }

  /**
   * 原因エラーを設定
   */
  withCause(cause: Error): this {
    this.cause = cause;
    return this;
  }

  /**
   * 提案を追加
   */
  withSuggestions(suggestions: string[]): this {
    this.suggestions = suggestions;
    return this;
  }

  /**
   * ビルド
   */
  build(): CloudSupporterError {
    // Include suggestions in details if provided
    let finalDetails = this.details;
    if (this.suggestions && this.suggestions.length > 0) {
      finalDetails = { ...this.details, suggestions: this.suggestions };
    }

    const error = new CloudSupporterError(ERROR_CODES.VALIDATION_FAILED, this.type, this.message, finalDetails);

    if (this.cause) {
      error.cause = this.cause;
    }

    return error;
  }

  /**
   * ファイルエラーのプリセット
   */
  static fileError(path: string): CloudSupporterErrorBuilder {
    return new CloudSupporterErrorBuilder(ErrorType.FILE_ERROR)
      .withMessage(`File not found: ${path}`)
      .withDetails({ path });
  }

  /**
   * バリデーションエラーのプリセット
   */
  static validationError(message: string, details?: Record<string, unknown>): CloudSupporterErrorBuilder {
    const builder = new CloudSupporterErrorBuilder(ErrorType.VALIDATION_ERROR)
      .withMessage(message);

    if (details) {
      builder.withDetails(details);
    }

    return builder;
  }

  /**
   * パースエラーのプリセット
   */
  static parseError(message: string, details?: Record<string, unknown>): CloudSupporterErrorBuilder {
    const builder = new CloudSupporterErrorBuilder(ErrorType.PARSE_ERROR)
      .withMessage(message);

    if (details) {
      builder.withDetails(details);
    }

    return builder;
  }

  /**
   * 出力エラーのプリセット
   */
  static outputError(message: string, details?: Record<string, unknown>): CloudSupporterErrorBuilder {
    const builder = new CloudSupporterErrorBuilder(ErrorType.OUTPUT_ERROR)
      .withMessage(message);

    if (details) {
      builder.withDetails(details);
    }

    return builder;
  }

  /**
   * リソースエラーのプリセット
   */
  static resourceError(message: string, resourceType?: string): CloudSupporterErrorBuilder {
    const builder = new CloudSupporterErrorBuilder(ErrorType.RESOURCE_ERROR)
      .withMessage(message);

    if (resourceType) {
      builder.withDetails({ resourceType });
    }

    return builder;
  }
}

/**
 * ファクトリ関数
 */
export function cloudSupporterError(type?: ErrorType): CloudSupporterErrorBuilder {
  return new CloudSupporterErrorBuilder(type);
}