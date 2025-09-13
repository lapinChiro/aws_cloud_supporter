# ESLint エラー修正タスク一覧

## 作業環境
- ブランチ: `fix/lint-async-errors`から新規ブランチを作成
- Node.js: v18以上
- 作業前に`npm install`を実行

## タスク一覧

### TASK-001: 型定義ファイル - redundant-type-constituents修正

**タスクID**: TASK-001  
**推定時間**: 30分  
**難易度**: 低  
**担当者**: 未アサイン

**目的**: Union型の重複を解消し、型定義を簡潔化する

**概要**: 
cloudformation.tsとcommon.tsでUnion型に含まれる文字列リテラルとstringの重複を削除します。
文字列リテラルの型を残し、汎用的な`string`を削除します。

**事前条件**:
- リポジトリのクローンが完了している
- Node.js v18以上がインストールされている
- `fix/lint-async-errors`ブランチが最新状態

**作業手順**:
1. 新規ブランチ作成: `git checkout -b fix/task-001-type-redundancy`
2. 以下のファイルを修正:
   - `src/types/cloudformation.ts` (42エラー)
   - `src/types/common.ts` (12エラー)

**修正例**:
```typescript
// 修正前
type DBInstanceClass = 'db.t3.micro' | 'db.t3.small' | string;

// 修正後
type DBInstanceClass = 'db.t3.micro' | 'db.t3.small';
// または、stringが必要な場合
type DBInstanceClass = string; // リテラル型を削除
```

**確認コマンド**:
```bash
# 対象ファイルのエラー確認
npx eslint src/types/cloudformation.ts src/types/common.ts

# 型チェック
npm run typecheck

# 関連テスト実行
npm test -- --testPathPattern="types|cloudformation|common"
```

**完了条件**:
- [ ] src/types/cloudformation.tsのno-redundant-type-constituentsエラーが0
- [ ] src/types/common.tsのno-redundant-type-constituentsエラーが0
- [ ] `npm run typecheck`が成功
- [ ] 関連テストが全て成功

**依存関係**: なし

---

### TASK-002: 型定義ファイル - 未使用変数とアサーション修正

**タスクID**: TASK-002  
**推定時間**: 20分  
**難易度**: 低  
**担当者**: 未アサイン

**目的**: 未使用変数の警告を解消し、型アサーションを改善する

**概要**: 
cdk-business.tsの未使用変数にアンダースコアプレフィックスを追加し、
test-types.tsの型アサーションを修正します。

**事前条件**:
- TASK-001と同じ環境設定
- TASK-001と並行作業可能

**作業手順**:
1. 新規ブランチ作成: `git checkout -b fix/task-002-unused-vars`
2. 以下のファイルを修正:
   - `src/types/cdk-business.ts` (4エラー)
   - `src/types/internal/test-types.ts` (1警告)

**修正例**:
```typescript
// 修正前 (cdk-business.ts:72)
const { constructId, severity, resourceLogicalId, resourceType } = alarm;

// 修正後
const { constructId: _constructId, severity: _severity, 
        resourceLogicalId: _resourceLogicalId, resourceType: _resourceType } = alarm;

// 修正前 (test-types.ts)
return { ...baseResult } as ExtendedAnalysisResult;

// 修正後
const result: ExtendedAnalysisResult = { ...baseResult };
return result;
```

**確認コマンド**:
```bash
# エラー確認
npx eslint src/types/cdk-business.ts src/types/internal/test-types.ts

# 型チェック
npm run typecheck
```

**完了条件**:
- [ ] 対象ファイルのエラー/警告が0
- [ ] 変数名の変更が他のコードに影響していない

**依存関係**: なし（TASK-001と並行可能）

---

### TASK-003: logger.ts修正 - console文と戻り値型

**タスクID**: TASK-003  
**推定時間**: 45分  
**難易度**: 中  
**担当者**: 未アサイン

**目的**: console文を適切なロギング実装に置き換え、関数の戻り値型を明示する

**概要**: 
src/utils/logger.tsのconsole文を削除し、14個の関数に適切な戻り値型を追加します。

**事前条件**:
- logger.tsの既存実装を理解している
- TypeScriptの戻り値型に関する知識

