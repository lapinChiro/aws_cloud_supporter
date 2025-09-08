# AWS Cloud Supporter フェーズ2 開発タスク一覧 (修正版)

## CLAUDE.md準拠タスク管理

- **タスクID形式**: T-XXX (001~999)
- **工数単位**: 時間（実装・テスト・ドキュメント込み）
- **依存関係**: 並行実行最大化（SOLID原則準拠）
- **TDD強制**: 全タスクでRED-GREEN-BLUEサイクル必須
- **型安全性**: any型禁止、strict mode必須
- **既存活用**: 車輪の再発明禁止（p-limit等活用）

## Phase 1: Infrastructure Setup (Week 1-2)

### T-001: プロジェクト初期化・基本環境構築
**説明**: Node.js/TypeScriptプロジェクトの完全初期化
**依存関係**: なし
**前提条件**: 
- Node.js 18.x以上インストール済み
- Git環境利用可能
**完了条件**:
- package.json（下記仕様）作成完了
- 指定ディレクトリ構造作成完了
- `npm install`実行成功
- `git init && git add . && git commit`実行成功
**関連要件**: 全体基盤、品質要件（依存関係最小化）
**成果物**:
```json
// package.json（完全版）
{
  "name": "aws-cloud-supporter",
  "version": "1.0.0",
  "description": "Generate CloudWatch metrics recommendations for CloudFormation templates",
  "main": "dist/cli/index.js",
  "bin": {
    "aws-cloud-supporter": "dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/cli/index.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "yaml": "^2.3.0",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "@types/node": "^20.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```
```
// ディレクトリ構造（完全版）
aws-cloud-supporter/
├── src/
│   ├── cli/
│   │   ├── commands.ts
│   │   └── index.ts
│   ├── core/
│   │   ├── analyzer.ts
│   │   ├── parser.ts
│   │   └── formatter.ts
│   ├── generators/
│   │   ├── base.generator.ts
│   │   ├── rds.generator.ts
│   │   ├── lambda.generator.ts
│   │   ├── ecs.generator.ts
│   │   ├── alb.generator.ts
│   │   ├── dynamodb.generator.ts
│   │   └── apigateway.generator.ts
│   ├── types/
│   │   ├── cloudformation.ts
│   │   ├── metrics.ts
│   │   └── common.ts
│   ├── config/
│   │   └── metrics-definitions.ts
│   └── utils/
│       ├── file.ts
│       ├── error.ts
│       └── logger.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── dist/
└── docs/
```
**見積もり**: 3時間
**受け入れ基準**:
- [ ] `npm install`がエラーなく完了
- [ ] 全ディレクトリが正しく作成されている
- [ ] .gitignore に node_modules, dist が含まれている

### T-002: TypeScript設定・ビルド環境
**説明**: TypeScript strict mode設定とビルドパイプライン完全構築（CLAUDE.md: Zero type errors）
**依存関係**: T-001
**前提条件**: T-001完了
**TDDサイクル**:
1. **RED**: tsconfig.jsonのstrictチェックテスト作成
2. **GREEN**: strict mode設定でコンパイル成功
3. **BLUE**: ビルドスクリプト最適化
**完了条件**:
- tsconfig.json（下記仕様）作成完了
- `npm run build`でdist/にコンパイル成功
- `npm run lint`でstrictチェック成功
- サンプルTypeScriptファイルでテスト実行成功
**関連要件**: 品質要件（型安全性、TypeScript strict mode）
**成果物**:
```json
// tsconfig.json（完全版）
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```
**見積もり**: 2時間
**受け入れ基準**:
- [ ] `npm run build`でエラーなくコンパイル完了
- [ ] dist/ディレクトリにJSファイルが生成
- [ ] TypeScript strict modeでエラーなし

### T-003: テスト環境・設定完全構築
**説明**: Jest + TypeScript + カバレッジ測定の完全テスト環境構築
**依存関係**: T-002
**前提条件**: T-002完了
**完了条件**:
- jest.config.js（下記仕様）作成完了
- `npm test`でテスト実行成功
- `npm run test:coverage`でカバレッジ測定成功
- カスタムマッチャー設定完了
- サンプルテスト実行成功
**関連要件**: 品質受入基準（カバレッジ90%+）
**成果物**:
```javascript
// jest.config.js（完全版）
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/cli/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  verbose: true
};
```
```typescript
// tests/setup.ts（カスタムマッチャー）
expect.extend({
  toContainMetric(received: any[], metricName: string) {
    const pass = received.some(m => m.metric_name === metricName);
    return {
      message: () => `Expected metrics to${pass ? ' not' : ''} contain ${metricName}`,
      pass,
    };
  },
  toHaveValidThreshold(received: any) {
    const pass = received.warning < received.critical;
    return {
      message: () => `Expected threshold warning < critical`,
      pass,
    };
  }
});
```
**見積もり**: 4時間
**受け入れ基準**:
- [ ] `npm test`がエラーなく実行完了
- [ ] カバレッジレポートが正しく生成
- [ ] カスタムマッチャーが動作

## Phase 2: Core Components (Week 3-4) - 並行実行最適化

### T-004: 基本型定義・インターフェース完全実装
**説明**: CloudFormation型、メトリクス型、全インターフェースの完全実装（CLAUDE.md: No any types）
**依存関係**: T-003
**前提条件**: T-003完了
**TDDサイクル**:
1. **RED**: 型安全性テスト作成（any型使用で失敗）
2. **GREEN**: 厳密型定義実装（any型排除）
3. **BLUE**: Union型活用でリファクタリング
**完了条件**:
- 下記3ファイル完全実装完了
- 型定義単体テスト実装・実行成功
- TypeScriptコンパイルエラーなし
- 型安全性検証テスト実行成功
**関連要件**: R-001~R-009（型安全性）、設計書3.3節
**成果物**:
```typescript
// src/types/cloudformation.ts（完全版）
// CLAUDE.md準拠型定義（any型完全排除）
export interface CloudFormationTemplate {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, ParameterDefinition>;
  Resources: Record<string, CloudFormationResource>;
  Outputs?: Record<string, OutputDefinition>;
  Metadata?: CloudFormationMetadata;
}

export interface ParameterDefinition {
  Type: 'String' | 'Number' | 'List<Number>' | 'CommaDelimitedList';
  Default?: unknown;
  AllowedValues?: unknown[];
  Description?: string;
}

export interface OutputDefinition {
  Description?: string;
  Value: unknown;
  Export?: {
    Name: string;
  };
}

export interface CloudFormationMetadata {
  'AWS::CloudFormation::Designer'?: {
    id?: string;
  };
  [key: string]: unknown; // unknownで型安全性確保
}

export interface CloudFormationResource {
  Type: string;
  Properties?: unknown; // 型安全性のためunknown使用
  Condition?: string;
  DependsOn?: string | string[];
  Metadata?: CloudFormationMetadata;
}

// 厳密型定義（CLAUDE.md: 型安全性）
export interface RDSDBInstance extends CloudFormationResource {
  Type: 'AWS::RDS::DBInstance';
  Properties?: RDSProperties;
}

export interface RDSProperties {
  DBInstanceClass?: DBInstanceClass;
  Engine?: DatabaseEngine;
  EngineVersion?: string;
  AllocatedStorage?: number;
  StorageType?: StorageType;
  MultiAZ?: boolean;
  BackupRetentionPeriod?: number;
  EnablePerformanceInsights?: boolean;
  [key: string]: unknown; // any型排除
}

// 厳密な列挙型
export type DBInstanceClass = 
  | 'db.t3.micro' | 'db.t3.small' | 'db.t3.medium' | 'db.t3.large'
  | 'db.m5.large' | 'db.m5.xlarge' | 'db.m5.2xlarge'
  | 'db.r5.large' | 'db.r5.xlarge'
  | string; // 将来のインスタンスクラス対応

export type DatabaseEngine = 'mysql' | 'postgresql' | 'mariadb' | 'oracle-ee' | 'sqlserver-ex';
export type StorageType = 'standard' | 'gp2' | 'gp3' | 'io1' | 'io2';

// 他のリソース型も同様に定義...
```
```typescript
// src/types/metrics.ts（完全版）
export interface MetricDefinition {
  metric_name: string;
  namespace: string;
  unit: string;
  description: string;
  statistic: 'Average' | 'Sum' | 'Maximum' | 'Minimum';
  recommended_threshold: ThresholdDefinition;
  evaluation_period: number;
  category: 'Performance' | 'Error' | 'Saturation' | 'Latency';
  importance: 'High' | 'Medium' | 'Low';
  dimensions?: MetricDimension[];
}

export interface MetricConfig {
  name: string;
  namespace: string;
  unit: string;
  description: string;
  statistic: 'Average' | 'Sum' | 'Maximum' | 'Minimum';
  evaluationPeriod: number;
  category: 'Performance' | 'Error' | 'Saturation' | 'Latency';
  importance: 'High' | 'Medium' | 'Low';
  threshold: {
    base: number;
    warningMultiplier: number;
    criticalMultiplier: number;
  };
  applicableWhen?: (resource: CloudFormationResource) => boolean;
}
```
**見積もり**: 6時間
**受け入れ基準**:
- [ ] 全インターフェース定義完了
- [ ] 型定義テスト全て通過
- [ ] Union型で型安全性確保

