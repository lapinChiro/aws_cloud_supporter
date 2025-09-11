// tests/unit/cdk/official-types-compatibility.test.ts (新規作成)
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

import type { 
  CDKAlarmPropsOfficial, 
  CDKTopicPropsOfficial 
} from '../../../src/types/aws-cdk-official';

describe('AWS CDK Official Types Compatibility', () => {
  it('should correctly import CloudWatch AlarmProps', () => {
    const alarmProps: CDKAlarmPropsOfficial = {
      metric: new cloudwatch.Metric({
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        dimensionsMap: { DBInstanceIdentifier: 'test' }
      }),
      threshold: 80,
      alarmDescription: 'Test alarm',
      evaluationPeriods: 1
    };
    
    expect(alarmProps.threshold).toBe(80);
    expect(alarmProps.metric).toBeDefined();
  });

  it('should correctly import SNS TopicProps', () => {
    const topicProps: CDKTopicPropsOfficial = {
      topicName: 'test-topic',
      displayName: 'Test Topic'
    };
    
    expect(topicProps.topicName).toBe('test-topic');
    expect(topicProps.displayName).toBe('Test Topic');
  });

  it('should maintain type compatibility with original aws-cdk-lib', () => {
    // 型エイリアスが元の型と同等であることを確認
    const officialAlarmProps: cloudwatch.AlarmProps = {} as CDKAlarmPropsOfficial;
    const aliasAlarmProps: CDKAlarmPropsOfficial = {} as cloudwatch.AlarmProps;
    
    expect(typeof officialAlarmProps).toBe(typeof aliasAlarmProps);
  });
});