import type { CloudFormationResource, DynamoDBTable } from '../../types/cloudformation';

import type { MetricConfig } from './types';

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