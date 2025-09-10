// src/types/aws-cdk-official.ts
// 要件: 独自型定義廃止、公式型使用
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';

// AWS公式型の直接再エクスポート
export type { 
  AlarmProps,
  MetricProps, 
  DimensionsMap,
  IMetric,
  TreatMissingData,
  Stats
} from 'aws-cdk-lib/aws-cloudwatch';

export type { 
  TopicProps,
  ITopic 
} from 'aws-cdk-lib/aws-sns';

export type { 
  StackProps,
  Duration 
} from 'aws-cdk-lib';

// 利用しやすさのための型エイリアス
export type CDKAlarmPropsOfficial = cloudwatch.AlarmProps;
export type CDKTopicPropsOfficial = sns.TopicProps;
export type CDKMetricPropsOfficial = cloudwatch.MetricProps;
export type CDKDimensionsMapOfficial = cloudwatch.DimensionsMap;