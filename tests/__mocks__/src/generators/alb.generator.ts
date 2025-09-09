import { ILogger } from '../../../../src/interfaces/logger';
import { CloudFormationResource } from '../../../../src/types/cloudformation';
import { MetricDefinition } from '../../../../src/types/metrics';

export class ALBMetricsGenerator {
  // @ts-ignore
  constructor(private _logger: ILogger) {}
  
  getSupportedTypes(): string[] {
    return ['AWS::ElasticLoadBalancingV2::LoadBalancer'];
  }
  
  async generate(_resource: CloudFormationResource): Promise<MetricDefinition[]> {
    return [{
      metric_name: 'TargetResponseTime',
      namespace: 'AWS/ApplicationELB',
      unit: 'Seconds',
      description: 'Target response time',
      statistic: 'Average',
      recommended_threshold: { warning: 1, critical: 2 },
      evaluation_period: 300,
      category: 'Latency',
      importance: 'High',
      dimensions: []
    }];
  }
}