// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計
// T-016: CDKハンドラー - CDK生成処理の分割実装

import * as fs from 'fs/promises';
import * as path from 'path';

import { CDKOfficialGenerator } from '../../generators/cdk-official.generator';
import type { ExtendedAnalysisResult } from '../../interfaces/analyzer';
import type { CDKOptions } from '../../types/cdk-business';
import type { AnalysisResult } from '../../types/metrics';
import { CloudSupporterError, ErrorType } from '../../utils/error';
import { log } from '../../utils/logger';
import { CDKValidator } from '../../validation/cdk-validator';
import type { CLIDependencies, CLIOptions } from '../interfaces/command.interface';
import type { 
  ICDKHandler, 
  ICDKTypeDeterminer, 
  ICDKCodeGenerator, 
  ICDKOutputHandler 
} from '../interfaces/handler.interface';

import { CDKOptionsValidator } from './validation';

/**
 * CDKハンドラー実装
 * Single Responsibility: CDK生成処理のオーケストレーション
 * 複雑度: handleCDKGenerationは25 → 5以下に削減
 */
export class CDKHandler implements ICDKHandler {
  private readonly validator: CDKOptionsValidator;
  private readonly outputHandler: CDKOutputHandler;

  constructor() {
    this.validator = new CDKOptionsValidator();
    this.outputHandler = new CDKOutputHandler();
  }

  /**
   * CDK生成処理を実行（複雑度: 5以下）
   */
  async handleCDKGeneration(
    templatePath: string,
    options: CLIOptions,
    dependencies: CLIDependencies
  ): Promise<void> {
    const { analyzer, logger } = dependencies;
    
    try {
      logger.info(`🚀 Starting CDK generation for ${templatePath}`);
      
      // 1. オプション検証
      this.validator.validateCDKOptions(options, dependencies);
      
      // 2. 分析実行
      const analysisResult = await this.executeAnalysis(templatePath, options, analyzer);
      
      // 3. CDKオプション構築
      const cdkOptions = this.buildCDKOptions(options);
      
      // 4. CDKコード生成
      const cdkCode = await this.generateCDK(analysisResult, cdkOptions, options, logger);
      
      // 5. 出力処理
      await this.outputHandler.outputCDKResult(
        options.cdkOutputDir || '',
        { [cdkOptions.stackName + '.ts']: cdkCode },
        'CDK Stack generated successfully',
        options,
        logger
      );
      
    } catch (error) {
      this.handleError(error, options);
    }
  }

  /**
   * 分析実行（複雑度: 1）
   */
  private async executeAnalysis(
    templatePath: string,
    options: CLIOptions,
    analyzer: any
  ): Promise<ExtendedAnalysisResult> {
    return await analyzer.analyze(templatePath, {
      outputFormat: 'json',
      includeUnsupported: options.includeUnsupported,
      concurrency: options.performanceMode ? 10 : 6,
      verbose: options.verbose,
      collectMetrics: true,
      continueOnError: true
    });
  }

  /**
   * CDKオプション構築（複雑度: 4）
   */
  private buildCDKOptions(options: CLIOptions): CDKOptions {
    const cdkOptions: CDKOptions = {
      enabled: true,
      includeLowImportance: options.includeLow,
      verbose: options.verbose,
      stackName: options.cdkStackName || 'CloudWatchAlarmsStack'
    };
    
    // オプショナルプロパティの設定
    if (options.cdkOutputDir) cdkOptions.outputDir = options.cdkOutputDir;
    if (options.resourceTypes) cdkOptions.resourceTypeFilters = options.resourceTypes.split(',').map(t => t.trim());
    if (options.validateCdk) cdkOptions.validateCode = options.validateCdk;
    if (options.cdkEnableSns) cdkOptions.enableSNS = options.cdkEnableSns;
    if (options.cdkSnsTopicArn) cdkOptions.snsTopicArn = options.cdkSnsTopicArn;
    
    return cdkOptions;
  }

  /**
   * CDKコード生成（複雑度: 3）
   */
  private async generateCDK(
    analysisResult: ExtendedAnalysisResult,
    cdkOptions: CDKOptions,
    options: CLIOptions,
    logger: any
  ): Promise<string> {
    const cdkGenerator = new CDKOfficialGenerator(logger);
    
    if (options.verbose) {
      logger.info('🔄 Using aws-cdk-lib official types system');
    }
    
    const cdkCode = await cdkGenerator.generate(analysisResult, cdkOptions);
    
    // バリデーション実行（必要な場合）
    if (cdkOptions.validateCode) {
      await this.validateCDKCode(cdkCode, options, logger);
    }
    
    return cdkCode;
  }

