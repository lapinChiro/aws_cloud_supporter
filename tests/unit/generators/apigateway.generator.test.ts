import { APIGatewayMetricsGenerator } from '../../../src/generators/apigateway.generator';
import { createAPIGateway } from '../../helpers';
import { createGeneratorTestSuite } from '../../helpers/generator-test-template';

createGeneratorTestSuite(APIGatewayMetricsGenerator, {
  resourceType: 'API Gateway',
  supportedTypes: ['AWS::ApiGateway::RestApi', 'AWS::Serverless::Api'],
  createResource: () => createAPIGateway('TestRestAPI', {
    Name: 'test-api',
    Description: 'Test API Gateway'
  }),
  expectedMetrics: [
    'Count',
    '4XXError',
    '5XXError',
    'CacheHitCount',
    'CacheMissCount',
    'Latency',
    'IntegrationLatency'
  ],
  thresholdTests: [
    { metricName: 'Count', warning: 10000, critical: 100000 }
  ],
  expectedMetricCount: 14
});