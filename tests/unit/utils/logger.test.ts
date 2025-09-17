/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// Logger実装のユニットテスト

import type { ILogger } from '../../../src/interfaces/logger';
import { Logger, createLogger, logger, log, type LogLevel } from '../../../src/utils/logger';

describe('Logger', () => {
  let testLogger: Logger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    testLogger = new Logger('debug', true);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-12-01T00:00:00.000Z');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create logger with default settings', () => {
      const defaultLogger = new Logger();
      const config = defaultLogger.getConfig();
      expect(config.level).toBe('info');
      expect(config.useColors).toBe(true);
    });

    it('should create logger with custom settings', () => {
      const customLogger = new Logger('error', false);
      const config = customLogger.getConfig();
      expect(config.level).toBe('error');
      expect(config.useColors).toBe(false);
    });
  });

  describe('log level filtering', () => {
    it('should log debug messages when level is debug', () => {
      testLogger.setLevel('debug');
      testLogger.debug('Debug message');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('🐛 Debug message')
      );
    });

    it('should not log debug messages when level is info', () => {
      testLogger.setLevel('info');
      testLogger.debug('Debug message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log all levels when set to debug', () => {
      testLogger.setLevel('debug');
      testLogger.debug('Debug');
      testLogger.info('Info');
      testLogger.warn('Warn');
      testLogger.error('Error');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // debug, info
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2); // warn, error
    });

    it('should only log errors when level is error', () => {
      testLogger.setLevel('error');
      testLogger.debug('Debug');
      testLogger.info('Info');
      testLogger.warn('Warn');
      testLogger.error('Error');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(0);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // only error
    });
  });

  describe('colored output', () => {
    it('should include color codes when colors are enabled', () => {
      testLogger.setColorEnabled(true);
      testLogger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\x1b\[32m.*\x1b\[0m/) // green color codes
      );
    });

    it('should not include color codes when colors are disabled', () => {
      testLogger.setColorEnabled(false);
      testLogger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.not.stringMatching(/\x1b\[/)
      );
    });
  });

  describe('error handling', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error');
      testLogger.error('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error occurred'),
        'Test error'
      );
    });

    it('should handle objects with message property', () => {
      const errorLike = { message: 'Custom error message' };
      testLogger.error('Error occurred', errorLike as Error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error occurred'),
        'Custom error message'
      );
    });

    it('should handle objects with toString method', () => {
      const errorLike = {
        toString: () => 'Error from toString'
      };
      testLogger.error('Error occurred', errorLike as Error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error occurred'),
        'Error from toString'
      );
    });

    it('should handle objects without message or toString', () => {
      const errorLike = { code: 'ERR001' };
      testLogger.error('Error occurred', errorLike as unknown as Error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error occurred'),
        '[object Object]'
      );
    });

    it('should handle non-object errors', () => {
      testLogger.error('Error occurred', 'string error' as unknown as Error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error occurred'),
        'string error'
      );
    });

    it('should handle null errors', () => {
      testLogger.error('Error occurred', null as unknown as Error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error occurred')
      );
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should log error without error object', () => {
      testLogger.error('Simple error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Simple error message')
      );
    });
  });

  describe('success messages', () => {
    it('should log success messages with info level', () => {
      testLogger.setLevel('info');
      testLogger.success('Operation completed');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Operation completed')
      );
    });

    it('should not log success messages when level is error', () => {
      testLogger.setLevel('error');
      testLogger.success('Operation completed');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('additional arguments', () => {
    it('should pass additional arguments to debug', () => {
      testLogger.debug('Debug', 'arg1', { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('🐛 Debug'),
        'arg1',
        { key: 'value' }
      );
    });

    it('should pass additional arguments to info', () => {
      testLogger.info('Info', 123, true);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️  Info'),
        123,
        true
      );
    });

    it('should pass additional arguments to warn', () => {
      testLogger.warn('Warning', ['array']);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️  Warning'),
        ['array']
      );
    });

    it('should pass additional arguments to error with error object', () => {
      const error = new Error('Test');
      testLogger.error('Error', error, 'extra', 123);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error'),
        'Test',
        'extra',
        123
      );
    });
  });

  describe('CLI methods', () => {
    describe('plain', () => {
      it('should output plain message without timestamp', () => {
        testLogger.plain('Plain message');
        expect(consoleLogSpy).toHaveBeenCalledWith('Plain message');
        expect(consoleLogSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('2023-12-01')
        );
      });

      it('should output plain message with arguments', () => {
        testLogger.plain('Message with', 'args', 123);
        expect(consoleLogSpy).toHaveBeenCalledWith('Message with', 'args', 123);
      });
    });

    describe('stats', () => {
      it('should display statistics', () => {
        testLogger.stats('Build Statistics', {
          Files: 10,
          Size: '2.5MB',
          Duration: '5s'
        });
        
        expect(consoleLogSpy).toHaveBeenCalledWith('\n📊 Build Statistics:');
        expect(consoleLogSpy).toHaveBeenCalledWith('   Files: 10');
        expect(consoleLogSpy).toHaveBeenCalledWith('   Size: 2.5MB');
        expect(consoleLogSpy).toHaveBeenCalledWith('   Duration: 5s');
      });
    });

    describe('list', () => {
      it('should display string list', () => {
        testLogger.list('Features', ['Feature 1', 'Feature 2', 'Feature 3']);
        
        expect(consoleLogSpy).toHaveBeenCalledWith('\nFeatures:');
        expect(consoleLogSpy).toHaveBeenCalledWith('   - Feature 1');
        expect(consoleLogSpy).toHaveBeenCalledWith('   - Feature 2');
        expect(consoleLogSpy).toHaveBeenCalledWith('   - Feature 3');
      });

      it('should display object list', () => {
        testLogger.list('Metrics', [
          { label: 'CPU', value: '45%' },
          { label: 'Memory', value: 1024 },
          { label: 'Disk', value: '80%' }
        ]);
        
        expect(consoleLogSpy).toHaveBeenCalledWith('\nMetrics:');
        expect(consoleLogSpy).toHaveBeenCalledWith('   CPU: 45%');
        expect(consoleLogSpy).toHaveBeenCalledWith('   Memory: 1024');
        expect(consoleLogSpy).toHaveBeenCalledWith('   Disk: 80%');
      });
    });

    describe('errorList', () => {
      it('should display error list', () => {
        testLogger.errorList('Validation Errors', [
          'Invalid template format',
          'Missing required field',
          'Type mismatch'
        ]);
        
        expect(consoleErrorSpy).toHaveBeenCalledWith('\n❌ Validation Errors:');
        expect(consoleErrorSpy).toHaveBeenCalledWith('  - Invalid template format');
        expect(consoleErrorSpy).toHaveBeenCalledWith('  - Missing required field');
        expect(consoleErrorSpy).toHaveBeenCalledWith('  - Type mismatch');
      });
    });

    describe('warnList', () => {
      it('should display warning list', () => {
        testLogger.warnList('Deprecation Warnings', [
          'Method X is deprecated',
          'Configuration Y will be removed'
        ]);
        
        expect(consoleWarnSpy).toHaveBeenCalledWith('\n⚠️  Deprecation Warnings:');
        expect(consoleWarnSpy).toHaveBeenCalledWith('  - Method X is deprecated');
        expect(consoleWarnSpy).toHaveBeenCalledWith('  - Configuration Y will be removed');
      });
    });

    describe('infoList', () => {
      it('should display info list', () => {
        testLogger.infoList('Tips', [
          'Use --verbose for more details',
          'Check documentation for examples'
        ]);
        
        expect(consoleLogSpy).toHaveBeenCalledWith('\n💡 Tips:');
        expect(consoleLogSpy).toHaveBeenCalledWith('  - Use --verbose for more details');
        expect(consoleLogSpy).toHaveBeenCalledWith('  - Check documentation for examples');
      });
    });

    describe('fileSaved', () => {
      it('should display file saved message', () => {
        testLogger.fileSaved('/path/to/report.html');
        expect(consoleLogSpy).toHaveBeenCalledWith('✅ Report saved: /path/to/report.html');
      });
    });

    describe('plainError', () => {
      it('should display plain error without error object', () => {
        testLogger.plainError('Operation failed');
        expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Operation failed');
      });

      it('should display plain error with error details', () => {
        const error = new Error('Connection timeout');
        error.stack = 'Error: Connection timeout\n    at connect (file.js:10:15)';
        
        testLogger.plainError('Network error', error);
        
        expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Network error');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Details:', 'Connection timeout');
        expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack);
      });

      it('should handle error without stack', () => {
        const error = new Error('Simple error');
        delete error.stack;
        
        testLogger.plainError('Error occurred', error);
        
        expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error occurred');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Details:', 'Simple error');
        expect(consoleErrorSpy).toHaveBeenCalledTimes(2); // No stack trace call
      });
    });

    describe('plainWarn', () => {
      it('should display plain warning', () => {
        testLogger.plainWarn('This is a warning');
        expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️  This is a warning');
      });
    });
  });

  describe('configuration methods', () => {
    it('should change log level', () => {
      testLogger.setLevel('warn');
      const config = testLogger.getConfig();
      expect(config.level).toBe('warn');
    });

    it('should change color setting', () => {
      testLogger.setColorEnabled(false);
      const config = testLogger.getConfig();
      expect(config.useColors).toBe(false);
    });

    it('should return current configuration', () => {
      testLogger.setLevel('error');
      testLogger.setColorEnabled(false);
      
      const config = testLogger.getConfig();
      expect(config).toEqual({
        level: 'error',
        useColors: false
      });
    });
  });
});