### T-005: エラーハンドリングシステム実装
**説明**: 統一エラーハンドリングクラス・カスタム例外の完全実装（CLAUDE.md: KISS原則）
**依存関係**: T-004（並行実行可能）
**前提条件**: T-004完了
**TDDサイクル**:
1. **RED**: エラー処理テスト作成（失敗ケース）
2. **GREEN**: シンプルなエラーハンドラ実装
3. **BLUE**: エラーメッセージ最適化
**完了条件**:
- ErrorHandler, CloudSupporterError完全実装
- 4種類エラー分類処理実装完了
- エラー提案メッセージ実装完了
- 終了コード設定実装完了
- 単体テスト・統合テスト実行成功
**関連要件**: R-012, R-013, R-014（エラーハンドリング）
**成果物**:
```typescript
// src/utils/error.ts（完全版）
export enum ErrorType {
  FILE_ERROR = 'FILE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  RESOURCE_ERROR = 'RESOURCE_ERROR',
  OUTPUT_ERROR = 'OUTPUT_ERROR'
}

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
    Error.captureStackTrace(this, CloudSupporterError);
  }

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
}

export class ErrorHandler {
  static handle(error: Error): never {
    if (error instanceof CloudSupporterError) {
      this.handleStructuredError(error);
    } else {
      this.handleUnexpectedError(error);
    }
    process.exit(this.getExitCode(error));
  }

  private static handleStructuredError(error: CloudSupporterError): void {
    console.error(chalk.red(`❌ ${error.message}`));
    
    if (error.filePath) {
      console.error(chalk.gray(`   File: ${error.filePath}${error.lineNumber ? `:${error.lineNumber}` : ''}`));
    }
    
    if (error.details) {
      console.error(chalk.gray(`   Details: ${JSON.stringify(error.details, null, 2)}`));
    }

    const suggestion = this.getSuggestion(error.type);
    if (suggestion) {
      console.error(chalk.blue(`💡 ${suggestion}`));
    }
  }

  private static getSuggestion(type: ErrorType): string | null {
    const suggestions: Record<ErrorType, string> = {
      [ErrorType.FILE_ERROR]: "Check file path exists and is readable",
      [ErrorType.PARSE_ERROR]: "Validate CloudFormation template syntax using 'cfn-lint'",
      [ErrorType.RESOURCE_ERROR]: "Verify resource properties match AWS CloudFormation specification",
      [ErrorType.OUTPUT_ERROR]: "Check output directory exists and is writable"
    };
    return suggestions[type] || null;
  }

  private static getExitCode(error: Error): number {
    if (!(error instanceof CloudSupporterError)) return 1;
    
    const exitCodes: Record<ErrorType, number> = {
      [ErrorType.FILE_ERROR]: 1,
      [ErrorType.PARSE_ERROR]: 2,
      [ErrorType.RESOURCE_ERROR]: 3,
      [ErrorType.OUTPUT_ERROR]: 4
    };
    
    return exitCodes[error.type] || 1;
  }
}
```
**見積もり**: 5時間
**受け入れ基準**:
- [ ] 4種類エラー全て適切処理
- [ ] エラーメッセージが分かりやすく表示
- [ ] 終了コードが仕様通り設定