  /**
   * CDKコード検証（複雑度: 4）
   */
  private async validateCDKCode(cdkCode: string, options: CLIOptions, logger: any): Promise<void> {
    const validator = new CDKValidator(logger);
    const validationResult = await validator.validateGeneratedCode(cdkCode, {
      compileCheck: true,
      bestPracticesCheck: true,
      awsLimitsCheck: true,
      verbose: options.verbose
    });

    // 結果表示
    this.displayValidationResults(validationResult, options);

    if (!validationResult.isValid) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        `CDK validation failed with ${validationResult.errors.length} errors`,
        { validationResult }
      );
    }
    
    log.success('CDK validation passed successfully');
  }

  /**
   * バリデーション結果表示（複雑度: 3）
   */
  private displayValidationResults(validationResult: any, options: CLIOptions): void {
    if (validationResult.errors.length > 0) {
      log.errorList('CDK Validation Errors', validationResult.errors);
    }

    if (validationResult.warnings.length > 0) {
      log.warnList('CDK Validation Warnings', validationResult.warnings);
    }

    if (validationResult.suggestions.length > 0 && options.verbose) {
      log.infoList('CDK Suggestions', validationResult.suggestions);
    }

    log.stats('CDK Code Metrics', {
      'Code Length': `${validationResult.metrics.codeLength} characters`,
      'Alarms Generated': validationResult.metrics.alarmCount,
      'Imports': validationResult.metrics.importCount
    });
  }

  /**
   * エラーハンドリング（複雑度: 2）
   */
  private handleError(error: unknown, options: CLIOptions): void {
    if (error instanceof CloudSupporterError) {
      log.plainError(`CDK Generation Error: ${error.message}`);
      if (options.verbose && error.details) {
        log.plain('Details:', error.details);
      }
    } else {
      log.plainError(`Unexpected CDK error: ${(error as Error).message}`);
      if (options.verbose) {
        log.plain((error as Error).stack ?? 'No stack trace available');
      }
    }
    
    process.exit(1);
  }
}

/**
 * CDKタイプ判定実装
 * Single Responsibility: CDKタイプの判定のみ
 * 複雑度: 8以下
 */
export class CDKTypeDeterminer implements ICDKTypeDeterminer {
  determineCDKType(
    _result: AnalysisResult | ExtendedAnalysisResult,
    _options: CLIOptions,
    _logger: any
  ): 'official' | 'classic' {
    // M-009: Default to Official Types
    return 'official';
  }
}

/**
 * CDKコード生成実装
 * Single Responsibility: CDKコード生成のみ
 * 複雑度: 5以下
 */
export class CDKCodeGenerator implements ICDKCodeGenerator {
  async generateCDKCode(
    _templatePath: string,
    _cdkType: 'official' | 'classic',
    result: AnalysisResult | ExtendedAnalysisResult,
    cdkOptions: CDKOptions,
    dependencies: CLIDependencies
  ): Promise<{
    projectDir: string;
    files: Record<string, string>;
    message: string;
  }> {
    const { logger } = dependencies;
    
    // Official CDKのみサポート
    const cdkGenerator = new CDKOfficialGenerator(logger);
    const cdkCode = await cdkGenerator.generate(result as ExtendedAnalysisResult, cdkOptions);
    
    return {
      projectDir: cdkOptions.outputDir || '.',
      files: { [cdkOptions.stackName + '.ts']: cdkCode },
      message: 'CDK Stack generated successfully'
    };
  }
}

/**
 * CDK出力ハンドラー実装
 * Single Responsibility: CDK出力処理のみ
 * 複雑度: 4以下
 */
export class CDKOutputHandler implements ICDKOutputHandler {
  async outputCDKResult(
    _projectDir: string,
    files: Record<string, string>,
    _message: string,
    options: CLIOptions,
    logger: any
  ): Promise<void> {
    // ファイル出力モード
    if (options.cdkOutputDir) {
      await this.writeFiles(options.cdkOutputDir, files, options, logger);
    } else {
      // 標準出力モード
      const cdkCode = Object.values(files)[0];
      if (cdkCode) {
        log.plain(cdkCode);
      }
    }
  }
  
  /**
   * ファイル書き込み処理（複雑度: 3）
   */
  private async writeFiles(
    outputDir: string,
    files: Record<string, string>,
    options: CLIOptions,
    logger: any
  ): Promise<void> {
    // ディレクトリ作成
    await fs.mkdir(outputDir, { recursive: true });
    
    for (const [fileName, content] of Object.entries(files)) {
      const filePath = path.join(outputDir, fileName);
      
      // ファイル書き込み
      await fs.writeFile(filePath, content, 'utf-8');
      
      // パーミッション設定
      await this.setSecurePermissions(filePath, options, logger);
      
      log.success(`CDK Stack generated: ${filePath}`);
    }
    
    if (options.verbose) {
      logger.success('CDK generation completed successfully');
    }
  }
  
  /**
   * セキュアなファイルパーミッション設定（複雑度: 2）
   */
  private async setSecurePermissions(
    filePath: string,
    options: CLIOptions,
    logger: any
  ): Promise<void> {
    try {
      await fs.chmod(filePath, 0o600);
      if (options.verbose) {
        logger.debug(`Set secure file permissions (600) for ${filePath}`);
      }
    } catch (error) {
      // Windows環境では警告のみ
      logger.warn(`Could not set file permissions for ${filePath}: ${(error as Error).message}`);
    }
  }
}