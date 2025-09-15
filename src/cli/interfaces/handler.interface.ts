// CLAUDE.md準拠: Interface Segregation・型安全性・No any types
// T-016: CLI型定義 - ハンドラーインターフェース

import type { IOutputFormatter } from '../../interfaces/formatter';
import type { ILogger } from '../../interfaces/logger';
import type { AnalysisResult } from '../../types/metrics';

import type { CLIDependencies, CLIOptions } from './command.interface';


/**
 * CDKハンドラーインターフェース
 * Single Responsibility: CDK生成処理のみ
 */
export interface ICDKHandler {
  /**
   * CDK生成処理を実行
   * @param templatePath テンプレートファイルパス
   * @param options CLIオプション
   * @param dependencies 依存性オブジェクト
   */
  handleCDKGeneration(
    templatePath: string,
    options: CLIOptions,
    dependencies: CLIDependencies
  ): Promise<void>;
}

/**
 * CDKオプションバリデーターインターフェース
 * Single Responsibility: CDKオプション検証のみ
 */
export interface ICDKOptionsValidator {
  /**
   * CDKオプションを検証
   * @param options CLIオプション
   * @param dependencies 依存性オブジェクト
   */
  validateCDKOptions(
    options: CLIOptions,
    dependencies: CLIDependencies
  ): void;
}



/**
 * CDK出力ハンドラーインターフェース
 * Single Responsibility: CDK出力処理のみ
 */
export interface ICDKOutputHandler {
  /**
   * CDK生成結果を出力
   * @param projectDir プロジェクトディレクトリ
   * @param files 生成ファイル
   * @param message メッセージ
   * @param options CLIオプション
   * @param logger ロガー
   */
  outputCDKResult(
    projectDir: string,
    files: Record<string, string>,
    message: string,
    options: CLIOptions,
    logger: ILogger
  ): Promise<void>;
}

/**
 * 標準出力ハンドラーインターフェース
 * Single Responsibility: 標準出力処理のみ
 */
export interface IStandardOutputHandler {
  /**
   * 結果を標準出力に出力
   * @param format 出力形式
   * @param result 分析結果
   * @param jsonFormatter JSONフォーマッター
   * @param htmlFormatter HTMLフォーマッター
   * @param logger ロガー
   */
  handleStandardOutput(
    format: 'json' | 'html' | 'yaml',
    result: AnalysisResult,
    jsonFormatter: IOutputFormatter,
    htmlFormatter: IOutputFormatter,
    logger: ILogger
  ): Promise<void>;
}

/**
 * ファイル出力ハンドラーインターフェース
 * Single Responsibility: ファイル出力処理のみ
 */
export interface IFileOutputHandler {
  /**
   * 結果をファイルに出力
   * @param filePath ファイルパス
   * @param format 出力形式
   * @param result 分析結果
   * @param jsonFormatter JSONフォーマッター
   * @param htmlFormatter HTMLフォーマッター
   * @param logger ロガー
   */
  handleFileOutput(
    filePath: string,
    format: 'json' | 'html' | 'yaml',
    result: AnalysisResult,
    jsonFormatter: IOutputFormatter,
    htmlFormatter: IOutputFormatter,
    logger: ILogger
  ): Promise<void>;
}
