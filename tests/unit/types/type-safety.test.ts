// CLAUDE.md準拠 型安全性包括テスト（BLUE段階: リファクタリング検証）

import { 
  CloudFormationResource, 
  ResourceType,
  isRDSInstance,
  isLambdaFunction,
  isSupportedResource,
  isFargateService,
  isApplicationLoadBalancer
} from '../../../src/types/cloudformation';
import { MetricDefinition } from '../../../src/types/metrics';
import { ErrorDetails } from '../../../src/types/common';

describe('型安全性包括テスト（CLAUDE.md BLUE段階）', () => {

  // Union型の型ナロウイング検証
  it('should properly narrow union types with type guards', () => {
    const testResources: CloudFormationResource[] = [
      {
        Type: 'AWS::RDS::DBInstance',
        Properties: { Engine: 'mysql', DBInstanceClass: 'db.t3.micro' }
      },
      {
        Type: 'AWS::Lambda::Function', 
        Properties: { Runtime: 'nodejs20.x', MemorySize: 256 }
      },
      {
        Type: 'AWS::EC2::Instance', // 非サポート
        Properties: { InstanceType: 't3.micro' }
      }
    ];

    // 型ガード関数での型ナロウイング
    const rdsResources = testResources.filter(isRDSInstance);
    const lambdaResources = testResources.filter(isLambdaFunction);
    const supportedResources = testResources.filter(isSupportedResource);

    expect(rdsResources).toHaveLength(1);
    expect(lambdaResources).toHaveLength(1);
    expect(supportedResources).toHaveLength(2); // EC2は除外
    
    // 型安全性：型ナロウイング後はプロパティアクセス可能
    if (rdsResources.length > 0) {
      const rds = rdsResources[0];
      // TypeScriptの型推論でRDSDBInstance型として認識される
      expect(rds?.Type).toBe('AWS::RDS::DBInstance');
    }
  });

  // ECS Fargate判定の型安全性
  it('should safely detect Fargate services', () => {
    const fargateService: CloudFormationResource = {
      Type: 'AWS::ECS::Service',
      Properties: {
        LaunchType: 'FARGATE',
        TaskDefinition: 'test-task'
      }
    };

    const ec2Service: CloudFormationResource = {
      Type: 'AWS::ECS::Service', 
      Properties: {
        LaunchType: 'EC2'
      }
    };

    expect(isFargateService(fargateService)).toBe(true);
    expect(isFargateService(ec2Service)).toBe(false);
  });

  // ALB vs NLB判定の型安全性
  it('should safely detect Application Load Balancers', () => {
    const alb: CloudFormationResource = {
      Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
      Properties: {
        Type: 'application'
      }
    };

    const nlb: CloudFormationResource = {
      Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
      Properties: {
        Type: 'network'
      }
    };

    expect(isApplicationLoadBalancer(alb)).toBe(true);
    expect(isApplicationLoadBalancer(nlb)).toBe(false);
  });

  // メトリクス型の安全性（しきい値計算）
  it('should ensure metric thresholds are type safe', () => {
    const testMetric: MetricDefinition = {
      metric_name: 'CPUUtilization',
      namespace: 'AWS/RDS',
      unit: 'Percent',
      description: 'CPU使用率',
      statistic: 'Average',
      recommended_threshold: {
        warning: 70,
        critical: 90
      },
      evaluation_period: 300,
      category: 'Performance',
      importance: 'High'
    };

    // しきい値の妥当性（カスタムマッチャー使用）
    expect(testMetric.recommended_threshold).toHaveValidThreshold();
    
    // 型安全性：コンパイル時に型チェック済み
    expect(testMetric.statistic).toBe('Average');
    expect(testMetric.category).toBe('Performance');
    expect(testMetric.importance).toBe('High');
  });

  // エラー型の安全性
  it('should define type-safe error interfaces', () => {
    const testErrorDetails: ErrorDetails = {
      originalError: 'test error',
      fileSize: 1024,
      lineNumber: 42,
      columnNumber: 10,
      filePath: '/path/to/file.yaml',
      duration: 1500
    };

    // 全フィールドが適切な型であることを確認
    expect(typeof testErrorDetails.originalError).toBe('string');
    expect(typeof testErrorDetails.fileSize).toBe('number');
    expect(typeof testErrorDetails.lineNumber).toBe('number');
    expect(typeof testErrorDetails.columnNumber).toBe('number');
    expect(typeof testErrorDetails.filePath).toBe('string');
    expect(typeof testErrorDetails.duration).toBe('number');
  });

  // ResourceType enumの型安全性
  it('should provide type-safe resource type enum', () => {
    // enum値の型安全アクセス
    expect(ResourceType.RDS_DB_INSTANCE).toBe('AWS::RDS::DBInstance');
    expect(ResourceType.LAMBDA_FUNCTION).toBe('AWS::Lambda::Function');
    expect(ResourceType.ECS_SERVICE).toBe('AWS::ECS::Service');
    
    // Object.values()で全リソースタイプ取得可能
    const allTypes = Object.values(ResourceType);
    expect(allTypes).toHaveLength(8);
    expect(allTypes).toContain('AWS::RDS::DBInstance');
    expect(allTypes).toContain('AWS::Lambda::Function');
  });
});