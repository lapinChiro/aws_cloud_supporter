import { ILogger } from '../../../../src/interfaces/logger';
import { CloudFormationResource } from '../../../../src/types/cloudformation';
import { MetricDefinition } from '../../../../src/types/metrics';

export class RDSMetricsGenerator {
  constructor(private logger: ILogger) {}
  
  getSupportedTypes(): string[] {
    return ['AWS::RDS::DBInstance'];
  }
  
  async generate(resource: CloudFormationResource): Promise<MetricDefinition[]> {
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
          { name: 'DBInstanceIdentifier', value: resource.Properties?.DBInstanceIdentifier || 'test-db' }
        ]
      }
    ];
  }
}