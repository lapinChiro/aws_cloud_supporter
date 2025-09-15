// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// CDK Full Features - Cross-Template Verification Tests
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { runCLICommand } from './cdk-full-features.test-helpers';

describe('CDK Full Features - Cross-Template Verification', () => {
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

  describe('All Resource Types Across Templates', () => {
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
        
        // Each resource type should generate at least some alarms
        expect(alarmCount).toBeGreaterThan(0);
      }
    }, 120000); // 2 minute timeout for comprehensive test
  });

  describe('Multi-Template Comparison', () => {
    it('should handle different template formats consistently', async () => {
      const templates = [
        'examples/web-application-stack.yaml',
        'examples/serverless-api-sam.yaml'
      ];

      const results = await Promise.all(
        templates.map(template => 
          runCLICommand([template, '--output', 'cdk'], 30000)
        )
      );

      // All templates should succeed
      results.forEach((result, index) => {
        expect(result.exitCode).toBe(0);
        expect(result.stderr).toBe('');
        console.log(`✅ Template ${templates[index]} processed successfully`);
      });

      // All should generate valid CDK code
      results.forEach(result => {
        expect(result.stdout).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
        expect(result.stdout).toContain('new cloudwatch.Alarm');
      });
    });
  });

  describe('Resource Type Filtering Edge Cases', () => {
    it('should handle empty resource type filter gracefully', async () => {
      const result = await runCLICommand([
        'examples/serverless-api-sam.yaml',
        '--output', 'cdk',
        '--resource-types', ''
      ], 20000);
      
      // Should still process all resources
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('new cloudwatch.Alarm');
    });

    it('should handle non-existent resource type filter', async () => {
      const result = await runCLICommand([
        'examples/serverless-api-sam.yaml',
        '--output', 'cdk',
        '--resource-types', 'AWS::NonExistent::Resource'
      ], 20000);
      
      expect(result.exitCode).toBe(0);
      
      // Should generate empty stack or minimal output
      const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) ?? []).length;
      expect(alarmCount).toBe(0);
    });

    it('should handle mixed valid and invalid resource types', async () => {
      const result = await runCLICommand([
        'examples/serverless-api-sam.yaml',
        '--output', 'cdk',
        '--resource-types', 'AWS::Serverless::Function,AWS::Invalid::Type,AWS::DynamoDB::Table'
      ], 25000);
      
      expect(result.exitCode).toBe(0);
      
      // Should only process valid types
      expect(result.stdout).toContain('FunctionName:');
      expect(result.stdout).toContain('TableName:');
      
      const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) ?? []).length;
      expect(alarmCount).toBeGreaterThan(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should complete within reasonable time for large templates', async () => {
      const startTime = Date.now();
      
      const result = await runCLICommand([
        'examples/serverless-api-sam.yaml',
        '--output', 'cdk',
        '--performance-mode'
      ], 30000);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result.exitCode).toBe(0);
      expect(duration).toBeLessThan(30000); // Should complete in less than 30 seconds
      
      console.log(`✅ Performance mode completed in ${duration}ms`);
    });
  });
});