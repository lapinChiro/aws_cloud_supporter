import type { ILogger } from '../../../../src/interfaces/logger';
import type { CloudFormationResource } from '../../../../src/types/cloudformation';
import type { MetricDefinition } from '../../../../src/types/metrics';

export class APIGatewayMetricsGenerator {
  // @ts-expect-error
  constructor(private readonly _logger: ILogger) {}
  
  getSupportedTypes(): string[] {
    return ['AWS::ApiGateway::RestApi', 'AWS::Serverless::Api'];
  }
  
  generate(_resource: CloudFormationResource): Promise<MetricDefinition[]> {
    return Promise.resolve([{
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
    }]);
  }
}