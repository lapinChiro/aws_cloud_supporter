# AWS Cloud Supporter - CDK Code Generation Design Document

## 1. 概要と基本コンセプト

### 1.1 目的
本設計書は、requirement.mdで定義されたCDKコード生成機能の詳細設計を定義します。既存のaws_cloud_supporterアーキテクチャを**最小限の変更で拡張**し、CloudWatch AlarmのCDKコードを自動生成する機能を追加します。

### 1.2 基本コンセプト
```
Input: CloudFormation Template
   ↓
[既存] Metrics Analysis (変更なし)
   ↓
[新規] CDK Code Generation (今回追加)
   ↓
Output: TypeScript CDK Code
```

**重要な設計判断**:
- 既存のメトリクス分析パイプラインは**一切変更しない**
- CDK生成は既存の`AnalysisResult`を入力として独立動作
- CLIに新しいオプション群を追加するが、既存オプションとの互換性維持

### 1.3 最小限のMVP（Minimum Viable Product）
初期実装で動作する最小構成：
```bash
# 最小限の動作例
npm run dev examples/web-application-stack.yaml --output cdk
# ↓
# 生成されるファイル: CloudWatchAlarmsStack.ts（10-20のアラーム定義）
```

### 1.4 段階的実装アプローチ
```
Phase 1 (基本動作): 1つのリソースタイプ（RDS）でCDK生成
Phase 2 (全対応): 6リソースタイプ全対応 + SNS統合
Phase 3 (品質向上): 検証・セキュリティ・性能最適化
```

### 1.5 生成されるCDKコードサンプル
```typescript
// CloudWatchAlarmsStack.ts (生成例)
export class CloudWatchAlarmsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // RDS instance: MyDatabase
    const myDatabaseCpuWarningAlarm = new cloudwatch.Alarm(this, 'MyDatabaseCPUUtilizationWarningAlarm', {
      alarmName: 'MyDatabase-CPUUtilization-Warning',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: { DBInstanceIdentifier: 'MyDatabase' },
        statistic: cloudwatch.Stats.AVERAGE,
        period: cdk.Duration.seconds(300)
      }),
      threshold: 70,
      evaluationPeriods: 1
    });
  }
}
```

## 2. シンプルなアーキテクチャ設計

### 2.1 3層アーキテクチャ（理解しやすさ重視）

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLI Interface Layer                          │
│                                                                 │
│  commands.ts (拡張) ────→ CDK Options Parsing                   │
│                                                                 │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CDK Generation Layer                          │
│                                                                 │
│  CDKGenerator (新規メインクラス)                                 │
│      │                                                         │
│      ├──→ CDKDataBuilder ──→ Template Engine ──→ Code Formatter │
│      │                                                         │
│      └──→ Validator ──────→ File Writer                        │
│                                                                 │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Existing Analysis Layer                        │
│                                                                 │
│  analyzer.ts (既存) ────→ ExtendedAnalysisResult                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 実装の責務分担（シンプル）

#### CLI Interface Layer
- **責務**: CLIオプション解析、CDK/標準モード振り分け
- **実装**: `commands.ts`の拡張のみ
- **変更規模**: 既存ファイル50行程度の追加

#### CDK Generation Layer  
- **責務**: AnalysisResult → CDK TypeScriptコード変換
- **メインクラス**: `CDKGenerator`（1つのクラスに集約）
- **実装**: 全て新規ファイル

#### Existing Analysis Layer
- **責務**: CloudFormation → AnalysisResult（既存機能）
- **変更**: **一切変更なし**

### 2.2 既存システムとの統合ポイント

#### 2.2.1 データ統合（requirement.md準拠）
```typescript
// src/types/cdk-integration.ts
// 既存のExtendedAnalysisResultを完全活用
import { ExtendedAnalysisResult, ResourceWithMetrics, MetricDefinition } from '../types/metrics';

interface CDKGenerationRequest {
  // FR-1.1: 既存分析結果をそのまま活用
  analysisResult: ExtendedAnalysisResult;  // analyzer.tsからの完全な出力
  cdkOptions: CDKOptions;                  // requirement.md FR-6.1準拠のオプション
  templatePath: string;                    // 元のCloudFormationテンプレートパス
}

// requirement.md AC-4準拠の性能メトリクス含む出力
interface CDKGenerationResult {
  generatedCode: string;                   // FR-7.1: TypeScript CDK Stack code
  outputFilePath?: string;                 // FR-7.2: 生成されたファイルパス
  validationResult: CDKValidationResult;   // FR-6.3: コンパイル検証結果
  generationMetrics: CDKPerformanceMetrics; // NFR-1: 性能要件測定用
  securityReport: CDKSecurityReport;       // FR-4.1: セキュリティ処理結果
}

interface CDKPerformanceMetrics {
  totalDurationMs: number;                 // NFR-1: 30秒制限監視用
  peakMemoryUsageMB: number;              // NFR-1: 512MB制限監視用
  alarmsGenerated: number;                // AC-1: アラーム数検証用
  templatesProcessed: number;             // FR-6.2: バッチ処理統計
  concurrentTasks: number;                // FR-5.2: 並列処理統計
}
```

#### 2.2.2 既存コンポーネント活用マップ
```typescript
// 既存システムからの完全な依存関係定義
import { 
  MetricDefinition,           // types/metrics.ts - そのまま活用
  ResourceWithMetrics,        // types/metrics.ts - そのまま活用  
  ExtendedAnalysisResult,     // interfaces/analyzer.ts - そのまま活用
  AnalysisMetadata,          // types/metrics.ts - そのまま活用
  ThresholdDefinition        // types/metrics.ts - そのまま活用
} from '../types/metrics';

import { 
  BaseMetricsGenerator       // generators/base.generator.ts - 継承活用
} from '../generators/base.generator';

import { 
  CloudSupporterError,       // utils/error.ts - そのまま活用
  ErrorType,                 // utils/error.ts - 拡張
  createResourceError        // utils/error.ts - そのまま活用
} from '../utils/error';

import { 
  ILogger,                   // interfaces/logger.ts - そのまま活用
  IMetricsAnalyzer,         // interfaces/analyzer.ts - そのまま活用
  ITemplateParser           // interfaces/parser.ts - そのまま活用
} from '../interfaces';

// 既存CLIインフラストラクチャとの統合
import { 
  CLIDependencies,          // cli/commands.ts - 拡張
  ProcessOptions           // types/metrics.ts - 参考
} from '../cli';
```

#### 2.2.3 既存エラーハンドリング拡張
```typescript
// requirement.md FR-5.3準拠の既存エラーシステム拡張
export enum CDKErrorType {
  CDK_TEMPLATE_ERROR = 'CDK_TEMPLATE_ERROR',       // FR-5.3
  CDK_COMPILATION_ERROR = 'CDK_COMPILATION_ERROR', // FR-6.3  
  CDK_SECURITY_ERROR = 'CDK_SECURITY_ERROR',       // FR-4.2
  CDK_PERFORMANCE_ERROR = 'CDK_PERFORMANCE_ERROR', // NFR-1
  CDK_VALIDATION_ERROR = 'CDK_VALIDATION_ERROR'    // FR-5.1
}

// 既存CloudSupporterErrorを拡張して使用
export function createCDKError(
  cdkErrorType: CDKErrorType,
  message: string,
  details: Record<string, unknown>
): CloudSupporterError {
  return new CloudSupporterError(
    ErrorType.RESOURCE_ERROR, // 既存のErrorTypeを活用
    message,
    { cdkErrorType, ...details }
  );
}
```

### 2.3 データフロー設計（正常系・異常系対応）

