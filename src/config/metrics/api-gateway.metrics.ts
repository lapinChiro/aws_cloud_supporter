import type { MetricConfig } from './types';

export const API_GATEWAY_METRICS: MetricConfig[] = [
  // リクエスト系メトリクス（8個）
  {
    name: 'Count',
    namespace: 'AWS/ApiGateway',
    unit: 'Count',
    description: 'APIリクエスト総数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 1000,
      warningMultiplier: 10.0,
      criticalMultiplier: 100.0
    }
  },
  {
    name: '4XXError',
    namespace: 'AWS/ApiGateway',
    unit: 'Count',
    description: '4XXクライアントエラー数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'High',
    threshold: {
      base: 10,
      warningMultiplier: 1.0,
      criticalMultiplier: 5.0
    }
  },
  {
    name: '5XXError',
    namespace: 'AWS/ApiGateway',
    unit: 'Count',
    description: '5XXサーバーエラー数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'High',
    threshold: {
      base: 1,
      warningMultiplier: 1.0,
      criticalMultiplier: 10.0
    }
  },
  {
    name: 'Latency',
    namespace: 'AWS/ApiGateway',
    unit: 'Milliseconds',
    description: 'APIレスポンス時間（レイテンシー）',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Latency',
    importance: 'High',
    threshold: {
      base: 1000, // 1秒
      warningMultiplier: 1.0,
      criticalMultiplier: 3.0
    }
  },
  {
    name: 'IntegrationLatency',
    namespace: 'AWS/ApiGateway',
    unit: 'Milliseconds',
    description: 'バックエンド統合レイテンシー',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Latency',
    importance: 'High',
    threshold: {
      base: 500, // 500ms
      warningMultiplier: 1.0,
      criticalMultiplier: 6.0 // 3秒
    }
  },
  {
    name: 'CacheHitCount',
    namespace: 'AWS/ApiGateway',
    unit: 'Count',
    description: 'キャッシュヒット数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Low',
    threshold: {
      base: 100,
      warningMultiplier: 0.1,
      criticalMultiplier: 0.01
    }
  },
  {
    name: 'CacheMissCount',
    namespace: 'AWS/ApiGateway',
    unit: 'Count',
    description: 'キャッシュミス数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Low',
    threshold: {
      base: 100,
      warningMultiplier: 10.0,
      criticalMultiplier: 100.0
    }
  },
  {
    name: 'DataProcessed',
    namespace: 'AWS/ApiGateway',
    unit: 'Bytes',
    description: '処理データ量',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Low',
    threshold: {
      base: 10485760, // 10MB
      warningMultiplier: 100.0,
      criticalMultiplier: 1000.0
    }
  },

  // レート制限・スロットルメトリクス（8個）
  {
    name: 'ThrottleCount',
    namespace: 'AWS/ApiGateway',
    unit: 'Count',
    description: 'スロットルされたリクエスト数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'High',
    threshold: {
      base: 1,
      warningMultiplier: 1.0,
      criticalMultiplier: 10.0
    }
  },
  {
    name: 'WafDeniedCount',
    namespace: 'AWS/ApiGateway',
    unit: 'Count',
    description: 'WAFによって拒否されたリクエスト数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 10,
      warningMultiplier: 10.0,
      criticalMultiplier: 100.0
    }
  },
  {
    name: 'ExecutionError',
    namespace: 'AWS/ApiGateway',
    unit: 'Count',
    description: '実行エラー数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'High',
    threshold: {
      base: 1,
      warningMultiplier: 1.0,
      criticalMultiplier: 5.0
    }
  },
  {
    name: 'ClientError',
    namespace: 'AWS/ApiGateway',
    unit: 'Count',
    description: 'クライアントエラー数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'Medium',
    threshold: {
      base: 10,
      warningMultiplier: 1.0,
      criticalMultiplier: 5.0
    }
  },
  {
    name: 'ServerError',
    namespace: 'AWS/ApiGateway',
    unit: 'Count',
    description: 'サーバーエラー数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'High',
    threshold: {
      base: 1,
      warningMultiplier: 1.0,
      criticalMultiplier: 10.0
    }
  },
  {
    name: 'ResponseSize',
    namespace: 'AWS/ApiGateway',
    unit: 'Bytes',
    description: 'レスポンスサイズ',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Low',
    threshold: {
      base: 1048576, // 1MB
      warningMultiplier: 5.0,
      criticalMultiplier: 10.0 // 10MB
    }
  },
];