// CDK Full Features Integration Test Helpers
import { spawn } from 'child_process';

/**
 * Run CLI command with timeout
 */
export async function runCLICommand(
  args: string[], 
  timeoutMs: number = 30000
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'dev', '--', ...args], {
      cwd: process.cwd()
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        exitCode: code ?? 0,
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