# AWS Cloud Supporter フェーズ2 開発用設計書 (修正版)

## 1. システムアーキテクチャ設計

### 1.1 CLAUDE.md準拠アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Interface                         │
│                  (Commander.js)                          │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│         Analysis Layer (単一責任原則準拠)            │
│         TemplateAnalyzer  |  MetricsProcessor          │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│            Output Layer (単一責任原則準拠)             │
│           JSONFormatter  |  HTMLFormatter             │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              Metrics Generators                         │
│   RDS | Lambda | ECS | ALB | DynamoDB | API Gateway    │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│               Utilities (既存ライブラリ活用)             │
│     FileReader | Logger | Config | p-limit            │
└─────────────────────────────────────────────────────────┘
```

**CLAUDE.md準拠設計原則**:
- **UNIX哲学**: 一つのことをうまくやる
- **Don't Reinvent the Wheel**: 既存実証済みソリューション活用
- **Single Responsibility**: 各クラスの責務を明確化
- **Type-Driven Development**: 型チェック中心の開発
- **KISS**: シンプルさを優先

### 1.2 データフロー設計

```
CloudFormation Template (Input)
    ↓
[1] TemplateParser.parse()
    ↓
[2] ResourceExtractor.extract() 
    ↓
[3] TemplateAnalyzer.analyze() (型安全解析)
    ↓
[4] MetricsProcessor.process() (p-limit並行処理)
    ├── 型安全なリソース別処理
    └── メトリクス集約
    ↓
[5] JSONFormatter.format() | HTMLFormatter.format()
    ├── 単一責任での出力処理
    └── 型安全性検証
    ↓
Structured Report (Output)
```

## 2. 技術選定と根拠

### 2.1 技術選定の比較検討

| 技術 | Node.js/TypeScript | Python | Go |
|------|-------------------|--------|-------|
| **開発効率** | ⭐⭐⭐ (高い) | ⭐⭐⭐⭐ (最高) | ⭐⭐ (中) |
| **YAML/JSON処理** | ⭐⭐⭐ (良い) | ⭐⭐⭐⭐ (最高) | ⭐⭐⭐ (良い) |
| **パフォーマンス** | ⭐⭐ (中) | ⭐⭐ (中) | ⭐⭐⭐⭐ (最高) |
| **並行処理** | ⭐⭐⭐⭐ (最高) | ⭐⭐ (中) | ⭐⭐⭐⭐ (最高) |
| **エコシステム** | ⭐⭐⭐⭐ (最高) | ⭐⭐⭐⭐ (最高) | ⭐⭐⭐ (良い) |
| **型安全性** | ⭐⭐⭐⭐ (TS) | ⭐⭐ (mypy) | ⭐⭐⭐⭐ (最高) |

**選定結果**: Node.js 20.x (LTS) + TypeScript
**理由**: 
- cfn-diagramとの技術統一性（共にNode.js）
- LTS版による安定性・長期サポート保証
- 並行処理性能が要求に適合
- CloudFormationエコシステムでの実績
- 開発・保守効率の高さ

### 2.2 最小依存関係設計

```json
{
  "dependencies": {
    "commander": "^11.0.0",     // CLI フレームワーク
    "yaml": "^2.3.0",           // YAML処理（必須）
    "chalk": "^5.3.0",          // コンソール出力（UI改善）
    "p-limit": "^5.0.0"         // 並行処理制御（既存実績）
  },
  "devDependencies": {
    "typescript": "^5.0.0",     // 型安全性
    "jest": "^29.5.0",          // テストフレームワーク
    "ts-jest": "^29.1.0"        // Jest + TypeScript
  }
}
```

**依存関係最適化**: 11個 → 4個（実証済みライブラリのみ、CLAUDE.md準拠）

## 3. 詳細設計

### 3.1 ディレクトリ構造（最適化版）

```
src/
├── cli/
│   ├── commands.ts            // CLIコマンド定義
│   └── index.ts               // エントリーポイント
├── core/
│   ├── analyzer.ts            // メイン分析ロジック
│   ├── parser.ts              // テンプレート解析
│   └── formatter.ts           // 出力フォーマッタ
├── generators/
│   ├── base.generator.ts      // ベースクラス
│   ├── rds.generator.ts       // RDS専用
│   ├── lambda.generator.ts    // Lambda専用
│   ├── ecs.generator.ts       // ECS専用
│   ├── alb.generator.ts       // ALB専用
│   ├── dynamodb.generator.ts  // DynamoDB専用
│   └── apigateway.generator.ts // API Gateway専用
├── types/
│   ├── cloudformation.ts      // CF型定義
│   ├── metrics.ts             // メトリクス型定義
│   └── common.ts              // 共通型
├── config/
│   └── metrics-definitions.ts // メトリクス定義（TypeScript）
├── utils/
│   ├── file.ts               // ファイル操作
│   ├── validator.ts          // バリデーション
│   └── logger.ts             // ログ出力
└── tests/
    ├── unit/                 // 単体テスト
    ├── integration/          // 統合テスト
    └── fixtures/             // テストデータ