### T-006: TemplateParser完全実装
**説明**: CloudFormationテンプレート（YAML/JSON）解析処理の完全実装
**依存関係**: T-005（並行実行可能）
**前提条件**: T-005完了
**完了条件**:
- ITemplateParser, TemplateParser完全実装
- YAML/JSON両対応実装完了
- ファイル読み込みエラーハンドリング実装完了
- 構文エラー詳細報告実装完了
- パフォーマンス要件（50MB・5秒）達成確認
- 単体・統合テスト実行成功
**関連要件**: R-001, R-002, R-012, R-013
**成果物**:
```typescript
// src/core/parser.ts（完全版）
import { readFileSync } from 'fs';
import { parse as parseYAML } from 'yaml';
import { CloudFormationTemplate } from '../types/cloudformation';
import { CloudSupporterError, ErrorType } from '../utils/error';

export interface ITemplateParser {
  parse(filePath: string): Promise<CloudFormationTemplate>;
}

export class TemplateParser implements ITemplateParser {
  async parse(filePath: string): Promise<CloudFormationTemplate> {
    try {
      // ファイル存在・権限チェック
      await this.validateFile(filePath);
      
      // ファイル読み込み（パフォーマンス監視）
      const content = await this.readFile(filePath);
      
      // フォーマット判定・解析
      const template = this.parseContent(content, filePath);
      
      // 基本構造検証
      this.validateTemplateStructure(template, filePath);
      
      return template;
    } catch (error) {
      if (error instanceof CloudSupporterError) {
        throw error;
      }
      throw new CloudSupporterError(
        ErrorType.FILE_ERROR,
        `Failed to parse template: ${error.message}`,
        { originalError: error.message },
        filePath
      );
    }
  }

  private async validateFile(filePath: string): Promise<void> {
    const fs = await import('fs/promises');
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new CloudSupporterError(
          ErrorType.FILE_ERROR,
          `Path is not a file: ${filePath}`,
          undefined,
          filePath
        );
      }
      if (stats.size > 50 * 1024 * 1024) { // 50MB制限
        throw new CloudSupporterError(
          ErrorType.FILE_ERROR,
          `File too large: ${(stats.size / 1024 / 1024).toFixed(1)}MB (max: 50MB)`,
          { fileSize: stats.size },
          filePath
        );
      }
    } catch (error) {
      if (error instanceof CloudSupporterError) throw error;
      throw new CloudSupporterError(
        ErrorType.FILE_ERROR,
        `Cannot access file: ${error.code}`,
        { error: error.code },
        filePath
      );
    }
  }

  private async readFile(filePath: string): Promise<string> {
    const fs = await import('fs/promises');
    try {
      const startTime = performance.now();
      const content = await fs.readFile(filePath, 'utf8');
      const duration = performance.now() - startTime;
      
      if (duration > 5000) { // 5秒制限
        throw new CloudSupporterError(
          ErrorType.FILE_ERROR,
          `File reading timeout: ${duration.toFixed(0)}ms (max: 5000ms)`,
          { duration: Math.round(duration) },
          filePath
        );
      }
      
      return content;
    } catch (error) {
      throw new CloudSupporterError(
        ErrorType.FILE_ERROR,
        `Failed to read file: ${error.message}`,
        { originalError: error.message },
        filePath
      );
    }
  }

  private parseContent(content: string, filePath: string): CloudFormationTemplate {
    const isJSON = filePath.toLowerCase().endsWith('.json');
    
    try {
      if (isJSON) {
        return JSON.parse(content);
      } else {
        return parseYAML(content) as CloudFormationTemplate;
      }
    } catch (error) {
      const errorDetails = this.extractSyntaxError(error, content, isJSON);
      throw new CloudSupporterError(
        ErrorType.PARSE_ERROR,
        `${isJSON ? 'JSON' : 'YAML'} syntax error: ${error.message}`,
        errorDetails,
        filePath,
        errorDetails.lineNumber
      );
    }
  }

  private extractSyntaxError(error: any, content: string, isJSON: boolean): any {
    if (isJSON && error instanceof SyntaxError) {
      // JSON構文エラー詳細抽出
      const match = error.message.match(/position (\d+)/);
      if (match) {
        const position = parseInt(match[1]);
        const lines = content.substring(0, position).split('\n');
        return {
          lineNumber: lines.length,
          columnNumber: lines[lines.length - 1].length,
          nearText: content.substring(Math.max(0, position - 50), position + 50)
        };
      }
    }
    // YAML構文エラーは yaml パッケージが詳細提供
    return {
      lineNumber: error.linePos?.[0]?.line,
      columnNumber: error.linePos?.[0]?.col,
      nearText: error.linePos?.[0]?.text
    };
  }

  private validateTemplateStructure(template: any, filePath: string): void {
    if (!template || typeof template !== 'object') {
      throw new CloudSupporterError(
        ErrorType.PARSE_ERROR,
        'Template must be a valid object',
        undefined,
        filePath
      );
    }

    if (!template.Resources || typeof template.Resources !== 'object') {
      throw new CloudSupporterError(
        ErrorType.PARSE_ERROR,
        'Template must contain "Resources" section',
        undefined,
        filePath
      );
    }

    // AWSTemplateFormatVersion チェック（警告レベル）
    if (!template.AWSTemplateFormatVersion) {
      console.warn(chalk.yellow('⚠️  Missing AWSTemplateFormatVersion, assuming 2010-09-09'));
    }
  }
}
```
**見積もり**: 10時間
**受け入れ基準**:
- [ ] YAML/JSON両方正常解析
- [ ] 構文エラー時に行番号・詳細表示
- [ ] ファイルサイズ50MB・読み込み5秒制限実装
- [ ] 異常系テストケース10パターン以上実行成功

### T-007: ResourceExtractor実装（パフォーマンス重視）
**説明**: サポート対象リソース高速抽出処理実装
**依存関係**: T-006（並行実行可能）
**前提条件**: T-006完了
**完了条件**:
- ResourceExtractor完全実装
- 6つのリソースタイプ高速判定実装
- O(n)アルゴリズム実装（500リソース・3秒以内）
- サポート対象外リソース集計実装
- パフォーマンステスト実行成功
- 単体・統合テスト実行成功
**関連要件**: R-003（抽出・性能）
**成果物**:
```typescript
// src/core/analyzer.ts（ResourceExtractor部分）
import { CloudFormationTemplate, CloudFormationResource, SupportedResource } from '../types/cloudformation';
import { ResourceType } from '../types/common';

export interface ExtractResult {
  supported: SupportedResource[];
  unsupported: string[]; // logical IDs
  totalCount: number;
  extractionTimeMs: number;
}

export class ResourceExtractor {
  private static readonly SUPPORTED_TYPES = new Set([
    'AWS::RDS::DBInstance',
    'AWS::Lambda::Function',
    'AWS::Serverless::Function',
    'AWS::ECS::Service',
    'AWS::ElasticLoadBalancingV2::LoadBalancer',
    'AWS::DynamoDB::Table',
    'AWS::ApiGateway::RestApi',
    'AWS::Serverless::Api'
  ]);

  extract(template: CloudFormationTemplate): ExtractResult {
    const startTime = performance.now();
    
    const supported: SupportedResource[] = [];
    const unsupported: string[] = [];
    
    // O(n)での高速処理
    for (const [logicalId, resource] of Object.entries(template.Resources)) {
      if (this.isSupportedType(resource.Type)) {
        supported.push({
          ...resource,
          LogicalId: logicalId
        } as SupportedResource);
      } else {
        unsupported.push(logicalId);
      }
    }

    const extractionTimeMs = performance.now() - startTime;
    
    // パフォーマンス監視
    if (extractionTimeMs > 3000) {
      console.warn(`⚠️  Resource extraction took ${extractionTimeMs.toFixed(0)}ms (target: <3000ms)`);
    }

    return {
      supported,
      unsupported,
      totalCount: Object.keys(template.Resources).length,
      extractionTimeMs: Math.round(extractionTimeMs)
    };
  }

  private isSupportedType(type: string): boolean {
    return ResourceExtractor.SUPPORTED_TYPES.has(type);
  }

  // ECS Fargate判定（特殊ケース）
  private isFargateService(resource: CloudFormationResource): boolean {
    if (resource.Type !== 'AWS::ECS::Service') return false;
    
    const props = resource.Properties;
    return props?.LaunchType === 'FARGATE' || 
           props?.CapacityProviderStrategy?.some((cap: any) => 
             cap.CapacityProvider === 'FARGATE' || cap.CapacityProvider === 'FARGATE_SPOT'
           );
  }

  // ALB判定（NLBを除外）
  private isApplicationLoadBalancer(resource: CloudFormationResource): boolean {
    if (resource.Type !== 'AWS::ElasticLoadBalancingV2::LoadBalancer') return false;
    
    const props = resource.Properties;
    return !props?.Type || props.Type === 'application';
  }
}
```
**見積もり**: 6時間
**受け入れ基準**:
- [ ] 500リソースを3秒以内で処理
- [ ] 6つのサポート対象リソース正確判定
- [ ] ECS FargateとALBの条件判定実装
- [ ] パフォーマンステスト自動実行