**作業手順**:
1. 新規ブランチ作成: `git checkout -b fix/task-003-logger`
2. `src/utils/logger.ts`を修正

**修正内容**:
1. console文の削除（129行、131行）
   - 既存のLoggerクラスのメソッドを使用するよう変更
2. 以下の関数に戻り値型を追加（233-249行）:
   - `create()`, `child()`, `trace()`, `debug()`, `info()`, `warn()`, 
   - `error()`, `fatal()`, `setLevel()`, `getLevel()`, `isLevelEnabled()`,
   - `addContext()`, `removeContext()`, `clearContext()`

**修正例**:
```typescript
// 修正前
console.log('Logger initialized');

// 修正後
// 削除（初期化ログが必要な場合は、Logger自体を使用）

// 修正前
trace(message: string, ...args: any[]) {
  this.log('trace', message, ...args);
}

// 修正後
trace(message: string, ...args: any[]): void {
  this.log('trace', message, ...args);
}
```

**確認コマンド**:
```bash
# エラー確認
npx eslint src/utils/logger.ts

# logger.tsを使用しているファイルの動作確認
npm test -- --testPathPattern="logger"
```

**完了条件**:
- [ ] logger.tsのエラーが0
- [ ] console出力が適切に置き換えられている
- [ ] 既存のログ出力が正常に動作する

**依存関係**: TASK-001, TASK-002（型定義の変更が影響する可能性）

---

### TASK-004: srcディレクトリ小規模修正

**タスクID**: TASK-004  
**推定時間**: 30分  
**難易度**: 低  
**担当者**: 未アサイン

**目的**: srcディレクトリ内の小規模なエラーを一括修正

**概要**: 
複数ファイルの`||`→`??`変換、テンプレートリテラル修正、定義順序修正、未使用変数削除を行います。

**事前条件**:
- nullish合体演算子(`??`)の動作を理解している

**対象ファイル**:
| ファイル | エラー内容 | 修正内容 |
|----------|-----------|----------|
| src/utils/schema-validator.ts | prefer-nullish-coalescing (3) | `\|\|` → `??` |
| src/utils/error.ts | restrict-template-expressions (1) | undefined チェック追加 |
| src/templates/handlebars-official-helpers.ts | prefer-nullish-coalescing (2), no-unused-vars (1) | `\|\|` → `??`、変数削除 |
| src/cli/handlers/cdk-handler.ts | no-use-before-define (1) | 関数定義を移動 |
| src/security/input-validator.ts | restrict-template-expressions (2) | undefined チェック追加 |
| src/validation/cdk-validator.ts | no-unused-vars (1) | 変数削除 |

**修正例**:
```typescript
// prefer-nullish-coalescing
const value = options.default || 'defaultValue';  // 修正前
const value = options.default ?? 'defaultValue';  // 修正後

// restrict-template-expressions
`Error: ${error.message}`;  // 修正前（errorがundefinedの可能性）
`Error: ${error?.message ?? 'Unknown error'}`;  // 修正後
```

**確認コマンド**:
```bash
# 個別ファイル確認
npx eslint src/utils/schema-validator.ts
npx eslint src/utils/error.ts
# ... 各ファイル

# 修正後の動作確認
npm test -- --testPathPattern="schema-validator|error|handlebars|cdk-handler|input-validator|cdk-validator"
```

**完了条件**:
- [ ] 全対象ファイルのエラーが0
- [ ] `||`から`??`への変更で動作が変わっていない（falsyな値の扱い）

**依存関係**: TASK-001, TASK-002（型定義の変更が影響する可能性）

---

### TASK-005: 自動修正の実行と確認

**タスクID**: TASK-005  
**推定時間**: 30分  
**難易度**: 低  
**担当者**: 未アサイン

**目的**: ESLintの自動修正機能で解決可能なエラーを一括修正

**概要**: 
`npm run lint -- --fix`を実行し、自動修正された内容を確認・検証します。

**事前条件**:
- TASK-001〜004が完了している
- すべての変更がコミットされている

**作業手順**:
1. 新規ブランチ作成: `git checkout -b fix/task-005-auto-fix`
2. 現在のエラー数を記録
3. 自動修正実行: `npm run lint -- --fix`
4. 修正内容を確認: `git diff`
5. 意図しない変更がないか検証
6. テスト実行