```

### 3.2 コアクラス設計（改善版）

#### 3.2.1 TemplateAnalyzer（CLAUDE.md完全準拠）

```typescript
// 型安全なインターフェース（CLAUDE.md: Type-Driven Development）
export interface ITemplateAnalyzer {
  analyze(filePath: string): Promise<TemplateAnalysisResult>;
}

export interface IMetricsProcessor {
  process(resources: SupportedResource[], options: ProcessOptions): Promise<ResourceWithMetrics[]>;
}

export interface ITemplateParser {
  parse(filePath: string): Promise<CloudFormationTemplate>;
}

// 単一責任原則準拠（CLAUDE.md: SOLID Principles）
export class TemplateAnalyzer implements ITemplateAnalyzer {
  constructor(
    private parser: ITemplateParser,
    private extractor: ResourceExtractor
  ) {}

  async analyze(filePath: string): Promise<TemplateAnalysisResult> {
    // 単一責任: テンプレート解析のみ
    const template = await this.parser.parse(filePath);
    const extractResult = this.extractor.extract(template);
    
    return {
      template,
      supportedResources: extractResult.supported,
      unsupportedResources: extractResult.unsupported,
      totalResources: extractResult.totalCount
    };
  }
}

export class MetricsProcessor implements IMetricsProcessor {
  constructor(
    private generators: Map<string, IMetricsGenerator>,
    private concurrencyController: ConcurrencyController
  ) {}

  async process(resources: SupportedResource[], options: ProcessOptions): Promise<ResourceWithMetrics[]> {
    // 単一責任: メトリクス処理のみ
    return this.concurrencyController.processInParallel(
      resources,
      async (resource) => {
        const generator = this.generators.get(resource.Type);
        if (!generator) {
          throw new CloudSupporterError(
            ErrorType.RESOURCE_ERROR,
            `No generator for resource type: ${resource.Type}`
          );
        }

        const metrics = await generator.generate(resource);
        
        return {
          logical_id: resource.LogicalId,
          resource_type: resource.Type,
          resource_properties: resource.Properties || {},
          metrics: this.filterMetrics(metrics, options)
        };
      }
    );
  }

  private filterMetrics(metrics: MetricDefinition[], options: ProcessOptions): MetricDefinition[] {
    if (options.includeLowImportance) {
      return metrics;
    }
    return metrics.filter(m => m.importance !== 'Low');
  }
}
```

#### 3.2.2 BaseMetricsGenerator（実用的設計）

```typescript
export abstract class BaseMetricsGenerator implements IMetricsGenerator {
  constructor(protected logger: ILogger) {}

  abstract getSupportedTypes(): ResourceType[];
  
  async generate(resource: CloudFormationResource): Promise<MetricDefinition[]> {
    try {
      // メトリクス定義取得
      const metricsConfig = this.getMetricsConfig(resource);
      
      // メトリクス生成
      const metrics = metricsConfig.map(config => 
        this.buildMetricDefinition(resource, config)
      );
      
      return metrics;
    } catch (error) {
      this.logger.error(`Failed to generate metrics for ${resource.LogicalId}`, error);
      throw error;
    }
  }

  protected abstract getMetricsConfig(resource: CloudFormationResource): MetricConfig[];

  private buildMetricDefinition(
    resource: CloudFormationResource,
    config: MetricConfig
  ): MetricDefinition {
    return {
      metric_name: config.name,
      namespace: config.namespace,
      unit: config.unit,
      description: config.description,
      statistic: config.statistic,
      recommended_threshold: this.calculateThreshold(resource, config),
      evaluation_period: config.evaluationPeriod,
      category: config.category,
      importance: config.importance
    };
  }

