// CLAUDE.md準拠: 型安全性・SOLID原則・DRY原則
// T-016: CLI完全実装（GREEN段階）

import { Command } from 'commander';
import { writeFileSync } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IMetricsAnalyzer } from '../interfaces/analyzer';
import { ITemplateParser } from '../interfaces/parser';
import { IOutputFormatter } from '../interfaces/formatter';
import { ILogger } from '../interfaces/logger';
import { CloudSupporterError, ErrorType } from '../utils/error';
import { ExtendedAnalysisResult } from '../interfaces/analyzer';
// CDK imports (Official Types Only - M-009)
import { CDKOfficialGenerator } from '../generators/cdk-official.generator';
import { CDKOptions } from '../types/cdk-business';
// CDK validation imports (T-010)
import { CDKValidator } from '../validation/cdk-validator';

// CLI依存性注入インターフェース
interface CLIDependencies {
  analyzer: IMetricsAnalyzer;
  parser: ITemplateParser;
  jsonFormatter: IOutputFormatter;
  htmlFormatter: IOutputFormatter;
  logger: ILogger;
}

// CLIオプション型定義
interface CLIOptions {
  output: 'json' | 'html' | 'yaml' | 'cdk';
  file?: string;
  resourceTypes?: string;
  includeLow: boolean;
  verbose: boolean;
  noColor: boolean;
  includeUnsupported: boolean;
  performanceMode: boolean;
  // CDK-specific options (T-004)
  cdkOutputDir?: string;
  cdkStackName?: string;
  validateCdk?: boolean;
  // SNS integration options (T-007)
  cdkEnableSns?: boolean;
  cdkSnsTopicArn?: string;
}

/**
 * CLIコマンド作成
 * SOLID原則: Dependency Injection
 * @param dependencies 依存性オブジェクト
 * @returns Commander Command インスタンス
 */
export function createCLICommand(dependencies: CLIDependencies): Command {
  const { analyzer, parser, logger, jsonFormatter, htmlFormatter } = dependencies;
  
  const program = new Command();
  
  program
    .name('aws-cloud-supporter')
    .description('Generate CloudWatch metrics recommendations for CloudFormation templates')
    .version('1.0.0')
    .argument('<template>', 'CloudFormation template file path (.yaml/.yml/.json)')
    .option('-o, --output <format>', 'Output format: json|html|yaml|cdk', 'json')
    .option('-f, --file <path>', 'Output file path (default: stdout)')
    .option('--resource-types <types>', 'Comma-separated resource types to analyze')
    .option('--include-low', 'Include low importance metrics', false)
    .option('-v, --verbose', 'Enable verbose logging', false)
    .option('--no-color', 'Disable colored output', true)
    .option('--include-unsupported', 'Include unsupported resources in output', true)
    .option('--performance-mode', 'Enable performance mode with higher concurrency', false)
    // CDK-specific options (T-004)
    .option('--cdk-output-dir <path>', 'CDK files output directory')
    .option('--cdk-stack-name <name>', 'CDK Stack class name', 'CloudWatchAlarmsStack')
    .option('--validate-cdk', 'Validate generated CDK code compilation', false)
    // SNS integration options (T-007)
    .option('--cdk-enable-sns', 'Generate SNS topic for alarm notifications', false)
    .option('--cdk-sns-topic-arn <arn>', 'Use existing SNS topic ARN for notifications')
    .addHelpText('after', '\nSupported Resource Types:\n' +
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
    )
    .action(async (templatePath: string, options: CLIOptions) => {
      try {
        // Verboseモードに応じてログレベルを調整
        if (options.verbose) {
          // Verboseモードでは詳細ログを有効化
          logger.setLevel('debug');
          logger.info(`🚀 Starting analysis of ${templatePath}`);
          logger.info(`📊 Output format: ${options.output}`);
          if (options.file) {
            logger.info(`📁 Output file: ${options.file}`);
          }
          if (options.resourceTypes) {
            logger.info(`🎯 Filtering resource types: ${options.resourceTypes}`);
          }
        } else {
          // 非verboseモードでは警告以上のみ（CLIの静寂性を保つ）
          logger.setLevel('warn');
        }
        
        // 出力フォーマット検証
        if (!['json', 'html', 'yaml', 'cdk'].includes(options.output)) {
          throw new CloudSupporterError(
            ErrorType.OUTPUT_ERROR,
            `Invalid output format: ${options.output}. Supported formats: json, html, yaml, cdk`
          );
        }
        
        // YAMLフォーマットチェック（未実装）
        if (options.output === 'yaml') {
          throw new CloudSupporterError(
            ErrorType.OUTPUT_ERROR,
            'YAML output format is not yet implemented'
          );
        }

        // CDK mode routing (T-004)
        if (options.output === 'cdk') {
          await handleCDKGeneration(templatePath, options, { analyzer, parser, jsonFormatter, htmlFormatter, logger });
          return;
        }
        
        // 分析オプション構築
        const analysisOptions = {
          outputFormat: options.output,
          includeUnsupported: options.includeUnsupported,
          concurrency: options.performanceMode ? 10 : 6,
          verbose: options.verbose,
          collectMetrics: true,
          continueOnError: true
        };
        
        // テンプレート分析実行
        const startTime = Date.now();
        const analysisResult = await analyzer.analyze(templatePath, analysisOptions);
        
        // リソースタイプフィルタリング
        let filteredResult = analysisResult;
        if (options.resourceTypes) {
          const allowedTypes = options.resourceTypes.split(',').map(t => t.trim());
          filteredResult = {
            ...analysisResult,
            resources: analysisResult.resources.filter(resource => 
              allowedTypes.includes(resource.resource_type)
            )
          };
          
          // メタデータ更新
          filteredResult.metadata.supported_resources = filteredResult.resources.length;
        }
        
        // Low importanceメトリクスフィルタリング
        if (!options.includeLow) {
          filteredResult = {
            ...filteredResult,
            resources: filteredResult.resources.map(resource => ({
              ...resource,
              metrics: resource.metrics.filter(metric => 
                metric.importance.toLowerCase() !== 'low')
            }))
          };
        }
        
        // フォーマッター選択
        const formatter = options.output === 'html' ? htmlFormatter : jsonFormatter;
        
        // 出力フォーマット
        const formattedOutput = await formatter.format(filteredResult);
        
        // 出力処理
        if (options.file) {
          writeFileSync(options.file, formattedOutput, 'utf8');
          console.log(`✅ Report saved: ${options.file}`);
          
          if (options.verbose) {
            logger.success(`Analysis completed successfully in ${Date.now() - startTime}ms`);
          }
        } else {
          console.log(formattedOutput);
        }
        
        // Verboseモードで統計情報表示
        if (options.verbose) {
          displayStatistics(analyzer, analysisResult);
        }
        
      } catch (error) {
        // エラーハンドリング
        if (error instanceof CloudSupporterError) {
          console.error(`❌ Error: ${error.message}`);
          if (options.verbose && error.details) {
            console.error('Details:', error.details);
          }
        } else {
          console.error(`❌ Unexpected error: ${(error as Error).message}`);
          if (options.verbose) {
            console.error((error as Error).stack);
          }
        }
        
        process.exit(1);
      }
    });
  
  return program;
}