### T-008: BaseMetricsGenerator・しきい値計算実装
**説明**: メトリクス生成基底クラスと動的しきい値計算の完全実装
**依存関係**: T-007（並行実行可能）
**前提条件**: T-007完了
**完了条件**:
- BaseMetricsGenerator抽象クラス完全実装
- しきい値動的計算アルゴリズム実装完了
- リソーススケール係数計算実装完了
- メトリクス生成パフォーマンス最適化完了
- 単体テスト・モックテスト実行成功
**関連要件**: R-004~R-009（メトリクス生成）
**成果物**:
```typescript
// src/generators/base.generator.ts（完全版）
import { CloudFormationResource } from '../types/cloudformation';
import { MetricDefinition, MetricConfig } from '../types/metrics';
import { ILogger } from '../utils/logger';

export interface IMetricsGenerator {
  getSupportedTypes(): string[];
  generate(resource: CloudFormationResource): Promise<MetricDefinition[]>;
}

export abstract class BaseMetricsGenerator implements IMetricsGenerator {
  constructor(protected logger: ILogger) {}

  abstract getSupportedTypes(): string[];
  protected abstract getMetricsConfig(resource: CloudFormationResource): MetricConfig[];
  protected abstract getResourceScale(resource: CloudFormationResource): number;

  async generate(resource: CloudFormationResource): Promise<MetricDefinition[]> {
    const startTime = performance.now();
    
    try {
      // 適用可能メトリクス決定
      const applicableConfigs = this.getApplicableMetrics(resource);
      
      // メトリクス定義生成
      const metrics = applicableConfigs.map(config => 
        this.buildMetricDefinition(resource, config)
      );

      const duration = performance.now() - startTime;
      this.logger.debug(`Generated ${metrics.length} metrics for ${resource.LogicalId} in ${duration.toFixed(1)}ms`);

      // パフォーマンス監視
      if (duration > 1000) {
        console.warn(`⚠️  Metrics generation slow: ${duration.toFixed(0)}ms for ${resource.LogicalId}`);
      }

      return metrics;
    } catch (error) {
      this.logger.error(`Failed to generate metrics for ${resource.LogicalId}:`, error);
      throw error;
    }
  }

  private getApplicableMetrics(resource: CloudFormationResource): MetricConfig[] {
    const allConfigs = this.getMetricsConfig(resource);
    return allConfigs.filter(config => {
      if (!config.applicableWhen) return true;
      return config.applicableWhen(resource);
    });
  }

  private buildMetricDefinition(
    resource: CloudFormationResource,
    config: MetricConfig
  ): MetricDefinition {
    const threshold = this.calculateThreshold(resource, config);
    
    return {
      metric_name: config.name,
      namespace: config.namespace,
      unit: config.unit,
      description: config.description,
      statistic: config.statistic,
      recommended_threshold: threshold,
      evaluation_period: config.evaluationPeriod,
      category: config.category,
      importance: config.importance,
      dimensions: this.buildDimensions(resource, config)
    };
  }

  private calculateThreshold(
    resource: CloudFormationResource,
    config: MetricConfig
  ): { warning: number; critical: number } {
    const scale = this.getResourceScale(resource);
    const base = config.threshold.base;
    
    return {
      warning: Math.round(base * scale * config.threshold.warningMultiplier),
      critical: Math.round(base * scale * config.threshold.criticalMultiplier)
    };
  }

  private buildDimensions(
    resource: CloudFormationResource,
    config: MetricConfig
  ): Array<{ name: string; value: string }> {
    // リソースタイプに基づく共通ディメンション
    const dimensions = [
      {
        name: this.getPrimaryDimensionName(resource.Type),
        value: resource.LogicalId
      }
    ];
    
    return dimensions;
  }

  private getPrimaryDimensionName(resourceType: string): string {
    const dimensionMap: Record<string, string> = {
      'AWS::RDS::DBInstance': 'DBInstanceIdentifier',
      'AWS::Lambda::Function': 'FunctionName',
      'AWS::Serverless::Function': 'FunctionName',
      'AWS::ECS::Service': 'ServiceName',
      'AWS::ElasticLoadBalancingV2::LoadBalancer': 'LoadBalancer',
      'AWS::DynamoDB::Table': 'TableName',
      'AWS::ApiGateway::RestApi': 'ApiName',
      'AWS::Serverless::Api': 'ApiName'
    };
    
    return dimensionMap[resourceType] || 'ResourceId';
  }
}
```
**見積もり**: 8時間
**受け入れ基準**:
- [ ] しきい値計算が正確（warning < critical）
- [ ] リソースサイズに応じたスケール係数計算
- [ ] メトリクス生成を1秒以内で完了
- [ ] 抽象クラス設計でGeneratorパターン実現

## Phase 3: Metrics Definitions & Generators (Week 5-6)

### T-009: メトリクス定義データ完全作成
**説明**: 6リソースタイプの具体的メトリクス定義実装（CLAUDE.md: DRY原則 + any型排除）
**依存関係**: T-008
**前提条件**: T-008完了
**TDDサイクル**:
1. **RED**: メトリクス特性テスト（116個のメトリクス検証）
2. **GREEN**: TypeScriptメトリクス定義実装
3. **BLUE**: DRY原則で重複排除リファクタリング
**完了条件**:
- RDS: 25個メトリクス実装完了
- Lambda: 18個メトリクス実装完了
- ECS: 15個メトリクス実装完了
- ALB: 20個メトリクス実装完了
- DynamoDB: 22個メトリクス実装完了
- API Gateway: 16個メトリクス実装完了
- 条件付きメトリクス（applicableWhen）実装確認
- AWS公式ドキュメント整合性確認
**関連要件**: R-004~R-009（各リソースメトリクス仕様）
**成果物**:
```typescript
// src/config/metrics-definitions.ts（完全版）
import { MetricConfig } from '../types/metrics';
import { CloudFormationResource, RDSDBInstance } from '../types/cloudformation';

// RDSメトリクス定義（25個）
export const RDS_METRICS: MetricConfig[] = [
  // パフォーマンス系（10個）
  {
    name: 'CPUUtilization',
    namespace: 'AWS/RDS',
    unit: 'Percent',
    description: 'データベースインスタンスのCPU使用率',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'High',
    threshold: {
      base: 70,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.3
    }
  },
  {
    name: 'DatabaseConnections',
    namespace: 'AWS/RDS',
    unit: 'Count',
    description: 'データベース接続数',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'High',
    threshold: {
      base: 20,
      warningMultiplier: 1.0,
      criticalMultiplier: 2.0
    }
  },
  {
    name: 'ReadLatency',
    namespace: 'AWS/RDS',
    unit: 'Seconds',
    description: 'ディスク読み取り平均レイテンシー',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Latency',
    importance: 'High',
    threshold: {
      base: 0.02, // 20ms
      warningMultiplier: 1.0,
      criticalMultiplier: 2.5
    }
  },
  // ... 他22個のメトリクス
  
  // 条件付きメトリクス（MySQL特有）
  {
    name: 'BinLogDiskUsage',
    namespace: 'AWS/RDS',
    unit: 'Bytes',
    description: 'バイナリログディスク使用量（MySQL）',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 1_000_000_000, // 1GB
      warningMultiplier: 1.0,
      criticalMultiplier: 2.0
    },
    applicableWhen: (resource: CloudFormationResource) => {
      const rds = resource as RDSDBInstance;
      return rds.Properties?.Engine === 'mysql' && 
             (rds.Properties?.BackupRetentionPeriod || 0) > 0;
    }
  }
];

// Lambdaメトリクス定義（18個）
export const LAMBDA_METRICS: MetricConfig[] = [
  {
    name: 'Duration',
    namespace: 'AWS/Lambda',
    unit: 'Milliseconds',
    description: '関数実行時間',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'High',
    threshold: {
      base: 5000, // 5秒
      warningMultiplier: 0.8,
      criticalMultiplier: 1.0
    }
  },
  {
    name: 'Errors',
    namespace: 'AWS/Lambda',
    unit: 'Count',
    description: '関数実行エラー数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'High',
    threshold: {
      base: 5,
      warningMultiplier: 1.0,
      criticalMultiplier: 2.0
    }
  },
  // ... 他16個のメトリクス
];

// メトリクス定義マップ
export const METRICS_CONFIG_MAP: Record<string, MetricConfig[]> = {
  'AWS::RDS::DBInstance': RDS_METRICS,
  'AWS::Lambda::Function': LAMBDA_METRICS,
  'AWS::Serverless::Function': LAMBDA_METRICS,
  'AWS::ECS::Service': ECS_METRICS,
  'AWS::ElasticLoadBalancingV2::LoadBalancer': ALB_METRICS,
  'AWS::DynamoDB::Table': DYNAMODB_METRICS,
  'AWS::ApiGateway::RestApi': API_GATEWAY_METRICS,
  'AWS::Serverless::Api': API_GATEWAY_METRICS
};
```
**見積もり**: 20時間
**受け入れ基準**:
- [ ] 全116個メトリクス実装完了
- [ ] 各メトリクスのしきい値が合理的
- [ ] 条件付きメトリクスが正常動作
- [ ] AWS公式ドキュメントとの整合性確認

