// CLI E2E Tests - 10 Patterns
// CLAUDE.md準拠: No any types、TDD実践

import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';

// Type definitions for E2E test results
interface CliOutputResource {
  resource_type: string;
  logical_id: string;
  metrics: unknown[];
}

interface CliOutputMetadata {
  version: string;
  [key: string]: unknown;
}

interface CliOutputResult {
  metadata: CliOutputMetadata;
  resources: CliOutputResource[];
  unsupported_resources: unknown[];
}
// Helper function to generate unique IDs
const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const execAsync = promisify(exec);

// Paths
const CLI_PATH = path.join(__dirname, '..', '..', 'dist', 'cli', 'index.js');
const FIXTURES_PATH = path.join(__dirname, '..', 'fixtures', 'templates');
const TEMP_DIR = path.join(__dirname, '..', '..', 'temp-test-outputs');

describe('CLI E2E Tests - 10 Patterns', () => {
  beforeAll(async () => {
    // Create temp directory for test outputs
    await fs.mkdir(TEMP_DIR, { recursive: true });
    
    // Check if CLI is already built, build if necessary
    try {
      const cliExists = await fs.access(CLI_PATH).then(() => true).catch(() => false);
      if (!cliExists) {
        console.log('CLI not found, building...');
        await execAsync('npm run build');
        console.log('Build completed');
      } else {
        console.log('CLI already built');
      }
    } catch (error) {
      console.error('Build failed:', error);
      throw error;
    }
  }, 30000); // 30 second timeout for build

  afterAll(async () => {
    // Clean up temp directory
    try {
      await fs.rm(TEMP_DIR, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });

  describe('1. Basic Execution', () => {
    test('1-1: Basic JSON output to stdout', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'minimal-lambda.yaml');
      
      const { stdout, stderr } = await execAsync(
        `node ${CLI_PATH} ${templatePath}`
      );

      expect(stderr).toBe('');
      
      // Parse JSON output
      const result = JSON.parse(stdout) as CliOutputResult;
      expect(result.metadata.version).toBe('1.0.0');
      expect(result.resources).toHaveLength(1);
      expect(result.resources[0]!.resource_type).toBe('AWS::Lambda::Function');
      expect(result.resources[0]!.metrics.length).toBeGreaterThan(10);
    });

    test('1-2: JSON output to file', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'minimal-lambda.yaml');
      const outputFile = path.join(TEMP_DIR, `output-${generateUniqueId()}.json`);
      
      const { stderr } = await execAsync(
        `node ${CLI_PATH} ${templatePath} --output json --file ${outputFile}`
      );

      expect(stderr).toBe('');
      
      // Check file exists and is valid JSON
      const fileContent = await fs.readFile(outputFile, 'utf8');
      const result = JSON.parse(fileContent) as CliOutputResult;
      expect(result.metadata.version).toBe('1.0.0');
      expect(result.resources).toHaveLength(1);
    });

    test('1-3: HTML output to file', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'web-app-complete.yaml');
      const outputFile = path.join(TEMP_DIR, `report-${generateUniqueId()}.html`);
      
      const { stdout, stderr } = await execAsync(
        `node ${CLI_PATH} ${templatePath} --output html --file ${outputFile}`
      );

      expect(stderr).toBe('');
      expect(stdout).toContain('✅ Report saved:');
      
      // Check HTML content
      const htmlContent = await fs.readFile(outputFile, 'utf8');
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('CloudWatch Metrics Report');
      expect(htmlContent).toContain('resource-card');
      expect(htmlContent).toContain('searchInput');
    });
  });

  describe('2. Command Options', () => {
    test('2-1: Help option', async () => {
      const { stdout } = await execAsync(
        `node ${CLI_PATH} --help`
      );

      expect(stdout).toContain('aws-cloud-supporter');
      expect(stdout).toContain('Generate CloudWatch metrics recommendations');
      expect(stdout).toContain('--output');
      expect(stdout).toContain('--file');
      expect(stdout).toContain('--resource-types');
      expect(stdout).toContain('--include-low');
      expect(stdout).toContain('Examples:');
      expect(stdout).toContain('Supported Resource Types:');
    });

    test('2-2: Version option', async () => {
      const { stdout } = await execAsync(
        `node ${CLI_PATH} --version`
      );

      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('2-3: Resource type filtering', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'web-app-complete.yaml');
      
      const { stdout } = await execAsync(
        `node ${CLI_PATH} ${templatePath} --resource-types "AWS::RDS::DBInstance,AWS::Lambda::Function"`
      );

      const result = JSON.parse(stdout) as CliOutputResult;
      const resourceTypes = result.resources.map((r) => r.resource_type);
      
      // Should only contain specified types
      expect(resourceTypes).toContain('AWS::RDS::DBInstance');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).not.toContain('AWS::ECS::Service');
      expect(resourceTypes).not.toContain('AWS::DynamoDB::Table');
    });

    test('2-4: Include low importance metrics', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'minimal-lambda.yaml');
      
      // Without --include-low
      const { stdout: stdoutWithout } = await execAsync(
        `node ${CLI_PATH} ${templatePath}`
      );
      const resultWithout = JSON.parse(stdoutWithout) as CliOutputResult;
      
      // With --include-low
      const { stdout: stdoutWith } = await execAsync(
        `node ${CLI_PATH} ${templatePath} --include-low`
      );
      const resultWith = JSON.parse(stdoutWith) as CliOutputResult;
      
      // Should have more metrics with low importance included
      expect(resultWith.resources[0]!.metrics.length).toBeGreaterThanOrEqual(
        resultWithout.resources[0]!.metrics.length
      );
    });

    test('2-5: Verbose mode', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'minimal-lambda.yaml');
      
      const { stdout, stderr } = await execAsync(
        `node ${CLI_PATH} ${templatePath} --verbose`
      );

      // In verbose mode, should have additional logging
      // Check either stdout or stderr for verbose messages
      const combinedOutput = stdout + stderr;
      expect(combinedOutput.length).toBeGreaterThan(100);
      
      // Result should still be valid JSON
      // Extract JSON part from stdout (between first { and last })
      const jsonStart = stdout.indexOf('{');
      const jsonEnd = stdout.lastIndexOf('}') + 1;
      expect(jsonStart).toBeGreaterThanOrEqual(0);
      expect(jsonEnd).toBeGreaterThan(jsonStart);
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonPart = stdout.slice(jsonStart, jsonEnd);
        const result = JSON.parse(jsonPart) as CliOutputResult;
        expect(result.metadata.version).toBe('1.0.0');
      }
    });

    test('2-6: Performance mode with high concurrency', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'large-template-500-resources.yaml');
      
      const startTime = Date.now();
      const { stdout } = await execAsync(
        `node ${CLI_PATH} ${templatePath} --performance-mode`,
        { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer for large output
      );
      const duration = Date.now() - startTime;

      const result = JSON.parse(stdout) as CliOutputResult;
      expect(result.resources.length).toBeGreaterThan(300);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      
      console.log(`E2E Performance test: ${result.resources.length} resources in ${duration}ms`);
    });
  });

  describe('3. Error Handling', () => {
    test('3-1: Non-existent file', async () => {
      const fakePath = '/non/existent/template.yaml';
      
      await expect(execAsync(
        `node ${CLI_PATH} ${fakePath}`
      )).rejects.toThrow();
    });

    test('3-2: Invalid YAML syntax', async () => {
      const invalidPath = path.join(FIXTURES_PATH, 'invalid-yaml.yaml');
      
      await expect(execAsync(
        `node ${CLI_PATH} ${invalidPath}`
      )).rejects.toThrow();
    });

    test('3-3: Invalid output format', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'minimal-lambda.yaml');
      
      await expect(execAsync(
        `node ${CLI_PATH} ${templatePath} --output invalid`
      )).rejects.toThrow();
    });
  });

  describe('4. Real-world Templates', () => {
    test('4-1: Serverless application template', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'serverless-application.yaml');
      const outputFile = path.join(TEMP_DIR, `serverless-${generateUniqueId()}.json`);
      
      const { stderr } = await execAsync(
        `node ${CLI_PATH} ${templatePath} --file ${outputFile}`
      );

      expect(stderr).toBe('');
      
      const result = JSON.parse(await fs.readFile(outputFile, 'utf8')) as CliOutputResult;
      
      // Should handle SAM transform
      const resourceTypes = result.resources.map((r) => r.resource_type);
      expect(resourceTypes).toContain('AWS::Serverless::Function');
      expect(resourceTypes).toContain('AWS::Serverless::Api');
      expect(resourceTypes).toContain('AWS::DynamoDB::Table');
      
      // Verify metrics generated
      const serverlessFunction = result.resources.find(
        (r) => r.resource_type === 'AWS::Serverless::Function'
      );
      expect(serverlessFunction).toBeDefined();
      expect(serverlessFunction!.metrics.length).toBeGreaterThan(10);
    });
  });
});