/**
 * 統計情報表示
 * @param analyzer メトリクスアナライザー
 * @param result 分析結果
 */
function displayStatistics(
  analyzer: IMetricsAnalyzer, 
  result: ExtendedAnalysisResult
): void {
  const stats = analyzer.getAnalysisStatistics();
  
  if (stats) {
    console.log('\n📊 Analysis Statistics:');
    console.log(`   Total Resources: ${stats.totalResources}`);
    console.log(`   Supported: ${stats.supportedResources}`);
    console.log(`   Unsupported: ${stats.unsupportedResources}`);
    console.log(`   Processing Time: ${stats.processingTimeMs}ms`);
    console.log(`   Memory Usage: ${stats.memoryUsageMB.toFixed(1)}MB`);
    
    if (Object.keys(stats.resourcesByType).length > 0) {
      console.log('\n📈 Resources by Type:');
      Object.entries(stats.resourcesByType).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    }
  }
  
  // パフォーマンスメトリクス表示
  if (result.performanceMetrics) {
    console.log('\n⚡ Performance Metrics:');
    console.log(`   Parse Time: ${result.performanceMetrics.parseTime}ms`);
    console.log(`   Generator Time: ${result.performanceMetrics.generatorTime}ms`);
    console.log(`   Total Time: ${result.performanceMetrics.totalTime}ms`);
    console.log(`   Concurrent Tasks: ${result.performanceMetrics.concurrentTasks}`);
  }
  
  // エラー情報表示
  if (result.errors && result.errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    result.errors.forEach(err => {
      console.log(`   - ${err.resourceId} (${err.resourceType}): ${err.error}`);
    });
  }
}

/**
 * Handle CDK code generation mode
 * 
 * @param templatePath CloudFormation template file path
 * @param options CLI options containing CDK-specific configuration
 * @param dependencies Injected dependencies (analyzer, logger, etc.)
 * 
 * @requirement FR-6.1 CLIオプション
 * @requirement FR-1.2 出力制御
 */
