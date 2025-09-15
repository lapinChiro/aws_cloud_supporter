// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// tasks.md M-006: CDK Generator基本クラステスト（公式型適応版）

import { CDKOfficialGenerator } from '../../../src/generators/cdk-official.generator';
import type { ExtendedAnalysisResult } from '../../../src/interfaces/analyzer';
import type { CDKOptions } from '../../../src/types/cdk-business';
import type { ResourceWithMetrics, MetricDefinition } from '../../../src/types/metrics';
import { CloudSupporterError } from '../../../src/utils/error';
import { createMockLogger } from '../../helpers/test-helpers';

function createMockMetric(
  metricName: string, 
  namespace: string, 
  importance: 'High' | 'Low' = 'High'
): MetricDefinition {
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

// テストデータ作成関数（公式型対応）
function createMockAnalysisResultWithRDS(resourceCount: number): ExtendedAnalysisResult {
  const resources: ResourceWithMetrics[] = [];
  
  for (let i = 1; i <= resourceCount; i++) {
    resources.push({
      logical_id: `Database${i}`,
      resource_type: 'AWS::RDS::DBInstance',
      resource_properties: {
        Engine: 'mysql',
        DBInstanceClass: 'db.t3.micro'
      },
      metrics: [
        createMockMetric('CPUUtilization', 'AWS/RDS', 'High'),
        createMockMetric('DatabaseConnections', 'AWS/RDS', 'High')
      ]
    });
  }

  return {
    resources,
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'test-rds-template.yaml',
      total_resources: resourceCount,
      supported_resources: resourceCount
    },
    unsupported_resources: []
  };
}

function createMockAnalysisResultWithComplexMetrics(): ExtendedAnalysisResult {
  return {
    resources: [{
      logical_id: 'ComplexDatabase',
      resource_type: 'AWS::RDS::DBInstance',
      resource_properties: {},
      metrics: [
        createMockMetric('CPUUtilization', 'AWS/RDS', 'High'),
        createMockMetric('DatabaseConnections', 'AWS/RDS', 'High')
      ]
    }],
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'complex-metrics-template.yaml',
      total_resources: 1,
      supported_resources: 1
    },
    unsupported_resources: []
  };
}

function createMockAnalysisResultWithMixedImportance(): ExtendedAnalysisResult {
  return {
    resources: [{
      logical_id: 'MixedDatabase',
      resource_type: 'AWS::RDS::DBInstance',
      resource_properties: {},
      metrics: [
        createMockMetric('CPUUtilization', 'AWS/RDS', 'High'),
        createMockMetric('SwapUsage', 'AWS/RDS', 'Low')
      ]
    }],
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'mixed-importance-template.yaml',
      total_resources: 1,
      supported_resources: 1
    },
    unsupported_resources: []
  };
}

function createMockAnalysisResultWithMultipleTypes(): ExtendedAnalysisResult {
  return {
    resources: [
      {
        logical_id: 'TestDatabase',
        resource_type: 'AWS::RDS::DBInstance',
        resource_properties: {},
        metrics: [createMockMetric('CPUUtilization', 'AWS/RDS', 'High')]
      },
      {
        logical_id: 'TestFunction',
        resource_type: 'AWS::Lambda::Function',
        resource_properties: {},
        metrics: [createMockMetric('Duration', 'AWS/Lambda', 'High')]
      }
    ],
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'multi-type-template.yaml',
      total_resources: 2,
      supported_resources: 2
    },
    unsupported_resources: []
  };
}

