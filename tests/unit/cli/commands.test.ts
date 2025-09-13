// CLAUDE.md準拠: TDD - RED段階
// T-016: CLI完全実装テスト
import { writeFileSync } from 'fs';

import type { Command } from 'commander';

import { createCLICommand } from '../../../src/cli/commands';
import { MetricsAnalyzer } from '../../../src/core/analyzer';
import { HTMLOutputFormatter } from '../../../src/core/formatters/html';
import { JSONOutputFormatter } from '../../../src/core/json-formatter';
import { TemplateParser } from '../../../src/core/parser';
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
describe('CLI Commands (T-016)', () => {
  let program: Command;
  let mockAnalyzer: jest.Mocked<MetricsAnalyzer>;
  let mockParser: jest.Mocked<TemplateParser>;
  let mockJSONFormatter: jest.Mocked<JSONOutputFormatter>;
  let mockHTMLFormatter: jest.Mocked<HTMLOutputFormatter>;
  let mockLogger: jest.Mocked<Logger>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;
  
  const mockAnalysisResult = {
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

  beforeEach(() => {
    // モック初期化
    mockAnalyzer = new MetricsAnalyzer(
      {} as any,
      {} as any,
    ) as jest.Mocked<MetricsAnalyzer>;
    mockParser = new TemplateParser() as jest.Mocked<TemplateParser>;
    mockJSONFormatter = new JSONOutputFormatter() as jest.Mocked<JSONOutputFormatter>;
    mockHTMLFormatter = new HTMLOutputFormatter() as jest.Mocked<HTMLOutputFormatter>;
    mockLogger = new Logger() as jest.Mocked<Logger>;
    // スパイ設定
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    // CommandをCLIコマンドで初期化
    program = createCLICommand({
      analyzer: mockAnalyzer,
      parser: mockParser,
      jsonFormatter: mockJSONFormatter,
      htmlFormatter: mockHTMLFormatter,
      logger: mockLogger
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('Basic Command Structure', () => {
    it('should have correct command name and description', () => {
      expect(program.name()).toBe('aws-cloud-supporter');
      expect(program.description()).toBe('Generate CloudWatch metrics recommendations for CloudFormation templates');
    });

    it('should have correct version', () => {
      expect(program.version()).toBe('1.0.0');
    });

    it('should accept template file as required argument', () => {
      // Commander.js stores argument definitions differently
      // Test that the argument is properly configured by checking command usage
      const usage = program.usage();
      expect(usage).toContain('<template>');
      // Alternative: check that the argument is in the help text
      const helpText = program.helpInformation();
      expect(helpText).toContain('template');
      expect(helpText).toContain('CloudFormation template file path');
    });
  });

  describe('Command Options', () => {
    it('should have --output option with correct choices', () => {
      const outputOption = program.options.find(opt => opt.long === '--output');
      expect(outputOption).toBeDefined();
      expect(outputOption?.flags).toBe('-o, --output <format>');
      expect(outputOption?.description).toContain('Output format: json|html|yaml');
      expect(outputOption?.defaultValue).toBe('json');
    });

    it('should have --file option for output file path', () => {
      const fileOption = program.options.find(opt => opt.long === '--file');
      expect(fileOption).toBeDefined();
      expect(fileOption?.flags).toBe('-f, --file <path>');
      expect(fileOption?.description).toContain('Output file path');
    });

    it('should have --resource-types option', () => {
      const rtOption = program.options.find(opt => opt.long === '--resource-types');
      expect(rtOption).toBeDefined();
      expect(rtOption?.flags).toBe('--resource-types <types>');
      expect(rtOption?.description).toContain('Comma-separated resource types to analyze');
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
      mockAnalyzer.analyze.mockResolvedValue(mockAnalysisResult);
      mockJSONFormatter.format.mockResolvedValue('{"result": "json"}');

      await program.parseAsync(['node', 'cli', 'test.yaml']);

      expect(mockAnalyzer.analyze).toHaveBeenCalledWith('test.yaml', {
        outputFormat: 'json',
        includeUnsupported: true,
        concurrency: 6,
        verbose: false,
        collectMetrics: true,
        continueOnError: true
      });
      expect(mockJSONFormatter.format).toHaveBeenCalledWith(mockAnalysisResult);
      expect(consoleLogSpy).toHaveBeenCalledWith('{"result": "json"}');
    });

    it('should handle HTML output format', async () => {
      mockAnalyzer.analyze.mockResolvedValue(mockAnalysisResult);
      mockHTMLFormatter.format.mockResolvedValue('<html>result</html>');

      await program.parseAsync(['node', 'cli', 'test.yaml', '--output', 'html']);

      expect(mockHTMLFormatter.format).toHaveBeenCalledWith(mockAnalysisResult);
      expect(consoleLogSpy).toHaveBeenCalledWith('<html>result</html>');
    });

    it('should write output to file when --file option is provided', async () => {
      mockAnalyzer.analyze.mockResolvedValue(mockAnalysisResult);
      mockJSONFormatter.format.mockResolvedValue('{"result": "json"}');

      await program.parseAsync(['node', 'cli', 'test.yaml', '--file', 'output.json']);

      expect(writeFileSync).toHaveBeenCalledWith('output.json', '{"result": "json"}', 'utf8');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Report saved: output.json'));
    });

    it('should filter resource types when --resource-types is provided', async () => {
      mockAnalyzer.analyze.mockResolvedValue(mockAnalysisResult);
      mockJSONFormatter.format.mockResolvedValue('{"filtered": true}');

      await program.parseAsync(['node', 'cli', 'test.yaml', '--resource-types', 'AWS::RDS::DBInstance,AWS::Lambda::Function']);

      // CLIがフィルタリングを行うことを確認
      expect(mockJSONFormatter.format).toHaveBeenCalledWith(
        expect.objectContaining({
          resources: expect.arrayContaining([
            expect.objectContaining({
              resource_type: 'AWS::RDS::DBInstance'
            })
          ])
        })
      );
    });

    it('should enable verbose mode', async () => {
      mockAnalyzer.analyze.mockResolvedValue(mockAnalysisResult);
      mockJSONFormatter.format.mockResolvedValue('{}');

      await program.parseAsync(['node', 'cli', 'test.yaml', '--verbose']);

      expect(mockAnalyzer.analyze).toHaveBeenCalledWith('test.yaml', 
        expect.objectContaining({
          verbose: true
        })
      );
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle performance mode', async () => {
      mockAnalyzer.analyze.mockResolvedValue(mockAnalysisResult);
      mockJSONFormatter.format.mockResolvedValue('{}');

      await program.parseAsync(['node', 'cli', 'test.yaml', '--performance-mode']);

      expect(mockAnalyzer.analyze).toHaveBeenCalledWith('test.yaml', 
        expect.objectContaining({
          concurrency: 10,
          collectMetrics: true
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle template file not found error', async () => {
      const error = new CloudSupporterError(
        ErrorType.VALIDATION_ERROR,
        'Template file not found: test.yaml'
      );
      mockAnalyzer.analyze.mockRejectedValue(error);

      await expect(program.parseAsync(['node', 'cli', 'test.yaml']))
        .rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error: Template file not found: test.yaml')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
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
      mockAnalyzer.analyze.mockRejectedValue(error);

      await expect(program.parseAsync(['node', 'cli', 'test.yaml']))
        .rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Analysis timeout')
      );
    });

    it('should handle memory limit error', async () => {
      const error = new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'Memory usage exceeded: 300MB (limit: 256MB)'
      );
      mockAnalyzer.analyze.mockRejectedValue(error);

      await expect(program.parseAsync(['node', 'cli', 'test.yaml']))
        .rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Memory usage exceeded')
      );
    });

    it('should handle formatter errors gracefully', async () => {
      mockAnalyzer.analyze.mockResolvedValue(mockAnalysisResult);
      mockJSONFormatter.format.mockRejectedValue(new Error('Formatter failed'));

      await expect(program.parseAsync(['node', 'cli', 'test.yaml']))
        .rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Formatter failed')
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
      const helpOutput = program.helpInformation();
      expect(helpOutput).toContain('aws-cloud-supporter');
      expect(helpOutput).toContain('Generate CloudWatch metrics recommendations');
      expect(helpOutput).toContain('<template>');
      expect(helpOutput).toContain('--output');
      expect(helpOutput).toContain('--file');
      expect(helpOutput).toContain('--verbose');
    });

    it('should show examples in help', () => {
      // Commander.js includes addHelpText content when outputting help
      // We need to capture the full help output
      let capturedOutput = '';
      const originalWrite = process.stdout.write;
      process.stdout.write = (chunk: any) => {
        capturedOutput += chunk;
        return true;
      };
      
      program.outputHelp();
      process.stdout.write = originalWrite;
      
      expect(capturedOutput).toContain('Examples:');
      expect(capturedOutput).toContain('$ aws-cloud-supporter template.yaml');
      expect(capturedOutput).toContain('$ aws-cloud-supporter template.yaml --output html --file report.html');
    });
  });

  describe('Statistics Display', () => {
    it('should display analysis statistics when verbose', async () => {
      const resultWithStats = {
        ...mockAnalysisResult,
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
      mockJSONFormatter.format.mockResolvedValue('{}');

      await program.parseAsync(['node', 'cli', 'test.yaml', '--verbose']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('📊 Analysis Statistics:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Resources: 10'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Supported: 8'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Processing Time: 1600ms'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Memory Usage: 50.0MB'));
    });
  });

  describe('Include Low Importance Metrics', () => {
    it('should filter out low importance metrics by default', async () => {
      const resultWithLowMetrics = {
        ...mockAnalysisResult,
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

      mockAnalyzer.analyze.mockResolvedValue(resultWithLowMetrics);
      mockJSONFormatter.format.mockResolvedValue('{}');

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
      const resultWithLowMetrics = {
        ...mockAnalysisResult,
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

      mockAnalyzer.analyze.mockResolvedValue(resultWithLowMetrics);
      mockJSONFormatter.format.mockResolvedValue('{}');
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