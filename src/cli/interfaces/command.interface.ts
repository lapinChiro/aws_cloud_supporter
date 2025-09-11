// CLAUDE.md準拠: Interface Segregation・型安全性・No any types
// T-016: CLI型定義 - コマンドインターフェース

import type { Command } from 'commander';
import type { IMetricsAnalyzer } from '../../interfaces/analyzer';
import type { IOutputFormatter } from '../../interfaces/formatter';
import type { ILogger } from '../../interfaces/logger';
import type { ITemplateParser } from '../../interfaces/parser';

/**
 * CLI依存性注入インターフェース
 * Dependency Inversion Principle: 実装ではなく抽象に依存
 */
export interface CLIDependencies {
  analyzer: IMetricsAnalyzer;
  parser: ITemplateParser;
  jsonFormatter: IOutputFormatter;
  htmlFormatter: IOutputFormatter;
  logger: ILogger;
}

/**
 * CLIオプション型定義
 * Single Responsibility: CLIオプションの型定義のみ
 */
export interface CLIOptions {
  // 基本オプション
  output: 'json' | 'html' | 'yaml' | 'cdk';
  file?: string;
  resourceTypes?: string;
  includeLow: boolean;
  verbose: boolean;
  noColor: boolean;
  includeUnsupported: boolean;
  performanceMode: boolean;
  
  // CDK固有オプション
  cdkOutputDir?: string;
  cdkStackName?: string;
  validateCdk?: boolean;
  
  // SNS統合オプション
  cdkEnableSns?: boolean;
  cdkSnsTopicArn?: string;
}

/**
 * CLIコマンドビルダーインターフェース
 * Single Responsibility: コマンド構築のみ
 */
export interface ICommandBuilder {
  /**
   * CLIコマンドを構築
   * @param dependencies 依存性オブジェクト
   * @returns Commander Command インスタンス
   */
  buildCommand(dependencies: CLIDependencies): Command;
}

/**
 * コマンドオプション設定インターフェース
 * Interface Segregation: オプション設定のみ
 */
export interface ICommandOptionsBuilder {
  /**
   * 基本オプションを設定
   * @param command Commandインスタンス
   */
  addBasicOptions(command: Command): void;
  
  /**
   * CDK関連オプションを設定
   * @param command Commandインスタンス
   */
  addCDKOptions(command: Command): void;
  
  /**
   * ヘルプ情報を追加
   * @param command Commandインスタンス
   */
  addHelpInformation(command: Command): void;
}