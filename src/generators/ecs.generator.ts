// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計

import { METRICS_CONFIG_MAP } from '../config/metrics';
import { Errors } from '../errors';
import type { CloudFormationResource, ECSService} from '../types/cloudformation';
import { isFargateService } from '../types/cloudformation';
import type { MetricConfig, MetricDefinition } from '../types/metrics';

import { BaseMetricsGenerator } from './base.generator';

/**
 * ECS Service用メトリクス生成器（Fargate特化）
 * SOLID原則: 単一責任（ECS Fargateメトリクス生成のみ）
 */
export class ECSMetricsGenerator extends BaseMetricsGenerator {
  /**
   * サポートするリソースタイプ
   */
  getSupportedTypes(): string[] {
    return ['AWS::ECS::Service'];
  }

  /**
   * メトリクス生成（Fargateのみサポート）
   * CLAUDE.md準拠: Type-Driven Development
   */
  override async generate(resource: CloudFormationResource): Promise<MetricDefinition[]> {
    // Fargateサービスのみサポート
    if (!isFargateService(resource)) {
      throw Errors.ECS.onlyFargateSupported((resource as ECSService).Properties?.LaunchType ?? 'Unknown');
    }
    
    // 基底クラスのgenerate呼び出し
    return super.generate(resource);
  }


  /**
   * DesiredCountとタスクサイズに基づくスケール係数計算
   * CLAUDE.md準拠: No any types（unknown型・型安全性）
   */
  protected getResourceScale(resource: CloudFormationResource): number {
    const ecs = resource as ECSService;
    const properties = ecs.Properties;
    const desiredCount = properties?.DesiredCount ?? 1;
    
    // DesiredCountベースのスケール計算
    // 1-2タスク: 小規模（係数0.7）
    // 3-5タスク: 標準（係数1.0）
    // 6-10タスク: 中規模（係数1.3）
    // 11-20タスク: 大規模（係数1.7）
    // 21-50タスク: 超大規模（係数2.0）
    // 51以上: 巨大規模（係数2.5）
    
    if (desiredCount <= 2) {
      return 0.7; // 小規模サービス
    } else if (desiredCount <= 5) {
      return 1.0; // 標準サービス
    } else if (desiredCount <= 10) {
      return 1.3; // 中規模サービス
    } else if (desiredCount <= 20) {
      return 1.7; // 大規模サービス
    } else if (desiredCount <= 50) {
      return 2.0; // 超大規模サービス
    } else {
      return 2.5; // 巨大規模サービス
    }
  }


  /**
   * メトリクス設定の調整（ECS固有）
   */
  protected getMetricsConfig(resource: CloudFormationResource): MetricConfig[] {
    const baseConfigs = METRICS_CONFIG_MAP['AWS::ECS::Service'];
    
    if (!baseConfigs) {
      throw Errors.ECS.metricsNotFound();
    }
    
    const ecs = resource as ECSService;
    const properties = ecs.Properties;
    
    // CLAUDE.md準拠: 型安全性（スプレッド演算子による不変性）
    return baseConfigs.map(config => {
      // Auto Scaling関連メトリクスの重要度調整
      if (['TaskCount', 'RunningCount', 'PendingCount'].includes(config.name)) {
        // DesiredCountが大きい場合、スケーリング関連メトリクスの重要度を上げる
        if ((properties?.DesiredCount ?? 0) >= 10) {
          return {
            ...config,
            importance: 'High' as const
          };
        }
      }
      
      // GPU関連メトリクス（将来的な対応）
      if (config.name === 'GPUUtilization' || config.name === 'GPUMemoryUtilization') {
        // RequiresCompatibilitiesにGPUが含まれている場合のみ適用
        const requiresGPU = (properties as unknown as { RequiresCompatibilities?: string[] })
          ?.RequiresCompatibilities?.includes('GPU');
        if (!requiresGPU) {
          // GPUを使用しない場合は除外（applicableWhenで制御）
          return {
            ...config,
            applicableWhen: () => false
          };
        }
      }
      
      return config;
    });
  }
}