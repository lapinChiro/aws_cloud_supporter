# ESLint エラー修正計画

## 概要
総エラー数: 392個（エラー: 381、警告: 11）を体系的に解消する計画。

## 基本方針
1. **ファイル単位での修正** - 同じファイルを複数回編集しない
2. **依存関係の考慮** - src/ → tests/ の順序で修正
3. **影響範囲の大きい修正を優先** - 型定義から開始
4. **効率性の最大化** - 関連エラーをまとめて処理

## 修正フェーズ

### フェーズ1: 型定義ファイルの完全修正（58エラー + 1警告）
**理由**: 型定義の変更は全コードベースに影響するため最優先

| ファイル | エラー数 | エラータイプ |
|----------|----------|--------------|
| src/types/cloudformation.ts | 42 | no-redundant-type-constituents |
| src/types/common.ts | 12 | no-redundant-type-constituents |
| src/types/cdk-business.ts | 4 | no-unused-vars |
| src/types/internal/test-types.ts | 1警告 | consistent-type-assertions |

**作業内容**:
- Union型から重複する`string`を削除
- 未使用変数にアンダースコアプレフィックスを追加
- 型アサーションの修正

### フェーズ2: srcディレクトリの修正（26エラー + 3警告）

| ファイル | エラー/警告 | 修正内容 |
|----------|-------------|----------|
| src/utils/logger.ts | 16エラー | console削除、戻り値型追加 |
| src/utils/schema-validator.ts | 3エラー | `||` → `??` |
| src/utils/error.ts | 1警告 | テンプレートリテラル修正 |
| src/templates/handlebars-official-helpers.ts | 3エラー | `||` → `??`、未使用変数 |
| src/cli/handlers/cdk-handler.ts | 1エラー | 定義順序修正 |
| src/security/input-validator.ts | 2警告 | テンプレートリテラル修正 |
| src/validation/cdk-validator.ts | 1エラー | 未使用変数削除 |

### フェーズ3: 自動修正の一括実行
```bash
npm run lint -- --fix
```

**対象エラー**:
- prefer-nullish-coalescing（残り）
- consistent-type-assertions（残り）
- その他の自動修正可能なエラー

**実行後の確認**:
1. `npm run lint`で残エラー確認
2. `npm test`で動作確認
3. 意図しない変更がないかレビュー

### フェーズ4: テストファイルの体系的修正（約280エラー）

#### 4-1: 最も複雑なテストファイル（115エラー）
優先理由: エラー数が多く、他のテストのパターンになる

| ファイル | エラー数 | 主なエラー |
|----------|----------|------------|
| tests/integration/cdk-mvp.test.ts | 49 | any型、定義順序、non-null assertion |
| tests/integration/cdk-full-features.test.ts | 36 | 定義順序、nullish-coalescing |
| tests/integration/cdk-official-migration.test.ts | 30 | 定義順序 |

#### 4-2: 中規模テストファイル（約100エラー）
| ディレクトリ | 主な作業 |
|--------------|----------|
| tests/unit/cdk/ | 定義順序、any型修正 |
| tests/unit/cli/commands.test.ts | any型、max-lines対応 |
| tests/unit/core/extractor.test.ts | shadow変数、max-lines対応 |

#### 4-3: その他のテストファイル（約65エラー）
- tests/e2e/
- tests/security/
- tests/helpers/
- tests/fixtures/
- 残りのunit/integrationテスト

### フェーズ5: 大規模リファクタリング（17エラー）

#### 対象ファイル（行数超過）

**関数が長すぎる（max-lines-per-function）**:
1. tests/integration/metrics-analyzer.integration.test.ts (581行)
2. tests/unit/cli/commands.test.ts (480行)
3. tests/unit/generators/base-optimization.test.ts (458行)
4. tests/security/cdk-security.test.ts (433行)
5. tests/integration/cdk-full-features.test.ts (423行)
6. tests/integration/cdk-mvp.test.ts (404行)
7. その他5ファイル

**ファイルが長すぎる（max-lines）**:
1. tests/unit/generators/base.generator.test.ts (965行)
2. tests/unit/core/extractor.test.ts (758行)
3. tests/integration/metrics-analyzer.integration.test.ts (638行)
4. その他3ファイル

**リファクタリング方法**:
- テストケースの分割
- ヘルパー関数の別ファイル化
- 関連テストのグループ化

## 進捗管理

### チェックポイント
- [ ] フェーズ1完了: 型定義エラー 0
- [ ] フェーズ2完了: src/ディレクトリエラー 0
- [ ] フェーズ3完了: 自動修正完了
- [ ] フェーズ4-1完了: 主要テストファイル修正
- [ ] フェーズ4-2完了: 中規模テストファイル修正
- [ ] フェーズ4-3完了: その他テストファイル修正
- [ ] フェーズ5完了: すべてのエラー解消

### 確認コマンド
```bash
# エラー数の確認
npm run lint 2>&1 | grep "error" | tail -1

# 特定ファイルのエラー確認
npx eslint [ファイルパス]

# テスト実行
npm test
```

## リスクと対策

| リスク | 対策 |
|--------|------|
| 型定義変更による波及影響 | 各フェーズ後にテスト実行 |
| 自動修正による意図しない変更 | 修正後の差分レビュー |
| 大規模リファクタリングの複雑性 | 段階的なコミット |

## 推定作業時間
- フェーズ1: 1時間
- フェーズ2: 1時間
- フェーズ3: 30分
- フェーズ4: 4-6時間
- フェーズ5: 2-3時間

**合計**: 8-12時間（1.5-2日）