// エラーハンドリング追加テスト（カバレッジ改善）
// CLAUDE.md準拠: No any types、TDD実践

import { 
  ErrorHandler, 
  CloudSupporterError, 
  ErrorType,
  createFileError,
  createParseError,
  createResourceError,
  createOutputError,
  isFileError,
  isParseError,
  isResourceError,
  isOutputError,
  logError
} from '../../../src/utils/error';

// Mock console methods
const originalConsoleError = console.error;
const originalProcessExit = process.exit;

describe('ErrorHandler Coverage Tests', () => {
  let mockConsoleError: jest.Mock;
  let mockProcessExit: jest.Mock;

  beforeEach(() => {
    mockConsoleError = jest.fn();
    mockProcessExit = jest.fn();
    console.error = mockConsoleError;
    process.exit = mockProcessExit as never;
  });

  afterEach(() => {
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  describe('ErrorHandler.handle', () => {
    test('should handle CloudSupporterError with all fields', () => {
      const error = new CloudSupporterError(
        ErrorType.FILE_ERROR,
        'File not found',
        { fileSize: 0, permissions: 'r--' },
        '/path/to/file.yaml',
        42
      );

      ErrorHandler.handle(error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('❌ File not found')
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('/path/to/file.yaml:42')
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('fileSize')
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('💡 Check if file exists and has read permissions')
      );
      
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test('should handle CloudSupporterError without optional fields', () => {
      const error = new CloudSupporterError(
        ErrorType.PARSE_ERROR,
        'Invalid syntax'
      );

      ErrorHandler.handle(error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('❌ Invalid syntax')
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('💡 Validate CloudFormation template syntax')
      );
      expect(mockProcessExit).toHaveBeenCalledWith(2);
    });

    test('should handle unexpected errors', () => {
      const error = new Error('Unexpected error');
      
      ErrorHandler.handle(error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected error')
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected error')
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test('should handle errors with stack traces', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at Object.<anonymous> (test.js:1:1)';
      
      ErrorHandler.handle(error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('❌ Unexpected error: Test error')
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test('should provide correct suggestions for each error type', () => {
      const errorTypes = [
        { type: ErrorType.FILE_ERROR, suggestion: 'Check if file exists and has read permissions' },
        { type: ErrorType.PARSE_ERROR, suggestion: 'Validate CloudFormation template syntax using \'cfn-lint\' or AWS CloudFormation Designer' },
        { type: ErrorType.RESOURCE_ERROR, suggestion: 'Verify resource properties match AWS CloudFormation specification' },
        { type: ErrorType.OUTPUT_ERROR, suggestion: 'Check output directory exists and has write permissions' }
      ];

      errorTypes.forEach(({ type, suggestion }) => {
        mockConsoleError.mockClear();
        const error = new CloudSupporterError(type, 'Test error');
        
        ErrorHandler.handle(error);
        
        expect(mockConsoleError).toHaveBeenCalledWith(
          expect.stringContaining(`💡 ${suggestion}`)
        );
      });
    });

    test('should use correct exit codes', () => {
      const exitCodes = [
        { type: ErrorType.FILE_ERROR, code: 1 },
        { type: ErrorType.PARSE_ERROR, code: 2 },
        { type: ErrorType.RESOURCE_ERROR, code: 3 },
        { type: ErrorType.OUTPUT_ERROR, code: 4 }
      ];

      exitCodes.forEach(({ type, code }) => {
        mockProcessExit.mockClear();
        const error = new CloudSupporterError(type, 'Test');
        
        ErrorHandler.handle(error);
        
        expect(mockProcessExit).toHaveBeenCalledWith(code);
      });
    });
  });

  describe('ErrorHandler.logError', () => {
    test('should log error details', () => {
      const error = new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'Invalid resource',
        { resourceType: 'AWS::EC2::Instance' }
      );

      ErrorHandler.logError(error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('CloudSupporterError:'),
        expect.objectContaining({
          error: 'RESOURCE_ERROR',
          message: 'Invalid resource'
        })
      );
      expect(mockConsoleError).not.toHaveBeenCalledWith(
        expect.stringContaining('Check output directory') // No suggestion in logError
      );
    });

    test('should handle non-CloudSupporterError', () => {
      const error = new TypeError('Type mismatch');
      
      ErrorHandler.logError(error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error:'),
        expect.objectContaining({
          message: 'Type mismatch',
          name: 'TypeError'
        })
      );
    });
  });
});

describe('CloudSupporterError', () => {
  test('should create error with all properties', () => {
    const error = new CloudSupporterError(
      ErrorType.FILE_ERROR,
      'Test message',
      { test: true },
      '/path/file.yaml',
      10
    );

    expect(error.name).toBe('CloudSupporterError');
    expect(error.type).toBe(ErrorType.FILE_ERROR);
    expect(error.message).toBe('Test message');
    expect(error.details).toEqual({ test: true });
    expect(error.filePath).toBe('/path/file.yaml');
    expect(error.lineNumber).toBe(10);
  });

  test('toStructuredOutput should return complete structure', () => {
    const error = new CloudSupporterError(
      ErrorType.PARSE_ERROR,
      'Parse failed',
      { syntax: 'invalid' },
      'template.yaml',
      25
    );

    const output = error.toStructuredOutput();

    expect(output.error).toBe('PARSE_ERROR');
    expect(output.message).toBe('Parse failed');
    expect(output.details).toEqual({ syntax: 'invalid' });
    expect(output.filePath).toBe('template.yaml');
    expect(output.lineNumber).toBe(25);
    expect(output.timestamp).toBeDefined();
    expect(new Date(output.timestamp)).toBeInstanceOf(Date);
  });

  test('should capture stack trace', () => {
    const error = new CloudSupporterError(
      ErrorType.OUTPUT_ERROR,
      'Output failed'
    );

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('CloudSupporterError');
    expect(error.stack).toContain('Output failed');
  });
});

describe('Error Helper Functions', () => {
  describe('createFileError', () => {
    test('should create file error with all parameters', () => {
      const error = createFileError('File missing', '/path.yaml', { size: 0 });
      
      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.type).toBe(ErrorType.FILE_ERROR);
      expect(error.message).toBe('File missing');
      expect(error.filePath).toBe('/path.yaml');
      expect(error.details).toEqual({ size: 0 });
    });

    test('should create file error with minimal parameters', () => {
      const error = createFileError('File missing');
      
      expect(error.type).toBe(ErrorType.FILE_ERROR);
      expect(error.filePath).toBeUndefined();
      expect(error.details).toBeUndefined();
    });
  });

  describe('createParseError', () => {
    test('should create parse error with line number', () => {
      const error = createParseError('Syntax error', 'file.yaml', 10, { col: 5 });
      
      expect(error.type).toBe(ErrorType.PARSE_ERROR);
      expect(error.filePath).toBe('file.yaml');
      expect(error.lineNumber).toBe(10);
      expect(error.details).toEqual({ col: 5 });
    });
  });

  describe('createResourceError', () => {
    test('should create resource error', () => {
      const error = createResourceError('Invalid type', { type: 'AWS::Custom' });
      
      expect(error.type).toBe(ErrorType.RESOURCE_ERROR);
      expect(error.message).toBe('Invalid type');
      expect(error.details).toEqual({ type: 'AWS::Custom' });
    });
  });

  describe('createOutputError', () => {
    test('should create output error', () => {
      const error = createOutputError('Write failed', { path: '/out.json' });
      
      expect(error.type).toBe(ErrorType.OUTPUT_ERROR);
      expect(error.message).toBe('Write failed');
      expect(error.details).toEqual({ path: '/out.json' });
    });
  });
});

describe('Type Guard Functions', () => {
  test('isFileError should correctly identify file errors', () => {
    const fileError = createFileError('test');
    const parseError = createParseError('test');
    const normalError = new Error('test');
    
    expect(isFileError(fileError)).toBe(true);
    expect(isFileError(parseError)).toBe(false);
    expect(isFileError(normalError)).toBe(false);
    expect(isFileError(null)).toBe(false);
    expect(isFileError(undefined)).toBe(false);
    expect(isFileError({ type: ErrorType.FILE_ERROR })).toBe(false);
  });

  test('isParseError should correctly identify parse errors', () => {
    const parseError = createParseError('test');
    const fileError = createFileError('test');
    
    expect(isParseError(parseError)).toBe(true);
    expect(isParseError(fileError)).toBe(false);
    expect(isParseError(new Error())).toBe(false);
  });

  test('isResourceError should correctly identify resource errors', () => {
    const resourceError = createResourceError('test');
    const outputError = createOutputError('test');
    
    expect(isResourceError(resourceError)).toBe(true);
    expect(isResourceError(outputError)).toBe(false);
  });

  test('isOutputError should correctly identify output errors', () => {
    const outputError = createOutputError('test');
    const fileError = createFileError('test');
    
    expect(isOutputError(outputError)).toBe(true);
    expect(isOutputError(fileError)).toBe(false);
  });
});

describe('logError Function', () => {
  let mockConsoleError: jest.Mock;

  beforeEach(() => {
    mockConsoleError = jest.fn();
    console.error = mockConsoleError;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  test('should log error using ErrorHandler', () => {
    const error = createFileError('Test error');
    
    logError(error);
    
    expect(mockConsoleError).toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('CloudSupporterError:'),
      expect.objectContaining({
        error: 'FILE_ERROR'
      })
    );
  });

  test('should handle string errors', () => {
    logError('Simple error message');
    
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('Error: Simple error message')
    );
  });
});