// src/generators/cdk-official.generator.ts (新規作成)
import * as fs from 'fs/promises';
import * as path from 'path';

import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import type * as sns from 'aws-cdk-lib/aws-sns';
import * as Handlebars from 'handlebars';


import type { ExtendedAnalysisResult } from '../interfaces/analyzer';
import type { ILogger } from '../interfaces/logger';
// Security imports
import { CDKInputValidator } from '../security/input-validator';
import { CDKSecuritySanitizer } from '../security/sanitizer';
// Handlebars helpers
import { CDKOfficialHandlebarsHelpers } from '../templates/handlebars-official-helpers';
import type { CDKStackDataOfficial, CDKAlarmComplete, CDKSNSConfiguration, CDKOptions } from '../types/cdk-business';
import type { ResourceWithMetrics, MetricDefinition } from '../types/metrics';
import { CloudSupporterError, ErrorType } from '../utils/error';

/**
 * テンプレート用アラーム型（CDKAlarmComplete + テンプレート用プロパティ）
 */
interface CDKAlarmTemplateData extends CDKAlarmComplete {
  /** テンプレート用に事前処理されたメトリクス情報 */
  metricForTemplate: {
    metricName: string;
    namespace: string;
    dimensionsMap: cloudwatch.DimensionsMap;
    statistic: string;
    period: { seconds: number };
  };
}

/**
 * テンプレート用スタックデータ型（CDKStackDataOfficial + テンプレート用プロパティ）
 */
interface CDKStackTemplateData {
  readonly stackClassName: string;
  readonly alarms: CDKAlarmTemplateData[];
  readonly metadata: {
    readonly generatedAt: string;
    readonly templatePath: string;
    readonly totalResources: number;
    readonly totalAlarms: number;
    readonly toolVersion: string;
  };
  readonly snsConfiguration?: CDKSNSConfiguration;
}

/**
 * CDK公式型使用Generator
 * 要件: aws-cdk-lib公式型の使用、独自型定義の廃止
 */
export class CDKOfficialGenerator {
  private template: HandlebarsTemplateDelegate | null = null;
  private readonly templatePath: string;

  constructor(private readonly logger: ILogger) {
    this.templatePath = path.join(__dirname, '../templates/cdk-official.hbs');
  }

