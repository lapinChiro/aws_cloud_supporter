# cfn-diagram 使い方ガイド

## 概要

cfn-diagramは、CloudFormation/SAM/CDKテンプレートを視覚的な図に変換するCLIツールです。5つの出力形式をサポートし、開発からドキュメント作成まで幅広いシーンで活用できます。

## クイックスタート

```bash
# インストール
npm i -g @mhlabs/cfn-diagram

# 最も簡単な使い方（インタラクティブなHTML図を生成）
cfn-dia html -t template.yaml

# テキストベースで確認
cfn-dia ascii-art -t template.yaml
```

## 出力形式の選び方

| 形式          | 用途                   | 特徴                                          | コマンド            |
| ------------- | ---------------------- | --------------------------------------------- | ------------------- |
| **HTML**      | インタラクティブな探索 | ドラッグ可能、フィルタリング機能、詳細表示    | `cfn-dia html`      |
| **Draw.io**   | 図の編集・カスタマイズ | 編集可能、プレゼン資料作成に最適              | `cfn-dia draw.io`   |
| **ASCII Art** | ターミナルでの確認     | インストール不要、CI/CDログで確認可能         | `cfn-dia ascii-art` |
| **Mermaid**   | ドキュメント埋め込み   | Markdown対応、GitHub/GitLabで自動レンダリング | `cfn-dia mermaid`   |
| **Browse**    | デプロイ済みスタック   | AWS上の実際のスタックを可視化                 | `cfn-dia browse`    |

## 共通オプション

多くのコマンドで使用される共通オプション：

- `-t, --template-file [file]` - テンプレートファイルのパス（デフォルト: template.yaml または cdk.json）
- `--stacks [names]` - 表示するスタック名（カンマ区切り、CDKの複数スタック対応）
- `-co, --cdk-output [path]` - CDK synthの出力パス（デフォルト: cdk.out）
- `-s, --skip-synth` - CDK synthをスキップ

## 各コマンドの詳細

### 1. HTML - インタラクティブなブラウザ表示

vis.jsを使用した、最も機能豊富な出力形式です。

#### 使用例

```bash
# 基本的な使い方
cfn-dia html -t template.yaml

# スタンドアロンHTML（外部依存なし、共有に便利）
cfn-dia html -t template.yaml --standalone -o ./docs

# CDKプロジェクトで特定のスタックのみ表示
cfn-dia html --stacks MyStack1,MyStack2
```

#### 固有オプション

- `-o, --output-path [path]` - 出力ディレクトリ（デフォルト: システムの一時ディレクトリ/cfn-diagram）
- `--render-all` - ネストされた全スタックを表示
- `--standalone` - 自己完結型HTML（vis.js埋め込み）
- `-c, --ci-mode` - インタラクティブモードを無効化

#### 出力ファイル

- `index.html` - メインファイル
- `data.js` - グラフデータ
- `icons.js` - AWSアイコン（通常モードのみ）

#### 特徴

- ノードのドラッグ＆ドロップ
- リソースタイプ別のフィルタリング
- マウスホバーで詳細情報表示
- 自動レイアウト調整

### 2. Draw.io - 編集可能な図

プレゼンテーションやドキュメント用に図をカスタマイズできます。

#### 使用例

```bash
# 基本的な使い方
cfn-dia draw.io -t template.yaml

# 特定のリソースタイプを除外
cfn-dia draw.io -t template.yaml -c -e AWS::IAM::Role AWS::Logs::LogGroup
```

#### 固有オプション

- `-o, --output-file [file]` - 出力ファイル名（デフォルト: template.drawio）
- `-c, --ci-mode` - インタラクティブモードを無効化
- `-e, --exclude-types [types...]` - 除外するリソースタイプ（CIモードで使用）

### 3. ASCII Art - ターミナル表示

SSHセッションやCI/CDログでの確認に最適です。

#### 使用例

```bash
# 基本的な使い方
cfn-dia ascii-art -t template.yaml

# ファイル変更を監視（開発時に便利）
cfn-dia ascii-art -t template.yaml --watch
```

