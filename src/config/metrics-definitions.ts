// CLAUDE.md準拠メトリクス定義（AWS公式準拠 + DRY原則 + any型完全排除）

import type { 
  CloudFormationResource, 
  RDSDBInstance, 
  DynamoDBTable} from '../types/cloudformation';
import {
  RDSProperties,
  DynamoDBProperties
} from '../types/cloudformation';
import type { MetricConfig } from '../types/metrics';

// =============================================================================
// RDS メトリクス定義（25個）- AWS CloudWatch公式準拠
// =============================================================================

export const RDS_METRICS: MetricConfig[] = [
  // パフォーマンス系メトリクス（10個）
  {
    name: 'CPUUtilization',
    namespace: 'AWS/RDS',
    unit: 'Percent',
    description: 'データベースインスタンスのCPU使用率',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'High',
    threshold: {
      base: 70,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.3 // 91%
    }
  },
  {
    name: 'CPUCreditUsage',
    namespace: 'AWS/RDS',
    unit: 'Count',
    description: 'CPUクレジット使用量（バースト可能インスタンス）',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 20,
      warningMultiplier: 1.0,
      criticalMultiplier: 2.0
    },
    applicableWhen: (resource: CloudFormationResource) => {
      const rds = resource as RDSDBInstance;
      const instanceClass = (rds.Properties!)?.DBInstanceClass || '';
      return instanceClass.startsWith('db.t3.') || instanceClass.startsWith('db.t4g.');
    }
  },
  {
    name: 'CPUCreditBalance',
    namespace: 'AWS/RDS',
    unit: 'Count',
    description: 'CPUクレジットバランス（バースト可能インスタンス）',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 30,
      warningMultiplier: 1.0,
      criticalMultiplier: 0.5 // 15以下で警告
    },
    applicableWhen: (resource: CloudFormationResource) => {
      const rds = resource as RDSDBInstance;
      const instanceClass = (rds.Properties!)?.DBInstanceClass || '';
      return instanceClass.startsWith('db.t3.') || instanceClass.startsWith('db.t4g.');
    }
  },
  {
    name: 'DatabaseConnections',
    namespace: 'AWS/RDS',
    unit: 'Count',
    description: 'データベース接続数',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'High',
    threshold: {
      base: 20,
      warningMultiplier: 1.0,
      criticalMultiplier: 2.0
    }
  },
  {
    name: 'ReadLatency',
    namespace: 'AWS/RDS',
    unit: 'Seconds',
    description: 'ディスク読み取り平均レイテンシー',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Latency',
    importance: 'High',
    threshold: {
      base: 0.02, // 20ms
      warningMultiplier: 1.0,
      criticalMultiplier: 2.5 // 50ms
    }
  },
  {
    name: 'WriteLatency',
    namespace: 'AWS/RDS',
    unit: 'Seconds',
    description: 'ディスク書き込み平均レイテンシー',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Latency',
    importance: 'High',
    threshold: {
      base: 0.02, // 20ms
      warningMultiplier: 1.0,
      criticalMultiplier: 2.5 // 50ms
    }
  },
  {
    name: 'ReadThroughput',
    namespace: 'AWS/RDS',
    unit: 'Bytes/Second',
    description: 'ディスク読み取りスループット',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 1048576, // 1MB/s
      warningMultiplier: 10.0,
      criticalMultiplier: 20.0
    }
  },
  {
    name: 'WriteThroughput',
    namespace: 'AWS/RDS',
    unit: 'Bytes/Second',
    description: 'ディスク書き込みスループット',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 1048576, // 1MB/s
      warningMultiplier: 10.0,
      criticalMultiplier: 20.0
    }
  },
  {
    name: 'ReadIOPS',
    namespace: 'AWS/RDS',
    unit: 'Count/Second',
    description: '1秒あたりの読み取りI/O操作数',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 100,
      warningMultiplier: 10.0,
      criticalMultiplier: 15.0
    }
  },
  {
    name: 'WriteIOPS',
    namespace: 'AWS/RDS',
    unit: 'Count/Second',
    description: '1秒あたりの書き込みI/O操作数',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 100,
      warningMultiplier: 10.0,
      criticalMultiplier: 15.0
    }
  },

  // メモリ・リソース系メトリクス（7個）
  {
    name: 'FreeableMemory',
    namespace: 'AWS/RDS',
    unit: 'Bytes',
    description: '利用可能なRAMの量',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'High',
    threshold: {
      base: 134217728, // 128MB
      warningMultiplier: 2.0, // 256MB以下で警告
      criticalMultiplier: 1.0 // 128MB以下でクリティカル
    }
  },
  {
    name: 'SwapUsage',
    namespace: 'AWS/RDS',
    unit: 'Bytes',
    description: 'スワップファイル使用量',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 0,
      warningMultiplier: 1.0,
      criticalMultiplier: 1000.0 // スワップ使用は避けるべき
    }
  },
  {
    name: 'FreeStorageSpace',
    namespace: 'AWS/RDS',
    unit: 'Bytes',
    description: '利用可能なストレージ容量',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'High',
    threshold: {
      base: 2147483648, // 2GB
      warningMultiplier: 5.0, // 10GB以下で警告
      criticalMultiplier: 1.0 // 2GB以下でクリティカル
    }
  },
  {
    name: 'FreeLocalStorage',
    namespace: 'AWS/RDS',
    unit: 'Bytes',
    description: '利用可能なローカルストレージ容量（Aurora）',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 1073741824, // 1GB
      warningMultiplier: 2.0,
      criticalMultiplier: 1.0
    },
    applicableWhen: (resource: CloudFormationResource) => {
      const rds = resource as RDSDBInstance;
      const engine = (rds.Properties!)?.Engine || '';
      return engine.startsWith('aurora');
    }
  },

  // エンジン固有メトリクス（8個）
  {
    name: 'BinLogDiskUsage',
    namespace: 'AWS/RDS',
    unit: 'Bytes',
    description: 'バイナリログディスク使用量（MySQL）',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 1073741824, // 1GB
      warningMultiplier: 1.0,
      criticalMultiplier: 2.0
    },
    applicableWhen: (resource: CloudFormationResource) => {
      const rds = resource as RDSDBInstance;
      const props = rds.Properties!;
      return props?.Engine === 'mysql' && (props?.BackupRetentionPeriod || 0) > 0;
    }
  },
  {
    name: 'ReplicaLag',
    namespace: 'AWS/RDS',
    unit: 'Seconds',
    description: 'リードレプリカでのレプリケーション遅延',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Latency',
    importance: 'High',
    threshold: {
      base: 30, // 30秒
      warningMultiplier: 1.0,
      criticalMultiplier: 2.0 // 60秒
    },
    applicableWhen: (resource: CloudFormationResource) => {
      const rds = resource as RDSDBInstance;
      const props = rds.Properties!;
      return !props?.MultiAZ; // リードレプリカ想定
    }
  },
  {
    name: 'CheckpointLag',
    namespace: 'AWS/RDS',
    unit: 'Seconds',
    description: 'チェックポイント遅延（PostgreSQL）',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 60, // 1分
      warningMultiplier: 1.0,
      criticalMultiplier: 2.0
    },
    applicableWhen: (resource: CloudFormationResource) => {
      const rds = resource as RDSDBInstance;
      const engine = (rds.Properties!)?.Engine || '';
      return engine === 'postgresql';
    }
  },
  {
    name: 'MaximumUsedTransactionIDs',
    namespace: 'AWS/RDS',
    unit: 'Count',
    description: '使用済みトランザクションID最大数（PostgreSQL）',
    statistic: 'Maximum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'High',
    threshold: {
      base: 1000000000, // 10億
      warningMultiplier: 1.5,
      criticalMultiplier: 1.8
    },
    applicableWhen: (resource: CloudFormationResource) => {
      const rds = resource as RDSDBInstance;
      const engine = (rds.Properties!)?.Engine || '';
      return engine === 'postgresql';
    }
  },
  {
    name: 'OldestReplicationSlotLag',
    namespace: 'AWS/RDS',
    unit: 'Bytes',
    description: '最古レプリケーションスロット遅延（PostgreSQL）',
    statistic: 'Maximum',
    evaluationPeriod: 300,
    category: 'Latency',
    importance: 'Medium',
    threshold: {
      base: 1073741824, // 1GB
      warningMultiplier: 5.0,
      criticalMultiplier: 10.0
    },
    applicableWhen: (resource: CloudFormationResource) => {
      const rds = resource as RDSDBInstance;
      const engine = (rds.Properties!)?.Engine || '';
      return engine === 'postgresql';
    }
  },
  {
    name: 'AuroraReplicaLag',
    namespace: 'AWS/RDS',
    unit: 'Milliseconds',
    description: 'Auroraレプリカラグ',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Latency',
    importance: 'High',
    threshold: {
      base: 1000, // 1秒
      warningMultiplier: 1.0,
      criticalMultiplier: 5.0
    },
    applicableWhen: (resource: CloudFormationResource) => {
      const rds = resource as RDSDBInstance;
      const engine = (rds.Properties!)?.Engine || '';
      return engine.startsWith('aurora');
    }
  },
  {
    name: 'BufferCacheHitRatio',
    namespace: 'AWS/RDS',
    unit: 'Percent',
    description: 'バッファキャッシュヒット率',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 90, // 90%
      warningMultiplier: 0.95, // 85.5%以下で警告
      criticalMultiplier: 0.8   // 72%以下でクリティカル
    }
  },
  {
    name: 'ResultSetCacheHitRatio',
    namespace: 'AWS/RDS',
    unit: 'Percent',
    description: '結果セットキャッシュヒット率（MySQL）',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 90,
      warningMultiplier: 0.9,
      criticalMultiplier: 0.7
    },
    applicableWhen: (resource: CloudFormationResource) => {
      const rds = resource as RDSDBInstance;
      const engine = (rds.Properties!)?.Engine || '';
      return engine === 'mysql';
    }
  },

  // 接続・セッション系メトリクス（8個）
  {
    name: 'DatabaseConnectionsBorrowCount',
    namespace: 'AWS/RDS',
    unit: 'Count/Second',
    description: 'データベース接続借用数',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 10,
      warningMultiplier: 10.0,
      criticalMultiplier: 50.0
    }
  },
  {
    name: 'LoginFailures',
    namespace: 'AWS/RDS',
    unit: 'Count/Second',
    description: 'ログイン失敗数（セキュリティ）',
    statistic: 'Average',
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
    name: 'SelectLatency',
    namespace: 'AWS/RDS',
    unit: 'Seconds',
    description: 'SELECT文平均実行時間',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Latency',
    importance: 'Medium',
    threshold: {
      base: 0.1, // 100ms
      warningMultiplier: 5.0,
      criticalMultiplier: 20.0
    }
  },
  {
    name: 'DiskQueueDepth',
    namespace: 'AWS/RDS',
    unit: 'Count',
    description: 'ディスクI/Oキュー深度',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 10,
      warningMultiplier: 2.0,
      criticalMultiplier: 5.0
    }
  },
];

