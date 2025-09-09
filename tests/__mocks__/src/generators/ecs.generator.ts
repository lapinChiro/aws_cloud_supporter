import { ILogger } from '../../../../src/interfaces/logger';
import { CloudFormationResource } from '../../../../src/types/cloudformation';
import { MetricDefinition } from '../../../../src/types/metrics';

export class ECSMetricsGenerator {
  // @ts-ignore
  constructor(private _logger: ILogger) {}
  
  getSupportedTypes(): string[] {
    return ['AWS::ECS::Service'];
  }
  
  async generate(_resource: CloudFormationResource): Promise<MetricDefinition[]> {
    return [{
      metric_name: 'CPUUtilization',
      namespace: 'AWS/ECS',
      unit: 'Percent',
      description: 'ECS service CPU utilization',
      statistic: 'Average',
      recommended_threshold: { warning: 70, critical: 90 },
      evaluation_period: 300,
      category: 'Performance',
      importance: 'High',
      dimensions: []
    }];
  }
}