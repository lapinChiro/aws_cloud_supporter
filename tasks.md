# AWS Cloud Supporter - CDK Generation Implementation Tasks

## プロジェクト概要・新規参加者ガイド

### aws_cloud_supporter とは何か？
aws_cloud_supporterは、**CloudFormationテンプレートからAWSリソースを解析し、最適なCloudWatch監視設定を自動生成する**CLIツールです。

**現在の機能（実装済み）**:
- CloudFormationテンプレート解析
- 6つのAWSリソースタイプ（RDS、Lambda、ECS、ALB、DynamoDB、API Gateway）のメトリクス抽出
- 117種類のCloudWatchメトリクス推奨の生成
- JSON/HTML形式での監視設定レポート出力

**今回追加するCDK機能の価値**:
- JSON/HTMLレポートを見るだけでなく、**実際にAWSにデプロイ可能なCDKコード**を自動生成
- 手動でのCloudWatchアラーム設定を**完全自動化**
- 最適なしきい値と通知設定を含む**本番対応のモニタリング**を即座に構築可能

### CDK機能実装後のユーザー体験
```bash
# Before（現在）: 監視設定の参考情報を表示
npm run dev template.yaml --output json
# → JSON形式のメトリクス推奨情報を表示（手動でCloudWatchアラーム作成が必要）

# After（今回実装）: そのままAWSにデプロイ可能なCDKコードを生成
npm run dev template.yaml --output cdk
# → TypeScript CDKコードを出力（cdk deployで即座にアラーム設定完了）
```

### 技術スタック・開発環境詳細

#### 必須環境
- **Node.js**: 18.0以上（推奨: 20.x LTS）
- **npm**: 9.0以上
- **TypeScript**: 4.9以上（プロジェクト内で管理）
- **OS**: Linux/macOS/Windows（WSL2推奨）

#### 必須ツール・ライブラリ
- **CDK**: AWS CDK v2.80.0以上（今回追加）
- **テンプレートエンジン**: Handlebars.js（今回追加）
- **コード整形**: Prettier（既存）
- **テスト**: Jest（既存）
- **CLIフレームワーク**: Commander.js（既存）

#### 推奨開発環境
- **IDE**: Visual Studio Code + TypeScript拡張
- **デバッガ**: Node.js built-in debugger
- **プロファイラ**: clinic.js（パフォーマンス最適化時）

### 必要な前提知識・学習ガイド

#### 必須知識（最低限）
1. **TypeScript中級**:
   - Interface, Type, Generics の使用
   - async/await, Promise の理解
   - Node.js fs, path モジュールの使用
   - **学習リソース**: TypeScript Handbook（2-3日）

2. **AWS CloudWatch基本**:
   - Metrics, Alarms, Dimensions の概念
   - 各AWSサービス（RDS、Lambda等）の基本的なメトリクス
   - **学習リソース**: AWS CloudWatch User Guide（1-2日）

3. **AWS CDK基本**:
   - Stack, Construct の概念
   - CloudWatch Alarm, Metric クラスの使用方法
   - **学習リソース**: CDK Workshop（2-3日）

#### 推奨知識（効率的な開発のため）
1. **Handlebars.js**: テンプレート記法、ヘルパー関数（1日）
2. **Commander.js**: CLIオプション定義、action関数（0.5日）  
3. **Jest テスト**: unit test, integration test の記述（1日）

#### 既存コード理解ガイド（重要）
```bash
# Step 1: プロジェクト動作確認（30分）
git clone <repository>
npm install
npm run dev examples/web-application-stack.yaml --output json

# Step 2: 既存コード構造理解（2時間）
# 以下のファイルを順番に読む：
1. src/types/metrics.ts - データ構造理解
2. src/core/analyzer.ts - 分析処理の流れ
3. src/generators/base.generator.ts - 生成器パターン
4. src/cli/commands.ts - CLI実装パターン
5. tests/unit/ 配下のテスト - テストパターン

# Step 3: 実際の分析結果確認（30分）
npm run dev examples/web-application-stack.yaml --output json | jq '.resources[0]'
# ResourceWithMetrics構造の実際のデータを確認

# Step 4: 開発環境確認（30分）
npm test
npm run typecheck
npm run dev examples/serverless-api-sam.yaml --output html --file report.html
```

### 関連ドキュメント読了順序（重要）
1. **CLAUDE.md**（20分）: プロジェクト開発規約・品質基準
2. **requirement.md**（60分）: CDK機能の要件定義
3. **design.md**（40分）: 実装方針・アーキテクチャ
4. **このtasks.md**: 具体的な作業内容

### コーディング規約・品質基準
requirement.md記載の通り、以下の品質基準を厳守：
- **Zero Type Errors**: TypeScript strict mode でエラー0個
- **No any Types**: any型の使用禁止、適切な型定義必須
- **Build Success**: 全ビルド成功必須
- **Test Coverage**: 80%以上のカバレッジ維持

### よくあるエラーと対処法（実装開始前に理解推奨）

#### TypeScript関連
```bash
# エラー: Type errors in import statements
npm run typecheck
# 対処: src/types/metrics.ts からの正確な型importを確認

# エラー: Handlebars template compilation failed  
# 対処: テンプレート構文をHandlebars公式ドキュメントで確認
```

#### AWS関連
```bash
# エラー: Invalid CloudWatch dimensions
# 対処: AWS公式ドキュメントでCloudWatch Dimensions仕様を確認

# エラー: CDK construct ID conflicts
# 対処: 生成されるIDの一意性をテストで確認
```

#### 開発フロー
```bash
# 実装時の推奨フロー
1. npm run typecheck  # 型エラー確認
2. npm test           # テスト実行
3. npm run dev examples/web-application-stack.yaml --output json --verbose  # 実際データで動作確認
```

## 実装フェーズとタスク

---

## Phase 0: 環境準備（1日）

### T-000: 開発環境セットアップ

**概要**: CDK機能開発に必要な環境とツールをセットアップ

**前提条件**:
- Node.js 18以上がインストール済み
- プロジェクトルートディレクトリで作業中
- `npm install`で既存依存関係がインストール済み

**実装内容**:
1. CDK関連依存関係の追加
2. 必要なディレクトリ構造作成
3. 開発ツール設定確認
4. 既存コードの動作確認

**具体的な作業手順**:
```bash
# 1. 必要な依存関係追加
npm install handlebars prettier @types/handlebars
npm install --save-dev @types/prettier

# 2. ディレクトリ構造作成
mkdir -p src/generators src/templates src/security src/performance
mkdir -p tests/unit/cdk tests/integration/cdk tests/security

# 3. 既存機能動作確認
npm run dev examples/web-application-stack.yaml --output json
npm test
npm run typecheck

# 4. 環境設定確認
node --version  # 18以上であること
npm list typescript  # 4.9以上であること
```

**完了条件**:
- [ ] `npm list handlebars prettier`で依存関係確認できる
- [ ] 指定されたディレクトリ構造が存在する
- [ ] `npm test`で既存テストが全て成功する
- [ ] `npm run dev examples/web-application-stack.yaml --output json`が10秒以内で成功する
- [ ] Git status cleanであること（コミット済み状態）

**関連要件**: requirement.md NFR-4, CS-1
**見積時間**: 2時間
**必要スキル**: Node.js、npm、基本的な環境構築
**依存関係**: なし
**担当者**: プロジェクトリード

---

## Phase 1: MVP実装（3週間）

### T-001: 基本型定義実装

**概要**: CDK生成に必要な型定義を作成（RDS対応の最小構成）

**前提条件**:
- T-000が完了している
- `src/types/metrics.ts`のExtendedAnalysisResult、ResourceWithMetrics、MetricDefinitionを理解している
- requirement.mdのFR-7.1（CDKコード構造要件）を理解している

**実装内容**:
1. `src/types/cdk-mvp.ts`ファイル作成
2. 以下の型定義を正確に実装:
   - `CDKStackData`: スタック全体のデータ構造
   - `CDKAlarmDefinition`: 個別アラーム定義
   - `CDKOptions`: CLIオプション（基本版）
   - `CDKGenerationResult`: 生成結果

**完了条件**:
- [ ] `src/types/cdk-mvp.ts`が作成されている
- [ ] `npm run typecheck`で型エラー0個
- [ ] 以下の必須プロパティを含む型定義ができている:
  - CDKStackData: stackClassName, alarms, metadata
  - CDKAlarmDefinition: constructId, metricName, namespace, threshold, severity, dimensions
  - CDKOptions: enabled, outputDir, stackName
- [ ] 全型定義にJSDoc説明コメントが含まれている
- [ ] 既存`src/types/metrics.ts`からのimportが正しい
- [ ] 型定義のunit testが作成されている（型の互換性確認）

