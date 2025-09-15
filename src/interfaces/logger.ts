// CLAUDE.md準拠: Interface Segregation Principle
// Logger interface

/**
 * Logger interface
 * SOLID原則: Interface Segregation
 */
export interface ILogger {
  /**
   * Log debug message
   */
  debug(message: string, ...args: unknown[]): void;
  
  /**
   * Log info message
   */
  info(message: string, ...args: unknown[]): void;
  
  /**
   * Log warning message
   */
  warn(message: string, ...args: unknown[]): void;
  
  /**
   * Log error message
   */
  error(message: string, error?: unknown, ...args: unknown[]): void;
  
  /**
   * Log success message
   */
  success(message: string, ...args: unknown[]): void;
  
  /**
   * Set log level
   */
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void;
  
  /**
   * Set color enabled
   */
  setColorEnabled(enabled: boolean): void;
  
  /**
   * Get configuration
   */
  getConfig(): { level: 'debug' | 'info' | 'warn' | 'error'; useColors: boolean };
  
  /**
   * Plain output (no timestamp)
   */
  plain(message: string, ...args: unknown[]): void;
  
  /**
   * Show statistics
   */
  stats(title: string, stats: Record<string, string | number>): void;
  
  /**
   * Show list
   */
  list(title: string, items: Array<string | { label: string; value: string | number }>): void;
  
  /**
   * Show error list
   */
  errorList(title: string, errors: string[]): void;
  
  /**
   * Show warning list
   */
  warnList(title: string, warnings: string[]): void;
  
  /**
   * Show info list
   */
  infoList(title: string, items: string[]): void;
  
  /**
   * File saved message
   */
  fileSaved(filePath: string): void;
  
  /**
   * Plain error output
   */
  plainError(message: string, error?: Error): void;
  
  /**
   * Plain warning output
   */
  plainWarn(message: string): void;
}