// CLAUDE.md準拠テストヘルパー（DRY原則改善）

import type { IMetricsGenerator } from '../../src/interfaces/generator';
import type { ILogger } from '../../src/interfaces/logger';
import type { 
  CloudFormationResource,
  RDSDBInstance,
  RDSProperties,
  LambdaFunction,
  LambdaProperties,
  ECSService,
  ECSServiceProperties
} from '../../src/types/cloudformation';
import type { MetricDefinition } from '../../src/types/metrics';

/**
 * mockLogger統一作成関数
 * DRY原則: 9ファイルの重複コードを1箇所に集約
 */
export function createMockLogger(): jest.Mocked<ILogger> {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    success: jest.fn(),
    setLevel: jest.fn()
  };
}

/**
 * パフォーマンステスト統一関数
 * DRY原則: 44箇所の重複するperformance.now()パターンを1箇所に集約
 */
export async function measureGeneratorPerformance(
  generator: IMetricsGenerator,
  resource: CloudFormationResource,
  expectedTimeMs = 1000,
  _logPattern?: RegExp
): Promise<{ metrics: MetricDefinition[]; duration: number }> {
  const startTime = performance.now();
  const metrics = await generator.generate(resource);
  const duration = performance.now() - startTime;
  
  expect(duration).toBeLessThan(expectedTimeMs);
  
  return { metrics, duration };
}

/**
 * リソースファクトリー関数群
 * DRY原則: 727個のCloudFormationリソース定義重複を統一化
 */

/**
 * 基本リソース作成関数
 */
export function createTestResource(
  type: string,
  logicalId: string,
  properties: Record<string, unknown> = {}
): CloudFormationResource {
  return {
    Type: type,
    LogicalId: logicalId,
    Properties: properties
  };
}

/**
 * RDSインスタンス作成ファクトリー
 */
export function createRDSInstance(
  logicalId: string,
  props?: Partial<RDSProperties>
): RDSDBInstance {
  return {
    Type: 'AWS::RDS::DBInstance',
    LogicalId: logicalId,
    Properties: props ?? {}
  };
}

/**
 * Lambda関数作成ファクトリー
 */
export function createLambdaFunction(
  logicalId: string,
  props?: Partial<LambdaProperties>
): LambdaFunction {
  return {
    Type: 'AWS::Lambda::Function',
    LogicalId: logicalId,
    Properties: props ?? {}
  };
}

/**
 * ECSサービス作成ファクトリー
 */
export function createECSService(
  logicalId: string,
  props?: Partial<ECSServiceProperties>
): ECSService {
  return {
    Type: 'AWS::ECS::Service',
    LogicalId: logicalId,
    Properties: props ?? {}
  };
}

/**
 * ALB作成ファクトリー
 */
export function createALB(
  logicalId: string,
  properties: Record<string, unknown> = {}
): CloudFormationResource {
  return createTestResource('AWS::ElasticLoadBalancingV2::LoadBalancer', logicalId, {
    Type: 'application',
    ...properties
  });
}

/**
 * DynamoDBテーブル作成ファクトリー
 */
export function createDynamoDBTable(
  logicalId: string,
  properties: Record<string, unknown> = {}
): CloudFormationResource {
  return createTestResource('AWS::DynamoDB::Table', logicalId, properties);
}

/**
 * API Gateway作成ファクトリー
 */
export function createAPIGateway(
  logicalId: string,
  properties: Record<string, unknown> = {}
): CloudFormationResource {
  return createTestResource('AWS::ApiGateway::RestApi', logicalId, properties);
}