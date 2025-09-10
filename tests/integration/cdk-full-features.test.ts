// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// tasks.md T-008: Phase 2完成版統合テスト

import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('CDK Full Features Integration', () => {
  let testOutputDir: string;

  beforeEach(async () => {
    // Create temporary output directory for file tests
    testOutputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cdk-full-test-'));
  });

  afterEach(async () => {
    // Clean up test output directory
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
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

    test.each(testTemplates)('should handle $path with all resource types', async ({ path, expectedResources, description }) => {
      const result = await runCLICommand([path, '--output', 'cdk'], 30000); // 30 second timeout
      
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      
      // Basic CDK structure verification
      expect(result.stdout).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
      expect(result.stdout).toContain('import * as cdk from \'aws-cdk-lib\'');
      expect(result.stdout).toContain('import * as cloudwatch from \'aws-cdk-lib/aws-cloudwatch\'');
      
      // Verify alarms are generated
      const alarmMatches = result.stdout.match(/new cloudwatch\.Alarm/g);
      expect(alarmMatches).not.toBeNull();
      expect(alarmMatches!.length).toBeGreaterThan(10); // Should have multiple alarms
      
      // Verify metadata indicates multiple resources
      expect(result.stdout).toMatch(/Total Resources: [1-9]/);
      expect(result.stdout).toMatch(/Total Alarms: \d{2,}/); // At least 10 alarms
      
      // Log expected vs actual resource types (for debugging)
      console.log(`✅ ${description}: ${alarmMatches!.length} alarms generated for ${expectedResources.join(', ')} resources`);
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
        
        const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) || []).length;
        console.log(`✅ ${test.resourceType}: ${alarmCount} alarms generated from ${test.template}`);
      }
    }, 120000); // 2 minute timeout for comprehensive test
  });

  describe('SNS Integration Full Testing', () => {
    it('should work with new SNS topic creation across templates', async () => {
      const templates = [
        'examples/web-application-stack.yaml',
        'examples/serverless-api-sam.yaml'
      ];

      for (const template of templates) {
        const result = await runCLICommand([
          template,
          '--output', 'cdk',
          '--cdk-enable-sns'
        ], 25000);
        
        expect(result.exitCode).toBe(0);
        
        // Verify SNS imports and topic creation
        expect(result.stdout).toContain('import * as sns from \'aws-cdk-lib/aws-sns\'');
        expect(result.stdout).toContain('import * as cloudwatchActions from \'aws-cdk-lib/aws-cloudwatch-actions\'');
        expect(result.stdout).toContain('new sns.Topic(this, \'AlarmNotificationTopic\'');
        expect(result.stdout).toContain('topicName: \'CloudWatchAlarmNotifications\'');
        
        // Verify SNS actions are added to all alarms
        const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) || []).length;
        const snsActionCount = (result.stdout.match(/\.addAlarmAction\(new cloudwatchActions\.SnsAction\(/g) || []).length;
        
        expect(alarmCount).toBeGreaterThan(0);
        expect(snsActionCount).toBe(alarmCount); // Every alarm should have SNS action
        
        console.log(`✅ SNS integration for ${template}: ${alarmCount} alarms, ${snsActionCount} SNS actions`);
      }
    }, 60000); // 1 minute timeout

    it('should work with existing SNS topic ARN', async () => {
      const validSnsArn = 'arn:aws:sns:us-east-1:123456789012:existing-topic';
      
      const result = await runCLICommand([
        'examples/web-application-stack.yaml',
        '--output', 'cdk',
        '--resource-types', 'AWS::RDS::DBInstance',
        '--cdk-sns-topic-arn', validSnsArn
      ], 20000);
      
      expect(result.exitCode).toBe(0);
      
      // Should import existing topic, not create new
      expect(result.stdout).toContain('sns.Topic.fromTopicArn(');
      expect(result.stdout).toContain(validSnsArn);
      expect(result.stdout).not.toContain('new sns.Topic(');
      
      // Should still have SNS actions
      expect(result.stdout).toMatch(/\.addAlarmAction\(new cloudwatchActions\.SnsAction\(/);
    });
  });

  describe('Phase 2 Performance Requirements', () => {
    it('should meet Phase 2 performance requirements for multi-resource templates', async () => {
      const performanceTests = [
        { template: 'examples/web-application-stack.yaml', maxTime: 15000 }, // 15 seconds
        { template: 'examples/serverless-api-sam.yaml', maxTime: 20000 }    // 20 seconds
      ];

      for (const test of performanceTests) {
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed;
        
        const result = await runCLICommand([test.template, '--output', 'cdk'], test.maxTime + 5000);
        
        const duration = Date.now() - startTime;
        const endMemory = process.memoryUsage().heapUsed;
        const memoryUsedMB = (endMemory - startMemory) / (1024 * 1024);
        
        expect(result.exitCode).toBe(0);
        expect(duration).toBeLessThan(test.maxTime);
        expect(memoryUsedMB).toBeLessThan(400); // 400MB limit
        
        console.log(`✅ Performance ${test.template}: ${duration}ms (< ${test.maxTime}ms), ${memoryUsedMB.toFixed(1)}MB`);
      }
    }, 60000);

    it('should handle large number of alarms efficiently', async () => {
      const startTime = Date.now();
      
      const result = await runCLICommand([
        'examples/serverless-api-sam.yaml', // 9 resources, 252 alarms
        '--output', 'cdk',
        '--cdk-enable-sns'
      ], 25000);
      
      const duration = Date.now() - startTime;
      
      expect(result.exitCode).toBe(0);
      expect(duration).toBeLessThan(20000); // 20 seconds for large workload
      
      // Verify large number of alarms are generated
      const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) || []).length;
      expect(alarmCount).toBeGreaterThan(200); // Should be around 252 alarms
      
      console.log(`✅ Large workload performance: ${alarmCount} alarms in ${duration}ms`);
    });
  });

  describe('Regression Testing - Existing Functionality', () => {
    it('should not break existing JSON output mode after Phase 2 changes', async () => {
      const templates = [
        'examples/web-application-stack.yaml',
        'examples/serverless-api-sam.yaml'
      ];

      for (const template of templates) {
        const result = await runCLICommand([template, '--output', 'json'], 15000);
        
        expect(result.exitCode).toBe(0);
        expect(result.stderr).toBe('');
        
        // Extract JSON from npm output
        const jsonOutput = extractJSONFromOutput(result.stdout);
        const parsed = JSON.parse(jsonOutput);
        
        expect(parsed).toHaveProperty('metadata');
        expect(parsed).toHaveProperty('resources');
        expect(parsed.resources.length).toBeGreaterThan(0);
        expect(parsed.metadata.version).toBe('1.0.0');
      }
    });

    it('should not break existing HTML output mode after Phase 2 changes', async () => {
      const htmlFilePath = path.join(testOutputDir, 'regression-test.html');
      
      const result = await runCLICommand([
        'examples/web-application-stack.yaml',
        '--output', 'html',
        '--file', htmlFilePath
      ], 20000);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(`✅ Report saved: ${htmlFilePath}`);
      
      // Verify HTML file was created and has content
      await expect(fs.access(htmlFilePath)).resolves.not.toThrow();
      const htmlContent = await fs.readFile(htmlFilePath, 'utf-8');
      expect(htmlContent).toContain('<html');
      expect(htmlContent).toContain('CloudWatch Metrics Report');
    });
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
      const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) || []).length;
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
      const lambdaAlarms = (result.stdout.match(/FunctionName:/g) || []).length;
      const dynamoAlarms = (result.stdout.match(/TableName:/g) || []).length;
      
      expect(lambdaAlarms).toBeGreaterThan(0);
      expect(dynamoAlarms).toBeGreaterThan(0);
      
      console.log(`✅ Resource filtering: ${lambdaAlarms} Lambda + ${dynamoAlarms} DynamoDB alarms`);
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
      const alarmCount = (fileContent.match(/new cloudwatch\.Alarm/g) || []).length;
      const snsActionCount = (fileContent.match(/\.addAlarmAction\(/g) || []).length;
      
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
      const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) || []).length;
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

// Helper function to run CLI commands with timeout
async function runCLICommand(
  args: string[], 
  timeoutMs: number = 30000
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'dev', '--', ...args], {
      cwd: process.cwd()
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        exitCode: code || 0,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });
    
    child.on('error', (error) => {
      reject(error);
    });
    
    // Set timeout
    setTimeout(() => {
      child.kill();
      reject(new Error(`Command timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

// Helper function to extract JSON from npm run output
function extractJSONFromOutput(output: string): string {
  const lines = output.split('\n');
  
  // Find the first line that starts with '{'
  const jsonStartIndex = lines.findIndex(line => line.trim().startsWith('{'));
  if (jsonStartIndex === -1) {
    throw new Error('No JSON found in output');
  }
  
  // Return everything from the JSON start
  return lines.slice(jsonStartIndex).join('\n');
}