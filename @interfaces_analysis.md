# src/interfaces/ 型定義調査結果

## ファイル: src/interfaces/analyzer.ts
- **エクスポート**: AnalysisOptions, PerformanceMetrics, AnalysisStatistics, AnalysisError, ExtendedAnalysisResult, IMetricsAnalyzer
- **IMetricsAnalyzer主要プロパティ**: analyze(), getRegisteredGenerators(), getAnalysisStatistics()
- **AnalysisOptions主要プロパティ**: outputFormat, includeUnsupported?, includeLowImportance?, resourceTypes?, concurrency?
- **PerformanceMetrics主要プロパティ**: parseTime, generatorTime, formatterTime?, totalTime, memoryPeak
- **参照型**: AnalysisResult (from '../types/metrics')

## ファイル: src/interfaces/formatter.ts
- **エクスポート**: IOutputFormatter
- **IOutputFormatter主要プロパティ**: format(), formatJSON?(), formatHTML?()
- **参照型**: AnalysisResult (from '../types/metrics')

## ファイル: src/interfaces/generator.ts
- **エクスポート**: IMetricsGenerator
- **IMetricsGenerator主要プロパティ**: getSupportedTypes(), generate()
- **参照型**: CloudFormationResource (from '../types/cloudformation'), MetricDefinition (from '../types/metrics')

## ファイル: src/interfaces/logger.ts
- **エクスポート**: ILogger
- **ILogger主要プロパティ**: debug(), info(), warn(), error(), success(), setLevel()
- **参照型**: 組み込み型のみ (string, Error, unknown)

## ファイル: src/interfaces/parser.ts
- **エクスポート**: ITemplateParser
- **ITemplateParser主要プロパティ**: parse()
- **参照型**: CloudFormationTemplate (from '../types/cloudformation')

## 📊 調査サマリー
- **調査対象ファイル数**: 5ファイル
- **発見されたインターフェース数**: 8個
  - IMetricsAnalyzer (分析器)
  - IOutputFormatter (出力フォーマッタ)
  - IMetricsGenerator (メトリクス生成器)
  - ILogger (ログ出力)
  - ITemplateParser (テンプレート解析)
  - AnalysisOptions (分析オプション)
  - PerformanceMetrics (パフォーマンス計測)
  - その他3個の補助インターフェース

## 🔗 型依存関係の概要
- **../types/metrics**: AnalysisResult, MetricDefinition
- **../types/cloudformation**: CloudFormationResource, CloudFormationTemplate
- **組み込み型**: string, number, boolean, Error, unknown

## 💡 設計パターン観察
- 全インターフェースでSOLID原則のInterface Segregation Principleが明記されている
- CLAUDE.md準拠のコメントが各ファイルに記載されている
- 非同期処理にPromiseを活用 (analyze, format, generate, parse)
- オプショナルプロパティ (?) の適切な活用
- 型安全性重視の設計 (CloudSupporterErrorの統一的なエラーハンドリング)