### T-010: RDS・Lambda Generator実装
**説明**: RDS DBInstance、Lambda Function用メトリクス生成器実装（CLAUDE.md: 単一責任原則）
**依存関係**: T-009
**前提条件**: T-009完了
**TDDサイクル**:
1. **RED**: Generatorメトリクス数テスト（失敗）
2. **GREEN**: 最小限Generator実装（テスト通過）
3. **BLUE**: リソース固有ロジック整理
**完了条件**:
- RDSMetricsGenerator完全実装
- LambdaMetricsGenerator完全実装
- エンジン別・ランタイム別メトリクス実装
- 動的しきい値調整実装
- 単体テスト・統合テスト実行成功
**関連要件**: R-004, R-005
**成果物**:
```typescript
// src/generators/rds.generator.ts
export class RDSMetricsGenerator extends BaseMetricsGenerator {
  getSupportedTypes(): string[] {
    return ['AWS::RDS::DBInstance'];
  }

  protected getMetricsConfig(resource: CloudFormationResource): MetricConfig[] {
    return METRICS_CONFIG_MAP['AWS::RDS::DBInstance'];
  }

  protected getResourceScale(resource: CloudFormationResource): number {
    const rds = resource as RDSDBInstance;
    const instanceClass = rds.Properties?.DBInstanceClass || 'db.t3.micro';
    
    // インスタンスクラス別スケール係数
    const scaleMap: Record<string, number> = {
      'db.t3.micro': 0.5,
      'db.t3.small': 0.7,
      'db.t3.medium': 1.0,
      'db.t3.large': 1.2,
      'db.m5.large': 1.5,
      'db.m5.xlarge': 2.0,
      'db.m5.2xlarge': 3.0,
      'db.r5.large': 1.8,
      'db.r5.xlarge': 2.5
    };
    
    return scaleMap[instanceClass] || 1.0;
  }
}
```
**見積もり**: 12時間
**受け入れ基準**:
- [ ] RDS: エンジン別メトリクス（MySQL/PostgreSQL等）正常動作
- [ ] Lambda: ランタイム・メモリサイズ考慮のしきい値調整
- [ ] 各Generator 1秒以内処理完了
- [ ] 25個・18個メトリクス生成確認

### T-011: ECS・ALB Generator実装  
**説明**: ECS Fargate Service、ALB用メトリクス生成器実装
**依存関係**: T-010
**前提条件**: T-010完了
**完了条件**:
- ECSMetricsGenerator完全実装（Fargate判定含む）
- ALBMetricsGenerator完全実装（Application判定含む）
- CPU・メモリ設定考慮しきい値調整実装
- 単体テスト・統合テスト実行成功
**関連要件**: R-006, R-007
**成果物**: ECSMetricsGenerator, ALBMetricsGenerator
**見積もり**: 10時間
**受け入れ基準**:
- [ ] ECS: Fargateタイプ正確判定
- [ ] ALB: Application LB正確判定（NLB除外）
- [ ] 各Generator 1秒以内処理完了

### T-012: DynamoDB・API Gateway Generator実装
**説明**: DynamoDB Table、API Gateway用メトリクス生成器実装
**依存関係**: T-011
**前提条件**: T-011完了
**完了条件**:
- DynamoDBMetricsGenerator完全実装
- APIGatewayMetricsGenerator完全実装
- BillingMode・GSI考慮メトリクス実装
- 単体テスト・統合テスト実行成功
**関連要件**: R-008, R-009
**成果物**: DynamoDBMetricsGenerator, APIGatewayMetricsGenerator
**見積もり**: 10時間
**受け入れ基準**:
- [ ] DynamoDB: Pay-per-request vs Provisioned メトリクス分岐
- [ ] API Gateway: REST API・SAM API対応
- [ ] 22個・16個メトリクス生成確認

## Phase 4: Integration & Output (Week 7-8)

### T-013: JSON OutputFormatter実装
**説明**: JSON形式出力フォーマッタの完全実装
**依存関係**: T-012
**前提条件**: T-012完了
**完了条件**:
- requirement.md仕様準拠JSON出力実装
- JSON Schema バリデーション実装
- パフォーマンス最適化（5MB・2秒以内）
- 美しいフォーマット出力実装
- 単体・統合テスト実行成功
**関連要件**: R-010（JSON出力）
**成果物**:
```typescript
// src/core/formatter.ts（JSON部分）
export interface IOutputFormatter {
  formatJSON(result: AnalysisResult): Promise<string>;
  formatHTML(result: AnalysisResult): Promise<string>;
}

export class OutputFormatter implements IOutputFormatter {
  async formatJSON(result: AnalysisResult): Promise<string> {
    const startTime = performance.now();
    
    try {
      // requirement.mdスキーマ準拠の出力生成
      const output = {
        metadata: {
          version: "1.0.0",
          generated_at: new Date().toISOString(),
          template_path: result.templatePath,
          total_resources: result.totalResources,
          supported_resources: result.resources.length,
          processing_time_ms: result.processingTimeMs
        },
        resources: result.resources.map(resource => ({
          logical_id: resource.logical_id,
          resource_type: resource.resource_type,
          resource_properties: this.sanitizeProperties(resource.resource_properties),
          metrics: resource.metrics.map(metric => ({
            metric_name: metric.metric_name,
            namespace: metric.namespace,
            unit: metric.unit,
            description: metric.description,
            statistic: metric.statistic,
            recommended_threshold: {
              warning: metric.recommended_threshold.warning,
              critical: metric.recommended_threshold.critical
            },
            evaluation_period: metric.evaluation_period,
            category: metric.category,
            importance: metric.importance
          }))
        })),
        unsupported_resources: result.unsupportedResources || []
      };

      const jsonString = JSON.stringify(output, null, 2);
      const duration = performance.now() - startTime;
      
      // パフォーマンス監視
      if (duration > 2000) {
        console.warn(`⚠️  JSON formatting slow: ${duration.toFixed(0)}ms`);
      }
      
      if (jsonString.length > 5 * 1024 * 1024) { // 5MB制限
        console.warn(`⚠️  Large JSON output: ${(jsonString.length / 1024 / 1024).toFixed(1)}MB`);
      }

      return jsonString;
    } catch (error) {
      throw new CloudSupporterError(
        ErrorType.OUTPUT_ERROR,
        `Failed to format JSON output: ${error.message}`,
        { originalError: error.message }
      );
    }
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    // セキュリティ: 機密情報をサニタイズ
    const sanitized = { ...properties };
    const sensitiveKeys = ['MasterUserPassword', 'Password', 'SecretString'];
    
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}
```
**見積もり**: 8時間
**受け入れ基準**:
- [ ] requirement.md JSON Schema 100%準拠
- [ ] 5MB以下・2秒以内で出力完了
- [ ] セキュリティ考慮（機密情報マスク）

