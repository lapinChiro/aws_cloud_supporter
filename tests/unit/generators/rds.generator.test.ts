import { RDSMetricsGenerator } from '../../../src/generators/rds.generator';
import { createRDSInstance } from '../../helpers';
import { createGeneratorTestSuite } from '../../helpers/generator-test-template';

createGeneratorTestSuite(RDSMetricsGenerator, {
  resourceType: 'RDS',
  supportedTypes: ['AWS::RDS::DBInstance'],
  createResource: () => createRDSInstance('TestMicroDB', {
    DBInstanceClass: 'db.t3.micro',
    Engine: 'mysql',
    AllocatedStorage: 20
  }),
  expectedMetrics: [
    'CPUUtilization',
    'DatabaseConnections',
    'ReadLatency',
    'WriteLatency',
    'FreeStorageSpace'
  ],
  thresholdTests: [
    { metricName: 'CPUUtilization', warning: 35, critical: 46 }
  ],
  expectedMetricCount: 20,
  performanceTestResource: () => createRDSInstance('PerformanceTestDB', {
    DBInstanceClass: 'db.t3.micro'
  })
});