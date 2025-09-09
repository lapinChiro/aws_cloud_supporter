# aws_cloud_supporter

## コンセプト

AWSを使って構築しているクラウドアプリケーションの運用を支援するツール
基本的にCLIツールとして提供し、ビジュアライズはWebブラウザを利用する

## 現在の機能

### 1. CloudWatchメトリクス推奨生成

CloudFormationテンプレートを解析して、各AWSリソースに対する最適なCloudWatchメトリクスとアラーム推奨設定を自動生成します。

#### サポートリソース

- **AWS::RDS::DBInstance** - 26種類のRDSメトリクス
- **AWS::Lambda::Function** - 18種類のLambdaメトリクス  
- **AWS::ECS::Service** - 17種類のECS（Fargate）メトリクス
- **AWS::ElasticLoadBalancingV2::LoadBalancer** - 20種類のALBメトリクス
- **AWS::DynamoDB::Table** - 22種類のDynamoDBメトリクス
- **AWS::ApiGateway::RestApi** - 14種類のAPI Gatewayメトリクス

#### 基本的な使い方

```bash
# CloudFormationテンプレートを解析してJSON形式で出力
npm run dev examples/web-application-stack.yaml

# HTML形式のレポートを生成
npm run dev examples/web-application-stack.yaml --output html --file report.html

# 特定のリソースタイプのみを対象
npm run dev examples/web-application-stack.yaml --resource-types "AWS::RDS::DBInstance,AWS::Lambda::Function"

# 低重要度メトリクスも含めて詳細出力
npm run dev examples/web-application-stack.yaml --include-low --verbose
```

#### 出力例

**JSON出力**:
```json
{
  "metadata": {
    "version": "1.0.0",
    "generated_at": "2025-09-09T12:00:00.000Z",
    "template_path": "template.yaml",
    "total_resources": 10,
    "supported_resources": 8
  },
  "resources": [
    {
      "logical_id": "MyDatabase",
      "resource_type": "AWS::RDS::DBInstance",
      "metrics": [
        {
          "metric_name": "CPUUtilization",
          "namespace": "AWS/RDS",
          "unit": "Percent",
          "recommended_threshold": { "warning": 70, "critical": 90 },
          "evaluation_period": 300,
          "category": "Performance",
          "importance": "High"
        }
      ]
    }
  ]
}
```

### 2. CloudFormationテンプレートのビジュアライゼーション（cfn-diagram）

