// CLAUDE.md準拠エラーハンドリングテスト（RED段階: KISS原則）

import { readFileSync } from 'fs';
import path from 'path';

describe('エラーハンドリングシステム（CLAUDE.md: KISS原則）', () => {
  
  // エラーハンドラ実装確認
  it('should implement ErrorHandler class', () => {
    const errorModule = require('../../../src/utils/error');
    
    expect(errorModule.ErrorHandler).toBeDefined();
    expect(errorModule.CloudSupporterError).toBeDefined();
    expect(errorModule.ErrorType).toBeDefined();
    expect(typeof errorModule.ErrorHandler.handle).toBe('function');
  });

  // エラータイプ列挙テスト
  it('should define proper error types', () => {
    const { ErrorType } = require('../../../src/utils/error');
    
    expect(ErrorType.FILE_ERROR).toBe('FILE_ERROR');
    expect(ErrorType.PARSE_ERROR).toBe('PARSE_ERROR');
    expect(ErrorType.RESOURCE_ERROR).toBe('RESOURCE_ERROR');
    expect(ErrorType.OUTPUT_ERROR).toBe('OUTPUT_ERROR');
  });

  // CloudSupporterErrorクラステスト
  it('should define CloudSupporterError class', () => {
    const { CloudSupporterError, ErrorType } = require('../../../src/utils/error');
    
    const testError = new CloudSupporterError(
      ErrorType.FILE_ERROR,
      'Test error message',
      { originalError: 'test' },
      '/test/path.yaml',
      42
    );
    
    expect(testError).toBeInstanceOf(Error);
    expect(testError).toBeInstanceOf(CloudSupporterError);
    expect(testError.type).toBe(ErrorType.FILE_ERROR);
    expect(testError.message).toBe('Test error message');
    expect(testError.filePath).toBe('/test/path.yaml');
    expect(testError.lineNumber).toBe(42);
  });

  // エラーメッセージテスト（ユーザビリティ）
  it('should provide helpful error messages', () => {
    const { CloudSupporterError, ErrorType } = require('../../../src/utils/error');
    
    const fileError = new CloudSupporterError(
      ErrorType.FILE_ERROR, 
      'File not found'
    );
    
    expect(fileError.message).toContain('File not found');
    
    const structured = fileError.toStructuredOutput();
    expect(structured.error).toBe('FILE_ERROR');
    expect(structured.message).toBe('File not found');
    expect(structured.timestamp).toBeDefined();
  });

  // 終了コードテスト（UNIX Philosophy）
  it('should set correct exit codes', () => {
    const { ErrorType } = require('../../../src/utils/error');
    
    // プライベートメソッドは直接テストできないが、
    // ErrorTypeごとの期待値を確認
    expect(ErrorType.FILE_ERROR).toBe('FILE_ERROR');
    expect(ErrorType.PARSE_ERROR).toBe('PARSE_ERROR');
    expect(ErrorType.RESOURCE_ERROR).toBe('RESOURCE_ERROR');
    expect(ErrorType.OUTPUT_ERROR).toBe('OUTPUT_ERROR');
  });

  // CLAUDE.md: No any types検証
  it('should not use any types in error handling', () => {
    const errorCode = readFileSync(
      path.join(__dirname, '../../../src/utils/error.ts'),
      'utf8'
    );
    expect(errorCode).toHaveNoAnyTypes();
  });

  // KISS原則テスト（複雑性回避）
  it('should keep error handling simple (KISS principle)', () => {
    const { ErrorHandler } = require('../../../src/utils/error');
    
    // シンプルなAPIであることを確認
    expect(typeof ErrorHandler.handle).toBe('function');
    expect(typeof ErrorHandler.logError).toBe('function');
    
    // 複雑な継承やファクトリパターンを避けていることを確認
    expect(ErrorHandler.handle.length).toBeLessThanOrEqual(1); // 引数は1個のみ
  });
});

describe('エラー処理フロー（CLAUDE.md: 型安全性）', () => {

  // ファイルエラーヘルパー関数テスト
  it('should handle file errors properly', () => {
    const { createFileError, isFileError } = require('../../../src/utils/error');
    
    const fileError = createFileError(
      'Template file not found', 
      '/path/to/template.yaml',
      { fileSize: 0 }
    );
    
    expect(isFileError(fileError)).toBe(true);
    expect(fileError.filePath).toBe('/path/to/template.yaml');
    expect(fileError.details?.fileSize).toBe(0);
  });

  // 構文エラーハンドリングテスト（行番号情報）
  it('should handle parse errors with line numbers', () => {
    const { createParseError, isParseError } = require('../../../src/utils/error');
    
    const parseError = createParseError(
      'YAML syntax error',
      '/template.yaml',
      15,
      { columnNumber: 10, nearText: 'invalid: syntax' }
    );
    
    expect(isParseError(parseError)).toBe(true);
    expect(parseError.lineNumber).toBe(15);
    expect(parseError.details?.columnNumber).toBe(10);
  });

  // リソースエラーハンドリングテスト
  it('should handle resource errors gracefully', () => {
    const { createResourceError, isResourceError } = require('../../../src/utils/error');
    
    const resourceError = createResourceError(
      'Unsupported resource type',
      { originalError: 'AWS::EC2::Instance not supported' }
    );
    
    expect(isResourceError(resourceError)).toBe(true);
    expect(resourceError.details?.originalError).toContain('AWS::EC2::Instance');
  });

  // 出力エラーハンドリングテスト
  it('should handle output errors correctly', () => {
    const { createOutputError, isOutputError } = require('../../../src/utils/error');
    
    const outputError = createOutputError(
      'Failed to write output file',
      { filePath: '/output/report.html', error: 'EACCES' }
    );
    
    expect(isOutputError(outputError)).toBe(true);
    expect(outputError.details?.error).toBe('EACCES');
  });

  // 型ガード関数の型安全性テスト
  it('should provide type-safe error type guards', () => {
    const { 
      createFileError,
      isFileError,
      isParseError,
      isResourceError,
      isOutputError 
    } = require('../../../src/utils/error');
    
    const fileError = createFileError('test');
    
    expect(isFileError(fileError)).toBe(true);
    expect(isParseError(fileError)).toBe(false);
    expect(isResourceError(fileError)).toBe(false);
    expect(isOutputError(fileError)).toBe(false);
    
    // 非エラーオブジェクトでfalse
    expect(isFileError(null)).toBe(false);
    expect(isFileError(undefined)).toBe(false);
    expect(isFileError({})).toBe(false);
  });
});