async function handleCDKGeneration(
  templatePath: string,
  options: CLIOptions,
  dependencies: CLIDependencies
): Promise<void> {
  const { analyzer, logger } = dependencies;
  
  try {
    logger.info(`🚀 Starting CDK generation for ${templatePath}`);
    
    // 1. Execute existing analysis pipeline (no changes to existing code)
    const analysisResult = await analyzer.analyze(templatePath, {
      outputFormat: 'json', // Always use json format for CDK processing
      includeUnsupported: options.includeUnsupported,
      concurrency: options.performanceMode ? 10 : 6,
      verbose: options.verbose,
      collectMetrics: true,
      continueOnError: true
    });
    
    // 2. Build CDK options from CLI options
    const cdkOptions: CDKOptions = {
      enabled: true,
      includeLowImportance: options.includeLow,
      verbose: options.verbose
    };
    
    // Add optional properties only if they have values
    if (options.cdkOutputDir) {
      cdkOptions.outputDir = options.cdkOutputDir;
    }
    
    if (options.cdkStackName) {
      cdkOptions.stackName = options.cdkStackName;
    } else {
      cdkOptions.stackName = 'CloudWatchAlarmsStack';
    }
    
    if (options.resourceTypes) {
      cdkOptions.resourceTypeFilters = options.resourceTypes.split(',').map(t => t.trim());
    }
    
    if (options.validateCdk) {
      cdkOptions.validateCode = options.validateCdk;
    }
    
    // SNS integration options (T-007)
    if (options.cdkEnableSns) {
      cdkOptions.enableSNS = options.cdkEnableSns;
    }
    
    if (options.cdkSnsTopicArn) {
      cdkOptions.snsTopicArn = options.cdkSnsTopicArn;
    }
    
    // 3. Generate CDK code using official types (M-009: Default to Official Types)
    const cdkGenerator = new CDKOfficialGenerator(logger);
    if (options.verbose) {
      logger.info('🔄 Using aws-cdk-lib official types system');
    }
    
    const cdkCode = await cdkGenerator.generate(analysisResult, cdkOptions);

    // 4. Validate CDK code if requested (T-010)
    if (cdkOptions.validateCode) {
      const validator = new CDKValidator(logger);
      const validationResult = await validator.validateGeneratedCode(cdkCode, {
        compileCheck: true,
        bestPracticesCheck: true,
        awsLimitsCheck: true,
        verbose: options.verbose
      });

      // Display validation results
      if (validationResult.errors.length > 0) {
        console.error('\n❌ CDK Validation Errors:');
        validationResult.errors.forEach(error => console.error(`  - ${error}`));
      }

      if (validationResult.warnings.length > 0) {
        console.warn('\n⚠️  CDK Validation Warnings:');
        validationResult.warnings.forEach(warning => console.warn(`  - ${warning}`));
      }

      if (validationResult.suggestions.length > 0 && options.verbose) {
        console.log('\n💡 CDK Suggestions:');
        validationResult.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
      }

      // Display metrics
      console.log('\n📊 CDK Code Metrics:');
      console.log(`  Code Length: ${validationResult.metrics.codeLength} characters`);
      console.log(`  Alarms Generated: ${validationResult.metrics.alarmCount}`);
      console.log(`  Imports: ${validationResult.metrics.importCount}`);

      if (!validationResult.isValid) {
        throw new CloudSupporterError(
          ErrorType.RESOURCE_ERROR,
          `CDK validation failed with ${validationResult.errors.length} errors`,
          { validationResult }
        );
      } else {
        console.log('\n✅ CDK validation passed successfully');
      }
    }
    
    // 5. Output handling (stdout vs file)
    if (options.cdkOutputDir) {
      // File output mode
      const fileName = `${cdkOptions.stackName}.ts`;
      const filePath = path.join(options.cdkOutputDir, fileName);
      
      // Ensure output directory exists
      await fs.mkdir(options.cdkOutputDir, { recursive: true });
      
      // Write CDK code to file with secure permissions (T-009)
      await fs.writeFile(filePath, cdkCode, 'utf-8');
      
      // Set secure file permissions on Unix systems (owner read/write only)
      try {
        await fs.chmod(filePath, 0o600);
        if (options.verbose) {
          logger.debug(`Set secure file permissions (600) for ${filePath}`);
        }
      } catch (chmodError) {
        // Log warning but don't fail (Windows doesn't support chmod)
        logger.warn(`Could not set file permissions for ${filePath}: ${(chmodError as Error).message}`);
      }
      
      console.log(`✅ CDK Stack generated: ${filePath}`);
      
      if (options.verbose) {
        logger.success(`CDK generation completed successfully`);
        logger.info(`Generated ${analysisResult.metadata.supported_resources} resources with alarms`);
      }
    } else {
      // Stdout output mode
      console.log(cdkCode);
    }
    
  } catch (error) {
    // CDK-specific error handling
    if (error instanceof CloudSupporterError) {
      console.error(`❌ CDK Generation Error: ${error.message}`);
      if (options.verbose && error.details) {
        console.error('Details:', error.details);
      }
    } else {
      console.error(`❌ Unexpected CDK error: ${(error as Error).message}`);
      if (options.verbose) {
        console.error((error as Error).stack);
      }
    }
    
    // Exit with error code
    process.exit(1);
  }
}