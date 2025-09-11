// CLAUDE.md準拠Logger（KISS原則、シンプル実装）

import type { ILogger } from '../interfaces/logger';

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
    // eslint-disable-next-line no-console
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

  // CLI専用メソッド群 - プレーンな出力（タイムスタンプなし）
  
  // プレーンメッセージ出力（CLIアプリの標準出力用）
  plain(message: string, ...args: unknown[]): void {
    // eslint-disable-next-line no-console
    if (args.length > 0) {
      console.log(message, ...args);
    } else {
      console.log(message);
    }
  }

  // 統計情報表示
  stats(title: string, stats: Record<string, string | number>): void {
    // eslint-disable-next-line no-console
    console.log(`\n📊 ${title}:`);
    Object.entries(stats).forEach(([key, value]) => {
      // eslint-disable-next-line no-console
      console.log(`   ${key}: ${value}`);
    });
  }

  // リスト表示
  list(title: string, items: Array<string | { label: string; value: string | number }>): void {
    // eslint-disable-next-line no-console
    console.log(`\n${title}:`);
    items.forEach(item => {
      if (typeof item === 'string') {
        // eslint-disable-next-line no-console
        console.log(`   - ${item}`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`   ${item.label}: ${item.value}`);
      }
    });
  }

  // エラーリスト表示
  errorList(title: string, errors: string[]): void {
    // eslint-disable-next-line no-console
    console.error(`\n❌ ${title}:`);
    errors.forEach(error => {
      // eslint-disable-next-line no-console
      console.error(`  - ${error}`);
    });
  }

  // 警告リスト表示  
  warnList(title: string, warnings: string[]): void {
    // eslint-disable-next-line no-console
    console.warn(`\n⚠️  ${title}:`);
    warnings.forEach(warning => {
      // eslint-disable-next-line no-console
      console.warn(`  - ${warning}`);
    });
  }

  // 情報リスト表示
  infoList(title: string, items: string[]): void {
    // eslint-disable-next-line no-console
    console.log(`\n💡 ${title}:`);
    items.forEach(item => {
      // eslint-disable-next-line no-console
      console.log(`  - ${item}`);
    });
  }

  // ファイル保存成功
  fileSaved(filePath: string): void {
    // eslint-disable-next-line no-console
    console.log(`✅ Report saved: ${filePath}`);
  }

  // プレーンエラー出力（CLIエラー処理用）
  plainError(message: string, error?: Error): void {
    // eslint-disable-next-line no-console
    console.error(`❌ ${message}`);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Details:', error.message);
      if (error.stack) {
        // eslint-disable-next-line no-console
        console.error(error.stack);
      }
    }
  }

  // プレーン警告出力
  plainWarn(message: string): void {
    // eslint-disable-next-line no-console
    console.warn(`⚠️  ${message}`);
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

// デフォルトLoggerインスタンス（プロジェクト全体で共用）
export const logger = new Logger('info', true);

// CLIアプリケーション用のコンビニエンス関数
export const log = {
  // 基本ログメソッド
  debug: (message: string, ...args: unknown[]) => logger.debug(message, ...args),
  info: (message: string, ...args: unknown[]) => logger.info(message, ...args),
  warn: (message: string, ...args: unknown[]) => logger.warn(message, ...args),
  error: (message: string, error?: Error, ...args: unknown[]) => logger.error(message, error, ...args),
  success: (message: string, ...args: unknown[]) => logger.success(message, ...args),
  
  // CLI専用メソッド
  plain: (message: string, ...args: unknown[]) => logger.plain(message, ...args),
  stats: (title: string, stats: Record<string, string | number>) => logger.stats(title, stats),
  list: (title: string, items: Array<string | { label: string; value: string | number }>) => 
    logger.list(title, items),
  errorList: (title: string, errors: string[]) => logger.errorList(title, errors),
  warnList: (title: string, warnings: string[]) => logger.warnList(title, warnings),
  infoList: (title: string, items: string[]) => logger.infoList(title, items),
  fileSaved: (filePath: string) => logger.fileSaved(filePath),
  plainError: (message: string, error?: Error) => logger.plainError(message, error),
  plainWarn: (message: string) => logger.plainWarn(message)
};