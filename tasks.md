# any型エラー解消タスク一覧

## 📋 プロジェクト概要
**目標**: src/ディレクトリのany型関連ESLintエラー86+個をゼロにする  
**総期間**: 15-20営業日  
**リスク戦略**: 段階的・検証重視アプローチ

---

## Phase 0: 実態把握（3-5日）

### T-001: src/interfaces/ ディレクトリの型定義調査
**目的**: インターフェース定義の現状把握（調査範囲を限定して実行可能性を確保）

**必要スキル**: TypeScript基礎、ファイル構造理解、マークダウン記法

**事前条件（チェックリスト）**:
- [ ] プロジェクトルートに移動済み (`pwd` で確認)
- [ ] `src/interfaces/` ディレクトリが存在 (`ls src/interfaces/` で確認)
- [ ] テキストエディタまたはVSCodeが利用可能

**依存関係**: なし

**詳細作業手順**:
1. 以下コマンドでファイル一覧確認
   ```bash
   find src/interfaces/ -name "*.ts" -type f
   ```
2. 各ファイルを順番に開いて以下を記録:
   - エクスポートされているインターフェース名一覧
   - 各インターフェースの主要プロパティ（3-5個程度）
   - import文で参照している他の型
3. 記録は以下テンプレートを使用

**成果物テンプレート**:
```markdown
# src/interfaces/ 型定義調査結果

## ファイル: src/interfaces/analyzer.ts
- エクスポート: IAnalyzer, AnalysisOptions
- IAnalyzer主要プロパティ: analyze(), validate(), getResults()
- 参照型: CloudFormationTemplate, AnalysisResult

## ファイル: src/interfaces/formatter.ts
...
```

**完了条件（客観的判定）**:
- [ ] src/interfaces/ 配下の全.tsファイルの調査完了
- [ ] `@interfaces_analysis.md` ファイルが存在し、テンプレート形式で記録済み
- [ ] ファイル内容が500文字以上（実質的な調査実施の証拠）

**所要時間**: 3-4時間（ファイル数×30-40分）  
**リスクレベル**: 極低（読み取りのみ）

**よくある問題と対処**:
- TypeScriptの型構文が理解困難 → 基本的な部分のみ記録し、詳細は後続タスクで
- ファイルが見つからない → `find` コマンドで確認、見つからない場合はその旨記録

**ロールバック戦略**: 不要（調査タスクのため）

---

### T-002: src/types/ ディレクトリの型定義調査
**目的**: 型定義ファイルの現状把握

**必要スキル**: TypeScript基礎、enum/type/interface の区別理解

**事前条件（チェックリスト）**:
- [ ] T-001が完了済み（`@interfaces_analysis.md` 存在確認）
- [ ] `src/types/` ディレクトリが存在 (`ls src/types/` で確認)

**依存関係**: T-001

**詳細作業手順**:
1. ファイル一覧確認
   ```bash
   find src/types/ -name "*.ts" -type f
   ```
2. 各ファイルの型定義を記録（T-001と同様手順）

**完了条件**:
- [ ] `@types_analysis.md` ファイルが存在
- [ ] 全.tsファイルの型定義が記録済み（500文字以上）

**所要時間**: 3-4時間  
**リスクレベル**: 極低

---

### T-003: 重要インターフェースの使用箇所特定
**目的**: AnalysisResult等の主要型の使用状況を把握

**必要スキル**: grep/ripgrep コマンド、正規表現基礎

**事前条件**:
- [ ] T-001, T-002が完了済み
- [ ] 調査対象型が決定済み: AnalysisResult, IOutputFormatter, ILogger, HandlebarsContext

**依存関係**: T-001, T-002

**詳細作業手順**:
1. 各インターフェースの使用箇所検索
   ```bash
   grep -rn "AnalysisResult" src/ --include="*.ts" > analysis_result_usage.txt
   grep -rn "IOutputFormatter" src/ --include="*.ts" > formatter_usage.txt
   grep -rn "ILogger" src/ --include="*.ts" > logger_usage.txt
   grep -rn "HandlebarsContext" src/ --include="*.ts" > handlebars_usage.txt
   ```
