// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計
// T-016: 出力ハンドラー - 標準出力・ファイル出力処理

import { writeFileSync } from 'fs';
import * as path from 'path';

import { CloudSupporterError, Errors } from '../../errors';
import type { IOutputFormatter } from '../../interfaces/formatter';
import type { ILogger } from '../../interfaces/logger';
import type { AnalysisResult } from '../../types/metrics';
import { log } from '../../utils/logger';
import type { IStandardOutputHandler, IFileOutputHandler } from '../interfaces/handler.interface';

/**
 * 標準出力ハンドラー実装
 * Single Responsibility: 標準出力処理のみ
 * 複雑度: 4以下
 */
export class StandardOutputHandler implements IStandardOutputHandler {
  /**
   * 結果を標準出力に出力
   */
  async handleStandardOutput(
    format: 'json' | 'html' | 'yaml',
    result: AnalysisResult,
    jsonFormatter: IOutputFormatter,
    htmlFormatter: IOutputFormatter,
    logger: ILogger
  ): Promise<void> {
    try {
      const output = await this.formatOutput(format, result, jsonFormatter, htmlFormatter);
      
      // YAMLサポート確認
      if (format === 'yaml') {
        this.handleUnsupportedFormat(format);
      }
      
      // 標準出力
      log.plain(output);
      
    } catch (error) {
      this.handleError(error, logger);
    }
  }
  
  /**
   * 出力フォーマット処理（複雑度: 3）
   */
  private async formatOutput(
    format: 'json' | 'html' | 'yaml',
    result: AnalysisResult,
    jsonFormatter: IOutputFormatter,
    htmlFormatter: IOutputFormatter
  ): Promise<string> {
    switch (format) {
      case 'json':
        return await jsonFormatter.format(result);
      case 'html':
        return await htmlFormatter.format(result);
      case 'yaml':
        // YAML formatはjsonFormatterでYAML形式として出力
        return await jsonFormatter.format(result);
      default:
        throw Errors.Common.outputError(
          `Unsupported output format: ${String(format)}`,
          { format }
        );
    }
  }
  
  /**
   * サポートされていないフォーマットの処理（複雑度: 1）
   */
  private handleUnsupportedFormat(format: string): void {
    throw Errors.Common.outputError(
      'YAML output format is not yet implemented',
      { requestedFormat: format }
    );
  }
  
  /**
   * エラーハンドリング（複雑度: 2）
   */
  private handleError(error: unknown, logger: ILogger): void {
    if (error instanceof CloudSupporterError) {
      logger.error(error.message, error.details);
    } else {
      logger.error('Unexpected error during output generation', error);
    }
    throw error;
  }
}

/**
 * ファイル出力ハンドラー実装
 * Single Responsibility: ファイル出力処理のみ
 * 複雑度: 4以下
 */
export class FileOutputHandler implements IFileOutputHandler {
  /**
   * 結果をファイルに出力
   */
  async handleFileOutput(
    filePath: string,
    format: 'json' | 'html' | 'yaml',
    result: AnalysisResult,
    jsonFormatter: IOutputFormatter,
    htmlFormatter: IOutputFormatter,
    logger: ILogger
  ): Promise<void> {
    try {
      // ファイルパス検証
      this.validateFilePath(filePath);
      
      // 出力フォーマット
      const output = await this.formatOutput(format, result, jsonFormatter, htmlFormatter);
      
      // ファイル書き込み
      this.writeFile(filePath, output, format);
      
      // 成功ログ
      log.success(`Report saved: ${filePath}`);
      
    } catch (error) {
      this.handleError(error, logger);
    }
  }
  
  /**
   * ファイルパス検証（複雑度: 2）
   */
  private validateFilePath(filePath: string): void {
    // 空文字列チェック
    if (!filePath || filePath.trim() === '') {
      throw Errors.Common.validationFailed(
        'Invalid file path provided',
        { filePath }
      );
    }

    const dir = path.dirname(filePath);
    const isAbsolute = path.isAbsolute(filePath);

    // 絶対パスまたは相対パスの検証
    if (!dir || (!isAbsolute && dir.startsWith('..'))) {
      throw Errors.Common.validationFailed(
        'Invalid file path provided',
        { filePath }
      );
    }
  }
  
  /**
   * 出力フォーマット処理（複雑度: 3）
   */
  private async formatOutput(
    format: 'json' | 'html' | 'yaml',
    result: AnalysisResult,
    jsonFormatter: IOutputFormatter,
    htmlFormatter: IOutputFormatter
  ): Promise<string> {
    switch (format) {
      case 'json':
        return await jsonFormatter.format(result);
      case 'html':
        return await htmlFormatter.format(result);
      case 'yaml':
        // YAML formatはjsonFormatterでYAML形式として出力
        return await jsonFormatter.format(result);
      default:
        throw Errors.Common.outputError(
          `Unsupported output format: ${String(format)}`,
          { format }
        );
    }
  }
  
  /**
   * ファイル書き込み（複雑度: 2）
   */
  private writeFile(filePath: string, content: string, format: string): void {
    try {
      writeFileSync(filePath, content, 'utf-8');
    } catch (error) {
      throw Errors.Common.fileWriteError(
        filePath,
        format,
        (error as Error).message
      );
    }
  }
  
  /**
   * エラーハンドリング（複雑度: 2）
   */
  private handleError(error: unknown, logger: ILogger): void {
    if (error instanceof CloudSupporterError) {
      logger.error(error.message, error.details);
    } else {
      logger.error('Unexpected error during file output', error);
    }
    throw error;
  }
}

/**
 * 統計情報表示ヘルパー
 * Single Responsibility: 統計情報表示のみ
 */
export class StatisticsDisplayHelper {
  /**
   * 分析統計を表示
   * 複雑度: 1
   */
  static displayAnalysisStatistics(
    result: AnalysisResult,
    verbose: boolean,
    _logger: ILogger
  ): void {
    if (!verbose) return;
    
    log.stats('Analysis Statistics', {
      'Template': result.metadata.template_path,
      'Total Resources': result.metadata.total_resources,
      'Supported Resources': result.metadata.supported_resources,
      'Unsupported Resources': result.unsupported_resources.length,
      'Processing Time': `${result.metadata.processing_time_ms ?? 'N/A'}ms`
    });
  }
}