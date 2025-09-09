import { ILogger } from '../../../../src/interfaces/logger';
import { CloudFormationResource } from '../../../../src/types/cloudformation';
import { MetricDefinition } from '../../../../src/types/metrics';

export class LambdaMetricsGenerator {
  // @ts-ignore
  constructor(private _logger: ILogger) {}
  
  getSupportedTypes(): string[] {
    return ['AWS::Lambda::Function'];
  }
  
  async generate(_resource: CloudFormationResource): Promise<MetricDefinition[]> {
    return [{
      metric_name: 'Duration',
      namespace: 'AWS/Lambda',
      unit: 'Milliseconds',
      description: 'Function execution duration',
      statistic: 'Average',
      recommended_threshold: { warning: 4000, critical: 5000 },
      evaluation_period: 300,
      category: 'Performance',
      importance: 'High',
      dimensions: [{ name: 'FunctionName', value: 'test-function' }]
    }];
  }
}