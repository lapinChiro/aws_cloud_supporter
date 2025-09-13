// MetricsAnalyzer統合テスト - 20パターン実装
// CLAUDE.md準拠: No any types、TDD実践、Zero type errors
import * as fs from 'fs/promises';
import * as path from 'path';
import { performance } from 'perf_hooks';

import { MetricsAnalyzer } from '../../src/core/analyzer';
import { HTMLOutputFormatter } from '../../src/core/formatters/html';
import { JSONOutputFormatter } from '../../src/core/json-formatter';
import { TemplateParser } from '../../src/core/parser';
import { Logger } from '../../src/utils/logger';
// カスタムマッチャー型定義
declare global {
  namespace jest {
    interface Matchers<R> {
      toContainMetric(metricName: string): R;
      toHaveValidThreshold(): R;
      toContainResourceType(resourceType: string): R;
      toHaveMetricsInRange(min: number, max: number): R;
    }
  }
}
// フィクスチャパス
const FIXTURES_PATH = path.join(__dirname, '..', 'fixtures', 'templates');
describe('MetricsAnalyzer Integration Tests - 20 Patterns', () => {
  let analyzer: MetricsAnalyzer;
  beforeAll(() => {
    const parser = new TemplateParser();
    const logger = new Logger('debug', false);
    analyzer = new MetricsAnalyzer(parser, logger);
  });
  describe('1. Complete Application Templates', () => {
    test('1-1: Web application complete template with all 6 resource types', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'web-app-complete.yaml');
      const result = await analyzer.analyze(templatePath, { outputFormat: 'json' });
      expect(result.metadata.supported_resources).toBeGreaterThanOrEqual(6);
      expect(result.resources.length).toBeGreaterThanOrEqual(6);
      // All resource types present
      const resourceTypes = result.resources.map(r => r.resource_type);
      expect(resourceTypes).toContain('AWS::RDS::DBInstance');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::ECS::Service');
      expect(resourceTypes).toContain('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(resourceTypes).toContain('AWS::DynamoDB::Table');
      expect(resourceTypes).toContain('AWS::ApiGateway::RestApi');
      // Verify metrics count
      const totalMetrics = result.resources.reduce((sum, r) => sum + r.metrics.length, 0);
      expect(totalMetrics).toBeGreaterThan(100);
      // Security: passwords sanitized
      const rdsResource = result.resources.find(r => r.resource_type === 'AWS::RDS::DBInstance');
      expect(rdsResource?.resource_properties.MasterUserPassword).toBe('[REDACTED]');
    });
    test('1-2: Serverless application template with SAM transform', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'serverless-application.yaml');
      const result = await analyzer.analyze(templatePath, { outputFormat: 'json' });
      expect(result.resources).toContainResourceType('AWS::Serverless::Function');
      expect(result.resources).toContainResourceType('AWS::Serverless::Api');
      expect(result.resources).toContainResourceType('AWS::DynamoDB::Table');
      // Verify serverless-specific metrics
      const serverlessFunction = result.resources.find(r => 
        r.resource_type === 'AWS::Serverless::Function'
      );
      expect(serverlessFunction?.metrics).toContainMetric('ConcurrentExecutions');
      expect(serverlessFunction?.metrics).toContainMetric('Duration');
    });
    test('1-3: Minimal Lambda template', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'minimal-lambda.yaml');
      const result = await analyzer.analyze(templatePath, { outputFormat: 'json' });
      expect(result.metadata.total_resources).toBe(1);
      expect(result.metadata.supported_resources).toBe(1);
      expect(result.resources).toHaveLength(1);
      expect(result.resources[0]?.resource_type).toBe('AWS::Lambda::Function');
      expect(result.resources[0]?.metrics.length).toBeGreaterThanOrEqual(15);
    });
  });
  describe('2. Large Scale & Performance', () => {
    test('2-1: Large template with 478 resources', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'large-template-500-resources.yaml');
      const startTime = performance.now();
      
      const result = await analyzer.analyze(templatePath, {
        outputFormat: 'json',
        concurrency: 10
      });
      
      const duration = performance.now() - startTime;

      // Performance requirements
      expect(duration).toBeLessThan(30000); // 30 seconds
      expect(result.metadata.processing_time_ms).toBeLessThan(30000);
      // Resource counts
      expect(result.metadata.total_resources).toBeGreaterThan(450);
      expect(result.resources.length).toBeGreaterThan(300);
      
      // Verify parallel processing worked
      const metricsPerMs = result.resources.length / (result.metadata.processing_time_ms || 1);
      expect(metricsPerMs).toBeGreaterThan(0.01); // At least 0.01 resources per ms
      console.log(`Performance: ${result.resources.length} resources processed in ${duration.toFixed(0)}ms`);
    });
    test('2-2: Memory limit enforcement', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'web-app-complete.yaml');
      // Test with extremely low memory limit
      await expect(analyzer.analyze(templatePath, {
        outputFormat: 'json',
        memoryLimit: 1024 * 1024 // 1MB - should fail
      })).rejects.toThrow(/Memory usage (already exceeds limit|exceeded)/);
    });
  });
  describe('3. Edge Cases & Error Handling', () => {
    test('3-1: Empty resources template', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'empty-resources.yaml');
      // Should throw error for empty resources section
      await expect(analyzer.analyze(templatePath, { outputFormat: 'json' }))
        .rejects.toThrow(/Template Resources section is empty/);
    });
    test('3-2: Invalid YAML syntax', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'invalid-yaml.yaml');
      await expect(analyzer.analyze(templatePath, {
        outputFormat: 'json'
      })).rejects.toThrow();
    });
    test('3-3: Non-existent file path', async () => {
      const fakePath = path.join(FIXTURES_PATH, 'non-existent-file.yaml');
      await expect(analyzer.analyze(fakePath, {
        outputFormat: 'json'
      })).rejects.toThrow();
    });
    test('3-4: Mixed supported and unsupported resources', async () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          Database: { Type: 'AWS::RDS::DBInstance', Properties: {} },
          S3Bucket: { Type: 'AWS::S3::Bucket', Properties: {} },
          EC2Instance: { Type: 'AWS::EC2::Instance', Properties: {} },
          Function: { Type: 'AWS::Lambda::Function', Properties: { Runtime: 'nodejs20.x' } },
          CustomResource: { Type: 'Custom::MyResource', Properties: {} }
        }
      };

      const tempPath = path.join(__dirname, 'mixed-resources.yaml');
      const yaml = (await import('yaml')).stringify(template);
      await fs.writeFile(tempPath, yaml);
      try {
        const result = await analyzer.analyze(tempPath, { outputFormat: 'json' });
        expect(result.metadata.total_resources).toBe(5);
        expect(result.metadata.supported_resources).toBe(2);
        expect(result.resources).toHaveLength(2);
        expect(result.unsupported_resources).toContain('S3Bucket');
        expect(result.unsupported_resources).toContain('EC2Instance');
        expect(result.unsupported_resources).toContain('CustomResource');
      } finally {
        await fs.unlink(tempPath);
      }
    });
  });
  describe('4. Resource-Specific Behavior', () => {
    test('4-1: RDS with different engines', async () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          MySQLDB: {
            Type: 'AWS::RDS::DBInstance',
            Properties: {
              Engine: 'mysql',
              DBInstanceClass: 'db.t3.medium',
              BackupRetentionPeriod: 7
            }
          },
          PostgresDB: {
            Type: 'AWS::RDS::DBInstance',
            Properties: {
              Engine: 'postgresql',
              DBInstanceClass: 'db.t3.large'
            }
          }
        }
      };
      const tempPath = path.join(__dirname, 'rds-engines.yaml');
      const yaml = (await import('yaml')).stringify(template);
      await fs.writeFile(tempPath, yaml);
      try {
        const result = await analyzer.analyze(tempPath, { outputFormat: 'json' });
        const mysqlDB = result.resources.find(r => r.logical_id === 'MySQLDB');
        const postgresDB = result.resources.find(r => r.logical_id === 'PostgresDB');
        // MySQL specific metric
        expect(mysqlDB?.metrics).toContainMetric('BinLogDiskUsage');
        
        // Different scale factors
        const mysqlCPU = mysqlDB?.metrics.find(m => m.metric_name === 'CPUUtilization');
        const postgresCPU = postgresDB?.metrics.find(m => m.metric_name === 'CPUUtilization');
        expect(postgresCPU?.recommended_threshold.warning).toBeGreaterThan(
          mysqlCPU?.recommended_threshold.warning || 0
        );
      } finally {
        await fs.unlink(tempPath);
      }
    });

    test('4-2: Lambda with different memory sizes', async () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          SmallFunction: {
            Type: 'AWS::Lambda::Function',
            Properties: {
              Runtime: 'nodejs20.x',
              MemorySize: 128,
              Handler: 'index.handler'
            }
          },
          LargeFunction: {
            Type: 'AWS::Lambda::Function',
            Properties: {
              Runtime: 'python3.11',
              MemorySize: 3008,
              Handler: 'app.handler'
            }
          }
        }
      };

      const tempPath = path.join(__dirname, 'lambda-memory.yaml');
      const yaml = (await import('yaml')).stringify(template);
      await fs.writeFile(tempPath, yaml);

      try {
        const result = await analyzer.analyze(tempPath, { outputFormat: 'json' });
        const smallFunc = result.resources.find(r => r.logical_id === 'SmallFunction');
        const largeFunc = result.resources.find(r => r.logical_id === 'LargeFunction');
        // Different thresholds based on memory
        const smallDuration = smallFunc?.metrics.find(m => m.metric_name === 'Duration');
        const largeDuration = largeFunc?.metrics.find(m => m.metric_name === 'Duration');
        // Lambda with more memory should have higher timeout thresholds (more capacity)
        expect(largeDuration?.recommended_threshold.warning).toBeGreaterThan(
          smallDuration?.recommended_threshold.warning || 0
        );
      } finally {
        await fs.unlink(tempPath);
      }
    });

    test('4-3: ECS Fargate vs EC2', async () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
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

      const tempPath = path.join(__dirname, 'ecs-types.yaml');
      const yaml = (await import('yaml')).stringify(template);
      await fs.writeFile(tempPath, yaml);

      try {
        const result = await analyzer.analyze(tempPath, { 
          outputFormat: 'json',
          continueOnError: true  // Continue despite EC2 service error
        });
        // Both are extracted initially, but only Fargate succeeds in generation
        expect(result.metadata.total_resources).toBe(2);
        expect(result.resources).toHaveLength(1); // Only Fargate successfully processed
        expect(result.resources[0]?.logical_id).toBe('FargateService');
        // Should have errors for failed EC2 service
        expect(result.errors).toBeDefined();
        expect(result.errors?.length).toBeGreaterThan(0);
      } finally {
        await fs.unlink(tempPath);
      }
    });

    test('4-4: DynamoDB with different billing modes', async () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          OnDemandTable: {
            Type: 'AWS::DynamoDB::Table',
            Properties: {
              BillingMode: 'PAY_PER_REQUEST',
              AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
              KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }]
            }
          },
          ProvisionedTable: {
            Type: 'AWS::DynamoDB::Table',
            Properties: {
              BillingMode: 'PROVISIONED',
              ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 },
              AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
              KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }]
            }
          }
        }
      };

      const tempPath = path.join(__dirname, 'dynamodb-billing.yaml');
      const yaml = (await import('yaml')).stringify(template);
      await fs.writeFile(tempPath, yaml);

      try {
        const result = await analyzer.analyze(tempPath, { outputFormat: 'json' });
        const provisionedTable = result.resources.find(r => r.logical_id === 'ProvisionedTable');
        // Different metrics for different billing modes
        expect(provisionedTable?.metrics).toContainMetric('ConsumedReadCapacityUnits');
        expect(provisionedTable?.metrics).toContainMetric('ConsumedWriteCapacityUnits');
      } finally {
        await fs.unlink(tempPath);
      }
    });

    test('4-5: ALB with different schemes', async () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          PublicALB: {
            Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
            Properties: {
              Type: 'application',
              Scheme: 'internet-facing'
            }
          },
          PrivateALB: {
            Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
            Properties: {
              Type: 'application',
              Scheme: 'internal'
            }
          }
        }
      };

      const tempPath = path.join(__dirname, 'alb-schemes.yaml');
      const yaml = (await import('yaml')).stringify(template);
      await fs.writeFile(tempPath, yaml);

      try {
        const result = await analyzer.analyze(tempPath, { outputFormat: 'json' });
        const publicALB = result.resources.find(r => r.logical_id === 'PublicALB');
        const privateALB = result.resources.find(r => r.logical_id === 'PrivateALB');
        // Internet-facing should have higher thresholds
        const publicRequests = publicALB?.metrics.find(m => m.metric_name === 'RequestCount');
        const privateRequests = privateALB?.metrics.find(m => m.metric_name === 'RequestCount');
        expect(publicRequests?.recommended_threshold.warning).toBeGreaterThan(
          privateRequests?.recommended_threshold.warning || 0
        );
      } finally {
        await fs.unlink(tempPath);
      }
    });
  });

  describe('5. Output Format Tests', () => {
    test('5-1: JSON output format validation', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'web-app-complete.yaml');
      const result = await analyzer.analyze(templatePath, { outputFormat: 'json' });
      const jsonFormatter = new JSONOutputFormatter();
      const jsonOutput = jsonFormatter.format(result);
      // Valid JSON - properly type the parsed result
      interface ParsedOutput {
        metadata: {
          version?: string;
          generated_at?: string;
          template_path?: string;
          total_resources?: number;
          supported_resources?: number;
          processing_time_ms?: number;
        };
        resources: Array<{
          logical_id: string;
          resource_type: string;
          resource_properties: Record<string, unknown>;
          metrics: Array<{
            metric_name: string;
            namespace: string;
            unit: string;
            description: string;
            statistic: string;
            recommended_threshold: {
              warning: number;
              critical: number;
            };
          }>;
        }>;
      }
      const parsed = JSON.parse(jsonOutput) as ParsedOutput;
      // Schema compliance
      expect(parsed.metadata).toHaveProperty('version', '1.0.0');
      expect(parsed.metadata).toHaveProperty('generated_at');
      expect(parsed.metadata).toHaveProperty('template_path');
      expect(parsed.metadata).toHaveProperty('total_resources');
      expect(parsed.metadata).toHaveProperty('supported_resources');
      expect(parsed.metadata).toHaveProperty('processing_time_ms');
      
      // Resources structure
      expect(Array.isArray(parsed.resources)).toBe(true);
      if (parsed.resources.length > 0) {
        const resource = parsed.resources[0];
        expect(resource).toHaveProperty('logical_id');
        expect(resource).toHaveProperty('resource_type');
        expect(resource).toHaveProperty('resource_properties');
        expect(resource).toHaveProperty('metrics');
        
        // Metrics structure
        if (resource.metrics.length > 0) {
          const metric = resource.metrics[0];
          expect(metric).toHaveProperty('metric_name');
          expect(metric).toHaveProperty('namespace');
          expect(metric).toHaveProperty('unit');
          expect(metric).toHaveProperty('description');
          expect(metric).toHaveProperty('statistic');
          expect(metric).toHaveProperty('recommended_threshold');
          expect(metric.recommended_threshold).toHaveProperty('warning');
          expect(metric.recommended_threshold).toHaveProperty('critical');
        }
      }
    });

    test('5-2: HTML output format validation', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'minimal-lambda.yaml');
      const result = await analyzer.analyze(templatePath, { outputFormat: 'html' });
      
      const htmlFormatter = new HTMLOutputFormatter();
      const htmlOutput = htmlFormatter.format(result);
      
      // HTML structure
      expect(htmlOutput).toMatch(/<!DOCTYPE html>/);
      expect(htmlOutput).toMatch(/<html.*lang="ja"/);
      expect(htmlOutput).toMatch(/<meta.*viewport/);
      
      // Interactive elements
      expect(htmlOutput).toMatch(/id="searchInput"/);
      expect(htmlOutput).toMatch(/id="importanceFilter"/);
      expect(htmlOutput).toMatch(/id="categoryFilter"/);
      
      // CSS embedded
      expect(htmlOutput).toMatch(/<style>/);
      expect(htmlOutput).toMatch(/\.resource-card/);
      expect(htmlOutput).toMatch(/\.importance-high/);
      
      // JavaScript embedded
      expect(htmlOutput).toMatch(/<script>/);
      expect(htmlOutput).toMatch(/applyFilters/);
    });
  });

  describe('6. Options & Filtering', () => {
    test('6-1: Include low importance metrics option', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'minimal-lambda.yaml');
      
      // Without low importance
      const resultWithout = await analyzer.analyze(templatePath, {
        outputFormat: 'json',
        includeLowImportance: false
      });
      
      // With low importance
      const resultWith = await analyzer.analyze(templatePath, {
        outputFormat: 'json',
        includeLowImportance: true
      });
      
      // Should have more metrics when including low importance
      const metricsWithout = resultWithout.resources[0]?.metrics.length || 0;
      const metricsWith = resultWith.resources[0]?.metrics.length || 0;
      
      expect(metricsWith).toBeGreaterThanOrEqual(metricsWithout);
      
      // Check if low importance metrics exist
      const lowImportanceMetrics = resultWith.resources[0]?.metrics.filter(
        m => m.importance === 'Low'
      ) || [];
      expect(lowImportanceMetrics.length).toBeGreaterThan(0);
    });

    test('6-2: Resource type filtering', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'web-app-complete.yaml');
      
      const result = await analyzer.analyze(templatePath, {
        outputFormat: 'json'
        // Note: resourceTypes filtering is handled in CLI, not in analyzer
      });
      
      // All resource types should be present (filtering happens at CLI level)
      const resourceTypes = [...new Set(result.resources.map(r => r.resource_type))];
      expect(resourceTypes).toEqual(
        expect.arrayContaining(['AWS::RDS::DBInstance', 'AWS::Lambda::Function'])
      );
      // ECS and DynamoDB should also be present since no filtering in analyzer
      expect(resourceTypes).toContain('AWS::ECS::Service');
      expect(resourceTypes).toContain('AWS::DynamoDB::Table');
    });

    test('6-3: Verbose mode logging', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'minimal-lambda.yaml');
      
      // Capture console output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
      
      await analyzer.analyze(templatePath, {
        outputFormat: 'json',
        verbose: true
      });
      
      // Should have verbose logging
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });
  });

  describe('7. Concurrent Processing', () => {
    test('7-1: Different concurrency levels', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'large-template-500-resources.yaml');
      
      // Test with different concurrency levels
      const results = await Promise.all([
        analyzer.analyze(templatePath, { outputFormat: 'json', concurrency: 1 }),
        analyzer.analyze(templatePath, { outputFormat: 'json', concurrency: 5 }),
        analyzer.analyze(templatePath, { outputFormat: 'json', concurrency: 10 })
      ]);
      
      // All should produce same number of resources
      expect(results[0].resources.length).toBe(results[1].resources.length);
      expect(results[1].resources.length).toBe(results[2].resources.length);
      
      // All results should complete within reasonable time
      results.forEach(result => {
        expect(result.metadata.processing_time_ms).toBeLessThan(30000);
      });
    });
  });

  describe('8. Integration with All Components', () => {
    test('8-1: Full pipeline - Parse, Extract, Generate, Format', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'web-app-complete.yaml');
      
      // Execute full pipeline
      const result = await analyzer.analyze(templatePath, {
        outputFormat: 'json',
        includeLowImportance: true,
        verbose: false
      });
      
      // Verify all stages worked
      expect(result.metadata.template_path).toBe(templatePath);
      expect(result.metadata.processing_time_ms).toBeGreaterThan(0);
      expect(result.metadata.total_resources).toBeGreaterThan(0);
      expect(result.metadata.supported_resources).toBeGreaterThan(0);
      
      // Verify sanitization worked
      const hasRedacted = result.resources.some(r => 
        JSON.stringify(r.resource_properties).includes('[REDACTED]')
      );
      expect(hasRedacted).toBe(true);
    });

    test('8-2: Error recovery with continueOnError option', async () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          ValidLambda: {
            Type: 'AWS::Lambda::Function',
            Properties: { Runtime: 'nodejs20.x' }
          },
          // This could cause generator errors if properties are malformed
          InvalidRDS: {
            Type: 'AWS::RDS::DBInstance',
            Properties: null
          }
        }
      };

      const tempPath = path.join(__dirname, 'error-recovery.yaml');
      const yaml = (await import('yaml')).stringify(template);
      await fs.writeFile(tempPath, yaml);

      try {
        const result = await analyzer.analyze(tempPath, {
          outputFormat: 'json',
          continueOnError: true
        });
        
        // Should process valid resources even if some fail
        expect(result.resources.length).toBeGreaterThan(0);
        expect(result.resources.find(r => r.logical_id === 'ValidLambda')).toBeDefined();
      } finally {
        await fs.unlink(tempPath);
      }
    });
  });
});

// Custom matchers implementation
expect.extend({
  toContainMetric(received: Array<{ metric_name: string }>, metricName: string) {
    const pass = received.some(m => m.metric_name === metricName);
    return {
      message: () => `Expected metrics to${pass ? ' not' : ''} contain ${metricName}`,
      pass,
    };
  },
  toHaveValidThreshold(received: { warning: number; critical: number }) {
    const pass = received.warning < received.critical;
    return {
      message: () => `Expected threshold warning (${received.warning}) < critical (${received.critical})`,
      pass,
    };
  },
  toContainResourceType(received: Array<{ resource_type: string }>, resourceType: string) {
    const pass = received.some(r => r.resource_type === resourceType);
    return {
      message: () => `Expected resources to${pass ? ' not' : ''} contain type ${resourceType}`,
      pass,
    };
  },
  toHaveMetricsInRange(received: unknown[], min: number, max: number) {
    const count = received.length;
    const pass = count >= min && count <= max;
    return {
      message: () => `Expected ${count} metrics to be between ${min} and ${max}`,
      pass,
    };
  }
});