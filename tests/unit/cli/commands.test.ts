/* eslint-disable max-lines */
// CLAUDE.md準拠: TDD - RED段階
// T-016: CLI完全実装テスト
import { writeFileSync } from 'fs';

import type { Command } from 'commander';

import { createCLICommand } from '../../../src/cli/commands';
import { MetricsAnalyzer } from '../../../src/core/analyzer';
import { HTMLOutputFormatter } from '../../../src/core/formatters/html';
import { JSONOutputFormatter } from '../../../src/core/json-formatter';
import { TemplateParser } from '../../../src/core/parser';
import type { ExtendedAnalysisResult } from '../../../src/interfaces/analyzer';
import { CloudSupporterError, ErrorType } from '../../../src/utils/error';
import { Logger } from '../../../src/utils/logger';
// モック
jest.mock('../../../src/core/analyzer');
jest.mock('../../../src/core/parser');
jest.mock('../../../src/core/json-formatter');
jest.mock('../../../src/core/formatters/html');
jest.mock('../../../src/utils/logger');
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn()
}));

// ヘルパー関数: モックデータ作成
function createMockAnalysisResult() {
  return {
    metadata: {
      version: '1.0.0' as const,
      generated_at: new Date().toISOString(),
      template_path: 'test.yaml',
      total_resources: 10,
      supported_resources: 8,
      processing_time_ms: 1500
    },
    resources: [
      {
        logical_id: 'TestDB',
        resource_type: 'AWS::RDS::DBInstance',
        resource_properties: {},
        metrics: [
          {
            metric_name: 'CPUUtilization',
            namespace: 'AWS/RDS',
            unit: 'Percent',
            description: 'CPU usage',
            statistic: 'Average' as const,
            recommended_threshold: { warning: 70, critical: 90 },
            evaluation_period: 300 as const,
            category: 'Performance' as const,
            importance: 'High' as const,
            dimensions: []
          }
        ]
      }
    ],
    unsupported_resources: ['UnsupportedResource1']
  };
}

// ヘルパー関数: モック設定
interface MockDependencies {
  analyzer: jest.Mocked<MetricsAnalyzer>;
  parser: jest.Mocked<TemplateParser>;
  jsonFormatter: jest.Mocked<JSONOutputFormatter>;
  htmlFormatter: jest.Mocked<HTMLOutputFormatter>;
  logger: jest.Mocked<Logger>;
}

function setupMocks(): MockDependencies {
  const mockAnalyzer = new MetricsAnalyzer(
    {},
    {},
  ) as jest.Mocked<MetricsAnalyzer>;
  const mockParser = new TemplateParser() as jest.Mocked<TemplateParser>;
  const mockJSONFormatter = new JSONOutputFormatter() as jest.Mocked<JSONOutputFormatter>;
  const mockHTMLFormatter = new HTMLOutputFormatter() as jest.Mocked<HTMLOutputFormatter>;
  const mockLogger = new Logger() as jest.Mocked<Logger>;

  return {
    analyzer: mockAnalyzer,
    parser: mockParser,
    jsonFormatter: mockJSONFormatter,
    htmlFormatter: mockHTMLFormatter,
    logger: mockLogger
  };
}

// ヘルパー関数: スパイ設定
interface Spies {
  consoleLog: jest.SpyInstance;
  consoleError: jest.SpyInstance;
  processExit: jest.SpyInstance;
}

function setupSpies(): Spies {
  return {
    consoleLog: jest.spyOn(console, 'log').mockImplementation(),
    consoleError: jest.spyOn(console, 'error').mockImplementation(),
    processExit: jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    })
  };
}

function restoreSpies(spies: Spies): void {
  spies.consoleLog.mockRestore();
  spies.consoleError.mockRestore();
  spies.processExit.mockRestore();
}

// ヘルパー関数: 基本的なコマンドオプションの検証
function assertBasicCommandStructure(program: Command): void {
  expect(program.name()).toBe('aws-cloud-supporter');
  expect(program.description()).toBe('Generate CloudWatch metrics recommendations for CloudFormation templates');
  expect(program.version()).toBe('1.0.0');
}

// ヘルパー関数: コマンドオプションの検証
function assertCommandOption(program: Command, longFlag: string, expectedFlags: string, descriptionContains: string, defaultValue?: any): void {
  const option = program.options.find(opt => opt.long === longFlag);
  expect(option).toBeDefined();
  expect(option?.flags).toBe(expectedFlags);
  expect(option?.description).toContain(descriptionContains);
  if (defaultValue !== undefined) {
    expect(option?.defaultValue).toBe(defaultValue);
  }
}