**確認項目**:
- [ ] falsyな値の扱いが変わっていないか（`||`→`??`の変換）
- [ ] 型アサーションの変更が適切か
- [ ] インデントやフォーマットの変更が妥当か

**確認コマンド**:
```bash
# 修正前のエラー数記録
npm run lint 2>&1 | grep "error" | tail -1

# 自動修正
npm run lint -- --fix

# 修正後のエラー数確認
npm run lint 2>&1 | grep "error" | tail -1

# 全テスト実行
npm test
```

**完了条件**:
- [ ] 自動修正可能なエラーがすべて解消
- [ ] 意図しない動作変更がない
- [ ] 全テストが成功

**依存関係**: TASK-001〜004完了後

---

### TASK-006: 複雑なintegrationテストファイル修正

**タスクID**: TASK-006  
**推定時間**: 3時間  
**難易度**: 高  
**担当者**: 未アサイン

**目的**: エラー数の多い3つのintegrationテストファイルを修正

**概要**: 
any型の適切な型付け、定義順序の修正、non-nullアサーションの置き換えを行います。

**対象ファイル**:
1. `tests/integration/cdk-mvp.test.ts` (49エラー)
2. `tests/integration/cdk-full-features.test.ts` (36エラー)
3. `tests/integration/cdk-official-migration.test.ts` (30エラー)

**主な修正内容**:
1. **no-use-before-define**: ヘルパー関数をファイル上部に移動
2. **no-explicit-any**: 適切な型を調査して置き換え
3. **no-unsafe-assignment/member-access**: any型を具体的な型に
4. **no-non-null-assertion**: 適切なnullチェックに置き換え

**修正例**:
```typescript
// no-use-before-define
// 修正前: 使用後に定義
const result = runCLICommand(args);
function runCLICommand(args: string[]) { ... }

// 修正後: 定義を上部に移動
function runCLICommand(args: string[]) { ... }
const result = runCLICommand(args);

// no-non-null-assertion
// 修正前
const value = data.result!;

// 修正後
if (!data.result) {
  throw new Error('Result is undefined');
}
const value = data.result;
```

**確認コマンド**:
```bash
# 各ファイルのエラー確認
npx eslint tests/integration/cdk-mvp.test.ts
npx eslint tests/integration/cdk-full-features.test.ts
npx eslint tests/integration/cdk-official-migration.test.ts

# テスト実行
npm test -- tests/integration/cdk-mvp.test.ts
npm test -- tests/integration/cdk-full-features.test.ts
npm test -- tests/integration/cdk-official-migration.test.ts
```

**完了条件**:
- [ ] 3ファイルのエラーが0
- [ ] テストが全て成功
- [ ] any型の使用が最小限

**依存関係**: TASK-001〜005完了後（特に型定義の変更）

---

### TASK-007: unit/cdkディレクトリのテスト修正

**タスクID**: TASK-007  
**推定時間**: 2時間  
**難易度**: 中  
**担当者**: 未アサイン

**目的**: unit/cdkディレクトリ内のテストファイルのエラーを修正

**概要**: 
主にno-use-before-defineエラーとany型関連のエラーを修正します。

**対象ファイル**:
- tests/unit/cdk/配下の全ファイル（約15ファイル）

**作業内容**:
1. 各ファイルのヘルパー関数を適切な位置に移動
2. any型を具体的な型に置き換え
3. 型アサーションの改善

**優先順位**:
1. エラー数の多いファイルから修正
2. 相互に依存するファイルはまとめて修正

**確認コマンド**:
```bash
# ディレクトリ全体のエラー確認
npx eslint tests/unit/cdk/

# テスト実行
npm test -- tests/unit/cdk/
```

**完了条件**:
- [ ] tests/unit/cdk/配下のエラーが0
- [ ] 全テストが成功

**依存関係**: TASK-006完了後（パターンを参考にできる）

---

### TASK-008: 大規模リファクタリング - 長い関数の分割

**タスクID**: TASK-008  
**推定時間**: 4時間  
**難易度**: 高  
**担当者**: 未アサイン

**目的**: 300行を超える関数を適切なサイズに分割

**概要**: 
max-lines-per-functionエラーがある11個の関数を、機能単位で分割します。