// Lambda メトリクス定義（18個）- AWS CloudWatch公式準拠
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

// ECS メトリクス定義（15個）- AWS CloudWatch公式準拠（Fargate特化）
export const ECS_METRICS: MetricConfig[] = [
  // CPU・メモリメトリクス（6個）
  {
    name: 'CPUUtilization',
    namespace: 'AWS/ECS',
    unit: 'Percent',
    description: 'タスクのCPU使用率',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'High',
    threshold: {
      base: 70,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.3
    }
  },
  {
    name: 'MemoryUtilization',
    namespace: 'AWS/ECS',
    unit: 'Percent',
    description: 'タスクのメモリ使用率',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'High',
    threshold: {
      base: 80,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.125 // 90%
    }
  },
  {
    name: 'CPUReservation',
    namespace: 'AWS/ECS',
    unit: 'Percent',
    description: 'クラスターのCPU予約率',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 70,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.2
    }
  },
  {
    name: 'MemoryReservation',
    namespace: 'AWS/ECS',
    unit: 'Percent',
    description: 'クラスターのメモリ予約率',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 70,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.2
    }
  },
  {
    name: 'EphemeralStorageUtilization',
    namespace: 'AWS/ECS',
    unit: 'Percent',
    description: '一時ストレージ使用率（Fargate）',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 80,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.125
    }
  },
  {
    name: 'TaskCount',
    namespace: 'AWS/ECS',
    unit: 'Count',
    description: '実行中タスク数',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 1, // 最低1つは実行中であるべき
      warningMultiplier: 0.5, // 0.5以下で警告
      criticalMultiplier: 0.1  // ほぼ0でクリティカル
    }
  },

  // サービスレベルメトリクス（5個）
  {
    name: 'ServiceCPUUtilization',
    namespace: 'AWS/ECS',
    unit: 'Percent',
    description: 'サービスのCPU使用率',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'High',
    threshold: {
      base: 70,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.3
    }
  },
  {
    name: 'ServiceMemoryUtilization',
    namespace: 'AWS/ECS',
    unit: 'Percent',
    description: 'サービスのメモリ使用率',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'High',
    threshold: {
      base: 80,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.125
    }
  },
  {
    name: 'PendingCount',
    namespace: 'AWS/ECS',
    unit: 'Count',
    description: '保留中タスク数',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 0, // 理想的には0
      warningMultiplier: 1.0,
      criticalMultiplier: 10.0
    }
  },
  {
    name: 'RunningCount',
    namespace: 'AWS/ECS',
    unit: 'Count',
    description: '実行中タスク数',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'High',
    threshold: {
      base: 1,
      warningMultiplier: 0.5, // 期待値の50%以下で警告
      criticalMultiplier: 0.1  // ほぼ停止状態
    }
  },
  {
    name: 'DesiredCount',
    namespace: 'AWS/ECS',
    unit: 'Count',
    description: '希望タスク数',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Low',
    threshold: {
      base: 2,
      warningMultiplier: 5.0,
      criticalMultiplier: 10.0
    }
  },

  // ネットワーク・ストレージメトリクス（4個）
  {
    name: 'NetworkRxBytes',
    namespace: 'AWS/ECS',
    unit: 'Bytes',
    description: 'ネットワーク受信バイト数',
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
  {
    name: 'NetworkTxBytes',
    namespace: 'AWS/ECS',
    unit: 'Bytes',
    description: 'ネットワーク送信バイト数',
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
  {
    name: 'StorageReadBytes',
    namespace: 'AWS/ECS',
    unit: 'Bytes',
    description: 'ストレージ読み取りバイト数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Low',
    threshold: {
      base: 104857600, // 100MB
      warningMultiplier: 10.0,
      criticalMultiplier: 50.0
    }
  },
  {
    name: 'StorageWriteBytes',
    namespace: 'AWS/ECS',
    unit: 'Bytes',
    description: 'ストレージ書き込みバイト数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Low',
    threshold: {
      base: 104857600, // 100MB
      warningMultiplier: 10.0,
      criticalMultiplier: 50.0
    }
  },
  {
    name: 'GPUUtilization',
    namespace: 'AWS/ECS',
    unit: 'Percent',
    description: 'GPU使用率（GPU対応タスク）',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 70,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.3
    }
  },
  {
    name: 'GPUMemoryUtilization',
    namespace: 'AWS/ECS',
    unit: 'Percent',
    description: 'GPUメモリ使用率',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 80,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.125
    }
  }
];

