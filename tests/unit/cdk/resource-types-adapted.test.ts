// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// tasks.md M-006: 全リソースタイプ対応テスト（公式型適応版）

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

// ヘルパー関数
function getTestLogicalId(resourceType: string): string {
  const mapping = {
    'AWS::RDS::DBInstance': 'TestDB',
    'AWS::Lambda::Function': 'TestFunc', 
    'AWS::Serverless::Function': 'TestSAMFunc',
    'AWS::ECS::Service': 'TestECS',
    'AWS::ElasticLoadBalancingV2::LoadBalancer': 'TestLB',
    'AWS::DynamoDB::Table': 'TestTable',
    'AWS::ApiGateway::RestApi': 'TestAPI',
    'AWS::Serverless::Api': 'TestSAMAPI'
  };
  return mapping[resourceType as keyof typeof mapping] || 'TestResource';
}

function getExpectedDimension(resourceType: string): string {
  const mapping = {
    'AWS::RDS::DBInstance': 'DBInstanceIdentifier',
    'AWS::Lambda::Function': 'FunctionName',
    'AWS::Serverless::Function': 'FunctionName',
    'AWS::ECS::Service': 'ServiceName',
    'AWS::ElasticLoadBalancingV2::LoadBalancer': 'LoadBalancer',
    'AWS::DynamoDB::Table': 'TableName',
    'AWS::ApiGateway::RestApi': 'ApiName',
    'AWS::Serverless::Api': 'ApiName'
  };
  return mapping[resourceType as keyof typeof mapping] || 'ResourceId';
}

function createMockMetric(metricName: string = 'CPUUtilization'): MetricDefinition {
  return {
    metric_name: metricName,
    namespace: 'AWS/EC2',
    statistic: 'Average',
    unit: 'Percent',
    evaluation_period: 300,
    recommended_threshold: {
      warning: 70,
      critical: 90
    },
    description: `${metricName} monitoring`,
    category: 'Performance',
    importance: 'High'
  };
}

function createMockAnalysisWithResource(resourceType: string, logicalId?: string): ExtendedAnalysisResult {
  const id = logicalId ?? getTestLogicalId(resourceType);
  
  return {
    resources: [{
      logical_id: id,
      resource_type: resourceType,
      resource_properties: {},
      metrics: [createMockMetric('CPUUtilization')]
    }],
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'single-resource-template.yaml',
      total_resources: 1,
      supported_resources: 1
    },
    unsupported_resources: []
  };
}

function createMockAnalysisWithMixedResourceTypes(): ExtendedAnalysisResult {
  return {
    resources: [
      {
        logical_id: 'TestDB',
        resource_type: 'AWS::RDS::DBInstance',
        resource_properties: {},
        metrics: [createMockMetric('CPUUtilization')]
      },
      {
        logical_id: 'TestFunc',
        resource_type: 'AWS::Lambda::Function',
        resource_properties: {},
        metrics: [createMockMetric('Duration')]
      },
      {
        logical_id: 'TestTable',
        resource_type: 'AWS::DynamoDB::Table',
        resource_properties: {},
        metrics: [createMockMetric('ConsumedReadCapacityUnits')]
      }
    ],
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'mixed-types-template.yaml',
      total_resources: 3,
      supported_resources: 3
    },
    unsupported_resources: []
  };
}

describe('All Resource Types CDK Generation (Official Types)', () => {
  let generator: CDKOfficialGenerator;

  beforeEach(() => {
    generator = new CDKOfficialGenerator(createMockLogger());
  });

  describe('Individual Resource Type Support', () => {
    const resourceTypes = [
      'AWS::RDS::DBInstance',
      'AWS::Lambda::Function',
      'AWS::Serverless::Function',
      'AWS::ECS::Service',
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      'AWS::DynamoDB::Table',
      'AWS::ApiGateway::RestApi',
      'AWS::Serverless::Api'
    ];

    test.each(resourceTypes)('should generate CDK alarms for %s using official types', async (resourceType) => {
      const mockAnalysis = createMockAnalysisWithResource(resourceType);
      const options: CDKOptions = { enabled: true };
      
      const result = await generator.generate(mockAnalysis, options);
      
      // Basic CDK structure verification
      expect(result).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
      expect(result).toContain('import * as cdk from \'aws-cdk-lib\'');
      expect(result).toContain('import * as cloudwatch from \'aws-cdk-lib/aws-cloudwatch\'');
      
      // Official types usage verification
      expect(result).toContain('cloudwatch.TreatMissingData.notBreaching');
      expect(result).toContain('cloudwatch.ComparisonOperator.GreaterThanThreshold');
      
      // Resource-specific alarm verification
      const logicalId = getTestLogicalId(resourceType);
      expect(result).toContain(`${logicalId}CPUUtilizationWarningAlarm`);
      expect(result).toContain(`${logicalId}CPUUtilizationCriticalAlarm`);
      
      // Resource-specific dimension verification (allowing for HTML escaping)
      const expectedDimension = getExpectedDimension(resourceType);
      expect(result).toMatch(new RegExp(`${expectedDimension}.*${logicalId}`));
    });
  });

  describe('Resource Type Dimension Mapping', () => {
    const dimensionTests = [
      { resourceType: 'AWS::RDS::DBInstance', expectedDimension: 'DBInstanceIdentifier', logicalId: 'TestDB' },
      { resourceType: 'AWS::Lambda::Function', expectedDimension: 'FunctionName', logicalId: 'TestFunc' },
      { resourceType: 'AWS::DynamoDB::Table', expectedDimension: 'TableName', logicalId: 'TestTable' },
      { resourceType: 'AWS::ElasticLoadBalancingV2::LoadBalancer', expectedDimension: 'LoadBalancer', logicalId: 'TestLB' }
    ];

    test.each(dimensionTests)('should use correct dimensions for $resourceType', async ({ resourceType, expectedDimension, logicalId }) => {
      const mockAnalysis = createMockAnalysisWithResource(resourceType, logicalId);
      const options: CDKOptions = { enabled: true };
      
      const result = await generator.generate(mockAnalysis, options);
      
      expect(result).toMatch(new RegExp(`${expectedDimension}.*${logicalId}`));
    });
  });

  describe('Multi-Resource Type Processing', () => {
    it('should handle mixed resource types correctly with official types', async () => {
      const mockAnalysis = createMockAnalysisWithMixedResourceTypes();
      const options: CDKOptions = { enabled: true };
      
      const result = await generator.generate(mockAnalysis, options);
      
      // Should contain alarms for all resource types
      expect(result).toContain('DBInstanceIdentifier:'); // RDS
      expect(result).toContain('FunctionName:'); // Lambda
      expect(result).toContain('TableName:'); // DynamoDB
      
      // Should use official types
      expect(result).toContain('cloudwatch.ComparisonOperator.GreaterThanThreshold');
      expect(result).toContain('cloudwatch.TreatMissingData.notBreaching');
    });

    it('should generate correct alarm counts for mixed resources', async () => {
      const mockAnalysis = createMockAnalysisWithMixedResourceTypes();
      const options: CDKOptions = { enabled: true };
      
      const result = await generator.generate(mockAnalysis, options);
      
      // 3 resources × 1 metric × 2 severities = 6 alarms
      const alarmMatches = result.match(/new cloudwatch\.Alarm/g);
      expect(alarmMatches).not.toBeNull();
      expect(alarmMatches?.length).toBe(6);
    });
  });
});
