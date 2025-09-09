// CLAUDE.md準拠: 型安全性・SOLID原則・DRY原則
// T-016: CLI完全実装（GREEN段階）

import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { IMetricsAnalyzer } from '../interfaces/analyzer';
import { ITemplateParser } from '../interfaces/parser';
import { IOutputFormatter } from '../interfaces/formatter';
import { ILogger } from '../interfaces/logger';
import { CloudSupporterError, ErrorType } from '../utils/error';
import { ExtendedAnalysisResult } from '../interfaces/analyzer';

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
  output: 'json' | 'html' | 'yaml';
  file?: string;
  resourceTypes?: string;
  includeLow: boolean;
  verbose: boolean;
  noColor: boolean;
  includeUnsupported: boolean;
  performanceMode: boolean;
}

/**
 * CLIコマンド作成
 * SOLID原則: Dependency Injection
 * @param dependencies 依存性オブジェクト
 * @returns Commander Command インスタンス
 */
export function createCLICommand(dependencies: CLIDependencies): Command {
  const { analyzer, logger, jsonFormatter, htmlFormatter } = dependencies;
  
  const program = new Command();
  
  program
    .name('aws-cloud-supporter')
    .description('Generate CloudWatch metrics recommendations for CloudFormation templates')
    .version('1.0.0')
    .argument('<template>', 'CloudFormation template file path (.yaml/.yml/.json)')
    .option('-o, --output <format>', 'Output format: json|html|yaml', 'json')
    .option('-f, --file <path>', 'Output file path (default: stdout)')
    .option('--resource-types <types>', 'Comma-separated resource types to analyze')
    .option('--include-low', 'Include low importance metrics', false)
    .option('-v, --verbose', 'Enable verbose logging', false)
    .option('--no-color', 'Disable colored output', true)
    .option('--include-unsupported', 'Include unsupported resources in output', true)
    .option('--performance-mode', 'Enable performance mode with higher concurrency', false)
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
        if (!['json', 'html', 'yaml'].includes(options.output)) {
          throw new CloudSupporterError(
            ErrorType.OUTPUT_ERROR,
            `Invalid output format: ${options.output}. Supported formats: json, html, yaml`
          );
        }
        
        // YAMLフォーマットチェック（未実装）
        if (options.output === 'yaml') {
          throw new CloudSupporterError(
            ErrorType.OUTPUT_ERROR,
            'YAML output format is not yet implemented'
          );
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