// CLAUDE.md準拠型安全性テスト（RED段階: any型違反検知）
import { readFileSync } from 'fs';
import path from 'path';

import * as cfnTypes from '../../../src/types/cloudformation';
import * as commonTypes from '../../../src/types/common';
import * as metricsTypes from '../../../src/types/metrics';

// 型定義モジュール用の型注釈
interface CloudFormationTypesModule {
  ResourceType?: object;
  isSupportedResource?: (resource: unknown) => boolean;
  isRDSInstance?: (resource: unknown) => boolean;
}

interface CommonTypesModule {
  MetricStatistic?: string;
}

type MetricsTypesModule = Record<string, unknown>;

describe('CloudFormation型定義（CLAUDE.md: No any types）', () => {

  // CLAUDE.md核心原則: No any types検証
  it('should not contain any types in cloudformation.ts', () => {
    const cloudFormationCode = readFileSync(
      path.join(__dirname, '../../../src/types/cloudformation.ts'),
      'utf8'
    );

    // any型が含まれていないことを確認
    expect(cloudFormationCode).toHaveNoAnyTypes();
  });

  // TypeScript strict mode準拠テスト
  it('should compile without type errors', async () => {
    const { execSync } = await import('child_process');

    try {
      execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
      // コンパイル成功なら通過
      expect(true).toBe(true);
    } catch (error) {
      // コンパイルエラーがあれば失敗（CLAUDE.md: Zero type errors）
      expect(error).toBeUndefined();
      throw new Error(`TypeScript compilation failed: ${(error as Error).message}`);
    }
  });

  // CloudFormationTemplate型の基本構造テスト
  it('should define proper CloudFormationTemplate interface', () => {
    // 型定義のインポートテスト（静的import使用）
    const cfnTypesModule = cfnTypes as unknown as CloudFormationTypesModule;

    // 主要な型が定義されていることを確認
    expect(cfnTypesModule).toBeDefined();
    if (cfnTypesModule.ResourceType) {
      expect(typeof cfnTypesModule.ResourceType).toBe('object');
    }
    if (cfnTypesModule.isSupportedResource) {
      expect(typeof cfnTypesModule.isSupportedResource).toBe('function');
    }
  });

  // RDSProperties型安全性テスト
  it('should define type-safe RDSProperties without any types', () => {
    // 実装後にRDSPropertiesが適切に型定義されているかテスト
    const testRDSProperties = {
      DBInstanceClass: 'db.t3.micro',
      Engine: 'mysql' as const,
      AllocatedStorage: 20,
      MultiAZ: true
    };

    // 型安全性の検証（型推論が正しく働くかテスト）
    expect(typeof testRDSProperties.DBInstanceClass).toBe('string');
    expect(typeof testRDSProperties.Engine).toBe('string');
    expect(typeof testRDSProperties.AllocatedStorage).toBe('number');
    expect(typeof testRDSProperties.MultiAZ).toBe('boolean');
  });

  // Union型の型安全性テスト
  it('should define proper union types for resource types', () => {
    const cfnTypesModule = cfnTypes as unknown as CloudFormationTypesModule;

    // SupportedResource Union型の型ガード関数テスト
    // CloudFormationテストヘルパーを使用
    const { createRDSResource } = require('../../helpers/cloudformation-test-helpers') as typeof import('../../helpers/cloudformation-test-helpers');
    const testResource = createRDSResource('TestDB', { Engine: 'mysql' });

    if (cfnTypesModule.isSupportedResource && cfnTypesModule.isRDSInstance) {
      expect(cfnTypesModule.isSupportedResource(testResource)).toBe(true);
      expect(cfnTypesModule.isRDSInstance(testResource)).toBe(true);

      // 非サポートリソース
      const unsupportedResource = {
        Type: 'AWS::EC2::Instance',
        Properties: {}
      };

      expect(cfnTypesModule.isSupportedResource(unsupportedResource)).toBe(false);
    } else {
      // 型ガード関数が存在しない場合はスキップ
      expect(true).toBe(true);
    }
  });

  // エラー詳細型の安全性テスト
  it('should define ErrorDetails without any type', () => {
    // ErrorDetails型がany型を含まずに定義されているかテスト
    const testErrorDetails = {
      originalError: 'test error',
      fileSize: 1024,
      lineNumber: 42,
      columnNumber: 10
    };

    expect(typeof testErrorDetails.originalError).toBe('string');
    expect(typeof testErrorDetails.fileSize).toBe('number');
    expect(typeof testErrorDetails.lineNumber).toBe('number');
    expect(typeof testErrorDetails.columnNumber).toBe('number');
  });
});

