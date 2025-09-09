// CLAUDE.md準拠CloudFormation型定義（any型完全排除、型安全性重視）

// CloudFormationテンプレート最上位型
export interface CloudFormationTemplate {
  AWSTemplateFormatVersion?: '2010-09-09';
  Description?: string;
  Parameters?: Record<string, ParameterDefinition>;
  Resources: Record<string, CloudFormationResource>;
  Outputs?: Record<string, OutputDefinition>;
  Metadata?: CloudFormationMetadata;
  Conditions?: Record<string, unknown>; // 条件は複雑なのでunknown
  Mappings?: Record<string, unknown>; // マッピングも複雑なのでunknown
  Transform?: string | string[]; // SAM等のtransform
}

// パラメータ定義（型安全）
export interface ParameterDefinition {
  Type: 'String' | 'Number' | 'List<Number>' | 'CommaDelimitedList' | 'AWS::EC2::AvailabilityZone::Name' | 'AWS::EC2::VPC::Id';
  Default?: unknown;
  AllowedValues?: unknown[];
  AllowedPattern?: string;
  Description?: string;
  MinLength?: number;
  MaxLength?: number;
  MinValue?: number;
  MaxValue?: number;
  NoEcho?: boolean;
  ConstraintDescription?: string;
}

// 出力定義（型安全）
export interface OutputDefinition {
  Description?: string;
  Value: unknown; // CloudFormation関数等があるためunknown
  Export?: {
    Name: string;
  };
  Condition?: string;
}

// CloudFormationメタデータ（型安全）
export interface CloudFormationMetadata {
  'AWS::CloudFormation::Designer'?: {
    id?: string;
    [key: string]: unknown;
  };
  'AWS::CloudFormation::Interface'?: {
    ParameterGroups?: Array<{
      Label?: { default?: string };
      Parameters?: string[];
    }>;
    ParameterLabels?: Record<string, { default?: string }>;
  };
  [key: string]: unknown; // 拡張メタデータはunknown
}

// CloudFormationリソース基底型（厳密型定義）
export interface CloudFormationResource {
  Type: string;
  Properties?: unknown; // プロパティは型別に厳密定義
  LogicalId?: string; // ランタイムで使用されるLogicalId（テンプレートキーから設定）
  Condition?: string;
  DependsOn?: string | string[];
  Metadata?: CloudFormationMetadata;
  CreationPolicy?: unknown;
  UpdatePolicy?: unknown;
  DeletionPolicy?: 'Delete' | 'Retain' | 'Snapshot';
  UpdateReplacePolicy?: 'Delete' | 'Retain' | 'Snapshot';
}

// =============================================================================
// RDS型定義（CLAUDE.md: 型安全性、車輪の再発明回避）
// =============================================================================

export interface RDSDBInstance extends CloudFormationResource {
  Type: 'AWS::RDS::DBInstance';
  Properties?: RDSProperties;
}

export interface RDSProperties {
  // インスタンス基本設定
  DBInstanceIdentifier?: string;
  DBInstanceClass?: DBInstanceClass;
  Engine?: DatabaseEngine;
  EngineVersion?: string;
  MasterUsername?: string;
  MasterUserPassword?: string; // セキュリティ: 実際の値は格納しない
  
  // ストレージ設定
  AllocatedStorage?: number;
  StorageType?: StorageType;
  StorageEncrypted?: boolean;
  KmsKeyId?: string;
  Iops?: number;
  
  // 可用性・バックアップ
  MultiAZ?: boolean;
  AvailabilityZone?: string;
  BackupRetentionPeriod?: number;
  PreferredBackupWindow?: string;
  PreferredMaintenanceWindow?: string;
  
  // ネットワーク
  VPCSecurityGroups?: string[];
  DBSecurityGroups?: string[];
  DBSubnetGroupName?: string;
  Port?: number;
  PubliclyAccessible?: boolean;
  
  // パフォーマンス・監視
  EnablePerformanceInsights?: boolean;
  PerformanceInsightsRetentionPeriod?: number;
  MonitoringInterval?: number;
  MonitoringRoleArn?: string;
  
  // その他設定（unknown型で型安全性確保）
  [key: string]: unknown;
}

// 厳密な列挙型定義
export type DBInstanceClass = 
  // t3系（汎用バースト）
  | 'db.t3.micro' | 'db.t3.small' | 'db.t3.medium' | 'db.t3.large' | 'db.t3.xlarge' | 'db.t3.2xlarge'
  // m5系（汎用）
  | 'db.m5.large' | 'db.m5.xlarge' | 'db.m5.2xlarge' | 'db.m5.4xlarge' | 'db.m5.8xlarge' | 'db.m5.12xlarge' | 'db.m5.16xlarge' | 'db.m5.24xlarge'
  // r5系（メモリ最適化）
  | 'db.r5.large' | 'db.r5.xlarge' | 'db.r5.2xlarge' | 'db.r5.4xlarge' | 'db.r5.8xlarge' | 'db.r5.12xlarge' | 'db.r5.16xlarge' | 'db.r5.24xlarge'
  // r6g系（Graviton2）
  | 'db.r6g.large' | 'db.r6g.xlarge' | 'db.r6g.2xlarge' | 'db.r6g.4xlarge'
  | string; // 将来のインスタンスクラス対応

