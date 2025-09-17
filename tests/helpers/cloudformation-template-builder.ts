// CloudFormation Template Builder Pattern
// CLAUDE.md準拠: DRY原則・Builder Pattern・流暢なインターフェース

import type {
  CloudFormationTemplate,
  CloudFormationResource,
  ParameterDefinition,
  OutputDefinition,
  CloudFormationMetadata
} from '../../src/types/cloudformation';

/**
 * CloudFormationテンプレートビルダー
 * 流暢なインターフェースでテンプレートを段階的に構築
 */
export class CloudFormationTemplateBuilder {
  private readonly resources: Map<string, CloudFormationResource> = new Map();
  private templateFormatVersion: '2010-09-09' = '2010-09-09';
  private description?: string;
  private parameters?: Record<string, ParameterDefinition>;
  private outputs?: Record<string, OutputDefinition>;
  private readonly conditions?: Record<string, unknown>;
  private readonly mappings?: Record<string, unknown>;
  private readonly metadata?: CloudFormationMetadata;

  /**
   * テンプレートバージョンを設定
   */
  withVersion(version: '2010-09-09'): this {
    this.templateFormatVersion = version;
    return this;
  }

  /**
   * 説明を設定
   */
  withDescription(description: string): this {
    this.description = description;
    return this;
  }

  /**
   * パラメーターを追加
   */
  addParameter(name: string, parameter: ParameterDefinition): this {
    this.parameters ??= {};
    this.parameters[name] = parameter;
    return this;
  }

  /**
   * RDSリソースを追加
   */
  addRDS(
    logicalId: string,
    options: {
      engine?: string;
      instanceClass?: string;
      allocatedStorage?: string;
      masterUsername?: string;
      masterPassword?: string;
      dbName?: string;
      properties?: Record<string, unknown>;
    } = {}
  ): this {
    const resource: CloudFormationResource = {
      Type: 'AWS::RDS::DBInstance',
      Properties: {
        DBInstanceClass: options.instanceClass ?? 'db.t3.medium',
        Engine: options.engine ?? 'mysql',
        AllocatedStorage: options.allocatedStorage ?? '100',
        DBInstanceIdentifier: `${logicalId.toLowerCase()}-instance`,
        ...(options.masterUsername && { MasterUsername: options.masterUsername }),
        ...(options.masterPassword && { MasterUserPassword: options.masterPassword }),
        ...(options.dbName && { DBName: options.dbName }),
        ...options.properties
      }
    };
    this.resources.set(logicalId, resource);
    return this;
  }

