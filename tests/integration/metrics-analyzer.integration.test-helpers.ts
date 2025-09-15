// MetricsAnalyzer統合テストヘルパー関数
// CLAUDE.md準拠: No any types、TDD実践

import * as fs from 'fs/promises';
import * as path from 'path';

import * as yaml from 'js-yaml';

import { MetricsAnalyzer } from '../../src/core/analyzer';
import { TemplateParser } from '../../src/core/parser';
import type { IOutputFormatter } from '../../src/interfaces/formatter';
import type { CloudFormationResource, CloudFormationTemplate } from '../../src/types/cloudformation';
import type { AnalysisResult } from '../../src/types/metrics';
import { Logger } from '../../src/utils/logger';

export function createTestAnalyzer(): MetricsAnalyzer {
  const parser = new TemplateParser();
  const logger = new Logger();
  
  return new MetricsAnalyzer(parser, logger);
}

export function createTestTemplate(): CloudFormationTemplate {
  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {
      Database: {
        Type: 'AWS::RDS::DBInstance',
        Properties: {
          DBInstanceClass: 'db.t3.medium',
          Engine: 'mysql',
          DBInstanceIdentifier: 'test-db',
          MasterUserPassword: 'secret123',  // サニタイズテスト用
          AllocatedStorage: '100'
        }
      },
      Function: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          Runtime: 'nodejs18.x',
          MemorySize: 512,
          FunctionName: 'test-function',
          Timeout: 300
        }
      },
      Service: {
        Type: 'AWS::ECS::Service',
        Properties: {
          LaunchType: 'FARGATE',
          DesiredCount: 2,
          Cpu: '1024',
          Memory: '2048'
        }
      },
      LoadBalancer: {
        Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
        Properties: {
          Type: 'application',
          Scheme: 'internet-facing',
          IpAddressType: 'ipv4'
        }
      },
      Table: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          TableName: 'test-table',
          GlobalSecondaryIndexes: [{
            IndexName: 'GSI1',
            PartitionKey: { AttributeName: 'gsi1pk', KeyType: 'HASH' },
            Projection: { ProjectionType: 'ALL' }
          }]
        }
      },
      Api: {
        Type: 'AWS::ApiGateway::RestApi',
        Properties: {
          Name: 'test-api',
          Description: 'Test API for integration tests'
        }
      }
    }
  };
}

export function assertResourceCount(result: AnalysisResult, expectedCount: number): void {
  expect(result.resources).toHaveLength(expectedCount);
}

export function assertMetricsGenerated(result: AnalysisResult): void {
  const hasMetrics = result.resources.some(resource => resource.metrics.length > 0);
  expect(hasMetrics).toBe(true);
}

export function assertMetadataPresent(result: AnalysisResult): void {
  expect(result.metadata).toBeDefined();
  expect(result.metadata.version).toBe('1.0.0');
  expect(result.metadata.generated_at).toBeDefined();
  expect(result.metadata.total_resources).toBeDefined();
  expect(result.metadata.supported_resources).toBeDefined();
  expect(result.metadata.processing_time_ms).toBeDefined();
}

export async function createTempTemplateFile(template: CloudFormationTemplate): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'temp-'));
  const templatePath = path.join(tempDir, 'test-template.yaml');
  
  // テンプレートをYAMLとして保存（ダミー実装）
  await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
  
  return templatePath;
}

export async function cleanupTempFiles(filePath: string): Promise<void> {
  try {
    const dir = path.dirname(filePath);
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // Cleanup failures are not critical
  }
}

// ParsedOutput type for format tests
export interface ParsedOutput {
  metadata: {
    version: string;
    generated_at: string;
    total_resources: number;
    supported_resources: number;
    processing_time_ms: number;
  };
  resources: Array<{
    logical_id: string;
    resource_type: string;
    physical_id?: string;
    metrics: Array<{
      metric_name: string;
      namespace: string;
      category: string;
      importance: 'high' | 'medium' | 'low';
      recommended_threshold: {
        warning: number;
        critical: number;
      };
      dimensions: Array<{
        name: string;
        value: string;
      }>;
      unit: string;
      description: string;
    }>;
  }>;
  unsupported_resources: Array<{
    logical_id: string;
    resource_type: string;
    reason: string;
  }>;
}

