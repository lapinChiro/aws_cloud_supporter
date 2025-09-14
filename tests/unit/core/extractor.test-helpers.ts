// ResourceExtractorテスト用ヘルパー関数
import fs, { writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

function createMixedResourcesTemplate(): Record<string, unknown> {
  return {
    AWSTemplateFormatVersion: "2010-09-09",
    Description: "Mixed resources template for extraction testing",
    Resources: {
      // サポート対象リソース（8個）
      TestRDS: {
        Type: "AWS::RDS::DBInstance",
        Properties: { Engine: "mysql", DBInstanceClass: "db.t3.micro" }
      },
      TestLambda: {
        Type: "AWS::Lambda::Function", 
        Properties: { Runtime: "nodejs20.x", Handler: "index.handler" }
      },
      TestECS: {
        Type: "AWS::ECS::Service",
        Properties: { LaunchType: "FARGATE", Cluster: "test-cluster" }
      },
      TestDynamoDB: {
        Type: "AWS::DynamoDB::Table",
        Properties: { BillingMode: "PAY_PER_REQUEST", TableName: "test-table" }
      },
      TestAPIGateway: {
        Type: "AWS::ApiGateway::RestApi",
        Properties: { Name: "test-api", Description: "Test API for extraction" }
      },
      TestALB: {
        Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
        Properties: { Type: "application", Scheme: "internet-facing" }
      },
      TestClassicLB: {
        Type: "AWS::ElasticLoadBalancing::LoadBalancer",
        Properties: { Scheme: "internet-facing" }
      },
      TestS3: {
        Type: "AWS::S3::Bucket",
        Properties: { BucketName: "test-bucket-extraction" }
      },

      // 対象外リソース（混在確認用）
      TestEC2: {
        Type: "AWS::EC2::Instance", 
        Properties: { InstanceType: "t3.micro" }
      },
      TestVPC: {
        Type: "AWS::EC2::VPC",
        Properties: { CidrBlock: "10.0.0.0/16" }
      },
      TestNLB: {
        Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
        Properties: { Type: "network" } // Network LBは対象外
      },
      TestECSServiceEC2: {
        Type: "AWS::ECS::Service",
        Properties: { LaunchType: "EC2" } // EC2モードは対象外
      },
      TestCustom: {
        Type: "Custom::MyResource",
        Properties: { ServiceToken: "arn:aws:lambda:region:account:function:name" }
      }
    }
  };
}

function createLargeTemplate(): Record<string, unknown> {
  const largeTemplate: Record<string, unknown> = {
    AWSTemplateFormatVersion: "2010-09-09",
    Description: "Large template with 500 resources for performance testing",
    Resources: {}
  };
  
  const resources = largeTemplate.Resources as Record<string, unknown>;
  
  // 500個のLambda関数を生成
  for (let i = 0; i < 500; i++) {
    resources[`TestLambda${i}`] = {
      Type: "AWS::Lambda::Function",
      Properties: {
        Runtime: "nodejs20.x",
        Handler: "index.handler",
        FunctionName: `test-function-${i}`,
        Description: `Test Lambda function ${i} for performance testing`,
        Timeout: 30,
        MemorySize: 128,
        Environment: {
          Variables: {
            NODE_ENV: "test",
            FUNCTION_INDEX: i.toString()
          }
        }
      }
    };
  }

  // RDS、DynamoDB、ALBも混在
  for (let i = 0; i < 50; i++) {
    resources[`TestRDS${i}`] = {
      Type: "AWS::RDS::DBInstance",
      Properties: {
        Engine: "mysql",
        DBInstanceClass: "db.t3.micro",
        MasterUsername: "admin",
        DBName: `testdb${i}`,
        AllocatedStorage: 20
      }
    };
  }
  
  for (let i = 0; i < 50; i++) {
    resources[`TestDynamoDB${i}`] = {
      Type: "AWS::DynamoDB::Table", 
      Properties: {
        TableName: `test-table-${i}`,
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: [
          { AttributeName: "id", AttributeType: "S" }
        ],
        KeySchema: [
          { AttributeName: "id", KeyType: "HASH" }
        ]
      }
    };
  }
  
  for (let i = 0; i < 50; i++) {
    resources[`TestALB${i}`] = {
      Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
      Properties: {
        Name: `test-alb-${i}`,
        Type: "application",
        Scheme: "internet-facing",
        IpAddressType: "ipv4"
      }
    };
  }
  
  return largeTemplate;
}

function createECSTemplate(): Record<string, unknown> {
  return {
    AWSTemplateFormatVersion: "2010-09-09",
    Description: "ECS services with different launch types",
    Resources: {
      FargateService: {
        Type: "AWS::ECS::Service",
        Properties: { LaunchType: "FARGATE", Cluster: "test-cluster" }
      },
      EC2Service: {
        Type: "AWS::ECS::Service",
        Properties: { LaunchType: "EC2", Cluster: "test-cluster" }
      },
      ExternalService: {
        Type: "AWS::ECS::Service",
        Properties: { LaunchType: "EXTERNAL", Cluster: "test-cluster" }
      },
      MissingLaunchTypeService1: {
        Type: "AWS::ECS::Service",
        Properties: { Cluster: "test-cluster" } // LaunchType未指定
      },
      MissingLaunchTypeService2: {
        Type: "AWS::ECS::Service",
        Properties: { 
          Cluster: "test-cluster",
          TaskDefinition: "test-task-def"
          // LaunchType未指定
        }
      }
    }
  };
}

function createLoadBalancerTemplate(): Record<string, unknown> {
  return {
    AWSTemplateFormatVersion: "2010-09-09",
    Description: "Load balancer types template for testing",
    Resources: {
      ApplicationLB: {
        Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
        Properties: { Type: "application" }
      },
      NetworkLB: {
        Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
        Properties: { Type: "network" }
      },
      GatewayLB: {
        Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
        Properties: { Type: "gateway" }
      },
      DefaultLB: {
        Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
        Properties: { Scheme: "internet-facing" } // Type未指定（デフォルトはapplication）
      }
    }
  };
}

export function createExtractionTestFixtures(tempDir: string): void {
  const mixedResourcesTemplate = createMixedResourcesTemplate();
  writeFileSync(
    path.join(tempDir, 'mixed-resources.json'), 
    JSON.stringify(mixedResourcesTemplate, null, 2)
  );

  const largeTemplate = createLargeTemplate();
  writeFileSync(
    path.join(tempDir, 'large-resources-500.json'),
    JSON.stringify(largeTemplate, null, 2)
  );

  const ecsTemplate = createECSTemplate();
  writeFileSync(
    path.join(tempDir, 'ecs-test.json'),
    JSON.stringify(ecsTemplate, null, 2)
  );
  
  const loadBalancerTemplate = createLoadBalancerTemplate();
  writeFileSync(
    path.join(tempDir, 'loadbalancer-test.json'),
    JSON.stringify(loadBalancerTemplate, null, 2)
  );
}

export function setupTempDir(): string {
  const tempDir = path.join(tmpdir(), 'aws-cloud-supporter-extractor-test');
  try {
    mkdirSync(tempDir, { recursive: true });
  } catch {
    // Directory might already exist, ignore error
  }
  return tempDir;
}

export function cleanupTempDir(tempDir: string): void {
  try {

    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup errors in tests
  }
}