#### 固有オプション

- `-w, --watch` - ファイル変更を監視して自動再描画
- `-e, --exclude-types [types...]` - 除外するリソースタイプ

### 4. Mermaid - ドキュメント埋め込み

Markdown文書やGitHub/GitLab READMEに最適です。

#### 使用例

```bash
# コンソール出力（コピー＆ペースト用）
cfn-dia mermaid -t template.yaml

# ファイルに保存
cfn-dia mermaid -t template.yaml -o architecture.mmd

# ネストスタックを含む
cfn-dia mermaid -t template.yaml --render-all
```

#### 固有オプション

- `-o, --output-path [file]` - 出力ファイルパス
- `--render-all` - ネストされた全スタックを表示

### 5. Browse - デプロイ済みスタック

AWS上の実際のスタックを可視化します。

#### 使用例

```bash
# インタラクティブに選択してHTML表示
cfn-dia browse -o html

# 特定のプロファイルとリージョン
cfn-dia browse -p production -r us-east-1 -o draw.io
```

#### 固有オプション

- `-o, --output [format]` - 出力形式: html または draw.io（デフォルト: draw.io）
- `--output-file [file]` - 出力ファイル名（draw.io形式時のみ）
- `-p, --profile [name]` - AWS CLIプロファイル
- `-r, --region [name]` - AWSリージョン

## 使用シーン別ガイド

### 開発・デバッグ時

```bash
# ターミナルで素早く構造を確認
cfn-dia ascii-art -t template.yaml

# ファイル変更を監視しながら開発
cfn-dia ascii-art -t template.yaml --watch

# 詳細な探索が必要な場合
cfn-dia html -t template.yaml
```

### ドキュメント作成

```bash
# READMEに埋め込む場合
cfn-dia mermaid -t template.yaml -o docs/architecture.mmd

# プレゼン資料用に編集可能な図
cfn-dia draw.io -t template.yaml -o docs/architecture.drawio

# 静的サイトに埋め込む場合
cfn-dia html -t template.yaml --standalone -o docs/
```

### CI/CD統合

```bash
# GitLabやGitHubでの自動レンダリング
cfn-dia mermaid -t template.yaml > architecture.mmd

# アーティファクトとして保存
cfn-dia html -t template.yaml --standalone -o build/docs/

# スクリーンショット生成（別パッケージ）
npm install -g @mhlabs/cfn-diagram-ci
cfn-dia-ci html -t template.yaml
```

### 本番環境の確認

```bash
# デプロイ済みスタックを確認
cfn-dia browse -p production -r us-east-1 -o html

# 図として保存
cfn-dia browse -p production -o draw.io --output-file prod-stack.drawio
```

## 技術仕様

### HTMLモードのアーキテクチャ

- **vis.js**: グラフ可視化ライブラリ
- **データ形式**: ノード（リソース）とエッジ（依存関係）のJSON
- **フィルタリング**: クライアントサイドJavaScriptで実装
- **アイコン**: AWS公式アイコンセット使用

### 出力ファイル構造

```txt
cfn-diagram/
├── index.html      # メインHTML（vis.jsを参照）
├── data.js         # グラフデータ（nodes, edges）
└── icons.js        # AWSアイコンデータ（通常モードのみ）
```

## トラブルシューティング

### よくある問題

| 問題                              | 解決方法                                                   |
| --------------------------------- | ---------------------------------------------------------- |
| WSL: `Error: spawn wslvar ENOENT` | [wslu](https://github.com/wslutilities/wslu)をインストール |
| 大規模スタックが重い              | `--stacks`オプションで特定スタックのみ表示                 |
| CDK synthエラー                   | `--skip-synth`オプションで既存のcdk.outを使用              |
| ブラウザが自動で開かない          | 生成されたindex.htmlを手動で開く                           |

### パフォーマンス最適化

```bash
# 大規模なCDKプロジェクト
cfn-dia html --stacks MainStack,ApiStack

# 特定のリソースタイプを除外
cfn-dia draw.io -t template.yaml -c -e AWS::Logs::LogGroup
```
