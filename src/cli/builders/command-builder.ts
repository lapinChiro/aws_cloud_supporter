// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計
// T-016: CLIコマンド構築 - コマンドビルダー実装

import { Command } from 'commander';

import type { CLIDependencies, ICommandBuilder, ICommandOptionsBuilder } from '../interfaces/command.interface';

/**
 * CLIコマンドビルダー実装
 * Single Responsibility: Commandインスタンスの構築のみ
 */
export class CommandBuilder implements ICommandBuilder {
  private readonly optionsBuilder: ICommandOptionsBuilder;

  constructor() {
    this.optionsBuilder = new CommandOptionsBuilder();
  }

  /**
   * CLIコマンドを構築
   * @param dependencies 依存性オブジェクト
   * @returns Commander Command インスタンス
   */
  buildCommand(_dependencies: CLIDependencies): Command {
    const program = new Command();
    
    // 基本設定
    program
      .name('aws-cloud-supporter')
      .description('Generate CloudWatch metrics recommendations for CloudFormation templates')
      .version('1.0.0')
      .argument('<template>', 'CloudFormation template file path (.yaml/.yml/.json)');
    
    // オプション設定を委譲
    this.optionsBuilder.addBasicOptions(program);
    this.optionsBuilder.addCDKOptions(program);
    this.optionsBuilder.addHelpInformation(program);
    
    return program;
  }
}

/**
 * コマンドオプションビルダー実装
 * Single Responsibility: オプション設定のみ
 */
export class CommandOptionsBuilder implements ICommandOptionsBuilder {
  /**
   * 基本オプションを設定
   * @param command Commandインスタンス
   */
  addBasicOptions(command: Command): void {
    command
      .option('-o, --output <format>', 'Output format: json|html|yaml|cdk', 'json')
      .option('-f, --file <path>', 'Output file path (default: stdout)')
      .option('--resource-types <types>', 'Comma-separated resource types to analyze')
      .option('--include-low', 'Include low importance metrics', false)
      .option('-v, --verbose', 'Enable verbose logging', false)
      .option('--no-color', 'Disable colored output', true)
      .option('--include-unsupported', 'Include unsupported resources in output', true)
      .option('--performance-mode', 'Enable performance mode with higher concurrency', false);
  }
  
  /**
   * CDK関連オプションを設定
   * @param command Commandインスタンス
   */
  addCDKOptions(command: Command): void {
    command
      .option('--cdk-output-dir <path>', 'CDK files output directory')
      .option('--cdk-stack-name <name>', 'CDK Stack class name', 'CloudWatchAlarmsStack')
      .option('--validate-cdk', 'Validate generated CDK code compilation', false)
      .option('--cdk-enable-sns', 'Generate SNS topic for alarm notifications', false)
      .option('--cdk-sns-topic-arn <arn>', 'Use existing SNS topic ARN for notifications');
  }
  
  /**
   * ヘルプ情報を追加
   * @param command Commandインスタンス
   */
  addHelpInformation(command: Command): void {
    command.addHelpText('after', '\nSupported Resource Types:\n' +
      '  • AWS::RDS::DBInstance\n' +
      '  • AWS::Lambda::Function  \n' +
      '  • AWS::ECS::Service (Fargate only)\n' +
      '  • AWS::ElasticLoadBalancingV2::LoadBalancer\n' +
      '  • AWS::DynamoDB::Table\n' +
      '  • AWS::ApiGateway::RestApi\n' +
      '  • AWS::Serverless::Function (SAM)\n' +
      '  • AWS::Serverless::Api (SAM)\n' +
      '\nExamples:\n' +
      '  $ aws-cloud-supporter template.yaml\n' +
      '  $ aws-cloud-supporter template.yaml --output html --file report.html\n' +
      '  $ aws-cloud-supporter template.yaml --resource-types "AWS::RDS::DBInstance,AWS::Lambda::Function"\n' +
      '  $ aws-cloud-supporter template.yaml --output cdk --cdk-output-dir ./cdk\n' +
      '  $ aws-cloud-supporter template.yaml --output cdk --cdk-stack-name MyAlarmsStack\n' +
      '  $ aws-cloud-supporter template.yaml --output cdk --cdk-enable-sns\n' +
      '  $ aws-cloud-supporter template.yaml --output cdk --cdk-sns-topic-arn arn:aws:sns:us-east-1:123456789012:my-topic\n' +
      '  $ aws-cloud-supporter template.yaml --verbose --performance-mode'
    );
  }
}