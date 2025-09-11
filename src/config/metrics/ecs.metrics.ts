import type { MetricConfig } from './types';

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