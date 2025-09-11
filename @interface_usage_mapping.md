# 重要インターフェース使用箇所マッピング

## 📊 調査概要
- **調査対象**: AnalysisResult, IOutputFormatter, ILogger, HandlebarsContext
- **調査範囲**: src/ディレクトリ配下の全TypeScriptファイル
- **調査日時**: 2025-09-11

---

## 1. AnalysisResult 型の使用状況

### 📈 使用箇所統計
- **総使用箇所数**: 42箇所
- **使用ファイル数**: 18ファイル
- **主要用途**: 分析結果の型定義、フォーマッタへの入力、インターフェース定義

### 📍 詳細使用箇所一覧

#### 型定義・インターフェース (4箇所)
- `src/types/metrics.ts:68` - AnalysisResult型の定義
- `src/types/metrics.ts:185` - IOutputFormatter.formatJSON パラメータ型
- `src/types/metrics.ts:189` - IOutputFormatter.formatHTML パラメータ型
- `src/interfaces/analyzer.ts:62` - ExtendedAnalysisResult extends AnalysisResult

#### フォーマッタ実装 (9箇所)
- `src/core/json-formatter.ts:5` - import文
- `src/core/json-formatter.ts:23` - format メソッドパラメータ
- `src/core/json-formatter.ts:31` - formatJSON メソッドパラメータ
- `src/core/formatters/html/index.ts:4` - import文
- `src/core/formatters/html/index.ts:33` - format メソッドパラメータ
- `src/core/formatters/html/index.ts:44` - formatHTML メソッドパラメータ
- `src/core/formatters/html/interfaces.ts:2` - import文
- `src/core/formatters/html/interfaces.ts:14` - formatHTML メソッド型定義
- `src/core/formatters/html/base-formatter.ts:30` - formatHTML メソッドパラメータ

#### アナライザー・生成器 (6箇所)
- `src/core/analyzer.ts:12` - import文（ExtendedAnalysisResult経由）
- `src/core/analyzer.ts:67` - analyze メソッド戻り値型
- `src/core/analyzer.ts:127` - 内部メソッド戻り値型
- `src/core/analyzer.ts:163` - 結果オブジェクト作成
- `src/generators/cdk-official.generator.ts:11` - import文（ExtendedAnalysisResult経由）
- `src/generators/cdk-official.generator.ts:68` - generate メソッドパラメータ

#### CLI・ハンドラー (15箇所)
- `src/cli/handlers/cdk-handler.ts:10` - import文
- `src/cli/handlers/cdk-handler.ts:84` - analyse メソッド戻り値型
- `src/cli/handlers/cdk-handler.ts:217` - generateOutput メソッドパラメータ
- `src/cli/handlers/cdk-handler.ts:235` - generateCDKOutput メソッドパラメータ
- `src/cli/interfaces/handler.interface.ts:4` - import文
- `src/cli/interfaces/handler.interface.ts:74` - generateOutput メソッドパラメータ
- `src/cli/interfaces/handler.interface.ts:144` - generateJSONOutput メソッドパラメータ
- `src/cli/interfaces/handler.interface.ts:168` - generateHTMLOutput メソッドパラメータ
- `src/cli/utils/output-handlers.ts:9` - import文
- `src/cli/utils/output-handlers.ts:25` - generateJSONOutput メソッドパラメータ
- `src/cli/utils/output-handlers.ts:51` - generateHTMLOutput メソッドパラメータ
- `src/cli/utils/output-handlers.ts:105` - generateJSONOutput メソッドパラメータ
- `src/cli/utils/output-handlers.ts:150` - generateHTMLOutput メソッドパラメータ
- `src/cli/utils/output-handlers.ts:206` - generateJSONOutput メソッドパラメータ

#### バリデーション・ユーティリティ (8箇所)
- `src/utils/schema-validator.ts:9` - AnalysisResultSchema インターフェース定義
- `src/utils/schema-validator.ts:60` - コメント（AnalysisResult JSON出力の完全スキーマ検証）
- `src/utils/schema-validator.ts:63` - validateAnalysisResult メソッド定義
- `src/utils/schema-validator.ts:499` - validateAnalysisResult 呼び出し
- `src/utils/schema-validator.ts:516` - validateAnalysisResult 呼び出し

