// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計

import { METRICS_CONFIG_MAP } from '../config/metrics';
import type { CloudFormationResource, RDSDBInstance} from '../types/cloudformation';
// import { RDSProperties } from '../types/cloudformation';
import type { MetricConfig } from '../types/metrics';
import { CloudSupporterError, ErrorType } from '../utils/error';

import { BaseMetricsGenerator } from './base.generator';

/**
 * RDS DBInstance用メトリクス生成器
 * SOLID原則: 単一責任（RDSメトリクス生成のみ）
 */
export class RDSMetricsGenerator extends BaseMetricsGenerator {
  /**
   * サポートするリソースタイプ
   */
  getSupportedTypes(): string[] {
    return ['AWS::RDS::DBInstance'];
  }

  /**
   * RDS用メトリクス設定取得
   */
  protected getMetricsConfig(_resource: CloudFormationResource): MetricConfig[] {
    const configs = METRICS_CONFIG_MAP['AWS::RDS::DBInstance'];
    
    // CLAUDE.md準拠: No any types（型安全性）
    if (!configs) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'RDS metrics configuration not found',
        { resourceType: 'AWS::RDS::DBInstance' }
      );
    }
    
    return configs;
  }

  /**
   * インスタンスクラスに基づくスケール係数計算
   * CLAUDE.md準拠: No any types（unknown型・型安全性）
   */
  protected getResourceScale(resource: CloudFormationResource): number {
    const rds = resource as RDSDBInstance;
    const properties = rds.Properties;
    const instanceClass = properties?.DBInstanceClass || 'db.t3.micro';
    
    // インスタンスクラス別スケール係数（AWS公式準拠）
    const scaleMap: Record<string, number> = {
      // T3系（バースト可能・開発環境向け）
      'db.t3.micro': 0.5,    // 2 vCPUs, 1 GiB
      'db.t3.small': 0.7,    // 2 vCPUs, 2 GiB
      'db.t3.medium': 1.0,   // 2 vCPUs, 4 GiB
      'db.t3.large': 1.2,    // 2 vCPUs, 8 GiB
      'db.t3.xlarge': 1.5,   // 4 vCPUs, 16 GiB
      'db.t3.2xlarge': 2.0,  // 8 vCPUs, 32 GiB
      
      // T4g系（バースト可能・ARM・開発環境向け）
      'db.t4g.micro': 0.5,
      'db.t4g.small': 0.7,
      'db.t4g.medium': 1.0,
      'db.t4g.large': 1.2,
      'db.t4g.xlarge': 1.5,
      'db.t4g.2xlarge': 2.0,
      
      // M5系（汎用・本番環境向け）
      'db.m5.large': 1.5,     // 2 vCPUs, 8 GiB
      'db.m5.xlarge': 2.0,    // 4 vCPUs, 16 GiB
      'db.m5.2xlarge': 3.0,   // 8 vCPUs, 32 GiB
      'db.m5.4xlarge': 4.0,   // 16 vCPUs, 64 GiB
      'db.m5.8xlarge': 6.0,   // 32 vCPUs, 128 GiB
      'db.m5.12xlarge': 8.0,  // 48 vCPUs, 192 GiB
      'db.m5.16xlarge': 10.0, // 64 vCPUs, 256 GiB
      'db.m5.24xlarge': 14.0, // 96 vCPUs, 384 GiB
      
      // M6i系（最新世代汎用）
      'db.m6i.large': 1.5,
      'db.m6i.xlarge': 2.0,
      'db.m6i.2xlarge': 3.0,
      'db.m6i.4xlarge': 4.0,
      'db.m6i.8xlarge': 6.0,
      'db.m6i.12xlarge': 8.0,
      'db.m6i.16xlarge': 10.0,
      'db.m6i.24xlarge': 14.0,
      'db.m6i.32xlarge': 18.0,
      
      // R5系（メモリ最適化・大規模本番環境向け）
      'db.r5.large': 1.8,     // 2 vCPUs, 16 GiB
      'db.r5.xlarge': 2.5,    // 4 vCPUs, 32 GiB
      'db.r5.2xlarge': 3.5,   // 8 vCPUs, 64 GiB
      'db.r5.4xlarge': 5.0,   // 16 vCPUs, 128 GiB
      'db.r5.8xlarge': 7.0,   // 32 vCPUs, 256 GiB
      'db.r5.12xlarge': 9.0,  // 48 vCPUs, 384 GiB
      'db.r5.16xlarge': 12.0, // 64 vCPUs, 512 GiB
      'db.r5.24xlarge': 16.0, // 96 vCPUs, 768 GiB
      
      // R6i系（最新世代メモリ最適化）
      'db.r6i.large': 1.8,
      'db.r6i.xlarge': 2.5,
      'db.r6i.2xlarge': 3.5,
      'db.r6i.4xlarge': 5.0,
      'db.r6i.8xlarge': 7.0,
      'db.r6i.12xlarge': 9.0,
      'db.r6i.16xlarge': 12.0,
      'db.r6i.24xlarge': 16.0,
      'db.r6i.32xlarge': 20.0,
      
      // X2iedn系（超大規模メモリ最適化）
      'db.x2iedn.large': 3.0,
      'db.x2iedn.xlarge': 4.0,
      'db.x2iedn.2xlarge': 6.0,
      'db.x2iedn.4xlarge': 9.0,
      'db.x2iedn.8xlarge': 14.0,
      'db.x2iedn.16xlarge': 20.0,
      'db.x2iedn.24xlarge': 28.0,
      'db.x2iedn.32xlarge': 35.0
    };
    
    // CLAUDE.md準拠: KISS原則（デフォルト値で将来の型対応）
    return scaleMap[instanceClass] || 1.0;
  }
}