import type { MetricConfig } from './types';

export const ALB_METRICS: MetricConfig[] = [
  // リクエスト・レスポンスメトリクス（8個）
  {
    name: 'RequestCount',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: 'リクエスト数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 1000,
      warningMultiplier: 10.0,
      criticalMultiplier: 50.0
    }
  },
  {
    name: 'NewConnectionCount',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: '新規接続数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 100,
      warningMultiplier: 10.0,
      criticalMultiplier: 50.0
    }
  },
  {
    name: 'ActiveConnectionCount',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: 'アクティブ接続数',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 1000,
      warningMultiplier: 5.0,
      criticalMultiplier: 10.0
    }
  },
  {
    name: 'ProcessedBytes',
    namespace: 'AWS/ApplicationELB',
    unit: 'Bytes',
    description: '処理バイト数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Low',
    threshold: {
      base: 104857600, // 100MB
      warningMultiplier: 100.0,
      criticalMultiplier: 1000.0
    }
  },
  {
    name: 'ConsumedLCUs',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: '消費ロードバランサーキャパシティユニット',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 100,
      warningMultiplier: 10.0,
      criticalMultiplier: 50.0
    }
  },
  {
    name: 'TargetResponseTime',
    namespace: 'AWS/ApplicationELB',
    unit: 'Seconds',
    description: 'ターゲットレスポンス時間',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Latency',
    importance: 'High',
    threshold: {
      base: 1.0, // 1秒
      warningMultiplier: 1.0,
      criticalMultiplier: 3.0
    }
  },
  {
    name: 'HTTPCode_Target_2XX_Count',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: 'ターゲット2XXレスポンス数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 100,
      warningMultiplier: 0.1, // 少なすぎても問題
      criticalMultiplier: 0.01
    }
  },
  {
    name: 'HTTPCode_Target_4XX_Count',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: 'ターゲット4XXエラー数',
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

  // エラー・ヘルスチェック系メトリクス（6個）
  {
    name: 'HTTPCode_Target_5XX_Count',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: 'ターゲット5XXエラー数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'High',
    threshold: {
      base: 5,
      warningMultiplier: 1.0,
      criticalMultiplier: 3.0
    }
  },
  {
    name: 'HTTPCode_ELB_4XX_Count',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: 'ELB 4XXエラー数',
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
    name: 'HTTPCode_ELB_5XX_Count',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: 'ELB 5XXエラー数',
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
    name: 'UnHealthyHostCount',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: '非正常ターゲット数',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'High',
    threshold: {
      base: 0,
      warningMultiplier: 1.0,
      criticalMultiplier: 2.0
    }
  },
  {
    name: 'HealthyHostCount',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: '正常ターゲット数',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'High',
    threshold: {
      base: 2, // 最低2つは正常であるべき
      warningMultiplier: 0.5,
      criticalMultiplier: 0.25
    }
  },
  {
    name: 'RejectedConnectionCount',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: '拒否された接続数',
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
    name: 'TargetConnectionErrorCount',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: 'ターゲット接続エラー数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'High',
    threshold: {
      base: 5,
      warningMultiplier: 1.0,
      criticalMultiplier: 3.0
    }
  },

  // レスポンス時間・レイテンシメトリクス（6個）
  {
    name: 'TargetTLSNegotiationTime',
    namespace: 'AWS/ApplicationELB',
    unit: 'Milliseconds',
    description: 'ターゲットTLSネゴシエーション時間',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Latency',
    importance: 'Medium',
    threshold: {
      base: 1000, // 1秒
      warningMultiplier: 2.0,
      criticalMultiplier: 5.0
    }
  },
  {
    name: 'ResponseTime',
    namespace: 'AWS/ApplicationELB',
    unit: 'Seconds',
    description: 'ALBレスポンス時間',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Latency',
    importance: 'High',
    threshold: {
      base: 0.1, // 100ms
      warningMultiplier: 5.0,
      criticalMultiplier: 10.0
    }
  },
  {
    name: 'RequestCountPerTarget',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: 'ターゲット毎リクエスト数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 100,
      warningMultiplier: 10.0,
      criticalMultiplier: 100.0
    }
  },
  {
    name: 'TargetTLSNegotiationErrorCount',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: 'ターゲットTLSネゴシエーションエラー数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'Medium',
    threshold: {
      base: 1,
      warningMultiplier: 1.0,
      criticalMultiplier: 10.0
    }
  },
  {
    name: 'ClientTLSNegotiationErrorCount',
    namespace: 'AWS/ApplicationELB',
    unit: 'Count',
    description: 'クライアントTLSネゴシエーションエラー数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'Medium',
    threshold: {
      base: 1,
      warningMultiplier: 1.0,
      criticalMultiplier: 10.0
    }
  }
];