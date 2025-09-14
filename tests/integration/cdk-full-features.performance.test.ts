// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// CDK Full Features Performance and Regression Tests
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { runCLICommand, extractJSONFromOutput } from './cdk-full-features.test-helpers';

describe('CDK Full Features - Performance and Regression', () => {
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
      const alarmCount = (result.stdout.match(/new cloudwatch\.Alarm/g) ?? []).length;
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
        
        interface ParsedResult {
          metadata: { version: string };
          resources: unknown[];
        }
        
        const parsed = JSON.parse(jsonOutput) as ParsedResult;
        
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
});