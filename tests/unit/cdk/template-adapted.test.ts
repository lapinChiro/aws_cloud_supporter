// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// tasks.md M-006: テンプレート単体テスト（公式型適応版）

import * as fs from 'fs';
import * as path from 'path';

import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as Handlebars from 'handlebars';

import { CDKOfficialHandlebarsHelpers } from '../../../src/templates/handlebars-official-helpers';

describe('CDK Official Template MVP', () => {
  let templateContent: string;
  let template: HandlebarsTemplateDelegate;

  beforeAll(() => {
    // Load official types template file
    const templatePath = path.join(__dirname, '../../../src/templates/cdk-official.hbs');
    templateContent = fs.readFileSync(templatePath, 'utf-8');
    
    // Register Handlebars helpers
    CDKOfficialHandlebarsHelpers.registerHelpers();
  });

  describe('Template Compilation', () => {
    it('should compile without Handlebars errors', () => {
      expect(() => {
        template = Handlebars.compile(templateContent);
      }).not.toThrow();
      
      expect(typeof template).toBe('function');
    });

    it('should contain required CDK structure with official types', () => {
      expect(templateContent).toContain('import * as cdk from \'aws-cdk-lib\'');
      expect(templateContent).toContain('import * as cloudwatch from \'aws-cdk-lib/aws-cloudwatch\'');
      expect(templateContent).toContain('import { Construct } from \'constructs\'');
      expect(templateContent).toContain('export class {{stackClassName}} extends cdk.Stack');
      expect(templateContent).toContain('aws-cdk-lib official types');
    });

    it('should contain alarm generation logic for official types', () => {
      expect(templateContent).toContain('{{#each alarms}}');
      expect(templateContent).toContain('new cloudwatch.Alarm(this,');
      expect(templateContent).toContain('{{renderCompleteMetric metricForTemplate}}');
      expect(templateContent).toContain('{{renderTreatMissingData treatMissingData}}');
    });

    it('should contain SNS integration logic', () => {
      expect(templateContent).toContain('{{#if snsConfiguration}}');
      expect(templateContent).toContain('sns.Topic.fromTopicArn');
      expect(templateContent).toContain('{{renderTopicProps snsConfiguration.topicProps}}');
      expect(templateContent).toContain('addAlarmAction');
    });
  });

  describe('Template Rendering with Official Types', () => {
    beforeEach(() => {
      template = Handlebars.compile(templateContent);
    });

    it('should render basic stack with official types', () => {
      const testData = createTestStackData();
      
      const result = template(testData);
      
      expect(result).toContain('export class TestStack extends cdk.Stack');
      expect(result).toContain('TestResourceCPUUtilizationWarningAlarm');
      expect(result).toContain('cloudwatch.TreatMissingData.notBreaching');
      expect(result).toContain('cloudwatch.ComparisonOperator.GreaterThanThreshold');
    });

    it('should render SNS integration correctly', () => {
      const testData = createTestStackDataWithSNS();
      
      const result = template(testData);
      
      expect(result).toContain('new sns.Topic(this, \'AlarmNotificationTopic\'');
      expect(result).toMatch(/topicName.*CloudWatchAlarmNotifications/);
      expect(result).toMatch(/addAlarmAction.*SnsAction.*alarmTopic/);
    });

    it('should render existing SNS topic correctly', () => {
      const testData = createTestStackDataWithExistingSNS();
      
      const result = template(testData);
      
      expect(result).toContain('sns.Topic.fromTopicArn(');
      expect(result).toContain('arn:aws:sns:us-east-1:123456789012:existing-topic');
      expect(result).not.toContain('new sns.Topic'); // Should not create new
    });

    it('should handle empty alarms array', () => {
      const testData = createTestStackDataEmpty();
      
      const result = template(testData);
      
      expect(result).toContain('export class EmptyStack extends cdk.Stack');
      expect(result).toContain('No alarms generated');
      expect(result).not.toContain('new cloudwatch.Alarm');
    });
  });
});

// テストデータ作成関数（公式型対応）
function createTestStackData(): any {
  const testMetric = new cloudwatch.Metric({
    metricName: 'CPUUtilization',
    namespace: 'AWS/RDS',
    dimensionsMap: { DBInstanceIdentifier: 'TestResource' }
  });

  return {
    stackClassName: 'TestStack',
    alarms: [{
      // Template用に事前処理されたデータ
      constructId: 'TestResourceCPUUtilizationWarningAlarm',
      threshold: 70,
      alarmDescription: 'CPU utilization monitoring',
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      datapointsToAlarm: 1,
      severity: 'Warning',
      resourceLogicalId: 'TestResource',
      resourceType: 'AWS::RDS::DBInstance',
      metricForTemplate: CDKOfficialHandlebarsHelpers.processMetricForTemplate(testMetric)
    }],
    metadata: {
      generatedAt: new Date().toISOString(),
      templatePath: 'test.yaml',
      totalResources: 1,
      totalAlarms: 1,
      toolVersion: '1.0.0'
    }
  };
}

function createTestStackDataWithSNS(): any {
  const baseData = createTestStackData();
  return {
    ...baseData,
    snsConfiguration: {
      variableName: 'alarmTopic',
      isExisting: false,
      topicProps: {
        topicName: 'CloudWatchAlarmNotifications',
        displayName: 'CloudWatch Alarm Notifications'
      }
    }
  };
}

function createTestStackDataWithExistingSNS(): any {
  const baseData = createTestStackData();
  return {
    ...baseData,
    snsConfiguration: {
      variableName: 'alarmTopic',
      isExisting: true,
      topicArn: 'arn:aws:sns:us-east-1:123456789012:existing-topic'
    }
  };
}

function createTestStackDataEmpty(): any {
  return {
    stackClassName: 'EmptyStack',
    alarms: [],
    metadata: {
      generatedAt: new Date().toISOString(),
      templatePath: 'empty.yaml',
      totalResources: 0,
      totalAlarms: 0,
      toolVersion: '1.0.0'
    }
  };
}