**実装必須コード**:
```typescript
// src/types/cdk-mvp.ts
import { ExtendedAnalysisResult, ResourceWithMetrics, MetricDefinition } from './metrics';

/**
 * CDK Stack generation data structure
 * Requirement: FR-7.1 CDK コード構造
 */
export interface CDKStackData {
  /** CDK Stack class name (e.g., "CloudWatchAlarmsStack") */
  stackClassName: string;
  
  /** Generated alarm definitions */
  alarms: CDKAlarmDefinition[];
  
  /** Stack metadata for documentation */
  metadata: {
    generatedAt: string;
    templatePath: string;
    totalResources: number;
    totalAlarms: number;
  };
}

/**
 * CDK CloudWatch Alarm definition
 * Requirement: FR-1.3 アラーム設定（warning/critical両方）
 */
export interface CDKAlarmDefinition {
  /** Unique CDK construct ID - Pattern: {LogicalId}{MetricName}{Severity}Alarm */
  constructId: string;
  
  /** CloudWatch metric name */
  metricName: string;
  
  /** CloudWatch namespace */
  namespace: string;
  
  /** CloudWatch dimensions for the resource */
  dimensions: Record<string, string>;
  
  /** Alarm threshold value */
  threshold: number;
  
  /** Alarm severity level */
  severity: 'Warning' | 'Critical';
  
  /** Original resource logical ID from CloudFormation */
  resourceLogicalId: string;
  
  /** AWS resource type */
  resourceType: string;
  
  /** Human-readable description */
  description: string;
}

/**
 * CDK generation options (MVP version)
 * Requirement: FR-6.1 CLIオプション
 */
export interface CDKOptions {
  /** CDK mode enabled */
  enabled: boolean;
  
  /** Output directory path (optional) */
  outputDir?: string;
  
  /** Custom stack class name (default: CloudWatchAlarmsStack) */
  stackName?: string;
  
  /** Include low-importance metrics */
  includeLowImportance?: boolean;
  
  /** Resource type filters */
  resourceTypeFilters?: string[];
  
  /** Verbose logging */
  verbose?: boolean;
}
```

**テスト要件**:
```typescript
// tests/unit/cdk/types.test.ts
describe('CDK MVP Types', () => {
  it('should have required properties in CDKStackData', () => {
    const data: CDKStackData = {
      stackClassName: 'TestStack',
      alarms: [],
      metadata: { /* ... */ }
    };
    expect(typeof data.stackClassName).toBe('string');
  });
});
```

**関連要件**: requirement.md FR-7.1、NFR-2、AC-3
**見積時間**: 6時間（セットアップ1h + 実装4h + テスト1h）
**必要スキル**: TypeScript中級、AWS CloudWatch基本知識、JSDoc記述
**依存関係**: T-000
**担当者**: TypeScript経験者

---

### T-002: 基本Handlebarsテンプレート作成

**概要**: RDS用CDK Stack生成のための基本テンプレートを作成

**前提条件**:
- T-001が完了している
- Handlebarsテンプレート記法（`{{}}`, `{{#each}}`, `{{#if}}`）を理解している
- AWS CDKのStack、Alarm、Metricクラスの基本的な使用方法を理解している
- requirement.mdのFR-7.1（CDKコード構造）を理解している

**実装内容**:
1. `src/templates/cdk-stack-mvp.hbs`ファイル作成
2. CDK imports、Stack class、constructorの基本構造
3. RDSアラーム専用のテンプレートロジック
4. Handlebars変数とヘルパーの使用
5. 生成されるコードのフォーマット定義

**完了条件**:
- [ ] `src/templates/cdk-stack-mvp.hbs`が作成されている
- [ ] テンプレートがHandlebars構文として正しい（`handlebars.compile()`でエラーなし）
- [ ] 以下の必須要素を含むテンプレートになっている:
  - CDK imports (aws-cdk-lib, aws-cloudwatch, constructs)
  - Stack class definition extending cdk.Stack
  - Constructor with proper parameters
  - Alarm constructs with all required properties
- [ ] RDSの2つのアラーム（CPU Warning/Critical）を生成できる
- [ ] テンプレート単体テスト（テンプレートコンパイル＋サンプルデータ適用）が成功する

**必須テンプレート構造**:
```handlebars
{{!-- src/templates/cdk-stack-mvp.hbs --}}
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

/**
 * CloudWatch Alarms Stack for AWS Resources
 * Generated by AWS Cloud Supporter v1.0.0
 * Source Template: {{metadata.templatePath}}
 * Generated: {{metadata.generatedAt}}
 */
export class {{stackClassName}} extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

{{#each alarms}}
    // {{description}} ({{severity}}: {{threshold}})
    const {{constructId}} = new cloudwatch.Alarm(this, '{{constructId}}', {
      alarmName: '{{resourceLogicalId}}-{{metricName}}-{{severity}}',
      alarmDescription: '{{description}}',
      metric: new cloudwatch.Metric({
        namespace: '{{namespace}}',
        metricName: '{{metricName}}',
        dimensionsMap: {
{{#each dimensions}}
          {{@key}}: '{{this}}',
{{/each}}
        },
        statistic: cloudwatch.Stats.AVERAGE,
        period: cdk.Duration.seconds(300)
      }),
      threshold: {{threshold}},
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

{{/each}}
  }
}
```

**テスト要件**:
```typescript
// tests/unit/cdk/template.test.ts
describe('CDK Template MVP', () => {
  it('should compile without Handlebars errors', () => {
    const templateContent = fs.readFileSync('src/templates/cdk-stack-mvp.hbs', 'utf-8');
    expect(() => Handlebars.compile(templateContent)).not.toThrow();
  });

  it('should generate valid TypeScript with sample data', () => {
    const sampleData = createSampleCDKStackData();
    const template = Handlebars.compile(templateContent);
    const result = template(sampleData);
    
    expect(result).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
    expect(result).toMatch(/const \w+CPUUtilizationWarningAlarm = new cloudwatch.Alarm/);
  });
});
```

**関連要件**: requirement.md FR-7.1, FR-7.3
**見積時間**: 8時間（テンプレート設計2h + 実装4h + テスト2h）
**必要スキル**: Handlebars.js、AWS CDK構文、テンプレート設計
**依存関係**: T-001（型定義のCDKStackData、CDKAlarmDefinitionが必要）
**担当者**: フロントエンド経験者（テンプレート得意）

**注意事項**:
- T-003（CDK Generator実装）と並列実行可能
- テンプレート変数名は型定義（T-001）と完全一致させること

---

### T-003: CDK Generator基本クラス実装

**概要**: RDS専用でAnalysisResultからCDKコードを生成する基本機能

**前提条件**:
- T-001が完了している（CDKStackData、CDKAlarmDefinition型が使用可能）
- 以下のファイル内容の詳細理解:
  - `src/core/analyzer.ts`のMetricsAnalyzer.analyze()メソッド出力形式
  - `src/types/metrics.ts`のExtendedAnalysisResult、ResourceWithMetrics構造
  - `src/config/metrics-definitions.ts`のRDS_METRICS（26個のメトリクス）
  - `src/utils/error.ts`のCloudSupporterError、createResourceError使用方法
- Handlebars.compile()、template()の使用方法を理解している

**実装内容**:
1. `src/generators/cdk.generator.ts`ファイル作成
2. `CDKGenerator`クラス本体実装（Constructor + 5つのprivateメソッド）
3. ExtendedAnalysisResult解析ロジック（RDS専用フィルタリング）
4. MetricDefinition→CDKAlarmDefinition変換ロジック
5. Handlebarsテンプレート読み込み・適用機能
6. 詳細なエラーハンドリング（入力検証、テンプレートエラー、変換エラー）

**完了条件**:
- [ ] `CDKGenerator`クラスが150行以上で実装されている
- [ ] `generate(analysisResult: ExtendedAnalysisResult, options: CDKOptions): Promise<string>`が動作
- [ ] RDSリソース（`AWS::RDS::DBInstance`）のみを処理対象とする
- [ ] 1つのRDSメトリクスに対してWarning + Criticalの2アラームを生成する
- [ ] 以下のCDKコード要素を含む出力を生成:
  - `import * as cdk from 'aws-cdk-lib'`
  - `export class CloudWatchAlarmsStack extends cdk.Stack`
  - `new cloudwatch.Alarm(this, '...', { ... })`
- [ ] 不正入力時に具体的なエラーメッセージでCloudSupporterErrorを投げる
- [ ] 単体テスト5個以上（正常系2、異常系2、エッジケース1以上）

**詳細実装要件**:
```typescript
// src/generators/cdk.generator.ts (必須実装メソッド)
export class CDKGenerator {
  constructor(private logger: ILogger) {}

  // メイン生成メソッド
  async generate(analysisResult: ExtendedAnalysisResult, options: CDKOptions): Promise<string>
  
  // 入力検証メソッド
  private validateInput(analysisResult: ExtendedAnalysisResult, options: CDKOptions): void
  
  // RDSリソースフィルタリング
  private filterRDSResources(resources: ResourceWithMetrics[]): ResourceWithMetrics[]
  
  // CDKデータ構造構築
  private buildCDKStackData(resources: ResourceWithMetrics[], options: CDKOptions): CDKStackData
  
  // アラーム定義作成
  private createAlarmDefinition(resource: ResourceWithMetrics, metric: MetricDefinition, severity: 'Warning' | 'Critical'): CDKAlarmDefinition
  
  // テンプレート読み込み・適用
  private async loadAndApplyTemplate(data: CDKStackData): Promise<string>
  
  // コード基本整形
  private formatCode(code: string): string
}
```

