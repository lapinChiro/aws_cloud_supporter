// CLAUDE.md準拠ResourceExtractor（UNIX Philosophy + Type-Driven Development）

import type { 
  CloudFormationTemplate, 
  SupportedResource} from '../types/cloudformation';
import {
  isFargateService,
  isApplicationLoadBalancer
} from '../types/cloudformation';
import type { ExtractResult } from '../types/metrics';

// UNIX Philosophy: 一つのことをうまくやる（リソース抽出のみ）
export class ResourceExtractor {
  
  // サポート対象リソースタイプ（CLAUDE.md: DRY原則、public for testing）
  public static readonly SUPPORTED_TYPES = new Set([
    'AWS::RDS::DBInstance',
    'AWS::Lambda::Function', 
    'AWS::Serverless::Function',
    'AWS::ECS::Service',
    'AWS::ElasticLoadBalancingV2::LoadBalancer',
    'AWS::DynamoDB::Table',
    'AWS::ApiGateway::RestApi',
    'AWS::Serverless::Api'
  ]);

  // メイン抽出メソッド（O(n)アルゴリズム、型安全性重視）
  extract(template: CloudFormationTemplate): ExtractResult {
    const startTime = performance.now();
    
    const supported: SupportedResource[] = [];
    const unsupported: string[] = [];
    
    // O(n)での高速処理（CLAUDE.md: パフォーマンス重視）
    for (const [logicalId, resource] of Object.entries(template.Resources)) {
      // 型安全なリソース判定（Don't Reinvent the Wheel: 既存型ガード使用）
      if (this.isSupportedResourceType(resource)) {
        // 特殊ケース判定（ECS FargateとApplication LBのみ）
        if (this.isActuallySupported(resource)) {
          // SupportedResource型にLogicalIdを追加
          const supportedResource = {
            ...resource,
            LogicalId: logicalId
          } as SupportedResource;
          
          supported.push(supportedResource);
        } else {
          // 条件に合わないリソース（例：ECS EC2サービス、NLB）
          unsupported.push(logicalId);
        }
      } else {
        // 完全にサポート対象外のリソース
        unsupported.push(logicalId);
      }
    }

    const extractionTimeMs = performance.now() - startTime;
    
    // パフォーマンス監視（CLAUDE.md: 性能要件）
    if (extractionTimeMs > 3000) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️  Resource extraction took ${extractionTimeMs.toFixed(0)}ms (target: <3000ms)`);
    }

    return {
      supported,
      unsupported,
      totalCount: Object.keys(template.Resources).length,
      extractionTimeMs: Math.round(extractionTimeMs)
    };
  }

  // サポート対象リソースタイプ判定（型安全性）
  private isSupportedResourceType(resource: { Type: string }): boolean {
    return ResourceExtractor.SUPPORTED_TYPES.has(resource.Type);
  }

  // 実際にサポート対象かの詳細判定（特殊ケース考慮）
  private isActuallySupported(resource: { Type: string; Properties?: unknown }): boolean {
    // ECS：Fargateサービスのみサポート
    if (resource.Type === 'AWS::ECS::Service') {
      return isFargateService(resource);
    }
    
    // LoadBalancer：Application LBのみサポート
    if (resource.Type === 'AWS::ElasticLoadBalancingV2::LoadBalancer') {
      return isApplicationLoadBalancer(resource);
    }
    
    // その他のサポート対象リソースは全て対象
    return true;
  }

  // UNIX Philosophy: 単一責任（extractメソッドのみpublic）
  // 他のメソッドは内部実装として非公開
}

/**
 * Performance monitoring utility for resource extraction
 * Used by tests to measure and evaluate extractor performance
 */
export class ExtractionPerformanceMonitor {
  static measureExtractionPerformance(
    extractor: ResourceExtractor,
    template: CloudFormationTemplate
  ): {
    result: ExtractResult;
    performanceGrade: 'A' | 'B' | 'C' | 'F';
    extractionTimeMs: number;
    memoryUsage: number;
  } {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    // Extract resources
    const result = extractor.extract(template);
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;
    const extractionTimeMs = Math.round(endTime - startTime);
    const memoryUsage = (endMemory - startMemory) / (1024 * 1024); // MB

    // Determine performance grade based on time and resource count
    let performanceGrade: 'A' | 'B' | 'C' | 'F' = 'F';
    const resourcesPerSecond = result.totalCount / (extractionTimeMs / 1000);
    
    if (resourcesPerSecond > 1000) {
      performanceGrade = 'A';
    } else if (resourcesPerSecond > 500) {
      performanceGrade = 'B';
    } else if (resourcesPerSecond > 200) {
      performanceGrade = 'C';
    }

    return {
      result,
      performanceGrade,
      extractionTimeMs,
      memoryUsage
    };
  }
}