2. 検索結果を整理（ファイル名と行番号を記録）

**完了条件**:
- [ ] `@interface_usage_mapping.md` が存在
- [ ] 4つの重要インターフェースの全使用箇所が記録済み
- [ ] 各インターフェースの使用箇所数が明記済み

**所要時間**: 2-3時間  
**リスクレベル**: 極低

---

### T-004: any型エラー最多3ファイルの詳細コード分析
**目的**: any型エラーの実態を具体的に把握

**必要スキル**: TypeScript中級、ESLintエラー読解、コードレビュー経験

**事前条件**:
- [ ] T-003完了済み
- [ ] 対象ファイル確定済み: src/cli/handlers/cdk-handler.ts, src/templates/handlebars-official-helpers.ts, src/cli/commands.ts

**依存関係**: T-003

**詳細作業手順**:
1. 各ファイルのESLintエラー詳細確認・出力保存
   ```bash
   npm run lint src/cli/handlers/cdk-handler.ts > cdk_handler_errors.txt
   npm run lint src/templates/handlebars-official-helpers.ts > handlebars_errors.txt
   npm run lint src/cli/commands.ts > commands_errors.txt
   ```
2. 各エラー箇所のコード読み取り（前後3行含む）
3. any型使用理由の分類（以下カテゴリ使用）:
   - A: 外部ライブラリの型不備
   - B: 複雑なJSONデータ構造
   - C: 設計上の型定義不足
   - D: 一時的な実装（TODO扱い）

