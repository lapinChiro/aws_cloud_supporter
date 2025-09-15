// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// tasks.md T-004: CLI統合テスト

import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { createCLICommand } from '../../src/cli/commands';
import { MetricsAnalyzer } from '../../src/core/analyzer';
import { HTMLOutputFormatter } from '../../src/core/formatters/html';
import { JSONOutputFormatter } from '../../src/core/json-formatter';
import { TemplateParser } from '../../src/core/parser';
import { CDKOfficialGenerator } from '../../src/generators/cdk-official.generator';
import { Logger } from '../../src/utils/logger';


describe('CLI CDK Basic Integration', () => {
  let testOutputDir: string;
  
  // Setup test dependencies
  const logger = new Logger();
  logger.setLevel('warn'); // Reduce test noise
  
  const dependencies = {
    analyzer: new MetricsAnalyzer(new TemplateParser(), logger),
    parser: new TemplateParser(),
    jsonFormatter: new JSONOutputFormatter(),
    htmlFormatter: new HTMLOutputFormatter(),
    logger
  };
  
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

  describe('CLI Option Parsing', () => {
    it('should accept CDK output format', () => {
      const program = createCLICommand(dependencies);
      
      // Test help output includes CDK options
      const helpOutput = program.helpInformation();
      expect(helpOutput).toContain('--cdk-output-dir');
      expect(helpOutput).toContain('--cdk-stack-name');
      expect(helpOutput).toContain('--validate-cdk');
      expect(helpOutput).toContain('json|html|yaml|cdk');
    });

    it('should include CDK examples in help text', () => {
      const program = createCLICommand(dependencies);
      const helpOutput = program.helpInformation();
      
      // Check for CDK output format support
      expect(helpOutput).toContain('json|html|yaml|cdk');
      expect(helpOutput).toContain('--cdk-output-dir');
      expect(helpOutput).toContain('--cdk-stack-name');
    });
  });

  describe('CDK Generation Routing', () => {
    it('should route to CDK generation when --output cdk is specified', async () => {
      // Create a spy on CDKOfficialGenerator to verify it's called
      const generateSpy = jest.spyOn(CDKOfficialGenerator.prototype, 'generate');
      
      // Mock the generate method to avoid actual file operations
      generateSpy.mockResolvedValue('export class TestStack extends cdk.Stack {}');
      
      const program = createCLICommand(dependencies);
      
      try {
        // Simulate CLI execution with CDK output
        await program.parseAsync([
          'node', 'script',
          'examples/web-application-stack.yaml',
          '--output', 'cdk'
        ], { from: 'node' });
        
        expect(generateSpy).toHaveBeenCalledTimes(1);
        
      } finally {
        generateSpy.mockRestore();
      }
    });

    it('should not affect standard JSON output mode (regression test)', async () => {
      const program = createCLICommand(dependencies);
      
      // Mock stdout to capture output
      const originalLog = console.log;
      let stdoutOutput = '';
      console.log = jest.fn((data: string) => {
        stdoutOutput += data;
      });
      
      try {
        await program.parseAsync([
          'node', 'script',
          'examples/web-application-stack.yaml',
          '--output', 'json'
        ], { from: 'node' });
        
        // Should have JSON output
        expect(stdoutOutput).toContain('"resources":');
        expect(JSON.parse(stdoutOutput)).toHaveProperty('resources');
        
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('CDK File Output', () => {
    it('should create file when output directory specified', async () => {
      const program = createCLICommand(dependencies);
      
      await program.parseAsync([
        'node', 'script',
        'examples/web-application-stack.yaml',
        '--output', 'cdk',
        '--cdk-output-dir', testOutputDir,
        '--resource-types', 'AWS::RDS::DBInstance'
      ], { from: 'node' });
      
      // Check that CDK file was created
      const expectedFilePath = path.join(testOutputDir, 'CloudWatchAlarmsStack.ts');
      
      // File should exist
      await expect(fs.access(expectedFilePath)).resolves.not.toThrow();
      
      // File should contain valid CDK code
      const content = await fs.readFile(expectedFilePath, 'utf-8');
      expect(content).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
      expect(content).toContain('import * as cdk from \'aws-cdk-lib\'');
    });

    it('should use custom stack name in filename and class', async () => {
      const program = createCLICommand(dependencies);
      const customStackName = 'MyCustomAlarmsStack';
      
      await program.parseAsync([
        'node', 'script',
        'examples/web-application-stack.yaml',
        '--output', 'cdk',
        '--cdk-output-dir', testOutputDir,
        '--cdk-stack-name', customStackName,
        '--resource-types', 'AWS::RDS::DBInstance'
      ], { from: 'node' });
      
      // Check custom filename
      const expectedFilePath = path.join(testOutputDir, `${customStackName}.ts`);
      await expect(fs.access(expectedFilePath)).resolves.not.toThrow();
      
      // Check custom class name in content
      const content = await fs.readFile(expectedFilePath, 'utf-8');
      expect(content).toContain(`export class ${customStackName} extends cdk.Stack`);
      expect(content).not.toContain('CloudWatchAlarmsStack');
    });

    it('should output to stdout when no output directory specified', async () => {
      const program = createCLICommand(dependencies);
      
      // Mock stdout to capture output
      const originalLog = console.log;
      let stdoutOutput = '';
      console.log = jest.fn((data: string) => {
        stdoutOutput += data;
      });
      
      try {
        await program.parseAsync([
          'node', 'script',
          'examples/web-application-stack.yaml',
          '--output', 'cdk',
          '--resource-types', 'AWS::RDS::DBInstance'
        ], { from: 'node' });
        
        // Should have CDK TypeScript code in stdout
        expect(stdoutOutput).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
        expect(stdoutOutput).toContain('import * as cdk from \'aws-cdk-lib\'');
        
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle CDK generation errors gracefully', async () => {
      const program = createCLICommand(dependencies);
      
      // Mock process.exit to prevent actual exit
      const originalExit = process.exit;
      let exitCode: number | undefined;
      process.exit = jest.fn((code?: number) => {
        exitCode = code;
        throw new Error(`Process exit called with code ${code ?? 0}`);
      }) as never;
      
      // Mock console.error to capture error output
      const originalError = console.error;
      let errorOutput = '';
      console.error = jest.fn((data: string) => {
        errorOutput += data;
      });
      
      try {
        await expect(program.parseAsync([
          'node', 'script',
          'nonexistent-template.yaml',
          '--output', 'cdk'
        ], { from: 'node' })).rejects.toThrow('Process exit called with code 1');
        
        expect(exitCode).toBe(1);
        expect(errorOutput).toContain('CDK Generation Error');
        
      } finally {
        process.exit = originalExit;
        console.error = originalError;
      }
    });
  });
});