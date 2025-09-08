// CLAUDE.md準拠TemplateParserパフォーマンス最適化テスト（BLUE段階）

import { TemplateParser, FileReader } from '../../../src/core/parser';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

describe('TemplateParser最適化（CLAUDE.md: BLUE段階）', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = path.join(tmpdir(), 'aws-cloud-supporter-perf-test');
    try {
      mkdirSync(tempDir, { recursive: true });
    } catch {
      // 既存の場合は無視
    }
  });

  // FileReaderユーティリティクラスのテスト（UNIX Philosophy: 分離）
  it('should provide efficient file reading utilities', async () => {
    // テストファイル作成
    const testContent = 'AWSTemplateFormatVersion: "2010-09-09"\nResources:\n  Test:\n    Type: AWS::S3::Bucket';
    const testPath = path.join(tempDir, 'test-file-reader.yaml');
    writeFileSync(testPath, testContent, 'utf8');

    // FileReader.readText テスト
    const content = await FileReader.readText(testPath);
    expect(content).toBe(testContent);

    // FileReader.getStats テスト
    const stats = await FileReader.getStats(testPath);
    expect(stats.isFile).toBe(true);
    expect(stats.size).toBeGreaterThan(0);
  });

  // ファイル形式判定関数テスト（型安全性）
  it('should accurately detect file formats', () => {
    const { isJSONFile, isYAMLFile, isSupportedTemplateFile } = require('../../../src/core/parser');

    expect(isJSONFile('template.json')).toBe(true);
    expect(isJSONFile('template.JSON')).toBe(true); // 大文字小文字対応
    expect(isJSONFile('template.yaml')).toBe(false);

    expect(isYAMLFile('template.yaml')).toBe(true);
    expect(isYAMLFile('template.yml')).toBe(true);
    expect(isYAMLFile('template.YAML')).toBe(true); // 大文字小文字対応
    expect(isYAMLFile('template.json')).toBe(false);

    expect(isSupportedTemplateFile('template.json')).toBe(true);
    expect(isSupportedTemplateFile('template.yaml')).toBe(true);
    expect(isSupportedTemplateFile('template.txt')).toBe(false);
  });

  // 型安全性の向上テスト
  it('should demonstrate improved type safety', async () => {
    const parser = new TemplateParser();
    const testTemplate = `
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  TestDB:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: postgresql
      DBInstanceClass: db.r5.large
`;
    
    const testPath = path.join(tempDir, 'type-safety-test.yaml');
    writeFileSync(testPath, testTemplate, 'utf8');

    const template = await parser.parse(testPath);

    // TypeScript型推論の活用
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    
    // リソース型の型安全アクセス
    const testDB = template.Resources.TestDB;
    expect(testDB.Type).toBe('AWS::RDS::DBInstance');
    
    // Propertiesは型安全（unknownだが構造化アクセス可能）
    if (testDB.Properties && typeof testDB.Properties === 'object') {
      const props = testDB.Properties as Record<string, unknown>;
      expect(props.Engine).toBe('postgresql');
      expect(props.DBInstanceClass).toBe('db.r5.large');
    }
  });

  // エラーハンドリングの最適化テスト
  it('should provide optimized error handling', async () => {
    const parser = new TemplateParser();
    
    // Resourcesセクションが無い場合
    const noResourcesTemplate = `
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Template without Resources section'
`;
    
    const noResourcesPath = path.join(tempDir, 'no-resources.yaml');
    writeFileSync(noResourcesPath, noResourcesTemplate, 'utf8');

    try {
      await parser.parse(noResourcesPath);
    } catch (error) {
      expect(error.type).toBe('PARSE_ERROR');
      expect(error.message).toContain('Resources');
      expect(error.filePath).toBe(noResourcesPath);
      
      const structured = error.toStructuredOutput();
      expect(structured.timestamp).toBeDefined();
    }
  });

  // 大規模テンプレートの効率的処理
  it('should handle moderately large templates efficiently', async () => {
    const parser = new TemplateParser();
    
    // 中規模テンプレート（1000リソース程度）
    const mediumTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Description: "Medium size template",
      Resources: {} as Record<string, unknown>
    };
    
    for (let i = 0; i < 1000; i++) {
      mediumTemplate.Resources[`TestBucket${i}`] = {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: `test-bucket-${i}`
        }
      };
    }
    
    const mediumPath = path.join(tempDir, 'medium-template.json');
    writeFileSync(mediumPath, JSON.stringify(mediumTemplate, null, 2), 'utf8');
    
    const startTime = performance.now();
    const template = await parser.parse(mediumPath);
    const duration = performance.now() - startTime;
    
    expect(duration).toBeLessThan(2000); // 2秒以内
    expect(Object.keys(template.Resources)).toHaveLength(1000);
  });

  // インターフェース型安全性テスト（CLAUDE.md: Interface Segregation）
  it('should implement ITemplateParser interface correctly', () => {
    const parser = new TemplateParser();
    
    // インターフェース実装確認
    expect(typeof parser.parse).toBe('function');
    expect(parser.parse.length).toBe(1); // 引数1個
    
    // SOLID Interface Segregation原則確認
    // TemplateParserは解析のみに特化
    const parserMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(parser));
    const publicMethods = parserMethods.filter(method => !method.startsWith('_') && method !== 'constructor');
    
    expect(publicMethods).toContain('parse');
    expect(publicMethods.length).toBe(1); // parseメソッドのみpublic
  });
});