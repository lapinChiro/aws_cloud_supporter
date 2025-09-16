import { LambdaMetricsGenerator } from '../../../src/generators/lambda.generator';
import { createLambdaFunction } from '../../helpers';
import { createGeneratorTestSuite } from '../../helpers/generator-test-template';

createGeneratorTestSuite(LambdaMetricsGenerator, {
  resourceType: 'Lambda',
  supportedTypes: ['AWS::Lambda::Function', 'AWS::Serverless::Function'],
  createResource: () => createLambdaFunction('TestFunction128MB', {
    Runtime: 'nodejs18.x',
    MemorySize: 128,
    Timeout: 30
  }),
  expectedMetrics: [
    'Duration',
    'Errors',
    'Throttles',
    'ConcurrentExecutions',
    'ProvisionedConcurrencyUtilization'
  ],
  thresholdTests: [
    { metricName: 'Duration', warning: 2000, critical: 2500 }
  ],
  expectedMetricCount: 15
});