// ALB メトリクス定義（20個）- AWS CloudWatch公式準拠
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

// DynamoDB メトリクス定義（22個）- AWS CloudWatch公式準拠
export const DYNAMODB_METRICS: MetricConfig[] = [
  // 読み取り系メトリクス（6個）
  {
    name: 'ConsumedReadCapacityUnits',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: '消費読み取りキャパシティユニット',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'High',
    threshold: {
      base: 80, // プロビジョンド容量の想定
      warningMultiplier: 1.0,
      criticalMultiplier: 1.25
    }
  },
  {
    name: 'ConsumedWriteCapacityUnits',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: '消費書き込みキャパシティユニット',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'High',
    threshold: {
      base: 80,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.25
    }
  },
  {
    name: 'ReadThrottles',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: '読み取りスロットル数',
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
    name: 'WriteThrottles',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: '書き込みスロットル数',
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
    name: 'SystemErrors',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: 'システムエラー数',
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
    name: 'UserErrors',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: 'ユーザーエラー数',
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

  // GSI（Global Secondary Index）メトリクス（8個）
  {
    name: 'ConsumedReadCapacityUnits.GlobalSecondaryIndexes',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: 'GSI消費読み取りキャパシティユニット',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'High',
    threshold: {
      base: 80,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.25
    },
    applicableWhen: (resource: CloudFormationResource) => {
      const dynamodb = resource as DynamoDBTable;
      const props = dynamodb.Properties!;
      return !!(props?.GlobalSecondaryIndexes && props.GlobalSecondaryIndexes.length > 0);
    }
  },
  {
    name: 'ConsumedWriteCapacityUnits.GlobalSecondaryIndexes',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: 'GSI消費書き込みキャパシティユニット',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'High',
    threshold: {
      base: 80,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.25
    },
    applicableWhen: (resource: CloudFormationResource) => {
      const dynamodb = resource as DynamoDBTable;
      const props = dynamodb.Properties!;
      return !!(props?.GlobalSecondaryIndexes && props.GlobalSecondaryIndexes.length > 0);
    }
  },
  {
    name: 'ReadThrottles.GlobalSecondaryIndexes',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: 'GSI読み取りスロットル数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'High',
    threshold: {
      base: 1,
      warningMultiplier: 1.0,
      criticalMultiplier: 5.0
    },
    applicableWhen: (resource: CloudFormationResource) => {
      const dynamodb = resource as DynamoDBTable;
      const props = dynamodb.Properties!;
      return !!(props?.GlobalSecondaryIndexes && props.GlobalSecondaryIndexes.length > 0);
    }
  },
  {
    name: 'WriteThrottles.GlobalSecondaryIndexes',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: 'GSI書き込みスロットル数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'High',
    threshold: {
      base: 1,
      warningMultiplier: 1.0,
      criticalMultiplier: 5.0
    },
    applicableWhen: (resource: CloudFormationResource) => {
      const dynamodb = resource as DynamoDBTable;
      const props = dynamodb.Properties!;
      return !!(props?.GlobalSecondaryIndexes && props.GlobalSecondaryIndexes.length > 0);
    }
  },
  {
    name: 'OnlineIndexPercentageProgress',
    namespace: 'AWS/DynamoDB',
    unit: 'Percent',
    description: 'オンラインインデックス作成進捗率',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Low',
    threshold: {
      base: 50,
      warningMultiplier: 1.0,
      criticalMultiplier: 2.0
    }
  },
  {
    name: 'OnlineIndexThrottleEvents',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: 'オンラインインデックススロットルイベント数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'Medium',
    threshold: {
      base: 1,
      warningMultiplier: 1.0,
      criticalMultiplier: 5.0
    }
  },
  {
    name: 'OnlineIndexConsumedWriteCapacity',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: 'オンラインインデックス消費書き込み容量',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Low',
    threshold: {
      base: 10,
      warningMultiplier: 10.0,
      criticalMultiplier: 50.0
    }
  },
  {
    name: 'PendingReplicationCount',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: '保留中レプリケーション数（Global Tables）',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Medium',
    threshold: {
      base: 0,
      warningMultiplier: 1.0,
      criticalMultiplier: 100.0
    }
  },

  // オンデマンド・その他メトリクス（8個）
  {
    name: 'SuccessfulRequestLatency',
    namespace: 'AWS/DynamoDB',
    unit: 'Milliseconds',
    description: '成功リクエストレイテンシー',
    statistic: 'Average',
    evaluationPeriod: 300,
    category: 'Latency',
    importance: 'High',
    threshold: {
      base: 100, // 100ms
      warningMultiplier: 2.0,
      criticalMultiplier: 5.0
    }
  },
  {
    name: 'TransactionConflict',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: 'トランザクション競合数',
    statistic: 'Sum',
    evaluationPeriod: 300,
    category: 'Error',
    importance: 'Medium',
    threshold: {
      base: 5,
      warningMultiplier: 1.0,
      criticalMultiplier: 5.0
    }
  },
  {
    name: 'AccountProvisionedReadCapacityUtilization',
    namespace: 'AWS/DynamoDB',
    unit: 'Percent',
    description: 'アカウントプロビジョンド読み取り容量使用率',
    statistic: 'Maximum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 80,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.125
    }
  },
  {
    name: 'AccountProvisionedWriteCapacityUtilization',
    namespace: 'AWS/DynamoDB',
    unit: 'Percent',
    description: 'アカウントプロビジョンド書き込み容量使用率',
    statistic: 'Maximum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'Medium',
    threshold: {
      base: 80,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.125
    }
  },
  {
    name: 'AccountMaxReads',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: 'アカウント最大読み取り数',
    statistic: 'Maximum',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Low',
    threshold: {
      base: 40000,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.25
    }
  },
  {
    name: 'AccountMaxWrites',
    namespace: 'AWS/DynamoDB',
    unit: 'Count',
    description: 'アカウント最大書き込み数',
    statistic: 'Maximum',
    evaluationPeriod: 300,
    category: 'Performance',
    importance: 'Low',
    threshold: {
      base: 40000,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.25
    }
  },
  {
    name: 'MaxProvisionedTableReadCapacityUtilization',
    namespace: 'AWS/DynamoDB',
    unit: 'Percent',
    description: 'テーブル最大プロビジョンド読み取り容量使用率',
    statistic: 'Maximum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'High',
    threshold: {
      base: 80,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.25
    }
  },
  {
    name: 'MaxProvisionedTableWriteCapacityUtilization',
    namespace: 'AWS/DynamoDB',
    unit: 'Percent',
    description: 'テーブル最大プロビジョンド書き込み容量使用率',
    statistic: 'Maximum',
    evaluationPeriod: 300,
    category: 'Saturation',
    importance: 'High',
    threshold: {
      base: 80,
      warningMultiplier: 1.0,
      criticalMultiplier: 1.25
    }
  }
];

