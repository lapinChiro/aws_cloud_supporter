// MetricsAnalyzer Integration Tests - Resource-Specific Behavior
// CLAUDE.md準拠: No any types、TDD実践、Zero type errors
import { MetricsAnalyzer } from '../../src/core/analyzer';
import { TemplateParser } from '../../src/core/parser';
import type { CloudFormationTemplate } from '../../src/types/cloudformation';
import type { AnalysisResult } from '../../src/types/metrics';
import { Logger } from '../../src/utils/logger';

import { 
  withTempTemplate,
  createRDSTemplate,
  createLambdaTemplate,
  createDynamoDBTemplate,
  createALBTemplate
} from './metrics-analyzer.integration.test-helpers';

describe('MetricsAnalyzer Integration Tests - Resource-Specific Behavior', () => {
  let analyzer: MetricsAnalyzer;
  
  beforeAll(() => {
    const parser = new TemplateParser();
    const logger = new Logger('debug', false);
    analyzer = new MetricsAnalyzer(parser, logger);
  });

  describe('4. Resource-Specific Behavior', () => {
    test('4-1: RDS with different engines', async () => {
      const template = createRDSTemplate({
        MySQLDB: {
          Engine: 'mysql',
          DBInstanceClass: 'db.t3.medium',
          BackupRetentionPeriod: 7
        },
        PostgresDB: {
          Engine: 'postgresql',
          DBInstanceClass: 'db.t3.large'
        }
      });
      
      await withTempTemplate(template, 'rds-engines.yaml', async (tempPath) => {
        const result = await analyzer.analyze(tempPath, { outputFormat: 'json' });
        const mysqlDB = result.resources.find(r => r.logical_id === 'MySQLDB');
        const postgresDB = result.resources.find(r => r.logical_id === 'PostgresDB');
        // MySQL specific metric
        expect(mysqlDB?.metrics).toContainMetric('BinLogDiskUsage');
        
        // Different scale factors
        const mysqlCPU = mysqlDB?.metrics.find(m => m.metric_name === 'CPUUtilization');
        const postgresCPU = postgresDB?.metrics.find(m => m.metric_name === 'CPUUtilization');
        expect(postgresCPU?.recommended_threshold.warning).toBeGreaterThan(
          mysqlCPU?.recommended_threshold.warning ?? 0
        );
      });
    });

    test('4-2: Lambda with different memory sizes', async () => {
      const template = createLambdaTemplate({
        SmallFunction: {
          Runtime: 'nodejs20.x',
          MemorySize: 128,
          Handler: 'index.handler'
        },
        LargeFunction: {
          Runtime: 'python3.11',
          MemorySize: 3008,
          Handler: 'app.handler'
        }
      });

      await withTempTemplate(template, 'lambda-memory.yaml', async (tempPath) => {
        const result = await analyzer.analyze(tempPath, { outputFormat: 'json' });
        const smallFunc = result.resources.find(r => r.logical_id === 'SmallFunction');
        const largeFunc = result.resources.find(r => r.logical_id === 'LargeFunction');
        // Different thresholds based on memory
        const smallDuration = smallFunc?.metrics.find(m => m.metric_name === 'Duration');
        const largeDuration = largeFunc?.metrics.find(m => m.metric_name === 'Duration');
        // Lambda with more memory should have higher timeout thresholds (more capacity)
        expect(largeDuration?.recommended_threshold.warning).toBeGreaterThan(
          smallDuration?.recommended_threshold.warning ?? 0
        );
      });
    });

    test('4-3: ECS Fargate vs EC2', async () => {
      const template: CloudFormationTemplate = {
        AWSTemplateFormatVersion: '2010-09-09' as const,
        Resources: {
          FargateService: {
            Type: 'AWS::ECS::Service',
            Properties: {
              LaunchType: 'FARGATE',
              DesiredCount: 3
            }
          },
          EC2Service: {
            Type: 'AWS::ECS::Service',
            Properties: {
              LaunchType: 'EC2',
              DesiredCount: 3
            }
          }
        }
      };

      await withTempTemplate(template, 'ecs-types.yaml', async (tempPath) => {
        const result = await analyzer.analyze(tempPath, { 
          outputFormat: 'json',
          continueOnError: true  // Continue despite EC2 service error
        }) as AnalysisResult & { errors?: unknown[] };
        // Both are extracted initially, but only Fargate succeeds in generation
        expect(result.metadata.total_resources).toBe(2);
        expect(result.resources).toHaveLength(1); // Only Fargate successfully processed
        expect(result.resources[0]?.logical_id).toBe('FargateService');
        // Should have errors for failed EC2 service
        expect(result.errors).toBeDefined();
        expect(result.errors?.length).toBeGreaterThan(0);
      });
    });

    test('4-4: DynamoDB with different billing modes', async () => {
      const template = createDynamoDBTemplate({
        OnDemandTable: {
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
          KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }]
        },
        ProvisionedTable: {
          BillingMode: 'PROVISIONED',
          ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 },
          AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
          KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }]
        }
      });

      await withTempTemplate(template, 'dynamodb-billing.yaml', async (tempPath) => {
        const result = await analyzer.analyze(tempPath, { outputFormat: 'json' });
        const provisionedTable = result.resources.find(r => r.logical_id === 'ProvisionedTable');
        // Different metrics for different billing modes
        expect(provisionedTable?.metrics).toContainMetric('ConsumedReadCapacityUnits');
        expect(provisionedTable?.metrics).toContainMetric('ConsumedWriteCapacityUnits');
      });
    });

    test('4-5: ALB with different schemes', async () => {
      const template = createALBTemplate(true, true);
      await withTempTemplate(template, 'alb-schemes.yaml', async (tempPath) => {
        const result = await analyzer.analyze(tempPath, { outputFormat: 'json' });
        const publicALB = result.resources.find((r) => r.logical_id === 'PublicALB');
        const privateALB = result.resources.find((r) => r.logical_id === 'PrivateALB');
        const publicRequests = publicALB?.metrics.find((m) => m.metric_name === 'RequestCount');
        const privateRequests = privateALB?.metrics.find((m) => m.metric_name === 'RequestCount');
        expect(publicRequests?.recommended_threshold.warning).toBeGreaterThan(
          privateRequests?.recommended_threshold.warning ?? 0
        );
      });
    });
  });
});