**RDS Dimension Mapping仕様**:
```typescript
// RDS専用のdimension mapping（requirement.md準拠）
private buildRDSDimensions(resource: ResourceWithMetrics): Record<string, string> {
  return {
    DBInstanceIdentifier: resource.logical_id
  };
}
```

**エラーハンドリング仕様**:
- 空のresources配列: "No resources found in analysis result"
- RDSリソースなし: "No AWS::RDS::DBInstance resources found for CDK generation"
- テンプレート読み込み失敗: "CDK template loading failed: [具体的なエラー]"
- Handlebarsコンパイル失敗: "Template compilation failed: [具体的なエラー]"

**必須テストケース**:
```typescript
describe('CDKGenerator RDS MVP', () => {
  // 正常系テスト
  it('should generate CDK code with RDS alarms', async () => {
    const analysisResult = createMockAnalysisResultWithRDS(2); // 2 RDS resources
    const result = await generator.generate(analysisResult, { enabled: true });
    
    // 期待される出力検証
    expect(result).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
    expect(result.match(/CPUUtilizationWarningAlarm/g)).toHaveLength(2);
    expect(result.match(/CPUUtilizationCriticalAlarm/g)).toHaveLength(2);
  });

  // 異常系テスト
  it('should handle empty analysis result', async () => {
    await expect(generator.generate({ resources: [], metadata: {} }, { enabled: true }))
      .rejects.toThrow(CloudSupporterError);
  });

  it('should handle analysis result without RDS', async () => {
    const analysisWithoutRDS = createMockAnalysisWithLambdaOnly();
    const result = await generator.generate(analysisWithoutRDS, { enabled: true });
    expect(result).toContain('// No alarms generated - no supported resources found');
  });

  // エッジケーステスト
  it('should handle RDS with zero metrics', async () => {
    const rdsWithNoMetrics = createMockRDSResourceWithNoMetrics();
    const result = await generator.generate(rdsWithNoMetrics, { enabled: true });
    expect(result).toContain('export class CloudWatchAlarmsStack');
    expect(result).not.toContain('new cloudwatch.Alarm');
  });
});
```

**関連要件**: requirement.md FR-1.1, FR-1.3, FR-5.3, NFR-2
**見積時間**: 16時間（設計3h + コア実装8h + エラーハンドリング3h + テスト2h）
**必要スキル**: TypeScript中上級、Handlebars.js、AWS CloudWatch、エラーハンドリング設計
**依存関係**: T-001（必須）、T-002（並列可能）
**担当者**: シニア開発者（Handlebars経験者）

---

### T-004: CLI統合（基本）

**概要**: 既存CLIに`--output cdk`オプションを追加し、CDK生成モードを実装

**前提条件**:
- T-001が完了している（CDKOptions型定義が使用可能）
- `src/cli/commands.ts`の既存実装を詳細理解している:
  - createCLICommand関数の構造（50行目付近）
  - CLIDependencies型の構造と使用方法
  - 既存のaction関数内での分析処理呼び出し（120行目付近）
  - 既存オプション定義の形式とパターン（50-70行目）
- Commander.jsライブラリのoption、action、argument使用方法を理解している

**実装内容**:
1. `src/cli/commands.ts`の既存option定義に4個のCDKオプション追加
2. 既存action関数内にCDK/標準モード分岐処理実装
3. `handleCDKGeneration`関数の新規実装
4. CDK用エラーハンドリング追加
5. ファイル出力制御ロジック実装

**完了条件**:
- [ ] 以下のCLIオプションが正しく追加され、`--help`で表示される:
  - `--cdk-output-dir <path>` (CDK files output directory)
  - `--cdk-stack-name <name>` (CDK Stack class name, default: CloudWatchAlarmsStack)
  - `--validate-cdk` (Validate generated CDK code compilation)
- [ ] `npm run dev template.yaml --output cdk`でCDK生成処理が呼ばれる（標準処理ではない）
- [ ] 既存の`npm run dev template.yaml --output json`が正常動作する（回帰テスト）
- [ ] CDK生成結果がstdoutに正しく出力される
- [ ] `--cdk-output-dir ./output`指定時に`./output/CloudWatchAlarmsStack.ts`ファイルが作成される
- [ ] CDK生成エラー時に具体的なエラーメッセージとexit code 1で終了

**具体的な実装要件**:
```typescript
// src/cli/commands.ts の修正点（行番号は概算）

// 1. option追加（既存optionの後、約70行目付近に追加）
.option('--cdk-output-dir <path>', 'CDK files output directory')
.option('--cdk-stack-name <name>', 'CDK Stack class name', 'CloudWatchAlarmsStack')  
.option('--validate-cdk', 'Validate generated CDK code compilation')

// 2. action関数の分岐実装（既存action内、約120行目付近を修正）
.action(async (templatePath: string, options: CLIOptions) => {
  try {
    // CDK mode check and routing
    if (options.output === 'cdk') {
      await handleCDKGeneration(templatePath, options, dependencies);
    } else {
      // 既存処理（変更なし）
      await executeStandardAnalysis(templatePath, options, dependencies);
    }
  } catch (error) {
    // 既存エラーハンドリング + CDK用エラー追加
  }
});

// 3. 新規CDK処理関数（ファイル末尾に追加）
async function handleCDKGeneration(
  templatePath: string,
  options: CLIOptions,
  dependencies: CLIDependencies
): Promise<void> {
  // 1. 既存analyzerでメトリクス分析実行
  const analysisResult = await dependencies.analyzer.analyze(templatePath, {
    // 既存のAnalysisOptionsを活用
  });

  // 2. CDK Generator呼び出し
  const cdkGenerator = new CDKGenerator(dependencies.logger);
  const cdkCode = await cdkGenerator.generate(analysisResult, {
    enabled: true,
    outputDir: options.cdkOutputDir,
    stackName: options.cdkStackName
  });

  // 3. 出力処理
  if (options.cdkOutputDir) {
    const filePath = path.join(options.cdkOutputDir, `${options.cdkStackName || 'CloudWatchAlarmsStack'}.ts`);
    await fs.writeFile(filePath, cdkCode, 'utf-8');
    console.log(`✅ CDK Stack generated: ${filePath}`);
  } else {
    console.log(cdkCode);
  }
}
```

**必須テストケース**:
```typescript
// tests/integration/cli-cdk-basic.test.ts
describe('CLI CDK Basic Integration', () => {
  it('should route to CDK generation when --output cdk is specified', async () => {
    const spy = jest.spyOn(CDKGenerator.prototype, 'generate');
    
    await runCLI(['examples/web-application-stack.yaml', '--output', 'cdk']);
    
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not affect standard JSON output mode', async () => {
    const result = await runCLI(['examples/web-application-stack.yaml', '--output', 'json']);
    
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toHaveProperty('resources');
  });

  it('should create file when output directory specified', async () => {
    const tempDir = await fs.mkdtemp('cdk-test-');
    
    await runCLI(['examples/web-application-stack.yaml', '--output', 'cdk', '--cdk-output-dir', tempDir]);
    
    const filePath = path.join(tempDir, 'CloudWatchAlarmsStack.ts');
    expect(await fs.access(filePath)).not.toThrow();
    
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
  });
});
```

**既存コード影響範囲**:
- 変更: `src/cli/commands.ts`のみ（約30行の追加）
- 影響なし: analyzer、generators、formatters（全て既存のまま）
- テスト追加: CLI統合テストのみ

**関連要件**: requirement.md FR-6.1, FR-6.2, FR-1.2, AC-2
**見積時間**: 12時間（既存コード解析3h + オプション追加2h + 分岐実装4h + ファイル出力2h + テスト1h）
**必要スキル**: TypeScript、Commander.js、CLI設計、ファイルI/O
**依存関係**: T-001（CDKOptions型）、T-003（CDKGeneratorクラス）
**担当者**: CLI開発経験者

**実装順序**:
- T-002（テンプレート）とT-003（Generator）完了後に開始
- テンプレートとGeneratorは並列開発可能

---

### T-005: MVP統合テスト・動作確認

**概要**: Phase 1の統合テストとE2E動作確認を実施してMVP完成を検証

**前提条件**:
- T-001, T-002, T-003, T-004が完了している
- 以下のテンプレートとその構造を理解している:
  - `examples/web-application-stack.yaml`の内容（RDS、Lambda、ALB等が含まれる）
  - 各テンプレートのResourcesセクション構造
- Jestテストフレームワークの統合テスト記述方法を理解している

**実装内容**:
1. `tests/integration/cdk-mvp.test.ts`作成
2. 実際のCloudFormationテンプレート使用のE2Eテスト実装
3. 生成CDKコードのTypeScriptコンパイル検証自動化
4. MVPパフォーマンス測定（10秒以内、200MB以内）
5. エラーケースの包括的テスト

