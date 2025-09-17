import { DynamoDBMetricsGenerator } from '../../../src/generators/dynamodb.generator';
import { createDynamoDBTable } from '../../helpers';
import { createGeneratorTestSuite } from '../../helpers/generator-test-template';

createGeneratorTestSuite(DynamoDBMetricsGenerator, {
  resourceType: 'DynamoDB',
  supportedTypes: ['AWS::DynamoDB::Table'],
  createResource: () => createDynamoDBTable('ProvisionedTable', {
    TableName: 'test-table',
    BillingMode: 'PROVISIONED',
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  }),
  expectedMetrics: [
    'ConsumedReadCapacityUnits',
    'ConsumedWriteCapacityUnits',
    'ReadThrottles',
    'WriteThrottles',
    'UserErrors',
    'SystemErrors',
    'MaxProvisionedTableReadCapacityUtilization'
  ],
  thresholdTests: [
    { metricName: 'ConsumedReadCapacityUnits', warning: 64, critical: 80 }
  ],
  expectedMetricCount: 18
});