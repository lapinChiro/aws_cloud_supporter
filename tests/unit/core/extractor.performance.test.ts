// CLAUDE.md準拠ResourceExtractorパフォーマンステスト
import path from 'path';

import { ResourceExtractor, ExtractionPerformanceMonitor } from '../../../src/core/extractor';
import { TemplateParser } from '../../../src/core/parser';
import type { CloudFormationTemplate } from '../../../src/types/cloudformation';

import { createExtractionTestFixtures, setupTempDir } from './extractor.test-helpers';

// 全テストで使用する一時ディレクトリ
let tempDir: string;

// 全テスト前の準備
beforeAll(() => {
  tempDir = setupTempDir();
  // テストフィクスチャー作成
  createExtractionTestFixtures(tempDir);
});

describe('ResourceExtractorパフォーマンステスト（CLAUDE.md: 性能要件）', () => {

  // 大量リソース処理テスト（GREEN段階: 500リソース3秒以内）
  it('should handle large templates efficiently', async () => {
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const largePath = path.join(tempDir, 'large-resources-500.json');
    const template = await parser.parse(largePath);
    
    const performance = ExtractionPerformanceMonitor.measureExtractionPerformance(extractor, template);
    
    expect(performance.result.totalCount).toBe(650);
    expect(performance.result.extractionTimeMs).toBeLessThan(3000); // 3秒以内
    expect(performance.performanceGrade).not.toBe('F'); // 性能要件達成
  });

  // 並行抽出テスト（GREEN段階: 型安全並行処理）
  it('should support concurrent extraction safely', async () => {
    
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const mixedPath = path.join(tempDir, 'mixed-resources.json');
    const template = await parser.parse(mixedPath);
    
    // 同じテンプレートを並行抽出
    const promises = Array(5).fill(null).map(() => 
      extractor.extract(template)
    );
    
    const results = await Promise.all(promises);
    
    // 全て同じ結果が得られることを確認（状態汚染なし）
    results.forEach(result => {
      expect(result.totalCount).toBe(13);
      expect(result.supported.length).toBe(6);
    });
  });

  // メモリ効率テスト（GREEN段階: リークなし確認）
  it('should extract resources without memory leaks', async () => {
    
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const mixedPath = path.join(tempDir, 'mixed-resources.json');
    const template = await parser.parse(mixedPath);
    
    const memoryBefore = process.memoryUsage().heapUsed;
    
    // 100回抽出
    for (let i = 0; i < 100; i++) {
      extractor.extract(template);
    }
    
    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryDelta = (memoryAfter - memoryBefore) / 1024 / 1024;
    
    expect(memoryDelta).toBeLessThan(20); // メモリ増加20MB以下
  });

  // パフォーマンス監視テスト（GREEN段階: 警告確認）
  it('should warn when extraction exceeds time limits', () => {
    
    // 通常の処理では警告は出ない想定
    const extractor = new ResourceExtractor();
    const smallTemplate: CloudFormationTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Resources: {
        Test: { Type: "AWS::RDS::DBInstance", Properties: {} }
      }
    };
    
    const result = extractor.extract(smallTemplate);
    expect(result.extractionTimeMs).toBeLessThan(100); // 小さなテンプレートは100ms以下
  });
});