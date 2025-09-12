import type { MetricConfig } from './types';

export const LAMBDA_METRICS: MetricConfig[] = [
  // 実行系メトリクス（6個）
  {
    name: 'Duration',
    namespace: 'AWS/Lambda',
    unit: 'Milliseconds',
    description: '関数実行時間',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'High',
    threshold: {
      base: 5000, // 5秒
      warningMultiplier: 0.8,  // タイムアウト設定の80%
      criticalMultiplier: 1.0  // タイムアウト設定値
    }
  },
  {
    name: 'Invocations',
    namespace: 'AWS/Lambda',
    unit: 'Count',
    description: '関数呼び出し回数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 1000,
      warningMultiplier: 10.0,
      criticalMultiplier: 20.0
    }
  },
  {
    name: 'Errors',
    namespace: 'AWS/Lambda',
    unit: 'Count',
    description: '関数実行エラー数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'High',
    threshold: {
      base: 5,
      warningMultiplier: 1.0,
      criticalMultiplier: 2.0
    }
  },
  {
    name: 'DeadLetterErrors',
    namespace: 'AWS/Lambda',
    unit: 'Count',
    description: 'デッドレターキューエラー数',
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
    name: 'DestinationDeliveryFailures',
    namespace: 'AWS/Lambda',
    unit: 'Count',
    description: '非同期呼び出し送信先エラー数',
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
    name: 'Throttles',
    namespace: 'AWS/Lambda',
    unit: 'Count',
    description: 'スロットル（制限）された呼び出し数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'High',
    threshold: {
      base: 1,
      warningMultiplier: 1.0,
      criticalMultiplier: 5.0
    }
  },

  // 同期性・並行性メトリクス（6個）
  {
    name: 'ConcurrentExecutions',
    namespace: 'AWS/Lambda',
    unit: 'Count',
    description: '同時実行数',
    statistic: 'Maximum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'High',
    threshold: {
      base: 100,
      warningMultiplier: 0.8, // 設定の80%
      criticalMultiplier: 1.0 // 設定値
    }
  },
  {
    name: 'UnreservedConcurrentExecutions',
    namespace: 'AWS/Lambda',
    unit: 'Count',
    description: '非予約同時実行数',
    statistic: 'Maximum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 900, // デフォルト1000から予約分を除く
      warningMultiplier: 0.8,
      criticalMultiplier: 0.9
    }
  },
  {
    name: 'ProvisionedConcurrencyInvocations',
    namespace: 'AWS/Lambda',
    unit: 'Count',
    description: 'プロビジョンド同時実行での呼び出し数',
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
    name: 'ProvisionedConcurrencyUtilization',
    namespace: 'AWS/Lambda',
    unit: 'Percent',
    description: 'プロビジョンド同時実行使用率',
    statistic: 'Maximum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 80,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.25 // 100%
    }
  },
  {
    name: 'ProvisionedConcurrencySpilloverInvocations',
    namespace: 'AWS/Lambda',
    unit: 'Count',
    description: 'プロビジョンド同時実行を超えた呼び出し数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 10,
      warningMultiplier: 1.0,
      criticalMultiplier: 10.0
    }
  },
  {
    name: 'IteratorAge',
    namespace: 'AWS/Lambda',
    unit: 'Milliseconds',
    description: 'イベントソースからの最後のレコード年齢（ストリーム処理）',
    statistic: 'Maximum',
    evaluationPeriod: 300,
    category: 'Latency',
    importance: 'Medium',
    threshold: {
      base: 60000, // 1分
      warningMultiplier: 5.0,
      criticalMultiplier: 10.0
    }
  },

  // 初期化・コールドスタートメトリクス（6個）
  {
    name: 'InitDuration',
    namespace: 'AWS/Lambda',
    unit: 'Milliseconds',
    description: '初期化時間（コールドスタート）',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 3000, // 3秒
      warningMultiplier: 1.0,
      criticalMultiplier: 2.0
    }
  },
  {
    name: 'PostRuntimeExtensionsDuration',
    namespace: 'AWS/Lambda',
    unit: 'Milliseconds',
    description: 'Runtime後拡張実行時間',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Low',
    threshold: {
      base: 1000, // 1秒
      warningMultiplier: 2.0,
      criticalMultiplier: 5.0
    }
  },
  {
    name: 'OfflineTime',
    namespace: 'AWS/Lambda',
    unit: 'Milliseconds',
    description: '関数オフライン時間',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Low',
    threshold: {
      base: 1000, // 1秒
      warningMultiplier: 10.0,
      criticalMultiplier: 30.0
    }
  },
  {
    name: 'ClaimedAccountConcurrency',
    namespace: 'AWS/Lambda',
    unit: 'Count',
    description: 'アカウントレベル要求同時実行数',
    statistic: 'Maximum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Low',
    threshold: {
      base: 800, // デフォルト1000の80%
      warningMultiplier: 1.0,
      criticalMultiplier: 1.25 // 1000
    }
  },
  {
    name: 'AsyncEventAge',
    namespace: 'AWS/Lambda',
    unit: 'Milliseconds',
    description: '非同期イベントの年齢',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Latency',
    importance: 'Medium',
    threshold: {
      base: 60000, // 1分
      warningMultiplier: 5.0,
      criticalMultiplier: 10.0
    }
  },
  {
    name: 'ResponseStreamingDuration',
    namespace: 'AWS/Lambda',
    unit: 'Milliseconds',
    description: 'レスポンスストリーミング時間',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Low',
    threshold: {
      base: 30000, // 30秒
      warningMultiplier: 0.8,
      criticalMultiplier: 1.0
    }
  }
];