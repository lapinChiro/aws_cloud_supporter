// CLAUDE.md準拠: 型安全性・SOLID原則・DRY原則
// T-016: CLI完全実装 - リファクタリング版

import type { Command } from 'commander';

import type { ILogger } from '../interfaces/logger';
import type { IOutputFormatter } from '../interfaces/formatter';
import type { AnalysisResult } from '../types/metrics';
import { CloudSupporterError, ErrorType } from '../utils/error';
import { log } from '../utils/logger';

import { CommandBuilder } from './builders/command-builder';
import { CDKHandler } from './handlers/cdk-handler';
import type { CLIDependencies, CLIOptions } from './interfaces/command.interface';
import { StandardOutputHandler, FileOutputHandler, StatisticsDisplayHelper } from './utils/output-handlers';


/**
 * CLIコマンド作成（リファクタリング版）
 * SOLID原則: Dependency Injection・Single Responsibility
 * 複雑度: 大幅に削減
 * @param dependencies 依存性オブジェクト
 * @returns Commander Command インスタンス
 */
export function createCLICommand(dependencies: CLIDependencies): Command {
  const builder = new CommandBuilder();
  const program = builder.buildCommand(dependencies);
  
  // アクション設定
  program.action(async (templatePath: string, options: CLIOptions) => {
    await handleCLIAction(templatePath, options, dependencies);
  });
  
  return program;
}

/**
 * CLIアクション処理（メイン処理）
 * 複雑度: 5以下に削減
 */
async function handleCLIAction(
  templatePath: string,
  options: CLIOptions,
  dependencies: CLIDependencies
): Promise<void> {
  const { analyzer, logger, jsonFormatter, htmlFormatter } = dependencies;
  
  try {
    // ログレベル設定
    setupLogging(options, logger);
    
    // CDK生成の場合は専用ハンドラーに委譲
    if (options.output === 'cdk') {
      const cdkHandler = new CDKHandler();
      await cdkHandler.handleCDKGeneration(templatePath, options, dependencies);
      return;
    }
    
    // 通常の分析処理
    const result = await executeAnalysis(templatePath, options, analyzer, logger);
    
    // 出力処理
    await handleOutput(result, options, jsonFormatter, htmlFormatter, logger);
    
  } catch (error) {
    handleError(error, options, logger);
  }
}

/**
 * ログレベル設定
 * 複雑度: 2
 */
function setupLogging(options: CLIOptions, logger: ILogger): void {
  if (options.verbose) {
    logger.setLevel('debug');
  }
  
  // if (options.noColor) {
  //   logger.setColorEnabled(false);
  // }
}

/**
 * 分析実行
 * 複雑度: 3
 */
async function executeAnalysis(
  templatePath: string,
  options: CLIOptions,
  analyzer: any,
  logger: ILogger
): Promise<any> {
  logger.info(`Starting analysis of ${templatePath}`);
  
  // フィルタリング設定
  const resourceTypeFilter = options.resourceTypes
    ? options.resourceTypes.split(',').map(t => t.trim())
    : undefined;
  
  // 分析実行
  const result = await analyzer.analyze(templatePath, {
    outputFormat: options.output,
    includeUnsupported: options.includeUnsupported,
    includeLowImportance: options.includeLow,
    resourceTypes: resourceTypeFilter,
    concurrency: options.performanceMode ? 10 : 6,
    verbose: options.verbose
  });
  
  // 統計情報表示
  StatisticsDisplayHelper.displayAnalysisStatistics(result, options.verbose, logger);
  
  return result;
}

/**
 * 出力処理
 * 複雑度: 3
 */
async function handleOutput(
  result: AnalysisResult,
  options: CLIOptions,
  jsonFormatter: IOutputFormatter,
  htmlFormatter: IOutputFormatter,
  logger: ILogger
): Promise<void> {
  if (options.file) {
    // ファイル出力
    const fileHandler = new FileOutputHandler();
    await fileHandler.handleFileOutput(
      options.file,
      options.output as 'json' | 'html' | 'yaml',
      result,
      jsonFormatter,
      htmlFormatter,
      logger
    );
  } else {
    // 標準出力
    const stdHandler = new StandardOutputHandler();
    await stdHandler.handleStandardOutput(
      options.output as 'json' | 'html' | 'yaml',
      result,
      jsonFormatter,
      htmlFormatter,
      logger
    );
  }
}

/**
 * エラーハンドリング
 * 複雑度: 3
 */
function handleError(error: unknown, options: CLIOptions, logger: ILogger): void {
  if (error instanceof CloudSupporterError) {
    logger.error(error.message);
    if (options.verbose) {
      logger.debug('Error details:', error.details);
    }
    
    // エラータイプ別の処理
    switch (error.type) {
      case ErrorType.FILE_ERROR:
        log.plainError(`File error: ${error.message}`);
        break;
      case ErrorType.PARSE_ERROR:
        log.plainError(`Template parse error: ${error.message}`);
        break;
      case ErrorType.RESOURCE_ERROR:
        log.plainError(`Resource error: ${error.message}`);
        break;
      default:
        log.plainError(`Error: ${error.message}`);
    }
  } else {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.plainError(`Unexpected error: ${message}`);
    
    if (options.verbose && error instanceof Error) {
      logger.debug('Stack trace:', error.stack);
    }
  }
  
  process.exit(1);
}