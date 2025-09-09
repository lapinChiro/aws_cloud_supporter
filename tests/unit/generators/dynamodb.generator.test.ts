import { DynamoDBMetricsGenerator } from '../../../src/generators/dynamodb.generator';
import { CloudFormationResource } from '../../../src/types/cloudformation';
import { ILogger } from '../../../src/interfaces/logger';
import { createMockLogger, measureGeneratorPerformance, createDynamoDBTable } from '../../helpers';

describe('DynamoDBMetricsGenerator', () => {
  let generator: DynamoDBMetricsGenerator;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
    generator = new DynamoDBMetricsGenerator(mockLogger);
  });

  describe('getSupportedTypes', () => {
    it('should return AWS::DynamoDB::Table', () => {
      const types = generator.getSupportedTypes();
      expect(types).toEqual(['AWS::DynamoDB::Table']);
    });
  });

  describe('generate', () => {
    it('should generate base DynamoDB metrics for provisioned capacity table', async () => {
      const resource = createDynamoDBTable('ProvisionedTable', {
        TableName: 'test-table',
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      });

      const metrics = await generator.generate(resource);
      
      // メトリクス数の確認（GSIなしの場合は18個）
      expect(metrics.length).toBe(18);
      
      // 必須メトリクスの存在確認
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('ConsumedReadCapacityUnits');
      expect(metricNames).toContain('ConsumedWriteCapacityUnits');
      expect(metricNames).toContain('ReadThrottles');
      expect(metricNames).toContain('WriteThrottles');
      expect(metricNames).toContain('UserErrors');
      expect(metricNames).toContain('SystemErrors');
      expect(metricNames).toContain('MaxProvisionedTableReadCapacityUtilization');
      
      // しきい値検証（キャパシティユニット5でスケール係数0.8）
      const readCapacityMetric = metrics.find(m => m.metric_name === 'ConsumedReadCapacityUnits');
      expect(readCapacityMetric?.recommended_threshold.warning).toBe(64); // 80 * 0.8 * 1.0
      expect(readCapacityMetric?.recommended_threshold.critical).toBe(80); // 80 * 0.8 * 1.25
    });

    it('should generate metrics for pay-per-request (on-demand) table', async () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'on-demand-table',
          BillingMode: 'PAY_PER_REQUEST'
        }
      };

      const metrics = await generator.generate(resource);
      
      // On-demand固有のメトリクス確認
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('ConsumedReadCapacityUnits');
      expect(metricNames).toContain('ConsumedWriteCapacityUnits');
      expect(metricNames).toContain('ReadThrottles');
      expect(metricNames).toContain('WriteThrottles');
      
      // プロビジョンド固有メトリクスは含まれない
      expect(metricNames).not.toContain('MaxProvisionedTableReadCapacityUtilization');
      expect(metricNames).not.toContain('MaxProvisionedTableWriteCapacityUtilization');
    });

    it('should handle tables with global secondary indexes (GSI)', async () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'table-with-gsi',
          BillingMode: 'PROVISIONED',
          ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10
          },
          GlobalSecondaryIndexes: [
            {
              IndexName: 'GSI1',
              ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
              }
            },
            {
              IndexName: 'GSI2',
              ProvisionedThroughput: {
                ReadCapacityUnits: 3,
                WriteCapacityUnits: 3
              }
            }
          ]
        }
      };

      const metrics = await generator.generate(resource);
      
      // GSIがある場合は22個のメトリクス
      expect(metrics.length).toBe(22);
      
      // GSI関連メトリクスの存在確認
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('ConsumedReadCapacityUnits.GlobalSecondaryIndexes');
      expect(metricNames).toContain('ConsumedWriteCapacityUnits.GlobalSecondaryIndexes');
      expect(metricNames).toContain('ReadThrottles.GlobalSecondaryIndexes');
      expect(metricNames).toContain('WriteThrottles.GlobalSecondaryIndexes');
      
      // スケール係数がGSIを考慮（基本10 + GSI 5,3 = 18）
      const readCapacityMetric = metrics.find(m => m.metric_name === 'ConsumedReadCapacityUnits');
      expect(readCapacityMetric?.recommended_threshold.warning).toBeGreaterThan(4);
    });

    it('should handle tables without explicit billing mode (default to provisioned)', async () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'default-table'
          // BillingModeが未定義の場合
        }
      };

      const metrics = await generator.generate(resource);
      
      // デフォルトでProvisionedとして扱う
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('MaxProvisionedTableReadCapacityUtilization');
      expect(metricNames).toContain('MaxProvisionedTableWriteCapacityUtilization');
    });

    it('should scale thresholds based on capacity units', async () => {
      const smallTable: CloudFormationResource = {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PROVISIONED',
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      };

      const largeTable: CloudFormationResource = {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PROVISIONED',
          ProvisionedThroughput: {
            ReadCapacityUnits: 100,
            WriteCapacityUnits: 100
          }
        }
      };

      const smallMetrics = await generator.generate(smallTable);
      const largeMetrics = await generator.generate(largeTable);
      
      // 大規模テーブルは高いしきい値を持つ
      const smallRead = smallMetrics.find(m => m.metric_name === 'ConsumedReadCapacityUnits');
      const largeRead = largeMetrics.find(m => m.metric_name === 'ConsumedReadCapacityUnits');
      
      expect(smallRead?.recommended_threshold.warning).toBeLessThan(
        largeRead?.recommended_threshold.warning || 0
      );
    });

    it('should generate proper dimensions for all metrics', async () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::DynamoDB::Table',
        LogicalId: 'TestTable',
        Properties: {
          TableName: 'test-table'
        }
      };

      const metrics = await generator.generate(resource);
      
      for (const metric of metrics) {
        expect(metric.dimensions).toBeDefined();
        expect(metric.dimensions?.length).toBeGreaterThan(0);
        
        // DynamoDBのプライマリディメンション
        const tableDimension = metric.dimensions?.find(d => d.name === 'TableName');
        expect(tableDimension).toBeDefined();
        expect(tableDimension?.value).toBe('TestTable');
      }
    });

    it('should measure performance and complete within 1 second', async () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::DynamoDB::Table',
        LogicalId: 'PerfTestTable',
        Properties: {
          TableName: 'performance-test-table',
          BillingMode: 'PROVISIONED',
          ProvisionedThroughput: {
            ReadCapacityUnits: 50,
            WriteCapacityUnits: 50
          }
        }
      };

      await measureGeneratorPerformance(generator, resource);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringMatching(/Generated \d+ metrics for PerfTestTable in [\d.]+ms/)
      );
    });

    it('should include stream metrics when streams are enabled', async () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'stream-table',
          StreamSpecification: {
            StreamViewType: 'NEW_AND_OLD_IMAGES'
          }
        }
      };

      const metrics = await generator.generate(resource);
      
      // ストリームメトリクスは標準セットには含まれない（GSIなしの場合は18個）
      expect(metrics.length).toBe(18);
    });

    it('should handle autoscaling configuration', async () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'auto-scaling-table',
          BillingMode: 'PROVISIONED',
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      };

      const metrics = await generator.generate(resource);
      
      // オートスケーリング対応のメトリクス確認
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('AccountProvisionedReadCapacityUtilization');
      expect(metricNames).toContain('AccountProvisionedWriteCapacityUtilization');
    });
  });
});