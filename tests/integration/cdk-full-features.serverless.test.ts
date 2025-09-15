// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// CDK Full Features - Serverless API Tests
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { runCLICommand } from './cdk-full-features.test-helpers';

describe('CDK Full Features - Serverless API', () => {
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

  describe('Serverless API Template', () => {
    const serverlessTemplate = 'examples/serverless-api-sam.yaml';
    const expectedResources = ['Lambda', 'DynamoDB', 'ApiGateway'];
    const description = 'Serverless API with Lambda functions and database';

    it('should handle serverless API stack with all resource types', async () => {
      const result = await runCLICommand([serverlessTemplate, '--output', 'cdk'], 30000);
      
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      
      // Basic CDK structure verification
      expect(result.stdout).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
      expect(result.stdout).toContain('import * as cdk from \'aws-cdk-lib\'');
      expect(result.stdout).toContain('import * as cloudwatch from \'aws-cdk-lib/aws-cloudwatch\'');
      
      // Verify alarms are generated
      const alarmMatches = result.stdout.match(/new cloudwatch\.Alarm/g);
      expect(alarmMatches).not.toBeNull();
      expect(alarmMatches?.length ?? 0).toBeGreaterThan(10);
      
      // Verify metadata indicates multiple resources
      expect(result.stdout).toMatch(/Total Resources: [1-9]/);
      expect(result.stdout).toMatch(/Total Alarms: \d{2,}/); // At least 10 alarms
      
      // Log results
      console.log(`✅ ${description}: ${alarmMatches?.length ?? 0} alarms generated for ${expectedResources.join(', ')} resources`);
    }, 45000); // 45 second timeout

    it('should generate Lambda function alarms', async () => {
      const result = await runCLICommand([
        serverlessTemplate,
        '--output', 'cdk',
        '--resource-types', 'AWS::Serverless::Function'
      ], 20000);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
      
      // Verify Lambda-specific dimensions
      expect(result.stdout).toContain('FunctionName:');
      
      const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) ?? []).length;
      console.log(`✅ AWS::Serverless::Function: ${alarmCount} alarms generated from ${serverlessTemplate}`);
      
      // Lambda should generate multiple alarms per function
      expect(alarmCount).toBeGreaterThan(5);
    });

    it('should generate DynamoDB table alarms', async () => {
      const result = await runCLICommand([
        serverlessTemplate,
        '--output', 'cdk',
        '--resource-types', 'AWS::DynamoDB::Table'
      ], 20000);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
      
      // Verify DynamoDB-specific dimensions
      expect(result.stdout).toContain('TableName:');
      
      const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) ?? []).length;
      console.log(`✅ AWS::DynamoDB::Table: ${alarmCount} alarms generated from ${serverlessTemplate}`);
      
      // DynamoDB should generate multiple alarms
      expect(alarmCount).toBeGreaterThan(10);
    });

    it('should generate API Gateway alarms', async () => {
      const result = await runCLICommand([
        serverlessTemplate,
        '--output', 'cdk',
        '--resource-types', 'AWS::Serverless::Api'
      ], 20000);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
      
      // Verify API Gateway-specific dimensions
      expect(result.stdout).toContain('ApiName:');
      
      const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) ?? []).length;
      console.log(`✅ AWS::Serverless::Api: ${alarmCount} alarms generated from ${serverlessTemplate}`);
      
      // API Gateway should generate multiple alarms
      expect(alarmCount).toBeGreaterThan(5);
    });

    it('should handle multiple resource types together', async () => {
      const result = await runCLICommand([
        serverlessTemplate,
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