// tests/integration/cdk-official-migration.test.ts (新規作成)
// M-008: 統合テストと移行検証
import { CDKOfficialGenerator } from '../../src/generators/cdk-official.generator';
import type { ExtendedAnalysisResult } from '../../src/interfaces/analyzer';
import type { CDKOptions } from '../../src/types/cdk-business';
import type { ResourceWithMetrics, MetricDefinition } from '../../src/types/metrics';
import { createMockLogger } from '../helpers/test-helpers';

describe('CDK Official Types System Verification', () => {
  let officialGenerator: CDKOfficialGenerator;

  beforeEach(() => {
    officialGenerator = new CDKOfficialGenerator(createMockLogger());
  });

// Core helper functions - must be defined first
function createTestMetricDefinition(metricName: string, namespace: string): MetricDefinition {
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

function createTestResourceWithMetrics(resourceType: string, logicalId: string): ResourceWithMetrics {
  const metrics = [];
  
  // 各リソースタイプに適したメトリクスを生成
  if (resourceType.includes('RDS')) {
    metrics.push(
      createTestMetricDefinition('CPUUtilization', 'AWS/RDS'),
      createTestMetricDefinition('DatabaseConnections', 'AWS/RDS'),
      createTestMetricDefinition('ReadLatency', 'AWS/RDS')
    );
  } else if (resourceType.includes('Lambda')) {
    metrics.push(
      createTestMetricDefinition('Duration', 'AWS/Lambda'),
      createTestMetricDefinition('Invocations', 'AWS/Lambda'),
      createTestMetricDefinition('Errors', 'AWS/Lambda')
    );
  } else if (resourceType.includes('DynamoDB')) {
    metrics.push(
      createTestMetricDefinition('ConsumedReadCapacityUnits', 'AWS/DynamoDB'),
      createTestMetricDefinition('ConsumedWriteCapacityUnits', 'AWS/DynamoDB')
    );
  } else {
    // デフォルトメトリクス
    metrics.push(createTestMetricDefinition('CPUUtilization', 'AWS/EC2'));
  }

  return {
    logical_id: logicalId,
    resource_type: resourceType,
    resource_properties: {},
    metrics
  };
}

// 検証ユーティリティ関数
function extractAlarmCount(cdkCode: string): number {
  return (cdkCode.match(/new cloudwatch\.Alarm/g) ?? []).length;
}

function extractResourceTypes(cdkCode: string): string[] {
  const dimensionTypes = [];
  if (cdkCode.includes('DBInstanceIdentifier:')) dimensionTypes.push('RDS');
  if (cdkCode.includes('FunctionName:')) dimensionTypes.push('Lambda');
  if (cdkCode.includes('TableName:')) dimensionTypes.push('DynamoDB');
  if (cdkCode.includes('LoadBalancer:')) dimensionTypes.push('ELB');
  return dimensionTypes.sort();
}

function extractStackClass(cdkCode: string): string {
  const match = cdkCode.match(/export class (\w+) extends/);
  return match?.[1] ?? '';
}

function extractSNSTopicCount(cdkCode: string): number {
  return (cdkCode.match(/new sns\.Topic/g) ?? []).length;
}

function extractSNSActionCount(cdkCode: string): number {
  return (cdkCode.match(/\.addAlarmAction/g) ?? []).length;
}

// テストデータ作成関数
function createRDSAnalysis(): ExtendedAnalysisResult {
  return {
    resources: [
      createTestResourceWithMetrics('AWS::RDS::DBInstance', 'TestDB')
    ],
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'test-rds-template.yaml',
      total_resources: 1,
      supported_resources: 1
    },
    unsupported_resources: []
  };
}

function createMultiResourceAnalysis(): ExtendedAnalysisResult {
  return {
    resources: [
      createTestResourceWithMetrics('AWS::RDS::DBInstance', 'TestDB'),
      createTestResourceWithMetrics('AWS::Lambda::Function', 'TestFunc'),
      createTestResourceWithMetrics('AWS::DynamoDB::Table', 'TestTable')
    ],
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'multi-resource-template.yaml',
      total_resources: 3,
      supported_resources: 3
    },
    unsupported_resources: []
  };
}

function createAnalysisWithSNS(): ExtendedAnalysisResult {
  return {
    resources: [
      createTestResourceWithMetrics('AWS::RDS::DBInstance', 'SNSDB')
    ],
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'sns-integration-template.yaml',
      total_resources: 1,
      supported_resources: 1
    },
    unsupported_resources: []
  };
}

function createLargeAnalysis(): ExtendedAnalysisResult {
  return {
    resources: [
      createTestResourceWithMetrics('AWS::RDS::DBInstance', 'DB1'),
      createTestResourceWithMetrics('AWS::RDS::DBInstance', 'DB2'),
      createTestResourceWithMetrics('AWS::Lambda::Function', 'Func1'),
      createTestResourceWithMetrics('AWS::Lambda::Function', 'Func2'),
      createTestResourceWithMetrics('AWS::DynamoDB::Table', 'Table1')
    ],
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'large-template.yaml',
      total_resources: 5,
      supported_resources: 5
    },
    unsupported_resources: []
  };
}

