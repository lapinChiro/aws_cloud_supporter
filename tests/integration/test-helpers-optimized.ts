// 最適化されたテストヘルパー - コンパイル済みCLIを使用
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

// ビルド済みCLIのパス
const CLI_PATH = path.join(__dirname, '../../dist/cli/index.js');

// ビルド状態を追跡
let isBuilt = false;

/**
 * CLIが既にビルドされているか確認し、必要に応じてビルド
 */
export async function ensureCLIBuilt(): Promise<void> {
  if (isBuilt) return;
  
  try {
    await fs.access(CLI_PATH);
    // eslint-disable-next-line no-console
    console.log('CLI already built');
    isBuilt = true;
  } catch {
    // eslint-disable-next-line no-console
    console.log('Building CLI for tests...');
    const { execSync } = await import('child_process');
    execSync('npm run build', { stdio: 'inherit' });
    isBuilt = true;
  }
}

/**
 * 最適化されたCLIコマンド実行
 * TypeScriptコンパイルをスキップし、ビルド済みのJSを直接実行
 */
export async function runCLICommandOptimized(
  args: string[], 
  timeout = 10000
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  // CLIがビルドされていることを確認
  await ensureCLIBuilt();
  
  return new Promise((resolve, reject) => {
    const child = spawn('node', [CLI_PATH, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'test' },
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
    
    // タイムアウト設定（デフォルト10秒、以前の30秒から短縮）
    const timeoutId = setTimeout(() => {
      // Force kill the process
      child.kill('SIGKILL');
      // Destroy streams
      child.stdout?.destroy();
      child.stderr?.destroy();
      reject(new Error(`Command timeout after ${timeout}ms`));
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

/**
 * 既存のrunCLICommandとの互換性のためのエイリアス
 */
export const runCLICommand = runCLICommandOptimized;

/**
 * 複数のCLIコマンドを並列実行
 */
export async function runCLICommandsParallel(
  commands: Array<{ args: string[]; timeout?: number }>
): Promise<Array<{ exitCode: number; stdout: string; stderr: string }>> {
  await ensureCLIBuilt();
  
  const promises = commands.map(cmd => 
    runCLICommandOptimized(cmd.args, cmd.timeout)
  );
  
  return Promise.all(promises);
}

/**
 * インメモリでCLIコマンドを実行（プロセス起動なし）
 * 最も高速だが、完全な統合テストにはならない
 */
export async function runCLIInMemory(args: string[]): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  // stdoutとstderrをキャプチャ
  const originalWrite = process.stdout.write;
  const originalError = process.stderr.write;
  let stdout = '';
  let stderr = '';
  
  process.stdout.write = (chunk: string | Uint8Array): boolean => {
    stdout += chunk.toString();
    return true;
  };
  
  process.stderr.write = (chunk: string | Uint8Array): boolean => {
    stderr += chunk.toString();
    return true;
  };
  
  try {
    // CLIを直接インポートして実行
    const { createCLICommand } = await import('../../src/cli/commands');
    const { MetricsAnalyzer } = await import('../../src/core/analyzer');
    const { TemplateParser } = await import('../../src/core/parser');
    const { JSONOutputFormatter } = await import('../../src/core/json-formatter');
    const { HTMLOutputFormatter } = await import('../../src/core/formatters/html');
    const { Logger } = await import('../../src/utils/logger');
    
    const logger = new Logger();
    const parser = new TemplateParser();
    const analyzer = new MetricsAnalyzer(parser, logger);
    const jsonFormatter = new JSONOutputFormatter();
    const htmlFormatter = new HTMLOutputFormatter();
    
    const program = createCLICommand({
      analyzer,
      parser,
      jsonFormatter,
      htmlFormatter,
      logger
    });
    
    // process.exit をモック
    const originalExit = process.exit;
    let exitCode = 0;
    process.exit = ((code?: number) => {
      exitCode = code ?? 0;
      throw new Error('EXIT');
    }) as never;
    
    try {
      await program.parseAsync(['node', 'cli', ...args]);
    } catch (error) {
      if ((error as Error).message !== 'EXIT') {
        throw error;
      }
    } finally {
      process.exit = originalExit;
    }
    
    return {
      exitCode,
      stdout: stdout.trim(),
      stderr: stderr.trim()
    };
    
  } finally {
    // 元に戻す
    process.stdout.write = originalWrite;
    process.stderr.write = originalError;
  }
}