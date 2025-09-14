// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// CDK Full Features Edge Cases and Acceptance Tests
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { runCLICommand } from './cdk-full-features.test-helpers';

describe('CDK Full Features - Edge Cases and Acceptance', () => {
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

  describe('Error Handling and Edge Cases', () => {
    it('should handle templates with no supported resources gracefully', async () => {
      // Create a minimal template with unsupported resources
      const minimalTemplate = `
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  UnsupportedResource:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-12345
`;
      
      const tempTemplatePath = path.join(testOutputDir, 'minimal.yaml');
      await fs.writeFile(tempTemplatePath, minimalTemplate, 'utf-8');
      
      const result = await runCLICommand([tempTemplatePath, '--output', 'cdk'], 15000);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
      expect(result.stdout).toContain('// No alarms generated - no supported resources found');
      expect(result.stdout).not.toContain('new cloudwatch.Alarm');
    });

    it('should handle mixed supported and unsupported resources', async () => {
      const mixedTemplate = `
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  SupportedDB:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.micro
  UnsupportedInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-12345
`;
      
      const tempTemplatePath = path.join(testOutputDir, 'mixed.yaml');
      await fs.writeFile(tempTemplatePath, mixedTemplate, 'utf-8');
      
      const result = await runCLICommand([tempTemplatePath, '--output', 'cdk'], 15000);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
      
      // Should generate alarms for RDS, ignore EC2
      const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) ?? []).length;
      expect(alarmCount).toBeGreaterThan(0);
      expect(result.stdout).toContain('DBInstanceIdentifier: \'SupportedDB\'');
    });

    it('should validate file output with custom stack names', async () => {
      const customStackName = 'MyIntegrationTestStack';
      
      const result = await runCLICommand([
        'examples/web-application-stack.yaml',
        '--output', 'cdk',
        '--resource-types', 'AWS::RDS::DBInstance',
        '--cdk-output-dir', testOutputDir,
        '--cdk-stack-name', customStackName
      ], 20000);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(`✅ CDK Stack generated: ${path.join(testOutputDir, `${customStackName}.ts`)}`);
      
      // Verify file was created with correct name and content
      const expectedFilePath = path.join(testOutputDir, `${customStackName}.ts`);
      await expect(fs.access(expectedFilePath)).resolves.not.toThrow();
      
      const fileContent = await fs.readFile(expectedFilePath, 'utf-8');
      expect(fileContent).toContain(`export class ${customStackName} extends cdk.Stack`);
      expect(fileContent).toContain('new cloudwatch.Alarm');
    });
  });

  describe('Complete Feature Integration', () => {
    it('should generate complete production-ready CDK code with all features', async () => {
      const result = await runCLICommand([
        'examples/serverless-api-sam.yaml',
        '--output', 'cdk',
        '--cdk-enable-sns',
        '--cdk-stack-name', 'ProductionAlarmsStack',
        '--cdk-output-dir', testOutputDir
      ], 30000);
      
      expect(result.exitCode).toBe(0);
      
      // Verify file output
      const stackFilePath = path.join(testOutputDir, 'ProductionAlarmsStack.ts');
      await expect(fs.access(stackFilePath)).resolves.not.toThrow();
      
      const fileContent = await fs.readFile(stackFilePath, 'utf-8');
      
      // Verify all major components are present
      expect(fileContent).toContain('export class ProductionAlarmsStack extends cdk.Stack');
      expect(fileContent).toContain('import * as sns from \'aws-cdk-lib/aws-sns\'');
      expect(fileContent).toContain('new sns.Topic(this, \'AlarmNotificationTopic\'');
      expect(fileContent).toContain('new cloudwatch.Alarm(');
      expect(fileContent).toMatch(/\.addAlarmAction\(new cloudwatchActions\.SnsAction\(/);
      
      // Verify multiple resource types
      expect(fileContent).toContain('FunctionName:'); // Lambda
      expect(fileContent).toContain('TableName:');    // DynamoDB
      expect(fileContent).toContain('ApiName:');      // API Gateway
      
      // Count total features
      const alarmCount = (fileContent.match(/new cloudwatch\.Alarm/g) ?? []).length;
      const snsActionCount = (fileContent.match(/\.addAlarmAction\(/g) ?? []).length;
      
      expect(alarmCount).toBeGreaterThan(200);
      expect(snsActionCount).toBe(alarmCount); // Every alarm should have SNS action
      
      console.log(`✅ Production-ready stack: ${alarmCount} alarms with ${snsActionCount} SNS actions`);
    });
  });

  describe('Phase 2 Acceptance Criteria Verification', () => {
    it('should meet AC-1 requirement: All resource types supported', async () => {
      const result = await runCLICommand([
        'examples/serverless-api-sam.yaml',
        '--output', 'cdk'
      ], 25000);
      
      expect(result.exitCode).toBe(0);
      
      // Should generate substantial number of alarms from multiple resource types
      const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) ?? []).length;
      expect(alarmCount).toBeGreaterThanOrEqual(200); // High alarm count indicates multiple resources
      
      // Verify different dimension types are present (indicating different resource types)
      const dimensionTypes = [
        result.stdout.includes('FunctionName:'),  // Lambda
        result.stdout.includes('TableName:'),     // DynamoDB
        result.stdout.includes('ApiName:')        // API Gateway
      ].filter(Boolean);
      
      expect(dimensionTypes.length).toBeGreaterThanOrEqual(3); // At least 3 different resource types
    });

    it('should meet AC-2 requirement: CLI integration fully functional', async () => {
      // Test all major CLI options work together
      const result = await runCLICommand([
        'examples/serverless-api-sam.yaml',
        '--output', 'cdk',
        '--resource-types', 'AWS::Serverless::Function,AWS::DynamoDB::Table',
        '--include-low',
        '--cdk-enable-sns',
        '--cdk-stack-name', 'TestCLIStack',
        '--verbose'
      ], 30000);
      
      expect(result.exitCode).toBe(0);
      
      // Verify all options took effect
      expect(result.stdout).toContain('export class TestCLIStack extends cdk.Stack'); // Custom stack name
      expect(result.stdout).toContain('import * as sns from'); // SNS enabled
      expect(result.stdout).toContain('FunctionName:'); // Lambda resources
      expect(result.stdout).toContain('TableName:');    // DynamoDB resources
      expect(result.stdout).not.toContain('ApiName:');  // API Gateway filtered out
      
      console.log('✅ AC-2: All CLI options working together correctly');
    });
  });
});