  private calculateThreshold(
    resource: CloudFormationResource,
    config: MetricConfig
  ): ThresholdDefinition {
    // シンプルな計算ロジック
    const baseValue = config.threshold.base;
    const scale = this.getResourceScale(resource);
    
    return {
      warning: Math.round(baseValue * scale * config.threshold.warningMultiplier),
      critical: Math.round(baseValue * scale * config.threshold.criticalMultiplier)
    };
  }

  protected abstract getResourceScale(resource: CloudFormationResource): number;
}
```

### 3.3 型安全な データモデル設計

#### 3.3.1 CloudFormation型定義

```typescript
// CloudFormation Resource基底型（型安全性強化）
export interface CloudFormationResource {
  LogicalId: string;
  Type: string;
  Properties?: unknown; // any型排除、型安全性確保
  Condition?: string;
  DependsOn?: string | string[];
  Metadata?: CloudFormationMetadata;
}

// CloudFormation メタデータ型
export interface CloudFormationMetadata {
  'AWS::CloudFormation::Designer'?: {
    id?: string;
  };
  [key: string]: unknown;
}

// リソース別型定義
// 型安全なRDS定義（CLAUDE.md準拠）
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
  // その他プロパティは型安全性のためunknown
  [key: string]: unknown;
}

// 厳密な型定義
export type DBInstanceClass = 
  | 'db.t3.micro' | 'db.t3.small' | 'db.t3.medium' | 'db.t3.large' | 'db.t3.xlarge' | 'db.t3.2xlarge'
  | 'db.m5.large' | 'db.m5.xlarge' | 'db.m5.2xlarge' | 'db.m5.4xlarge'
  | 'db.r5.large' | 'db.r5.xlarge' | 'db.r5.2xlarge'
  | string; // 新しいインスタンスクラス対応

export type DatabaseEngine = 'mysql' | 'postgresql' | 'mariadb' | 'oracle-ee' | 'sqlserver-ex';
export type StorageType = 'standard' | 'gp2' | 'gp3' | 'io1' | 'io2';

export interface LambdaFunction extends CloudFormationResource {
  Type: 'AWS::Lambda::Function';
  Properties: {
    Runtime?: string;
    Timeout?: number;
    MemorySize?: number;
    ReservedConcurrentExecutions?: number;
    [key: string]: any;
  };
}

export interface ServerlessFunction extends CloudFormationResource {
  Type: 'AWS::Serverless::Function';
  Properties: {
    Runtime?: string;
    Timeout?: number;
    MemorySize?: number;
    ReservedConcurrentExecutions?: number;
    [key: string]: any;
  };
}

// Union型による型安全性
export type SupportedResource = 
  | RDSDBInstance 
  | LambdaFunction 
  | ServerlessFunction;
```

#### 3.3.2 メトリクス定義型

```typescript
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
}

export interface ThresholdDefinition {
  warning: number;
  critical: number;
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

// TDD用型定義（CLAUDE.md: Test-Driven Development）
export interface TemplateAnalysisResult {
  template: CloudFormationTemplate;
  supportedResources: SupportedResource[];
  unsupportedResources: string[];
  totalResources: number;
}

export interface ProcessOptions {
  includeLowImportance: boolean;
  resourceTypes?: string[];
  verbose: boolean;
}
```

## 4. メトリクス定義設計（TypeScript化）

### 4.1 メトリクス定義（コード化）

```typescript
// config/metrics-definitions.ts
export const RDS_METRICS: MetricConfig[] = [
  {
    name: 'CPUUtilization',
    namespace: 'AWS/RDS',
    unit: 'Percent',
    description: 'CPU利用率',
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
    name: 'BinLogDiskUsage',
    namespace: 'AWS/RDS',
    unit: 'Bytes',
    description: 'バイナリログディスク使用量（MySQLのみ）',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 1_000_000_000, // 1GB
      warningMultiplier: 1.0,
      criticalMultiplier: 2.0
    },
    applicableWhen: (resource) => {
      const rds = resource as RDSDBInstance;
      return rds.Properties.Engine === 'mysql' && 
             (rds.Properties.BackupRetentionPeriod || 0) > 0;
    }
  }
];