[cfn-diagram](https://github.com/ljacobsson/cfn-diagram)を使用して、CloudFormation/SAM/CDKテンプレートを様々な形式の図に変換できます。

#### インストール

```bash
npm install -g @mhlabs/cfn-diagram
```

#### 基本的な使い方

```bash
# インタラクティブなHTML図を生成
cfn-dia html -t examples/web-application-stack.yaml -o examples/output

# Mermaid形式でMarkdownに埋め込み可能な図を生成
cfn-dia mermaid -t examples/serverless-api-sam.yaml -o examples/output.md

# Draw.io形式で編集可能な図を生成
cfn-dia draw.io -t examples/container-microservices-ecs.yaml
```

詳細な使い方は[usage-for-cfn-diagram.md](./usage-for-cfn-diagram.md)を参照してください。

## サンプルテンプレート（examples/）

様々なAWSアーキテクチャパターンのCloudFormationテンプレートを提供しています。これらはcfn-diagramでの可視化テストに使用でき、実際にAWSにデプロイ可能です。

### 提供テンプレート一覧

| テンプレート                                                                    | 説明                               | 主なリソース                             |
| ------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------- |
| [basic-cloudformation.yaml](./examples/basic-cloudformation.yaml)               | 基本的なWebアプリケーション構成    | S3, Lambda, DynamoDB, API Gateway        |
| [web-application-stack.yaml](./examples/web-application-stack.yaml)             | 本格的な3層Webアプリケーション     | ALB, Auto Scaling, RDS, ElastiCache, VPC |
| [serverless-api-sam.yaml](./examples/serverless-api-sam.yaml)                   | イベント駆動型サーバーレスAPI      | SAM, EventBridge, SQS, SNS, DynamoDB     |
| [data-pipeline-analytics.yaml](./examples/data-pipeline-analytics.yaml)         | リアルタイムデータ分析パイプライン | Kinesis, Glue, Athena, S3, Lambda        |
| [container-microservices-ecs.yaml](./examples/container-microservices-ecs.yaml) | コンテナベースのマイクロサービス   | ECS Fargate, ALB, Service Discovery      |
| [static-website-hosting.yaml](./examples/static-website-hosting.yaml)           | 静的Webサイトホスティング          | S3, CloudFront, Route53, ACM, WAF        |

### 使用例

#### 1. CloudWatchメトリクス推奨生成

```bash
# 開発環境でのテスト実行
npm run dev -- examples/web-application-stack.yaml

# プロダクション用：ビルドしてから実行
npm run build
aws-cloud-supporter examples/serverless-api-sam.yaml --output html --file metrics-report.html

# 特定リソースのメトリクス分析
aws-cloud-supporter examples/container-microservices-ecs.yaml --resource-types "AWS::ECS::Service,AWS::ElasticLoadBalancingV2::LoadBalancer" --verbose
```

#### 2. テンプレートの可視化

```bash
# HTML形式で出力（ブラウザでインタラクティブに探索可能）
cfn-dia html -t examples/web-application-stack.yaml -o output/web-app
# ブラウザで output/web-app/index.html を開く

# Mermaid形式で出力（GitHubやドキュメントに埋め込み可能）
cfn-dia mermaid -t examples/serverless-api-sam.yaml > architecture.mmd

# Draw.io形式で出力（編集・カスタマイズ可能）
cfn-dia draw.io -t examples/container-microservices-ecs.yaml -o ecs.drawio
```

#### 3. AWSへのデプロイ

```bash
# 基本的なWebアプリケーション
aws cloudformation create-stack \
  --stack-name my-basic-app \
  --template-body file://examples/basic-cloudformation.yaml \
  --parameters ParameterKey=Environment,ParameterValue=dev \
  --capabilities CAPABILITY_IAM

# SAMアプリケーション（SAM CLIが必要）
cd examples
sam build --template serverless-api-sam.yaml
sam deploy --guided

# コンテナアプリケーション
aws cloudformation create-stack \
  --stack-name my-container-app \
  --template-body file://examples/container-microservices-ecs.yaml \
  --capabilities CAPABILITY_IAM
```

### 出力例

#### HTML出力

- インタラクティブなネットワーク図
- ノードのドラッグ＆ドロップ
- リソースタイプでのフィルタリング
- 詳細情報のツールチップ表示

#### Mermaid出力

```mermaid
flowchart TB;
    subgraph &nbsp;
    rootApiGateway[ApiGateway<br/>Serverless::Api]-->rootCreateOrderFunction[[CreateOrderFunction<br/>Serverless::Function]]
    rootCreateOrderFunction[[CreateOrderFunction<br/>Serverless::Function]]-->rootOrdersTable[(OrdersTable<br/>DynamoDB::Table)]
    end
```

### テンプレートの特徴

- **本番環境対応**: セキュリティ、可用性、スケーラビリティを考慮
- **ベストプラクティス**: AWS Well-Architectedフレームワークに準拠
- **パラメータ化**: 環境ごとの設定が容易
- **コメント付き**: リソースの役割と設定理由を説明
- **検証済み**: 文法エラーなし、デプロイ可能

## 開発・品質情報

### コード品質基準

このプロジェクトは[CLAUDE.md](./CLAUDE.md)で定義された厳格な品質基準に準拠しています：

- ✅ **Zero Type Errors**: TypeScript strict mode で型エラー0個
- ✅ **No any types**: 型安全性を重視、`any`型の使用禁止
- ✅ **Build Success**: 全ビルドが成功
- ✅ **Test Driven Development**: 395個の自動テストで品質保証

### 開発コマンド

```bash
# 依存関係のインストール
npm install

# 開発モードでの実行
npm run dev template.yaml

# プロダクションビルド
npm run build

# テストスイート実行
npm test

# 型チェック
npm run typecheck

# テストカバレッジ
npm run test:coverage
```

## ロードマップ

1. ✅ CloudFormationからリソースを抽出してビジュアライズする（cfn-diagram統合）
2. ✅ CloudFormationからリソースを抽出して、それぞれのリソースがサポートしているメトリクスを一覧化する
3. CloudFormationからリソースを抽出して、それぞれのリソースがサポートしているメトリクスに対してアラームを張るためのCDKコードを生成する
4. CloudFormationからリソースを抽出して、それぞれのリソースがサポートしているメトリクスに対して張るアラームを選択できるようにする
5. CloudFormationからリソースを抽出して、コストを算出する
6. CloudFormationからリソースを抽出して、コストを最適化するための提案を行う
7. CDKにも対応する
8. Terraformにも対応する

## プロジェクト構成

```txt
aws_cloud_supporter/
├── README.md                      # このファイル
├── CLAUDE.md                      # Claude Codeの設定ファイル
├── package.json                   # Node.js依存関係とスクリプト
├── tsconfig.json                  # TypeScript設定（開発用）
├── tsconfig.build.json            # TypeScript設定（ビルド用）
├── usage-for-cfn-diagram.md       # cfn-diagramの詳細な使い方
├── visualization-tool-report.md   # ビジュアライゼーションツールの調査結果
├── src/                           # メインソースコード
│   ├── cli/                       # CLIエントリーポイント
│   ├── core/                      # 解析エンジン
│   ├── generators/                # メトリクス生成器
│   ├── config/                    # メトリクス定義
│   ├── types/                     # TypeScript型定義
│   ├── interfaces/                # インターフェース定義
│   └── utils/                     # ユーティリティ
├── tests/                         # 自動テストスイート（395テスト）
│   ├── unit/                      # 単体テスト
│   ├── integration/               # 統合テスト
│   ├── e2e/                       # E2Eテスト
│   ├── fixtures/                  # テストデータ
│   └── helpers/                   # テストヘルパー
├── dist/                          # ビルド済みファイル
├── coverage/                      # テストカバレッジレポート
└── examples/                      # CloudFormationテンプレート集
    ├── basic-cloudformation.yaml  # 基本的なWebアプリケーション
    ├── web-application-stack.yaml # 3層Webアプリケーション
    ├── serverless-api-sam.yaml    # サーバーレスAPI（SAM）
    ├── data-pipeline-analytics.yaml # データ分析パイプライン
    ├── container-microservices-ecs.yaml # ECSマイクロサービス
    ├── static-website-hosting.yaml # 静的サイトホスティング
    └── output/                    # 生成された可視化ファイル（例）
        ├── index.html
        ├── data.js
        └── icons.js
```
