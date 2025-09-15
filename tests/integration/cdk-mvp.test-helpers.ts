// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// CDK MVP統合テストヘルパー関数

import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import * as path from 'path';

// Helper function to run CLI commands
export async function runCLICommand(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    // Use built CLI directly to avoid npm output
    const cliPath = path.join(__dirname, '../../dist/cli/index.js');
    const child: ChildProcess = spawn('node', [cliPath, ...args], {
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
    
    // Set timeout for long-running commands
    const timeoutId = setTimeout(() => {
      // Force kill the process
      child.kill('SIGKILL');
      // Destroy streams
      child.stdout?.destroy();
      child.stderr?.destroy();
      reject(new Error('Command timeout'));
    }, 30000);
    
    child.on('close', (code: number | null) => {
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
    
    child.on('error', (error: Error) => {
      clearTimeout(timeoutId);
      // Ensure process is killed and streams are closed
      child.kill('SIGKILL');
      child.stdout?.destroy();
      child.stderr?.destroy();
      reject(error);
    });
  });
}

// Helper function to run arbitrary commands
export async function runCommand(command: string, args: string[], timeout = 30000): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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
      reject(new Error('Command timeout'));
    }, timeout);
    
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

// Helper function to extract JSON from npm run output
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