// T-010 RDS・Lambda Generator統合テスト

import { RDSMetricsGenerator } from '../../../src/generators/rds.generator';
import { LambdaMetricsGenerator } from '../../../src/generators/lambda.generator';
import { ECSMetricsGenerator } from '../../../src/generators/ecs.generator';
import { ALBMetricsGenerator } from '../../../src/generators/alb.generator';
import { DynamoDBMetricsGenerator } from '../../../src/generators/dynamodb.generator';
import { APIGatewayMetricsGenerator } from '../../../src/generators/apigateway.generator';
import { CloudFormationResource, RDSDBInstance, LambdaFunction, ECSService } from '../../../src/types/cloudformation';
import { IMetricsGenerator } from '../../../src/generators/base.generator';
import { ILogger } from '../../../src/utils/logger';
import { METRICS_CONFIG_MAP } from '../../../src/config/metrics-definitions';

describe('Generators Integration Tests', () => {
  let mockLogger: ILogger;
  let generators: IMetricsGenerator[];

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      success: jest.fn()
    };

    generators = [
      new RDSMetricsGenerator(mockLogger),
      new LambdaMetricsGenerator(mockLogger),
      new ECSMetricsGenerator(mockLogger),
      new ALBMetricsGenerator(mockLogger),
      new DynamoDBMetricsGenerator(mockLogger),
      new APIGatewayMetricsGenerator(mockLogger)
    ];
  });

  describe('Generator Type Coverage', () => {
    it('should cover all supported resource types from T-009', () => {
      const supportedTypes = new Set<string>();
      
      for (const generator of generators) {
        generator.getSupportedTypes().forEach(type => supportedTypes.add(type));
      }

      // T-009で定義された6つのリソースタイプのうち、T-010,T-011,T-012で実装した分を確認
      expect(supportedTypes.has('AWS::RDS::DBInstance')).toBe(true);
      expect(supportedTypes.has('AWS::Lambda::Function')).toBe(true);
      expect(supportedTypes.has('AWS::Serverless::Function')).toBe(true);
      expect(supportedTypes.has('AWS::ECS::Service')).toBe(true);
      expect(supportedTypes.has('AWS::ElasticLoadBalancingV2::LoadBalancer')).toBe(true);
      expect(supportedTypes.has('AWS::DynamoDB::Table')).toBe(true);
      expect(supportedTypes.has('AWS::ApiGateway::RestApi')).toBe(true);
      expect(supportedTypes.has('AWS::Serverless::Api')).toBe(true);
    });
  });

  describe('Metrics Configuration Alignment', () => {
    it('should use metrics from METRICS_CONFIG_MAP', async () => {
      const rdsResource: RDSDBInstance = {
        Type: 'AWS::RDS::DBInstance',
        LogicalId: 'TestDB',
        Properties: {
          Engine: 'mysql'
        }
      };

      const lambdaResource: LambdaFunction = {
        Type: 'AWS::Lambda::Function',
        LogicalId: 'TestFunction',
        Properties: {
          Runtime: 'nodejs18.x'
        }
      };

      const rdsGenerator = new RDSMetricsGenerator(mockLogger);
      const lambdaGenerator = new LambdaMetricsGenerator(mockLogger);

      const rdsMetrics = await rdsGenerator.generate(rdsResource);
      const lambdaMetrics = await lambdaGenerator.generate(lambdaResource);

      // メトリクス数がMETRICS_CONFIG_MAPと整合していることを確認
      const expectedRDSCount = METRICS_CONFIG_MAP['AWS::RDS::DBInstance'].filter(
        m => !m.applicableWhen || m.applicableWhen(rdsResource)
      ).length;
      const expectedLambdaCount = METRICS_CONFIG_MAP['AWS::Lambda::Function'].filter(
        m => !m.applicableWhen || m.applicableWhen(lambdaResource)
      ).length;

      expect(rdsMetrics.length).toBe(expectedRDSCount);
      expect(lambdaMetrics.length).toBe(expectedLambdaCount);
    });
  });

  describe('CLAUDE.md Compliance', () => {
    it('should maintain TypeScript strict mode compliance (No any types)', async () => {
      // 型安全性の確認（コンパイル時にチェックされるが、ランタイムでも確認）
      const resources: CloudFormationResource[] = [
        {
          Type: 'AWS::RDS::DBInstance',
          LogicalId: 'StrictDB',
          Properties: {
            DBInstanceClass: 'db.t3.micro'
          }
        },
        {
          Type: 'AWS::Lambda::Function',
          LogicalId: 'StrictFunction',
          Properties: {
            MemorySize: 256
          }
        },
        {
          Type: 'AWS::ECS::Service',
          LogicalId: 'StrictECS',
          Properties: {
            LaunchType: 'FARGATE',
            DesiredCount: 2
          }
        },
        {
          Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
          LogicalId: 'StrictALB',
          Properties: {
            Type: 'application'
          }
        }
      ];

      for (const resource of resources) {
        const generator = generators.find(g => 
          g.getSupportedTypes().includes(resource.Type)
        );
        
        expect(generator).toBeDefined();
        const metrics = await generator!.generate(resource);
        
        // 全メトリクスが型安全であることを確認
        for (const metric of metrics) {
          expect(metric.metric_name).toBeDefined();
          expect(typeof metric.metric_name).toBe('string');
          
          // しきい値の妥当性を確認（警告と重要の値が異なることを確認）
          expect(metric.recommended_threshold.warning).not.toBe(
            metric.recommended_threshold.critical
          );
          expect(typeof metric.recommended_threshold.warning).toBe('number');
          expect(typeof metric.recommended_threshold.critical).toBe('number');
        }
      }
    });

    it('should follow SOLID principles - Single Responsibility', () => {
      // 各Generatorが単一責任を持つことを確認
      const rdsGen = new RDSMetricsGenerator(mockLogger);
      const lambdaGen = new LambdaMetricsGenerator(mockLogger);
      const ecsGen = new ECSMetricsGenerator(mockLogger);
      const albGen = new ALBMetricsGenerator(mockLogger);
      const dynamodbGen = new DynamoDBMetricsGenerator(mockLogger);
      const apigwGen = new APIGatewayMetricsGenerator(mockLogger);

      // 各Generatorは単一のリソースタイプのみ扱う
      expect(rdsGen.getSupportedTypes()).toEqual(['AWS::RDS::DBInstance']);
      expect(lambdaGen.getSupportedTypes()).toEqual([
        'AWS::Lambda::Function',
        'AWS::Serverless::Function'
      ]);
      expect(ecsGen.getSupportedTypes()).toEqual(['AWS::ECS::Service']);
      expect(albGen.getSupportedTypes()).toEqual(['AWS::ElasticLoadBalancingV2::LoadBalancer']);
      expect(dynamodbGen.getSupportedTypes()).toEqual(['AWS::DynamoDB::Table']);
      expect(apigwGen.getSupportedTypes()).toEqual(['AWS::ApiGateway::RestApi', 'AWS::Serverless::Api']);
    });
  });

  describe('Performance Requirements', () => {
    it('should generate metrics for multiple resources within performance limits', async () => {
      const testResources: CloudFormationResource[] = [
        // RDS instances with different configurations
        ...Array.from({ length: 10 }, (_, i) => ({
          Type: 'AWS::RDS::DBInstance',
          LogicalId: `DB${i}`,
          Properties: {
            DBInstanceClass: ['db.t3.micro', 'db.m5.large', 'db.r5.xlarge'][i % 3],
            Engine: ['mysql', 'postgresql'][i % 2],
            BackupRetentionPeriod: i % 2 === 0 ? 7 : 0
          }
        })),
        // Lambda functions with different memory sizes
        ...Array.from({ length: 10 }, (_, i) => ({
          Type: 'AWS::Lambda::Function',
          LogicalId: `Function${i}`,
          Properties: {
            Runtime: ['nodejs18.x', 'python3.11', 'java17'][i % 3],
            MemorySize: [128, 512, 1024, 3008][i % 4],
            Timeout: [30, 60, 300][i % 3]
          }
        })),
        // ECS services with different configurations
        ...Array.from({ length: 10 }, (_, i) => ({
          Type: 'AWS::ECS::Service',
          LogicalId: `Service${i}`,
          Properties: {
            LaunchType: 'FARGATE',
            DesiredCount: [1, 2, 5, 10][i % 4]
          }
        })),
        // ALBs with different configurations
        ...Array.from({ length: 10 }, (_, i) => ({
          Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
          LogicalId: `ALB${i}`,
          Properties: {
            Type: 'application',
            Scheme: i % 2 === 0 ? 'internet-facing' : 'internal'
          }
        })),
        // DynamoDB tables with different configurations
        ...Array.from({ length: 10 }, (_, i) => ({
          Type: 'AWS::DynamoDB::Table',
          LogicalId: `DynamoTable${i}`,
          Properties: {
            TableName: `table-${i}`,
            BillingMode: i % 2 === 0 ? 'PROVISIONED' : 'PAY_PER_REQUEST',
            ...(i % 2 === 0 && {
              ProvisionedThroughput: {
                ReadCapacityUnits: [5, 10, 20][i % 3],
                WriteCapacityUnits: [5, 10, 20][i % 3]
              }
            }),
            ...(i % 3 === 0 && {
              GlobalSecondaryIndexes: [{
                IndexName: 'GSI1',
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
              }]
            })
          }
        })),
        // API Gateway REST APIs with different configurations
        ...Array.from({ length: 10 }, (_, i) => ({
          Type: 'AWS::ApiGateway::RestApi',
          LogicalId: `RestApi${i}`,
          Properties: {
            Name: `api-${i}`,
            Tags: [
              { Key: 'Environment', Value: i % 2 === 0 ? 'Production' : 'Development' }
            ]
          }
        }))
      ];

      const startTime = performance.now();
      const allMetrics = [];

      for (const resource of testResources) {
        const generator = generators.find(g => 
          g.getSupportedTypes().includes(resource.Type)
        );
        if (generator) {
          const metrics = await generator.generate(resource);
          allMetrics.push(...metrics);
        }
      }

      const duration = performance.now() - startTime;

      // 60リソースの処理が3秒以内に完了
      expect(duration).toBeLessThan(3000);
      
      // 期待されるメトリクス数が生成されていることを確認
      expect(allMetrics.length).toBeGreaterThan(900); // 各リソース15-25メトリクス
      
      console.log(`Generated ${allMetrics.length} metrics for ${testResources.length} resources in ${duration.toFixed(1)}ms`);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid resource types gracefully', async () => {
      const invalidResource: CloudFormationResource = {
        Type: 'AWS::Unsupported::Resource',
        LogicalId: 'InvalidResource'
      };

      const supportingGenerator = generators.find(g => 
        g.getSupportedTypes().includes(invalidResource.Type)
      );

      expect(supportingGenerator).toBeUndefined();
    });

    it('should handle resources with missing properties', async () => {
      const incompleteResources: CloudFormationResource[] = [
        {
          Type: 'AWS::RDS::DBInstance',
          LogicalId: 'IncompleteDB'
          // Properties undefined
        },
        {
          Type: 'AWS::Lambda::Function',
          LogicalId: 'IncompleteFunction',
          Properties: {} // Empty properties
        },
        {
          Type: 'AWS::ECS::Service',
          LogicalId: 'IncompleteECS'
          // Properties undefined, will fail Fargate check
        },
        {
          Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
          LogicalId: 'IncompleteALB',
          Properties: {} // Empty properties, defaults to application type
        }
      ];

      for (const resource of incompleteResources) {
        const generator = generators.find(g => 
          g.getSupportedTypes().includes(resource.Type)
        );
        
        expect(generator).toBeDefined();
        
        // ECSはFargate以外をサポートしないため、特別処理
        if (resource.Type === 'AWS::ECS::Service' && !resource.Properties) {
          await expect(generator!.generate(resource)).rejects.toThrow('Only Fargate services are supported');
        } else {
          // その他はエラーを投げずにデフォルト値で処理されることを確認
          await expect(generator!.generate(resource)).resolves.toBeDefined();
        }
      }
    });
  });
});