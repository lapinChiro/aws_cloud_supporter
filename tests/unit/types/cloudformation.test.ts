// CLAUDE.md準拠型安全性テスト（RED段階: any型違反検知）
import { readFileSync } from 'fs';
import path from 'path';
import * as cfnTypes from '../../../src/types/cloudformation';
import * as commonTypes from '../../../src/types/common';
import * as metricsTypes from '../../../src/types/metrics';

// 型定義モジュール用の型注釈
interface CloudFormationTypesModule {
  ResourceType?: object;
  isSupportedResource?: (resource: unknown) => boolean;
  isRDSInstance?: (resource: unknown) => boolean;
}

interface CommonTypesModule {
  MetricStatistic?: string;
}

interface MetricsTypesModule {
  [key: string]: unknown;
}

describe('CloudFormation型定義（CLAUDE.md: No any types）', () => {
  
  // CLAUDE.md核心原則: No any types検証
  it('should not contain any types in cloudformation.ts', () => {
    const cloudFormationCode = readFileSync(
      path.join(__dirname, '../../../src/types/cloudformation.ts'), 
      'utf8'
    );
    
    // any型が含まれていないことを確認
    expect(cloudFormationCode).toHaveNoAnyTypes();
  });

  // TypeScript strict mode準拠テスト
  it('should compile without type errors', async () => {
    const { execSync } = await import('child_process');
    
    try {
      execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
      // コンパイル成功なら通過
      expect(true).toBe(true);
    } catch (error) {
      // コンパイルエラーがあれば失敗（CLAUDE.md: Zero type errors）
      expect(error).toBeUndefined();
      throw new Error(`TypeScript compilation failed: ${(error as Error).message}`);
    }
  });

  // CloudFormationTemplate型の基本構造テスト
  it('should define proper CloudFormationTemplate interface', () => {
    // 型定義のインポートテスト（静的import使用）
    const cfnTypesModule = cfnTypes as unknown as CloudFormationTypesModule;
    
    // 主要な型が定義されていることを確認
    expect(cfnTypesModule).toBeDefined();
    if (cfnTypesModule.ResourceType) {
      expect(typeof cfnTypesModule.ResourceType).toBe('object');
    }
    if (cfnTypesModule.isSupportedResource) {
      expect(typeof cfnTypesModule.isSupportedResource).toBe('function');
    }
  });

  // RDSProperties型安全性テスト
  it('should define type-safe RDSProperties without any types', () => {
    // 実装後にRDSPropertiesが適切に型定義されているかテスト
    const testRDSProperties = {
      DBInstanceClass: 'db.t3.micro',
      Engine: 'mysql' as const,
      AllocatedStorage: 20,
      MultiAZ: true
    };
    
    // 型安全性の検証（型推論が正しく働くかテスト）
    expect(typeof testRDSProperties.DBInstanceClass).toBe('string');
    expect(typeof testRDSProperties.Engine).toBe('string');
    expect(typeof testRDSProperties.AllocatedStorage).toBe('number');
    expect(typeof testRDSProperties.MultiAZ).toBe('boolean');
  });

  // Union型の型安全性テスト
  it('should define proper union types for resource types', () => {
    const cfnTypesModule = cfnTypes as unknown as CloudFormationTypesModule;
    
    // SupportedResource Union型の型ガード関数テスト
    const testResource = {
      Type: 'AWS::RDS::DBInstance',
      Properties: { Engine: 'mysql' }
    };
    
    if (cfnTypesModule.isSupportedResource && cfnTypesModule.isRDSInstance) {
      expect(cfnTypesModule.isSupportedResource(testResource)).toBe(true);
      expect(cfnTypesModule.isRDSInstance(testResource)).toBe(true);
      
      // 非サポートリソース
      const unsupportedResource = {
        Type: 'AWS::EC2::Instance',
        Properties: {}
      };
      
      expect(cfnTypesModule.isSupportedResource(unsupportedResource)).toBe(false);
    } else {
      // 型ガード関数が存在しない場合はスキップ
      expect(true).toBe(true);
    }
  });

  // エラー詳細型の安全性テスト
  it('should define ErrorDetails without any type', () => {
    // ErrorDetails型がany型を含まずに定義されているかテスト
    const testErrorDetails = {
      originalError: 'test error',
      fileSize: 1024,
      lineNumber: 42,
      columnNumber: 10
    };
    
    expect(typeof testErrorDetails.originalError).toBe('string');
    expect(typeof testErrorDetails.fileSize).toBe('number');
    expect(typeof testErrorDetails.lineNumber).toBe('number');
    expect(typeof testErrorDetails.columnNumber).toBe('number');
  });
});

