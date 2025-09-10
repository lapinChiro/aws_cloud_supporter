# AWS Cloud Supporter - CDK Code Generation Requirements

## 概要

本文書は、aws_cloud_supporterプロジェクトのロードマップ第3項目「CloudFormationからリソースを抽出して、それぞれのリソースがサポートしているメトリクスに対してアラームを張るためのCDKコードを生成する」機能の要件定義書です。

## 用語定義

- **CDK**: AWS Cloud Development Kit (v2.x系列)
- **CDK Alarm**: CloudWatch Alarm のCDK定義
- **Stack**: CDKスタッククラス
- **Construct**: CDK構成要素
- **Template**: コード生成用テンプレート
- **Threshold**: アラームしきい値（warning/critical）
- **Dimension**: CloudWatchメトリクスのディメンション
- **Action**: アラーム発生時のアクション（SNS通知等）

## 背景

現在のaws_cloud_supporterは以下の機能を提供しています：
- CloudFormationテンプレートの解析
- AWSリソース（RDS、Lambda、ECS、ALB、DynamoDB、API Gateway）の抽出
- 各リソースに対する最適なCloudWatchメトリクス推奨の生成（117種類のメトリクス）
- JSON/HTML形式での出力

次のステップとして、生成されたメトリクス分析結果に基づいてCloudWatch AlarmをCDKコードとして自動生成する機能を追加します。

## EARS記法準拠要件定義

### FR-1: CDK コード生成機能

**FR-1.1 基本生成機能**
- When a user requests CDK code generation with `--output cdk` CLI option, the system shall generate valid TypeScript CDK v2.x code that creates CloudWatch Alarm constructs for all analyzed metrics in state of having completed metrics analysis.
- When metrics analysis is completed successfully, the system shall convert the AnalysisResult data structure into CDK Alarm construct definitions in state of analysis data being available in memory.
- When a CloudFormation template is processed and resources are extracted, the system shall generate corresponding CDK Stack class with Alarm definitions that monitor each extracted resource in state of having valid resource extraction results.

**FR-1.2 出力制御**
- When a user specifies `--output cdk` CLI option, the system shall generate TypeScript code files with `.ts` extension instead of JSON or HTML reports in state of CLI execution with valid template input.
- When a user provides `--cdk-output-dir <path>` option, the system shall create CDK Stack TypeScript files in the specified directory path in state of directory being writable and accessible.
- When no `--cdk-output-dir` option is specified, the system shall output complete CDK Stack code to stdout with proper TypeScript syntax in state of CLI execution mode.

**FR-1.3 アラーム設定**
- When generating CloudWatch Alarm definitions, the system shall create exactly two separate Alarm constructs per metric (one for warning threshold, one for critical threshold) in state of having calculated threshold values available.
- When threshold values are calculated using the existing BaseMetricsGenerator logic, the system shall generate CDK Alarm code with numeric threshold values derived from MetricDefinition.recommended_threshold properties in state of having valid MetricDefinition objects.
- When multiple Alarms are created for a single AWS resource, the system shall organize them within a single CDK Construct with resource-specific naming convention `{LogicalId}Alarms` in state of processing multiple metrics for one resource.

### FR-2: CDK コード構造要件

**FR-2.1 ファイル構造**
- When generating CDK code for a CloudFormation template, the system shall create a single TypeScript file containing a CDK Stack class that extends `cdk.Stack` and can be deployed independently in state of having valid template analysis results.
- When processing multiple AWS resources, the system shall organize Alarm constructs within the same Stack class grouped by resource type with comments indicating resource boundaries in state of processing multi-resource templates.
- When generating TypeScript output files, the system shall include exactly these imports: `aws-cdk-lib`, `aws-cdk-lib/aws-cloudwatch`, `aws-cdk-lib/aws-sns`, `aws-cdk-lib/aws-cloudwatch-actions` in state of CDK code generation mode.