### T-014: HTML OutputFormatter実装
**説明**: HTML形式レスポンシブレポートの完全実装
**依存関係**: T-013
**前提条件**: T-013完了
**完了条件**:
- レスポンシブHTMLレポート実装
- CSS-in-JS（外部依存なし）実装
- メトリクス重要度別色分け実装
- フィルタリング・検索機能実装
- モダンブラウザ対応確認
- パフォーマンス最適化（3秒以内）
**関連要件**: R-011（HTML出力）
**成果物**:
```typescript
// src/core/formatter.ts（HTML部分）
export class OutputFormatter implements IOutputFormatter {
  async formatHTML(result: AnalysisResult): Promise<string> {
    const startTime = performance.now();
    
    try {
      const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudWatch Metrics Report</title>
    <style>
        ${this.getEmbeddedCSS()}
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🔍 CloudWatch Metrics Report</h1>
            <div class="metadata">
                <span class="badge">Generated: ${new Date(result.metadata.generated_at).toLocaleString()}</span>
                <span class="badge">Resources: ${result.resources.length}/${result.totalResources}</span>
                <span class="badge">Processing: ${result.processingTimeMs}ms</span>
            </div>
        </header>
        
        <div class="controls">
            <input type="text" id="searchInput" placeholder="🔍 Search metrics..." class="search-input">
            <select id="importanceFilter" class="filter-select">
                <option value="">All Importance Levels</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
            </select>
            <select id="categoryFilter" class="filter-select">
                <option value="">All Categories</option>
                <option value="Performance">Performance</option>
                <option value="Error">Error</option>
                <option value="Saturation">Saturation</option>
                <option value="Latency">Latency</option>
            </select>
        </div>

        <div class="resources">
            ${result.resources.map(resource => this.generateResourceHTML(resource)).join('')}
        </div>
        
        ${result.unsupportedResources.length > 0 ? this.generateUnsupportedHTML(result.unsupportedResources) : ''}
    </div>
    
    <script>
        ${this.getEmbeddedJS()}
    </script>
</body>
</html>`;

      const duration = performance.now() - startTime;
      if (duration > 3000) {
        console.warn(`⚠️  HTML formatting slow: ${duration.toFixed(0)}ms`);
      }

      return html;
    } catch (error) {
      throw new CloudSupporterError(
        ErrorType.OUTPUT_ERROR,
        `Failed to format HTML output: ${error.message}`,
        { originalError: error.message }
      );
    }
  }

  private getEmbeddedCSS(): string {
    return `
        /* レスポンシブCSSスタイル */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; border-radius: 8px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header h1 { font-size: 2rem; margin-bottom: 12px; color: #2c3e50; }
        .metadata { display: flex; gap: 12px; flex-wrap: wrap; }
        .badge { background: #e3f2fd; color: #1565c0; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; }
        
        /* コントロール */
        .controls { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .search-input, .filter-select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
        .search-input { flex: 1; min-width: 200px; }
        
        /* リソースカード */
        .resource-card { background: white; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .resource-header { background: #f8f9fa; padding: 16px; border-bottom: 1px solid #e9ecef; }
        .resource-title { font-size: 1.2rem; font-weight: 600; color: #495057; }
        .resource-type { color: #6c757d; font-size: 0.9rem; }
        
        /* メトリクステーブル */
        .metrics-table { width: 100%; border-collapse: collapse; }
        .metrics-table th, .metrics-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef; }
        .metrics-table th { background: #f8f9fa; font-weight: 600; color: #495057; }
        
        /* 重要度別色分け */
        .importance-high { border-left: 4px solid #dc3545; }
        .importance-medium { border-left: 4px solid #fd7e14; }
        .importance-low { border-left: 4px solid #28a745; }
        
        /* カテゴリバッジ */
        .category-performance { background: #e3f2fd; color: #1976d2; }
        .category-error { background: #ffebee; color: #d32f2f; }
        .category-saturation { background: #fff3e0; color: #f57c00; }
        .category-latency { background: #f3e5f5; color: #7b1fa2; }
        
        /* レスポンシブ */
        @media (max-width: 768px) {
            .controls { flex-direction: column; }
            .search-input, .filter-select { width: 100%; }
            .metadata { flex-direction: column; }
            .metrics-table { font-size: 0.9rem; }
            .metrics-table th, .metrics-table td { padding: 8px; }
        }
    `;
  }

  private getEmbeddedJS(): string {
    return `
        // フィルタリング・検索機能
        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('searchInput');
            const importanceFilter = document.getElementById('importanceFilter');
            const categoryFilter = document.getElementById('categoryFilter');
            
            function applyFilters() {
                const searchTerm = searchInput.value.toLowerCase();
                const importanceValue = importanceFilter.value;
                const categoryValue = categoryFilter.value;
                
                const rows = document.querySelectorAll('.metrics-table tbody tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    const importance = row.dataset.importance;
                    const category = row.dataset.category;
                    
                    const matchesSearch = !searchTerm || text.includes(searchTerm);
                    const matchesImportance = !importanceValue || importance === importanceValue;
                    const matchesCategory = !categoryValue || category === categoryValue;
                    
                    row.style.display = (matchesSearch && matchesImportance && matchesCategory) ? '' : 'none';
                });
            }
            
            searchInput.addEventListener('input', applyFilters);
            importanceFilter.addEventListener('change', applyFilters);
            categoryFilter.addEventListener('change', applyFilters);
        });
    `;
  }
}
```
**見積もり**: 14時間
**受け入れ基準**:
- [ ] レスポンシブデザインでスマホ対応
- [ ] フィルタリング・検索機能正常動作
- [ ] 外部CSS/JSライブラリ依存なし
- [ ] モダンブラウザ（Chrome, Firefox, Safari, Edge）対応確認

### T-015: MetricsAnalyzer統合・並行処理実装
**説明**: 全コンポーネント統合とパフォーマンス最適化実装
**依存関係**: T-014
**前提条件**: T-014完了
**完了条件**:
- MetricsAnalyzer統合実装完了
- 6つのGenerator並行実行実装完了
- メモリ使用量監視実装完了
- 30秒以内処理・256MB以下確認
- 統合テスト実行成功
**関連要件**: 性能要件（30秒・256MB）、R-001~R-011統合
**成果物**:
```typescript
// src/core/analyzer.ts（統合版完全実装）
export class MetricsAnalyzer {
  private generators: Map<string, IMetricsGenerator> = new Map();
  
  constructor(
    private parser: ITemplateParser,
    private formatter: IOutputFormatter,
    private logger: ILogger
  ) {
    this.initializeGenerators();
  }

  private initializeGenerators(): void {
    const generators = [
      new RDSMetricsGenerator(this.logger),
      new LambdaMetricsGenerator(this.logger),
      new ECSMetricsGenerator(this.logger),
      new ALBMetricsGenerator(this.logger),
      new DynamoDBMetricsGenerator(this.logger),
      new APIGatewayMetricsGenerator(this.logger)
    ];

    for (const generator of generators) {
      for (const type of generator.getSupportedTypes()) {
        this.generators.set(type, generator);
      }
    }
  }

