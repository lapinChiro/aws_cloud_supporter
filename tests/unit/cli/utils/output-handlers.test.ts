// CLAUDE.md準拠OutputHandlerテスト（GREEN段階: Error Handling + SOLID）

import { promises as fs , mkdirSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

import { FileOutputHandler } from '../../../../src/cli/utils/output-handlers';
import type { AnalysisResult } from '../../../../src/types/index';
import { CloudSupporterError, ErrorType } from '../../../../src/utils/error';
import { createLogger } from '../../../../src/utils/logger';

// テスト全体で使用する一時ディレクトリ
let tempDir: string;

function createMockAnalysisResult(): AnalysisResult {
  return {
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: 'test-template.yaml',
      total_resources: 2,
      supported_resources: 2
    },
    resources: [
      {
        logical_id: 'TestDB',
        resource_type: 'AWS::RDS::DBInstance',
        resource_properties: {
          Engine: 'mysql',
          DBInstanceClass: 'db.t3.micro'
        },
        metrics: [
          {
            metric_name: 'CPUUtilization',
            namespace: 'AWS/RDS',
            unit: 'Percent',
            description: 'CPU utilization',
            statistic: 'Average',
            recommended_threshold: {
              warning: 70,
              critical: 80
            },
            evaluation_period: 300,
            category: 'Performance',
            importance: 'High',
            dimensions: [
              {
                name: 'DBInstanceIdentifier',
                value: 'TestDB'
              }
            ]
          }
        ]
      }
    ],
    unsupported_resources: []
  };
}

beforeAll(() => {
  tempDir = path.join(tmpdir(), 'output-handlers-test');
  mkdirSync(tempDir, { recursive: true });
});

afterAll(async () => {
  try {
    await fs.rmdir(tempDir, { recursive: true });
  } catch {
    // Windows環境での削除エラーを無視
  }
});