describe('createLogger factory', () => {
  it('should create logger with default settings', () => {
    const factoryLogger = createLogger();
    expect(factoryLogger).toBeInstanceOf(Logger);
    const config = factoryLogger.getConfig();
    expect(config.level).toBe('info');
    expect(config.useColors).toBe(true);
  });

  it('should create logger with custom settings', () => {
    const factoryLogger = createLogger('warn', false);
    expect(factoryLogger).toBeInstanceOf(Logger);
    const config = factoryLogger.getConfig();
    expect(config.level).toBe('warn');
    expect(config.useColors).toBe(false);
  });
});

describe('default logger instance', () => {
  it('should have info level and colors enabled', () => {
    const config = logger.getConfig();
    expect(config.level).toBe('info');
    expect(config.useColors).toBe(true);
  });
});

describe('log convenience functions', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    logger.setLevel('debug'); // Ensure all messages are logged
  });

  afterEach(() => {
    jest.restoreAllMocks();
    logger.setLevel('info'); // Reset to default
  });

  describe('basic log methods', () => {
    it('should call logger.debug', () => {
      log.debug('Debug message', 'arg1');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('🐛 Debug message'),
        'arg1'
      );
    });

    it('should call logger.info', () => {
      log.info('Info message', 123);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️  Info message'),
        123
      );
    });

    it('should call logger.warn', () => {
      log.warn('Warning message', true);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️  Warning message'),
        true
      );
    });

    it('should call logger.error', () => {
      const error = new Error('Test error');
      log.error('Error message', error, 'extra');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error message'),
        'Test error',
        'extra'
      );
    });

    it('should call logger.success', () => {
      log.success('Success message', { result: 'ok' });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Success message'),
        { result: 'ok' }
      );
    });
  });

  describe('CLI methods', () => {
    it('should call logger.plain', () => {
      log.plain('Plain text', 'with', 'args');
      expect(consoleLogSpy).toHaveBeenCalledWith('Plain text', 'with', 'args');
    });

    it('should call logger.stats', () => {
      log.stats('Stats', { count: 10, size: '1MB' });
      expect(consoleLogSpy).toHaveBeenCalledWith('\n📊 Stats:');
      expect(consoleLogSpy).toHaveBeenCalledWith('   count: 10');
    });

    it('should call logger.list', () => {
      log.list('Items', ['item1', 'item2']);
      expect(consoleLogSpy).toHaveBeenCalledWith('\nItems:');
      expect(consoleLogSpy).toHaveBeenCalledWith('   - item1');
    });

    it('should call logger.errorList', () => {
      log.errorList('Errors', ['error1', 'error2']);
      expect(consoleErrorSpy).toHaveBeenCalledWith('\n❌ Errors:');
      expect(consoleErrorSpy).toHaveBeenCalledWith('  - error1');
    });

    it('should call logger.warnList', () => {
      log.warnList('Warnings', ['warn1', 'warn2']);
      expect(consoleWarnSpy).toHaveBeenCalledWith('\n⚠️  Warnings:');
      expect(consoleWarnSpy).toHaveBeenCalledWith('  - warn1');
    });

    it('should call logger.infoList', () => {
      log.infoList('Info', ['info1', 'info2']);
      expect(consoleLogSpy).toHaveBeenCalledWith('\n💡 Info:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  - info1');
    });

    it('should call logger.fileSaved', () => {
      log.fileSaved('/path/to/file');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Report saved: /path/to/file');
    });

    it('should call logger.plainError', () => {
      const error = new Error('Test');
      log.plainError('Plain error', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Plain error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Details:', 'Test');
    });

    it('should call logger.plainWarn', () => {
      log.plainWarn('Plain warning');
      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️  Plain warning');
    });
  });
});