**完了条件**:
- [ ] E2E統合テストスイートが実装されている（テストケース5個以上）
- [ ] 以下のコマンドが確実に成功する:
  ```bash
  npm run dev examples/web-application-stack.yaml --output cdk --resource-types "AWS::RDS::DBInstance"
  ```
- [ ] 生成されたCDKコードが以下の条件を満たす:
  - `npx tsc --noEmit --strict CloudWatchAlarmsStack.ts`でエラー0個
  - `export class CloudWatchAlarmsStack extends cdk.Stack`を含む
  - RDSメトリクス数×2個のアラーム定義を含む（約26×2=52個）
- [ ] MVPパフォーマンス要件をクリア:
  - 実行時間10秒以内
  - 最大メモリ使用量200MB以内
- [ ] エラーケースが適切に処理される（空テンプレート、RDSなしテンプレート等）

**必須テストシナリオ**:
```typescript
// tests/integration/cdk-mvp.test.ts
describe('CDK MVP Integration Tests', () => {
  // 正常系：基本機能
  it('should generate valid CDK Stack for RDS resources', async () => {
    const result = await runCLICommand([
      'examples/web-application-stack.yaml',
      '--output', 'cdk',
      '--resource-types', 'AWS::RDS::DBInstance'
    ]);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
    expect(result.stdout.match(/new cloudwatch\.Alarm/g)).toHaveLength(52); // 26メトリクス×2
  });

  // TypeScriptコンパイル検証
  it('should generate TypeScript code that compiles without errors', async () => {
    const cdkCode = await generateCDKForTemplate('examples/web-application-stack.yaml');
    
    await fs.writeFile('/tmp/test-stack.ts', cdkCode);
    const compileResult = await exec('npx tsc --noEmit --strict /tmp/test-stack.ts');
    
    expect(compileResult.exitCode).toBe(0);
  });

  // パフォーマンス検証
  it('should complete within 10 seconds for MVP scope', async () => {
    const startTime = Date.now();
    
    await runCLICommand([
      'examples/web-application-stack.yaml',
      '--output', 'cdk',
      '--resource-types', 'AWS::RDS::DBInstance'
    ]);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(10000);
  });

  // エラーハンドリング検証
  it('should handle template without RDS resources gracefully', async () => {
    const result = await runCLICommand([
      'examples/serverless-api-sam.yaml', // Lambda/API Gateway only
      '--output', 'cdk',
      '--resource-types', 'AWS::RDS::DBInstance'
    ]);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('export class CloudWatchAlarmsStack');
    expect(result.stdout).not.toContain('new cloudwatch.Alarm'); // No alarms for empty resource set
  });

  // 回帰テスト
  it('should not break existing JSON output mode', async () => {
    const result = await runCLICommand([
      'examples/web-application-stack.yaml',
      '--output', 'json'
    ]);
    
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty('resources');
    expect(parsed.resources.length).toBeGreaterThan(0);
  });
});
```

**Phase 1完了確認チェックリスト**:
```bash
# MVPとして動作することの確認項目
1. npm run dev examples/web-application-stack.yaml --output cdk --resource-types "AWS::RDS::DBInstance"
   → exit code 0, TypeScript CDK codeを出力

2. 生成されたコードのコンパイル確認
   → npx tsc --noEmit --strict で エラー0個

3. パフォーマンス確認
   → time コマンドで10秒以内、メモリ200MB以内

4. 回帰テスト確認
   → npm run dev examples/web-application-stack.yaml --output json が正常動作

5. 全テスト成功確認
   → npm test で全テスト成功（既存+新規）
```

**関連要件**: requirement.md AC-1, AC-2, AC-4, NFR-4
**見積時間**: 10時間（E2Eテスト設計3h + 実装4h + パフォーマンス測定2h + デバッグ1h）
**必要スキル**: E2E・統合テスト設計、Jest、パフォーマンス測定、TypeScript
**依存関係**: T-001, T-002, T-003, T-004完了
**担当者**: QAエンジニア or テストリード

**Phase 1成功基準**:
このタスク完了により、requirement.mdのAC-1「基本機能」が達成される

---

## Phase 2: 全機能実装（3週間）

### T-006: 残り5リソースタイプ対応

**概要**: Lambda、ECS、ALB、DynamoDB、API Gatewayリソースのアラーム生成対応

**前提条件**:
- T-005（Phase 1）が完了している
- 以下のファイル内容を詳細理解している:
  - `src/config/metrics-definitions.ts`の各リソース用メトリクス配列:
    - LAMBDA_METRICS（18個）、ECS_METRICS（17個）
    - ALB_METRICS（20個）、DYNAMODB_METRICS（22個）、API_GATEWAY_METRICS（14個）
  - 各AWSサービスのCloudWatch Dimensionsの正式仕様:
    - Lambda: FunctionName
    - ECS: ServiceName, ClusterName  
    - ALB: LoadBalancer
    - DynamoDB: TableName
    - API Gateway: ApiName, Stage

**実装内容**:
1. `src/generators/cdk.generator.ts`の拡張（5リソースタイプ追加）
2. リソースタイプ別dimension mapping実装
3. `src/templates/cdk-stack-mvp.hbs`の拡張（全リソース対応）
4. 各リソースタイプの単体テスト追加（5ファイル）
5. 統計情報とメトリクス計算の実装

**完了条件**:
- [ ] 以下の6リソースタイプ全てでCDKアラーム生成が動作する:
  - AWS::RDS::DBInstance（既存）、AWS::Lambda::Function、AWS::ECS::Service
  - AWS::ElasticLoadBalancingV2::LoadBalancer、AWS::DynamoDB::Table、AWS::ApiGateway::RestApi
- [ ] 各リソースタイプで正しいCloudWatch dimensionsが設定される（AWS公式仕様準拠）
- [ ] 全リソースタイプの単体テストが通る（6個のテストファイル）
- [ ] `examples/web-application-stack.yaml`全体（全リソースタイプ）でCDK生成成功
- [ ] 生成されるアラーム総数が期待値と±5%以内で一致する
- [ ] リソース数50個以下の範囲で20秒以内にCDK生成完了

**リソース別dimension mapping実装要件**:
```typescript
// src/generators/cdk.generator.ts 内に追加実装
private buildDimensionsForResourceType(
  resourceType: string, 
  logicalId: string
): Record<string, string> {
  const dimensionMap: Record<string, Record<string, string>> = {
    'AWS::RDS::DBInstance': { DBInstanceIdentifier: logicalId },
    'AWS::Lambda::Function': { FunctionName: logicalId },
    'AWS::ECS::Service': { 
      ServiceName: logicalId,
      ClusterName: 'default' // ECS requirement, can be customized later
    },
    'AWS::ElasticLoadBalancingV2::LoadBalancer': { LoadBalancer: logicalId },
    'AWS::DynamoDB::Table': { TableName: logicalId },
    'AWS::ApiGateway::RestApi': { ApiName: logicalId }
  };
  
  return dimensionMap[resourceType] || { ResourceId: logicalId };
}
```

**リソース拡張実装手順**:
1. `filterRDSResources` → `filterSupportedResources`に拡張
2. dimension mapping関数を上記仕様で実装
3. テンプレートでdimension表示を一般化
4. 各リソースタイプでの単体テスト作成
5. 統合テストで全リソース検証

**必須テストケース（各リソースタイプごと）**:
```typescript
// tests/unit/cdk/resource-types.test.ts
describe('All Resource Types CDK Generation', () => {
  const resourceTypes = [
    'AWS::RDS::DBInstance',
    'AWS::Lambda::Function', 
    'AWS::ECS::Service',
    'AWS::ElasticLoadBalancingV2::LoadBalancer',
    'AWS::DynamoDB::Table',
    'AWS::ApiGateway::RestApi'
  ];

  test.each(resourceTypes)('should generate alarms for %s', async (resourceType) => {
    const mockAnalysis = createMockAnalysisWithResource(resourceType);
    const result = await generator.generate(mockAnalysis, { enabled: true });
    
    expect(result).toContain('export class CloudWatchAlarmsStack');
    expect(result).toMatch(new RegExp(`${resourceType.split('::')[2]}.*Alarm`));
  });
});
```

**関連要件**: requirement.md FR-1.1, AC-1, NFR-1
**見積時間**: 32時間（分析4h + 各リソース実装4h×5 + 統合2h + テスト6h）
**必要スキル**: TypeScript上級、AWS CloudWatch、6つのAWSサービス深い知識
**依存関係**: T-005（MVP）完了
**担当者**: AWS認定保持者 or AWSサービス経験豊富な開発者

**リスク軽減**:
- リソースタイプごとに段階的実装（1つずつ追加・テスト）
- 既存RDS実装パターンを他リソースにコピー・修正する手法

---

### T-007: SNS統合機能実装

**概要**: CDKアラームにSNS通知機能を統合し、通知システムを完成