#### 2.3.1 メインフロー（requirement.md FR-1～FR-7準拠）
```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLI Entry Point                                 │
│  CLI Options Parsing & Validation (FR-6.1)                             │
│              │                                                         │
│              ▼                                                         │
│         CDK Mode Check                                                  │
│              │                                                         │
└──────────────┼─────────────────────────────────────────────────────────┘
               │
    ┌──────────▼─────────────┐
    │    Standard Mode       │         CDK Mode
    │                        │              │
    │   [既存] Analyzer      │              ▼
    │   [既存] Generators    │    ┌─────────────────────────────┐
    │   [既存] Formatters    │    │  CDK Orchestrator (新規)   │
    │                        │    │                             │
    └────────────────────────┘    │  1. Input Validation        │
                                  │  2. Security Check          │
                                  │  3. Memory Monitoring Start │
                                  └─────────────┬───────────────┘
                                                │
                              ┌─────────────────▼───────────────┐
                              │   既存 Analysis Pipeline       │
                              │                                 │
                              │  [既存] Parser                  │
                              │         │                       │
                              │         ▼                       │
                              │  [既存] Analyzer                │
                              │         │                       │
                              │         ▼                       │
                              │  [既存] Generators              │
                              │         │                       │
                              │         ▼                       │
                              │  ExtendedAnalysisResult         │
                              └─────────────┬───────────────────┘
                                            │
                              ┌─────────────▼───────────────┐
                              │  CDK Processing Pipeline    │
                              │                             │
                              │  CDK Data Builder           │
                              │         │                   │
                              │         ▼                   │
                              │  Security Sanitizer         │
                              │         │                   │
                              │         ▼                   │
                              │  Template Engine            │
                              │         │                   │
                              │         ▼                   │
                              │  Code Formatter             │
                              └─────────────┬───────────────┘
                                            │
                              ┌─────────────▼───────────────┐
                              │  Validation Pipeline        │
                              │                             │
                              │  TypeScript Compiler        │
                              │         │                   │
                              │         ▼                   │
                              │  CDK Best Practices         │
                              │         │                   │
                              │         ▼                   │
                              │  AWS Limits Check           │
                              └─────────────┬───────────────┘
                                            │
                              ┌─────────────▼───────────────┐
                              │  Output Pipeline            │
                              │                             │
                              │  File Writer                │
                              │         │                   │
                              │         ▼                   │
                              │  Performance Report         │
                              │         │                   │
                              │         ▼                   │
                              │  Security Report            │
                              └─────────────────────────────┘
```

#### 2.3.2 エラーハンドリングフロー（requirement.md FR-5.3準拠）
```
各処理ステップ
      │
      ▼
   Error Detection
      │
      ├─ Critical Error → Stop Processing → Error Report → Exit(1)
      │
      ├─ Resource Error → Log Warning → Continue Other Resources
      │
      └─ Validation Error → Log Details → Provide Suggestions
                               │
                               ▼
                          Continue or Stop
                          (based on --continue-on-error)
```

#### 2.3.3 メモリ最適化フロー（requirement.md NFR-1準拠）
```
Start Processing
      │
      ▼
Memory Monitor Start (50ms interval)
      │
      ├─ Usage < 400MB → Continue
      │
      ├─ Usage 400-512MB → Warning + GC Trigger
      │
      └─ Usage > 512MB → Error + Stop Processing
              │
              ▼
          Memory Cleanup
              │
              ▼
         Error Report
```

## 3. 詳細設計

### 3.1 CDK Orchestrator設計（requirement.md準拠）

#### 3.1.1 メインオーケストレータークラス
```typescript
// src/orchestrators/cdk.orchestrator.ts
// requirement.md FR-1～FR-7の全要件を統合実装
export class CDKOrchestrator {
  private memoryMonitor: CDKMemoryMonitor;
  private securitySanitizer: CDKSecuritySanitizer;
  private performanceTracker: CDKPerformanceTracker;

  constructor(
    private processor: ICDKProcessor,
    private templateEngine: ICDKTemplateEngine,
    private validator: ICDKValidator,
    private outputManager: ICDKOutputManager,
    private logger: ILogger
  ) {
    this.memoryMonitor = new CDKMemoryMonitor(512 * 1024 * 1024); // NFR-1: 512MB
    this.securitySanitizer = new CDKSecuritySanitizer();
    this.performanceTracker = new CDKPerformanceTracker();
  }

  async generateCDK(request: CDKGenerationRequest): Promise<CDKGenerationResult> {
    const startTime = performance.now();
    
    try {
      // FR-4.2: 入力検証（セキュリティ）
      await this.validateInput(request);
      
      // NFR-1: メモリ監視開始
      this.memoryMonitor.startMonitoring();
      
      // FR-1.1: 基本生成処理
      const processingResult = await this.processAnalysisResult(request);
      
      // FR-4.1: セキュリティサニタイズ
      const sanitizedResult = await this.securitySanitizer.sanitize(processingResult);
      
      // FR-7.1: CDKコード生成
      const generatedCode = await this.templateEngine.generate(sanitizedResult);
      
      // FR-5.1: コード検証（オプション）
      const validationResult = await this.validateIfRequested(generatedCode, request.cdkOptions);
      
      // FR-7.2: 出力処理
      const outputResult = await this.outputManager.writeOutput(
        generatedCode,
        request.cdkOptions
      );
      
      // NFR-1: 性能メトリクス収集
      const metrics = this.performanceTracker.getMetrics(startTime);
      
      return {
        generatedCode,
        outputFilePath: outputResult.filePath,
        validationResult,
        generationMetrics: metrics,
        securityReport: this.securitySanitizer.getReport()
      };
      
    } catch (error) {
      // FR-5.3: エラーハンドリング
      return this.handleGenerationError(error as Error, request);
    } finally {
      // メモリ監視停止
      this.memoryMonitor.stopMonitoring();
    }
  }

  // FR-4.2: 入力検証実装
  private async validateInput(request: CDKGenerationRequest): Promise<void> {
    // テンプレートパス検証
    CDKInputValidator.validateFilePath(request.templatePath);
    
    // CDKオプション検証  
    CDKInputValidator.validateCDKOptions(request.cdkOptions);
    
    // 分析結果検証
    CDKInputValidator.validateAnalysisResult(request.analysisResult);
    
    // SNS ARN検証（指定時）
    if (request.cdkOptions.snsTopicArn) {
      CDKInputValidator.validateSNSTopicArn(request.cdkOptions.snsTopicArn);
    }
  }

  // FR-1.3: アラーム設定処理
  private async processAnalysisResult(
    request: CDKGenerationRequest
  ): Promise<CDKStackData> {
    const { analysisResult, cdkOptions } = request;
    
    // FR-3.2: フィルタリング処理
    const filteredResources = this.applyResourceFilters(
      analysisResult.resources,
      cdkOptions
    );
    
    // FR-2.1: CDK構造データ構築
    return {
      stackName: this.generateStackName(cdkOptions),
      stackClassName: this.generateStackClassName(cdkOptions),
      imports: this.determineRequiredImports(filteredResources, cdkOptions),
      snsTopics: this.generateSNSTopicConfig(cdkOptions),
      alarmGroups: await this.generateAlarmGroups(filteredResources, cdkOptions),
      metadata: this.generateStackMetadata(analysisResult, cdkOptions)
    };
  }

  // FR-3.2: リソースフィルタリング実装
  private applyResourceFilters(
    resources: ResourceWithMetrics[],
    options: CDKOptions
  ): ResourceWithMetrics[] {
    let filtered = resources;
    
    // リソースタイプフィルタ
    if (options.resourceTypeFilters && options.resourceTypeFilters.length > 0) {
      filtered = filtered.filter(r => 
        options.resourceTypeFilters!.includes(r.resource_type)
      );
    }
    
    // メトリクス重要度フィルタ
    if (!options.includeLowImportance) {
      filtered = filtered.map(resource => ({
        ...resource,
        metrics: resource.metrics.filter(m => m.importance !== 'Low')
      })).filter(r => r.metrics.length > 0);
    }
    
    // 重要度フィルタ（warning/criticalのみ）
    if (options.severityFilter) {
      // この段階ではメトリクス定義のみなので、後段のアラーム生成で適用
      this.logger.debug(`Severity filter will be applied during alarm generation: ${options.severityFilter}`);
    }
    
    return filtered;
  }

  // FR-1.3: アラームグループ生成
  private async generateAlarmGroups(
    resources: ResourceWithMetrics[],
    options: CDKOptions
  ): Promise<CDKAlarmGroup[]> {
    const alarmGroups: CDKAlarmGroup[] = [];
    
    // NFR-1: 並列処理で性能最適化
    const processor = new CDKParallelProcessor();
    
    const groupTasks = resources.map(async (resource): Promise<CDKAlarmGroup> => {
      const alarms = await this.generateAlarmsForResource(resource, options);
      
      return {
        resourceLogicalId: resource.logical_id,
        resourceType: resource.resource_type,
        comment: `// Alarms for ${resource.resource_type}: ${resource.logical_id}`,
        alarms: alarms
      };
    });
    
    // 並列実行（最大10並行 - NFR-1準拠）
    const results = await processor.processInParallel(groupTasks, 10);
    
    return results.filter(group => group.alarms.length > 0);
  }

  // FR-1.3: リソース別アラーム生成（warning/critical両方）
  private async generateAlarmsForResource(
    resource: ResourceWithMetrics,
    options: CDKOptions
  ): Promise<CDKAlarm[]> {
    const alarms: CDKAlarm[] = [];
    
    for (const metric of resource.metrics) {
      // Warning alarm generation
      if (!options.severityFilter || options.severityFilter === 'warning') {
        const warningAlarm = this.createAlarmFromMetric(
          resource,
          metric,
          'Warning',
          options
        );
        alarms.push(warningAlarm);
      }
      
      // Critical alarm generation  
      if (!options.severityFilter || options.severityFilter === 'critical') {
        const criticalAlarm = this.createAlarmFromMetric(
          resource,
          metric,
          'Critical',
          options
        );
        alarms.push(criticalAlarm);
      }
    }
    
    return alarms;
  }
}
```

#### 3.1.2 CDKデータ構造（requirement.md完全準拠）
```typescript
// src/types/cdk-stack.ts
// requirement.md FR-2.1、FR-7.1準拠の完全なCDKデータ型定義