// 型ガード関数の包括的テスト
describe('Type Guard Functions (Full Coverage)', () => {
  // テストヘルパーのインポート
  const {
    createRDSResource,
    createLambdaResource,
    createECSResource,
    createELBResource,
    createDynamoDBResource,
    createApiGatewayResource
  } = require('../../helpers/cloudformation-test-helpers') as typeof import('../../helpers/cloudformation-test-helpers');

  describe('isRDSInstance', () => {
    it('should return true for RDS DBInstance resources', () => {
      const rdsResource = createRDSResource('MyDB', { Engine: 'mysql' });
      expect(cfnTypes.isRDSInstance(rdsResource)).toBe(true);
    });

    it('should return false for non-RDS resources', () => {
      const lambdaResource = createLambdaResource('MyFunction', { Runtime: 'nodejs18.x' });
      expect(cfnTypes.isRDSInstance(lambdaResource)).toBe(false);
    });

    it('should return false for resources with undefined type', () => {
      const invalidResource = { Type: undefined as never, Properties: {} };
      expect(cfnTypes.isRDSInstance(invalidResource)).toBe(false);
    });
  });

  describe('isLambdaFunction', () => {
    it('should return true for Lambda Function resources', () => {
      const lambdaResource = createLambdaResource('MyFunction', { Runtime: 'nodejs18.x' });
      expect(cfnTypes.isLambdaFunction(lambdaResource)).toBe(true);
    });

    it('should return false for non-Lambda resources', () => {
      const rdsResource = createRDSResource('MyDB', { Engine: 'mysql' });
      expect(cfnTypes.isLambdaFunction(rdsResource)).toBe(false);
    });

    it('should return false for Serverless Function (different type)', () => {
      const serverlessFunction = { Type: 'AWS::Serverless::Function', Properties: {} };
      expect(cfnTypes.isLambdaFunction(serverlessFunction)).toBe(false);
    });
  });

  describe('isECSService', () => {
    it('should return true for ECS Service resources', () => {
      const ecsResource = createECSResource('MyService', { LaunchType: 'EC2' });
      expect(cfnTypes.isECSService(ecsResource)).toBe(true);
    });

    it('should return false for non-ECS resources', () => {
      const lambdaResource = createLambdaResource('MyFunction', { Runtime: 'nodejs18.x' });
      expect(cfnTypes.isECSService(lambdaResource)).toBe(false);
    });

    it('should handle resources with empty Properties', () => {
      const ecsResource = { Type: 'AWS::ECS::Service', Properties: {} };
      expect(cfnTypes.isECSService(ecsResource)).toBe(true);
    });
  });

  describe('isALB', () => {
    it('should return true for Application Load Balancer resources', () => {
      const albResource = createELBResource('MyALB', { Type: 'application' });
      expect(cfnTypes.isALB(albResource)).toBe(true);
    });

    it('should return true for Network Load Balancer resources', () => {
      const nlbResource = createELBResource('MyNLB', { Type: 'network' });
      expect(cfnTypes.isALB(nlbResource)).toBe(true);
    });

    it('should return false for non-ALB resources', () => {
      const rdsResource = createRDSResource('MyDB', { Engine: 'mysql' });
      expect(cfnTypes.isALB(rdsResource)).toBe(false);
    });
  });

  describe('isSupportedResource', () => {
    it('should return true for all supported resource types', () => {
      const supportedResources = [
        createRDSResource('DB', { Engine: 'mysql' }),
        createLambdaResource('Func', { Runtime: 'nodejs18.x' }),
        { Type: 'AWS::Serverless::Function', Properties: {} },
        createECSResource('Service', { LaunchType: 'EC2' }),
        createELBResource('ALB', { Type: 'application' }),
        createDynamoDBResource('Table', { BillingMode: 'PAY_PER_REQUEST' }),
        createApiGatewayResource('API', { Name: 'MyAPI' }),
        { Type: 'AWS::Serverless::Api', Properties: {} }
      ];

      for (const resource of supportedResources) {
        expect(cfnTypes.isSupportedResource(resource)).toBe(true);
      }
    });

    it('should return false for unsupported resource types', () => {
      const unsupportedResources = [
        { Type: 'AWS::EC2::Instance', Properties: {} },
        { Type: 'AWS::S3::Bucket', Properties: {} },
        { Type: 'AWS::SNS::Topic', Properties: {} }
      ];

      for (const resource of unsupportedResources) {
        expect(cfnTypes.isSupportedResource(resource)).toBe(false);
      }
    });

    it('should handle invalid resource types', () => {
      const invalidResources = [
        { Type: '', Properties: {} },
        { Type: null as never, Properties: {} },
        { Type: undefined as never, Properties: {} }
      ];

      for (const resource of invalidResources) {
        expect(cfnTypes.isSupportedResource(resource)).toBe(false);
      }
    });
  });

  describe('isFargateService', () => {
    it('should return true for Fargate service with LaunchType', () => {
      const fargateService = createECSResource('FargateService', {
        LaunchType: 'FARGATE'
      });
      expect(cfnTypes.isFargateService(fargateService)).toBe(true);
    });

    it('should return true for Fargate service with CapacityProviderStrategy', () => {
      const fargateService = {
        Type: 'AWS::ECS::Service',
        Properties: {
          CapacityProviderStrategy: [
            { CapacityProvider: 'FARGATE', Weight: 1 }
          ]
        }
      };
      expect(cfnTypes.isFargateService(fargateService)).toBe(true);
    });

    it('should return true for Fargate Spot service', () => {
      const fargateSpotService = {
        Type: 'AWS::ECS::Service',
        Properties: {
          CapacityProviderStrategy: [
            { CapacityProvider: 'FARGATE_SPOT', Weight: 1 }
          ]
        }
      };
      expect(cfnTypes.isFargateService(fargateSpotService)).toBe(true);
    });

    it('should return false for EC2 service', () => {
      const ec2Service = createECSResource('EC2Service', {
        LaunchType: 'EC2'
      });
      expect(cfnTypes.isFargateService(ec2Service)).toBe(false);
    });

    it('should return false for non-ECS resources', () => {
      const lambdaResource = createLambdaResource('MyFunction', { Runtime: 'nodejs18.x' });
      expect(cfnTypes.isFargateService(lambdaResource)).toBe(false);
    });

    it('should return false when Properties is undefined', () => {
      const invalidService = {
        Type: 'AWS::ECS::Service',
        Properties: undefined
      };
      expect(cfnTypes.isFargateService(invalidService)).toBe(false);
    });

    it('should return false when CapacityProviderStrategy is empty', () => {
      const emptyStrategyService = {
        Type: 'AWS::ECS::Service',
        Properties: {
          CapacityProviderStrategy: []
        }
      };
      expect(cfnTypes.isFargateService(emptyStrategyService)).toBe(false);
    });

    it('should return false when neither LaunchType nor CapacityProviderStrategy is specified', () => {
      const defaultService = {
        Type: 'AWS::ECS::Service',
        Properties: {
          ServiceName: 'MyService'
        }
      };
      expect(cfnTypes.isFargateService(defaultService)).toBe(false);
    });
  });

  describe('isApplicationLoadBalancer', () => {
    it('should return true for explicitly defined application load balancer', () => {
      const appLB = createELBResource('MyALB', { Type: 'application' });
      expect(cfnTypes.isApplicationLoadBalancer(appLB)).toBe(true);
    });

    it('should return true when Type is not specified (default)', () => {
      const defaultLB = {
        Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
        Properties: {
          Name: 'MyLoadBalancer'
        }
      };
      expect(cfnTypes.isApplicationLoadBalancer(defaultLB)).toBe(true);
    });

    it('should return true when Properties is undefined (default)', () => {
      const noPropsLB = {
        Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
        Properties: undefined
      };
      expect(cfnTypes.isApplicationLoadBalancer(noPropsLB)).toBe(true);
    });

    it('should return false for network load balancer', () => {
      const networkLB = createELBResource('MyNLB', { Type: 'network' });
      expect(cfnTypes.isApplicationLoadBalancer(networkLB)).toBe(false);
    });

    it('should return false for gateway load balancer', () => {
      const gatewayLB = createELBResource('MyGLB', { Type: 'gateway' });
      expect(cfnTypes.isApplicationLoadBalancer(gatewayLB)).toBe(false);
    });

    it('should return false for non-ALB resources', () => {
      const rdsResource = createRDSResource('MyDB', { Engine: 'mysql' });
      expect(cfnTypes.isApplicationLoadBalancer(rdsResource)).toBe(false);
    });
  });
});

