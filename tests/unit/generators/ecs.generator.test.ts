import { ECSMetricsGenerator } from '../../../src/generators/ecs.generator';
import { createECSService } from '../../helpers';
import { createGeneratorTestSuite } from '../../helpers/generator-test-template';

createGeneratorTestSuite(ECSMetricsGenerator, {
  resourceType: 'ECS',
  supportedTypes: ['AWS::ECS::Service'],
  createResource: () => createECSService('TestFargateService', {
    ServiceName: 'test-service',
    LaunchType: 'FARGATE',
    DesiredCount: 2
  }),
  expectedMetrics: [
    'CPUUtilization',
    'MemoryUtilization',
    'CPUReservation',
    'MemoryReservation',
    'TaskCount',
    'RunningCount'
  ],
  thresholdTests: [
    { metricName: 'CPUUtilization', warning: 49, critical: 64 }
  ],
  expectedMetricCount: 15
});