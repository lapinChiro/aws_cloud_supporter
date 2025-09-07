# CloudFormationビジュアライザー調査レポート

## 概要

本レポートでは、CloudFormationテンプレート（JSON/YAML）をビジュアライズするための既存OSSツールを調査しました。AWS Cloud Supporterプロジェクトの要件に基づき、CLIツールとしての利用可能性およびブラウザでのビジュアライズ機能に重点を置いて分析しています。

## 主要なOSSビジュアライゼーションツール

### 1. cfn-diagram

**GitHub**: https://github.com/ljacobsson/cfn-diagram  
**npm パッケージ**: @mhlabs/cfn-diagram

#### 特徴
- **CLIツール**として設計されており、プロジェクトの要件に完全に合致
- **複数の出力形式**をサポート:
  - Draw.io形式（編集可能）
  - HTML（vis.js使用、ブラウザで表示）
  - ASCIIアート（ターミナル表示）
  - Mermaidダイアグラム
- **CDK/SAM対応**: CloudFormationだけでなくCDK/SAMテンプレートもサポート
- **リソースフィルタリング**: 特定のリソースタイプのみを選択表示可能
- **VS Code統合**: Draw.io拡張機能と連携して即座にビジュアライズ
- **CI/CD対応**: cfn-diagram-ciにより自動でスクリーンショット生成可能

#### インストールと使用例
```bash
npm i -g @mhlabs/cfn-diagram

# Draw.io形式で出力
cfn-dia draw.io -t template.yaml

# HTMLで出力（ブラウザ表示）
cfn-dia html -t template.yaml

# ASCIIアートで出力
cfn-dia ascii -t template.yaml
```

#### プロジェクトへの適合性
- ✅ CLIツールとして利用可能
- ✅ ブラウザでのビジュアライズ対応（HTMLモード）
- ✅ 活発にメンテナンスされている
- ✅ 豊富な出力形式

### 2. diagram-as-code (awsdac)

**GitHub**: https://github.com/awslabs/diagram-as-code  
**開発元**: AWS Labs

#### 特徴
- **AWS公式のツール**（AWS Labsによる開発）
- **CloudFormationサポート**（ベータ版）:
  - `--cfn-template`オプションでCloudFormationテンプレートから図を生成
  - 不完全な形式のテンプレートでも処理可能
- **軽量設計**: ヘッドレスブラウザやGUI不要
- **CI/CD統合**: コンテナ環境での実行に最適化
- **AWSアーキテクチャガイドライン準拠**

#### インストールと使用例
```bash
# Goで実装されているため、バイナリをダウンロード
# または go get でインストール

awsdac <CloudFormationテンプレート.yaml> --cfn-template
# output.pngが生成される
```

#### プロジェクトへの適合性
- ✅ CLIツールとして利用可能
- ❌ ブラウザでの直接表示は非対応（PNG出力のみ）
- ⚠️ CloudFormationサポートはベータ版
- ✅ AWS公式ツールの安心感

### 3. CloudGrapher

**GitHub**: https://github.com/dmgress/cloudgrapher  
**タイプ**: ブラウザベースツール

#### 特徴
- **シンプルなワンページツール**: CloudFormationスクリプトの視覚化に特化
- **ブラウザベース**: ローカルサーバーを起動してブラウザで表示
- **プレゼンテーション向き**: 見た目が良く、説明しやすい
- **ライブリロード機能**: テンプレート変更を即座に反映

#### プロジェクトへの適合性
- ❌ 純粋なCLIツールではない（Webサーバー起動が必要）
- ✅ ブラウザでのビジュアライズに特化
- ⚠️ 開発活動が停滞気味

### 4. cfn-simulator (cft-simulator)

**GitHub**: https://github.com/Dome9/cft-simulator  
**開発元**: Dome9 (現CheckPoint)

#### 特徴
- **オフラインシミュレーション**: AWSにデプロイせずにテンプレートをシミュレート
- **パラメータ対応**: 複雑なパラメータや条件を含むテンプレートを処理
- **デバッグ機能**: テンプレートのデバッグと検証
- **Dome9 Clarity統合**: セキュリティポスチャの可視化

#### プロジェクトへの適合性
- ✅ CLIツールとして利用可能
- ⚠️ 主にシミュレーション/デバッグ用途
- ❌ 直接的なビジュアライズ機能は限定的

## 比較表

| ツール名        | CLIサポート | ブラウザ表示 | 出力形式                      | メンテナンス状況 | 特徴         |
| --------------- | ----------- | ------------ | ----------------------------- | ---------------- | ------------ |
| cfn-diagram     | ✅           | ✅            | Draw.io, HTML, ASCII, Mermaid | 活発             | 最も多機能   |
| diagram-as-code | ✅           | ❌            | PNG, YAML                     | 活発             | AWS公式      |
| CloudGrapher    | ❌           | ✅            | Web表示のみ                   | 停滞気味         | シンプル     |
| cfn-simulator   | ✅           | ❌            | JSON                          | 中程度           | デバッグ特化 |

## 推奨ツール

### 第一選択: cfn-diagram

**理由**:
1. CLIツールとブラウザビジュアライズの両方の要件を満たす
2. 活発にメンテナンスされている
3. 豊富な出力形式（Draw.io, HTML, ASCII等）
4. CI/CD統合が容易
5. CDK/SAMにも対応可能（将来的な拡張性）

### 第二選択: diagram-as-code + cfn-diagram の組み合わせ

**理由**:
1. diagram-as-codeでAWS準拠の高品質な図を生成
2. cfn-diagramで対話的な編集やブラウザ表示
3. 両方のツールの長所を活かす

## 実装提案

1. **メインツールとしてcfn-diagramを採用**
   - CLIインターフェースの要件に完全合致
   - HTMLモードでブラウザビジュアライズ実現

2. **補助ツールとしてdiagram-as-codeを検討**
   - より高品質な静的図が必要な場合に使用
   - AWS公式ツールの信頼性

3. **将来的な拡張**
   - cfn-diagramのCDK/SAMサポートを活用して、ロードマップ項目7,8への対応準備

## まとめ

CloudFormationビジュアライザーとしては、**cfn-diagram**が最も要件に適合しています。CLIツールとして動作し、かつブラウザでのビジュアライズも可能で、活発にメンテナンスされている点が大きな強みです。

「車輪の再発明を避ける」という開発哲学に従い、既存の成熟したOSSツールを活用することで、効率的に目的を達成できます。