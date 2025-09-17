# CloudSupporter エラーハンドリング設計書

## 1. 概要

本設計書は、CloudSupporterのエラーハンドリングシステムを**必要最小限の機能**で実現するための設計を示します。

### 1.1 設計原則
- **YAGNI**: 今必要な機能のみを実装
- **KISS**: 可能な限りシンプルに保つ
- **UNIX哲学**: エラーハンドリングという一つのことをうまくやる
- **DRY**: エラー定義の一元化

### 1.2 スコープ
- ✅ エラーの一元的定義
- ✅ 型安全なエラー生成
- ✅ 使いやすいAPI
- ❌ 国際化（将来必要になったら追加）
- ❌ エラー分析（ログ分析ツールで対応）
- ❌ 自動リカバリー（アプリケーション層で対応）

## 2. アーキテクチャ

### 2.1 レイヤー構成（3層のみ）

```
┌─────────────────────────┐
│   Application Layer     │ → Errors.Lambda.metricsNotFound()
├─────────────────────────┤
│   Factory Layer         │ → ドメイン特化エラー生成
├─────────────────────────┤
│   Core Layer            │ → CloudSupporterError + カタログ
└─────────────────────────┘
```

### 2.2 ディレクトリ構造

```
src/
└── errors/
    ├── index.ts              # 公開API
    ├── error.class.ts        # CloudSupporterError
    ├── error.types.ts        # 型定義
    ├── error.builder.ts      # シンプルなビルダー
    ├── error.catalog.ts      # エラー定義カタログ
    └── factories/
        ├── index.ts          # ファクトリー統合
        ├── lambda.ts         # Lambda用エラー
        ├── dynamodb.ts       # DynamoDB用エラー
        ├── alb.ts            # ALB用エラー
        └── common.ts         # 共通エラー
```

## 3. 詳細設計

### 3.1 型定義（error.types.ts）

```typescript
// エラーコードの定義（拡張可能）
export const ERROR_CODES = {
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
  
  // Output
  OUTPUT_ERROR: 'OUTPUT_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// エラータイプ
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
```

### 3.2 エラークラス（error.class.ts）

```typescript
import { ErrorCode, ErrorType, ErrorDetails } from './error.types';

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
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CloudSupporterError);
    }
  }

  // JSON出力
  toJSON() {
    return {
      code: this.code,
      type: this.type,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}
```

### 3.3 エラーカタログ（error.catalog.ts）

```typescript
import { ERROR_CODES, ErrorType, ErrorCatalogEntry } from './error.types';

export const ErrorCatalog = {
  // Metrics
  metricsNotFound: (service: string): ErrorCatalogEntry => ({
    code: ERROR_CODES.METRICS_NOT_FOUND,
    type: ErrorType.RESOURCE_ERROR,
    message: `${service} metrics configuration not found`
  }),

  // Resource
  unsupportedResourceType: (expected: string, actual: string): ErrorCatalogEntry => ({
    code: ERROR_CODES.RESOURCE_UNSUPPORTED_TYPE,
    type: ErrorType.RESOURCE_ERROR,
    message: `Only ${expected} are supported, but got ${actual}`
  }),

  // Validation
  validationFailed: (message: string): ErrorCatalogEntry => ({
    code: ERROR_CODES.VALIDATION_FAILED,
    type: ErrorType.VALIDATION_ERROR,
    message
  }),

  // File
  fileNotFound: (path: string): ErrorCatalogEntry => ({
    code: ERROR_CODES.FILE_NOT_FOUND,
    type: ErrorType.FILE_ERROR,
    message: `File not found: ${path}`
  }),

  // Common patterns
  generic: (code: ErrorCode, type: ErrorType, message: string): ErrorCatalogEntry => ({
    code,
    type,
    message
  })
};
```

### 3.4 シンプルビルダー（error.builder.ts）

```typescript
import { CloudSupporterError } from './error.class';
import { ErrorCode, ErrorType, ErrorDetails, ErrorCatalogEntry } from './error.types';

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
      this.details,
      this.filePath,
      this.lineNumber
    );
  }
}
```

### 3.5 ファクトリー（factories/lambda.ts）

