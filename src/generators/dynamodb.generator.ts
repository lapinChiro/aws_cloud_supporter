// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計

import { METRICS_CONFIG_MAP } from '../config/metrics';
import type { CloudFormationResource } from '../types/cloudformation';
import type { MetricConfig } from '../types/metrics';
import { CloudSupporterError, ErrorType } from '../utils/error';

import { BaseMetricsGenerator } from './base.generator';

/**
 * DynamoDB Table用メトリクス生成器
 * SOLID原則: 単一責任（DynamoDBメトリクス生成のみ）
 */
export class DynamoDBMetricsGenerator extends BaseMetricsGenerator {
  /**
   * サポートするリソースタイプ
   */
  getSupportedTypes(): string[] {
    return ['AWS::DynamoDB::Table'];
  }

  /**
   * DynamoDB用メトリクス設定取得
   */
  protected getMetricsConfig(resource: CloudFormationResource): MetricConfig[] {
    const baseConfigs = METRICS_CONFIG_MAP['AWS::DynamoDB::Table'];
    
    if (!baseConfigs) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'DynamoDB metrics configuration not found',
        { resourceType: 'AWS::DynamoDB::Table' }
      );
    }

    const properties = resource.Properties as Record<string, unknown> | undefined;
    const billingMode = properties?.BillingMode as string | undefined;
    
    // BillingModeに基づくメトリクスフィルタリング
    return baseConfigs.filter(config => {
      // On-demandモードの場合、プロビジョンド固有のメトリクスを除外
      if (billingMode === 'PAY_PER_REQUEST') {
        if (config.name === 'MaxProvisionedTableReadCapacityUtilization' || 
            config.name === 'MaxProvisionedTableWriteCapacityUtilization') {
          return false;
        }
      }
      
      // applicableWhen関数が定義されている場合は、その条件に従う
      if (config.applicableWhen) {
        return config.applicableWhen(resource);
      }
      
      return true;
    });
  }

  /**
   * DynamoDBスケール係数計算
   * CLAUDE.md準拠: No any types（unknown型・型安全性）
   */
  protected getResourceScale(resource: CloudFormationResource): number {
    const properties = resource.Properties as Record<string, unknown> | undefined;
    const billingMode = properties?.BillingMode as string | undefined;
    
    // On-demandモードの場合は標準スケール
    if (billingMode === 'PAY_PER_REQUEST') {
      return 1.0;
    }
    
    // Provisionedモードのスケール計算
    const provisionedThroughput = properties?.ProvisionedThroughput as Record<string, number> | undefined;
    const readCapacity = provisionedThroughput?.ReadCapacityUnits ?? 5;
    const writeCapacity = provisionedThroughput?.WriteCapacityUnits ?? 5;
    
    // GSI（グローバルセカンダリインデックス）の考慮
    const gsiList = properties?.GlobalSecondaryIndexes as Array<Record<string, unknown>> | undefined;
    let totalGsiCapacity = 0;
    
    if (gsiList && Array.isArray(gsiList)) {
      for (const gsi of gsiList) {
        const gsiThroughput = gsi.ProvisionedThroughput as Record<string, number> | undefined;
        if (gsiThroughput) {
          totalGsiCapacity += (gsiThroughput.ReadCapacityUnits ?? 0) + (gsiThroughput.WriteCapacityUnits ?? 0);
        }
      }
    }
    
    // 合計キャパシティに基づくスケール係数
    const totalCapacity = readCapacity + writeCapacity + totalGsiCapacity;
    
    if (totalCapacity <= 2) {
      return 0.5; // 最小構成
    } else if (totalCapacity <= 10) {
      return 0.8; // 小規模
    } else if (totalCapacity <= 50) {
      return 1.0; // 標準
    } else if (totalCapacity <= 100) {
      return 1.5; // 中規模
    } else if (totalCapacity <= 500) {
      return 2.0; // 大規模
    } else {
      return 3.0; // 超大規模
    }
  }
}