export const LAMBDA_METRICS: MetricConfig[] = [
  {
    name: 'Duration',
    namespace: 'AWS/Lambda',
    unit: 'Milliseconds',
    description: '実行時間',
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
    description: 'エラー数',
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
  {
    name: 'Throttles',
    namespace: 'AWS/Lambda',
    unit: 'Count', 
    description: 'スロットル数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'High',
    threshold: {
      base: 1,
      warningMultiplier: 1.0,
      criticalMultiplier: 5.0
    }
  }
];

// メトリクス定義マップ
export const METRICS_CONFIG_MAP: Record<ResourceType, MetricConfig[]> = {
  [ResourceType.RDS_DB_INSTANCE]: RDS_METRICS,
  [ResourceType.LAMBDA_FUNCTION]: LAMBDA_METRICS,
  [ResourceType.SERVERLESS_FUNCTION]: LAMBDA_METRICS,
  // 他のリソースタイプも同様に定義
};
```

## 5. エラーハンドリング設計（シンプル化）

### 5.1 シンプルなエラー分類

```typescript
export enum ErrorType {
  FILE_ERROR = 'FILE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  RESOURCE_ERROR = 'RESOURCE_ERROR',
  OUTPUT_ERROR = 'OUTPUT_ERROR'
}

export interface ErrorDetails {
  originalError?: string;
  fileSize?: number;
  lineNumber?: number;
  columnNumber?: number;
  filePath?: string;
  duration?: number;
  error?: string;
  nearText?: string;
}

export class CloudSupporterError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly details?: ErrorDetails // any型排除
  ) {
    super(message);
    this.name = 'CloudSupporterError';
  }
}

export class ErrorHandler {
  static handle(error: Error): never {
    if (error instanceof CloudSupporterError) {
      console.error(`❌ ${error.message}`);
      
      if (error.details) {
        console.error(`📋 Details:`, JSON.stringify(error.details, null, 2));
      }

      const suggestion = this.getSuggestion(error.type);
      if (suggestion) {
        console.error(`💡 Suggestion: ${suggestion}`);
      }
      
      process.exit(this.getExitCode(error.type));
    } else {
      console.error(`❌ Unexpected error:`, error.message);
      process.exit(1);
    }
  }

  private static getSuggestion(type: ErrorType): string | null {
    const suggestions = {
      [ErrorType.FILE_ERROR]: "Check if the file exists and is readable",
      [ErrorType.PARSE_ERROR]: "Validate your CloudFormation template syntax",
      [ErrorType.RESOURCE_ERROR]: "Check resource properties in your template",
      [ErrorType.OUTPUT_ERROR]: "Verify output path is writable"
    };
    return suggestions[type] || null;
  }

  private static getExitCode(type: ErrorType): number {
    const exitCodes = {
      [ErrorType.FILE_ERROR]: 1,
      [ErrorType.PARSE_ERROR]: 2,
      [ErrorType.RESOURCE_ERROR]: 3,
      [ErrorType.OUTPUT_ERROR]: 4
    };
    return exitCodes[type] || 1;
  }
}
```

## 6. パフォーマンス設計（実用的）

### 6.1 シンプルな並行処理

```typescript
export class ParallelProcessor {
  static async processInParallel<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    maxConcurrency: number = 10
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += maxConcurrency) {
      const batch = items.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(processor);
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.warn(`Processing failed:`, result.reason);
        }
      }
    }
    
    return results;
  }
}
```

### 6.2 メモリ効率化

```typescript
export class MemoryMonitor {
  static monitor(): void {
    const memUsage = process.memoryUsage();
    const usedMB = memUsage.heapUsed / 1024 / 1024;
    
    if (usedMB > 200) { // 200MB警告
      console.warn(`⚠️  Memory usage: ${usedMB.toFixed(2)}MB`);
    }
    
    if (usedMB > 256) { // 256MB上限
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        `Memory usage ${usedMB.toFixed(2)}MB exceeds limit of 256MB`
      );
    }
  }
}
```

## 7. CLI設計（ユーザビリティ重視）

### 7.1 cfn-diagram統合モデル

```bash
# cfn-diagramプラグインとしての統合
cfn-dia metrics template.yaml
cfn-dia metrics --output html --file report.html template.yaml
cfn-dia metrics --resource-types RDS,Lambda template.yaml

