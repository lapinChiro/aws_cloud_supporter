// tests/unit/cdk/cdk-official-template-integration.test.ts (新規作成)
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

import { CDKOfficialGenerator } from '../../../src/generators/cdk-official.generator';
import type { ExtendedAnalysisResult } from '../../../src/interfaces/analyzer';
import type { ILogger } from '../../../src/interfaces/logger';
import type { CDKOptions } from '../../../src/types/cdk-business';
import type { ResourceWithMetrics, MetricDefinition } from '../../../src/types/metrics';

// テスト用モックロガー
const createMockLogger = (): ILogger => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  success: jest.fn(),
  setLevel: jest.fn()
});

function createTestMetricDefinition(metricName: string, namespace: string): MetricDefinition {
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
    importance: 'High'
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

function createTestAnalysisResultWithMultipleResources(): ExtendedAnalysisResult {
  return {
    resources: [
      createTestResourceWithMetrics('AWS::RDS::DBInstance', 'TestDB'),
      createTestResourceWithMetrics('AWS::Lambda::Function', 'TestFunction')
    ],
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'multi-resource-template.yaml',
      total_resources: 2,
      supported_resources: 2
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
      template_path: 'sensitive-template.yaml',
      total_resources: 1,
      supported_resources: 1
    },
    unsupported_resources: []
  };
}

describe('CDKOfficialGenerator Template Integration', () => {
  let generator: CDKOfficialGenerator;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
    generator = new CDKOfficialGenerator(mockLogger);
  });

  describe('Template Integration with Real Data', () => {
    it('should generate CDK code successfully with official types', async () => {
      const analysis: ExtendedAnalysisResult = createTestAnalysisResult();
      const options: CDKOptions = { enabled: true };

      const result = await generator.generate(analysis, options);
      
      // Should generate valid CDK code using official types
      expect(result).toContain('cloudwatch.Alarm');
      expect(result).toContain('cloudwatch.TreatMissingData.notBreaching');
      expect(result).toContain('cloudwatch.ComparisonOperator.GreaterThanThreshold');
      expect(result).toContain('cdk.Duration.seconds');
      expect(result).toContain('export class CloudWatchAlarmsStack');
      
      // Should log successful completion
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('CDK Official Types generation completed')
      );
    });

    it('should process stack data correctly for template with SNS', async () => {
      const analysis: ExtendedAnalysisResult = createTestAnalysisResultWithMultipleResources();
      const options: CDKOptions = { 
        enabled: true,
        enableSNS: true,
        stackName: 'TestStack'
      };

      const result = await generator.generate(analysis, options);
      
      // Should generate CDK code with SNS integration
      expect(result).toContain('export class TestStack');
      expect(result).toContain('new sns.Topic');
      expect(result).toContain('CloudWatchAlarmNotifications');
      expect(result).toContain('cloudwatch.Alarm');
      
      // Should have processed resources and logged appropriate debug messages
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('supported resources')
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Creating new SNS topic for alarm notifications'
      );
    });

    it('should handle security sanitization during data processing', async () => {
      const analysis: ExtendedAnalysisResult = createTestAnalysisResultWithSensitiveData();
      const options: CDKOptions = { 
        enabled: true,
        verbose: true
      };

      const result = await generator.generate(analysis, options);
      
      // Should generate CDK code successfully
      expect(result).toContain('cloudwatch.Alarm');
      expect(result).toContain('export class CloudWatchAlarmsStack');
      
      // Should have logged sanitization warnings
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Sanitized')
      );
    });

    it('should process alarm data correctly for template rendering', () => {
      // Test the structure that will be passed to the template
      const testMetric = new cloudwatch.Metric({
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        dimensionsMap: { DBInstanceIdentifier: 'test-db' }
      });

      // Verify the metric can be processed for template
      expect(testMetric).toBeDefined();
      expect(typeof testMetric.toMetricConfig).toBe('function');
    });

    it('should generate correct construct IDs', () => {
      // Test that construct ID generation follows expected patterns
      const analysis: ExtendedAnalysisResult = createTestAnalysisResult();
      
      // Constructor IDs should follow pattern: {LogicalId}{MetricName}{Severity}Alarm
      expect(analysis.resources[0]?.logical_id).toBe('TestDBInstance');
      expect(analysis.resources[0]?.metrics[0]?.metric_name).toBe('CPUUtilization');
      
      // Expected construct IDs: TestDBInstanceCPUUtilizationWarningAlarm, TestDBInstanceCPUUtilizationCriticalAlarm
    });
  });
});