// Temporary template utility
export async function withTempTemplate<T>(
  template: CloudFormationTemplate,
  filename: string,
  callback: (tempPath: string) => Promise<T>
): Promise<T> {
  const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'temp-'));
  const templatePath = path.join(tempDir, filename);
  
  try {
    await fs.writeFile(templatePath, yaml.dump(template));
    return await callback(templatePath);
  } finally {
    await cleanupTempFiles(templatePath);
  }
}

// Error handling helper
export async function expectAnalysisError(
  analyzer: MetricsAnalyzer,
  templatePath: string,
  errorPattern: RegExp | string
): Promise<void> {
  await expect(
    analyzer.analyze(templatePath, { outputFormat: 'json' })
  ).rejects.toThrow(errorPattern);
}

// Template creators
export function createRDSTemplate(configs: Record<string, Record<string, unknown>>): CloudFormationTemplate {
  const resources: Record<string, CloudFormationResource> = {};
  
  Object.entries(configs).forEach(([logicalId, properties]) => {
    resources[logicalId] = {
      Type: 'AWS::RDS::DBInstance',
      Properties: {
        DBInstanceClass: 'db.t3.medium',
        Engine: 'mysql',
        ...properties
      }
    };
  });

  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: resources
  };
}

export function createLambdaTemplate(configs: Record<string, Record<string, unknown>>): CloudFormationTemplate {
  const resources: Record<string, CloudFormationResource> = {};
  
  Object.entries(configs).forEach(([logicalId, properties]) => {
    resources[logicalId] = {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Code: { ZipFile: 'exports.handler = async () => {}' },
        ...properties
      }
    };
  });

  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: resources
  };
}

export function createDynamoDBTemplate(configs: Record<string, Record<string, unknown>>): CloudFormationTemplate {
  const resources: Record<string, CloudFormationResource> = {};
  
  Object.entries(configs).forEach(([logicalId, properties]) => {
    resources[logicalId] = {
      Type: 'AWS::DynamoDB::Table',
      Properties: {
        TableName: `table-${logicalId.toLowerCase()}`,
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        ...properties
      }
    };
  });

  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: resources
  };
}

export function createALBTemplate(includePublic = true, includePrivate = true): CloudFormationTemplate {
  const resources: Record<string, CloudFormationResource> = {};
  
  if (includePublic) {
    resources.PublicALB = {
      Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
      Properties: {
        Type: 'application',
        Scheme: 'internet-facing',
        Name: 'public-alb'
      }
    };
  }
  
  if (includePrivate) {
    resources.PrivateALB = {
      Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
      Properties: {
        Type: 'application',
        Scheme: 'internal',
        Name: 'private-alb'
      }
    };
  }

  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: resources
  };
}

export function createMixedResourcesTemplate(): CloudFormationTemplate {
  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {
      SupportedLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          Runtime: 'nodejs20.x',
          Handler: 'index.handler',
          Code: { ZipFile: 'exports.handler = async () => {}' }
        }
      },
      SupportedRDS: {
        Type: 'AWS::RDS::DBInstance',
        Properties: {
          DBInstanceClass: 'db.t3.medium',
          Engine: 'mysql'
        }
      },
      UnsupportedEC2: {
        Type: 'AWS::EC2::Instance',
        Properties: {
          ImageId: 'ami-12345',
          InstanceType: 't2.micro'
        }
      },
      UnsupportedS3: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: 'test-bucket'
        }
      }
    }
  };
}

