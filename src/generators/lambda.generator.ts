// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計

import { BaseMetricsGenerator } from './base.generator';
import { CloudFormationResource, LambdaFunction, LambdaProperties } from '../types/cloudformation';
import { MetricConfig } from '../types/metrics';
import { METRICS_CONFIG_MAP } from '../config/metrics-definitions';
import { CloudSupporterError, ErrorType } from '../utils/error';

/**
 * Lambda Function用メトリクス生成器
 * SOLID原則: 単一責任（Lambdaメトリクス生成のみ）
 */
export class LambdaMetricsGenerator extends BaseMetricsGenerator {
  /**
   * サポートするリソースタイプ
   * AWS::Lambda::FunctionおよびAWS::Serverless::Function（SAM）
   */
  getSupportedTypes(): string[] {
    return ['AWS::Lambda::Function', 'AWS::Serverless::Function'];
  }


  /**
   * メモリサイズに基づくスケール係数計算
   * CLAUDE.md準拠: No any types（unknown型・型安全性）
   */
  protected getResourceScale(resource: CloudFormationResource): number {
    const lambda = resource as LambdaFunction;
    const properties = lambda.Properties as LambdaProperties | undefined;
    const memorySize = properties?.MemorySize || 128; // デフォルト128MB
    
    // メモリサイズベースのスケール計算（AWS Lambda制限準拠）
    // 最小: 128MB、最大: 10240MB (10GB)
    // スケール係数 = メモリサイズ / 基準値（1024MB）
    
    if (memorySize <= 256) {
      return 0.5; // 小規模関数
    } else if (memorySize <= 512) {
      return 0.7; // 軽量関数
    } else if (memorySize <= 1024) {
      return 1.0; // 標準関数（基準値）
    } else if (memorySize <= 1536) {
      return 1.3; // 中規模関数
    } else if (memorySize <= 2048) {
      return 1.7; // 大規模関数
    } else if (memorySize <= 3008) {
      return 2.0; // 重処理関数
    } else if (memorySize <= 4096) {
      return 2.5; // 超大規模関数
    } else if (memorySize <= 6144) {
      return 3.0; // メモリ集約型関数
    } else if (memorySize <= 8192) {
      return 3.5; // 超メモリ集約型関数
    } else {
      return 4.0; // 最大規模関数（10240MB）
    }
  }


  /**
   * ランタイム別の追加考慮事項
   * コンテナイメージ関数の初期化時間考慮
   */
  private isContainerFunction(resource: CloudFormationResource): boolean {
    const lambda = resource as LambdaFunction;
    const properties = lambda.Properties as LambdaProperties | undefined;
    return properties?.PackageType === 'Image';
  }

  /**
   * プロビジョニング済み同時実行の確認
   */
  private hasProvisionedConcurrency(resource: CloudFormationResource): boolean {
    const lambda = resource as LambdaFunction;
    const properties = lambda.Properties as LambdaProperties | undefined;
    return (properties?.ReservedConcurrentExecutions ?? 0) > 0;
  }

  /**
   * メトリクス設定のオーバーライド（Lambda固有の調整）
   */
  protected getMetricsConfig(resource: CloudFormationResource): MetricConfig[] {
    const baseConfigs = METRICS_CONFIG_MAP['AWS::Lambda::Function'];
    
    // CLAUDE.md準拠: No any types（型安全性）
    if (!baseConfigs) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'Lambda metrics configuration not found',
        { resourceType: 'AWS::Lambda::Function' }
      );
    }
    
    // CLAUDE.md準拠: 型安全性（スプレッド演算子による不変性）
    return baseConfigs.map(config => {
      if (config.name === 'Duration') {
        // 実行時間メトリクスはメモリサイズに応じて調整（タイムアウトスケールは適用しない）
        return config;
      }
      
      // コンテナ関数の場合、InitDurationの重要度を上げる
      if (config.name === 'InitDuration' && this.isContainerFunction(resource)) {
        return {
          ...config,
          importance: 'High' as const
        };
      }
      
      // プロビジョニング済み同時実行がある場合の調整
      if (config.name === 'ProvisionedConcurrencyUtilization' && this.hasProvisionedConcurrency(resource)) {
        return {
          ...config,
          importance: 'High' as const
        };
      }
      
      return config;
    });
  }
}