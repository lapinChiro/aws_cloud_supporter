// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// tasks.md M-006: 型定義の単体テスト（公式型適応版）

import { CDKStackData, CDKAlarmComplete, CDKOptions, CDKGenerationResult, CDKStackMetadata } from '../../../src/types/cdk-business';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

describe('CDK Official Types', () => {
  describe('CDKStackData', () => {
    it('should have required properties with correct types', () => {
      const testMetric = new cloudwatch.Metric({
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        dimensionsMap: { DBInstanceIdentifier: 'test' }
      });

      const data: CDKStackData = {
        stackClassName: 'TestStack',
        alarms: [{
          // AWS公式型プロパティ
          metric: testMetric,
          threshold: 80,
          alarmDescription: 'Test alarm',
          evaluationPeriods: 1,
          
          // ビジネスロジックプロパティ
          constructId: 'TestAlarm',
          severity: 'Warning',
          resourceLogicalId: 'TestResource',
          resourceType: 'AWS::RDS::DBInstance'
        }],
        metadata: {
          generatedAt: '2025-09-10T00:00:00.000Z',
          templatePath: '/path/to/template.yaml',
          totalResources: 5,
          totalAlarms: 10,
          toolVersion: '1.0.0'
        }
      };
      
      expect(typeof data.stackClassName).toBe('string');
      expect(Array.isArray(data.alarms)).toBe(true);
      expect(typeof data.metadata).toBe('object');
      expect(typeof data.metadata.totalResources).toBe('number');
    });

    it('should support empty alarms array', () => {
      const data: CDKStackData = {
        stackClassName: 'EmptyStack',
        alarms: [],
        metadata: {
          generatedAt: new Date().toISOString(),
          templatePath: 'test.yaml',
          totalResources: 0,
          totalAlarms: 0,
          toolVersion: '1.0.0'
        }
      };
      
      expect(data.alarms.length).toBe(0);
      expect(data.metadata.totalAlarms).toBe(0);
    });
  });

  describe('CDKAlarmComplete (Official Types)', () => {
    it('should represent a valid alarm definition using aws-cdk-lib types', () => {
      const testMetric = new cloudwatch.Metric({
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        dimensionsMap: { DBInstanceIdentifier: 'MyDatabase' }
      });

      const alarm: CDKAlarmComplete = {
        // AWS公式型部分
        metric: testMetric,
        threshold: 70,
        alarmDescription: 'データベースインスタンスのCPU使用率',
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        
        // ビジネスロジック部分
        constructId: 'MyDatabaseCPUUtilizationWarningAlarm',
        severity: 'Warning',
        resourceLogicalId: 'MyDatabase',
        resourceType: 'AWS::RDS::DBInstance'
      };
      
      expect(alarm.constructId).toMatch(/.*Alarm$/);
      expect(alarm.severity === 'Warning' || alarm.severity === 'Critical').toBe(true);
      expect(typeof alarm.threshold).toBe('number');
      expect(alarm.metric).toBeInstanceOf(cloudwatch.Metric);
    });

    it('should support both Warning and Critical severities with official types', () => {
      const testMetric = new cloudwatch.Metric({
        metricName: 'TestMetric',
        namespace: 'AWS/Test',
        dimensionsMap: { TestDimension: 'TestValue' }
      });

      const warningAlarm: CDKAlarmComplete = {
        // AWS公式型部分
        metric: testMetric,
        threshold: 50,
        alarmDescription: 'Test warning alarm',
        evaluationPeriods: 1,
        
        // ビジネスロジック部分
        constructId: 'TestWarningAlarm',
        severity: 'Warning',
        resourceLogicalId: 'TestResource',
        resourceType: 'AWS::Test::Resource'
      };
      
      const criticalAlarm: CDKAlarmComplete = {
        ...warningAlarm,
        constructId: 'TestCriticalAlarm',
        severity: 'Critical',
        threshold: 90,
        alarmDescription: 'Test critical alarm'
      };
      
      expect(warningAlarm.severity).toBe('Warning');
      expect(criticalAlarm.severity).toBe('Critical');
      expect(criticalAlarm.threshold).toBeGreaterThan(warningAlarm.threshold);
    });
  });

  describe('CDKOptions', () => {
    it('should have sensible defaults', () => {
      const basicOptions: CDKOptions = {
        enabled: true
      };
      
      expect(basicOptions.enabled).toBe(true);
      expect(basicOptions.outputDir).toBeUndefined();
      expect(basicOptions.stackName).toBeUndefined();
    });

    it('should support all configuration options', () => {
      const fullOptions: CDKOptions = {
        enabled: true,
        outputDir: './output',
        stackName: 'CustomStack',
        includeLowImportance: false,
        resourceTypeFilters: ['AWS::RDS::DBInstance', 'AWS::Lambda::Function'],
        verbose: true,
        validateCode: true,
        enableSNS: true,
        snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:test-topic'
      };
      
      expect(fullOptions.resourceTypeFilters).toHaveLength(2);
      expect(fullOptions.validateCode).toBe(true);
      expect(fullOptions.outputDir).toBe('./output');
      expect(fullOptions.enableSNS).toBe(true);
    });
  });

  describe('CDKGenerationResult', () => {
    it('should represent successful generation result', () => {
      const result: CDKGenerationResult = {
        generatedCode: 'export class TestStack extends cdk.Stack { }',
        outputFilePath: '/tmp/TestStack.ts',
        metadata: {
          generatedAt: new Date().toISOString(),
          templatePath: 'test.yaml',
          totalResources: 1,
          totalAlarms: 2,
          toolVersion: '1.0.0'
        },
        success: true
      };
      
      expect(result.success).toBe(true);
      expect(result.errorMessage).toBeUndefined();
      expect(result.generatedCode.length).toBeGreaterThan(0);
    });

    it('should represent failed generation result', () => {
      const result: CDKGenerationResult = {
        generatedCode: '',
        metadata: {
          generatedAt: new Date().toISOString(),
          templatePath: 'invalid.yaml',
          totalResources: 0,
          totalAlarms: 0,
          toolVersion: '1.0.0'
        },
        success: false,
        errorMessage: 'Template processing failed'
      };
      
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBeDefined();
      expect(result.generatedCode).toBe('');
    });
  });

  describe('Type Compatibility with Official Types', () => {
    it('should maintain type compatibility across interfaces', () => {
      // Test that our types work together properly with official types
      const metadata: CDKStackMetadata = {
        generatedAt: new Date().toISOString(),
        templatePath: 'test.yaml',
        totalResources: 3,
        totalAlarms: 6,
        toolVersion: '1.0.0'
      };
      
      const testMetric = new cloudwatch.Metric({
        metricName: 'TestMetric',
        namespace: 'AWS/Test',
        dimensionsMap: { TestKey: 'TestValue' }
      });

      const alarm: CDKAlarmComplete = {
        // AWS公式型プロパティ
        metric: testMetric,
        threshold: 100,
        alarmDescription: 'Test alarm description',
        evaluationPeriods: 1,
        
        // ビジネスロジックプロパティ  
        constructId: 'TestAlarm',
        severity: 'Warning',
        resourceLogicalId: 'TestResource',
        resourceType: 'AWS::Test::Resource'
      };
      
      const stackData: CDKStackData = {
        stackClassName: 'TestStack',
        alarms: [alarm],
        metadata
      };
      
      expect(stackData.alarms).toHaveLength(1);
      expect(stackData.alarms[0]).toBe(alarm);
      expect(stackData.metadata.totalAlarms).toBe(6);
    });
  });
});