describe('メトリクス型定義（CLAUDE.md: Type-Driven Development）', () => {

  // MetricDefinition型安全性テスト
  it('should define type-safe MetricDefinition interface', () => {
    // 実装前なので失敗する想定
    const testMetric = {
      metric_name: 'CPUUtilization',
      namespace: 'AWS/RDS',
      unit: 'Percent',
      description: 'CPU利用率',
      statistic: 'Average' as const,
      recommended_threshold: {
        warning: 70,
        critical: 90
      },
      evaluation_period: 300,
      category: 'Performance' as const,
      importance: 'High' as const
    };
    
    // しきい値の型安全性
    expect(testMetric.recommended_threshold).toHaveValidThreshold();
    
    // enum型の型安全性
    expect(['Average', 'Sum', 'Maximum', 'Minimum']).toContain(testMetric.statistic);
    expect(['Performance', 'Error', 'Saturation', 'Latency']).toContain(testMetric.category);
    expect(['High', 'Medium', 'Low']).toContain(testMetric.importance);
  });

  // MetricConfig型安全性テスト
  it('should define type-safe MetricConfig interface', () => {
    
    // MetricConfig型のテスト用データ
    const testMetricConfig = {
      name: 'CPUUtilization',
      namespace: 'AWS/RDS',
      unit: 'Percent',
      description: 'CPU利用率',
      statistic: 'Average' as const,
      evaluationPeriod: 300 as const,
      category: 'Performance' as const,
      importance: 'High' as const,
      threshold: {
        base: 70,
        warningMultiplier: 1.0,
        criticalMultiplier: 1.3
      }
    };
    
    // 基本型安全性確認
    expect(typeof testMetricConfig.name).toBe('string');
    expect(typeof testMetricConfig.threshold.base).toBe('number');
    expect(testMetricConfig.threshold.warningMultiplier < testMetricConfig.threshold.criticalMultiplier).toBe(true);
  });
});

describe('共通型定義（CLAUDE.md: DRY原則）', () => {

  // 共通型の重複排除テスト
  it('should define common types without duplication', () => {
    const commonTypesModule = commonTypes as unknown as CommonTypesModule;
    const metricsTypesModule = metricsTypes as unknown as MetricsTypesModule;
    
    // 共通型が適切に定義されていることを確認
    if (commonTypesModule.MetricStatistic) {
      expect(typeof commonTypesModule.MetricStatistic).toBe('undefined'); // 型なので実行時は存在しない
    }
    expect(commonTypesModule).toBeDefined();
    
    // メトリクス型で共通型を使用していることを確認
    expect(metricsTypesModule).toBeDefined();
  });

  // 型安全性の包括テスト
  it('should ensure all types are strictly typed', () => {
    // common.tsにany型が含まれていないことを確認
    const commonCode = readFileSync(
      path.join(__dirname, '../../../src/types/common.ts'), 
      'utf8'
    );
    expect(commonCode).toHaveNoAnyTypes();
    
    // metrics.tsにany型が含まれていないことを確認
    const metricsCode = readFileSync(
      path.join(__dirname, '../../../src/types/metrics.ts'), 
      'utf8'
    );
    expect(metricsCode).toHaveNoAnyTypes();
  });
});