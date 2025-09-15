// CLAUDE.md準拠メトリクス型定義（Type-Driven Development、any型完全排除）
import type { CloudFormationResource } from './cloudformation';
import type { 
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


export interface ExtractResult {
  supported: Array<import('./cloudformation').SupportedResource>;
  unsupported: string[]; // logical IDs
  totalCount: number;
  extractionTimeMs: number;
}





// =============================================================================
// インターフェース分離（CLAUDE.md: Interface Segregation Principle）
// =============================================================================

export interface ITemplateParser {
  parse(filePath: string): Promise<import('./cloudformation').CloudFormationTemplate>;
}


export interface IMetricsGenerator {
  getSupportedTypes(): string[];
  generate(resource: CloudFormationResource): Promise<MetricDefinition[]>;
}





