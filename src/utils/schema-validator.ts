// CLAUDE.md準拠: 型安全性・SOLID原則・DRY原則
// requirement.md JSON Schema定義に基づく検証システム

import { CloudSupporterError, ErrorType } from './error';

/**
 * requirement.md準拠JSON Schemaインターフェース
 */
export interface AnalysisResultSchema {
  metadata: {
    version: string;
    generated_at: string;
    template_path: string;
    total_resources: number;
    supported_resources: number;
    processing_time_ms?: number;
  };
  resources: Array<{
    logical_id: string;
    resource_type: string;
    resource_properties: Record<string, unknown>;
    metrics: Array<{
      metric_name: string;
      namespace: string;
      unit: string;
      description: string;
      statistic: string;
      recommended_threshold: {
        warning: number;
        critical: number;
      };
      evaluation_period: number;
      category: 'Performance' | 'Error' | 'Saturation' | 'Latency';
      importance: 'High' | 'Medium' | 'Low';
      dimensions?: Array<{
        name: string;
        value: string;
      }>;
    }>;
  }>;
  unsupported_resources: string[];
}

/**
 * JSONスキーマ検証エラー詳細
 */
export interface ValidationError {
  path: string;
  message: string;
  value: unknown;
}

/**
 * requirement.md準拠JSONスキーマバリデータ
 * SOLID原則: 単一責任（JSON Schema検証のみ）
 */
export class JsonSchemaValidator {
  