export type DatabaseEngine = 'mysql' | 'postgresql' | 'mariadb' | 'oracle-ee' | 'oracle-se2' | 'sqlserver-ex' | 'sqlserver-web' | 'sqlserver-se' | 'sqlserver-ee';
export type StorageType = 'standard' | 'gp2' | 'gp3' | 'io1' | 'io2';

// =============================================================================
// Lambda型定義（型安全性重視）
// =============================================================================

export interface LambdaFunction extends CloudFormationResource {
  Type: 'AWS::Lambda::Function';
  Properties?: LambdaProperties;
}

export interface ServerlessFunction extends CloudFormationResource {
  Type: 'AWS::Serverless::Function';
  Properties?: ServerlessLambdaProperties;
}

export interface LambdaProperties {
  FunctionName?: string;
  Runtime?: LambdaRuntime;
  Handler?: string;
  Code?: {
    ZipFile?: string;
    S3Bucket?: string;
    S3Key?: string;
    S3ObjectVersion?: string;
    ImageUri?: string;
  };
  Role?: string;
  Timeout?: number; // 1-900秒
  MemorySize?: number; // 128-10240MB
  ReservedConcurrentExecutions?: number;
  Environment?: {
    Variables?: Record<string, string>;
  };
  DeadLetterConfig?: {
    TargetArn?: string;
  };
  TracingConfig?: {
    Mode?: 'Active' | 'PassThrough';
  };
  [key: string]: unknown;
}

export interface ServerlessLambdaProperties extends LambdaProperties {
  CodeUri?: string;
  Events?: Record<string, unknown>; // SAMイベント定義
  Policies?: unknown;
  Layers?: string[];
}

export type LambdaRuntime = 
  // Node.js
  | 'nodejs18.x' | 'nodejs20.x'
  // Python
  | 'python3.9' | 'python3.10' | 'python3.11' | 'python3.12'
  // Java
  | 'java8.al2' | 'java11' | 'java17' | 'java21'
  // .NET
  | 'dotnet6' | 'dotnet8'
  // Go
  | 'go1.x'
  // Ruby
  | 'ruby3.2'
  // カスタムランタイム
  | 'provided.al2' | 'provided.al2023'
  | string; // 新しいランタイム対応

// =============================================================================
// その他サポートリソース型定義
// =============================================================================

export interface ECSService extends CloudFormationResource {
  Type: 'AWS::ECS::Service';
  Properties?: ECSServiceProperties;
}

export interface ECSServiceProperties {
  ServiceName?: string;
  Cluster?: string;
  TaskDefinition?: string;
  LaunchType?: 'EC2' | 'FARGATE' | 'EXTERNAL';
  CapacityProviderStrategy?: Array<{
    CapacityProvider?: string;
    Weight?: number;
    Base?: number;
  }>;
  DesiredCount?: number;
  PlatformVersion?: string;
  [key: string]: unknown;
}

export interface ApplicationLoadBalancer extends CloudFormationResource {
  Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer';
  Properties?: ALBProperties;
}

export interface ALBProperties {
  Name?: string;
  Type?: 'application' | 'network' | 'gateway';
  Scheme?: 'internet-facing' | 'internal';
  IpAddressType?: 'ipv4' | 'dualstack';
  Subnets?: string[];
  SecurityGroups?: string[];
  [key: string]: unknown;
}

export interface DynamoDBTable extends CloudFormationResource {
  Type: 'AWS::DynamoDB::Table';
  Properties?: DynamoDBProperties;
}

export interface DynamoDBProperties {
  TableName?: string;
  BillingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST';
  AttributeDefinitions?: Array<{
    AttributeName?: string;
    AttributeType?: 'S' | 'N' | 'B';
  }>;
  KeySchema?: Array<{
    AttributeName?: string;
    KeyType?: 'HASH' | 'RANGE';
  }>;
  GlobalSecondaryIndexes?: Array<{
    IndexName?: string;
    KeySchema?: Array<{
      AttributeName?: string;
      KeyType?: 'HASH' | 'RANGE';
    }>;
    Projection?: {
      ProjectionType?: 'ALL' | 'KEYS_ONLY' | 'INCLUDE';
      NonKeyAttributes?: string[];
    };
  }>;
  [key: string]: unknown;
}

