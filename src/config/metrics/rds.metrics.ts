import type { CloudFormationResource , RDSDBInstance } from '../../types/cloudformation';

import type { MetricConfig } from './types';

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
      const instanceClass = rds.Properties?.DBInstanceClass || '';
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
      const instanceClass = rds.Properties?.DBInstanceClass || '';
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
      const engine = rds.Properties?.Engine || '';
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
      const props = rds.Properties;
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
      const props = rds.Properties;
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
      const engine = rds.Properties?.Engine || '';
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
      const engine = rds.Properties?.Engine || '';
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
      const engine = rds.Properties?.Engine || '';
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
      const engine = rds.Properties?.Engine || '';
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
      const engine = rds.Properties?.Engine || '';
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