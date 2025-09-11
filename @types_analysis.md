# src/types/ 型定義調査結果

## ファイル: src/types/metrics.ts
- **エクスポート**: MetricDefinition, ThresholdDefinition, MetricDimension, MetricConfig, AnalysisResult, AnalysisMetadata, ResourceWithMetrics, TemplateAnalysisResult, ExtractResult, OutputFormat, JSONOutputData, CLIOptions, ProcessOptions, ITemplateParser, ITemplateAnalyzer, IMetricsGenerator, IMetricsProcessor, IJSONFormatter, IHTMLFormatter, IOutputFormatter, ILogger
- **MetricDefinition主要プロパティ**: metric_name, namespace, unit, description, statistic, recommended_threshold, evaluation_period, category, importance
- **AnalysisResult主要プロパティ**: metadata, resources, unsupported_resources
- **IOutputFormatter主要プロパティ**: format(), formatJSON?(), formatHTML?()
- **参照型**: CloudFormationResource (from './cloudformation'), MetricStatistic, MetricCategory, ImportanceLevel, EvaluationPeriod, TimestampISO (from './common')

## ファイル: src/types/cloudformation.ts
- **エクスポート**: CloudFormationTemplate, CloudFormationResource, ParameterDefinition, OutputDefinition, CloudFormationMetadata, RDSDBInstance, RDSProperties, LambdaFunction, ServerlessFunction, LambdaProperties, ECSService, ApplicationLoadBalancer, DynamoDBTable, APIGatewayRestAPI, ServerlessAPI, SupportedResource, ResourceType (enum), リソース判定関数群 (isRDSInstance, isLambdaFunction等)
- **CloudFormationTemplate主要プロパティ**: AWSTemplateFormatVersion?, Description?, Parameters?, Resources, Outputs?
- **CloudFormationResource主要プロパティ**: Type, Properties?, LogicalId?, Condition?, DependsOn?
- **ResourceType主要値**: RDS_DB_INSTANCE, LAMBDA_FUNCTION, ECS_SERVICE, ALB, DYNAMODB_TABLE等
- **参照型**: なし（自己完結設計）

## ファイル: src/types/common.ts
- **エクスポート**: Primitive, AWSRegion, AWSAccountId, MetricStatistic, MetricCategory, ImportanceLevel, EvaluationPeriod, TimestampISO, ErrorDetails, StructuredError, PerformanceMetrics, AnalysisOptions
- **MetricStatistic主要値**: 'Average', 'Sum', 'Maximum', 'Minimum'
- **MetricCategory主要値**: 'Performance', 'Error', 'Saturation', 'Latency'
- **ImportanceLevel主要値**: 'High', 'Medium', 'Low'
- **ErrorDetails主要プロパティ**: originalError?, fileSize?, lineNumber?, columnNumber?, filePath?
- **参照型**: 組み込み型のみ (string, number, boolean等)

## ファイル: src/types/aws-cdk-official.ts
- **エクスポート**: AlarmProps, MetricProps, DimensionsMap, IMetric, TreatMissingData, Stats, TopicProps, ITopic, StackProps, Duration, CDKAlarmPropsOfficial, CDKTopicPropsOfficial, CDKMetricPropsOfficial, CDKDimensionsMapOfficial
- **設計特徴**: AWS CDK公式型の再エクスポートによる車輪の再発明回避
- **CDKAlarmPropsOfficial**: cloudwatch.AlarmPropsのエイリアス
- **CDKTopicPropsOfficial**: sns.TopicPropsのエイリアス
- **参照型**: aws-cdk-lib/aws-cloudwatch, aws-cdk-lib/aws-sns, aws-cdk-lib

## ファイル: src/types/cdk-business.ts
- **エクスポート**: CDKAlarmBusiness, CDKAlarmComplete, CDKSNSConfiguration, CDKStackDataOfficial, CDKOptions, CDKGenerationResult, CDKStackData, CDKStackMetadata, extractOfficialAlarmProps(), extractBusinessProps()
- **CDKAlarmBusiness主要プロパティ**: constructId, severity, resourceLogicalId, resourceType
- **CDKAlarmComplete**: cloudwatch.AlarmProps & CDKAlarmBusiness (公式型とビジネス型の組み合わせ)
- **CDKGenerationResult主要プロパティ**: generatedCode, outputFilePath?, metadata, success, errorMessage?
- **CDKOptions主要プロパティ**: enabled, outputDir?, stackName?, includeLowImportance?, resourceTypeFilters?
- **参照型**: aws-cdk-lib/aws-cloudwatch, aws-cdk-lib/aws-sns

## 📊 調査サマリー
- **調査対象ファイル数**: 5ファイル
- **発見された型・インターフェース数**: 50+個
  - **基盤型** (common.ts): 10個の基本型・共通型
  - **CloudFormation型** (cloudformation.ts): 20+個のAWSリソース特化型
  - **メトリクス型** (metrics.ts): 15+個の分析・メトリクス関連型
  - **CDK公式型** (aws-cdk-official.ts): 10個の公式型再エクスポート
  - **CDKビジネス型** (cdk-business.ts): 10個のビジネスロジック特化型

## 🔗 型依存関係マップ
```
common.ts (基盤)
    ↑
cloudformation.ts (AWSリソース)
    ↑
metrics.ts (分析エンジン) → aws-cdk-official.ts (公式型)
    ↑                           ↑
interfaces/ (各種I/F)      cdk-business.ts (ビジネス型)
```

## 💡 設計パターン観察
- **型安全性の徹底**: any型完全排除、unknown型の適切な活用
- **CLAUDE.md準拠**: 全ファイルでType-Driven Development明記
- **DRY原則**: common.tsでの共通型定義、車輪の再発明回避
- **Interface Segregation**: 目的別インターフェース分割設計
- **AWS公式型活用**: aws-cdk-libの公式型を直接活用
- **ビジネスロジック分離**: 公式型とビジネス型の明確な分離

## 🚨 any型エラー関連発見事項
- **型安全設計**: 全型定義でany型回避、unknown型活用
- **重要な型定義**: AnalysisResult, CloudFormationResource, MetricDefinition
- **エラー多発想定箇所**: 
  - AnalysisResult使用箇所 (複雑なデータ構造)
  - CloudFormationResource.Properties (unknown型だが実装で型変換必要)
  - HandlebarsContext (T-001で発見、型定義が不明)

## 📈 T-003準備完了
重要インターフェースの使用箇所特定に必要な情報収集完了:
- **AnalysisResult**: metrics.ts:68で定義
- **IOutputFormatter**: metrics.ts:193で定義 
- **ILogger**: metrics.ts:197で定義
- **HandlebarsContext**: 型定義未発見（要調査）