export interface CDKStackData {
  // FR-2.2: Stack naming
  stackName: string;                    // "CloudWatchAlarmsStack" or custom
  stackClassName: string;               // TypeScript class name
  
  // FR-2.1: Required imports
  imports: CDKImportStatement[];        // 必要なCDKモジュールのみ
  
  // FR-2.3: SNS integration
  snsTopics: CDKSNSTopicDefinition[];   // SNS Topic定義（0-1個）
  
  // FR-1.3: Alarm organization
  alarmGroups: CDKAlarmGroup[];         // リソース別アラームグループ
  
  // FR-7.3: Documentation
  metadata: CDKStackMetadata;           // スタックメタデータ
  
  // FR-7.2: Package dependencies
  packageInstructions: CDKPackageInstruction; // npm install commands
}

export interface CDKImportStatement {
  moduleName: string;                   // e.g., "aws-cdk-lib/aws-cloudwatch"
  importItems: string[];               // e.g., ["Alarm", "Metric"]
  aliasName?: string;                  // e.g., "cloudwatch"
}

export interface CDKSNSTopicDefinition {
  constructId: string;                 // e.g., "AlarmNotificationTopic"
  variableName: string;               // e.g., "alarmTopic"
  isExisting: boolean;                // true if using existing ARN
  topicArn?: string;                  // for existing topics
  topicName?: string;                 // for new topics
  displayName?: string;               // for new topics
}

export interface CDKAlarmGroup {
  resourceLogicalId: string;          // CloudFormation logical ID
  resourceType: string;               // AWS::RDS::DBInstance etc.
  resourceComment: string;            // "// Alarms for RDS instance: MyDatabase"
  alarms: CDKAlarmDefinition[];       // Warning + Critical alarms
  totalAlarmCount: number;            // AC-1検証用
}

// requirement.md FR-7.1準拠の完全なAlarm定義
export interface CDKAlarmDefinition {
  // FR-2.2: Construct naming pattern
  constructId: string;                // "{LogicalId}{MetricName}{Severity}Alarm"
  variableName: string;              // TypeScript variable name
  
  // CloudWatch Alarm properties
  alarmName: string;                 // CDK Alarm name
  alarmDescription: string;          // MetricDefinition.description
  
  // FR-7.1: Metric specification
  metric: {
    metricName: string;              // MetricDefinition.metric_name  
    namespace: string;               // MetricDefinition.namespace
    dimensionsMap: Record<string, string>; // AWS resource dimensions
    statistic: 'Average' | 'Sum' | 'Maximum' | 'Minimum'; // MetricDefinition.statistic
    period: number;                  // MetricDefinition.evaluation_period or custom
  };
  
  // Threshold configuration
  threshold: number;                 // recommended_threshold.warning or critical
  severity: 'Warning' | 'Critical'; // FR-1.3: exactly two per metric
  evaluationPeriods: number;        // default 1, customizable
  treatMissingData: 'notBreaching' | 'breaching' | 'ignore' | 'missing'; // FR-3.3
  
  // FR-2.3: Actions
  actions: CDKAlarmActionDefinition[];
  
  // FR-7.3: Documentation
  jsDocComment: string;              // Purpose, thresholds, rationale
  inlineComments: string[];          // Threshold calculation details
}

export interface CDKAlarmActionDefinition {
  actionType: 'sns';                 // CS-2: SNSのみ初期サポート
  targetVariable: string;            // SNS Topic variable name
  actionCode: string;                // "alarm.addAlarmAction(new SnsAction(topic))"
}

export interface CDKStackMetadata {
  generatedAt: string;               // ISO timestamp
  templatePath: string;              // Original CloudFormation template
  toolVersion: string;               // aws-cloud-supporter version
  totalResources: number;            // AnalysisResult.metadata.total_resources
  supportedResources: number;        // AnalysisResult.metadata.supported_resources
  totalAlarms: number;               // All generated alarms count
  cdkVersion: string;                // "^2.80.0"
  nodeVersion: string;               // process.version
}

export interface CDKPackageInstruction {
  dependencies: CDKPackageDependency[];
  installCommand: string;            // Complete npm install command
  devDependencies?: CDKPackageDependency[];
}

export interface CDKPackageDependency {
  packageName: string;               // "aws-cdk-lib"
  version: string;                   // "^2.80.0"
  required: boolean;                 // true for core dependencies
}

// requirement.md FR-6.1準拠のCLIオプション型定義
export interface CDKOptions {
  // 基本制御
  enabled: boolean;                        // --output cdk
  outputDir?: string;                      // --cdk-output-dir
  stackName?: string;                      // --cdk-stack-name
  
  // テンプレートカスタマイズ
  templatePath?: string;                   // --cdk-template
  
  // フィルタリング（既存オプションとの統合）
  resourceTypeFilters?: string[];          // --resource-types (parsed)
  includeLowImportance?: boolean;          // --include-low
  severityFilter?: 'warning' | 'critical'; // --cdk-severity-filter
  
  // Alarmカスタマイズ
  alarmActions?: string[];                 // --cdk-alarm-actions (parsed)
  evaluationPeriods?: number;              // --cdk-evaluation-periods
  missingDataTreatment?: 'notBreaching' | 'breaching' | 'ignore' | 'missing'; // --cdk-missing-data-treatment
  
