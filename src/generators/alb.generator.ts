// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計

import { METRICS_CONFIG_MAP } from '../config/metrics';
import { Errors } from '../errors';
import type { CloudFormationResource } from '../types/cloudformation';
import type { MetricConfig, MetricDefinition } from '../types/metrics';

import { BaseMetricsGenerator } from './base.generator';

/**
 * ALB (Application Load Balancer)用メトリクス生成器
 * SOLID原則: 単一責任（ALBメトリクス生成のみ）
 */
export class ALBMetricsGenerator extends BaseMetricsGenerator {
  /**
   * サポートするリソースタイプ
   */
  getSupportedTypes(): string[] {
    return ['AWS::ElasticLoadBalancingV2::LoadBalancer'];
  }

  /**
   * メトリクス生成（Application Load Balancerのみサポート）
   * CLAUDE.md準拠: Type-Driven Development
   */
  override async generate(resource: CloudFormationResource): Promise<MetricDefinition[]> {
    // Application Load Balancerのみサポート
    if (!this.isApplicationLoadBalancer(resource)) {
      throw Errors.ALB.onlyApplicationLoadBalancerSupported(this.getLoadBalancerType(resource) ?? 'Unknown');
    }
    
    // 基底クラスのgenerate呼び出し
    return super.generate(resource);
  }

  /**
   * ALB用メトリクス設定取得
   */
  protected getMetricsConfig(_resource: CloudFormationResource): MetricConfig[] {
    const baseConfigs = METRICS_CONFIG_MAP['AWS::ElasticLoadBalancingV2::LoadBalancer'];
    
    if (!baseConfigs) {
      throw Errors.ALB.metricsNotFound();
    }
    
    return baseConfigs;
  }

  /**
   * ALBスケール係数計算
   * CLAUDE.md準拠: No any types（unknown型・型安全性）
   */
  protected getResourceScale(resource: CloudFormationResource): number {
    const properties = resource.Properties as Record<string, unknown> | undefined;
    
    // スケール判定のためのヒューリスティック
    // 実際のターゲットグループ数は別リソースで定義されるため、
    // タグやその他のプロパティからスケールを推定
    
    // タグベースのスケール判定（テスト用）
    const tags = properties?.Tags as Array<{ Key: string; Value: string }> | undefined;
    const scaleTag = tags?.find(tag => tag.Key === 'Scale');
    
    if (scaleTag?.Value === 'Large') {
      return 1.5; // 大規模ALB
    }
    
    // インターネットフェーシングかどうか
    const scheme = properties?.Scheme as string | undefined;
    if (scheme === 'internet-facing') {
      return 1.2; // インターネット向けは若干高めの負荷想定
    }
    
    // デフォルトは標準スケール
    return 1.0;
  }

  /**
   * Application Load Balancerかどうか判定
   * CLAUDE.md準拠: Type-Driven Development
   */
  private isApplicationLoadBalancer(resource: CloudFormationResource): boolean {
    const loadBalancerType = this.getLoadBalancerType(resource);
    
    // Typeが未定義の場合はapplicationとして扱う（デフォルト）
    return loadBalancerType === 'application' || loadBalancerType === undefined;
  }

  /**
   * ロードバランサータイプ取得
   */
  private getLoadBalancerType(resource: CloudFormationResource): string | undefined {
    const properties = resource.Properties as Record<string, unknown> | undefined;
    return properties?.Type as string | undefined;
  }
}