// ヘルパー関数: テンプレート解析の実行と検証
async function executeAnalysisAndAssert(
  program: Command,
  args: string[],
  mockAnalyzer: jest.Mocked<MetricsAnalyzer>,
  mockFormatter: jest.Mocked<JSONOutputFormatter | HTMLOutputFormatter>,
  expectedOptions: unknown,
  expectedOutput: never
): Promise<void> {
  const mockResult = createMockAnalysisResult();
  mockAnalyzer.analyze.mockResolvedValue(mockResult);
  mockFormatter.format.mockResolvedValue(expectedOutput);
  
  await program.parseAsync(args);
  
  expect(mockAnalyzer.analyze).toHaveBeenCalledWith(args[2], expectedOptions);
  expect(mockFormatter.format).toHaveBeenCalled();
}

// ヘルパー関数: エラーハンドリングの検証
async function assertErrorHandling(
  program: Command,
  args: string[],
  mockAnalyzer: jest.Mocked<MetricsAnalyzer>,
  error: Error,
  expectedErrorMessage: string,
  consoleErrorSpy: jest.SpyInstance,
  processExitSpy: jest.SpyInstance
): Promise<void> {
  mockAnalyzer.analyze.mockRejectedValue(error);
  
  await expect(program.parseAsync(args))
    .rejects.toThrow('process.exit called');
  
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    expect.stringContaining(expectedErrorMessage)
  );
  expect(processExitSpy).toHaveBeenCalledWith(1);
}

// ヘルパー関数: 統計情報表示の検証
function createResultWithStats(baseResult: unknown): ExtendedAnalysisResult {
  return {
    ...baseResult,
    performanceMetrics: {
      parseTime: 500,
      generatorTime: 1000,
      formatterTime: 100,
      totalTime: 1600,
      memoryPeak: 50 * 1024 * 1024,
      resourceCount: 10,
      concurrentTasks: 6
    }
  };
}

// ヘルパー関数: 統計情報の検証
function assertStatisticsDisplay(consoleLogSpy: jest.SpyInstance): void {
  expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('📊 Analysis Statistics:'));
  expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Resources: 10'));
  expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Supported: 8'));
  expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Processing Time: 1600ms'));
  expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Memory Usage: 50.0MB'));
}

// ヘルパー関数: Low importanceメトリクスを含むテスト結果の作成
function createResultWithLowMetrics() {
  const baseResult = createMockAnalysisResult();
  return {
    ...baseResult,
    resources: [{
      logical_id: 'TestDB',
      resource_type: 'AWS::RDS::DBInstance',
      resource_properties: {},
      metrics: [
        {
          metric_name: 'CPUUtilization',
          namespace: 'AWS/RDS',
          unit: 'Percent',
          description: 'CPU usage',
          statistic: 'Average' as const,
          recommended_threshold: { warning: 70, critical: 90 },
          evaluation_period: 300 as const,
          category: 'Performance' as const,
          importance: 'High' as const,
          dimensions: []
        },
        {
          metric_name: 'SwapUsage',
          namespace: 'AWS/RDS',
          unit: 'Bytes',
          description: 'Swap usage',
          statistic: 'Average' as const,
          recommended_threshold: { warning: 80, critical: 100 },
          evaluation_period: 300 as const,
          category: 'Performance' as const,
          importance: 'Low' as const,
          dimensions: []
        }
      ]
    }]
  };
}

// ヘルパー関数: ファイル出力のテスト
async function assertFileOutput(
  program: Command,
  mockAnalyzer: jest.Mocked<MetricsAnalyzer>,
  mockFormatter: jest.Mocked<JSONOutputFormatter | HTMLOutputFormatter>,
  outputPath: string,
  expectedContent: never,
  consoleLogSpy: jest.SpyInstance
): Promise<void> {
  const mockResult = createMockAnalysisResult();
  mockAnalyzer.analyze.mockResolvedValue(mockResult);
  mockFormatter.format.mockResolvedValue(expectedContent);
  
  await program.parseAsync(['node', 'cli', 'test.yaml', '--file', outputPath]);
  
  expect(writeFileSync).toHaveBeenCalledWith(outputPath, expectedContent, 'utf8');
  expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`✅ Report saved: ${outputPath}`));
}

// ヘルパー関数: ヘルプ情報の検証
function assertHelpInformation(program: Command): void {
  const helpOutput = program.helpInformation();
  expect(helpOutput).toContain('aws-cloud-supporter');
  expect(helpOutput).toContain('Generate CloudWatch metrics recommendations');
  expect(helpOutput).toContain('<template>');
  expect(helpOutput).toContain('--output');
  expect(helpOutput).toContain('--file');
  expect(helpOutput).toContain('--verbose');
}

