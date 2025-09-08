// CLAUDE.md準拠TemplateParser（Don't Reinvent the Wheel + Type-Driven Development）

import { parse as parseYAML, YAMLParseError } from 'yaml';
import { CloudFormationTemplate } from '../types/cloudformation';
import { 
  CloudSupporterError, 
  createFileError, 
  createParseError 
} from '../utils/error';
import { ITemplateParser } from '../types/metrics';

// UNIX Philosophy: 一つのことをうまくやる（CloudFormation解析のみ）
export class TemplateParser implements ITemplateParser {
  
  // メイン解析メソッド（型安全性重視）
  async parse(filePath: string): Promise<CloudFormationTemplate> {
    try {
      // 1. ファイル検証（CLAUDE.md: Type-Driven Development）
      await this.validateFile(filePath);
      
      // 2. ファイル読み込み（パフォーマンス監視）
      const content = await this.readFile(filePath);
      
      // 3. フォーマット判定・解析（Don't Reinvent: yamlライブラリ使用）
      const template = this.parseContent(content, filePath);
      
      // 4. CloudFormation構造検証
      this.validateTemplateStructure(template, filePath);
      
      return template;
    } catch (error) {
      // 既存エラーハンドリングシステム活用
      if (error instanceof CloudSupporterError) {
        throw error;
      }
      
      // エラーメッセージの安全な抽出
      let errorMessage = 'Unknown error';
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('toString' in error && typeof error.toString === 'function') {
          errorMessage = error.toString();
        } else {
          errorMessage = String(error);
        }
      } else {
        errorMessage = String(error);
      }
      
      throw createFileError(
        `Failed to parse template: ${errorMessage}`,
        filePath,
        { originalError: errorMessage }
      );
    }
  }

  // ファイル存在・サイズ・権限検証（型安全性）
  private async validateFile(filePath: string): Promise<void> {
    const fs = await import('fs/promises');
    
    try {
      const stats = await fs.stat(filePath);
      
      // ファイル種別確認
      if (!stats.isFile()) {
        throw createFileError(
          `Path is not a file: ${filePath}`,
          filePath
        );
      }
      
      // サイズ制限確認（50MB）
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (stats.size > maxSize) {
        throw createFileError(
          `File too large: ${(stats.size / 1024 / 1024).toFixed(1)}MB (max: 50MB)`,
          filePath,
          { fileSize: stats.size }
        );
      }
    } catch (error) {
      if (error instanceof CloudSupporterError) throw error;
      
      // ファイルアクセスエラー（ENOENT等）
      const nodeError = error as NodeJS.ErrnoException;
      throw createFileError(
        `Cannot access file: ${nodeError.code}`,
        filePath,
        nodeError.code ? { error: nodeError.code } : {}
      );
    }
  }

  // ファイル読み込み（時間制限・メモリ効率）
  private async readFile(filePath: string): Promise<string> {
    const fs = await import('fs/promises');
    
    try {
      const startTime = performance.now();
      const content = await fs.readFile(filePath, 'utf8');
      const duration = performance.now() - startTime;
      
      // 読み込み時間制限（10秒 - 並行処理とI/O競合を考慮）
      if (duration > 10000) {
        throw createFileError(
          `File reading timeout: ${duration.toFixed(0)}ms (max: 10000ms)`,
          filePath,
          { duration: Math.round(duration) }
        );
      }
      
      return content;
    } catch (error) {
      if (error instanceof CloudSupporterError) throw error;
      
      const nodeError = error as NodeJS.ErrnoException;
      throw createFileError(
        `Failed to read file: ${nodeError.message}`,
        filePath,
        { originalError: nodeError.message }
      );
    }
  }

  // コンテンツ解析（CLAUDE.md: Don't Reinvent the Wheel）
  private parseContent(content: string, filePath: string): CloudFormationTemplate {
    const isJSON = filePath.toLowerCase().endsWith('.json');
    
    try {
      if (isJSON) {
        // JSON解析（標準JSON.parse使用）
        return JSON.parse(content) as CloudFormationTemplate;
      } else {
        // YAML解析（yamlライブラリ使用）- 警告を抑制
        const options = {
          logLevel: 'silent' as const,
          strict: false
        };
        return parseYAML(content, options) as CloudFormationTemplate;
      }
    } catch (error) {
      // 構文エラー詳細抽出
      const errorDetails = this.extractSyntaxError(error as Error, content, isJSON);
      
      // エラーメッセージの安全な抽出（YAMLWarning/YAMLParseError対応）
      let errorMessage = 'Unknown parsing error';
      
      if (error instanceof YAMLParseError) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('toString' in error && typeof error.toString === 'function') {
          try {
            errorMessage = error.toString();
          } catch {
            errorMessage = String(error);
          }
        } else {
          errorMessage = String(error);
        }
      } else {
        errorMessage = String(error);
      }
      
      throw createParseError(
        `${isJSON ? 'JSON' : 'YAML'} syntax error: ${errorMessage}`,
        filePath,
        errorDetails.lineNumber,
        errorDetails
      );
    }
  }

  // 構文エラー詳細抽出（型安全、CLAUDE.md: No any types）
  private extractSyntaxError(
    error: Error, 
    content: string, 
    isJSON: boolean
  ): { lineNumber?: number; columnNumber?: number; nearText?: string } {
    
    if (isJSON && error instanceof SyntaxError) {
      // JSON構文エラー詳細抽出（型安全性）
      const positionMatch = error.message.match(/position (\d+)/);
      if (positionMatch?.[1]) {
        const position = parseInt(positionMatch[1], 10);
        const lines = content.substring(0, position).split('\n');
        const lineNumber = lines.length;
        const columnNumber = lines[lines.length - 1]?.length || 0;
        const nearText = content.substring(
          Math.max(0, position - 50), 
          Math.min(content.length, position + 50)
        );
        
        return { lineNumber, columnNumber, nearText };
      }
    } else if (!isJSON) {
      // YAML構文エラー詳細（yamlライブラリエラー、型安全性）
      const yamlError = error as { linePos?: Array<{ line?: number; col?: number; text?: string }> };
      const pos = yamlError.linePos?.[0];
      if (pos) {
        const result: { lineNumber?: number; columnNumber?: number; nearText?: string } = {};
        if (pos.line !== undefined) result.lineNumber = pos.line;
        if (pos.col !== undefined) result.columnNumber = pos.col;
        if (pos.text !== undefined) result.nearText = pos.text;
        return result;
      }
    }
    
    // フォールバック（基本的なエラー情報のみ）
    return {
      nearText: error.message
    };
  }

  // CloudFormation構造検証（型安全性）
  private validateTemplateStructure(template: unknown, filePath: string): void {
    // 基本オブジェクト検証
    if (!template || typeof template !== 'object') {
      throw createParseError(
        'Template must be a valid object',
        filePath
      );
    }

    const cfnTemplate = template as Record<string, unknown>;

    // Resources セクション必須検証
    if (!cfnTemplate.Resources || typeof cfnTemplate.Resources !== 'object') {
      throw createParseError(
        'Template must contain "Resources" section',
        filePath,
        undefined,
        {
          nearText: 'CloudFormation template requires "Resources" section with at least one resource'
        }
      );
    }

    // AWSTemplateFormatVersion 警告（必須ではないが推奨）
    if (!cfnTemplate.AWSTemplateFormatVersion) {
      console.warn('\x1b[33m⚠️  Missing AWSTemplateFormatVersion, assuming 2010-09-09\x1b[0m');
    }

    // Resourcesが空でないことを確認
    const resources = cfnTemplate.Resources as Record<string, unknown>;
    if (Object.keys(resources).length === 0) {
      throw createParseError(
        'Template Resources section is empty',
        filePath,
        undefined,
        { 
          nearText: 'CloudFormation template must contain at least one resource definition'
        }
      );
    }

    // 各リソースの基本構造検証
    for (const [logicalId, resource] of Object.entries(resources)) {
      if (!resource || typeof resource !== 'object') {
        throw createParseError(
          `Resource "${logicalId}" must be an object`,
          filePath,
          undefined,
          { nearText: `Resource ${logicalId} has invalid structure` }
        );
      }

      const resourceObj = resource as Record<string, unknown>;
      if (!resourceObj.Type || typeof resourceObj.Type !== 'string') {
        throw createParseError(
          `Resource "${logicalId}" missing required "Type" property`,
          filePath,
          undefined,
          { nearText: `Resource ${logicalId} must have a Type property (e.g., "AWS::S3::Bucket")` }
        );
      }
    }
  }
}

// 型安全なファイル形式検証（CLAUDE.md: Type-Driven Development）
export function isJSONFile(filePath: string): boolean {
  return filePath.toLowerCase().endsWith('.json');
}

export function isYAMLFile(filePath: string): boolean {
  const lowerPath = filePath.toLowerCase();
  return lowerPath.endsWith('.yaml') || lowerPath.endsWith('.yml');
}

export function isSupportedTemplateFile(filePath: string): boolean {
  return isJSONFile(filePath) || isYAMLFile(filePath);
}