**前提条件**:
- T-006が完了している
- AWS SNS、CloudWatch Actions、CDK SNS Topicの理解
- requirement.mdのFR-2.3（SNS統合要件）を理解している

**実装内容**:
1. `src/types/cdk-mvp.ts`にSNS関連型定義追加
2. SNS Topic生成機能実装（新規作成 vs 既存ARN使用）
3. 全アラームへのSNS Action自動追加機能
4. CLI オプション追加（`--cdk-enable-sns`, `--cdk-sns-topic-arn`）
5. SNS ARN検証機能実装（AWS ARN仕様準拠）

**完了条件**:
- [ ] `--cdk-enable-sns`オプションで新SNS Topic生成機能が動作
- [ ] `--cdk-sns-topic-arn <arn>`オプションで既存Topic使用機能が動作
- [ ] 生成されるCDKコードが以下のSNS要素を含む:
  - `import * as sns from 'aws-cdk-lib/aws-sns'`
  - `import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions'`
  - SNS Topic定義（新規 or 既存import）
  - 全アラームに`alarm.addAlarmAction(new SnsAction(topic))`
- [ ] 不正なSNS ARN形式（`arn:aws:sns:invalid-format`等）でCloudSupporterErrorが発生
- [ ] SNS機能のunit test（5個以上）とintegration testが通る

**SNS Topic生成実装要件**:
```typescript
// CDKOptions拡張（src/types/cdk-mvp.ts）
export interface CDKOptions {
  // ... 既存プロパティ
  enableSNS?: boolean;        // --cdk-enable-sns
  snsTopicArn?: string;      // --cdk-sns-topic-arn
}

// Template data拡張（src/types/cdk-mvp.ts）  
export interface CDKStackData {
  // ... 既存プロパティ
  snsTopicDefinition?: {
    variableName: string;     // "alarmTopic"
    isExisting: boolean;      // true for ARN import, false for new topic
    topicArn?: string;        // for existing topic
    topicName?: string;       // for new topic
  };
}

// Generator拡張（src/generators/cdk.generator.ts）
private buildSNSTopicConfig(options: CDKOptions): CDKStackData['snsTopicDefinition'] {
  if (options.snsTopicArn) {
    return {
      variableName: 'alarmTopic',
      isExisting: true,
      topicArn: options.snsTopicArn
    };
  } else if (options.enableSNS) {
    return {
      variableName: 'alarmTopic', 
      isExisting: false,
      topicName: 'CloudWatchAlarmNotifications'
    };
  }
  return undefined;
}
```

**テンプレート拡張要件**:
```handlebars
{{!-- src/templates/cdk-stack-mvp.hbs 拡張 --}}
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
{{#if snsTopicDefinition}}
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
{{/if}}
import { Construct } from 'constructs';

export class {{stackClassName}} extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    {{#if snsTopicDefinition}}
    // SNS Topic for alarm notifications
    const {{snsTopicDefinition.variableName}} = {{#if snsTopicDefinition.isExisting}}sns.Topic.fromTopicArn(
      this,
      'AlarmNotificationTopic',
      '{{snsTopicDefinition.topicArn}}'
    );{{else}}new sns.Topic(this, 'AlarmNotificationTopic', {
      topicName: '{{snsTopicDefinition.topicName}}',
      displayName: 'CloudWatch Alarm Notifications'
    });{{/if}}
    {{/if}}

    {{#each alarms}}
    const {{constructId}} = new cloudwatch.Alarm(this, '{{constructId}}', {
      // ... existing alarm properties
    });

    {{#if ../snsTopicDefinition}}
    {{constructId}}.addAlarmAction(new cloudwatchActions.SnsAction({{../snsTopicDefinition.variableName}}));
    {{/if}}
    {{/each}}
  }
}
```

**関連要件**: requirement.md FR-2.3, FR-4.2, AC-2
**見積時間**: 14時間（SNS設計2h + CLI統合3h + Template拡張4h + ARN検証2h + テスト3h）
**必要スキル**: AWS SNS、CDK Actions、ARN仕様、Handlebars条件分岐
**依存関係**: T-006完了
**担当者**: AWS SNS経験者

---

### T-008: MVP to Full機能統合テスト

**概要**: Phase 2完成版（全リソース+SNS）の包括的な統合テスト実施

**前提条件**:
- T-006, T-007が完了している
- 複数のexamplesテンプレートの内容と特徴を理解している
- パフォーマンス測定とプロファイリング手法を理解している

**実装内容**:
1. 全機能統合E2Eテスト実装（6リソース+SNS）
2. 複数テンプレート使用テスト（3個以上のexampleテンプレート）
3. Phase 2パフォーマンス測定（30秒以内、512MB以内）
4. 回帰テスト強化（既存機能への影響確認）
5. エッジケースとエラー条件の包括的テスト

**完了条件**:
- [ ] 6リソースタイプ全てで正常にCDKアラーム生成される
- [ ] 以下のテンプレートでエラーなしで実行成功:
  - `examples/web-application-stack.yaml`（10+リソース）
  - `examples/serverless-api-sam.yaml`（Lambda、API Gateway、DynamoDB）
  - `examples/container-microservices-ecs.yaml`（ECS、ALB）
- [ ] SNS統合が正常動作する（新規Topic作成、既存Topic使用両方）
- [ ] Phase 2パフォーマンス要件達成:
  - 50リソース規模で20秒以内
  - 最大メモリ使用量400MB以内
- [ ] 既存機能への影響が±10%以内（回帰テスト）
- [ ] requirement.md AC-1, AC-2の受け入れ基準をクリア

**Phase 2統合テスト要件**:
```typescript
// tests/integration/cdk-full-features.test.ts
describe('CDK Full Features Integration', () => {
  const testTemplates = [
    { path: 'examples/web-application-stack.yaml', expectedResources: ['RDS', 'Lambda', 'ALB'] },
    { path: 'examples/serverless-api-sam.yaml', expectedResources: ['Lambda', 'DynamoDB', 'ApiGateway'] },
    { path: 'examples/container-microservices-ecs.yaml', expectedResources: ['ECS', 'ALB'] }
  ];

  test.each(testTemplates)('should handle $path with all resource types', async ({ path, expectedResources }) => {
    const result = await runCLICommand([path, '--output', 'cdk']);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('export class CloudWatchAlarmsStack');
    
    // Each expected resource type should have alarms
    for (const resourceType of expectedResources) {
      expect(result.stdout).toMatch(new RegExp(`// .*${resourceType}`));
    }
  });

  it('should work with SNS integration', async () => {
    const result = await runCLICommand([
      'examples/web-application-stack.yaml',
      '--output', 'cdk',
      '--cdk-enable-sns'
    ]);
    
    expect(result.stdout).toContain('import * as sns from');
    expect(result.stdout).toContain('new sns.Topic(');
    expect(result.stdout).toMatch(/\.addAlarmAction\(new cloudwatchActions\.SnsAction\(/);
  });

  it('should meet Phase 2 performance requirements', async () => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    await runCLICommand(['examples/web-application-stack.yaml', '--output', 'cdk']);
    
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage().heapUsed;
    const memoryUsedMB = (endMemory - startMemory) / (1024 * 1024);
    
    expect(duration).toBeLessThan(20000); // 20 seconds
    expect(memoryUsedMB).toBeLessThan(400); // 400MB
  });
});
```

**関連要件**: requirement.md AC-1, AC-2, AC-4, NFR-1
**見積時間**: 12時間（統合テスト設計4h + 実装6h + パフォーマンス測定2h）
**必要スキル**: 統合テスト設計、Jest、パフォーマンス測定、TypeScript
**依存関係**: T-006, T-007完了
**担当者**: QAリード or 統合テスト経験者

---

## Phase 3: 品質・性能向上（2-4週間）

### T-009: セキュリティ機能実装

**概要**: 機密情報サニタイズと入力検証機能の実装

**前提条件**:
- T-008（Phase 2）が完了している
- セキュリティベストプラクティス（OWASP等）を理解している
- 以下のセキュリティ脆弱性と対策を理解している:
  - Path Traversal攻撃（`../../../etc/passwd`）
  - 機密情報漏洩（パスワード、API Key等のCloudFormation Property）
  - 入力検証不備によるコード実行

**実装内容**:
1. `src/security/`ディレクトリ作成
2. `sanitizer.ts`実装（機密情報パターンマッチング・置換）
3. `input-validator.ts`実装（path validation、ARN validation）
4. CDK Generator統合（サニタイズ処理追加）
5. ファイル出力時のUnix権限設定（chmod 600）
6. セキュリティテスト専用スイート作成

**完了条件**:
- [ ] 以下の機密情報パターンが自動サニタイズされる:
  - CloudFormation Properties: Password, Secret, Key, Token, Credential
  - AWS情報: Account ID（arn:aws:iam::123456789012:）、Access Key（AKIA...）
  - API Keys: sk_live_..., pk_live_... 等
- [ ] ディレクトリトラバーサル攻撃が確実に防止される:
  - `../../../etc/passwd`、`..\\..\\windows\\system32`等でエラー
  - `~/.ssh/id_rsa`等でエラー
- [ ] 生成CDKファイルの権限がUnix系で600（owner read/write only）
- [ ] 不正ARN形式（SNS以外、形式不正等）で適切なCloudSupporterErrorが発生
- [ ] セキュリティテストスイート（10個以上のテストケース）が全成功

**セキュリティ実装要件**:
```typescript
// src/security/sanitizer.ts
export class CDKSecuritySanitizer {
  private static readonly SENSITIVE_PATTERNS = [
    // Property name patterns
    /password/i, /secret/i, /key/i, /token/i, /credential/i,
    
    // AWS-specific patterns  
    /arn:aws:iam::\d{12}:/,          // AWS Account ID in ARN
    /AKIA[0-9A-Z]{16}/,              // AWS Access Key ID
    /[A-Za-z0-9/+=]{40}/,            // AWS Secret Access Key (potential)
    
    // API Key patterns
    /sk_live_[a-zA-Z0-9]{24}/,       // Stripe secret key
    /pk_live_[a-zA-Z0-9]{24}/,       // Stripe public key
    /AIza[0-9A-Za-z\\-_]{35}/        // Google API key
  ];

