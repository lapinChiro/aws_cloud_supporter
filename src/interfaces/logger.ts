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
  error(message: string, error?: Error | unknown, ...args: unknown[]): void;
  
  /**
   * Log success message
   */
  success(message: string, ...args: unknown[]): void;
  
  /**
   * Set log level
   */
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void;
}