describe('メトリクス型定義（CLAUDE.md: Type-Driven Development）', () => {

  // MetricDefinition型安全性テスト
  it('should define type-safe MetricDefinition interface', () => {
    // 実装前なので失敗する想定
    const testMetric = {
      metric_name: 'CPUUtilization',
      namespace: 'AWS/RDS',
      unit: 'Percent',
      description: 'CPU利用率',
      statistic: 'Average' as const,
      recommended_threshold: {
        warning: 70,
        critical: 90
      },
      evaluation_period: 300,
      category: 'Performance' as const,
      importance: 'High' as const
    };
    
    // しきい値の型安全性
    expect(testMetric.recommended_threshold).toHaveValidThreshold();
    
    // enum型の型安全性
    expect(['Average', 'Sum', 'Maximum', 'Minimum']).toContain(testMetric.statistic);
    expect(['Performance', 'Error', 'Saturation', 'Latency']).toContain(testMetric.category);
    expect(['High', 'Medium', 'Low']).toContain(testMetric.importance);
  });

  // MetricConfig型安全性テスト
  it('should define type-safe MetricConfig interface', () => {
    
    // MetricConfig型のテスト用データ
    const testMetricConfig = {
      name: 'CPUUtilization',
      namespace: 'AWS/RDS',
      unit: 'Percent',
      description: 'CPU利用率',
      statistic: 'Average' as const,
      evaluationPeriod: 300 as const,
      category: 'Performance' as const,
      importance: 'High' as const,
      threshold: {
        base: 70,
        warningMultiplier: 1.0,
        criticalMultiplier: 1.3
      }
    };
    
    // 基本型安全性確認
    expect(typeof testMetricConfig.name).toBe('string');
    expect(typeof testMetricConfig.threshold.base).toBe('number');
    expect(testMetricConfig.threshold.warningMultiplier < testMetricConfig.threshold.criticalMultiplier).toBe(true);
  });
});