function createVeryLargeAnalysis(): ExtendedAnalysisResult {
  const resources = [];
  const resourceTypes = [
    'AWS::RDS::DBInstance',
    'AWS::Lambda::Function', 
    'AWS::DynamoDB::Table',
    'AWS::ECS::Service',
    'AWS::ElasticLoadBalancingV2::LoadBalancer',
    'AWS::ApiGateway::RestApi',
    'AWS::Serverless::Function',
    'AWS::Serverless::Api'
  ];

  for (let i = 0; i < resourceTypes.length; i++) {
    const resourceType = resourceTypes[i];
    if (resourceType) {
      resources.push(createTestResourceWithMetrics(resourceType, `Resource${i + 1}`));
    }
  }

  return {
    resources,
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'very-large-template.yaml',
      total_resources: resourceTypes.length,
      supported_resources: resourceTypes.length
    },
    unsupported_resources: []
  };
}

  describe('Official Types System Functionality', () => {
    it('should generate valid CDK code for RDS resources using official types', async () => {
      const testAnalysis = createRDSAnalysis();
      const options: CDKOptions = { enabled: true };

      const officialOutput = await officialGenerator.generate(testAnalysis, options);

      // 公式型使用確認
      expect(officialOutput).toContain('cloudwatch.TreatMissingData.NOT_BREACHING');
      expect(officialOutput).toContain('cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD');
      expect(officialOutput).toContain('export class CloudWatchAlarmsStack');
      expect(extractAlarmCount(officialOutput)).toBeGreaterThan(0);
    });

    it('should generate valid output for multiple resource types', async () => {
      const testAnalysis = createMultiResourceAnalysis();
      const options: CDKOptions = { enabled: true };

      const officialOutput = await officialGenerator.generate(testAnalysis, options);

      expect(extractAlarmCount(officialOutput)).toBeGreaterThan(0);
      expect(extractResourceTypes(officialOutput).length).toBeGreaterThan(0);
      
      console.log(`✅ Multi-resource: Official=${extractAlarmCount(officialOutput)} alarms`);
    });

    it('should generate valid SNS integration using official types', async () => {
      const testAnalysis = createAnalysisWithSNS();
      const options: CDKOptions = { enabled: true, enableSNS: true };

      const officialOutput = await officialGenerator.generate(testAnalysis, options);

      // SNS機能確認
      expect(extractSNSTopicCount(officialOutput)).toBeGreaterThan(0);
      expect(extractSNSActionCount(officialOutput)).toBeGreaterThan(0);
      
      // 公式型使用確認
      expect(officialOutput).toContain('new sns.Topic');
      expect(officialOutput).toContain('CloudWatchAlarmNotifications');
    });
  });

  describe('Performance Verification', () => {
    it('should process resources efficiently with official types', async () => {
      const largeAnalysis = createLargeAnalysis(); // Multiple resources for performance test

      // Official system benchmark  
      const officialStart = Date.now();
      const officialOutput = await officialGenerator.generate(largeAnalysis, { enabled: true });
      const officialDuration = Date.now() - officialStart;

      // Performance verification
      expect(extractAlarmCount(officialOutput)).toBeGreaterThan(10);
      expect(officialDuration).toBeLessThan(3000); // 3秒以内の目標

      console.log(`Performance: Official=${officialDuration}ms, Alarms=${extractAlarmCount(officialOutput)}`);
    });

    it('should handle large template processing efficiently', async () => {
      const veryLargeAnalysis = createVeryLargeAnalysis(); // 8 resources for comprehensive test
      
      const start = Date.now();
      const output = await officialGenerator.generate(veryLargeAnalysis, { enabled: true });
      const duration = Date.now() - start;
      
      const alarmCount = extractAlarmCount(output);
      
      console.log(`Large template: ${alarmCount} alarms generated in ${duration}ms`);
      
      expect(duration).toBeLessThan(5000); // 5秒以内で大規模テンプレート処理
      expect(alarmCount).toBeGreaterThan(20); // 十分な数のアラーム生成
    });
  });

  describe('Official Types System Validation', () => {
    it('should demonstrate official types are now default', async () => {
      const testAnalysis = createAnalysisWithSNS();
      const options: CDKOptions = { enabled: true };
      
      const officialOutput = await officialGenerator.generate(testAnalysis, options);
      
      // Official types usage validation
      expect(officialOutput).toContain('cloudwatch.Alarm');
      expect(officialOutput).toContain('extends cdk.Stack');
      expect(officialOutput).toContain('aws-cdk-lib official types');
    });
    
    it('should maintain system stability with official types only', async () => {
      const testAnalysis = createMultiResourceAnalysis();
      const options: CDKOptions = { enabled: true };
      
      const officialOutput = await officialGenerator.generate(testAnalysis, options);
      
      expect(extractAlarmCount(officialOutput)).toBeGreaterThan(5);
      expect(extractStackClass(officialOutput)).toBe('CloudWatchAlarmsStack');
    });
  });
});