// Assertion helpers
export function assertMixedResources(result: AnalysisResult): void {
  expect(result.metadata.total_resources).toBe(4);
  expect(result.metadata.supported_resources).toBe(2);
  expect(result.resources).toHaveLength(2);
  expect(result.unsupported_resources).toHaveLength(2);
  
  const supportedTypes = result.resources.map(r => r.resource_type);
  expect(supportedTypes).toContain('AWS::Lambda::Function');
  expect(supportedTypes).toContain('AWS::RDS::DBInstance');
  
  const unsupportedTypes = result.unsupported_resources;
  expect(unsupportedTypes).toContain('UnsupportedEC2');
  expect(unsupportedTypes).toContain('UnsupportedS3');
}

export async function assertOutputFormat(
  analyzer: MetricsAnalyzer,
  templateName: string,
  format: 'json' | 'html',
  formatter: IOutputFormatter,
  additionalChecks?: (output: string) => void
): Promise<void> {
  const templatePath = path.join(__dirname, '..', 'fixtures', 'templates', templateName);
  const result = await analyzer.analyze(templatePath, { outputFormat: format });
  const output = await formatter.format(result);
  
  expect(output).toBeDefined();
  expect(typeof output).toBe('string');
  expect(output.length).toBeGreaterThan(0);
  
  if (additionalChecks) {
    additionalChecks(output);
  }
}

export function assertJSONSchemaCompliance(parsed: ParsedOutput): void {
  expect(parsed).toHaveProperty('metadata');
  expect(parsed).toHaveProperty('resources');
  expect(parsed).toHaveProperty('unsupported_resources');
  
  expect(parsed.metadata).toHaveProperty('version');
  expect(parsed.metadata).toHaveProperty('generated_at');
  expect(parsed.metadata).toHaveProperty('total_resources');
  expect(parsed.metadata).toHaveProperty('supported_resources');
  expect(parsed.metadata).toHaveProperty('processing_time_ms');
  
  expect(Array.isArray(parsed.resources)).toBe(true);
  expect(Array.isArray(parsed.unsupported_resources)).toBe(true);
  
  if (parsed.resources.length > 0) {
    const resource = parsed.resources[0];
    expect(resource).toHaveProperty('logical_id');
    expect(resource).toHaveProperty('resource_type');
    expect(resource).toHaveProperty('metrics');
    expect(Array.isArray(resource?.metrics)).toBe(true);
  }
}

export function assertHTMLOutputFormat(output: string): void {
  expect(output).toMatch(/<!DOCTYPE html>/);
  expect(output).toMatch(/<html[^>]*>/);
  expect(output).toMatch(/<head>/);
  expect(output).toMatch(/<title>.*CloudWatch Metrics Report.*<\/title>/);
  expect(output).toMatch(/<body>/);
  expect(output).toMatch(/<\/html>/);
}

export async function assertLowImportanceMetrics(
  analyzer: MetricsAnalyzer,
  templateName: string
): Promise<void> {
  const templatePath = path.join(__dirname, '..', 'fixtures', 'templates', templateName);
  
  const withoutLowImportance = await analyzer.analyze(templatePath, { 
    outputFormat: 'json',
    includeLowImportance: false 
  });
  
  const withLowImportance = await analyzer.analyze(templatePath, { 
    outputFormat: 'json',
    includeLowImportance: true 
  });
  
  const lowImportanceCount = (result: AnalysisResult): number => 
    result.resources.reduce((count, resource) => 
      count + resource.metrics.filter(m => m.importance === 'Low').length, 0);
  
  // When includeLowImportance is false, we should get 0 low importance metrics
  expect(lowImportanceCount(withoutLowImportance)).toBe(0);
  // When includeLowImportance is true, we should get some low importance metrics
  expect(lowImportanceCount(withLowImportance)).toBeGreaterThan(0);
}

