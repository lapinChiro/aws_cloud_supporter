// MetricsAnalyzer統合テスト - 出力形式とエラーハンドリング
// CLAUDE.md準拠: No any types、TDD実践

import * as fs from 'fs/promises';
import * as path from 'path';

import { dump } from 'js-yaml';

import { HTMLOutputFormatter } from '../../src/core/formatters/html';
import { JSONOutputFormatter } from '../../src/core/json-formatter';

import {
  createTestAnalyzer,
  createTestTemplate
} from './metrics-analyzer.integration.test-helpers';

describe('MetricsAnalyzer Integration - Output Format', () => {
  const analyzer = createTestAnalyzer();
  const testTemplate = createTestTemplate();

  it('should generate valid JSON output with formatter', async () => {
    const tempPath = path.join(__dirname, 'format-test.yaml');
    await fs.writeFile(tempPath, dump(testTemplate));
    
    try {
      const result = await analyzer.analyze(tempPath, {
        outputFormat: 'json'
      });
      
      // JSON形式の検証
      const jsonFormatter = new JSONOutputFormatter();
      const jsonOutput = jsonFormatter.format(result);
      
      // JSON解析可能か確認
      interface ParsedOutput {
        metadata: {
          version: string;
          template_path: string;
        };
        resources: unknown[];
      }
      const parsed = JSON.parse(jsonOutput) as ParsedOutput;
      expect(parsed.metadata.version).toBe('1.0.0');
      expect(parsed.resources).toHaveLength(6);
      expect(parsed.metadata.template_path).toBe(tempPath);
      
    } finally {
      try {
        await fs.unlink(tempPath);
      } catch {
        // ファイルが存在しない場合は無視
      }
    }
  });

  it('should generate valid HTML output with formatter', async () => {
    const tempPath = path.join(__dirname, 'html-test.yaml');
    await fs.writeFile(tempPath, dump(testTemplate));
    
    try {
      const result = await analyzer.analyze(tempPath, {
        outputFormat: 'html'
      });
      
      // HTML形式の検証
      const htmlFormatter = new HTMLOutputFormatter();
      const htmlOutput = htmlFormatter.format(result);
      
      // HTML基本構造確認
      expect(htmlOutput).toContain('<!DOCTYPE html>');
      expect(htmlOutput).toContain('CloudWatch Metrics Report');
      expect(htmlOutput).toContain('searchInput');
      expect(htmlOutput).toContain('importanceFilter');
      
    } finally {
      try {
        await fs.unlink(tempPath);
      } catch {
        // ファイルが存在しない場合は無視
      }
    }
  });
});

describe('MetricsAnalyzer Integration - Error Handling', () => {
  const analyzer = createTestAnalyzer();

  it('should handle parse errors gracefully', async () => {
    const invalidPath = path.join(__dirname, 'invalid.yaml');
    await fs.writeFile(invalidPath, 'invalid yaml content: [}');
    
    try {
      await expect(analyzer.analyze(invalidPath, {
        outputFormat: 'json'
      })).rejects.toThrow();
      
    } finally {
      try {
        await fs.unlink(invalidPath);
      } catch {
        // ファイルが存在しない場合は無視
      }
    }
  });

  it('should handle missing file gracefully', async () => {
    const nonExistentPath = path.join(__dirname, 'does-not-exist.yaml');
    
    await expect(analyzer.analyze(nonExistentPath, {
      outputFormat: 'json'
    })).rejects.toThrow();
  });
});