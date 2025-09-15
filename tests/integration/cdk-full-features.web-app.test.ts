// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// CDK Full Features - Web Application Stack Tests
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { runCLICommand } from './cdk-full-features.test-helpers';

describe('CDK Full Features - Web Application Stack', () => {
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

  describe('Web Application Template', () => {
    const webAppTemplate = 'examples/web-application-stack.yaml';
    const expectedResources = ['RDS', 'ALB'];
    const description = 'Web application stack with database and load balancer';

    it('should handle web application stack with all resource types', async () => {
      const result = await runCLICommand([webAppTemplate, '--output', 'cdk'], 30000);
      
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

    it('should generate RDS alarms for database instances', async () => {
      const result = await runCLICommand([
        webAppTemplate,
        '--output', 'cdk',
        '--resource-types', 'AWS::RDS::DBInstance'
      ], 20000);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
      
      // Verify RDS-specific dimensions
      expect(result.stdout).toContain('DBInstanceIdentifier:');
      
      const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) ?? []).length;
      console.log(`✅ AWS::RDS::DBInstance: ${alarmCount} alarms generated from ${webAppTemplate}`);
      
      // RDS should generate at least 10 alarms per instance
      expect(alarmCount).toBeGreaterThan(10);
    });

    it('should generate ALB alarms for load balancers', async () => {
      const result = await runCLICommand([
        webAppTemplate,
        '--output', 'cdk',
        '--resource-types', 'AWS::ElasticLoadBalancingV2::LoadBalancer'
      ], 20000);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
      
      // Verify ALB-specific dimensions
      expect(result.stdout).toContain('LoadBalancer:');
      
      const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) ?? []).length;
      console.log(`✅ AWS::ElasticLoadBalancingV2::LoadBalancer: ${alarmCount} alarms generated from ${webAppTemplate}`);
      
      // ALB should generate multiple alarms
      expect(alarmCount).toBeGreaterThan(5);
    });

    it('should handle web app with verbose logging', async () => {
      const result = await runCLICommand([
        webAppTemplate,
        '--output', 'cdk',
        '--verbose'
      ], 25000);
      
      expect(result.exitCode).toBe(0);
      
      // Should show processing details
      expect(result.stdout).toContain('Starting analysis');
      expect(result.stdout).toContain('Analysis completed');
    });
  });
});