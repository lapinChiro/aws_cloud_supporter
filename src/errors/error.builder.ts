import { CloudSupporterError } from './error.class';
import type { ErrorCode, ErrorType, ErrorDetails, ErrorCatalogEntry } from './error.types';

export class ErrorBuilder {
  private code?: ErrorCode;
  private type?: ErrorType;
  private message?: string;
  private details: ErrorDetails = {};
  private filePath?: string;
  private lineNumber?: number;

  // カタログからの初期化
  static fromCatalog(entry: ErrorCatalogEntry): ErrorBuilder {
    return new ErrorBuilder()
      .withCode(entry.code)
      .withType(entry.type)
      .withMessage(entry.message);
  }

  withCode(code: ErrorCode): this {
    this.code = code;
    return this;
  }

  withType(type: ErrorType): this {
    this.type = type;
    return this;
  }

  withMessage(message: string): this {
    this.message = message;
    return this;
  }

  withDetails(details: ErrorDetails): this {
    this.details = { ...this.details, ...details };
    return this;
  }

  withResourceType(resourceType: string): this {
    this.details.resourceType = resourceType;
    return this;
  }

  withFilePath(filePath: string): this {
    this.filePath = filePath;
    return this;
  }

  withLineNumber(lineNumber: number): this {
    this.lineNumber = lineNumber;
    return this;
  }

  build(): CloudSupporterError {
    if (!this.code || !this.type || !this.message) {
      throw new Error('ErrorBuilder: code, type, and message are required');
    }

    return new CloudSupporterError(
      this.code,
      this.type,
      this.message,
      Object.keys(this.details).length > 0 ? this.details : {},
      this.filePath,
      this.lineNumber
    );
  }
}