**FR-2.2 命名規則**
- When creating CloudWatch Alarm construct IDs, the system shall generate names following the exact pattern: `{LogicalId}{MetricName}{Severity}Alarm` where Severity is either "Warning" or "Critical" in state of processing MetricDefinition objects.
- When creating CDK construct IDs within the same Stack, the system shall ensure uniqueness by appending numeric suffixes (e.g., "MyDbCpuWarningAlarm", "MyDbCpuWarningAlarm2") when name conflicts occur in state of duplicate name detection.
- When generating CDK Stack class names, the system shall use the pattern `CloudWatchAlarmsStack` with optional user-provided prefix via `--cdk-stack-name` CLI option in state of CDK file generation.

**FR-2.3 SNS統合**
- When `--cdk-enable-sns` CLI option is provided, the system shall generate one SNS Topic construct named `AlarmNotificationTopic` within the CDK Stack in state of SNS integration being enabled.
- When SNS Topic is generated, the system shall automatically attach SnsAction to all generated CloudWatch Alarm constructs using `alarm.addAlarmAction(new SnsAction(topic))` in state of having SNS Topic construct available.
- When `--cdk-sns-topic-arn <arn>` option is provided, the system shall import the existing SNS Topic using `Topic.fromTopicArn()` instead of creating a new Topic construct in state of external SNS Topic being specified.

### FR-3: 設定とカスタマイズ要件

**FR-3.1 テンプレート設定**
- When `--cdk-template <path>` CLI option is provided, the system shall load and use the specified Handlebars template file as the base for CDK code generation in state of template file being readable and valid.
- When template variables are defined in the template file, the system shall substitute them with actual values from AnalysisResult and ResourceWithMetrics data structures during generation in state of template processing.
- When no `--cdk-template` option is specified, the system shall use the built-in default template located at `src/templates/cdk-stack.template.ts` in state of standard generation mode.

**FR-3.2 フィルタリング機能**
- When `--resource-types` CLI option specifies resource type filters, the system shall generate CDK Alarm constructs only for the specified AWS resource types (e.g., "AWS::RDS::DBInstance,AWS::Lambda::Function") in state of CDK generation mode.
- When `--include-low` CLI option is not specified, the system shall exclude MetricDefinition objects with importance="Low" from CDK generation in state of processing metric definitions.
- When `--cdk-severity-filter <level>` option is provided with value "warning" or "critical", the system shall generate only Alarm constructs matching the specified severity level in state of severity filtering being enabled.

**FR-3.3 カスタマイズオプション**
- When `--cdk-alarm-actions <type>` option is provided with value "sns", the system shall configure SNS actions on generated Alarm constructs in state of CDK generation with action support enabled.
- When `--cdk-evaluation-periods <number>` option is provided, the system shall override the default evaluation periods (from MetricDefinition.evaluation_period) with the specified value for all generated Alarms in state of custom evaluation period being specified.
- When `--cdk-missing-data-treatment <behavior>` option is provided with values ("notBreaching"|"breaching"|"ignore"|"missing"), the system shall set the treatMissingData property accordingly on all generated Alarm constructs in state of missing data behavior customization.

### FR-4: セキュリティ要件

**FR-4.1 機密情報保護**
- When processing CloudFormation templates containing sensitive properties (Password, Secret, Key, Token, Credential), the system shall exclude these values from generated CDK code and replace them with placeholder comments in state of sanitizing resource properties.
- When generating CDK code with resource names, the system shall validate that no AWS account IDs, API keys, or sensitive identifiers are exposed in construct names or comments in state of code generation.
- When writing CDK files to disk, the system shall set file permissions to 600 (owner read/write only) on Unix systems in state of file output being enabled.

**FR-4.2 入力検証**
- When processing CLI options for CDK generation, the system shall validate all file paths to prevent directory traversal attacks and reject paths containing ".." sequences in state of CLI argument processing.
- When loading custom templates, the system shall verify template files are within allowed directories and reject templates larger than 10MB in state of template loading.
- When processing SNS Topic ARNs, the system shall validate ARN format matches AWS ARN specification pattern before using in CDK code in state of SNS integration being configured.

### FR-5: 品質と性能要件

**FR-5.1 型安全性**
- When generating TypeScript CDK code, the system shall produce code that compiles without errors using TypeScript 4.9+ with strict mode enabled in state of TypeScript compilation.
- When targeting CDK v2.x, the system shall generate code compatible with aws-cdk-lib versions 2.80.0 and above in state of CDK dependency management.
- When generating import statements, the system shall include only the exact CDK modules used (cloudwatch, sns, cloudwatch-actions) to minimize bundle size in state of module optimization.