// ヘルパー関数: 詳細モードオプションの検証
async function assertVerboseMode(
  program: Command,
  mockAnalyzer: jest.Mocked<MetricsAnalyzer>,
  mockFormatter: jest.Mocked<JSONOutputFormatter>,
  mockLogger: jest.Mocked<Logger>
): Promise<void> {
  const mockResult = createMockAnalysisResult();
  mockAnalyzer.analyze.mockResolvedValue(mockResult);
  mockFormatter.format.mockResolvedValue('{}' as never);
  
  await program.parseAsync(['node', 'cli', 'test.yaml', '--verbose']);
  
  expect(mockAnalyzer.analyze).toHaveBeenCalledWith('test.yaml', 
    expect.objectContaining({ verbose: true })
  );
  expect(mockLogger.info).toHaveBeenCalled();
}

// ヘルパー関数: ヘルプの例の検証
function assertHelpExamples(program: Command): void {
  let capturedOutput = '';
  const originalWrite = process.stdout.write;
  process.stdout.write = (chunk) => {
    capturedOutput += chunk;
    return true;
  };
  
  program.outputHelp();
  process.stdout.write = originalWrite;
  
  expect(capturedOutput).toContain('Examples:');
  expect(capturedOutput).toContain('$ aws-cloud-supporter template.yaml');
  expect(capturedOutput).toContain('$ aws-cloud-supporter template.yaml --output html --file report.html');
}

// ヘルパー関数: フォーマッターエラーのテスト
async function assertFormatterError(
  program: Command,
  mockAnalyzer: jest.Mocked<MetricsAnalyzer>,
  mockFormatter: jest.Mocked<JSONOutputFormatter>,
  consoleErrorSpy: jest.SpyInstance,
): Promise<void> {
  const mockResult = createMockAnalysisResult();
  mockAnalyzer.analyze.mockResolvedValue(mockResult);
  mockFormatter.format.mockRejectedValue(new Error('Formatter failed') as never);

  await expect(program.parseAsync(['node', 'cli', 'test.yaml']))
    .rejects.toThrow('process.exit called');

  expect(consoleErrorSpy).toHaveBeenCalledWith(
    expect.stringContaining('Formatter failed')
  );
}

// ヘルパー関数: パフォーマンスモードの検証
async function assertPerformanceMode(
  program: Command,
  mockAnalyzer: jest.Mocked<MetricsAnalyzer>,
  mockFormatter: jest.Mocked<JSONOutputFormatter>
): Promise<void> {
  const mockResult = createMockAnalysisResult();
  mockAnalyzer.analyze.mockResolvedValue(mockResult);
  mockFormatter.format.mockResolvedValue('{}' as never);

  await program.parseAsync(['node', 'cli', 'test.yaml', '--performance-mode']);

  expect(mockAnalyzer.analyze).toHaveBeenCalledWith('test.yaml', 
    expect.objectContaining({
      concurrency: 10,
      collectMetrics: true
    })
  );
}

// ヘルパー関数: リソースタイプフィルタリングの検証
async function assertResourceTypeFiltering(
  program: Command,
  mockAnalyzer: jest.Mocked<MetricsAnalyzer>,
  mockFormatter: jest.Mocked<JSONOutputFormatter>
): Promise<void> {
  const mockResult = createMockAnalysisResult();
  mockAnalyzer.analyze.mockResolvedValue(mockResult);
  mockFormatter.format.mockResolvedValue('{"filtered": true}' as never);

  await program.parseAsync(['node', 'cli', 'test.yaml', '--resource-types', 'AWS::RDS::DBInstance,AWS::Lambda::Function']);

  // CLIがフィルタリングを行うことを確認
  expect(mockFormatter.format).toHaveBeenCalledWith(
    expect.objectContaining({
      resources: expect.arrayContaining([
        expect.objectContaining({
          resource_type: 'AWS::RDS::DBInstance'
        })
      ])
    })
  );
}

// ヘルパー関数: テスト環境のセットアップ
interface TestEnvironment {
  program: Command;
  mockAnalyzer: jest.Mocked<MetricsAnalyzer>;
  mockParser: jest.Mocked<TemplateParser>;
  mockJSONFormatter: jest.Mocked<JSONOutputFormatter>;
  mockHTMLFormatter: jest.Mocked<HTMLOutputFormatter>;
  mockLogger: jest.Mocked<Logger>;
  consoleLogSpy: jest.SpyInstance;
  consoleErrorSpy: jest.SpyInstance;
  processExitSpy: jest.SpyInstance;
}

