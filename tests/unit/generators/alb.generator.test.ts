import { ALBMetricsGenerator } from '../../../src/generators/alb.generator';
import { createALB } from '../../helpers';
import { createGeneratorTestSuite } from '../../helpers/generator-test-template';

createGeneratorTestSuite(ALBMetricsGenerator, {
  resourceType: 'ALB',
  supportedTypes: ['AWS::ElasticLoadBalancingV2::LoadBalancer'],
  createResource: () => createALB('TestALB', {
    Name: 'test-alb',
    Scheme: 'internet-facing'
  }),
  expectedMetrics: [
    'ActiveConnectionCount',
    'NewConnectionCount',
    'ProcessedBytes',
    'RequestCount',
    'TargetResponseTime',
    'HTTPCode_Target_4XX_Count',
    'HTTPCode_Target_5XX_Count'
  ],
  thresholdTests: [
    { metricName: 'TargetResponseTime', warning: 1, critical: 4 }
  ],
  expectedMetricCount: 18
});