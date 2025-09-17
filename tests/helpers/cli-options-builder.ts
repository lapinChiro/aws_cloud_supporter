// CLI Options Builder Pattern
// CLAUDE.md準拠: DRY原則・Builder Pattern

import type { CLIOptions } from '../../src/cli/interfaces/command.interface';

/**
 * CLIオプションビルダー
 * テスト用CLIオプションの段階的構築
 */
export class CLIOptionsBuilder {
  private file = '/test/template.yaml';
  private output: 'json' | 'html' | 'yaml' | 'cdk' = 'json';
  private verbose = false;
  private includeLow = false;
  private noColor = true;
  private includeUnsupported = false;
  private performanceMode = false;
  private resourceTypes?: string;

  // CDK関連オプション
  private cdkOutputDir?: string;
  private cdkStackName?: string;
  private validateCdk = false;
  private cdkEnableSns = false;
  private cdkSnsTopicArn?: string;

  /**
   * ファイルパスを設定
   */
  withFile(file: string): this {
    this.file = file;
    return this;
  }

  /**
   * 出力形式を設定
   */
  withOutput(output: 'json' | 'html' | 'yaml' | 'cdk'): this {
    this.output = output;
    return this;
  }

  /**
   * 詳細ログを有効化
   */
  enableVerbose(): this {
    this.verbose = true;
    return this;
  }

  /**
   * 低重要度メトリクスを含める
   */
  includeLowImportance(): this {
    this.includeLow = true;
    return this;
  }

  /**
   * カラー出力を無効化
   */
  disableColor(): this {
    this.noColor = true;
    return this;
  }

  /**
   * カラー出力を有効化
   */
  enableColor(): this {
    this.noColor = false;
    return this;
  }

  /**
   * サポートされていないリソースを含める
   */
  includeUnsupportedResources(): this {
    this.includeUnsupported = true;
    return this;
  }

  /**
   * パフォーマンスモードを有効化
   */
  enablePerformanceMode(): this {
    this.performanceMode = true;
    return this;
  }

  /**
   * リソースタイプフィルター設定
   */
  withResourceTypes(types: string): this {
    this.resourceTypes = types;
    return this;
  }

  /**
   * CDK出力ディレクトリを設定
   */
  withCdkOutputDir(dir: string): this {
    this.cdkOutputDir = dir;
    return this;
  }

  /**
   * CDKスタック名を設定
   */
  withCdkStackName(name: string): this {
    this.cdkStackName = name;
    return this;
  }

  /**
   * CDKバリデーションを有効化
   */
  enableCdkValidation(): this {
    this.validateCdk = true;
    return this;
  }

  /**
   * CDK SNSを有効化
   */
  enableCdkSns(topicArn?: string): this {
    this.cdkEnableSns = true;
    if (topicArn) {
      this.cdkSnsTopicArn = topicArn;
    }
    return this;
  }

  /**
   * ビルド
   */
  build(): CLIOptions {
    const options: CLIOptions = {
      file: this.file,
      output: this.output,
      verbose: this.verbose,
      includeLow: this.includeLow,
      noColor: this.noColor,
      includeUnsupported: this.includeUnsupported,
      performanceMode: this.performanceMode
    };

    if (this.resourceTypes) options.resourceTypes = this.resourceTypes;
    if (this.cdkOutputDir) options.cdkOutputDir = this.cdkOutputDir;
    if (this.cdkStackName) options.cdkStackName = this.cdkStackName;
    if (this.validateCdk) options.validateCdk = this.validateCdk;
    if (this.cdkEnableSns) options.cdkEnableSns = this.cdkEnableSns;
    if (this.cdkSnsTopicArn) options.cdkSnsTopicArn = this.cdkSnsTopicArn;

    return options;
  }

  /**
   * デフォルトオプション
   */
  static default(): CLIOptions {
    return new CLIOptionsBuilder().build();
  }

  /**
   * JSON出力用プリセット
   */
  static forJsonOutput(file?: string): CLIOptions {
    const builder = new CLIOptionsBuilder().withOutput('json');
    if (file) builder.withFile(file);
    return builder.build();
  }

  /**
   * HTML出力用プリセット
   */
  static forHtmlOutput(file?: string): CLIOptions {
    const builder = new CLIOptionsBuilder()
      .withOutput('html')
      .enableColor();
    if (file) builder.withFile(file);
    return builder.build();
  }

  /**
   * CDK出力用プリセット
   */
  static forCdkOutput(outputDir: string, stackName?: string): CLIOptions {
    return new CLIOptionsBuilder()
      .withOutput('cdk')
      .withCdkOutputDir(outputDir)
      .withCdkStackName(stackName ?? 'CloudWatchAlarmsStack')
      .build();
  }

  /**
   * CDKフル機能プリセット
   */
  static forCdkFull(outputDir: string): CLIOptions {
    return new CLIOptionsBuilder()
      .withOutput('cdk')
      .withCdkOutputDir(outputDir)
      .withCdkStackName('CloudWatchAlarmsStack')
      .enableCdkValidation()
      .enableCdkSns()
      .enableVerbose()
      .build();
  }

  /**
   * デバッグ用プリセット
   */
  static forDebug(file?: string): CLIOptions {
    const builder = new CLIOptionsBuilder()
      .enableVerbose()
      .enableColor()
      .includeLowImportance()
      .includeUnsupportedResources();
    if (file) builder.withFile(file);
    return builder.build();
  }

  /**
   * パフォーマンステスト用プリセット
   */
  static forPerformanceTest(file?: string): CLIOptions {
    const builder = new CLIOptionsBuilder()
      .enablePerformanceMode()
      .disableColor();
    if (file) builder.withFile(file);
    return builder.build();
  }
}

/**
 * ファクトリ関数
 */
export function cliOptions(): CLIOptionsBuilder {
  return new CLIOptionsBuilder();
}