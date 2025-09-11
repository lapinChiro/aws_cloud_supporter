// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計

import { METRICS_CONFIG_MAP } from '../config/metrics';
import type { CloudFormationResource } from '../types/cloudformation';
import type { MetricConfig } from '../types/metrics';
import { CloudSupporterError, ErrorType } from '../utils/error';

import { BaseMetricsGenerator } from './base.generator';

/**
 * API Gateway用メトリクス生成器
 * SOLID原則: 単一責任（API Gatewayメトリクス生成のみ）
 */
export class APIGatewayMetricsGenerator extends BaseMetricsGenerator {
  /**
   * サポートするリソースタイプ
   */
  getSupportedTypes(): string[] {
    return ['AWS::ApiGateway::RestApi', 'AWS::Serverless::Api'];
  }

  /**
   * API Gateway用メトリクス設定取得
   */
  protected getMetricsConfig(_resource: CloudFormationResource): MetricConfig[] {
    // REST APIもSAM APIも同じメトリクスを使用
    const baseConfigs = METRICS_CONFIG_MAP['AWS::ApiGateway::RestApi'];
    
    if (!baseConfigs) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'API Gateway metrics configuration not found',
        { resourceType: 'AWS::ApiGateway::RestApi' }
      );
    }
    
    return baseConfigs;
  }

  /**
   * API Gatewayスケール係数計算
   * CLAUDE.md準拠: No any types（unknown型・型安全性）
   */
  protected getResourceScale(resource: CloudFormationResource): number {
    const properties = resource.Properties as Record<string, unknown> | undefined;
    
    // タグベースのスケール判定
    const tags = properties?.Tags as Array<{ Key: string; Value: string }> | undefined;
    const envTag = tags?.find(tag => tag.Key === 'Environment');
    
    // 環境別スケール係数
    if (envTag?.Value === 'Production') {
      return 1.5; // プロダクション環境
    } else if (envTag?.Value === 'Development') {
      return 0.5; // 開発環境
    }
    
    // カスタムドメインがある場合
    const hasCustomDomain = tags?.find(tag => tag.Key === 'HasCustomDomain');
    if (hasCustomDomain?.Value === 'true') {
      return 1.2; // カスタムドメインありは負荷高め
    }
    
    // ポリシー（認証）がある場合
    const policy = properties?.Policy as Record<string, unknown> | undefined;
    if (policy) {
      return 1.1; // 認証処理があるAPIは若干負荷高め
    }
    
    // デフォルトは標準スケール
    return 1.0;
  }
}