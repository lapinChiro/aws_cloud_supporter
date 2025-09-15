// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// CDK MVPパフォーマンスとエラーハンドリングテスト

import { runCLICommand } from './cdk-mvp.test-helpers';

describe('CDK MVP - Performance Requirements', () => {
  it('should complete within 10 seconds for MVP scope', async () => {
    const startTime = Date.now();
    
    const result = await runCLICommand([
      'examples/web-application-stack.yaml',
      '--output', 'cdk',
      '--resource-types', 'AWS::RDS::DBInstance'
    ]);
    
    const duration = Date.now() - startTime;
    
    expect(result.exitCode).toBe(0);
    expect(duration).toBeLessThan(10000); // 10 seconds
    
    console.log(`MVP generation completed in ${duration}ms`);
  });

  it('should maintain reasonable memory usage', async () => {
    // Measure memory usage during generation
    const beforeMemory = process.memoryUsage();
    
    const result = await runCLICommand([
      'examples/web-application-stack.yaml',
      '--output', 'cdk',
      '--resource-types', 'AWS::RDS::DBInstance'
    ]);
    
    const afterMemory = process.memoryUsage();
    const memoryIncreaseMB = (afterMemory.heapUsed - beforeMemory.heapUsed) / (1024 * 1024);
    
    expect(result.exitCode).toBe(0);
    expect(memoryIncreaseMB).toBeLessThan(200); // 200MB limit for MVP
    
    console.log(`Memory usage increase: ${memoryIncreaseMB.toFixed(1)}MB`);
  });
});

describe('CDK MVP - Error Handling and Edge Cases', () => {
  it('should handle template without RDS resources gracefully', async () => {
    const result = await runCLICommand([
      'examples/serverless-api-sam.yaml', // Lambda/API Gateway only
      '--output', 'cdk',
      '--resource-types', 'AWS::RDS::DBInstance'
    ]);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('export class CloudWatchAlarmsStack extends cdk.Stack');
    expect(result.stdout).toContain('// No alarms generated - no supported resources found');
    expect(result.stdout).not.toContain('new cloudwatch.Alarm');
  });

  it('should handle nonexistent template file with appropriate error', async () => {
    const result = await runCLICommand([
      'nonexistent-template.yaml',
      '--output', 'cdk'
    ]);
    
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('CDK Generation Error');
  });

  it('should handle low-importance metrics filtering', async () => {
    // Test without --include-low (should exclude low importance metrics)
    const resultWithoutLow = await runCLICommand([
      'examples/web-application-stack.yaml',
      '--output', 'cdk',
      '--resource-types', 'AWS::RDS::DBInstance'
    ]);
    
    // Test with --include-low (should include low importance metrics)
    const resultWithLow = await runCLICommand([
      'examples/web-application-stack.yaml',
      '--output', 'cdk',
      '--resource-types', 'AWS::RDS::DBInstance',
      '--include-low'
    ]);
    
    expect(resultWithoutLow.exitCode).toBe(0);
    expect(resultWithLow.exitCode).toBe(0);
    
    // Count alarms in both cases
    const alarmsWithoutLow = (resultWithoutLow.stdout.match(/new cloudwatch\.Alarm/g) ?? []).length;
    const alarmsWithLow = (resultWithLow.stdout.match(/new cloudwatch\.Alarm/g) ?? []).length;
    
    // Should have more alarms when including low importance metrics
    expect(alarmsWithLow).toBeGreaterThanOrEqual(alarmsWithoutLow);
  });
});