**FR-5.2 性能要件**
- When processing CloudFormation templates with up to 500 resources, the system shall complete CDK generation within 30 seconds on hardware with 2GB RAM and 2 CPU cores in state of performance testing.
- When generating code for templates with 100+ AWS resources, the system shall maintain peak memory usage below 512MB during the entire generation process in state of memory monitoring.
- When `--performance-mode` CLI option is enabled, the system shall process up to 10 resource types concurrently while maintaining accuracy in state of concurrent processing mode.

**FR-5.3 エラーハンドリング**
- When invalid MetricDefinition objects are encountered (missing required fields), the system shall log specific error messages including resource ID and metric name, then continue processing remaining valid metrics in state of partial failure recovery.
- When CDK code generation fails for a specific AWS resource due to naming conflicts or invalid properties, the system shall report the exact error with resource LogicalId and suggested remediation, while completing processing for other resources in state of graceful degradation.
- When output file writing fails due to insufficient permissions or disk space, the system shall provide clear error messages with specific error codes and suggested solutions (e.g., "Error EACCES: Permission denied writing to /path/file.ts. Suggestion: Check directory write permissions or use --cdk-output-dir option.") in state of file I/O error handling.

### FR-6: CLI統合要件

**FR-6.1 CLIオプション**
- When `--output cdk` CLI option is specified, the system shall generate CDK TypeScript code instead of JSON/HTML output and suppress the standard JSON output to stdout in state of CLI execution with CDK output mode.
- When `--cdk-output-dir <path>` CLI option is provided, the system shall create CDK Stack file named `CloudWatchAlarmsStack.ts` in the specified directory path in state of directory path being valid and writable.
- When `--cdk-stack-name <name>` CLI option is provided, the system shall use the specified name as the CDK Stack class name and filename (e.g., `<name>.ts`) in state of custom stack naming.

**FR-6.2 バッチ処理**
- When multiple CloudFormation template file paths are provided as CLI arguments, the system shall generate separate CDK Stack files with unique filenames based on input template names in state of batch processing mode.
- When processing multiple templates concurrently with `--performance-mode`, the system shall process up to 3 templates simultaneously while maintaining separate memory spaces for each template's data in state of concurrent batch processing.
- When generating multiple CDK Stacks, the system shall ensure unique Stack class names by appending numeric suffixes (e.g., "CloudWatchAlarmsStack2") when name conflicts occur in state of multi-template processing.

**FR-6.3 検証機能**
- When `--validate-cdk` CLI option is enabled, the system shall attempt to compile the generated TypeScript code using the TypeScript compiler and report compilation success or specific error messages in state of code validation being requested.
- When TypeScript compilation errors are detected during validation, the system shall report errors with exact line numbers, error descriptions, and the problematic CDK construct names in state of validation failure.
- When generated CDK code violates AWS CloudWatch limits (>5000 alarms per account), the system shall warn users with specific count information and suggest filtering options in state of AWS limit validation.

### FR-7: 出力フォーマット要件

**FR-7.1 CDK コード構造**
- When generating CDK Stack TypeScript code, the system shall create a class extending `cdk.Stack` with constructor parameters `(scope: Construct, id: string, props?: cdk.StackProps)` and all CloudWatch Alarm construct definitions in the constructor body in state of CDK Stack code generation.
- When defining CloudWatch Alarm constructs, the system shall include exact metric specifications with properties: `metricName`, `namespace`, `dimensionsMap`, `statistic`, `period`, `threshold`, `evaluationPeriods`, `treatMissingData` in state of alarm construct creation.
- When SNS actions are enabled, the system shall generate appropriate SnsAction configurations with syntax `alarm.addAlarmAction(new SnsAction(topic))` for each alarm construct in state of action attachment.

