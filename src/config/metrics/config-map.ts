import type { MetricConfig } from './types';
import { RDS_METRICS } from './rds.metrics';
import { LAMBDA_METRICS } from './lambda.metrics';
import { ECS_METRICS } from './ecs.metrics';
import { ALB_METRICS } from './alb.metrics';
import { DYNAMODB_METRICS } from './dynamodb.metrics';
import { API_GATEWAY_METRICS } from './api-gateway.metrics';

// =============================================================================
// メトリクス定義マップ（CLAUDE.md: DRY原則）
// =============================================================================
export const METRICS_CONFIG_MAP: Record<string, MetricConfig[]> = {
  'AWS::RDS::DBInstance': RDS_METRICS,
  'AWS::Lambda::Function': LAMBDA_METRICS,
  'AWS::Serverless::Function': LAMBDA_METRICS, // SAM関数も同じメトリクス
  'AWS::ECS::Service': ECS_METRICS,
  'AWS::ElasticLoadBalancingV2::LoadBalancer': ALB_METRICS,
  'AWS::DynamoDB::Table': DYNAMODB_METRICS,
  'AWS::ApiGateway::RestApi': API_GATEWAY_METRICS,
  'AWS::Serverless::Api': API_GATEWAY_METRICS // SAM APIも同じメトリクス
};