  static sanitizeForCDK(properties: Record<string, unknown>): Record<string, unknown> {
    // Recursive sanitization implementation
  }
  
  static isSensitiveValue(key: string, value: string): boolean {
    // Pattern matching implementation
  }
}

// src/security/input-validator.ts  
export class CDKInputValidator {
  static validateOutputPath(filePath: string): void {
    // Path traversal prevention
    if (filePath.includes('..') || filePath.includes('~') || /^\/[^\/]/.test(filePath)) {
      throw new CloudSupporterError(ErrorType.SECURITY_ERROR, `Invalid file path: ${filePath}`);
    }
  }

  static validateSNSArn(arn: string): void {
    const validSNSPattern = /^arn:aws:sns:[a-z0-9-]+:\d{12}:[A-Za-z0-9_-]+$/;
    if (!validSNSPattern.test(arn)) {
      throw new CloudSupporterError(ErrorType.VALIDATION_ERROR, `Invalid SNS ARN: ${arn}`);
    }
  }
}
```

**必須セキュリティテスト**:
```typescript
// tests/security/cdk-security.test.ts
describe('CDK Security Features', () => {
  describe('Sensitive Data Sanitization', () => {
    it('should sanitize CloudFormation passwords', () => {
      const input = {
        DatabasePassword: 'secret123',
        ApiKeyValue: 'sk_live_abcdef123456789',
        NormalProperty: 'safe_value'
      };
      
      const result = CDKSecuritySanitizer.sanitizeForCDK(input);
      
      expect(result.DatabasePassword).toBe('/* [REDACTED: DatabasePassword] */');
      expect(result.ApiKeyValue).toBe('/* [REDACTED: ApiKeyValue] */');
      expect(result.NormalProperty).toBe('safe_value');
    });

    it('should sanitize AWS Account IDs in ARNs', () => {
      const input = { RoleArn: 'arn:aws:iam::123456789012:role/MyRole' };
      const result = CDKSecuritySanitizer.sanitizeForCDK(input);
      expect(result.RoleArn).toBe('/* [REDACTED: RoleArn] */');
    });
  });

  describe('Input Validation', () => {
    it('should prevent directory traversal attacks', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        '~/.ssh/id_rsa',
        '/etc/shadow'
      ];
      
      for (const path of maliciousPaths) {
        expect(() => CDKInputValidator.validateOutputPath(path))
          .toThrow('Invalid file path');
      }
    });

    it('should validate SNS ARN format correctly', () => {
      const validARN = 'arn:aws:sns:us-east-1:123456789012:MyTopic';
      const invalidARNs = [
        'arn:aws:s3:::mybucket',  // Not SNS
        'arn:aws:sns:invalid',    // Invalid format
        'not-an-arn-at-all'      // Not ARN
      ];
      
      expect(() => CDKInputValidator.validateSNSArn(validARN)).not.toThrow();
      
      for (const invalidArn of invalidARNs) {
        expect(() => CDKInputValidator.validateSNSArn(invalidArn))
          .toThrow('Invalid SNS ARN');
      }
    });
  });
});
```

**関連要件**: requirement.md FR-4.1, FR-4.2, AC-5
**見積時間**: 18時間（セキュリティ設計4h + サニタイザー実装6h + バリデーター実装4h + テスト4h）
**必要スキル**: セキュリティエンジニアリング、正規表現、AWS ARN仕様、OWASP知識
**依存関係**: T-008完了
**担当者**: セキュリティ経験者 or セキュアコーディング経験者

---

### T-010: TypeScript検証・品質向上

**概要**: 生成CDKコードのTypeScript検証とコード品質向上機能

**前提条件**:
- T-009が完了している
- TypeScript Compiler APIの使用方法を理解している
- CDKプロジェクトのbest practicesを理解している

**実装内容**:
1. `src/validation/cdk-validator.ts`実装
2. TypeScript Compiler API統合
3. CDK best practices自動チェック機能
4. AWS制限チェック機能（CloudWatch 5000アラーム制限等）
5. `--validate-cdk`オプションの完全実装

**完了条件**:
- [ ] `--validate-cdk`オプション実行時にTypeScriptコンパイル検証が動作
- [ ] コンパイルエラー発生時に行番号、列番号、エラー内容を表示
- [ ] CDK best practicesチェックが動作:
  - Construct ID重複チェック
  - 未使用import検出
  - 不正なprops使用検出
- [ ] AWS制限チェックが動作:
  - アラーム数5000個制限警告
  - SNS Topic数制限警告
- [ ] 検証結果レポート機能が実装されている
- [ ] 検証機能の単体テスト（8個以上）が通る

**関連要件**: requirement.md FR-5.1, FR-6.3, NFR-2, AC-3
**見積時間**: 16時間（Compiler API学習3h + 検証実装8h + best practices実装3h + テスト2h）
**必要スキル**: TypeScript Compiler API、Static Analysis、CDK best practices、Jest
**依存関係**: T-009完了
**担当者**: TypeScript熟練者

---

### T-011: パフォーマンス最適化・最終調整

**概要**: 本番品質のためのパフォーマンス最適化と最終品質調整

**前提条件**:
- T-010が完了している
- Node.jsのメモリ管理（heap、GC）を理解している
- 並列処理設計パターン（Promise.all、async/await、semaphore）を理解している
- プロファイリングツール（V8 profiler、clinic.js等）の使用経験がある

**実装内容**:
1. `src/performance/memory-monitor.ts`実装（メモリ監視・制限）
2. `src/performance/parallel-processor.ts`実装（並列処理最適化）
3. CDK Generatorの並列処理統合
4. ガベージコレクション制御・メモリリーク対策
5. 大規模テンプレート対応の最適化

**完了条件**:
- [ ] requirement.md NFR-1のパフォーマンス要件を完全達成:
  - 500リソース未満テンプレートで30秒以内完了
  - 最大メモリ使用量512MB以下維持
  - 最大10並列処理サポート
- [ ] 以下のパフォーマンス機能が動作:
  - メモリ使用量リアルタイム監視（50ms間隔）
  - 512MB制限超過時の自動エラー
  - 並列処理による処理時間短縮（sequential比20%以上改善）
- [ ] 大規模テンプレートテスト（100リソース）で要件内動作
- [ ] メモリリーク検証テスト（連続実行10回でメモリ使用量が線形増加しない）
- [ ] パフォーマンステスト（8個以上）が全成功

**メモリ監視実装要件**:
```typescript
// src/performance/memory-monitor.ts
export class CDKMemoryMonitor {
  private readonly maxMemoryMB: number;
  private monitoringInterval: NodeJS.Timer | null = null;
  private memoryCheckpoints: Array<{ phase: string; heapUsedMB: number; timestamp: number }> = [];

  constructor(maxMemoryBytes: number = 512 * 1024 * 1024) {
    this.maxMemoryMB = maxMemoryBytes / (1024 * 1024);
  }

  startMonitoring(onLimitExceeded: (usageMB: number) => void): void {
    this.monitoringInterval = setInterval(() => {
      const usage = process.memoryUsage();
      const heapUsedMB = usage.heapUsed / (1024 * 1024);
      
      // Warning at 90% of limit
      if (heapUsedMB > this.maxMemoryMB * 0.9) {
        console.warn(`High memory usage: ${heapUsedMB.toFixed(1)}MB / ${this.maxMemoryMB}MB`);
        if (global.gc) global.gc();
      }
      
      // Error at limit exceeded
      if (heapUsedMB > this.maxMemoryMB) {
        onLimitExceeded(heapUsedMB);
      }
    }, 50);
  }

  recordCheckpoint(phase: string): void {
    const usage = process.memoryUsage().heapUsed / (1024 * 1024);
    this.memoryCheckpoints.push({
      phase,
      heapUsedMB: usage,
      timestamp: Date.now()
    });
  }
}

