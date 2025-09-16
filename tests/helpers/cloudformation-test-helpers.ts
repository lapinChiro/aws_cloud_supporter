// tests/helpers/cloudformation-test-helpers.ts
// CloudFormationテンプレート作成用の共通ヘルパー関数

import type { CloudFormationTemplate, CloudFormationResource } from '../../src/types/cloudformation';

/**
 * 基本的なCloudFormationテンプレートを作成
 * @param resources リソース定義オブジェクト
 * @returns CloudFormationTemplate
 */
export function createTestCloudFormationTemplate(
  resources: Record<string, CloudFormationResource>
): CloudFormationTemplate {
  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: resources
  };
}

/**
 * RDS DBインスタンスリソースを作成
 * @param logicalId ロジカルID（デフォルト: 'Database'）
 * @param properties 追加プロパティ
 * @returns CloudFormationResource
 */
export function createRDSResource(
  logicalId: string = 'Database',
  properties?: Record<string, unknown>
): CloudFormationResource {
  return {
    Type: 'AWS::RDS::DBInstance',
    Properties: {
      DBInstanceClass: 'db.t3.medium',
      Engine: 'mysql',
      AllocatedStorage: '100',
      DBInstanceIdentifier: `${logicalId.toLowerCase()}-instance`,
      ...properties
    }
  };
}

/**
 * Lambda関数リソースを作成
 * @param logicalId ロジカルID（デフォルト: 'Function'）
 * @param properties 追加プロパティ
 * @returns CloudFormationResource
 */
export function createLambdaResource(
  logicalId: string = 'Function',
  properties?: Record<string, unknown>
): CloudFormationResource {
  return {
    Type: 'AWS::Lambda::Function',
    Properties: {
      Runtime: 'nodejs18.x',
      Handler: 'index.handler',
      Code: {
        ZipFile: 'exports.handler = async (event) => { return "Hello"; };'
      },
      Role: `arn:aws:iam::123456789012:role/${logicalId}Role`,
      FunctionName: logicalId.toLowerCase(),
      ...properties
    }
  };
}

/**
 * DynamoDBテーブルリソースを作成
 * @param logicalId ロジカルID（デフォルト: 'Table'）
 * @param properties 追加プロパティ
 * @returns CloudFormationResource
 */
export function createDynamoDBResource(
  logicalId: string = 'Table',
  properties?: Record<string, unknown>
): CloudFormationResource {
  return {
    Type: 'AWS::DynamoDB::Table',
    Properties: {
      TableName: `${logicalId.toLowerCase()}-table`,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      ...properties
    }
  };
}

/**
 * ECSサービスリソースを作成
 * @param logicalId ロジカルID（デフォルト: 'Service'）
 * @param properties 追加プロパティ
 * @returns CloudFormationResource
 */
export function createECSResource(
  logicalId: string = 'Service',
  properties?: Record<string, unknown>
): CloudFormationResource {
  return {
    Type: 'AWS::ECS::Service',
    Properties: {
      LaunchType: 'FARGATE',
      DesiredCount: 2,
      TaskDefinition: `${logicalId}TaskDef`,
      ...properties
    }
  };
}

/**
 * Application Load Balancerリソースを作成
 * @param logicalId ロジカルID（デフォルト: 'LoadBalancer'）
 * @param properties 追加プロパティ
 * @returns CloudFormationResource
 */
export function createELBResource(
  _logicalId: string = 'LoadBalancer',
  properties?: Record<string, unknown>
): CloudFormationResource {
  return {
    Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
    Properties: {
      Type: 'application',
      Scheme: 'internet-facing',
      IpAddressType: 'ipv4',
      ...properties
    }
  };
}

/**
 * API Gatewayリソースを作成
 * @param logicalId ロジカルID（デフォルト: 'Api'）
 * @param properties 追加プロパティ
 * @returns CloudFormationResource
 */
export function createApiGatewayResource(
  logicalId: string = 'Api',
  properties?: Record<string, unknown>
): CloudFormationResource {
  return {
    Type: 'AWS::ApiGateway::RestApi',
    Properties: {
      Name: `${logicalId.toLowerCase()}-api`,
      Description: 'Test API',
      ...properties
    }
  };
}

