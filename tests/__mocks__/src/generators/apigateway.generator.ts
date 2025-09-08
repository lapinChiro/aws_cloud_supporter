import { ILogger } from '../../../../src/interfaces/logger';
import { CloudFormationResource } from '../../../../src/types/cloudformation';
import { MetricDefinition } from '../../../../src/types/metrics';

export class APIGatewayMetricsGenerator {
  constructor(private logger: ILogger) {}
  
  getSupportedTypes(): string[] {
    return ['AWS::ApiGateway::RestApi', 'AWS::Serverless::Api'];
  }
  
  async generate(resource: CloudFormationResource): Promise<MetricDefinition[]> {
    return [{
      metric_name: '4XXError',
      namespace: 'AWS/ApiGateway',
      unit: 'Count',
      description: 'Client error count',
      statistic: 'Sum',
      recommended_threshold: { warning: 10, critical: 50 },
      evaluation_period: 300,
      category: 'Error',
      importance: 'High',
      dimensions: []
    }];
  }
}