  async analyze(templatePath: string, options: AnalysisOptions): Promise<AnalysisResult> {
    const startTime = performance.now();
    let memoryPeak = 0;
    
    try {
      // メモリ監視開始
      const memoryMonitor = setInterval(() => {
        const usage = process.memoryUsage().heapUsed;
        memoryPeak = Math.max(memoryPeak, usage);
        
        if (usage > 256 * 1024 * 1024) { // 256MB制限
          clearInterval(memoryMonitor);
          throw new CloudSupporterError(
            ErrorType.RESOURCE_ERROR,
            `Memory usage exceeded: ${(usage / 1024 / 1024).toFixed(1)}MB (limit: 256MB)`
          );
        }
      }, 1000);

      // 1. テンプレート解析
      this.logger.info(`🔍 Parsing template: ${templatePath}`);
      const template = await this.parser.parse(templatePath);

      // 2. リソース抽出
      this.logger.info('📊 Extracting supported resources');
      const extractor = new ResourceExtractor();
      const extractResult = extractor.extract(template);

      // 3. 並行メトリクス生成
      this.logger.info(`⚡ Generating metrics for ${extractResult.supported.length} resources`);
      const resourceMetrics = await this.generateMetricsInParallel(extractResult.supported, options);

      // 4. 結果構築
      const result = this.buildAnalysisResult(templatePath, extractResult, resourceMetrics, startTime);

      clearInterval(memoryMonitor);
      
      // パフォーマンス検証
      if (result.processingTimeMs > 30000) {
        console.warn(`⚠️  Processing time exceeded target: ${result.processingTimeMs}ms (target: <30000ms)`);
      }
      
      this.logger.info(`✅ Analysis completed in ${result.processingTimeMs}ms, peak memory: ${(memoryPeak / 1024 / 1024).toFixed(1)}MB`);
      
      return result;
    } catch (error) {
      if (error instanceof CloudSupporterError) throw error;
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        `Analysis failed: ${error.message}`,
        { originalError: error.message }
      );
    }
  }

  private async generateMetricsInParallel(
    resources: SupportedResource[], 
    options: AnalysisOptions
  ): Promise<ResourceWithMetrics[]> {
    // リソースタイプ別グループ化
    const resourceGroups = this.groupResourcesByType(resources);
    
    // タイプ別並行処理
    const groupPromises = Array.from(resourceGroups.entries()).map(
      ([type, groupResources]) => this.processResourceGroup(type, groupResources, options)
    );

    const groupResults = await Promise.allSettled(groupPromises);
    const allResults: ResourceWithMetrics[] = [];

    for (const result of groupResults) {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      } else {
        this.logger.warn(`Resource group processing failed: ${result.reason}`);
      }
    }

    return allResults;
  }

  private async processResourceGroup(
    type: string, 
    resources: SupportedResource[], 
    options: AnalysisOptions
  ): Promise<ResourceWithMetrics[]> {
    const generator = this.generators.get(type);
    if (!generator) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        `No generator found for resource type: ${type}`
      );
    }

    // CLAUDE.md準拠: Don't Reinvent the Wheel (p-limit使用)
    const limit = pLimit(5);
    
    const promises = resources.map(resource => 
      limit(async () => {
        const metrics = await generator.generate(resource);
        
        // 重要度フィルタ適用
        const filteredMetrics = options.includeLowImportance 
          ? metrics 
          : metrics.filter(m => m.importance !== 'Low');

        return {
          logical_id: resource.LogicalId,
          resource_type: resource.Type,
          resource_properties: resource.Properties || {},
          metrics: filteredMetrics
        };
      })
    );

    return Promise.all(promises);
  }
}
```
**見積もり**: 12時間
**受け入れ基準**:
- [ ] 30秒以内・256MB以下で処理完了
- [ ] 並行処理で30%以上性能向上
- [ ] メモリリークなし
- [ ] 全Generatorが正常統合動作

### T-016: CLI完全実装・統合
**説明**: CLI完全版実装と全オプション統合
**依存関係**: T-015
**前提条件**: T-015完了
**完了条件**:
- 全CLIオプション実装完了
- ヘルプメッセージ完全版実装
- エラー時適切終了コード設定確認
- 実行ファイル生成・動作確認完了
- CLI統合テスト実行成功
**関連要件**: CLI要件、ユーザビリティ要件
**成果物**:
```typescript
// src/cli/commands.ts（完全版）
export class MetricsCommand {
  static create(): Command {
    const program = new Command();

    program
      .name('aws-cloud-supporter')
      .description('Generate CloudWatch metrics recommendations for CloudFormation templates')
      .version('1.0.0')
      .argument('<template>', 'CloudFormation template file path (.yaml/.yml/.json)')
      .option('-o, --output <format>', 'Output format: json|html|yaml', 'json')
      .option('-f, --file <path>', 'Output file path (default: stdout)')
      .option('--resource-types <types>', 'Comma-separated resource types to analyze (RDS,Lambda,ECS,ALB,DynamoDB,APIGateway)')
      .option('--include-low', 'Include low importance metrics (default: exclude)')
      .option('-v, --verbose', 'Enable verbose logging')
      .option('--no-color', 'Disable colored output')
      .addHelpText('after', `
Examples:
  $ aws-cloud-supporter template.yaml
  $ aws-cloud-supporter template.yaml -o html -f report.html
  $ aws-cloud-supporter template.yaml --resource-types RDS,Lambda
  $ aws-cloud-supporter template.yaml --include-low --verbose

Supported Resource Types:
  RDS        - AWS::RDS::DBInstance
  Lambda     - AWS::Lambda::Function, AWS::Serverless::Function
  ECS        - AWS::ECS::Service (Fargate only)
  ALB        - AWS::ElasticLoadBalancingV2::LoadBalancer (Application only)
  DynamoDB   - AWS::DynamoDB::Table
  APIGateway - AWS::ApiGateway::RestApi, AWS::Serverless::Api

For more information: https://github.com/your-org/aws-cloud-supporter
      `)
      .action(async (templatePath, options) => {
        try {
          await this.execute(templatePath, options);
        } catch (error) {
          ErrorHandler.handle(error);
        }
      });

    return program;
  }

  private static async execute(templatePath: string, options: CLIOptions): Promise<void> {
    // ログ設定
    const logger = new Logger(options.verbose ? 'debug' : 'info', !options.noColor);
    
    // 分析オプション構築
    const analysisOptions: AnalysisOptions = {
      resourceTypes: options.resourceTypes?.split(',').map(t => t.trim()),
      includeLowImportance: options.includeLow,
      verbose: options.verbose
    };

    // 分析実行
    logger.info(`🚀 AWS Cloud Supporter v1.0.0`);
    logger.info(`📁 Template: ${templatePath}`);
    logger.info(`📊 Output: ${options.output}${options.file ? ` (${options.file})` : ' (stdout)'}`);
    
    const analyzer = new MetricsAnalyzer(
      new TemplateParser(),
      new OutputFormatter(),
      logger
    );

    const result = await analyzer.analyze(templatePath, analysisOptions);
    
    // 出力フォーマット
    const formatter = new OutputFormatter();
    let output: string;
    
    switch (options.output) {
      case 'json':
        output = await formatter.formatJSON(result);
        break;
      case 'html':
        output = await formatter.formatHTML(result);
        break;
      case 'yaml':
        output = await formatter.formatYAML(result);
        break;
      default:
        throw new CloudSupporterError(
          ErrorType.OUTPUT_ERROR,
          `Unsupported output format: ${options.output}`
        );
    }

    // ファイル出力 or 標準出力
    if (options.file) {
      await this.writeToFile(options.file, output);
      logger.success(`✅ Report saved: ${options.file}`);
      logger.info(`📊 Generated ${result.resources.length} resource reports with ${result.resources.reduce((sum, r) => sum + r.metrics.length, 0)} metrics`);
    } else {
      console.log(output);
    }
  }