  /**
   * 公式型使用CDK生成メイン処理
   */
  async generate(
    analysisResult: ExtendedAnalysisResult,
    options: CDKOptions
  ): Promise<string> {
    const startTime = performance.now();
    
    try {
      this.logger.debug('Starting CDK Official Types generation process');
      
      // 1. 入力検証（既存互換）
      this.validateInput(analysisResult, options);
      
      // 2. サポートリソースフィルタリング（既存互換）  
      const supportedResources = this.filterSupportedResources(analysisResult.resources, options);
      this.logger.debug(`Found ${supportedResources.length} supported resources for official CDK generation`);
      
      // 3. 公式型ベースでCDKデータ構築
      const stackData = this.buildOfficialStackData(supportedResources, options, analysisResult.metadata.template_path);
      
      // 4. テンプレート用データに変換
      const templateData = this.buildTemplateStackData(stackData);
      
      // 5. テンプレート適用
      await this.loadTemplate();
      const generatedCode = this.template?.(templateData) ?? '';
      
      // 6. フォーマット
      const formattedCode = this.formatCode(generatedCode);
      
      // 7. セキュリティ検証（生成コード）
      CDKInputValidator.validateGeneratedCode(formattedCode);
      
      const duration = performance.now() - startTime;
      this.logger.debug(`CDK Official Types generation completed in ${duration.toFixed(1)}ms`);
      
      return formattedCode;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error(`CDK Official Types generation failed after ${duration.toFixed(1)}ms`, error as Error);
      
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        `CDK Official Types generation failed: ${(error as Error).message}`,
        { 
          analysisResultMetadata: analysisResult?.metadata || null,
          processingTimeMs: Math.round(duration),
          originalError: (error as Error).message 
        }
      );
    }
  }

  /**
   * AWS公式cloudwatch.IMetricを直接生成
   */
  private createOfficialMetric(
    resource: ResourceWithMetrics,
    metric: MetricDefinition
  ): cloudwatch.IMetric {
    return new cloudwatch.Metric({
      metricName: metric.metric_name,
      namespace: metric.namespace,
      dimensionsMap: this.buildDimensionsForResourceType(
        resource.resource_type,
        resource.logical_id
      ),
      statistic: metric.statistic,
      period: cdk.Duration.seconds(metric.evaluation_period)
    });
  }

  /**
   * 完全なAlarm定義を公式型ベースで生成
   */
  private createBasicAlarmDefinition(
    resource: ResourceWithMetrics,
    metric: MetricDefinition,
    severity: 'Warning' | 'Critical'
  ): CDKAlarmComplete {
    const officialMetric = this.createOfficialMetric(resource, metric);
    const threshold = severity === 'Warning'
      ? metric.recommended_threshold.warning
      : metric.recommended_threshold.critical;

    return {
      // AWS公式cloudwatch.AlarmPropsプロパティ
      metric: officialMetric,
      threshold,
      alarmDescription: metric.description,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,

      // ビジネスロジックプロパティ
      constructId: this.generateConstructId(resource.logical_id, metric.metric_name, severity),
      severity,
      resourceLogicalId: resource.logical_id,
      resourceType: resource.resource_type
    };
  }

  /**
   * 入力検証（既存CDKGeneratorと同等）
   */
  private validateInput(analysisResult: ExtendedAnalysisResult, options: CDKOptions): void {
    if (!analysisResult) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'Analysis result is required for CDK generation'
      );
    }

    if (!analysisResult.resources || !Array.isArray(analysisResult.resources)) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'Analysis result must contain a resources array'
      );
    }

    if (!analysisResult.metadata) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'Analysis result must contain metadata'
      );
    }
    
    if (!options?.enabled) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'CDK mode must be enabled in options'
      );
    }

    // 包括的セキュリティ検証
    const validationOptions: { stackName?: string; outputDir?: string; snsTopicArn?: string } = {};
    
    if (options.stackName) validationOptions.stackName = options.stackName;
    if (options.outputDir) validationOptions.outputDir = options.outputDir;
    if (options.snsTopicArn) validationOptions.snsTopicArn = options.snsTopicArn;
    
    CDKInputValidator.validateCDKOptions(validationOptions);
  }

  /**
   * サポートリソースフィルタリング（既存CDKGeneratorと同等）
   */
  private filterSupportedResources(
    resources: ResourceWithMetrics[], 
    options: CDKOptions
  ): ResourceWithMetrics[] {
    const SUPPORTED_RESOURCE_TYPES = [
      'AWS::RDS::DBInstance',
      'AWS::Lambda::Function',
      'AWS::Serverless::Function',
      'AWS::ECS::Service',
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      'AWS::DynamoDB::Table',
      'AWS::ApiGateway::RestApi',
      'AWS::Serverless::Api'
    ];

    let filteredResources = resources.filter(r => 
      SUPPORTED_RESOURCE_TYPES.includes(r.resource_type)
    );

    if (options.resourceTypeFilters && options.resourceTypeFilters.length > 0) {
      const filters = options.resourceTypeFilters;
      filteredResources = filteredResources.filter(r =>
        filters.includes(r.resource_type)
      );
    }

    return filteredResources;
  }

  /**
   * construct ID生成（既存CDKGeneratorと同等）
   */
  private generateConstructId(logicalId: string, metricName: string, severity: string): string {
    const sanitizedLogicalId = this.sanitizeIdentifier(logicalId);
    const sanitizedMetricName = this.sanitizeIdentifier(metricName);
    
    return `${sanitizedLogicalId}${sanitizedMetricName}${severity}Alarm`;
  }

  /**
   * 識別子サニタイズ（既存CDKGeneratorと同等）
   */
  private sanitizeIdentifier(input: string): string {
    // Keep first digit for identifiers like 4XXError -> FourXXError, 5XXError -> FiveXXError
    let sanitized = input
      .replace(/^4/, 'Four')
      .replace(/^5/, 'Five');
    
    // Replace non-alphanumeric characters with underscore
    sanitized = sanitized
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^[^a-zA-Z_]/, '_')
      .replace(/__+/g, '_');
    
    return sanitized;
  }

  /**
   * ディメンションマップ構築（既存CDKGeneratorと同等、返り値型が異なる）
   */
  private buildDimensionsForResourceType(
    resourceType: string, 
    logicalId: string
  ): cloudwatch.DimensionsMap {
    const dimensionMap: Record<string, Record<string, string>> = {
      'AWS::RDS::DBInstance': { DBInstanceIdentifier: logicalId },
      'AWS::Lambda::Function': { FunctionName: logicalId },
      'AWS::Serverless::Function': { FunctionName: logicalId },
      'AWS::DynamoDB::Table': { TableName: logicalId },
      'AWS::ApiGateway::RestApi': { ApiName: logicalId },
      'AWS::Serverless::Api': { ApiName: logicalId },
      'AWS::ElasticLoadBalancingV2::LoadBalancer': { LoadBalancer: logicalId },
      'AWS::ECS::Service': { 
        ServiceName: logicalId,
        ClusterName: 'default'
      }
    };
    
    const dimensions = dimensionMap[resourceType];
    
    if (!dimensions) {
      this.logger.warn(`Unknown resource type for dimension mapping: ${resourceType}, using generic ResourceId`);
      return { ResourceId: logicalId };
    }
    
    return dimensions;
  }

  /**
   * 公式型ベースでCDKデータ構築（セキュリティ機能統合）
   */
  private buildOfficialStackData(
    resources: ResourceWithMetrics[],
    options: CDKOptions,
    templatePath: string
  ): CDKStackDataOfficial {
    const alarms: CDKAlarmComplete[] = [];
    
    // セキュリティ機能統合（既存CDKSecuritySanitizer使用）
    for (const resource of resources) {
      const sanitizedProperties = CDKSecuritySanitizer.sanitizeForCDK(resource.resource_properties);
      const sanitizationReport = CDKSecuritySanitizer.getSanitizationReport(
        resource.resource_properties,
        sanitizedProperties
      );

      if (sanitizationReport.hasSensitiveData && options.verbose) {
        this.logger.warn(
          `Sanitized ${sanitizationReport.sensitivePropertiesFound} sensitive properties in ${resource.logical_id}: ${sanitizationReport.redactedKeys.join(', ')}`
        );
      }
      
      for (const metric of resource.metrics) {
        if (!options.includeLowImportance && metric.importance === 'Low') continue;
        
        // Warning alarm (公式型使用)
        const warningAlarm = this.createAdvancedAlarmDefinition(resource, metric, 'Warning');
        alarms.push(warningAlarm);
        
        // Critical alarm (公式型使用)
        const criticalAlarm = this.createAdvancedAlarmDefinition(resource, metric, 'Critical');
        alarms.push(criticalAlarm);
      }
    }

    // SNS設定構築
    const snsConfig = this.buildOfficialSNSConfiguration(options);

    const stackData: CDKStackDataOfficial = {
      stackClassName: options.stackName ?? 'CloudWatchAlarmsStack',
      alarms,
      metadata: {
        generatedAt: new Date().toISOString(),
        templatePath: templatePath || 'unknown',
        totalResources: resources.length,
        totalAlarms: alarms.length,
        toolVersion: '1.0.0'
      },
      ...(snsConfig && { snsConfiguration: snsConfig })
    };

    return stackData;
  }

  /**
   * テンプレート用スタックデータ構築
   */
  private buildTemplateStackData(
    stackData: CDKStackDataOfficial
  ): CDKStackTemplateData {
    const templateAlarms: CDKAlarmTemplateData[] = stackData.alarms.map(alarm => 
      this.convertAlarmToTemplateData(alarm)
    );

    const templateData: CDKStackTemplateData = {
      stackClassName: stackData.stackClassName,
      alarms: templateAlarms,
      metadata: stackData.metadata,
      ...(stackData.snsConfiguration && { snsConfiguration: stackData.snsConfiguration })
    };

    return templateData;
  }

  /**
   * CDKAlarmCompleteをテンプレート用データに変換
   */
  private convertAlarmToTemplateData(alarm: CDKAlarmComplete): CDKAlarmTemplateData {
    const metricForTemplate = CDKOfficialHandlebarsHelpers.processMetricForTemplate(alarm.metric);

    return {
      ...alarm,
      metricForTemplate
    };
  }

  /**
   * SNS設定の公式型ベース構築
   */
  private buildOfficialSNSConfiguration(options: CDKOptions): CDKSNSConfiguration | undefined {
    if (options.snsTopicArn) {
      // 既存SNS Topic ARN使用
      this.logger.debug(`Using existing SNS topic: ${options.snsTopicArn}`);
      return {
        variableName: 'alarmTopic',
        isExisting: true,
        topicArn: options.snsTopicArn
      };
    } else if (options.enableSNS) {
      // 新規SNS Topic作成
      this.logger.debug('Creating new SNS topic for alarm notifications');
      return {
        variableName: 'alarmTopic',
        isExisting: false,
        topicProps: {
          topicName: 'CloudWatchAlarmNotifications',
          displayName: 'CloudWatch Alarm Notifications'
        } satisfies sns.TopicProps // 公式型使用
      };
    }
    return undefined;
  }

  /**
   * 高度なアラーム定義生成（SNS統合込み）
   */
  private createAdvancedAlarmDefinition(
    resource: ResourceWithMetrics,
    metric: MetricDefinition,
    severity: 'Warning' | 'Critical'
  ): CDKAlarmComplete {
    const basicDefinition = this.createBasicAlarmDefinition(resource, metric, severity);
    
    // 高度機能の追加（必要に応じてプロパティ拡張）
    return {
      ...basicDefinition,
      // 追加のAWS公式プロパティ
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      datapointsToAlarm: 1
    };
  }

  /**
   * テンプレート読み込み（Handlebarsヘルパー登録込み）
   */
  private async loadTemplate(): Promise<void> {
    if (this.template) {
      return;
    }

    try {
      // Handlebarsヘルパーの登録（公式型対応）
      CDKOfficialHandlebarsHelpers.registerHelpers();
      
      const templateContent = await fs.readFile(this.templatePath, 'utf-8');
      this.template = Handlebars.compile(templateContent);
      
      this.logger.debug(`CDK Official template loaded from ${this.templatePath} with helpers registered`);
      
    } catch (error) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        `CDK Official template loading failed: ${(error as Error).message}`,
        { templatePath: this.templatePath, originalError: (error as Error).message }
      );
    }
  }

  /**
   * コードフォーマット（既存CDKGeneratorと同等）
   */
  private formatCode(code: string): string {
    return code
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+$/gm, '')
      .trim() + '\n';
  }
}