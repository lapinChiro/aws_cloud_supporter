import { ILogger } from '../../../../src/interfaces/logger';
import { CloudFormationResource } from '../../../../src/types/cloudformation';
import { MetricDefinition } from '../../../../src/types/metrics';

export class DynamoDBMetricsGenerator {
  constructor(private logger: ILogger) {}
  
  getSupportedTypes(): string[] {
    return ['AWS::DynamoDB::Table'];
  }
  
  async generate(resource: CloudFormationResource): Promise<MetricDefinition[]> {
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