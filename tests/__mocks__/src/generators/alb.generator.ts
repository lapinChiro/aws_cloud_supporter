import type { ILogger } from '../../../../src/interfaces/logger';
import type { CloudFormationResource } from '../../../../src/types/cloudformation';
import type { MetricDefinition } from '../../../../src/types/metrics';

export class ALBMetricsGenerator {
  // @ts-expect-error
  constructor(private readonly _logger: ILogger) {}
  
  getSupportedTypes(): string[] {
    return ['AWS::ElasticLoadBalancingV2::LoadBalancer'];
  }
  
  generate(_resource: CloudFormationResource): Promise<MetricDefinition[]> {
    return Promise.resolve([{
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
    }]);
  }
}