  // SNS統合
  enableSNS?: boolean;                     // --cdk-enable-sns
  snsTopicArn?: string;                    // --cdk-sns-topic-arn
  
  // 検証・品質
  validateCode?: boolean;                  // --validate-cdk
  continueOnError?: boolean;               // 既存オプション活用
  verbose?: boolean;                       // 既存オプション活用
}

// requirement.md NFR-1準拠のパフォーマンス監視型
export interface CDKPerformanceMetrics {
  totalDurationMs: number;                 // total generation time
  peakMemoryUsageMB: number;               // max memory during processing
  
  // 詳細メトリクス
  parseTimeMs: number;                     // CloudFormation parsing time
  analysisTimeMs: number;                  // Metrics analysis time  
  cdkProcessingTimeMs: number;             // CDK data building time
  templateRenderingTimeMs: number;         // Handlebars template rendering
  codeFormattingTimeMs: number;            // Prettier formatting time
  validationTimeMs?: number;               // TypeScript compilation (optional)
  fileWriteTimeMs?: number;                // File I/O time (optional)
  
  // 統計情報
  resourcesProcessed: number;              // Total resources analyzed
  alarmsGenerated: number;                 // Total alarms created
  templatesProcessed: number;              // Always 1 in current scope
  concurrentTasks: number;                 // Parallel processing tasks
  
  // メモリ詳細
  memoryCheckpoints: MemoryCheckpoint[];   // Memory usage at key points
}

export interface MemoryCheckpoint {
  phase: string;                           // "parsing", "analysis", "generation", etc.
  timestampMs: number;                     // relative to start time
  heapUsedMB: number;                      // heap memory usage
  heapTotalMB: number;                     // heap total memory
}

// requirement.md FR-4.1準拠のセキュリティレポート型
export interface CDKSecurityReport {
  sanitizedProperties: number;             // Count of sanitized sensitive properties
  sensitivePatternMatches: string[];       // Types of sensitive data found
  securityWarnings: CDKSecurityWarning[];  // Security issues detected
  filePermissions: {
    path: string;
    permissions: string;                   // e.g., "600"
    success: boolean;
  }[];
}

export interface CDKSecurityWarning {
  severity: 'low' | 'medium' | 'high';
  message: string;
  resourceId?: string;
  suggestedAction?: string;
}
```

### 3.2 テンプレートエンジン設計（拡張性重視）

#### 3.2.1 テンプレートエンジンインターフェース
```typescript
// src/interfaces/cdk-template.ts
export interface ICDKTemplateEngine {
  // requirement.md FR-7.1: CDK Stack code generation
  generateStackCode(data: CDKStackData): Promise<string>;
  
  // requirement.md FR-3.1: Custom template support  
  loadCustomTemplate(templatePath: string): Promise<void>;
  validateTemplate(templateContent: string): boolean;
  
  // 拡張性のための分離されたメソッド
  generateImports(imports: CDKImportStatement[]): string;
  generateSNSTopics(topics: CDKSNSTopicDefinition[]): string;
  generateAlarmGroups(groups: CDKAlarmGroup[]): string;
  generateStackMetadata(metadata: CDKStackMetadata): string;
}

// src/templates/cdk-template-engine.ts
export class CDKTemplateEngine implements ICDKTemplateEngine {
  private handlebars: typeof Handlebars;
  private defaultTemplates: Map<string, HandlebarsTemplateDelegate>;
  private customTemplate?: HandlebarsTemplateDelegate;
  private helperRegistry: CDKHandlebarsHelpers;

  constructor(private logger: ILogger) {
    this.initializeHandlebars();
    this.helperRegistry = new CDKHandlebarsHelpers();
    this.loadDefaultTemplates();
    this.registerHelpers();
  }

  async generateStackCode(data: CDKStackData): Promise<string> {
    const startTime = performance.now();
    
    try {
      // テンプレート選択（カスタム優先）
      const template = this.customTemplate || this.defaultTemplates.get('stack-main');
      if (!template) {
        throw new Error('No template available for CDK stack generation');
      }
      
      // データ前処理（セキュリティチェック済み前提）
      const processedData = this.preprocessData(data);
      
      // コード生成
      const rawCode = template(processedData);
      
      // コード整形・検証
      const formattedCode = await this.formatAndValidateCode(rawCode);
      
      const duration = performance.now() - startTime;
      this.logger.debug(`Template rendering completed in ${duration.toFixed(1)}ms`);
      
      return formattedCode;
      
    } catch (error) {
      this.logger.error('CDK template generation failed', error as Error);
      throw new CDKTemplateError(
        `Template generation failed: ${(error as Error).message}`,
        { templateData: this.sanitizeDataForLogging(data) }
      );
    }
  }

  // requirement.md FR-3.1: Custom template loading
  async loadCustomTemplate(templatePath: string): Promise<void> {
    // FR-4.2: Path validation
    CDKInputValidator.validateFilePath(templatePath);
    
    // FR-4.2: Template size validation
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    CDKInputValidator.validateTemplateSize(templateContent);
    
    // Template compilation
    this.customTemplate = this.handlebars.compile(templateContent);
    this.logger.info(`Custom template loaded: ${templatePath}`);
  }

  // テンプレート検証
  validateTemplate(templateContent: string): boolean {
    try {
      this.handlebars.compile(templateContent);
      return true;
    } catch (error) {
      this.logger.warn(`Template validation failed: ${(error as Error).message}`);
      return false;
    }
  }

  // 個別生成メソッド（テスト・デバッグ用）
  generateImports(imports: CDKImportStatement[]): string {
    const template = this.defaultTemplates.get('imports');
    return template ? template({ imports }) : '';
  }

  generateSNSTopics(topics: CDKSNSTopicDefinition[]): string {
    const template = this.defaultTemplates.get('sns-topics');
    return template ? template({ topics }) : '';
  }

  generateAlarmGroups(groups: CDKAlarmGroup[]): string {
    const template = this.defaultTemplates.get('alarm-groups');
    return template ? template({ groups }) : '';
  }

  generateStackMetadata(metadata: CDKStackMetadata): string {
    const template = this.defaultTemplates.get('metadata');
    return template ? template({ metadata }) : '';
  }

  // Handlebars初期化
  private initializeHandlebars(): void {
    this.handlebars = Handlebars.create();
    
    // セキュリティ設定
    this.handlebars.registerHelper('preventXSS', function(value: string) {
      return new this.handlebars.SafeString(
        this.handlebars.Utils.escapeExpression(value)
      );
    });
  }

  // デフォルトテンプレート読み込み
  private async loadDefaultTemplates(): Promise<void> {
    this.defaultTemplates = new Map();
    
    const templateFiles = [
      'stack-main.hbs',
      'imports.hbs', 
      'sns-topics.hbs',
      'alarm-groups.hbs',
      'metadata.hbs'
    ];
    
    for (const filename of templateFiles) {
      const templatePath = path.join(__dirname, '../templates', filename);
      const content = await fs.readFile(templatePath, 'utf-8');
      const templateName = path.basename(filename, '.hbs');
      
      this.defaultTemplates.set(templateName, this.handlebars.compile(content));
    }
  }

  // カスタムヘルパー登録
  private registerHelpers(): void {
    // FR-2.2: Construct ID uniqueness helper
    this.handlebars.registerHelper('ensureUnique', this.helperRegistry.ensureUniqueId.bind(this.helperRegistry));
    
    // FR-7.3: Documentation generation helpers
    this.handlebars.registerHelper('generateJSDoc', this.helperRegistry.generateJSDocComment.bind(this.helperRegistry));
    this.handlebars.registerHelper('formatThreshold', this.helperRegistry.formatThresholdComment.bind(this.helperRegistry));
    
    // Conditional helpers
    this.handlebars.registerHelper('eq', (a, b) => a === b);
    this.handlebars.registerHelper('neq', (a, b) => a !== b);
    this.handlebars.registerHelper('and', (a, b) => a && b);
    this.handlebars.registerHelper('or', (a, b) => a || b);
    
    // Array helpers
    this.handlebars.registerHelper('length', (arr: unknown[]) => arr ? arr.length : 0);
    this.handlebars.registerHelper('first', (arr: unknown[]) => arr && arr.length > 0 ? arr[0] : undefined);
    this.handlebars.registerHelper('last', (arr: unknown[]) => arr && arr.length > 0 ? arr[arr.length - 1] : undefined);
  }