**成果物テンプレート**:
```markdown
# any型エラー詳細分析

## src/cli/handlers/cdk-handler.ts

### エラー 83:15 - @typescript-eslint/no-explicit-any
**コード:**
```typescript
82: function processData(input: string) {
83:   const analyzer: any = createAnalyzer();
84:   return analyzer.process(input);
```
**分類**: C (設計上の型定義不足)  
**修正難易度**: 普通 (適切な型定義が必要)  
**修正方針**: IAnalyzerインターフェースを使用
```

**完了条件**:
- [ ] `@any_error_detailed_analysis.md` が存在
- [ ] 3ファイルの全any型エラー（57個）が分析済み
- [ ] 各エラーに分類（A/B/C/D）と修正難易度が付与済み
- [ ] ファイル内容が3000文字以上（詳細分析の証拠）

**所要時間**: 6-8時間  
**リスクレベル**: 低（分析のみ）

---

### T-005: 修正戦略・優先度決定
**目的**: 分析結果を基に実行可能な修正計画を策定

**必要スキル**: プロジェクト管理、技術的判断力、リスク評価

**事前条件**:
- [ ] T-004完了済み
- [ ] any型エラーの分類・難易度評価完了

**依存関係**: T-004

**詳細作業手順**:
1. T-004の分析結果を基に修正難易度「簡単」のエラー抽出
2. Phase 1で実行するエラー10-15個を具体的に選定
   - 選定基準: 外部依存なし、単独修正可能、影響範囲小
3. 修正順序の決定（依存関係考慮）
4. Phase 2, 3の対象エラーも仮決定

**成果物テンプレート**:
```markdown
# any型エラー修正戦略

## Phase 1対象エラー（簡単・低リスク）
1. src/types/cloudformation.ts:323 - enum比較
2. src/types/cloudformation.ts:327 - enum比較
...

## Phase 2対象エラー（中リスク）
1. src/cli/commands.ts:89 - 関数パラメータの型定義
...

## 修正順序と理由
1. 列挙型比較エラー → 独立性が高く、影響範囲が限定的
2. 単純な型注釈 → 他への影響が少ない
...
```

**完了条件**:
- [ ] `@fix_strategy.md` が存在
- [ ] Phase 1対象エラーが具体的に特定済み（ファイル名:行番号形式で10-15個）
- [ ] 修正順序が理由付きで決定済み
- [ ] Phase 2, 3の仮計画も策定済み

**所要時間**: 2-3時間  
**リスクレベル**: 低

---

## Phase 1: 低リスク修正（2-3日）

### T-006: cloudformation.ts 列挙型比較エラー修正
**目的**: 8つの列挙型比較エラーを段階的に修正（最も安全な修正から開始）

**必要スキル**: TypeScript enum操作、型安全なプログラミング、Git操作

**事前条件**:
- [ ] T-005完了済み
- [ ] 作業ブランチ作成済み: `git checkout -b fix-enum-comparison`
- [ ] 現在のエラー数確認: `npm run lint src/types/cloudformation.ts | grep -c "error"`

**依存関係**: T-005

**詳細作業手順**:
1. バックアップコミット作成
   ```bash
   git add . && git commit -m "Backup before fixing enum comparison errors"
   ```
2. 対象ファイルのエラー箇所確認
   ```bash
   npm run lint src/types/cloudformation.ts
   ```
3. 1つずつエラー修正・検証（8回繰り返し）:
   - エラー箇所の特定とコード理解
   - 型安全な比較方法への修正
   - TypeScript型チェック: `npx tsc --noEmit`
   - ESLint実行: `npm run lint src/types/cloudformation.ts`
   - エラー数減少確認
4. 全修正完了後の統合テスト
   ```bash
   npm test -- --testPathPattern=cloudformation
   ```

**完了条件**:
- [ ] src/types/cloudformation.ts のlintエラー 0個
- [ ] TypeScript型チェック パス（`npx tsc --noEmit` で確認）
- [ ] 関連テスト全てパス
- [ ] 修正コミットが作成済み

**所要時間**: 4-6時間  
**リスクレベル**: 低

**よくある問題と対処**:
- enum型の比較方法が不明 → `Object.values(EnumType).includes(value)` または型アサーションを使用
- テストが失敗 → 修正前の状態に戻してアプローチ再検討
- 他のファイルでの型エラー → 影響範囲を確認し、必要に応じて追加修正

**ロールバック戦略**: `git reset --hard HEAD~1`

---

### T-007: Phase 1対象の単純なany型宣言修正
**目的**: T-005で特定した「簡単」レベルの残りエラーを修正

**必要スキル**: TypeScript型注釈、型推論の理解

**事前条件**:
- [ ] T-006完了済み
- [ ] T-005で特定したPhase 1対象エラーリスト確認済み
- [ ] 現在のany型関連エラー総数確認

**依存関係**: T-006

**詳細作業手順**:
1. 対象エラーの再確認
   ```bash
   npm run lint src/ | grep -E "(no-explicit-any|no-unsafe-)" | wc -l
   ```
2. T-005で特定した各エラーを順次修正:
   - 明示的`any`型の適切な型への置換
   - 型推論可能な箇所の型注釈削除
   - 各修正後の検証実行
3. 修正済みエラー数の確認

**完了条件**:
- [ ] Phase 1対象エラー（10-15個）が全て解消済み
- [ ] 総any型関連エラー数が計画通り削減済み
- [ ] TypeScript型チェック パス
- [ ] 関連テスト全てパス

**所要時間**: 6-8時間  
**リスクレベル**: 低-中

---

## Phase 2: 中リスク修正（5-7日）

### T-008: src/cli/commands.ts の詳細分析・修正計画策定
**目的**: 15エラーを含む中核ファイルの修正戦略を詳細設計

**必要スキル**: TypeScript上級、設計能力、ソフトウェア アーキテクチャ理解

**事前条件**:
- [ ] Phase 1完了済み（T-007完了）
- [ ] src/cli/commands.ts のエラー内容確認済み

**依存関係**: T-007

**詳細作業手順**:
1. ファイル全体の構造把握
2. 各エラーの影響範囲分析
3. 修正順序の詳細計画策定
4. 必要な新しい型定義の設計

**完了条件**:
- [ ] `@commands_fix_plan.md` が存在
- [ ] 15エラーの詳細修正計画策定済み
- [ ] 修正順序と理由が明記済み

**所要時間**: 8-12時間

---

### T-009: src/cli/commands.ts の段階的修正実行
**目的**: 計画に基づいて15エラーを段階的に修正

**事前条件**:
- [ ] T-008完了済み
- [ ] 修正計画の妥当性確認済み

**依存関係**: T-008

**詳細作業手順**:
1. 修正計画に従って段階的実行
2. 各段階での動作テスト実行
3. エラー数の段階的削減確認

**完了条件**:
- [ ] src/cli/commands.ts のany型エラー 0個
- [ ] CLI機能の動作確認パス

**所要時間**: 12-16時間

---

### T-010: 依存ファイルの追従修正
**目的**: T-009の変更に伴う他ファイルの調整

**事前条件**:
- [ ] T-009完了済み

**依存関係**: T-009

**完了条件**:
- [ ] 関連ファイルの型エラー解消済み
- [ ] 全体のビルド成功

**所要時間**: 6-10時間

---

## Phase 3: 高リスク修正（7-10日）

### T-011: cdk-handler.ts の詳細分析・設計
**目的**: 25エラーを含む最重要ファイルの修正戦略設計

**事前条件**:
- [ ] Phase 2完了済み

**依存関係**: T-010

**所要時間**: 12-16時間

---

### T-012: cdk-handler.ts の段階的修正実行
**目的**: 25エラーの段階的解消

**事前条件**:
- [ ] T-011完了済み

**依存関係**: T-011

**所要時間**: 16-24時間

---

### T-013: handlebars-official-helpers.ts の修正
**目的**: 17エラーの解消

**事前条件**:
- [ ] T-012完了済み

**依存関係**: T-012

**所要時間**: 10-14時間

---

## Phase 4: 完了・検証（2-3日）

### T-014: 残存エラーの完全解消
**目的**: 残り全ファイルのエラー修正

**事前条件**:
- [ ] Phase 3完了済み

**依存関係**: T-013

**対象ファイル**:
- src/cli/handlers/validation.ts (10エラー)
- src/core/formatters/html/index.ts (8エラー)
- src/validation/cdk-validator.ts (2エラー)
- src/security/sanitizer.ts (1エラー)

**所要時間**: 8-12時間

---

### T-015: 品質確認とテスト実行
**目的**: プロジェクト全体の品質基準達成確認

**事前条件**:
- [ ] T-014完了済み

**依存関係**: T-014

**詳細作業手順**:
1. TypeScript型チェック: `npx tsc --noEmit`
2. ESLint実行: `npm run lint src/`
3. 全テストスイート: `npm test`
4. ビルド確認: `npm run build`
5. CLAUDE.md品質基準確認

**完了条件**:
- [ ] any型関連ESLintエラー 0個
- [ ] TypeScriptコンパイルエラー 0個
- [ ] 全テストパス
- [ ] ビルド成功

**所要時間**: 4-6時間

---

## 🛡️ 共通ガイドライン

### 各タスク共通の作業前チェック
1. 現在のブランチ確認: `git branch`
2. 作業前バックアップ: `git add . && git commit -m "Backup before Task X"`
3. 現在のエラー数確認: `npm run lint src/ | grep -c "error"`

### 緊急時対応手順
```bash
# 直前のコミットに戻る
git reset --hard HEAD~1

# 特定のバックアップに戻る
git reset --hard backup-tag-name

# ブランチを削除してやり直し
git checkout main && git branch -D feature-branch
```

### 品質チェック項目（各タスク完了時）
- [ ] TypeScript型チェック: `npx tsc --noEmit`
- [ ] ESLint実行: `npm run lint src/`
- [ ] 関連テスト実行
- [ ] エラー数の削減確認