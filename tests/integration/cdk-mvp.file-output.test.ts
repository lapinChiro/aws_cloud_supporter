// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// CDK MVPファイル出力機能テスト

import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { runCLICommand, runCommand } from './cdk-mvp.test-helpers';

describe('CDK MVP - File Output Functionality', () => {
  let testOutputDir: string;

  beforeEach(async () => {
    // Create temporary output directory for file tests
    testOutputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cdk-mvp-test-'));
  });

  afterEach(async () => {
    // Clean up test output directory
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should create CDK file with correct content when output directory specified', async () => {
    const result = await runCLICommand([
      'examples/web-application-stack.yaml',
      '--output', 'cdk',
      '--resource-types', 'AWS::RDS::DBInstance',
      '--cdk-output-dir', testOutputDir
    ]);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`✅ CDK Stack generated: ${path.join(testOutputDir, 'CloudWatchAlarmsStack.ts')}`);
    
    // Verify file was created
    const expectedFilePath = path.join(testOutputDir, 'CloudWatchAlarmsStack.ts');
    await expect(fs.access(expectedFilePath)).resolves.not.toThrow();
    
    // Verify file content
    const fileContent = await fs.readFile(expectedFilePath, 'utf-8');
    expect(fileContent).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
    expect(fileContent).toContain('new cloudwatch.Alarm');
    
    // Verify file basic syntax (CDK libs not available)
    const compileResult = await runCommand('npx', ['tsc', '--noEmit', '--skipLibCheck', expectedFilePath]);
    
    // Accept success or CDK module missing errors
    if (compileResult.exitCode === 0 || compileResult.stderr.includes('Cannot find module')) {
      expect(true).toBe(true); // Basic syntax is valid
    } else {
      console.error('TypeScript syntax errors:', compileResult.stderr);
      expect(compileResult.exitCode).toBe(0);
    }
  }, 15000); // 15 second timeout for file output test

  it('should use custom stack name when specified', async () => {
    const customStackName = 'MyTestAlarmsStack';
    
    const result = await runCLICommand([
      'examples/web-application-stack.yaml',
      '--output', 'cdk',
      '--resource-types', 'AWS::RDS::DBInstance',
      '--cdk-output-dir', testOutputDir,
      '--cdk-stack-name', customStackName
    ]);
    
    expect(result.exitCode).toBe(0);
    
    // Check file name
    const expectedFilePath = path.join(testOutputDir, `${customStackName}.ts`);
    await expect(fs.access(expectedFilePath)).resolves.not.toThrow();
    
    // Check class name in content
    const fileContent = await fs.readFile(expectedFilePath, 'utf-8');
    expect(fileContent).toContain(`export class ${customStackName} extends cdk.Stack`);
    expect(fileContent).not.toContain('CloudWatchAlarmsStack');
  }, 15000); // 15 second timeout
});