/**
 * Serverless関数リソースを作成
 * @param logicalId ロジカルID（デフォルト: 'ServerlessFunction'）
 * @param properties 追加プロパティ
 * @returns CloudFormationResource
 */
export function createServerlessFunctionResource(
  _logicalId: string = 'ServerlessFunction',
  properties?: Record<string, unknown>
): CloudFormationResource {
  return {
    Type: 'AWS::Serverless::Function',
    Properties: {
      Runtime: 'nodejs18.x',
      Handler: 'app.handler',
      CodeUri: '.',
      ...properties
    }
  };
}

/**
 * Serverless APIリソースを作成
 * @param logicalId ロジカルID（デフォルト: 'ServerlessApi'）
 * @param properties 追加プロパティ
 * @returns CloudFormationResource
 */
export function createServerlessApiResource(
  _logicalId: string = 'ServerlessApi',
  properties?: Record<string, unknown>
): CloudFormationResource {
  return {
    Type: 'AWS::Serverless::Api',
    Properties: {
      StageName: 'Prod',
      Cors: {
        AllowOrigin: "'*'"
      },
      ...properties
    }
  };
}

// プリセットテンプレート

/**
 * RDSテンプレートを作成
 * @returns CloudFormationTemplate
 */
export function createRDSTemplate(): CloudFormationTemplate {
  return createTestCloudFormationTemplate({
    Database: createRDSResource('Database', {
      MasterUserPassword: 'secret123', // サニタイズテスト用
      MasterUsername: 'admin'
    })
  });
}

/**
 * Lambdaテンプレートを作成
 * @returns CloudFormationTemplate
 */
export function createLambdaTemplate(): CloudFormationTemplate {
  return createTestCloudFormationTemplate({
    Function: createLambdaResource('Function', {
      MemorySize: 512,
      Timeout: 300
    })
  });
}

/**
 * DynamoDBテンプレートを作成
 * @returns CloudFormationTemplate
 */
export function createDynamoDBTemplate(): CloudFormationTemplate {
  return createTestCloudFormationTemplate({
    Table: createDynamoDBResource('Table')
  });
}

/**
 * 複数リソースを含むテンプレートを作成
 * @returns CloudFormationTemplate
 */
export function createMultiResourceTemplate(): CloudFormationTemplate {
  return createTestCloudFormationTemplate({
    Database: createRDSResource(),
    Function: createLambdaResource(),
    Table: createDynamoDBResource(),
    Service: createECSResource(),
    LoadBalancer: createELBResource(),
    Api: createApiGatewayResource()
  });
}

/**
 * 大規模テンプレートを作成
 * @param resourceCount リソース数
 * @returns CloudFormationTemplate
 */
export function createLargeTemplate(resourceCount: number = 20): CloudFormationTemplate {
  const resources: Record<string, CloudFormationResource> = {};
  const resourceTypes = [
    createRDSResource,
    createLambdaResource,
    createDynamoDBResource,
    createECSResource,
    createELBResource,
    createApiGatewayResource
  ];

  for (let i = 0; i < resourceCount; i++) {
    const factory = resourceTypes[i % resourceTypes.length];
    const logicalId = `Resource${i + 1}`;
    if (factory) {
      resources[logicalId] = factory(logicalId);
    }
  }

  return createTestCloudFormationTemplate(resources);
}

/**
 * サニタイズテスト用のセンシティブデータを含むテンプレートを作成
 * @returns CloudFormationTemplate
 */
export function createSensitiveTemplate(): CloudFormationTemplate {
  return createTestCloudFormationTemplate({
    Database: createRDSResource('Database', {
      MasterUserPassword: 'SuperSecretPassword123!',
      MasterUsername: 'admin',
      DBSnapshotIdentifier: 'sensitive-snapshot'
    }),
    Function: createLambdaResource('Function', {
      Environment: {
        Variables: {
          API_KEY: 'sk-1234567890abcdef',
          DATABASE_PASSWORD: 'dbpass123'
        }
      }
    })
  });
}