// src/performance/parallel-processor.ts
export class CDKParallelProcessor {
  async processResourcesInParallel<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    maxConcurrency: number = 10
  ): Promise<R[]> {
    const semaphore = new CDKSemaphore(maxConcurrency);
    
    const tasks = items.map(async (item) => {
      await semaphore.acquire();
      try {
        return await processor(item);
      } finally {
        semaphore.release();
      }
    });
    
    return Promise.all(tasks);
  }
}
```

**必須パフォーマンステスト**:
```typescript
// tests/performance/cdk-performance.test.ts
describe('CDK Performance Optimization', () => {
  it('should complete within 30 seconds for 500 resources', async () => {
    const largeTemplate = generateMockTemplate(500);
    const startTime = Date.now();
    
    const result = await runCDKGeneration(largeTemplate, { performanceMode: true });
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(30000);
    expect(result.success).toBe(true);
  });

  it('should maintain memory under 512MB for large templates', async () => {
    const memoryMonitor = new CDKMemoryMonitor();
    let maxMemoryExceeded = false;
    
    memoryMonitor.startMonitoring((usageMB) => {
      maxMemoryExceeded = true;
    });
    
    await runCDKGeneration(generateMockTemplate(300));
    
    expect(maxMemoryExceeded).toBe(false);
  });
  
  it('should improve performance with parallel processing', async () => {
    const template = generateMockTemplate(100);
    
    // Sequential processing
    const sequentialStart = Date.now();
    await runCDKGeneration(template, { parallel: false });
    const sequentialTime = Date.now() - sequentialStart;
    
    // Parallel processing  
    const parallelStart = Date.now();
    await runCDKGeneration(template, { parallel: true, maxConcurrency: 10 });
    const parallelTime = Date.now() - parallelStart;
    
    // Parallel should be at least 20% faster
    expect(parallelTime).toBeLessThan(sequentialTime * 0.8);
  });
});
```

**関連要件**: requirement.md NFR-1, AC-4
**見積時間**: 20時間（メモリ監視6h + 並列処理8h + 統合4h + テスト2h）
**必要スキル**: Node.jsメモリ管理、非同期・並列処理、パフォーマンスチューニング
**依存関係**: T-010完了
**担当者**: パフォーマンス最適化経験者

---

### T-012: 最終E2E・受け入れテスト

**概要**: 全機能完成版の包括的な受け入れテストと品質保証

**前提条件**:
- T-011が完了している（全機能実装完了）
- requirement.mdの受け入れ基準（AC-1〜AC-5）を詳細理解している
- E2Eテスト設計とパフォーマンステストの経験がある

**実装内容**:
1. `tests/acceptance/cdk-acceptance.test.ts`作成（受け入れテスト）
2. requirement.md全受け入れ基準（AC-1〜AC-5）の自動テスト
3. パフォーマンス要件（30秒/512MB）の最終検証
4. セキュリティ要件の最終検証
5. 品質要件（型エラー0、ESLint合格）の最終検証

**完了条件**:
- [ ] requirement.md の全受け入れ基準が自動テストでクリア:
  - AC-1: 基本機能（6リソースタイプ、コンパイル成功、アラーム数一致）
  - AC-2: CLI統合（全CLIオプション動作、フィルタリング動作）
  - AC-3: 出力品質（ESLint合格、import文正確、JSDoc完備、ID一意性）
  - AC-4: 性能（30秒以内、512MB以下、既存機能影響±10%以内）
  - AC-5: セキュリティ（機密情報除外、権限600、攻撃防止）
- [ ] 本番環境想定テストが全成功:
  - 100リソース規模テンプレートで25秒以内完了
  - 連続実行10回でメモリリークなし
  - 5つの実際のCloudFormationテンプレートでエラーなし
- [ ] 回帰テスト完全成功（既存機能への影響測定）
- [ ] 品質メトリクス達成:
  - TypeScript strict mode: エラー0個
  - ESLint: エラー0個
  - Jest test coverage: 90%以上
  - コード重複率: 10%以下

**包括的受け入れテスト**:
```typescript
// tests/acceptance/cdk-acceptance.test.ts
describe('CDK Acceptance Tests - Requirement.md AC-1~AC-5', () => {
  describe('AC-1: Basic Functionality', () => {
    it('should generate CDK code from examples/web-application-stack.yaml', async () => {
      const result = await runCLI(['examples/web-application-stack.yaml', '--output', 'cdk']);
      expect(result.exitCode).toBe(0);
      // AC-1 specific validation
    });
    
    it('should compile without TypeScript errors', async () => {
      const cdkCode = await generateCDK('examples/web-application-stack.yaml');
      const compileResult = await compileTypeScript(cdkCode);
      expect(compileResult.errors).toHaveLength(0);
    });
  });

  describe('AC-4: Performance Requirements', () => {
    it('should complete within 30 seconds for 100+ resource template', async () => {
      const startTime = Date.now();
      await generateCDK('examples/large-template.yaml'); // 100+ resources
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000);
    });
  });

  describe('AC-5: Security Requirements', () => {
    it('should exclude sensitive CloudFormation properties', async () => {
      const templateWithSecrets = createTemplateWithSensitiveData();
      const cdkCode = await generateCDK(templateWithSecrets);
      expect(cdkCode).not.toContain('secret123');
      expect(cdkCode).toContain('[REDACTED]');
    });
  });
});
```

**最終品質チェック自動化**:
```bash
# tests/acceptance/quality-check.sh
#!/bin/bash
echo "=== Final Quality Assurance Check ==="

echo "1. TypeScript compilation check..."
npx tsc --noEmit --strict

echo "2. ESLint check..." 
npx eslint src/ --ext .ts

echo "3. Test coverage check..."
npm run test:coverage
coverage_percent=$(grep -o '[0-9]\+\.[0-9]\+%' coverage/lcov-report/index.html | head -1)
if (( $(echo "$coverage_percent < 90" | bc -l) )); then
  echo "ERROR: Test coverage $coverage_percent is below 90%"
  exit 1
fi

echo "4. Performance benchmark..."
time npm run dev examples/web-application-stack.yaml --output cdk

echo "5. Security scan..."
npm audit --audit-level high

echo "✅ All quality checks passed"
```

**関連要件**: requirement.md AC-1〜AC-5全て
**見積時間**: 14時間（受け入れテスト設計4h + 実装6h + 品質チェック2h + 最終調整2h）
**必要スキル**: E2E・受け入れテスト設計、品質保証、パフォーマンステスト
**依存関係**: T-011完了（全機能完成）
**担当者**: QAリード + プロダクトオーナー

**Phase 3成功基準**:
このタスク完了により、requirement.mdの全要件（FR-1〜FR-7、NFR-1〜NFR-4、AC-1〜AC-5）が達成される

---

### T-013: ドキュメント整備・リリース準備

**概要**: 利用者向けドキュメント整備とリリース準備

**前提条件**:
- T-012が完了している（全機能・品質要件達成済み）
- Technical Writing経験がある
- CDK機能の全てを実際に使用・理解している

**実装内容**:
1. README.mdへのCDK機能説明追加
2. 使用例・CLIオプション説明の詳細化
3. トラブルシューティングガイド作成
4. API documentationの生成・整備
5. リリースノート作成

**完了条件**:
- [ ] README.mdにCDK機能の包括的な説明が追加されている:
  - 基本的な使用例（5個以上）
  - 全CLIオプションの説明
  - SNS統合方法
  - トラブルシューティングガイド
- [ ] 各CLIオプションの説明が完備されている（13個のCDKオプション）
- [ ] エラーメッセージと対処法ガイドが作成されている
- [ ] 実際のユーザーによるドキュメントレビュー完了
- [ ] API Documentationが生成され、GitHub Pagesで公開準備完了

**ドキュメント構成要件**:
```markdown
## CDK Code Generation (NEW!)

### Basic Usage
```bash
# Generate CDK alarms for all supported resources
npm run dev examples/web-application-stack.yaml --output cdk

# Generate for specific resource types
npm run dev template.yaml --output cdk --resource-types "AWS::RDS::DBInstance,AWS::Lambda::Function"

# Save to file
npm run dev template.yaml --output cdk --cdk-output-dir ./cdk-output

# With SNS notifications
npm run dev template.yaml --output cdk --cdk-enable-sns
```

### Advanced Features
- Custom stack naming: `--cdk-stack-name MyCustomStack`
- SNS integration: `--cdk-enable-sns` or `--cdk-sns-topic-arn <arn>`
- Code validation: `--validate-cdk`
- Performance mode: `--performance-mode`