// Type safety tests
describe('Type Safety', () => {
  it('should only accept valid log levels', () => {
    const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    
    validLevels.forEach(level => {
      expect(() => new Logger(level)).not.toThrow();
    });
  });

  it('should implement ILogger interface', () => {
    const testLogger: ILogger = new Logger();
    
    // All methods should be available
    expect(typeof testLogger.debug).toBe('function');
    expect(typeof testLogger.info).toBe('function');
    expect(typeof testLogger.warn).toBe('function');
    expect(typeof testLogger.error).toBe('function');
    expect(typeof testLogger.success).toBe('function');
    expect(typeof testLogger.setLevel).toBe('function');
    expect(typeof testLogger.setColorEnabled).toBe('function');
    expect(typeof testLogger.getConfig).toBe('function');
    expect(typeof testLogger.plain).toBe('function');
    expect(typeof testLogger.stats).toBe('function');
    expect(typeof testLogger.list).toBe('function');
    expect(typeof testLogger.errorList).toBe('function');
    expect(typeof testLogger.warnList).toBe('function');
    expect(typeof testLogger.infoList).toBe('function');
    expect(typeof testLogger.fileSaved).toBe('function');
    expect(typeof testLogger.plainError).toBe('function');
    expect(typeof testLogger.plainWarn).toBe('function');
  });
});