export async function assertResourceTypeFiltering(
  analyzer: MetricsAnalyzer,
  templateName: string
): Promise<void> {
  const templatePath = path.join(__dirname, '..', 'fixtures', 'templates', templateName);
  
  const allResources = await analyzer.analyze(templatePath, { outputFormat: 'json' });
  const lambdaOnly = await analyzer.analyze(templatePath, { 
    outputFormat: 'json',
    resourceTypes: ['AWS::Lambda::Function']
  });
  
  expect(lambdaOnly.resources.length).toBeLessThanOrEqual(allResources.resources.length);
  expect(lambdaOnly.resources.every(r => r.resource_type === 'AWS::Lambda::Function')).toBe(true);
}

export async function assertVerboseMode(
  templateName: string
): Promise<void> {
  const templatePath = path.join(__dirname, '..', 'fixtures', 'templates', templateName);
  
  // Create analyzer with verbose logging
  const parser = new TemplateParser();
  const verboseLogger = new Logger('debug', true);
  const verboseAnalyzer = new MetricsAnalyzer(parser, verboseLogger);
  
  const result = await verboseAnalyzer.analyze(templatePath, { outputFormat: 'json' });
  expect(result).toBeDefined();
  expect(result.resources.length).toBeGreaterThan(0);
}

export async function assertFullPipeline(
  analyzer: MetricsAnalyzer,
  templateName: string
): Promise<void> {
  const templatePath = path.join(__dirname, '..', 'fixtures', 'templates', templateName);
  const result = await analyzer.analyze(templatePath, { outputFormat: 'json' });
  
  // Pipeline completeness checks
  expect(result.metadata).toBeDefined();
  expect(result.metadata.processing_time_ms).toBeGreaterThan(0);
  expect(result.resources.length).toBeGreaterThan(0);
  
  // Each resource should have metrics
  result.resources.forEach(resource => {
    expect(resource.logical_id).toBeDefined();
    expect(resource.resource_type).toBeDefined();
    expect(Array.isArray(resource.metrics)).toBe(true);
    expect(resource.metrics.length).toBeGreaterThan(0);
    
    // Each metric should have required properties
    resource.metrics.forEach(metric => {
      expect(metric.metric_name).toBeDefined();
      expect(metric.namespace).toBeDefined();
      expect(metric.category).toBeDefined();
      expect(['High', 'Medium', 'Low']).toContain(metric.importance);
      expect(metric.recommended_threshold).toBeDefined();
      expect(metric.recommended_threshold.warning).toBeGreaterThan(0);
      expect(metric.recommended_threshold.critical).toBeGreaterThan(0);
      // For some metrics, lower values are worse (e.g., HealthyHostCount)
      // so we can't always expect critical > warning
    });
  });
}

// Performance testing helpers
export async function measureAndAssertPerformance(
  analyzer: MetricsAnalyzer,
  templatePath: string,
  options: { outputFormat: 'json' | 'html'; concurrency?: number },
  maxTimeMs: number
): Promise<AnalysisResult> {
  const startTime = Date.now();
  const result = await analyzer.analyze(templatePath, options);
  const endTime = Date.now();
  const processingTime = endTime - startTime;
  
  expect(processingTime).toBeLessThan(maxTimeMs);
  expect(result.metadata.processing_time_ms).toBeGreaterThan(0);
  
  return result;
}

export function assertLargeTemplate(result: AnalysisResult): void {
  // Assert large template characteristics
  expect(result.metadata.total_resources).toBeGreaterThan(400);
  expect(result.resources.length).toBeGreaterThan(50); // At least some should be supported
  expect(result.metadata.processing_time_ms).toBeLessThan(30000); // Should complete within 30s
  
  // Check that metrics were generated for supported resources
  const totalMetrics = result.resources.reduce((sum, resource) => sum + resource.metrics.length, 0);
  expect(totalMetrics).toBeGreaterThan(100); // Should have substantial metrics
}

