# Knip導入調査レポート

## 概要

Knipは、JavaScript・TypeScriptプロジェクトにおける未使用のファイル、依存関係、エクスポートを自動検出・削除するためのオープンソースツールです。コードベースのクリーンアップとメンテナンスを効率化し、プロジェクトの品質向上に貢献します。

## 主な機能

### 1. 検出機能

- **未使用ファイル**: どこからもインポートされていないファイル
- **未使用依存関係**: package.jsonに記載されているが、コードで使用されていないパッケージ
- **未使用エクスポート**: エクスポートされているが、どこでも使用されていない関数・定数・クラス
- **不足する依存関係**: 直接使用しているが、package.jsonに明記されていない依存関係
- **重複エクスポート**: 重複しているエクスポート
- **未使用クラスメンバー**: 未使用のクラス・Enumメンバー

### 2. フレームワーク・ツールサポート

- 100以上のプラグインを内蔵
- 対応フレームワーク: Astro, Next.js, Remix, Svelte, Vite等
- 対応ツール: ESLint, Jest, Cypress, Storybook, Webpack等

### 3. モノレポサポート

- ワークスペース対応
- 複数パッケージの一括管理

## インストールと基本使用方法

### 推奨インストール方法

```bash
# 推奨: 自動設定
npm init @knip/config

# マニュアルインストール
npm install -D knip typescript @types/node
```

### 基本実行

```bash
# 基本実行
npx knip

# プロダクションモード
npx knip --production

# 自動修正
npx knip --fix
```

## 設定方法

### 設定ファイルオプション（優先度順）

1. `knip.json`, `knip.jsonc`
2. `knip.js`
3. `knip.ts`
4. `package.json`の"knip"フィールド

### 基本設定例（knip.json）

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": ["src/index.ts"],
  "project": ["src/**/*.ts"],
  "ignore": ["**/*.test.ts", "**/*.spec.ts"],
  "ignoreDependencies": ["husky", "lint-staged"],
  "ignoreBinaries": ["docker-compose"],
  "ignoreExportsUsedInFile": true
}
```

### TypeScript設定例（knip.ts）

```typescript
import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['src/index.ts', 'src/cli.ts'],
  project: ['src/**/*.ts'],
  ignore: ['**/*.test.ts', '**/*.spec.ts'],
  ignoreDependencies: ['husky', 'lint-staged'],
  ignoreBinaries: ['docker-compose'],
  ignoreExportsUsedInFile: true,
  
  // モノレポ設定
  workspaces: {
    '.': {
      entry: ['scripts/*.js'],
      project: ['scripts/**/*.js']
    },
    'packages/*': {
      entry: ['src/index.ts'],
      project: ['src/**/*.ts']
    }
  }
};

export default config;
```

## プロダクションモード

### 概要

- プロダクションコードに焦点を当てた厳格な分析モード
- テストファイルや設定ファイルを除外した分析が可能

### 設定方法

```json
{
  "entry": ["src/index.ts!"],
  "project": ["src/**/*.ts!", "!src/**/*.test.ts"]
}
```

### 実行

```bash
npx knip --production
```

## CI/CD統合

### GitHub Actions基本設定

```yaml
name: Lint project
on: push
jobs:
  lint:
    runs-on: ubuntu-latest
    name: Ubuntu/Node v20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Install dependencies
        run: npm install --ignore-scripts
      - name: Run knip
        run: npm run knip
```

### Knip Reporterアクション

GitHub Marketplaceで提供されている「Knip Reporter」アクションを使用すると、プルリクエストにコメント形式でレポートを投稿可能

### プロダクション環境向け設定

```yaml
- name: Run knip (production mode)
  run: npm run knip -- --production

- name: Run knip with cache
  run: npm run knip -- --cache

- name: Run knip (non-blocking initially)
  run: npm run knip -- --no-exit-code
  continue-on-error: true
```

## ベストプラクティス

### 1. 段階的導入

- 初期は`--no-exit-code`フラグでCI/CDを中断させない
- 徐々にコードベースをクリーンアップ
- 最終的にCI/CDでの強制チェックを有効化

### 2. 設定の最適化

- `entry`と`project`パターンの正確な設定が重要
- パフォーマンス向上のため適切なパターン指定
- `--debug`と`--performance`フラグで最適化ポイントを特定

### 3. プロダクションモードの活用

- メインブランチではプロダクションモードを使用
- テストコードの影響を除外した真の未使用コード検出

### 4. CI/CDでの継続的監視

- 定期実行で新しい未使用コードの発生を防止
- プルリクエストレビューでの自動チェック

### 5. 段階的クリーンアップ

- 大量のレポート結果に overwhelm されないよう段階的に対応
- 重要度の高い項目から優先的に対応

## パフォーマンス考慮事項

### 大規模プロジェクト対応

- キャッシュ機能（`--cache`）の活用
- 適切な`entry`・`project`パターン設定
- 大規模モノレポでは個別ワークスペースでの実行も検討

## 実績・導入事例

- **Vercel**: 300K行の未使用コードを削除
- **Microsoft**, **Shopify**等の大手企業で採用
- 数千のプロジェクトで使用実績

## 要求事項

- **Node.js**: v18.18.0以上（または Bun）
- **TypeScript**: プロジェクトで使用時は必須
- **@types/node**: TypeScript使用時に推奨

## 推奨導入手順

### Phase 1: 調査・準備

1. 現在のプロジェクト構造の把握
2. Knipのインストール（`npm init @knip/config`）
3. 初回実行とレポート確認

### Phase 2: 設定・チューニング

1. プロジェクトに適した設定ファイルの作成
2. 無視パターンの調整
3. プラグイン設定の最適化

### Phase 3: CI/CD統合

1. GitHub Actionsワークフローの設定
2. 非ブロッキングモードでの運用開始
3. プルリクエストレビューでの自動化

### Phase 4: 本格運用

1. 未使用コードの段階的クリーンアップ
2. プロダクションモードの有効化
3. 強制チェックの導入

## 期待効果

### 開発効率向上

- コードベースの軽量化
- ビルド時間の短縮
- メンテナンス負荷の削減

### 品質向上

- 未使用依存関係の削除
- バンドルサイズの最適化
- 技術的負債の削減

### チーム生産性

- コードレビューの効率化
- リファクタリングの安全性向上
- 新規開発者のオンボーディング効率化

## 注意事項

### 初期設定時の考慮点

- 偽陽性（false positive）の可能性
- プロジェクト特有の設定が必要な場合がある
- 大規模プロジェクトでは初回実行時間が長い

### 運用時の注意点

- 動的インポートの検出限界
- テンプレート文字列でのインポート検出困難
- プラグイン設定が不完全な場合の誤検出

## まとめ

Knipは、現代のJavaScript/TypeScriptプロジェクトにとって価値の高いツールです。適切な設定と段階的な導入により、コードベースの品質向上と開発効率の改善が期待できます。特に大規模プロジェクトやモノレポ環境での効果は顕著で、継続的なCI/CD統合により長期的なメンテナンス性の向上に寄与します。

導入時は初期設定に多少の工数を要しますが、その後の自動化により開発チームの生産性向上と技術的負債の削減を実現できる、投資対効果の高いツールと評価できます。
