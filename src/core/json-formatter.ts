// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計
// T-016: JSONフォーマッター実装

import { CloudSupporterError, Errors } from '../errors';
import type { IOutputFormatter } from '../interfaces/formatter';
import type { AnalysisResult } from '../types/metrics';
import { validateMetricsOutput } from '../utils/schema-validator';

/**
 * JSON出力フォーマッタークラス
 * SOLID原則: 単一責任（JSON出力のみ）
 */
export class JSONOutputFormatter implements IOutputFormatter {
  constructor() {
    // No instance variables needed
  }
  
  /**
   * 分析結果をJSON形式でフォーマット
   * @param result 分析結果
   * @returns JSON文字列
   */
  format(result: AnalysisResult): string {
    return this.formatJSON(result);
  }

  /**
   * JSON形式でのフォーマット出力
   * requirement.md準拠のJSON Schema実装
   */
  formatJSON(result: AnalysisResult): string {
    const startTime = performance.now();
    
    try {
      // 入力検証（CLAUDE.md: 型安全性）
      if (!result || typeof result !== 'object') {
        throw Errors.Common.outputError(
          'Invalid analysis result provided',
          { received: typeof result }
        );
      }

      // requirement.md準拠の出力構造構築
      const output = {
        metadata: {
          version: "1.0.0" as const,
          generated_at: result.metadata.generated_at,
          template_path: result.metadata.template_path,
          total_resources: result.metadata.total_resources,
          supported_resources: result.metadata.supported_resources,
          processing_time_ms: result.metadata.processing_time_ms
        },
        resources: result.resources.map(resource => ({
          logical_id: resource.logical_id,
          resource_type: resource.resource_type,
          resource_properties: this.sanitizeProperties(resource.resource_properties),
          metrics: resource.metrics.map(metric => ({
            metric_name: metric.metric_name,
            namespace: metric.namespace,
            unit: metric.unit,
            description: metric.description,
            statistic: metric.statistic,
            recommended_threshold: {
              warning: metric.recommended_threshold.warning,
              critical: metric.recommended_threshold.critical
            },
            evaluation_period: metric.evaluation_period,
            category: metric.category,
            importance: metric.importance,
            dimensions: metric.dimensions
          }))
        })),
        unsupported_resources: result.unsupported_resources || []
      };

      // JSON文字列生成
      const jsonString = JSON.stringify(output, null, 2);
      
      // requirement.md JSON Schema検証（100%準拠確保）
      const validation = validateMetricsOutput(output);
      if (!validation.valid) {
        throw Errors.Common.outputError(
          `JSON output validation failed: ${validation.errors.join('; ')}`,
          { validationErrors: validation.errors }
        );
      }
      
      const duration = performance.now() - startTime;
      
      // パフォーマンス監視（CLAUDE.md: 性能要件）
      if (duration > 2000) {
        // eslint-disable-next-line no-console
        console.warn(`⚠️  JSON formatting slow: ${duration.toFixed(0)}ms`);
      }
      
      // サイズ監視（5MB制限）
      const sizeInBytes = new TextEncoder().encode(jsonString).length;
      if (sizeInBytes > 5 * 1024 * 1024) {
        // eslint-disable-next-line no-console
        console.warn(`⚠️  Large JSON output: ${(sizeInBytes / 1024 / 1024).toFixed(1)}MB`);
      }

      return jsonString;
    } catch (error) {
      if (error instanceof CloudSupporterError) {
        throw error;
      }
      throw Errors.Common.outputError(
        `Failed to format JSON output: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * プロパティのセキュリティサニタイズ
   * CLAUDE.md準拠: セキュリティ考慮
   */
  private sanitizeProperties(properties: Record<string, unknown>): Record<string, unknown> {
    if (!properties || typeof properties !== 'object') {
      return {};
    }

    const sanitized = { ...properties };
    const sensitiveKeys = ['MasterUserPassword', 'DBPassword', 'Password', 'SecretString', 'ApiKey'];
    
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}