describe('FileOutputHandler エラーハンドリングテスト（CLAUDE.md: Error Handling）', () => {
  
  // handleError メソッドテスト（lines 127をカバー）
  it('should handle errors during file processing', async () => {
    const handler = new FileOutputHandler();
    const logger = createLogger('debug', false);
    
    // 無効なファイルパスでエラーを発生させる
    const invalidPath = '\0invalid\0path.json'; // ヌル文字を含む無効パス
    const mockResult = createMockAnalysisResult();
    
    // FileOutputHandlerはhandleFileOutputメソッドを使用
    const mockJsonFormatter = { format: jest.fn().mockResolvedValue('{}') };
    const mockHtmlFormatter = { format: jest.fn().mockResolvedValue('<html></html>') };

    await expect(
      handler.handleFileOutput(invalidPath, 'json', mockResult, mockJsonFormatter, mockHtmlFormatter, logger)
    ).rejects.toThrow();
  });

  // validateFilePath メソッドテスト（line 140をカバー）
  it('should validate file paths and throw error for invalid paths', () => {
    const handler = new FileOutputHandler();
    
    // プライベートメソッドのテストのため、型キャストでアクセス
    const validateFilePath = (handler as unknown as { validateFilePath: (filePath: string) => void }).validateFilePath;
    
    if (validateFilePath) {
      // 危険な相対パス（親ディレクトリアクセス）
      expect(() => {
        validateFilePath.call(handler, '../../../etc/passwd');
      }).toThrow(CloudSupporterError);
      
      // 空のディレクトリパス
      expect(() => {
        validateFilePath.call(handler, '');
      }).toThrow(CloudSupporterError);
    }
  });

  // formatOutput の html ケース（line 161をカバー）
  it('should handle HTML format output', async () => {
    const handler = new FileOutputHandler();
    const mockResult = createMockAnalysisResult();
    const mockJsonFormatter = { format: jest.fn().mockResolvedValue('{}') };
    const mockHtmlFormatter = { format: jest.fn().mockResolvedValue('<!DOCTYPE html><html><body>TestDB</body></html>') };

    const formatOutput = (handler as unknown as { formatOutput: (format: string, result: AnalysisResult, jsonFormatter: unknown, htmlFormatter: unknown) => Promise<string> }).formatOutput;

    if (formatOutput) {
      const htmlOutput = await formatOutput.call(handler, 'html', mockResult, mockJsonFormatter, mockHtmlFormatter);
      expect(typeof htmlOutput).toBe('string');
      expect(htmlOutput).toContain('<!DOCTYPE html>');
      expect(htmlOutput).toContain('TestDB');
    }
  });

  // formatOutput の yaml ケース（lines 162-164をカバー）
  it('should handle YAML format output using JSON formatter', async () => {
    const handler = new FileOutputHandler();
    const mockResult = createMockAnalysisResult();
    const mockJsonFormatter = { format: jest.fn().mockResolvedValue('{"TestDB": "data"}') };
    const mockHtmlFormatter = { format: jest.fn().mockResolvedValue('<html></html>') };

    const formatOutput = (handler as unknown as { formatOutput: (format: string, result: AnalysisResult, jsonFormatter: unknown, htmlFormatter: unknown) => Promise<string> }).formatOutput;

    if (formatOutput) {
      const yamlOutput = await formatOutput.call(handler, 'yaml', mockResult, mockJsonFormatter, mockHtmlFormatter);
      expect(typeof yamlOutput).toBe('string');
      // YAMLとして出力されるが、実際はJSONフォーマッター経由
      expect(yamlOutput).toContain('TestDB');
    }
  });

  // formatOutput の unsupported format ケース（lines 165-166をカバー）
  it('should throw error for unsupported output format', async () => {
    const handler = new FileOutputHandler();
    const mockResult = createMockAnalysisResult();
    
    const formatOutput = (handler as unknown as { formatOutput: (result: AnalysisResult, format: string) => Promise<string> }).formatOutput;
    
    if (formatOutput) {
      await expect(
        formatOutput.call(handler, mockResult, 'unsupported-format')
      ).rejects.toThrow(CloudSupporterError);
      
      try {
        await formatOutput.call(handler, mockResult, 'unsupported-format');
      } catch (error) {
        if (error instanceof CloudSupporterError) {
          expect(error.type).toBe(ErrorType.OUTPUT_ERROR);
          expect(error.message).toContain('Unsupported output format');
        }
      }
    }
  });

  // writeFile エラーハンドリング（lines 181-186をカバー）
  it('should handle file write errors gracefully', () => {
    const handler = new FileOutputHandler();
    
    const writeFile = (handler as unknown as { writeFile: (filePath: string, content: string, format: string) => void }).writeFile;
    
    if (writeFile) {
      // 書き込み権限のないパス（Linuxの場合）
      const restrictedPath = '/root/restricted-file.json';
      
      expect(() => {
        writeFile.call(handler, restrictedPath, '{"test": "content"}', 'json');
      }).toThrow(CloudSupporterError);
      
      try {
        writeFile.call(handler, restrictedPath, '{"test": "content"}', 'json');
      } catch (error) {
        if (error instanceof CloudSupporterError) {
          expect(error.type).toBe(ErrorType.FILE_ERROR);
          expect(error.message).toContain('Failed to write json file');
        }
      }
    }
  });

  // handleError の CloudSupporterError ケース（lines 193-194をカバー）
  it('should handle CloudSupporterError in error handler', () => {
    const handler = new FileOutputHandler();
    const logger = createLogger('debug', false);
    
    const handleError = (handler as unknown as { handleError: (error: unknown, logger: unknown) => void }).handleError;
    const mockError = new CloudSupporterError(
      ErrorType.OUTPUT_ERROR,
      'Test CloudSupporter error',
      { testDetail: 'error details' }
    );
    
    if (handleError) {
      expect(() => {
        handleError.call(handler, mockError, logger);
      }).toThrow(CloudSupporterError);
    }
  });

  // handleError の generic error ケース（lines 195-197をカバー）
  it('should handle generic errors in error handler', () => {
    const handler = new FileOutputHandler();
    const logger = createLogger('debug', false);
    
    const handleError = (handler as unknown as { handleError: (error: unknown, logger: unknown) => void }).handleError;
    const genericError = new Error('Generic test error');
    
    if (handleError) {
      expect(() => {
        handleError.call(handler, genericError, logger);
      }).toThrow(Error);
    }
  });
});