**FR-7.2 ファイル出力**
- When creating CDK output files, the system shall generate exactly one file named `{stack-name}.ts` containing the complete Stack class with all imports and alarm definitions in state of single-file output mode.
- When dependencies are required, the system shall include exact import statements for used CDK modules at the top of the generated file (no separate configuration files) in state of dependency management.
- When package.json updates are needed for CDK dependencies, the system shall output a separate instructions comment in the generated file listing required npm install commands rather than modifying package.json directly in state of dependency instruction provision.

**FR-7.3 ドキュメント生成**
- When generating CDK code, the system shall include JSDoc comments above each alarm construct containing: alarm purpose, metric description, threshold values, and rationale from MetricDefinition.description in state of documentation generation.
- When threshold values are calculated using dynamic scaling (BaseMetricsGenerator.calculateThreshold), the system shall include inline comments documenting the original base value, scale factor, and calculation result in state of threshold documentation.
- When resource dependencies exist between alarms for the same AWS resource, the system shall include comments indicating the logical grouping and relationship (e.g., "// Alarms for RDS instance: MyDatabase") in state of relationship documentation.

## 非機能要件

### NFR-1: 性能要件
- CDK生成処理は、500リソース未満のCloudFormationテンプレートに対して30秒以内に完了すること（測定環境: 2GB RAM, 2 CPU cores）
- 最大メモリ使用量は512MB以下を維持すること（100リソース規模のテンプレートで測定）
- 同時処理は最大10のリソースタイプジェネレーターまで並列実行をサポートすること（`--performance-mode`使用時）

### NFR-2: 品質要件
- 生成されるCDKコードは TypeScript 4.9+ strict mode でコンパイルエラー0個であること
- 生成されるCDKコードは以下のCDK best practicesチェック項目に準拠すること:
  - Construct ID の一意性（同一Stack内で重複なし）
  - 適切なimport文の使用（未使用importなし）
  - Props型定義の適切な使用
- 既存のCLAUDE.md品質基準に準拠すること（Zero type errors, No any types, Build success）

### NFR-3: 保守性要件
- 新しいAWSリソースタイプ追加時、既存CDKジェネレーター実装の変更行数を50行以下に抑えること
- CDKライブラリメジャーバージョンアップ（v2→v3等）時、コア生成ロジックの変更を全体の20%以下に抑えること
- CDKテンプレート変更により、コンパイル処理なしでの出力フォーマット変更を可能にすること

### NFR-4: 互換性要件
- 既存のメトリクス生成機能（AnalysisResult出力）に対する変更を一切行わないこと
- CDK v2.80.0以上のすべてのマイナーバージョンと互換性を保つこと
- Node.js 18.0以上、20.x、22.x での動作テストに合格すること

## 技術仕様

### TS-1: アーキテクチャ
- 既存のジェネレーターパターンを拡張してCDKジェネレーターを実装
- Template Method パターンを使用してCDKコード生成の共通処理を抽象化
- 依存性注入を使用してテンプレートエンジンとフォーマッターを分離

### TS-2: データフロー
1. 既存のメトリクス分析結果を入力として受け取り
2. CDKテンプレートエンジンが各メトリクスをCDK定義に変換
3. コード生成エンジンがTypeScriptファイルを出力
4. 検証エンジンが生成されたコードの妥当性を確認

### TS-3: ファイル構成
```
src/
├── generators/
│   └── cdk.generator.ts       # CDKコード生成器
├── templates/
│   ├── cdk-stack.template.ts  # CDKスタックテンプレート
│   └── cdk-alarm.template.ts  # アラーム定義テンプレート
├── formatters/
│   └── cdk-formatter.ts       # CDKコードフォーマッター
└── types/
    └── cdk.ts                 # CDK関連型定義
```

## 受け入れ基準

### AC-1: 基本機能
- [ ] `examples/web-application-stack.yaml`（10+リソース）からCDKコードが正常に生成できること
- [ ] 生成されたCDKコードが `tsc --strict` でコンパイルエラー0個で通ること
- [ ] 全対応リソースタイプ（AWS::RDS::DBInstance、AWS::Lambda::Function、AWS::ECS::Service、AWS::ElasticLoadBalancingV2::LoadBalancer、AWS::DynamoDB::Table、AWS::ApiGateway::RestApi）でCDK Alarm生成が動作すること
- [ ] 生成されるAlarm数が元のメトリクス数×2（warning + critical）と一致すること