```typescript
import { ErrorBuilder } from '../error.builder';
import { ErrorCatalog } from '../error.catalog';
import { ERROR_CODES, ErrorType } from '../error.types';

export const LambdaErrors = {
  metricsNotFound: () => 
    ErrorBuilder.fromCatalog(ErrorCatalog.metricsNotFound('Lambda'))
      .withDetails({ resourceType: 'AWS::Lambda::Function' })
      .build(),

  invalidRuntime: (runtime: string) =>
    ErrorBuilder.fromCatalog(
      ErrorCatalog.generic(
        ERROR_CODES.VALIDATION_FAILED,
        ErrorType.VALIDATION_ERROR,
        `Invalid Lambda runtime: ${runtime}`
      )
    )
    .withDetails({ runtime, resourceType: 'AWS::Lambda::Function' })
    .build(),

  timeoutTooHigh: (timeout: number) =>
    ErrorBuilder.fromCatalog(
      ErrorCatalog.generic(
        ERROR_CODES.VALIDATION_FAILED,
        ErrorType.VALIDATION_ERROR,
        `Lambda timeout ${timeout}s exceeds maximum of 900s`
      )
    )
    .withDetails({ timeout, maximum: 900, resourceType: 'AWS::Lambda::Function' })
    .build()
};
```

### 3.6 公開API（index.ts）

```typescript
// Core exports
export { CloudSupporterError } from './error.class';
export { ErrorType, ErrorCode, ERROR_CODES } from './error.types';
export { ErrorBuilder } from './error.builder';
export { ErrorCatalog } from './error.catalog';

// Factory exports
import { LambdaErrors } from './factories/lambda';
import { DynamoDBErrors } from './factories/dynamodb';
import { ALBErrors } from './factories/alb';
import { CommonErrors } from './factories/common';

export const Errors = {
  Lambda: LambdaErrors,
  DynamoDB: DynamoDBErrors,
  ALB: ALBErrors,
  Common: CommonErrors
} as const;

// Type exports
export type { ErrorDetails, ErrorCatalogEntry } from './error.types';
```

## 4. 実装計画

### 4.1 段階的実装

#### Phase 1: 基盤構築（1週間）
1. 新エラーシステムの実装
2. 単体テストの作成
3. ドキュメント作成

#### Phase 2: 高頻度パターン実装（1週間）
1. "metrics configuration not found"パターン（6箇所）
2. "unsupported type"パターン（2箇所）
3. 共通バリデーションエラー

#### Phase 3: 完全実装（2週間）
1. 全てのエラー生成箇所の実装
2. 統合テストの作成
3. パフォーマンス最適化

## 5. 使用例

### 5.1 基本的な使用

```typescript
// シンプルなエラー生成
throw Errors.Lambda.metricsNotFound();

// カスタムエラー生成
throw ErrorBuilder
  .fromCatalog(ErrorCatalog.validationFailed('Invalid configuration'))
  .withFilePath('/path/to/config.yaml')
  .withLineNumber(42)
  .build();
```


## 5. テスト

```typescript
describe('CloudSupporterError', () => {
  it('should create error from factory', () => {
    const error = Errors.Lambda.metricsNotFound();
    
    expect(error.code).toBe(ERROR_CODES.METRICS_NOT_FOUND);
    expect(error.type).toBe(ErrorType.RESOURCE_ERROR);
    expect(error.message).toBe('Lambda metrics configuration not found');
  });

  it('should support builder pattern', () => {
    const error = ErrorBuilder
      .fromCatalog(ErrorCatalog.fileNotFound('/test.yaml'))
      .withFilePath('/test.yaml')
      .withLineNumber(10)
      .withDetails({ reason: 'Missing file' })
      .build();
    
    expect(error).toBeInstanceOf(CloudSupporterError);
    expect(error.type).toBe(ErrorType.FILE_ERROR);
    expect(error.filePath).toBe('/test.yaml');
    expect(error.lineNumber).toBe(10);
    expect(error.details.reason).toBe('Missing file');
  });
});
```

## 6. まとめ

この設計は以下の原則に従っています：

1. **YAGNI**: 今必要な機能のみを実装
2. **KISS**: 3層のシンプルな構造
3. **UNIX哲学**: エラーハンドリングに特化
4. **DRY**: エラー定義の一元化

総ファイル数は約10ファイル、コード行数は500行以下で、保守性と拡張性を両立した実用的な設計です。