export async function assertConcurrentProcessing(
  analyzer: MetricsAnalyzer,
  templateName: string
): Promise<void> {
  const templatePath = path.join(__dirname, '..', 'fixtures', 'templates', templateName);
  
  // Test different concurrency levels
  const concurrencyLevels = [1, 4, 8];
  const results: AnalysisResult[] = [];
  
  for (const concurrency of concurrencyLevels) {
    const result = await analyzer.analyze(templatePath, {
      outputFormat: 'json',
      concurrency
    });
    
    results.push(result);
    expect(result.metadata.processing_time_ms).toBeLessThan(60000); // Should complete within 60s
  }
  
  // All results should be consistent
  results.forEach((result, index) => {
    if (index > 0) {
      expect(result.metadata.total_resources).toBe(results[0]?.metadata.total_resources);
      expect(result.resources.length).toBe(results[0]?.resources.length);
    }
  });
  
  // Higher concurrency should generally be faster (though not guaranteed due to overhead)
  const singleThreadTime = results[0]?.metadata.processing_time_ms ?? 0;
  const multiThreadTime = results[results.length - 1]?.metadata.processing_time_ms;
  
  // At minimum, multi-thread shouldn't be significantly slower
  expect(multiThreadTime).toBeLessThan(singleThreadTime * 2);
}

// Application template testing helpers
export async function testTemplateFromFixture(
  analyzer: MetricsAnalyzer,
  templateName: string,
  options: { outputFormat: 'json' | 'html' } = { outputFormat: 'json' }
): Promise<AnalysisResult> {
  const templatePath = path.join(__dirname, '..', 'fixtures', 'templates', templateName);
  return await analyzer.analyze(templatePath, options);
}

export async function assertCompleteWebAppTemplate(
  analyzer: MetricsAnalyzer,
  templateName: string
): Promise<void> {
  const result = await testTemplateFromFixture(analyzer, templateName);
  
  // Web app should have multiple resource types
  expect(result.metadata.total_resources).toBeGreaterThan(10);
  expect(result.resources.length).toBeGreaterThan(5);
  
  // Should contain common web app resources
  const resourceTypes = result.resources.map(r => r.resource_type);
  expect(resourceTypes).toContain('AWS::Lambda::Function');
  expect(resourceTypes).toContain('AWS::RDS::DBInstance');
  expect(resourceTypes).toContain('AWS::ElasticLoadBalancingV2::LoadBalancer');
  
  // Each resource should have metrics
  result.resources.forEach(resource => {
    expect(resource.metrics.length).toBeGreaterThan(0);
  });
}

export async function assertServerlessTemplate(
  analyzer: MetricsAnalyzer,
  templateName: string
): Promise<void> {
  const result = await testTemplateFromFixture(analyzer, templateName);
  
  // Serverless template characteristics
  expect(result.metadata.total_resources).toBeGreaterThanOrEqual(3);
  expect(result.resources.length).toBeGreaterThanOrEqual(3);
  
  // Should contain serverless resources
  const resourceTypes = result.resources.map(r => r.resource_type);
  expect(resourceTypes.some(type => 
    type.includes('Lambda') || 
    type.includes('Api') || 
    type.includes('DynamoDB')
  )).toBe(true);
  
  // Verify metrics generation
  const totalMetrics = result.resources.reduce((sum, resource) => sum + resource.metrics.length, 0);
  expect(totalMetrics).toBeGreaterThan(10);
}

export async function assertMinimalLambdaTemplate(
  analyzer: MetricsAnalyzer,
  templateName: string
): Promise<void> {
  const result = await testTemplateFromFixture(analyzer, templateName);
  
  // Minimal template should have fewer resources
  expect(result.metadata.total_resources).toBeLessThan(10);
  expect(result.resources.length).toBeGreaterThan(0);
  
  // Should contain at least Lambda function
  const hasLambda = result.resources.some(r => r.resource_type === 'AWS::Lambda::Function');
  expect(hasLambda).toBe(true);
  
  // Each resource should have appropriate metrics
  result.resources.forEach(resource => {
    expect(resource.metrics.length).toBeGreaterThan(3);
    expect(resource.metrics.every(m => m.metric_name)).toBe(true);
  });
}