### AC-2: CLI統合
- [ ] `npm run dev examples/web-application-stack.yaml --output cdk` でCDK出力モードに切り替えられること
- [ ] `--cdk-output-dir ./output` でファイル出力先を指定でき、`CloudWatchAlarmsStack.ts` ファイルが作成されること
- [ ] `--resource-types "AWS::RDS::DBInstance"` フィルタリングがCDKモードで動作し、RDS関連Alarmのみ生成されること
- [ ] `--include-low` オプションなしでLow重要度メトリクスが除外されること

### AC-3: 出力品質
- [ ] 生成されるTypeScriptコードが ESLint（@typescript-eslint/recommended）でエラー0個であること
- [ ] 生成されるCDK Stackクラスが指定されたimport文（aws-cdk-lib、aws-cloudwatch、aws-sns、aws-cloudwatch-actions）のみを含むこと
- [ ] 各Alarm constructにJSDocコメントが含まれ、少なくとも目的・メトリクス説明・しきい値を記述していること
- [ ] Construct ID が一意であり、パターン `{LogicalId}{MetricName}{Severity}Alarm` に従っていること

### AC-4: 性能
- [ ] `examples/web-application-stack.yaml`（~15リソース）で10秒以内にCDK生成が完了すること
- [ ] 100リソース規模の合成テンプレートで30秒以内にCDK生成が完了すること
- [ ] CDK生成中の最大メモリ使用量が512MB以下であること（process.memoryUsage()で測定）
- [ ] 既存の `--output json` モードの処理時間に影響しないこと（±10%以内）

### AC-5: セキュリティ
- [ ] CloudFormationテンプレートの機密プロパティ（Password、Secret等）がCDKコードに含まれないこと
- [ ] 生成されたファイルのパーミッションが600（所有者のみ読み書き）に設定されること（Unix系OS）
- [ ] ディレクトリトラバーサル攻撃（`../../../etc/passwd`等）が防止されること

## 制約事項

### CS-1: 技術制約
- CDK v2.80.0以上のみサポート（v1.x、v2.79.x以下は対象外）
- TypeScript言語での出力のみサポート（Python、Java、C#、Go言語バインディングは対象外）
- CloudWatch Alarm constructのみサポート（Custom Metrics、Composite Alarms、Dashboard等は本要件の対象外）
- 最大生成可能Alarm数は1000個まで（AWS CloudWatch制限を考慮）

### CS-2: 機能制約
- Alarm Actionは初期版でSNS通知のみサポート（Auto Scaling Action、Lambda Action、EC2 Action等は将来対応）
- しきい値計算は既存のBaseMetricsGenerator.calculateThreshold()ロジックを流用（新しいアルゴリズムは対象外）
- カスタムメトリクス（AWS/Custom名前空間）の自動生成は対象外
- 既存CloudFormationリソースのインポート（fromXxxArn等）は対象外

### CS-3: 運用制約
- 生成されたCDKコードの手動編集は非推奨（再生成時に変更が失われる可能性がある）
- CDK Stack の `cdk deploy` 実行は本ツールの対象外（ユーザーが手動で実行）
- AWS認証情報の設定・管理は対象外（CDK標準の方法（環境変数、~/.aws/credentials等）を使用）
- 生成されたCDKコードのバージョン管理（Git等）は対象外（ユーザーの責任範囲）

### CS-4: リソース制約
- 同一LogicalIdを持つリソースが複数存在する場合の処理は未定義（CloudFormationテンプレートの責任範囲）
- 1ファイルあたりの出力コード行数は10,000行まで（TypeScriptファイルサイズ制限）
- テンプレートファイルサイズは100MB以下（Node.jsメモリ制限を考慮）

## 今後の拡張計画

### FE-1: 短期拡張（次期バージョン）
- Composite Alarmsサポート
- Lambda Action、Auto Scaling Actionサポート
- Terraform対応準備

### FE-2: 中期拡張
- カスタムメトリクスサポート
- アラーム設定のGUI化
- CDKスタック管理機能

### FE-3: 長期拡張
- マルチクラウド対応
- AIOpsとの統合
- 自動しきい値最適化