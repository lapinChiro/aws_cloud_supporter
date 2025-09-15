// CDK Full Features Integration Test Helpers
import { spawn } from 'child_process';
import * as path from 'path';

/**
 * Run CLI command with timeout
 */
export async function runCLICommand(
  args: string[], 
  timeoutMs: number = 30000
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    // Use built CLI directly to avoid npm output
    const cliPath = path.join(__dirname, '../../dist/cli/index.js');
    const child = spawn('node', [cliPath, ...args], {
      cwd: process.cwd(),
      // Ensure pipes are properly closed
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      // Force kill the process
      child.kill('SIGKILL');
      // Destroy streams
      child.stdout?.destroy();
      child.stderr?.destroy();
      reject(new Error(`Command timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    
    child.on('close', (code) => {
      clearTimeout(timeoutId);
      // Ensure streams are closed
      child.stdout?.destroy();
      child.stderr?.destroy();
      resolve({
        exitCode: code ?? 0,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });
    
    child.on('error', (error) => {
      clearTimeout(timeoutId);
      // Ensure process is killed and streams are closed
      child.kill('SIGKILL');
      child.stdout?.destroy();
      child.stderr?.destroy();
      reject(error);
    });
  });
}

/**
 * Extract JSON from CLI output
 */
export function extractJSONFromOutput(output: string): string {
  const lines = output.split('\n');
  
  // Find the first line that starts with '{'
  const jsonStartIndex = lines.findIndex(line => line.trim().startsWith('{'));
  if (jsonStartIndex === -1) {
    throw new Error('No JSON found in output');
  }
  
  // Return everything from the JSON start
  return lines.slice(jsonStartIndex).join('\n');
}