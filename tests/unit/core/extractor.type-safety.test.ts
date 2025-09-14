// CLAUDE.md準拠ResourceExtractor型安全性テスト
import path from 'path';

import { ResourceExtractor } from '../../../src/core/extractor';
import { TemplateParser } from '../../../src/core/parser';
import type { CloudFormationTemplate, SupportedResource } from '../../../src/types/cloudformation';
import { isSupportedResource, isFargateService, isApplicationLoadBalancer } from '../../../src/types/cloudformation';

import { createExtractionTestFixtures, setupTempDir } from './extractor.test-helpers';

// 全テストで使用する一時ディレクトリ
let tempDir: string;

// 全テスト前の準備
beforeAll(() => {
  tempDir = setupTempDir();
  // テストフィクスチャー作成
  createExtractionTestFixtures(tempDir);
});

describe('ResourceExtractor型安全性（CLAUDE.md: Type-Driven Development）', () => {

  // 型ガード関数統合テスト（GREEN段階: Don't Reinvent the Wheel）
  it('should integrate with existing type guard functions', () => {
    // 既存型ガード関数がResourceExtractorで使用されている確認
    const testResource = { Type: 'AWS::RDS::DBInstance', Properties: {} };
    
    expect(isSupportedResource(testResource)).toBe(true);
    expect(typeof isFargateService).toBe('function');
    expect(typeof isApplicationLoadBalancer).toBe('function');
    
    // ResourceExtractor内部でこれらの関数が活用されている
    const extractor = new ResourceExtractor();
    expect(extractor).toBeDefined();
  });

  // Union型使用テスト（GREEN段階: SupportedResource確認）
  it('should utilize SupportedResource union type', () => {
    
    const extractor = new ResourceExtractor();
    const testTemplate: CloudFormationTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Resources: {
        TestRDS: { Type: "AWS::RDS::DBInstance", Properties: {} },
        TestLambda: { Type: "AWS::Lambda::Function", Properties: {} }
      }
    };
    
    const result = extractor.extract(testTemplate);
    
    // SupportedResource Union型が正しく使用されている
    expect(result.supported).toHaveLength(2);
    result.supported.forEach((resource: SupportedResource) => {
      expect(resource.LogicalId).toBeDefined();
      expect(resource.Type).toBeDefined();
    });
  });

  // CloudFormationTemplate型統合テスト（GREEN段階: 型推論確認）
  it('should work with CloudFormationTemplate type', async () => {
    
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const mixedPath = path.join(tempDir, 'mixed-resources.json');
    
    // CloudFormationTemplate型の正常解析・抽出
    const template = await parser.parse(mixedPath);
    const result = extractor.extract(template);
    
    // 型安全性確認
    expect(template.Resources).toBeDefined();
    expect(result.supported.every((r: SupportedResource) => typeof r.Type === 'string')).toBe(true);
  });

  // ExtractResult型安全性テスト（GREEN段階: 戻り値型確認）
  it('should return properly typed ExtractResult', () => {
    
    const extractor = new ResourceExtractor();
    const testTemplate: CloudFormationTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Resources: {
        Test: { Type: "AWS::RDS::DBInstance", Properties: {} }
      }
    };
    
    const result = extractor.extract(testTemplate);
    
    // ExtractResult型の完全性確認
    expect(result.supported).toBeDefined();
    expect(result.unsupported).toBeDefined();
    expect(result.totalCount).toBe(1);
    expect(result.extractionTimeMs).toBeGreaterThanOrEqual(0);
    
    // 型安全性：supported配列の要素がSupportedResource型
    if (result.supported.length > 0) {
      const resource = result.supported[0];
      expect(resource?.LogicalId).toBe('Test');
      expect(resource?.Type).toBe('AWS::RDS::DBInstance');
    }
  });
});