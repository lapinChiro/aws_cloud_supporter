import { RDS_METRICS } from './rds.metrics';
import { LAMBDA_METRICS } from './lambda.metrics';
import { ECS_METRICS } from './ecs.metrics';
import { ALB_METRICS } from './alb.metrics';
import { DYNAMODB_METRICS } from './dynamodb.metrics';
import { API_GATEWAY_METRICS } from './api-gateway.metrics';

// メトリクス統計情報（監視・デバッグ用）
export const METRICS_STATISTICS = {
  totalCount: RDS_METRICS.length + LAMBDA_METRICS.length + ECS_METRICS.length + 
              ALB_METRICS.length + DYNAMODB_METRICS.length + API_GATEWAY_METRICS.length,
  byResourceType: {
    RDS: RDS_METRICS.length,
    Lambda: LAMBDA_METRICS.length,
    ECS: ECS_METRICS.length,
    ALB: ALB_METRICS.length,
    DynamoDB: DYNAMODB_METRICS.length,
    APIGateway: API_GATEWAY_METRICS.length
  },
  byCategory: {
    Performance: [RDS_METRICS, LAMBDA_METRICS, ECS_METRICS, ALB_METRICS, DYNAMODB_METRICS, API_GATEWAY_METRICS]
      .flat().filter(m => m.category === 'Performance').length,
    Error: [RDS_METRICS, LAMBDA_METRICS, ECS_METRICS, ALB_METRICS, DYNAMODB_METRICS, API_GATEWAY_METRICS]
      .flat().filter(m => m.category === 'Error').length,
    Saturation: [RDS_METRICS, LAMBDA_METRICS, ECS_METRICS, ALB_METRICS, DYNAMODB_METRICS, API_GATEWAY_METRICS]
      .flat().filter(m => m.category === 'Saturation').length,
    Latency: [RDS_METRICS, LAMBDA_METRICS, ECS_METRICS, ALB_METRICS, DYNAMODB_METRICS, API_GATEWAY_METRICS]
      .flat().filter(m => m.category === 'Latency').length
  },
  byImportance: {
    High: [RDS_METRICS, LAMBDA_METRICS, ECS_METRICS, ALB_METRICS, DYNAMODB_METRICS, API_GATEWAY_METRICS]
      .flat().filter(m => m.importance === 'High').length,
    Medium: [RDS_METRICS, LAMBDA_METRICS, ECS_METRICS, ALB_METRICS, DYNAMODB_METRICS, API_GATEWAY_METRICS]
      .flat().filter(m => m.importance === 'Medium').length,
    Low: [RDS_METRICS, LAMBDA_METRICS, ECS_METRICS, ALB_METRICS, DYNAMODB_METRICS, API_GATEWAY_METRICS]
      .flat().filter(m => m.importance === 'Low').length
  }
};