  /**
   * AnalysisResult JSON出力の完全スキーマ検証
   * requirement.md 4.2節準拠
   */
  validateAnalysisResult(data: unknown): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!data || typeof data !== 'object') {
      errors.push({
        path: 'root',
        message: 'Root must be an object',
        value: data
      });
      return errors;
    }
    
    const obj = data as Record<string, unknown>;
    
    // metadata検証
    this.validateMetadata(obj.metadata, 'metadata', errors);
    
    // resources検証
    this.validateResources(obj.resources, 'resources', errors);
    
    // unsupported_resources検証
    this.validateUnsupportedResources(obj.unsupported_resources, 'unsupported_resources', errors);
    
    return errors;
  }
  
  /**
   * メタデータセクション検証
   */
  private validateMetadata(metadata: unknown, path: string, errors: ValidationError[]): void {
    if (!metadata || typeof metadata !== 'object') {
      errors.push({
        path,
        message: 'metadata must be an object',
        value: metadata
      });
      return;
    }
    
    const meta = metadata as Record<string, unknown>;
    
    // 必須フィールド検証
    const requiredFields = ['version', 'generated_at', 'template_path', 'total_resources', 'supported_resources'];
    for (const field of requiredFields) {
      if (!(field in meta)) {
        errors.push({
          path: `${path}.${field}`,
          message: `Required field '${field}' is missing`,
          value: undefined
        });
      }
    }
    
    // 型検証
    if (typeof meta.version !== 'string') {
      errors.push({
        path: `${path}.version`,
        message: 'version must be a string',
        value: meta.version
      });
    }
    
    if (typeof meta.generated_at !== 'string' || !this.isValidISO8601(meta.generated_at as string)) {
      errors.push({
        path: `${path}.generated_at`,
        message: 'generated_at must be a valid ISO-8601 date string',
        value: meta.generated_at
      });
    }
    
    if (typeof meta.template_path !== 'string') {
      errors.push({
        path: `${path}.template_path`,
        message: 'template_path must be a string',
        value: meta.template_path
      });
    }
    
    if (typeof meta.total_resources !== 'number' || !Number.isInteger(meta.total_resources) || meta.total_resources < 0) {
      errors.push({
        path: `${path}.total_resources`,
        message: 'total_resources must be a non-negative integer',
        value: meta.total_resources
      });
    }
    
    if (typeof meta.supported_resources !== 'number' || !Number.isInteger(meta.supported_resources) || meta.supported_resources < 0) {
      errors.push({
        path: `${path}.supported_resources`,
        message: 'supported_resources must be a non-negative integer',
        value: meta.supported_resources
      });
    }
    
    // オプションフィールド検証
    if (meta.processing_time_ms !== undefined && (typeof meta.processing_time_ms !== 'number' || meta.processing_time_ms < 0)) {
      errors.push({
        path: `${path}.processing_time_ms`,
        message: 'processing_time_ms must be a non-negative number',
        value: meta.processing_time_ms
      });
    }
  }
  
  /**
   * リソース配列検証
   */
  private validateResources(resources: unknown, path: string, errors: ValidationError[]): void {
    if (!Array.isArray(resources)) {
      errors.push({
        path,
        message: 'resources must be an array',
        value: resources
      });
      return;
    }
    
    resources.forEach((resource, index) => {
      this.validateResource(resource, `${path}[${index}]`, errors);
    });
  }
  
  /**
   * 単一リソース検証
   */
  private validateResource(resource: unknown, path: string, errors: ValidationError[]): void {
    if (!resource || typeof resource !== 'object') {
      errors.push({
        path,
        message: 'Resource must be an object',
        value: resource
      });
      return;
    }
    
    const res = resource as Record<string, unknown>;
    
    // 必須フィールド検証
    const requiredFields = ['logical_id', 'resource_type', 'resource_properties', 'metrics'];
    for (const field of requiredFields) {
      if (!(field in res)) {
        errors.push({
          path: `${path}.${field}`,
          message: `Required field '${field}' is missing`,
          value: undefined
        });
      }
    }
    
    // 型検証
    if (typeof res.logical_id !== 'string') {
      errors.push({
        path: `${path}.logical_id`,
        message: 'logical_id must be a string',
        value: res.logical_id
      });
    }
    
    if (typeof res.resource_type !== 'string') {
      errors.push({
        path: `${path}.resource_type`,
        message: 'resource_type must be a string',
        value: res.resource_type
      });
    }
    
    if (!res.resource_properties || typeof res.resource_properties !== 'object') {
      errors.push({
        path: `${path}.resource_properties`,
        message: 'resource_properties must be an object',
        value: res.resource_properties
      });
    }
    
    // メトリクス配列検証
    this.validateMetrics(res.metrics, `${path}.metrics`, errors);
  }
  
  /**
   * メトリクス配列検証
   */
  private validateMetrics(metrics: unknown, path: string, errors: ValidationError[]): void {
    if (!Array.isArray(metrics)) {
      errors.push({
        path,
        message: 'metrics must be an array',
        value: metrics
      });
      return;
    }
    
    metrics.forEach((metric, index) => {
      this.validateMetric(metric, `${path}[${index}]`, errors);
    });
  }
  
  /**
   * 単一メトリクス検証
   */
  private validateMetric(metric: unknown, path: string, errors: ValidationError[]): void {
    if (!metric || typeof metric !== 'object') {
      errors.push({
        path,
        message: 'Metric must be an object',
        value: metric
      });
      return;
    }
    
    const met = metric as Record<string, unknown>;
    
    // 必須フィールド検証
    const requiredFields = [
      'metric_name', 'namespace', 'unit', 'description', 'statistic', 
      'recommended_threshold', 'evaluation_period', 'category', 'importance'
    ];
    
    for (const field of requiredFields) {
      if (!(field in met)) {
        errors.push({
          path: `${path}.${field}`,
          message: `Required field '${field}' is missing`,
          value: undefined
        });
      }
    }
    
    // 文字列フィールド検証
    const stringFields = ['metric_name', 'namespace', 'unit', 'description', 'statistic'];
    for (const field of stringFields) {
      if (typeof met[field] !== 'string') {
        errors.push({
          path: `${path}.${field}`,
          message: `${field} must be a string`,
          value: met[field]
        });
      }
    }
    
    // 数値フィールド検証
    if (typeof met.evaluation_period !== 'number' || !Number.isInteger(met.evaluation_period) || met.evaluation_period <= 0) {
      errors.push({
        path: `${path}.evaluation_period`,
        message: 'evaluation_period must be a positive integer',
        value: met.evaluation_period
      });
    }
    
    // category検証（requirement.md準拠）
    const validCategories = ['Performance', 'Error', 'Saturation', 'Latency'];
    if (!validCategories.includes(met.category as string)) {
      errors.push({
        path: `${path}.category`,
        message: `category must be one of: ${validCategories.join(', ')}`,
        value: met.category
      });
    }
    
    // importance検証（requirement.md準拠）
    const validImportance = ['High', 'Medium', 'Low'];
    if (!validImportance.includes(met.importance as string)) {
      errors.push({
        path: `${path}.importance`,
        message: `importance must be one of: ${validImportance.join(', ')}`,
        value: met.importance
      });
    }
    
    // recommended_threshold検証
    this.validateThreshold(met.recommended_threshold, `${path}.recommended_threshold`, errors);
    
    // オプションのdimensions検証
    if (met.dimensions !== undefined) {
      this.validateDimensions(met.dimensions, `${path}.dimensions`, errors);
    }
  }
  
  /**
   * しきい値検証
   */
  private validateThreshold(threshold: unknown, path: string, errors: ValidationError[]): void {
    if (!threshold || typeof threshold !== 'object') {
      errors.push({
        path,
        message: 'recommended_threshold must be an object',
        value: threshold
      });
      return;
    }
    
    const thresh = threshold as Record<string, unknown>;
    
    // 必須フィールド
    const requiredFields = ['warning', 'critical'];
    for (const field of requiredFields) {
      if (!(field in thresh)) {
        errors.push({
          path: `${path}.${field}`,
          message: `Required field '${field}' is missing`,
          value: undefined
        });
      } else if (typeof thresh[field] !== 'number') {
        errors.push({
          path: `${path}.${field}`,
          message: `${field} must be a number`,
          value: thresh[field]
        });
      }
    }
  }
  
  /**
   * ディメンション配列検証
   */
  private validateDimensions(dimensions: unknown, path: string, errors: ValidationError[]): void {
    if (!Array.isArray(dimensions)) {
      errors.push({
        path,
        message: 'dimensions must be an array',
        value: dimensions
      });
      return;
    }
    
    dimensions.forEach((dimension, index) => {
      this.validateDimension(dimension, `${path}[${index}]`, errors);
    });
  }
  
  /**
   * 単一ディメンション検証
   */
  private validateDimension(dimension: unknown, path: string, errors: ValidationError[]): void {
    if (!dimension || typeof dimension !== 'object') {
      errors.push({
        path,
        message: 'Dimension must be an object',
        value: dimension
      });
      return;
    }
    
    const dim = dimension as Record<string, unknown>;
    
    // 必須フィールド
    const requiredFields = ['name', 'value'];
    for (const field of requiredFields) {
      if (!(field in dim)) {
        errors.push({
          path: `${path}.${field}`,
          message: `Required field '${field}' is missing`,
          value: undefined
        });
      } else if (typeof dim[field] !== 'string') {
        errors.push({
          path: `${path}.${field}`,
          message: `${field} must be a string`,
          value: dim[field]
        });
      }
    }
  }
  
  /**
   * unsupported_resources配列検証
   */
  private validateUnsupportedResources(unsupported: unknown, path: string, errors: ValidationError[]): void {
    if (!Array.isArray(unsupported)) {
      errors.push({
        path,
        message: 'unsupported_resources must be an array',
        value: unsupported
      });
      return;
    }
    
    unsupported.forEach((resource, index) => {
      if (typeof resource !== 'string') {
        errors.push({
          path: `${path}[${index}]`,
          message: 'Unsupported resource must be a string',
          value: resource
        });
      }
    });
  }
  
  /**
   * ISO-8601日付フォーマット検証
   */
  private isValidISO8601(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return date.toISOString() === dateString;
    } catch {
      return false;
    }
  }
  
  /**
   * 検証エラーの文字列表現生成
   */
  formatValidationErrors(errors: ValidationError[]): string {
    if (errors.length === 0) return 'No validation errors';
    
    return errors.map(error => 
      `${error.path}: ${error.message} (received: ${JSON.stringify(error.value)})`
    ).join('\n');
  }
  
  /**
   * 検証結果の要約統計
   */
  getValidationSummary(errors: ValidationError[]): { isValid: boolean; errorCount: number; categories: Record<string, number> } {
    const categories: Record<string, number> = {};
    
    errors.forEach(error => {
      const pathSegments = error.path.split('.');
      const firstSegment = pathSegments[0] || 'root';
      const category = firstSegment.split('[')[0] || 'root'; // Remove array indices for categorization
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return {
      isValid: errors.length === 0,
      errorCount: errors.length,
      categories
    };
  }
}

/**
 * JSON Schema検証用ヘルパー関数
 */
export function validateJsonSchema(data: unknown): { isValid: boolean; errors: ValidationError[]; summary: string } {
  const validator = new JsonSchemaValidator();
  const errors = validator.validateAnalysisResult(data);
  const summary = validator.getValidationSummary(errors);
  
  return {
    isValid: summary.isValid,
    errors,
    summary: summary.isValid 
      ? '✅ JSON Schema validation passed'
      : `❌ ${summary.errorCount} validation errors found: ${Object.entries(summary.categories).map(([cat, count]) => `${cat}(${count})`).join(', ')}`
  };
}

/**
 * メトリクス出力検証（テスト互換関数）
 */
export function validateMetricsOutput(data: unknown): { valid: boolean; errors: string[] } {
  const validator = new JsonSchemaValidator();
  const validationErrors = validator.validateAnalysisResult(data);
  
  return {
    valid: validationErrors.length === 0,
    errors: validationErrors.map(error => error.message)
  };
}

/**
 * 検証失敗時のCloudSupporterError生成
 */
export function createSchemaValidationError(errors: ValidationError[]): CloudSupporterError {
  const validator = new JsonSchemaValidator();
  const formattedErrors = validator.formatValidationErrors(errors);
  
  return new CloudSupporterError(
    ErrorType.OUTPUT_ERROR,
    `JSON output does not conform to requirement.md schema specification`,
    { 
      validationErrors: formattedErrors,
      errorCount: errors.length 
    }
  );
}