**対象（優先順位順）**:
1. tests/integration/metrics-analyzer.integration.test.ts (581行)
2. tests/unit/cli/commands.test.ts (480行)
3. tests/unit/generators/base-optimization.test.ts (458行)
4. その他8ファイル

**リファクタリング方針**:
1. テストケースごとにヘルパー関数を抽出
2. 共通のセットアップ・ティアダウンを別関数に
3. アサーション部分を専用関数に分離
4. 1関数は最大250行を目安に

**作業例**:
```typescript
// 修正前: 1つの巨大なテスト
describe('Analyzer', () => {
  it('should analyze metrics', async () => {
    // 500行のテストコード
  });
});

// 修正後: 機能ごとに分割
describe('Analyzer', () => {
  const setupTestData = () => { ... };
  const createMockAnalyzer = () => { ... };
  const assertMetricsOutput = (result, expected) => { ... };
  
  it('should analyze metrics', async () => {
    const data = setupTestData();
    const analyzer = createMockAnalyzer();
    const result = await analyzer.analyze(data);
    assertMetricsOutput(result, expectedOutput);
  });
});
```

**確認コマンド**:
```bash
# 関数の行数確認
npx eslint [ファイル名] --rule 'max-lines-per-function: ["error", 300]'

# リファクタリング後のテスト
npm test -- [テストファイル名]
```

**完了条件**:
- [ ] 全関数が300行以下
- [ ] テストの可読性が向上
- [ ] テストカバレッジが維持されている

**依存関係**: TASK-001〜007完了後

---

### TASK-009: 大規模リファクタリング - 長いファイルの分割

**タスクID**: TASK-009  
**推定時間**: 3時間  
**難易度**: 高  
**担当者**: 未アサイン

**目的**: 500行を超えるファイルを適切なサイズに分割

**概要**: 
max-linesエラーがある6個のファイルを、機能単位で複数ファイルに分割します。

**対象ファイル**:
1. tests/unit/generators/base.generator.test.ts (965行)
2. tests/unit/core/extractor.test.ts (758行)
3. その他4ファイル

**分割方針**:
1. 関連するテストケースごとにファイルを分割
2. 共通ユーティリティは別ファイルに抽出
3. 1ファイルは最大400行を目安に

**確認コマンド**:
```bash
# ファイルの行数確認
wc -l [ファイル名]

# 分割後のテスト実行
npm test -- tests/unit/generators/
npm test -- tests/unit/core/
```

**完了条件**:
- [ ] 全ファイルが500行以下
- [ ] インポート関係が適切
- [ ] テストの実行順序に依存関係がない

**依存関係**: TASK-008と並行可能

---

### TASK-010: 残りのテストファイル修正

**タスクID**: TASK-010  
**推定時間**: 2時間  
**難易度**: 中  
**担当者**: 未アサイン

**目的**: 残りのテストファイルのエラーを全て解消

**概要**: 
これまでのタスクで対応していないテストファイルのエラーを修正します。

**対象**:
- tests/e2e/
- tests/security/ (TASK-008で一部対応済み)
- tests/helpers/
- tests/fixtures/
- その他のunit/integrationテスト

**確認コマンド**:
```bash
# 全体のエラー確認
npm run lint

# 残エラーの詳細確認
npm run lint 2>&1 | grep -v "^$" | grep -A 1 "error"
```

**完了条件**:
- [ ] `npm run lint`でエラー0
- [ ] 全テストが成功

**依存関係**: TASK-001〜009完了後

---

## 最終確認チェックリスト

### PR作成前の確認
- [ ] `npm run lint`でエラーが0
- [ ] `npm run typecheck`が成功
- [ ] `npm test`が全て成功
- [ ] 不要なコメントやデバッグコードが残っていない
- [ ] package.jsonやpackage-lock.jsonに変更がない

### ブランチ戦略
1. 各タスクは個別ブランチで作業
2. タスク完了後、`fix/lint-async-errors`にマージ
3. 全タスク完了後、mainへのPRを作成

### 進捗報告
- 各タスク完了時にSlack/Teamsで報告
- ブロッカーがある場合は即座に共有
- 予定時間を大幅に超える場合は事前に連絡