  // データ前処理
  private preprocessData(data: CDKStackData): CDKStackData & { 
    uniqueIds: Set<string>;
    generationTimestamp: string;
  } {
    return {
      ...data,
      uniqueIds: new Set<string>(),
      generationTimestamp: new Date().toISOString()
    };
  }

  // コード整形・検証
  private async formatAndValidateCode(code: string): Promise<string> {
    // Prettier整形
    const formatted = await prettier.format(code, {
      parser: 'typescript',
      singleQuote: true,
      trailingComma: 'es5',
      tabWidth: 2,
      semi: true,
      printWidth: 100,
      useTabs: false
    });
    
    // 基本的な構文チェック
    if (!formatted.includes('export class')) {
      throw new Error('Generated code does not contain valid CDK Stack class');
    }
    
    return formatted;
  }

  // ログ用データサニタイズ
  private sanitizeDataForLogging(data: CDKStackData): Record<string, unknown> {
    return {
      stackName: data.stackName,
      alarmGroupsCount: data.alarmGroups.length,
      totalAlarms: data.alarmGroups.reduce((sum, group) => sum + group.totalAlarmCount, 0),
      hasCustomSNS: data.snsTopics.length > 0
    };
  }
}
```

#### 3.2.2 Handlebarsカスタムヘルパー
```typescript
// src/templates/cdk-handlebars-helpers.ts
export class CDKHandlebarsHelpers {
  private usedIds: Set<string> = new Set();

  // FR-2.2: Construct ID uniqueness enforcement
  ensureUniqueId(baseId: string): string {
    let uniqueId = baseId;
    let counter = 1;
    
    while (this.usedIds.has(uniqueId)) {
      uniqueId = `${baseId}${counter}`;
      counter++;
    }
    
    this.usedIds.add(uniqueId);
    return uniqueId;
  }

  // FR-7.3: JSDoc comment generation
  generateJSDocComment(alarm: CDKAlarmDefinition): string {
    const lines = [
      `/**`,
      ` * ${alarm.alarmDescription}`,
      ` * `,
      ` * Metric: ${alarm.metric.namespace}/${alarm.metric.metricName}`,
      ` * Threshold: ${alarm.threshold} (${alarm.severity})`,
      ` * Evaluation: ${alarm.evaluationPeriods} periods of ${alarm.metric.period} seconds`,
      ` * Missing Data: ${alarm.treatMissingData}`,
      ` */`
    ];
    
    return lines.join('\n   ');
  }

  // FR-7.3: Threshold calculation documentation
  formatThresholdComment(alarm: CDKAlarmDefinition, originalThreshold?: { base: number; multiplier: number }): string {
    if (!originalThreshold) {
      return `// Threshold: ${alarm.threshold}`;
    }
    
    return `// Threshold: ${alarm.threshold} (base: ${originalThreshold.base} × ${originalThreshold.multiplier})`;
  }

  // TypeScript variable name sanitization
  sanitizeVariableName(name: string): string {
    // Convert to valid TypeScript identifier
    return name
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^[^a-zA-Z_]/, '_')
      .replace(/__+/g, '_');
  }

  // CDK property formatting
  formatCDKProperty(value: unknown): string {
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "\\'")}'`;
    } else if (typeof value === 'number') {
      return value.toString();
    } else if (typeof value === 'boolean') {
      return value.toString();
    } else {
      return 'undefined';
    }
  }
}