### Troubleshooting
- Error: "No CDK code generated" → Check resource types with `--resource-types`
- Error: "Memory limit exceeded" → Use `--resource-types` filtering
- Error: "TypeScript compilation failed" → Use `--validate-cdk` for details
```

**関連要件**: requirement.md FR-7.3
**見積時間**: 8時間（ドキュメント設計2h + 執筆4h + レビュー・修正2h）
**必要スキル**: Technical Writing、Markdown、CDK機能理解
**依存関係**: T-012完了（全機能完成）
**担当者**: Technical Writer or ドキュメント担当者

---

## 修正されたタスク依存関係図

```
T-000 (環境準備) [2h]
   │
   └─→ T-001 (型定義) [6h]
          │
          ├─→ T-002 (テンプレート) [8h] ──┐
          │                              │
          └─→ T-003 (CDK Generator) [16h] ─┼─→ T-004 (CLI統合) [12h]
                                          │        │
                                          └────────┴─→ T-005 (MVP統合テスト) [10h]
                                                          │
                                                          └─→ T-006 (全リソース対応) [32h]
                                                                 │
                                                                 └─→ T-007 (SNS統合) [14h]
                                                                        │
                                                                        └─→ T-008 (Phase2統合テスト) [12h]
                                                                               │
                                                                               └─→ T-009 (セキュリティ) [18h]
                                                                                      │
                                                                                      └─→ T-010 (TypeScript検証) [16h]
                                                                                             │
                                                                                             └─→ T-011 (パフォーマンス) [20h]
                                                                                                    │
                                                                                                    └─→ T-012 (最終テスト) [14h]
                                                                                                           │
                                                                                                           └─→ T-013 (ドキュメント) [8h]
```

## 実装スケジュール概要（現実的見積もり）

| Week | Phase | Tasks | 主な成果物 | 累積工数 |
|------|-------|-------|-----------|----------|
| 1 | Phase 0+1 | T-000, T-001, T-002, T-003 | 環境準備、基本機能 | 32h |
| 2 | Phase 1 | T-004, T-005 | CLI統合、MVP完成 | 54h |
| 3-4 | Phase 2 | T-006, T-007 | 全リソース + SNS | 100h |
| 5 | Phase 2 | T-008 | Phase 2統合テスト | 112h |
| 6-7 | Phase 3 | T-009, T-010 | セキュリティ + 検証 | 146h |
| 8-9 | Phase 3 | T-011, T-012 | パフォーマンス + 最終テスト | 180h |
| 10 | 完成 | T-013 | ドキュメント、リリース | 188h |

**合計見積もり**: 188時間（約10週間、1人フルタイム想定）

## 並列実行可能なタスク

- **Week 1**: T-002（テンプレート）と T-003（CDK Generator）は並列実行可能
- **Week 6-7**: T-009（セキュリティ）とT-010（TypeScript検証）は部分的並列実行可能
- **各フェーズ**: 単体テスト作成は実装と並列実行可能

## 品質保証・レビュープロセス

### 各タスクの品質基準
1. **実装品質**: CLAUDE.md準拠（Zero type errors, No any types, Build success）
2. **テストカバレッジ**: 単体テスト80%以上、統合テスト100%実行成功
3. **コードレビュー**: 他の開発者による必須レビュー
4. **要件準拠**: requirement.mdの関連要件への完全準拠確認

### 完了判定プロセス
1. **実装者セルフチェック**: 完了条件の全項目確認
2. **コードレビューア承認**: 品質・設計・テストの確認
3. **QAテスト実行**: 統合テスト・E2Eテストの実行確認
4. **プロダクトオーナー受け入れ確認**: 要件達成度の最終確認

### マイルストーン
- **MVP Milestone (Week 2)**: Phase 1完了、RDS単体でCDK生成動作
- **Feature Complete Milestone (Week 5)**: Phase 2完了、全機能実装
- **Production Ready Milestone (Week 9)**: Phase 3完了、本番品質達成
- **Release Milestone (Week 10)**: ドキュメント整備完了、リリース準備完了

---

## クイック参照ガイド

### タスク一覧概要
| Task | 概要 | 工数 | 重要度 | スキル要件 |
|------|------|------|--------|------------|
| T-000 | 環境準備・セットアップ | 2h | ★★★ | 基本 |
| T-001 | 型定義実装 | 6h | ★★★ | TypeScript |
| T-002 | Handlebarsテンプレート作成 | 8h | ★★☆ | Template |
| T-003 | CDK Generator実装（コア） | 18h | ★★★ | TypeScript上級 |
| T-004 | CLI統合 | 12h | ★★☆ | CLI設計 |
| T-005 | MVP統合テスト | 10h | ★★★ | テスト |
| T-006 | 全リソース対応 | 32h | ★★★ | AWS+TypeScript |
| T-007 | SNS統合 | 14h | ★★☆ | AWS SNS |
| T-008 | Phase 2統合テスト | 12h | ★★☆ | テスト |
| T-009 | セキュリティ機能 | 18h | ★★★ | セキュリティ |
| T-010 | TypeScript検証 | 16h | ★★☆ | TypeScript API |
| T-011 | パフォーマンス最適化 | 20h | ★★★ | パフォーマンス |
| T-012 | 最終受け入れテスト | 14h | ★★★ | QA |
| T-013 | ドキュメント整備 | 8h | ★★☆ | 文書作成 |

### Phase別優先度
- **Phase 1（T-000〜T-005）**: 最高優先度（MVP実現）
- **Phase 2（T-006〜T-008）**: 高優先度（全機能実装）
- **Phase 3（T-009〜T-013）**: 本番品質（品質・性能・ドキュメント）

### 並列実行可能タスク
- T-002 & T-003（Week 1）: テンプレートとGenerator
- T-009 & T-010（Week 6-7）: セキュリティとバリデーション（部分的）

## リスク管理・対策

### 高リスクタスクと対策

#### T-006（全リソース対応）[32h] - 最高リスク
**リスク**: 6つのAWSリソースタイプの複雑な差異による実装困難
**対策**: 
- リソースタイプを1つずつ段階的実装
- 既存RDS実装パターンの徹底活用
- AWS公式ドキュメントの事前詳細調査
**緊急時対応**: リソースタイプを減らしてスコープ調整（例: RDS+Lambda+DynamoDBのみ）

#### T-011（パフォーマンス最適化）[20h] - 高リスク
**リスク**: 30秒/512MB要件達成困難、メモリリーク発生
**対策**:
- 早期プロトタイプでのパフォーマンス測定
- プロファイリングツール（clinic.js）の活用
- 段階的最適化（アルゴリズム→並列処理→メモリ管理）
**緊急時対応**: 要件緩和交渉（50秒/1GB）またはスコープ削減

#### T-003（CDK Generator）[18h] - 中リスク
**リスク**: Handlebars統合の複雑性、既存システムとの統合困難
**対策**:
- モックテンプレートでの段階的開発
- 既存パターン（base.generator.ts）の踏襲
- 小さなサンプルデータでの検証駆動開発
**緊急時対応**: より単純なテンプレート（文字列concatenation）への変更

### 全体プロジェクトリスク

#### 技術リスク
- **CDK API変更**: v2.80.0固定、定期的な互換性確認
- **性能要件未達**: 早期測定、継続的プロファイリング
- **既存機能破壊**: 充実した回帰テスト、段階的統合

#### チーム・リソースリスク
- **スキル不足**: 事前学習時間確保、ペアプログラミング
- **工数超過**: 週次レビューで早期察知、スコープ調整
- **品質低下**: 厳格なレビュープロセス、自動品質チェック

## チーム体制推奨

### 推奨役割分担
- **テックリード（1名）**: T-003, T-006, T-011担当、全体設計責任
- **シニアエンジニア（1-2名）**: T-002, T-007, T-010担当、専門機能実装
- **QAエンジニア（1名）**: T-005, T-008, T-012担当、品質保証
- **セキュリティエンジニア（1名）**: T-009担当、セキュリティ要件実装

### レビュープロセス
1. **設計レビュー**: 各Phase開始前にアーキテクチャ確認
2. **コードレビュー**: Pull Request毎の必須レビュー
3. **品質レビュー**: 各タスク完了時の品質基準確認
4. **受け入れレビュー**: Phase完了時のプロダクトオーナー確認

### コミュニケーション
- **日次スタンドアップ**: 進捗共有、ブロッカー解決
- **週次レビュー**: Phase進捗確認、リスク評価、計画調整
- **緊急連絡**: Slack/Teams等でのリアルタイム相談

## 緊急時連絡・エスカレーション

### ブロッカー発生時の対応
1. **1日以上進まない技術課題**: テックリードに即座に相談
2. **要件解釈の不明点**: プロダクトオーナー・ステークホルダーに確認  
3. **性能・セキュリティ問題**: アーキテクチャ見直し、専門家投入検討
4. **工数大幅超過**: スコープ調整、リソース追加検討

### プロダクション問題時
- **重大バグ発見**: 即座に実装停止、根本原因分析
- **セキュリティ脆弱性発見**: セキュリティチームに緊急報告
- **パフォーマンス問題**: プロファイリング実施、最適化タスク優先実行

---

**📚 新規参加者へのメッセージ**: 
このタスク一覧は、初めてaws_cloud_supporterプロジェクトに参加する方でも迷うことなく実装できるよう設計されています。不明点があれば遠慮なくチームメンバーに質問し、高品質なCDK生成機能を一緒に構築しましょう！