---

## 2. IOutputFormatter 型の使用状況

### 📈 使用箇所統計
- **総使用箇所数**: 21箇所
- **使用ファイル数**: 8ファイル
- **主要用途**: フォーマッタ実装、CLI依存性注入、インターフェース定義

### 📍 詳細使用箇所一覧

#### 型定義・インターフェース (3箇所)
- `src/interfaces/formatter.ts:10` - IOutputFormatter型の定義
- `src/types/metrics.ts:193` - IOutputFormatter extends IJSONFormatter, IHTMLFormatter
- `src/core/formatters/html/interfaces.ts:99` - コメント（既存のIOutputFormatterとの互換性を維持）

#### フォーマッタ実装 (2箇所)
- `src/core/json-formatter.ts:4` - import文
- `src/core/json-formatter.ts:13` - JSONOutputFormatter implements IOutputFormatter

#### CLI・コマンド (16箇所)
- `src/cli/interfaces/command.interface.ts:7` - import文
- `src/cli/interfaces/command.interface.ts:18` - jsonFormatter プロパティ型
- `src/cli/interfaces/command.interface.ts:19` - htmlFormatter プロパティ型
- `src/cli/interfaces/handler.interface.ts:145` - generateJSONOutput メソッドパラメータ
- `src/cli/interfaces/handler.interface.ts:146` - generateJSONOutput メソッドパラメータ
- `src/cli/interfaces/handler.interface.ts:169` - generateHTMLOutput メソッドパラメータ
- `src/cli/interfaces/handler.interface.ts:170` - generateHTMLOutput メソッドパラメータ
- `src/cli/interfaces/handler.interface.ts:176` - import文
- `src/cli/utils/output-handlers.ts:7` - import文
- `src/cli/utils/output-handlers.ts:26` - generateJSONOutput メソッドパラメータ
- `src/cli/utils/output-handlers.ts:27` - generateJSONOutput メソッドパラメータ
- `src/cli/utils/output-handlers.ts:52` - generateHTMLOutput メソッドパラメータ
- `src/cli/utils/output-handlers.ts:53` - generateHTMLOutput メソッドパラメータ
- `src/cli/utils/output-handlers.ts:106` - generateJSONOutput メソッドパラメータ
- `src/cli/utils/output-handlers.ts:107` - generateJSONOutput メソッドパラメータ
- `src/cli/utils/output-handlers.ts:151` - generateHTMLOutput メソッドパラメータ
- `src/cli/utils/output-handlers.ts:152` - generateHTMLOutput メソッドパラメータ

---

## 3. ILogger 型の使用状況

### 📈 使用箇所統計
- **総使用箇所数**: 31箇所
- **使用ファイル数**: 10ファイル
- **主要用途**: ログ出力、依存性注入、ログレベル管理

### 📍 詳細使用箇所一覧

#### 型定義・インターフェース (2箇所)
- `src/interfaces/logger.ts:8` - ILogger型の定義
- `src/types/metrics.ts:197` - ILogger型の再定義

#### 実装クラス (3箇所)
- `src/utils/logger.ts:3` - import文
- `src/utils/logger.ts:18` - Logger implements ILogger
- `src/utils/logger.ts:218` - createLogger 戻り値型

#### アナライザー・生成器 (5箇所)
- `src/core/analyzer.ts:14` - import文
- `src/core/analyzer.ts:34` - logger プロパティ型
- `src/generators/base.generator.ts:3` - import文
- `src/generators/base.generator.ts:32` - constructor パラメータ型
- `src/generators/cdk-official.generator.ts:60` - constructor パラメータ型

