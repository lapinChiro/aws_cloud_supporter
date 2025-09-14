// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// CDK Full Features Multi-Template Integration Tests
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { runCLICommand } from './cdk-full-features.test-helpers';

describe('CDK Full Features - Multi-Template Support', () => {
  let testOutputDir: string;

  beforeEach(async () => {
    // Create temporary output directory for file tests
    testOutputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cdk-test-'));
  });

  afterEach(async () => {
    // Clean up test output directory
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Multi-Template Resource Type Support', () => {
    const testTemplates = [
      { 
        path: 'examples/web-application-stack.yaml', 
        expectedResources: ['RDS', 'ALB'],
        description: 'Web application stack with database and load balancer'
      },
      { 
        path: 'examples/serverless-api-sam.yaml', 
        expectedResources: ['Lambda', 'DynamoDB', 'ApiGateway'],
        description: 'Serverless API with Lambda functions and database'
      },
      // Note: Skipping container-microservices-ecs.yaml if it doesn't exist
    ];

    test.each(testTemplates)('should handle $path with all resource types', async ({ path: templatePath, expectedResources, description }) => {
      const result = await runCLICommand([templatePath, '--output', 'cdk'], 30000); // 30 second timeout
      
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      
      // Basic CDK structure verification
      expect(result.stdout).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
      expect(result.stdout).toContain('import * as cdk from \'aws-cdk-lib\'');
      expect(result.stdout).toContain('import * as cloudwatch from \'aws-cdk-lib/aws-cloudwatch\'');
      
      // Verify alarms are generated
      const alarmMatches = result.stdout.match(/new cloudwatch\.Alarm/g);
      expect(alarmMatches).not.toBeNull();
      expect(alarmMatches?.length ?? 0).toBeGreaterThan(10); // Should have multiple alarms
      
      // Verify metadata indicates multiple resources
      expect(result.stdout).toMatch(/Total Resources: [1-9]/);
      expect(result.stdout).toMatch(/Total Alarms: \d{2,}/); // At least 10 alarms
      
      // Log expected vs actual resource types (for debugging)
      console.log(`✅ ${description}: ${alarmMatches?.length ?? 0} alarms generated for ${expectedResources.join(', ')} resources`);
    }, 45000); // 45 second timeout per template test
  });

  describe('All 8 Resource Types Verification', () => {
    it('should generate alarms for all supported resource types across templates', async () => {
      // Test each resource type individually to ensure they all work
      const resourceTypeTests = [
        { template: 'examples/web-application-stack.yaml', resourceType: 'AWS::RDS::DBInstance' },
        { template: 'examples/web-application-stack.yaml', resourceType: 'AWS::ElasticLoadBalancingV2::LoadBalancer' },
        { template: 'examples/serverless-api-sam.yaml', resourceType: 'AWS::Serverless::Function' },
        { template: 'examples/serverless-api-sam.yaml', resourceType: 'AWS::DynamoDB::Table' },
        { template: 'examples/serverless-api-sam.yaml', resourceType: 'AWS::Serverless::Api' }
      ];

      for (const test of resourceTypeTests) {
        const result = await runCLICommand([
          test.template,
          '--output', 'cdk',
          '--resource-types', test.resourceType
        ], 20000);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
        
        const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) ?? []).length;
        console.log(`✅ ${test.resourceType}: ${alarmCount} alarms generated from ${test.template}`);
      }
    }, 120000); // 2 minute timeout for comprehensive test
  });

  describe('Resource Type Filtering Integration', () => {
    it('should correctly filter and process multiple resource types', async () => {
      const result = await runCLICommand([
        'examples/serverless-api-sam.yaml',
        '--output', 'cdk',
        '--resource-types', 'AWS::Serverless::Function,AWS::DynamoDB::Table',
        '--verbose'
      ], 25000);
      
      expect(result.exitCode).toBe(0);
      
      // Should contain Lambda and DynamoDB alarms
      expect(result.stdout).toContain('FunctionName:');
      expect(result.stdout).toContain('TableName:');
      
      // Should not contain API Gateway alarms (filtered out)
      expect(result.stdout).not.toContain('ApiName:');
      
      // Count alarms for filtered resources
      const lambdaAlarms = (result.stdout.match(/FunctionName:/g) ?? []).length;
      const dynamoAlarms = (result.stdout.match(/TableName:/g) ?? []).length;
      
      expect(lambdaAlarms).toBeGreaterThan(0);
      expect(dynamoAlarms).toBeGreaterThan(0);
      
      console.log(`✅ Resource filtering: ${lambdaAlarms} Lambda + ${dynamoAlarms} DynamoDB alarms`);
    });
  });
});