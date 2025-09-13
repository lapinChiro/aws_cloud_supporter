# ESLint エラーレポート

## 概要

- **総問題数**: 392
- **エラー**: 381
- **警告**: 11

## エラータイプ別統計

### TypeScript関連エラー (269件)

#### 1. @typescript-eslint/no-use-before-define (78件)
定義前に関数や変数が使用されている問題。

主な発生ファイル:
- tests/integration/cdk-official-migration.test.ts (30件)
- tests/integration/cdk-mvp.test.ts (18件)
- tests/integration/cdk-full-features.test.ts (13件)

#### 2. @typescript-eslint/no-redundant-type-constituents (60件)
Union型で文字列リテラルとstringが重複している問題。

主な発生ファイル:
- src/types/cloudformation.ts (42件)
- src/types/common.ts (12件)

#### 3. @typescript-eslint/prefer-nullish-coalescing (36件)
論理OR演算子(`||`)の代わりにnullish合体演算子(`??`)を使用すべき問題。

主な発生ファイル:
- tests/integration/ 内の各テストファイル
- src/templates/handlebars-official-helpers.ts
- src/utils/schema-validator.ts

#### 4. @typescript-eslint/no-unsafe-assignment (29件)
`any`型の値の安全でない代入。

主な発生ファイル:
- tests/integration/cdk-mvp.test.ts (11件)
- tests/unit/cdk/template-adapted.test.ts (8件)
- tests/unit/cdk/template-official.test.ts (5件)

#### 5. @typescript-eslint/no-explicit-any (13件)
明示的な`any`型の使用。

主な発生ファイル:
- tests/unit/cli/commands.test.ts (3件)
- tests/integration/cdk-mvp.test.ts (3件)
- tests/unit/cdk/cdk-official-generator-adapted.test.ts (2件)

#### 6. @typescript-eslint/no-unused-vars (12件)
未使用の変数。

主な発生ファイル:
- src/types/cdk-business.ts (4件)
- tests/integration/cdk-full-features.test.ts (1件)
- tests/integration/cdk-mvp.test.ts (1件)

#### 7. @typescript-eslint/no-unsafe-member-access (20件)
`any`型の値に対する安全でないメンバーアクセス。

主な発生ファイル:
- tests/integration/cdk-mvp.test.ts (10件)
- tests/integration/cdk-full-features.test.ts (4件)

#### 8. @typescript-eslint/explicit-module-boundary-types (14件)
関数の戻り値の型が明示されていない。

主な発生ファイル:
- src/utils/logger.ts (14件)

#### 9. @typescript-eslint/no-non-null-assertion (10件)
非nullアサーション(`!`)の使用。

主な発生ファイル:
- tests/e2e/cli.e2e.test.ts (5件)
- tests/integration/cdk-mvp.test.ts (4件)
- tests/integration/cdk-full-features.test.ts (1件)

### コードサイズ関連エラー (17件)

#### 1. max-lines-per-function (11件)
関数の行数が300行を超えている。

発生ファイル:
- tests/unit/generators/base-optimization.test.ts (458行)
- tests/integration/cdk-full-features.test.ts (423行)
- tests/integration/cdk-mvp.test.ts (404行)
- tests/integration/metrics-analyzer.integration.test.ts (581行)
- tests/unit/cli/commands.test.ts (480行)
- tests/security/cdk-security.test.ts (433行)
- tests/unit/utils/schema-validator.test.ts (376行)
- tests/unit/core/json-formatter.test.ts (363行)
- tests/integration/analyzer-integration.test.ts (359行)
- tests/unit/core/analyzer-coverage.test.ts (319行)
- tests/unit/core/html-formatter.test.ts (319行)

#### 2. max-lines (6件)
ファイルの行数が500行を超えている。

発生ファイル:
- tests/unit/generators/base.generator.test.ts (965行)
- tests/unit/core/extractor.test.ts (758行)
- tests/integration/metrics-analyzer.integration.test.ts (638行)
- tests/unit/cli/commands.test.ts (503行)
- tests/unit/config/metrics-definitions.test.ts (501行)
- tests/unit/generators/base-optimization.test.ts (501行)

### その他のエラー (12件)

#### 1. @typescript-eslint/no-shadow (6件)
上位スコープの変数名と重複。

主な発生ファイル:
- tests/unit/core/extractor.test.ts (3件)

#### 2. no-console (4件)
console.log等の使用。

発生ファイル:
- src/utils/logger.ts (2件)
- tests/fixtures/templates/large-template-generator.ts (1件)
- tests/setup.ts (1件)

#### 3. その他 (2件)
- @typescript-eslint/no-unsafe-call
- @typescript-eslint/no-unnecessary-type-parameters

## ファイル別エラー詳細

### 最もエラーの多いファイル

1. **src/types/cloudformation.ts** - 42エラー
   - すべて@typescript-eslint/no-redundant-type-constituents

2. **tests/integration/cdk-official-migration.test.ts** - 30エラー
   - 主に@typescript-eslint/no-use-before-define

3. **tests/integration/cdk-mvp.test.ts** - 49エラー（複合）
   - @typescript-eslint/no-use-before-define
   - @typescript-eslint/no-unsafe-assignment
   - @typescript-eslint/no-unsafe-member-access
   - など

4. **tests/integration/cdk-full-features.test.ts** - 36エラー（複合）
   - @typescript-eslint/no-use-before-define
   - @typescript-eslint/prefer-nullish-coalescing
   - など

## 優先対処事項

### 1. 高優先度（システムの安定性に影響）
- **@typescript-eslint/no-explicit-any** - 型安全性の欠如
- **@typescript-eslint/no-unsafe-assignment** - 実行時エラーのリスク
- **@typescript-eslint/no-unsafe-member-access** - 実行時エラーのリスク
- **@typescript-eslint/no-non-null-assertion** - null参照エラーのリスク

### 2. 中優先度（コード品質）
- **max-lines-per-function** - 可読性とメンテナンス性
- **max-lines** - ファイルの複雑さ
- **@typescript-eslint/no-unused-vars** - 不要なコード

### 3. 低優先度（コーディングスタイル）
- **@typescript-eslint/prefer-nullish-coalescing** - より安全な演算子の使用
- **@typescript-eslint/no-use-before-define** - コードの整理
- **@typescript-eslint/no-redundant-type-constituents** - 型定義の簡潔化

## 推奨修正アプローチ

1. **型安全性の問題を優先的に解決**
   - `any`型の使用を適切な型に置き換え
   - 非nullアサーションを適切なnullチェックに置き換え

2. **大きなファイル/関数の分割**
   - 300行を超える関数を小さな関数に分割
   - 500行を超えるファイルを複数のファイルに分割

3. **自動修正可能な問題の一括修正**
   - `npm run lint -- --fix` で自動修正可能な問題を解決
   - 特に `prefer-nullish-coalescing` など

4. **テストファイルの整理**
   - `no-use-before-define` エラーが多いテストファイルで、ヘルパー関数を適切な位置に移動