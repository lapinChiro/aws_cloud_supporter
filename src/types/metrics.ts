// CLAUDE.md準拠メトリクス型定義（Type-Driven Development、any型完全排除）
import { CloudFormationResource } from './cloudformation';
import { 
  MetricStatistic, 
  MetricCategory, 
  ImportanceLevel, 
  EvaluationPeriod, 
  TimestampISO
} from './common';

// =============================================================================
// メトリクス定義型（CLAUDE.md: 厳密型定義）
// =============================================================================

export interface MetricDefinition {
  metric_name: string;
  namespace: string;
  unit: string;
  description: string;
  statistic: MetricStatistic;
  recommended_threshold: ThresholdDefinition;
  evaluation_period: EvaluationPeriod;
  category: MetricCategory;
  importance: ImportanceLevel;
  dimensions?: MetricDimension[];
}

export interface ThresholdDefinition {
  warning: number;
  critical: number;
}

export interface MetricDimension {
  name: string;
  value: string;
}

// =============================================================================
// メトリクス設定型（設定ファイル用）
// =============================================================================

export interface MetricConfig {
  name: string;
  namespace: string;
  unit: string;
  description: string;
  statistic: MetricStatistic;
  evaluationPeriod: EvaluationPeriod;
  category: MetricCategory;
  importance: ImportanceLevel;
  threshold: ThresholdConfig;
  applicableWhen?: ResourceConditionFunction;
}

export interface ThresholdConfig {
  base: number;
  warningMultiplier: number;
  criticalMultiplier: number;
}

// 型安全な条件判定関数（CLAUDE.md: Type-Driven）
export type ResourceConditionFunction = (resource: CloudFormationResource) => boolean;

// =============================================================================
// 分析結果型（requirement.mdスキーマ準拠）
// =============================================================================

export interface AnalysisResult {
  metadata: AnalysisMetadata;
  resources: ResourceWithMetrics[];
  unsupported_resources: string[];
}

export interface AnalysisMetadata {
  version: '1.0.0';
  generated_at: TimestampISO;
  template_path: string;
  total_resources: number;
  supported_resources: number;
  processing_time_ms?: number;
  parse_time_ms?: number;
  extract_time_ms?: number;
  generator_time_ms?: number;
  total_time_ms?: number;
  memory_peak_mb?: number;
}

export interface ResourceWithMetrics {
  logical_id: string;
  resource_type: string;
  resource_properties: Record<string, unknown>; // any型ではなくunknown
  metrics: MetricDefinition[];
}

// =============================================================================
// テンプレート解析結果型
// =============================================================================

export interface TemplateAnalysisResult {
  template: import('./cloudformation').CloudFormationTemplate;
  supportedResources: import('./cloudformation').SupportedResource[];
  unsupportedResources: string[];
  totalResources: number;
  extractionTimeMs: number;
}

export interface ExtractResult {
  supported: import('./cloudformation').SupportedResource[];
  unsupported: string[]; // logical IDs
  totalCount: number;
  extractionTimeMs: number;
}

// =============================================================================
// 出力フォーマッタ型
// =============================================================================

export type OutputFormat = 'json' | 'html' | 'yaml';

export interface JSONOutputData {
  metadata: AnalysisMetadata;
  resources: Array<{
    logical_id: string;
    resource_type: string;
    resource_properties: Record<string, unknown>;
    metrics: Array<{
      metric_name: string;
      namespace: string;
      unit: string;
      description: string;
      statistic: MetricStatistic;
      recommended_threshold: {
        warning: number;
        critical: number;
      };
      evaluation_period: number;
      category: MetricCategory;
      importance: ImportanceLevel;
    }>;
  }>;
  unsupported_resources: string[];
}

// =============================================================================
// CLI関連型（型安全性）
// =============================================================================

export interface CLIOptions {
  output: OutputFormat;
  file?: string;
  resourceTypes?: string;
  includeLow?: boolean;
  verbose?: boolean;
  noColor?: boolean;
}

export interface ProcessOptions {
  includeLowImportance: boolean;
  resourceTypes?: string[];
  verbose: boolean;
}

// =============================================================================
// インターフェース分離（CLAUDE.md: Interface Segregation Principle）
// =============================================================================

export interface ITemplateParser {
  parse(filePath: string): Promise<import('./cloudformation').CloudFormationTemplate>;
}

export interface ITemplateAnalyzer {
  analyze(filePath: string): Promise<TemplateAnalysisResult>;
}

export interface IMetricsGenerator {
  getSupportedTypes(): string[];
  generate(resource: CloudFormationResource): Promise<MetricDefinition[]>;
}

export interface IMetricsProcessor {
  process(resources: import('./cloudformation').SupportedResource[], options: ProcessOptions): Promise<ResourceWithMetrics[]>;
}

export interface IJSONFormatter {
  formatJSON(result: AnalysisResult): Promise<string>;
}

export interface IHTMLFormatter {
  formatHTML(result: AnalysisResult): Promise<string>;
}

// 複合インターフェース（必要最小限）
export interface IOutputFormatter extends IJSONFormatter, IHTMLFormatter {
  // 両フォーマッタの統合インターフェース
}

export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, error?: Error, ...args: unknown[]): void;
  success(message: string, ...args: unknown[]): void;
}