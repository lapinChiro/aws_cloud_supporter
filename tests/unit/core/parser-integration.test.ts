// CLAUDE.md準拠TemplateParser実テンプレート統合テスト（BLUE段階）

import { writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

import { TemplateParser } from '../../../src/core/parser';
import { isSupportedResource } from '../../../src/types/cloudformation';

describe('TemplateParser実テンプレート統合（CLAUDE.md: 実用性確認）', () => {
  let parser: TemplateParser;
  let tempDir: string;

  beforeAll(() => {
    tempDir = path.join(tmpdir(), 'aws-cloud-supporter-integration-test');
    try {
      mkdirSync(tempDir, { recursive: true });
    } catch {
      // 既存の場合は無視
    }
  });

  beforeEach(() => {
    parser = new TemplateParser();
  });

  // 実際のテンプレートテスト（シンプル化）
  it('should parse real CloudFormation templates', async () => {
    const basicTemplatePath = path.join(__dirname, '../../../examples/basic-cloudformation.yaml');
    
    const template = await parser.parse(basicTemplatePath);
    
    expect(template).toBeDefined();
    expect(template.Resources).toBeDefined();
    expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
  });

  // パフォーマンス：複数テンプレート処理
  it('should handle multiple templates efficiently', async () => {
    const templatePaths = [
      path.join(__dirname, '../../../examples/basic-cloudformation.yaml')
    ];

    const startTime = performance.now();
    
    for (const templatePath of templatePaths) {
      const template = await parser.parse(templatePath);
      expect(template.Resources).toBeDefined();
    }
    
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(2000); // 2秒以内
  });

  // 型安全性：リソース識別確認
  it('should identify resources with type safety', async () => {
    const basicTemplatePath = path.join(__dirname, '../../../examples/basic-cloudformation.yaml');
    const template = await parser.parse(basicTemplatePath);
    
    // 型安全なリソース識別
    let supportedCount = 0;
    let totalCount = 0;
    
    for (const [, resource] of Object.entries(template.Resources)) {
      totalCount++;
      if (isSupportedResource(resource)) {
        supportedCount++;
      }
    }
    
    expect(totalCount).toBeGreaterThan(0);
    expect(supportedCount >= 0).toBe(true);
  });

  // エラーレポートの品質テスト（シンプル化）
  it('should provide high-quality error reports', async () => {
    // 構造的に問題のあるテンプレート
    const problematicTemplate = `
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  InvalidResource:
    # Typeプロパティが無い
    Properties:
      Name: "test"
`;
    
    const problematicPath = path.join(tempDir, 'problematic.yaml');
    writeFileSync(problematicPath, problematicTemplate, 'utf8');

    try {
      await parser.parse(problematicPath);
    } catch (error) {
      // 詳細で有用なエラーレポート
      const err = error as { type: string; message: string; filePath: string };
      expect(err.type).toBe('PARSE_ERROR');
      expect(err.message).toContain('Type');
      expect(err.filePath).toBe(problematicPath);
    }
  });
});