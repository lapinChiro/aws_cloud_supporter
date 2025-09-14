// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// CDK Full Features SNS Integration Tests
import { runCLICommand } from './cdk-full-features.test-helpers';

describe('CDK Full Features - SNS Integration', () => {
  describe('SNS Integration Full Testing', () => {
    it('should work with new SNS topic creation across templates', async () => {
      const templates = [
        'examples/web-application-stack.yaml',
        'examples/serverless-api-sam.yaml'
      ];

      for (const template of templates) {
        const result = await runCLICommand([
          template,
          '--output', 'cdk',
          '--cdk-enable-sns'
        ], 25000);
        
        expect(result.exitCode).toBe(0);
        
        // Verify SNS imports and topic creation
        expect(result.stdout).toContain('import * as sns from \'aws-cdk-lib/aws-sns\'');
        expect(result.stdout).toContain('import * as cloudwatchActions from \'aws-cdk-lib/aws-cloudwatch-actions\'');
        expect(result.stdout).toContain('new sns.Topic(this, \'AlarmNotificationTopic\'');
        expect(result.stdout).toContain('topicName: \'CloudWatchAlarmNotifications\'');
        
        // Verify SNS actions are added to all alarms
        const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) ?? []).length;
        const snsActionCount = (result.stdout.match(/\.addAlarmAction\(new cloudwatchActions\.SnsAction\(/g) ?? []).length;
        
        expect(alarmCount).toBeGreaterThan(0);
        expect(snsActionCount).toBe(alarmCount); // Every alarm should have SNS action
        
        console.log(`✅ SNS integration for ${template}: ${alarmCount} alarms, ${snsActionCount} SNS actions`);
      }
    }, 60000); // 1 minute timeout

    it('should work with existing SNS topic ARN', async () => {
      const validSnsArn = 'arn:aws:sns:us-east-1:123456789012:existing-topic';
      
      const result = await runCLICommand([
        'examples/web-application-stack.yaml',
        '--output', 'cdk',
        '--resource-types', 'AWS::RDS::DBInstance',
        '--cdk-sns-topic-arn', validSnsArn
      ], 20000);
      
      expect(result.exitCode).toBe(0);
      
      // Should import existing topic, not create new
      expect(result.stdout).toContain('sns.Topic.fromTopicArn(');
      expect(result.stdout).toContain(validSnsArn);
      expect(result.stdout).not.toContain('new sns.Topic(');
      
      // Should still have SNS actions
      expect(result.stdout).toMatch(/\.addAlarmAction\(new cloudwatchActions\.SnsAction\(/);
    });
  });
});