function setupTestEnvironment(): TestEnvironment {
  const mocks = setupMocks();
  const spies = setupSpies();
  
  const program = createCLICommand({
    analyzer: mocks.analyzer,
    parser: mocks.parser,
    jsonFormatter: mocks.jsonFormatter,
    htmlFormatter: mocks.htmlFormatter,
    logger: mocks.logger
  });
  
  return {
    program,
    ...mocks,
    ...spies
  };
}

describe('CLI Commands (T-016)', () => {
  let testEnv: TestEnvironment;
  let program: Command;
  let mockAnalyzer: jest.Mocked<MetricsAnalyzer>;
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockParser: jest.Mocked<TemplateParser>;
  let mockJSONFormatter: jest.Mocked<JSONOutputFormatter>;
  let mockHTMLFormatter: jest.Mocked<HTMLOutputFormatter>;
  let mockLogger: jest.Mocked<Logger>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;
  
  const mockAnalysisResult = createMockAnalysisResult();

  beforeEach(() => {
    testEnv = setupTestEnvironment();
    program = testEnv.program;
    mockAnalyzer = testEnv.mockAnalyzer;
    mockParser = testEnv.mockParser;
    mockJSONFormatter = testEnv.mockJSONFormatter;
    mockHTMLFormatter = testEnv.mockHTMLFormatter;
    mockLogger = testEnv.mockLogger;
    consoleLogSpy = testEnv.consoleLogSpy;
    consoleErrorSpy = testEnv.consoleErrorSpy;
    processExitSpy = testEnv.processExitSpy;
  });

  afterEach(() => {
    jest.clearAllMocks();
    restoreSpies({
      consoleLog: consoleLogSpy,
      consoleError: consoleErrorSpy,
      processExit: processExitSpy
    });
  });

  describe('Basic Command Structure', () => {
    it('should have correct command name and description', () => {
      assertBasicCommandStructure(program);
    });

    it('should accept template file as required argument', () => {
      const usage = program.usage();
      expect(usage).toContain('<template>');
      const helpText = program.helpInformation();
      expect(helpText).toContain('template');
      expect(helpText).toContain('CloudFormation template file path');
    });
  });

  describe('Command Options', () => {
    it('should have --output option with correct choices', () => {
      assertCommandOption(program, '--output', '-o, --output <format>', 'Output format: json|html|yaml', 'json');
    });

    it('should have --file option for output file path', () => {
      assertCommandOption(program, '--file', '-f, --file <path>', 'Output file path');
    });

    it('should have --resource-types option', () => {
      assertCommandOption(program, '--resource-types', '--resource-types <types>', 'Comma-separated resource types to analyze');
    });

    it('should have boolean flags', () => {
      const flags = ['--include-low', '--verbose', '--no-color', '--include-unsupported', '--performance-mode'];
      flags.forEach(flag => {
        const option = program.options.find(opt => opt.long === flag);
        expect(option).toBeDefined();
      });
    });
  });

  describe('Command Execution', () => {
    // mockAnalysisResult is already defined at the top level

    it('should analyze template with default options', async () => {
      await executeAnalysisAndAssert(
        program,
        ['node', 'cli', 'test.yaml'],
        mockAnalyzer,
        mockJSONFormatter,
        {
          outputFormat: 'json',
          includeUnsupported: true,
          concurrency: 6,
          verbose: false,
          collectMetrics: true,
          continueOnError: true
        },
        '{"result": "json"}' as never
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('{"result": "json"}');
    });

    it('should handle HTML output format', async () => {
      await executeAnalysisAndAssert(
        program,
        ['node', 'cli', 'test.yaml', '--output', 'html'],
        mockAnalyzer,
        mockHTMLFormatter,
        {
          outputFormat: 'html',
          includeUnsupported: true,
          concurrency: 6,
          verbose: false,
          collectMetrics: true,
          continueOnError: true
        },
        '<html>result</html>' as never
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('<html>result</html>');
    });

    it('should write output to file when --file option is provided', async () => {
      await assertFileOutput(
        program,
        mockAnalyzer,
        mockJSONFormatter,
        'output.json',
        '{"result": "json"}' as never,
        consoleLogSpy
      );
    });

    it('should filter resource types when --resource-types is provided', async () => {
      await assertResourceTypeFiltering(program, mockAnalyzer, mockJSONFormatter);
    });

    it('should enable verbose mode', async () => {
      await assertVerboseMode(program, mockAnalyzer, mockJSONFormatter, mockLogger);
    });

    it('should handle performance mode', async () => {
      await assertPerformanceMode(program, mockAnalyzer, mockJSONFormatter);
    });
  });

  describe('Error Handling', () => {
    it('should handle template file not found error', async () => {
      const error = new CloudSupporterError(
        ErrorType.VALIDATION_ERROR,
        'Template file not found: test.yaml'
      );
      await assertErrorHandling(
        program,
        ['node', 'cli', 'test.yaml'],
        mockAnalyzer,
        error,
        '❌ Error: Template file not found: test.yaml',
        consoleErrorSpy,
        processExitSpy
      );
    });

    it('should handle invalid output format error', async () => {
      // Commander.jsはinvalidな選択肢を自動的にエラーにする
      await expect(program.parseAsync(['node', 'cli', 'test.yaml', '--output', 'invalid']))
        .rejects.toThrow();
    });

    it('should handle analysis timeout error', async () => {
      const error = new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'Analysis timeout: exceeded 30s limit'
      );
      await assertErrorHandling(
        program,
        ['node', 'cli', 'test.yaml'],
        mockAnalyzer,
        error,
        'Analysis timeout',
        consoleErrorSpy,
        processExitSpy
      );
    });

    it('should handle memory limit error', async () => {
      const error = new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'Memory usage exceeded: 300MB (limit: 256MB)'
      );
      await assertErrorHandling(
        program,
        ['node', 'cli', 'test.yaml'],
        mockAnalyzer,
        error,
        'Memory usage exceeded',
        consoleErrorSpy,
        processExitSpy
      );
    });

    it('should handle formatter errors gracefully', async () => {
      await assertFormatterError(
        program,
        mockAnalyzer,
        mockJSONFormatter,
        consoleErrorSpy,
      );
    });
  });

  describe('YAML Output Format', () => {
    it('should throw error for unsupported YAML format', async () => {
      mockAnalyzer.analyze.mockResolvedValue(mockAnalysisResult);
      await expect(program.parseAsync(['node', 'cli', 'test.yaml', '--output', 'yaml']))
        .rejects.toThrow('process.exit called');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('YAML output format is not yet implemented')
      );
    });
  });

  describe('Help and Version', () => {
    it('should show help information', () => {
      assertHelpInformation(program);
    });

    it('should show examples in help', () => {
      assertHelpExamples(program);
    });
  });

  describe('Statistics Display', () => {
    it('should display analysis statistics when verbose', async () => {
      const resultWithStats = createResultWithStats(mockAnalysisResult);
      mockAnalyzer.analyze.mockResolvedValue(resultWithStats);
      mockAnalyzer.getAnalysisStatistics.mockReturnValue({
        totalResources: 10,
        supportedResources: 8,
        unsupportedResources: 2,
        resourcesByType: {
          'AWS::RDS::DBInstance': 3,
          'AWS::Lambda::Function': 5
        },
        processingTimeMs: 1600,
        memoryUsageMB: 50
      });
      mockJSONFormatter.format.mockResolvedValue('{}' as never);

      await program.parseAsync(['node', 'cli', 'test.yaml', '--verbose']);

      assertStatisticsDisplay(consoleLogSpy);
    });
  });

  describe('Include Low Importance Metrics', () => {
    it('should filter out low importance metrics by default', async () => {
      const resultWithLowMetrics = createResultWithLowMetrics();
      mockAnalyzer.analyze.mockResolvedValue(resultWithLowMetrics);
      mockJSONFormatter.format.mockResolvedValue('{}' as never);

      await program.parseAsync(['node', 'cli', 'test.yaml']);

      // Formatterに渡されるデータでlowメトリクスが除外されていることを確認
      expect(mockJSONFormatter.format).toHaveBeenCalledWith(
        expect.objectContaining({
          resources: expect.arrayContaining([
            expect.objectContaining({
              metrics: expect.not.arrayContaining([
                expect.objectContaining({
                  importance: 'low'
                })
              ])
            })
          ])
        })
      );
    });

    it('should include low importance metrics with --include-low flag', async () => {
      const resultWithLowMetrics = createResultWithLowMetrics();
      mockAnalyzer.analyze.mockResolvedValue(resultWithLowMetrics);
      mockJSONFormatter.format.mockResolvedValue('{}' as never);
      
      await program.parseAsync(['node', 'cli', 'test.yaml', '--include-low']);
      
      // 全てのメトリクスが含まれることを確認
      expect(mockJSONFormatter.format).toHaveBeenCalledWith(
        expect.objectContaining({
          resources: expect.arrayContaining([
            expect.objectContaining({
              metrics: expect.arrayContaining([
                expect.objectContaining({ importance: 'High' }),
                expect.objectContaining({ importance: 'Low' })
              ])
            })
          ])
        })
      );
    });
  });
});