import type { ILogger } from '../../../../src/interfaces/logger';
import type { CloudFormationResource } from '../../../../src/types/cloudformation';
import type { MetricDefinition } from '../../../../src/types/metrics';

export class RDSMetricsGenerator {
  // @ts-expect-error
  constructor(private readonly _logger: ILogger) {}
  
  getSupportedTypes(): string[] {
    return ['AWS::RDS::DBInstance'];
  }
  
  async generate(_resource: CloudFormationResource): Promise<MetricDefinition[]> {
    return [
      {
        metric_name: 'CPUUtilization',
        namespace: 'AWS/RDS',
        unit: 'Percent',
        description: 'Database CPU utilization',
        statistic: 'Average',
        recommended_threshold: {
          warning: 70,
          critical: 90
        },
        evaluation_period: 300,
        category: 'Performance',
        importance: 'High',
        dimensions: [
          { name: 'DBInstanceIdentifier', value: 'test-db' }
        ]
      }
    ];
  }
}