// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// tasks.md M-006: SNS統合機能テスト（公式型適応版）

import { CDKOfficialGenerator } from '../../../src/generators/cdk-official.generator';
import type { ExtendedAnalysisResult } from '../../../src/interfaces/analyzer';
import type { ILogger } from '../../../src/interfaces/logger';
import type { CDKOptions } from '../../../src/types/cdk-business';
import type { MetricDefinition } from '../../../src/types/metrics';

// テスト用モックロガー
const createMockLogger = (): ILogger => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  success: jest.fn(),
  setLevel: jest.fn()
});

describe('CDK SNS Integration (Official Types)', () => {
  let generator: CDKOfficialGenerator;

  beforeEach(() => {
    generator = new CDKOfficialGenerator(createMockLogger());
  });

  describe('New SNS Topic Creation with Official Types', () => {
    it('should generate new SNS topic using sns.TopicProps when --cdk-enable-sns is specified', async () => {
      const mockAnalysis = createMockAnalysisWithRDS();
      const options: CDKOptions = { 
        enabled: true,
        enableSNS: true
      };
      
      const result = await generator.generate(mockAnalysis, options);
      
      // Should include SNS imports
      expect(result).toContain('import * as sns from \'aws-cdk-lib/aws-sns\'');
      expect(result).toContain('import * as cloudwatchActions from \'aws-cdk-lib/aws-cloudwatch-actions\'');
      
      // Should create new SNS Topic using official types (allowing for HTML escaping)
      expect(result).toContain('new sns.Topic(this, \'AlarmNotificationTopic\'');
      expect(result).toMatch(/topicName.*CloudWatchAlarmNotifications/);
      expect(result).toMatch(/displayName.*CloudWatch Alarm Notifications/);
      
      // Should add SNS actions to alarms  
      expect(result).toMatch(/\.addAlarmAction\(new cloudwatchActions\.SnsAction\(alarmTopic\)\)/);
      
      // Should use official types formatting
      expect(result).toContain('aws-cdk-lib official types');
    });

    it('should not include SNS imports when SNS is not enabled', async () => {
      const mockAnalysis = createMockAnalysisWithRDS();
      const options: CDKOptions = { enabled: true }; // No enableSNS
      
      const result = await generator.generate(mockAnalysis, options);
      
      // Should not include SNS imports
      expect(result).not.toContain('import * as sns from \'aws-cdk-lib/aws-sns\'');
      expect(result).not.toContain('import * as cloudwatchActions from \'aws-cdk-lib/aws-cloudwatch-actions\'');
      
      // Should not create SNS Topic
      expect(result).not.toContain('new sns.Topic');
      expect(result).not.toContain('addAlarmAction');
    });
  });

  describe('Existing SNS Topic Integration', () => {
    it('should use existing SNS topic ARN when provided', async () => {
      const mockAnalysis = createMockAnalysisWithRDS();
      const existingTopicArn = 'arn:aws:sns:us-east-1:123456789012:existing-alarm-topic';
      const options: CDKOptions = { 
        enabled: true,
        snsTopicArn: existingTopicArn
      };
      
      const result = await generator.generate(mockAnalysis, options);
      
      // Should include SNS imports
      expect(result).toContain('import * as sns from \'aws-cdk-lib/aws-sns\'');
      
      // Should import existing topic (not create new)
      expect(result).toContain('sns.Topic.fromTopicArn(');
      expect(result).toContain(existingTopicArn);
      expect(result).not.toContain('new sns.Topic'); // Should not create new topic
      
      // Should add SNS actions to alarms
      expect(result).toContain('addAlarmAction');
    });

    it('should reject invalid SNS topic ARN format', async () => {
      const mockAnalysis = createMockAnalysisWithRDS();
      const invalidTopicArn = 'invalid-arn-format';
      const options: CDKOptions = { 
        enabled: true,
        snsTopicArn: invalidTopicArn
      };
      
      // Should throw error due to invalid ARN format (validation in CDKInputValidator)
      await expect(
        generator.generate(mockAnalysis, options)
      ).rejects.toThrow('CDK Official Types generation failed');
    });
  });

  describe('SNS Integration with Multiple Resources', () => {
    it('should add SNS actions to all generated alarms', async () => {
      const mockAnalysis = createMockAnalysisWithMultipleRDSResources();
      const options: CDKOptions = { 
        enabled: true,
        enableSNS: true
      };
      
      const result = await generator.generate(mockAnalysis, options);
      
      // Should have one SNS topic
      const snsTopicMatches = result.match(/new sns\.Topic/g);
      expect(snsTopicMatches).not.toBeNull();
      expect(snsTopicMatches!.length).toBe(1); // Only one SNS topic
      
      // Should add actions to all alarms (2 resources × 2 metrics × 2 severities = 8 actions)
      const snsActionMatches = result.match(/\.addAlarmAction/g);
      expect(snsActionMatches).not.toBeNull();
      expect(snsActionMatches!.length).toBe(8); // All alarms should have SNS action
    });
  });

  describe('Error Handling', () => {
    it('should handle SNS configuration with disabled CDK mode', async () => {
      const mockAnalysis = createMockAnalysisWithRDS();
      const options: CDKOptions = { 
        enabled: false, // CDK disabled
        enableSNS: true 
      };
      
      await expect(
        generator.generate(mockAnalysis, options)
      ).rejects.toThrow('CDK mode must be enabled');
    });
  });
});

// テストデータ作成関数
function createMockAnalysisWithRDS(): ExtendedAnalysisResult {
  return {
    resources: [{
      logical_id: 'TestDB',
      resource_type: 'AWS::RDS::DBInstance',
      resource_properties: {},
      metrics: [
        createMockMetric('CPUUtilization', 'AWS/RDS'),
        createMockMetric('DatabaseConnections', 'AWS/RDS')
      ]
    }],
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'rds-template.yaml',
      total_resources: 1,
      supported_resources: 1
    },
    unsupported_resources: []
  };
}

function createMockAnalysisWithMultipleRDSResources(): ExtendedAnalysisResult {
  return {
    resources: [
      {
        logical_id: 'TestDB1',
        resource_type: 'AWS::RDS::DBInstance',
        resource_properties: {},
        metrics: [
          createMockMetric('CPUUtilization', 'AWS/RDS'),
          createMockMetric('DatabaseConnections', 'AWS/RDS')
        ]
      },
      {
        logical_id: 'TestDB2',
        resource_type: 'AWS::RDS::DBInstance',
        resource_properties: {},
        metrics: [
          createMockMetric('CPUUtilization', 'AWS/RDS'),
          createMockMetric('DatabaseConnections', 'AWS/RDS')
        ]
      }
    ],
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'multiple-rds-template.yaml',
      total_resources: 2,
      supported_resources: 2
    },
    unsupported_resources: []
  };
}

function createMockMetric(metricName: string, namespace: string): MetricDefinition {
  return {
    metric_name: metricName,
    namespace: namespace,
    statistic: 'Average',
    unit: 'Count',
    evaluation_period: 300,
    recommended_threshold: {
      warning: 70,
      critical: 90
    },
    description: `${metricName} monitoring for ${namespace}`,
    category: 'Performance',
    importance: 'High'
  };
}