#### CLI・コマンド (17箇所)
- `src/cli/interfaces/command.interface.ts:8` - import文
- `src/cli/interfaces/command.interface.ts:20` - logger プロパティ型
- `src/cli/interfaces/handler.interface.ts:57` - logger パラメータ型
- `src/cli/interfaces/handler.interface.ts:76` - logger パラメータ型
- `src/cli/interfaces/handler.interface.ts:125` - logger パラメータ型
- `src/cli/interfaces/handler.interface.ts:147` - logger パラメータ型
- `src/cli/interfaces/handler.interface.ts:171` - logger パラメータ型
- `src/cli/interfaces/handler.interface.ts:177` - import文
- `src/cli/commands.ts:6` - import文
- `src/cli/commands.ts:72` - setupLogging メソッドパラメータ
- `src/cli/commands.ts:90` - executeAnalysis メソッドパラメータ
- `src/cli/commands.ts:124` - handleCLIAction メソッドパラメータ
- `src/cli/commands.ts:154` - handleError メソッドパラメータ
- `src/cli/utils/output-handlers.ts:8` - import文
- `src/cli/utils/output-handlers.ts:28` - generateJSONOutput メソッドパラメータ
- `src/cli/utils/output-handlers.ts:83` - handleError メソッドパラメータ
- `src/cli/utils/output-handlers.ts:108` - generateHTMLOutput メソッドパラメータ
- `src/cli/utils/output-handlers.ts:186` - handleError メソッドパラメータ
- `src/cli/utils/output-handlers.ts:208` - generateJSONOutput メソッドパラメータ

#### バリデーション (4箇所)
- `src/validation/cdk-validator.ts:5` - import文
- `src/validation/cdk-validator.ts:17` - constructor パラメータ型
- `src/validation/cdk-validator.ts:333` - createCDKValidator メソッドパラメータ型
- `src/validation/cdk-validator.ts:336` - defaultLogger 変数型

---

## 4. HandlebarsContext 型の使用状況

### 📈 使用箇所統計
- **総使用箇所数**: 0箇所 (型定義なし)
- **関連型使用箇所数**: 1箇所 (HandlebarsTemplateDelegate)
- **使用ファイル数**: 1ファイル

### 📍 調査結果

#### HandlebarsContext型について
- **調査結果**: src/ディレクトリ内にHandlebarsContext型の定義・使用は確認されず
- **推定理由**: Handlebarsライブラリの外部型を直接使用している可能性

#### 関連するHandlebars型の使用箇所
- `src/generators/cdk-official.generator.ts:57` - `private template: HandlebarsTemplateDelegate | null = null`

#### Handlebars関連の使用状況 (14箇所)
- `src/generators/cdk-official.generator.ts:8` - `import * as Handlebars from 'handlebars'`
- `src/generators/cdk-official.generator.ts:17` - CDKOfficialHandlebarsHelpers import
- `src/generators/cdk-official.generator.ts:380` - CDKOfficialHandlebarsHelpers.processMetricForTemplate 呼び出し
- `src/generators/cdk-official.generator.ts:444` - CDKOfficialHandlebarsHelpers.registerHelpers 呼び出し
- `src/generators/cdk-official.generator.ts:447` - Handlebars.compile 呼び出し
- `src/templates/handlebars-official-helpers.ts:4` - `import * as Handlebars from 'handlebars'`
- `src/templates/handlebars-official-helpers.ts:10` - CDKOfficialHandlebarsHelpers クラス定義
- `src/templates/handlebars-official-helpers.ts:139-144` - Handlebars.registerHelper 呼び出し (6箇所)

---

## 📊 総合分析

### 使用頻度ランキング
1. **AnalysisResult**: 42箇所 - プロジェクトの中核データ型
2. **ILogger**: 31箇所 - 全体的なログ管理の基盤
3. **IOutputFormatter**: 21箇所 - 出力フォーマット処理の統一インターフェース
4. **HandlebarsContext**: 0箇所 - 型定義なし（外部ライブラリ依存）

### any型エラー修正への影響評価

#### 高影響度
- **AnalysisResult**: 42箇所での使用により、修正時の影響範囲が最大
- **IOutputFormatter**: CLIの出力処理全体に影響

#### 中影響度  
- **ILogger**: ログ出力系での影響、エラーハンドリングに注意必要

#### 低影響度
- **HandlebarsContext**: 型定義がないため直接的な影響は限定的

### 修正優先度の推奨
1. **Phase 1**: HandlebarsContext関連（影響範囲が限定的）
2. **Phase 2**: IOutputFormatter関連（出力系の型安全化）
3. **Phase 3**: ILogger関連（ログ系の型安全化）
4. **Phase 4**: AnalysisResult関連（最も広範囲な影響、慎重な対応必要）