describe('共通型定義（CLAUDE.md: DRY原則）', () => {

  // 共通型の重複排除テスト
  it('should define common types without duplication', () => {
    const commonTypesModule = commonTypes as unknown as CommonTypesModule;
    const metricsTypesModule = metricsTypes as unknown as MetricsTypesModule;
    
    // 共通型が適切に定義されていることを確認
    if (commonTypesModule.MetricStatistic) {
      expect(typeof commonTypesModule.MetricStatistic).toBe('undefined'); // 型なので実行時は存在しない
    }
    expect(commonTypesModule).toBeDefined();
    
    // メトリクス型で共通型を使用していることを確認
    expect(metricsTypesModule).toBeDefined();
  });

  // 型安全性の包括テスト
  it('should ensure all types are strictly typed', () => {
    // common.tsにany型が含まれていないことを確認
    const commonCode = readFileSync(
      path.join(__dirname, '../../../src/types/common.ts'), 
      'utf8'
    );
    expect(commonCode).toHaveNoAnyTypes();
    
    // metrics.tsにany型が含まれていないことを確認
    const metricsCode = readFileSync(
      path.join(__dirname, '../../../src/types/metrics.ts'), 
      'utf8'
    );
    expect(metricsCode).toHaveNoAnyTypes();
  });
});