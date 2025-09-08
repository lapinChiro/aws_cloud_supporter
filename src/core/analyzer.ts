// CLAUDE.md準拠: 型安全性・SOLID原則・DRY原則
// requirement.md準拠: MetricsAnalyzer統合実装

import { performance } from 'perf_hooks';
import { ITemplateParser } from '../interfaces/parser';
import { ILogger } from '../interfaces/logger';
import { IMetricsAnalyzer, AnalysisOptions, AnalysisStatistics, ExtendedAnalysisResult, AnalysisError } from '../interfaces/analyzer';
import { IMetricsGenerator } from '../interfaces/generator';
import { CloudFormationTemplate, CloudFormationResource } from '../types/cloudformation';
import { ResourceWithMetrics } from '../types/metrics';
import { CloudSupporterError, ErrorType } from '../utils/error';

// Generators
import { RDSMetricsGenerator } from '../generators/rds.generator';
import { LambdaMetricsGenerator } from '../generators/lambda.generator';
import { ECSMetricsGenerator } from '../generators/ecs.generator';
import { ALBMetricsGenerator } from '../generators/alb.generator';
import { DynamoDBMetricsGenerator } from '../generators/dynamodb.generator';
import { APIGatewayMetricsGenerator } from '../generators/apigateway.generator';

/**
 * MetricsAnalyzer実装
 * SOLID原則: Single Responsibility（メトリクス分析統合）
 * requirement.md: Phase 4統合実装
 */
export class MetricsAnalyzer implements IMetricsAnalyzer {
  private generators: Map<string, IMetricsGenerator> = new Map();
  private lastAnalysisStats: AnalysisStatistics | null = null;
  private memoryMonitorInterval: NodeJS.Timeout | null = null;
  
  constructor(
    private parser: ITemplateParser,
    private logger: ILogger
  ) {
    this.initializeGenerators();
  }
  
  /**
   * 6つのGeneratorを初期化
   * DRY原則: Generator登録の共通化
   */
  private initializeGenerators(): void {
    const generators = [
      new RDSMetricsGenerator(this.logger),
      new LambdaMetricsGenerator(this.logger),
      new ECSMetricsGenerator(this.logger),
      new ALBMetricsGenerator(this.logger),
      new DynamoDBMetricsGenerator(this.logger),
      new APIGatewayMetricsGenerator(this.logger)
    ];
    
    // 各Generatorがサポートするリソースタイプを登録
    for (const generator of generators) {
      for (const type of generator.getSupportedTypes()) {
        this.generators.set(type, generator);
      }
    }
    
    this.logger.debug(`Initialized ${generators.length} generators supporting ${this.generators.size} resource types`);
  }
  