  /**
   * Lambda関数を追加
   */
  addLambda(
    logicalId: string,
    options: {
      runtime?: string;
      handler?: string;
      code?: string | Record<string, unknown>;
      memorySize?: number;
      timeout?: number;
      environment?: Record<string, string>;
      properties?: Record<string, unknown>;
    } = {}
  ): this {
    const resource: CloudFormationResource = {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Runtime: options.runtime ?? 'nodejs18.x',
        Handler: options.handler ?? 'index.handler',
        Code: options.code ?? { ZipFile: 'exports.handler = async (event) => { return "Hello"; };' },
        Role: `arn:aws:iam::123456789012:role/${logicalId}Role`,
        FunctionName: logicalId.toLowerCase(),
        ...(options.memorySize && { MemorySize: options.memorySize }),
        ...(options.timeout && { Timeout: options.timeout }),
        ...(options.environment && { Environment: { Variables: options.environment } }),
        ...options.properties
      }
    };
    this.resources.set(logicalId, resource);
    return this;
  }

  /**
   * DynamoDBテーブルを追加
   */
  addDynamoDB(
    logicalId: string,
    options: {
      tableName?: string;
      billingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST';
      hashKey?: { name: string; type: string };
      rangeKey?: { name: string; type: string };
      properties?: Record<string, unknown>;
    } = {}
  ): this {
    const attributeDefinitions = [];
    const keySchema = [];

    const hashKey = options.hashKey ?? { name: 'id', type: 'S' };
    attributeDefinitions.push({ AttributeName: hashKey.name, AttributeType: hashKey.type });
    keySchema.push({ AttributeName: hashKey.name, KeyType: 'HASH' });

    if (options.rangeKey) {
      attributeDefinitions.push({ AttributeName: options.rangeKey.name, AttributeType: options.rangeKey.type });
      keySchema.push({ AttributeName: options.rangeKey.name, KeyType: 'RANGE' });
    }

    const resource: CloudFormationResource = {
      Type: 'AWS::DynamoDB::Table',
      Properties: {
        TableName: options.tableName ?? `${logicalId.toLowerCase()}-table`,
        BillingMode: options.billingMode ?? 'PAY_PER_REQUEST',
        AttributeDefinitions: attributeDefinitions,
        KeySchema: keySchema,
        ...options.properties
      }
    };
    this.resources.set(logicalId, resource);
    return this;
  }

  /**
   * ECSサービスを追加
   */
  addECS(
    logicalId: string,
    options: {
      launchType?: 'FARGATE' | 'EC2';
      desiredCount?: number;
      taskDefinition?: string;
      properties?: Record<string, unknown>;
    } = {}
  ): this {
    const resource: CloudFormationResource = {
      Type: 'AWS::ECS::Service',
      Properties: {
        LaunchType: options.launchType ?? 'FARGATE',
        DesiredCount: options.desiredCount ?? 2,
        TaskDefinition: options.taskDefinition ?? `${logicalId}TaskDef`,
        ...options.properties
      }
    };
    this.resources.set(logicalId, resource);
    return this;
  }

  /**
   * Application Load Balancerを追加
   */
  addALB(
    logicalId: string,
    options: {
      type?: 'application' | 'network';
      scheme?: 'internet-facing' | 'internal';
      ipAddressType?: 'ipv4' | 'dualstack';
      properties?: Record<string, unknown>;
    } = {}
  ): this {
    const resource: CloudFormationResource = {
      Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
      Properties: {
        Type: options.type ?? 'application',
        Scheme: options.scheme ?? 'internet-facing',
        IpAddressType: options.ipAddressType ?? 'ipv4',
        ...options.properties
      }
    };
    this.resources.set(logicalId, resource);
    return this;
  }

  /**
   * API Gatewayを追加
   */
  addAPIGateway(
    logicalId: string,
    options: {
      name?: string;
      description?: string;
      properties?: Record<string, unknown>;
    } = {}
  ): this {
    const resource: CloudFormationResource = {
      Type: 'AWS::ApiGateway::RestApi',
      Properties: {
        Name: options.name ?? `${logicalId.toLowerCase()}-api`,
        Description: options.description ?? 'API Gateway',
        ...options.properties
      }
    };
    this.resources.set(logicalId, resource);
    return this;
  }

  /**
   * S3バケットを追加
   */
  addS3Bucket(
    logicalId: string,
    options: {
      bucketName?: string;
      versioning?: boolean;
      encryption?: boolean;
      properties?: Record<string, unknown>;
    } = {}
  ): this {
    const resource: CloudFormationResource = {
      Type: 'AWS::S3::Bucket',
      Properties: {
        ...(options.bucketName && { BucketName: options.bucketName }),
        ...(options.versioning && { VersioningConfiguration: { Status: 'Enabled' } }),
        ...(options.encryption && {
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [{
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }]
          }
        }),
        ...options.properties
      }
    };
    this.resources.set(logicalId, resource);
    return this;
  }

  /**
   * カスタムリソースを追加
   */
  addCustomResource(
    logicalId: string,
    type: string,
    properties: Record<string, unknown> = {}
  ): this {
    const resource: CloudFormationResource = {
      Type: type,
      Properties: properties
    };
    this.resources.set(logicalId, resource);
    return this;
  }

  /**
   * アウトプットを追加
   */
  addOutput(name: string, output: OutputDefinition): this {
    this.outputs ??= {};
    this.outputs[name] = output;
    return this;
  }

  /**
   * ビルド
   */
  build(): CloudFormationTemplate {
    const template: CloudFormationTemplate = {
      AWSTemplateFormatVersion: this.templateFormatVersion,
      Resources: Object.fromEntries(this.resources)
    };

    if (this.description) template.Description = this.description;
    if (this.parameters) template.Parameters = this.parameters;
    if (this.outputs) template.Outputs = this.outputs;
    if (this.conditions) template.Conditions = this.conditions;
    if (this.mappings) template.Mappings = this.mappings;
    if (this.metadata) template.Metadata = this.metadata;

    return template;
  }

  /**
   * プリセット: 基本的なWebアプリケーションスタック
   */
  static webApplicationStack(): CloudFormationTemplateBuilder {
    return new CloudFormationTemplateBuilder()
      .withDescription('Web Application Stack')
      .addALB('LoadBalancer')
      .addECS('WebService')
      .addRDS('Database')
      .addS3Bucket('StaticAssets', { versioning: true, encryption: true });
  }

  /**
   * プリセット: サーバーレスAPIスタック
   */
  static serverlessApiStack(): CloudFormationTemplateBuilder {
    return new CloudFormationTemplateBuilder()
      .withDescription('Serverless API Stack')
      .addAPIGateway('Api')
      .addLambda('Handler', { memorySize: 1024, timeout: 30 })
      .addDynamoDB('DataTable');
  }

  /**
   * プリセット: マイクロサービススタック
   */
  static microservicesStack(): CloudFormationTemplateBuilder {
    return new CloudFormationTemplateBuilder()
      .withDescription('Microservices Stack')
      .addALB('PublicLoadBalancer')
      .addECS('ServiceA')
      .addECS('ServiceB')
      .addECS('ServiceC')
      .addRDS('SharedDatabase');
  }
}

/**
 * ファクトリ関数
 */
export function cfnTemplate(): CloudFormationTemplateBuilder {
  return new CloudFormationTemplateBuilder();
}