# スタンドアロンでも動作
aws-cloud-supporter template.yaml
aws-cloud-supporter --help
```

### 7.2 CLI実装

```typescript
import { Command } from 'commander';

export class MetricsCommand {
  static create(): Command {
    const program = new Command();
    
    program
      .name('aws-cloud-supporter')
      .description('Generate CloudWatch metrics recommendations for CloudFormation templates')
      .version('1.0.0')
      .argument('<template>', 'CloudFormation template file path')
      .option('-o, --output <format>', 'Output format (json|html|yaml)', 'json')
      .option('-f, --file <path>', 'Output file path (default: stdout)')
      .option('--resource-types <types>', 'Comma-separated resource types to analyze')
      .option('--include-low', 'Include low importance metrics')
      .option('-v, --verbose', 'Verbose logging')
      .action(async (template, options) => {
        try {
          await this.execute(template, options);
        } catch (error) {
          ErrorHandler.handle(error);
        }
      });

    return program;
  }

  private static async execute(templatePath: string, options: any): Promise<void> {
    console.log(`🔍 Analyzing CloudFormation template: ${templatePath}`);
    
    const analyzer = this.createAnalyzer();
    const result = await analyzer.analyze(templatePath, {
      resourceTypes: options.resourceTypes?.split(','),
      includeLowImportance: options.includeLow,
      verbose: options.verbose
    });

    const formatter = new OutputFormatter();
    const output = await formatter.format(result, options.output);

    if (options.file) {
      await writeFile(options.file, output);
      console.log(`✅ Results saved to: ${options.file}`);
    } else {
      console.log(output);
    }
  }
}
```

## 8. テスト設計（具体的）

### 8.1 テスト戦略

```
テストピラミッド:
┌────────────────────────────────────┐
│          E2E Tests (5%)            │ ← 実際のCFテンプレートでの動作確認
├────────────────────────────────────┤
│      Integration Tests (15%)       │ ← コンポーネント間連携テスト
├────────────────────────────────────┤
│        Unit Tests (80%)            │ ← 個別クラス・関数のテスト
└────────────────────────────────────┘
```

### 8.2 テストケース設計

#### 8.2.1 単体テスト例

```typescript
// tests/unit/generators/rds.generator.test.ts
describe('RDSMetricsGenerator', () => {
  let generator: RDSMetricsGenerator;

  beforeEach(() => {
    generator = new RDSMetricsGenerator(createMockLogger());
  });

  describe('MySQL RDS Instance', () => {
    const mysqlResource: RDSDBInstance = {
      LogicalId: 'MyDB',
      Type: 'AWS::RDS::DBInstance',
      Properties: {
        Engine: 'mysql',
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: 20,
        BackupRetentionPeriod: 7
      }
    };

    it('should generate base metrics', async () => {
      const metrics = await generator.generate(mysqlResource);
      
      expect(metrics).toContainMetric('CPUUtilization');
      expect(metrics).toContainMetric('DatabaseConnections');
    });

    it('should include MySQL-specific metrics', async () => {
      const metrics = await generator.generate(mysqlResource);
      
      expect(metrics).toContainMetric('BinLogDiskUsage');
    });

    it('should calculate appropriate thresholds', async () => {
      const metrics = await generator.generate(mysqlResource);
      
      // CLAUDE.md準拠: No non-null assertions
      const cpuMetric = metrics.find(m => m.metric_name === 'CPUUtilization');
      expect(cpuMetric).toBeDefined();
      expect(cpuMetric?.recommended_threshold.warning).toBe(35); // 70 * 0.5
      expect(cpuMetric?.recommended_threshold.critical).toBe(91); // 70 * 1.3
    });
  });

  // カスタムマッチャー
  expect.extend({
    toContainMetric(received: MetricDefinition[], metricName: string) {
      const hasMetric = received.some(m => m.metric_name === metricName);
      return {
        message: () => `Expected metrics to contain ${metricName}`,
        pass: hasMetric
      };
    }
  });
});
```

#### 8.2.2 統合テスト例

```typescript
// tests/integration/analyzer.integration.test.ts
describe('MetricsAnalyzer Integration', () => {
  let analyzer: MetricsAnalyzer;

  beforeEach(() => {
    analyzer = createTestAnalyzer();
  });

  it('should process complete web application template', async () => {
    const result = await analyzer.analyze('tests/fixtures/web-app-template.yaml', {});
    
    expect(result.metadata.supported_resources).toBe(3);
    expect(result.resources).toHaveLength(3);
    
    // CLAUDE.md準拠: No non-null assertions
    const rdsResource = result.resources.find(r => r.resource_type === 'AWS::RDS::DBInstance');
    expect(rdsResource).toBeDefined();
    expect(rdsResource?.metrics.length).toBeGreaterThanOrEqual(20);
    
    const lambdaResource = result.resources.find(r => r.resource_type === 'AWS::Lambda::Function');
    expect(lambdaResource).toBeDefined();
    expect(lambdaResource?.metrics.length).toBeGreaterThanOrEqual(15);
  });

  it('should handle large template within performance limits', async () => {
    const startTime = performance.now();
    
    const result = await analyzer.analyze('tests/fixtures/large-template.yaml', {});
    
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(30000); // 30秒以内
    expect(result.metadata.total_resources).toBeGreaterThan(100);
  });
});
```

#### 8.2.3 E2Eテスト例

```typescript
// tests/e2e/cli.e2e.test.ts
describe('CLI E2E Tests', () => {
  it('should generate JSON report from real template', async () => {
    const { stdout, stderr, exitCode } = await execAsync(
      `node dist/cli/index.js tests/fixtures/real-template.yaml -o json`
    );
    
    expect(exitCode).toBe(0);
    expect(stderr).toBe('');
    
    const result = JSON.parse(stdout);
    expect(result).toMatchSchema(OUTPUT_SCHEMA);
    expect(result.resources.length).toBeGreaterThan(0);
  });

  it('should save HTML report to file', async () => {
    const outputPath = 'test-output.html';
    
    const { exitCode } = await execAsync(
      `node dist/cli/index.js tests/fixtures/sample.yaml -o html -f ${outputPath}`
    );
    
    expect(exitCode).toBe(0);
    expect(fs.existsSync(outputPath)).toBe(true);
    
    const content = fs.readFileSync(outputPath, 'utf8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('AWS CloudWatch Metrics');
    
    // クリーンアップ
    fs.unlinkSync(outputPath);
  });
});
```

## 9. 実装計画

### 9.1 TDD中心開発マイルストーン（CLAUDE.md準拠）

```
Phase 1 (Week 1-2): Type-Driven Infrastructure
├── プロジェクト初期化 + Node.js 20.x LTS
├── 厳密TypeScript環境構築
├── TDDテストフレームワークセットアップ
└── 型安全CLI基朮構造

Phase 2 (Week 3-4): Type-Safe Core Components
├── 厳密型定義（any型排除）
├── TemplateAnalyzer実装（単一責任）
├── ResourceExtractor実装（型安全）
└── BaseMetricsGenerator実装（抽象化）

Phase 3 (Week 5-6): Metrics Generators (TDD)
├── メトリクス定義（TypeScript、any型なし）
├── RDS/Lambda Generator（TDDサイクル）
├── ECS/ALB/DynamoDB/APIGateway Generator（TDD）
└── 統合テスト（型安全性検証）

Phase 4 (Week 7-8): Clean Output & Integration
├── JSONFormatter（単一責任、型安全）
├── HTMLFormatter（単一責任、シンプル）
├── MetricsProcessor統合（p-limit並行処理）
└── E2Eテスト（TDDフルサイクル）
```

**TDDサイクル（CLAUDE.md必須）**:
1. **RED**: 失敗テストを先に書く
2. **GREEN**: テストを通す最小限のコードを実装
3. **BLUE**: テストを通したままリファクタリング

### 9.2 品質保証

```
Code Quality Gates:
✅ TypeScript strict mode
✅ ESLint + Prettier
✅ 単体テストカバレッジ 90%+
✅ 統合テストカバレッジ 80%+
✅ E2Eテスト全パス
✅ パフォーマンステスト全パス
✅ メモリリークテスト
✅ セキュリティ監査（npm audit）
```

---

**設計書作成者**: Claude Code  
**CLAUDE.md準拠修正完了日**: 2025-09-08  
**承認**: 要承認  
**バージョン**: 3.0 (CLAUDE.md完全準拠版)