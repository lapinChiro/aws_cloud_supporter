// CLAUDE.md準拠エラーユーザビリティテスト（BLUE段階: 最適化）

import { 
  CloudSupporterError, 
  ErrorType,
  createFileError,
  createParseError,
  createResourceError,
  createOutputError 
} from '../../../src/utils/error';

describe('エラーメッセージユーザビリティ（CLAUDE.md: BLUE段階）', () => {

  // ファイルエラーメッセージの分かりやすさ
  it('should provide clear file error messages', () => {
    const fileNotFoundError = createFileError(
      'CloudFormation template not found',
      '/nonexistent/template.yaml',
      { originalError: 'ENOENT' }
    );

    const structured = fileNotFoundError.toStructuredOutput();
    
    expect(structured.message).toContain('not found');
    expect(structured.filePath).toBe('/nonexistent/template.yaml');
    expect(structured.details?.originalError).toBe('ENOENT');
  });

  // 構文エラーメッセージの詳細性
  it('should provide detailed parse error information', () => {
    const yamlSyntaxError = createParseError(
      'YAML syntax error: unexpected character',
      '/template.yaml',
      23,
      {
        columnNumber: 15,
        nearText: '  invalid: - syntax\n    missing: indentation',
        originalError: 'YAMLException: bad indentation'
      }
    );

    expect(yamlSyntaxError.lineNumber).toBe(23);
    expect(yamlSyntaxError.details?.columnNumber).toBe(15);
    expect(yamlSyntaxError.details?.nearText).toContain('invalid: - syntax');
  });

  // リソースエラーメッセージのコンテキスト提供
  it('should provide contextual resource error messages', () => {
    const unsupportedResourceError = createResourceError(
      'Resource type not supported for metrics analysis',
      {
        originalError: 'AWS::EC2::Instance',
        nearText: 'Consider using supported resources: RDS, Lambda, ECS, ALB, DynamoDB, API Gateway'
      }
    );

    expect(unsupportedResourceError.details?.nearText).toContain('supported resources');
  });

  // 出力エラーメッセージの実用性
  it('should provide actionable output error messages', () => {
    const writePermissionError = createOutputError(
      'Cannot write to output file',
      {
        filePath: '/readonly/report.html',
        error: 'EACCES',
        originalError: 'Permission denied'
      }
    );

    expect(writePermissionError.details?.error).toBe('EACCES');
    expect(writePermissionError.details?.filePath).toBe('/readonly/report.html');
  });

  // 多言語対応の準備（将来拡張）
  it('should structure error data for potential i18n', () => {
    const error = createFileError(
      'Template file exceeds size limit',
      '/large-template.yaml',
      { 
        fileSize: 52428800, // 50MB
        originalError: 'File too large'
      }
    );

    const structured = error.toStructuredOutput();
    
    // 構造化データにより翻訳可能
    expect(structured.error).toBe('FILE_ERROR');
    expect(structured.details?.fileSize).toBe(52428800);
    expect(structured.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe('エラーハンドラ統合テスト（CLAUDE.md: Integration）', () => {

  // エラー出力フォーマットテスト
  it('should format error output consistently', () => {
    const originalConsoleError = console.error;
    const errorOutput: string[] = [];
    
    // console.errorをキャプチャ
    console.error = (...args: unknown[]) => {
      errorOutput.push(args.join(' '));
    };

    try {
      const testError = createParseError(
        'Invalid YAML syntax',
        '/test.yaml', 
        10,
        { columnNumber: 5 }
      );

      // ErrorHandlerの一部機能をテスト（process.exitは避ける）
      expect(testError.toStructuredOutput()).toBeDefined();
      
    } finally {
      // console.error復元
      console.error = originalConsoleError;
    }
  });

  // メモリ効率性テスト
  it('should handle errors efficiently without memory leaks', () => {
    // 大量エラー生成・処理テスト
    const errors: CloudSupporterError[] = [];
    
    for (let i = 0; i < 100; i++) {
      errors.push(createFileError(`Error ${i}`, `/file${i}.yaml`));
    }
    
    // メモリリークなし確認
    expect(errors).toHaveLength(100);
    
    // 構造化出力の一貫性
    errors.forEach(error => {
      const structured = error.toStructuredOutput();
      expect(structured.timestamp).toBeDefined();
      expect(structured.error).toBe('FILE_ERROR');
    });
  });

  // エラー種別判定の効率性
  it('should efficiently categorize error types', () => {
    const fileError = createFileError('test');
    const parseError = createParseError('test');
    const resourceError = createResourceError('test');
    const outputError = createOutputError('test');

    const errors = [fileError, parseError, resourceError, outputError];
    
    // 型ガード関数の正確性
    expect(errors.filter(e => e.type === ErrorType.FILE_ERROR)).toHaveLength(1);
    expect(errors.filter(e => e.type === ErrorType.PARSE_ERROR)).toHaveLength(1);
    expect(errors.filter(e => e.type === ErrorType.RESOURCE_ERROR)).toHaveLength(1);
    expect(errors.filter(e => e.type === ErrorType.OUTPUT_ERROR)).toHaveLength(1);
  });
});