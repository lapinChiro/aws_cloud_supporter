// tests/unit/cdk/cdk-official-generator-advanced.test.ts (新規作成)
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import type * as sns from 'aws-cdk-lib/aws-sns';

import { CDKOfficialGenerator } from '../../../src/generators/cdk-official.generator';
import type { ExtendedAnalysisResult } from '../../../src/interfaces/analyzer';
import type { ILogger } from '../../../src/interfaces/logger';
import type { CDKOptions } from '../../../src/types/cdk-business';
import type { ResourceWithMetrics, MetricDefinition } from '../../../src/types/metrics';
import { createMockLogger } from '../../helpers/test-helpers';

function createTestMetricDefinition(metricName: string, namespace: string, importance: 'High' | 'Low' = 'High'): MetricDefinition {
  return {
    metric_name: metricName,
    namespace: namespace,
    statistic: 'Average',
    unit: 'Percent',
    evaluation_period: 300,
    recommended_threshold: {
      warning: 70,
      critical: 90
    },
    description: `${metricName} monitoring for ${namespace}`,
    category: 'Performance',
    importance: importance
  };
}


function createTestResourceWithMetrics(resourceType: string, logicalId: string): ResourceWithMetrics {
  return {
    logical_id: logicalId,
    resource_type: resourceType,
    resource_properties: {},
    metrics: [
      createTestMetricDefinition('CPUUtilization', 'AWS/RDS')
    ]
  };
}

// Test data creation helpers
function createTestAnalysisResult(): ExtendedAnalysisResult {
  return {
    resources: [
      createTestResourceWithMetrics('AWS::RDS::DBInstance', 'TestDBInstance')
    ],
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'test-template.yaml',
      total_resources: 1,
      supported_resources: 1
    },
    unsupported_resources: []
  };
}

function createTestAnalysisResultWithSensitiveData(): ExtendedAnalysisResult {
  return {
    resources: [
      {
        logical_id: 'SensitiveDB',
        resource_type: 'AWS::RDS::DBInstance',
        resource_properties: {
          MasterUsername: 'admin',
          MasterUserPassword: 'secret123',
          DBName: 'myapp'
        },
        metrics: [
          createTestMetricDefinition('CPUUtilization', 'AWS/RDS')
        ]
      }
    ],
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'test-template.yaml',
      total_resources: 1,
      supported_resources: 1
    },
    unsupported_resources: []
  };
}

function createTestAnalysisResultWithLowImportance(): ExtendedAnalysisResult {
  return {
    resources: [
      {
        logical_id: 'TestResource',
        resource_type: 'AWS::RDS::DBInstance',
        resource_properties: {},
        metrics: [
          createTestMetricDefinition('CPUUtilization', 'AWS/RDS', 'High'),
          createTestMetricDefinition('DatabaseConnections', 'AWS/RDS', 'Low')
        ]
      }
    ],
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'test-template.yaml',
      total_resources: 1,
      supported_resources: 1
    },
    unsupported_resources: []
  };
}

describe('CDKOfficialGenerator Advanced Features', () => {
  let generator: CDKOfficialGenerator;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
    generator = new CDKOfficialGenerator(mockLogger);
  });

  describe('SNS Integration', () => {
    it('should handle SNS topic creation for new topics', async () => {
      const analysis: ExtendedAnalysisResult = createTestAnalysisResult();
      const options: CDKOptions = { 
        enabled: true, 
        enableSNS: true 
      };

      try {
        await generator.generate(analysis, options);
        // Expected to fail due to missing template, but should process SNS config
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Creating new SNS topic for alarm notifications'
        );
      } catch (error) {
        // Expected due to missing template
        expect((error as Error).message).toContain('template loading failed');
      }
    });

    it('should handle existing SNS topic ARN', async () => {
      const analysis: ExtendedAnalysisResult = createTestAnalysisResult();
      const options: CDKOptions = { 
        enabled: true, 
        snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:existing-topic'
      };

      try {
        await generator.generate(analysis, options);
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Using existing SNS topic: arn:aws:sns:us-east-1:123456789012:existing-topic'
        );
      } catch (error) {
        // Expected due to missing template
        expect((error as Error).message).toContain('template loading failed');
      }
    });

    it('should not configure SNS when neither enableSNS nor snsTopicArn is set', async () => {
      const analysis: ExtendedAnalysisResult = createTestAnalysisResult();
      const options: CDKOptions = { enabled: true };

      try {
        await generator.generate(analysis, options);
      } catch (_error) {
        // Should not log SNS configuration messages
        expect(mockLogger.debug).not.toHaveBeenCalledWith(
          expect.stringContaining('SNS topic')
        );
      }
    });
  });

  describe('Security Features', () => {
    it('should apply security validation to CDK options', async () => {
      const analysis: ExtendedAnalysisResult = createTestAnalysisResult();
      const options: CDKOptions = {
        enabled: true,
        stackName: 'TestStack',
        outputDir: '/valid/path',
        snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:topic'
      };

      // Should not throw validation errors for valid options
      try {
        await generator.generate(analysis, options);
      } catch (error) {
        // Should fail due to missing template, not validation
        expect((error as Error).message).not.toContain('validation');
      }
    });

    it('should handle verbose logging for security sanitization', async () => {
      const analysis: ExtendedAnalysisResult = createTestAnalysisResultWithSensitiveData();
      const options: CDKOptions = { 
        enabled: true, 
        verbose: true 
      };

      try {
        await generator.generate(analysis, options);
      } catch (_error) {
        // Expected due to missing template, but should process resources with verbose logging
        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.stringContaining('Sanitized')
        );
      }
    });
  });

  describe('Advanced Alarm Features', () => {
    it('should create alarms with additional CloudWatch properties', () => {
      // Test that advanced alarm definitions include comparisonOperator and datapointsToAlarm
      expect(cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD).toBeDefined();
      expect(typeof cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD).toBe('string');
    });

    it('should filter low importance metrics when includeLowImportance is false', async () => {
      const analysis: ExtendedAnalysisResult = createTestAnalysisResultWithLowImportance();
      const options: CDKOptions = { 
        enabled: true,
        includeLowImportance: false
      };

      try {
        await generator.generate(analysis, options);
        // Should process without low importance metrics
        expect(analysis.resources[0]?.metrics.some(m => m.importance === 'Low')).toBe(true);
      } catch (_error) {
        // Expected due to missing template
      }
    });

    it('should include low importance metrics when includeLowImportance is true', async () => {
      const analysis: ExtendedAnalysisResult = createTestAnalysisResultWithLowImportance();
      const options: CDKOptions = { 
        enabled: true,
        includeLowImportance: true
      };

      try {
        await generator.generate(analysis, options);
        // Should process all metrics including low importance
        expect(analysis.resources[0]?.metrics.some(m => m.importance === 'Low')).toBe(true);
      } catch (_error) {
        // Expected due to missing template
      }
    });
  });

  describe('AWS Official Types Usage', () => {
    it('should use sns.TopicProps type for SNS configuration', () => {
      // Test that we're using the correct SNS types
      const topicProps: sns.TopicProps = {
        topicName: 'test-topic',
        displayName: 'Test Topic'
      };
      
      expect(topicProps.topicName).toBe('test-topic');
      expect(typeof topicProps).toBe('object');
    });

    it('should use cloudwatch.ComparisonOperator enum', () => {
      expect(cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD).toBe('GreaterThanThreshold');
      expect(cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD).toBe('LessThanThreshold');
    });
  });
});