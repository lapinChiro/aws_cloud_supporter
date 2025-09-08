// CLAUDE.md準拠Logger（KISS原則、シンプル実装）

import { ILogger } from '../interfaces/logger';

// 型安全なログレベル定義（CLAUDE.md: No any types）
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// シンプルな色付き出力（CLAUDE.md: KISS、外部依存最小化）
const colors = {
  debug: (text: string) => `\x1b[36m${text}\x1b[0m`, // cyan
  info: (text: string) => `\x1b[32m${text}\x1b[0m`,  // green
  warn: (text: string) => `\x1b[33m${text}\x1b[0m`,  // yellow
  error: (text: string) => `\x1b[31m${text}\x1b[0m`, // red
  success: (text: string) => `\x1b[92m${text}\x1b[0m` // bright green
};

// CLAUDE.md準拠Loggerクラス（UNIX Philosophy: 一つのことをうまくやる）
export class Logger implements ILogger {
  constructor(
    private level: LogLevel = 'info',
    private useColors: boolean = true
  ) {}

  // デバッグメッセージ（開発時用）
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      this.output('debug', `🐛 ${message}`, ...args);
    }
  }

  // 情報メッセージ（通常運用）
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      this.output('info', `ℹ️  ${message}`, ...args);
    }
  }

  // 警告メッセージ（注意喚起）
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      this.output('warn', `⚠️  ${message}`, ...args);
    }
  }

  // エラーメッセージ（問題報告）
  error(message: string, error?: Error, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      if (error) {
        // エラーオブジェクトの安全な文字列化（YAMLWarning対応）
        let errorMessage = 'Unknown error';
        if (typeof error === 'object' && error !== null) {
          if ('message' in error && typeof error.message === 'string') {
            errorMessage = error.message;
          } else if ('toString' in error && typeof error.toString === 'function') {
            errorMessage = error.toString();
          } else {
            errorMessage = String(error);
          }
        } else {
          errorMessage = String(error);
        }
        
        this.output('error', `❌ ${message}`, errorMessage, ...args);
      } else {
        this.output('error', `❌ ${message}`, ...args);
      }
    }
  }

  // 成功メッセージ（処理完了）
  success(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      this.output('success', `✅ ${message}`, ...args);
    }
  }

  // ログレベル判定（CLAUDE.md: Type-Driven Development）
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    return levels[level] >= levels[this.level];
  }

  // 出力処理（型安全性重視）
  private output(level: LogLevel | 'success', message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const coloredMessage = this.useColors ? colors[level as keyof typeof colors](message) : message;
    
    // レベル別出力先（error/warnはstderr、他はstdout）
    const outputStream = (level === 'error' || level === 'warn') ? console.error : console.log;
    
    if (args.length > 0) {
      outputStream(`${timestamp} ${coloredMessage}`, ...args);
    } else {
      outputStream(`${timestamp} ${coloredMessage}`);
    }
  }

  // ログレベル変更（実行時調整用）
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  // 色使用設定変更
  setColorEnabled(enabled: boolean): void {
    this.useColors = enabled;
  }

  // 現在設定取得
  getConfig(): { level: LogLevel; useColors: boolean } {
    return {
      level: this.level,
      useColors: this.useColors
    };
  }
}

// ファクトリー関数（CLAUDE.md: 簡潔性）
export function createLogger(level: LogLevel = 'info', useColors: boolean = true): ILogger {
  return new Logger(level, useColors);
}

// 型安全なログレベル判定
export function isValidLogLevel(level: string): level is LogLevel {
  return ['debug', 'info', 'warn', 'error'].includes(level);
}