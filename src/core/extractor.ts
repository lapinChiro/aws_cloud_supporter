// CLAUDE.md準拠ResourceExtractor（UNIX Philosophy + Type-Driven Development）

import { 
  CloudFormationTemplate, 
  SupportedResource,
  isFargateService,
  isApplicationLoadBalancer
} from '../types/cloudformation';
import { ExtractResult } from '../types/metrics';

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

// パフォーマンス測定ユーティリティ（CLAUDE.md: 単一責任分離）
export class ExtractionPerformanceMonitor {
  
  static measureExtractionPerformance(
    extractor: ResourceExtractor, 
    template: CloudFormationTemplate
  ): {
    result: ExtractResult;
    memoryUsage: number;
    performanceGrade: 'A' | 'B' | 'C' | 'F';
  } {
    const memoryBefore = process.memoryUsage().heapUsed;
    const startTime = performance.now();
    
    const result = extractor.extract(template);
    
    const duration = performance.now() - startTime;
    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryUsage = (memoryAfter - memoryBefore) / 1024 / 1024; // MB

    // パフォーマンス評価
    let performanceGrade: 'A' | 'B' | 'C' | 'F';
    if (duration < 1000 && memoryUsage < 10) {
      performanceGrade = 'A';
    } else if (duration < 3000 && memoryUsage < 50) {
      performanceGrade = 'B';
    } else if (duration < 5000 && memoryUsage < 100) {
      performanceGrade = 'C';
    } else {
      performanceGrade = 'F';
    }

    return {
      result,
      memoryUsage,
      performanceGrade
    };
  }
}