describe('CDKOfficialGenerator RDS MVP (Adapted)', () => {
  let generator: CDKOfficialGenerator;

  beforeEach(() => {
    generator = new CDKOfficialGenerator(createMockLogger());
  });

  describe('Positive Test Cases - Normal Operation', () => {
    it('should generate valid CDK code with RDS alarms using official types', async () => {
      const analysisResult = createMockAnalysisResultWithRDS(2); // 2 RDS resources
      const options: CDKOptions = { enabled: true };
      
      const result = await generator.generate(analysisResult, options);
      
      // Basic CDK structure verification
      expect(result).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
      expect(result).toContain('import * as cdk from \'aws-cdk-lib\'');
      expect(result).toContain('import * as cloudwatch from \'aws-cdk-lib/aws-cloudwatch\'');
      expect(result).toContain('constructor(scope: Construct, id: string, props?: cdk.StackProps)');
      
      // Official types usage verification
      expect(result).toContain('cloudwatch.TreatMissingData.NOT_BREACHING');
      expect(result).toContain('cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD');
      expect(result).toContain('aws-cdk-lib official types');
      
      // RDS alarm verification (2 resources × 2 metrics × 2 severities = 8 alarms)
      const alarmMatches = result.match(/new cloudwatch\.Alarm/g);
      expect(alarmMatches).not.toBeNull();
      expect(alarmMatches?.length).toBe(8); // 2 resources × 2 metrics × 2 severities
      
      // Verify Warning and Critical alarms are generated
      expect(result).toMatch(/Database1CPUUtilizationWarningAlarm/);
      expect(result).toMatch(/Database1CPUUtilizationCriticalAlarm/);
      expect(result).toMatch(/Database2CPUUtilizationWarningAlarm/);
      expect(result).toMatch(/Database2CPUUtilizationCriticalAlarm/);
      
      // Verify RDS-specific dimensions (allowing for HTML escaping)
      expect(result).toMatch(/DBInstanceIdentifier.*Database1/);
      expect(result).toMatch(/DBInstanceIdentifier.*Database2/);
    });

    it('should use custom stack name when provided', async () => {
      const analysisResult = createMockAnalysisResultWithRDS(1);
      const options: CDKOptions = { 
        enabled: true, 
        stackName: 'MyCustomAlarmsStack' 
      };
      
      const result = await generator.generate(analysisResult, options);
      
      expect(result).toContain('export class MyCustomAlarmsStack extends cdk.Stack');
      expect(result).not.toContain('CloudWatchAlarmsStack'); // Should not use default name
    });

    it('should handle single resource with multiple metrics', async () => {
      const analysisResult = createMockAnalysisResultWithComplexMetrics();
      const options: CDKOptions = { enabled: true };
      
      const result = await generator.generate(analysisResult, options);
      
      // Should generate alarms for all metrics
      expect(result).toContain('CPUUtilizationWarningAlarm');
      expect(result).toContain('CPUUtilizationCriticalAlarm');
      expect(result).toContain('DatabaseConnectionsWarningAlarm');
      expect(result).toContain('DatabaseConnectionsCriticalAlarm');
    });

    it('should filter low importance metrics when includeLowImportance is false', async () => {
      const analysisResult = createMockAnalysisResultWithMixedImportance();
      const options: CDKOptions = { 
        enabled: true,
        includeLowImportance: false 
      };
      
      const result = await generator.generate(analysisResult, options);
      
      // Should only contain high importance metric alarms
      expect(result).toContain('CPUUtilizationWarningAlarm'); // High importance
      expect(result).not.toContain('SwapUsageWarningAlarm'); // Low importance - should be excluded
    });

    it('should include low importance metrics when includeLowImportance is true', async () => {
      const analysisResult = createMockAnalysisResultWithMixedImportance();
      const options: CDKOptions = { 
        enabled: true,
        includeLowImportance: true 
      };
      
      const result = await generator.generate(analysisResult, options);
      
      // Should contain both high and low importance metric alarms
      expect(result).toContain('CPUUtilizationWarningAlarm'); // High importance
      expect(result).toContain('SwapUsageWarningAlarm'); // Low importance - should be included
    });
  });

  describe('Negative Test Cases - Error Conditions', () => {
    it('should throw error for null analysis result', async () => {
      const options: CDKOptions = { enabled: true };
      
      await expect(
        generator.generate(null as unknown as ExtendedAnalysisResult, options)
      ).rejects.toThrow(CloudSupporterError);
    });

    it('should throw error for disabled CDK mode', async () => {
      const analysisResult = createMockAnalysisResultWithRDS(1);
      const options: CDKOptions = { enabled: false };
      
      await expect(
        generator.generate(analysisResult, options)
      ).rejects.toThrow('CDK mode must be enabled');
    });

    it('should throw error for invalid analysis result structure', async () => {
      const invalidAnalysis = {
        resources: null,
        metadata: { version: '1.0.0', generated_at: '', template_path: '', total_resources: 0, supported_resources: 0 },
        unsupported_resources: []
      };
      const options: CDKOptions = { enabled: true };
      
      await expect(
        generator.generate(invalidAnalysis as unknown as ExtendedAnalysisResult, options)
      ).rejects.toThrow('resources array');
    });
  });

  describe('Resource Type Filtering', () => {
    it('should filter to specified resource types when filters are provided', async () => {
      const analysisResult = createMockAnalysisResultWithMultipleTypes();
      const options: CDKOptions = { 
        enabled: true,
        resourceTypeFilters: ['AWS::RDS::DBInstance'] 
      };
      
      const result = await generator.generate(analysisResult, options);
      
      // Should only contain RDS alarms, not Lambda alarms
      expect(result).toContain('DBInstanceIdentifier:');
      expect(result).not.toContain('FunctionName:');
    });
  });
});