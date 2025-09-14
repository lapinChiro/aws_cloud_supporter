// tests/unit/cdk/business-types.test.ts (新規作成)
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

import type { 
  CDKAlarmComplete} from '../../../src/types/cdk-business';
import {
  extractOfficialAlarmProps,
  extractBusinessProps
} from '../../../src/types/cdk-business';

function createTestAlarmComplete(): CDKAlarmComplete {
  return {
    metric: new cloudwatch.Metric({
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      dimensionsMap: { DBInstanceIdentifier: 'test' }
    }),
    threshold: 80,
    alarmDescription: 'Test alarm',
    evaluationPeriods: 1,
    constructId: 'TestAlarm',
    severity: 'Warning',
    resourceLogicalId: 'TestResource',
    resourceType: 'AWS::RDS::DBInstance'
  };
}

describe('CDK Business Types', () => {
  it('should create valid CDKAlarmComplete with official and business types', () => {
    const testMetric = new cloudwatch.Metric({
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      dimensionsMap: { DBInstanceIdentifier: 'test' }
    });

    const alarmComplete: CDKAlarmComplete = {
      // AWS公式型部分
      metric: testMetric,
      threshold: 80,
      alarmDescription: 'Test alarm',
      evaluationPeriods: 1,
      
      // ビジネスロジック部分
      constructId: 'TestAlarm',
      severity: 'Warning',
      resourceLogicalId: 'TestResource',
      resourceType: 'AWS::RDS::DBInstance'
    };

    expect(alarmComplete.threshold).toBe(80);
    expect(alarmComplete.constructId).toBe('TestAlarm');
    expect(alarmComplete.severity).toBe('Warning');
  });

  it('should extract official props correctly', () => {
    const complete: CDKAlarmComplete = createTestAlarmComplete();
    const officialProps = extractOfficialAlarmProps(complete);
    
    expect(officialProps.threshold).toBe(80);
    expect(officialProps.metric).toBeDefined();
    expect('constructId' in officialProps).toBe(false); // ビジネスプロパティは除外
  });

  it('should extract business props correctly', () => {
    const complete: CDKAlarmComplete = createTestAlarmComplete();
    const businessProps = extractBusinessProps(complete);
    
    expect(businessProps.constructId).toBe('TestAlarm');
    expect(businessProps.severity).toBe('Warning');
    expect('threshold' in businessProps).toBe(false); // 公式プロパティは除外
  });

  it('should handle Critical severity alarms', () => {
    const complete: CDKAlarmComplete = {
      ...createTestAlarmComplete(),
      severity: 'Critical',
      threshold: 90
    };
    
    const businessProps = extractBusinessProps(complete);
    expect(businessProps.severity).toBe('Critical');
  });

  it('should maintain type safety for AWS resource types', () => {
    const complete: CDKAlarmComplete = createTestAlarmComplete();
    
    expect(complete.resourceType).toBe('AWS::RDS::DBInstance');
    expect(typeof complete.resourceLogicalId).toBe('string');
    expect(['Warning', 'Critical'].includes(complete.severity)).toBe(true);
  });
});