  private static async writeToFile(filePath: string, content: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      throw new CloudSupporterError(
        ErrorType.OUTPUT_ERROR,
        `Failed to write output file: ${error.message}`,
        { filePath, error: error.code }
      );
    }
  }
}
```
**見積もり**: 8時間
**受け入れ基準**:
- [ ] 全CLIオプションが正常動作
- [ ] ヘルプメッセージが分かりやすい
- [ ] エラー時適切な終了コードで終了
- [ ] dist/cli/index.jsが実行可能

## Phase 5: Testing & Quality (Week 8)

### T-017: 統合テスト・E2Eテスト実装
**説明**: 統合テスト・E2Eテストスイート完全実装
**依存関係**: T-016
**前提条件**: T-016完了
**完了条件**:
- 統合テスト20パターン実装・実行成功
- E2Eテスト10パターン実装・実行成功
- パフォーマンステスト実装・実行成功
- 実テンプレートでの動作確認完了
- テストカバレッジ目標達成
**関連要件**: 品質受入基準（テストカバレッジ90%+）
**成果物**:
```typescript
// tests/integration/analyzer.integration.test.ts
describe('MetricsAnalyzer Integration Tests', () => {
  let analyzer: MetricsAnalyzer;

  beforeEach(() => {
    analyzer = new MetricsAnalyzer(
      new TemplateParser(),
      new OutputFormatter(),
      new Logger('error')
    );
  });

  it('should process web application template with all resource types', async () => {
    const result = await analyzer.analyze('tests/fixtures/web-app-complete.yaml', {
      includeLowImportance: true
    });

    expect(result.metadata.supported_resources).toBe(6);
    expect(result.resources).toHaveLength(6);

    // RDS メトリクス検証
    const rdsResource = result.resources.find(r => r.resource_type === 'AWS::RDS::DBInstance')!;
    expect(rdsResource.metrics.length).toBeGreaterThanOrEqual(20);
    expect(rdsResource.metrics).toContainMetric('CPUUtilization');
    expect(rdsResource.metrics).toContainMetric('DatabaseConnections');

    // Lambda メトリクス検証
    const lambdaResource = result.resources.find(r => r.resource_type === 'AWS::Lambda::Function')!;
    expect(lambdaResource.metrics.length).toBeGreaterThanOrEqual(15);
    expect(lambdaResource.metrics).toContainMetric('Duration');
    expect(lambdaResource.metrics).toContainMetric('Errors');

    // しきい値妥当性検証
    for (const resource of result.resources) {
      for (const metric of resource.metrics) {
        expect(metric.recommended_threshold).toHaveValidThreshold();
      }
    }
  });

  it('should handle large template within performance limits', async () => {
    const startTime = performance.now();
    
    const result = await analyzer.analyze('tests/fixtures/large-template-500-resources.yaml', {});
    
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(30000); // 30秒以内
    expect(result.metadata.total_resources).toBeGreaterThan(400);
    expect(result.processingTimeMs).toBeLessThan(30000);
  });

  // 他18パターンのテスト...
});

// tests/e2e/cli.e2e.test.ts
describe('CLI E2E Tests', () => {
  it('should generate JSON report from real CloudFormation template', async () => {
    const { stdout, stderr, exitCode } = await execSync(
      'node dist/cli/index.js tests/fixtures/real-serverless-template.yaml -o json',
      { encoding: 'utf8' }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe('');

    const result = JSON.parse(stdout);
    expect(result).toMatchObject({
      metadata: expect.objectContaining({
        version: '1.0.0',
        supported_resources: expect.any(Number)
      }),
      resources: expect.arrayContaining([
        expect.objectContaining({
          logical_id: expect.any(String),
          resource_type: expect.any(String),
          metrics: expect.arrayContaining([
            expect.objectContaining({
              metric_name: expect.any(String),
              recommended_threshold: expect.objectContaining({
                warning: expect.any(Number),
                critical: expect.any(Number)
              })
            })
          ])
        })
      ])
    });
  });

  // 他9パターンのE2Eテスト...
});
```
**見積もり**: 16時間
**受け入れ基準**:
- [ ] 統合テスト20パターン全て通過
- [ ] E2Eテスト10パターン全て通過
- [ ] テストカバレッジ90%以上達成
- [ ] 実CloudFormationテンプレート10種類で動作確認

### T-018: ドキュメント・パッケージング完了
**説明**: 完全ドキュメント整備とリリースパッケージ作成
**依存関係**: T-017
**前提条件**: T-017完了
**完了条件**:
- README.md完全版作成完了
- CHANGELOG.md作成完了
- package.json本番版設定完了
- npm package作成・テスト完了
- インストール手順書作成完了
**関連要件**: 品質受入基準（ドキュメント整備）
**成果物**:
- README.md（使用例、インストール手順、API仕様）
- CHANGELOG.md
- package.json（本番設定）
- .npmignore
- docs/（詳細ドキュメント）
**見積もり**: 8時間
**受け入れ基準**:
- [ ] npm pack でパッケージ正常作成
- [ ] README.mdが分かりやすく記載
- [ ] インストール手順が正確

---

## 依存関係グラフ

```
Phase 1: T-001 → T-002 → T-003

Phase 2: 
T-003 → T-004 (型定義)
     → T-005 (エラーハンドリング) [並行実行可能]
     → T-006 (TemplateParser) [並行実行可能]
     → T-007 (ResourceExtractor) → T-008 (BaseGenerator)

Phase 3:
T-008 → T-009 (メトリクス定義)
     → T-010 (RDS・Lambda Generator)
     → T-011 (ECS・ALB Generator)  
     → T-012 (DynamoDB・API Gateway Generator)

Phase 4:
T-012 → T-013 (JSON Formatter)
     → T-014 (HTML Formatter)
     → T-015 (統合・並行処理)
     → T-016 (CLI統合)

Phase 5:
T-016 → T-017 (テスト完全実装)
     → T-018 (ドキュメント・パッケージ)
```

## 総見積もり（CLAUDE.md準拠修正版）

- **Phase 1**: 11時間（Node.js 20系、シンプル化）
- **Phase 2**: 35時間（型安全性強化、TDD適用）
- **Phase 3**: 45時間（p-limit活用、責務分離）
- **Phase 4**: 40時間（SOLID原則適用）
- **Phase 5**: 24時間（TDDフルサイクル）

**総計**: 155時間（約20日 × 8時間）  
**短縮理由**: 既存ライブラリ活用、責務分離、TDD効率化

## CLAUDE.md完全準拠品質保証チェックリスト

全タスクで以下を必須満たすこと：

**CLAUDE.md核心原則**:
- [ ] **Zero type errors**: TypeScript strict modeでエラー0個
- [ ] **No any types**: any型使用禁止（unknown/strict typing使用）
- [ ] **No non-null assertions**: `!`演算子使用禁止
- [ ] **Build success**: 全ビルド成功（エラーなし）

**開発哲学遵守**:
- [ ] **UNIX Philosophy**: 一つのことをうまくやる設計
- [ ] **Don't Reinvent the Wheel**: 既存ライブラリ活用（p-limit等）
- [ ] **SOLID Principles**: 単一責任原則遵守
- [ ] **DRY**: 知識の重複排除
- [ ] **KISS**: シンプルさ優先

**TDD必須サイクル**:
- [ ] **RED-GREEN-BLUE**: 各タスクでTDDサイクル完走
- [ ] **Test First**: 実装前にテスト作成
- [ ] **Type-Driven**: 型チェック中心開発

**品質指標**:
- [ ] 単体テストカバレッジ９０％以上
- [ ] 統合テストカバレッジ８５％以上
- [ ] パフォーマンス要件達成（30秒・256MB）
- [ ] セキュリティ監査通過（npm audit）

---

**タスク一覧作成者**: Claude Code  
**CLAUDE.md準拠修正完了日**: 2025-09-08  
**バージョン**: 2.0 (CLAUDE.md完全準拠版)