export interface APIGatewayRestAPI extends CloudFormationResource {
  Type: 'AWS::ApiGateway::RestApi';
  Properties?: APIGatewayProperties;
}

export interface ServerlessAPI extends CloudFormationResource {
  Type: 'AWS::Serverless::Api';
  Properties?: ServerlessAPIProperties;
}

export interface APIGatewayProperties {
  Name?: string;
  Description?: string;
  EndpointConfiguration?: {
    Types?: Array<'EDGE' | 'REGIONAL' | 'PRIVATE'>;
  };
  [key: string]: unknown;
}

export interface ServerlessAPIProperties extends APIGatewayProperties {
  StageName?: string;
  Cors?: unknown; // CORS設定は複雑なのでunknown
  Auth?: unknown; // 認証設定は複雑なのでunknown
}

// =============================================================================
// Union型定義（型安全性確保）
// =============================================================================

// サポート対象リソースのUnion型（CLAUDE.md: Type-Driven Development）
export type SupportedResource = 
  | RDSDBInstance
  | LambdaFunction
  | ServerlessFunction
  | ECSService  
  | ApplicationLoadBalancer
  | DynamoDBTable
  | APIGatewayRestAPI
  | ServerlessAPI;

// リソースタイプ列挙（DRY原則）
export enum ResourceType {
  RDS_DB_INSTANCE = 'AWS::RDS::DBInstance',
  LAMBDA_FUNCTION = 'AWS::Lambda::Function',
  SERVERLESS_FUNCTION = 'AWS::Serverless::Function',
  ECS_SERVICE = 'AWS::ECS::Service',
  ALB = 'AWS::ElasticLoadBalancingV2::LoadBalancer',
  DYNAMODB_TABLE = 'AWS::DynamoDB::Table',
  API_GATEWAY = 'AWS::ApiGateway::RestApi',
  SERVERLESS_API = 'AWS::Serverless::Api'
}

// リソース識別ヘルパー（型安全性確保）
export function isRDSInstance(resource: CloudFormationResource): resource is RDSDBInstance {
  return resource.Type === ResourceType.RDS_DB_INSTANCE;
}

export function isLambdaFunction(resource: CloudFormationResource): resource is LambdaFunction {
  return resource.Type === ResourceType.LAMBDA_FUNCTION;
}

export function isServerlessFunction(resource: CloudFormationResource): resource is ServerlessFunction {
  return resource.Type === ResourceType.SERVERLESS_FUNCTION;
}

export function isECSService(resource: CloudFormationResource): resource is ECSService {
  return resource.Type === ResourceType.ECS_SERVICE;
}

export function isALB(resource: CloudFormationResource): resource is ApplicationLoadBalancer {
  return resource.Type === ResourceType.ALB;
}

export function isDynamoDBTable(resource: CloudFormationResource): resource is DynamoDBTable {
  return resource.Type === ResourceType.DYNAMODB_TABLE;
}

export function isAPIGateway(resource: CloudFormationResource): resource is APIGatewayRestAPI {
  return resource.Type === ResourceType.API_GATEWAY;
}

export function isServerlessAPI(resource: CloudFormationResource): resource is ServerlessAPI {
  return resource.Type === ResourceType.SERVERLESS_API;
}

// 型安全なリソース判定（CLAUDE.md: Type-Driven Development）
export function isSupportedResource(resource: CloudFormationResource): resource is SupportedResource {
  const supportedTypes = new Set([
    ResourceType.RDS_DB_INSTANCE,
    ResourceType.LAMBDA_FUNCTION,
    ResourceType.SERVERLESS_FUNCTION,
    ResourceType.ECS_SERVICE,
    ResourceType.ALB,
    ResourceType.DYNAMODB_TABLE,
    ResourceType.API_GATEWAY,
    ResourceType.SERVERLESS_API
  ]);
  
  return supportedTypes.has(resource.Type as ResourceType);
}

// Fargateサービス判定（型安全、ECS特殊ケース対応）
export function isFargateService(resource: CloudFormationResource): boolean {
  if (!isECSService(resource)) return false;
  
  const props = resource.Properties as ECSServiceProperties;
  if (!props) return false;
  
  // LaunchType直接指定
  if (props.LaunchType === 'FARGATE') return true;
  
  // CapacityProviderStrategy経由
  if (props.CapacityProviderStrategy) {
    return props.CapacityProviderStrategy.some(strategy => 
      strategy.CapacityProvider === 'FARGATE' || 
      strategy.CapacityProvider === 'FARGATE_SPOT'
    );
  }
  
  return false;
}

// Application LB判定（NLB除外）
export function isApplicationLoadBalancer(resource: CloudFormationResource): boolean {
  if (!isALB(resource)) return false;
  
  const props = resource.Properties as ALBProperties;
  if (!props) return true; // デフォルトはApplication
  
  return !props.Type || props.Type === 'application';
}