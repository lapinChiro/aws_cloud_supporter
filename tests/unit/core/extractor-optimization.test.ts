// CLAUDE.md準拠ResourceExtractor最適化テスト（BLUE段階: リファクタリング検証）

import { ResourceExtractor, ExtractionPerformanceMonitor } from '../../../src/core/extractor';
import { TemplateParser } from '../../../src/core/parser';
import path from 'path';

describe('ResourceExtractor最適化（CLAUDE.md: BLUE段階）', () => {
  let parser: TemplateParser;
  let extractor: ResourceExtractor;

  beforeEach(() => {
    parser = new TemplateParser();
    extractor = new ResourceExtractor();
  });

  // 実際のCloudFormationテンプレートでの動作確認
  it('should work with real CloudFormation templates', async () => {
    const realTemplates = [
      'serverless-api-sam.yaml',
      'container-microservices-ecs.yaml',
      'web-application-stack.yaml'
    ];

    for (const templateFile of realTemplates) {
      const templatePath = path.join(__dirname, '../../../examples', templateFile);
      
      const template = await parser.parse(templatePath);
      const result = extractor.extract(template);
      
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.extractionTimeMs).toBeLessThan(1000); // 実テンプレートは1秒以内
      
      console.log(`📊 ${templateFile}: ${result.supported.length}/${result.totalCount} サポート対象 (${result.extractionTimeMs}ms)`);
    }
  });

  // パフォーマンス最適化確認
  it('should demonstrate optimized performance characteristics', async () => {
    const basicTemplatePath = path.join(__dirname, '../../../examples/basic-cloudformation.yaml');
    const template = await parser.parse(basicTemplatePath);
    
    // 複数回実行でのパフォーマンス安定性
    const results = [];
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      const result = extractor.extract(template);
      const duration = performance.now() - startTime;
      
      results.push({
        duration,
        supportedCount: result.supported.length,
        totalCount: result.totalCount
      });
    }

    // パフォーマンス安定性
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    expect(avgDuration).toBeLessThan(100); // 平均100ms以下

    // 結果一貫性
    const firstResult = results[0];
    results.forEach(result => {
      expect(result.supportedCount).toBe(firstResult?.supportedCount);
      expect(result.totalCount).toBe(firstResult?.totalCount);
    });
  });

  // メモリ効率性の詳細確認
  it('should maintain excellent memory efficiency', async () => {
    const basicTemplatePath = path.join(__dirname, '../../../examples/basic-cloudformation.yaml');
    const template = await parser.parse(basicTemplatePath);

    const memoryBefore = process.memoryUsage();
    
    // 1000回抽出（メモリリーク確認）
    for (let i = 0; i < 1000; i++) {
      extractor.extract(template);
    }
    
    const memoryAfter = process.memoryUsage();
    const memoryDelta = (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024;
    
    expect(memoryDelta).toBeLessThan(10); // メモリ増加10MB以下
    console.log(`🧠 メモリ効率: ${memoryDelta.toFixed(1)}MB増加（1000回抽出）`);
  });

  // 型安全性の詳細確認（CLAUDE.md: Type-Driven Development）
  it('should demonstrate enhanced type safety', async () => {
    const basicTemplatePath = path.join(__dirname, '../../../examples/basic-cloudformation.yaml');
    const template = await parser.parse(basicTemplatePath);
    const result = extractor.extract(template);
    
    // SupportedResource型の型安全性
    result.supported.forEach(resource => {
      // LogicalIdプロパティの存在確認
      expect(resource.LogicalId).toBeDefined();
      expect(typeof resource.LogicalId).toBe('string');
      
      // Type プロパティの型安全性
      expect(resource.Type).toBeDefined();
      expect(typeof resource.Type).toBe('string');
      
      // Properties の型安全性（unknownだが存在確認可能）
      expect(resource.Properties === undefined || typeof resource.Properties === 'object').toBe(true);
    });

    // unsupported配列の型安全性
    result.unsupported.forEach(logicalId => {
      expect(typeof logicalId).toBe('string');
      expect(logicalId.length).toBeGreaterThan(0);
    });
  });

  // エラーハンドリングとの統合確認
  it('should handle edge cases gracefully', () => {
    // 空のテンプレート
    const emptyTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Resources: {}
    };
    
    const result = extractor.extract(emptyTemplate);
    
    expect(result.supported).toHaveLength(0);
    expect(result.unsupported).toHaveLength(0);
    expect(result.totalCount).toBe(0);
    expect(result.extractionTimeMs).toBeGreaterThanOrEqual(0);

    // 型安全性：空配列でも適切な型
    expect(Array.isArray(result.supported)).toBe(true);
    expect(Array.isArray(result.unsupported)).toBe(true);
  });

  // ExtractionPerformanceMonitor統合テスト
  it('should integrate with performance monitoring', async () => {
    const basicTemplatePath = path.join(__dirname, '../../../examples/basic-cloudformation.yaml');
    const template = await parser.parse(basicTemplatePath);
    
    const performanceResult = ExtractionPerformanceMonitor.measureExtractionPerformance(extractor, template);
    
    expect(performanceResult.result).toBeDefined();
    expect(performanceResult.memoryUsage).toBeGreaterThanOrEqual(0);
    expect(['A', 'B', 'C', 'F']).toContain(performanceResult.performanceGrade);
    
    console.log(`⚡ パフォーマンス評価: ${performanceResult.performanceGrade} (メモリ: ${performanceResult.memoryUsage.toFixed(1)}MB)`);
  });

  // 実際のサポート対象リソース検証
  it('should accurately detect supported resources in real templates', async () => {
    const samTemplatePath = path.join(__dirname, '../../../examples/serverless-api-sam.yaml');
    const template = await parser.parse(samTemplatePath);
    const result = extractor.extract(template);

    // SAMテンプレートのサポート対象確認
    const resourceTypes = result.supported.map(r => r.Type);
    const expectedSupportedTypes = [
      'AWS::Serverless::Api',
      'AWS::Serverless::Function', 
      'AWS::DynamoDB::Table'
    ];

    expectedSupportedTypes.forEach(expectedType => {
      expect(resourceTypes.some(type => type === expectedType)).toBe(true);
    });

    console.log(`📋 SAMテンプレート: サポート対象リソース型 ${[...new Set(resourceTypes)].join(', ')}`);
  });
});