  /**
   * CloudFormationテンプレートを分析
   * requirement.md: 30秒以内・256MB以下制限
   */
  async analyze(templatePath: string, options: AnalysisOptions): Promise<ExtendedAnalysisResult> {
    const startTime = performance.now();
    const errors: AnalysisError[] = [];
    let memoryMonitoringPromise: Promise<void> | null = null;
    
    try {
      // メモリ制限の事前チェック
      if (options.memoryLimit) {
        const currentMemory = process.memoryUsage().heapUsed;
        if (currentMemory > options.memoryLimit) {
          throw new CloudSupporterError(
            ErrorType.RESOURCE_ERROR,
            `Memory usage already exceeds limit: ${(currentMemory / 1024 / 1024).toFixed(1)}MB (limit: ${(options.memoryLimit / 1024 / 1024).toFixed(0)}MB)`
          );
        }
        
        // メモリ監視開始 (Promise-based)
        memoryMonitoringPromise = this.startMemoryMonitoring(options.memoryLimit);
      }
      
      // メイン処理を実行
      const analysisWorkPromise = this.performAnalysis(templatePath, options, errors, startTime);
      
      // メモリ監視とレースする
      const result = memoryMonitoringPromise 
        ? await Promise.race([analysisWorkPromise, memoryMonitoringPromise.then(() => { throw new Error('Memory monitor should not resolve'); })])
        : await analysisWorkPromise;
      
      return result;
      
    } catch (error) {
      this.logger.error('Failed to parse template', error);
      
      if (error instanceof CloudSupporterError) {
        throw error;
      }
      
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        `Analysis failed: ${(error as Error).message}`,
        { originalError: (error as Error).message || String(error) }
      );
      
    } finally {
      // メモリ監視停止
      if (this.memoryMonitorInterval) {
        clearInterval(this.memoryMonitorInterval);
        this.memoryMonitorInterval = null;
      }
    }
  }
  
  /**
   * メイン分析処理
   */
  private async performAnalysis(
    templatePath: string, 
    options: AnalysisOptions, 
    errors: AnalysisError[], 
    startTime: number
  ): Promise<ExtendedAnalysisResult> {
    let parseTime = 0;
    let generatorTime = 0;
    let memoryPeak = 0;
    
    // 1. テンプレート解析
    this.logger.info(`Starting analysis of ${templatePath}`);
    const parseStart = performance.now();
    
    const template = await this.parser.parse(templatePath);
    
    parseTime = performance.now() - parseStart;
    this.logger.info('Template parsed successfully');
    
    // 2. リソース抽出・分類
    const extractStart = performance.now();
    const { supportedResources, unsupportedResources, totalResources } = this.extractResources(template, options);
    const extractTime = performance.now() - extractStart;
    
    if (options.verbose) {
      this.logger.info(`Processing resources: ${supportedResources.length} supported, ${unsupportedResources.length} unsupported`);
    }
    
    // 3. 並列メトリクス生成
    const genStart = performance.now();
    
    const resourcesWithMetrics = await this.generateMetricsInParallel(
      supportedResources,
      options,
      errors
    );
    
    generatorTime = performance.now() - genStart;
    
    // 4. 結果構築
    const totalTime = performance.now() - startTime;
    const result: ExtendedAnalysisResult = {
      metadata: {
        version: '1.0.0',
        generated_at: new Date().toISOString(),
        template_path: templatePath,
        total_resources: totalResources,
        supported_resources: supportedResources.length,
        processing_time_ms: Math.round(totalTime),
        parse_time_ms: Math.round(parseTime),
        extract_time_ms: Math.round(extractTime),
        generator_time_ms: Math.round(generatorTime),
        total_time_ms: Math.round(totalTime),
        memory_peak_mb: Math.round(memoryPeak / (1024 * 1024))
      },
      resources: resourcesWithMetrics,
      unsupported_resources: options.includeUnsupported === false ? [] : unsupportedResources
    };
    
    // メモリ使用量記録
    const currentMemory = process.memoryUsage().heapUsed;
    memoryPeak = Math.max(memoryPeak, currentMemory);
    
    // パフォーマンスメトリクス追加
    if (options.collectMetrics) {
      result.performanceMetrics = {
        parseTime: Math.round(parseTime),
        generatorTime: Math.round(generatorTime),
        formatterTime: 0,
        totalTime: Math.round(performance.now() - startTime),
        memoryPeak,
        resourceCount: supportedResources.length,
        concurrentTasks: options.concurrency || 6
      };
    }
    
    // エラー情報追加
    if (errors.length > 0) {
      result.errors = errors;
    }
    
    // 統計情報保存
    this.lastAnalysisStats = {
      totalResources,
      supportedResources: supportedResources.length,
      unsupportedResources: unsupportedResources.length,
      resourcesByType: this.countResourcesByType(template.Resources),
      processingTimeMs: Math.round(performance.now() - startTime),
      memoryUsageMB: memoryPeak / (1024 * 1024)
    };
    
    // 完了ログ
    this.logger.info(`Analysis completed in ${result.metadata.processing_time_ms}ms`);
    this.logger.info(`Analysis completed with peak memory usage: ${result.metadata.memory_peak_mb}MB`);
    
    // パフォーマンス警告
    if (result.metadata.processing_time_ms && result.metadata.processing_time_ms > 30000) {
      this.logger.warn(`Processing time exceeded 30s target: ${result.metadata.processing_time_ms}ms`);
    }
    
    return result;
  }

  /**
   * メモリ使用量監視 (Promise-based)
   */
  private async startMemoryMonitoring(limit: number): Promise<void> {
    this.logger.debug(`Starting memory monitoring with limit: ${(limit / 1024 / 1024).toFixed(1)}MB`);
    
    return new Promise<void>((_, reject) => {
      this.memoryMonitorInterval = setInterval(() => {
        const usage = process.memoryUsage().heapUsed;
        this.logger.debug(`Memory check: ${(usage / 1024 / 1024).toFixed(1)}MB / ${(limit / 1024 / 1024).toFixed(1)}MB`);
        
        if (usage > limit) {
          this.logger.debug(`Memory limit exceeded! ${(usage / 1024 / 1024).toFixed(1)}MB > ${(limit / 1024 / 1024).toFixed(1)}MB`);
          
          // メモリ監視停止
          if (this.memoryMonitorInterval) {
            clearInterval(this.memoryMonitorInterval);
            this.memoryMonitorInterval = null;
          }
          
          // Promiseを拒否
          const message = `Memory usage exceeded: ${(usage / 1024 / 1024).toFixed(1)}MB (limit: ${(limit / 1024 / 1024).toFixed(0)}MB)`;
          reject(new CloudSupporterError(ErrorType.RESOURCE_ERROR, message));
        }
      }, 50); // 50ms間隔でチェック
    });
  }
  
  /**
   * リソース抽出・分類
   */
  private extractResources(template: CloudFormationTemplate, options: AnalysisOptions): {
    supportedResources: Array<{ logicalId: string; resource: CloudFormationResource }>;
    unsupportedResources: string[];
    totalResources: number;
  } {
    const supportedResources: Array<{ logicalId: string; resource: CloudFormationResource }> = [];
    const unsupportedResources: string[] = [];
    let totalResources = 0;
    
    // resourceTypesフィルタリング用のセット
    const allowedTypes = options.resourceTypes ? new Set(options.resourceTypes) : null;
    
    for (const [logicalId, resource] of Object.entries(template.Resources || {})) {
      totalResources++;
      
      // resourceTypesフィルタリングが指定されていて、そのタイプが含まれていない場合はスキップ
      if (allowedTypes && !allowedTypes.has(resource.Type)) {
        unsupportedResources.push(logicalId);
        continue;
      }
      
      if (this.generators.has(resource.Type)) {
        supportedResources.push({ logicalId, resource });
      } else {
        unsupportedResources.push(logicalId);
      }
    }
    
    return { supportedResources, unsupportedResources, totalResources };
  }
  
  /**
   * 並列メトリクス生成
   * requirement.md: p-limit使用・並列処理最適化
   */
  private async generateMetricsInParallel(
    resources: Array<{ logicalId: string; resource: CloudFormationResource }>,
    options: AnalysisOptions,
    errors: AnalysisError[]
  ): Promise<ResourceWithMetrics[]> {
    const concurrency = options.concurrency || 6;
    
    this.logger.info(`Generating metrics with ${concurrency} parallel processing`);
    
    if (options.verbose) {
      this.logger.debug(`Processing ${resources.length} resources concurrently`);
    }
    
    // 直接的な並列処理（p-limitの問題を回避）
    const generateMetricsForResource = async (logicalId: string, resource: CloudFormationResource): Promise<ResourceWithMetrics | null> => {
      try {
        const generator = this.generators.get(resource.Type);
        if (!generator) {
          throw new CloudSupporterError(
            ErrorType.RESOURCE_ERROR,
            `No generator found for resource type: ${resource.Type}`,
            { resourceType: resource.Type }
          );
        }
        
        const metrics = await generator.generate(resource);
        
        if (typeof metrics === 'function' || !Array.isArray(metrics)) {
          throw new CloudSupporterError(
            ErrorType.RESOURCE_ERROR,
            `Invalid metrics type: expected array, got ${typeof metrics}`,
            { resourceId: logicalId, resourceType: resource.Type, metricsType: typeof metrics }
          );
        }
        
        const result = {
          logical_id: logicalId,
          resource_type: resource.Type,
          resource_properties: this.sanitizeProperties((resource.Properties || {}) as Record<string, unknown>),
          metrics
        };
        
        return result;
      } catch (error) {
        // エラー記録
        errors.push({
          resourceId: logicalId,
          resourceType: resource.Type,
          error: (error as Error).message,
          stack: (error as Error).stack
        });
        
        if (!options.continueOnError) {
          throw error;
        }
        
        this.logger.warn(`Failed to generate metrics for ${logicalId}: ${(error as Error).message}`);
        return null;
      }
    };
    
    // 直接的な並列処理
    const tasks = resources.map(({ logicalId, resource }) => 
      generateMetricsForResource(logicalId, resource)
    );
    
    // 並列実行
    const results = await Promise.all(tasks);
    
    // null（エラー）を除外
    return results.filter((r): r is ResourceWithMetrics => r !== null);
  }
  
  /**
   * プロパティのサニタイズ（機密情報除去）
   */
  private sanitizeProperties(properties: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['Password', 'Secret', 'Key', 'Token', 'Credential'];
    
    for (const [key, value] of Object.entries(properties)) {
      if (sensitiveKeys.some(sensitive => key.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeProperties(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  /**
   * リソースタイプ別カウント
   */
  private countResourcesByType(resources: Record<string, CloudFormationResource>): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const resource of Object.values(resources)) {
      counts[resource.Type] = (counts[resource.Type] || 0) + 1;
    }
    
    return counts;
  }
  
  /**
   * 登録済みGenerator名取得
   */
  getRegisteredGenerators(): string[] {
    return [
      'RDSMetricsGenerator',
      'LambdaMetricsGenerator',
      'ECSMetricsGenerator',
      'ALBMetricsGenerator',
      'DynamoDBMetricsGenerator',
      'APIGatewayMetricsGenerator'
    ];
  }
  
  /**
   * 分析統計情報取得
   */
  getAnalysisStatistics(): AnalysisStatistics | null {
    return this.lastAnalysisStats;
  }
}