// Template error handling
export class CDKTemplateError extends Error {
  constructor(
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CDKTemplateError';
  }
}
```

#### 3.2.2 デフォルトCDKテンプレート
```handlebars
{{!-- src/templates/cdk-stack.template.hbs --}}
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
{{#if snsTopics}}
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
{{/if}}
import { Construct } from 'constructs';

/**
 * CloudWatch Alarms Stack
 * Generated by AWS Cloud Supporter
 * 
 * Installation requirements:
 * npm install aws-cdk-lib@^2.80.0 constructs@^10.0.0
 */
export class {{stackName}} extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    {{#each snsTopics}}
    // SNS Topic: {{name}}
    const {{variableName}} = {{#if existingArn}}sns.Topic.fromTopicArn(
      this,
      '{{constructId}}',
      '{{existingArn}}'
    );{{else}}new sns.Topic(this, '{{constructId}}', {
      topicName: '{{name}}',
      displayName: '{{displayName}}'
    });{{/if}}
    {{/each}}

    {{#each alarms}}
    {{comment}}
    {{#each alarms}}
    
    /**
     * {{jsDocComment}}
     */
    const {{constructId}} = new cloudwatch.Alarm(this, '{{constructId}}', {
      alarmName: '{{constructId}}',
      alarmDescription: '{{description}}',
      metric: new cloudwatch.Metric({
        namespace: '{{namespace}}',
        metricName: '{{metricName}}',
        dimensionsMap: {
          {{#each dimensions}}
          {{@key}}: '{{this}}',
          {{/each}}
        },
        statistic: cloudwatch.Stats.{{statistic}},
        period: cdk.Duration.seconds({{period}})
      }),
      threshold: {{threshold}},
      evaluationPeriods: {{evaluationPeriods}},
      treatMissingData: cloudwatch.TreatMissingData.{{treatMissingData}}
    });

    {{#each actions}}
    {{#if (eq type 'sns')}}
    {{../constructId}}.addAlarmAction(new cloudwatchActions.SnsAction({{target}}));
    {{/if}}
    {{/each}}
    {{/each}}
    {{/each}}
  }
}
```

### 3.3 CLI統合設計

#### 3.3.1 新しいCLIオプション定義
```typescript
// src/cli/cdk-options.ts
export interface CDKOptions {
  // 基本オプション
  enabled: boolean;                    // --output cdk
  outputDir?: string;                  // --cdk-output-dir <path>
  stackName?: string;                  // --cdk-stack-name <name>
  
  // テンプレートオプション
  templatePath?: string;               // --cdk-template <path>
  
  // フィルタリングオプション
  severityFilter?: 'warning' | 'critical';  // --cdk-severity-filter <level>
  
  // カスタマイズオプション
  alarmActions?: string[];             // --cdk-alarm-actions <type>
  evaluationPeriods?: number;         // --cdk-evaluation-periods <number>
  missingDataTreatment?: string;       // --cdk-missing-data-treatment <behavior>
  
  // SNSオプション
  enableSNS?: boolean;                 // --cdk-enable-sns
  snsTopicArn?: string;               // --cdk-sns-topic-arn <arn>
  
  // 検証オプション
  validateCode?: boolean;              // --validate-cdk
}
```

#### 3.3.2 CLIコマンド拡張
```typescript
// src/cli/commands.ts (拡張)
export function createCLICommand(dependencies: CLIDependencies): Command {
  const program = new Command();
  
  program
    .name('aws-cloud-supporter')
    // ... 既存のオプション
    
    // CDK関連オプション追加
    .option('--cdk-output-dir <path>', 'CDK files output directory')
    .option('--cdk-stack-name <name>', 'CDK Stack class name')
    .option('--cdk-template <path>', 'Custom CDK template file path')
    .option('--cdk-severity-filter <level>', 'Filter alarms by severity: warning|critical')
    .option('--cdk-alarm-actions <types>', 'Comma-separated alarm action types')
    .option('--cdk-evaluation-periods <number>', 'Override evaluation periods', parseInt)
    .option('--cdk-missing-data-treatment <behavior>', 'Missing data treatment: notBreaching|breaching|ignore|missing')
    .option('--cdk-enable-sns', 'Generate SNS topic for alarm notifications')
    .option('--cdk-sns-topic-arn <arn>', 'Use existing SNS topic ARN')
    .option('--validate-cdk', 'Validate generated CDK code compilation')
    
    .action(async (templatePath: string, options: ExtendedCLIOptions) => {
      // CDKモード判定
      if (options.output === 'cdk') {
        const cdkController = new CDKController(dependencies);
        await cdkController.handleCDKGeneration(templatePath, options);
      } else {
        // 既存処理
        await handleStandardGeneration(templatePath, options, dependencies);
      }
    });
    
  return program;
}
```

#### 3.3.3 CDKコントローラー
```typescript
// src/controllers/cdk.controller.ts
export class CDKController {
  constructor(private dependencies: CLIDependencies) {}

  async handleCDKGeneration(
    templatePath: string, 
    options: ExtendedCLIOptions
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      // 1. 入力検証
      this.validateCDKOptions(options);
      
      // 2. 既存分析処理実行
      const analysisResult = await this.dependencies.analyzer.analyze(
        templatePath,
        this.buildAnalysisOptions(options)
      );
      
      // 3. CDK生成
      const cdkGenerator = new CDKGenerator(
        new CDKTemplateEngine(),
        new CDKValidator(),
        new CDKFileWriter(),
        this.dependencies.logger
      );
      
      const cdkOutput = await cdkGenerator.generate({
        analysisResult,
        cdkOptions: this.buildCDKOptions(options)
      });
      
      // 4. 結果出力
      await this.outputResults(cdkOutput, options);
      
      // 5. 統計情報表示
      if (options.verbose) {
        this.displayCDKStatistics(cdkOutput, performance.now() - startTime);
      }
      
    } catch (error) {
      this.handleCDKError(error as Error, options);
      process.exit(1);
    }
  }
}
```

### 3.4 セキュリティ設計

#### 3.4.1 機密情報サニタイズ
```typescript
// src/security/sanitizer.ts
export class CDKSecuritySanitizer {
  private static readonly SENSITIVE_PATTERNS = [
    /password/i,
    /secret/i,
    /key/i,
    /token/i,
    /credential/i,
    /arn:aws:iam::\d{12}:/,  // AWS Account ID
    /AKIA[0-9A-Z]{16}/,      // AWS Access Key
  ];

  static sanitizeResourceProperties(
    properties: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      if (this.isSensitiveProperty(key, value)) {
        sanitized[key] = this.getSanitizedValue(key, value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeResourceProperties(
          value as Record<string, unknown>
        );
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  private static isSensitiveProperty(key: string, value: unknown): boolean {
    if (typeof value !== 'string') return false;
    
    return this.SENSITIVE_PATTERNS.some(pattern => 
      pattern.test(key) || pattern.test(value)
    );
  }

  private static getSanitizedValue(key: string, value: unknown): string {
    return `/* [REDACTED: ${key}] */`;
  }
}
```

#### 3.4.2 入力検証
```typescript
// src/security/input-validator.ts
export class CDKInputValidator {
  static validateFilePath(filePath: string): void {
    // ディレクトリトラバーサル防止
    if (filePath.includes('..') || filePath.includes('~')) {
      throw new CloudSupporterError(
        ErrorType.SECURITY_ERROR,
        `Invalid file path: ${filePath}. Directory traversal not allowed.`
      );
    }
    
    // 絶対パス確認
    if (!path.isAbsolute(filePath)) {
      throw new CloudSupporterError(
        ErrorType.VALIDATION_ERROR,
        `File path must be absolute: ${filePath}`
      );
    }
  }

  static validateSNSTopicArn(arn: string): void {
    const snsArnPattern = /^arn:aws:sns:[a-z0-9-]+:\d{12}:[A-Za-z0-9_-]+$/;
    
    if (!snsArnPattern.test(arn)) {
      throw new CloudSupporterError(
        ErrorType.VALIDATION_ERROR,
        `Invalid SNS Topic ARN format: ${arn}`
      );
    }
  }

  static validateTemplateSize(templateContent: string): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const size = Buffer.byteLength(templateContent, 'utf8');
    
    if (size > maxSize) {
      throw new CloudSupporterError(
        ErrorType.VALIDATION_ERROR,
        `Template file too large: ${size} bytes (max: ${maxSize} bytes)`
      );
    }
  }
}
```

### 3.5 性能設計

#### 3.5.1 メモリ最適化
```typescript
// src/performance/memory-optimizer.ts
export class CDKMemoryOptimizer {
  private static readonly MAX_MEMORY_MB = 512;
  private memoryMonitor: NodeJS.Timer | null = null;

  startMemoryMonitoring(): void {
    this.memoryMonitor = setInterval(() => {
      const usage = process.memoryUsage();
      const heapUsedMB = usage.heapUsed / (1024 * 1024);
      
      if (heapUsedMB > this.MAX_MEMORY_MB) {
        this.triggerMemoryCleanup();
      }
    }, 1000);
  }

  private triggerMemoryCleanup(): void {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Clear large objects
    this.clearCaches();
  }

  optimizeAlarmGeneration(alarms: CDKAlarm[]): CDKAlarm[][] {
    // アラームを小さなバッチに分割
    const batchSize = 100;
    const batches: CDKAlarm[][] = [];
    
    for (let i = 0; i < alarms.length; i += batchSize) {
      batches.push(alarms.slice(i, i + batchSize));
    }
    
    return batches;
  }
}
```

#### 3.5.2 並列処理設計
```typescript
// src/performance/parallel-processor.ts
export class CDKParallelProcessor {
  private static readonly MAX_CONCURRENCY = 10;

  async processResourcesInParallel(
    resources: ResourceWithMetrics[],
    processor: (resource: ResourceWithMetrics) => Promise<CDKAlarmGroup>
  ): Promise<CDKAlarmGroup[]> {
    
    const semaphore = new Semaphore(this.MAX_CONCURRENCY);
    
    const tasks = resources.map(async (resource) => {
      await semaphore.acquire();
      try {
        return await processor(resource);
      } finally {
        semaphore.release();
      }
    });
    
    return Promise.all(tasks);
  }
}

class Semaphore {
  private tokens: number;
  private waitingQueue: (() => void)[] = [];

  constructor(maxConcurrency: number) {
    this.tokens = maxConcurrency;
  }

  async acquire(): Promise<void> {
    if (this.tokens > 0) {
      this.tokens--;
      return;
    }
    
    return new Promise<void>((resolve) => {
      this.waitingQueue.push(resolve);
    });
  }

  release(): void {
    if (this.waitingQueue.length > 0) {
      const resolve = this.waitingQueue.shift()!;
      resolve();
    } else {
      this.tokens++;
    }
  }
}
```

### 3.6 エラーハンドリング設計

```typescript
// src/errors/cdk-errors.ts
export enum CDKErrorType {
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  COMPILATION_ERROR = 'COMPILATION_ERROR',
  FILE_OUTPUT_ERROR = 'FILE_OUTPUT_ERROR',
  SECURITY_ERROR = 'SECURITY_ERROR'
}

export class CDKError extends CloudSupporterError {
  constructor(
    type: CDKErrorType,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(ErrorType.RESOURCE_ERROR, message, { cdkErrorType: type, ...details });
  }
}

export class CDKErrorHandler {
  static handleTemplateError(error: Error, templatePath?: string): never {
    throw new CDKError(
      CDKErrorType.TEMPLATE_ERROR,
      `Template processing failed: ${error.message}`,
      { templatePath, originalError: error.message }
    );
  }

  static handleCompilationError(
    errors: TypeScriptCompilationError[],
    filePath?: string
  ): never {
    const errorDetails = errors.map(e => ({
      line: e.line,
      column: e.column,
      message: e.message
    }));
    
    throw new CDKError(
      CDKErrorType.COMPILATION_ERROR,
      `TypeScript compilation failed: ${errors.length} errors found`,
      { filePath, errors: errorDetails }
    );
  }
}
```

### 3.7 バリデーション設計

```typescript
// src/validation/cdk-validator.ts
export class CDKValidator implements ICDKValidator {
  constructor(private logger: ILogger) {}

  async validateGeneratedCode(
    code: string,
    options: CDKOptions
  ): Promise<CDKValidationResult> {
    const results: CDKValidationResult = {
      isValid: true,
      compilationErrors: [],
      warnings: [],
      suggestions: []
    };

    if (options.validateCode) {
      // TypeScriptコンパイル検証
      const compilationResult = await this.compileTypeScript(code);
      results.compilationErrors = compilationResult.errors;
      results.isValid = compilationResult.errors.length === 0;

      // CDK best practices検証
      const bestPracticeResult = this.validateCDKBestPractices(code);
      results.warnings.push(...bestPracticeResult.warnings);
      results.suggestions.push(...bestPracticeResult.suggestions);

      // AWS制限検証
      const awsLimitsResult = this.validateAWSLimits(code);
      if (awsLimitsResult.violations.length > 0) {
        results.warnings.push(...awsLimitsResult.violations);
      }
    }

    return results;
  }

  private async compileTypeScript(code: string): Promise<CompilationResult> {
    const ts = await import('typescript');
    
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      strict: true,
      skipLibCheck: true
    };

    const fileName = 'generated-stack.ts';
    const sourceFile = ts.createSourceFile(
      fileName,
      code,
      ts.ScriptTarget.ES2020
    );

    const program = ts.createProgram([fileName], compilerOptions, {
      getSourceFile: (name) => name === fileName ? sourceFile : undefined,
      writeFile: () => {},
      getCurrentDirectory: () => '',
      getDirectories: () => [],
      fileExists: () => true,
      readFile: () => '',
      getCanonicalFileName: (name) => name,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n'
    });

    const diagnostics = ts.getPreEmitDiagnostics(program);
    
    return {
      errors: diagnostics.map(d => ({
        line: d.start ? sourceFile.getLineAndCharacterOfPosition(d.start).line + 1 : 0,
        column: d.start ? sourceFile.getLineAndCharacterOfPosition(d.start).character + 1 : 0,
        message: ts.flattenDiagnosticMessageText(d.messageText, '\n')
      }))
    };
  }
}
```

## 4. テスト設計

### 4.1 テスト戦略

```typescript
// tests/unit/cdk/cdk-generator.test.ts
describe('CDKGenerator', () => {
  let generator: CDKGenerator;
  let mockTemplateEngine: jest.Mocked<ICDKTemplateEngine>;
  let mockValidator: jest.Mocked<ICDKValidator>;
  
  beforeEach(() => {
    mockTemplateEngine = createMockTemplateEngine();
    mockValidator = createMockValidator();
    generator = new CDKGenerator(mockTemplateEngine, mockValidator, mockFileWriter, mockLogger);
  });

  describe('generate', () => {
    it('should generate valid CDK code for RDS metrics', async () => {
      const input = createMockCDKInput('AWS::RDS::DBInstance');
      const result = await generator.generate(input);
      
      expect(result.generatedCode).toContain('class CloudWatchAlarmsStack extends cdk.Stack');
      expect(result.generatedCode).toContain('CPUUtilizationWarningAlarm');
      expect(result.generatedCode).toContain('CPUUtilizationCriticalAlarm');
    });

    it('should handle memory limits during generation', async () => {
      const input = createLargeTemplateCDKInput(500); // 500 resources
      
      const startMemory = process.memoryUsage().heapUsed;
      await generator.generate(input);
      const endMemory = process.memoryUsage().heapUsed;
      
      const memoryUsedMB = (endMemory - startMemory) / (1024 * 1024);
      expect(memoryUsedMB).toBeLessThan(512);
    });
  });
});
```

### 4.2 パフォーマンステスト
```typescript
// tests/performance/cdk-performance.test.ts
describe('CDK Performance Tests', () => {
  it('should complete generation within 30 seconds for 500 resources', async () => {
    const template = generateLargeTemplate(500);
    const startTime = Date.now();
    
    const result = await cdkController.handleCDKGeneration(template, {
      output: 'cdk',
      performanceMode: true
    });
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(30000); // 30 seconds
  });
});
```

### 4.3 セキュリティテスト
```typescript
// tests/security/cdk-security.test.ts
describe('CDK Security Tests', () => {
  it('should sanitize sensitive information', () => {
    const properties = {
      DatabasePassword: 'secret123',
      ApiKeyValue: 'ak_live_12345',
      NormalProperty: 'safe_value'
    };
    
    const sanitized = CDKSecuritySanitizer.sanitizeResourceProperties(properties);
    
    expect(sanitized.DatabasePassword).toBe('/* [REDACTED: DatabasePassword] */');
    expect(sanitized.ApiKeyValue).toBe('/* [REDACTED: ApiKeyValue] */');
    expect(sanitized.NormalProperty).toBe('safe_value');
  });
});
```

## 5. 現実的な実装計画（8-10週間）

### 5.1 Phase別詳細計画

#### Phase 1: MVP実装（3週間）- 動作する最小構成
**目標**: 1つのRDSリソースでCDKアラーム生成ができる

**Week 1: 基本構造**
- [ ] CDKGenerator基本クラス実装（1つのメインクラス）
- [ ] 基本データ型定義（CDKStackDataの簡略版）
- [ ] 単純なHandlebarsテンプレート（RDS用のみ）
- [ ] 単体テスト（CDKGeneratorのみ）

**Week 2: CLI統合**
- [ ] commands.tsに`--output cdk`オプション追加（30行程度）
- [ ] CDK/標準モードの振り分け実装
- [ ] 基本的なファイル出力機能
- [ ] 統合テスト（1つのテンプレートで動作確認）

**Week 3: 基本品質確保**
- [ ] TypeScriptコンパイル検証
- [ ] 基本的なエラーハンドリング
- [ ] MVP完成・動作確認

**Phase 1完了基準**:
```bash
# このコマンドで動作すること
npm run dev examples/web-application-stack.yaml --output cdk --resource-types "AWS::RDS::DBInstance"
# CloudWatchAlarmsStack.ts が生成される
```

#### Phase 2: 全リソース対応（3週間）
**目標**: 6つの全リソースタイプに対応

**Week 4-5: リソース拡張**
- [ ] Lambda、ECS、ALB、DynamoDB、API Gateway対応
- [ ] SNS統合（基本）
- [ ] フィルタリング機能

**Week 6: 統合**
- [ ] 全リソース統合テスト
- [ ] パフォーマンス基本チェック

#### Phase 3: 品質・性能向上（2-4週間）
**目標**: 本番品質の実現

**Week 7-8: セキュリティ・検証**
- [ ] 機密情報サニタイズ
- [ ] 入力検証強化
- [ ] TypeScript validation

**Week 9-10: 性能最適化**
- [ ] メモリ最適化
- [ ] 並列処理
- [ ] パフォーマンステスト

### 5.2 実装順序の詳細（迷わないために）

#### 最初に実装するファイル順序
1. `src/types/cdk-simple.ts` - 基本型定義
2. `src/generators/cdk.generator.ts` - メインクラス
3. `src/templates/basic-stack.hbs` - 基本テンプレート
4. `cli/commands.ts` - CLIオプション追加
5. `tests/cdk-generator.test.ts` - 基本テスト

#### 各ファイルの実装タスク

**src/types/cdk-simple.ts（Day 1）**:
```typescript
// 最小限の型定義（Phase 1用）
export interface SimpleCDKStackData {
  stackClassName: string;
  alarms: SimpleAlarm[];
}

export interface SimpleAlarm {
  constructId: string;
  metricName: string;
  threshold: number;
  // ... 必要最小限のプロパティ
}
```

**src/generators/cdk.generator.ts（Day 2-3）**:
```typescript
// 1つのクラスに集約（Phase 1用）
export class CDKGenerator {
  async generate(analysisResult: ExtendedAnalysisResult): Promise<string> {
    // 1. AnalysisResult → SimpleCDKStackData 変換
    // 2. Handlebars template rendering
    // 3. Prettier formatting
    // 4. 結果返却
  }
}
```

### 5.3 各フェーズの完了判定基準

#### Phase 1 MVP完了判定
- [ ] `npm test`が全て成功する
- [ ] 1つのRDSリソースでCDKコード生成成功
- [ ] 生成されたコードがTypeScriptコンパイル成功
- [ ] 実行時間10秒以内
- [ ] メモリ使用量200MB以内

#### Phase 2 全リソース完了判定
- [ ] 6リソースタイプ全てでCDK生成成功  
- [ ] SNS統合動作確認
- [ ] フィルタリング動作確認
- [ ] AC-1〜AC-2の受け入れ基準クリア

#### Phase 3 品質完了判定
- [ ] AC-1〜AC-5の全受け入れ基準クリア
- [ ] 30秒/512MB性能要件クリア
- [ ] セキュリティテスト成功

### 5.4 リスク管理（現実的）

| フェーズ | 主要リスク | 発生時の対策 | 影響緩和 |
|----------|------------|--------------|----------|
| Phase 1 | Handlebarsテンプレートの複雑化 | 段階的実装、テスト駆動 | MVP範囲縮小 |
| Phase 2 | 6リソースタイプの統合複雑性 | リソース毎の単体テスト | 段階的リリース |
| Phase 3 | 性能要件達成困難 | 早期プロファイリング | 要件再交渉 |

### 5.5 開発環境セットアップ（初日）

```bash
# 必要な依存関係追加
npm install handlebars prettier typescript @types/node

# 開発用依存関係
npm install --save-dev jest @types/jest ts-jest

# ディレクトリ構造作成
mkdir -p src/generators src/types src/templates
mkdir -p tests/unit tests/integration
```

### 5.6 毎週の進捗確認項目

**毎週金曜日実施**:
- [ ] 実装完了タスク確認
- [ ] テスト実行結果確認  
- [ ] パフォーマンス測定
- [ ] 次週計画調整

**ブロッカー発生時のエスカレーション**:
1. 1日以上進まない技術課題 → 技術リーダーに相談
2. 要件解釈の不明点 → ステークホルダーに確認
3. 性能問題 → アーキテクチャ見直し検討

## 6. よくあるエラーと対処法（実用重視）

### 6.1 実行時エラーと対処法

#### エラー: "No CDK code generated"
**原因**: 対応リソースタイプが見つからない
```bash
# 問題のあるコマンド例
npm run dev template.yaml --output cdk --resource-types "AWS::EC2::Instance"
```
**対処法**: 
```bash
# 対応リソースタイプを確認
npm run dev template.yaml --output cdk --resource-types "AWS::RDS::DBInstance,AWS::Lambda::Function"

# または全リソース対象
npm run dev template.yaml --output cdk
```

#### エラー: "TypeScript compilation failed"
**原因**: 生成されたCDKコードに構文エラー
**対処法**: 
1. `--validate-cdk`オプションで詳細確認
2. カスタムテンプレート使用時は構文チェック
3. 最新CDKバージョンとの互換性確認

#### エラー: "Memory limit exceeded"
**原因**: 大規模テンプレート処理でメモリ不足
**対処法**: 
```bash
# リソースタイプを絞る
npm run dev large-template.yaml --output cdk --resource-types "AWS::RDS::DBInstance"

# 低重要度メトリクスを除外
npm run dev large-template.yaml --output cdk --no-include-low
```

### 6.2 よくある使用パターン

#### パターン1: 特定リソースのみCDK生成
```bash
# RDSのみ
npm run dev template.yaml --output cdk --resource-types "AWS::RDS::DBInstance"

# Lambda + DynamoDBのみ  
npm run dev template.yaml --output cdk --resource-types "AWS::Lambda::Function,AWS::DynamoDB::Table"
```

#### パターン2: SNS通知付きアラーム
```bash
# 新しいSNSトピック作成
npm run dev template.yaml --output cdk --cdk-enable-sns

# 既存SNSトピック使用
npm run dev template.yaml --output cdk --cdk-sns-topic-arn "arn:aws:sns:us-east-1:123456789012:my-topic"
```

#### パターン3: カスタムしきい値
```bash
# 評価期間を10分に変更
npm run dev template.yaml --output cdk --cdk-evaluation-periods 2

# Critical レベルのみ生成
npm run dev template.yaml --output cdk --cdk-severity-filter critical
```

### 6.3 生成されるファイルの確認方法

#### 生成成功時の確認
```bash
# ファイル生成確認
ls -la CloudWatchAlarmsStack.ts

# TypeScript構文チェック  
npx tsc --noEmit CloudWatchAlarmsStack.ts

# CDKコードの内容確認
head -20 CloudWatchAlarmsStack.ts
```

#### 期待される出力例
```typescript
// 正常に生成されたファイルの開始部分
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

/**
 * CloudWatch Alarms Stack
 * Generated by AWS Cloud Supporter v1.0.0
 */
export class CloudWatchAlarmsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // RDS instance: MyDatabase
    const myDatabaseCpuUtilizationWarningAlarm = new cloudwatch.Alarm(
      // ... アラーム定義
```

### 6.4 デバッグ方法

#### 詳細ログ出力
```bash
# 詳細ログで実行
npm run dev template.yaml --output cdk --verbose

# どのリソースが処理されているか確認
npm run dev template.yaml --output json --verbose | grep "resource_type"
```

#### 段階的デバッグ
```bash
# 1. 標準出力で分析結果確認
npm run dev template.yaml --output json

# 2. CDK生成（ファイル出力なし）  
npm run dev template.yaml --output cdk

# 3. CDK生成（ファイル出力あり）
npm run dev template.yaml --output cdk --cdk-output-dir ./output
```

### 6.5 パフォーマンス監視

#### 実行時間測定
```bash
# 実行時間測定
time npm run dev template.yaml --output cdk

# メモリ使用量確認（Linux/Mac）
/usr/bin/time -v npm run dev template.yaml --output cdk
```

#### パフォーマンス改善のヒント
- 大規模テンプレート: `--resource-types`でフィルタリング
- メモリ不足: `--no-include-low`で低重要度メトリクス除外
- 処理時間短縮: `--performance-mode`で並列処理

### 6.6 本番運用時の注意点

#### CDKデプロイ準備
```bash
# 生成されたファイルをCDKプロジェクトに配置
cp CloudWatchAlarmsStack.ts /path/to/cdk-project/lib/

# 依存関係インストール
cd /path/to/cdk-project
npm install aws-cdk-lib@^2.80.0 constructs@^10.0.0

# CDKデプロイ
cdk deploy CloudWatchAlarmsStack
```

#### 定期実行時の考慮事項
- CloudFormationテンプレート更新時のCDKコード再生成
- 既存アラームとの重複チェック
- アラーム数がAWS制限（5000個）を超えないよう監視

### 6.7 トラブルシューティング連絡先
- 技術的問題: GitHub Issues
- 要件・仕様に関する質問: プロジェクトチーム
- 緊急の本番問題: オンコールエンジニア