import type { ILogger } from '../../../../src/interfaces/logger';
import type { CloudFormationResource } from '../../../../src/types/cloudformation';
import type { MetricDefinition } from '../../../../src/types/metrics';

export class DynamoDBMetricsGenerator {
  // @ts-expect-error
  constructor(private readonly _logger: ILogger) {}
  
  getSupportedTypes(): string[] {
    return ['AWS::DynamoDB::Table'];
  }
  
  async generate(_resource: CloudFormationResource): Promise<MetricDefinition[]> {
    return [{
      metric_name: 'ConsumedReadCapacityUnits',
      namespace: 'AWS/DynamoDB',
      unit: 'Count',
      description: 'Consumed read capacity',
      statistic: 'Sum',
      recommended_threshold: { warning: 80, critical: 90 },
      evaluation_period: 300,
      category: 'Saturation',
      importance: 'Medium',
      dimensions: []
    }];
  }
}