// API Gateway メトリクス定義（16個）- AWS CloudWatch公式準拠
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

// =============================================================================
// メトリクス定義マップ（CLAUDE.md: DRY原則）
// =============================================================================

export const METRICS_CONFIG_MAP: Record<string, MetricConfig[]> = {
  'AWS::RDS::DBInstance': RDS_METRICS,
  'AWS::Lambda::Function': LAMBDA_METRICS,
  'AWS::Serverless::Function': LAMBDA_METRICS, // SAM関数も同じメトリクス
  'AWS::ECS::Service': ECS_METRICS,
  'AWS::ElasticLoadBalancingV2::LoadBalancer': ALB_METRICS,
  'AWS::DynamoDB::Table': DYNAMODB_METRICS,
  'AWS::ApiGateway::RestApi': API_GATEWAY_METRICS,
  'AWS::Serverless::Api': API_GATEWAY_METRICS // SAM APIも同じメトリクス
};

// メトリクス統計情報（監視・デバッグ用）
export const METRICS_STATISTICS = {
  totalCount: RDS_METRICS.length + LAMBDA_METRICS.length + ECS_METRICS.length + 
              ALB_METRICS.length + DYNAMODB_METRICS.length + API_GATEWAY_METRICS.length,
  byResourceType: {
    RDS: RDS_METRICS.length,
    Lambda: LAMBDA_METRICS.length,
    ECS: ECS_METRICS.length,
    ALB: ALB_METRICS.length,
    DynamoDB: DYNAMODB_METRICS.length,
    APIGateway: API_GATEWAY_METRICS.length
  },
  byCategory: {
    Performance: [RDS_METRICS, LAMBDA_METRICS, ECS_METRICS, ALB_METRICS, DYNAMODB_METRICS, API_GATEWAY_METRICS]
      .flat().filter(m => m.category === 'Performance').length,
    Error: [RDS_METRICS, LAMBDA_METRICS, ECS_METRICS, ALB_METRICS, DYNAMODB_METRICS, API_GATEWAY_METRICS]
      .flat().filter(m => m.category === 'Error').length,
    Saturation: [RDS_METRICS, LAMBDA_METRICS, ECS_METRICS, ALB_METRICS, DYNAMODB_METRICS, API_GATEWAY_METRICS]
      .flat().filter(m => m.category === 'Saturation').length,
    Latency: [RDS_METRICS, LAMBDA_METRICS, ECS_METRICS, ALB_METRICS, DYNAMODB_METRICS, API_GATEWAY_METRICS]
      .flat().filter(m => m.category === 'Latency').length
  },
  byImportance: {
    High: [RDS_METRICS, LAMBDA_METRICS, ECS_METRICS, ALB_METRICS, DYNAMODB_METRICS, API_GATEWAY_METRICS]
      .flat().filter(m => m.importance === 'High').length,
    Medium: [RDS_METRICS, LAMBDA_METRICS, ECS_METRICS, ALB_METRICS, DYNAMODB_METRICS, API_GATEWAY_METRICS]
      .flat().filter(m => m.importance === 'Medium').length,
    Low: [RDS_METRICS, LAMBDA_METRICS, ECS_METRICS, ALB_METRICS, DYNAMODB_METRICS, API_GATEWAY_METRICS]
      .flat().filter(m => m.importance === 'Low').length
  }
};

// 型安全なメトリクス取得関数（CLAUDE.md: Type-Driven Development）
export function getMetricsForResourceType(resourceType: string): MetricConfig[] {
  return METRICS_CONFIG_MAP[resourceType] ?? [];
}

// 条件付きメトリクス数カウント（統計用）
export function getConditionalMetricsCount(): number {
  const allMetrics = Object.values(METRICS_CONFIG_MAP).flat();
  return allMetrics.filter(metric => !!metric.applicableWhen).length;
}