describe('FileOutputHandler 型安全性テスト（CLAUDE.md: Type-Driven Development）', () => {
  
  // TypeScript型推論の確認
  it('should maintain proper TypeScript typing', () => {
    const handler = new FileOutputHandler();
    
    // FileOutputHandlerの型が正しく推論されることを確認
    expect(handler).toBeInstanceOf(FileOutputHandler);
    expect(typeof handler.handleFileOutput).toBe('function');
    
    // メソッドの戻り値の型が適切であることを確認
    const mockResult = createMockAnalysisResult();
    const testFile = path.join(tempDir, 'type-test.json');
    
    // handleFileOutputが適切な型でPromiseを返すことを確認
    const mockJsonFormatter = { format: jest.fn().mockResolvedValue('{}') };
    const mockHtmlFormatter = { format: jest.fn().mockResolvedValue('<html></html>') };
    const logger = createLogger('info', false);
    const result = handler.handleFileOutput(testFile, 'json', mockResult, mockJsonFormatter, mockHtmlFormatter, logger);
    expect(result).toBeInstanceOf(Promise);
  });

  // 型安全性テスト（anyの使用なし確認）
  it('should not use any types in implementation', () => {
    const handlerCode = (require('fs') as { readFileSync: (path: string, encoding: string) => string }).readFileSync(
      path.join(__dirname, '../../../../src/cli/utils/output-handlers.ts'),
      'utf8'
    );
    
    // anyタイプの使用がないことを確認
    expect(handlerCode).not.toMatch(/:\s*any\b/);
    expect(handlerCode).not.toMatch(/<any>/);
    expect(handlerCode).not.toMatch(/as\s+any\b/);
  });
});

describe('FileOutputHandler 正常系テスト（CLAUDE.md: TDD）', () => {
  
  // 正常なファイル保存のテスト
  it('should save JSON file successfully', async () => {
    const handler = new FileOutputHandler();
    const mockResult = createMockAnalysisResult();
    const testFile = path.join(tempDir, 'test-output.json');
    
    const mockJsonFormatter = { format: jest.fn().mockResolvedValue('{}') };
    const mockHtmlFormatter = { format: jest.fn().mockResolvedValue('<html></html>') };
    const logger = createLogger('info', false);

    await handler.handleFileOutput(testFile, 'json', mockResult, mockJsonFormatter, mockHtmlFormatter, logger);
    
    // ファイルが作成されていることを確認
    const content = await fs.readFile(testFile, 'utf-8');
    expect(content).toBeTruthy();
    expect(JSON.parse(content)).toBeDefined();
  });

  // 正常なHTML保存のテスト
  it('should save HTML file successfully', async () => {
    const handler = new FileOutputHandler();
    const mockResult = createMockAnalysisResult();
    const testFile = path.join(tempDir, 'test-output.html');

    const mockJsonFormatter = { format: jest.fn().mockResolvedValue('{}') };
    const mockHtmlFormatter = { format: jest.fn().mockResolvedValue('<!DOCTYPE html><html><body>TestDB content</body></html>') };
    const logger = createLogger('info', false);

    await handler.handleFileOutput(testFile, 'html', mockResult, mockJsonFormatter, mockHtmlFormatter, logger);
    
    // ファイルが作成されていることを確認
    const content = await fs.readFile(testFile, 'utf-8');
    expect(content).toBeTruthy();
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('TestDB');
  });
});